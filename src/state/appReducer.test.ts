import { describe, expect, it } from 'vitest'
import { appReducer, createInitialState } from './appReducer'
import type { AppData } from './appReducer'

describe('appReducer storage status', () => {
  const base: AppData = {
    lists: [],
    results: [],
    settings: createInitialState().settings,
    storageErrors: {},
    lastSaved: {},
  }

  it('records the saved value only after a successful write', () => {
    const value = [1, 2, 3]
    const saved = appReducer(base, {
      type: 'setStorageStatus',
      area: 'results',
      error: null,
      value,
    })

    expect(saved.lastSaved.results).toBe(value)
    expect(saved.storageErrors.results).toBeUndefined()
  })

  it('keeps the previous saved value and records an error after a failed write', () => {
    const previous = [1]
    const state = {
      ...base,
      lastSaved: { results: previous },
    }
    const failed = appReducer(state, {
      type: 'setStorageStatus',
      area: 'results',
      error: 'quota',
      value: [2],
    })

    expect(failed.lastSaved.results).toBe(previous)
    expect(failed.storageErrors.results).toBe('quota')
  })

  it('clears only the error when dismissed', () => {
    const state = { ...base, storageErrors: { lists: 'quota' as const } }
    const dismissed = appReducer(state, { type: 'dismissStorageErrors' })

    expect(dismissed.storageErrors).toEqual({})
  })

  it('restores data with no stale storage status', () => {
    const state = {
      ...base,
      storageErrors: { lists: 'quota' as const },
      lastSaved: { lists: [1] },
    }
    const restored = appReducer(state, {
      type: 'restoreData',
      data: { lists: [], results: [], settings: base.settings },
    })

    expect(restored.storageErrors).toEqual({})
    expect(restored.lastSaved).toEqual({})
  })
})
