import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { ProgressBar } from '../components/ProgressBar'
import { useSpeech } from '../hooks/useSpeech'
import { createSessionResult } from '../lib/session'
import { sampleWords } from '../lib/words'
import { useAppState } from '../state/appContext'
import type { SessionConfig, SessionMode, SessionResult } from '../types'

type Phase = 'word' | 'revealed' | 'review' | 'result'

type RunState = {
  mode: SessionMode
  words: string[]
  index: number
  phase: Phase
  marks: Array<boolean | undefined>
  result: SessionResult | null
}

function createRunState(config: SessionConfig): RunState {
  return {
    mode: config.mode,
    words: config.words,
    index: 0,
    phase: 'word',
    marks: Array.from({ length: config.words.length }, () => undefined),
    result: null,
  }
}

export function SessionPage() {
  const location = useLocation()
  const config = location.state as SessionConfig | null
  const isValid =
    config !== null &&
    Array.isArray(config.words) &&
    Array.isArray(config.allWords) &&
    config.words.length > 0 &&
    config.allWords.length > 0 &&
    (config.mode === 'practice' || config.mode === 'exam')

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return <SessionRunner config={config} />
}

function SessionRunner({ config }: { config: SessionConfig }) {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const speech = useSpeech(state.settings.voiceURI, state.settings.rate)
  const { speak: speakWord, cancel: cancelSpeech } = speech
  const [run, setRun] = useState<RunState>(() => createRunState(config))
  const speakRef = useRef(speakWord)

  const currentWord = run.words[run.index] ?? ''
  const isLastWord = run.index + 1 >= run.words.length
  const modeLabel = run.mode === 'practice' ? 'Übung' : 'Prüfung'
  const markedCount = run.marks.filter((mark) => mark !== undefined).length
  const wrongCount = run.marks.filter((mark) => mark === false).length

  useEffect(() => {
    speakRef.current = speakWord
  }, [speakWord])

  useEffect(() => {
    if (run.phase !== 'word' || !state.settings.autoPlay || !speech.supported) {
      return
    }

    const word = run.words[run.index]

    if (!word) {
      return
    }

    const timer = window.setTimeout(() => speakRef.current(word), 180)

    return () => window.clearTimeout(timer)
  }, [run.phase, run.index, run.words, state.settings.autoPlay, speech.supported])

  useEffect(() => {
    if (run.phase !== 'word') {
      cancelSpeech()
    }
  }, [run.phase, cancelSpeech])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat || run.phase !== 'word') {
        return
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button, a, input, textarea, select, summary')
      ) {
        return
      }

      event.preventDefault()
      speakWord(currentWord)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentWord, run.phase, speakWord])

  function revealWord() {
    setRun((current) => ({ ...current, phase: 'revealed' }))
  }

  function markWord(correct: boolean) {
    if (run.phase !== 'revealed') {
      return
    }

    const marks = [...run.marks]
    marks[run.index] = correct

    if (isLastWord) {
      const result = createSessionResult({
        listId: config.listId,
        listName: config.listName,
        mode: run.mode,
        words: run.words,
        marks,
      })

      dispatch({ type: 'addResult', result })
      setRun({ ...run, marks, phase: 'result', result })
      return
    }

    setRun({
      ...run,
      marks,
      index: run.index + 1,
      phase: 'word',
    })
  }

  function nextExamWord() {
    if (isLastWord) {
      setRun((current) => ({ ...current, phase: 'review' }))
      return
    }

    setRun((current) => ({
      ...current,
      index: current.index + 1,
      phase: 'word',
    }))
  }

  function setReviewMark(index: number, correct: boolean) {
    setRun((current) => {
      const marks = [...current.marks]
      marks[index] = correct

      return { ...current, marks }
    })
  }

  function submitReview() {
    if (run.phase !== 'review' || markedCount < run.words.length) {
      return
    }

    const result = createSessionResult({
      listId: config.listId,
      listName: config.listName,
      mode: run.mode,
      words: run.words,
      marks: run.marks,
    })

    dispatch({ type: 'addResult', result })
    setRun({ ...run, phase: 'result', result })
  }

  function restartWith(words: string[], mode: SessionMode) {
    if (words.length === 0) {
      return
    }

    cancelSpeech()
    setRun({
      mode,
      words,
      index: 0,
      phase: 'word',
      marks: Array.from({ length: words.length }, () => undefined),
      result: null,
    })
  }

  function restartSession() {
    const words = sampleWords(config.allWords, config.wordCount, state.settings.shuffle)
    restartWith(words, config.mode)
  }

  function retryWrongWords() {
    if (!run.result || run.result.wrongWords.length === 0) {
      return
    }

    restartWith(run.result.wrongWords, 'practice')
  }

  function exitSession() {
    if (
      run.phase !== 'result' &&
      !window.confirm('Session wirklich beenden? Der Fortschritt geht verloren.')
    ) {
      return
    }

    cancelSpeech()
    navigate('/')
  }

  return (
    <div className="session">
      <div className="session-top">
        <button type="button" className="btn btn--ghost btn--small" onClick={exitSession}>
          ← Beenden
        </button>
        <div className="session-meta">
          <span className={`badge badge--${run.mode}`}>{modeLabel}</span>
          <span className="session-list-name">{config.listName}</span>
        </div>
      </div>

      {run.phase === 'word' && (
        <section aria-labelledby="word-heading">
          <div className="session-progress">
            <div className="session-progress__label">
              <span>
                Wort {run.index + 1} von {run.words.length}
              </span>
            </div>
            <ProgressBar current={run.index + 1} total={run.words.length} />
          </div>

          <div className="panel session-card session-card--listen">
            <p className="eyebrow" id="word-heading">
              {run.mode === 'practice' ? 'Übung' : 'Prüfung'}
            </p>
            <p className="session-instruction">
              {run.mode === 'practice'
                ? 'Hör gut zu und schreibe das Wort auf dein Papier.'
                : 'Schreibe das Wort auf dein Papier.'}
            </p>

            <AudioButton
              onClick={() => speakWord(currentWord)}
              speaking={speech.speaking}
              label={speech.speaking ? 'Wird vorgelesen …' : 'Wort anhören'}
              disabled={!speech.supported}
            />

            {!speech.supported && (
              <p className="notice notice--warning" role="alert">
                Dein Browser kann keine Wörter vorlesen. Du kannst die Antwort trotzdem
                aufdecken.
              </p>
            )}

            {speech.error && (
              <p className="notice notice--error" role="alert">
                {speech.error}
              </p>
            )}

            <p className="keyboard-hint">Tipp: Die Leertaste spielt das Wort erneut ab.</p>

            <div className="session-primary-action">
              {run.mode === 'practice' ? (
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={revealWord}
                >
                  Antwort zeigen
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={nextExamWord}
                >
                  {isLastWord ? 'Weiter zur Auswertung' : 'Weiter'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {run.phase === 'revealed' && (
        <section aria-labelledby="reveal-heading">
          <div className="session-progress">
            <div className="session-progress__label">
              <span>
                Wort {run.index + 1} von {run.words.length}
              </span>
            </div>
            <ProgressBar current={run.index + 1} total={run.words.length} />
          </div>

          <div className="panel session-card">
            <p className="eyebrow" id="reveal-heading">
              Die richtige Schreibweise
            </p>
            <p className="reveal-word">{currentWord}</p>

            <div className="inline-actions inline-actions--center">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => speakWord(currentWord)}
                disabled={!speech.supported}
              >
                {speech.speaking ? 'Wird vorgelesen …' : 'Noch einmal hören'}
              </button>
            </div>

            <p className="session-question">Hat die Schreibweise gestimmt?</p>

            <div className="mark-actions">
              <button
                type="button"
                className="btn btn--success btn--large"
                onClick={() => markWord(true)}
              >
                Richtig
              </button>
              <button
                type="button"
                className="btn btn--danger btn--large"
                onClick={() => markWord(false)}
              >
                Falsch
              </button>
            </div>
          </div>
        </section>
      )}

      {run.phase === 'review' && (
        <section aria-labelledby="review-heading">
          <div className="review-heading">
            <div>
              <p className="eyebrow">Auswertung</p>
              <h1 id="review-heading">Wörter prüfen</h1>
              <p className="muted">
                Vergleiche mit dem Papier und markiere jedes Wort.
              </p>
            </div>
            <span className="badge badge--soft">
              {markedCount}/{run.words.length} markiert
            </span>
          </div>

          <div className="review-list">
            {run.words.map((word, index) => {
              const mark = run.marks[index]

              return (
                <div
                  key={`${word}-${index}`}
                  className={`review-row${
                    mark === true ? ' is-correct' : mark === false ? ' is-wrong' : ''
                  }`}
                >
                  <span className="review-row__index">{index + 1}</span>
                  <strong className="review-row__word">{word}</strong>
                  <div className="review-row__actions">
                    <button
                      type="button"
                      className={`pill-btn${mark === true ? ' is-active is-correct' : ''}`}
                      onClick={() => setReviewMark(index, true)}
                      aria-pressed={mark === true}
                    >
                      Richtig
                    </button>
                    <button
                      type="button"
                      className={`pill-btn${mark === false ? ' is-active is-wrong' : ''}`}
                      onClick={() => setReviewMark(index, false)}
                      aria-pressed={mark === false}
                    >
                      Falsch
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="review-footer">
            <p className="muted">
              {markedCount < run.words.length
                ? `Noch ${run.words.length - markedCount} ${
                    run.words.length - markedCount === 1 ? 'Wort' : 'Wörter'
                  } markieren.`
                : wrongCount === 0
                  ? 'Alles richtig!'
                  : `${wrongCount} ${wrongCount === 1 ? 'Wort ist' : 'Wörter sind'} falsch.`}
            </p>
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={submitReview}
              disabled={markedCount < run.words.length}
            >
              Auswertung abschließen
            </button>
          </div>
        </section>
      )}

      {run.phase === 'result' && run.result && (
        <section aria-labelledby="result-heading">
          <div className="panel result-hero">
            <p className="eyebrow">{modeLabel} beendet</p>
            <h1 id="result-heading">
              {run.result.correct === run.result.total
                ? 'Perfekt!'
                : run.result.correct / run.result.total >= 0.8
                  ? 'Sehr gut!'
                  : run.result.correct / run.result.total >= 0.6
                    ? 'Gut gemacht!'
                    : 'Weiter üben!'}
            </h1>

            <div
              className="score-circle"
              style={{
                background: `conic-gradient(var(--success) ${
                  (run.result.correct / run.result.total) * 360
                }deg, #e8eef8 0deg)`,
              }}
            >
              <div className="score-circle__inner">
                <strong>
                  {run.result.correct}/{run.result.total}
                </strong>
                <span>
                  {Math.round((run.result.correct / run.result.total) * 100)}%
                </span>
              </div>
            </div>

            <p className="muted">{run.result.listName}</p>

            {run.result.wrongWords.length === 0 ? (
              <p className="success-text">Alle Wörter richtig geschrieben. Super!</p>
            ) : (
              <div className="wrong-block">
                <h2>Diese Wörter noch üben</h2>
                <ul className="word-chips word-chips--wrong">
                  {run.result.wrongWords.map((word, index) => (
                    <li key={`${word}-${index}`}>{word}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="result-actions">
            {run.result.wrongWords.length > 0 && (
              <button
                type="button"
                className="btn btn--primary btn--large"
                onClick={retryWrongWords}
              >
                Falsche Wörter üben
              </button>
            )}
            <button
              type="button"
              className="btn btn--secondary btn--large"
              onClick={restartSession}
            >
              {run.mode === 'practice' ? 'Neue Übung' : 'Neue Prüfung'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--large"
              onClick={exitSession}
            >
              Zur Startseite
            </button>
          </div>

          <p className="save-note">Das Ergebnis wurde auf diesem Gerät gespeichert.</p>
        </section>
      )}
    </div>
  )
}
