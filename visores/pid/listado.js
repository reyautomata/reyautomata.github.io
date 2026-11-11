/* Análisis de P&ID · Documento «Listado de instrumentos» · ReyEngi
 * Arma el listado de instrumentos (formato de la Suite: portada, control de cambios, introducción, alcance,
 * referencias y Anexo A) con los instrumentos revisados del P&ID. La vista previa es editable: cada celda del
 * Anexo A, los textos y los datos de la portada se corrigen escribiendo encima. Exporta a Excel, Word y PDF.
 * Lo escrito a mano queda guardado aparte (S.doc) y no se pierde al volver a revisar el P&ID.
 */
(function () {
  'use strict';
  var PID = window.__PID, P = window.REProyectos, ISA = window.ISA;
  if (!PID || !P) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var up = function (s) { return String(s == null ? '' : s).toUpperCase(); };
  var uid = function () { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var LOGO = window.PID_LOGO || '../../img/logo-reyengi.png', AZUL = '022A55', CLARO = 'DCE3EB', NA = 'N.A.';
  function hoyCL() { return P.hoy ? P.hoy() : new Date().toLocaleDateString('es-CL'); }

  // Columnas del Anexo A: [clave, título, grupo, ancho Excel, ancho mm Word] (mismo formato que el listado de la Suite)
  var COLS = [
    ['n', 'ÍTEM', '', 6, 8], ['tagInst', 'TAG', '', 18, 24], ['desc', 'DESCRIPCIÓN', '', 30, 40], ['servicio', 'SERVICIO', '', 38, 50], ['linea', 'LÍNEA / EQUIPO', '', 20, 26],
    ['pid', 'P&ID', 'PLANOS', 20, 26], ['plano', 'DIAGRAMA DE LAZO O INTERCONEXIONADO', 'PLANOS', 20, 26], ['unilineal', 'DIAGRAMA UNILINEAL', 'PLANOS', 16, 20],
    ['et', 'ESPECIFICACIÓN TÉCNICA', 'DOCUMENTOS', 18, 24], ['das', 'HOJA DE DATOS', 'DOCUMENTOS', 18, 24], ['obs', 'OBSERVACIONES', '', 28, 36], ['rev', 'REV.', '', 6, 8]
  ];
  var IZQ = ['desc', 'servicio', 'linea', 'obs'], NW = ['tagInst', 'pid', 'plano', 'et', 'das'];
  var NOTAS = ['N.A.: No Aplica.'];
  var TITULO = 'LISTADO DE INSTRUMENTOS';
  var ALCANCE = 'Este documento corresponde al listado de instrumentos del proyecto, levantado desde los P&ID indicados en las referencias y validado por el revisor.\n\nLa cantidad de los instrumentos y sus especificaciones particulares se encuentran en las hojas de datos respectivas.\n\nTodos los instrumentos deberán ser de diseño probado, de tipo estándar y fabricación reciente.';
  // Datos del proyecto que se editan desde el documento (quedan en el proyecto activo)
  var CAMPOS_PROY = [['proyecto', 'Título del proyecto'], ['cliente', 'Cliente / mandante'], ['contratista', 'Empresa de ingeniería'], ['numero', 'N° de proyecto'], ['idCliente', 'ID / contrato del cliente'], ['rev', 'Revisión vigente'],
    ['por', 'Elaboró'], ['porFecha', 'Fecha'], ['reviso', 'Revisó'], ['revisoFecha', 'Fecha'], ['aprobo', 'Aprobó'], ['aproboFecha', 'Fecha'], ['revisoCliente', 'Revisó por el cliente'], ['aproboCliente', 'Aprobó por el cliente']];

  // ── Estado del documento (dentro del análisis del proyecto) ──
  function S() { return PID.estado(); }
  function doc() { var s = S(); s.doc = s.doc || {}; var d = s.doc; d.c = d.c || {}; d.f = d.f || {}; d.extra = d.extra || []; d.fuera = d.fuera || {}; return d; }
  function guardar() { PID.guardar(); }
  function pr() { return P.activo() || {}; }
  function ponerProy(k, v) { var p = pr(), id = p.id; delete p.id; p[k] = v; P.guardar(id, p); }

  // ── Filas del Anexo A ──
  function incluir(c) { var m = doc().incluir || 'validados'; return c.estado === 'validado' || (m === 'revision' && c.estado === 'pendiente'); }
  function filas() {
    var s = S(), d = doc(), nomH = {}, porTag = {}, out = [];
    s.hojas.forEach(function (h) { nomH[h.id] = h.plano || h.nombre || ''; });
    s.cand.forEach(function (c) {
      if (!incluir(c) || !c.letras || !c.num || d.fuera[c.id]) return;
      var tag = up(PID.tagDe(c)), pid = nomH[c.hoja] || '';
      if (porTag[tag]) { var r0 = porTag[tag]; if (pid && r0.pids.indexOf(pid) < 0) r0.pids.push(pid); if (!r0.c.servicio && c.servicio) r0.c = c; return; }
      var r = { key: c.id, c: c, tag: tag, pids: pid ? [pid] : [] }; porTag[tag] = r; out.push(r);
    });
    out.forEach(function (r) {
      var c = r.c;
      r.auto = { tagInst: r.tag, desc: descISA(r.tag), servicio: up(c.servicio), linea: up(c.equipo) || NA, pid: r.pids.join(' / ') || NA, plano: NA, unilineal: NA, et: NA, das: NA, obs: up(c.nota), rev: pr().rev || '' };
      r.lazo = ISA ? ISA.lazoDe(r.tag) : r.tag;
    });
    out.sort(function (a, b) { return a.lazo.localeCompare(b.lazo, 'es', { numeric: true }) || a.tag.localeCompare(b.tag, 'es', { numeric: true }); });
    d.extra.forEach(function (x) { out.push({ key: x.id, extra: true, tag: x.tagInst || '', auto: { tagInst: '', desc: '', servicio: '', linea: NA, pid: NA, plano: NA, unilineal: NA, et: NA, das: NA, obs: '', rev: pr().rev || '' } }); });
    return out;
  }
  // Descripción ISA 5.1; las válvulas de control (FCV, LCV, PDCV…) se nombran como se escriben en los listados
  function descISA(tag) {
    if (!ISA) return '';
    var a = ISA.analizar(tag), l = a.letras || '';
    if (/^[A-Z]D?CV$/.test(l)) return up('Válvula de control de ' + (ISA.VAR[l[0]] || '') + (l[1] === 'D' ? ' diferencial' : ''));
    return up(ISA.describir(tag) || '');
  }
  function val(r, k) { var o = doc().f[r.key], v = o && o[k]; return v != null ? v : r.auto[k]; }
  function grupos() {
    var R = filas(), G = [], d = doc();
    function fila(r, i) { var f = { n: i + 1, key: r.key }; COLS.forEach(function (c) { if (c[0] !== 'n') f[c[0]] = val(r, c[0]); }); return f; }
    if (!d.agrupar) return [{ titulo: '', filas: R.map(fila) }];
    var por = {}, orden = [], n = 0;
    R.forEach(function (r) { var k = r.extra ? 'OTROS INSTRUMENTOS' : 'P&ID ' + (r.pids[0] || 'SIN PLANO'); if (!por[k]) { por[k] = []; orden.push(k); } por[k].push(r); });
    orden.sort(function (a, b) { return (a === 'OTROS INSTRUMENTOS') - (b === 'OTROS INSTRUMENTOS') || a.localeCompare(b, 'es', { numeric: true }); });
    orden.forEach(function (k) { G.push({ titulo: k, filas: por[k].map(function (r) { return fila(r, n++); }) }); });
    return G;
  }
  function cabecera() {
    var f1 = [], f2 = [], i = 0;
    while (i < COLS.length) {
      var g = COLS[i][2];
      if (!g) { f1.push({ t: COLS[i][1], cs: 1, rs: 2, i: i }); f2.push({ t: '', cont: true, i: i }); i++; continue; }
      var j = i; while (j < COLS.length && COLS[j][2] === g) j++;
      f1.push({ t: g, cs: j - i, rs: 1, i: i });
      for (var k = i; k < j; k++) f2.push({ t: COLS[k][1], cs: 1, i: k });
      i = j;
    }
    return [f1, f2];
  }

  // ── Datos del documento ──
  function lineas(t, n) { return String(t || '').split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { var c = l.split(/\s*;\s*/); while (c.length < n) c.push(''); return c.slice(0, n); }); }
  function defecto(k) {
    var p = pr();
    switch (k) {
      case 'codigo': return '';
      case 'fecha': return p.porFecha || hoyCL();
      case 'tipoDoc': return 'LISTA DE EQUIPOS';
      case 'titulo': return TITULO;
      case 'id': return p.idCliente || '';
      case 'anexoA': return TITULO;
      case 'intro': return (p.cliente || 'El cliente') + ' ha encargado a ' + (p.contratista || 'ReyEngi') + ' el desarrollo del proyecto "' + (p.proyecto || '') + '".\n\nEl presente documento corresponde al listado de instrumentos del proyecto, obtenido del análisis de los P&ID.';
      case 'alcance': return ALCANCE;
      case 'revs': return (p.rev || 'A') + ' ; EMITIDO PARA REVISIÓN ; ' + (p.porFecha || hoyCL());
      case 'rolPor': return 'Ingeniero de Proyecto';
      case 'rolReviso': return 'Jefe de Disciplina';
      case 'rolAprobo': return 'Jefe de Proyecto';
      case 'rolCliente': return 'Jefe de Proyecto';
    }
    return '';
  }
  function campo(k) { var v = doc().c[k]; return v != null && v !== '' ? v : defecto(k); }
  function referencias() {
    var r = [], vistos = {}, s = S();
    function add(c, v, n) { if (!c || vistos[c]) return; vistos[c] = 1; r.push([c, v, n]); }
    s.hojas.forEach(function (h) { if (h.plano) add(h.plano, '', 'P&ID' + (h.nombre && h.nombre !== h.plano ? ' · ' + h.nombre.replace(/\.[a-z0-9]+$/i, '') : '')); });
    if (s.listado && s.listado.archivo) add(s.listado.archivo.replace(/\.[a-z0-9]+$/i, ''), '', 'Listado de instrumentos existente (cruce)');
    lineas(doc().c.refs, 3).forEach(function (c) { add(c[0], c[1], c[2]); });
    return r;
  }
  function datosDoc() {
    var p = pr();
    return {
      codigo: campo('codigo'), titulo: campo('titulo'), tipoDoc: campo('tipoDoc'), fecha: campo('fecha'), id: campo('id'),
      rev: p.rev || '', proyecto: p.proyecto || '', cliente: p.cliente || '', empresa: p.contratista || 'ReyEngi', numero: p.numero || '',
      anexoA: campo('anexoA'), intro: campo('intro'), alcance: campo('alcance'),
      control: [['Preparado por:', 'por', campo('rolPor'), 'porFecha'], ['Revisado por:', 'reviso', campo('rolReviso'), 'revisoFecha'], ['Aprobado por:', 'aprobo', campo('rolAprobo'), 'aproboFecha'],
        ['Revisado ' + (p.cliente || 'cliente') + ':', 'revisoCliente', campo('rolCliente'), ''], ['Aprobado ' + (p.cliente || 'cliente') + ':', 'aproboCliente', campo('rolCliente'), '']].map(function (r) { return [r[0], p[r[1]] || '', r[2], r[3] ? p[r[3]] || '' : '', r[1], r[3]]; }),
      revs: lineas(campo('revs'), 3), cambios: lineas(doc().c.cambios, 5), refs: referencias()
    };
  }

  // ── Vista previa (editable) y versión de impresión ──
  // ed = true: celdas con contenteditable y data-e (c: campo del documento, p: dato del proyecto, t: texto largo, f: celda del Anexo A)
  var ED;
  function ce(clave, v, cls) { v = v == null ? '' : v; return ED ? '<span class="ce' + (cls ? ' ' + cls : '') + '" contenteditable="plaintext-only" spellcheck="false" data-e="' + esc(clave) + '">' + esc(v) + '</span>' : esc(v); }
  function cabPagina() { return '<div class="cab"><img class="logo" src="' + LOGO + '" alt="ReyEngi"><span>ReyEngi · Automatización y Control Industrial</span></div>'; }
  function tabla(f, cab) { return '<table>' + (cab ? '<tr>' + cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' : '') + f.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + (c && c.h != null ? c.h : esc(c == null ? '' : c).replace(/\n/g, '<br>')) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; }
  function parrafos(k, t) {
    if (ED) return '<div class="ce bloque" contenteditable="plaintext-only" spellcheck="true" data-e="t:' + k + '">' + esc(t) + '</div>';
    return String(t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function htmlDoc(editable) {
    ED = !!editable;
    var d = datosDoc(), G = grupos(), pie = '<p class="piepg">' + esc(d.codigo ? d.codigo + (d.rev !== '' ? ' R' + d.rev : '') : '') + '</p>', h = [];
    h.push('<div class="pg v">' + cabPagina() + '<div class="tit">' + ce('p:contratista', up(d.empresa)) + '</div>' +
      '<table class="datos"><tr><td>TIPO DOCUMENTO</td><td>: ' + ce('c:tipoDoc', d.tipoDoc) + ' &nbsp;&nbsp; ' + ce('c:titulo', d.titulo) + '</td></tr><tr><td>TÍTULO PROYECTO</td><td>: ' + ce('p:proyecto', d.proyecto) + '</td></tr><tr><td>CLIENTE</td><td>: ' + ce('p:cliente', d.cliente) + '</td></tr><tr><td>ID</td><td>: ' + ce('c:id', d.id) + '</td></tr><tr><td>CÓDIGO</td><td>: <b>' + ce('c:codigo', d.codigo, d.codigo ? '' : 'vacio') + '</b> &nbsp;&nbsp; <b>FECHA DOCUMENTO:</b> ' + ce('c:fecha', d.fecha) + '</td></tr></table>' +
      '<div style="height:24mm"></div>' + tabla(d.control.map(function (r) { return [r[0], { h: ce('p:' + r[4], r[1]) }, r[2], '', { h: r[5] ? ce('p:' + r[5], r[3]) : '' }]; }), ['Control', 'Nombre', 'Rol', 'Firma', 'Fecha']) + '<br>' +
      tabla(d.revs.length ? d.revs : [['', '', '']], ['Revisión', 'Descripción', 'Fecha']) + '<br>' +
      tabla(d.cambios.length ? d.cambios : [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']], ['Revisión', 'Fecha', 'Página', 'Descripción del cambio', 'Responsable']) + pie + '</div>');
    h.push('<div class="pg v">' + cabPagina() + '<div class="tit" style="font-size:12pt">' + esc(up(d.proyecto)) + '<br>' + esc(d.titulo) + '<br>' + esc(d.codigo) + '</div>' +
      '<h3>Tabla de contenido</h3><p>1 &nbsp; INTRODUCCIÓN<br>2 &nbsp; ALCANCE<br>3 &nbsp; ANTECEDENTES Y REFERENCIAS<br>ANEXO A: ' + esc(d.anexoA) + '</p>' +
      '<h2>1 &nbsp; INTRODUCCIÓN</h2>' + parrafos('intro', d.intro) + '<h2>2 &nbsp; ALCANCE</h2>' + parrafos('alcance', d.alcance) +
      '<h2>3 &nbsp; ANTECEDENTES Y REFERENCIAS</h2><p>Son complementarios a este listado los documentos y planos indicados a continuación.</p>' + tabla(d.refs.length ? d.refs : [['—', '', '']], ['CÓDIGO DOCUMENTO', 'REV', 'NOMBRE DOCUMENTO']) + pie + '</div>');
    h.push('<div class="pg v"><div class="anexo"><b>Anexo A</b>' + ce('c:anexoA', d.anexoA) + '</div></div>');
    var cab = cabecera(), ov = doc().f;
    var thead = '<thead><tr>' + (ED ? '<th rowspan="2" class="gut"></th>' : '') + cab[0].map(function (c) { return '<th' + (c.cs > 1 ? ' colspan="' + c.cs + '"' : '') + (c.rs > 1 ? ' rowspan="2"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr><tr>' + cab[1].filter(function (c) { return !c.cont; }).map(function (c) { return '<th>' + esc(c.t) + '</th>'; }).join('') + '</tr></thead>';
    var cuerpo = G.map(function (g) {
      return (g.titulo ? '<tr class="grp">' + (ED ? '<td class="gut"></td>' : '') + '<td colspan="' + COLS.length + '">' + esc(g.titulo) + '</td></tr>' : '') + g.filas.map(function (f) {
        return '<tr data-k="' + esc(f.key) + '">' + (ED ? '<td class="gut"><button type="button" class="qf" data-q="' + esc(f.key) + '" title="Quitar esta fila del listado" aria-label="Quitar fila ' + esc(f.tagInst) + '">✕</button></td>' : '') + COLS.map(function (c) {
          var v = f[c[0]], cls = (IZQ.indexOf(c[0]) >= 0 ? 'izq' : '') + (ov[f.key] && ov[f.key][c[0]] != null ? ' ed' : '');
          return '<td' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + (NW.indexOf(c[0]) >= 0 ? ' style="white-space:nowrap"' : '') + '>' + (c[0] === 'n' ? esc(v) : ce('f:' + f.key + ':' + c[0], v)) + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }).join('');
    h.push('<div class="pg h">' + encabezadoAnexo(d) + '<table class="io2">' + thead + '<tbody>' + (cuerpo || '<tr><td colspan="' + (COLS.length + (ED ? 1 : 0)) + '" style="padding:4mm">Sin instrumentos: valida instrumentos en el paso 2 o agrega filas.</td></tr>') + '</tbody></table>' +
      '<p style="font-size:8pt;margin-top:3mm"><b>NOTAS:</b><br>' + NOTAS.map(function (n, i) { return (i + 1) + '.- ' + esc(n); }).join('<br>') + '</p></div>');
    ED = false;
    return h.join('');
  }
  function encabezadoAnexo(d) {
    var p = pr();
    return '<table class="encio" style="margin-bottom:3mm"><tr><td rowspan="5" style="width:48mm;border:0"><img class="logo" src="' + LOGO + '" alt="ReyEngi"></td>' +
      '<td class="lb" style="width:28mm;text-align:left">PROYECTO</td><td colspan="3">' + esc(d.proyecto) + '</td><td rowspan="5" style="text-align:center;font-weight:700;color:#022A55;font-size:10pt">' + esc(d.titulo) + '<br><span style="font-size:8pt">ANEXO A · ' + esc(d.anexoA) + '</span></td>' +
      '<td class="lb">REG</td><td class="lb">ING</td><td class="lb">FECHA</td></tr>' +
      '<tr><td class="lb" style="text-align:left">CLIENTE</td><td colspan="3">' + esc(d.cliente) + '</td><td class="cl">POR</td><td>' + esc(p.por || '') + '</td><td>' + esc(p.porFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">INGENIERÍA</td><td colspan="3">' + esc(d.empresa) + '</td><td class="cl">REVISA</td><td>' + esc(p.reviso || '') + '</td><td>' + esc(p.revisoFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">DOC. N°</td><td>' + esc(d.codigo) + '</td><td class="lb">REV.</td><td>' + esc(d.rev) + '</td><td class="cl">APRUEBA</td><td>' + esc(p.aprobo || '') + '</td><td>' + esc(p.aproboFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">N° PROYECTO</td><td colspan="3">' + esc(d.numero) + '</td><td colspan="3"></td></tr></table>';
  }

  // ── Archivos ──
  function nombre(ext, anexo) { var d = datosDoc(); return ((d.codigo || 'Listado de instrumentos') + (d.rev !== '' ? ' R' + d.rev : '') + (anexo ? ' ANEXO A' : '')).replace(/[\\/:*?"<>|]+/g, '-') + ext; }
  function descargar(nom, datos, tipo) {
    if (window.PID_DESCARGAR) return window.PID_DESCARGAR(nom, datos, tipo);
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([datos], { type: tipo })); a.download = nom; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function cargarLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { if (!b) return null; var dv = new DataView(b); return { bytes: new Uint8Array(b), w: dv.getUint32(16), h: dv.getUint32(20) }; }).catch(function () { return null; });
  }
  function lineasDe(f) { return COLS.reduce(function (mx, c) { return Math.max(mx, String(f[c[0]] == null ? '' : f[c[0]]).split('\n').length); }, 1); }
  function excel() {
    var X = window.XLSX_RE; if (!X) return Promise.resolve();
    return cargarLogo().then(function (logo) {
      var lb = X.libro(), d = datosDoc(), p = pr(), G = grupos(), N = COLS.length;
      lb.titulo = d.titulo; lb.autor = d.empresa;
      var h = lb.hoja('ANEXO A', { orientacion: 'landscape', pie: d.codigo + (d.rev !== '' ? ' R' + d.rev : '') });
      h.cols(COLS.map(function (c) { return c[3]; }));
      var L = { b: true, fill: AZUL, color: 'FFFFFF', sz: 8 }, V = { sz: 8 }, C = { b: true, fill: CLARO, color: AZUL, sz: 8, h: 'center' };
      h.combinar(0, 0, 1, 2, '', { borde: 'none' }); h.alto(0, 22); h.alto(1, 22);
      h.combinar(0, 3, 1, N - 1, 'ReyEngi · Automatización y Control Industrial', { borde: 'none', i: true, sz: 9, color: '5A6573', h: 'right' });
      if (logo) h.imagen(logo.bytes, 0, 0, 170, 48, 4, 4);
      // Datos del proyecto (columnas 0-3), título (4-7) y firmas (8-11)
      [['PROYECTO', d.proyecto], ['CLIENTE', d.cliente], ['INGENIERÍA', d.empresa], ['DOC. N°', d.codigo], ['N° PROYECTO', d.numero]].forEach(function (r, i) {
        h.combinar(2 + i, 0, 2 + i, 1, r[0], L);
        if (i === 3) { h.celda(5, 2, r[1], V); h.celda(5, 3, 'REV. ' + d.rev, Object.assign({ h: 'center' }, V)); }
        else h.combinar(2 + i, 2, 2 + i, 3, r[1], V);
      });
      h.combinar(2, 4, 6, 7, d.titulo + '\nANEXO A · ' + d.anexoA, { b: true, sz: 12, color: AZUL, h: 'center', wrap: true });
      h.celda(2, 8, 'REG', L); h.celda(2, 9, 'ING', L); h.combinar(2, 10, 2, 11, 'FECHA', L);
      [['POR', p.por, p.porFecha], ['REVISA', p.reviso, p.revisoFecha], ['APRUEBA', p.aprobo, p.aproboFecha], ['', '', '']].forEach(function (r, i) {
        h.celda(3 + i, 8, r[0], C); h.celda(3 + i, 9, r[1] || '', Object.assign({ h: 'center' }, V)); h.combinar(3 + i, 10, 3 + i, 11, r[2] || '', Object.assign({ h: 'center' }, V));
      });
      var r0 = 8, cab = cabecera();
      cab[0].forEach(function (c) { if (c.rs > 1) h.combinar(r0, c.i, r0 + 1, c.i, c.t, Object.assign({ h: 'center', wrap: true }, L)); else h.combinar(r0, c.i, r0, c.i + c.cs - 1, c.t, Object.assign({ h: 'center' }, L)); });
      cab[1].forEach(function (c) { if (!c.cont) h.celda(r0 + 1, c.i, c.t, Object.assign({ h: 'center', wrap: true }, L)); });
      h.alto(r0, 24); h.alto(r0 + 1, 34); h.filasTitulo(r0, r0 + 1);
      var r = r0 + 2;
      G.forEach(function (g) {
        if (g.titulo) { h.combinar(r, 0, r, N - 1, g.titulo, { b: true, fill: CLARO, color: AZUL, sz: 8 }); r++; }
        g.filas.forEach(function (f) {
          COLS.forEach(function (c, ci) { h.celda(r, ci, f[c[0]] == null ? '' : f[c[0]], { sz: 8, h: IZQ.indexOf(c[0]) >= 0 ? 'left' : 'center', v: 'center', wrap: true }); });
          h.alto(r, Math.max(24, 4 + 11 * lineasDe(f))); r++;
        });
      });
      r++; h.combinar(r, 0, r + NOTAS.length, N - 1, 'NOTAS:\n' + NOTAS.map(function (n, i) { return (i + 1) + '.- ' + n; }).join('\n'), { sz: 8, borde: 'none', v: 'top' });
      descargar(nombre('.xlsx', true), X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  }
  function word() {
    if (!window.DOCX) return Promise.resolve();
    return cargarLogo().then(function (logo) {
      var d = datosDoc(), G = grupos(), B = [];
      B.push(logo ? { p: '', img: 70, c: true } : { p: 'ReyEngi', b: true, c: true, sz: 32, color: AZUL });
      B.push({ p: up(d.empresa), b: true, c: true, sz: 28, color: AZUL });
      B.push({ tabla: { anchos: [45, 125], filas: [['TIPO DOCUMENTO', d.tipoDoc + '   ' + d.titulo], ['TÍTULO PROYECTO', d.proyecto], ['CLIENTE', d.cliente], ['ID', d.id], ['CÓDIGO', d.codigo + '      FECHA DOCUMENTO: ' + d.fecha]].map(function (r) { return [{ t: r[0], b: true, fill: CLARO, color: AZUL }, r[1]]; }) } });
      B.push({ p: '' });
      B.push({ tabla: { cab: 1, anchos: [42, 30, 42, 30, 26], filas: [['Control', 'Nombre', 'Rol', 'Firma', 'Fecha']].concat(d.control.map(function (r) { return [{ t: r[0], b: true }, { t: r[1] || '', c: true }, r[2] || '', '', { t: r[3] || '', c: true }]; })) } });
      B.push({ tabla: { cab: 1, anchos: [25, 110, 35], filas: [['Revisión', 'Descripción', 'Fecha']].concat((d.revs.length ? d.revs : [['', '', '']]).map(function (r) { return [{ t: r[0], c: true }, r[1], { t: r[2], c: true }]; })) } });
      B.push({ p: 'CONTROL DE CAMBIOS', b: true, color: AZUL });
      B.push({ tabla: { cab: 1, anchos: [22, 25, 18, 75, 30], filas: [['Revisión', 'Fecha', 'Página', 'Descripción del cambio', 'Responsable']].concat(d.cambios.length ? d.cambios : [['', '', '', '', ''], ['', '', '', '', '']]) } });
      B.push({ salto: true }, { indice: true }, { p: 'Lista de anexos', b: true, color: AZUL }, { p: 'ANEXO A: ' + d.anexoA }, { salto: true });
      B.push({ h: 1, num: '1', t: 'Introducción' }); String(d.intro).split(/\n\s*\n/).forEach(function (p) { B.push({ p: p }); });
      B.push({ h: 1, num: '2', t: 'Alcance' }); String(d.alcance).split(/\n\s*\n/).forEach(function (p) { B.push({ p: p }); });
      B.push({ h: 1, num: '3', t: 'Antecedentes y referencias' }, { p: 'Son complementarios a este listado los documentos y planos indicados a continuación.' });
      B.push({ p: 'Tabla 3.1: Antecedentes y referencias.', c: true, sz: 18 });
      B.push({ tabla: { cab: 1, anchos: [55, 15, 100], filas: [['CÓDIGO DOCUMENTO', 'REV', 'NOMBRE DOCUMENTO']].concat((d.refs.length ? d.refs : [['', '', '']]).map(function (r) { return [r[0], { t: r[1], c: true }, r[2]]; })) } });
      B.push({ salto: true }, { p: '' }, { p: '' }, { p: '' }, { p: 'Anexo A', b: true, c: true, sz: 40, color: AZUL }, { p: d.anexoA, b: true, c: true, sz: 28, color: AZUL });
      B.push({ seccion: { papel: 'A3', orient: 'h' } });
      var anchos = COLS.map(function (c) { return c[4]; }), suma = anchos.reduce(function (s, w) { return s + w; }, 0); anchos = anchos.map(function (w) { return w * 378 / suma; });
      var cab = cabecera(), f1 = [], f2 = [];
      cab[0].forEach(function (c) { f1.push({ t: c.t, cs: c.cs, vm: c.rs > 1 ? 'start' : null, sz: 12 }); });
      cab[1].forEach(function (c) { if (c.cont) f2.push({ t: '', vm: 'cont', sz: 12 }); else f2.push({ t: c.t, sz: 12 }); });
      var T = [f1, f2];
      G.forEach(function (g) {
        if (g.titulo) T.push([{ t: g.titulo, cs: COLS.length, b: true, fill: CLARO, color: AZUL, sz: 13 }]);
        g.filas.forEach(function (f) { T.push(COLS.map(function (c) { return { t: f[c[0]] == null ? '' : String(f[c[0]]), sz: 12, c: IZQ.indexOf(c[0]) < 0 }; })); });
      });
      B.push({ p: (d.titulo + ' · ANEXO A · ' + d.anexoA).toUpperCase(), b: true, c: true, color: AZUL });
      B.push({ tabla: { cab: 2, anchos: anchos, filas: T } });
      NOTAS.forEach(function (n, i) { B.push({ p: (i ? '' : 'NOTAS: ') + (i + 1) + '.- ' + n, sz: 16 }); });
      var bytes = window.DOCX.generar({
        titulo: d.titulo, autor: d.empresa, logo: logo, anchosEncabezado: [42, 86, 42], pie: d.codigo + (d.rev !== '' ? ' R' + d.rev : ''),
        encabezado: [[logo ? { t: '', img: 34, c: true } : { t: 'ReyEngi', b: true, c: true }, { t: d.proyecto, c: true }, { t: d.codigo, b: true, c: true }],
          [{ t: d.cliente, c: true }, { t: d.titulo, c: true, b: true }, { t: 'Rev. ' + d.rev + '  ·  {PAG}', c: true }]],
        bloques: B
      });
      descargar(nombre('.docx'), bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  }
  function pdf() {
    var c = $('#impDoc'); c.innerHTML = htmlDoc(false); document.body.classList.add('imprimiendo');
    var fin = function () { document.body.classList.remove('imprimiendo'); };
    var imgs = [].slice.call(c.querySelectorAll('img')).map(function (im) { return im.complete ? null : new Promise(function (ok) { im.onload = im.onerror = ok; }); }).filter(Boolean);
    Promise.all(imgs).then(function () {
      if (window.reyPdf && window.reyPdf.guardar) return window.reyPdf.guardar(nombre('')).then(fin, fin);
      setTimeout(function () { window.print(); setTimeout(fin, 500); }, 200);
    });
  }

  // ── Interfaz ──
  var sec = $('#secListado'); if (!sec) return;
  var est = document.createElement('style');
  est.textContent = [
    '.ldoc{display:grid;grid-template-columns:330px minmax(0,1fr);gap:14px;align-items:start}',
    '.lform{display:grid;gap:10px;position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto;padding-right:4px}',
    '.lform fieldset{border:1px solid var(--line);border-radius:8px;padding:8px 10px 10px;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.lform legend{font:700 11px var(--f-mono);color:var(--accent-ink);text-transform:uppercase;letter-spacing:1px;padding:0 4px}',
    '.lform .ancho{grid-column:1/-1}.lform textarea{font:12.5px var(--f-body);color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:5px 8px;width:100%;resize:vertical}',
    '.lform label.chk{display:flex;align-items:center;gap:8px;color:var(--fg);font-weight:500}.lform label.chk input{width:16px;min-height:16px}',
    '.lprev{display:flex;flex-direction:column;gap:14px;min-width:0;max-height:calc(100vh - 80px);overflow:auto;padding:4px;background:#2A3B50;border-radius:8px}',
    '.lprev .pg,#impDoc .pg{background:#fff;color:#17212C;box-shadow:0 6px 30px rgba(0,0,0,.45);padding:12mm 14mm;font:10pt/1.4 Arial,Helvetica,sans-serif;color-scheme:light;margin:0 auto}',
    '.pg.v{width:210mm;min-height:297mm;max-width:100%}.pg.h{width:100%;overflow-x:auto;padding:8mm !important}',
    '.pg table{border-collapse:collapse;width:100%}.pg td,.pg th{border:.6pt solid #1F2A36;padding:1mm 1.4mm;vertical-align:middle}',
    '.pg th,.pg td.lb{background:#022A55;color:#fff;font-weight:700;font-size:8pt;text-align:center}.pg td.cl{background:#DCE3EB;color:#022A55;font-weight:700}',
    '.pg .logo{height:14mm}.pg .cab{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #9FB0C3;padding-bottom:3mm;margin-bottom:6mm}.pg .cab span{font-size:8pt;color:#5A6573;font-style:italic}',
    '.pg h2{color:#022A55;font-size:13pt;margin:6mm 0 3mm}.pg h3{color:#022A55;font-size:11pt;margin:5mm 0 2mm;text-transform:uppercase}',
    '.pg .tit{text-align:center;color:#022A55;font-size:15pt;font-weight:700;margin:8mm 0 6mm}.pg .datos td:first-child{font-weight:700;width:38mm;border:0}.pg .datos td{border:0;padding:.6mm 1mm}',
    '.pg p{margin:0 0 3mm;text-align:justify}.pg .anexo{text-align:center;padding-top:90mm}.pg .anexo b{display:block;color:#022A55;font-size:18pt;margin-bottom:6mm}',
    '.pg .piepg{margin-top:8mm;font-size:8pt;color:#5A6573;border-top:1px solid #9FB0C3;padding-top:2mm}',
    'table.io2{font:6.6pt/1.2 Arial,Helvetica,sans-serif}table.io2 th{font-size:6.4pt;padding:.8mm}table.io2 td{padding:.6mm .9mm;text-align:center}table.io2 td.izq{text-align:left}',
    'table.io2 tr.grp td{background:#DCE3EB;color:#022A55;font-weight:700;text-align:left;font-size:7pt}table.encio td{font-size:7.4pt;padding:.8mm 1.2mm}',
    '.lprev table.io2{font-size:7.6pt}.lprev table.io2 th{font-size:7pt}',
    '.ce{outline:none;border-radius:2px;min-width:1.2em;display:inline-block;cursor:text}.ce:hover{background:#FFF6D6;box-shadow:0 0 0 1px #E8C66B}.ce:focus{background:#FFF1BF;box-shadow:0 0 0 1.5px #EF5A05}',
    '.ce.vacio:empty::before,.ce.vacio:not(:focus)::after{content:""}.ce:empty::before{content:"\\2014";color:#B0B8C2}',
    '.ce.bloque{display:block;white-space:pre-wrap;text-align:justify;margin:0 0 3mm;padding:1mm}',
    'table.io2 td .ce{display:block;min-height:1.2em}table.io2 td.ed{background:#FFF8E0}',
    'table.io2 th.gut,table.io2 td.gut{border:0;background:transparent;width:16px;padding:0}.qf{border:0;background:transparent;color:#B33;min-height:0;padding:0 2px;font-size:11px;cursor:pointer;opacity:.35}tr:hover .qf{opacity:1}',
    '#impDoc{display:none}.lest{font:500 12px var(--f-mono);color:var(--muted)}',
    '@media (max-width:1100px){.ldoc{grid-template-columns:1fr}.lform{position:static;max-height:none}.lprev{max-height:none}}',
    '@media print{body.imprimiendo>*:not(#impDoc){display:none!important}body.imprimiendo #impDoc{display:block}html,body{background:#fff!important}:root{color-scheme:light}',
    '@page vert{size:A4 portrait;margin:10mm}@page hori{size:A3 landscape;margin:8mm}',
    '#impDoc .pg{box-shadow:none;padding:0!important;width:auto;min-height:0;max-width:none;overflow:visible;margin:0}#impDoc .pg.v{page:vert;break-after:page}#impDoc .pg.h{page:hori}',
    '#impDoc table.io2 thead{display:table-header-group}#impDoc table.io2 tr{break-inside:avoid}}'
  ].join('\n');
  document.head.appendChild(est);
  var imp = document.createElement('div'); imp.id = 'impDoc'; document.body.appendChild(imp);

  sec.insertAdjacentHTML('beforeend',
    '<div class="herr" style="margin-bottom:10px"><button type="button" class="pri" id="lExcel">Excel · Anexo A</button><button type="button" id="lWord">Word · documento</button><button type="button" id="lPdf">PDF</button>' +
    '<span class="esp"></span><button type="button" class="mini" id="lAgregar">+ Agregar fila</button><button type="button" class="mini" id="lRestaurar" hidden></button><button type="button" class="mini" id="lLimpiar" title="Vuelve a los valores tomados del P&amp;ID en todas las celdas del Anexo A">Descartar ediciones del Anexo A</button></div>' +
    '<p class="lest" id="lEstado" aria-live="polite"></p>' +
    '<div class="ldoc"><form class="lform" id="lForm"></form><div class="lprev" id="lPrev"></div></div>');

  $('#lForm').addEventListener('submit', function (e) { e.preventDefault(); });
  function pintarForm() {
    var d = doc(), p = pr();
    function inp(k, l, cls, ph) { return '<label' + (cls ? ' class="' + cls + '"' : '') + '>' + l + '<input data-c="' + k + '" value="' + esc(d.c[k] || '') + '" placeholder="' + esc(ph != null ? ph : defecto(k)) + '"></label>'; }
    function area(k, l, ph, rows) { return '<label class="ancho">' + l + '<textarea rows="' + (rows || 3) + '" data-c="' + k + '" placeholder="' + esc(ph != null ? ph : defecto(k)) + '">' + esc(d.c[k] || '') + '</textarea></label>'; }
    $('#lForm').innerHTML =
      '<fieldset><legend>Contenido del Anexo A</legend><label class="ancho">Instrumentos que entran<select data-o="incluir"><option value="validados"' + (d.incluir !== 'revision' ? ' selected' : '') + '>Solo los validados</option><option value="revision"' + (d.incluir === 'revision' ? ' selected' : '') + '>Validados y pendientes (borrador)</option></select></label>' +
      '<label class="chk ancho"><input type="checkbox" data-o="agrupar"' + (d.agrupar ? ' checked' : '') + '> Agrupar por P&amp;ID</label>' +
      '<p class="ayuda ancho" style="margin:0">Escribe directamente sobre la vista previa: cada celda, los textos y la portada. Las celdas que cambiaste quedan en amarillo; los rechazados no entran.</p></fieldset>' +
      '<fieldset><legend>Identificación</legend>' + inp('codigo', 'Código del documento', 'ancho', 'Ej.: 1234-IN-LI-0001') + inp('fecha', 'Fecha') + inp('id', 'ID / contrato') + inp('tipoDoc', 'Tipo de documento', 'ancho') + inp('titulo', 'Título', 'ancho') + inp('anexoA', 'Título del Anexo A', 'ancho') + '</fieldset>' +
      '<fieldset><legend>Proyecto y firmas</legend>' + CAMPOS_PROY.map(function (c) { return '<label' + (/^(proyecto|cliente|contratista)$/.test(c[0]) ? ' class="ancho"' : '') + '>' + c[1] + '<input data-p="' + c[0] + '" value="' + esc(p[c[0]] || '') + '"></label>'; }).join('') + '</fieldset>' +
      '<fieldset><legend>Roles</legend>' + inp('rolPor', 'Prepara') + inp('rolReviso', 'Revisa') + inp('rolAprobo', 'Aprueba') + inp('rolCliente', 'En el cliente') + '</fieldset>' +
      '<fieldset><legend>Revisiones y referencias</legend>' + area('revs', 'Revisiones (rev ; descripción ; fecha)', null, 2) + area('cambios', 'Control de cambios (rev ; fecha ; página ; descripción ; responsable)', '', 2) + area('refs', 'Referencias adicionales (código ; rev ; nombre)', 'Los P&ID cargados ya se incluyen', 3) + '</fieldset>';
  }
  var editando = false;
  function pintarPrev() {
    if (editando) return; // no se repinta mientras se escribe en la vista previa
    var R = filas(), sc = $('#lPrev').scrollTop, sl = ($('#lPrev .pg.h') || {}).scrollLeft || 0;
    $('#lPrev').innerHTML = htmlDoc(true);
    $('#lPrev').scrollTop = sc; var ph = $('#lPrev .pg.h'); if (ph) ph.scrollLeft = sl;
    var d = doc(), nf = Object.keys(d.fuera).length, ned = Object.keys(d.f).length;
    $('#lEstado').textContent = R.length + ' instrumentos en el Anexo A' + (d.extra.length ? ' (' + d.extra.length + ' agregados a mano)' : '') + (ned ? ' · ' + ned + ' filas con ediciones' : '') + (nf ? ' · ' + nf + ' quitados' : '') + '.';
    var br = $('#lRestaurar'); br.hidden = !nf; br.textContent = 'Restaurar quitados (' + nf + ')';
  }
  var tP = 0;
  function luego() { clearTimeout(tP); tP = setTimeout(pintarPrev, 250); }
  function refrescar() { pintarForm(); pintarPrev(); }

  $('#lForm').addEventListener('input', function (e) {
    var x = e.target, d = doc();
    if (x.dataset.c) { if (x.value) d.c[x.dataset.c] = x.value; else delete d.c[x.dataset.c]; guardar(); luego(); }
    else if (x.dataset.p) { ponerProy(x.dataset.p, x.value); luego(); }
  });
  $('#lForm').addEventListener('change', function (e) {
    var x = e.target, d = doc(); if (!x.dataset.o) return;
    d[x.dataset.o] = x.type === 'checkbox' ? x.checked : x.value; guardar(); pintarPrev();
  });
  // Edición directa en la vista previa
  function leerCe(el) { return el.classList.contains('bloque') ? el.innerText.replace(/\n{3,}/g, '\n\n').trim() : el.textContent.replace(/\s+/g, ' ').trim(); }
  function filaPorKey(k) { return filas().filter(function (r) { return r.key === k; })[0]; }
  $('#lPrev').addEventListener('input', function (e) {
    var el = e.target.closest('[data-e]'); if (!el) return;
    var k = el.dataset.e, v = leerCe(el), d = doc(), i = k.indexOf(':'), tipo = k.slice(0, i), resto = k.slice(i + 1);
    editando = true;
    if (tipo === 'c' || tipo === 't') { if (v && v !== defecto(resto)) d.c[resto] = v; else delete d.c[resto]; guardar(); }
    else if (tipo === 'p') ponerProy(resto, v);
    else if (tipo === 'f') {
      var j = resto.lastIndexOf(':'), key = resto.slice(0, j), col = resto.slice(j + 1), r = filaPorKey(key); if (!r) return;
      var o = d.f[key] = d.f[key] || {};
      if (!r.extra && v === r.auto[col]) delete o[col]; else o[col] = col === 'tagInst' ? up(v) : v;
      if (!Object.keys(o).length) delete d.f[key];
      var td = el.closest('td'); if (td) td.classList.toggle('ed', o[col] != null);
      guardar();
    }
  });
  $('#lPrev').addEventListener('focusout', function (e) {
    var el = e.target.closest && e.target.closest('[data-e]'); if (!el) return;
    editando = false;
    setTimeout(function () { if (!$('#lPrev').contains(document.activeElement) || !document.activeElement.closest('[data-e]')) { pintarForm(); pintarPrev(); } }, 0);
  });
  $('#lPrev').addEventListener('keydown', function (e) {
    var el = e.target.closest('[data-e]'); if (!el) return;
    if (e.key === 'Enter' && !el.classList.contains('bloque')) { // Enter: baja a la misma columna de la fila siguiente
      e.preventDefault();
      var td = el.closest('td'), tr = td && td.closest('tr');
      if (tr && tr.nextElementSibling) { var c = tr.nextElementSibling.children[td.cellIndex]; var n = c && c.querySelector('[data-e]'); if (n) { n.focus(); selTodo(n); return; } }
      el.blur();
    }
    if (e.key === 'Escape') el.blur();
  });
  function selTodo(el) { var s = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(el); s.removeAllRanges(); s.addRange(rg); }
  $('#lPrev').addEventListener('paste', function (e) {
    var el = e.target.closest('[data-e]'); if (!el || el.classList.contains('bloque')) return;
    e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ').trim(); document.execCommand('insertText', false, t);
  });
  $('#lPrev').addEventListener('click', function (e) {
    var b = e.target.closest('button.qf'); if (!b) return;
    var d = doc(), k = b.dataset.q, r = filaPorKey(k); if (!r) return;
    if (r.extra) d.extra = d.extra.filter(function (x) { return x.id !== k; }); else d.fuera[k] = 1;
    delete d.f[k]; guardar(); pintarPrev();
  });
  $('#lAgregar').addEventListener('click', function () {
    var d = doc(), id = uid(); d.extra.push({ id: id }); d.f[id] = { tagInst: '', desc: '' }; guardar(); editando = false; pintarPrev();
    var c = $('#lPrev tr[data-k="' + id + '"] [data-e$=":tagInst"]'); if (c) { c.scrollIntoView({ block: 'center' }); c.focus(); }
  });
  $('#lRestaurar').addEventListener('click', function () { doc().fuera = {}; guardar(); pintarPrev(); });
  $('#lLimpiar').addEventListener('click', function () {
    var d = doc(), n = Object.keys(d.f).filter(function (k) { return !d.extra.some(function (x) { return x.id === k; }); }).length;
    if (!n) return;
    if (!confirm('¿Descartar las ediciones de ' + n + ' filas del Anexo A? Las filas agregadas a mano se mantienen.')) return;
    Object.keys(d.f).forEach(function (k) { if (!d.extra.some(function (x) { return x.id === k; })) delete d.f[k]; }); guardar(); pintarPrev();
  });
  $('#lExcel').addEventListener('click', excel);
  $('#lWord').addEventListener('click', word);
  $('#lPdf').addEventListener('click', pdf);

  window.PID_LISTADO = { refrescar: refrescar, cambio: luego, filas: filas, grupos: grupos, datos: datosDoc, excel: excel, word: word, html: htmlDoc };
  refrescar();
})();
