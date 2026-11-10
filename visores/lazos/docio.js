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
    return ((E().doc || {}).formatoTag === 'guiones') ? (a.area ? a.area + '-' : '') + l + '-' + num : (a.area || '') + l + num;
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
  function gruposIO() {
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
        else if ((e.doc || {}).reservas !== false) {
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
  var COLS_IO = [
    ['n', 'N°', '', 5, 7], ['tagInst', 'TAG INSTRUMENTO / EQUIPO', '', 16, 22], ['tagSenal', 'TAG SEÑAL', '', 16, 22], ['desc', 'DESCRIPCIÓN SEÑAL', '', 24, 32],
    ['servicio', 'SERVICIO', '', 34, 46], ['pid', 'P&ID', '', 18, 24], ['plano', 'DIAGRAMA DE LAZO / INTERCONEXIONADO', '', 18, 24], ['senal', 'TIPO SEÑAL', '', 11, 14],
    ['io', 'TIPO I/O', '', 6, 9], ['gab', 'GABINETE PLC', '', 15, 20], ['modelo', 'MODELO TARJETA I/O', '', 15, 20],
    ['chasis', 'CHASIS', 'PUNTO DE CONEXIÓN', 7, 10], ['columna', 'COLUMNA', 'PUNTO DE CONEXIÓN', 9, 12], ['slot', 'SLOT', 'PUNTO DE CONEXIÓN', 6, 8], ['canal', 'CANAL', 'PUNTO DE CONEXIÓN', 6, 9],
    ['regleta', 'REGLETA', 'CONEXIÓN EN REGLETA', 9, 12], ['terminal', 'TERMINAL', 'CONEXIÓN EN REGLETA', 13, 17], ['termTarjeta', 'TERMINAL TARJETA', '', 11, 14],
    ['rango', 'RANGO', '', 12, 15], ['unidad', 'UNIDAD', '', 8, 10], ['LL', 'LL', 'ALARMAS', 5, 7], ['L', 'L', 'ALARMAS', 5, 7], ['H', 'H', 'ALARMAS', 5, 7], ['HH', 'HH', 'ALARMAS', 5, 7],
    ['obs', 'OBSERVACIONES', '', 24, 30], ['rev', 'REV.', '', 5, 7]
  ];

  // ── Listado de instrumentos ──
  // Cada tag del listado de E/S aparece solo; se suman instrumentos sin E/S (manómetros, elementos primarios, balizas…).
  // E.inst guarda solo lo que el usuario escribió: { id, tag, manual, oculto, desc, servicio, linea, pid, plano, unilineal, hd, et, obs, rev }
  var NA = 'N.A.';
  function plantillasHD() { return (window.HD && window.HD.plantillas) || []; }
  var SUGERIDA = [[/^PD?I?T$/, 'pit'], [/^PI$|^PG$/, 'pi'], [/^PD?S/, 'psh'], [/^PCV$/, 'pcv'], [/^FI?T$|^FE$|^FQI?T?$/, 'fit-mag'], [/^FS/, 'fs'],
    [/^LI?T$|^LE$/, 'lit-radar'], [/^LS/, 'lsw-vib'], [/^DI?T$|^DE$/, 'dit'], [/^AI?T$|^AE$/, 'ait-ph'], [/^TI?T$|^TE$|^TW$/, 'tit'], [/^TS/, 'tsh'],
    [/^[FLPT]CV$|^[FLPT]V$/, 'fcv'], [/^[XHU]V$|^[A-Z]XV$/, 'xv-neu'], [/^WI?T$|^WQI?T?$/, 'wit'], [/^[XY]A$|^XL$/, 'xa'], [/^ZS$/, 'zs-des'], [/^SS/, 'ss-cero']];
  function hdSugerida(tag) {
    var l = ISA.analizar(tag || '').letras || '', id = null;
    SUGERIDA.some(function (m) { if (m[0].test(l)) { id = m[1]; return true; } return false; });
    return id && plantillasHD().some(function (p) { return p.id === id; }) ? id : '';
  }
  function numDas(id) { var i = plantillasHD().map(function (p) { return p.id; }).indexOf(id); return i < 0 ? '' : (P.activo().prefijo || '') + pad(i + 1, 4); }
  function numEt(id) {
    var F = (window.ET && window.ET.familias) || [], i = -1;
    F.some(function (f, k) { if ((f.instrumentos || []).some(function (x) { return [].concat(x.das || []).indexOf(id) >= 0; })) { i = k; return true; } return false; });
    return i < 0 ? '' : (P.activo().prefijoEt || '') + pad(i + 1, 4);
  }
  function instrumentos() {
    var e = E(), L = e.inst = e.inst || [], sen = {}, porTag = {}, porLazo = {}, out = [];
    e.senales.forEach(function (s) { if (!s.tag) return; if (!sen[s.tag]) sen[s.tag] = s; var k = A.lazoId(s); if (!porLazo[k]) porLazo[k] = s; });
    L.forEach(function (x) { if (x.tag && !x.manual) porTag[x.tag] = x; });
    Object.keys(sen).forEach(function (t) { out.push({ x: porTag[t] || null, tag: t, s: sen[t] }); });
    L.forEach(function (x) { if (x.manual || !sen[x.tag]) out.push({ x: x, tag: x.tag || '', s: null, manual: true }); });
    out = out.filter(function (r) { return !(r.x && r.x.oculto); });
    out.forEach(function (r) { r.lazo = r.tag ? A.lazoId({ tag: r.tag, lazo: r.s ? r.s.lazo : '' }) : ''; r.ref = r.s || porLazo[r.lazo] || null; });
    out.forEach(function (r) { r.hdAuto = hdSugerida(r.tag); });
    // Finales de carrera de válvula (ZSO/ZSC/ZIO/ZIC): van en la hoja de datos de la válvula del mismo lazo
    out.forEach(function (r) {
      if (!/^Z[SI][OC]?$/.test(ISA.analizar(r.tag).letras || '') || r.hdAuto) return;
      var v = out.filter(function (o) { return o !== r && o.lazo === r.lazo && /V$/.test(ISA.analizar(o.tag).letras || ''); })[0];
      if (v) r.hdAuto = (v.x && v.x.hd) || v.hdAuto;
    });
    out.sort(function (a, b) { return (a.lazo ? 0 : 1) - (b.lazo ? 0 : 1) || (a.lazo || '').localeCompare(b.lazo || '', 'es', { numeric: true }) || a.tag.localeCompare(b.tag, 'es', { numeric: true }); });
    return out;
  }
  // Valor automático de un campo (se muestra en gris en la tabla y se usa si el usuario no escribió nada)
  function autoInst(r, k) {
    var s = r.ref, cfg = E().cfg;
    switch (k) {
      case 'desc': return up((r.s && r.s.desc) || ISA.describir(r.tag) || '');
      case 'servicio': return s ? up(s.servicio) : '';
      case 'linea': return '';
      case 'pid': return (s && s.pid) || cfg.docPid || '';
      case 'plano': var pl = planos(); return (r.s && r.s.plano) || pl[r.lazo] || NA;
      case 'unilineal': return NA;
      case 'hd': return r.hdAuto != null ? r.hdAuto : hdSugerida(r.tag);
      case 'obs': return r.s ? up(r.s.obs) : '';
      case 'rev': return (r.s && r.s.rev) || P.activo().rev || '';
    }
    return '';
  }
  function valInst(r, k) { var v = r.x && r.x[k]; return v != null && v !== '' ? v : autoInst(r, k); }
  function docsInst(r) { // números de hoja de datos y ET
    var hd = valInst(r, 'hd'), das = hd === '-' ? NA : (numDas(hd) || NA), et = r.x && r.x.et ? r.x.et : (hd === '-' ? NA : (numEt(hd) || NA));
    return { hd: hd, das: das, et: et };
  }
  function gruposInst() {
    var filas = instrumentos().map(function (r, i) {
      var d = docsInst(r), v = function (k) { return up(valInst(r, k)); };
      return { n: i + 1, tagInst: r.tag, desc: v('desc'), servicio: v('servicio'), linea: v('linea') || NA, pid: v('pid') || NA, plano: v('plano') || NA, unilineal: v('unilineal') || NA,
        et: d.et, das: d.das, obs: v('obs'), rev: valInst(r, 'rev') };
    });
    return [{ titulo: '', filas: filas }];
  }
  var COLS_INST = [
    ['n', 'ÍTEM', '', 6, 8], ['tagInst', 'TAG', '', 18, 24], ['desc', 'DESCRIPCIÓN', '', 30, 40], ['servicio', 'SERVICIO', '', 38, 50], ['linea', 'LÍNEA / EQUIPO', '', 20, 26],
    ['pid', 'P&ID', 'PLANOS', 20, 26], ['plano', 'DIAGRAMA DE LAZO O INTERCONEXIONADO', 'PLANOS', 20, 26], ['unilineal', 'DIAGRAMA UNILINEAL', 'PLANOS', 16, 20],
    ['et', 'ESPECIFICACIÓN TÉCNICA', 'DOCUMENTOS', 18, 24], ['das', 'HOJA DE DATOS', 'DOCUMENTOS', 18, 24], ['obs', 'OBSERVACIONES', '', 28, 36], ['rev', 'REV.', '', 6, 8]
  ];


  // ── Listado de circuitos ──
  // Se genera desde el listado de E/S y los lazos: cable de terreno de cada señal, troncal multipar de cada caja (JB)
  // y alimentación de los instrumentos de 4 hilos. E.circ guarda solo lo escrito por el usuario:
  // { key, manual, oculto, tagC, equipo, desc, servicio, funcion, tipo, diseno, senal, dGab, dEq, hGab, hEq, largo, ducto, ruta, planos, suministro, obs }
  // El tag y el diseño del cable se escriben de vuelta en las señales, así el diagrama de lazo y el listado de E/S quedan iguales.
  function circuitos() {
    var e = E(), cfg = e.cfg, pl = planos(), L = e.circ = e.circ || [], porKey = {}, out = [], porCable = {}, troncal = {};
    L.forEach(function (x) { if (!x.manual && x.key) porKey[x.key] = x; });
    var gab = function (m) { return up((m && m.gabinete) || cfg.gabinete || 'GABINETE DE CONTROL'); };
    e.senales.forEach(function (s) {
      if (!s.tag) return;
      var r = A.resolver(s), m = A.modulo(s.mod), analog = s.tipo === 'AI' || s.tipo === 'AO', lz = A.lazoId(s);
      var planosS = [s.pid || cfg.docPid, s.plano || pl[lz]].filter(Boolean);
      // Cable de terreno (instrumento → JB o gabinete); señales que comparten el mismo N° de cable van en un solo circuito
      var c = porCable[r.cable];
      if (!c) {
        c = porCable[r.cable] = { key: 'f:' + s.id, clase: 'f', lazo: lz, senales: [], auto: {
          tagC: r.cable, equipo: s.tag, desc: up(r.desc), servicio: up(s.servicio), funcion: analog ? 'SEÑAL DE INSTRUMENTACIÓN' : 'SEÑAL DE CONTROL',
          tipo: analog ? (r.hilos === 3 ? 'CABLE TRÍADA TRENZADA' : 'CABLE PAR TRENZADO') : 'CABLE MULTICONDUCTOR', diseno: up(r.cableSpec), senal: up(r.senalTxt),
          dGab: s.tag, dEq: NA, hGab: s.jb ? 'CAJA DE CONEXIONES\n' + up(s.jb) : gab(m), hEq: s.jb ? NA : (m ? 'REGLETA ' + up(m.tb || ('TB' + s.tipo + '-01')) : NA),
          largo: '', ducto: '', ruta: '', planos: planosS.join('\n'), suministro: '', obs: '' } };
        out.push(c);
      } else if (c.auto.equipo.split('\n').indexOf(s.tag) < 0) c.auto.equipo += '\n' + s.tag;
      c.senales.push(s);
      // Troncal multipar de la caja hacia el gabinete
      if (s.jb) {
        var tc = s.cable2 || ('C-' + ISA.compacto(s.jb)), t = troncal[tc];
        if (!t) {
          t = troncal[tc] = { key: 'm:' + tc, clase: 'm', lazo: lz, senales: [], tipos: {}, planos: {}, auto: {
            tagC: tc, equipo: up(s.jb), desc: 'CAJA DE CONEXIONES', servicio: '', funcion: '', tipo: 'CABLE MULTIPAR', diseno: up(s.cable2Spec || cfg.cableMultipar || ''), senal: '',
            dGab: 'CAJA DE CONEXIONES\n' + up(s.jb), dEq: NA, hGab: gab(m), hEq: m ? 'REGLETA ' + up(m.tb || ('TB' + s.tipo + '-01')) : NA, largo: '', ducto: '', ruta: '', planos: '', suministro: '', obs: '' } };
          out.push(t);
        }
        t.senales.push(s); t.tipos[s.tipo] = 1; planosS.forEach(function (p) { t.planos[p] = 1; });
        if (s.cable2Spec && !t.auto.diseno) t.auto.diseno = up(s.cable2Spec);
      }
      // Alimentación de los instrumentos de 4 hilos (tablero → instrumento)
      if (+s.hilos === 4 && analog) {
        out.push({ key: 'p:' + s.id, clase: 'p', lazo: lz, senales: [s], auto: {
          tagC: ISA.compacto(s.tag) + '-P01', equipo: s.tag, desc: up(r.desc), servicio: up(s.servicio), funcion: 'ALIMENTACIÓN ELÉCTRICA', tipo: 'CABLE MULTICONDUCTOR',
          diseno: up(cfg.cableAlim || '1x3C #14 AWG'), senal: up(cfg.tension4h || '120 VAC'), dGab: up(s.alimTab || cfg.tableroAlim || 'TABLERO DE DISTRIBUCIÓN'), dEq: NA, hGab: s.tag, hEq: NA,
          largo: '', ducto: '', ruta: '', planos: planosS.join('\n'), suministro: '', obs: '' } });
      }
    });
    Object.keys(troncal).forEach(function (k) {
      var t = troncal[k], an = t.tipos.AI || t.tipos.AO;
      t.auto.funcion = an ? 'SEÑAL DE INSTRUMENTACIÓN' : 'SEÑAL DE CONTROL';
      t.auto.servicio = 'TRONCAL DE SEÑALES ' + Object.keys(t.tipos).sort().join(' / ') + ' DESDE ' + t.auto.equipo;
      t.auto.senal = up(Object.keys(t.senales.reduce(function (o, s) { o[A.resolver(s).senalTxt] = 1; return o; }, {})).join(' / '));
      t.auto.planos = Object.keys(t.planos).join('\n');
      t.auto.obs = t.senales.length + ' PARES EN USO: ' + t.senales.map(function (s) { return s.tag; }).join(', ');
    });
    out.forEach(function (c) { c.x = porKey[c.key] || null; });
    L.forEach(function (x) { if (x.manual) out.push({ key: 'x:' + x.key, clase: 'x', lazo: '', senales: [], x: x, manual: true, auto: { dEq: NA, hEq: NA } }); });
    out = out.filter(function (c) { return !(c.x && c.x.oculto); });
    var ordenC = { f: 0, p: 1, m: 2, x: 3 };
    out.sort(function (a, b) { return (a.manual ? 1 : 0) - (b.manual ? 1 : 0) || ordenC[a.clase] - ordenC[b.clase] || (a.lazo || '').localeCompare(b.lazo || '', 'es', { numeric: true }) || String(valCirc(a, 'tagC')).localeCompare(String(valCirc(b, 'tagC')), 'es', { numeric: true }); });
    return out;
  }
  function valCirc(c, k) { var v = c.x && c.x[k]; return v != null && v !== '' ? v : (c.auto[k] == null ? '' : c.auto[k]); }
  // Campos que viven en las señales (los usa el diagrama de lazo): se escriben allí
  function escribirCirc(c, k, v) {
    if (c.clase === 'f' && (k === 'tagC' || k === 'diseno')) { c.senales.forEach(function (s) { s[k === 'tagC' ? 'cable' : 'cableSpec'] = v; }); return; }
    if (c.clase === 'm' && (k === 'tagC' || k === 'diseno')) {
      c.senales.forEach(function (s) { s[k === 'tagC' ? 'cable2' : 'cable2Spec'] = v; });
      if (k === 'tagC' && c.x) c.x.key = 'm:' + (v || 'C-' + ISA.compacto(c.senales[0].jb));
      return;
    }
    var x = c.x; if (!x) { x = c.x = { key: c.key }; E().circ.push(x); }
    x[k] = v;
  }
  function gruposCirc() {
    var filas = circuitos().map(function (c, i) {
      var f = { n: i + 1 };
      COLS_CIRC.forEach(function (col) { if (col[0] !== 'n') { var v = valCirc(c, col[0]); f[col[0]] = col[0] === 'largo' ? v : up(v); } });
      ['ducto', 'ruta', 'planos', 'dEq', 'hEq', 'suministro'].forEach(function (k) { if (f[k] === '') f[k] = NA; });
      return f;
    });
    return [{ titulo: '', filas: filas }];
  }
  var COLS_CIRC = [
    ['n', 'ÍTEM', '', 6, 7], ['tagC', 'TAG CIRCUITO', '', 18, 22], ['equipo', 'TAG EQUIPO O INSTRUMENTO', '', 18, 22], ['desc', 'DESCRIPCIÓN', '', 22, 28], ['servicio', 'SERVICIO', '', 32, 38],
    ['funcion', 'FUNCIÓN', 'CABLE', 18, 22], ['tipo', 'TIPO', 'CABLE', 17, 20], ['diseno', 'DISEÑO', 'CABLE', 15, 18], ['senal', 'TIPO DE SEÑAL', '', 12, 14],
    ['dGab', 'GABINETE', 'DESDE', 19, 22], ['dEq', 'EQUIPO O CABECERA', 'DESDE', 17, 20], ['hGab', 'GABINETE', 'HASTA', 19, 22], ['hEq', 'EQUIPO O CABECERA', 'HASTA', 17, 20],
    ['largo', 'LARGO CABLE [m]', '', 9, 10], ['ducto', 'DIMENSIONES DUCTO', 'CANALIZACIÓN', 15, 18], ['ruta', 'RUTA DE CANALIZACIONES', 'CANALIZACIÓN', 18, 22],
    ['planos', 'PLANOS RELACIONADOS', '', 22, 26], ['suministro', 'SUMINISTRO', '', 18, 22], ['obs', 'OBSERVACIONES', '', 22, 26]
  ];

  // ── Tipos de documento ──
  var K_IO = {
    clave: 'doc', archivo: 'Listado de entradas y salidas', cols: COLS_IO, grupos: gruposIO, unir: ['tagInst', 'servicio'], izq: ['servicio', 'desc', 'obs'], notas: [],
    titulo: 'LISTADO DE ENTRADAS Y SALIDAS', anexo: 'LISTADO DE ENTRADAS Y SALIDAS - SEÑALES ANALÓGICAS Y DIGITALES', objeto: 'listado de entradas y salidas del sistema de control',
    codigo: function () { return E().cfg.docIO; },
    alcance: 'Este documento corresponde al listado de entradas y salidas del sistema de control consideradas para el desarrollo del proyecto, con su punto de conexión (chasis, slot, canal), regleta, terminales, rango y alarmas.\n\nLa cantidad de los instrumentos o equipos y sus especificaciones particulares se encuentran en las hojas de datos respectivas.\n\nTodos los instrumentos y equipos deberán ser de diseño probado, de tipo estándar y fabricación reciente.',
    ids: { form: '#dForm', prev: '#dPrev', estado: '#dEstado', excel: '#dExcel', word: '#dWord', pdf: '#dPdf', vista: '#v-doc' },
    estado: function (G) {
      var n = 0, r = 0; G.forEach(function (g) { g.filas.forEach(function (f) { if (f.reserva) r++; else n++; }); });
      return n + ' señales · ' + r + ' reservas · ' + G.length + ' grupos';
    },
    extraForm: function (d) {
      return '<fieldset><legend>Anexo A</legend><label class="ancho">Formato del tag de señal<select data-d="formatoTag"><option value="compacto"' + (d.formatoTag !== 'guiones' ? ' selected' : '') + '>Compacto (0110PDAH01004)</option><option value="guiones"' + (d.formatoTag === 'guiones' ? ' selected' : '') + '>Con guiones (0110-PDAH-01004)</option></select></label>' +
        '<label class="chk ancho"><input type="checkbox" data-d="reservas"' + (d.reservas !== false ? ' checked' : '') + '> Incluir canales de reserva</label>' +
        '<p class="ayuda ancho">Revisiones, cliente, proyecto y responsables se toman de Configuración (viñeta y cuadro de revisiones). Rango, P&amp;ID, alarmas, observaciones y tags de señal se editan en el listado de E/S.</p></fieldset>';
    }
  };
  var K_INST = {
    clave: 'docInst', archivo: 'Listado de instrumentos', cols: COLS_INST, grupos: gruposInst, unir: [], nw: ['tagInst', 'pid', 'plano', 'et', 'das'], izq: ['desc', 'servicio', 'linea', 'obs'], notas: ['N.A.: No Aplica.'],
    titulo: 'LISTADO DE INSTRUMENTOS', anexo: 'LISTADO DE INSTRUMENTOS', objeto: 'listado de instrumentos',
    codigo: function () { return E().cfg.docInst; },
    alcance: 'Este documento corresponde al listado de instrumentos del proyecto.\n\nLa cantidad de los instrumentos y sus especificaciones particulares se encuentran en las hojas de datos respectivas.\n\nTodos los instrumentos deberán ser de diseño probado, de tipo estándar y fabricación reciente.',
    refs: function (add) {
      var vistos = {};
      instrumentos().forEach(function (r) {
        var d = docsInst(r);
        if (d.et !== NA && !vistos['et' + d.et]) { vistos['et' + d.et] = 1; add(d.et, '', 'Especificación técnica de instrumentos'); }
        if (d.das !== NA && !vistos[d.das]) { vistos[d.das] = 1; var p = plantillasHD().filter(function (x) { return x.id === d.hd; })[0]; add(d.das, '', 'Hoja de datos' + (p ? ' · ' + p.titulo : '')); }
      });
    },
    ids: { form: '#iForm', prev: '#iPrev', estado: '#iEstado', excel: '#iExcel', word: '#iWord', pdf: '#iPdf', vista: '#v-inst' },
    estado: function (G) {
      var f = G[0].filas, io = instrumentos().filter(function (r) { return r.s; }).length;
      return f.length + ' instrumentos · ' + io + ' con E/S · ' + (f.length - io) + ' sin E/S';
    },
    extraForm: function () { return '<fieldset><legend>Anexo A</legend><p class="ayuda ancho">Los instrumentos se editan en la tabla de arriba. Cliente, proyecto, responsables, prefijos de hojas de datos (DAS) y de especificaciones (ET) se toman del proyecto activo; las revisiones, de Configuración.</p></fieldset>'; }
  };
  var K_CIRC = {
    clave: 'docCirc', archivo: 'Listado de circuitos', cols: COLS_CIRC, grupos: gruposCirc, unir: [], nw: ['tagC', 'largo'], izq: ['desc', 'servicio', 'obs', 'ruta', 'planos', 'dGab', 'hGab'], notas: ['N.A.: No Aplica.'],
    titulo: 'LISTADO DE CIRCUITOS DE INSTRUMENTACIÓN Y CONTROL', anexo: 'LISTADO DE CIRCUITOS', objeto: 'listado de circuitos de instrumentación y control',
    codigo: function () { return E().cfg.docCables; },
    alcance: 'Este documento corresponde al listado de circuitos de instrumentación y control del proyecto: cables de señal, troncales multipar, alimentación y comunicaciones, con su origen, destino, tipo de cable, largo estimado y canalización.\n\nLos largos indicados son referenciales y deberán ser verificados en terreno antes del corte de los cables.\n\nTodos los cables deberán ser de diseño probado, de tipo estándar y fabricación reciente, según la especificación técnica de cables de instrumentación.',
    ids: { form: '#cForm', prev: '#cPrev', estado: '#cEstado', excel: '#cExcel', word: '#cWord', pdf: '#cPdf', vista: '#v-circ' },
    estado: function (G) {
      var cs = circuitos(), m = 0; cs.forEach(function (c) { m += +valCirc(c, 'largo') || 0; });
      return cs.length + ' circuitos · ' + cs.filter(function (c) { return c.clase === 'm'; }).length + ' troncales · ' + Math.round(m) + ' m de cable';
    },
    extraForm: function () { return '<fieldset><legend>Anexo A</legend><p class="ayuda ancho">Los circuitos se generan desde el listado de E/S y los lazos (cable de cada señal, troncal de cada caja y alimentación de 4 hilos). El N° y el diseño del cable se comparten con el diagrama de lazo; largo, canalización, suministro y observaciones se editan en la tabla de arriba.</p></fieldset>'; }
  };
  var K = K_IO;
  // Celdas de cabecera en dos filas: grupos combinados horizontalmente, el resto combinado verticalmente
  function cabecera() {
    var f1 = [], f2 = [], i = 0;
    var COLS = K.cols;
    while (i < COLS.length) {
      var g = COLS[i][2];
      if (!g) { f1.push({ t: COLS[i][1], cs: 1, rs: 2, i: i }); f2.push({ t: '', cont: true, i: i }); i++; continue; }
      var j = i; while (j < COLS.length && COLS[j][2] === g) j++;
      f1.push({ t: g, cs: j - i, rs: 1, i: i });
      for (var k = i; k < j; k++) f2.push({ t: K.cols[k][1], cs: 1, i: k });
      i = j;
    }
    return [f1, f2];
  }
  // Rango de filas consecutivas del mismo instrumento (para combinar tag de instrumento y servicio)
  function tramos(filas) {
    var r = []; filas.forEach(function (f, i) { if (K.unir.length && i && !f.reserva && filas[i - 1].tagInst === f.tagInst && !filas[i - 1].reserva) r[r.length - 1][1] = i; else r.push([i, i]); }); return r;
  }

  // ── Datos del documento ──
  function datosDoc() {
    var e = E(), d = e[K.clave] = e[K.clave] || {}, pr = P.activo();
    return {
      codigo: d.codigo || K.codigo() || '', titulo: d.titulo || K.titulo, tipoDoc: d.tipoDoc || 'LISTA DE EQUIPOS', fecha: d.fecha || pr.porFecha || hoy(),
      id: d.id || pr.idCliente || '', rev: pr.rev || '', proyecto: pr.proyecto || '', cliente: pr.cliente || '', empresa: pr.contratista || 'ReyEngi', numero: pr.numero || '',
      anexoA: d.anexoA || K.anexo, anexoB: d.anexoB || '',
      intro: d.intro || (pr.cliente || 'El cliente') + ' ha encargado a ' + (pr.contratista || 'ReyEngi') + ' el desarrollo del proyecto "' + (pr.proyecto || '') + '".\n\nEl presente documento corresponde al ' + K.objeto + ' del proyecto.',
      alcance: d.alcance || K.alcance,
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
    if (e.cfg.docIO && K !== K_IO) add(e.cfg.docIO, '', 'Listado de entradas y salidas');
    if (e.cfg.docInst && K !== K_INST) add(e.cfg.docInst, '', 'Listado de instrumentos');
    if (e.cfg.docCables && K !== K_CIRC) add(e.cfg.docCables, '', 'Listado de circuitos de instrumentación y control');
    if (K.refs) K.refs(add);
    String((e[K.clave] || {}).refs || '').split(/\r?\n/).filter(Boolean).forEach(function (l) { var c = l.split(/\s*;\s*/); add(c[0], c[1] || '', c[2] || ''); });
    return r;
  }

  // ── Vista previa HTML (también sirve para imprimir a PDF) ──
  function cabPagina() { return '<div class="cab"><img class="logo" src="' + LOGO + '" alt="ReyEngi"><span>ReyEngi · Automatización y Control Industrial</span></div>'; }
  function tablaHtml(f, cab) { return '<table>' + (cab ? '<tr>' + cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' : '') + f.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c == null ? '' : c).replace(/\n/g, '<br>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; }
  function parrafos(t) { return String(t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function htmlDoc() {
    var d = datosDoc(), G = K.grupos(), COLS = K.cols, pie = '<p style="margin-top:8mm;font-size:8pt;color:#5A6573;border-top:1px solid #9FB0C3;padding-top:2mm">' + esc(d.codigo + (d.rev !== '' ? ' R' + d.rev : '')) + '</p>';
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
      return (g.titulo ? '<tr class="grp"><td colspan="' + COLS.length + '">' + esc(g.titulo) + '</td></tr>' : '') + g.filas.map(function (f, i) {
        var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0], ini = t[0] === i, rs = t[1] - t[0] + 1;
        return '<tr' + (f.reserva ? ' class="res"' : '') + '>' + COLS.map(function (c) {
          var un = K.unir.indexOf(c[0]) >= 0;
          if (un && !ini) return '';
          var v = f[c[0]]; return '<td' + (un && rs > 1 ? ' rowspan="' + rs + '"' : '') + (K.izq.indexOf(c[0]) >= 0 ? ' class="izq"' : '') + ((K.nw || []).indexOf(c[0]) >= 0 ? ' style="white-space:nowrap"' : '') + '>' + esc(v == null ? '' : v).replace(/\n/g, '<br>') + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }).join('');
    h.push('<div class="pg h">' + encabezadoAnexoHtml(d) + '<table class="io2">' + thead + '<tbody>' + (cuerpo || '<tr><td colspan="' + COLS.length + '">Sin datos</td></tr>') + '</tbody></table>' + (K.notas.length ? '<p style="font-size:8pt;margin-top:3mm"><b>NOTAS:</b><br>' + K.notas.map(function (n, i) { return (i + 1) + '.- ' + esc(n); }).join('<br>') + '</p>' : '') + '</div>');
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
    var k0 = K;
    return cargarLogo().then(function (logo) { K = k0;
      var X = window.XLSX_RE, lb = X.libro(), d = datosDoc(), pr = P.activo(), G = K.grupos(), COLS = K.cols, N = COLS.length;
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
        if (g.titulo) { h.combinar(r, 0, r, N - 1, g.titulo, { b: true, fill: CLARO, color: AZUL, sz: 8 }); r++; }
        var tr = tramos(g.filas);
        g.filas.forEach(function (f, i) {
          var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0];
          COLS.forEach(function (c, ci) {
            var e = { sz: 8, h: K.izq.indexOf(c[0]) >= 0 ? 'left' : 'center', v: 'center', wrap: true, color: f.reserva ? '6B7785' : undefined };
            if (K.unir.indexOf(c[0]) >= 0 && t[1] > t[0]) { if (t[0] === i) h.combinar(r, ci, r + (t[1] - t[0]), ci, f[c[0]], e); }
            else h.celda(r, ci, f[c[0]] == null ? '' : f[c[0]], e);
          });
          h.alto(r, Math.max(24, 4 + 11 * COLS.reduce(function (mx, c) { return Math.max(mx, String(f[c[0]] == null ? '' : f[c[0]]).split('\n').length); }, 1))); r++;
        });
      });
      if (K.notas.length) { r++; h.combinar(r, 0, r + K.notas.length, N - 1, 'NOTAS:\n' + K.notas.map(function (n, i) { return (i + 1) + '.- ' + n; }).join('\n'), { sz: 8, borde: 'none', v: 'top' }); }
      var nom = (d.codigo ? d.codigo + (d.rev !== '' ? ' R' + d.rev : '') + ' ANEXO A' : K.archivo + ' - Anexo A').replace(/[\\/:*?"<>|]+/g, '-') + '.xlsx';
      A.descargar(nom, X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  }

  // ── Word (documento completo) ──
  function word() {
    var k0 = K;
    return cargarLogo().then(function (logo) { K = k0;
      var d = datosDoc(), G = K.grupos(), COLS = K.cols, B = [];
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
        if (g.titulo) filas.push([{ t: g.titulo, cs: COLS.length, b: true, fill: CLARO, color: AZUL, sz: 13 }]);
        var tr = tramos(g.filas);
        g.filas.forEach(function (f, i) {
          var t = tr.filter(function (x) { return x[0] <= i && i <= x[1]; })[0];
          filas.push(COLS.map(function (c) {
            var mg = K.unir.indexOf(c[0]) >= 0 && t[1] > t[0];
            return { t: mg && t[0] !== i ? '' : (f[c[0]] == null ? '' : String(f[c[0]])), sz: 12, c: K.izq.indexOf(c[0]) < 0, vm: mg ? (t[0] === i ? 'start' : 'cont') : null, color: f.reserva ? '6B7785' : null };
          }));
        });
      });
      B.push({ p: (d.titulo + ' · ANEXO A · ' + d.anexoA).toUpperCase(), b: true, c: true, color: AZUL });
      B.push({ tabla: { cab: 2, anchos: anchos, filas: filas } });
      K.notas.forEach(function (n, i) { B.push({ p: (i ? '' : 'NOTAS: ') + (i + 1) + '.- ' + n, sz: 16 }); });
      var bytes = window.DOCX.generar({
        titulo: d.titulo, autor: d.empresa, logo: logo, anchosEncabezado: [42, 86, 42], pie: d.codigo + (d.rev !== '' ? ' R' + d.rev : ''),
        encabezado: [[logo ? { t: '', img: 34, c: true } : { t: 'ReyEngi', b: true, c: true }, { t: d.proyecto, c: true }, { t: d.codigo, b: true, c: true }],
          [{ t: d.cliente, c: true }, { t: d.titulo, c: true, b: true }, { t: 'Rev. ' + d.rev + '  ·  {PAG}', c: true }]],
        bloques: B
      });
      A.descargar(((d.codigo || K.archivo) + (d.rev !== '' ? ' R' + d.rev : '')).replace(/[\\/:*?"<>|]+/g, '-') + '.docx', bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  }

  function pdf() { var c = $('#imp'); c.innerHTML = htmlDoc(); setTimeout(function () { window.print(); }, 300); }

  // ── Formulario y vista de cada documento ──
  function campos() {
    return [
      { g: 'Identificación', c: [['codigo', 'Código del documento', function () { return K.codigo(); }], ['fecha', 'Fecha del documento', function () { return P.activo().porFecha || hoy(); }],
        ['tipoDoc', 'Tipo de documento', function () { return 'LISTA DE EQUIPOS'; }], ['titulo', 'Título', function () { return K.titulo; }], ['id', 'ID / contrato del cliente', function () { return P.activo().idCliente; }]] },
      { g: 'Firmas (roles)', c: [['rolPor', 'Rol de quien prepara', function () { return 'Ingeniero de Proyecto'; }], ['rolReviso', 'Rol de quien revisa', function () { return 'Jefe de Disciplina'; }], ['rolAprobo', 'Rol de quien aprueba', function () { return 'Jefe de Proyecto'; }], ['rolCliente', 'Rol en el cliente', function () { return 'Jefe de Proyecto'; }]] },
      { g: 'Contenido', c: [['intro', 'Introducción', null, 'a'], ['alcance', 'Alcance', null, 'a'], ['refs', 'Referencias adicionales (código ; rev ; nombre, una por línea)', function () { return ''; }, 'a'], ['cambios', 'Control de cambios (rev ; fecha ; página ; descripción ; responsable)', function () { return ''; }, 'a'],
        ['anexoA', 'Título del Anexo A', function () { return K.anexo; }], ['anexoB', 'Anexo B (opcional)', function () { return ''; }]] }
    ];
  }
  function vistaDoc(KK) {
    var I = KK.ids, t = 0;
    function pintarForm() {
      K = KK; var e = E(), dd = datosDoc(), d = e[K.clave];
      $(I.form).innerHTML = campos().map(function (g) {
        return '<fieldset><legend>' + g.g + '</legend>' + g.c.map(function (c) {
          var ph = c[2] ? c[2]() || '' : (c[0] === 'intro' ? dd.intro : dd.alcance);
          return c[3] === 'a' ? '<label class="ancho">' + c[1] + '<textarea rows="4" data-d="' + c[0] + '" placeholder="' + esc(ph) + '">' + esc(d[c[0]] || '') + '</textarea></label>'
            : '<label' + (c[0] === 'titulo' || c[0] === 'tipoDoc' ? ' class="ancho"' : '') + '>' + c[1] + '<input data-d="' + c[0] + '" value="' + esc(d[c[0]] || '') + '" placeholder="' + esc(ph) + '"></label>';
        }).join('') + '</fieldset>';
      }).join('') + K.extraForm(d);
    }
    function pintarPrev() {
      K = KK; var G = K.grupos();
      $(I.prev).innerHTML = htmlDoc();
      $(I.estado).textContent = K.estado(G);
    }
    function poner(x) { K = KK; var d = E()[K.clave] = E()[K.clave] || {}; d[x.dataset.d] = x.type === 'checkbox' ? x.checked : x.value; A.guardar(); }
    $(I.form).addEventListener('input', function (ev) { var x = ev.target; if (!x.dataset.d) return; poner(x); clearTimeout(t); t = setTimeout(pintarPrev, 250); });
    $(I.form).addEventListener('change', function (ev) { var x = ev.target; if (x.dataset.d && (x.type === 'checkbox' || x.tagName === 'SELECT')) { poner(x); pintarPrev(); } });
    $(I.excel).addEventListener('click', function () { K = KK; excel(); });
    $(I.word).addEventListener('click', function () { K = KK; word(); });
    $(I.pdf).addEventListener('click', function () { K = KK; pdf(); });
    return { form: pintarForm, prev: pintarPrev, todo: function () { pintarForm(); pintarPrev(); } };
  }
  var VIO = vistaDoc(K_IO), VINST = vistaDoc(K_INST), VCIRC = vistaDoc(K_CIRC);

  // ── Tabla editable de instrumentos ──
  var CI = [
    { k: 'tag', l: 'TAG', w: 130 }, { k: 'desc', l: 'Descripción', w: 210 }, { k: 'servicio', l: 'Servicio', w: 220 }, { k: 'linea', l: 'Línea / equipo', w: 130 },
    { k: 'pid', l: 'P&ID', w: 140 }, { k: 'plano', l: 'Diagrama de lazo', w: 140 }, { k: 'unilineal', l: 'Diagrama unilineal', w: 120 },
    { k: 'hd', l: 'Hoja de datos (tipo)', w: 220, sel: true }, { k: 'das', l: 'N° hoja de datos', w: 175, ro: true }, { k: 'et', l: 'N° especificación técnica', w: 175 },
    { k: 'obs', l: 'Observaciones', w: 200 }, { k: 'rev', l: 'Rev.', w: 60 }
  ];
  var COMPARTIDOS = ['desc', 'servicio', 'pid']; // viven en las señales del listado de E/S
  function clave(r) { return r.manual ? 'm:' + r.x.id : 'io:' + r.tag; }
  function fila(k) { return instrumentos().filter(function (r) { return clave(r) === k; })[0]; }
  function entrada(r) { // registro editable (se crea al primer cambio en un instrumento que viene del listado E/S)
    if (r.x) return r.x;
    var x = { id: A.uid(), tag: r.tag }; E().inst.push(x); r.x = x; return x;
  }
  function pintarTabla() {
    K = K_INST;
    var q = ($('#iBuscar').value || '').toLowerCase(), Rs = instrumentos(), H = plantillasHD();
    var vis = Rs.filter(function (r) { return !q || (r.tag + ' ' + valInst(r, 'desc') + ' ' + valInst(r, 'servicio')).toLowerCase().indexOf(q) >= 0; });
    $('#tablaInst thead').innerHTML = '<tr><th class="chk"><input type="checkbox" id="iTodo" aria-label="Seleccionar todo"></th><th style="min-width:64px">Origen</th>' + CI.map(function (c) { return '<th style="min-width:' + c.w + 'px">' + c.l + '</th>'; }).join('') + '</tr>';
    $('#tablaInst tbody').innerHTML = vis.map(function (r) {
      var d = docsInst(r), x = r.x || {};
      return '<tr data-r="' + esc(clave(r)) + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + esc(r.tag) + '"></td><td><span class="orig' + (r.s ? ' io' : '') + '">' + (r.s ? r.s.tipo : 'Manual') + '</span></td>' + CI.map(function (c) {
        if (c.k === 'tag' && !r.manual) return '<td><input value="' + esc(r.tag) + '" readonly title="Viene del listado de E/S: cámbialo allí"></td>';
        if (c.sel) {
          var a = autoInst(r, 'hd'), pa = H.filter(function (p) { return p.id === a; })[0];
          return '<td><select data-k="hd"><option value="">' + (pa ? 'Auto · ' + esc(pa.titulo) : 'Auto · sin hoja') + '</option><option value="-"' + (x.hd === '-' ? ' selected' : '') + '>N.A. (no aplica)</option>' +
            H.map(function (p) { return '<option value="' + p.id + '"' + (x.hd === p.id ? ' selected' : '') + '>' + esc(p.titulo) + '</option>'; }).join('') + '</select></td>';
        }
        if (c.ro) return '<td><input value="' + esc(d.das) + '" readonly tabindex="-1"></td>';
        if (r.s && COMPARTIDOS.indexOf(c.k) >= 0) {
          var phs = c.k === 'desc' ? up(ISA.describir(r.tag)) : c.k === 'pid' ? E().cfg.docPid || '' : '';
          return '<td><input data-k="' + c.k + '" class="enlazado" title="Compartido con el listado de E/S y el diagrama de lazo" value="' + esc(r.s[c.k] || '') + '" placeholder="' + esc(phs) + '"></td>';
        }
        var ph = c.k === 'et' ? (d.hd === '-' ? NA : numEt(d.hd) || NA) : autoInst(r, c.k);
        return '<td><input data-k="' + c.k + '" value="' + esc(x[c.k] || '') + '" placeholder="' + esc(ph || '') + '"></td>';
      }).join('') + '</tr>';
    }).join('') || '<tr><td colspan="' + (CI.length + 2) + '" class="vacio">Sin instrumentos. Agrega señales en el listado de E/S o instrumentos sin E/S con «+ Agregar instrumento».</td></tr>';
    var ocultos = E().inst.filter(function (x) { return x.oculto; }).length;
    $('#iCuenta').textContent = Rs.length + ' instrumentos · ' + Rs.filter(function (r) { return r.s; }).length + ' desde el listado de E/S · ' + Rs.filter(function (r) { return !r.s; }).length + ' sin E/S' + (ocultos ? ' · ' + ocultos + ' ocultos' : '');
  }
  var tPrev = 0;
  function cambio() { A.guardar(); clearTimeout(tPrev); tPrev = setTimeout(VINST.prev, 300); }
  $('#tablaInst').addEventListener('input', function (ev) {
    var x = ev.target, k = x.dataset.k, tr = x.closest('tr[data-r]'); if (!k || !tr) return;
    var r = fila(tr.dataset.r); if (!r) return;
    if (r.s && COMPARTIDOS.indexOf(k) >= 0) E().senales.forEach(function (s) { if (s.tag === r.tag) s[k] = x.value; });
    else entrada(r)[k] = x.value;
    if (k === 'tag') tr.dataset.r = clave(r);
    if (k === 'hd' || k === 'tag') { var y = window.scrollY; pintarTabla(); window.scrollTo(0, y); }
    cambio();
  });
  $('#tablaInst').addEventListener('focusin', function (ev) { var tr = ev.target.closest('tr[data-r]'); if (!tr) return; var r = fila(tr.dataset.r); if (r && A.mirarLazo) A.mirarLazo(r.lazo); });
  $('#tablaInst').addEventListener('change', function (ev) { if (ev.target.id === 'iTodo') document.querySelectorAll('#tablaInst .chkf').forEach(function (c) { c.checked = ev.target.checked; }); });
  $('#iBuscar').addEventListener('input', pintarTabla);
  $('#iAgregar').addEventListener('click', function () {
    E().inst.push({ id: A.uid(), tag: '', manual: true }); pintarTabla(); cambio();
    var ult = document.querySelectorAll('#tablaInst tr[data-r^="m:"] input[data-k="tag"]'); if (ult.length) ult[ult.length - 1].focus();
  });
  // Elementos primarios: FIT → FE, LIT → LE, TIT → TE, AIT → AE (mismo lazo y servicio)
  $('#iPrimarios').addEventListener('click', function () {
    var Rs = instrumentos(), hay = {}, n = 0;
    Rs.forEach(function (r) { hay[r.tag] = 1; });
    E().inst.forEach(function (x) { if (x.tag) hay[x.tag] = 1; });
    Rs.forEach(function (r) {
      var a = ISA.analizar(r.tag); if (!/^[FLTA]$/.test(a.variable) || a.modificador || !/^I?T$/.test(a.funciones)) return;
      var nt = r.tag.replace(a.letras, a.variable + 'E'); if (hay[nt]) return;
      hay[nt] = 1; n++;
      E().inst.push({ id: A.uid(), tag: nt, manual: true, servicio: (r.x && r.x.servicio) || '', linea: (r.x && r.x.linea) || '', obs: 'ASOCIADO A ' + r.tag, hd: (r.x && r.x.hd) || '' });
    });
    pintarTabla(); cambio();
    $('#iCuenta').textContent += ' · ' + (n ? n + ' elementos primarios agregados' : 'no faltan elementos primarios');
  });
  $('#iSincronizar').addEventListener('click', function () {
    var e = E(), tags = {}; e.senales.forEach(function (s) { if (s.tag) tags[s.tag] = 1; });
    // Vuelve a mostrar los ocultos y quita registros vacíos de tags que ya no existen en el listado de E/S
    e.inst = e.inst.filter(function (x) { delete x.oculto; if (x.manual) return true; if (tags[x.tag]) return true; return Object.keys(x).some(function (k) { return ['id', 'tag'].indexOf(k) < 0 && x[k]; }) ? (x.manual = true) : false; });
    pintarTabla(); cambio();
  });
  $('#iQuitar').addEventListener('click', function () {
    var ks = []; document.querySelectorAll('#tablaInst .chkf:checked').forEach(function (c) { ks.push(c.closest('tr').dataset.r); });
    if (!ks.length) return;
    var e = E();
    ks.forEach(function (k) {
      var r = fila(k); if (!r) return;
      if (r.manual) e.inst.splice(e.inst.indexOf(r.x), 1); else entrada(r).oculto = true;
    });
    pintarTabla(); cambio();
  });
  function pintarInst() { pintarTabla(); VINST.todo(); }

  // ── Tabla editable de circuitos ──
  var CC = [
    { k: 'tagC', l: 'Tag circuito', w: 150 }, { k: 'equipo', l: 'Tag equipo / instrumento', w: 140 }, { k: 'desc', l: 'Descripción', w: 190 }, { k: 'servicio', l: 'Servicio', w: 220 },
    { k: 'funcion', l: 'Función', w: 170 }, { k: 'tipo', l: 'Tipo de cable', w: 160 }, { k: 'diseno', l: 'Diseño', w: 150 }, { k: 'senal', l: 'Tipo de señal', w: 110 },
    { k: 'dGab', l: 'Desde · gabinete', w: 170 }, { k: 'dEq', l: 'Desde · equipo', w: 120 }, { k: 'hGab', l: 'Hasta · gabinete', w: 170 }, { k: 'hEq', l: 'Hasta · equipo', w: 130 },
    { k: 'largo', l: 'Largo [m]', w: 76 }, { k: 'ducto', l: 'Ducto', w: 110 }, { k: 'ruta', l: 'Ruta de canalización', w: 160 }, { k: 'planos', l: 'Planos relacionados', w: 180 },
    { k: 'suministro', l: 'Suministro', w: 150 }, { k: 'obs', l: 'Observaciones', w: 200 }
  ];
  var CLASE = { f: 'Señal', m: 'Troncal', p: 'Alim.', x: 'Manual' };
  function claveC(c) { return c.key; }
  function filaC(k) { return circuitos().filter(function (c) { return c.key === k; })[0]; }
  function pintarTablaC() {
    var q = ($('#cBuscar').value || '').toLowerCase(), Cs = circuitos();
    var vis = Cs.filter(function (c) { return !q || CC.map(function (x) { return valCirc(c, x.k); }).join(' ').toLowerCase().indexOf(q) >= 0; });
    $('#tablaCirc thead').innerHTML = '<tr><th class="chk"><input type="checkbox" id="cTodo" aria-label="Seleccionar todo"></th><th style="min-width:70px">Origen</th><th style="min-width:80px">Lazo</th>' + CC.map(function (c) { return '<th style="min-width:' + c.w + 'px">' + c.l + '</th>'; }).join('') + '</tr>';
    $('#tablaCirc tbody').innerHTML = vis.map(function (c) {
      var x = c.x || {};
      return '<tr data-c="' + esc(claveC(c)) + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + esc(valCirc(c, 'tagC')) + '"></td><td><span class="orig' + (c.manual ? '' : ' io') + '">' + CLASE[c.clase] + '</span></td><td><input value="' + esc(c.lazo || '') + '" readonly tabindex="-1"></td>' + CC.map(function (col) {
        var k = col.k, enSenal = (c.clase === 'f' || c.clase === 'm') && (k === 'tagC' || k === 'diseno');
        if (c.clase === 'p' && k === 'tagC') return '<td><input value="' + esc(c.auto.tagC) + '" readonly title="Se forma con el tag del instrumento"></td>';
        // Los campos compartidos con la señal muestran el valor guardado en la señal (vacío = automático)
        var v = enSenal ? (c.clase === 'f' ? c.senales[0][k === 'tagC' ? 'cable' : 'cableSpec'] : c.senales[0][k === 'tagC' ? 'cable2' : 'cable2Spec']) : x[k];
        var ph = c.auto[k] == null ? '' : c.auto[k];
        if (enSenal) { var cfg = E().cfg; ph = k === 'tagC' ? (c.clase === 'f' ? ISA.compacto(c.senales[0].tag) + ((c.senales[0].tipo === 'AI' || c.senales[0].tipo === 'AO') ? cfg.sufCableA : cfg.sufCableD) : 'C-' + ISA.compacto(c.senales[0].jb)) : (c.clase === 'f' ? A.resolver(c.senales[0]).cableSpec : cfg.cableMultipar); }
        return '<td><input data-k="' + k + '" value="' + esc(v || '') + '" placeholder="' + esc(String(ph).replace(/\n/g, ' · ')) + '"' + (enSenal ? ' class="enlazado" title="Compartido con el listado de E/S y el diagrama de lazo"' : '') + '></td>';
      }).join('') + '</tr>';
    }).join('') || '<tr><td colspan="' + (CC.length + 3) + '" class="vacio">Sin circuitos. Se generan al agregar señales en el listado de E/S; usa «+ Agregar circuito» para comunicaciones u otros cables.</td></tr>';
    var m = 0; Cs.forEach(function (c) { m += +valCirc(c, 'largo') || 0; });
    var ocultos = E().circ.filter(function (x) { return x.oculto; }).length;
    $('#cCuenta').textContent = Cs.length + ' circuitos · ' + Cs.filter(function (c) { return c.clase === 'f'; }).length + ' de señal · ' + Cs.filter(function (c) { return c.clase === 'm'; }).length + ' troncales · ' + Cs.filter(function (c) { return c.clase === 'p'; }).length + ' de alimentación · ' + Cs.filter(function (c) { return c.manual; }).length + ' manuales · ' + Math.round(m) + ' m' + (ocultos ? ' · ' + ocultos + ' ocultos' : '');
  }
  var tPrevC = 0;
  function cambioC() { A.guardar(); clearTimeout(tPrevC); tPrevC = setTimeout(VCIRC.prev, 300); }
  $('#tablaCirc').addEventListener('input', function (ev) {
    var x = ev.target, k = x.dataset.k, tr = x.closest('tr[data-c]'); if (!k || !tr) return;
    var c = filaC(tr.dataset.c); if (!c) return;
    escribirCirc(c, k, k === 'tagC' ? x.value.toUpperCase() : x.value);
    if (k === 'tagC' && c.clase === 'm') { var y = window.scrollY; pintarTablaC(); window.scrollTo(0, y); var n = document.querySelector('#tablaCirc tr[data-c="m:' + (x.value.toUpperCase() || 'C-' + ISA.compacto(c.senales[0].jb)) + '"] input[data-k="tagC"]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
    cambioC();
  });
  $('#tablaCirc').addEventListener('focusin', function (ev) { var tr = ev.target.closest('tr[data-c]'); if (!tr) return; var c = filaC(tr.dataset.c); if (c && A.mirarLazo) A.mirarLazo(c.lazo); });
  $('#tablaCirc').addEventListener('change', function (ev) { if (ev.target.id === 'cTodo') document.querySelectorAll('#tablaCirc .chkf').forEach(function (c) { c.checked = ev.target.checked; }); });
  $('#cBuscar').addEventListener('input', pintarTablaC);
  $('#cAgregar').addEventListener('click', function () {
    E().circ.push({ key: A.uid(), manual: true, tagC: '', funcion: 'SEÑAL DE COMUNICACIONES' }); pintarTablaC(); cambioC();
    var ult = document.querySelectorAll('#tablaCirc tr[data-c^="x:"] input[data-k="tagC"]'); if (ult.length) ult[ult.length - 1].focus();
  });
  $('#cLargo').addEventListener('click', function () { // largo por defecto a los circuitos sin largo
    var v = prompt('Largo por defecto [m] para los circuitos sin largo:', '50'); if (v == null || v === '' || isNaN(+v)) return;
    circuitos().forEach(function (c) { if (!valCirc(c, 'largo')) escribirCirc(c, 'largo', String(+v)); });
    pintarTablaC(); cambioC();
  });
  $('#cRestaurar').addEventListener('click', function () {
    E().circ.forEach(function (x) { delete x.oculto; });
    // quita registros de circuitos automáticos que ya no existen
    var vivos = {}; circuitos().forEach(function (c) { vivos[c.key] = 1; });
    E().circ = E().circ.filter(function (x) { return x.manual || vivos[x.key]; });
    pintarTablaC(); cambioC();
  });
  $('#cQuitar').addEventListener('click', function () {
    var ks = []; document.querySelectorAll('#tablaCirc .chkf:checked').forEach(function (c) { ks.push(c.closest('tr').dataset.c); });
    ks.forEach(function (k) { var c = filaC(k); if (!c) return; if (c.manual) E().circ.splice(E().circ.indexOf(c.x), 1); else escribirCirc(c, 'oculto', true); });
    if (ks.length) { pintarTablaC(); cambioC(); }
  });
  function pintarCirc() { pintarTablaC(); VCIRC.todo(); }

  // Cambio de tag en el listado de E/S: se arrastra a los registros del listado de instrumentos y de circuitos
  function renombrar(viejo, nuevo) {
    if (!viejo || !nuevo || viejo === nuevo) return;
    var e = E(); if (e.senales.some(function (s) { return s.tag === viejo; })) return;
    (e.inst || []).forEach(function (x) { if (x.tag === viejo && !x.manual) x.tag = nuevo; if (x.obs) x.obs = x.obs.split(viejo).join(nuevo); });
    (e.circ || []).forEach(function (x) { ['equipo', 'dGab', 'hGab', 'obs'].forEach(function (k) { if (x[k]) x[k] = String(x[k]).split(viejo).join(nuevo); }); });
    A.guardar();
  }

  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { doc: VIO.todo, inst: pintarInst, circ: pintarCirc });
  window.LAZOS_DOC = { renombrar: renombrar, circuitos: circuitos, gruposCirc: gruposCirc, tagSenal: tagSenal, descSenal: descSenal, rangoUnidad: rangoUnidad, alarma: alarma, grupos: gruposIO, instrumentos: instrumentos, gruposInst: gruposInst, hdSugerida: hdSugerida,
    excel: function (k) { K = ({ inst: K_INST, circ: K_CIRC })[k] || K_IO; return excel(); }, word: function (k) { K = ({ inst: K_INST, circ: K_CIRC })[k] || K_IO; return word(); }, pdf: pdf,
    html: function (k) { K = ({ inst: K_INST, circ: K_CIRC })[k] || K_IO; return htmlDoc(); } };
  // Si la página se abrió directamente en una de estas pestañas, se pinta ahora
  if (!$('#v-doc').hidden) VIO.todo();
  if (!$('#v-inst').hidden) pintarInst();
  if (!$('#v-circ').hidden) pintarCirc();
})();
