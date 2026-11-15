import axe from 'axe-core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HomePage } from '../pages/HomePage'
import { ListEditorPage } from '../pages/ListEditorPage'
import { ListsPage } from '../pages/ListsPage'
import { SessionPage } from '../pages/SessionPage'
import { SettingsPage } from '../pages/SettingsPage'
import { renderWithProviders } from './render'
import type { SessionConfig, WordList } from '../types'

const list: WordList = {
  id: 'list-a',
  name: 'Testliste',
  words: ['Fahrrad', 'Schule'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const session: SessionConfig = {
  listId: list.id,
  listName: list.name,
  words: list.words,
  allWords: list.words,
  wordCount: 2,
  mode: 'practice',
  shuffle: false,
}

async function expectNoWcagViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  })

  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

describe('automated accessibility checks', () => {
  it('home has no WCAG A/AA violations', async () => {
    const { container } = renderWithProviders(<HomePage />, { lists: [list] })
    await expectNoWcagViolations(container)
  })

  it('lists has no WCAG A/AA violations', async () => {
    const { container } = renderWithProviders(<ListsPage />, { lists: [list] })
    await expectNoWcagViolations(container)
  })

  it('new list editor has no WCAG A/AA violations', async () => {
    const { container } = renderWithProviders(<ListEditorPage />, {
      route: '/listen/neu',
    })
    await expectNoWcagViolations(container)
  })

  it('settings has no WCAG A/AA violations', async () => {
    const { container } = renderWithProviders(<SettingsPage />)
    await expectNoWcagViolations(container)
  })

  it('session word screen has no WCAG A/AA violations', async () => {
    const { container } = renderWithProviders(<SessionPage />, {
      route: '/session',
      state: session,
      settings: { autoPlay: false },
    })
    await expectNoWcagViolations(container)
  })

  it('session review screen has no WCAG A/AA violations', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<SessionPage />, {
      route: '/session',
      state: { ...session, mode: 'exam' },
      settings: { autoPlay: false },
    })

    await user.click(screen.getByRole('button', { name: 'Weiter' }))
    await user.click(screen.getByRole('button', { name: 'Weiter zur Auswertung' }))
    await expectNoWcagViolations(container)
  })
})
