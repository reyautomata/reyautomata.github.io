/* Documento "Listado de entradas y salidas" · ReyEngi
 * Portada (control, revisiones, control de cambios), introducción, alcance, antecedentes y referencias,
 * y Anexo A con las señales agrupadas por módulo y canales de reserva. Exporta a Excel, Word y PDF.
 */
(function () {
  'use strict';
  var A = window.__LAZOS, D = window.LAZOS_DIBUJO, ISA = window.ISA, T = window.LAZOS_TARJETAS, P = window.REProyectos;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = A.esc, pad = A.pad, LOGO = '../../img/logo-reyengi.png', AZUL = '022A55', CLARO = 'DCE3EB';
  var ORDEN = { AI: 0, AO: 1, DI: 2, DO: 3 };
  function E() { return A.E(); }
  function hoy() { return P.hoy ? P.hoy() : new Date().toLocaleDateString('es-CL'); }
  function up(s) { return String(s || '').toUpperCase(); }

  // ── Valores automáticos de cada señal ──
  function letrasSenal(s) {
    var a = ISA.analizar(s.tag), v = a.variable + (a.modificador || ''), r = A.resolver(s);
    if (s.tipo === 'AI') return (r.hmi[0] || v + 'I').replace(/C$/, '');
    if (s.tipo === 'AO') return v + 'Y';
    if (s.tipo === 'DI') return r.hmi[0] || a.letras;
    return (a.variable === 'H' ? 'H' : a.variable) + 'Y';
  }
  function tagSenal(s) {
    if (s.tagSenal) return s.tagSenal;
    var a = ISA.analizar(s.tag), l = letrasSenal(s), num = (a.numero || '') + (a.sufijo || '');
    return (E().doc.formatoTag === 'guiones') ? (a.area ? a.area + '-' : '') + l + '-' + num : (a.area || '') + l + num;
  }
  var NIVEL = { HH: 'MUY ALTO', H: 'ALTO', L: 'BAJO', LL: 'MUY BAJO' };
  function descSenal(s) {
    if (s.descSenal) return s.descSenal;
    var a = ISA.analizar(s.tag), vari = up(ISA.VAR[a.variable] || '') + (a.modificador === 'D' ? ' DIFERENCIAL' : ''), f = a.funciones;
    if (s.tipo === 'AI') return 'MEDICIÓN DE ' + vari;
    if (s.tipo === 'AO') return 'SALIDA DE CONTROL DE ' + vari;
    if (s.tipo === 'DI') {
      var m = /S(HH|LL|H|L)$/.exec(f); if (m) return 'ALARMA DE ' + vari + ' ' + NIVEL[m[1]];
      if (a.variable === 'Z') return /O$/.test(f) ? 'INDICACIÓN VÁLVULA ABIERTA' : /C$/.test(f) ? 'INDICACIÓN VÁLVULA CERRADA' : 'INDICACIÓN DE POSICIÓN';
      if (a.letras === 'XA') return 'INDICACIÓN DE FALLA';
      if (a.letras === 'YS' || a.letras === 'XL') return 'ESTADO EN SERVICIO / DETENIDO';
      if (a.letras === 'HS') return 'SELECTOR LOCAL / REMOTO';
      return 'ESTADO ' + up(ISA.describir(s.tag));
    }
    if (a.letras === 'XV' || a.letras === 'XY') return 'COMANDO ABRIR / CERRAR VÁLVULA';
    if (a.letras === 'HS') return 'COMANDO PARTIR / DETENER';
    return 'COMANDO ' + up(ISA.describir(s.tag));
  }
  function rangoUnidad(s) {
    var r = String(s.rango || '').trim();
    if (!r) return [s.tipo === 'DI' || s.tipo === 'DO' ? 'ON - OFF' : '', s.unidad || ''];
    var m = /^(.*?[\d.,]+)\s*([^\d\s][^\d]*)$/.exec(r);
    return m && !s.unidad ? [m[1].trim(), m[2].trim()] : [r, s.unidad || ''];
  }
  function alarma(s, k) {
    if (s['a' + k]) return s['a' + k];
    if (s.tipo !== 'DI') return '';
    var m = /S(HH|LL|H|L)$/.exec(ISA.analizar(s.tag).funciones); return m && m[1] === k ? 'X' : '';
  }

  // ── Filas del Anexo A (agrupadas por módulo, con reservas) ──
  function planos() { var m = {}; A.lazos().forEach(function (l) { m[l.id] = l.plano; }); return m; }
  function grupos() {
    var e = E(), pl = planos(), base = A.base(), cfg = e.cfg, n = 0, out = [];
    function fila(s) {
      var r = A.resolver(s), m = A.modulo(s.mod), t = D.terminales(r, cfg), ru = rangoUnidad(s);
      return { n: ++n, tagInst: s.tag, tagSenal: tagSenal(s), desc: descSenal(s), servicio: up(s.servicio), pid: s.pid || cfg.docPid || '', plano: s.plano || pl[A.lazoId(s)] || '',
        senal: up(r.senalTxt), io: s.tipo, gab: m ? (m.gabinete || cfg.gabinete) : '', modelo: m ? m.modelo : '', chasis: m ? m.chasis : '', columna: m ? (m.columna || '') : '', slot: m ? m.slot : '',
        canal: s.canal === '' || s.canal == null ? '' : +s.canal + base, regleta: m ? (m.tb || '') : '', terminal: m ? t.tb.join('-') : '', termTarjeta: m ? t.tarjeta.join('-') : '',
        rango: ru[0], unidad: ru[1], LL: alarma(s, 'LL'), L: alarma(s, 'L'), H: alarma(s, 'H'), HH: alarma(s, 'HH'), obs: up(s.obs), rev: s.rev || (P.activo().rev || '') };
    }
    var mods = e.modulos.slice().sort(function (a, b) { return ORDEN[a.tipo] - ORDEN[b.tipo] || (+a.chasis || 0) - (+b.chasis || 0) || (+a.slot || 0) - (+b.slot || 0); });
    mods.forEach(function (m) {
      var tj = T.buscar(m.modelo), nc = tj ? tj.canales : 8, filas = [];
      for (var c = 0; c < nc; c++) {
        var s = e.senales.filter(function (x) { return x.mod === m.id && x.canal !== '' && x.canal != null && +x.canal === c; })[0];
        if (s) filas.push(fila(s));
        else if (e.doc.reservas !== false) {
          var t2 = tj ? D.terminales({ tipo: m.tipo, hilos: 2, canal: c, tarjeta: tj, bornes: T.bornes(tj.modelo, c, e.over) }, cfg) : { tb: [], tarjeta: [] };
          filas.push({ reserva: true, n: '', tagInst: 'RESERVA', tagSenal: '-', desc: '-', servicio: '-', pid: '-', plano: '-', senal: up(cfg['senal' + m.tipo]), io: m.tipo, gab: m.gabinete || cfg.gabinete, modelo: m.modelo,
            chasis: m.chasis, columna: m.columna || '', slot: m.slot, canal: c + base, regleta: m.tb || '', terminal: t2.tb.join('-'), termTarjeta: t2.tarjeta.join('-'), rango: '-', unidad: '-', LL: '-', L: '-', H: '-', HH: '-', obs: '', rev: P.activo().rev || '' });
        }
      }
      if (filas.length) out.push({ titulo: 'MÓDULO ' + m.tipo + ' · ' + m.nombre + ' · ' + m.modelo + ' · CHASIS ' + m.chasis + ' · SLOT ' + m.slot + (m.columna ? ' · ' + up(m.columna) : ''), filas: filas });
    });
    var sin = e.senales.filter(function (s) { return s.tag && (!A.modulo(s.mod) || s.canal === '' || s.canal == null); }).sort(function (a, b) { return ORDEN[a.tipo] - ORDEN[b.tipo]; });
    if (sin.length) out.push({ titulo: 'SEÑALES SIN TARJETA O CANAL ASIGNADO', filas: sin.map(fila) });
    return out;
  }
  // Columnas del Anexo A: [clave, título, grupo, ancho Excel, ancho mm Word]
  var COLS = [
    ['n', 'N°', '', 5, 7], ['tagInst', 'TAG INSTRUMENTO / EQUIPO', '', 16, 22], ['tagSenal', 'TAG SEÑAL', '', 16, 22], ['desc', 'DESCRIPCIÓN SEÑAL', '', 24, 32],
    ['servicio', 'SERVICIO', '', 34, 46], ['pid', 'P&ID', '', 18, 24], ['plano', 'DIAGRAMA DE LAZO / INTERCONEXIONADO', '', 18, 24], ['senal', 'TIPO SEÑAL', '', 11, 14],
    ['io', 'TIPO I/O', '', 6, 9], ['gab', 'GABINETE PLC', '', 15, 20], ['modelo', 'MODELO TARJETA I/O', '', 15, 20],
    ['chasis', 'CHASIS', 'PUNTO DE CONEXIÓN', 7, 10], ['columna', 'COLUMNA', 'PUNTO DE CONEXIÓN', 9, 12], ['slot', 'SLOT', 'PUNTO DE CONEXIÓN', 6, 8], ['canal', 'CANAL', 'PUNTO DE CONEXIÓN', 6, 9],
    ['regleta', 'REGLETA', 'CONEXIÓN EN REGLETA', 9, 12], ['terminal', 'TERMINAL', 'CONEXIÓN EN REGLETA', 13, 17], ['termTarjeta', 'TERMINAL TARJETA', '', 11, 14],
    ['rango', 'RANGO', '', 12, 15], ['unidad', 'UNIDAD', '', 8, 10], ['LL', 'LL', 'ALARMAS', 5, 7], ['L', 'L', 'ALARMAS', 5, 7], ['H', 'H', 'ALARMAS', 5, 7], ['HH', 'HH', 'ALARMAS', 5, 7],
    ['obs', 'OBSERVACIONES', '', 24, 30], ['rev', 'REV.', '', 5, 7]
  ];
  // Celdas de cabecera en dos filas: grupos combinados horizontalmente, el resto combinado verticalmente
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
  // Rango de filas consecutivas del mismo instrumento (para combinar tag de instrumento y servicio)
  function tramos(filas) {
    var r = []; filas.forEach(function (f, i) { if (i && !f.reserva && filas[i - 1].tagInst === f.tagInst && !filas[i - 1].reserva) r[r.length - 1][1] = i; else r.push([i, i]); }); return r;
  }

  // ── Datos del documento ──
  function datosDoc() {
    var e = E(), d = e.doc, pr = P.activo();
    return {
      codigo: d.codigo || e.cfg.docIO || '', titulo: d.titulo || 'LISTADO DE ENTRADAS Y SALIDAS', tipoDoc: d.tipoDoc || 'LISTA DE EQUIPOS', fecha: d.fecha || pr.porFecha || hoy(),
      id: d.id || pr.idCliente || '', rev: pr.rev || '', proyecto: pr.proyecto || '', cliente: pr.cliente || '', empresa: pr.contratista || 'ReyEngi', numero: pr.numero || '',
      anexoA: d.anexoA || 'LISTADO DE ENTRADAS Y SALIDAS - SEÑALES ANALÓGICAS Y DIGITALES', anexoB: d.anexoB || '',
      intro: d.intro || (pr.cliente || 'El cliente') + ' ha encargado a ' + (pr.contratista || 'ReyEngi') + ' el desarrollo del proyecto "' + (pr.proyecto || '') + '".\n\nEl presente documento corresponde al listado de entradas y salidas del sistema de control del proyecto.',
      alcance: d.alcance || 'Este documento corresponde al listado de entradas y salidas del sistema de control consideradas para el desarrollo del proyecto, con su punto de conexión (chasis, slot, canal), regleta, terminales, rango y alarmas.\n\nLa cantidad de los instrumentos o equipos y sus especificaciones particulares se encuentran en las hojas de datos respectivas.\n\nTodos los instrumentos y equipos deberán ser de diseño probado, de tipo estándar y fabricación reciente.',
      control: [['Preparado por:', pr.por, d.rolPor || 'Ingeniero de Proyecto', pr.porFecha], ['Revisado por:', pr.reviso, d.rolReviso || 'Jefe de Disciplina', pr.revisoFecha], ['Aprobado por:', pr.aprobo, d.rolAprobo || 'Jefe de Proyecto', pr.aproboFecha],
        ['Revisado ' + (pr.cliente || 'cliente') + ':', pr.revisoCliente, d.rolCliente || '', ''], ['Aprobado ' + (pr.cliente || 'cliente') + ':', pr.aproboCliente, d.rolCliente || '', '']],
      revs: (e.revs || []).map(function (r) { return [r.rev || '', r.desc || '', r.fecha || '']; }),
      cambios: String(d.cambios || '').split(/\r?\n/).filter(Boolean).map(function (l) { var c = l.split(/\s*;\s*/); while (c.length < 5) c.push(''); return c.slice(0, 5); }),
      refs: referencias()
    };
  }
  function referencias() {
    var e = E(), r = [], vistos = {}, rev = P.activo().rev || '';
    function add(c, v, n) { if (!c || vistos[c]) return; vistos[c] = 1; r.push([c, v, n]); }
    e.senales.forEach(function (s) { if (s.pid) add(s.pid, '', 'P&ID'); });
    if (e.cfg.docPid) add(e.cfg.docPid, '', 'P&ID');
    A.lazos().forEach(function (l) { add(l.plano, l.rev || rev, 'Diagrama de lazo ' + l.id + (l.servicio ? ' · ' + l.servicio : '')); });
    if (e.cfg.docCables) add(e.cfg.docCables, '', 'Listado de cables');
    String(e.doc.refs || '').split(/\r?\n/).filter(Boolean).forEach(function (l) { var c = l.split(/\s*;\s*/); add(c[0], c[1] || '', c[2] || ''); });
    return r;
  }

  // ── Vista previa HTML (también sirve para imprimir a PDF) ──
  function cabPagina() { return '<div class="cab"><img class="logo" src="' + LOGO + '" alt="ReyEngi"><span>ReyEngi · Automatización y Control Industrial</span></div>'; }
  function tablaHtml(f, cab) { return '<table>' + (cab ? '<tr>' + cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' : '') + f.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c == null ? '' : c).replace(/\n/g, '<br>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; }
  function parrafos(t) { return String(t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function htmlDoc() {
    var d = datosDoc(), G = grupos(), pie = '<p style="margin-top:8mm;font-size:8pt;color:#5A6573;border-top:1px solid #9FB0C3;padding-top:2mm">' + esc(d.codigo + (d.rev !== '' ? ' R' + d.rev : '')) + '</p>';
    var h = [];
    h.push('<div class="pg v">' + cabPagina() + '<div class="tit">' + esc(up(d.empresa)) + '</div>' +
      '<table class="datos"><tr><td>TIPO DOCUMENTO</td><td>: ' + esc(d.tipoDoc) + ' &nbsp;&nbsp; ' + esc(d.titulo) + '</td></tr><tr><td>TÍTULO PROYECTO</td><td>: ' + esc(d.proyecto) + '</td></tr><tr><td>CLIENTE</td><td>: ' + esc(d.cliente) + '</td></tr><tr><td>ID</td><td>: ' + esc(d.id) + '</td></tr><tr><td>CÓDIGO</td><td>: <b>' + esc(d.codigo) + '</b> &nbsp;&nbsp; <b>FECHA DOCUMENTO:</b> ' + esc(d.fecha) + '</td></tr></table>' +
      '<div style="height:28mm"></div>' + tablaHtml(d.control.map(function (r) { return [r[0], r[1] || '', r[2] || '', '', r[3] || '']; }), ['Control', 'Nombre', 'Rol', 'Firma', 'Fecha']) + '<br>' +
      tablaHtml(d.revs, ['Revisión', 'Descripción', 'Fecha']) + '<br>' +
      tablaHtml(d.cambios.length ? d.cambios : [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']], ['Revisión', 'Fecha', 'Página', 'Descripción del cambio', 'Responsable']) + pie + '</div>');
    h.push('<div class="pg v">' + cabPagina() + '<div class="tit" style="font-size:12pt">' + esc(up(d.proyecto)) + '<br>' + esc(d.titulo) + '<br>' + esc(d.codigo) + '</div>' +
      '<h3>Tabla de contenido</h3><p>1 &nbsp; INTRODUCCIÓN<br>2 &nbsp; ALCANCE<br>3 &nbsp; ANTECEDENTES Y REFERENCIAS<br>ANEXO A: ' + esc(d.anexoA) + (d.anexoB ? '<br>ANEXO B: ' + esc(d.anexoB) : '') + '</p>' +
      '<h2>1 &nbsp; INTRODUCCIÓN</h2>' + parrafos(d.intro) + '<h2>2 &nbsp; ALCANCE</h2>' + parrafos(d.alcance) +
      '<h2>3 &nbsp; ANTECEDENTES Y REFERENCIAS</h2><p>Son complementarios a este listado los documentos y planos indicados a continuación.</p>' + tablaHtml(d.refs.length ? d.refs : [['—', '', '']], ['CÓDIGO DOCUMENTO', 'REV', 'NOMBRE DOCUMENTO']) + pie + '</div>');
    h.push('<div class="pg v"><div class="anexo"><b>Anexo A</b>' + esc(d.anexoA) + '</div></div>');
    var cab = cabecera();
    var thead = '<thead><tr>' + cab[0].map(function (c) { return '<th' + (c.cs > 1 ? ' colspan="' + c.cs + '"' : '') + (c.rs > 1 ? ' rowspan="2"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr><tr>' + cab[1].filter(function (c) { return !c.cont; }).map(function (c) { return '<th>' + esc(c.t) + '</th>'; }).join('') + '</tr></thead>';
    var cuerpo = G.map(function (g) {
      var tr = tramos(g.filas);
      return '<tr class="grp"><td colspan="' + COLS.length + '">' + esc(g.titulo) + '</td></tr>' + g.filas.map(function (f, i) {
        var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0], ini = t[0] === i, rs = t[1] - t[0] + 1;
        return '<tr' + (f.reserva ? ' class="res"' : '') + '>' + COLS.map(function (c) {
          if ((c[0] === 'tagInst' || c[0] === 'servicio') && !ini) return '';
          var v = f[c[0]]; return '<td' + ((c[0] === 'tagInst' || c[0] === 'servicio') && rs > 1 ? ' rowspan="' + rs + '"' : '') + (c[0] === 'servicio' || c[0] === 'desc' || c[0] === 'obs' ? ' class="izq"' : '') + '>' + esc(v == null ? '' : v) + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }).join('');
    h.push('<div class="pg h">' + encabezadoAnexoHtml(d) + '<table class="io2">' + thead + '<tbody>' + (cuerpo || '<tr><td colspan="' + COLS.length + '">Sin señales</td></tr>') + '</tbody></table></div>');
    return h.join('');
  }
  function encabezadoAnexoHtml(d) {
    var pr = P.activo();
    return '<table class="encio" style="margin-bottom:3mm"><tr><td rowspan="5" style="width:48mm;border:0"><img class="logo" src="' + LOGO + '" alt="ReyEngi"></td>' +
      '<td class="lb" style="width:28mm;text-align:left">PROYECTO</td><td colspan="3">' + esc(d.proyecto) + '</td><td rowspan="5" style="text-align:center;font-weight:700;color:#022A55;font-size:10pt">' + esc(d.titulo) + '<br><span style="font-size:8pt">ANEXO A · ' + esc(d.anexoA) + '</span></td>' +
      '<td class="lb">REG</td><td class="lb">ING</td><td class="lb">FECHA</td></tr>' +
      '<tr><td class="lb" style="text-align:left">CLIENTE</td><td colspan="3">' + esc(d.cliente) + '</td><td class="cl">POR</td><td>' + esc(pr.por || '') + '</td><td>' + esc(pr.porFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">INGENIERÍA</td><td colspan="3">' + esc(d.empresa) + '</td><td class="cl">REVISA</td><td>' + esc(pr.reviso || '') + '</td><td>' + esc(pr.revisoFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">DOC. N°</td><td>' + esc(d.codigo) + '</td><td class="lb">REV.</td><td>' + esc(d.rev) + '</td><td class="cl">APRUEBA</td><td>' + esc(pr.aprobo || '') + '</td><td>' + esc(pr.aproboFecha || '') + '</td></tr>' +
      '<tr><td class="lb" style="text-align:left">N° PROYECTO</td><td colspan="3">' + esc(d.numero) + '</td><td colspan="3"></td></tr></table>';
  }

  // ── Excel (Anexo A) ──
  function cargarLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { if (!b) return null; var dv = new DataView(b); return { bytes: new Uint8Array(b), w: dv.getUint32(16), h: dv.getUint32(20) }; }).catch(function () { return null; });
  }
  function excel() {
    return cargarLogo().then(function (logo) {
      var X = window.XLSX_RE, lb = X.libro(), d = datosDoc(), pr = P.activo(), G = grupos(), N = COLS.length;
      lb.titulo = d.titulo; lb.autor = d.empresa;
      var h = lb.hoja('ANEXO A', { orientacion: 'landscape', pie: d.codigo + (d.rev !== '' ? ' R' + d.rev : '') });
      h.cols(COLS.map(function (c) { return c[3]; }));
      var L = { b: true, fill: AZUL, color: 'FFFFFF', sz: 8 }, V = { sz: 8 }, C = { b: true, fill: CLARO, color: AZUL, sz: 8, h: 'center' };
      h.combinar(0, 0, 1, 4, '', { borde: 'none' }); h.alto(0, 22); h.alto(1, 22);
      h.combinar(0, 5, 1, N - 1, 'ReyEngi · Automatización y Control Industrial', { borde: 'none', i: true, sz: 9, color: '5A6573', h: 'right' });
      if (logo) h.imagen(logo.bytes, 0, 0, 170, 48, 4, 4);
      // Bloque de datos del proyecto (izquierda), título (centro) y firmas (derecha)
      [['PROYECTO', d.proyecto], ['CLIENTE', d.cliente], ['INGENIERÍA', d.empresa], ['DOC. N°', d.codigo], ['N° PROYECTO', d.numero]].forEach(function (r, i) {
        h.combinar(2 + i, 0, 2 + i, 1, r[0], L);
        if (i === 3) { h.combinar(5, 2, 5, 4, r[1], V); h.celda(5, 5, 'REV.', L); h.celda(5, 6, d.rev, Object.assign({ h: 'center' }, V)); }
        else h.combinar(2 + i, 2, 2 + i, 6, r[1], V);
      });
      h.combinar(2, 7, 6, 19, d.titulo + '\nANEXO A · ' + d.anexoA, { b: true, sz: 12, color: AZUL, h: 'center' });
      h.combinar(2, 20, 2, 21, 'REG', L); h.combinar(2, 22, 2, 23, 'ING', L); h.combinar(2, 24, 2, 25, 'FECHA', L);
      [['POR', pr.por, pr.porFecha], ['REVISA', pr.reviso, pr.revisoFecha], ['APRUEBA', pr.aprobo, pr.aproboFecha], ['', '', '']].forEach(function (r, i) {
        h.combinar(3 + i, 20, 3 + i, 21, r[0], C); h.combinar(3 + i, 22, 3 + i, 23, r[1] || '', Object.assign({ h: 'center' }, V)); h.combinar(3 + i, 24, 3 + i, 25, r[2] || '', Object.assign({ h: 'center' }, V));
      });
      // Cabecera de la tabla (dos filas)
      var r0 = 8, cab = cabecera();
      cab[0].forEach(function (c) { if (c.rs > 1) h.combinar(r0, c.i, r0 + 1, c.i, c.t, Object.assign({ h: 'center', wrap: true }, L)); else h.combinar(r0, c.i, r0, c.i + c.cs - 1, c.t, Object.assign({ h: 'center' }, L)); });
      cab[1].forEach(function (c) { if (!c.cont) h.celda(r0 + 1, c.i, c.t, Object.assign({ h: 'center' }, L)); });
      h.alto(r0, 24); h.alto(r0 + 1, 24); h.filasTitulo(r0, r0 + 1);
      var r = r0 + 2;
      G.forEach(function (g) {
        h.combinar(r, 0, r, N - 1, g.titulo, { b: true, fill: CLARO, color: AZUL, sz: 8 }); r++;
        var tr = tramos(g.filas);
        g.filas.forEach(function (f, i) {
          var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0];
          COLS.forEach(function (c, ci) {
            var e = { sz: 8, h: c[0] === 'servicio' || c[0] === 'desc' || c[0] === 'obs' ? 'left' : 'center', color: f.reserva ? '6B7785' : undefined };
            if ((c[0] === 'tagInst' || c[0] === 'servicio') && t[1] > t[0]) { if (t[0] === i) h.combinar(r, ci, r + (t[1] - t[0]), ci, f[c[0]], e); }
            else h.celda(r, ci, f[c[0]] == null ? '' : f[c[0]], e);
          });
          h.alto(r, 24); r++;
        });
      });
      var nom = (d.codigo ? d.codigo + (d.rev !== '' ? ' R' + d.rev : '') + ' ANEXO A' : 'Listado E-S Anexo A').replace(/[\\/:*?"<>|]+/g, '-') + '.xlsx';
      A.descargar(nom, X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  }

  // ── Word (documento completo) ──
  function word() {
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
      B.push({ salto: true }, { indice: true }, { p: 'Lista de anexos', b: true, color: AZUL }, { p: 'ANEXO A: ' + d.anexoA }, d.anexoB ? { p: 'ANEXO B: ' + d.anexoB } : { p: '' }, { salto: true });
      B.push({ h: 1, num: '1', t: 'Introducción' }); String(d.intro).split(/\n\s*\n/).forEach(function (p) { B.push({ p: p }); });
      B.push({ h: 1, num: '2', t: 'Alcance' }); String(d.alcance).split(/\n\s*\n/).forEach(function (p) { B.push({ p: p }); });
      B.push({ h: 1, num: '3', t: 'Antecedentes y referencias' }, { p: 'Son complementarios a este listado los documentos y planos indicados a continuación.' });
      B.push({ p: 'Tabla 3.1: Antecedentes y referencias.', c: true, sz: 18 });
      B.push({ tabla: { cab: 1, anchos: [55, 15, 100], filas: [['CÓDIGO DOCUMENTO', 'REV', 'NOMBRE DOCUMENTO']].concat((d.refs.length ? d.refs : [['', '', '']]).map(function (r) { return [r[0], { t: r[1], c: true }, r[2]]; })) } });
      B.push({ salto: true }, { p: '' }, { p: '' }, { p: '' }, { p: 'Anexo A', b: true, c: true, sz: 40, color: AZUL }, { p: d.anexoA, b: true, c: true, sz: 28, color: AZUL });
      // Anexo A en hoja A3 horizontal
      B.push({ seccion: { papel: 'A3', orient: 'h' } });
      var anchos = COLS.map(function (c) { return c[4]; }), suma = anchos.reduce(function (s, w) { return s + w; }, 0); anchos = anchos.map(function (w) { return w * 378 / suma; });
      var cab = cabecera(), f1 = [], f2 = [];
      cab[0].forEach(function (c) { f1.push({ t: c.t, cs: c.cs, vm: c.rs > 1 ? 'start' : null, sz: 12 }); });
      cab[1].forEach(function (c) { if (c.cont) f2.push({ t: '', vm: 'cont', sz: 12 }); else if (c.cs === 1) f2.push({ t: c.t, sz: 12 }); });
      // las celdas de grupo de la fila 2 no existen como tales: f2 lleva una celda por columna
      var filas = [f1, f2];
      G.forEach(function (g) {
        filas.push([{ t: g.titulo, cs: COLS.length, b: true, fill: CLARO, color: AZUL, sz: 13 }]);
        var tr = tramos(g.filas);
        g.filas.forEach(function (f, i) {
          var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0];
          filas.push(COLS.map(function (c) {
            var mg = (c[0] === 'tagInst' || c[0] === 'servicio') && t[1] > t[0];
            return { t: mg && t[0] !== i ? '' : (f[c[0]] == null ? '' : String(f[c[0]])), sz: 12, c: !(c[0] === 'servicio' || c[0] === 'desc' || c[0] === 'obs'), vm: mg ? (t[0] === i ? 'start' : 'cont') : null, color: f.reserva ? '6B7785' : null };
          }));
        });
      });
      B.push({ p: (d.titulo + ' · ANEXO A · ' + d.anexoA).toUpperCase(), b: true, c: true, color: AZUL });
      B.push({ tabla: { cab: 2, anchos: anchos, filas: filas } });
      var bytes = window.DOCX.generar({
        titulo: d.titulo, autor: d.empresa, logo: logo, anchosEncabezado: [42, 86, 42], pie: d.codigo + (d.rev !== '' ? ' R' + d.rev : ''),
        encabezado: [[logo ? { t: '', img: 34, c: true } : { t: 'ReyEngi', b: true, c: true }, { t: d.proyecto, c: true }, { t: d.codigo, b: true, c: true }],
          [{ t: d.cliente, c: true }, { t: d.titulo, c: true, b: true }, { t: 'Rev. ' + d.rev + '  ·  {PAG}', c: true }]],
        bloques: B
      });
      A.descargar(((d.codigo || 'Listado E-S') + (d.rev !== '' ? ' R' + d.rev : '')).replace(/[\\/:*?"<>|]+/g, '-') + '.docx', bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  }

  function pdf() { var c = $('#imp'); c.innerHTML = htmlDoc(); setTimeout(function () { window.print(); }, 300); }

  // ── Formulario ──
  var CAMPOS = [
    { g: 'Identificación', c: [['codigo', 'Código del documento', function () { return E().cfg.docIO; }], ['fecha', 'Fecha del documento', function () { return P.activo().porFecha || hoy(); }],
      ['tipoDoc', 'Tipo de documento', function () { return 'LISTA DE EQUIPOS'; }], ['titulo', 'Título', function () { return 'LISTADO DE ENTRADAS Y SALIDAS'; }], ['id', 'ID / contrato del cliente', function () { return P.activo().idCliente; }]] },
    { g: 'Firmas (roles)', c: [['rolPor', 'Rol de quien prepara', function () { return 'Ingeniero de Proyecto'; }], ['rolReviso', 'Rol de quien revisa', function () { return 'Jefe de Disciplina'; }], ['rolAprobo', 'Rol de quien aprueba', function () { return 'Jefe de Proyecto'; }], ['rolCliente', 'Rol en el cliente', function () { return 'Jefe de Proyecto'; }]] },
    { g: 'Contenido', c: [['intro', 'Introducción', null, 'a'], ['alcance', 'Alcance', null, 'a'], ['refs', 'Referencias adicionales (código ; rev ; nombre, una por línea)', function () { return ''; }, 'a'], ['cambios', 'Control de cambios (rev ; fecha ; página ; descripción ; responsable)', function () { return ''; }, 'a'],
      ['anexoA', 'Título del Anexo A', function () { return 'LISTADO DE ENTRADAS Y SALIDAS - SEÑALES ANALÓGICAS Y DIGITALES'; }], ['anexoB', 'Anexo B (opcional, ej. señales por comunicación)', function () { return ''; }]] }
  ];
  function pintarForm() {
    var e = E(), d = e.doc, dd = datosDoc();
    $('#dForm').innerHTML = CAMPOS.map(function (g) {
      return '<fieldset><legend>' + g.g + '</legend>' + g.c.map(function (c) {
        var ph = c[2] ? c[2]() || '' : (c[0] === 'intro' ? dd.intro : dd.alcance);
        return c[3] === 'a' ? '<label class="ancho">' + c[1] + '<textarea rows="4" data-d="' + c[0] + '" placeholder="' + esc(ph) + '">' + esc(d[c[0]] || '') + '</textarea></label>'
          : '<label' + (c[0] === 'titulo' || c[0] === 'tipoDoc' ? ' class="ancho"' : '') + '>' + c[1] + '<input data-d="' + c[0] + '" value="' + esc(d[c[0]] || '') + '" placeholder="' + esc(ph) + '"></label>';
      }).join('') + '</fieldset>';
    }).join('') + '<fieldset><legend>Anexo A</legend><label class="ancho">Formato del tag de señal<select data-d="formatoTag"><option value="compacto"' + (d.formatoTag !== 'guiones' ? ' selected' : '') + '>Compacto (0110PDAH01004)</option><option value="guiones"' + (d.formatoTag === 'guiones' ? ' selected' : '') + '>Con guiones (0110-PDAH-01004)</option></select></label>' +
      '<label class="chk ancho"><input type="checkbox" data-d="reservas"' + (d.reservas !== false ? ' checked' : '') + '> Incluir canales de reserva</label>' +
      '<p class="ayuda ancho">Revisiones, cliente, proyecto y responsables se toman de Configuración (viñeta y cuadro de revisiones). Rango, P&amp;ID, alarmas, observaciones y tags de señal se editan en el listado de E/S.</p></fieldset>';
  }
  function pintarPrev() {
    var G = grupos(), n = G.reduce(function (s, g) { return s + g.filas.filter(function (f) { return !f.reserva; }).length; }, 0), r = G.reduce(function (s, g) { return s + g.filas.filter(function (f) { return f.reserva; }).length; }, 0);
    $('#dPrev').innerHTML = htmlDoc();
    $('#dEstado').textContent = n + ' señales · ' + r + ' reservas · ' + G.length + ' grupos';
  }
  var t = 0;
  function pintarDoc() { pintarForm(); pintarPrev(); }
  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { doc: pintarDoc });
  window.LAZOS_DOC = { tagSenal: tagSenal, descSenal: descSenal, rangoUnidad: rangoUnidad, alarma: alarma, grupos: grupos, excel: excel, word: word, pdf: pdf, html: htmlDoc };
  $('#dForm').addEventListener('input', function (ev) {
    var x = ev.target, k = x.dataset.d; if (!k) return;
    E().doc[k] = x.type === 'checkbox' ? x.checked : x.value; A.guardar();
    clearTimeout(t); t = setTimeout(pintarPrev, 250);
  });
  $('#dForm').addEventListener('change', function (ev) { var x = ev.target; if (x.dataset.d && (x.type === 'checkbox' || x.tagName === 'SELECT')) { E().doc[x.dataset.d] = x.type === 'checkbox' ? x.checked : x.value; A.guardar(); pintarPrev(); } });
  $('#dExcel').addEventListener('click', excel);
  $('#dWord').addEventListener('click', word);
  $('#dPdf').addEventListener('click', pdf);
  // Si la página se abrió directamente en esta pestaña, se pinta ahora
  if (!$('#v-doc').hidden) pintarDoc();
})();
