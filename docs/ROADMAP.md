# Selah Focus — Product Roadmap

## Phase 1 — Standalone Web App

**Goal:** Use Selah Focus in any browser without installing the Chrome extension.

- **Status:** In progress (see `web-app` branch.)
- **Scope:** Same UX as the extension: timer, Scripture, custom verses, completion sound, notifications.
- **Tech:** Shared React UI with a platform abstraction; web build uses localStorage, in-page timer, Web Notifications API, and in-page audio. Timer runs while the tab is open; optional future: Service Worker for background countdown.
- **Build:** `npm run build:web` produces `dist-web/` for deployment (e.g. GitHub Pages, Vercel).

## Phase 2 — Native Mobile (Later)

**Goal:** Native iOS and Android apps for on-the-go focus sessions.

- **Considerations:**
  - Shared logic: e.g. React Native, or Kotlin/Swift with a shared core (timer, settings, verse data).
  - Push notifications for session completion when the app is in the background.
  - Offline-first: settings and verses stored locally.
  - App store distribution and compliance (privacy, permissions).

This phase is intentionally high-level; implementation details will be refined when prioritised.
