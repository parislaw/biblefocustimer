#!/usr/bin/env node

/**
 * generate-sounds.js
 *
 * Generates two small WAV audio files using ONLY Node.js built-in modules:
 *   - public/sounds/focus-complete.wav  (two-tone ascending chime)
 *   - public/sounds/break-complete.wav  (three-tone descending chime)
 *
 * Audio specs: 44100 Hz sample rate, 16-bit mono PCM.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Audio constants
// ---------------------------------------------------------------------------
const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;
const MAX_AMPLITUDE = 0.4; // keep it calm and moderate

// ---------------------------------------------------------------------------
// Envelope — smooth "bell-like" shape:
//   quick attack  (first ~2 %)
//   brief sustain
//   gentle cosine decay (last ~65 % of the note)
// ---------------------------------------------------------------------------
function envelope(sampleIndex, totalSamples) {
  const t = sampleIndex / totalSamples; // 0 … 1

  const attackEnd = 0.02;   // first 2 %
  const decayStart = 0.35;  // decay begins at 35 %

  if (t < attackEnd) {
    // Quick smooth attack (sine ease-in)
    return Math.sin((t / attackEnd) * (Math.PI / 2));
  }
  if (t < decayStart) {
    // Sustain at full level
    return 1.0;
  }
  // Gentle cosine decay to zero
  const decayProgress = (t - decayStart) / (1.0 - decayStart);
  return 0.5 * (1.0 + Math.cos(Math.PI * decayProgress)); // 1 -> 0 smoothly
}

// ---------------------------------------------------------------------------
// Generate samples for a single sine-wave note
// ---------------------------------------------------------------------------
function generateNote(frequency, durationMs) {
  const totalSamples = Math.round(SAMPLE_RATE * (durationMs / 1000));
  const samples = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / SAMPLE_RATE;
    const raw = Math.sin(2 * Math.PI * frequency * time);
    samples[i] = raw * envelope(i, totalSamples) * MAX_AMPLITUDE;
  }

  return samples;
}

// ---------------------------------------------------------------------------
// Concatenate Float64Array segments with a tiny 5 ms silent gap between notes
// ---------------------------------------------------------------------------
function concatenateNotes(noteArrays) {
  const gapSamples = Math.round(SAMPLE_RATE * 0.005); // 5 ms gap
  let totalLength = 0;
  for (const n of noteArrays) totalLength += n.length;
  totalLength += gapSamples * (noteArrays.length - 1);

  const combined = new Float64Array(totalLength);
  let offset = 0;
  for (let idx = 0; idx < noteArrays.length; idx++) {
    combined.set(noteArrays[idx], offset);
    offset += noteArrays[idx].length;
    if (idx < noteArrays.length - 1) {
      offset += gapSamples; // gap is already zero-filled
    }
  }
  return combined;
}

// ---------------------------------------------------------------------------
// Encode Float64 samples (-1 … +1) into a 16-bit PCM WAV file buffer
// ---------------------------------------------------------------------------
function encodeWav(samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buf = Buffer.alloc(fileSize);

  // ---- RIFF header ----
  buf.write('RIFF', 0);
  buf.writeUInt32LE(fileSize - 8, 4);
  buf.write('WAVE', 8);

  // ---- fmt sub-chunk ----
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);              // sub-chunk size (PCM = 16)
  buf.writeUInt16LE(1, 20);               // audio format (1 = PCM)
  buf.writeUInt16LE(NUM_CHANNELS, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // ---- data sub-chunk ----
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  // ---- PCM sample data ----
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const intVal = Math.round(clamped * 32767);
    buf.writeInt16LE(intVal, headerSize + i * 2);
  }

  return buf;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
  fs.mkdirSync(soundsDir, { recursive: true });

  // --- Focus-complete: two-tone ascending chime (C5 -> E5) ---
  const focusNotes = [
    generateNote(523, 200),  // C5  200 ms
    generateNote(659, 300),  // E5  300 ms
  ];
  const focusSamples = concatenateNotes(focusNotes);
  const focusWav = encodeWav(focusSamples);
  const focusPath = path.join(soundsDir, 'focus-complete.wav');
  fs.writeFileSync(focusPath, focusWav);
  console.log('Created ' + focusPath + '  (' + focusWav.length + ' bytes)');

  // --- Break-complete: three-tone descending chime (G5 -> E5 -> C5) ---
  const breakNotes = [
    generateNote(784, 150),  // G5  150 ms
    generateNote(659, 150),  // E5  150 ms
    generateNote(523, 250),  // C5  250 ms
  ];
  const breakSamples = concatenateNotes(breakNotes);
  const breakWav = encodeWav(breakSamples);
  const breakPath = path.join(soundsDir, 'break-complete.wav');
  fs.writeFileSync(breakPath, breakWav);
  console.log('Created ' + breakPath + '  (' + breakWav.length + ' bytes)');
}

main();
