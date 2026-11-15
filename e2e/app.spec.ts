import { expect, test } from '@playwright/test'

test('completes a practice round and retries the wrong words', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Wörter hören. Auf Papier schreiben. Gemeinsam prüfen.' }),
  ).toBeVisible()

  await page.getByLabel('Anzahl der Wörter').fill('2')
  await page.getByRole('button', { name: /Übung starten/ }).click()

  await expect(page.getByText('Wort 1 von 2')).toBeVisible()
  await page.getByRole('button', { name: 'Antwort zeigen' }).click()
  await page.getByRole('button', { name: 'Richtig' }).click()

  await expect(page.getByText('Wort 2 von 2')).toBeVisible()
  await page.getByRole('button', { name: 'Antwort zeigen' }).click()
  await page.getByRole('button', { name: 'Falsch' }).click()

  await expect(page.getByText('Weiter üben!')).toBeVisible()
  await expect(page.getByText('Das Ergebnis wurde lokal gespeichert.')).toBeVisible()
  await page.getByRole('button', { name: 'Falsche Wörter üben' }).click()

  await expect(page.getByText('Wort 1 von 1')).toBeVisible()
  await expect(page.locator('.badge--practice')).toHaveText('Übung')
})

test('switches to English, keeps German words, and persists after reload', async ({ page }) => {
  await page.goto('/#/einstellungen')
  await page.getByRole('combobox', { name: 'Sprache' }).selectOption('en')

  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Make Wortmeister sound right' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()

  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('has no horizontal overflow at phone, tablet, and desktop widths', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const overflow = await page.evaluate(() => {
      const root = document.documentElement
      const visibleRight = (element: HTMLElement) => {
        let right = element.getBoundingClientRect().right
        let ancestor = element.parentElement

        while (ancestor) {
          if (getComputedStyle(ancestor).overflowX !== 'visible') {
            right = Math.min(right, ancestor.getBoundingClientRect().right)
          }
          ancestor = ancestor.parentElement
        }

        return right
      }
      const widest = Array.from(document.querySelectorAll<HTMLElement>('body *')).reduce(
        (max, element) => Math.max(max, visibleRight(element)),
        0,
      )

      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        widest,
      }
    })

    expect(overflow.scrollWidth, `${viewport.width}px scroll width`).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    )
    expect(overflow.widest, `${viewport.width}px element width`).toBeLessThanOrEqual(
      viewport.width + 1,
    )
  }
})

test('serves the manifest and activates the service worker', async ({ page, request }) => {
  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.status()).toBe(200)
  expect(manifest.headers()['content-type']).toContain('manifest')

  await page.goto('/')
  const active = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    const worker = registration.active

    if (!worker) {
      return null
    }

    if (worker.state !== 'activated') {
      await new Promise<void>((resolve) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated' || worker.state === 'redundant') {
            resolve()
          }
        })
      })
    }

    return worker.state
  })

  expect(active).toBe('activated')

  const cachedPaths = await page.evaluate(async () => {
    const cache = await caches.open('wortmeister-v0.2.0')
    const requests = await cache.keys()
    return requests.map((request) => new URL(request.url).pathname)
  })

  expect(cachedPaths.some((path) => path.endsWith('.js'))).toBe(true)
  expect(cachedPaths.some((path) => path.endsWith('.css'))).toBe(true)

  await page.evaluate(async () => {
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        })
      })
    }
  })

  await page.context().setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Wörter hören. Auf Papier schreiben. Gemeinsam prüfen.' }),
  ).toBeVisible()
  await page.context().setOffline(false)
})
