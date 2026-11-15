# Wortmeister

A German spelling and dictation trainer for elementary school children. The app
speaks one word at a time, the child writes it on paper, and the parent reveals
the correct spelling and marks it right or wrong.

All data stays in the browser on the device. There is no account and no server.
The interface is available in German and English; the learning words stay German.

## Features

- Practice mode with immediate reveal and feedback
- Exam mode with a review screen at the end
- 25 words per session by default, configurable from 1 to 50
- German text-to-speech via the browser
- Built-in starter list with common 4th-grade spelling words
- Custom word lists, duplication, import and export
- Session history and backup/restore
- German/English interface with a saved language preference
- Keyboard friendly and responsive for Android phones and tablets
- WCAG 2.2 AA-oriented focus states, labels, touch targets, and reduced-motion support
- Optional installable PWA with an offline app shell and update notice

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, usually <http://localhost:5173>.

## Build and test

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
npm run preview
```

The production files are written to `dist/`. Unit/component tests run with
Vitest, jsdom, and axe-core. Playwright runs browser flows using the installed
Chrome channel; install Chrome if it is not already available.

## Use

1. Open **Wortlisten** (Word lists) to create a list or duplicate the starter list.
2. Go to **Startseite** (Home), choose a list and start **Übung** (Practice) or
   **Prüfung** (Exam).
3. The word is read aloud. Use **Wort anhören** or the space bar to repeat it.
4. The child writes on paper.
5. In practice mode, reveal the answer after each word and mark it.
   In exam mode, mark all words in the review screen at the end.
6. Review the result and practice the missed words again.

## Speech

Wortmeister uses the Web Speech API. For good German pronunciation, make sure a
German voice is installed in the operating system and available in the browser.
If no German voice is found, the app shows a warning. The reveal and marking
flow still works without speech.

## Data and backup

- Lists, results and settings are stored in `localStorage`.
- If the browser cannot write to storage, the app shows a dismissible warning
  instead of claiming that data was saved.
- Use **Einstellungen → Backup exportieren** to download a complete backup.
- Use **Einstellungen → Backup importieren** to restore it.
- Word lists can also be imported and exported as JSON on the **Wortlisten** page.

## PWA and Android

The production build includes a web app manifest and service worker. When served
over HTTPS (or localhost), supported browsers can install Wortmeister and open it
offline after the first successful load. A new version shows an in-app update
prompt.

An Android-only Capacitor APK is planned for v0.3. It will be side-loaded on a
personal phone/tablet; there is no iOS build and no app-store release.

## Browser limitations

- Speech depends on voices installed in the operating system/browser. The first
  spoken word may require a direct tap on the audio button on Android.
- If no German voice is available, listening is unavailable but reveal/marking
  still works.
- File import/export behavior varies in restricted in-app browsers; open the app
  in Chrome for the full flow.

## Deployment

The app is a static site and can be hosted on GitHub Pages, Netlify, or any
static file host. The Vite base path is relative, and routing uses hash URLs, so
no server-side rewrite rules are needed. Service workers require HTTPS;
localhost is also accepted for local testing.

A GitHub Pages workflow is included at `.github/workflows/deploy.yml`. To use it:

1. Push the repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Push to the `main` branch or run the workflow manually.

## Tech stack

- Vite
- React
- TypeScript
- React Router
- Plain CSS

See `plan.md` for the original project plan and future enhancement ideas.
