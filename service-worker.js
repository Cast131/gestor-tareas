var CACHE_NAME = 'gestor-tareas-v11';
var urlsToCache = [
    '/gestor-tareas/',
    '/gestor-tareas/index.html',
    '/gestor-tareas/styles.css',
    '/gestor-tareas/script.js',
    '/gestor-tareas/manifest.json',
    '/gestor-tareas/icon-192.svg',
    '/gestor-tareas/icon-512.svg',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
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
                return caches.match('/gestor-tareas/index.html');
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
