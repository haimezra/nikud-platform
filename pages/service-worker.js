// ניקוד★ – Service Worker
// גרסת מטמון - שנו את המספר הזה בכל פעם שאתם עושים דיפלוי לגרסה חדשה,
// כדי לאלץ את כל המשתמשים לקבל את השינויים במקום לראות גרסה ישנה מהמטמון.
const CACHE_VERSION = 'nikud-v2'
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// קבצים בסיסיים שאנחנו יודעים בוודאות שקיימים - נטען אותם מראש בהתקנה.
// אם יש לכם עוד דפים (index.html, payment.html וכו') תוסיפו אותם כאן.
const PRECACHE_URLS = [
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/apple-touch-icon.png'
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // מוסיפים כל קובץ בנפרד כדי שקובץ חסר אחד לא יפיל את כל ההתקנה
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('לא הצליח לשמור במטמון:', url, err))
        )
      )
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // אף פעם לא לשים במטמון קריאות ל-Supabase (auth/דאטה חייבים להיות תמיד עדכניים)
  if (url.hostname.includes('supabase.co')) return

  // ניווט בין דפי HTML: קודם ננסה רשת, אם אין רשת ניפול חזרה למטמון (תמיכה אופליין בסיסית)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('login.html')))
    )
    return
  }

  // שאר הקבצים (CSS/JS/תמונות/פונטים): קודם מטמון, ואם אין - רשת, ואז שומרים לפעם הבאה
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      }).catch(() => cached)
    })
  )
})
