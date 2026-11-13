import type { SessionResult, Settings, WordList } from '../types'
import { defaultSettings, loadLists, loadResults, loadSettings } from '../lib/storage'

export type AppData = {
  lists: WordList[]
  results: SessionResult[]
  settings: Settings
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
  | { type: 'restoreData'; data: RestoreData }
  | { type: 'resetData' }

export function createInitialState(): AppData {
  return {
    lists: loadLists(),
    results: loadResults(),
    settings: loadSettings(),
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
    case 'restoreData':
      return {
        lists: action.data.lists,
        results: action.data.results,
        settings: action.data.settings,
      }
    case 'resetData':
      return {
        lists: [],
        results: [],
        settings: { ...defaultSettings },
      }
    default:
      return state
  }
}
