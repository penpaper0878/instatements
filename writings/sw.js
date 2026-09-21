/* =============================================================================
   sw.js — the offline cache.

   The app shell (HTML, CSS, JS, icons) is cached on install, so the site opens
   instantly and keeps working with no connection. Content is handled
   differently: data/content.json always goes to the network first, because a
   reader who is online should see what was published a minute ago, not a copy
   from last week. If the network fails, the cached copy is served instead.
   ========================================================================== */

var CACHE_PREFIX = 'writings-';
var CACHE = CACHE_PREFIX + 'v1';

var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/js/store.js',
  './assets/js/i18n.js',
  './assets/js/theme.js',
  './assets/js/ui.js',
  './assets/js/views.js',
  './assets/js/share.js',
  './assets/js/publish.js',
  './assets/js/editor.js',
  './assets/js/settings.js',
  './assets/js/feedback.js',
  './assets/js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll fails the whole install if any single file 404s, which would
      // leave the site with no worker at all. Add them individually instead.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        // Only clear our own old versions. This origin also hosts Instatements
        // at the root with its own worker and its own cache; deleting every
        // key we don't recognise would knock that app offline.
        if (key.indexOf(CACHE_PREFIX) !== 0 || key === CACHE) return null;
        return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // Google Fonts and the GitHub API are none of our business — let them run
  // straight to the network, uncached.
  if (url.origin !== self.location.origin) return;

  // Content: network first, cache as a fallback.
  if (url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || new Response('{}', {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // Shell: cache first, then refresh in the background for next time.
  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        // Offline and uncached: for a navigation, fall back to the app shell so
        // a deep link still opens the site rather than the browser's error page.
        return request.mode === 'navigate' ? caches.match('./index.html') : cached;
      });
      return cached || network;
    })
  );
});
