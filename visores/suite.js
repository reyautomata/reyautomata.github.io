/* Suite ReyEngi · marco común: explorador lateral con la jerarquía de ingeniería, barra de estado y plegado.
 * Se carga en todas las páginas. Un módulo puede alojar su propio árbol bajo su nodo: basta con que tenga un
 * elemento #arbol (como el Análisis de P&ID); este marco lo mueve al explorador. */
(function () {
  'use strict';
  var BASE = (function () { try { return new URL('.', document.currentScript.src).href; } catch (e) { return '../'; } })();
  var GRUPOS = [
    ['ges', 'Gestión y dirección del proyecto', [['00', 'Proyecto', 'proyectos/'], ['CF', 'Configuración de entregables', 'lazos/#cfg'], ['11', 'Requisiciones de compra', 'requisiciones/'], ['H4', 'Normativa SEC y reglas', 'normativa/']]],
    ['pro', 'Procesos y P&ID', [['01', 'Análisis de P&ID', 'pid/'], ['H1', 'Piping para leer P&ID', 'piping/#aprender']]],
    ['ins', 'Instrumentación', [['02', 'Listado de instrumentos', 'lazos/#inst'], ['03', 'Hojas de datos', 'hojas-datos/'], ['04', 'Especificaciones técnicas', 'especificaciones/'], ['H2', 'Válvulas: tamaño y actuador', 'piping/#valvulas'], ['10', 'Detalles típicos de montaje', '#montajes']]],
    ['ctl', 'Control y comunicaciones', [['E1', 'Señales de E/S (edición)', 'lazos/#io'], ['E2', 'Tarjetas y canales', 'lazos/#mod'], ['05', 'Listado de entradas y salidas', 'lazos/#doc'], ['06', 'Diagramas de lazo', 'lazos/#lazos'], ['09', 'Diagrama de bloques de control', 'lazos/#blq'], ['H5', 'Simulador de espesamiento', 'espesador/']]],
    ['ene', 'Energía y canalizaciones', [['07', 'Listado de circuitos', 'lazos/#circ'], ['08', 'Unilineales TDI', 'lazos/#uni'], ['H3', 'Canalizaciones (conduit)', 'lazos/#cond'], ['ES', 'Escalerillas portaconductores', '#escalerillas']]]
  ];
  var CLAVE = 'reyengi-marco', U = { w: 244, plegado: false, cerrados: {}, hijos: {} };
  try { Object.assign(U, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
  function recordar() { try { localStorage.setItem(CLAVE, JSON.stringify(U)); } catch (e) {} }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function ruta(u) { var x = new URL(u, location.href); return x.pathname.replace(/index\.html$/, ''); }
  var AQUI = ruta(location.href), SECC = /^#(inst|doc|lazos|circ|uni|blq|cond|io|mod|cfg)$/, EN_LAZOS = /\/lazos\/$/.test(AQUI);
  function seccion() { // sección visible del módulo de entregables: la del enlace o, si no hay, la pestaña activa
    var t = document.querySelector('.barra .tabs [aria-selected="true"]'); if (t && t.dataset.v) return '#' + t.dataset.v;
    if (/^#lazo=/.test(location.hash)) return '#lazos'; if (/^#ducto=/.test(location.hash)) return '#cond';
    return SECC.test(location.hash) ? location.hash : '#lazos';
  }
  function esActual(href) {
    var u = new URL(href, location.href), p = u.pathname.replace(/index\.html$/, '');
    if (p !== AQUI) return false;
    if (EN_LAZOS) return u.hash === seccion();
    if (u.hash) return location.hash === u.hash;
    return true;
  }
  // ── Entregables generados que cuelgan de cada nodo ──
  function lazoDe(s) {
    if (s.lazo && String(s.lazo).trim()) return String(s.lazo).trim();
    if (window.ISA) return window.ISA.lazoDe(s.tag);
    var m = /^(?:([A-Z0-9]+)-)?([A-Z]+)-?(\d+[A-Z]?)$/i.exec(String(s.tag || '').trim()); return m ? (m[1] ? m[1] + '-' : '') + m[3] : String(s.tag || '');
  }
  function hijosDe(cod) {
    var P = window.REProyectos, L = null; try { L = window.__LAZOS && window.__LAZOS.E ? window.__LAZOS.E() : (P && P.leer ? P.leer('lazos', null) : null); } catch (e) {}
    if (cod === '06') { // diagramas de lazo
      if (window.__LAZOS && window.__LAZOS.lazos) { var pres = document.querySelector('#listaLazos .itlazo[aria-pressed="true"]'); return window.__LAZOS.lazos().map(function (l) { return { t: l.id, s: l.servicio || '', href: BASE + 'lazos/#lazo=' + encodeURIComponent(l.id), act: seccion() === '#lazos' && pres && pres.dataset.id === l.id }; }); }
      if (!L || !L.senales) return [];
      var g = {}, o = []; L.senales.forEach(function (s) { if (!s.tag) return; var k = lazoDe(s); if (!g[k]) { g[k] = s.servicio || ''; o.push(k); } });
      o.sort(function (a, b) { return a.localeCompare(b, 'es', { numeric: true }); });
      return o.map(function (k) { return { t: k, s: (L.lazos && L.lazos[k] && L.lazos[k].servicio) || g[k], href: BASE + 'lazos/#lazo=' + encodeURIComponent(k) }; });
    }
    if (cod === 'H3') { // ductos de canalizaciones
      var D = (L && L.cond && L.cond.ductos) || []; return D.map(function (d) { return { t: d.tag || 'Ducto', s: d.ruta || '', href: BASE + 'lazos/#ducto=' + encodeURIComponent(d.id), act: EN_LAZOS && seccion() === '#cond' && L.cond.sel === d.id }; });
    }
    if (cod === '03' || cod === '04') { // hojas de datos y especificaciones: las de la página abierta
      var pag = cod === '03' ? /\/hojas-datos\/$/ : /\/especificaciones\/$/; if (!pag.test(AQUI)) return [];
      return [].map.call(document.querySelectorAll('#grid .tarjeta[data-id]'), function (c) {
        var h3 = c.querySelector('h3'), tg = c.querySelector('.tag, .cod'), hash = '#' + (cod === '03' ? 'h=' : 'et=') + c.dataset.id;
        var nom = h3 ? h3.textContent.replace(/^ET /, '') : c.dataset.id; // hojas de datos: sigla ISA y nombre; especificaciones: solo el nombre
        return cod === '03' && tg ? { t: tg.textContent, s: nom, href: hash, act: decodeURIComponent(location.hash) === hash } : { t: '', s: nom, href: hash, act: decodeURIComponent(location.hash) === hash };
      });
    }
    return [];
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
        var H = hijosDe(e[0]), abH = H.length && (U.hijos[e[0]] != null ? U.hijos[e[0]] : act), n = C[e[0]] || (H.length ? H.length : '');
        return '<li role="none"><a class="nodo" role="treeitem" href="' + href + '"' + (act ? ' aria-current="page"' : '') + (H.length ? ' aria-expanded="' + !!abH + '"' : '') + ' title="' + esc(e[1]) + '"><span class="tw"' + (H.length ? ' data-h="' + e[0] + '" title="' + (abH ? 'Ocultar' : 'Mostrar') + ' los entregables"' : '') + '>' + (H.length ? (abH ? '▾' : '▸') : '') + '</span><span class="cod">' + e[0] + '</span><span class="tx">' + esc(e[1]) + '</span>' + (n ? '<span class="ct">' + n + '</span>' : '') + '</a>' +
          (abH ? '<ul role="group" class="rs-hijos">' + H.map(function (x) { return '<li role="none"><a class="nodo hij" role="treeitem" href="' + esc(x.href) + '"' + (x.act ? ' aria-current="true"' : '') + ' title="' + esc((x.t ? x.t + ' · ' : '') + x.s) + '"><span class="tw"></span><span class="ic doc"></span><span class="tx">' + (x.t ? '<b>' + esc(x.t) + '</b> ' : '') + (x.s ? '<i>' + esc(x.s) + '</i>' : '') + '</span></a></li>'; }).join('') + '</ul>' : '') +
          (act ? '<div id="rsHueco"></div>' : '') + '</li>';
      }).join('') + '</ul>';
      h += '</li>';
    });
    h += '</ul></li></ul>';
    aside.querySelector('.rs-cuerpo').innerHTML = h;
    var hueco = document.getElementById('rsHueco');
    if (local && hueco) hueco.replaceWith(local); else if (local) aside.querySelector('.rs-cuerpo').appendChild(local);
    var h1 = document.querySelector('.barra h1'); if (EN_LAZOS && h1 && titulo && h1.firstChild && h1.firstChild.nodeType === 3) h1.firstChild.nodeValue = titulo;
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
    document.getElementById('rsPlegar').addEventListener('click', function () { if (movil.matches) { cerrarMovil(); ab.focus(); return; } U.plegado = true; recordar(); medidas(); var pp = document.getElementById('rsPestana'); if (pp) pp.focus(); });
    ab.addEventListener('click', function () {
      if (movil.matches) { b.classList.add('rs-movil-abierto'); velo = document.createElement('div'); velo.className = 'rs-velo'; velo.addEventListener('click', cerrarMovil); b.appendChild(velo); document.getElementById('rsPlegar').focus(); return; }
      U.plegado = false; recordar(); medidas(); document.getElementById('rsPlegar').focus();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.classList.contains('rs-movil-abierto')) { cerrarMovil(); ab.focus(); } });
    aside.addEventListener('click', function (e) {
      var tw = e.target.closest('[data-h]');
      if (tw) { e.preventDefault(); var k = tw.dataset.h, a0 = tw.closest('.nodo').getAttribute('aria-expanded') === 'true'; U.hijos[k] = !a0; recordar(); pintar(); return; }
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
    window.addEventListener('hashchange', function () { setTimeout(pintar, 30); });
    // El módulo de entregables cambia de sección y de lazo sin cambiar la dirección: se repinta tras cada clic o edición
    var tR = 0; function luego() { clearTimeout(tR); tR = setTimeout(pintar, 250); }
    ['.barra .tabs', '#listaLazos', '#kDuctos', '#grid'].forEach(function (q) { var el = document.querySelector(q); if (el) el.addEventListener('click', luego); });
    var mn = document.querySelector('main'); if (mn && (EN_LAZOS || /\/(hojas-datos|especificaciones)\/$/.test(AQUI))) { mn.addEventListener('change', luego); mn.addEventListener('click', function (e) { if (e.target.closest('button')) luego(); }); }
    // Pestaña lateral para volver a mostrar el explorador cuando está retraído
    var pes = document.createElement('button'); pes.type = 'button'; pes.className = 'rs-pestana'; pes.id = 'rsPestana'; pes.textContent = 'Explorador'; pes.setAttribute('aria-label', 'Mostrar el explorador'); b.appendChild(pes);
    pes.addEventListener('click', function () { U.plegado = false; recordar(); medidas(); document.getElementById('rsPlegar').focus(); });
    div.addEventListener('dblclick', function () { U.plegado = true; recordar(); medidas(); pes.focus(); });
    window.addEventListener('storage', function (ev) { if (ev.key && /reyengi/.test(ev.key) && ev.key !== CLAVE) pintar(); });
    var sp = document.getElementById('proy'); if (sp) sp.addEventListener('change', function () { setTimeout(pintar, 50); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
