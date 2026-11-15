const CACHE_NAME = 'wortmeister-v0.2.0'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
]

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)

  try {
    const response = await fetch('./index.html', { cache: 'reload' })

    if (!response.ok) {
      return
    }

    const html = await response.clone().text()
    await cache.put('./index.html', response)

    const assetPattern = /(?:src|href)="(\.\/assets\/[^"]+)"/g
    const assetUrls = []
    let match

    while ((match = assetPattern.exec(html)) !== null) {
      assetUrls.push(match[1])
    }

    if (assetUrls.length > 0) {
      await cache.addAll(assetUrls)
    }
  } catch {
    // The basic app shell still works if asset discovery fails.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell())
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }

          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match('./index.html', { ignoreVary: true })) ?? Response.error()
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request, { ignoreVary: true }).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }

        return response
      })
    }),
  )
})
