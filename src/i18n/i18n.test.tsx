import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { de } from './de'
import { en } from './en'
import { I18nProvider, useI18n } from './index'
import { AppStateProvider } from '../state/AppState'

function Probe() {
  const { locale, setLocale, t, plural, formatPercent } = useI18n()

  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="title">{t('home.startHeading')}</p>
      <p data-testid="plural-one">
        {plural(1, 'common.wordOne', 'common.wordMany', { count: '1' })}
      </p>
      <p data-testid="plural-many">
        {plural(2, 'common.wordOne', 'common.wordMany', { count: '2' })}
      </p>
      <p data-testid="percent">{formatPercent(0.5)}</p>
      <button type="button" onClick={() => setLocale('en')}>
        switch
      </button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AppStateProvider>
      <I18nProvider>
        <Probe />
      </I18nProvider>
    </AppStateProvider>,
  )
}

describe('dictionaries', () => {
  it('have the same keys in German and English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
  })

  it('contain no empty translations', () => {
    for (const dictionary of [de, en]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value, key).not.toBe('')
      }
    }
  })
})

describe('I18nProvider', () => {
  it('starts in German and switches every string to English', async () => {
    renderProbe()

    expect(screen.getByTestId('locale')).toHaveTextContent('de')
    expect(screen.getByTestId('title')).toHaveTextContent('Neue Runde starten')
    expect(document.documentElement.lang).toBe('de')

    act(() => {
      screen.getByRole('button', { name: 'switch' }).click()
    })

    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent('Start a new round')
    expect(screen.getByTestId('plural-one')).toHaveTextContent('1 word')
    expect(screen.getByTestId('plural-many')).toHaveTextContent('2 words')
    expect(screen.getByTestId('percent')).toHaveTextContent('50%')

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en')
      expect(window.localStorage.getItem('wordmaster.settings.v1')).toContain(
        '"language":"en"',
      )
    })
  })

  it('keeps German number formatting in German', () => {
    renderProbe()

    expect(screen.getByTestId('percent')).toHaveTextContent('50')
    expect(screen.getByTestId('plural-many')).toHaveTextContent('2 Wörter')
  })
})
