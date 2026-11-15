import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

export function PwaUpdateNotice() {
  const { t } = useI18n()
  const [available, setAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const refreshingRef = useRef(false)

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return
    }

    let disposed = false

    function handleControllerChange() {
      if (refreshingRef.current) {
        refreshingRef.current = false
        window.location.reload()
      }
    }

    function watchWorker(worker: ServiceWorker | null) {
      if (!worker) {
        return
      }

      worker.addEventListener('statechange', () => {
        if (disposed) {
          return
        }

        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setAvailable(true)
        }
      })
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        if (disposed) {
          return
        }

        registrationRef.current = registration

        if (registration.waiting && navigator.serviceWorker.controller) {
          setAvailable(true)
        }

        watchWorker(registration.installing)
        registration.addEventListener('updatefound', () => {
          watchWorker(registration.installing)
        })
        void registration.update().catch(() => undefined)
      })
      .catch(() => {
        // The app works normally without a service worker.
      })

    return () => {
      disposed = true
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      )
    }
  }, [])

  if (!available || dismissed) {
    return null
  }

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting

    if (waiting) {
      refreshingRef.current = true
      waiting.postMessage({ type: 'SKIP_WAITING' })
      return
    }

    window.location.reload()
  }

  return (
    <aside className="update-notice" role="status" aria-live="polite">
      <span>{t('update.available')}</span>
      <span className="update-notice__actions">
        <button type="button" className="btn btn--small btn--primary" onClick={applyUpdate}>
          {t('update.reload')}
        </button>
        <button
          type="button"
          className="btn btn--small btn--ghost"
          onClick={() => setDismissed(true)}
        >
          {t('common.dismiss')}
        </button>
      </span>
    </aside>
  )
}
