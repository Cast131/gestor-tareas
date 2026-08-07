var CACHE_NAME = 'gestor-tareas-v26';
var urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/icon-192.svg',
    '/icon-512.svg'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf('supabase.co') !== -1) return;
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) return response;
            return fetch(event.request).then(function (networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    var responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(function () {
                return caches.match('/index.html');
            });
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (name) {
                    return name !== CACHE_NAME;
                }).map(function (name) {
                    return caches.delete(name);
                })
            );
        })
    );
});
