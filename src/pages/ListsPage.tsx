import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { STARTER_LIST } from '../data/starterWords'
import { useI18n, usePageTitle } from '../i18n'
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
  const { t, plural, formatNumber } = useI18n()
  const navigate = useNavigate()
  usePageTitle(t('meta.listsTitle'))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  function displayName(list: WordList): string {
    return list.id === STARTER_LIST.id ? t('starter.name') : list.name
  }

  function wordCountLabel(count: number): string {
    return plural(count, 'common.wordOne', 'common.wordMany', {
      count: formatNumber(count),
    })
  }

  function duplicateList(list: WordList) {
    const now = new Date().toISOString()
    const copy: WordList = {
      ...list,
      id: createId(),
      name: `${displayName(list)} (${t('common.copySuffix')})`,
      createdAt: now,
      updatedAt: now,
    }

    dispatch({ type: 'addList', list: copy })
    navigate(`/listen/${copy.id}`)
  }

  function deleteList(list: WordList) {
    const confirmed = window.confirm(
      t('lists.deleteConfirm', { name: displayName(list) }),
    )

    if (confirmed) {
      dispatch({ type: 'deleteList', id: list.id })
      setMessage({ tone: 'info', text: t('lists.deleted') })
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
        setMessage({ tone: 'error', text: t('lists.importEmpty') })
        return
      }

      dispatch({ type: 'addLists', lists: imported })
      setMessage({
        tone: 'info',
        text: t(imported.length === 1 ? 'lists.importedOne' : 'lists.importedMany', {
          count: formatNumber(imported.length),
        }),
      })
    } catch {
      setMessage({ tone: 'error', text: t('lists.readError') })
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('lists.eyebrow')}</p>
          <h1>{t('lists.title')}</h1>
          <p className="page-heading__text">{t('lists.text')}</p>
        </div>
        <div className="page-heading__actions">
          <Link className="btn btn--primary" to="/listen/neu">
            {t('lists.new')}
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('common.import')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={exportAllLists}
            disabled={state.lists.length === 0}
          >
            {t('common.export')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label={t('common.import')}
            tabIndex={-1}
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
            <p className="eyebrow">{t('starter.template')}</p>
            <h2 id="starter-heading">{t('starter.name')}</h2>
          </div>
          <span className="badge badge--soft">
            {wordCountLabel(STARTER_LIST.words.length)}
          </span>
        </div>
        <p className="muted">{t('starter.description')}</p>
        <details className="word-preview">
          <summary>{t('common.showWords')}</summary>
          <ul className="word-chips">
            {STARTER_LIST.words.map((word) => (
              <li key={word} lang="de-DE">
                {word}
              </li>
            ))}
          </ul>
        </details>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => duplicateList(STARTER_LIST)}
          >
            {t('starter.copy')}
          </button>
        </div>
      </section>

      <section aria-labelledby="own-lists-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('lists.ownEyebrow')}</p>
            <h2 id="own-lists-heading">{t('lists.ownHeading')}</h2>
          </div>
          <span className="badge badge--soft">{formatNumber(state.lists.length)}</span>
        </div>

        {state.lists.length === 0 ? (
          <div className="panel empty-state empty-state--with-mascot">
            <Mascot className="empty-state__mascot" />
            <p>{t('lists.empty')}</p>
            <Link className="btn btn--primary" to="/listen/neu">
              {t('lists.first')}
            </Link>
          </div>
        ) : (
          <div className="list-grid">
            {state.lists.map((list) => (
              <article key={list.id} className="panel list-card">
                <div className="list-card__head">
                  <h3>{list.name}</h3>
                  <span className="badge badge--soft">
                    {wordCountLabel(list.words.length)}
                  </span>
                </div>
                <p className="list-card__preview" lang="de-DE">
                  {list.words.slice(0, 8).join(' · ')}
                </p>
                <details className="word-preview">
                  <summary>{t('common.showAllWords')}</summary>
                  <ul className="word-chips">
                    {list.words.map((word) => (
                      <li key={word} lang="de-DE">
                        {word}
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => navigate(`/listen/${list.id}`)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => duplicateList(list)}
                  >
                    {t('common.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small btn--danger-text"
                    onClick={() => deleteList(list)}
                  >
                    {t('common.delete')}
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
