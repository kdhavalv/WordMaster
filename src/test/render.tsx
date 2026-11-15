import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n'
import { AppStateProvider } from '../state/AppState'
import type { Locale, Settings, WordList } from '../types'

type RenderOptions = {
  locale?: Locale
  settings?: Partial<Settings>
  lists?: WordList[]
  route?: string
  state?: unknown
}

export function renderWithProviders(
  ui: ReactElement,
  {
    locale = 'de',
    settings,
    lists = [],
    route = '/',
    state,
  }: RenderOptions = {},
) {
  window.localStorage.setItem(
    'wordmaster.settings.v1',
    JSON.stringify({ language: locale, ...settings }),
  )
  window.localStorage.setItem('wordmaster.lists.v1', JSON.stringify(lists))

  return render(
    <AppStateProvider>
      <I18nProvider>
        <MemoryRouter initialEntries={[{ pathname: route, state }]}>
          {ui}
        </MemoryRouter>
      </I18nProvider>
    </AppStateProvider>,
  )
}
