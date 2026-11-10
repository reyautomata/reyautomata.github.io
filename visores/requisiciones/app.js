/* Interfaz de Requisiciones de compra · Suite ReyEngi */
(function () {
  'use strict';
  var P = window.REProyectos, TT = window.RQ_TIPOS, $ = function (s) { return document.querySelector(s); };
  var D = RQ.cargar(), sel = D.lista.length ? D.lista[0].id : null;
  function rq() { return D.lista.filter(function (r) { return r.id === sel; })[0] || null; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var tG = 0;
  function guardar(msg) { clearTimeout(tG); tG = setTimeout(function () { RQ.guardar(D); estado(msg || 'Guardado en este navegador · ' + new Date().toLocaleTimeString('es-CL')); }, 250); }
  function estado(t) { var x = $('#estado'); if (x) x.textContent = t; }
  function setPath(o, path, v) {
    var k = path.split('.'), x = o;
    for (var i = 0; i < k.length - 1; i++) { x = x[k[i]]; if (x == null) return; }
    x[k[k.length - 1]] = v;
  }

  // ── Pestañas ──
  document.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () { tab(b.dataset.t); history.replaceState(null, '', '#' + b.dataset.t); });
  });
  function tab(t) {
    if (!document.querySelector('section[data-t="' + t + '"]')) t = 'lista';
    document.querySelectorAll('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'); });
    document.querySelectorAll('main > section[data-t]').forEach(function (s) { s.hidden = s.dataset.t !== t; });
    window.scrollTo(0, 0);
    if (t === 'vista') vista();
    if (t === 'hr') pintarHR();
  }

  // ── Lista ──
  function pintarLista() {
    var pr = P.activo();
    $('#prNombre').textContent = (pr.numero ? pr.numero + ' · ' : '') + (pr.proyecto || pr.nombre || '');
    $('#lista').innerHTML = D.lista.length ? D.lista.map(function (r) {
      var v = RQ.revActual(r), n = (r.items || []).filter(function (x) { return x.k === 'i'; }).length, tg = (r.items || []).filter(function (x) { return x.tag; }).length;
      return '<button type="button" class="rqc' + (r.id === sel ? ' sel' : '') + (r.estado === 'anulada' ? ' anul' : '') + '" data-id="' + r.id + '"><span class="cod">' + e(RQ.codigo(r, D)) + ' · Rev. ' + e(v.rev) + '</span><b>' + e(r.titulo) + '</b>' +
        '<span class="meta">' + n + ' ítems' + (tg ? ' · ' + tg + ' tags' : '') + (r.estado === 'anulada' ? ' · ANULADA' : '') + '</span></button>';
    }).join('') : '<p class="peq">Sin requisiciones. Usa <b>Sugerir desde el listado</b> para crear una por cada tipo de instrumento del proyecto, o crea una nueva por tipo.</p>';
    var sin = RQ.sinRequisicion(D);
    $('#sinRq').innerHTML = sin.length ? '<b>' + sin.length + ' instrumento' + (sin.length > 1 ? 's' : '') + ' sin requisición</b><span>' + sin.slice(0, 40).map(function (x) { return e(x.tag); }).join(', ') + (sin.length > 40 ? '…' : '') + '</span>' : '<b class="ok">Todos los instrumentos del listado están en una requisición.</b>';
    $('#sinRq').className = 'aviso ' + (sin.length ? 'av' : 'bien');
  }
  $('#lista').addEventListener('click', function (ev) { var b = ev.target.closest('.rqc'); if (!b) return; sel = b.dataset.id; pintarLista(); pintarEditor(); });
  $('#tipoNueva').innerHTML = ['Instrumentos', 'Sistemas', 'Materiales'].map(function (g) {
    return '<optgroup label="' + g + '">' + TT.tipos.filter(function (t) { return t.grupo === g; }).map(function (t) { return '<option value="' + t.id + '">' + e(t.titulo) + '</option>'; }).join('') + '</optgroup>';
  }).join('');
  $('#bNueva').addEventListener('click', function () { var r = RQ.nueva(D, $('#tipoNueva').value); sel = r.id; guardar(); pintarLista(); pintarEditor(); });
  $('#bSugerir').addEventListener('click', function () {
    var c = RQ.sugerir(D);
    if (c.length) sel = c[0].id;
    guardar(c.length ? 'Se crearon ' + c.length + ' requisiciones desde el listado de instrumentos' : 'No hay tipos de instrumento nuevos en el listado');
    pintarLista(); pintarEditor();
  });
  $('#bIndice').addEventListener('click', function () { RQ.excelIndice(D); });
  $('#bJson').addEventListener('click', function () {
    var pr = P.activo(), txt = JSON.stringify({ tipo: 're-requisiciones', version: 1, proyecto: pr.numero || '', cfg: D.cfg, lista: D.lista }, null, 1);
    RQ.bajar(new TextEncoder().encode(txt), 'Requisiciones ' + (pr.numero || '') + '.json', 'application/json');
  });
  $('#fJson').addEventListener('change', function (ev) {
    var f = ev.target.files[0]; if (!f) return;
    f.text().then(function (t) {
      var j = JSON.parse(t);
      if (!j || j.tipo !== 're-requisiciones' || !Array.isArray(j.lista)) throw new Error('El archivo no es una exportación de requisiciones');
      var porNum = {}; D.lista.forEach(function (r) { porNum[r.num] = r; });
      j.lista.forEach(function (r) { r = RQ.normalizar(r); if (porNum[r.num]) D.lista[D.lista.indexOf(porNum[r.num])] = r; else D.lista.push(r); });
      if (j.cfg) D.cfg = Object.assign(D.cfg, j.cfg);
      D.lista.sort(function (a, b) { return String(a.num).localeCompare(String(b.num), 'es', { numeric: true }); });
      sel = D.lista.length ? D.lista[0].id : null;
      guardar('Importadas ' + j.lista.length + ' requisiciones'); pintarCfg(); pintarLista(); pintarEditor();
    }).catch(function (x) { estado('No se pudo importar: ' + x.message); });
    ev.target.value = '';
  });

  // ── Configuración general ──
  function pintarCfg() {
    $('#cPref').value = D.cfg.prefijo || '';
    $('#cBases').value = (D.cfg.bases || []).map(function (b) { return b.join(' ; '); }).join('\n');
    $('#cEnvio').value = D.cfg.envio || '';
    $('#cLargo').value = D.cfg.largo; $('#cTroncal').value = D.cfg.largoTroncal; $('#cReserva').value = D.cfg.reserva;
  }
  $('#cfg').addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'cPref') D.cfg.prefijo = t.value;
    if (t.id === 'cBases') D.cfg.bases = t.value.split(/\n/).map(function (l) { var c = l.split(/\s*;\s*/); return c.length > 1 ? [c[0].trim(), c.slice(1).join(' ; ').trim()] : ['', l.trim()]; }).filter(function (b) { return b[0] || b[1]; });
    if (t.id === 'cEnvio') D.cfg.envio = t.value;
    if (t.id === 'cLargo') D.cfg.largo = t.value; if (t.id === 'cTroncal') D.cfg.largoTroncal = t.value; if (t.id === 'cReserva') D.cfg.reserva = t.value;
    guardar(); if (t.id === 'cPref') pintarLista();
  });

  // ── Editor ──
  var EMITIDO = ['Emitido para revisión interna', 'Emitido para comentarios', 'Emitido para cotización', 'Aprobado', 'Aprobado para compra', 'Anulado'];
  function inp(k, v, o) { o = o || {}; return '<input data-k="' + k + '" value="' + e(v) + '"' + (o.ph ? ' placeholder="' + e(o.ph) + '"' : '') + (o.w ? ' style="width:' + o.w + '"' : '') + (o.list ? ' list="' + o.list + '"' : '') + '>'; }
  function ta(k, v, filas) { return '<textarea data-k="' + k + '" rows="' + (filas || 2) + '">' + e(v) + '</textarea>'; }
  function acc(sec, i, n) { return '<td class="acc"><button type="button" data-a="sub" data-s="' + sec + '" data-i="' + i + '" aria-label="Subir"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-a="baj" data-s="' + sec + '" data-i="' + i + '" aria-label="Bajar"' + (i < n - 1 ? '' : ' disabled') + '>↓</button><button type="button" data-a="del" data-s="' + sec + '" data-i="' + i + '" aria-label="Quitar">✕</button></td>'; }
  function pintarEditor() {
    var r = rq(), ed = $('#editor');
    if (!r) { ed.innerHTML = '<div class="blk"><p class="peq">Selecciona o crea una requisición.</p></div>'; return; }
    var t = TT.tipo(r.tipo), h = [];
    h.push('<div class="herr top"><button type="button" class="pri" data-a="word">Word</button><button type="button" data-a="ver">Vista previa · PDF</button><button type="button" data-a="hr">Comentarios (HR)</button>' +
      '<button type="button" data-a="dup">Duplicar</button><button type="button" data-a="borrar">Eliminar</button><span class="peq">' + e(RQ.codigo(r, D)) + '</span></div>');
    h.push('<div class="blk"><h2>Identificación</h2><div class="form">' +
      '<label>N° correlativo' + inp('num', r.num) + '</label>' +
      '<label>Tipo<select data-k="tipo">' + TT.tipos.map(function (x) { return '<option value="' + x.id + '"' + (x.id === r.tipo ? ' selected' : '') + '>' + e(x.titulo) + '</option>'; }).join('') + '</select></label>' +
      '<label style="grid-column:span 2">Título (REQUISICIÓN …)' + inp('titulo', r.titulo) + '</label>' +
      '<label style="grid-column:span 2">Objeto («requisición de …»)' + inp('objeto', r.objeto) + '</label>' +
      '<label>Estado<select data-k="estado"><option value="">Vigente</option><option value="anulada"' + (r.estado === 'anulada' ? ' selected' : '') + '>Anulada</option></select></label>' +
      '<label>Garantía tras PEM [meses]' + inp('gPem', r.gPem) + '</label><label>Garantía componentes [meses]' + inp('gComp', r.gComp) + '</label>' +
      '<label style="grid-column:span 2">Instrucciones de envío (6.1)' + inp('envio', r.envio || '', { ph: D.cfg.envio }) + '</label></div></div>');
    // Revisiones
    h.push('<div class="blk"><h2>Revisiones</h2><div class="tscroll"><table class="t ed"><thead><tr><th>Rev.</th><th>Fecha</th><th>Emitido para</th><th>Por</th><th>Revisó</th><th>Aprobó</th><th>Aprobó cliente</th><th></th></tr></thead><tbody>' +
      r.revs.map(function (v, i) {
        return '<tr><td>' + inp('revs.' + i + '.rev', v.rev, { w: '52px' }) + '</td><td>' + inp('revs.' + i + '.fecha', v.fecha, { w: '104px' }) + '</td><td>' + inp('revs.' + i + '.emitido', v.emitido, { list: 'lEmit' }) + '</td><td>' + inp('revs.' + i + '.por', v.por, { w: '70px' }) +
          '</td><td>' + inp('revs.' + i + '.reviso', v.reviso, { w: '70px' }) + '</td><td>' + inp('revs.' + i + '.aprobo', v.aprobo, { w: '70px' }) + '</td><td>' + inp('revs.' + i + '.cliente', v.cliente, { w: '80px' }) + '</td>' + acc('revs', i, r.revs.length) + '</tr>';
      }).join('') + '</tbody></table></div><datalist id="lEmit">' + EMITIDO.map(function (x) { return '<option value="' + x + '">'; }).join('') + '</datalist>' +
      '<div class="herr"><button type="button" data-a="rev">+ Nueva revisión</button><span class="peq">A → B → … para revisiones internas y de comentarios; 0 → 1 → … una vez aprobada.</span></div></div>');
    // Tabla 4.1
    h.push('<div class="blk"><h2>Tabla 4.1 · Documentos de referencia</h2><p class="peq">Criterios y referencias del proyecto, especificación técnica de la familia <b>' + e(t.et) + '</b>, hojas de datos de los instrumentos incluidos y P&amp;ID de sus lazos.</p>' +
      '<div class="tscroll"><table class="t ed"><thead><tr><th>Código</th><th>Rev.</th><th>Nombre</th><th></th></tr></thead><tbody>' +
      r.refs.map(function (x, i) { return '<tr><td>' + inp('refs.' + i + '.0', x[0], { w: '220px' }) + '</td><td>' + inp('refs.' + i + '.1', x[1], { w: '52px' }) + '</td><td>' + inp('refs.' + i + '.2', x[2]) + '</td>' + acc('refs', i, r.refs.length) + '</tr>'; }).join('') +
      '</tbody></table></div><div class="herr"><button type="button" data-a="addRef">+ Documento</button><button type="button" data-a="autoRef">Regenerar desde el proyecto</button></div></div>');
    // Tabla 5.1
    var N = RQ.numerar(r.items);
    h.push('<div class="blk"><h2>Tabla 5.1 · Suministro incluido</h2><p class="peq">Secciones (1, 2, 3), grupos (1.1) e ítems. Los ítems con TAG salen del listado de instrumentos; «Actualizar equipos» rehace solo la sección 1 y conserva el software y los servicios.</p>' +
      '<div class="tscroll" style="max-height:620px"><table class="t ed it"><thead><tr><th>Ítem</th><th>Tipo</th><th>Cant.</th><th>Un.</th><th>Tag</th><th>Descripción</th><th></th></tr></thead><tbody>' +
      N.map(function (x, i) {
        var hdr = x.k !== 'i';
        return '<tr class="k' + x.k + '"><td class="n">' + e(x.n) + '</td><td><select data-k="items.' + i + '.k"><option value="s"' + (x.k === 's' ? ' selected' : '') + '>Sección</option><option value="g"' + (x.k === 'g' ? ' selected' : '') + '>Grupo</option><option value="i"' + (x.k === 'i' ? ' selected' : '') + '>Ítem</option></select></td>' +
          '<td>' + (hdr ? '' : inp('items.' + i + '.cant', x.cant, { w: '70px' })) + '</td><td>' + (hdr ? '' : inp('items.' + i + '.un', x.un, { w: '56px', list: 'lUn' })) + '</td><td>' + (hdr ? '' : inp('items.' + i + '.tag', x.tag, { w: '130px' })) + '</td>' +
          '<td>' + (hdr ? inp('items.' + i + '.desc', x.desc) : ta('items.' + i + '.desc', x.desc, Math.min(4, String(x.desc || '').split('\n').length + (String(x.desc || '').length > 90 ? 1 : 0)))) + '</td>' + acc('items', i, N.length) + '</tr>';
      }).join('') + '</tbody></table></div><datalist id="lUn"><option value="Un."><option value="c/u"><option value="Gl"><option value="m"><option value="kg"><option value="Juego"></datalist>' +
      '<div class="herr"><button type="button" data-a="addI">+ Ítem</button><button type="button" data-a="addG">+ Grupo</button><button type="button" data-a="addS">+ Sección</button><button type="button" data-a="autoEq">Actualizar equipos desde el listado</button><button type="button" data-a="autoTodo">Rehacer tabla completa</button></div>' +
      '<div class="dos" style="margin-top:10px"><label>Notas bajo la tabla (una por línea)' + ta('notasTxt', (r.notas || []).join('\n'), 3) + '</label><label>5.2 · Trabajo no incluido (uno por línea)' + ta('exclTxt', (r.excluidos || []).join('\n'), 5) + '</label></div></div>');
    // Tabla 6.1
    h.push('<div class="blk"><h2>Tabla 6.1 · Planos y datos del proveedor</h2><p class="peq">D = documento digital, P = documento impreso (1D+3P: un digital y tres impresos).</p><div class="tscroll"><table class="t ed"><thead><tr><th>Planos y datos requeridos</th><th>Cotización</th><th>Revisión</th><th>Aprobación</th><th>Final</th><th></th></tr></thead><tbody>' +
      r.docs.map(function (x, i) { return '<tr><td>' + inp('docs.' + i + '.0', x[0]) + '</td>' + [1, 2, 3, 4].map(function (c) { return '<td>' + inp('docs.' + i + '.' + c, x[c], { w: '74px', list: 'lCod' }) + '</td>'; }).join('') + acc('docs', i, r.docs.length) + '</tr>'; }).join('') +
      '</tbody></table></div><datalist id="lCod"><option value="1D"><option value="1D+1P"><option value="1D+3P"></datalist><div class="herr"><button type="button" data-a="addDoc">+ Documento</button></div></div>');
    // Tabla 7.1
    h.push('<div class="blk"><h2>Tabla 7.1 · Planilla de inspección de calidad</h2><div class="tscroll"><table class="t ed qa"><thead><tr><th>N°</th><th>Descripción</th>' + TT.QA_COLS.map(function (q) { return '<th class="c">' + q + '</th>'; }).join('') + '<th>Nota</th><th></th></tr></thead><tbody>' +
      r.qa.map(function (x, i) {
        if (x[2] === null) return '<tr class="ks"><td>' + inp('qa.' + i + '.0', x[0], { w: '46px' }) + '</td><td colspan="' + (TT.QA_COLS.length + 2) + '">' + inp('qa.' + i + '.1', x[1]) + '</td>' + acc('qa', i, r.qa.length) + '</tr>';
        var m = String(x[2] || '').split(/\s+/);
        return '<tr><td>' + inp('qa.' + i + '.0', x[0], { w: '46px' }) + '</td><td>' + inp('qa.' + i + '.1', x[1]) + '</td>' + TT.QA_COLS.map(function (q) { return '<td class="c"><input type="checkbox" data-qa="' + i + '" data-q="' + q + '"' + (m.indexOf(q) >= 0 ? ' checked' : '') + ' aria-label="' + q + '"></td>'; }).join('') +
          '<td>' + inp('qa.' + i + '.3', x[3] || '', { w: '90px' }) + '</td>' + acc('qa', i, r.qa.length) + '</tr>';
      }).join('') + '</tbody></table></div><p class="peq">CP control de calidad del proveedor · DP documentos de soporte del proveedor · I inspección · R revisión · P presencia · C inspección condicional · A auditoría · O observación.</p>' +
      '<div class="herr"><button type="button" data-a="addQa">+ Fila</button><button type="button" data-a="addQaS">+ Sección</button></div></div>');
    ed.innerHTML = h.join('');
  }
  var ed = $('#editor');
  ed.addEventListener('input', function (ev) {
    var t = ev.target, r = rq(); if (!r) return;
    if (t.dataset.qa != null) {
      var row = r.qa[+t.dataset.qa], m = String(row[2] || '').split(/\s+/).filter(Boolean), q = t.dataset.q;
      m = m.filter(function (x) { return x !== q; }); if (t.checked) m.push(q);
      row[2] = TT.QA_COLS.filter(function (x) { return m.indexOf(x) >= 0; }).join(' ');
      guardar(); return;
    }
    var k = t.dataset.k; if (!k) return;
    if (k === 'notasTxt') r.notas = t.value.split('\n');
    else if (k === 'exclTxt') r.excluidos = t.value.split('\n');
    else setPath(r, k, t.value);
    guardar();
    if (/^(num|titulo|estado|revs\.\d+\.rev)$/.test(k)) pintarLista();
  });
  ed.addEventListener('change', function (ev) {
    var t = ev.target, r = rq(); if (!r) return;
    if (t.dataset.k === 'tipo') { var x = TT.tipo(t.value); r.tipo = x.id; r.titulo = x.titulo; r.objeto = x.objeto; guardar(); pintarLista(); pintarEditor(); }
    else if (/^items\.\d+\.k$/.test(t.dataset.k || '')) pintarEditor();
  });
  ed.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-a]'); if (!b) return;
    var r = rq(), a = b.dataset.a, pr = P.activo(); if (!r) return;
    if (a === 'sub' || a === 'baj' || a === 'del') {
      var L = r[b.dataset.s], i = +b.dataset.i;
      if (a === 'del') L.splice(i, 1);
      else { var j = a === 'sub' ? i - 1 : i + 1, x = L[i]; L[i] = L[j]; L[j] = x; }
    }
    else if (a === 'rev') r.revs.push({ rev: siguienteRev(RQ.revActual(r).rev), fecha: RQ.hoy(), emitido: /^[0-9]/.test(siguienteRev(RQ.revActual(r).rev)) ? 'Aprobado' : 'Emitido para comentarios', por: pr.por || '', reviso: pr.reviso || '', aprobo: pr.aprobo || '', cliente: '' });
    else if (a === 'addRef') r.refs.push(['', pr.rev || '', '']);
    else if (a === 'autoRef') r.refs = RQ.refsAuto(r, pr);
    else if (a === 'addI') r.items.push({ k: 'i', cant: 1, un: 'Un.', desc: '', tag: '' });
    else if (a === 'addG') r.items.push({ k: 'g', desc: 'Nuevo grupo' });
    else if (a === 'addS') r.items.push({ k: 's', desc: 'NUEVA SECCIÓN' });
    else if (a === 'autoEq') RQ.actualizarEquipos(r, pr);
    else if (a === 'autoTodo') { if (!confirmar(b, '¿Rehacer?')) return; r.items = RQ.itemsAuto(r, pr); }
    else if (a === 'addDoc') r.docs.push(['', '', '1D', '1D', '1D+3P']);
    else if (a === 'addQa') r.qa.push(['', '', '', '']);
    else if (a === 'addQaS') r.qa.push(['', 'NUEVA SECCIÓN', null]);
    else if (a === 'word') { RQ.descargarWord(r); return; }
    else if (a === 'ver') { tab('vista'); history.replaceState(null, '', '#vista'); return; }
    else if (a === 'hr') { tab('hr'); history.replaceState(null, '', '#hr'); return; }
    else if (a === 'dup') { var c = JSON.parse(JSON.stringify(r)); c.id = RQ.uid(); c.num = ('0000' + (Math.max.apply(null, D.lista.map(function (x) { return parseInt(x.num, 10) || 0; })) + 1)).slice(-4); c.revs = [{ rev: 'A', fecha: RQ.hoy(), emitido: 'Emitido para revisión interna', por: pr.por || '', reviso: '', aprobo: '', cliente: '' }]; c.hr = []; D.lista.push(c); sel = c.id; }
    else if (a === 'borrar') { if (!confirmar(b, '¿Eliminar?')) return; D.lista.splice(D.lista.indexOf(r), 1); sel = D.lista.length ? D.lista[0].id : null; }
    guardar(); pintarLista(); pintarEditor();
  });
  // Confirmación en el mismo botón (sin diálogos del navegador)
  function confirmar(b, txt) {
    if (b.dataset.conf) return true;
    var t0 = b.textContent; b.dataset.conf = '1'; b.textContent = txt + ' Toca otra vez';
    setTimeout(function () { delete b.dataset.conf; b.textContent = t0; }, 3000);
    return false;
  }
  function siguienteRev(v) {
    v = String(v || '').trim();
    if (/^\d+$/.test(v)) return String(+v + 1);
    if (/^[A-Y]$/i.test(v)) return String.fromCharCode(v.toUpperCase().charCodeAt(0) + 1);
    return v ? v + '1' : 'A';
  }

  // ── Vista previa ──
  function vista() {
    var r = rq();
    $('#vSel').innerHTML = D.lista.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? ' selected' : '') + '>' + e(RQ.codigo(x, D) + ' · ' + x.titulo) + '</option>'; }).join('');
    $('#doc').innerHTML = r ? RQ.html(r) : '<p class="peq">Sin requisiciones.</p>';
  }
  $('#vSel').addEventListener('change', function (ev) { sel = ev.target.value; pintarLista(); pintarEditor(); vista(); });
  $('#vWord').addEventListener('click', function () { var r = rq(); if (r) RQ.descargarWord(r); });
  $('#vPdf').addEventListener('click', function () { window.print(); });

  // ── Comentarios (HR) ──
  function pintarHR() {
    var r = rq();
    $('#hSel').innerHTML = D.lista.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? ' selected' : '') + '>' + e(RQ.codigo(x, D) + ' · ' + x.titulo) + '</option>'; }).join('');
    if (!r) { $('#hTabla tbody').innerHTML = ''; return; }
    r.hr = r.hr || [];
    $('#hRevisor').value = r.revisorCliente || ''; $('#hRevC').value = r.revCliente || ''; $('#hPag').value = r.paginas || '';
    $('#hTabla tbody').innerHTML = r.hr.map(function (c, i) {
      return '<tr><td class="n">' + (i + 1) + '</td><td>' + inp('hr.' + i + '.pag', c.pag, { w: '60px' }) + '</td><td>' + ta('hr.' + i + '.com', c.com) + '</td><td>' + inp('hr.' + i + '.ref', c.ref, { w: '100px' }) + '</td><td>' + ta('hr.' + i + '.resp', c.resp) + '</td>' +
        '<td><select data-k="hr.' + i + '.est"><option value="">Pendiente</option><option value="inc"' + (c.est === 'inc' ? ' selected' : '') + '>Incorporado</option><option value="ac"' + (c.est === 'ac' ? ' selected' : '') + '>Aclarado</option><option value="no"' + (c.est === 'no' ? ' selected' : '') + '>No procede</option></select></td>' + acc('hr', i, r.hr.length) + '</tr>';
    }).join('');
    var pend = r.hr.filter(function (c) { return !c.est; }).length;
    $('#hRes').textContent = r.hr.length ? r.hr.length + ' comentarios · ' + pend + ' pendientes' : 'Sin comentarios registrados.';
  }
  $('#hSel').addEventListener('change', function (ev) { sel = ev.target.value; pintarLista(); pintarEditor(); pintarHR(); });
  $('#hr').addEventListener('input', function (ev) {
    var t = ev.target, r = rq(); if (!r) return;
    if (t.id === 'hRevisor') r.revisorCliente = t.value; else if (t.id === 'hRevC') r.revCliente = t.value; else if (t.id === 'hPag') r.paginas = t.value;
    else if (t.dataset.k) setPath(r, t.dataset.k, t.value);
    guardar();
  });
  $('#hr').addEventListener('change', function (ev) { if (/\.est$/.test(ev.target.dataset.k || '')) pintarHR(); });
  $('#hr').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'), r = rq(); if (!b || !r) return;
    if (b.id === 'hAdd') r.hr.push({ pag: '', com: '', ref: '', resp: '' });
    else if (b.id === 'hExcel') { RQ.excelHR(r); return; }
    else if (b.id === 'hPegar') {
      var f = $('#hTsv').value.split(/\r?\n/).filter(function (l) { return l.trim(); });
      f.forEach(function (l) { var c = l.split('\t'); if (c.length === 1) c = ['', l]; if (/^\d+$/.test(c[0]) && c.length >= 4) c = c.slice(1); r.hr.push({ pag: c[0] || '', com: c[1] || '', ref: c[2] || '', resp: c[3] || '' }); });
      $('#hTsv').value = '';
    }
    else if (b.dataset.a === 'sub' || b.dataset.a === 'baj' || b.dataset.a === 'del') {
      var L = r.hr, i = +b.dataset.i;
      if (b.dataset.a === 'del') L.splice(i, 1); else { var j = b.dataset.a === 'sub' ? i - 1 : i + 1, x = L[i]; L[i] = L[j]; L[j] = x; }
    } else return;
    guardar(); pintarHR();
  });

  pintarCfg(); pintarLista(); pintarEditor();
  tab((location.hash || '#lista').slice(1));
})();
