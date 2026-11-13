# Wortmeister

A German spelling and dictation trainer for elementary school children. The app
speaks one word at a time, the child writes it on paper, and the parent reveals
the correct spelling and marks it right or wrong.

All data stays in the browser on the device. There is no account and no server.

## Features

- Practice mode with immediate reveal and feedback
- Exam mode with a review screen at the end
- 25 words per session by default, configurable from 1 to 50
- German text-to-speech via the browser
- Built-in starter list with common 4th-grade spelling words
- Custom word lists, duplication, import and export
- Session history and backup/restore
- German UI, keyboard friendly, responsive for tablet and phone

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, usually <http://localhost:5173>.

## Build

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

## Use

1. Open **Wortlisten** to create a list or duplicate the starter list.
2. Go to **Startseite**, choose a list and start **Übung** or **Prüfung**.
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
- Use **Einstellungen → Backup exportieren** to download a complete backup.
- Use **Einstellungen → Backup importieren** to restore it.
- Word lists can also be imported and exported as JSON on the **Wortlisten** page.

## Deployment

The app is a static site and can be hosted on GitHub Pages, Netlify, or any
static file host. The Vite base path is relative, and routing uses hash URLs, so
no server-side rewrite rules are needed.

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
