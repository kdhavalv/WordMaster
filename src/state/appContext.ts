import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { AppAction, AppData } from './appReducer'

export type AppStateValue = {
  state: AppData
  dispatch: Dispatch<AppAction>
}

export const AppStateContext = createContext<AppStateValue | null>(null)

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppState muss innerhalb von AppStateProvider verwendet werden.')
  }

  return context
}
