/* Control documental · tabla, filtros, propiedades e historial sobre RE_GESTION. */
(function () {
  'use strict';
  var G = window.RE_GESTION, R = window.RE_ENTREGABLES, $ = function (s) { return document.querySelector(s); }; if (!G || !R) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fecha = function (i) { try { var d = new Date(i); return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return i; } };
  // Bandejas: una por etapa del flujo de trabajo, más la de atrasados. Se pueden abrir directo con #trabajo, #esp, #coord, #firmas, #emitir o #emitido.
  var banda = '', ETAPAS = G.FLUJO.map(function (x) { return x.id; });
  function leerHash() { var h = location.hash.replace('#', ''); banda = ETAPAS.indexOf(h) >= 0 || h === 'atrasados' ? h : ''; }
  leerHash();
  function fechaC(i) { try { return new Date(i).toLocaleDateString('es-CL'); } catch (e) { return ''; } }
  var sel = null, SUBN = {}; R.subcategorias.forEach(function (s) { SUBN[s.id] = s.name; });
  function opciones(el, lista, primero) { el.innerHTML = (primero ? '<option value="">' + primero + '</option>' : '') + lista.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join(''); }
  function subs() { var c = $('#fCat').value; opciones($('#fSub'), R.subcategorias.filter(function (s) { return !c || s.category === c; }).map(function (s) { return [s.id, s.id + ' ' + s.name]; }), 'Todas las subcategorías'); }
  function visibles() {
    var c = $('#fCat').value, s = $('#fSub').value, e = $('#fEst').value;
    return G.buscar($('#fTxt').value).filter(function (d) { return (!c || d.categoria === c) && (!s || d.subcategoria === s) && (!e || d.estado === e) && (!banda || (banda === 'atrasados' ? G.paso(d).atrasado : G.etapa(d) === banda)); }).sort(function (a, b) { return a.modificado < b.modificado ? 1 : -1; });
  }
  function pintar() {
    var r = G.resumen(), v = visibles(), todos = G.lista().length;
    function caja(n, t) { return '<div><b>' + n + '</b><span>' + t + '</span></div>'; }
    var pend = 0; G.lista().forEach(function (d) { if (/Borrador|En desarrollo|Con observaciones/.test(d.estado)) pend++; });
    $('#res').innerHTML = caja(r.DOCUMENTO.total, 'documentos') + caja(r.PLANO.total, 'planos') + caja(pend, 'pendientes') + caja((r.DOCUMENTO['En revisión'] || 0) + (r.PLANO['En revisión'] || 0), 'en revisión') + caja((r.DOCUMENTO.Emitido || 0) + (r.PLANO.Emitido || 0), 'emitidos');
    var cta = {}, atr = 0; G.lista().forEach(function (d) { var e = G.etapa(d); cta[e] = (cta[e] || 0) + 1; if (G.paso(d).atrasado) atr++; });
    var bj = $('#bandejas'); if (!bj) { bj = document.createElement('div'); bj.id = 'bandejas'; bj.className = 'bandejas'; bj.setAttribute('role', 'group'); bj.setAttribute('aria-label', 'Bandejas por etapa del flujo de trabajo'); $('#res').parentNode.insertBefore(bj, $('#res').nextSibling);
      bj.addEventListener('click', function (e) { var b = e.target.closest('button[data-b]'); if (!b) return; if (b.dataset.b === 'cfg') return abrirListas(); banda = b.dataset.b; try { history.replaceState(null, '', banda ? '#' + banda : location.pathname + location.search); } catch (er) {} pintar(); }); }
    bj.innerHTML = '<button type="button" data-b="" aria-pressed="' + (!banda) + '">Todos <b>' + todos + '</b></button>' + G.FLUJO.map(function (x, i) { return '<button type="button" data-b="' + x.id + '" aria-pressed="' + (banda === x.id) + '" title="' + esc(x.d) + '"><i>' + (i + 1) + '</i>' + esc(x.n) + ' <b>' + (cta[x.id] || 0) + '</b></button>'; }).join('') +
      '<button type="button" data-b="atrasados" class="atr" aria-pressed="' + (banda === 'atrasados') + '" title="Entregables que llevan más días que el plazo en revisión, coordinación o firmas">Atrasados <b>' + atr + '</b></button><button type="button" data-b="cfg" class="cfg">Listas de coordinación y firmas</button>';
    $('#filas').innerHTML = v.map(function (d) {
      return '<tr data-id="' + d.id + '" tabindex="0" aria-selected="' + (d.id === sel) + '"><td class="cod">' + (esc(d.codigo) || '<span style="color:var(--muted)">sin código</span>') + '</td><td>' + esc(d.titulo) + '</td><td>' + esc(d.tipo) + '</td><td class="mono" title="' + esc(SUBN[d.subcategoria]) + '">' + d.subcategoria + '</td><td class="mono">' + esc(d.rev) + '</td>' +
        '<td><span class="est e' + G.ESTADOS.indexOf(d.estado) + '"></span>' + (function () { var p = G.paso(d); return esc(p.nombre) + (d.estado === 'Con observaciones' ? ' · con observaciones' : '') + (p.actual ? '<small class="paso' + (p.atrasado ? ' atr' : '') + '">' + (p.pos + 1) + ' de ' + p.ruta.length + ' · ' + esc(p.actual.r) + (p.atrasado ? ' · ' + p.dias + ' días' : '') + '</small>' : p.atrasado ? '<small class="paso atr">' + p.dias + ' días en esta etapa</small>' : ''); })() + '</td><td class="mono">' + fecha(d.modificado) + '</td></tr>';
    }).join('');
    var va = $('#vacio'); va.hidden = v.length > 0; va.textContent = todos ? 'Ningún entregable coincide con el filtro.' : 'Todavía no hay entregables registrados en este proyecto. Exporta uno desde su módulo o usa «Registrar entregable».';
    pintarProp();
  }
  function pintarProp() {
    var p = $('#prop'), d = sel && G.uno(sel); if (!d) { p.hidden = true; return; } p.hidden = false;
    p.innerHTML = '<h2>' + esc(d.titulo) + '</h2>' +
      '<label>Código de documento<input id="pCod" value="' + esc(d.codigo) + '" maxlength="60"></label><label>Título<input id="pTit" value="' + esc(d.titulo) + '" maxlength="160"></label>' +
      '<label>Estado<select id="pEst">' + G.ESTADOS.map(function (e) { return '<option' + (e === d.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></label>' +
      flujoHtml(d) +
      '<div class="acc"><a class="btn" href="../' + esc(d.ref) + '">Abrir en su módulo</a><button type="button" id="pRev">Crear nueva revisión</button><button type="button" id="pDel">Quitar registro</button></div>' +
      '<dl><dt>Categoría</dt><dd>' + (d.categoria === 'PLANO' ? 'Plano de ingeniería' : 'Documento de ingeniería') + '</dd><dt>Subcategoría</dt><dd>' + d.subcategoria + ' ' + esc(SUBN[d.subcategoria]) + '</dd><dt>Tipo</dt><dd>' + esc(d.tipo) + '</dd><dt>Disciplina</dt><dd>' + esc(d.disciplina) + '</dd>' +
      '<dt>Revisión</dt><dd>' + esc(d.rev) + '</dd><dt>Generador</dt><dd>' + esc(d.gen) + '</dd><dt>Creado</dt><dd>' + fecha(d.creado) + '</dd><dt>Modificado</dt><dd>' + fecha(d.modificado) + '</dd></dl>' +
      (d.emision ? '<h3>Vista previa de lo emitido</h3><div id="pVista" class="vista"><p class="nota" style="margin:0">Buscando la vista previa…</p></div>' : '') +
      ((d.emisiones || []).length > 1 ? '<h3>Revisiones emitidas</h3><ul class="hist">' + d.emisiones.slice().reverse().map(function (e) { return '<li><b>Rev. ' + esc(e.rev) + '</b> ' + esc(e.desc) + '<small>' + esc(e.fecha) + '</small></li>'; }).join('') + '</ul>' : '') +
      (d.emision ? '<h3>Emisión vigente</h3><p class="nota" style="margin:0 0 8px;color:var(--fg)">Rev. ' + esc(d.emision.rev) + (d.emision.fecha ? ' · ' + esc(d.emision.fecha) : '') + ' · ' + esc(d.emision.desc) + '</p>' +
        (d.gen === 'P02-LAZO' && /^Lazo /.test(d.item) ? '<div class="acc"><button type="button" data-des="PDF">Imprimir / PDF</button><button type="button" data-des="DXF">Descargar DXF</button></div><p class="nota" style="margin:0 0 8px">El plano se genera en su módulo con la revisión emitida.</p>' : '<p class="nota" style="margin:0 0 8px">Para descargarlo, ábrelo en su módulo.</p>') : '') +
      ((d.archivos || []).length ? '<h3>Archivos en la carpeta del proyecto</h3><ul class="hist">' + d.archivos.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul><p class="nota" style="margin:0 0 8px"><a href="../explorador/" style="color:var(--sel)">Abrir el explorador de archivos</a></p>' : '') +
      '<h3>Historial</h3><ul class="hist">' + d.historial.slice().reverse().map(function (h) { return '<li><b>' + esc(h.a) + '</b> ' + esc(h.d) + '<small>' + fecha(h.f) + ' · Rev. ' + esc(h.rev) + ' · ' + esc(h.estado) + '</small></li>'; }).join('') + '</ul>';
    [].forEach.call(p.querySelectorAll('[data-des]'), function (b) { b.addEventListener('click', function () { try { sessionStorage.setItem('reyengi-descargar', JSON.stringify({ gen: d.gen, ids: [d.item.replace(/^Lazo /, '')], f: b.dataset.des })); } catch (e) {} location.href = '../lazos/index.html#lazos'; }); });
    if (d.emision && G.vista) G.vista(d.id).then(function (v) { var c = $('#pVista'); if (!c || sel !== d.id) return;
      if (!v || !v.html) { c.innerHTML = '<p class="nota" style="margin:0">Esta emisión no tiene vista previa guardada en este navegador. Se guarda al emitir desde el módulo.</p>'; return; }
      function armar(w) { var zz = v.ancho && v.ancho + 24 > w ? Math.max(0.15, (w - 24) / v.ancho) : 1; return doc.replace('/*zoom*/', zz < 1 ? 'body>*{zoom:' + zz.toFixed(3) + '}' : ''); }
      var doc = '<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="' + esc(v.base || '') + '">' + (v.enlaces || []).map(function (h) { return '<link rel="stylesheet" href="' + esc(h) + '">'; }).join('') + '<style>' + String(v.css || '').replace(/<\/style/gi, '') + '\n/*zoom*/html,body{background:#3b4656!important;margin:0;padding:10px;height:auto;overflow:auto;display:block}svg{max-width:100%;height:auto}</style></head><body>' + v.html + '</body></html>';
      c.innerHTML = '<iframe title="Vista previa de ' + esc(d.titulo) + ' rev. ' + esc(d.emision.rev) + '" sandbox=""></iframe><div class="acc"><button type="button" id="pGrande">Ver en grande</button><span class="nota">Copia guardada al emitir · ' + fecha(v.f) + '</span></div>';
      c.querySelector('iframe').srcdoc = armar(c.clientWidth || 300);
      $('#pGrande').addEventListener('click', function () { var dl = document.createElement('dialog'); dl.className = 'vistaG'; dl.innerHTML = '<div><b>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo) + ' · Rev. ' + esc(d.emision.rev) + '</b><button type="button">Cerrar</button></div><iframe title="Vista previa ampliada" sandbox=""></iframe>'; document.body.appendChild(dl); dl.querySelector('iframe').srcdoc = armar(Math.round(window.innerWidth * 0.96)); dl.querySelector('button').onclick = function () { dl.close(); }; dl.addEventListener('close', function () { dl.remove(); }); dl.showModal(); });
    });
    var fl = p.querySelector('.flujo'); if (fl) fl.addEventListener('click', function (e) { var b = e.target.closest('button[data-fl]'); if (!b) return; var com = (fl.querySelector('#flCom') || {}).value || '', a = b.dataset.fl;
      if (a === 'sig') G.avanzar(d.id, com.trim());
      else if (a === 'dev') { if (!com.trim()) { var c = fl.querySelector('#flCom'); c.placeholder = 'Escribe la observación antes de devolver'; c.focus(); return; } G.devolver(d.id, com.trim()); }
      else if (a === 'ruta') { var l = [].map.call(fl.querySelectorAll('.fl-pend'), function (li) { return { r: li.querySelector('[data-r]').value, n: li.querySelector('[data-n]').value }; }); G.rutaPoner(d.id, l); }
      else if (a === 'mas') { var l2 = [].map.call(fl.querySelectorAll('.fl-pend'), function (li) { return { r: li.querySelector('[data-r]').value, n: li.querySelector('[data-n]').value }; }); l2.push({ r: 'Nuevo responsable', n: '' }); G.rutaPoner(d.id, l2); }
      else if (a === 'emi') { var rv = fl.querySelector('#flRev').value.trim(); if (!rv) return fl.querySelector('#flRev').focus(); G.emitir(d.id, { rev: rv, fecha: fl.querySelector('#flFec').value, tipo: fl.querySelector('#flTipo').value }); } });
    var ft = p.querySelector('#flTipo'); if (ft) ft.addEventListener('change', function () { p.querySelector('#flRev').value = G.revPara((d.emision || {}).rev || '', ft.value); });
    $('#pCod').addEventListener('change', function (e) { G.editar(d.id, { codigo: e.target.value }); });
    $('#pTit').addEventListener('change', function (e) { if (e.target.value.trim()) G.editar(d.id, { titulo: e.target.value }); });
    $('#pEst').addEventListener('change', function (e) { G.estado(d.id, e.target.value); });
    $('#pRev').addEventListener('click', function () { G.nuevaRevision(d.id); });
    var del = $('#pDel'); del.addEventListener('click', function () { if (del.dataset.ok) { sel = null; G.quitar(d.id); } else { del.dataset.ok = '1'; del.textContent = 'Confirmar: quitar'; } });
  }
  // Bloque «Flujo de trabajo» de las propiedades: etapas, responsable actual, lista de coordinación o firmas y acciones
  function flujoHtml(d) {
    var p = G.paso(d), et = p.etapa, i = ETAPAS.indexOf(et), F = G.FLUJO[i], hoy = new Date(), dd = ('0' + hoy.getDate()).slice(-2) + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + hoy.getFullYear();
    var h = '<div class="flujo"><h3>Flujo de trabajo</h3><ol class="fl-pasos">' + G.FLUJO.map(function (x, k) { return '<li class="' + (k < i ? 'hecho' : k === i ? 'actual' : '') + '"' + (k === i ? ' aria-current="step"' : '') + '><i>' + (k < i ? '✓' : k + 1) + '</i><span>' + esc(x.n) + '</span></li>'; }).join('') + '</ol>' +
      '<p class="nota fl-d"><b>' + esc(F.n) + '.</b> ' + esc(F.d) + (p.atrasado ? ' <b class="fl-atr">Lleva ' + p.dias + ' días: supera el plazo de ' + p.plazo + '.</b>' : '') + '</p>';
    var lista = (d.flujo && (d.flujo.ruta || d.flujo.hecha)) || [];
    if (lista.length) h += '<ol class="fl-ruta">' + lista.map(function (x, k) { var hecho = !!x.f, act = (et === 'coord' || et === 'firmas') && k === p.pos;
      return '<li class="' + (hecho ? 'hecho' : act ? 'actual' : 'fl-pend') + (act ? ' fl-pend' : '') + '">' + (hecho ? '<b>✓ ' + esc(x.r) + '</b>' + (x.n ? ' · ' + esc(x.n) : '') + '<small>' + fechaC(x.f) + (x.com ? ' · ' + esc(x.com) : '') + '</small>' : '<input data-r value="' + esc(x.r) + '" aria-label="Rol o disciplina del paso ' + (k + 1) + '"><input data-n value="' + esc(x.n) + '" placeholder="Nombre" aria-label="Nombre del responsable del paso ' + (k + 1) + '">' + (act ? '<small>Lo tiene ahora · desde ' + fechaC(p.desde) + '</small>' : '')) + '</li>'; }).join('') + '</ol>' +
      (et === 'coord' || et === 'firmas' ? '<div class="acc"><button type="button" data-fl="ruta">Guardar la lista</button><button type="button" data-fl="mas">+ Agregar responsable</button></div>' : '');
    if (et === 'emitir') { var rs = G.revPara((d.emision || {}).rev || '', (d.emisiones || []).length ? 'cliente' : 'interna');
      h += '<div class="fl-emi"><label>Tipo de emisión<select id="flTipo">' + G.TIPOS.map(function (t) { return '<option value="' + t.id + '"' + (t.id === ((d.emisiones || []).length ? 'cliente' : 'interna') ? ' selected' : '') + '>' + esc(t.t) + '</option>'; }).join('') + '</select></label><label>Revisión<input id="flRev" value="' + esc(rs) + '" maxlength="6"></label><label>Fecha<input id="flFec" value="' + dd + '"></label></div><div class="acc"><button type="button" class="pri" data-fl="emi">Emitir</button><button type="button" data-fl="dev">Devolver a trabajo</button></div><label>Observación (obligatoria para devolver)<input id="flCom" maxlength="300"></label>';
    } else if (et === 'emitido') h += '<p class="nota">Para seguir trabajando en él usa «Crear nueva revisión»: vuelve a «En trabajo» y la emisión queda en el historial.</p>';
    else h += '<label>Comentario u observación<input id="flCom" maxlength="300" placeholder="' + (et === 'trabajo' ? 'Opcional' : 'Opcional para avanzar · obligatoria para devolver') + '"></label><div class="acc"><button type="button" class="pri" data-fl="sig">' + esc(p.actual ? (et === 'coord' ? 'Marcar revisado: ' : 'Marcar firmado: ') + p.actual.r : F.sig) + '</button>' + (et !== 'trabajo' ? '<button type="button" data-fl="dev">Devolver con observaciones</button>' : '') + '</div>';
    return h + '</div>';
  }
  // Listas del proyecto: quiénes coordinan, quiénes firman y cuántos días tiene cada uno
  function abrirListas() {
    var c = G.flujoCfg(), dl = document.createElement('dialog'); dl.className = 'dListas'; dl.setAttribute('aria-labelledby', 'dlT');
    function txt(l) { return l.map(function (x) { return x.r + (x.n ? ' | ' + x.n : ''); }).join('\n'); }
    function leerL(v) { return String(v).split('\n').map(function (t) { var q = t.split('|'); return { r: (q[0] || '').trim(), n: (q[1] || '').trim() }; }).filter(function (x) { return x.r; }); }
    dl.innerHTML = '<form method="dialog"><h2 id="dlT">Listas de coordinación y firmas</h2><p class="nota">Una línea por responsable, en el orden en que reciben el entregable. Formato: <b>Rol o disciplina | Nombre</b> (el nombre es opcional). Se aplican a los entregables que entren a esa etapa desde ahora.</p>' +
      '<label>Coordinación interna (primera emisión, Rev. A)<textarea id="lCoord" rows="6">' + esc(txt(c.coord)) + '</textarea></label><label>Firmas (Rev. B en adelante)<textarea id="lFirmas" rows="4">' + esc(txt(c.firmas)) + '</textarea></label>' +
      '<label>Plazo por responsable [días]<input id="lPlazo" type="number" min="1" max="60" value="' + c.plazo + '"></label><div class="pie"><button type="button" id="lX">Cancelar</button><button type="submit" class="pri" value="ok">Guardar</button></div></form>';
    document.body.appendChild(dl); dl.querySelector('#lX').onclick = function () { dl.close(); };
    dl.addEventListener('close', function () { if (dl.returnValue === 'ok') G.flujoGuardar({ coord: leerL(dl.querySelector('#lCoord').value), firmas: leerL(dl.querySelector('#lFirmas').value), plazo: dl.querySelector('#lPlazo').value }); dl.remove(); });
    dl.showModal();
  }
  window.addEventListener('hashchange', function () { leerHash(); pintar(); });
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
