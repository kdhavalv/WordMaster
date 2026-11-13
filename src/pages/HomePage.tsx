import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STARTER_LIST } from '../data/starterWords'
import { formatDate } from '../lib/utils'
import { sampleWords } from '../lib/words'
import { useAppState } from '../state/appContext'
import type { SessionMode } from '../types'

const modeLabels: Record<SessionMode, string> = {
  practice: 'Übung',
  exam: 'Prüfung',
}

export function HomePage() {
  const { state } = useAppState()
  const navigate = useNavigate()
  const lists = [STARTER_LIST, ...state.lists]
  const [selectedId, setSelectedId] = useState(STARTER_LIST.id)
  const [wordCount, setWordCount] = useState(state.settings.defaultWordCount)
  const [shouldShuffle, setShouldShuffle] = useState(state.settings.shuffle)

  const selectedList = lists.find((list) => list.id === selectedId) ?? STARTER_LIST
  const availableWords = selectedList.words.length
  const effectiveCount = Math.min(wordCount, availableWords)
  const canStart = availableWords > 0
  const recentResults = state.results.slice(0, 8)

  function startSession(mode: SessionMode) {
    const words = sampleWords(selectedList.words, wordCount, shouldShuffle)

    navigate('/session', {
      state: {
        listId: selectedList.id,
        listName: selectedList.name,
        words,
        allWords: selectedList.words,
        wordCount,
        mode,
      },
    })
  }

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Für die 4. Klasse</p>
        <h1>Wörter hören. Auf Papier schreiben. Gemeinsam prüfen.</h1>
        <p className="hero__text">
          Wortmeister liest die Wörter laut vor. Dein Kind schreibt sie auf Papier,
          du deckst die richtige Schreibweise auf und markierst, ob es geklappt hat.
        </p>
      </section>

      <section className="panel start-panel" aria-labelledby="start-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Los geht&apos;s</p>
            <h2 id="start-heading">Neue Runde starten</h2>
          </div>
          <span className="badge badge--soft">{availableWords} Wörter in der Liste</span>
        </div>

        <div className="form-grid">
          <label className="field field--wide">
            <span>Wortliste</span>
            <select
              value={selectedList.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value={STARTER_LIST.id}>
                {STARTER_LIST.name} – {STARTER_LIST.words.length} Wörter
              </option>
              {state.lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} – {list.words.length} Wörter
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Anzahl der Wörter</span>
            <input
              type="number"
              min={1}
              max={50}
              value={wordCount}
              onChange={(event) => {
                const value = Number(event.target.value)
                setWordCount(Number.isFinite(value) ? Math.min(50, Math.max(1, value)) : 1)
              }}
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={shouldShuffle}
              onChange={(event) => setShouldShuffle(event.target.checked)}
            />
            <span>Wörter mischen</span>
          </label>
        </div>

        {effectiveCount < wordCount && (
          <p className="notice notice--info">
            Die Liste enthält nur {availableWords} Wörter. Es werden alle verwendet.
          </p>
        )}

        <div className="mode-actions">
          <button
            type="button"
            className="mode-card mode-card--practice"
            onClick={() => startSession('practice')}
            disabled={!canStart}
          >
            <span className="mode-card__label">Übung</span>
            <strong>Antwort direkt prüfen</strong>
            <span className="mode-card__description">
              Nach jedem Wort die richtige Schreibweise aufdecken und markieren.
            </span>
            <span className="mode-card__cta">Übung starten</span>
          </button>

          <button
            type="button"
            className="mode-card mode-card--exam"
            onClick={() => startSession('exam')}
            disabled={!canStart}
          >
            <span className="mode-card__label">Prüfung</span>
            <strong>Alle Wörter am Stück</strong>
            <span className="mode-card__description">
              Erst schreiben, am Ende gemeinsam auswerten – wie ein echtes Diktat.
            </span>
            <span className="mode-card__cta">Prüfung starten</span>
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="results-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fortschritt</p>
            <h2 id="results-heading">Letzte Ergebnisse</h2>
          </div>
        </div>

        {recentResults.length === 0 ? (
          <p className="empty-state">
            Noch keine Ergebnisse. Starte die erste Übung oder Prüfung.
          </p>
        ) : (
          <ul className="result-list">
            {recentResults.map((result) => {
              const percent =
                result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0

              return (
                <li key={result.id} className="result-row">
                  <div className="result-row__main">
                    <strong>{result.listName}</strong>
                    <span className="result-row__meta">
                      <span className={`badge badge--${result.mode}`}>
                        {modeLabels[result.mode]}
                      </span>
                      <span>{formatDate(result.date)}</span>
                    </span>
                  </div>
                  <div className="result-row__score">
                    <strong>
                      {result.correct}/{result.total}
                    </strong>
                    <span>{percent}%</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
