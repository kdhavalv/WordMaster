import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import {
  CURATED_TEXT_KEYS,
  LEVEL_PACKS,
  STARTER_LIST_ID,
  THEME_PACKS,
  TYPE_PACKS,
} from '../data/wordBank'
import { useI18n, usePageTitle } from '../i18n'
import { sampleWords } from '../lib/words'
import { useAppState } from '../state/appContext'
import type { SessionMode, WordList } from '../types'

export function HomePage() {
  const { state } = useAppState()
  const { t, plural, formatDate, formatNumber, formatPercent } = useI18n()
  const navigate = useNavigate()
  usePageTitle(t('meta.homeTitle'))
  const curatedIdSet = new Set([...LEVEL_PACKS, ...THEME_PACKS, ...TYPE_PACKS].map((list) => list.id))
  const customLists = state.lists.filter((list) => !curatedIdSet.has(list.id))
  const allLists = [...LEVEL_PACKS, ...THEME_PACKS, ...TYPE_PACKS, ...customLists]
  const [selectedId, setSelectedId] = useState(STARTER_LIST_ID)
  const [wordCount, setWordCount] = useState(state.settings.defaultWordCount)
  const [shouldShuffle, setShouldShuffle] = useState(state.settings.shuffle)

  const selectedList = allLists.find((list) => list.id === selectedId) ?? LEVEL_PACKS[1]
  const availableWords = selectedList.words.length
  const effectiveCount = Math.min(wordCount, availableWords)
  const canStart = availableWords > 0
  const recentResults = state.results.slice(0, 8)

  function displayName(list: WordList): string {
    const keys = CURATED_TEXT_KEYS[list.id]
    return keys ? t(keys.name as never) : list.name
  }

  function listOption(list: WordList): string {
    return t(
      list.words.length === 1 ? 'common.wordsInOptionOne' : 'common.wordsInOption',
      {
        name: displayName(list),
        count: formatNumber(list.words.length),
      },
    )
  }

  function startSession(mode: SessionMode) {
    const words = sampleWords(selectedList.words, wordCount, shouldShuffle)

    navigate('/session', {
      state: {
        listId: selectedList.id,
        listName: displayName(selectedList),
        words,
        allWords: selectedList.words,
        wordCount,
        mode,
        shuffle: shouldShuffle,
      },
    })
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.title')}</h1>
          <p className="hero__text">{t('home.text')}</p>
        </div>
        <div className="hero__visual hero__scene" aria-hidden="true">
          <span className="hero__sun" />
          <span className="hero__cloud hero__cloud--one" />
          <span className="hero__cloud hero__cloud--two" />
          <span className="hero__hill" />
          <span className="hero__sparkle hero__sparkle--one" />
          <span className="hero__sparkle hero__sparkle--two" />
          <Mascot mood="listen" className="hero__mascot" />
          <span className="hero__word hero__word--one" lang="de-DE">
            Fahrrad
          </span>
          <span className="hero__word hero__word--two" lang="de-DE">
            Schule
          </span>
          <span className="hero__word hero__word--three" lang="de-DE">
            Straße
          </span>
        </div>
      </section>

      <section className="panel start-panel" aria-labelledby="start-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('home.startEyebrow')}</p>
            <h2 id="start-heading">{t('home.startHeading')}</h2>
          </div>
          <span className="badge badge--soft">
            {selectedList.level ? `${t('common.level', { level: String(selectedList.level) })} · ` : ''}
            {plural(
              availableWords,
              'common.wordsInListOne',
              'common.wordsInListMany',
              { count: formatNumber(availableWords) },
            )}
          </span>
        </div>

        <div className="form-grid">
          <label className="field field--wide">
            <span>{t('home.listLabel')}</span>
            <select
              value={selectedList.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <optgroup label={t('home.category.levels' as never)}>
                {LEVEL_PACKS.map((list) => (
                  <option key={list.id} value={list.id}>
                    {listOption(list)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t('home.category.themes' as never)}>
                {THEME_PACKS.map((list) => (
                  <option key={list.id} value={list.id}>
                    {listOption(list)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t('home.category.types' as never)}>
                {TYPE_PACKS.map((list) => (
                  <option key={list.id} value={list.id}>
                    {listOption(list)}
                  </option>
                ))}
              </optgroup>
              {customLists.length > 0 && (
                <optgroup label={t('home.category.custom' as never)}>
                  {customLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {listOption(list)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="field">
            <span>{t('home.wordCount')}</span>
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
            <span>{t('home.shuffle')}</span>
          </label>
        </div>

        {effectiveCount < wordCount && (
          <p className="notice notice--info">
            {t(
              availableWords === 1 ? 'home.limitNoticeOne' : 'home.limitNoticeMany',
              { count: formatNumber(availableWords) },
            )}
          </p>
        )}

        <div className="mode-actions">
          <button
            type="button"
            className="mode-card mode-card--practice"
            onClick={() => startSession('practice')}
            disabled={!canStart}
          >
            <span className="mode-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
              </svg>
            </span>
            <span className="mode-card__label">{t('mode.practice')}</span>
            <strong>{t('home.practice.title')}</strong>
            <span className="mode-card__description">
              {t('home.practice.description')}
            </span>
            <span className="mode-card__cta">{t('home.practice.cta')}</span>
          </button>

          <button
            type="button"
            className="mode-card mode-card--exam"
            onClick={() => startSession('exam')}
            disabled={!canStart}
          >
            <span className="mode-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 4h6a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4M9 18h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="mode-card__label">{t('mode.exam')}</span>
            <strong>{t('home.exam.title')}</strong>
            <span className="mode-card__description">{t('home.exam.description')}</span>
            <span className="mode-card__cta">{t('home.exam.cta')}</span>
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="results-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('home.results.eyebrow')}</p>
            <h2 id="results-heading">{t('home.results.heading')}</h2>
          </div>
        </div>

        {recentResults.length === 0 ? (
          <p className="empty-state">{t('home.results.empty')}</p>
        ) : (
          <ul className="result-list">
            {recentResults.map((result) => {
              const percent = result.total > 0 ? result.correct / result.total : 0

              return (
                <li key={result.id} className="result-row">
                  <div className="result-row__main">
                    <strong>
                      {CURATED_TEXT_KEYS[result.listId]
                        ? t(CURATED_TEXT_KEYS[result.listId].name as never)
                        : result.listName}
                    </strong>
                    <span className="result-row__meta">
                      <span className={`badge badge--${result.mode}`}>
                        {t(result.mode === 'practice' ? 'mode.practice' : 'mode.exam')}
                      </span>
                      <span>{formatDate(result.date)}</span>
                    </span>
                  </div>
                  <div className="result-row__score">
                    <strong>
                      {formatNumber(result.correct)}/{formatNumber(result.total)}
                    </strong>
                    <span>{formatPercent(percent)}</span>
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
