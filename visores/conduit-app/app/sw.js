/* ReyEngi Conduit instalable: guarda la app para usarla sin conexión. Cambia VERSION al publicar. */
const VERSION = 'conduit-v1';
const FILES = ['./', './index.html', './estilo.css', './app.css', './shim.js', './inicio.js', './manifest.webmanifest',
  './icono-192.png', './icono-512.png', './icono-512-maskable.png', './vp-lazo.webp', './vp-unilineal.webp', './vp-montaje.webp', './vp-documento.webp',
  '../demo.js', '../../acceso.js', '../../lazos/conduit.js', '../../hojas-datos/xlsx.js', '../../normas.js', '../../lib3d.js', '../../../img/logo-reyengi.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('conduit-') === 0 && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Primero la red (versión publicada más reciente); sin conexión, la copia guardada
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))));
});
