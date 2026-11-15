import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { Mascot } from '../components/Mascot'
import { ProgressBar } from '../components/ProgressBar'
import { useSpeech } from '../hooks/useSpeech'
import { useI18n, usePageTitle } from '../i18n'
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
    (config.mode === 'practice' || config.mode === 'exam') &&
    typeof config.shuffle === 'boolean'

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return <SessionRunner config={config} />
}

function SessionRunner({ config }: { config: SessionConfig }) {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const speech = useSpeech(state.settings.voiceURI, state.settings.rate)
  const { t, plural, formatNumber, formatPercent } = useI18n()
  usePageTitle(t('meta.sessionTitle'))
  const { speak: speakWord, cancel: cancelSpeech } = speech
  const [run, setRun] = useState<RunState>(() => createRunState(config))
  const speakRef = useRef(speakWord)
  const phaseRef = useRef<HTMLElement>(null)
  const hasMountedRef = useRef(false)

  const currentWord = run.words[run.index] ?? ''
  const isLastWord = run.index + 1 >= run.words.length
  const modeLabel = run.mode === 'practice' ? t('mode.practice') : t('mode.exam')
  const markedCount = run.marks.filter((mark) => mark !== undefined).length
  const wrongCount = run.marks.filter((mark) => mark === false).length
  const resultStorageError = state.storageErrors.results !== undefined
  const resultSaved = state.lastSaved.results === state.results
  const speechErrorMessage = speech.error
    ? t(
        speech.error === 'unsupported'
          ? 'settings.speech.errorUnsupported'
          : 'settings.speech.errorFailed',
      )
    : null

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
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    phaseRef.current?.focus()
  }, [run.phase, run.index])

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
    const words = sampleWords(config.allWords, config.wordCount, config.shuffle)
    restartWith(words, run.mode)
  }

  function retryWrongWords() {
    if (!run.result || run.result.wrongWords.length === 0) {
      return
    }

    restartWith(run.result.wrongWords, 'practice')
  }

  function exitSession() {
    if (run.phase !== 'result' && !window.confirm(t('session.exitConfirm'))) {
      return
    }

    cancelSpeech()
    navigate('/')
  }

  function resultHeading(): string {
    if (!run.result || run.result.total === 0) {
      return t('session.result.keepPracticing')
    }

    const ratio = run.result.correct / run.result.total

    if (ratio === 1) {
      return t('session.result.perfect')
    }

    if (ratio >= 0.8) {
      return t('session.result.great')
    }

    if (ratio >= 0.6) {
      return t('session.result.good')
    }

    return t('session.result.keepPracticing')
  }

  return (
    <div className="session">
      <div className="session-top">
        <button type="button" className="btn btn--ghost btn--small" onClick={exitSession}>
          ← {t('session.exit')}
        </button>
        <div className="session-meta">
          <span className={`badge badge--${run.mode}`}>{modeLabel}</span>
          <span className="session-list-name">{config.listName}</span>
        </div>
      </div>

      {run.phase === 'word' && (
        <section ref={phaseRef} tabIndex={-1} aria-labelledby="word-heading">
          <div className="session-progress">
            <div className="session-progress__label">
              <span>
                {t('session.progress', {
                  current: formatNumber(run.index + 1),
                  total: formatNumber(run.words.length),
                })}
              </span>
            </div>
            <ProgressBar current={run.index + 1} total={run.words.length} />
          </div>

          <div className="panel session-card session-card--listen">
            <p className="eyebrow" id="word-heading">
              {modeLabel}
            </p>
            <p className="session-instruction">
              {t(
                run.mode === 'practice'
                  ? 'session.instructionPractice'
                  : 'session.instructionExam',
              )}
            </p>

            <div className="listen-scene">
              <Mascot mood="listen" className="listen-scene__mascot" />
              <AudioButton
                onClick={() => speakWord(currentWord)}
                speaking={speech.speaking}
                label={
                  speech.speaking ? t('session.audioPlaying') : t('session.audioListen')
                }
                disabled={!speech.supported}
              />
            </div>

            {!speech.supported && (
              <p className="notice notice--warning" role="alert">
                {t('session.unsupported')}
              </p>
            )}

            {speechErrorMessage && (
              <p className="notice notice--error" role="alert">
                {speechErrorMessage}
              </p>
            )}

            <p className="keyboard-hint">{t('session.keyboardHint')}</p>

            <div className="session-primary-action">
              {run.mode === 'practice' ? (
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={revealWord}
                >
                  {t('session.reveal')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={nextExamWord}
                >
                  {isLastWord ? t('session.toReview') : t('session.next')}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {run.phase === 'revealed' && (
        <section ref={phaseRef} tabIndex={-1} aria-labelledby="reveal-heading">
          <div className="session-progress">
            <div className="session-progress__label">
              <span>
                {t('session.progress', {
                  current: formatNumber(run.index + 1),
                  total: formatNumber(run.words.length),
                })}
              </span>
            </div>
            <ProgressBar current={run.index + 1} total={run.words.length} />
          </div>

          <div className="panel session-card">
            <p className="eyebrow" id="reveal-heading">
              {t('session.revealHeading')}
            </p>
            <p className="reveal-word" lang="de-DE">
              {currentWord}
            </p>

            <div className="inline-actions inline-actions--center">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => speakWord(currentWord)}
                disabled={!speech.supported}
              >
                {speech.speaking ? t('session.audioPlaying') : t('session.repeat')}
              </button>
            </div>

            <p className="session-question">{t('session.markQuestion')}</p>

            <div className="mark-actions">
              <button
                type="button"
                className="btn btn--success btn--large"
                onClick={() => markWord(true)}
              >
                {t('session.correct')}
              </button>
              <button
                type="button"
                className="btn btn--danger btn--large"
                onClick={() => markWord(false)}
              >
                {t('session.wrong')}
              </button>
            </div>
          </div>
        </section>
      )}

      {run.phase === 'review' && (
        <section ref={phaseRef} tabIndex={-1} aria-labelledby="review-heading">
          <div className="review-heading">
            <div>
              <p className="eyebrow">{t('session.review.eyebrow')}</p>
              <h1 id="review-heading">{t('session.review.heading')}</h1>
              <p className="muted">{t('session.review.text')}</p>
            </div>
            <span className="badge badge--soft">
              {t('common.marked', {
                marked: formatNumber(markedCount),
                total: formatNumber(run.words.length),
              })}
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
                  <strong className="review-row__word" lang="de-DE">
                    {word}
                  </strong>
                  <div className="review-row__actions">
                    <button
                      type="button"
                      className={`pill-btn${mark === true ? ' is-active is-correct' : ''}`}
                      onClick={() => setReviewMark(index, true)}
                      aria-pressed={mark === true}
                    >
                      {t('session.correct')}
                    </button>
                    <button
                      type="button"
                      className={`pill-btn${mark === false ? ' is-active is-wrong' : ''}`}
                      onClick={() => setReviewMark(index, false)}
                      aria-pressed={mark === false}
                    >
                      {t('session.wrong')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="review-footer">
            <p className="muted">
              {markedCount < run.words.length
                ? plural(
                    run.words.length - markedCount,
                    'session.review.remainingOne',
                    'session.review.remainingMany',
                    { count: formatNumber(run.words.length - markedCount) },
                  )
                : wrongCount === 0
                  ? t('session.review.allCorrect')
                  : plural(wrongCount, 'session.review.wrongOne', 'session.review.wrongMany', {
                      count: formatNumber(wrongCount),
                    })}
            </p>
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={submitReview}
              disabled={markedCount < run.words.length}
            >
              {t('session.review.complete')}
            </button>
          </div>
        </section>
      )}

      {run.phase === 'result' && run.result && (
        <section ref={phaseRef} tabIndex={-1} aria-labelledby="result-heading">
          <div className="panel result-hero">
            <Mascot mood="cheer" className="result-hero__mascot" />
            <p className="eyebrow">
              {t('session.result.modeEnded', { mode: modeLabel })}
            </p>
            <h1 id="result-heading">{resultHeading()}</h1>

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
                  {formatNumber(run.result.correct)}/{formatNumber(run.result.total)}
                </strong>
                <span>
                  {formatPercent(run.result.correct / run.result.total)}
                </span>
              </div>
            </div>

            <p className="muted">{run.result.listName}</p>

            {run.result.wrongWords.length === 0 ? (
              <p className="success-text">{t('session.result.allCorrect')}</p>
            ) : (
              <div className="wrong-block">
                <h2>{t('session.result.wrongHeading')}</h2>
                <ul className="word-chips word-chips--wrong">
                  {run.result.wrongWords.map((word, index) => (
                    <li key={`${word}-${index}`} lang="de-DE">
                      {word}
                    </li>
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
                {t('session.result.retryWrong')}
              </button>
            )}
            <button
              type="button"
              className="btn btn--secondary btn--large"
              onClick={restartSession}
            >
              {t(
                run.mode === 'practice'
                  ? 'session.result.newPractice'
                  : 'session.result.newExam',
              )}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--large"
              onClick={exitSession}
            >
              {t('session.result.home')}
            </button>
          </div>

          {resultStorageError ? (
            <p className="notice notice--error" role="alert">
              {t('storage.resultNotSaved')}
            </p>
          ) : (
            resultSaved && <p className="save-note">{t('storage.resultSaved')}</p>
          )}
        </section>
      )}
    </div>
  )
}
