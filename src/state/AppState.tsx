import { useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { saveLists, saveResults, saveSettings } from '../lib/storage'
import { AppStateContext } from './appContext'
import { appReducer, createInitialState } from './appReducer'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState)

  useEffect(() => {
    saveLists(state.lists)
  }, [state.lists])

  useEffect(() => {
    saveResults(state.results)
  }, [state.results])

  useEffect(() => {
    saveSettings(state.settings)
  }, [state.settings])

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  )
}
