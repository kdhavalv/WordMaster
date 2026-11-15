import { useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { saveLists, saveResults, saveSettings } from '../lib/storage'
import { AppStateContext } from './appContext'
import { appReducer, createInitialState } from './appReducer'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState)

  useEffect(() => {
    const result = saveLists(state.lists)
    dispatch({
      type: 'setStorageStatus',
      area: 'lists',
      error: result.ok ? null : result.error,
      value: state.lists,
    })
  }, [state.lists, dispatch])

  useEffect(() => {
    const result = saveResults(state.results)
    dispatch({
      type: 'setStorageStatus',
      area: 'results',
      error: result.ok ? null : result.error,
      value: state.results,
    })
  }, [state.results, dispatch])

  useEffect(() => {
    const result = saveSettings(state.settings)
    dispatch({
      type: 'setStorageStatus',
      area: 'settings',
      error: result.ok ? null : result.error,
      value: state.settings,
    })
  }, [state.settings, dispatch])

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  )
}
