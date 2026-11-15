import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n, usePageTitle } from '../i18n'
import { downloadJson } from '../lib/files'
import { createId, fileSafeName } from '../lib/utils'
import { parseWordInput } from '../lib/words'
import { useAppState } from '../state/appContext'
import type { WordList } from '../types'

type EditorError = 'name' | 'words' | null

function nowIso(): string {
  return new Date().toISOString()
}

export function ListEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useAppState()
  const { t, plural, formatNumber } = useI18n()
  const existing = id ? state.lists.find((list) => list.id === id) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [wordsText, setWordsText] = useState(existing?.words.join('\n') ?? '')
  const [error, setError] = useState<EditorError>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const wordsInputRef = useRef<HTMLTextAreaElement>(null)

  usePageTitle(t(existing ? 'meta.editorTitle' : 'meta.newListTitle'))

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
          <h1>{t('editor.notFoundTitle')}</h1>
          <p>{t('editor.notFoundText')}</p>
          <Link className="btn btn--primary" to="/listen">
            {t('editor.toLists')}
          </Link>
        </section>
      </div>
    )
  }

  function saveList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('name')
      nameInputRef.current?.focus()
      return
    }

    if (parsedWords.length === 0) {
      setError('words')
      wordsInputRef.current?.focus()
      return
    }

    const now = nowIso()

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

    const confirmed = window.confirm(
      t('editor.deleteConfirm', { name: existing.name }),
    )

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
      exportedAt: nowIso(),
      lists: [listToExport],
    })
  }

  const errorMessage =
    error === 'name'
      ? t('editor.errorName')
      : error === 'words'
        ? t('editor.errorWords')
        : null

  return (
    <div className="page page--narrow">
      <Link className="back-link" to="/listen">
        ← {t('editor.back')}
      </Link>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t(existing ? 'editor.eyebrowEdit' : 'editor.eyebrowNew')}
            </p>
            <h1>{t(existing ? 'editor.titleEdit' : 'editor.titleNew')}</h1>
          </div>
        </div>

        <form className="form-stack" onSubmit={saveList} noValidate>
          <label className="field">
            <span>{t('editor.nameLabel')}</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              maxLength={80}
              placeholder={t('editor.namePlaceholder')}
              aria-invalid={error === 'name'}
              aria-describedby={error === 'name' ? 'editor-error' : undefined}
              onChange={(event) => {
                setName(event.target.value)
                if (error === 'name') {
                  setError(null)
                }
              }}
            />
          </label>

          <label className="field">
            <span>{t('editor.wordsLabel')}</span>
            <textarea
              ref={wordsInputRef}
              value={wordsText}
              rows={14}
              placeholder={t('editor.wordsPlaceholder')}
              aria-invalid={error === 'words'}
              aria-describedby={error === 'words' ? 'editor-error' : undefined}
              onChange={(event) => {
                setWordsText(event.target.value)
                if (error === 'words') {
                  setError(null)
                }
              }}
            />
          </label>

          <div className="editor-meta">
            <span>
              {plural(parsedWords.length, 'common.wordOne', 'common.wordMany', {
                count: formatNumber(parsedWords.length),
              })}
            </span>
            <span>{t('common.onePerLine')}</span>
            {duplicateCount > 0 && (
              <span>
                {t(
                  duplicateCount === 1
                    ? 'editor.duplicatesOne'
                    : 'editor.duplicatesMany',
                  { count: formatNumber(duplicateCount) },
                )}
              </span>
            )}
          </div>

          {errorMessage && (
            <p id="editor-error" className="notice notice--error" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary">
              {t('common.save')}
            </button>
            <Link className="btn btn--secondary" to="/listen">
              {t('common.cancel')}
            </Link>
            {existing && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={exportList}
              >
                {t('common.export')}
              </button>
            )}
            {existing && (
              <button
                type="button"
                className="btn btn--ghost btn--danger-text"
                onClick={deleteList}
              >
                {t('editor.delete')}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
