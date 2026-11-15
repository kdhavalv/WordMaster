import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAppState } from '../state/appContext'
import { PwaUpdateNotice } from './PwaUpdateNotice'

export function Layout() {
  const location = useLocation()
  const { t } = useI18n()
  const { state, dispatch } = useAppState()
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)
  const isSession = location.pathname === '/session'
  const hasStorageError = Object.keys(state.storageErrors).length > 0
  const brand = (
    <>
      <span className="brand__mark" aria-hidden="true">
        W
      </span>
      <span className="brand__text">
        <strong>{t('app.name')}</strong>
        <small>{t('app.tagline')}</small>
      </span>
    </>
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        {t('skip.link')}
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          {isSession ? (
            <div className="brand" aria-label={t('app.name')}>
              {brand}
            </div>
          ) : (
            <NavLink to="/" className="brand" aria-label={t('aria.brandHome')}>
              {brand}
            </NavLink>
          )}

          {!isSession && (
            <nav className="nav" aria-label={t('nav.label')}>
              <NavLink to="/" end>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/listen">{t('nav.lists')}</NavLink>
              <NavLink to="/einstellungen">{t('nav.settings')}</NavLink>
            </nav>
          )}
        </div>
      </header>

      {hasStorageError && (
        <div className="storage-warning" role="alert">
          <span>{t('storage.warning')}</span>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => dispatch({ type: 'dismissStorageErrors' })}
            aria-label={t('storage.dismiss')}
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      <PwaUpdateNotice />

      <main className="main" id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>{t('app.name')}</span>
        <span>{t('footer.local')}</span>
      </footer>
    </div>
  )
}
