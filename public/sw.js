const CACHE_NAME = 'gyara-ni-v1';
const STATIC_CACHE = 'gyara-ni-static-v1';

// Assets to precache (only critical static assets)
const PRECACHE_ASSETS = [
  '/',
  '/logo.jpg',
  '/manifest.json'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  // Skip auth, API routes, and admin endpoints
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.includes('/admin')) {
    return;
  }
  
  // Handle different request types
  if (request.mode === 'navigate') {
    // Navigation requests - network first with fallback
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // Other requests - stale while revalidate
    event.respondWith(handleStaleWhileRevalidate(request));
  }
});

// Network first for navigation with offline fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Offline fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback to root page if available
    const rootPage = await caches.match('/');
    return rootPage || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache first for static assets
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Stale while revalidate
async function handleStaleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {
    return cachedResponse || new Response('Content not available', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
}

// Helper to identify static assets
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$/.test(pathname) ||
         pathname.startsWith('/_next/static/');
}