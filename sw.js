'use strict';
const CACHE = 'om3-v1.1.0';
const FILE = ['./', 'index.html', 'style.css', 'dati.js', 'util.js', 'calc.js', 'astro.js', 'legale.js', 'guida.js', 'app.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match('index.html')))
  );
});
