import { describe, expect, it, vi } from 'vitest'
import {
  defaultSettings,
  loadLists,
  loadSettings,
  sanitizeLists,
  sanitizeResults,
  sanitizeSettings,
  saveLists,
} from './storage'

describe('storage sanitizers', () => {
  it('defaults missing or invalid language to German', () => {
    expect(sanitizeSettings({}).language).toBe('de')
    expect(sanitizeSettings({ language: 'fr' }).language).toBe('de')
    expect(sanitizeSettings({ language: 'en' }).language).toBe('en')
  })

  it('clamps settings to supported ranges', () => {
    const settings = sanitizeSettings({
      language: 'en',
      rate: 3,
      defaultWordCount: 500,
      autoPlay: 'yes',
      shuffle: false,
    })

    expect(settings.rate).toBe(1.2)
    expect(settings.defaultWordCount).toBe(50)
    expect(settings.autoPlay).toBe(defaultSettings.autoPlay)
    expect(settings.shuffle).toBe(false)
  })

  it('drops invalid lists and deduplicates ids', () => {
    const lists = sanitizeLists([
      { id: 'same', name: 'One', words: ['a'] },
      { id: 'same', name: 'Two', words: ['b'] },
      { id: 'bad', name: '', words: ['c'] },
    ])

    expect(lists).toHaveLength(2)
    expect(lists[0].id).not.toBe(lists[1].id)
  })

  it('drops invalid results and clamps correct counts', () => {
    const results = sanitizeResults([
      {
        mode: 'practice',
        total: 2,
        correct: 99,
        wrongWords: ['b', 3],
        listName: 'List',
      },
      { mode: 'unknown', total: 2 },
    ])

    expect(results).toHaveLength(1)
    expect(results[0].correct).toBe(2)
    expect(results[0].wrongWords).toEqual(['b'])
  })

  it('recovers from malformed JSON', () => {
    window.localStorage.setItem('wordmaster.lists.v1', '{not json')

    expect(loadLists()).toEqual([])
    expect(loadSettings()).toEqual(defaultSettings)
  })
})

describe('storage writes', () => {
  it('reports quota failures instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    expect(saveLists([])).toEqual({ ok: false, error: 'quota' })
  })

  it('reports unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(saveLists([])).toEqual({ ok: false, error: 'unavailable' })
  })

  it('returns ok after a successful write', () => {
    expect(saveLists([])).toEqual({ ok: true })
  })
})
