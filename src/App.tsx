import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ListEditorPage } from './pages/ListEditorPage'
import { ListsPage } from './pages/ListsPage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { AppStateProvider } from './state/AppState'

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="listen" element={<ListsPage />} />
            <Route path="listen/neu" element={<ListEditorPage />} />
            <Route path="listen/:id" element={<ListEditorPage />} />
            <Route path="einstellungen" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
