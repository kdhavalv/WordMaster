import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSpeech } from '../hooks/useSpeech'
import { useI18n, usePageTitle } from '../i18n'
import { createBackup, parseBackup } from '../lib/backup'
import { downloadJson, readJsonFile } from '../lib/files'
import { useAppState } from '../state/appContext'
import type { Settings } from '../types'

type Message = {
  tone: 'info' | 'error'
  text: string
}

function clampRate(rate: number): number {
  return Math.min(1.2, Math.max(0.6, Math.round(rate * 100) / 100))
}

export function SettingsPage() {
  const { state, dispatch } = useAppState()
  const { locale, setLocale, t, formatNumber } = useI18n()
  const speech = useSpeech(state.settings.voiceURI, state.settings.rate)
  usePageTitle(t('meta.settingsTitle'))
  const backupInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  const selectedVoiceURI = speech.germanVoices.some(
    (voice) => voice.voiceURI === state.settings.voiceURI,
  )
    ? state.settings.voiceURI ?? ''
    : ''
  const rateLabel = formatNumber(state.settings.rate, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const rateStep = formatNumber(0.05, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const hasGermanVoice = speech.germanVoices.length > 0
  const speechErrorMessage = speech.error
    ? t(
        speech.error === 'unsupported'
          ? 'settings.speech.errorUnsupported'
          : 'settings.speech.errorFailed',
      )
    : null

  function updateSettings(patch: Partial<Settings>) {
    dispatch({ type: 'updateSettings', settings: patch })
  }

  function exportBackup() {
    const today = new Date().toISOString().slice(0, 10)

    downloadJson(
      `wortmeister-backup-${today}.json`,
      createBackup(state.lists, state.results, state.settings),
    )
    setMessage({ tone: 'info', text: t('settings.backup.created') })
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const data = await readJsonFile(file)
      const backup = parseBackup(data)

      if (!backup) {
        setMessage({ tone: 'error', text: t('settings.backup.invalid') })
        return
      }

      const confirmed = window.confirm(t('settings.backup.confirm'))

      if (!confirmed) {
        return
      }

      dispatch({
        type: 'restoreData',
        data: {
          lists: backup.lists,
          results: backup.results,
          settings: backup.settings,
        },
      })
      setMessage({ tone: 'info', text: t('settings.backup.restored') })
    } catch {
      setMessage({ tone: 'error', text: t('settings.backup.readError') })
    }
  }

  function clearResults() {
    if (window.confirm(t('settings.results.clearConfirm'))) {
      dispatch({ type: 'clearResults' })
      setMessage({ tone: 'info', text: t('settings.results.cleared') })
    }
  }

  function resetData() {
    if (window.confirm(t('settings.reset.confirm'))) {
      dispatch({ type: 'resetData' })
      setMessage({ tone: 'info', text: t('settings.reset.done') })
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.title')}</h1>
          <p className="page-heading__text">{t('settings.text')}</p>
        </div>
      </div>

      {message && (
        <p
          className={`notice ${message.tone === 'error' ? 'notice--error' : 'notice--info'}`}
          role={message.tone === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}

      <section className="panel" aria-labelledby="language-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('settings.language.eyebrow')}</p>
            <h2 id="language-heading">{t('settings.language.heading')}</h2>
          </div>
        </div>

        <label className="field">
          <span id="language-label">{t('settings.language.label')}</span>
          <select
            value={locale}
            aria-labelledby="language-label"
            aria-describedby="language-hint"
            onChange={(event) =>
              setLocale(event.target.value === 'en' ? 'en' : 'de')
            }
          >
            <option value="de">{t('locale.de')}</option>
            <option value="en">{t('locale.en')}</option>
          </select>
          <span className="field__hint" id="language-hint">
            {t('settings.language.hint')}
          </span>
        </label>
      </section>

      <section className="panel" aria-labelledby="speech-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('settings.speech.eyebrow')}</p>
            <h2 id="speech-heading">{t('settings.speech.heading')}</h2>
          </div>
        </div>

        {!speech.supported && (
          <p className="notice notice--error" role="alert">
            {t('settings.speech.unsupported')}
          </p>
        )}

        {speech.supported && !hasGermanVoice && (
          <p className="notice notice--warning" role="alert">
            {t('settings.speech.noVoice')}
          </p>
        )}

        {speechErrorMessage && (
          <p className="notice notice--error" role="alert">
            {speechErrorMessage}
          </p>
        )}

        <div className="form-stack">
          <label className="field">
            <span>{t('settings.speech.voiceLabel')}</span>
            <select
              value={selectedVoiceURI}
              onChange={(event) =>
                updateSettings({ voiceURI: event.target.value || undefined })
              }
              disabled={!speech.supported || !hasGermanVoice}
            >
              <option value="">{t('settings.speech.auto')}</option>
              {speech.germanVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span id="rate-label">
              {t('settings.speech.rate')} <strong>{rateLabel}×</strong>
            </span>
            <div className="rate-control" role="group" aria-labelledby="rate-label">
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() =>
                  updateSettings({ rate: clampRate(state.settings.rate - 0.05) })
                }
                disabled={state.settings.rate <= 0.6}
                aria-label={`${t('settings.speech.rate')} −${rateStep}`}
              >
                −
              </button>
              <input
                type="range"
                min={0.6}
                max={1.2}
                step={0.05}
                value={state.settings.rate}
                aria-labelledby="rate-label"
                onChange={(event) =>
                  updateSettings({ rate: clampRate(Number(event.target.value)) })
                }
              />
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() =>
                  updateSettings({ rate: clampRate(state.settings.rate + 0.05) })
                }
                disabled={state.settings.rate >= 1.2}
                aria-label={`${t('settings.speech.rate')} +${rateStep}`}
              >
                +
              </button>
            </div>
            <span className="field__hint">{t('settings.speech.rateHint')}</span>
          </div>

          <div className="inline-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={speech.test}
              disabled={!speech.supported}
            >
              {speech.speaking ? t('settings.speech.testing') : t('settings.speech.test')}
            </button>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.settings.autoPlay}
              onChange={(event) =>
                updateSettings({ autoPlay: event.target.checked })
              }
            />
            <span>{t('settings.speech.autoPlay')}</span>
          </label>
        </div>
      </section>

      <section className="panel" aria-labelledby="defaults-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('settings.defaults.eyebrow')}</p>
            <h2 id="defaults-heading">{t('settings.defaults.heading')}</h2>
          </div>
        </div>

        <div className="form-stack">
          <label className="field">
            <span>{t('settings.defaults.wordCount')}</span>
            <input
              type="number"
              min={1}
              max={50}
              value={state.settings.defaultWordCount}
              onChange={(event) => {
                const value = Number(event.target.value)
                updateSettings({
                  defaultWordCount: Number.isFinite(value)
                    ? Math.min(50, Math.max(1, value))
                    : 25,
                })
              }}
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.settings.shuffle}
              onChange={(event) => updateSettings({ shuffle: event.target.checked })}
            />
            <span>{t('settings.defaults.shuffle')}</span>
          </label>
        </div>
      </section>

      <section className="panel" aria-labelledby="data-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('settings.data.eyebrow')}</p>
            <h2 id="data-heading">{t('settings.data.heading')}</h2>
          </div>
        </div>
        <p className="muted">{t('settings.data.text')}</p>

        <div className="inline-actions inline-actions--wrap">
          <button type="button" className="btn btn--secondary" onClick={exportBackup}>
            {t('settings.data.export')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => backupInputRef.current?.click()}
          >
            {t('settings.data.import')}
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label={t('settings.data.import')}
            tabIndex={-1}
            onChange={importBackup}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={clearResults}
            disabled={state.results.length === 0}
          >
            {t('settings.data.clearResults')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--danger-text"
            onClick={resetData}
          >
            {t('settings.data.reset')}
          </button>
        </div>
      </section>
    </div>
  )
}
