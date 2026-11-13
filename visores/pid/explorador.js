/* Análisis de P&ID · interfaz tipo explorador · ReyEngi
 * Árbol del proyecto a la izquierda (P&ID, lazos, tipos de señal, búsquedas y documentos), lista de instrumentos
 * arriba y panel de detalle con pestañas abajo (Plano, Propiedades, Hojas y carga, Revisor). Los divisores se arrastran
 * y la disposición se recuerda en este navegador. No guarda datos del proyecto: solo filtra y muestra lo de pid.js.
 */
(function () {
  'use strict';
  var PID = window.__PID, P = window.REProyectos, ISA = window.ISA;
  if (!PID || !document.getElementById('arbol')) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var S = function () { return PID.estado(); };
  var CLAVE = 'reyengi-pid-ui', U = { arbol: 250, lista: 46, abiertos: { pid: 1, bus: 1, doc: 1 }, tab: '' };
  try { Object.assign(U, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
  function recordar() { try { localStorage.setItem(CLAVE, JSON.stringify(U)); } catch (e) {} }
  var nodo = { t: 'todos' }, vista = 'exp', tabAct = 'plano';

  // ── Datos derivados ──
  function lazoDe(c) { var l = String(c.letras || '').toUpperCase(); return l && c.num ? l[0] + '-' + c.num : ''; }
  function observados() { // id → hallazgos de la verificación ISA (errores y avisos)
    var m = {}; if (!window.PID_NORMAS) return m;
    try { window.PID_NORMAS.verificar().hall.forEach(function (h) { if (h.c) (m[h.c.id] = m[h.c.id] || []).push(h); }); } catch (e) {}
    return m;
  }
  var OBS = {};
  function grave(id) { return (OBS[id] || []).some(function (h) { return window.PID_NORMAS.gravedad(h.r) !== 'info'; }); }
  var BUSQ = [
    ['pend', 'Pendientes de revisar', function (c) { return c.estado === 'pendiente'; }, 'pe'],
    ['val', 'Validados', function (c) { return c.estado === 'validado'; }],
    ['rech', 'Rechazados', function (c) { return c.estado === 'rechazado'; }],
    ['obs', 'Con observaciones ISA', function (c) { return c.estado !== 'rechazado' && grave(c.id); }, 'er'],
    ['sinserv', 'Sin servicio', function (c) { return c.estado !== 'rechazado' && !String(c.servicio || '').trim(); }],
    ['nolist', 'No están en el listado existente', function (c) { return c.estado !== 'rechazado' && !c.enListado; }, '', function () { return !!S().listado; }]
  ];
  var SENAL = [['AI', 'Entradas analógicas (AI)'], ['AO', 'Salidas analógicas (AO)'], ['DI', 'Entradas digitales (DI)'], ['DO', 'Salidas digitales (DO)'], ['NA', 'Sin E/S (locales y primarios)'], ['', 'Sin tipo definido']];

  // ── Árbol ──
  function hoja(t, id, txt, n, ic, cls) {
    var act = nodo.t === t && (nodo.id || '') === (id || '');
    return '<li role="none"><button type="button" role="treeitem" class="nodo" data-t="' + t + '" data-id="' + esc(id || '') + '"' + (act ? ' aria-current="true"' : '') + ' title="' + esc(txt) + '"><span class="tw"></span><span class="ic ' + (ic || 'pt') + '"></span><span class="tx">' + esc(txt) + '</span>' + (n != null && n !== '' ? '<span class="ct ' + (cls || '') + '">' + n + '</span>' : '') + '</button></li>';
  }
  function rama(k, txt, n, hijos, t) {
    var ab = !!U.abiertos[k], act = t && nodo.t === t;
    return '<li role="none"><button type="button" role="treeitem" class="nodo" data-rama="' + k + '"' + (t ? ' data-t="' + t + '"' : '') + ' aria-expanded="' + ab + '"' + (act ? ' aria-current="true"' : '') + '><span class="tw">' + (ab ? '▾' : '▸') + '</span><span class="ic"></span><span class="tx">' + esc(txt) + '</span>' + (n != null ? '<span class="ct">' + n + '</span>' : '') + '</button>' + (ab ? '<ul role="group">' + hijos + '</ul>' : '') + '</li>';
  }
  function pintarArbol() {
    var s = S(), C = s.cand, pr = P.activo() || {}, vivos = C.filter(function (c) { return c.estado !== 'rechazado'; });
    OBS = observados();
    var hojas = s.hojas.map(function (h) {
      var L = C.filter(function (c) { return c.hoja === h.id; }), pe = L.filter(function (c) { return c.estado === 'pendiente'; }).length;
      return hoja('hoja', h.id, h.plano || h.nombre, pe ? pe + ' / ' + L.length : L.length, 'doc', pe ? 'pe' : '');
    }).join('') || '<li class="pvacio" style="padding:4px 8px;text-align:left">Sin planos: usa «Cargar P&amp;ID».</li>';
    var lz = {}; vivos.forEach(function (c) { var k = lazoDe(c); if (k) lz[k] = (lz[k] || 0) + 1; });
    var lazos = Object.keys(lz).sort(function (a, b) { return a.localeCompare(b, 'es', { numeric: true }); });
    var sen = SENAL.map(function (x) { var n = vivos.filter(function (c) { return (c.tipo || '') === x[0]; }).length; return n ? hoja('senal', x[0] || '-', x[1], n) : ''; }).join('');
    var bus = BUSQ.filter(function (b) { return !b[4] || b[4](); }).map(function (b) { var n = C.filter(b[2]).length; return hoja('bus', b[0], b[1], n, 'bus', n ? b[3] : ''); }).join('');
    var nDoc = window.PID_LISTADO ? window.PID_LISTADO.filas().length : '';
    $('#arbol').innerHTML = '<h2>Explorador</h2><ul role="tree" aria-label="Proyecto">' +
      '<li role="none"><button type="button" role="treeitem" class="nodo" data-t="todos"' + (nodo.t === 'todos' ? ' aria-current="true"' : '') + '><span class="tw">▾</span><span class="ic"></span><span class="tx"><b>' + esc(pr.nombre || pr.proyecto || 'Proyecto') + '</b></span><span class="ct">' + C.length + '</span></button><ul role="group">' +
      rama('pid', 'P&ID', s.hojas.length, hojas) +
      rama('lazos', 'Lazos', lazos.length, lazos.map(function (k) { return hoja('lazo', k, k, lz[k]); }).join('')) +
      rama('senal', 'Tipo de señal', null, sen) +
      rama('bus', 'Búsquedas', null, bus) +
      rama('doc', 'Documentos', null, hoja('doc', 'listado', 'Listado de instrumentos', nDoc, 'doc') + hoja('accion', 'excel', 'Excel de revisión', '', 'doc') + hoja('accion', 'normas', 'Normativa y bloques CAD', '', 'doc')) +
      '</ul></li></ul>';
  }
  function ruta() {
    var pr = P.activo() || {}, n = esc(pr.nombre || pr.proyecto || 'Proyecto'), r = '';
    if (vista === 'doc') r = 'Documentos › <b>Listado de instrumentos</b>';
    else if (nodo.t === 'hoja') { var h = S().hojas.filter(function (x) { return x.id === nodo.id; })[0]; r = 'P&amp;ID › <b>' + esc(h ? h.plano || h.nombre : '') + '</b>'; }
    else if (nodo.t === 'lazo') r = 'Lazos › <b>' + esc(nodo.id) + '</b>';
    else if (nodo.t === 'senal') r = 'Tipo de señal › <b>' + esc((SENAL.filter(function (x) { return (x[0] || '-') === nodo.id; })[0] || [])[1] || '') + '</b>';
    else if (nodo.t === 'bus') r = 'Búsquedas › <b>' + esc((BUSQ.filter(function (b) { return b[0] === nodo.id; })[0] || [])[1] || '') + '</b>';
    else r = '<b>Todos los instrumentos</b>';
    $('#ruta').innerHTML = n + ' › ' + r;
  }
  function aplicar() { // filtra la lista según el nodo activo
    var fx = null, fh = '';
    if (nodo.t === 'hoja') fh = nodo.id;
    else if (nodo.t === 'lazo') fx = function (c) { return lazoDe(c) === nodo.id; };
    else if (nodo.t === 'senal') fx = function (c) { return (c.tipo || '-') === nodo.id && c.estado !== 'rechazado'; };
    else if (nodo.t === 'bus') fx = (BUSQ.filter(function (b) { return b[0] === nodo.id; })[0] || [])[2] || null;
    $('#fHoja').value = fh;
    // Las búsquedas por estado mandan sobre el selector de estado; el resto muestra todos
    if (nodo.t !== 'todos' && nodo.t !== 'hoja') $('#fEstado').value = '';
    PID.filtrar(fx); ruta(); estado();
  }
  $('#arbol').addEventListener('click', function (e) {
    var b = e.target.closest('.nodo'); if (!b) return;
    if (b.dataset.rama && (e.target.closest('.tw') || !b.dataset.t)) { U.abiertos[b.dataset.rama] = !U.abiertos[b.dataset.rama]; recordar(); pintarArbol(); var f = $('#arbol [data-rama="' + b.dataset.rama + '"]'); if (f) f.focus(); return; }
    var t = b.dataset.t, id = b.dataset.id || '';
    if (t === 'accion') { if (id === 'excel') $('#bExcelRev').click(); else if (id === 'normas') { var nt = $('#npTab'); if (nt) nt.click(); } return; }
    if (t === 'doc') { modo('doc'); return; }
    nodo = { t: t, id: id }; modo('exp'); aplicar(); pintarArbol();
    if (t === 'hoja') { PID.verHoja(id); if (tabAct !== 'plano' && tabAct !== 'prop') tab('plano'); }
  });
  $('#arbol').addEventListener('keydown', function (e) { // flechas arriba y abajo entre nodos; derecha/izquierda abre o cierra
    var b = e.target.closest('.nodo'); if (!b) return; var L = [].slice.call(document.querySelectorAll('#arbol .nodo')), i = L.indexOf(b);
    if (e.key === 'ArrowDown' && L[i + 1]) { e.preventDefault(); L[i + 1].focus(); }
    else if (e.key === 'ArrowUp' && L[i - 1]) { e.preventDefault(); L[i - 1].focus(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && b.dataset.rama) { var ab = !!U.abiertos[b.dataset.rama]; if (ab !== (e.key === 'ArrowRight')) { e.preventDefault(); U.abiertos[b.dataset.rama] = !ab; recordar(); pintarArbol(); var f = $('#arbol [data-rama="' + b.dataset.rama + '"]'); if (f) f.focus(); } }
  });

  // ── Vistas: explorador o documento ──
  function modo(m) {
    vista = m; $('#vistaExp').hidden = m !== 'exp'; $('#secListado').hidden = m !== 'doc';
    $('#bDoc').setAttribute('aria-pressed', String(m === 'doc')); $('#bDoc').textContent = m === 'doc' ? '← Volver a los instrumentos' : 'Listado de instrumentos';
    if (m === 'doc') { nodo = { t: 'doc', id: 'listado' }; if (window.PID_LISTADO) window.PID_LISTADO.refrescar(); }
    else { if (nodo.t === 'doc') nodo = { t: 'todos' }; setTimeout(redim, 30); }
    pintarArbol(); ruta();
  }
  $('#bDoc').addEventListener('click', function () { modo(vista === 'doc' ? 'exp' : 'doc'); if (vista === 'exp') aplicar(); });
  $('#bNuevo').addEventListener('click', function () { nodo = { t: 'todos' }; modo('exp'); aplicar(); }, true); // el instrumento nuevo debe quedar a la vista
  $('#bCargar').addEventListener('click', function () { modo('exp'); tab('hojas'); $('#drop').click(); });

  // ── Pestañas del panel ──
  function redim() { window.dispatchEvent(new Event('resize')); }
  function tab(t) {
    tabAct = t; U.tab = t; recordar();
    document.querySelectorAll('.ptabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    ['plano', 'prop', 'hojas', 'rev'].forEach(function (k) { $('#p-' + k).hidden = k !== t; });
    if (t === 'plano') { redim(); var id = PID.seleccion(); if (id && PID.cand(id) && PID.cand(id).x != null) setTimeout(function () { redim(); PID.verEnPlano(id); }, 40); else if (PID.hojaVista()) setTimeout(function () { redim(); $('#vAjustar').click(); }, 40); }
    if (t === 'prop') pintarProp();
  }
  $('.ptabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });

  // ── Propiedades del instrumento seleccionado ──
  function pintarProp() {
    var el = $('#p-prop'), c = PID.seleccion() && PID.cand(PID.seleccion());
    if (!c) { el.innerHTML = '<p class="pvacio">Selecciona un instrumento en la lista o en el plano para ver y editar sus propiedades.</p>'; return; }
    if (el.contains(document.activeElement) && document.activeElement.dataset.k) return; // no se repinta mientras se escribe
    var s = S(), h = s.hojas.filter(function (x) { return x.id === c.hoja; })[0] || {}, tag = PID.tagDe(c), lz = lazoDe(c);
    var desc = ISA && c.letras && c.num ? ISA.describir(tag) : '';
    function inp(k, l, cls) { return '<label class="' + (cls || '') + '">' + l + '<input data-k="' + k + '" value="' + esc(c[k] || '') + '"' + (k === 'letras' || k === 'suf' ? ' style="text-transform:uppercase"' : '') + '></label>'; }
    var hall = OBS[c.id] || [], N = window.PID_NORMAS;
    var comp = lz ? s.cand.filter(function (x) { return x.id !== c.id && x.estado !== 'rechazado' && lazoDe(x) === lz; }) : [];
    el.innerHTML = '<div class="prop"><div class="cab"><span class="tag">' + esc(tag || '(sin tag)') + '</span><span class="est ' + c.estado + '">' + c.estado + (c.exportado ? ' · exportado' : '') + '</span><span class="desc">' + esc(desc) + '</span>' +
      '<button type="button" class="ok mini" data-a="validado">✓ Validar</button><button type="button" class="mini" data-a="rechazado">✗ Rechazar</button><button type="button" class="mini" data-a="plano"' + (c.x == null ? ' disabled' : '') + '>Ver en el plano</button></div>' +
      '<div><h3>Identificación</h3><div class="campos">' + inp('area', 'Área') + inp('letras', 'Letras ISA') + inp('num', 'Número') + inp('suf', 'Sufijo') +
      '<label>Tipo de señal<select data-k="tipo">' + PID.TIPOS.map(function (t) { return '<option value="' + t + '"' + (c.tipo === t ? ' selected' : '') + '>' + PID.TIPO_TXT[t] + '</option>'; }).join('') + '</select></label>' +
      inp('servicio', 'Servicio', 'a2') + '<span></span>' + inp('equipo', 'Equipo o línea', 'a2') + inp('nota', 'Nota', 'a2') + '</div>' +
      '<h3 style="margin-top:12px">Observaciones de la verificación ISA</h3>' + (hall.length ? '<ul class="obs">' + hall.map(function (x) { return '<li class="g-' + N.gravedad(x.r) + '"><b>' + esc(N.titulo(x.r)) + '</b>' + (x.extra ? ' · ' + esc(x.extra) : '') + '</li>'; }).join('') + '</ul>' : '<p class="conf" style="margin:0">Sin observaciones.</p>') + '</div>' +
      '<div><h3>Origen</h3><dl><dt>P&amp;ID</dt><dd>' + esc(h.plano || h.nombre || '—') + '</dd><dt>Lazo</dt><dd>' + esc(lz || '—') + '</dd><dt>Detectado desde</dt><dd>' + esc(c.origen || '—') + '</dd><dt>Confianza</dt><dd>' + esc(c.conf || '—') + '</dd>' +
      (s.listado ? '<dt>Listado existente</dt><dd>' + (c.enListado ? 'Sí' + (c.listadoTag ? ' (' + esc(c.listadoTag) + ')' : '') : 'No está') + '</dd>' : '') +
      (c.revisor ? '<dt>Validado por</dt><dd>' + esc(c.revisor) + (c.fechaRev ? ' · ' + esc(c.fechaRev) : '') + '</dd>' : '') +
      (c.aviso ? '<dt>Atributos del bloque</dt><dd>' + esc(c.aviso) + '</dd>' : '') + '</dl>' +
      '<h3 style="margin-top:12px">Otros instrumentos del lazo ' + esc(lz) + '</h3>' + (comp.length ? '<div class="lazo">' + comp.map(function (x) { return '<button type="button" class="mini" data-ir="' + x.id + '">' + esc(PID.tagDe(x)) + '</button>'; }).join('') + '</div>' : '<p class="conf" style="margin:0">No hay otros instrumentos con este número de lazo.</p>') + '</div></div>';
  }
  $('#p-prop').addEventListener('input', function (e) { var k = e.target.dataset.k, id = PID.seleccion(); if (k && id && e.target.tagName === 'INPUT') PID.editar(id, k, e.target.value); });
  $('#p-prop').addEventListener('change', function (e) { var k = e.target.dataset.k, id = PID.seleccion(); if (k && id && e.target.tagName === 'SELECT') PID.editar(id, k, e.target.value); });
  $('#p-prop').addEventListener('focusout', function () { setTimeout(function () { if (tabAct === 'prop' && !$('#p-prop').contains(document.activeElement)) pintarProp(); }, 0); });
  $('#p-prop').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var id = PID.seleccion();
    if (b.dataset.ir) { PID.seleccionar(b.dataset.ir); tab('prop'); return; }
    if (b.dataset.a === 'plano') { tab('plano'); return; }
    if (b.dataset.a && id) { PID.marcarId(id, b.dataset.a); pintarProp(); }
  });

  // ── Barra de estado ──
  function estado() {
    var c = PID.seleccion() && PID.cand(PID.seleccion()), n = PID.visibles().length;
    $('#selTxt').innerHTML = (c ? 'Seleccionado: <b>' + esc(PID.tagDe(c) || '(sin tag)') + '</b>' : 'Sin selección') + ' · ' + n + ' en la lista';
  }

  $('#fEstado').addEventListener('change', function () { setTimeout(estado, 0); }); $('#fBuscar').addEventListener('input', function () { setTimeout(estado, 0); });

  // ── Divisores arrastrables ──
  function divisor(el, alMover, fin) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('act');
      function mv(ev) { alMover(ev); }
      function up() { el.classList.remove('act'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); recordar(); redim(); if (fin) fin(); }
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
    });
  }
  function ponerMedidas() { document.documentElement.style.setProperty('--arbol', U.arbol + 'px'); document.documentElement.style.setProperty('--lista', U.lista + '%'); }
  divisor($('#divV'), function (e) { U.arbol = Math.max(160, Math.min(460, Math.round(e.clientX))); ponerMedidas(); });
  divisor($('#divH'), function (e) { var r = $('#vistaExp').getBoundingClientRect(); U.lista = Math.max(15, Math.min(80, Math.round((e.clientY - r.top) / r.height * 100))); ponerMedidas(); });
  $('#divH').addEventListener('dblclick', function () { U.lista = U.lista > 20 ? 15 : 46; ponerMedidas(); recordar(); redim(); });

  // ── Enlace con el motor ──
  var t0 = 0;
  window.PID_UI = {
    cambio: function () { clearTimeout(t0); t0 = setTimeout(function () {
      if (nodo.t === 'hoja' && !S().hojas.some(function (h) { return h.id === nodo.id; })) { nodo = { t: 'todos' }; aplicar(); } // cambió el proyecto o se quitó la hoja
      pintarArbol(); estado(); ruta(); if (tabAct === 'prop') pintarProp(); }, 120); },
    sel: function () { estado(); if (tabAct === 'prop') pintarProp(); },
    tab: tab, explorar: function () { if (vista !== 'exp') { modo('exp'); aplicar(); } }
  };
  ponerMedidas(); pintarArbol(); ruta(); estado();
  tab(S().hojas.length ? (U.tab && U.tab !== 'hojas' ? U.tab : 'plano') : 'hojas');
  if (S().hojas.length && tabAct === 'plano') setTimeout(function () { redim(); $('#vAjustar').click(); }, 150);
})();
