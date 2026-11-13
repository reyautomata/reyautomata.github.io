/* Suite ReyEngi · marco común: explorador lateral con la jerarquía de ingeniería, barra de estado y plegado.
 * Se carga en todas las páginas. Un módulo puede alojar su propio árbol bajo su nodo: basta con que tenga un
 * elemento #arbol (como el Análisis de P&ID); este marco lo mueve al explorador. */
(function () {
  'use strict';
  var BASE = (function () { try { return new URL('.', document.currentScript.src).href; } catch (e) { return '../'; } })();
  var GRUPOS = [
    ['ges', 'Gestión y dirección del proyecto', [['00', 'Proyecto', 'proyectos/'], ['11', 'Requisiciones de compra', 'requisiciones/'], ['H4', 'Normativa SEC y reglas', 'normativa/']]],
    ['pro', 'Procesos y P&ID', [['01', 'Análisis de P&ID', 'pid/'], ['H1', 'Piping para leer P&ID', 'piping/#aprender']]],
    ['ins', 'Instrumentación', [['02', 'Listado de instrumentos', 'lazos/#inst'], ['03', 'Hojas de datos', 'hojas-datos/'], ['04', 'Especificaciones técnicas', 'especificaciones/'], ['H2', 'Válvulas: tamaño y actuador', 'piping/#valvulas'], ['10', 'Detalles típicos de montaje', '#montajes']]],
    ['ctl', 'Control y comunicaciones', [['05', 'Listado de entradas y salidas', 'lazos/#doc'], ['06', 'Diagramas de lazo', 'lazos/#lazos'], ['09', 'Diagrama de bloques de control', 'lazos/#blq'], ['H5', 'Simulador de espesamiento', 'espesador/']]],
    ['ene', 'Energía y canalizaciones', [['07', 'Listado de circuitos', 'lazos/#circ'], ['08', 'Unilineales TDI', 'lazos/#uni'], ['H3', 'Canalizaciones (conduit)', 'lazos/#cond'], ['ES', 'Escalerillas portaconductores', '#escalerillas']]]
  ];
  var CLAVE = 'reyengi-marco', U = { w: 244, plegado: false, cerrados: {} };
  try { Object.assign(U, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
  function recordar() { try { localStorage.setItem(CLAVE, JSON.stringify(U)); } catch (e) {} }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function ruta(u) { var x = new URL(u, location.href); return x.pathname.replace(/index\.html$/, ''); }
  var AQUI = ruta(location.href), SECC = /^#(inst|doc|lazos|circ|uni|blq|cond|io|mod|cfg)$/;
  function esActual(href) {
    var u = new URL(href, location.href), p = u.pathname.replace(/index\.html$/, '');
    if (p !== AQUI) return false;
    if (u.hash) return location.hash === u.hash || (u.hash === '#lazos' && /lazos\/$/.test(p) && !SECC.test(location.hash));
    return !SECC.test(location.hash);
  }
  function proyecto() { var P = window.REProyectos; try { var a = P && P.activo(); return a ? (a.nombre || a.proyecto || 'Proyecto') : 'Proyecto'; } catch (e) { return 'Proyecto'; } }
  function cuentas() { // contadores baratos, si el almacén del proyecto está cargado en esta página
    var P = window.REProyectos, c = {}; if (!P || !P.leer) return c;
    try { var L = P.leer('lazos', null); if (L) { var n = (L.senales || []).length + (L.inst || []).filter(function (i) { return i.manual && !i.oculto; }).length; if (n) c['02'] = n; if ((L.senales || []).length) c['05'] = L.senales.length; } } catch (e) {}
    try { var D = P.leer('pid', null); if (D && D.cand && D.cand.length) c['01'] = D.cand.length; } catch (e) {}
    return c;
  }
  var aside, titulo = '';
  function pintar() {
    var C = cuentas(), local = document.getElementById('rsLocal'), hay = false;
    if (local) local.remove();
    var h = '<h2>Explorador</h2><ul role="tree" aria-label="Suite ReyEngi"><li role="none"><a class="nodo" role="treeitem" href="' + BASE + 'proyectos/" title="Proyecto activo: datos, firmas y revisiones"><span class="tw">▾</span><span class="ic"></span><span class="tx"><b>' + esc(proyecto()) + '</b></span></a><ul role="group">';
    GRUPOS.forEach(function (g) {
      var ab = !U.cerrados[g[0]];
      h += '<li role="none"><button type="button" class="nodo" role="treeitem" data-g="' + g[0] + '" aria-expanded="' + ab + '" title="' + esc(g[1]) + '"><span class="tw">' + (ab ? '▾' : '▸') + '</span><span class="ic"></span><span class="tx">' + esc(g[1]) + '</span></button>';
      if (ab) h += '<ul role="group">' + g[2].map(function (e) {
        var href = BASE + e[2], act = esActual(href); if (act) { hay = true; titulo = e[1]; }
        return '<li role="none"><a class="nodo" role="treeitem" href="' + href + '"' + (act ? ' aria-current="page"' : '') + ' title="' + esc(e[1]) + '"><span class="tw"></span><span class="cod">' + e[0] + '</span><span class="tx">' + esc(e[1]) + '</span>' + (C[e[0]] ? '<span class="ct">' + C[e[0]] + '</span>' : '') + '</a>' + (act ? '<div id="rsHueco"></div>' : '') + '</li>';
      }).join('') + '</ul>';
      h += '</li>';
    });
    h += '</ul></li></ul>';
    aside.querySelector('.rs-cuerpo').innerHTML = h;
    var hueco = document.getElementById('rsHueco');
    if (local && hueco) hueco.replaceWith(local); else if (local) aside.querySelector('.rs-cuerpo').appendChild(local);
    var est = document.getElementById('rsEstado');
    if (est) est.innerHTML = '<span>Proyecto: <b>' + esc(proyecto()) + '</b></span>' + (titulo ? '<span>Módulo: <b>' + esc(titulo) + '</b></span>' : '') + '<span class="esp"></span><span>Los datos se guardan en este navegador</span>';
  }
  function iniciar() {
    if (document.getElementById('rsMarco') || window.self !== window.top) return; // no dentro de marcos incrustados
    var b = document.body; b.classList.add('rs-marco');
    aside = document.createElement('aside'); aside.id = 'rsMarco'; aside.className = 'rs-arbol'; aside.setAttribute('aria-label', 'Explorador de la suite');
    aside.innerHTML = '<div class="rs-cab"><a href="' + BASE + '">Suite ReyEngi<small>Ingeniería de instrumentación y control</small></a><button type="button" id="rsPlegar" aria-label="Ocultar el explorador" title="Ocultar el explorador">«</button></div><nav class="rs-cuerpo"></nav>';
    b.insertBefore(aside, b.firstChild);
    var div = document.createElement('div'); div.className = 'rs-div'; div.setAttribute('role', 'separator'); div.setAttribute('aria-orientation', 'vertical'); div.setAttribute('aria-label', 'Ancho del explorador'); b.appendChild(div);
    // Botón para abrir (plegado o en pantallas angostas): al inicio de la barra de la página
    var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'rs-abrir'; ab.id = 'rsAbrir'; ab.setAttribute('aria-label', 'Mostrar el explorador'); ab.title = 'Mostrar el explorador'; ab.textContent = '☰';
    var fila = document.querySelector('.barra .fila') || document.querySelector('header .topin') || document.querySelector('.barra');
    if (fila) fila.insertBefore(ab, fila.firstChild); else { ab.style.cssText = 'position:fixed;left:8px;top:8px;z-index:14;background:#022A55'; b.appendChild(ab); }
    // Barra de estado (si la página no trae la suya)
    if (!document.querySelector('footer.estado')) { var f = document.createElement('footer'); f.className = 'rs-estado'; f.id = 'rsEstado'; b.appendChild(f); b.classList.add('rs-conestado'); }
    // Árbol propio del módulo
    var loc = document.getElementById('arbol');
    if (loc) { var caja = document.createElement('div'); caja.id = 'rsLocal'; caja.appendChild(loc); aside.querySelector('.rs-cuerpo').appendChild(caja); b.classList.add('rs-local'); }
    function medidas() { document.documentElement.style.setProperty('--rs-w', U.w + 'px'); b.classList.toggle('rs-plegado', !!U.plegado); window.dispatchEvent(new Event('resize')); }
    medidas(); pintar();
    if (loc && window.PID_UI) window.PID_UI.cambio();
    var movil = window.matchMedia('(max-width: 900px)'), velo = null;
    function cerrarMovil() { b.classList.remove('rs-movil-abierto'); if (velo) { velo.remove(); velo = null; } }
    document.getElementById('rsPlegar').addEventListener('click', function () { if (movil.matches) { cerrarMovil(); ab.focus(); return; } U.plegado = true; recordar(); medidas(); ab.focus(); });
    ab.addEventListener('click', function () {
      if (movil.matches) { b.classList.add('rs-movil-abierto'); velo = document.createElement('div'); velo.className = 'rs-velo'; velo.addEventListener('click', cerrarMovil); b.appendChild(velo); document.getElementById('rsPlegar').focus(); return; }
      U.plegado = false; recordar(); medidas(); document.getElementById('rsPlegar').focus();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.classList.contains('rs-movil-abierto')) { cerrarMovil(); ab.focus(); } });
    aside.addEventListener('click', function (e) {
      var g = e.target.closest('[data-g]');
      if (g) { U.cerrados[g.dataset.g] = !U.cerrados[g.dataset.g]; recordar(); pintar(); var n = aside.querySelector('[data-g="' + g.dataset.g + '"]'); if (n) n.focus(); return; }
      if (e.target.closest('a.nodo') && movil.matches) cerrarMovil();
    });
    aside.addEventListener('keydown', function (e) {
      var n = e.target.closest('.nodo'); if (!n || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      var L = [].slice.call(aside.querySelectorAll('.nodo')), i = L.indexOf(n) + (e.key === 'ArrowDown' ? 1 : -1);
      if (L[i]) { e.preventDefault(); e.stopPropagation(); L[i].focus(); }
    }, true);
    div.addEventListener('pointerdown', function (e) {
      e.preventDefault(); div.setPointerCapture(e.pointerId); div.classList.add('act');
      function mv(ev) { U.w = Math.max(180, Math.min(460, Math.round(ev.clientX))); document.documentElement.style.setProperty('--rs-w', U.w + 'px'); }
      function up() { div.classList.remove('act'); div.removeEventListener('pointermove', mv); div.removeEventListener('pointerup', up); recordar(); window.dispatchEvent(new Event('resize')); }
      div.addEventListener('pointermove', mv); div.addEventListener('pointerup', up);
    });
    window.addEventListener('hashchange', pintar);
    window.addEventListener('storage', function (ev) { if (ev.key && /reyengi/.test(ev.key) && ev.key !== CLAVE) pintar(); });
    var sp = document.getElementById('proy'); if (sp) sp.addEventListener('change', function () { setTimeout(pintar, 50); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
