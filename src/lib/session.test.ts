import { describe, expect, it } from 'vitest'
import { createSessionResult, summarize } from './session'

describe('summarize', () => {
  it('counts correct marks and treats missing marks as wrong', () => {
    expect(summarize(['a', 'b', 'c'], [true, false, undefined])).toEqual({
      correct: 1,
      total: 3,
      wrongWords: ['b', 'c'],
      percent: 33,
    })
  })

  it('handles an empty session', () => {
    expect(summarize([], [])).toEqual({
      correct: 0,
      total: 0,
      wrongWords: [],
      percent: 0,
    })
  })
})

describe('createSessionResult', () => {
  it('stores the active mode and wrong words', () => {
    const result = createSessionResult({
      listId: 'list-1',
      listName: 'Test list',
      mode: 'exam',
      words: ['a', 'b'],
      marks: [true, false],
    })

    expect(result.mode).toBe('exam')
    expect(result.total).toBe(2)
    expect(result.correct).toBe(1)
    expect(result.wrongWords).toEqual(['b'])
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
