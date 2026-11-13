/* Suite ReyEngi · marco común de todas las páginas.
 * Explorador lateral (jerarquía de ingeniería, entregables generados, búsqueda, recientes), ruta de navegación,
 * barra de estado y textos de ayuda plegables. Referencias de diseño: explorador de ProjectWise, árbol de archivos
 * de GitHub (Primer TreeView) y exploradores web tipo react-arborist: selección visible, teclado, búsqueda en el
 * árbol y expandir o contraer todo. Un módulo puede alojar su propio árbol bajo su nodo con un elemento #arbol. */
(function () {
  'use strict';
  var BASE = (function () { try { return new URL('.', document.currentScript.src).href; } catch (e) { return '../'; } })();
  var GRUPOS = [
    ['ini', 'Inicio', [['IN', 'Resumen de la suite', '#inicio'], ['ET', 'Etapas del proyecto', '#ciclo'], ['DI', 'Ingeniería por disciplina', '#ingenieria'], ['BF', 'Brownfield y mejora continua', '#brownfield']]],
    ['ges', 'Gestión del proyecto', [['00', 'Proyecto', 'proyectos/'], ['CF', 'Configuración de entregables', 'lazos/#cfg'], ['11', 'Requisiciones de compra', 'requisiciones/'], ['H4', 'Normativa SEC y reglas', 'normativa/']]],
    ['pro', 'Procesos y P&ID', [['01', 'Análisis de P&ID', 'pid/'], ['H1', 'Piping para leer P&ID', 'piping/#aprender']]],
    ['ins', 'Instrumentación', [['02', 'Listado de instrumentos', 'lazos/#inst'], ['03', 'Hojas de datos', 'hojas-datos/'], ['04', 'Especificaciones técnicas', 'especificaciones/'], ['H2', 'Válvulas: tamaño y actuador', 'piping/#valvulas'], ['10', 'Detalles típicos de montaje', '#montajes']]],
    ['ctl', 'Control y comunicaciones', [['E1', 'Señales de E/S (edición)', 'lazos/#io'], ['E2', 'Tarjetas y canales', 'lazos/#mod'], ['05', 'Listado de entradas y salidas', 'lazos/#doc'], ['06', 'Diagramas de lazo', 'lazos/#lazos'], ['09', 'Diagrama de bloques de control', 'lazos/#blq'], ['H5', 'Simulador de espesamiento', 'espesador/']]],
    ['ene', 'Energía y canalizaciones', [['07', 'Listado de circuitos', 'lazos/#circ'], ['08', 'Unilineales TDI', 'lazos/#uni'], ['H3', 'Canalizaciones (conduit)', 'lazos/#cond'], ['ES', 'Escalerillas portaconductores', '#escalerillas']]]
  ];
  var CLAVE = 'reyengi-marco', U = { w: 252, plegado: false, cerrados: {}, hijos: {}, rec: [] };
  try { Object.assign(U, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
  U.rec = U.rec || []; U.hijos = U.hijos || {}; U.cerrados = U.cerrados || {};
  function recordar() { try { localStorage.setItem(CLAVE, JSON.stringify(U)); } catch (e) {} }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function ruta(u) { var x = new URL(u, location.href); return x.pathname.replace(/index\.html$/, ''); }
  var AQUI = ruta(location.href), SECC = /^#(inst|doc|lazos|circ|uni|blq|cond|io|mod|cfg)$/, EN_LAZOS = /\/lazos\/$/.test(AQUI), EN_INICIO = AQUI === ruta(BASE);
  function seccion() { // sección visible del módulo de entregables: la pestaña activa o, si no hay, la del enlace
    var t = document.querySelector('.barra .tabs [aria-selected="true"]'); if (t && t.dataset.v) return '#' + t.dataset.v;
    if (/^#lazo=/.test(location.hash)) return '#lazos'; if (/^#ducto=/.test(location.hash)) return '#cond';
    return SECC.test(location.hash) ? location.hash : '#lazos';
  }
  var MONT = {}; // en la portada: enlaces de las categorías de detalles de montaje
  function esActual(href) {
    var u = new URL(href, location.href), p = u.pathname.replace(/index\.html$/, '');
    if (p !== AQUI) return false;
    if (EN_LAZOS) return u.hash === seccion();
    if (EN_INICIO) { var h = location.hash || '#inicio'; if (u.hash === '#montajes') return h === '#montajes' || !!MONT[h]; return u.hash === h; }
    if (u.hash) return location.hash === u.hash || (!location.hash && /#aprender$/.test(u.hash));
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
        var nom = h3 ? h3.textContent.replace(/^ET /, '') : c.dataset.id;
        return cod === '03' && tg ? { t: tg.textContent, s: nom, href: hash, act: decodeURIComponent(location.hash) === hash } : { t: '', s: nom, href: hash, act: decodeURIComponent(location.hash) === hash };
      });
    }
    if (cod === '10' && EN_INICIO) { // categorías de detalles de montaje (portada)
      MONT = {};
      return [].map.call(document.querySelectorAll('#tabs [data-tab]'), function (b) {
        var h = '#' + (b.dataset.h || 'montajes'), n = b.querySelector('.tn'); MONT[h] = 1;
        return { t: '', s: b.firstChild.textContent.trim(), n: n ? n.textContent : '', href: BASE + h, act: b.getAttribute('aria-selected') === 'true' && (location.hash === h || (h === '#montajes' && location.hash === '#montajes')), tab: b.dataset.tab };
      });
    }
    return [];
  }
  function proyecto() { var P = window.REProyectos; try { var a = P && P.activo(); return a ? (a.nombre || a.proyecto || 'Proyecto') : 'Proyecto'; } catch (e) { return 'Proyecto'; } }
  function cuentas() {
    var P = window.REProyectos, c = {}; if (!P || !P.leer) return c;
    try { var L = P.leer('lazos', null); if (L) { var n = (L.senales || []).length + (L.inst || []).filter(function (i) { return i.manual && !i.oculto; }).length; if (n) c['02'] = n; if ((L.senales || []).length) { c['05'] = L.senales.length; c.E1 = L.senales.length; } } } catch (e) {}
    try { var D = P.leer('pid', null); if (D && D.cand && D.cand.length) c['01'] = D.cand.length; } catch (e) {}
    return c;
  }
  var aside, filtro = '', actual = null;
  function nodoHijo(x) {
    return '<li role="none"><a class="nodo hij" role="treeitem" href="' + esc(x.href) + '"' + (x.act ? ' aria-current="true"' : '') + (x.tab ? ' data-mtab="' + esc(x.tab) + '"' : '') + ' title="' + esc((x.t ? x.t + ' · ' : '') + x.s) + '"><span class="tw"></span><span class="ic fic"></span><span class="tx">' + (x.t ? '<b>' + esc(x.t) + '</b> ' : '') + (x.s ? '<i>' + esc(x.s) + '</i>' : '') + '</span>' + (x.n ? '<span class="ct">' + esc(x.n) + '</span>' : '') + '</a></li>';
  }
  function pintar() {
    var C = cuentas(), local = document.getElementById('rsLocal'), q = norm(filtro), nRes = 0;
    if (local) local.remove();
    actual = null;
    var h = '';
    // Recientes: lo último que se abrió, para volver con un clic
    var rec = U.rec.filter(function (r) { return r && r.href; }).slice(0, 6);
    if (rec.length && !q) {
      var abR = !U.cerrados.rec;
      h += '<ul role="tree" aria-label="Recientes"><li role="none"><button type="button" class="nodo" role="treeitem" data-g="rec" aria-expanded="' + abR + '"><span class="tw">' + (abR ? '▾' : '▸') + '</span><span class="ic rel"></span><span class="tx">Recientes</span></button>' +
        (abR ? '<ul role="group">' + rec.map(function (r) { return '<li role="none"><a class="nodo hij" role="treeitem" href="' + esc(BASE + r.href) + '" title="' + esc(r.t) + '"><span class="tw"></span><span class="ic fic"></span><span class="tx">' + (r.c ? '<b>' + esc(r.c) + '</b> ' : '') + '<i>' + esc(r.t) + '</i></span></a></li>'; }).join('') + '</ul>' : '') + '</li></ul>';
    }
    h += '<ul role="tree" aria-label="Suite ReyEngi"><li role="none"><a class="nodo" role="treeitem" href="' + BASE + 'proyectos/" title="Proyecto activo: datos, firmas y revisiones"><span class="tw">▾</span><span class="ic pry"></span><span class="tx"><b>' + esc(proyecto()) + '</b></span></a><ul role="group">';
    GRUPOS.forEach(function (g) {
      var ab = q ? true : !U.cerrados[g[0]], cuerpo = '';
      g[2].forEach(function (e) {
        var href = BASE + e[2], act = esActual(href), H = hijosDe(e[0]);
        if (act && esActual(href)) actual = { g: g[1], cod: e[0], t: e[1], href: e[2], hijo: H.filter(function (x) { return x.act; })[0] || null };
        var Hv = q ? H.filter(function (x) { return norm(x.t + ' ' + x.s).indexOf(q) >= 0; }) : H;
        if (q && norm(e[0] + ' ' + e[1]).indexOf(q) < 0 && !Hv.length) return;
        if (q && norm(e[0] + ' ' + e[1]).indexOf(q) >= 0 && !Hv.length) Hv = []; // coincide el módulo: sin hijos filtrados
        nRes += 1 + Hv.length;
        var abH = H.length && (q ? Hv.length > 0 : (U.hijos[e[0]] != null ? U.hijos[e[0]] : act)), n = C[e[0]] || (H.length ? H.length : '');
        cuerpo += '<li role="none"><a class="nodo" role="treeitem" href="' + href + '"' + (act ? ' aria-current="page"' : '') + (H.length ? ' aria-expanded="' + !!abH + '"' : '') + ' title="' + esc(e[1]) + '"><span class="tw"' + (H.length ? ' data-h="' + e[0] + '" title="' + (abH ? 'Ocultar' : 'Mostrar') + ' los entregables"' : '') + '>' + (H.length ? (abH ? '▾' : '▸') : '') + '</span><span class="cod">' + e[0] + '</span><span class="tx">' + esc(e[1]) + '</span>' + (n ? '<span class="ct">' + n + '</span>' : '') + '</a>' +
          (abH ? '<ul role="group" class="rs-hijos">' + Hv.map(nodoHijo).join('') + '</ul>' : '') + (act ? '<div id="rsHueco"></div>' : '') + '</li>';
      });
      if (q && !cuerpo) return;
      h += '<li role="none"><button type="button" class="nodo grp" role="treeitem" data-g="' + g[0] + '" aria-expanded="' + ab + '" title="' + esc(g[1]) + '"><span class="tw">' + (ab ? '▾' : '▸') + '</span><span class="ic"></span><span class="tx">' + esc(g[1]) + '</span></button>' + (ab ? '<ul role="group">' + cuerpo + '</ul>' : '') + '</li>';
    });
    h += '</ul></li></ul>' + (q && !nRes ? '<p class="rs-nada">Nada coincide con «' + esc(filtro) + '».</p>' : '');
    aside.querySelector('.rs-lista').innerHTML = h;
    var hueco = document.getElementById('rsHueco');
    if (local && hueco) hueco.replaceWith(local); else if (local) aside.querySelector('.rs-lista').appendChild(local);
    pintarRuta();
  }
  function pintarRuta() {
    var a = actual, pr = proyecto();
    var r = document.getElementById('rsRuta');
    if (r) r.innerHTML = '<a href="' + BASE + '">Suite ReyEngi</a><span>›</span><a href="' + BASE + 'proyectos/">' + esc(pr) + '</a>' + (a ? '<span>›</span><span class="g">' + esc(a.g) + '</span><span>›</span>' + (a.hijo ? '<a href="' + BASE + a.href + '">' + esc(a.t) + '</a><span>›</span><b>' + esc((a.hijo.t ? a.hijo.t + ' ' : '') + a.hijo.s) + '</b>' : '<b>' + esc(a.t) + '</b>') : '');
    var h1 = document.querySelector('.barra h1'); if (EN_LAZOS && h1 && a && h1.firstChild && h1.firstChild.nodeType === 3) h1.firstChild.nodeValue = a.t;
    var est = document.getElementById('rsEstado');
    if (est) est.innerHTML = '<span>Proyecto: <b>' + esc(pr) + '</b></span>' + (a ? '<span>Módulo: <b>' + esc(a.t) + '</b></span>' : '') + (a && a.hijo ? '<span>Entregable: <b>' + esc((a.hijo.t ? a.hijo.t + ' ' : '') + a.hijo.s) + '</b></span>' : '') + '<span class="esp"></span><span>Los datos se guardan en este navegador</span>';
    // Recientes: se anota el entregable abierto o, si no hay, el módulo
    if (a && !(EN_INICIO && !a.hijo)) {
      var it = a.hijo ? { c: a.hijo.t || a.cod, t: a.hijo.s || a.t, href: a.hijo.href.replace(BASE, '').replace(/^#/, a.href.replace(/#.*$/, '') + '#') } : { c: a.cod, t: a.t, href: a.href };
      if (!U.rec[0] || U.rec[0].href !== it.href) { U.rec = [it].concat(U.rec.filter(function (x) { return x.href !== it.href; })).slice(0, 7); recordar(); }
    }
  }
  // Textos de ayuda largos: dos líneas y «ver más»
  function plegarTextos() {
    [].forEach.call(document.querySelectorAll('main p.intro, main p.ayuda'), function (p) {
      if (p.dataset.rs || p.textContent.length < 190 || p.closest('.pg, dialog')) return; p.dataset.rs = '1'; p.classList.add('rs-corto'); p.title = 'Clic para ver el texto completo';
      p.setAttribute('role', 'button'); p.tabIndex = 0;
      function alt(e) { if (e.target.closest('a, button, input')) return; p.classList.toggle('rs-corto'); }
      p.addEventListener('click', alt); p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alt(e); } });
    });
  }
  function iniciar() {
    if (document.getElementById('rsMarco') || window.self !== window.top) return; // no dentro de marcos incrustados
    var b = document.body; b.classList.add('rs-marco');
    aside = document.createElement('aside'); aside.id = 'rsMarco'; aside.className = 'rs-arbol'; aside.setAttribute('aria-label', 'Explorador de la suite');
    aside.innerHTML = '<div class="rs-cab"><a href="' + BASE + '">Suite ReyEngi<small>Ingeniería de instrumentación y control</small></a><button type="button" id="rsPlegar" aria-label="Ocultar el explorador" title="Ocultar el explorador">«</button></div>' +
      '<div class="rs-herr"><input type="search" id="rsBuscar" placeholder="Buscar módulo o entregable" aria-label="Buscar en el explorador" autocomplete="off"><button type="button" id="rsAbrirTodo" title="Expandir todo" aria-label="Expandir todo">＋</button><button type="button" id="rsCerrarTodo" title="Contraer todo" aria-label="Contraer todo">－</button></div>' +
      '<nav class="rs-cuerpo"><h2>Explorador</h2><div class="rs-lista"></div></nav>';
    b.insertBefore(aside, b.firstChild);
    var div = document.createElement('div'); div.className = 'rs-div'; div.setAttribute('role', 'separator'); div.setAttribute('aria-orientation', 'vertical'); div.setAttribute('aria-label', 'Ancho del explorador'); b.appendChild(div);
    var cab = document.querySelector('.barra') || document.querySelector('header.top'), fila = document.querySelector('.barra .fila') || document.querySelector('header .topin') || cab;
    var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'rs-abrir'; ab.id = 'rsAbrir'; ab.setAttribute('aria-label', 'Mostrar el explorador'); ab.title = 'Mostrar el explorador'; ab.textContent = '☰';
    if (fila) fila.insertBefore(ab, fila.firstChild); else { ab.style.cssText = 'position:fixed;left:8px;top:8px;z-index:14;background:#0B2545'; b.appendChild(ab); }
    // Ruta de navegación, igual en todas las páginas
    var rt = document.createElement('nav'); rt.className = 'rs-ruta'; rt.id = 'rsRuta'; rt.setAttribute('aria-label', 'Ruta'); if (cab) cab.insertBefore(rt, cab.firstChild);
    if (!document.querySelector('footer.estado')) { var f = document.createElement('footer'); f.className = 'rs-estado'; f.id = 'rsEstado'; b.appendChild(f); b.classList.add('rs-conestado'); }
    var loc = document.getElementById('arbol');
    if (loc) { var caja = document.createElement('div'); caja.id = 'rsLocal'; caja.appendChild(loc); aside.querySelector('.rs-lista').appendChild(caja); b.classList.add('rs-local'); }
    function medidas() { document.documentElement.style.setProperty('--rs-w', U.w + 'px'); b.classList.toggle('rs-plegado', !!U.plegado); window.dispatchEvent(new Event('resize')); }
    medidas(); pintar(); plegarTextos();
    if (loc && window.PID_UI) window.PID_UI.cambio();
    var movil = window.matchMedia('(max-width: 900px)'), velo = null;
    function cerrarMovil() { b.classList.remove('rs-movil-abierto'); if (velo) { velo.remove(); velo = null; } }
    var pes = document.createElement('button'); pes.type = 'button'; pes.className = 'rs-pestana'; pes.id = 'rsPestana'; pes.textContent = 'Explorador'; pes.setAttribute('aria-label', 'Mostrar el explorador'); b.appendChild(pes);
    pes.addEventListener('click', function () { U.plegado = false; recordar(); medidas(); document.getElementById('rsPlegar').focus(); });
    document.getElementById('rsPlegar').addEventListener('click', function () { if (movil.matches) { cerrarMovil(); ab.focus(); return; } U.plegado = true; recordar(); medidas(); pes.focus(); });
    ab.addEventListener('click', function () {
      if (movil.matches) { b.classList.add('rs-movil-abierto'); velo = document.createElement('div'); velo.className = 'rs-velo'; velo.addEventListener('click', cerrarMovil); b.appendChild(velo); document.getElementById('rsPlegar').focus(); return; }
      U.plegado = false; recordar(); medidas(); document.getElementById('rsPlegar').focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && b.classList.contains('rs-movil-abierto')) { cerrarMovil(); ab.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) { e.preventDefault(); if (U.plegado && !movil.matches) { U.plegado = false; recordar(); medidas(); } else if (movil.matches && !b.classList.contains('rs-movil-abierto')) ab.click(); document.getElementById('rsBuscar').focus(); }
    });
    var bq = document.getElementById('rsBuscar');
    bq.addEventListener('input', function () { filtro = bq.value.trim(); pintar(); });
    bq.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { var n = aside.querySelector('.rs-lista .nodo'); if (n) { e.preventDefault(); n.focus(); } } if (e.key === 'Escape' && bq.value) { e.stopPropagation(); bq.value = ''; filtro = ''; pintar(); } });
    document.getElementById('rsAbrirTodo').addEventListener('click', function () { U.cerrados = {}; GRUPOS.forEach(function (g) { g[2].forEach(function (e) { U.hijos[e[0]] = true; }); }); recordar(); pintar(); });
    document.getElementById('rsCerrarTodo').addEventListener('click', function () { GRUPOS.forEach(function (g) { U.cerrados[g[0]] = true; g[2].forEach(function (e) { U.hijos[e[0]] = false; }); }); U.cerrados.rec = true; recordar(); pintar(); });
    aside.addEventListener('click', function (e) {
      var tw = e.target.closest('[data-h]');
      if (tw) { e.preventDefault(); var k = tw.dataset.h, a0 = tw.closest('.nodo').getAttribute('aria-expanded') === 'true'; U.hijos[k] = !a0; recordar(); pintar(); return; }
      var g = e.target.closest('[data-g]');
      if (g) { U.cerrados[g.dataset.g] = !U.cerrados[g.dataset.g]; recordar(); pintar(); var n = aside.querySelector('[data-g="' + g.dataset.g + '"]'); if (n) n.focus(); return; }
      var m = e.target.closest('[data-mtab]'); // categoría de detalles de montaje: se activa su pestaña de la portada
      if (m) { var t = document.querySelector('#tabs [data-tab="' + m.dataset.mtab + '"]'); if (t) { e.preventDefault(); t.click(); var s = document.getElementById('montajes'); if (s) s.scrollIntoView({ block: 'start' }); setTimeout(pintar, 60); } }
      if (e.target.closest('a.nodo') && movil.matches) cerrarMovil();
    });
    aside.addEventListener('keydown', function (e) {
      var n = e.target.closest('.nodo'); if (!n) return;
      var L = [].slice.call(aside.querySelectorAll('.nodo')), i = L.indexOf(n);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { var o = L[i + (e.key === 'ArrowDown' ? 1 : -1)]; e.preventDefault(); e.stopPropagation(); if (o) o.focus(); else if (e.key === 'ArrowUp') bq.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); L[0].focus(); } else if (e.key === 'End') { e.preventDefault(); L[L.length - 1].focus(); }
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && n.hasAttribute('aria-expanded') && !n.closest('#rsLocal')) {
        var abierto = n.getAttribute('aria-expanded') === 'true'; if (abierto === (e.key === 'ArrowRight')) return; e.preventDefault(); e.stopPropagation();
        var t2 = n.querySelector('[data-h]'); if (t2) { U.hijos[t2.dataset.h] = !abierto; } else if (n.dataset.g) U.cerrados[n.dataset.g] = abierto; recordar(); pintar();
        var sel = n.dataset.g ? '[data-g="' + n.dataset.g + '"]' : 'a.nodo[href="' + n.getAttribute('href') + '"]', f = aside.querySelector(sel); if (f) f.focus();
      }
    }, true);
    div.addEventListener('pointerdown', function (e) {
      e.preventDefault(); div.setPointerCapture(e.pointerId); div.classList.add('act');
      function mv(ev) { U.w = Math.max(190, Math.min(480, Math.round(ev.clientX))); document.documentElement.style.setProperty('--rs-w', U.w + 'px'); }
      function up() { div.classList.remove('act'); div.removeEventListener('pointermove', mv); div.removeEventListener('pointerup', up); recordar(); window.dispatchEvent(new Event('resize')); }
      div.addEventListener('pointermove', mv); div.addEventListener('pointerup', up);
    });
    div.addEventListener('dblclick', function () { U.plegado = true; recordar(); medidas(); pes.focus(); });
    window.addEventListener('hashchange', function () { setTimeout(function () { pintar(); plegarTextos(); }, 30); });
    var tR = 0; function luego() { clearTimeout(tR); tR = setTimeout(function () { if (!filtro) pintar(); plegarTextos(); }, 250); }
    ['.barra .tabs', '#listaLazos', '#kDuctos', '#grid', '#tabs'].forEach(function (q) { var el = document.querySelector(q); if (el) el.addEventListener('click', luego); });
    var mn = document.querySelector('main'); if (mn && (EN_LAZOS || /\/(hojas-datos|especificaciones)\/$/.test(AQUI))) { mn.addEventListener('change', luego); mn.addEventListener('click', function (e) { if (e.target.closest('button')) luego(); }); }
    window.addEventListener('storage', function (ev) { if (ev.key && /reyengi/.test(ev.key) && ev.key !== CLAVE) pintar(); });
    var sp = document.getElementById('proy'); if (sp) sp.addEventListener('change', function () { setTimeout(pintar, 50); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
