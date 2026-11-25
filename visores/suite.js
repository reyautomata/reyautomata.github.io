/* Suite ReyEngi · marco común de todas las páginas.
 * Explorador lateral (jerarquía de ingeniería, entregables generados, búsqueda, recientes), ruta de navegación,
 * barra de estado y textos de ayuda plegables. Referencias de diseño: explorador de ProjectWise, árbol de archivos
 * de GitHub (Primer TreeView) y exploradores web tipo react-arborist: selección visible, teclado, búsqueda en el
 * árbol y expandir o contraer todo. Un módulo puede alojar su propio árbol bajo su nodo con un elemento #arbol. */
(function () {
  'use strict';
  var BASE = (function () { try { return new URL('.', document.currentScript.src).href; } catch (e) { return '../'; } })();
  // El árbol se arma desde el registro central (entregables.js): DOCUMENTOS y PLANOS con sus subcategorías.
  // Fila de módulo: [código, nombre, enlace]. Fila en desarrollo: [código, nombre, null, 'dev'].
  var REG = window.RE_ENTREGABLES;
  // Árbol del proyecto en el orden del flujo de ingeniería (00 a 09): cada grupo toma los datos del anterior.
  //   00 proyecto → 01 P&ID → 02 base de datos → 03 arquitectura → 04 diagramas → 05 montaje → 06 listados → 07 documentos → 08 compras → 09 control documental.
  // Los nombres y enlaces de los generadores salen del registro central; lo que todavía no tiene generador se muestra «En desarrollo».
  // El cuarto valor de cada grupo es su código en el árbol. Cada módulo aparece una sola vez; la configuración está al pie del explorador.
  function gen(cod, nom, href) { var g = REG && REG.porCod ? REG.porCod(cod) : null; if (g && g.status !== 'AVAILABLE') return null; return [cod, g ? g.name : nom, g ? g.module : href]; }
  function dev(id, nom) { var s = REG ? REG.subcategorias.filter(function (x) { return x.id === id; })[0] : null; if (s && s.status === 'AVAILABLE') return null; return [id, s ? s.name : nom, null, 'dev']; }
  function filas(a) { return a.filter(Boolean); }
  var GRUPOS = [
    ['ini', 'Inicio', [['IN', 'Inicio y tablero del proyecto', '#inicio'], ['S4', 'Suite 4.0 · motor de planos', 'suite-4/']]],
    ['p00', 'Proyecto', [['00', 'Datos del proyecto', 'proyectos/'], ['FA', 'Fase y alcance', 'fase/'], ['FL', 'Flujo de ingeniería', 'flujo/']], '00'],
    ['p01', 'P&ID', filas([gen('01', 'Análisis de P&ID', 'pid/'), ['H1', 'Piping para leer P&ID', 'piping/#aprender']]), '01'],
    ['p02', 'Base de datos I&C', [['E1', 'Señales de E/S e índice de tags', 'lazos/#io'], ['E2', 'Tarjetas y canales', 'lazos/#mod']], '02'],
    ['p03', 'Arquitectura de control', filas([gen('AR', 'Arquitectura de control', 'arquitectura/')]), '03'],
    ['p04', 'Diagramas', filas([gen('06', 'Diagramas de lazo', 'lazos/#lazos'), gen('09', 'Diagrama de bloques de control', 'lazos/#blq'), gen('08', 'Unilineales TDI', 'lazos/#uni'), dev('P07', 'Diagramas de conexionado'), dev('P05', 'Planos de ubicación')]), '04'],
    ['p05', 'Montaje y canalizaciones', filas([gen('10', 'Detalles típicos de montaje', '#montajes'), gen('H3', 'Canalizaciones: corte de ductos', 'lazos/#cond'), gen('ES', 'Escalerillas portaconductores', '#escalerillas'), dev('P10', 'Disposición de tableros')]), '05'],
    ['p06', 'Listados', filas([gen('02', 'Listado de instrumentos', 'lazos/#inst'), gen('05', 'Listado de entradas y salidas', 'lazos/#doc'), gen('07', 'Listado de circuitos', 'lazos/#circ'), gen('12', 'Listado de materiales', 'lazos/#mat'), gen('MC', 'Memoria de cálculo de canalizaciones', 'lazos/#cond')]), '06'],
    ['p07', 'Documentos técnicos', filas([gen('03', 'Hojas de datos', 'hojas-datos/'), gen('04', 'Especificaciones técnicas', 'especificaciones/'), dev('D02', 'Criterios y bases de diseño'), dev('D07', 'Informes técnicos'), dev('D08', 'Protocolos y procedimientos'), dev('D09', 'Matrices y registros')]), '07'],
    ['p08', 'Adquisiciones', filas([gen('11', 'Requisiciones de compra', 'requisiciones/')]), '08'],
    ['ctl', 'Control documental', [['GD', 'Todos los entregables', 'documentos/'], ['B1', 'En trabajo', 'documentos/#trabajo'], ['B2', 'Revisión de la especialidad', 'documentos/#esp'], ['B3', 'Coordinación interna', 'documentos/#coord'], ['B4', 'Firmas', 'documentos/#firmas'], ['B5', 'Para emitir', 'documentos/#emitir'], ['B6', 'Emitidos', 'documentos/#emitido'], ['EX', 'Archivos del proyecto', 'explorador/']], '09'],
    ['her', 'Herramientas', [['H2', 'Válvulas: tamaño y actuador', 'piping/#valvulas'], ['H5', 'Simulador de espesamiento', 'espesador/'], ['MT', 'Mesa de trabajo libre', 'mesa/']]],
    ['gui', 'Guía y normativa', [['ET', 'Etapas del proyecto', '#ciclo'], ['DI', 'Ingeniería por disciplina', '#ingenieria'], ['BF', 'Brownfield y mejora continua', '#brownfield'], ['H4', 'Normativa SEC y reglas', 'normativa/'], ['BT', 'Manuales, catálogos y librerías', null, 'dev']]]
  ];
  // Recorrido paso a paso (Anterior / Siguiente): los módulos del 00 al 09, en orden
  var PASOS = []; GRUPOS.forEach(function (g) { if (g[3]) g[2].forEach(function (e) { if (e[2]) PASOS.push({ cod: e[0], t: e[1], href: e[2], g: g }); }); });
  function faseAhora() { return REG && REG.faseActiva ? REG.faseActiva() : 'DE'; }
  function aplicaCod(cod, fase) { var g = REG && REG.porCod ? REG.porCod(cod) : null; return !g || REG.aplica(g, fase); }
  // Asistente de IA local (Ollama en el equipo del usuario): se carga en todas las páginas de la suite
  window.RS_GRUPOS = GRUPOS; window.RS_PASOS = PASOS; window.RS_BASE = BASE; window.RS_HIJOS = function (c) { return hijosDe(c); };
  window.RS_ACTUAL = function () { return actual; };
  if (window.top === window && window.REProyectos && !window.RE_GESTION) { var sg = document.createElement('script'); sg.src = BASE + 'gestion.js'; sg.onload = function () { if (window.RE_ARCHIVOS) return; var sf = document.createElement('script'); sf.src = BASE + 'archivos.js'; document.head.appendChild(sf); }; document.head.appendChild(sg); }
  if (window.top === window) { var sa = document.createElement('script'); sa.src = BASE + 'asistente.js'; sa.defer = true; document.head.appendChild(sa); }
  if (!window.RE_DIBUJO) { var sdb = document.createElement('script'); sdb.src = BASE + 'bases-dibujo.js'; document.head.appendChild(sdb); }
  if (window.top === window) { var se = document.createElement('script'); se.src = BASE + 'enlaces.js'; se.defer = true; document.head.appendChild(se); }
  var CLAVE = 'reyengi-marco', U = { w: 252, plegado: false, cerrados: {}, hijos: {}, rec: [], soloFase: false };
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
    return !(/documentos\/$/.test(p) && /^#(trabajo|esp|coord|firmas|emitir|emitido)$/.test(location.hash));   /* las bandejas del control documental tienen su propia fila */
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
  // Tamaño del texto de la interfaz: normal, compacto (por defecto) o mínimo. Se recuerda en este navegador.
  // Capa de diseño Windows 11 / Fluent: se carga al final para que mande sobre las hojas de cada página. Tema oscuro o claro, recordado en este navegador.
  (function () { if (document.getElementById('rsFluent') || document.querySelector('link[href*="fluent.css"]')) return; var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = BASE + 'fluent.css'; lk.id = 'rsFluent'; (document.head || document.documentElement).appendChild(lk); })();
  var tema = 'oscuro'; try { if (localStorage.getItem('reyengi-tema') === 'claro') tema = 'claro'; } catch (e) {}
  function ponerTema() { document.documentElement.setAttribute('data-tema', tema); }
  ponerTema();
  var ICO = { menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h14"/></svg>',
    conf: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.6"/><path d="M10 2.6l1.2 2 2.3-.5 1 2.1 2.1 1-.5 2.3 2 1.2-2 1.2.5 2.3-2.1 1-1 2.1-2.3-.5-1.2 2-1.2-2-2.3.5-1-2.1-2.1-1 .5-2.3-2-1.2 2-1.2-.5-2.3 2.1-1 1-2.1 2.3.5z" transform="translate(1.5 1.5) scale(.85)"/></svg>' };
  // Tamaño del texto de la interfaz: estándar Windows 11 (por defecto), compacto o mínimo. Se recuerda en este navegador.
  var TAMS = ['estándar', 'compacto', 'mínimo'], tam = 0; try { var tg = localStorage.getItem('reyengi-tam2'); if (tg !== null && TAMS[+tg]) tam = +tg; } catch (e) {}
  function ponerTam() { var b = document.body; if (!b) return; b.classList.toggle('rs-d1', tam === 1); b.classList.toggle('rs-d2', tam === 2); window.dispatchEvent(new Event('resize')); }
  if (document.body) ponerTam(); else document.addEventListener('DOMContentLoaded', ponerTam);
  var aside, filtro = '', actual = null, cinta = null;
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
    var FASE = faseAhora(), nFase = REG && REG.nombreFase ? REG.nombreFase(FASE) : '';
    h += '<ul role="tree" aria-label="Suite ReyEngi"><li role="none"><a class="nodo" role="treeitem" href="' + BASE + 'proyectos/" title="Proyecto activo: datos, firmas y revisiones"><span class="tw">▾</span><span class="ic pry"></span><span class="tx"><b>' + esc(proyecto()) + '</b></span></a>' +
      (nFase ? '<a class="rs-fase" href="' + BASE + 'fase/" title="Fase de ingeniería del proyecto: define qué entregables aplican' + (U.soloFase ? ' (el explorador muestra solo lo que aplica)' : '') + '">' + esc(nFase) + (U.soloFase ? ' · filtrado' : '') + '</a>' : '') + '<ul role="group">';
    GRUPOS.forEach(function (g) {
      var ab = q ? true : !U.cerrados[g[0]], cuerpo = '';
      g[2].forEach(function (e) {
        if (!e[2]) { // subcategoría (o grupo aún sin generadores)
          if (q && norm(e[0] + ' ' + e[1]).indexOf(q) < 0) return;
          cuerpo += '<li role="none" class="rs-sub' + (e[3] === 'dev' ? ' dev' : '') + '" title="' + esc(e[1]) + (e[3] === 'dev' ? ' · generador en desarrollo' : '') + '"><span class="cod">' + e[0] + '</span><span class="tx">' + esc(e[1]) + '</span>' + (e[3] === 'dev' ? '<span class="rs-dev">En desarrollo</span>' : '') + '</li>'; return;
        }
        var ap = aplicaCod(e[0], FASE); if (!ap && U.soloFase && !esActual(BASE + e[2])) return;
        var href = BASE + e[2], act = esActual(href), H = e[0] === 'MC' ? [] : hijosDe(e[0]);
        if (act && esActual(href)) actual = { g: g[1], cod: e[0], t: e[1], href: e[2], hijo: H.filter(function (x) { return x.act; })[0] || null };
        var Hv = q ? H.filter(function (x) { return norm(x.t + ' ' + x.s).indexOf(q) >= 0; }) : H;
        if (q && norm(e[0] + ' ' + e[1]).indexOf(q) < 0 && !Hv.length) return;
        if (q && norm(e[0] + ' ' + e[1]).indexOf(q) >= 0 && !Hv.length) Hv = []; // coincide el módulo: sin hijos filtrados
        nRes += 1 + Hv.length;
        var abH = H.length && (q ? Hv.length > 0 : (U.hijos[e[0]] != null ? U.hijos[e[0]] : act)), n = C[e[0]] || (H.length ? H.length : '');
        cuerpo += '<li role="none"><a class="nodo' + (ap ? '' : ' rs-fuera') + '" role="treeitem" href="' + href + '"' + (act ? ' aria-current="page"' : '') + (H.length ? ' aria-expanded="' + !!abH + '"' : '') + ' title="' + esc(e[1] + (ap ? '' : ' · no aplica en ' + nFase.toLowerCase())) + '"><span class="tw"' + (H.length ? ' data-h="' + e[0] + '" title="' + (abH ? 'Ocultar' : 'Mostrar') + ' los entregables"' : '') + '>' + (H.length ? (abH ? '▾' : '▸') : '') + '</span><span class="cod">' + e[0] + '</span><span class="tx">' + esc(e[1]) + '</span>' + (n ? '<span class="ct">' + n + '</span>' : '') + '</a>' +
          (abH ? '<ul role="group" class="rs-hijos">' + Hv.map(nodoHijo).join('') + '</ul>' : '') + (act ? '<div id="rsHueco"></div>' : '') + '</li>';
      });
      if (q && !cuerpo) return;
      h += '<li role="none"><button type="button" class="nodo grp" role="treeitem" data-g="' + g[0] + '" aria-expanded="' + ab + '" title="' + esc((g[3] ? g[3] + ' · ' : '') + g[1]) + '"><span class="tw">' + (ab ? '▾' : '▸') + '</span>' + (g[3] ? '<span class="gcod">' + g[3] + '</span>' : '<span class="ic"></span>') + '<span class="tx">' + esc(g[1]) + '</span></button>' + (ab ? '<ul role="group">' + cuerpo + '</ul>' : '') + '</li>';
    });
    h += '</ul></li></ul>' + (q && !nRes ? '<p class="rs-nada">Nada coincide con «' + esc(filtro) + '».</p>' : '');
    aside.querySelector('.rs-lista').innerHTML = h;
    var hueco = document.getElementById('rsHueco');
    if (local && hueco) hueco.replaceWith(local); else if (local) aside.querySelector('.rs-lista').appendChild(local);
    pintarRuta();
    if (cinta) cinta.actualizar();
  }
  function pintarRuta() {
    var a = actual, pr = proyecto();
    var r = document.getElementById('rsRuta');
    if (r) r.innerHTML = '<a href="' + BASE + '">Suite ReyEngi</a><span>›</span><a href="' + BASE + 'proyectos/">' + esc(pr) + '</a>' + (a ? '<span>›</span><span class="g">' + esc(a.g) + '</span><span>›</span>' + (a.hijo ? '<a href="' + BASE + a.href + '">' + esc(a.t) + '</a><span>›</span><b>' + esc((a.hijo.t ? a.hijo.t + ' ' : '') + a.hijo.s) + '</b>' : '<b>' + esc(a.t) + '</b>') : '');
    var h1 = document.querySelector('.barra h1'); if (EN_LAZOS && h1 && a && h1.firstChild && h1.firstChild.nodeType === 3) h1.firstChild.nodeValue = a.t;
    var est = document.getElementById('rsEstado');
    if (est) est.innerHTML = '<span>Proyecto: <b>' + esc(pr) + '</b></span>' + (a ? '<span>Módulo: <b>' + esc(a.t) + '</b></span>' : '') + (a && a.hijo ? '<span>Entregable: <b>' + esc((a.hijo.t ? a.hijo.t + ' ' : '') + a.hijo.s) + '</b></span>' : '') + '<span class="esp"></span><span>Los datos se guardan en este navegador</span>';
    // Anterior / Siguiente en el flujo 00 → 09: en la barra de estado (o en la ruta, si la página tiene su propia barra)
    if (a) { var ip = -1; PASOS.forEach(function (x, i) { if (ip < 0 && x.cod === a.cod) ip = i; });
      if (ip >= 0) { var pa = PASOS[ip - 1], ps = PASOS[ip + 1], dst = est || r;
        if (dst) dst.insertAdjacentHTML('beforeend', '<span class="rs-pasos" role="navigation" aria-label="Flujo de ingeniería">' + (pa ? '<a href="' + BASE + pa.href + '" title="Paso anterior: ' + esc(pa.g[3] + ' · ' + pa.t) + '">‹ ' + esc(pa.t) + '</a>' : '') +
          '<em>Paso ' + (ip + 1) + ' de ' + PASOS.length + '</em>' + (ps ? '<a class="sig" href="' + BASE + ps.href + '" title="Paso siguiente: ' + esc(ps.g[3] + ' · ' + ps.t) + '">' + esc(ps.t) + ' ›</a>' : '') + '</span>'); } }
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
    aside.innerHTML = '<div class="rs-cab"><a href="' + BASE + '">Suite ReyEngi<small>Ingeniería de instrumentación y control</small></a><button type="button" id="rsPlegar" aria-label="Ocultar el explorador" title="Ocultar el explorador">' + ICO.menu + '</button></div>' +
      '<div class="rs-herr"><input type="search" id="rsBuscar" placeholder="Buscar módulo o entregable" aria-label="Buscar en el explorador" autocomplete="off"><button type="button" id="rsTam" title="Tamaño del texto de la interfaz" aria-label="Cambiar el tamaño del texto de la interfaz">Aa</button><button type="button" id="rsAbrirTodo" title="Expandir todo" aria-label="Expandir todo">＋</button><button type="button" id="rsCerrarTodo" title="Contraer todo" aria-label="Contraer todo">－</button></div>' +
      '<nav class="rs-cuerpo"><h2>Explorador</h2><div class="rs-lista"></div></nav><div class="rs-pie"><button type="button" id="rsConf" aria-haspopup="dialog" aria-expanded="false">' + ICO.conf + '<span>Configuración</span></button></div>';
    b.insertBefore(aside, b.firstChild);
    // Cinta de opciones (cinta.js): las tareas de la suite por pestañas y paneles, sobre el área de trabajo
    if (window.RS_CINTA) { try { cinta = window.RS_CINTA.montar({ grupos: GRUPOS, base: BASE, esc: esc, norm: norm, esActual: esActual,
      hijos: function (c) { return c === 'MC' ? [] : hijosDe(c); },
      recientes: function () { return U.rec.filter(function (r) { return r && r.href; }).slice(0, 6); },
      tema: function () { tema = tema === 'claro' ? 'oscuro' : 'claro'; try { localStorage.setItem('reyengi-tema', tema); } catch (e) {} ponerTema(); },
      tam: function () { var x = document.getElementById('rsTam'); if (x) x.click(); } }); } catch (e) { cinta = null; } }
    if (!cinta) { document.documentElement.classList.remove('rs-pre'); document.documentElement.style.setProperty('--rs-cinta', '0px'); }
    var div = document.createElement('div'); div.className = 'rs-div'; div.setAttribute('role', 'separator'); div.setAttribute('aria-orientation', 'vertical'); div.setAttribute('aria-label', 'Ancho del explorador'); b.appendChild(div);
    var cab = document.querySelector('.barra') || document.querySelector('header.top'), fila = document.querySelector('.barra .fila') || document.querySelector('header .topin') || cab;
    var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'rs-abrir'; ab.id = 'rsAbrir'; ab.setAttribute('aria-label', 'Mostrar el explorador'); ab.title = 'Mostrar el explorador'; ab.textContent = '☰';
    if (fila) fila.insertBefore(ab, fila.firstChild); else { ab.style.cssText = 'position:fixed;left:8px;top:calc(8px + var(--rs-cinta, 0px));z-index:14;background:#0B2545'; b.appendChild(ab); }
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
    // Configuración, anclada al pie de la navegación: tema y tamaño del texto
    (function () { var bt = document.getElementById('rsConf'), pop = null;
      function cerrar() { if (pop) { pop.remove(); pop = null; bt.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', fuera, true); document.removeEventListener('keydown', tecla, true); } }
      function fuera(e) { if (pop && !pop.contains(e.target) && !bt.contains(e.target)) cerrar(); } function tecla(e) { if (e.key === 'Escape') { cerrar(); bt.focus(); } }
      function pinta() { pop.innerHTML = '<h3>Tema</h3><div class="seg" role="group" aria-label="Tema">' + [['oscuro', 'Oscuro'], ['claro', 'Claro (beta)']].map(function (x) { return '<button type="button" data-tema="' + x[0] + '" aria-pressed="' + (tema === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<h3>Explorador</h3><div class="seg" role="group" aria-label="Qué muestra el explorador"><button type="button" data-solo="0" aria-pressed="' + !U.soloFase + '">Todo el árbol</button><button type="button" data-solo="1" aria-pressed="' + !!U.soloFase + '">Solo lo de la fase</button></div>' +
        '<h3>Tamaño del texto</h3><div class="seg" role="group" aria-label="Tamaño del texto">' + TAMS.map(function (t, i) { return '<button type="button" data-tam="' + i + '" aria-pressed="' + (tam === i) + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div><p>Estándar sigue la escala de Windows 11 (14 px en texto y controles, 12 px en etiquetas). Compacto y mínimo muestran más filas en los listados.</p><h3>Bases de dibujo (DXF)</h3><div class="seg" role="group" aria-label="Bases de dibujo">' + (window.RE_DIBUJO ? Object.keys(window.RE_DIBUJO.PERFILES).map(function (k) { return '<button type="button" data-dib="' + k + '" aria-pressed="' + (window.RE_DIBUJO.id() === k) + '">' + (k === 'reyengi' ? 'ReyEngi' : 'Gran minería 1') + '</button>'; }).join('') : '') + '</div><div class="enl"><a href="#" data-dibver>Ver las bases del perfil</a></div><h3>Proyecto</h3><div class="enl"><a href="' + BASE + 'configuracion/">Configuración general</a><a href="' + BASE + 'lazos/#cfg">Configuración de entregables</a><a href="' + BASE + 'generador/">Generador de entregables</a></div>'; }
      bt.addEventListener('click', function () { if (pop) return cerrar(); pop = document.createElement('div'); pop.className = 'rs-conf'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Configuración'); pinta(); document.body.appendChild(pop); bt.setAttribute('aria-expanded', 'true');
        pop.addEventListener('click', function (e) { if (e.target.closest('[data-dibver]')) { e.preventDefault(); cerrar(); if (window.RE_DIBUJO) window.RE_DIBUJO.mostrar(); return; } var q = e.target.closest('button'); if (!q) return; if (q.dataset.solo) { U.soloFase = q.dataset.solo === '1'; recordar(); pintar(); } else if (q.dataset.dib && window.RE_DIBUJO) { window.RE_DIBUJO.poner(q.dataset.dib); } else if (q.dataset.tema) { tema = q.dataset.tema; try { localStorage.setItem('reyengi-tema', tema); } catch (er) {} ponerTema(); } else if (q.dataset.tam) { tam = +q.dataset.tam; try { localStorage.setItem('reyengi-tam2', String(tam)); } catch (er) {} ponerTam(); } pinta(); });
        document.addEventListener('pointerdown', fuera, true); document.addEventListener('keydown', tecla, true); var f = pop.querySelector('button'); if (f) f.focus(); }); })();
    document.getElementById('rsTam').addEventListener('click', function () { tam = (tam + 1) % 3; try { localStorage.setItem('reyengi-tam2', String(tam)); } catch (e) {} ponerTam(); this.title = 'Tamaño del texto: ' + TAMS[tam] + ' (pulsa para cambiar)'; var es = document.getElementById('rsEstado'); if (es) { var av = document.createElement('span'); av.textContent = 'Tamaño del texto: ' + TAMS[tam]; av.style.color = '#FFB070'; es.appendChild(av); setTimeout(function () { av.remove(); }, 2500); } });
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
  // Atajos: Ctrl+B explorador · Ctrl+K buscar una tarea (cinta) · Ctrl+Mayús+E filtrar el explorador · Ctrl+F1 minimizar la cinta · Ctrl+J asistente (asistente.js)
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return; var k = e.key.toLowerCase();
    if (k === 'b') { var pl = document.getElementById(document.body.classList.contains('rs-plegado') ? 'rsPestana' : 'rsPlegar'); if (pl) { e.preventDefault(); pl.click(); } }
    else if (k === 'k') { if (cinta) { e.preventDefault(); cinta.buscar(); return; } var bq = document.getElementById('rsBuscar'); if (bq) { e.preventDefault(); if (document.body.classList.contains('rs-plegado')) { var ps = document.getElementById('rsPestana'); if (ps) ps.click(); } bq.focus(); bq.select(); } }
  });
  function trabajo() { if (window.top !== window) return; var st = document.createElement('script'); st.src = BASE + 'trabajo.js'; document.head.appendChild(st);
    var lf = document.createElement('link'); lf.rel = 'stylesheet'; lf.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'; document.head.appendChild(lf); } // sin conexión se usa Segoe UI
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { iniciar(); trabajo(); }); else { iniciar(); trabajo(); }
})();

/* Enter en una tabla editable pasa a la casilla de la derecha (y al final de la fila, a la primera de la siguiente), como en una planilla.
 * Mayús+Enter vuelve a la anterior. El valor se confirma al salir de la casilla. Vale para todos los listados de la suite. */
(function () {
  'use strict';
  var SEL = 'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]):not([type=button]):not([disabled]):not([readonly]), select:not([disabled])';
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    var t = e.target; if (!t || !t.matches || !t.matches('td input, td select') || !t.matches(SEL)) return;
    var tabla = t.closest('table'), tr = t.closest('tr'); if (!tabla || !tr) return;
    e.preventDefault(); e.stopPropagation();
    function filas(tb) { return [].filter.call(tb.rows, function (r) { return r.querySelector(SEL); }); }
    var fi = filas(tabla).indexOf(tr), cs = [].slice.call(tr.querySelectorAll(SEL)), ci = cs.indexOf(t) + (e.shiftKey ? -1 : 1), id = tabla.id;
    if (ci >= cs.length) { fi++; ci = 0; } else if (ci < 0) { fi--; ci = -1; }
    t.blur();                                             // confirma el cambio; la tabla puede redibujarse
    setTimeout(function () {
      var tb = tabla.isConnected ? tabla : (id && document.getElementById(id)); if (!tb) return;
      var fs = filas(tb), r = fs[Math.max(0, Math.min(fs.length - 1, fi))]; if (!r) return;
      var c = r.querySelectorAll(SEL), n = c[ci < 0 ? c.length - 1 : Math.min(ci, c.length - 1)];
      if (n) { n.focus(); if (n.select && n.tagName === 'INPUT') try { n.select(); } catch (er) {} n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }, 40);
  }, true);

  // ── Flujo de ingeniería: barra para seguir a la fase siguiente ──
  // Si se llegó a un módulo desde el flujo, una barra pequeña recuerda la fase y permite volver o pasar a la siguiente.
  (function () {
    if (window.top !== window || /\/flujo\/(index\.html)?$/.test(location.pathname)) return;
    var F = null; try { F = JSON.parse(sessionStorage.getItem('reyengi-flujo') || 'null'); } catch (e) {}
    var BASE = window.RS_BASE || '../', esc = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    if (!F || F.fase == null) return;
    var n = F.n || 7, ult = F.fase >= n - 1;
    var bar = document.createElement('div'); bar.className = 'rs-flujo'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Flujo de ingeniería');
    bar.innerHTML = '<span>Flujo · <b>Fase ' + F.fase + ': ' + esc(F.t || '') + '</b></span>' +
      '<a href="' + BASE + 'flujo/#fase=' + F.fase + '">Volver al flujo</a>' +
      (ult ? '' : '<a class="sig" href="' + BASE + 'flujo/#fase=' + (F.fase + 1) + '">Siguiente fase →</a>') +
      '<button type="button" aria-label="Cerrar la barra del flujo">✕</button>';
    bar.querySelector('button').addEventListener('click', function () { try { sessionStorage.removeItem('reyengi-flujo'); } catch (e) {} bar.remove(); });
    document.body.appendChild(bar);
  })();
})();
