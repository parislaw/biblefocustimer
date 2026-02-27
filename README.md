# 🙏 Selah Focus

**A Pomodoro timer with Scripture-based focus rhythms**

> Focus deeply, anchored in the Word

Selah Focus combines the science-backed Pomodoro Technique with curated Bible passages to help you maintain focus, honor rest, and deepen your spiritual practice.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/EXTENSION_ID?color=4285F4&label=Chrome%20Web%20Store)](https://chrome.webstore.google.com/detail/selah-focus)
[![Tests](https://img.shields.io/badge/tests-13%2F13%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ✨ Features

### 🎯 Smart Timer System
- **Customizable focus sessions** (default: 25 minutes)
- **Short breaks** (default: 5 minutes) to recharge
- **Long breaks** (default: 15 minutes) every 4 cycles for deeper rest
- **Auto-advance** option to automatically move through focus/break cycles
- **Visual progress** with cycle indicator dots

### 📖 Scripture Integration
- **55 curated Bible verses** selected for focus and reflection
- **Pre-focus display** — read a verse before your focus session begins
- **Break reflections** — thoughtful prompts to meditate on during breaks
- **Theme filtering** — verses organized by theme (Peace, Gratitude, Strength, Purpose, Trust, Growth)
- **Multiple translations** — choose between ESV, NIV, and KJV

### ⚙️ Personalization
- Adjust all timer durations to your preference
- Enable/disable Scripture display
- Choose your preferred Bible translation
- Select verse themes that resonate with you
- Settings sync across all your Chrome devices

### 🔔 Smart Notifications
- Desktop notifications when focus and break sessions complete
- Focus indicator badge on the extension icon
- Automatic badge clearing when you open the extension

### ♿ Accessibility
- Full keyboard navigation support
- Screen reader friendly with ARIA labels and live regions
- High contrast mode compatible
- Semantic HTML structure
- WCAG 2.1 AA compliant

## 🚀 Installation

### From Chrome Web Store
1. Visit [Selah Focus on Chrome Web Store](https://chrome.webstore.google.com/detail/selah-focus)
2. Click **"Add to Chrome"**
3. Click **"Install Extension"**

### For Development

**Prerequisites:** Node.js 16+

```bash
# Clone the repository
git clone https://github.com/parislaw/biblefocustimer.git
cd biblefocustimer

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode" (top-right toggle)
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

## 📖 How to Use

### Starting a Focus Session
1. Click the Selah Focus icon in your Chrome toolbar
2. Click **"Start Focus"**
3. If Scripture is enabled, you'll see a verse for 10 seconds
4. Your 25-minute focus session begins—stay focused! 💪

### During Focus
- **Pause** if you need a break
- **Resume** to continue
- **Reset** to start over
- See your **progress** with the cycle indicator dots

### Break Time
- Use the break time to rest and reflect
- Read the Scripture and reflection prompt (if enabled)
- **Skip** the break if you're ready to continue
- The break timer auto-starts the next focus if enabled

### Customizing Settings
1. Open Selah Focus
2. Click the **⚙️ Settings** icon
3. Adjust:
   - Focus, short break, and long break durations
   - How many cycles before a long break
   - Bible translation and verse theme
   - Whether to auto-advance between sessions
   - Whether to display Scripture
4. Settings are saved automatically and sync across your Chrome devices

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Pause/Resume timer |
| `R` | Reset timer |
| `S` | Skip break |

## 🤔 Why Pomodoro + Scripture?

### The Pomodoro Technique
Research shows that timed focus sessions improve productivity while preventing burnout. Taking regular breaks helps maintain focus and prevents fatigue.

### Scripture Integration
For Christians, pairing focused work with Scripture creates a spiritual rhythm:
- **Pre-focus Scripture** — Settle your mind and align your work with faith
- **Break reflections** — Pause to remember what matters most
- **Cycle rhythm** — Longer breaks remind you that rest is essential

Selah Focus helps you work excellently while staying spiritually grounded.

## 🔐 Privacy & Permissions

**We take privacy seriously.** Selah Focus:
- ✅ **No tracking or analytics**
- ✅ **No personal data collection**
- ✅ **All data stored locally on your device**
- ✅ **Only uses Chrome storage API** for syncing preferences
- ✅ **No external servers or APIs**

### Permissions
| Permission | Purpose |
|-----------|---------|
| `storage` | To save and sync your timer settings and Scripture preferences |
| `notifications` | To show desktop notifications when your focus and break sessions complete |

See our [full Privacy Policy](https://parislaw.github.io/biblefocustimer/privacy.html) for details.

## 📚 Verse Sources

Our Scripture collection includes passages from:
- **English Standard Version (ESV)** — © Crossway. Used within the ESV's non-commercial quotation license (fewer than 1,000 verses).
- **New International Version (NIV)** — © Biblica. Used within the NIV's non-commercial quotation license (fewer than 500 verses).
- **King James Version (KJV)** — public domain.

All verses are used in accordance with their respective publisher licenses.

## 🛠️ Development

### Architecture

```
src/
├── popup/                    # React UI (extension popup)
│   ├── components/           # View components
│   │   ├── IdleView.jsx      # Initial state
│   │   ├── PreFocusView.jsx  # Scripture preview
│   │   ├── FocusView.jsx     # Focus session countdown
│   │   ├── BreakView.jsx     # Break session
│   │   └── SettingsView.jsx  # Preferences
│   ├── App.jsx               # Router/state management
│   ├── useTimer.js           # Timer hook
│   ├── useVerse.js           # Scripture selection hook
│   ├── useStorage.js         # Settings sync hook
│   └── styles.css            # Component styles
├── background/
│   └── service-worker.js     # Notifications & badge
├── data/
│   ├── verses.js             # 55 curated Bible passages
│   └── reflections.js        # Reflection prompts
└── index.html                # Popup HTML
```

### Key Technologies
- **Frontend:** React 18 with Hooks
- **Storage:** Chrome Storage API + localStorage fallback
- **Build:** Webpack 5 with Babel transpilation
- **Testing:** Jest + React Testing Library
- **Security:** Strict Content Security Policy

### Scripts

```bash
npm run dev       # Watch mode (auto-rebuild on changes)
npm run build     # Production build (189 KiB)
npm run test      # Run test suite (13 tests, all passing)
npm run clean     # Remove build artifacts
```

## ✅ Quality Assurance

- **13/13 tests passing** — full test coverage for core logic
- **WCAG 2.1 AA accessibility** — compliant with accessibility standards
- **Security hardened** — strict CSP, message validation, minimal permissions
- **Performance optimized** — 189 KiB bundle size

## 🐛 Troubleshooting

### Timer not appearing
- Refresh the page
- Disable and re-enable the extension
- Clear extension data: Settings → Clear browsing data → Extensions

### Settings not syncing
- Sign into your Chrome account (`⋮` menu → "Sign in to Chrome")
- Check Chrome Settings → Sync and personalization → Sync is on

### Notifications not showing
- Check Chrome Notifications settings
- Ensure Selah Focus has notification permission

### Scripture not displaying
- Check Settings — ensure "Enable Scripture" is toggled on
- Try a different Bible translation

## 🤝 Contributing

Contributions are welcome! Please:
1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and add tests
4. **Commit** with a clear message
5. **Push** to your fork
6. **Open a Pull Request** with a description

## 📋 Roadmap

### Platforms
- [ ] **Standalone web app** — Use Selah Focus in any browser; same features, no extension install. (See [web-app](https://github.com/parislaw/biblefocustimer/tree/web-app) branch.)
- [ ] **Native iOS app** — Native mobile experience; on the roadmap.
- [ ] **Android app** — Native Android experience; on the roadmap.

See [docs/ROADMAP.md](docs/ROADMAP.md) for phases and mobile considerations.

### Planned Features
- [ ] Statistics dashboard (sessions completed, focus time)
- [ ] Dark mode and additional themes
- [ ] Multiple languages

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

**Bible verses** are used in accordance with their respective copyright licenses.

## 📞 Support

- 💬 **Have a question?** [Open a discussion](https://github.com/parislaw/biblefocustimer/discussions)
- 🐛 **Found a bug?** [Report an issue](https://github.com/parislaw/biblefocustimer/issues)
- 💡 **Have an idea?** [Request a feature](https://github.com/parislaw/biblefocustimer/issues)

---

**Made with ❤️ for focused, faith-centered work**

**Latest Version:** 1.0.0 | **Updated:** February 2026
