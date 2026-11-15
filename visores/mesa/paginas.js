/* Hojas de datos, especificaciones y requisiciones como mesa de trabajo (mesa/modulo.js): solo se indica qué bloque va en cada panel. */
(function () {
  'use strict';
  if (!window.REMesaModulo || window.self !== window.top) return;
  var COM = { t: 'tabs', p: ['prop', 'ctrl'], a: 'prop' }, ruta = location.pathname, C = null, sec = null;
  if (/\/hojas-datos\//.test(ruta)) { sec = document.getElementById('vista'); C = { clave: 'hd', paneles: [{ id: 'hoja', titulo: 'Hoja de datos', mover: [':scope > .herr', '#lienzo'] }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['hoja'], a: 'hoja' }, COM], s: [0.77, 0.23] } }; }
  else if (/\/especificaciones\//.test(ruta)) { sec = document.getElementById('vista'); C = { clave: 'et', paneles: [{ id: 'cont', titulo: 'Contenido y acciones', mover: [':scope > .panel'] }, { id: 'doc', titulo: 'Documento', mover: [':scope > .lienzo'] }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['cont'], a: 'cont' }, { t: 'tabs', p: ['doc'], a: 'doc' }, COM], s: [0.22, 0.56, 0.22] } }; }
  else if (/\/requisiciones\//.test(ruta)) { sec = document.querySelector('main > section'); C = { clave: 'rq', paneles: [{ id: 'lista', titulo: 'Requisiciones', mover: ['.lay > .lado'] }, { id: 'ed', titulo: 'Requisición', mover: ['#editor'] }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['lista'], a: 'lista' }, { t: 'tabs', p: ['ed'], a: 'ed' }, COM], s: [0.22, 0.56, 0.22] }, limpiar: ['.lay'] }; }
  if (!sec || !C) return;
  function montar() { if (sec.hidden || sec.dataset.dkm) return; try { window.REMesaModulo(sec, C); } catch (e) { console.warn('Mesa de trabajo', e); } }
  new MutationObserver(function () { setTimeout(montar, 0); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
  if (document.readyState === 'complete') setTimeout(montar, 300); else window.addEventListener('load', function () { setTimeout(montar, 300); });
})();
