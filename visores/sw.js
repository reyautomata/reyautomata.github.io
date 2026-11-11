/* Guarda la app en el teléfono para usarla sin internet. Cambia VERSION al publicar cambios. */
const VERSION = 'visores-v93';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './exportar-3d.js', './lazos/', './lazos/index.html', './lazos/isa.js', './lazos/tarjetas.js', './lazos/dibujo.js', './lazos/app.js', './lazos/docio.js', './lazos/ric.js', './lazos/unilineal.js', './lazos/bloques.js', './lazos/conduit.js', './normas.js', './normativa/', './normativa/index.html', './normativa/normativa.js', './espesador/', './espesador/index.html', './espesador/modelo.js', './espesador/planta.js', './espesador/vista3d.js', './espesador/app.js', './requisiciones/', './requisiciones/index.html', './requisiciones/tipos.js', './requisiciones/rq.js', './requisiciones/app.js', './equipos/plano-montaje.js', './equipos/visores-equipos.js', './suite.css', './suite.js', './equipos/miniaturas.js', './proyectos.js', './acceso.js', './proyectos/', './pid/', './piping/', './piping/index.html', './piping/piping.js', './piping/sim.js', './piping/valvula3d.js', './lib3d.js', './pid/index.html', './pid/pid.js', './pid/vendor/pdf.min.mjs', './pid/vendor/pdf.worker.min.mjs', './proyectos/index.html', './especificaciones/', './especificaciones/index.html', './especificaciones/plantillas-et.js', './especificaciones/plantillas-et2.js', './especificaciones/plantillas-et3.js', './especificaciones/docx.js', './especificaciones/et.js', './hojas-datos/', './hojas-datos/index.html', './hojas-datos/plantillas.js', './hojas-datos/plantillas2.js', './hojas-datos/plantillas3.js', './hojas-datos/plantillas4.js', './hojas-datos/xlsx.js', './hojas-datos/hojas.js', '../img/logo-reyengi.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Primero la red (siempre la versión publicada más reciente); sin conexión, la copia guardada
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))));
});
