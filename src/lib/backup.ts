import type { SessionResult, Settings, WordList } from '../types'
import { sanitizeLists, sanitizeResults, sanitizeSettings } from './storage'
import { isRecord } from './utils'

export type Backup = {
  version: 1
  exportedAt: string
  lists: WordList[]
  results: SessionResult[]
  settings: Settings
}

export function createBackup(
  lists: WordList[],
  results: SessionResult[],
  settings: Settings,
): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    lists,
    results,
    settings,
  }
}

export function parseBackup(value: unknown): Backup | null {
  if (!isRecord(value)) {
    return null
  }

  const hasData = 'lists' in value && 'results' in value && 'settings' in value

  if (!hasData) {
    return null
  }

  return {
    version: 1,
    exportedAt:
      typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString(),
    lists: sanitizeLists(value.lists),
    results: sanitizeResults(value.results),
    settings: sanitizeSettings(value.settings),
  }
}
