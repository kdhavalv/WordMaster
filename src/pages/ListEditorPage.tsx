import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadJson } from '../lib/files'
import { createId, fileSafeName } from '../lib/utils'
import { parseWordInput } from '../lib/words'
import { useAppState } from '../state/appContext'
import type { WordList } from '../types'

export function ListEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useAppState()
  const existing = id ? state.lists.find((list) => list.id === id) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [wordsText, setWordsText] = useState(existing?.words.join('\n') ?? '')
  const [error, setError] = useState<string | null>(null)

  const parsedWords = parseWordInput(wordsText)
  const rawLineCount = wordsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length
  const duplicateCount = Math.max(0, rawLineCount - parsedWords.length)

  if (id && !existing) {
    return (
      <div className="page page--narrow">
        <section className="panel empty-state">
          <h1>Liste nicht gefunden</h1>
          <p>Diese Wortliste gibt es nicht mehr.</p>
          <Link className="btn btn--primary" to="/listen">
            Zu den Wortlisten
          </Link>
        </section>
      </div>
    )
  }

  function saveList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Bitte gib der Liste einen Namen.')
      return
    }

    if (parsedWords.length === 0) {
      setError('Bitte trage mindestens ein Wort ein.')
      return
    }

    const now = new Date().toISOString()

    if (existing) {
      dispatch({
        type: 'updateList',
        list: {
          ...existing,
          name: trimmedName,
          words: parsedWords,
          updatedAt: now,
        },
      })
    } else {
      const list: WordList = {
        id: createId(),
        name: trimmedName,
        words: parsedWords,
        createdAt: now,
        updatedAt: now,
      }

      dispatch({ type: 'addList', list })
    }

    navigate('/listen')
  }

  function deleteList() {
    if (!existing) {
      return
    }

    const confirmed = window.confirm(`Liste „${existing.name}“ wirklich löschen?`)

    if (confirmed) {
      dispatch({ type: 'deleteList', id: existing.id })
      navigate('/listen')
    }
  }

  function exportList() {
    if (!existing) {
      return
    }

    const listToExport: WordList = {
      ...existing,
      name: name.trim() || existing.name,
      words: parsedWords.length > 0 ? parsedWords : existing.words,
    }

    downloadJson(`${fileSafeName(listToExport.name)}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      lists: [listToExport],
    })
  }

  return (
    <div className="page page--narrow">
      <Link className="back-link" to="/listen">
        ← Zurück zu den Wortlisten
      </Link>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{existing ? 'Bearbeiten' : 'Neu'}</p>
            <h1>{existing ? 'Wortliste bearbeiten' : 'Neue Wortliste'}</h1>
          </div>
        </div>

        <form className="form-stack" onSubmit={saveList}>
          <label className="field">
            <span>Name der Liste</span>
            <input
              type="text"
              value={name}
              maxLength={80}
              placeholder="z. B. Wörter vom Montag"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Wörter</span>
            <textarea
              value={wordsText}
              rows={14}
              placeholder={'Fahrrad\nSchule\nStraße\nkommen'}
              onChange={(event) => setWordsText(event.target.value)}
            />
          </label>

          <div className="editor-meta">
            <span>
              <strong>{parsedWords.length}</strong>{' '}
              {parsedWords.length === 1 ? 'Wort' : 'Wörter'}
            </span>
            <span>Ein Wort pro Zeile.</span>
            {duplicateCount > 0 && (
              <span>{duplicateCount} doppelte Einträge werden entfernt.</span>
            )}
          </div>

          {error && (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary">
              Speichern
            </button>
            <Link className="btn btn--secondary" to="/listen">
              Abbrechen
            </Link>
            {existing && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={exportList}
              >
                Exportieren
              </button>
            )}
            {existing && (
              <button
                type="button"
                className="btn btn--ghost btn--danger-text"
                onClick={deleteList}
              >
                Liste löschen
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
