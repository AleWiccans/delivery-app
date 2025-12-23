const CACHE_NAME = 'delivery-farmacia-v4.0';
const urlsToCache = [
  '/',
  '/index.html'
];

// Instalación - Cachear recursos
self.addEventListener('install', function(event) {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Todos los recursos cacheados');
        return self.skipWaiting();
      })
  );
});

// Activar - Limpiar caches viejos
self.addEventListener('activate', function(event) {
  console.log('Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Fetch - Servir desde cache o red
self.addEventListener('fetch', function(event) {
  // Excluir chrome-extension (para desarrollo)
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clonar la request porque es un stream y solo se puede usar una vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la response porque es un stream y solo se puede usar una vez
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function(error) {
          console.log('Fetch failed; returning offline page instead.', error);
          // Puedes retornar una página offline personalizada aquí
        });
      }
    )
  );
});

// Manejar mensajes desde la app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});