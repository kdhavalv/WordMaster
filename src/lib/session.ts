import type { SessionMode, SessionResult } from '../types'
import { createId } from './utils'

export type SessionSummary = {
  correct: number
  total: number
  wrongWords: string[]
  percent: number
}

export function summarize(
  words: readonly string[],
  marks: readonly (boolean | undefined)[],
): SessionSummary {
  const wrongWords: string[] = []
  let correct = 0

  words.forEach((word, index) => {
    if (marks[index] === true) {
      correct += 1
    } else {
      wrongWords.push(word)
    }
  })

  return {
    correct,
    total: words.length,
    wrongWords,
    percent: words.length > 0 ? Math.round((correct / words.length) * 100) : 0,
  }
}

export function createSessionResult(params: {
  listId: string
  listName: string
  mode: SessionMode
  words: string[]
  marks: Array<boolean | undefined>
}): SessionResult {
  const summary = summarize(params.words, params.marks)

  return {
    id: createId(),
    listId: params.listId,
    listName: params.listName,
    mode: params.mode,
    date: new Date().toISOString(),
    total: summary.total,
    correct: summary.correct,
    wrongWords: summary.wrongWords,
  }
}
