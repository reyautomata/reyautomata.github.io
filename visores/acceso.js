/* Acceso a ReyEngi (sitio principal y Suite): se ingresa solo con clave de acceso.
 * La clave no está en este archivo: solo su derivación PBKDF2-SHA256 con sal. Una vez desbloqueado,
 * el navegador queda habilitado por 180 días. Para cerrar la sesión en un equipo: agrega ?salir a la dirección.
 * Nota: es un control en el navegador de un sitio público; no reemplaza un acceso con servidor.
 */
(function () {
  'use strict';
  var VIGENCIA = 180 * 24 * 3600 * 1000;    // ms que dura el desbloqueo
  var SAL = 'zDkQVSSi//tclCl/6ym1og==', HASH = '+Z1y3LcZ1C/ZAIKAqJtIOgRn3nb8EcervjcbdwaovYM=', ITER = 210000;
  var K = 'reyengi-acceso';

  function leer() { var d = null; try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} return d || {}; }
  function guardar(d) { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} }
  var d = leer();
  if (/[?&]salir\b/.test(location.search)) { d.ok = 0; guardar(d); }
  function habilitado() { return d.ok && Date.now() - d.ok < VIGENCIA; }
  if (habilitado()) return;

  // Oculta el contenido desde el primer instante, antes de que la página se dibuje
  var oculto = document.createElement('style'); oculto.id = 'rg-oculto';
  oculto.textContent = 'body>*:not(#rg-acceso){visibility:hidden!important}';
  document.head.appendChild(oculto);

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

  var CSS = '#rg-acceso{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:16px;background:linear-gradient(180deg,#034488 0%,#021D3D 100%);font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#rg-acceso .caja{width:min(400px,100%);background:#0F2036;color:#E6EDF5;border:1px solid #1E3350;border-top:3px solid #EF5A05;border-radius:10px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    '#rg-acceso .marca{font:700 15px "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.6px;color:#A9B6C6;margin:0 0 10px}#rg-acceso .marca span{color:#EF5A05}' +
    '#rg-acceso h2{color:#fff;text-transform:none;letter-spacing:.2px;line-height:1.1;margin:0 0 6px;font:700 22px "Barlow Condensed","Arial Narrow",sans-serif}#rg-acceso p{margin:0 0 14px;color:#A9B6C6;font-size:13px;line-height:1.5}' +
    '#rg-acceso label{display:block;font-size:12px;font-weight:600;color:#E6EDF5;margin:0 0 6px}' +
    '#rg-acceso input{width:100%;box-sizing:border-box;min-height:40px;font:600 15px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:1px;text-transform:uppercase;color:#E6EDF5;background:#07111F;border:1px solid #1E3350;border-radius:6px;padding:8px 12px}' +
    '#rg-acceso input:focus{outline:2px solid #EF5A05;outline-offset:1px}#rg-acceso button{margin-top:10px;width:100%;min-height:40px;border:0;border-radius:6px;background:#EF5A05;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}' +
    '#rg-acceso button:disabled{opacity:.6;cursor:wait}#rg-acceso .err{color:#FF8A80;font-size:12.5px;min-height:18px;margin:8px 0 0}#rg-acceso .pie{margin:6px 0 0;font-size:11.5px}';

  function mostrar() {
    if (document.getElementById('rg-acceso')) return;
    var s = document.createElement('style'); s.id = 'rg-css'; s.textContent = CSS; document.head.appendChild(s);
    Array.prototype.forEach.call(document.body.children, function (n) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); });
    document.documentElement.style.overflow = 'hidden';
    var o = document.createElement('div'); o.id = 'rg-acceso'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'rg-tit');
    o.innerHTML = '<form class="caja" autocomplete="off"><p class="marca">Rey<span>Engi</span> · Ingeniería I&amp;C</p><h2 id="rg-tit">Acceso restringido</h2>' +
      '<p>El contenido de ReyEngi es privado. Ingresa tu clave de acceso para continuar.</p>' +
      '<label for="rg-clave">Clave de acceso</label><input id="rg-clave" type="password" placeholder="REY-XXXX-XXXX-XXXX" spellcheck="false"><button type="submit">Ingresar</button><p class="err" id="rg-err" role="alert"></p>' +
      '<p class="pie">¿No tienes clave? Solicítala al administrador de ReyEngi.</p></form>';
    document.body.appendChild(o);
    var f = o.querySelector('form'), inp = o.querySelector('#rg-clave'), btn = o.querySelector('button'), err = o.querySelector('#rg-err'), fallos = 0;
    setTimeout(function () { inp.focus(); }, 50);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!inp.value) return;
      btn.disabled = true; err.textContent = '';
      verificar(inp.value).then(function (ok) {
        if (ok) {
          d.ok = Date.now(); guardar(d); o.remove(); oculto.remove(); document.documentElement.style.overflow = '';
          Array.prototype.forEach.call(document.body.children, function (n) { n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
          return;
        }
        fallos++; inp.value = '';
        setTimeout(function () { btn.disabled = false; err.textContent = 'Clave incorrecta.'; inp.focus(); }, Math.min(8000, 600 * fallos * fallos));
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrar); else mostrar();
})();
