import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const location = useLocation()
  const isSession = location.pathname === '/session'
  const brand = (
    <>
      <span className="brand__mark" aria-hidden="true">
        W
      </span>
      <span className="brand__text">
        <strong>Wortmeister</strong>
        <small>Diktat-Trainer</small>
      </span>
    </>
  )

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          {isSession ? (
            <div className="brand" aria-label="Wortmeister">
              {brand}
            </div>
          ) : (
            <NavLink to="/" className="brand" aria-label="Wortmeister Startseite">
              {brand}
            </NavLink>
          )}

          {!isSession && (
            <nav className="nav" aria-label="Hauptnavigation">
              <NavLink to="/" end>
                Startseite
              </NavLink>
              <NavLink to="/listen">Wortlisten</NavLink>
              <NavLink to="/einstellungen">Einstellungen</NavLink>
            </nav>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>Wortmeister</span>
        <span>Alle Daten bleiben auf diesem Gerät.</span>
      </footer>
    </div>
  )
}
