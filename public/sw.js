// Service Worker para caché de thumbnails
const CACHE_NAME = 'akasha-thumbnails-v1';
const THUMBNAIL_CACHE = 'akasha-thumbnails-media';
const MAX_CACHE_SIZE = 100; // Máximo de thumbnails en caché

// Rutas que deben cachearse
const THUMBNAIL_PATTERNS = [
  /\/storage\/v1\/object\/public\/content-videos\/.*thumbnails.*\.jpg$/,
  /\/storage\/v1\/object\/public\/content-audios\/.*thumbnails.*\.jpg$/,
  /\/storage\/v1\/object\/public\/content-photos\/.*thumbnails.*\.jpg$/,
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened');
      return cache.addAll(['/']);
    })
  );
  
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== THUMBNAIL_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control de todas las páginas inmediatamente
  return self.clients.claim();
});

// Función para verificar si una URL es un thumbnail
function isThumbnailRequest(url) {
  return THUMBNAIL_PATTERNS.some(pattern => pattern.test(url));
}

// Función para limpiar caché si excede el tamaño máximo
async function cleanCache(cache) {
  const keys = await cache.keys();
  
  if (keys.length > MAX_CACHE_SIZE) {
    // Eliminar los más antiguos (primeros en la lista)
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    
    await Promise.all(
      keysToDelete.map(key => {
        console.log('[SW] Removing old thumbnail from cache:', key.url);
        return cache.delete(key);
      })
    );
  }
}

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // Solo cachear thumbnails
  if (!isThumbnailRequest(url)) {
    return; // Dejar que la petición continúe normalmente
  }
  
  // Estrategia: Cache First, luego Network
  event.respondWith(
    caches.open(THUMBNAIL_CACHE).then(async (cache) => {
      try {
        // Intentar obtener del caché primero
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          console.log('[SW] Serving thumbnail from cache:', url);
          
          // Actualizar en segundo plano (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {
            // Ignorar errores de red en segundo plano
          });
          
          return cachedResponse;
        }
        
        // Si no está en caché, obtener de la red
        console.log('[SW] Fetching thumbnail from network:', url);
        const networkResponse = await fetch(request);
        
        // Cachear la respuesta si es exitosa
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
          
          // Limpiar caché si es necesario
          await cleanCache(cache);
        }
        
        return networkResponse;
      } catch (error) {
        console.error('[SW] Error fetching thumbnail:', error);
        
        // Intentar devolver del caché como fallback
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no hay caché, devolver una imagen placeholder
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1a1a2e" width="320" height="180"/><text fill="#64748b" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No disponible offline</text></svg>',
          {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-store'
            }
          }
        );
      }
    })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(THUMBNAIL_CACHE).then(() => {
        console.log('[SW] Thumbnail cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(THUMBNAIL_CACHE).then(async (cache) => {
        const keys = await cache.keys();
        event.ports[0].postMessage({ size: keys.length });
      })
    );
  }
});