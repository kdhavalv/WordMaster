# WordMaster — Project Plan

**Status:** v0.1.0 shipped; v0.2.0 implementation in progress<br>
**Last updated:** 2026-11-15<br>
**Repository:** https://github.com/kdhavalv/WordMaster<br>
**Local path:** `D:\projects\WordMaster`<br>
**Next version:** v0.2.0 — bilingual, accessible, mobile-ready

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
| UI language | German in v0.1; German and English in v0.2 |
| Data storage | Browser `localStorage` for v0.2; no backend or accounts. The v0.3 Android APK adds a native storage adapter while keeping JSON backup/restore. |
| Session size | Default 25 words, configurable |
| Word order | Shuffled by default; per-session choice preserved on restart |
| Accessibility | Target WCAG 2.2 AA; EAA/EN 301 549-aligned (see §8.6) |
| Visual design | v0.2 professional refresh |
| Mobile path | Responsive web → optional PWA → Capacitor Android APK installed directly on own phone/tablet; no iOS or store build |

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
- Interface text is German in v0.1; v0.2 adds English while keeping the
  German learning content unchanged (see §8.3).

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
  language: 'de' | 'en';
  voiceURI?: string;
  rate: number;
  autoPlay: boolean;
  defaultWordCount: number;
  shuffle: boolean;
};

type SessionConfig = {
  listId: string;
  listName: string;
  words: string[];
  allWords: string[];
  wordCount: number;
  mode: 'practice' | 'exam';
  shuffle: boolean; // runtime-only, not persisted
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

## 8. v0.2.0 Plan — Bilingual, Accessible, Mobile-Ready

**Goal:** Ship a polished German/English release that fixes the v0.1 review
findings, works reliably on Android phones and tablets, meets a WCAG 2.2 AA
baseline, and prepares the same codebase for a side-loaded Android APK.

**Status:** In progress. The web app remains the primary product. The native
deliverable is an Android-only Capacitor APK for personal installation in v0.3;
there is no iOS build and no app-store release.

### 8.1 Scope and release gates

In scope for v0.2.0:

- The four correctness fixes from the v0.1 review.
- Full German/English UI, including accessible names and status messages.
- Responsive and touch-first refinements for Android phones and tablets.
- A professional visual refresh.
- WCAG 2.2 AA / EAA-aligned accessibility work.
- Optional PWA/offline app-shell support for the web build.
- Real-device testing on the target Android phone and tablet.

Not in scope for v0.2.0:

- User accounts, cloud sync, or a backend.
- Translating German learning words or user-entered list names.
- Additional languages beyond German and English.
- An iOS app, a store-published app, or a Play Store release. The Android
  Capacitor APK starts in v0.3, after the v0.2 web release is stable.

Release gate: do not tag v0.2.0 until build, lint, automated accessibility
checks, the keyboard-only pass, and the phone/tablet smoke test all pass.

### 8.2 Correctness fixes from the v0.1 review

| ID | Finding | Planned change | Acceptance |
|---|---|---|---|
| V2-FIX-1 | Restart after “Falsche Wörter üben” can start the original exam mode instead of practice (`SessionPage.tsx:202-204`). | `restartSession` uses the active `run.mode`, or accepts an explicit mode. Keep the result CTA label and the next round’s mode in sync. | Exam → retry wrong words → finish → restart starts a practice round; all labels match. |
| V2-FIX-2 | Restart ignores the shuffle choice made for the current session (`SessionPage.tsx:203`). | Add `shuffle: boolean` to `SessionConfig`; pass the home-page choice; reuse it on restart. | Unchecked shuffle remains stable on restart; checked shuffle re-shuffles. |
| V2-FIX-3 | Storage write failures are swallowed while the UI says data was saved (`storage.ts:35`, `SessionPage.tsx:502`). | Return a success result from storage writes; track a storage status in app state; show a dismissible warning and never claim “saved” after a failed write. | Simulated quota/unavailable storage shows a clear warning and keeps the app usable; no false success message. |
| V2-FIX-4 | The editor keeps stale state when the `:id` route param changes (`ListEditorPage.tsx:14`, `App.tsx:19`). | Key the editor by list id or reset the form when `id` changes. Add an unsaved-changes guard if needed. | Direct navigation between two list URLs shows the correct list; saving cannot overwrite the previously selected list. |

Add regression tests for all four fixes before the redesign work begins.

### 8.3 Internationalization (German and English)

Requirements:

- Every user-visible string switches without a page reload: navigation, buttons,
  headings, helper text, empty states, errors, confirmation dialogs, file-input
  messages, accessible names, `aria-label`, `title`, and live-region text.
- Default language is German. Remember the explicit choice in settings.
- Do not translate German learning content or user-entered list names. When the
  UI is English, mark the German learning words with `lang="de-DE"`. Do not
  force a language onto user-entered list names, whose language is unknown.
- Keep speech synthesis in German. UI language and speaking language are
  independent settings.
- Update `<html lang>` and `document.title` when the language changes.
- Format dates, numbers, percentages, and plurals with `Intl` using the current
  locale.
- Keep route paths stable or language-neutral; do not show German route names in
  an otherwise-English UI. Recommended: make `/lists`, `/lists/new`,
  `/settings`, and `/session` the canonical paths and redirect the old German
  paths so existing bookmarks keep working. Confirm before implementation.
- Use a small typed dictionary rather than hardcoded strings. Suggested files:
  `src/i18n/de.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`, `src/i18n/types.ts`.
  A lightweight custom provider is enough for two languages; adopt
  `react-i18next` only if the translation workflow grows.

Planned data changes:

```ts
type Locale = 'de' | 'en';

type Settings = {
  language: Locale; // default: 'de'
  voiceURI?: string;
  rate: number;
  autoPlay: boolean;
  defaultWordCount: number;
  shuffle: boolean;
};

type SessionConfig = {
  listId: string;
  listName: string;
  words: string[];
  allWords: string[];
  wordCount: number;
  mode: 'practice' | 'exam';
  shuffle: boolean; // runtime-only, not persisted
};
```

`language` is additive and defaults to German, so the existing storage keys can
stay at `v1`. Bump storage keys only if a persisted shape becomes incompatible.

Acceptance:

- A key-parity test fails if German and English dictionaries have different keys.
- Switching language on every screen changes all UI text and accessible names.
- The selected language survives reload.
- The English layout works at 320 CSS px without clipping or overlap.
- A screen reader announces the page and German words with the correct language.
- No German UI text remains hardcoded outside the dictionaries.

### 8.4 Mobile, tablet, and cross-browser behavior

Target matrix:

| Target | Priority | What to verify |
|---|---|---|
| Android 12+, Chrome and Samsung Internet | P0 | System TTS voices; replay/cancel; TalkBack; file import/export; back navigation. |
| Android 7+ Capacitor APK (WebView) | P0 for v0.3 | Speech in the Android WebView, file/share plugins, Android back button, lifecycle, safe areas. |
| Android tablet, portrait and landscape | P0 | Layout, touch targets, keyboard, session controls, review table. |
| Android Firefox | P1 | TTS voice availability and replay behavior. |
| Desktop Chrome/Edge | P1 | Baseline flow, keyboard shortcuts, file import/export. |
| Desktop Firefox/Safari | P1 | TTS voice lists, focus behavior, layout. |
| In-app browsers (WhatsApp, Instagram, etc.) | P2 | Detect restricted environments and advise opening in Chrome. |

Speech behavior to design around:

- Android Chrome and the Android WebView may require the first `speak()` call to
  happen inside a real user gesture. Autoplay from a timer or async callback may
  produce silence with no error. Keep a visible “hear word” control and treat
  auto-play as an enhancement, not a guarantee.
- Voice lists load asynchronously and differ by OS/TTS engine. Re-read them on
  `voiceschanged`; never assume a German voice exists.
- Handle `not-allowed`, `interrupted`, and `canceled` errors. If the engine
  fails silently, detect the absence of `speechSynthesis.speaking` after a short
  delay and offer a retry. Cancel speech when the route changes or the app is
  backgrounded.
- Android Chrome pause/resume can be unreliable; prefer cancel-and-replay.
- Long utterances can be cut off by some engines. Words are short, but keep
  chunking in mind if example sentences are added later.
- Some voices are network-backed. Offline support does not guarantee offline
  speech. Prefer voices with `localService === true` when available and disclose
  the limitation in the README/accessibility statement.

Responsive requirements:

- Mobile-first layouts at 320, 375, 768, and 1024 CSS px; test 200% and 400%
  zoom and the WCAG text-spacing override.
- Use `100dvh`/`svh` where appropriate, safe-area insets, and layout that
  survives the on-screen keyboard.
- Minimum target size 24×24 CSS px (WCAG 2.2); aim for 44×44 or 48×48 for
  primary actions.
- Inputs use at least 16px text to avoid mobile zoom on focus.
- No hover-only controls; every action is available by touch and keyboard.
- Support portrait and landscape. Keep the current word control and the
  progress indicator visible without covering focus.
- Use the Web Share API for export where available, with a download fallback.
- Warn about browser-managed storage eviction and keep backup/export easy to
  reach.

Acceptance:

- Complete practice, exam, retry-wrong, list editing, import/export, settings,
  and language switching on the target Android phone and tablet.
- Confirm speech starts from a tap and replays on the target Android devices.
- Confirm the installed APK and the browser version behave the same.
- Confirm no horizontal scrolling at 320 CSS px.
- Confirm all primary actions remain reachable in landscape and with the
  keyboard open.
- Confirm data can be exported and restored on a mobile browser.

### 8.5 Visual refresh

Direction: a calm, premium learning workspace rather than a cartoon or a dense
dashboard. Use a warm paper-like background, dark ink text, a restrained accent
color, clear cards, and strong typographic hierarchy. The child should see a
focused session; the parent should see clear setup, review, and result screens.

Planned work:

- Introduce semantic design tokens in CSS for color, spacing, type scale,
  radii, elevation, and motion.
- Self-host a legible open-source font with full German coverage (for example
  Atkinson Hyperlegible or Lexend), with a system-font fallback. Do not rely on
  a CDN.
- Redesign the app shell: brand and language switch in the header, responsive
  main container, consistent page headings and breadcrumbs.
- Redesign the home/setup screen with a clear primary action, mode cards, list
  selection, and recent results.
- Redesign the session screen around one large audio control, a readable
  progress indicator, and obvious reveal/mark actions.
- Redesign the exam review as a scannable list/table with clear row states and a
  sticky summary/action area that does not obscure focus.
- Redesign results with a readable score presentation, wrong-word list, and
  clear retry/exit actions.
- Use consistent inline SVG icons. Avoid emoji as functional icons.
- Replace `window.confirm` with an accessible dialog component that traps focus,
  restores focus on close, and supports Escape.
- Add subtle transitions; disable them under `prefers-reduced-motion`.
- Optional stretch: light/dark themes that follow the OS preference. Do not ship
  a theme that fails contrast or focus checks.

Acceptance:

- The visual hierarchy makes the next action obvious on every screen.
- German and English strings both fit without truncation at 320px.
- The redesign preserves all v0.1 flows and the paper-dictation model.
- Automated contrast checks and manual focus checks pass.
- No layout shift when the language, word count, or results list changes.

### 8.6 EAA and accessibility baseline

Target **WCAG 2.2 Level AA**. It is the current direction of EN 301 549 and is
backward-compatible with WCAG 2.1 AA.

Legal context, for planning only:

- The European Accessibility Act (Directive (EU) 2019/882) applies to many
  consumer services since 28 June 2025. Microenterprises providing services are
  exempt under the directive.
- For public-sector web accessibility, the cited harmonised version is EN 301
  549 v3.2.1, based on WCAG 2.1 AA. Under the EAA, no EN 301 549 version had yet
  been cited in the EU Official Journal when this plan was written. EN 301 549
  v4.1.1 (September 2026) adopts WCAG 2.2 AA but was not yet cited.
- If the app is published or shared beyond personal devices, review whether the
  EAA, German BFSG, and distribution rules apply. A personal side-loaded APK is
  not a store release, but accessibility remains the quality baseline. This plan
  is engineering guidance, not legal advice.
- If an APK is distributed to others, review EN 301 549 Chapter 11 (non-web
  software) in addition to the web-content checks.

Accessibility checklist:

- [ ] One clear `h1` per page, logical heading order, landmarks, and a skip link.
- [ ] Complete keyboard operation with visible focus, no traps, and focus moved
  to the new heading or status after navigation/reveal.
- [ ] Focus is never obscured by sticky headers, footers, or dialogs.
- [ ] All controls have accessible names; form errors are associated with fields
  and announced.
- [ ] Status messages use `role="status"` or `aria-live` without stealing focus.
- [ ] Text contrast is at least 4.5:1; large text and UI boundaries at least 3:1.
  Never use color alone to mark correct/incorrect.
- [ ] Reflow works at 320 CSS px and at 400% zoom; text-spacing overrides do not
  clip content.
- [ ] Target size is at least 24×24 CSS px; primary actions target 44×44+.
- [ ] Dragging has a non-drag alternative (rate slider also has +/- buttons).
- [ ] Character-key shortcuts are documented, do not fire while typing, and can
  be turned off or remapped.
- [ ] Reduced-motion preferences are respected.
- [ ] Speech has explicit play/replay/stop controls; no unexpected audio.
- [ ] The current UI language and German word language are marked correctly.
- [ ] Screen-reader pass with NVDA or JAWS on Windows and TalkBack on Android.
- [ ] Automated scans with axe-core/Playwright and Lighthouse have no unresolved
  serious or critical findings.
- [ ] If the app is public, publish an accessibility statement that explains the
  browser TTS limitations and how to report a barrier.

### 8.7 PWA and Android APK feasibility

**Short answer:** Yes, converting this app to an Android app is feasible without
a React Native or Flutter rewrite. The chosen path is an Android-only Capacitor
wrapper that produces a signed APK for direct installation on the user’s own
phone and tablet. There is no iOS build and no app-store release.

Capacitor is a good fit because the app is already a static Vite/React build,
uses relative asset paths (`base: './'`), and uses hash routing, which works
inside the Android WebView.

| Option | Fit | Advantages | Limits |
|---|---|---|---|
| Installable PWA | Optional web/offline path | Same codebase; fast updates; works offline after caching | No APK; browser/WebView limits; storage can be evicted; no native plugins |
| Capacitor Android wrapper | Chosen native path | Same web UI; signed APK installed directly; native storage, files, share, TTS plugins | Android Studio/JDK, signing, Android-only, native testing; no store publishing |
| React Native / Flutter rewrite | Not recommended here | Native performance | Rewrites the UI and logic; duplicates the codebase for little benefit |

Recommended path:

1. **v0.2.0 — optional PWA.** Add a web app manifest, maskable icons,
   service-worker caching for the app shell, an offline/update notice, and
   install guidance. Use `vite-plugin-pwa` or a small Workbox setup. Show install
   UI when `beforeinstallprompt` is available on Android/desktop. iOS is not a
   target; do not add iOS install instructions. Offline caching covers the app
   shell and data; speech still depends on an installed local German voice, so
   show a clear fallback when none is available.
2. **v0.3.0 — Android Capacitor APK spike.** Wrap the existing `dist/` build,
   test speech in the Android WebView, and replace browser-only persistence/file
   access with platform adapters where needed. Do not add the iOS platform.
3. **v0.3.x — signed APK for own devices.** Build a release APK, install it
   directly on the target Android phone/tablet, and update by installing a newer
   APK with the same `applicationId` and signing key. No Play Store, App Store,
   or store review.

Capacitor spike scope:

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init "WordMaster" com.example.wordmaster --web-dir dist
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

Android APK build and install:

- Capacitor 8 requires Android 7 / API 24 minimum, compile/target SDK 36, Android
  Studio 2025.2.1+, and a compatible JDK. Use the Android Studio JDK.
- Create a release keystore once, store it outside the repository, and keep the
  passwords safe. Never commit the keystore or signing secrets.
- Set a stable `applicationId` and increment `versionCode` for every update. The
  same `applicationId` and signing key are required to upgrade an installed APK
  without wiping app data.
- Build the signed APK:

  ```powershell
  cd android
  .\gradlew.bat assembleRelease
  ```

  The APK is written under
  `android/app/build/outputs/apk/release/app-release.apk`.
- Install with `adb install -r app-release.apk`, or copy the APK to the device
  and allow “install unknown apps” for the file manager/browser. No Play
  developer account is needed.
- Export a JSON backup before the first APK install. Uninstalling the app clears
  its local data; keep the signing key so future APKs can upgrade in place.

Required architecture changes:

- Add a storage adapter: browser `localStorage` versus Capacitor Preferences or
  SQLite. Migrate existing data on first native launch and keep backup/export.
- Add a speech adapter: Web Speech in the WebView versus a native TTS plugin.
  Choose based on real-device reliability, offline behavior, and voice quality.
- Add a file/share adapter: Capacitor Filesystem/Share for export/import instead
  of relying on `<a download>` and file inputs inside a WebView.
- Handle Android back navigation, app backgrounding (cancel speech),
  status-bar/safe-area insets, and app lifecycle.
- Isolate all native imports behind `src/platform/` with web fallbacks. Do not
  import Capacitor directly in shared page components.
- Keep the web build as the source of truth; the Android project is a generated
  shell, not a fork.

Prerequisites and risks:

- No Apple/macOS/Xcode work and no Google Play account are required for personal
  side-loading.
- Side-loading requires enabling “install unknown apps” for the installing app.
  Managed/company devices may block this.
- Web Speech behavior inside the Android WebView must be verified on the target
  devices; the fallback is a native TTS plugin.
- localStorage may be evicted by Android/browser cleanup; native storage plus
  export/backup is safer.
- Losing the release keystore prevents seamless updates. Reinstalling with a
  different key requires uninstalling the old app and losing local data.
- If the APK is shared beyond personal devices, review EAA Chapter 11, privacy,
  and distribution obligations. Personal family side-loading is not a store
  release.
- The PWA remains an optional web fallback; the APK is the chosen mobile
  deliverable for the user’s Android phone/tablet.

Reference notes checked for this plan:

- Capacitor Android documentation:
  https://capacitorjs.com/docs/android
- Capacitor environment setup:
  https://capacitorjs.com/docs/getting-started/environment-setup
- Capacitor target SDK setup:
  https://capacitorjs.com/docs/android/setting-target-sdk
- AccessibleEU update on EN 301 549 v4.1.1:
  https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en
- European Commission web accessibility standards:
  https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard
- Web Speech API:
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

### 8.8 Delivery order

1. Fix V2-FIX-1 through V2-FIX-4 and add regression tests.
2. Extract all strings into the German/English dictionaries and add the language
   selector, persistence, and document-language handling.
3. Add regression tests for i18n key parity, storage failures, and editor reset.
4. Introduce design tokens and the accessible dialog; refresh the app shell.
5. Redesign the home, session, review, result, lists, and settings screens.
6. Complete the phone/tablet/responsive pass and the WCAG 2.2 AA checklist.
7. Add the optional PWA manifest, service worker, offline shell, and Android
   install guidance.
8. Run the automated cross-browser and accessibility suites; fix findings.
9. Run the real-device Android phone/tablet and TalkBack smoke test.
10. Tag v0.2.0. Start the Android-only Capacitor spike on a separate branch only
    after the web release is stable.

Suggested releases:

- **v0.2.0:** fixes, bilingual UI, responsive design, accessibility, optional PWA.
- **v0.2.1:** accessibility and device-testing follow-ups.
- **v0.3.0:** Android Capacitor wrapper spike/internal APK builds.
- **v0.3.x:** signed APK installed directly on the user’s phone/tablet; no store.

### 8.9 v0.2.0 checklist

- [x] Fix restart mode after retrying wrong words.
- [x] Preserve the per-session shuffle choice on restart.
- [x] Report storage write failures and remove false “saved” claims.
- [x] Reset the list editor when the route id changes.
- [x] Add typed German and English dictionaries with key parity tests.
- [x] Add language selection, persistence, `<html lang>`, and localized `Intl`
  formatting.
- [x] Mark German learning content with `lang="de-DE"` in the English UI.
- [x] Confirm the route-path strategy and keep old URLs working.
- [ ] Introduce design tokens, self-hosted typography, and an accessible dialog.
- [x] Refresh all pages without changing the paper-dictation workflow.
- [ ] Complete the phone, tablet, landscape, zoom, and keyboard passes.
- [x] Add safe-area, dynamic-viewport, touch-target, and no-hover fallbacks.
- [ ] Complete the WCAG 2.2 AA checklist and screen-reader testing.
- [x] Add optional PWA manifest, icons, service worker, offline shell, and update
  notice.
- [x] Add unit, component, Playwright, and axe-core coverage.
- [ ] Run the real-device Android phone/tablet smoke test, including speech.
- [x] Document browser/device limitations in the README.
- [x] Decide whether the Android APK spike is approved for v0.3.

### 8.10 v0.2.0 verification

Planned commands:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

Automated tests:

- German/English dictionary key parity and interpolation/pluralization.
- Language persistence and `<html lang>` updates.
- Restart mode and shuffle behavior after retry-wrong.
- Storage failure handling with a simulated throwing `localStorage`.
- List-editor reset when navigating between ids.
- Playwright flows for practice, exam, retry-wrong, review, results, language
  switch, list import/export, and backup/restore.
- axe-core scans of home, lists, editor, settings, session, review, and result
  screens.
- Desktop Chromium, Firefox, and WebKit; Android phone/tablet viewport projects.

Manual tests:

- Real Android phone (Chrome and the installed APK) and a tablet in both
  orientations.
- TalkBack, NVDA/JAWS, keyboard-only, 200%/400% zoom, high contrast, reduced
  motion, and text-spacing override.
- Speech: first tap, replay, stop, no German voice, speech unavailable, app
  backgrounding, and routing away mid-speech.
- PWA (optional): install, offline launch, update prompt, storage/export.
- APK: side-load, upgrade while preserving data, offline launch, file
  export/import, Android back navigation, and lifecycle.
- English UI with German words and German UI with German words.

---

## 9. Future Enhancements (v0.3+)

- Typing mode with automatic spelling checks.
- Per-word weak-word statistics across sessions.
- Capacitor Android APK for personal side-loading (v0.3; see §8.7).
- Example sentences for words with ambiguous spellings.
- Rewards, streaks, or a points system.
- Printable word lists and result reports.
- Additional UI languages beyond German and English.
- Optional cloud sync and accounts, only if explicitly requested later.

---

## 10. Open Questions / Assumptions

1. Exam answers are revealed only during the final review. Should this instead
   be per-word reveal?
2. Is the built-in starter list sufficient, or should its contents be supplied
   by the parent?
3. Should the app later support automatic checking via typing as an optional
   mode?
4. Should route paths become language-neutral (`/lists`, `/settings`) with
   redirects from the current German paths? Recommended: yes.
5. Will the Android APK stay on your own devices, or be shared with other
   families? Wider sharing changes EAA, privacy, and signing/update planning.
6. Should English cover the entire parent and child interface, or only helper
   text? Recommended: full UI translation, with German learning content
   unchanged.
7. Which visual direction is preferred: calm/premium or playful/child-focused?
   Recommended: calm and focused, with subtle warmth.
8. Is dark mode required in v0.2, or later? Recommended: stretch goal.
9. Should the optional PWA ship in v0.2, or should v0.2 focus only on the web app
   before the Android APK? Recommended: keep PWA optional.
10. Which Android versions and devices must the APK support? Capacitor 8 supports
    Android 7 / API 24 and newer; test on the actual phone and tablet.

---

## 11. Notes for Future Modification

- Route every UI string through the German/English dictionaries. Do not add
  literal user-visible text in components.
- Keep German learning words marked with `lang="de-DE"` when the surrounding UI
  is English. Do not force a language onto user-entered list names.
- Keep word-selection and scoring logic in `src/lib/` so it can be tested
  independently of React.
- Bump storage keys only for backward-incompatible changes. Additive fields
  should be defaulted during sanitization instead.
- Keep the web build Capacitor-compatible: relative asset base, hash routing,
  no server-only APIs, and platform-specific code behind adapters.
- Treat accessibility checks as a release gate, not a post-release cleanup.
- Test speech on the real Android phone and tablet; desktop emulation does not
  cover autoplay, voice-list, or backgrounding behavior.
- If the Android shell is added, isolate Capacitor imports in `src/platform/`
  and keep the browser fallbacks working. Do not add an iOS platform.
- Keep the Android release keystore and passwords outside the repository. The
  same `applicationId` and signing key are required for in-place APK updates.
- Because the app is static, it can be hosted on GitHub Pages, any static host,
  or run locally.
