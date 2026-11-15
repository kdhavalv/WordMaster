import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SessionPage } from './SessionPage'
import { renderWithProviders } from '../test/render'
import type { SessionConfig } from '../types'

function config(overrides: Partial<SessionConfig> = {}): SessionConfig {
  return {
    listId: 'list-1',
    listName: 'Testliste',
    words: ['Fahrrad', 'Schule'],
    allWords: ['Fahrrad', 'Schule', 'Straße'],
    wordCount: 2,
    mode: 'practice',
    shuffle: false,
    ...overrides,
  }
}

function renderSession(value: SessionConfig) {
  return renderWithProviders(<SessionPage />, {
    route: '/session',
    state: value,
    settings: { autoPlay: false },
  })
}

describe('SessionPage', () => {
  it('runs a practice round and saves a successful result', async () => {
    const user = userEvent.setup()
    renderSession(config())

    expect(screen.getByText('Wort 1 von 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Antwort zeigen' }))
    await user.click(screen.getByRole('button', { name: 'Richtig' }))
    await user.click(screen.getByRole('button', { name: 'Antwort zeigen' }))
    await user.click(screen.getByRole('button', { name: 'Falsch' }))

    expect(await screen.findByText('Weiter üben!')).toBeInTheDocument()
    expect(screen.getByText('Falsche Wörter üben')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByText('Das Ergebnis wurde lokal gespeichert.'),
      ).toBeInTheDocument()
    })
  })

  it('restarts a retry round in practice mode after an exam', async () => {
    const user = userEvent.setup()
    renderSession(config({ mode: 'exam' }))

    await user.click(screen.getByRole('button', { name: 'Weiter' }))
    await user.click(screen.getByRole('button', { name: 'Weiter zur Auswertung' }))

    const correctButtons = screen.getAllByRole('button', { name: 'Richtig' })
    const wrongButtons = screen.getAllByRole('button', { name: 'Falsch' })
    await user.click(correctButtons[0])
    await user.click(wrongButtons[1])
    await user.click(screen.getByRole('button', { name: 'Auswertung abschließen' }))

    expect(await screen.findByText('Prüfung beendet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Falsche Wörter üben' }))

    expect(screen.getByText('Wort 1 von 1')).toBeInTheDocument()
    expect(screen.getByText('Übung', { selector: '.badge' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Antwort zeigen' }))
    await user.click(screen.getByRole('button', { name: 'Falsch' }))

    expect(await screen.findByText('Übung beendet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Neue Übung' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Neue Prüfung' })).not.toBeInTheDocument()
  })

  it('shows a storage error and never claims the result was saved', async () => {
    const user = userEvent.setup()
    renderSession(config({ words: ['Fahrrad'] }))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    await user.click(screen.getByRole('button', { name: 'Antwort zeigen' }))
    await user.click(screen.getByRole('button', { name: 'Richtig' }))

    expect(
      await screen.findByText('Das Ergebnis konnte nicht gespeichert werden.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Das Ergebnis wurde lokal gespeichert.'),
    ).not.toBeInTheDocument()
  })
})
