/* Suite ReyEngi · gestión documental del proyecto activo.
 * Cada entregable (documento o plano) tiene un registro con metadatos, estado, revisión e historial.
 * Los registros nacen de dos formas reales: cuando se exporta desde un módulo (se anota el evento) o cuando se registran a mano.
 * Una revisión nueva nunca borra la anterior: queda en el historial. Todo se guarda con el proyecto, en este navegador. */
(function () {
  'use strict';
  var P = window.REProyectos, R = window.RE_ENTREGABLES; if (!P || !R || window.RE_GESTION) return;
  var ESTADOS = ['Borrador', 'En desarrollo', 'En revisión', 'Con observaciones', 'Aprobado', 'Emitido', 'Obsoleto'];
  // Tipos de emisión: las revisiones internas y al cliente avanzan con letras (A, B, …); una vez aprobado, con números (0, 1, …)
  var TIPOS = [
    { id: 'interna', t: 'Revisión interna', desc: 'EMITIDO PARA REVISIÓN INTERNA' },
    { id: 'cliente', t: 'Revisión del cliente', desc: 'EMITIDO PARA REVISIÓN DEL CLIENTE' },
    { id: 'aprobacion', t: 'Para aprobación', desc: 'EMITIDO PARA APROBACIÓN' },
    { id: 'aprobado', t: 'Aprobado', desc: 'APROBADO', num: true },
    { id: 'apc', t: 'Aprobado para construcción', desc: 'APROBADO PARA CONSTRUCCIÓN', num: true },
    { id: 'info', t: 'Para información', desc: 'EMITIDO PARA INFORMACIÓN' },
    { id: 'asbuilt', t: 'As built (como construido)', desc: 'AS BUILT', num: true },
    { id: 'otra', t: 'Otra (descripción libre)', desc: '' }
  ];
  // ── Flujo de trabajo de un entregable ──
  //    En trabajo → Revisión de la especialidad → Coordinación interna (primera emisión, Rev. A) o Firmas (Rev. B en adelante) → Para emitir → Emitido.
  //    La coordinación y las firmas recorren una lista ordenada de responsables; cada paso deja su fecha y su comentario en el historial.
  var FLUJO = [
    { id: 'trabajo', n: 'En trabajo', d: 'El originador desarrolla o corrige el entregable en su módulo.', sig: 'Enviar a revisión de la especialidad' },
    { id: 'esp', n: 'Revisión de la especialidad', d: 'El líder de la especialidad revisa antes de que salga de la disciplina.', sig: 'Revisado: pasar a la siguiente etapa' },
    { id: 'coord', n: 'Coordinación interna', d: 'Las demás disciplinas revisan y comentan, en el orden de la lista.', sig: 'Marcar revisado y pasar al siguiente' },
    { id: 'firmas', n: 'Firmas', d: 'Elaboró, revisó y aprobó firman en orden.', sig: 'Marcar firmado y pasar al siguiente' },
    { id: 'emitir', n: 'Para emitir', d: 'Listo para que control de documentos lo emita.', sig: '' },
    { id: 'emitido', n: 'Emitido', d: 'Emitido con su revisión y fecha. Una revisión nueva lo devuelve a «En trabajo».', sig: '' }
  ];
  var EST_ETAPA = { trabajo: 'En desarrollo', esp: 'En revisión', coord: 'En revisión', firmas: 'En revisión', emitir: 'Aprobado', emitido: 'Emitido' };
  var RUTA0 = { coord: ['Procesos', 'Mecánica y piping', 'Electricidad', 'Instrumentación y control', 'Control de documentos'], firmas: ['Elaboró', 'Revisó', 'Aprobó'] };
  function cfgFlujo(g) { var c = g.flujo = g.flujo || {}; ['coord', 'firmas'].forEach(function (k) { if (!Array.isArray(c[k]) || !c[k].length) c[k] = RUTA0[k].map(function (r) { return { r: r, n: '' }; }); }); if (!(c.plazo > 0)) c.plazo = 3; return c; }
  function etapaDe(d) { if (d.flujo && d.flujo.etapa) return d.flujo.etapa; return d.estado === 'Emitido' ? 'emitido' : d.estado === 'En revisión' ? 'esp' : d.estado === 'Aprobado' ? 'emitir' : 'trabajo'; }
  function ponerEtapa(g, d, et) { var f = d.flujo = { etapa: et, desde: ahora() }; if (et === 'coord' || et === 'firmas') { f.ruta = cfgFlujo(g)[et].map(function (x) { return { r: x.r, n: x.n || '', f: '', com: '' }; }); f.pos = 0; } d.estado = EST_ETAPA[et]; }
  function nombreEtapa(et) { return (FLUJO.filter(function (x) { return x.id === et; })[0] || {}).n || et; }
  var oyentes = [];
  function leer() { var g = null; try { g = P.leer('gestion', null); } catch (e) {} g = g || {}; g.docs = g.docs || []; return g; }
  function guardar(g) { try { P.escribir('gestion', g); } catch (e) {} oyentes.forEach(function (f) { try { f(); } catch (e) {} }); }
  function ahora() { return new Date().toISOString(); }
  function gen(id) { return R.generadores.filter(function (x) { return x.id === id; })[0] || null; }
  function sigRev(r) { r = String(r || 'A').trim(); if (/^\d+$/.test(r)) return String(+r + 1); var c = r.toUpperCase().charCodeAt(r.length - 1); return c >= 65 && c < 90 ? r.slice(0, -1) + String.fromCharCode(c + 1) : r + 'A'; }
  function evento(d, a, det) { d.historial.push({ f: ahora(), a: a, d: det || '', rev: d.rev, estado: d.estado }); if (d.historial.length > 150) d.historial.splice(0, d.historial.length - 150); d.modificado = ahora(); }
  function clave(o) { return o.gen + '|' + (o.ref || '') + '|' + (o.item || ''); }

  var _bd = null;
  function bd() { return _bd || (_bd = new Promise(function (ok, mal) { var r = indexedDB.open('reyengi-emitidos', 1); r.onupgradeneeded = function () { r.result.createObjectStore('vistas'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { _bd = null; mal(r.error); }; })); }
  var G = window.RE_GESTION = {
    ESTADOS: ESTADOS, TIPOS: TIPOS, FLUJO: FLUJO,
    etapa: function (d) { return etapaDe(d); },
    // Paso pendiente de la etapa actual: quién tiene el entregable y desde cuándo
    paso: function (d) { var et = etapaDe(d), f = d.flujo || {}, r = f.ruta || [], i = f.pos || 0, ini = i > 0 && r[i - 1] ? r[i - 1].f : f.desde || d.modificado;
      var dias = Math.floor((Date.now() - new Date(ini).getTime()) / 864e5), plazo = cfgFlujo(leer()).plazo;
      return { etapa: et, nombre: nombreEtapa(et), ruta: r, pos: i, actual: (et === 'coord' || et === 'firmas') && r[i] ? r[i] : null, desde: ini, dias: dias, atrasado: /^(esp|coord|firmas)$/.test(et) && dias > plazo, plazo: plazo }; },
    flujoCfg: function () { return JSON.parse(JSON.stringify(cfgFlujo(leer()))); },
    flujoGuardar: function (c) { var g = leer(), o = cfgFlujo(g); ['coord', 'firmas'].forEach(function (k) { var l = (c[k] || []).filter(function (x) { return x && String(x.r || '').trim(); }).map(function (x) { return { r: String(x.r).trim().slice(0, 60), n: String(x.n || '').trim().slice(0, 60) }; }); if (l.length) o[k] = l; }); if (+c.plazo > 0) o.plazo = Math.min(60, Math.round(+c.plazo)); guardar(g); return o; },
    // Siguiente paso del flujo. En coordinación y firmas avanza una persona de la lista; al terminar la lista pasa a «Para emitir».
    avanzar: function (id, com) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null; var et = etapaDe(d), nota = com ? ' · ' + String(com).slice(0, 300) : '';
      if (et === 'trabajo') { ponerEtapa(g, d, 'esp'); evento(d, 'Flujo', 'Enviado a revisión de la especialidad' + nota); }
      else if (et === 'esp') { var primera = !(d.emisiones || []).length; ponerEtapa(g, d, primera ? 'coord' : 'firmas'); evento(d, 'Flujo', 'Revisado por la especialidad: pasa a ' + (primera ? 'coordinación interna' : 'firmas') + nota); }
      else if (et === 'coord' || et === 'firmas') { var f = d.flujo, p = f.ruta[f.pos]; if (p) { p.f = ahora(); p.com = String(com || '').slice(0, 300); evento(d, et === 'coord' ? 'Coordinación' : 'Firma', p.r + (p.n ? ' (' + p.n + ')' : '') + (et === 'coord' ? ': revisado' : ': firmado') + nota); f.pos++; }
        if (f.pos >= f.ruta.length) { var hecha = f.ruta; ponerEtapa(g, d, 'emitir'); d.flujo.hecha = hecha; d.flujo.de = et; evento(d, 'Flujo', (et === 'coord' ? 'Coordinación interna' : 'Firmas') + ' completa: listo para emitir'); } }
      else return d;
      guardar(g); return d; },
    // Devuelve el entregable al originador con observaciones
    devolver: function (id, com) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null; var antes = nombreEtapa(etapaDe(d)); ponerEtapa(g, d, 'trabajo'); d.estado = 'Con observaciones'; evento(d, 'Flujo', 'Devuelto desde «' + antes + '» con observaciones' + (com ? ' · ' + String(com).slice(0, 300) : '')); guardar(g); return d; },
    // Cambia los responsables de la lista en curso (solo los pasos que aún no se han hecho)
    rutaPoner: function (id, lista) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || !d.flujo || !d.flujo.ruta) return null; var f = d.flujo, hechos = f.ruta.slice(0, f.pos), l = (lista || []).filter(function (x) { return x && String(x.r || '').trim(); }).map(function (x) { return { r: String(x.r).trim().slice(0, 60), n: String(x.n || '').trim().slice(0, 60), f: '', com: '' }; }); if (!l.length) return d; f.ruta = hechos.concat(l); evento(d, 'Flujo', 'Lista de ' + (f.etapa === 'coord' ? 'coordinación' : 'firmas') + ' actualizada: ' + f.ruta.map(function (x) { return x.r; }).join(' → ')); guardar(g); return d; },
    // Revisión que corresponde a una emisión nueva, a partir de la vigente y del tipo de emisión
    revPara: function (rev, tipo) { var t = TIPOS.filter(function (x) { return x.id === tipo; })[0] || {}, r = String(rev || '').trim();
      if (t.num) return /^\d+$/.test(r) ? String(+r + 1) : '0';
      if (!r) return 'A'; return sigRev(r); },
    lista: function () { return leer().docs; },
    uno: function (id) { return leer().docs.filter(function (d) { return d.id === id; })[0] || null; },
    alCambiar: function (f) { oyentes.push(f); },
    // Crea el registro si no existe (misma combinación de generador, enlace e ítem) y anota el evento.
    registrar: function (o) {
      var g = leer(), ge = gen(o.gen); if (!ge) return null;
      var k = clave(o), d = g.docs.filter(function (x) { return x.clave === k; })[0], pr = P.activo();
      if (!d) {
        d = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), clave: k, gen: ge.id, categoria: ge.category, subcategoria: ge.subcategory, tipo: ge.name, disciplina: ge.discipline,
          codigo: o.codigo || '', titulo: o.titulo || ge.name, ref: o.ref || ge.module, item: o.item || '', rev: o.rev || pr.rev || 'A', estado: o.estado || 'En desarrollo', creado: ahora(), modificado: ahora(), historial: [] };
        g.docs.push(d); evento(d, 'Creado', o.nota ? o.nota : o.manual ? 'Registrado a mano' : 'Registrado al exportar desde ' + ge.name);
      }
      if (o.formato) evento(d, 'Exportado', o.formato);
      guardar(g); return d;
    },
    editar: function (id, c) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null;
      ['codigo', 'titulo', 'area'].forEach(function (k) { if (typeof c[k] === 'string' && c[k].trim() !== (d[k] || '')) { evento(d, 'Editado', ({ codigo: 'Código: ', titulo: 'Título: ', area: 'Área: ' })[k] + c[k].trim()); d[k] = c[k].trim().slice(0, 160); } }); guardar(g); return d; },
    anotar: function (id, accion, detalle) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null; evento(d, accion, detalle); guardar(g); return d; },
    estado: function (id, est, nota) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || ESTADOS.indexOf(est) < 0 || d.estado === est) return d; var antes = d.estado; d.estado = est; d.flujo = null; evento(d, 'Estado', antes + ' → ' + est + (nota ? ' · ' + nota : '')); guardar(g); return d; },
    nuevaRevision: function (id, nota) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null; var antes = d.rev; d.rev = sigRev(d.rev); d.estado = 'En desarrollo'; d.flujo = { etapa: 'trabajo', desde: ahora() }; evento(d, 'Revisión', 'Rev. ' + antes + ' → Rev. ' + d.rev + (nota ? ' · ' + nota : '')); guardar(g); return d; },
    // Emisión formal: fija la revisión, la fecha y el tipo de emisión; queda en el historial y en la lista de emisiones
    emitir: function (id, e) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || !e || !e.rev) return null;
      var t = TIPOS.filter(function (x) { return x.id === e.tipo; })[0] || TIPOS[TIPOS.length - 1];
      d.rev = String(e.rev).trim().slice(0, 6); d.estado = 'Emitido'; d.flujo = { etapa: 'emitido', desde: ahora() };
      d.emision = { rev: d.rev, fecha: e.fecha || '', tipo: t.id, desc: (e.desc || t.desc).slice(0, 120), f: ahora() };
      d.emisiones = (d.emisiones || []).concat([d.emision]).slice(-40);
      evento(d, 'Emitido', 'Rev. ' + d.rev + (e.fecha ? ' · ' + e.fecha : '') + ' · ' + d.emision.desc); guardar(g); return d; },
    // Cuadro de revisiones editado a mano (corregir, quitar o agregar filas): la última fila es la emisión vigente
    revisiones: function (id, filas) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null;
      var l = (filas || []).filter(function (r) { return r && String(r.rev || '').trim(); }).map(function (r) { var v = (d.emisiones || []).filter(function (e) { return e.rev === r.rev; })[0] || {}; return { rev: String(r.rev).trim().slice(0, 6), fecha: r.fecha || '', tipo: v.tipo || 'otra', desc: String(r.desc || '').slice(0, 120), f: v.f || ahora() }; });
      d.emisiones = l.slice(-40); d.emision = l.length ? l[l.length - 1] : null; d.flujo = null;
      if (d.emision) { d.rev = d.emision.rev; d.estado = 'Emitido'; } else if (d.estado === 'Emitido') d.estado = 'En desarrollo';
      evento(d, 'Revisiones', 'Cuadro de revisiones editado: ' + (l.map(function (r) { return r.rev; }).join(', ') || 'sin revisiones')); guardar(g); return d; },
    // Vista previa de lo emitido: copia de la hoja tal como salió, guardada en este navegador (fuera de los datos del proyecto, por tamaño)
    guardarVista: function (id, v) { return bd().then(function (db) { return new Promise(function (ok) { var t = db.transaction('vistas', 'readwrite'); t.objectStore('vistas').put(Object.assign({ f: ahora() }, v), id); t.oncomplete = function () { ok(true); }; t.onerror = t.onabort = function () { ok(false); }; }); }).catch(function () { return false; }); },
    vista: function (id) { return bd().then(function (db) { return new Promise(function (ok) { var r = db.transaction('vistas').objectStore('vistas').get(id); r.onsuccess = function () { ok(r.result || null); }; r.onerror = function () { ok(null); }; }); }).catch(function () { return null; }); },
    // Anota un archivo real guardado en la carpeta del proyecto (ruta relativa a esa carpeta)
    adjuntar: function (id, ruta) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || !ruta) return null; d.archivos = d.archivos || []; if (d.archivos.indexOf(ruta) < 0) { d.archivos.push(ruta); evento(d, 'Archivo', ruta); guardar(g); } return d; },
    desvincular: function (id, ruta) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || !d.archivos) return; d.archivos = d.archivos.filter(function (x) { return x !== ruta; }); evento(d, 'Archivo', 'Desvinculado: ' + ruta); guardar(g); },
    deArchivo: function (ruta) { return leer().docs.filter(function (d) { return (d.archivos || []).indexOf(ruta) >= 0; }); },
    // Registro del entregable abierto en pantalla (lo crea si falta), según el módulo y el formato
    actual: function (f, conjunto) { return deActual(f, conjunto, ''); },
    quitar: function (id) { var g = leer(); g.docs = g.docs.filter(function (x) { return x.id !== id; }); guardar(g); bd().then(function (db) { db.transaction('vistas', 'readwrite').objectStore('vistas').delete(id); }).catch(function () {}); },
    resumen: function () { var o = { DOCUMENTO: { total: 0 }, PLANO: { total: 0 } }; leer().docs.forEach(function (d) { var c = o[d.categoria]; if (!c) return; c.total++; c[d.estado] = (c[d.estado] || 0) + 1; }); return o; },
    buscar: function (t) { var q = String(t || '').toLowerCase().split(/\s+/).filter(Boolean); return leer().docs.filter(function (d) { var s = [d.codigo, d.titulo, d.tipo, d.item, d.subcategoria, d.estado].join(' ').toLowerCase(); return q.every(function (w) { return s.indexOf(w) >= 0; }); }); }
  };

  // ── Registro automático: al pulsar un botón de exportación en un módulo ──
  var POR_COD = {}; R.generadores.forEach(function (x) { if (!POR_COD[x.cod]) POR_COD[x.cod] = x.id; });
  function formato(t) { if (/pegar|vista previa|importar|cargar|plantilla/i.test(t)) return ''; var m = /\b(PDF|DXF|Excel|Word|PNG|CSV)\b/i.exec(t); if (!m) return ''; var f = m[1].toUpperCase(); return f === 'EXCEL' ? 'Excel' : f === 'WORD' ? 'Word' : f; }
  function deActual(f, todos, formatoEvento) {
    if (!window.RS_ACTUAL) return null; var a = window.RS_ACTUAL(); if (!a) return null;
    var id = POR_COD[a.cod]; if (a.cod === 'H3' || a.cod === 'MC') id = f === 'Excel' ? 'D01-CONDUIT' : 'P08-DUCTO'; if (!id) return null;
    var ge = gen(id), h = todos ? null : a.hijo;
    return G.registrar({ gen: id, ref: a.href, item: h ? (h.t || h.s) : '', titulo: h ? ((h.t ? h.t + ' · ' : '') + (h.s || ge.name)) : ge.name + (todos ? ' (conjunto)' : ''), formato: formatoEvento });
  }
  var ultimoConjunto = false;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, a.btn'); if (!b || b.closest('#rsMarco, #raPanel, .gd, .dkm-em')) return;
    var f = formato(b.textContent || ''); if (!f) return;
    ultimoConjunto = /todos|todas/i.test(b.textContent); deActual(f, ultimoConjunto, f);
  }, true);
  G.conjunto = function () { return ultimoConjunto; };
})();
