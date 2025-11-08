// sw.js

// 1. CLAVE DE CACHÉ: ¡IMPORTANTE! Cambia este nombre (v1.3, v1.4, etc.) 
// cada vez que subas cambios al código de la app para forzar la actualización en los usuarios.
const CACHE_NAME = 'apptodoo-cache-v1.1';

// 3. ARCHIVOS PARA CACLEAR (Pre-cacheo): Lista de archivos esenciales
// Las rutas usan el prefijo del repositorio para funcionar correctamente en GitHub Pages.
const urlsToCache = [
    REPO_PREFIX, // La ruta base (ej: /TodoApp/)
    REPO_PREFIX + 'index.html',
    REPO_PREFIX + 'Calendario.html',
    REPO_PREFIX + 'Tareas.html',
    REPO_PREFIX + 'Diario.html',
    REPO_PREFIX + 'Finanzas.html',
    REPO_PREFIX + 'Perfil.html',
    REPO_PREFIX + 'manifest.json',
    // Asegúrate de añadir tus archivos CSS y de iconos:
    REPO_PREFIX + 'style.css', 
    REPO_PREFIX + 'icons/icon-192.png',
    REPO_PREFIX + 'icons/icon-512.png',
];

// -------------------------------------------------------------------

// --- EVENTO INSTALL: Instalar el SW y cachear los archivos iniciales ---
self.addEventListener('install', event => {
    console.log('[SW] Instalando y abriendo caché...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Archivos cacheados exitosamente');
                return cache.addAll(urlsToCache);
            })
            // self.skipWaiting() fuerza al Service Worker a activarse inmediatamente.
            .then(() => self.skipWaiting())
            .catch(err => {
                console.error('[SW] Error al cachear archivos estáticos:', err);
            })
    );
});S

// --- EVENTO ACTIVATE: Limpiar cachés viejas para la actualización ---
self.addEventListener('activate', event => {
    console.log('[SW] Activado. Limpiando cachés antiguas...');

    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                // Elimina las cachés que NO coincidan con el CACHE_NAME actual
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`[SW] Borrando caché antigua: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // self.clients.claim() asegura que el nuevo SW tome el control
    // de todas las pestañas abiertas inmediatamente.
    return self.clients.claim();
});


// --- EVENTO FETCH: Estrategia de manejo de peticiones (Cache-First) ---
self.addEventListener('fetch', event => {
    // Intercepta peticiones solo si son GET (no POST, etc.)
    if (event.request.method !== 'GET') return;

    // 1. Intenta obtener la respuesta de la caché.
    // 2. Si no la encuentra, va a la red.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devuelve el recurso de la caché si existe.
                if (response) {
                    return response;
                }

                // Si no está en caché, va a la red.
                return fetch(event.request).catch(error => {
                    console.error('[SW] Fallo de red para:', event.request.url);
                    // Opcional: Podrías devolver aquí una página de error offline
                    // si la app está completamente sin conexión.
                });
            })
    );
});