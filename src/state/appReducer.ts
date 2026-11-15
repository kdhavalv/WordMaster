import type { SessionResult, Settings, WordList } from '../types'
import {
  defaultSettings,
  loadLists,
  loadResults,
  loadSettings,
} from '../lib/storage'
import type { StorageArea, StorageError } from '../lib/storage'

export type AppData = {
  lists: WordList[]
  results: SessionResult[]
  settings: Settings
  storageErrors: Partial<Record<StorageArea, StorageError>>
  lastSaved: Partial<Record<StorageArea, unknown>>
}

export type RestoreData = {
  lists: WordList[]
  results: SessionResult[]
  settings: Settings
}

export type AppAction =
  | { type: 'addList'; list: WordList }
  | { type: 'addLists'; lists: WordList[] }
  | { type: 'updateList'; list: WordList }
  | { type: 'deleteList'; id: string }
  | { type: 'addResult'; result: SessionResult }
  | { type: 'clearResults' }
  | { type: 'updateSettings'; settings: Partial<Settings> }
  | {
      type: 'setStorageStatus'
      area: StorageArea
      error: StorageError | null
      value: unknown
    }
  | { type: 'dismissStorageErrors' }
  | { type: 'restoreData'; data: RestoreData }
  | { type: 'resetData' }

export function createInitialState(): AppData {
  return {
    lists: loadLists(),
    results: loadResults(),
    settings: loadSettings(),
    storageErrors: {},
    lastSaved: {},
  }
}

export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'addList':
      return { ...state, lists: [action.list, ...state.lists] }
    case 'addLists':
      return { ...state, lists: [...action.lists, ...state.lists] }
    case 'updateList':
      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === action.list.id ? action.list : list,
        ),
      }
    case 'deleteList':
      return {
        ...state,
        lists: state.lists.filter((list) => list.id !== action.id),
      }
    case 'addResult':
      return {
        ...state,
        results: [action.result, ...state.results].slice(0, 50),
      }
    case 'clearResults':
      return { ...state, results: [] }
    case 'updateSettings':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      }
    case 'setStorageStatus':
      return {
        ...state,
        storageErrors: action.error
          ? { ...state.storageErrors, [action.area]: action.error }
          : Object.fromEntries(
              Object.entries(state.storageErrors).filter(([area]) => area !== action.area),
            ),
        lastSaved: action.error
          ? state.lastSaved
          : { ...state.lastSaved, [action.area]: action.value },
      }
    case 'dismissStorageErrors':
      return { ...state, storageErrors: {} }
    case 'restoreData':
      return {
        lists: action.data.lists,
        results: action.data.results,
        settings: action.data.settings,
        storageErrors: {},
        lastSaved: {},
      }
    case 'resetData':
      return {
        lists: [],
        results: [],
        settings: { ...defaultSettings },
        storageErrors: {},
        lastSaved: {},
      }
    default:
      return state
  }
}
