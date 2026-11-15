/* Suite ReyEngi · gestión documental del proyecto activo.
 * Cada entregable (documento o plano) tiene un registro con metadatos, estado, revisión e historial.
 * Los registros nacen de dos formas reales: cuando se exporta desde un módulo (se anota el evento) o cuando se registran a mano.
 * Una revisión nueva nunca borra la anterior: queda en el historial. Todo se guarda con el proyecto, en este navegador. */
(function () {
  'use strict';
  var P = window.REProyectos, R = window.RE_ENTREGABLES; if (!P || !R || window.RE_GESTION) return;
  var ESTADOS = ['Borrador', 'En desarrollo', 'En revisión', 'Con observaciones', 'Aprobado', 'Emitido', 'Obsoleto'];
  var oyentes = [];
  function leer() { var g = null; try { g = P.leer('gestion', null); } catch (e) {} g = g || {}; g.docs = g.docs || []; return g; }
  function guardar(g) { try { P.escribir('gestion', g); } catch (e) {} oyentes.forEach(function (f) { try { f(); } catch (e) {} }); }
  function ahora() { return new Date().toISOString(); }
  function gen(id) { return R.generadores.filter(function (x) { return x.id === id; })[0] || null; }
  function sigRev(r) { r = String(r || 'A').trim(); if (/^\d+$/.test(r)) return String(+r + 1); var c = r.toUpperCase().charCodeAt(r.length - 1); return c >= 65 && c < 90 ? r.slice(0, -1) + String.fromCharCode(c + 1) : r + 'A'; }
  function evento(d, a, det) { d.historial.push({ f: ahora(), a: a, d: det || '', rev: d.rev, estado: d.estado }); if (d.historial.length > 150) d.historial.splice(0, d.historial.length - 150); d.modificado = ahora(); }
  function clave(o) { return o.gen + '|' + (o.ref || '') + '|' + (o.item || ''); }

  var G = window.RE_GESTION = {
    ESTADOS: ESTADOS,
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
        g.docs.push(d); evento(d, 'Creado', o.manual ? 'Registrado a mano' : 'Registrado al exportar desde ' + ge.name);
      }
      if (o.formato) evento(d, 'Exportado', o.formato);
      guardar(g); return d;
    },
    editar: function (id, c) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null;
      ['codigo', 'titulo'].forEach(function (k) { if (typeof c[k] === 'string' && c[k].trim() !== d[k]) { evento(d, 'Editado', (k === 'codigo' ? 'Código: ' : 'Título: ') + c[k].trim()); d[k] = c[k].trim().slice(0, 160); } }); guardar(g); return d; },
    estado: function (id, est, nota) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d || ESTADOS.indexOf(est) < 0 || d.estado === est) return d; var antes = d.estado; d.estado = est; evento(d, 'Estado', antes + ' → ' + est + (nota ? ' · ' + nota : '')); guardar(g); return d; },
    nuevaRevision: function (id, nota) { var g = leer(), d = g.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return null; var antes = d.rev; d.rev = sigRev(d.rev); d.estado = 'En desarrollo'; evento(d, 'Revisión', 'Rev. ' + antes + ' → Rev. ' + d.rev + (nota ? ' · ' + nota : '')); guardar(g); return d; },
    quitar: function (id) { var g = leer(); g.docs = g.docs.filter(function (x) { return x.id !== id; }); guardar(g); },
    resumen: function () { var o = { DOCUMENTO: { total: 0 }, PLANO: { total: 0 } }; leer().docs.forEach(function (d) { var c = o[d.categoria]; if (!c) return; c.total++; c[d.estado] = (c[d.estado] || 0) + 1; }); return o; },
    buscar: function (t) { var q = String(t || '').toLowerCase().split(/\s+/).filter(Boolean); return leer().docs.filter(function (d) { var s = [d.codigo, d.titulo, d.tipo, d.item, d.subcategoria, d.estado].join(' ').toLowerCase(); return q.every(function (w) { return s.indexOf(w) >= 0; }); }); }
  };

  // ── Registro automático: al pulsar un botón de exportación en un módulo ──
  var POR_COD = {}; R.generadores.forEach(function (x) { if (!POR_COD[x.cod]) POR_COD[x.cod] = x.id; });
  function formato(t) { if (/pegar|vista previa|importar|cargar|plantilla/i.test(t)) return ''; var m = /\b(PDF|DXF|Excel|Word|PNG|CSV)\b/i.exec(t); if (!m) return ''; var f = m[1].toUpperCase(); return f === 'EXCEL' ? 'Excel' : f === 'WORD' ? 'Word' : f; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, a.btn'); if (!b || b.closest('#rsMarco, #raPanel, .gd')) return;
    var f = formato(b.textContent || ''); if (!f || !window.RS_ACTUAL) return;
    var a = window.RS_ACTUAL(); if (!a) return; var id = POR_COD[a.cod]; if (a.cod === 'H3' || a.cod === 'MC') id = f === 'Excel' ? 'D01-CONDUIT' : 'P08-DUCTO'; if (!id) return;
    var ge = gen(id), todos = /todos|todas/i.test(b.textContent), h = todos ? null : a.hijo;
    G.registrar({ gen: id, ref: a.href, item: h ? (h.t || h.s) : '', titulo: h ? ((h.t ? h.t + ' · ' : '') + (h.s || ge.name)) : ge.name + (todos ? ' (conjunto)' : ''), formato: f });
  }, true);
})();
