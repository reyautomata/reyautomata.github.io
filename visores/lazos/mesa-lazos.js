/* Entregables del proyecto · cada sección como mesa de trabajo con paneles acoplables (mesa/modulo.js).
 * Solo se define qué bloque de la sección va en cada panel; el motor de cada entregable no cambia. */
(function () {
  'use strict';
  if (!window.REMesaModulo || window.self !== window.top) return; // dentro de otra mesa o del generador se usa el diseño simple
  var $ = function (q) { return document.querySelector(q); };
  function caja(id) { return function (s) { var t = s.querySelector(id); return t ? t.closest('.tscroll') : null; }; }       // tabla con su marco
  function antes(id) { return function (s) { var t = s.querySelector(id); t = t && t.closest('.tscroll'); var h = t && t.previousElementSibling; while (h && !h.classList.contains('herr')) h = h.previousElementSibling; return h; }; } // barra de botones de esa tabla
  var COM = { t: 'tabs', p: ['prop', 'ctrl'], a: 'prop' };
  var S = {
    // Datos base: la tabla ocupa la izquierda y las acciones, propiedades y control documental quedan en pestañas a la derecha, igual que en los entregables
    'v-io': { principal: 'tabla', paneles: [{ id: 'tabla', titulo: 'Señales de E/S', mover: ['#buscarIO', '#cuentaIO', caja('#tablaIO')] }] },
    'v-mod': { principal: 'tar', paneles: [{ id: 'tar', titulo: 'Tarjetas y canales', mover: ['#modulos'] }] },
    'v-cfg': { principal: 'cfg', paneles: [{ id: 'cfg', titulo: 'Configuración', mover: [function (s) { return [].filter.call(s.children, function (c) { return !c.matches('p.intro, h2:first-child'); }); }] }] },
    'v-lazos': { paneles: [{ id: 'lista', titulo: 'Lazos', mover: ['.lazos > div:nth-child(1)'] }, { id: 'datos', titulo: 'Datos del lazo', mover: ['#hojaVacia', '#hojaLazo'] }, { id: 'plano', titulo: 'Plano', mover: ['#hojas'], zoom: '#hojas' }, { id: 'sen', titulo: 'Señales y conexiones', mover: ['#lzSen'] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['lista'], a: 'lista' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['datos', 'sen'], a: 'datos' }], s: [0.64, 0.36] }, COM], s: [0.2, 0.57, 0.23] }, limpiar: ['.lazos > div', '.lazos'] },
    'v-doc': { principal: 'prev', paneles: [{ id: 'ident', titulo: 'Identificación', mover: [':scope > .herr', '#dForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#dPrev'], zoom: '#dPrev' }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['ident'], a: 'ident' }, { t: 'tabs', p: ['prev'], a: 'prev' }, COM], s: [0.25, 0.52, 0.23] }, limpiar: ['.docio'] },
    'v-inst': { principal: 'prev', paneles: [{ id: 'tabla', titulo: 'Instrumentos', mover: [':scope > .herr', '#iCuenta', caja('#tablaInst')] }, { id: 'ident', titulo: 'Identificación', mover: [':scope > h2.grupo ~ .herr', '#iForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#iPrev'], zoom: '#iPrev' }],
      inicial: { t: 'row', c: [{ t: 'col', c: [{ t: 'tabs', p: ['tabla'], a: 'tabla' }, { t: 'tabs', p: ['prev'], a: 'prev' }], s: [0.45, 0.55] }, { t: 'tabs', p: ['ident'], a: 'ident' }, COM], s: [0.55, 0.22, 0.23] }, limpiar: ['.docio', ':scope > h2.grupo'] },
    'v-circ': { principal: 'prev', paneles: [{ id: 'tabla', titulo: 'Circuitos', mover: [':scope > .herr', '#cCuenta', caja('#tablaCirc')] }, { id: 'ident', titulo: 'Identificación', mover: [':scope > h2.grupo ~ .herr', '#cForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#cPrev'], zoom: '#cPrev' }],
      inicial: { t: 'row', c: [{ t: 'col', c: [{ t: 'tabs', p: ['tabla'], a: 'tabla' }, { t: 'tabs', p: ['prev'], a: 'prev' }], s: [0.45, 0.55] }, { t: 'tabs', p: ['ident'], a: 'ident' }, COM], s: [0.55, 0.22, 0.23] }, limpiar: ['.docio', ':scope > h2.grupo'] },
    'v-mat': { principal: 'prev', paneles: [{ id: 'tabla', titulo: 'Materiales', mover: ['#mCuenta', caja('#tablaMat')] }, { id: 'mont', titulo: 'Montaje por instrumento', mover: [caja('#tablaMont')] }, { id: 'ident', titulo: 'Identificación', mover: ['#mForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#mPrev'], zoom: '#mPrev' }], limpiar: ['.docio'] },
    'v-uni': { clave: 'v-uni-2', paneles: [{ id: 'tab', titulo: 'Tablero', mover: ['#uForm'] }, { id: 'plano', titulo: 'Plano', mover: ['#uRic', '#uHojas'], zoom: '#uHojas' }, { id: 'circ', titulo: 'Circuitos', mover: [antes('#tablaUni'), '#uCuenta', caja('#tablaUni')] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['tab'], a: 'tab' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['circ'], a: 'circ' }], s: [0.6, 0.4] }, COM], s: [0.22, 0.54, 0.24] }, limpiar: ['.uni > div', '.uni', ':scope > h2.grupo'] }
    ,
    'v-blq': { paneles: [{ id: 'datos', titulo: 'Plano y consultas', mover: ['.uni > div:nth-child(1)'] }, { id: 'plano', titulo: 'Diagrama', mover: ['.uni > div:nth-child(2)'], zoom: '#bHojas' }, { id: 'equipos', titulo: 'Equipos', mover: [antes('#bNodos'), caja('#bNodos')] }, { id: 'enlaces', titulo: 'Enlaces', mover: [antes('#bEnlaces'), caja('#bEnlaces')] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['datos'], a: 'datos' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['equipos', 'enlaces'], a: 'equipos' }], s: [0.62, 0.38] }, COM], s: [0.22, 0.55, 0.23] }, limpiar: ['.uni', ':scope > h2.grupo'] },
    'v-cond': { clave: 'v-cond-4', principal: 'corte', principales: [['corte', 'doc', 'caja']], paneles: [{ id: 'doc', titulo: 'Documento', mover: ['#kDocBox'], zoom: '#kDoc' }, { id: 'caja', titulo: 'Caja de paso / derivación', mover: ['#kCjBox'] }, { id: 'cajacfg', titulo: 'Datos de la caja', mover: ['#kCjCfgBox'] }, { id: 'ductos', titulo: 'Ductos', mover: [':scope > .herr', '#kEstado', caja('#kDuctos')] }, { id: 'datos', titulo: 'Datos del ducto', mover: ['.uni > div:nth-child(1)'] }, { id: 'corte', titulo: 'Corte y memoria', mover: ['.uni > div:nth-child(2)'] }, { id: 'cables', titulo: 'Cables', mover: [antes('#kCables'), caja('#kCables')] }],
      inicial: { t: 'row', c: [{ t: 'col', c: [{ t: 'tabs', p: ['ductos'], a: 'ductos' }, { t: 'tabs', p: ['datos'], a: 'datos' }], s: [0.4, 0.6] }, { t: 'col', c: [{ t: 'tabs', p: ['corte'], a: 'corte' }, { t: 'tabs', p: ['cables'], a: 'cables' }], s: [0.6, 0.4] }, COM], s: [0.27, 0.5, 0.23] }, limpiar: ['.uni', ':scope > h2.grupo'] }
  };
  // Emisión de diagramas de lazo desde el panel de Control documental: de a uno o por lote, con actualización de viñetas
  if (window.RE_EMISION) window.RE_EMISION.registrar('v-lazos', {
    gen: 'P02-LAZO', nombre: 'diagramas de lazo', formatos: ['PDF', 'DXF'],
    item: function (id) { return 'Lazo ' + id; },
    items: function () { var Z = window.__LAZOS; return Z ? Z.lazos().map(function (l) { return { id: l.id, codigo: l.plano, titulo: 'Lazo ' + l.id + (l.servicio ? ' · ' + l.servicio : ''), rev: Z.revVigente(l.id) }; }) : []; },
    actual: function () { return window.__LAZOS ? window.__LAZOS.seleccionado() : null; },
    responsables: function () { var E = window.__LAZOS.E(), u = (E.revs || []).slice(-1)[0] || {}; return { por: u.por || '', reviso: u.reviso || '', aprobo: u.aprobo || '' }; },
    aplicar: function (ids, fila) { return window.__LAZOS.emitir(ids, fila); },
    revisiones: function (id) { return window.__LAZOS.revisionesLazo(id); },
    ponerRevisiones: function (id, filas) { window.__LAZOS.ponerRevisionesLazo(id, filas); },
    vista: function (id) { return window.__LAZOS.vistaLazo(id); },
    limpiar: function (ids) { window.__LAZOS.limpiarRevisionesLazos(ids); },
    descargar: function (ids, f) { window.__LAZOS.descargarLazos(ids, f); }
  });
  // Unilineales, diagrama de bloques y documentos (E/S, instrumentos, circuitos): cada uno con su propio cuadro de revisiones.
  // Mientras no lo tengan, muestran el cuadro común del proyecto (Configuración); al editarlo o actualizarlo pasan a tener el suyo.
  (function () {
    var EM = window.RE_EMISION; if (!EM || !EM.simple) return;
    function Z() { return window.__LAZOS; } function E() { return Z().E(); }
    function comunes() { return E().revs || []; }
    function ult(f) { return ((f || []).slice(-1)[0] || {}).rev || ''; }
    function listo(v) { Z().guardar(); var f = (window.LAZOS_VISTAS || {})[v]; if (f) f(); }
    EM.simple('v-uni', { gen: 'P04-UNI', item: function (id) { var t = window.LAZOS_UNI.tableros().filter(function (x) { return x.id === id; })[0]; return 'Tablero ' + (t ? t.tag : id); },
      items: function () { return window.LAZOS_UNI ? window.LAZOS_UNI.tableros().map(function (t) { return { id: t.id, codigo: t.plano || t.tag, titulo: 'Unilineal ' + t.tag + (t.nombre ? ' · ' + t.nombre : ''), rev: t.revs ? ult(t.revs) : (t.rev || ult(comunes())) }; }) : []; },
      actual: function () { var t = window.LAZOS_UNI && window.LAZOS_UNI.actual(); return t ? t.id : null; },
      leer: function (id) { var t = window.LAZOS_UNI.tableros().filter(function (x) { return x.id === id; })[0]; return t && t.revs ? t.revs : null; }, comunes: comunes,
      escribir: function (id, f) { var t = window.LAZOS_UNI.tableros().filter(function (x) { return x.id === id; })[0]; if (t) { t.revs = f; t.rev = ult(f); } }, repintar: function () { listo('uni'); } });
    EM.simple('v-blq', { gen: 'P03-BLQ', item: function () { return 'Diagrama de bloques'; },
      items: function () { var b = E().blq; return b ? [{ id: 'blq', codigo: b.plano || 'Diagrama de bloques', titulo: b.titulo || 'Diagrama de bloques de control', rev: b.revs ? ult(b.revs) : (b.rev || ult(comunes())) }] : []; },
      actual: function () { return E().blq ? 'blq' : null; }, leer: function () { var b = E().blq; return b && b.revs ? b.revs : null; }, comunes: comunes,
      escribir: function (id, f) { var b = E().blq; if (b) { b.revs = f; b.rev = ult(f); } }, repintar: function () { listo('blq'); } });
    (function () { function C() { return window.LAZOS_COND; } if (C()) C().comunes = comunes;
      EM.simple('v-cond', { gen: 'D01-CONDUIT', item: function (id) { return C().DOCS[id] || id; },
        items: function () { var c = C(); return c ? Object.keys(c.DOCS).map(function (k) { return { id: k, codigo: c.docNum(k), titulo: c.DOCS[k], rev: ult(c.docRevs(k) || comunes()) }; }) : []; },
        actual: function () { return C() ? C().docSel() : null; }, leer: function (id) { return C().docRevs(id); }, comunes: comunes, escribir: function (id, f) { C().docPoner(id, f); }, repintar: function () { listo('cond'); } });
      var ad = EM.adaptadores['v-cond']; ad.vista = function (id) { return C().docHtml(id); }; ad.formatos = ['PDF', 'Excel']; ad.descargar = function (ids, f) { C().docDescargar(ids[0], f); }; })();
    [['v-doc', 'doc', 'D05-ES', 'Listado de entradas y salidas', 'doc'], ['v-inst', 'docInst', 'D05-INST', 'Listado de instrumentos', 'inst'], ['v-circ', 'docCirc', 'D05-CIRC', 'Listado de circuitos', 'circ'], ['v-mat', 'docMat', 'D05-MAT', 'Listado de materiales', 'mat']].forEach(function (c) {
      function d() { var e = E(); return e[c[1]] = e[c[1]] || {}; }
      EM.simple(c[0], { gen: c[2], item: function () { return c[3]; },
        items: function () { var x = d(); return [{ id: c[1], codigo: x.codigo || '', titulo: x.titulo || c[3], rev: x.revs ? ult(x.revs) : ult(comunes()) }]; },
        actual: function () { return c[1]; }, leer: function () { return d().revs || null; }, comunes: comunes, escribir: function (id, f) { d().revs = f; }, repintar: function () { listo(c[4]); } });
    });
  })();
  // Descarga pedida desde la página de Control documental
  function pendiente() { var p = null; try { p = JSON.parse(sessionStorage.getItem('reyengi-descargar') || 'null'); sessionStorage.removeItem('reyengi-descargar'); } catch (e) {} if (p && p.gen === 'P02-LAZO' && window.__LAZOS) setTimeout(function () { window.__LAZOS.descargarLazos(p.ids || [], p.f || 'PDF'); }, 600); }
  if (document.readyState === 'complete') setTimeout(pendiente, 400); else window.addEventListener('load', function () { setTimeout(pendiente, 400); });
  function montar(id) { var sec = document.getElementById(id), c = S[id]; if (!sec || !c || sec.hidden || sec.dataset.dkm) return; try { window.REMesaModulo(sec, { clave: c.clave || id, principal: c.principal, principales: c.principales, paneles: c.paneles, inicial: c.inicial, limpiar: c.limpiar }); } catch (e) { console.warn('Mesa de trabajo', id, e); } }
  function todas() { Object.keys(S).forEach(montar); }
  // Las secciones se muestran de a una: cada mesa se arma la primera vez que su sección queda visible
  Object.keys(S).forEach(function (id) { var sec = document.getElementById(id); if (sec) new MutationObserver(function () { setTimeout(function () { montar(id); }, 0); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] }); });
  if (document.readyState === 'complete') setTimeout(todas, 300); else window.addEventListener('load', function () { setTimeout(todas, 300); });
})();
