# Chrome Web Store Submission Guide

**Version:** 1.0.0
**Developer:** Paris
**Support Email:** selahfocusapp@parislaw.net
**Last Updated:** February 2026

---

## Store Listing Copy

### Item Name
```
Selah Focus
```

### Short Description (63 / 132 chars)
```
Focus deeply with Pomodoro timers and 55 curated Bible verses. No tracking. All data stays local.
```

### Detailed Description
```
Selah Focus combines the science-backed Pomodoro Technique with curated Bible passages to help you maintain focus, honor rest, and deepen your spiritual practice throughout the workday.

KEY FEATURES

🎯 Timer That Keeps Running
- Focus sessions survive popup close — the timer runs in the background
- Customizable focus sessions (default 25 min)
- Short breaks (5 min) and long breaks (15 min)
- Configurable cycles before a long break (default every 4 sessions)
- Auto-advance between cycles

📖 Scripture Integration
- 55 curated Bible verses organized by theme
- Verse displayed for 10 seconds before each focus session
- Break-time reflection prompts for deeper meditation
- Multiple translations: ESV, NIV, KJV
- Theme-based filtering: Peace, Gratitude, Strength, Purpose, Trust, Growth

⚙️ Personalization
- Adjust all timer durations to your preference
- Enable or disable Scripture display
- Choose your preferred Bible translation and verse theme
- Settings stored locally on your device

🔔 Notifications
- Desktop notification when focus or break sessions complete (optional: keep until dismissed)
- Optional completion sound when a session ends
- Extension badge shows active focus status

♿ Accessibility
- Full keyboard navigation (Space, R, S, Enter)
- Screen reader support (WCAG 2.1 AA)
- Announcements at meaningful milestones, not every second

🔐 Privacy First
- Zero tracking or analytics
- No personal data collected
- No external servers or APIs — ever
- All data stored locally on your device

IDEAL FOR
- Christians wanting to integrate faith with productivity
- Anyone using the Pomodoro Technique
- Students, writers, developers, and remote workers
- Those seeking a calmer, faith-grounded approach to deep work

KEYBOARD SHORTCUTS
- Space: Pause / Resume
- Enter: Start Focus Session
- R: Reset timer
- S: Skip break
- Alt+S: Open Settings
- Escape: Close Settings

Made with care for focused, faith-centered work.
```

### Category
```
Productivity
```

### Language
```
English
```

---

## URLs

| Field | Value |
|-------|-------|
| Website | `https://parislaw.github.io/biblefocustimer/` |
| Support Email | `selahfocusapp@parislaw.net` |
| Privacy Policy | `https://parislaw.github.io/biblefocustimer/privacy.html` |

---

## Permissions Justification

When prompted in the Developer Console to justify permissions:

**storage**
> Used to save your timer preferences (durations, translation, theme, auto-start) and active timer state locally on your device. No data is transmitted externally.

**notifications**
> Used to display a desktop notification when your focus session or break session completes. Notifications are only shown at session end and contain no personal data.

**alarms**
> Used to keep the timer countdown running accurately in the background when the extension popup is closed. Without this, the timer would stop the moment you clicked away.

**offscreen**
> Used only to play the completion sound when a focus or break session ends. The sound is played from files stored in the extension. No data is sent.

Completion sound and "keep notification until dismissed" are user-controllable in Settings (Timer tab).

---

## Privacy Practices (Developer Console questions)

Answer these in the Privacy tab of the Developer Console:

| Question | Answer |
|----------|--------|
| Does your extension collect any user data? | No |
| Does your extension use any data for purposes other than the extension's core functionality? | No |
| Does your extension transfer any user data to third parties? | No |

---

## Screenshots Needed

Create **3–5 screenshots at 1280×800px** (PNG or JPEG). Load the built extension in Chrome at that viewport size and capture each view.

| # | View to capture | Suggested caption |
|---|----------------|-------------------|
| 1 | Idle view — timer at rest, cycle dots, Start Focus button | "Begin each session anchored in Scripture" |
| 2 | Pre-focus verse view — verse card with reflection prompt | "A moment of Scripture before every focus session" |
| 3 | Active focus countdown — timer running, progress dots | "Stay in the zone with a clean, distraction-free timer" |
| 4 | Break view — verse card during break | "Let Scripture guide your rest" |
| 5 | Settings view — all customization options visible | "Personalize your focus rhythm" |

### How to capture at 1280×800
1. Run `npm run build`
2. Go to `chrome://extensions/` → Load unpacked → select `dist/`
3. Open DevTools on the popup (`right-click extension icon → Inspect popup`)
4. Set DevTools viewport to 1280×800
5. Screenshot each view

---

## Submission Steps

### 1. Build the extension
```bash
npm run build
cd dist && zip -r ../selah-focus-1.0.0.zip . && cd ..
```

### 2. Verify before upload
```bash
npm test          # must show 13 passed
npm run build     # must show "compiled successfully"
```

### 3. Developer Console
1. Go to [Chrome Web Store Developer Console](https://chrome.webstore.google.com/u/0/developer/dashboard)
2. Pay $5 one-time registration fee (if not already done)
3. Click **"New item"**
4. Upload `selah-focus-1.0.0.zip`

### 4. Fill in the listing
- Copy text from **Store Listing Copy** section above
- Upload screenshots
- Set Category → Productivity
- Enter Privacy Policy URL
- Fill in permissions justifications
- Answer Privacy Practices questions (all "No")

### 5. Submit
- Preview listing, verify icon looks correct
- Click **Submit for Review**
- Expected review time: **1–3 business days** (minimal permissions)

---

## Pre-Submission Checklist

### Code & Build
- [x] All 13 tests passing
- [x] Build succeeds without warnings
- [x] Timer survives popup close (chrome.alarms)
- [x] No console errors in production build

### Manifest
- [x] manifest_version: 3
- [x] short_name, minimum_chrome_version: "116"
- [x] Only essential permissions: storage, notifications, alarms
- [x] Strict CSP (script-src 'self', no unsafe-eval)
- [x] Icons at 16, 48, 128px

### Accessibility
- [x] WCAG 2.1 AA contrast ratios
- [x] Keyboard navigation (Space, R, S, Enter, Escape)
- [x] Screen reader milestone announcements
- [x] focus-visible indicators for keyboard users
- [x] Error boundary prevents blank popup

### Privacy & Legal
- [x] Privacy policy published: https://parislaw.github.io/biblefocustimer/privacy.html
- [x] Developer contact in privacy policy: Paris / selahfocusapp@parislaw.net
- [x] Verse sources correctly attributed (ESV, NIV, KJV)
- [x] No NKJV/NASB (copyrighted) text included
- [x] No tracking, analytics, or external API calls

### Store Listing
- [x] Short description under 132 chars ✓ (97 chars)
- [x] Long description accurate and complete
- [ ] Screenshots created (3–5 at 1280×800) ← **still needed**
- [ ] Developer Console account created
- [ ] Extension zip built and ready to upload

---

## Post-Submission

Once approved (you'll get an email):
- Replace `EXTENSION_ID` placeholder in README.md badges with the real ID
- Update the Chrome Web Store URL in README.md
- Monitor the Reviews tab in Developer Console
- Reply to user reviews within a few days

---

*Status: Ready to submit once screenshots are added.*
