// Pathway AI - Progressive Web App Service Worker
const CACHE_NAME = 'pathway-ai-v3';
const STATIC_CACHE = 'pathway-ai-static-v3';
const DYNAMIC_CACHE = 'pathway-ai-dynamic-v3';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache (GET only)
const API_CACHE = [
  '/api/careers',
  '/api/learn/courses',
  '/api/practice/subjects'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }
  
  // Check if it's an API request
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(handleAPIRequest(event.request));
  }
  
  // Check if it's a static asset
  if (isStaticAsset(url)) {
    return event.respondWith(handleStaticRequest(event.request));
  }
  
  // Default: network first with cache fallback
  return event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match('/offline.html');
          });
      })
  );
});

// Handle API requests
async function handleAPIRequest(request) {
  // Try network first for API
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      // Cache successful API responses
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
      return response;
    }
    throw new Error('API request failed');
  } catch (error) {
    // Return cached API response if available
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline API response
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Please reconnect to access API.'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Handle static requests
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const responseClone = response.clone();
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
      return response;
    }
    return response;
  } catch (error) {
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Helper: Check if URL is a static asset
function isStaticAsset(url) {
  const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
  return extensions.some(ext => url.pathname.endsWith(ext));
}

// Push notification handling
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update from Pathway AI',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Pathway AI Update',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});

console.log('✅ Pathway AI Service Worker loaded');
