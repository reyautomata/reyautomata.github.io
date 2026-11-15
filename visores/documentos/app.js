/* Control documental · tabla, filtros, propiedades e historial sobre RE_GESTION. */
(function () {
  'use strict';
  var G = window.RE_GESTION, R = window.RE_ENTREGABLES, $ = function (s) { return document.querySelector(s); }; if (!G || !R) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fecha = function (i) { try { var d = new Date(i); return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return i; } };
  var sel = null, SUBN = {}; R.subcategorias.forEach(function (s) { SUBN[s.id] = s.name; });
  function opciones(el, lista, primero) { el.innerHTML = (primero ? '<option value="">' + primero + '</option>' : '') + lista.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join(''); }
  function subs() { var c = $('#fCat').value; opciones($('#fSub'), R.subcategorias.filter(function (s) { return !c || s.category === c; }).map(function (s) { return [s.id, s.id + ' ' + s.name]; }), 'Todas las subcategorías'); }
  function visibles() {
    var c = $('#fCat').value, s = $('#fSub').value, e = $('#fEst').value;
    return G.buscar($('#fTxt').value).filter(function (d) { return (!c || d.categoria === c) && (!s || d.subcategoria === s) && (!e || d.estado === e); }).sort(function (a, b) { return a.modificado < b.modificado ? 1 : -1; });
  }
  function pintar() {
    var r = G.resumen(), v = visibles(), todos = G.lista().length;
    function caja(n, t) { return '<div><b>' + n + '</b><span>' + t + '</span></div>'; }
    var pend = 0; G.lista().forEach(function (d) { if (/Borrador|En desarrollo|Con observaciones/.test(d.estado)) pend++; });
    $('#res').innerHTML = caja(r.DOCUMENTO.total, 'documentos') + caja(r.PLANO.total, 'planos') + caja(pend, 'pendientes') + caja((r.DOCUMENTO['En revisión'] || 0) + (r.PLANO['En revisión'] || 0), 'en revisión') + caja((r.DOCUMENTO.Emitido || 0) + (r.PLANO.Emitido || 0), 'emitidos');
    $('#filas').innerHTML = v.map(function (d) {
      return '<tr data-id="' + d.id + '" tabindex="0" aria-selected="' + (d.id === sel) + '"><td class="cod">' + (esc(d.codigo) || '<span style="color:var(--muted)">sin código</span>') + '</td><td>' + esc(d.titulo) + '</td><td>' + esc(d.tipo) + '</td><td class="mono" title="' + esc(SUBN[d.subcategoria]) + '">' + d.subcategoria + '</td><td class="mono">' + esc(d.rev) + '</td>' +
        '<td><span class="est e' + G.ESTADOS.indexOf(d.estado) + '"></span>' + esc(d.estado) + '</td><td class="mono">' + fecha(d.modificado) + '</td></tr>';
    }).join('');
    var va = $('#vacio'); va.hidden = v.length > 0; va.textContent = todos ? 'Ningún entregable coincide con el filtro.' : 'Todavía no hay entregables registrados en este proyecto. Exporta uno desde su módulo o usa «Registrar entregable».';
    pintarProp();
  }
  function pintarProp() {
    var p = $('#prop'), d = sel && G.uno(sel); if (!d) { p.hidden = true; return; } p.hidden = false;
    p.innerHTML = '<h2>' + esc(d.titulo) + '</h2>' +
      '<label>Código de documento<input id="pCod" value="' + esc(d.codigo) + '" maxlength="60"></label><label>Título<input id="pTit" value="' + esc(d.titulo) + '" maxlength="160"></label>' +
      '<label>Estado<select id="pEst">' + G.ESTADOS.map(function (e) { return '<option' + (e === d.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></label>' +
      '<div class="acc"><a class="btn" href="../' + esc(d.ref) + '">Abrir en su módulo</a><button type="button" id="pRev">Crear nueva revisión</button><button type="button" id="pDel">Quitar registro</button></div>' +
      '<dl><dt>Categoría</dt><dd>' + (d.categoria === 'PLANO' ? 'Plano de ingeniería' : 'Documento de ingeniería') + '</dd><dt>Subcategoría</dt><dd>' + d.subcategoria + ' ' + esc(SUBN[d.subcategoria]) + '</dd><dt>Tipo</dt><dd>' + esc(d.tipo) + '</dd><dt>Disciplina</dt><dd>' + esc(d.disciplina) + '</dd>' +
      '<dt>Revisión</dt><dd>' + esc(d.rev) + '</dd><dt>Generador</dt><dd>' + esc(d.gen) + '</dd><dt>Creado</dt><dd>' + fecha(d.creado) + '</dd><dt>Modificado</dt><dd>' + fecha(d.modificado) + '</dd></dl>' +
      ((d.archivos || []).length ? '<h3>Archivos en la carpeta del proyecto</h3><ul class="hist">' + d.archivos.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul><p class="nota" style="margin:0 0 8px"><a href="../explorador/" style="color:var(--sel)">Abrir el explorador de archivos</a></p>' : '') +
      '<h3>Historial</h3><ul class="hist">' + d.historial.slice().reverse().map(function (h) { return '<li><b>' + esc(h.a) + '</b> ' + esc(h.d) + '<small>' + fecha(h.f) + ' · Rev. ' + esc(h.rev) + ' · ' + esc(h.estado) + '</small></li>'; }).join('') + '</ul>';
    $('#pCod').addEventListener('change', function (e) { G.editar(d.id, { codigo: e.target.value }); });
    $('#pTit').addEventListener('change', function (e) { if (e.target.value.trim()) G.editar(d.id, { titulo: e.target.value }); });
    $('#pEst').addEventListener('change', function (e) { G.estado(d.id, e.target.value); });
    $('#pRev').addEventListener('click', function () { G.nuevaRevision(d.id); });
    var del = $('#pDel'); del.addEventListener('click', function () { if (del.dataset.ok) { sel = null; G.quitar(d.id); } else { del.dataset.ok = '1'; del.textContent = 'Confirmar: quitar'; } });
  }
  function elegir(tr) { if (!tr) return; sel = tr.dataset.id; pintar(); }
  $('#filas').addEventListener('click', function (e) { elegir(e.target.closest('tr')); });
  $('#filas').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(e.target.closest('tr')); } });
  ['#fTxt', '#fSub', '#fEst'].forEach(function (q) { $(q).addEventListener('input', pintar); });
  $('#fCat').addEventListener('input', function () { subs(); pintar(); });
  opciones($('#fEst'), G.ESTADOS.map(function (e) { return [e, e]; }), 'Todos los estados'); subs();
  // Registro manual
  var dn = $('#dNuevo');
  opciones($('#nGen'), R.generadores.map(function (g) { return [g.id, g.subcategory + ' · ' + g.name]; })); opciones($('#nEst'), G.ESTADOS.map(function (e) { return [e, e]; })); 
  $('#bNuevo').addEventListener('click', function () { $('#nTit').value = ''; $('#nCod').value = ''; $('#nEst').value = 'En desarrollo'; dn.showModal(); $('#nTit').focus(); });
  $('#nX').addEventListener('click', function () { dn.close(); });
  dn.addEventListener('close', function () { if (dn.returnValue !== 'ok') return; dn.returnValue = ''; var t = $('#nTit').value.trim(); if (!t) return;
    var d = G.registrar({ gen: $('#nGen').value, titulo: t, codigo: $('#nCod').value.trim(), estado: $('#nEst').value, item: 'manual-' + Date.now().toString(36), manual: true }); if (d) { sel = d.id; pintar(); } });
  $('#bCsv').addEventListener('click', function () {
    var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
    var f = [['Código', 'Título', 'Categoría', 'Subcategoría', 'Tipo', 'Disciplina', 'Revisión', 'Estado', 'Creado', 'Modificado']].concat(visibles().map(function (d) { return [d.codigo, d.titulo, d.categoria, d.subcategoria + ' ' + SUBN[d.subcategoria], d.tipo, d.disciplina, d.rev, d.estado, d.creado.slice(0, 10), d.modificado.slice(0, 10)]; }));
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + f.map(function (r) { return r.map(q).join(';'); }).join('\r\n')], { type: 'text/csv' })); a.download = 'Listado de documentos y planos.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  });
  G.alCambiar(pintar); window.addEventListener('storage', function (e) { if (e.key && /gestion/.test(e.key)) pintar(); });
  pintar();
})();
