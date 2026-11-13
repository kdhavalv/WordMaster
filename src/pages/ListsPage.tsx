import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { STARTER_LIST } from '../data/starterWords'
import { downloadJson, readJsonFile } from '../lib/files'
import { sanitizeLists } from '../lib/storage'
import { createId, isRecord } from '../lib/utils'
import { useAppState } from '../state/appContext'
import type { WordList } from '../types'

type Message = {
  tone: 'info' | 'error'
  text: string
}

function extractListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data
  }

  if (isRecord(data) && Array.isArray(data.lists)) {
    return data.lists
  }

  return [data]
}

export function ListsPage() {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  function duplicateList(list: WordList) {
    const now = new Date().toISOString()
    const copy: WordList = {
      ...list,
      id: createId(),
      name: `${list.name} (Kopie)`,
      createdAt: now,
      updatedAt: now,
    }

    dispatch({ type: 'addList', list: copy })
    navigate(`/listen/${copy.id}`)
  }

  function deleteList(list: WordList) {
    const confirmed = window.confirm(`Liste „${list.name}“ wirklich löschen?`)

    if (confirmed) {
      dispatch({ type: 'deleteList', id: list.id })
      setMessage({ tone: 'info', text: 'Liste gelöscht.' })
    }
  }

  function exportAllLists() {
    const today = new Date().toISOString().slice(0, 10)

    downloadJson(`wortmeister-listen-${today}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      lists: state.lists,
    })
  }

  async function importLists(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const data = await readJsonFile(file)
      const imported = sanitizeLists(extractListPayload(data)).map((list) => ({
        ...list,
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      if (imported.length === 0) {
        setMessage({ tone: 'error', text: 'In der Datei wurden keine gültigen Listen gefunden.' })
        return
      }

      dispatch({ type: 'addLists', lists: imported })
      setMessage({
        tone: 'info',
        text: `${imported.length} ${imported.length === 1 ? 'Liste' : 'Listen'} importiert.`,
      })
    } catch {
      setMessage({ tone: 'error', text: 'Die Datei konnte nicht gelesen werden.' })
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Wortlisten</p>
          <h1>Deine Wörter</h1>
          <p className="page-heading__text">
            Lege eigene Listen an, bearbeite sie oder nutze die Beispiel-Liste als Ausgangspunkt.
          </p>
        </div>
        <div className="page-heading__actions">
          <Link className="btn btn--primary" to="/listen/neu">
            Neue Liste
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Importieren
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={exportAllLists}
            disabled={state.lists.length === 0}
          >
            Exportieren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={importLists}
          />
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

      <section className="panel" aria-labelledby="starter-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vorlage</p>
            <h2 id="starter-heading">{STARTER_LIST.name}</h2>
          </div>
          <span className="badge badge--soft">{STARTER_LIST.words.length} Wörter</span>
        </div>
        <p className="muted">
          Häufige Wörter mit schwierigen Stellen: Dehnungs-h, Doppelkonsonanten, ä/äu,
          s/ss/ß, v/f und Auslaut d/t.
        </p>
        <details className="word-preview">
          <summary>Wörter anzeigen</summary>
          <ul className="word-chips">
            {STARTER_LIST.words.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        </details>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => duplicateList(STARTER_LIST)}
          >
            Kopie bearbeiten
          </button>
        </div>
      </section>

      <section aria-labelledby="own-lists-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Eigene Listen</p>
            <h2 id="own-lists-heading">Meine Listen</h2>
          </div>
          <span className="badge badge--soft">{state.lists.length}</span>
        </div>

        {state.lists.length === 0 ? (
          <div className="panel empty-state">
            <p>Du hast noch keine eigene Liste.</p>
            <Link className="btn btn--primary" to="/listen/neu">
              Erste Liste anlegen
            </Link>
          </div>
        ) : (
          <div className="list-grid">
            {state.lists.map((list) => (
              <article key={list.id} className="panel list-card">
                <div className="list-card__head">
                  <h3>{list.name}</h3>
                  <span className="badge badge--soft">{list.words.length} Wörter</span>
                </div>
                <p className="list-card__preview">{list.words.slice(0, 8).join(' · ')}</p>
                <details className="word-preview">
                  <summary>Alle Wörter anzeigen</summary>
                  <ul className="word-chips">
                    {list.words.map((word) => (
                      <li key={word}>{word}</li>
                    ))}
                  </ul>
                </details>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => navigate(`/listen/${list.id}`)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => duplicateList(list)}
                  >
                    Duplizieren
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small btn--danger-text"
                    onClick={() => deleteList(list)}
                  >
                    Löschen
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
