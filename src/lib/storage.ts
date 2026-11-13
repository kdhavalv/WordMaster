import type { SessionResult, Settings, WordList } from '../types'
import { createId, isRecord } from './utils'
import { parseWordInput } from './words'

const LISTS_KEY = 'wordmaster.lists.v1'
const RESULTS_KEY = 'wordmaster.results.v1'
const SETTINGS_KEY = 'wordmaster.settings.v1'

export const defaultSettings: Settings = {
  voiceURI: undefined,
  rate: 0.85,
  autoPlay: true,
  defaultWordCount: 25,
  shuffle: true,
}

function readStorage(key: string): unknown {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return undefined
    }

    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function writeStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

function sanitizeList(value: unknown): WordList | null {
  if (!isRecord(value)) {
    return null
  }

  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const rawWords = Array.isArray(value.words) ? value.words : []
  const words = parseWordInput(
    rawWords.filter((word): word is string => typeof word === 'string').join('\n'),
  )

  if (!name || words.length === 0) {
    return null
  }

  const now = new Date().toISOString()

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    name,
    words,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

export function sanitizeLists(value: unknown): WordList[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seenIds = new Set<string>()
  const lists: WordList[] = []

  for (const item of value) {
    const parsed = sanitizeList(item)

    if (!parsed) {
      continue
    }

    const list = seenIds.has(parsed.id) ? { ...parsed, id: createId() } : parsed
    seenIds.add(list.id)
    lists.push(list)
  }

  return lists
}

function sanitizeResult(value: unknown): SessionResult | null {
  if (!isRecord(value)) {
    return null
  }

  const mode = value.mode === 'practice' || value.mode === 'exam' ? value.mode : null
  const total =
    typeof value.total === 'number' && Number.isFinite(value.total)
      ? Math.max(0, Math.round(value.total))
      : 0

  if (!mode || total === 0) {
    return null
  }

  const rawCorrect =
    typeof value.correct === 'number' && Number.isFinite(value.correct) ? value.correct : 0
  const correct = Math.min(total, Math.max(0, Math.round(rawCorrect)))
  const wrongWords = Array.isArray(value.wrongWords)
    ? value.wrongWords
        .filter((word): word is string => typeof word === 'string')
        .map((word) => word.trim())
        .filter(Boolean)
    : []

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    listId: typeof value.listId === 'string' && value.listId ? value.listId : 'unknown',
    listName:
      typeof value.listName === 'string' && value.listName.trim()
        ? value.listName.trim()
        : 'Unbekannte Liste',
    mode,
    date: typeof value.date === 'string' ? value.date : new Date().toISOString(),
    total,
    correct,
    wrongWords,
  }
}

export function sanitizeResults(value: unknown): SessionResult[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => sanitizeResult(item))
    .filter((result): result is SessionResult => result !== null)
    .slice(0, 50)
}

export function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) {
    return { ...defaultSettings }
  }

  const rate =
    typeof value.rate === 'number' && Number.isFinite(value.rate)
      ? Math.min(1.2, Math.max(0.6, value.rate))
      : defaultSettings.rate
  const wordCount =
    typeof value.defaultWordCount === 'number' && Number.isFinite(value.defaultWordCount)
      ? Math.min(50, Math.max(1, Math.round(value.defaultWordCount)))
      : defaultSettings.defaultWordCount

  return {
    voiceURI:
      typeof value.voiceURI === 'string' && value.voiceURI ? value.voiceURI : undefined,
    rate,
    autoPlay:
      typeof value.autoPlay === 'boolean' ? value.autoPlay : defaultSettings.autoPlay,
    defaultWordCount: wordCount,
    shuffle: typeof value.shuffle === 'boolean' ? value.shuffle : defaultSettings.shuffle,
  }
}

export function loadLists(): WordList[] {
  return sanitizeLists(readStorage(LISTS_KEY))
}

export function saveLists(lists: WordList[]): void {
  writeStorage(LISTS_KEY, lists)
}

export function loadResults(): SessionResult[] {
  return sanitizeResults(readStorage(RESULTS_KEY))
}

export function saveResults(results: SessionResult[]): void {
  writeStorage(RESULTS_KEY, results)
}

export function loadSettings(): Settings {
  return sanitizeSettings(readStorage(SETTINGS_KEY))
}

export function saveSettings(settings: Settings): void {
  writeStorage(SETTINGS_KEY, settings)
}
