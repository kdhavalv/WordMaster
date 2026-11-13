import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSpeech } from '../hooks/useSpeech'
import { createBackup, parseBackup } from '../lib/backup'
import { downloadJson, readJsonFile } from '../lib/files'
import { useAppState } from '../state/appContext'
import type { Settings } from '../types'

type Message = {
  tone: 'info' | 'error'
  text: string
}

export function SettingsPage() {
  const { state, dispatch } = useAppState()
  const speech = useSpeech(state.settings.voiceURI, state.settings.rate)
  const backupInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  const selectedVoiceURI = speech.germanVoices.some(
    (voice) => voice.voiceURI === state.settings.voiceURI,
  )
    ? state.settings.voiceURI ?? ''
    : ''
  const rateLabel = state.settings.rate.toFixed(2).replace('.', ',')
  const hasGermanVoice = speech.germanVoices.length > 0

  function updateSettings(patch: Partial<Settings>) {
    dispatch({ type: 'updateSettings', settings: patch })
  }

  function exportBackup() {
    const today = new Date().toISOString().slice(0, 10)

    downloadJson(
      `wortmeister-backup-${today}.json`,
      createBackup(state.lists, state.results, state.settings),
    )
    setMessage({ tone: 'info', text: 'Backup wurde erstellt.' })
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
        setMessage({ tone: 'error', text: 'Die Datei ist kein gültiges Wortmeister-Backup.' })
        return
      }

      const confirmed = window.confirm(
        'Backup importieren? Die aktuellen Listen, Ergebnisse und Einstellungen werden ersetzt.',
      )

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
      setMessage({ tone: 'info', text: 'Backup wurde wiederhergestellt.' })
    } catch {
      setMessage({ tone: 'error', text: 'Die Datei konnte nicht gelesen werden.' })
    }
  }

  function clearResults() {
    if (window.confirm('Ergebnisverlauf wirklich löschen?')) {
      dispatch({ type: 'clearResults' })
      setMessage({ tone: 'info', text: 'Ergebnisverlauf gelöscht.' })
    }
  }

  function resetData() {
    if (
      window.confirm(
        'Wirklich alle Listen, Ergebnisse und Einstellungen löschen? Die Beispiel-Liste bleibt erhalten.',
      )
    ) {
      dispatch({ type: 'resetData' })
      setMessage({ tone: 'info', text: 'Alle Daten wurden zurückgesetzt.' })
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Einstellungen</p>
          <h1>So soll Wortmeister klingen</h1>
          <p className="page-heading__text">
            Änderungen werden sofort gespeichert und bleiben auf diesem Gerät.
          </p>
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

      <section className="panel" aria-labelledby="speech-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sprachausgabe</p>
            <h2 id="speech-heading">Stimme</h2>
          </div>
        </div>

        {!speech.supported && (
          <p className="notice notice--error" role="alert">
            Dieser Browser unterstützt keine Sprachausgabe. Das Aufdecken und Markieren
            funktioniert trotzdem.
          </p>
        )}

        {speech.supported && !hasGermanVoice && (
          <p className="notice notice--warning" role="alert">
            Keine deutsche Stimme gefunden. Installiere eine deutsche Stimme in den
            Systemeinstellungen oder nutze einen Browser mit deutscher Sprachausgabe.
          </p>
        )}

        {speech.error && (
          <p className="notice notice--error" role="alert">
            {speech.error}
          </p>
        )}

        <div className="form-stack">
          <label className="field">
            <span>Deutsche Stimme</span>
            <select
              value={selectedVoiceURI}
              onChange={(event) =>
                updateSettings({ voiceURI: event.target.value || undefined })
              }
              disabled={!speech.supported || !hasGermanVoice}
            >
              <option value="">Automatisch</option>
              {speech.germanVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>
              Sprechgeschwindigkeit <strong>{rateLabel}×</strong>
            </span>
            <input
              type="range"
              min={0.6}
              max={1.2}
              step={0.05}
              value={state.settings.rate}
              onChange={(event) => updateSettings({ rate: Number(event.target.value) })}
            />
            <span className="field__hint">Langsamer links, schneller rechts.</span>
          </label>

          <div className="inline-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={speech.test}
              disabled={!speech.supported}
            >
              {speech.speaking ? 'Wird abgespielt …' : 'Stimme testen'}
            </button>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.settings.autoPlay}
              onChange={(event) => updateSettings({ autoPlay: event.target.checked })}
            />
            <span>Nächstes Wort automatisch abspielen</span>
          </label>
        </div>
      </section>

      <section className="panel" aria-labelledby="defaults-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Voreinstellungen</p>
            <h2 id="defaults-heading">Neue Runden</h2>
          </div>
        </div>

        <div className="form-stack">
          <label className="field">
            <span>Wörter pro Runde</span>
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
            <span>Wörter standardmäßig mischen</span>
          </label>
        </div>
      </section>

      <section className="panel" aria-labelledby="data-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Daten</p>
            <h2 id="data-heading">Sichern und zurücksetzen</h2>
          </div>
        </div>
        <p className="muted">
          Alles bleibt in diesem Browser gespeichert. Ein Backup enthält deine Listen,
          Ergebnisse und Einstellungen.
        </p>

        <div className="inline-actions inline-actions--wrap">
          <button type="button" className="btn btn--secondary" onClick={exportBackup}>
            Backup exportieren
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => backupInputRef.current?.click()}
          >
            Backup importieren
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={importBackup}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={clearResults}
            disabled={state.results.length === 0}
          >
            Ergebnisverlauf löschen
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--danger-text"
            onClick={resetData}
          >
            Alle Daten zurücksetzen
          </button>
        </div>
      </section>
    </div>
  )
}
