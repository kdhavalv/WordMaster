import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { I18nProvider } from './i18n'
import { HomePage } from './pages/HomePage'
import { ListEditorPage } from './pages/ListEditorPage'
import { ListsPage } from './pages/ListsPage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { AppStateProvider } from './state/AppState'

export function ListEditorRoute() {
  const { id } = useParams()

  return <ListEditorPage key={id ?? 'new'} />
}

export default function App() {
  return (
    <AppStateProvider>
      <I18nProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="session" element={<SessionPage />} />
              <Route path="listen" element={<ListsPage />} />
              <Route path="listen/neu" element={<ListEditorRoute />} />
              <Route path="listen/:id" element={<ListEditorRoute />} />
              <Route path="einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </I18nProvider>
    </AppStateProvider>
  )
}
