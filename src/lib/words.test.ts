import { describe, expect, it } from 'vitest'
import { parseWordInput, sampleWords, shuffle } from './words'

describe('parseWordInput', () => {
  it('trims, collapses whitespace, removes blanks, and deduplicates case-insensitively', () => {
    expect(parseWordInput('  Fahrrad \nschule\nFAHRRAD\n\n  Straße  \r\n')).toEqual([
      'Fahrrad',
      'schule',
      'Straße',
    ])
  })

  it('returns an empty array for blank input', () => {
    expect(parseWordInput(' \n\t\n')).toEqual([])
  })
})

describe('sampleWords', () => {
  it('keeps the original order when shuffle is disabled', () => {
    expect(sampleWords(['a', 'b', 'c', 'd'], 2, false)).toEqual(['a', 'b'])
  })

  it('returns all available words when the requested count is larger', () => {
    expect(sampleWords(['a', 'b'], 10, false)).toEqual(['a', 'b'])
  })

  it('shuffles without losing or duplicating words', () => {
    const result = sampleWords(['a', 'b', 'c', 'd', 'e'], 5, true)

    expect([...result].sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('shuffle', () => {
  it('does not mutate the source array', () => {
    const source = ['a', 'b', 'c']
    const result = shuffle(source)

    expect(source).toEqual(['a', 'b', 'c'])
    expect([...result].sort()).toEqual(['a', 'b', 'c'])
  })
})
