// sw.js

// 1. CLAVE DE CACHÉ: ¡IMPORTANTE! Cambia este nombre (v1.4, v1.5, etc.)
const CACHE_NAME = 'apptodoo-cache-v1.4'; // <<< CAMBIO: Se incrementa la versión

// 2. DEFINICIÓN DEL PREFIJO: Ajusta esto a la ruta de tu repositorio.
// Usa '/' si está en la raíz del dominio (ej: misitio.com/)
// Usa '/nombre-del-repo/' si está en un subdirectorio (ej: usuario.github.io/MiApp/)
const REPO_PREFIX = '/'; // <<< CAMBIO: Se define la variable REPO_PREFIX

// 3. ARCHIVOS PARA CACLEAR (Pre-cacheo): Lista de archivos esenciales
const urlsToCache = [
    REPO_PREFIX, // La ruta base (ej: /TodoApp/ o /)
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
});

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


// --- EVENTO FETCH: Estrategia de manejo de peticiones (Cache-First, con Fallback) ---
self.addEventListener('fetch', event => {
    // Intercepta peticiones solo si son GET (no POST, etc.)
    if (event.request.method !== 'GET') return;

    // 1. Intenta obtener la respuesta de la caché.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devuelve el recurso de la caché si existe.
                if (response) {
                    return response;
                }

                // 2. Si no está en caché, va a la red.
                return fetch(event.request).catch(error => {
                    console.error('[SW] Fallo de red para:', event.request.url);

                    // <<< CAMBIO CRÍTICO: MANEJO DEL FALLO OFFLINE >>>
                    // Si el fetch falla (porque estamos offline),
                    // intenta devolver el 'index.html' cacheado para que la PWA cargue.
                    if (event.request.mode === 'navigate') {
                        return caches.match(REPO_PREFIX + 'index.html');
                    }

                    // Si es un recurso (CSS, imagen, JS) que no estaba en caché y falló en la red,
                    // podemos devolver un error vacío para evitar un fallo total del Service Worker.
                    return new Response(null, { status: 404 });
                });
            })
    );
});