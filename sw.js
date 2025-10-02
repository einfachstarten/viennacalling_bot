const CACHE_NAME = 'alex-v1.0';
const STATIC_CACHE = 'alex-static-v1.0';
const API_CACHE = 'alex-api-v1.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/style.css',
  '/script.js',
  '/data.js',
  '/pwa.js',
  '/manifest.json',
  '/android/android-launchericon-192-192.png',
  '/android/android-launchericon-512-512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/chat',
  '/api/debug-extensions'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with cache-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Cache-first strategy for static files
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    // Return offline fallback for main page
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    throw error;
  }
}

// Network-first strategy for API calls with fallback
async function handleApiRequest(request) {
  try {
    console.log('Service Worker: API request:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API network failed, trying cache:', request.url);
    
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for chat API
    if (request.url.includes('/api/chat')) {
      return new Response(JSON.stringify({
        message: "Hey! Bin gerade offline, aber sobald wieder Internet da ist, helfe ich gerne weiter! 📱"
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Background sync for when connection returns
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync any pending data when connection returns
  console.log('Service Worker: Performing background sync');
}

// Push notifications (optional)
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: 'ALEX hat neue Updates für dich!',
    icon: '/android/android-launchericon-192-192.png',
    badge: '/android/android-launchericon-72-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'ALEX öffnen',
        icon: '/android/android-launchericon-192-192.png'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ALEX Update', options)
  );
});
