import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ListEditorRoute } from '../App'
import { renderWithProviders } from '../test/render'
import type { WordList } from '../types'

const lists: WordList[] = [
  {
    id: 'list-a',
    name: 'Liste A',
    words: ['Fahrrad'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'list-b',
    name: 'Liste B',
    words: ['Schule'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

function NavigateToB() {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate('/listen/list-b')}>
      go to b
    </button>
  )
}

describe('ListEditorRoute', () => {
  it('resets the editor when navigating directly between list ids', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <>
        <NavigateToB />
        <Routes>
          <Route path="/listen/:id" element={<ListEditorRoute />} />
        </Routes>
      </>,
      { route: '/listen/list-a', lists },
    )

    expect(await screen.findByDisplayValue('Liste A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fahrrad')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'go to b' }))

    expect(await screen.findByDisplayValue('Liste B')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Schule')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Fahrrad')).not.toBeInTheDocument()
  })
})
