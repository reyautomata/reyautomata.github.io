/* Hojas de datos, especificaciones y requisiciones como mesa de trabajo (mesa/modulo.js): solo se indica qué bloque va en cada panel. */
(function () {
  'use strict';
  if (!window.REMesaModulo || window.self !== window.top) return;
  var COM = { t: 'tabs', p: ['prop', 'ctrl'], a: 'prop' }, ruta = location.pathname, C = null, sec = null;
  if (/\/hojas-datos\//.test(ruta)) { sec = document.getElementById('vista'); C = { clave: 'hd', paneles: [{ id: 'hoja', titulo: 'Hoja de datos', mover: ['#lienzo'], zoom: '#lienzo' }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['hoja'], a: 'hoja' }, COM], s: [0.77, 0.23] } }; }
  else if (/\/especificaciones\//.test(ruta)) { sec = document.getElementById('vista'); C = { clave: 'et', paneles: [{ id: 'cont', titulo: 'Contenido y acciones', mover: [':scope > .panel'] }, { id: 'doc', titulo: 'Documento', mover: [':scope > .lienzo'], zoom: '.lienzo' }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['cont'], a: 'cont' }, { t: 'tabs', p: ['doc'], a: 'doc' }, COM], s: [0.22, 0.56, 0.22] } }; }
  else if (/\/requisiciones\//.test(ruta)) { sec = document.querySelector('main > section'); C = { clave: 'rq', principal: 'ed', paneles: [{ id: 'lista', titulo: 'Requisiciones', mover: ['.lay > .lado'] }, { id: 'ed', titulo: 'Requisición', mover: ['#editor'] }], inicial: { t: 'row', c: [{ t: 'tabs', p: ['lista'], a: 'lista' }, { t: 'tabs', p: ['ed'], a: 'ed' }, COM], s: [0.22, 0.56, 0.22] }, limpiar: ['.lay'] }; }
  // Cuadro de revisiones propio de cada hoja de datos, especificación y requisición, editable desde Control documental (de a una o por lote)
  (function () {
    var EM = window.RE_EMISION; if (!EM || !EM.simple || !sec) return;
    if (!sec.id) sec.id = 'dkm-' + C.clave;
    function obj(a, k) { var o = {}; k.forEach(function (n, i) { o[n] = a[i] || ''; }); return o; }
    if (C.clave === 'hd') { var KH = ['rev', 'fecha', 'desc', 'por', 'reviso', 'aprobo'];
      EM.simple(sec.id, { gen: 'D04-HD', refActual: true, item: function (id) { var p = window.HDApp.plantilla(id); return p ? p.tag + ' · ' + p.titulo : id; },
        items: function () { var A = window.HDApp, pr = A.proyecto(); return (window.__HD_EM ? window.__HD_EM.plantillas : []).map(function (p) { return { id: p.id, codigo: A.numeroDoc(p, pr), titulo: p.tag + ' · ' + p.titulo, rev: A.revHoja(p, pr) || '' }; }); },
        actual: function () { return window.__HD_EM ? window.__HD_EM.actual() : null; },
        leer: function (id) { var r = window.HDApp.datosHoja(id).revs; return r ? r.filter(function (x) { return x && x[0]; }).map(function (x) { return obj(x, KH); }) : null; },
        comunes: function () { var pr = window.HDApp.proyecto(); return pr.rev ? [{ rev: pr.rev, fecha: pr.porFecha || window.HDApp.hoy(), desc: 'EMITIDA PARA COTIZACIÓN', por: pr.por || '', reviso: pr.reviso || '', aprobo: pr.aprobo || '' }] : []; },
        escribir: function (id, f) { window.HDApp.guardarRevs(id, f.map(function (r) { return KH.map(function (k) { return r[k] || ''; }); })); },
        repintar: function () { if (window.__HD_EM) window.__HD_EM.repintar(); } }); }
    else if (C.clave === 'et') { var R = window.REProyectos;
      EM.simple(sec.id, { gen: 'D03-ET', refActual: true, item: function (id) { var f = window.ETApp.fam(id); return f ? 'ET ' + f.titulo : id; },
        items: function () { var A = window.ETApp, pr = R.activo(); return (window.__ET_EM ? window.__ET_EM.familias : []).map(function (f) { var r = A.datosEt(f.id).revs; return { id: f.id, codigo: A.numeroEt(f, pr), titulo: 'ET ' + f.titulo, rev: r ? ((r[r.length - 1] || [])[0] || '') : (pr.rev || 'A') }; }); },
        actual: function () { return window.__ET_EM ? window.__ET_EM.actual() : null; },
        leer: function (id) { var r = window.ETApp.datosEt(id).revs; return r ? r.map(function (x) { return { rev: x[0] || '', fecha: x[1] || '', desc: x[2] || '' }; }) : null; },
        comunes: function () { var pr = R.activo(); return [{ rev: pr.rev || 'A', fecha: pr.porFecha || R.hoy(), desc: 'EMITIDO PARA REVISIÓN INTERNA' }]; },
        escribir: function (id, f) { var d = window.ETApp.datosEt(id); d.revs = f.map(function (r) { return [r.rev || '', r.fecha || '', r.desc || '']; }); window.ETApp.guardarEt(id, d); },
        repintar: function () { if (window.__ET_EM) window.__ET_EM.repintar(); } }); }
    else if (C.clave === 'rq') { var Q = function () { return window.__RQ_EM; }, rq = function (id) { return Q().D().lista.filter(function (x) { return x.id === id; })[0]; };
      EM.simple(sec.id, { gen: 'D06-REQ', refActual: true, item: function (id) { var r = rq(id); return r ? 'Requisición ' + r.num + ' · ' + r.titulo : id; },
        items: function () { return Q() ? Q().D().lista.map(function (r) { var u = (r.revs || []).slice(-1)[0] || {}; return { id: r.id, codigo: window.RQ.codigo(r, Q().D()), titulo: 'Requisición ' + r.titulo, rev: u.rev || '' }; }) : []; },
        actual: function () { return Q() ? Q().sel() : null; },
        leer: function (id) { var r = rq(id); return r ? (r.revs || []).map(function (v) { return { rev: v.rev || '', fecha: v.fecha || '', desc: v.emitido || '', por: v.por || '', reviso: v.reviso || '', aprobo: v.aprobo || '', cliente: v.cliente || '' }; }) : null; },
        comunes: function () { return []; },
        escribir: function (id, f) { var r = rq(id); if (r) r.revs = f.map(function (v) { return { rev: v.rev || '', fecha: v.fecha || '', emitido: v.desc || '', por: v.por || '', reviso: v.reviso || '', aprobo: v.aprobo || '', cliente: v.cliente || '' }; }); },
        repintar: function () { Q().guardar(); Q().repintar(); } }); }
  })();
  if (!sec || !C) return;
  function montar() { if (sec.hidden || sec.dataset.dkm) return; try { window.REMesaModulo(sec, C); } catch (e) { console.warn('Mesa de trabajo', e); } }
  new MutationObserver(function () { setTimeout(montar, 0); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
  if (document.readyState === 'complete') setTimeout(montar, 300); else window.addEventListener('load', function () { setTimeout(montar, 300); });
})();
