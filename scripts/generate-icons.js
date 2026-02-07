const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Color definitions
const SAGE_GREEN = { r: 0x6B, g: 0x8F, b: 0x71 };
const WHITE = { r: 0xFF, g: 0xFF, b: 0xFF };

// ── PNG encoding helpers ──

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const combined = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([length, combined, crc]);
}

function createPNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width, height, bit depth 8, color type 6 (RGBA)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw scanlines: each row = filter byte (0) + RGBA pixels
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4;
      const offset = rowOffset + 1 + x * 4;
      rawData[offset]     = pixels[pi];     // R
      rawData[offset + 1] = pixels[pi + 1]; // G
      rawData[offset + 2] = pixels[pi + 2]; // B
      rawData[offset + 3] = pixels[pi + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ── Drawing helpers ──

function setPixel(pixels, w, x, y, r, g, b, a) {
  if (x < 0 || x >= w || y < 0 || y >= w) return;
  const i = (y * w + x) * 4;
  // Alpha blending
  const srcA = a / 255;
  const dstA = pixels[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[i]     = Math.round((r * srcA + pixels[i]     * dstA * (1 - srcA)) / outA);
  pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
  pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
  pixels[i + 3] = Math.round(outA * 255);
}

function fillCircle(pixels, size, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        // Full inside
        setPixel(pixels, size, x, y, color.r, color.g, color.b, 255);
      } else if (dist2 <= (radius + 1) * (radius + 1)) {
        // Anti-alias edge: smooth falloff
        const dist = Math.sqrt(dist2);
        const alpha = Math.max(0, Math.min(255, Math.round((radius + 0.7 - dist) * 255)));
        if (alpha > 0) {
          setPixel(pixels, size, x, y, color.r, color.g, color.b, alpha);
        }
      }
    }
  }
}

function drawThickLine(pixels, size, x0, y0, x1, y1, thickness, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const steps = Math.ceil(len * 2);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    // Fill circle at each point for thickness
    const r = thickness / 2;
    for (let py = Math.floor(cy - r - 1); py <= Math.ceil(cy + r + 1); py++) {
      for (let px = Math.floor(cx - r - 1); px <= Math.ceil(cx + r + 1); px++) {
        const ddx = px + 0.5 - cx;
        const ddy = py + 0.5 - cy;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist <= r) {
          setPixel(pixels, size, px, py, color.r, color.g, color.b, 255);
        } else if (dist <= r + 0.7) {
          const alpha = Math.max(0, Math.round((r + 0.7 - dist) / 0.7 * 255));
          setPixel(pixels, size, px, py, color.r, color.g, color.b, alpha);
        }
      }
    }
  }
}

function drawArc(pixels, size, cx, cy, radius, startAngle, endAngle, thickness, color) {
  const arcLen = Math.abs(endAngle - startAngle) * radius;
  const steps = Math.max(Math.ceil(arcLen * 3), 20);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    const r = thickness / 2;
    for (let iy = Math.floor(py - r - 1); iy <= Math.ceil(py + r + 1); iy++) {
      for (let ix = Math.floor(px - r - 1); ix <= Math.ceil(px + r + 1); ix++) {
        const ddx = ix + 0.5 - px;
        const ddy = iy + 0.5 - py;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist <= r) {
          setPixel(pixels, size, ix, iy, color.r, color.g, color.b, 255);
        } else if (dist <= r + 0.7) {
          const alpha = Math.max(0, Math.round((r + 0.7 - dist) / 0.7 * 255));
          setPixel(pixels, size, ix, iy, color.r, color.g, color.b, alpha);
        }
      }
    }
  }
}

// Draw an "S" shape using two arcs (like two half-circles stacked)
function drawLetterS(pixels, size, color) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 128; // scale relative to 128px
  const thickness = Math.max(2, Math.round(8 * scale));
  
  // The "S" is composed of:
  // - Top arc: curves from right to left across the top
  // - Bottom arc: curves from left to right across the bottom
  
  const arcRadius = size * 0.16;
  const topCy = cy - arcRadius * 0.85;
  const botCy = cy + arcRadius * 0.85;
  
  // Top arc: center slightly above middle, opens to the right
  // Goes from roughly -90deg (top) clockwise to roughly 180deg (left)
  drawArc(pixels, size, cx, topCy, arcRadius, 
    -Math.PI * 0.9, Math.PI * 0.55, thickness, color);
  
  // Bottom arc: center slightly below middle, opens to the left  
  // Goes from roughly 0deg (right) clockwise to roughly 270deg (bottom)
  drawArc(pixels, size, cx, botCy, arcRadius,
    Math.PI * 0.05, Math.PI * 1.45, thickness, color);
}

// ── Generate icons ──

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 4, 0); // transparent
  
  const center = size / 2;
  const radius = size / 2 - 0.5;
  
  // Draw green circle background
  fillCircle(pixels, size, center, center, radius, SAGE_GREEN);
  
  // Draw white "S" letter
  drawLetterS(pixels, size, WHITE);
  
  return createPNG(size, size, pixels);
}

// Output directory
const outDir = path.join(__dirname, '..', 'public', 'icons');

const sizes = [16, 48, 128];
for (const size of sizes) {
  const png = generateIcon(size);
  const filePath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created ${filePath} (${png.length} bytes)`);
}

console.log('Done! All icons generated.');
