# WordMaster — Project Plan

**Status:** Implemented (v0.1.0)  
**Last updated:** 2026-11-13  
**Repository:** https://github.com/kdhavalv/WordMaster  
**Local path:** `D:\projects\WordMaster`

A German spelling/dictation trainer for a 4th-grade student in Germany. A parent
starts a session, the app speaks one word at a time, the child writes on paper,
and the parent reveals the answer and marks it correct or incorrect.

---

## 1. Confirmed Decisions

| Topic | Decision |
|---|---|
| Answer method | Write on paper; parent reveals and marks right/wrong |
| Word source | Saved word lists plus a built-in starter list |
| Audio | Browser text-to-speech, German voice (`de-DE`) |
| Tech stack | Vite + React + TypeScript |
| UI language | German |
| Data storage | Browser `localStorage` only; no backend or accounts |
| Session size | Default 25 words, configurable |
| Word order | Shuffled by default |

Everything runs locally. No internet is required after the app has loaded
(assuming a German voice is installed in the browser/OS).

---

## 2. User Flows

### 2.1 Start page (Startseite)

- Select a word list.
- Select number of words (default: 25).
- Start **Übung** or **Prüfung**.
- View recent results (last ~10).
- Navigate to **Wortlisten** and **Einstellungen**.

### 2.2 Übung (practice)

1. Show `Wort 3 von 25` and a large **Wort anhören** button.
2. The word text stays hidden.
3. Child writes the word on paper.
4. **Nochmal hören** is always available.
5. Parent taps **Antwort zeigen**; the correct spelling appears.
6. Parent taps **Richtig** or **Falsch**.
7. Move to the next word.
8. At the end: score, list of wrong words, and **Falsche Wörter üben**
   (starts a new practice containing only the missed words).

### 2.3 Prüfung (exam)

1. 25 words are played one at a time. Only audio and progress are shown.
2. Parent taps **Weiter** after each word. Answers are not revealed.
3. After the last word, a review screen lists every word with its correct
   spelling.
4. Parent marks each row **Richtig** or **Falsch**. Keyboard shortcuts are
   supported.
5. Final screen shows score, wrong words, **Fehler üben**, and **Neue Prüfung**.
6. The result is saved to history.

**Assumption:** in exam mode answers are revealed only during final review, like
a real dictation. This can be changed to per-word reveal if preferred.

### 2.4 Wortlisten (word lists)

- Built-in read-only list: **Grundwortschatz Klasse 4 (Beispiel)**.
  - Over 100 common German words with tricky spellings:
    Dehnungs-h, double consonants, ä/äu, s/ss/ß, v/f, final d/t.
  - Can be duplicated and edited.
- Create, edit, delete, and duplicate named lists.
- Paste words with one word per line.
- Empty lines and duplicates are removed automatically.
- JSON import/export for backup and moving between devices.
- Words are never displayed during a session before **Antwort zeigen**, except
  during the exam review screen.

### 2.5 Einstellungen (settings)

- German voice selection (`de-DE`, `de-AT`, `de-CH`).
- Speech rate.
- Auto-play the next word.
- Default word count.
- Default shuffle behavior.
- Backup/restore and reset local data.
- Warning when no German voice is available.

---

## 3. Functional Requirements

- Sessions always select up to the requested number of words.
- If a list contains fewer words than requested, use all available words.
- No timer or scoring pressure.
- Large touch targets and readable typography for tablet/phone use.
- Visible focus states and keyboard support.
- Audio must never reveal the word text visually.
- If text-to-speech is unavailable, the reveal and mark flow still works.
- Results and settings persist after reloading the page.
- Interface text is German.

---

## 4. Technical Design

### 4.1 Stack

- Vite `react-ts` template.
- React with TypeScript.
- `react-router-dom` using `HashRouter` (safe for GitHub Pages).
- React Context + `useReducer` for app state.
- Plain CSS with CSS variables; no UI library.
- Inline SVG icons; no external assets.
- Optional Vitest for pure logic tests.

### 4.2 Speech

- `useSpeech` hook using `SpeechSynthesisUtterance`.
- `lang = 'de-DE'`.
- Wait for the `voiceschanged` event when voices load asynchronously.
- Select voice via `voiceURI` from settings.
- Cancel speech on navigation or unmount.
- Provide clear fallback messaging if German TTS is unavailable.

### 4.3 Word selection

- Parse input: trim lines, remove empty entries, remove duplicates.
- Shuffle with Fisher–Yates.
- Sample up to `N` words.
- Preserve the original list order when shuffle is disabled.

### 4.4 Persistence

Storage keys:

- `wordmaster.lists.v1`
- `wordmaster.results.v1`
- `wordmaster.settings.v1`

No secrets are stored. React escapes all user-entered words.

### 4.5 Data model

```ts
type WordList = {
  id: string;
  name: string;
  words: string[];
  createdAt: string;
  updatedAt: string;
};

type SessionMode = 'practice' | 'exam';

type SessionResult = {
  id: string;
  listId: string;
  listName: string;
  mode: SessionMode;
  date: string;
  total: number;
  correct: number;
  wrongWords: string[];
};

type Settings = {
  voiceURI?: string;
  rate: number;
  autoPlay: boolean;
  defaultWordCount: number;
  shuffle: boolean;
};
```

Runtime session state (not persisted during a session):

```ts
type ActiveSession = {
  words: string[];
  index: number;
  marks: Record<number, boolean>;
};
```

---

## 5. Project Structure

```text
WordMaster/
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  plan.md
  src/
    main.tsx
    App.tsx
    styles.css
    types.ts
    data/
      starterWords.ts
    lib/
      backup.ts
      files.ts
      session.ts
      storage.ts
      utils.ts
      words.ts
    hooks/
      useSpeech.ts
    state/
      AppState.tsx
      appContext.ts
      appReducer.ts
    components/
      Layout.tsx
      AudioButton.tsx
      ProgressBar.tsx
    pages/
      HomePage.tsx
      SessionPage.tsx
      ListsPage.tsx
      ListEditorPage.tsx
      SettingsPage.tsx
  .github/
    workflows/
      deploy.yml        # GitHub Pages deployment
```

`vite.config.ts` uses a relative base (`base: './'`), so the built site works
from GitHub Pages or any subfolder. Routing uses hash URLs.

---

## 6. Implementation Checklist

- [x] Scaffold Vite + React + TypeScript and clean the template.
- [x] Configure routing (HashRouter) and deployment base path.
- [x] Add types, starter word list, storage helpers, and pure logic modules.
- [x] Build the app shell, German navigation, and responsive styles.
- [x] Build word-list management: CRUD, paste input, starter copy, import/export.
- [x] Add the speech hook, audio button, and settings page.
- [x] Implement practice flow: audio → reveal → mark → summary → retry wrong.
- [x] Implement exam flow: audio → next → review marking → summary → history.
- [x] Add recent results to the start page.
- [x] Polish accessibility, empty states, and error states.
- [x] Add GitHub Pages workflow.
- [x] Run the production build and lint.
- [ ] Complete the manual smoke test on the target tablet/computer.

---

## 7. Verification

### Commands

```bash
npm run dev
npm run build
npm run preview
```

### Manual smoke test

- [ ] Create, edit, and delete a word list.
- [ ] Duplicate the starter list and edit the copy.
- [ ] Import and export a list as JSON.
- [ ] Start a 25-word practice session.
- [ ] Confirm the word text is hidden until **Antwort zeigen**.
- [ ] Replay the audio and change speech rate/voice in settings.
- [ ] Reveal and mark words right/wrong.
- [ ] Finish the session and retry the wrong words.
- [ ] Start an exam and complete the final review.
- [ ] Confirm the result is saved and appears on the start page.
- [ ] Reload the page and confirm lists, settings, and results persist.
- [ ] Test the no-German-voice warning.
- [ ] Test layout at phone, tablet, and desktop sizes.

### Optional automated tests

- Word input parsing and deduplication.
- Shuffle and sampling behavior.
- Session summary and result creation.

---

## 8. Future Enhancements (Not in v1)

- Typing mode with automatic spelling checks.
- Per-word weak-word statistics across sessions.
- Installable offline PWA.
- Example sentences for words with ambiguous spellings.
- Rewards, streaks, or a points system.
- Printable word lists and result reports.

---

## 9. Open Questions / Assumptions

1. Exam answers are revealed only during the final review. Should this instead
   be per-word reveal?
2. Is the built-in starter list sufficient, or should its contents be supplied
   by the parent?
3. Should the app later support automatic checking via typing as an optional
   mode?

---

## 10. Notes for Future Modification

- Keep all German UI strings together so translations or wording changes are
  easy to make.
- Keep word-selection and scoring logic in `src/lib/` so it can be tested
  independently of React.
- Bump the storage key version (`v1` → `v2`) when the data model changes in a
  backward-incompatible way.
- Because the app is static, it can be hosted on GitHub Pages, any static host,
  or run locally.
