// Service Worker for caching images from S3 and other sources
const CACHE_NAME = 'photo-grid-cache-v1';
const IMAGE_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Patterns to cache
const CACHEABLE_PATTERNS = [
  /\.s3\..*\.amazonaws\.com.*\.(jpg|jpeg|png|gif|webp|avif)/i,  // AWS S3 images
  /\.r2\.cloudflarestorage\.com.*\.(jpg|jpeg|png|gif|webp|avif)/i, // Cloudflare R2
  /\.blob\.vercel-storage\.com.*\.(jpg|jpeg|png|gif|webp|avif)/i, // Vercel Blob
  /\/_next\/image/, // Next.js optimized images
];

// Check if URL should be cached
function shouldCache(url) {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests for images
  if (request.method !== 'GET' || !shouldCache(url.href)) {
    return; // Let the browser handle it normally
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Try to get from cache first
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          // Check if cache is still fresh
          const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
          const now = new Date();
          
          if (now - cachedDate < IMAGE_CACHE_DURATION) {
            console.log('[Service Worker] Serving from cache:', url.pathname);
            return cachedResponse;
          } else {
            console.log('[Service Worker] Cache expired, fetching fresh:', url.pathname);
          }
        }

        // Fetch from network
        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          // Clone the response before caching
          const responseToCache = networkResponse.clone();
          
          // Add custom header with cache date
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', new Date().toISOString());
          
          const cachedResponseWithDate = new Response(
            await responseToCache.blob(),
            {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers,
            }
          );

          // Cache the response
          cache.put(request, cachedResponseWithDate);
          console.log('[Service Worker] Cached:', url.pathname);
        }

        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        
        // Try to return cached version even if expired
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          console.log('[Service Worker] Network failed, serving stale cache:', url.pathname);
          return cachedResponse;
        }
        
        throw error;
      }
    })
  );
});

// Message event - handle cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
