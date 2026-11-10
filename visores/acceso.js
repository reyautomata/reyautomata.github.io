/* Acceso a la Suite ReyEngi: 30 minutos de vista de prueba por navegador; después hay que esperar 24 horas
 * para volver a ingresar, o usar la clave de acceso.
 * La clave no está en este archivo: solo su derivación PBKDF2-SHA256 con sal. Una vez desbloqueado,
 * el navegador queda habilitado por 180 días. Para volver a bloquear un equipo: agrega ?salir a la dirección.
 * Nota: es un control en el navegador de un sitio público; no reemplaza un acceso con servidor.
 */
(function () {
  'use strict';
  var LIMITE = 30 * 60;                     // segundos de prueba
  var VIGENCIA = 180 * 24 * 3600 * 1000;    // ms que dura el desbloqueo
  var ESPERA = 24 * 3600 * 1000;            // ms de espera tras agotar la prueba
  var SAL = 'zDkQVSSi//tclCl/6ym1og==', HASH = '+Z1y3LcZ1C/ZAIKAqJtIOgRn3nb8EcervjcbdwaovYM=', ITER = 210000;
  var K = 'reyengi-acceso';

  function leer() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {}
    var m = /(?:^|; )reyengi_t=(\d+)(?:-(\d+))?/.exec(document.cookie); // respaldo: tiempo usado y momento del bloqueo
    d = d || { usado: 0 };
    if (m && +m[1] > (d.usado || 0)) d.usado = +m[1];
    if (m && m[2] && +m[2] > (d.bloq || 0)) d.bloq = +m[2];
    if (d.bloq && Date.now() - d.bloq >= ESPERA) { d.usado = 0; d.bloq = 0; } // pasaron 24 h: nueva vista de prueba
    return d;
  }
  function guardar(d) {
    try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {}
    try { document.cookie = 'reyengi_t=' + Math.floor(d.usado || 0) + (d.bloq ? '-' + d.bloq : '') + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) {}
  }
  var d = leer();
  if (/[?&]salir\b/.test(location.search)) { d.ok = 0; d.usado = LIMITE; d.bloq = Date.now(); guardar(d); }
  function habilitado() { return d.ok && Date.now() - d.ok < VIGENCIA; }

  function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function desde64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function verificar(clave) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(false);
    var enc = new TextEncoder().encode(String(clave).trim().toUpperCase());
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: desde64(SAL), iterations: ITER, hash: 'SHA-256' }, k, 256); })
      .then(function (bits) { return b64(bits) === HASH; })
      .catch(function () { return false; });
  }

  var CSS = '#rg-acceso{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:16px;background:rgba(2,18,38,.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#rg-acceso .caja{width:min(420px,100%);background:#0F2036;color:#E6EDF5;border:1.5px solid #1E3350;border-top:4px solid #EF5A05;border-radius:12px;padding:24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
    '#rg-acceso .espera{background:#07111F;border:1px solid #1E3350;border-radius:8px;padding:10px 12px;color:#E6EDF5}#rg-acceso .espera b{color:#FF9A5C;font-family:"IBM Plex Mono",ui-monospace,monospace}#rg-acceso h2{color:#fff;text-transform:none;letter-spacing:0;line-height:1.05;margin:0 0 8px;font:800 italic 26px "Barlow Condensed","Arial Narrow",sans-serif}#rg-acceso p{margin:0 0 14px;color:#A9B6C6;font-size:14px;line-height:1.5}' +
    '#rg-acceso input{width:100%;box-sizing:border-box;min-height:44px;font:600 16px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:1px;text-transform:uppercase;color:#E6EDF5;background:#07111F;border:1.5px solid #1E3350;border-radius:8px;padding:8px 12px}' +
    '#rg-acceso input:focus{outline:3px solid #EF5A05;outline-offset:1px}#rg-acceso button{margin-top:12px;width:100%;min-height:44px;border:0;border-radius:8px;background:#EF5A05;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer}' +
    '#rg-acceso button:disabled{opacity:.6;cursor:wait}#rg-acceso .err{color:#FF8A80;font-size:13px;min-height:18px;margin:8px 0 0}' +
    '#rg-reloj{position:fixed;right:12px;bottom:12px;z-index:2147483645;font:600 12px "IBM Plex Mono",ui-monospace,monospace;background:rgba(15,32,54,.92);color:#E6EDF5;border:1px solid #1E3350;border-radius:999px;padding:6px 12px;pointer-events:none}' +
    '@media print{#rg-reloj{display:none}}';
  function estilo() { if (document.getElementById('rg-css')) return; var s = document.createElement('style'); s.id = 'rg-css'; s.textContent = CSS; document.head.appendChild(s); }

  var reloj = null;
  function pintarReloj() {
    if (habilitado()) { if (reloj) { reloj.remove(); reloj = null; } return; }
    if (!reloj) { reloj = document.createElement('div'); reloj.id = 'rg-reloj'; document.body.appendChild(reloj); }
    var r = Math.max(0, LIMITE - (d.usado || 0));
    reloj.textContent = 'Vista de prueba · ' + Math.ceil(r / 60) + ' min';
  }
  function faltan() {
    var ms = Math.max(0, ESPERA - (Date.now() - (d.bloq || Date.now()))), h = Math.floor(ms / 3600000), m = Math.ceil((ms % 3600000) / 60000);
    if (m === 60) { h++; m = 0; }
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }
  function bloquear() {
    if (!d.bloq) { d.bloq = Date.now(); guardar(d); }
    if (document.getElementById('rg-acceso')) return;
    estilo(); if (reloj) { reloj.remove(); reloj = null; }
    Array.prototype.forEach.call(document.body.children, function (n) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); });
    document.documentElement.style.overflow = 'hidden';
    var o = document.createElement('div'); o.id = 'rg-acceso'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'rg-tit');
    o.innerHTML = '<form class="caja" autocomplete="off"><h2 id="rg-tit">Debe esperar 24 hrs para ingresar nuevamente</h2><p>Terminó tu tiempo de vista de prueba de 30 minutos en la Suite ReyEngi.</p>' +
      '<p class="espera">Podrás volver a ingresar en <b id="rg-faltan">' + faltan() + '</b>.</p><p style="margin:16px 0 8px;color:#E6EDF5;font-weight:600">¿Tienes clave de acceso?</p>' +
      '<input id="rg-clave" type="password" placeholder="REY-XXXX-XXXX-XXXX" aria-label="Clave de acceso" spellcheck="false"><button type="submit">Ingresar</button><p class="err" id="rg-err" role="alert"></p>' +
      '<p style="margin:10px 0 0;font-size:12px">¿No tienes clave? Solicítala al administrador de la Suite ReyEngi.</p></form>';
    document.body.appendChild(o);
    var f = o.querySelector('form'), inp = o.querySelector('#rg-clave'), btn = o.querySelector('button'), err = o.querySelector('#rg-err'), fallos = 0;
    setTimeout(function () { inp.focus(); }, 50);
    var tEsp = setInterval(function () { // al cumplirse las 24 h se habilita una nueva vista de prueba
      var x = o.querySelector('#rg-faltan'); if (x) x.textContent = faltan();
      if (Date.now() - d.bloq >= ESPERA) { clearInterval(tEsp); d.usado = 0; d.bloq = 0; guardar(d); location.reload(); }
    }, 30000);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!inp.value) return;
      btn.disabled = true; err.textContent = '';
      verificar(inp.value).then(function (ok) {
        if (ok) {
          clearInterval(tEsp); d.ok = Date.now(); d.bloq = 0; guardar(d); o.remove(); document.documentElement.style.overflow = '';
          Array.prototype.forEach.call(document.body.children, function (n) { n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
          return;
        }
        fallos++; inp.value = '';
        setTimeout(function () { btn.disabled = false; err.textContent = 'Clave incorrecta.'; inp.focus(); }, Math.min(8000, 600 * fallos * fallos));
      });
    });
  }

  function iniciar() {
    if (habilitado()) return;
    estilo();
    if ((d.usado || 0) >= LIMITE) { bloquear(); return; }
    pintarReloj();
    var ult = Date.now();
    setInterval(function () {
      var ahora = Date.now(), paso = Math.min(10, (ahora - ult) / 1000); ult = ahora;
      if (document.visibilityState !== 'visible' || habilitado()) return;
      var otro = leer(); d.usado = Math.max(d.usado || 0, otro.usado || 0) + paso; if (otro.ok) d.ok = otro.ok; // otras pestañas
      guardar(d);
      if (habilitado()) { pintarReloj(); return; }
      if (d.usado >= LIMITE) bloquear(); else pintarReloj();
    }, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
