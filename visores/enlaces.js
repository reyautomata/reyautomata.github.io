/* Suite ReyEngi · ir y volver entre ventanas conectadas.
 * Arriba, en la misma línea de la ruta, muestra «← Volver a …» (el lugar desde donde se llegó) y los accesos cruzados
 * a los módulos que comparten datos con el que está en pantalla (por ejemplo lazos ⇄ señales de E/S ⇄ tarjetas). */
(function () {
  'use strict';
  if (window.top !== window || !window.RS_GRUPOS || window.RE_ENLACES) return; window.RE_ENLACES = true;
  // Qué se conecta con qué (por código del explorador): comparten tags, señales, circuitos o instrumentos
  var CON = { '06': ['E1', 'E2', '05', '02'], 'E1': ['06', 'E2', '05', '02', '07'], 'E2': ['E1', '06'], '05': ['E1', '06'], '02': ['E1', '03', '04', '11', '10'], '07': ['08', 'MC', 'E1'], '08': ['07', 'E1'],
    '09': ['E1', '06'], 'MC': ['07', '08'], 'H3': ['07', '08'], '03': ['02', '04', '11'], '04': ['03', '11', '02'], '11': ['02', '03', '04'], '10': ['02', '03'], '01': ['02', 'E1'], 'CF': ['06', 'E1'] };
  var CORTO = { '06': 'Diagramas de lazo', 'E1': 'Señales de E/S', 'E2': 'Tarjetas y canales', '05': 'Listado de E/S', '02': 'Instrumentos', '07': 'Circuitos', '08': 'Unilineales', '09': 'Bloques', 'MC': 'Canalizaciones', 'H3': 'Canalizaciones',
    '03': 'Hojas de datos', '04': 'Especificaciones', '11': 'Requisiciones', '10': 'Montaje', '01': 'P&ID', 'CF': 'Configuración' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function item(cod) { var r = null; window.RS_GRUPOS.forEach(function (g) { g[2].forEach(function (e) { if (!r && e[0] === cod && e[2]) r = e; }); }); return r; }
  function url(href) { return new URL(href, window.RS_BASE).href; }
  function pila() { try { return JSON.parse(sessionStorage.getItem('reyengi-ruta') || '[]'); } catch (e) { return []; } }
  function poner(p) { try { sessionStorage.setItem('reyengi-ruta', JSON.stringify(p.slice(-30))); } catch (e) {} }
  function aqui() { var a = window.RS_ACTUAL && window.RS_ACTUAL(); return a ? { cod: a.cod, t: CORTO[a.cod] || a.t, u: url(a.href) } : null; }
  function registrar() { var a = aqui(); if (!a) return; var p = pila(), n = p.length;
    if (n && p[n - 1].cod === a.cod) return;
    if (n > 1 && p[n - 2].cod === a.cod) p.pop(); else p.push(a);     // volver deshace el paso; ir a otro lado lo agrega
    poner(p); }
  function pintar() {
    var cab = document.querySelector('.barra') || document.querySelector('header.top'); if (!cab) return;
    var c = document.getElementById('rsCruce'); if (!c) { c = document.createElement('nav'); c.id = 'rsCruce'; c.className = 'rs-cruce'; c.setAttribute('aria-label', 'Volver y ventanas conectadas'); cab.appendChild(c); }
    var a = aqui(), p = pila(), ant = a && p.length > 1 && p[p.length - 1].cod === a.cod ? p[p.length - 2] : null, h = '';
    if (ant) h += '<a class="rs-volver" href="' + esc(ant.u) + '" title="Volver al lugar desde donde llegaste">← Volver a ' + esc(ant.t) + '</a>';
    var con = a ? (CON[a.cod] || []).map(item).filter(Boolean) : [];
    if (con.length) h += '<span class="rs-con">Conectado con</span>' + con.map(function (e) { return '<a class="rs-ir' + (ant && ant.cod === e[0] ? ' rs-origen' : '') + '" href="' + esc(url(e[2])) + '" title="Ir a ' + esc(e[1]) + ' (comparte datos con esta ventana)">⇄ ' + esc(CORTO[e[0]] || e[1]) + '</a>'; }).join('');
    c.innerHTML = h; c.hidden = !h;
  }
  function todo() { registrar(); pintar(); }
  var st = document.createElement('style');
  st.textContent = '.rs-cruce{position:absolute;right:150px;top:3px;z-index:3;display:flex;align-items:center;gap:6px;max-width:58%;overflow:hidden;white-space:nowrap;font:600 11.5px system-ui,"Segoe UI",sans-serif}' +
    '.rs-cruce[hidden]{display:none}.rs-cruce a{color:#EAF2F8;text-decoration:none;border:1px solid #2C4563;border-radius:12px;padding:3px 10px;background:#18283C;flex:none}' +
    '.rs-cruce a:hover,.rs-cruce a:focus-visible{border-color:#38C8E8;outline:none}.rs-cruce a:focus-visible{box-shadow:0 0 0 2px #38C8E8}' +
    '.rs-cruce a.rs-volver{background:#FF8C32;border-color:#FF8C32;color:#1b0d02}.rs-cruce a.rs-volver:hover{background:#ffa25a}' +
    '.rs-cruce a.rs-ir{border-color:#159DDA;color:#bfe9fb}.rs-cruce a.rs-origen{display:none}.rs-cruce .rs-con{color:#94A9BE;font-weight:500;font-size:10.5px;margin-left:4px;flex:none}' +
    '@media (max-width:1250px){.rs-cruce .rs-con,.rs-cruce a.rs-ir{display:none}}@media print{.rs-cruce{display:none!important}}';
  document.head.appendChild(st);
  setTimeout(todo, 250); setTimeout(todo, 1200);
  window.addEventListener('hashchange', function () { setTimeout(todo, 80); });
})();
