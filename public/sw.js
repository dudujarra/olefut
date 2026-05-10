/* global clients */
/**
 * §15.4: Service Worker para PWA offline-first + notificações opcionais.
 *
 * Estratégia: Cache-first para assets estáticos, network-first para dados.
 * Notificações são opt-in e só disparam para eventos significativos.
 */

const CACHE_NAME = 'elifoot-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install: cache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for static, network-first for dynamic
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and external requests
    if (event.request.method !== 'GET' || url.origin !== location.origin) return;

    // Static assets: cache-first
    if (url.pathname.match(/\.(js|css|png|svg|woff2?|json)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) =>
                cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
            )
        );
        return;
    }

    // HTML: network-first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Novidades no seu time!',
        icon: '/elifoot-web/sprites/trophies/trophy-set.png',
        badge: '/elifoot-web/favicon.svg',
        tag: data.tag || 'elifoot-update',
        data: { url: data.url || '/' },
        actions: [
            { action: 'open', title: '🏟️ Abrir jogo' },
            { action: 'dismiss', title: 'Dispensar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'OléFUT', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('elifoot') && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(event.notification.data?.url || '/');
        })
    );
});
