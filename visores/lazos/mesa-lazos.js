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
    'v-lazos': { paneles: [{ id: 'lista', titulo: 'Lazos', mover: ['.lazos > div:nth-child(1)'] }, { id: 'datos', titulo: 'Datos del lazo', mover: ['#hojaVacia', '#hojaLazo'] }, { id: 'plano', titulo: 'Plano', mover: ['#hojas'], zoom: '#hojas' }, { id: 'sen', titulo: 'Señales y conexiones', mover: ['#lzSen'] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['lista'], a: 'lista' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['datos', 'sen'], a: 'datos' }], s: [0.64, 0.36] }, COM], s: [0.2, 0.57, 0.23] }, limpiar: ['.lazos > div', '.lazos'] },
    'v-doc': { paneles: [{ id: 'ident', titulo: 'Identificación', mover: [':scope > .herr', '#dForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#dPrev'] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['ident'], a: 'ident' }, { t: 'tabs', p: ['prev'], a: 'prev' }, COM], s: [0.25, 0.52, 0.23] }, limpiar: ['.docio'] },
    'v-inst': { paneles: [{ id: 'tabla', titulo: 'Instrumentos', mover: [':scope > .herr', '#iCuenta', caja('#tablaInst')] }, { id: 'ident', titulo: 'Identificación', mover: [':scope > h2.grupo ~ .herr', '#iForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#iPrev'] }],
      inicial: { t: 'row', c: [{ t: 'col', c: [{ t: 'tabs', p: ['tabla'], a: 'tabla' }, { t: 'tabs', p: ['prev'], a: 'prev' }], s: [0.45, 0.55] }, { t: 'tabs', p: ['ident'], a: 'ident' }, COM], s: [0.55, 0.22, 0.23] }, limpiar: ['.docio', ':scope > h2.grupo'] },
    'v-circ': { paneles: [{ id: 'tabla', titulo: 'Circuitos', mover: [':scope > .herr', '#cCuenta', caja('#tablaCirc')] }, { id: 'ident', titulo: 'Identificación', mover: [':scope > h2.grupo ~ .herr', '#cForm'] }, { id: 'prev', titulo: 'Vista previa', mover: ['#cPrev'] }],
      inicial: { t: 'row', c: [{ t: 'col', c: [{ t: 'tabs', p: ['tabla'], a: 'tabla' }, { t: 'tabs', p: ['prev'], a: 'prev' }], s: [0.45, 0.55] }, { t: 'tabs', p: ['ident'], a: 'ident' }, COM], s: [0.55, 0.22, 0.23] }, limpiar: ['.docio', ':scope > h2.grupo'] },
    'v-uni': { clave: 'v-uni-2', paneles: [{ id: 'tab', titulo: 'Tablero', mover: ['#uForm'] }, { id: 'plano', titulo: 'Plano', mover: ['#uRic', '#uHojas'], zoom: '#uHojas' }, { id: 'circ', titulo: 'Circuitos', mover: [antes('#tablaUni'), '#uCuenta', caja('#tablaUni')] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['tab'], a: 'tab' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['circ'], a: 'circ' }], s: [0.6, 0.4] }, COM], s: [0.22, 0.54, 0.24] }, limpiar: ['.uni > div', '.uni', ':scope > h2.grupo'] }
    ,
    'v-blq': { paneles: [{ id: 'datos', titulo: 'Plano y consultas', mover: ['.uni > div:nth-child(1)'] }, { id: 'plano', titulo: 'Diagrama', mover: ['.uni > div:nth-child(2)'], zoom: '#bHojas' }, { id: 'equipos', titulo: 'Equipos', mover: [antes('#bNodos'), caja('#bNodos')] }, { id: 'enlaces', titulo: 'Enlaces', mover: [antes('#bEnlaces'), caja('#bEnlaces')] }],
      inicial: { t: 'row', c: [{ t: 'tabs', p: ['datos'], a: 'datos' }, { t: 'col', c: [{ t: 'tabs', p: ['plano'], a: 'plano' }, { t: 'tabs', p: ['equipos', 'enlaces'], a: 'equipos' }], s: [0.62, 0.38] }, COM], s: [0.22, 0.55, 0.23] }, limpiar: ['.uni', ':scope > h2.grupo'] },
    'v-cond': { paneles: [{ id: 'ductos', titulo: 'Ductos', mover: [':scope > .herr', '#kEstado', caja('#kDuctos')] }, { id: 'datos', titulo: 'Datos del ducto', mover: ['.uni > div:nth-child(1)'] }, { id: 'corte', titulo: 'Corte y memoria', mover: ['.uni > div:nth-child(2)'] }, { id: 'cables', titulo: 'Cables', mover: [antes('#kCables'), caja('#kCables')] }],
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
    descargar: function (ids, f) { window.__LAZOS.descargarLazos(ids, f); }
  });
  // Descarga pedida desde la página de Control documental
  function pendiente() { var p = null; try { p = JSON.parse(sessionStorage.getItem('reyengi-descargar') || 'null'); sessionStorage.removeItem('reyengi-descargar'); } catch (e) {} if (p && p.gen === 'P02-LAZO' && window.__LAZOS) setTimeout(function () { window.__LAZOS.descargarLazos(p.ids || [], p.f || 'PDF'); }, 600); }
  if (document.readyState === 'complete') setTimeout(pendiente, 400); else window.addEventListener('load', function () { setTimeout(pendiente, 400); });
  function montar(id) { var sec = document.getElementById(id), c = S[id]; if (!sec || !c || sec.hidden || sec.dataset.dkm) return; try { window.REMesaModulo(sec, { clave: c.clave || id, paneles: c.paneles, inicial: c.inicial, limpiar: c.limpiar }); } catch (e) { console.warn('Mesa de trabajo', id, e); } }
  function todas() { Object.keys(S).forEach(montar); }
  // Las secciones se muestran de a una: cada mesa se arma la primera vez que su sección queda visible
  Object.keys(S).forEach(function (id) { var sec = document.getElementById(id); if (sec) new MutationObserver(function () { setTimeout(function () { montar(id); }, 0); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] }); });
  if (document.readyState === 'complete') setTimeout(todas, 300); else window.addEventListener('load', function () { setTimeout(todas, 300); });
})();
