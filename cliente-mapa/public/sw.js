// 🔧 SERVICE WORKER - WhereToSmoke
// Permite que la app funcione offline (básico) y sea instalable

const CACHE_NAME = 'wheretosmoke-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

// 📥 INSTALACIÓN: Guardar recursos en caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting(); // Activar inmediatamente el nuevo SW
});

// 🔄 ACTIVACIÓN: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Tomar control de todas las páginas
});

// 🌐 FETCH: Estrategia Network First (intentar red, fallback a cache)
self.addEventListener('fetch', (event) => {
    // Solo cachear GET requests
    if (event.request.method !== 'GET') return;

    // Ignorar esquemas que la Cache API no soporta (chrome-extension://, moz-extension://, etc.)
    // Las pone el navegador/extensiones; si se intentan cachear lanzan TypeError en consola.
    const url = new URL(event.request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, guardar en cache
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla, intentar servir desde cache
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    // Fallback para páginas HTML
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// 📲 PUSH NOTIFICATIONS (preparado para futuras notificaciones)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '🚨 Alerta Peguelo';
    const options = {
        body: data.body || 'Nueva alerta en tu zona',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: data
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 🔔 CLICK EN NOTIFICACIÓN
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
