/* Suite ReyEngi · Cruces por tag
 *
 * Une todos los módulos del proyecto activo alrededor del tag de cada instrumento:
 *   Suite 4.0 (base de instrumentos y planos) · Lazos (señales de E/S, tarjetas, listado de instrumentos, circuitos)
 *   Hojas de datos (tablas de aplicación) · Análisis de P&ID (candidatos) · Requisiciones · Montaje · y cualquier otro
 *   módulo que guarde el tag (se busca en todos los datos del proyecto).
 * No guarda un índice propio: cada consulta lee lo que hay, así nunca queda desfasado.
 *
 * API (window.RECruces):
 *   instrumentos()        → lista de instrumentos del proyecto con sus fuentes
 *   porTag(tag)           → { tag, desc, docs:[{g, n, est:'ok'|'falta'|'na', det, href}], señales, otros }
 *   buscar(texto, n)      → instrumentos que coinciden (para el buscador de la cinta)
 *   sincronizar(opc)      → Suite 4.0 ⇄ Lazos y hojas de datos; devuelve un informe
 *   estadoSync()          → cuántos tags faltan en cada lado (sin escribir nada)
 *   analizar(tag), clave(tag)
 * Al cargar una página con ?tag=XXX resalta la primera aparición del tag en la pantalla. */
(function () {
  'use strict';
  if (window.RECruces) return;
  var BASE = (function () { try { return new URL('.', document.currentScript.src).href; } catch (e) { return '../'; } })();
  var PREF = 'reyengi-proy-v1:p:';
  var P = function () { return window.REProyectos; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ── Tags ────────────────────────────────────────────────────────────────────
  // Acepta 100-LIT-0101, LIT-1612, 000-XV-1606, LIT1612, 2200 XV 0180. La clave ignora área y ceros a la izquierda.
  function analizar(t) {
    var s = String(t || '').toUpperCase().trim().replace(/\s+/g, '-');
    var m = /^(?:(\d{1,5})-)?([A-Z]{1,6})-?(\d{1,6})([A-Z]?)$/.exec(s);
    if (!m) return null;
    return { area: m[1] || '', L: m[2], num: m[3], suf: m[4] || '', key: m[2] + '-' + (+m[3]) + m[4], loop: String(+m[3]) + (m[4] || ''), tag: s };
  }
  function clave(t) { var a = analizar(t); return a ? a.key : String(t || '').toUpperCase().trim(); }
  // Señales auxiliares: pertenecen al instrumento principal del mismo lazo (solenoide, finales de carrera, estados del variador…)
  var AUX = /^(ZSO|ZSC|ZSH|ZSL|ZS|ZT|ZI|XY|XA|XL|YS|YL|HS|SI|SC|UA)$/;

  // Tipos de la Suite 4.0: señales y documentos asociados (mismo criterio que el motor de planos)
  var T4 = {
    xv: { n: 'Válvula on/off neumática', sig: [['XY', 'DO'], ['ZSO', 'DI'], ['ZSC', 'DI']], hd: 'xv-neu', mont: '12', et: 'Válvulas y actuadores', valv: 'Cuchilla' },
    xvb: { n: 'Válvula de bola on/off neumática', sig: [['XY', 'DO'], ['ZSO', 'DI'], ['ZSC', 'DI']], hd: 'xv-neu', mont: '12-E', et: 'Válvulas y actuadores', valv: 'Bola' },
    xvc: { n: 'Válvula tipo cono (macho cónico) on/off neumática', sig: [['XY', 'DO'], ['ZSO', 'DI'], ['ZSC', 'DI']], hd: 'xv-neu', mont: '12-F', et: 'Válvulas y actuadores', valv: 'Cono (macho cónico)' },
    cv: { n: 'Válvula de control con posicionador', sig: [['?Y', 'AO']], hd: 'fcv', et: 'Válvulas de control' },
    mov: { n: 'Actuador eléctrico multivuelta', sig: [['HS', 'RED'], ['ZS', 'RED'], ['XY', 'RED']], hd: 'xv-mot', et: 'Válvulas y actuadores' },
    pit: { n: 'Transmisor de presión', sig: [['PIT', 'AI']], hd: 'pit', et: 'Transmisores de presión' },
    fit: { n: 'Flujómetro magnético', sig: [['FIT', 'AI']], hd: 'fit-mag', et: 'Flujómetros' },
    lit: { n: 'Transmisor de nivel radar', sig: [['LIT', 'AI']], hd: 'lit-radar', et: 'Transmisores de nivel' },
    dit: { n: 'Densímetro nuclear', sig: [['DIT', 'AI']], hd: 'dit', et: 'Densímetros' },
    lsh: { n: 'Switch de nivel', sig: [['LSHH', 'DI']], hd: 'lsh-mw', et: 'Switches de nivel' },
    pi: { n: 'Manómetro', sig: [], hd: 'pi', et: 'Manómetros' },
    vdf: { n: 'Variador de frecuencia', sig: [['SC', 'RED'], ['SI', 'RED']], et: 'Variadores' },
    cam: { n: 'Cámara CCTV', sig: [['CAM', 'RED']], hd: 'cam-fija', et: 'CCTV' }
  };
  // Tipo de la 4.0 que corresponde a un instrumento de Lazos, por sus letras y señales
  function tipo4De(L, tipos) {
    var t = tipos || {};
    if (/^XV$/.test(L) || (t.DO && t.DI >= 1 && /V$/.test(L))) return 'xv';
    if (/^[A-Z]V$|^[A-Z]CV$/.test(L) && t.AO) return 'cv';
    if (/^MOV$|^XV$/.test(L) && !t.DO) return 'mov';
    if (/^P(I)?T$/.test(L)) return 'pit';
    if (/^F(I)?T$/.test(L)) return 'fit';
    if (/^L(I)?T$/.test(L)) return 'lit';
    if (/^D(I)?T$/.test(L)) return 'dit';
    if (/^LS(HH|H|L|LL)?$/.test(L)) return 'lsh';
    if (/^PI$/.test(L)) return 'pi';
    if (/^(VDF|VFD|SC|SI)$/.test(L)) return 'vdf';
    if (/^(CAM|CCTV)$/.test(L)) return 'cam';
    return '';
  }
  function esRed(con) { return /^(SEG|SW|NSW|RED)/i.test(String(con || '')); }

  // ── Lectura de todo el proyecto ─────────────────────────────────────────────
  function crudo() {   // { sub: texto JSON } de todos los módulos del proyecto activo
    var o = {}; if (!P()) return o;
    var pre = PREF + P().activoId() + ':';
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(pre) === 0) o[k.slice(pre.length)] = localStorage.getItem(k) || ''; } } catch (e) {}
    return o;
  }
  function json(txt) { try { return JSON.parse(txt); } catch (e) { return null; } }
  var NOMBRE_MOD = { lazos: 'Lazos, E/S y listados', suite4: 'Suite 4.0', 'suite4-idx': 'Suite 4.0', pid: 'Análisis de P&ID', requisiciones: 'Requisiciones', montaje: 'Detalles de montaje',
    arquitectura: 'Arquitectura de control', gestion: 'Control documental', flujo: 'Flujo de ingeniería', normativa: 'Normativa', dibujo: 'Dibujo', espesador: 'Simulador', cambios: 'Registro de cambios', fotos: 'Fotos de terreno' };
  function nombreMod(sub) {
    if (NOMBRE_MOD[sub]) return NOMBRE_MOD[sub];
    if (/^hoja:/.test(sub)) return 'Hoja de datos ' + sub.slice(5);
    if (/^et:/.test(sub)) return 'Especificación ' + sub.slice(3);
    return sub;
  }
  var HREF_MOD = { lazos: 'lazos/#io', suite4: '', pid: 'pid/', requisiciones: 'requisiciones/', montaje: 'montajes.html#montajes', arquitectura: 'arquitectura/', gestion: 'documentos/', flujo: 'flujo/', normativa: 'normativa/' };
  function hrefMod(sub, tag) {
    var q = tag ? '?tag=' + encodeURIComponent(tag) : '';
    if (/^hoja:/.test(sub)) return BASE + 'hojas-datos/' + q + '#h=' + encodeURIComponent(sub.slice(5));
    if (/^et:/.test(sub)) return BASE + 'especificaciones/' + q;
    var h = HREF_MOD[sub]; if (!h) return '';
    var i = h.indexOf('#'); return BASE + (i >= 0 ? h.slice(0, i) + q + h.slice(i) : h + q);
  }
  // Conjunto de claves de tag presentes en un texto (para la búsqueda en todos los módulos)
  var TOK = /(?:^|[^A-Z0-9])(?:\d{1,5}-)?([A-Z]{1,6})[- ]?(\d{1,6})([A-Z]?)(?![A-Z0-9])/g;
  function claves(txt) {
    var S = {}, t = String(txt || '').toUpperCase(), m; TOK.lastIndex = 0;
    while ((m = TOK.exec(t))) S[m[1] + '-' + (+m[2]) + m[3]] = 1;
    return S;
  }

  function instrumentos() {
    var R = crudo(), M = {}, orden = [];
    function inst(tag, o) {
      var a = analizar(tag); if (!a) return null;
      var x = M[a.key];
      if (!x) { x = M[a.key] = { key: a.key, tag: a.tag, a: a, desc: '', tipo4: '', con: '', pid: '', fuentes: {}, sig: [], hd: [], pidCand: [], en: {} }; orden.push(x); }
      if (o) Object.keys(o).forEach(function (k) { if (o[k] && !x[k]) x[k] = o[k]; });
      return x;
    }
    // Suite 4.0
    var S4 = json(R.suite4), IDX = json(R['suite4-idx']) || {};
    (S4 && S4.ins || []).forEach(function (r) { var x = inst(r.tag, { desc: r.desc, tipo4: r.tipo, con: r.con, pid: r.pid }); if (x) { x.fuentes.s4 = r; x.tag = analizar(r.tag).tag; } });
    // Lazos: señales principales primero y luego las auxiliares en su lazo
    var E = json(R.lazos) || {}, aux = [];
    (E.senales || []).forEach(function (s) {
      var a = analizar(s.tag); if (!a) return;
      if (AUX.test(a.L)) { aux.push([s, a]); return; }
      var x = inst(s.tag, { desc: s.servicio || s.desc }); x.fuentes.lazos = true; x.sig.push(s); if (!x.con && s.jb) x.con = s.jb;
    });
    aux.forEach(function (p) {
      var s = p[0], a = p[1], x = null;
      orden.forEach(function (y) { if (!x && y.a.loop === a.loop && (!y.a.area || !a.area || y.a.area === a.area) && (/V$|^MOV$|^VDF$/.test(y.a.L) || y.fuentes.s4)) x = y; });
      if (!x) orden.forEach(function (y) { if (!x && y.a.loop === a.loop && (!y.a.area || !a.area || y.a.area === a.area)) x = y; });
      if (!x) x = inst(s.tag, { desc: s.servicio });
      x.fuentes.lazos = true; x.sig.push(s); if (!x.con && s.jb) x.con = s.jb;
    });
    (E.inst || []).forEach(function (r) { if (!r.tag || r.oculto) return; var x = inst(r.tag, { desc: r.servicio || r.desc, pid: r.pid }); if (x) { x.fuentes.lazos = true; x.instLazos = r; } });
    // Hojas de datos: filas de las tablas de aplicación editadas en el proyecto (las de ejemplo no cuentan)
    Object.keys(R).forEach(function (sub) {
      if (!/^hoja:/.test(sub)) return; var d = json(R[sub]); if (!d || !d.apl) return;
      d.apl.forEach(function (f, i) { if (!f || !f[0]) return; var x = inst(f[0], { desc: f[1] }); if (x) { x.fuentes.hd = true; x.hd.push({ id: sub.slice(5), fila: i + 1 }); } });
    });
    // P&ID: candidatos leídos de los planos
    var PD = json(R.pid) || {};
    (PD.cand || []).forEach(function (c) {
      if (!c.letras || !c.num || c.estado === 'descartado') return;
      var x = inst((c.area ? c.area + '-' : '') + c.letras + '-' + c.num + (c.suf || ''), { desc: c.servicio, pid: c.hoja });
      if (x) { x.fuentes.pid = true; x.pidCand.push(c); }
    });
    // Presencia en cualquier otro dato del proyecto
    Object.keys(R).forEach(function (sub) {
      if (sub === 'cambios' || sub === 'suite4-idx') return;
      var K = claves(R[sub]);
      orden.forEach(function (x) { if (K[x.key]) x.en[sub] = 1; });
    });
    var FO = json(R.fotos) || {};
    orden.forEach(function (x) {
      x.fotos = (FO.conteo || {})[x.key] || 0;
      var d = IDX.tags && (IDX.tags[x.key] || IDX.tags[x.tag]); if (d) x.idx = d;
      if (!x.tipo4) { var ty = {}; x.sig.forEach(function (s) { ty[s.tipo] = (ty[s.tipo] || 0) + 1; }); x.tipo4Sug = tipo4De(x.a.L, ty); }
    });
    return orden.sort(function (a, b) { return (+a.a.num - +b.a.num) || (a.a.L < b.a.L ? -1 : a.a.L > b.a.L ? 1 : 0); });
  }

  // ── Documentos de un tag ────────────────────────────────────────────────────
  function porTag(tag, lista) {
    var k = clave(tag), L = lista || instrumentos(), x = null;
    L.forEach(function (y) { if (y.key === k) x = y; });
    if (!x) return null;
    var t = x.tag, q = '?tag=' + encodeURIComponent(t), D = [], ti = T4[x.tipo4 || x.tipo4Sug] || null, hw = ti && ti.sig.some(function (s) { return s[1] !== 'RED'; }) && !esRed(x.con);
    function doc(g, n, est, det, href) { D.push({ g: g, n: n, est: est, det: det || '', href: href || '' }); }
    // Base de datos
    doc('Base', 'Instrumento en la Suite 4.0', x.fuentes.s4 ? 'ok' : 'falta', x.fuentes.s4 ? (ti ? ti.n : x.tipo4) + (x.con ? ' · ' + x.con : '') : 'No está en la base del motor de planos', BASE + '#ins=' + encodeURIComponent(x.fuentes.s4 ? x.fuentes.s4.tag : t));
    var conCanal = x.sig.filter(function (s) { return s.mod && s.canal !== '' && s.canal != null; }).length;
    if (x.sig.length || hw) doc('Base', 'Señales de E/S', !x.sig.length ? 'falta' : conCanal === x.sig.length ? 'ok' : 'falta',
      x.sig.length ? x.sig.map(function (s) { return s.tag + ' ' + s.tipo; }).join(' · ') + (conCanal < x.sig.length ? ' · ' + (x.sig.length - conCanal) + ' sin tarjeta y canal' : '') : 'Faltan en Lazos (usa Sincronizar)', BASE + 'lazos/' + q + '#io');
    // Diagramas y planos
    var lz = x.sig.length ? ((analizar(x.sig[0].tag).area ? analizar(x.sig[0].tag).area + '-' : '') + analizar(x.sig[0].tag).num) : '';
    if (x.sig.length || hw) doc('Diagramas', 'Diagrama de lazo (Lazos)', x.sig.length ? 'ok' : 'falta', lz ? 'Lazo ' + lz : '', lz ? BASE + 'lazos/#lazo=' + encodeURIComponent(lz) : BASE + 'lazos/#lazos');
    var docs4 = x.idx && x.idx.docs || [];
    docs4.forEach(function (d) { doc('Planos 4.0', d.title, d.plano ? 'ok' : 'na', d.code + (d.plano ? ' · plano dibujado' + (d.rev ? ' rev. ' + d.rev : '') : ' · sin plano dibujado'), BASE + '#ins=' + encodeURIComponent(x.fuentes.s4 ? x.fuentes.s4.tag : t)); });
    if (x.con && !/^(DIRECTO|LOCAL)$/.test(x.con)) doc('Diagramas', esRed(x.con) ? 'Segmento o red ' + x.con : 'Interconexionado ' + x.con, 'ok', '', BASE + '#ins=' + encodeURIComponent(t));
    // Listados
    doc('Listados', 'Listado de instrumentos', x.fuentes.lazos || x.fuentes.s4 ? 'ok' : 'falta', '', BASE + 'lazos/' + q + '#inst');
    if (x.sig.length) doc('Listados', 'Listado de circuitos y E/S', 'ok', x.sig.length + ' señal(es) con su cable y circuito', BASE + 'lazos/' + q + '#circ');
    // Documentos técnicos
    var hdId = ti && ti.hd;
    if (x.hd.length) x.hd.forEach(function (h) { doc('Documentos', 'Hoja de datos ' + h.id, 'ok', 'Fila ' + h.fila + ' de la tabla de aplicación', BASE + 'hojas-datos/' + q + '#h=' + encodeURIComponent(h.id)); });
    else if (ti && ti.sig !== undefined && x.tipo4 !== 'vdf') doc('Documentos', 'Hoja de datos' + (hdId ? ' ' + hdId : ''), 'falta', 'El tag no figura en la tabla de aplicación', BASE + 'hojas-datos/' + (hdId ? '#h=' + hdId : ''));
    if (ti) doc('Documentos', 'Especificación técnica · ' + ti.et, Object.keys(x.en).some(function (s) { return /^et:/.test(s); }) ? 'ok' : 'na', 'Por familia', BASE + 'especificaciones/');
    if (ti && ti.mont) doc('Montaje', 'Detalle típico ' + ti.mont, 'ok', ti.n, BASE + 'montajes.html#montajes');
    else if (x.en.montaje) doc('Montaje', 'Detalle de montaje', 'ok', '', BASE + 'montajes.html#montajes');
    // P&ID y compras
    if (x.pid || x.pidCand.length) doc('P&ID', 'P&ID ' + (x.pid || ''), 'ok', x.pidCand.length ? x.pidCand.length + ' marca(s) en el análisis de P&ID' : 'Declarado en la base', BASE + 'pid/' + q);
    else doc('P&ID', 'P&ID', 'falta', 'Sin plano P&ID asociado', BASE + 'pid/');
    doc('Compras', 'Requisición de compra', x.en.requisiciones ? 'ok' : 'falta', x.en.requisiciones ? '' : 'El tag no figura en ninguna requisición', BASE + 'requisiciones/' + q);
    doc('Terreno', 'Fotos de terreno', x.fotos ? 'ok' : 'na', x.fotos ? x.fotos + ' foto(s) o planos mejorados' : 'Sin fotos: puedes mejorar y adjuntar una', BASE + 'imagen/' + q);
    var ya = { lazos: 1, suite4: 1, pid: 1, requisiciones: 1, montaje: 1, fotos: 1 };
    var otros = Object.keys(x.en).filter(function (s) { return !ya[s] && !/^hoja:/.test(s); }).map(function (s) { return { sub: s, n: nombreMod(s), href: hrefMod(s, t) }; });
    return { tag: t, key: x.key, desc: x.desc, tipo: ti ? ti.n : '', con: x.con, x: x, docs: D, otros: otros,
      ok: D.filter(function (d) { return d.est === 'ok'; }).length, falta: D.filter(function (d) { return d.est === 'falta'; }).length };
  }

  function buscar(q, n) {
    var t = String(q || '').toUpperCase().replace(/\s+/g, ''); if (t.length < 2) return [];
    var L = instrumentos(), r = [];
    L.forEach(function (x) {
      var h = (x.tag + ' ' + x.key + ' ' + (x.desc || '')).toUpperCase(), i = h.replace(/\s+/g, '').indexOf(t);
      if (i < 0) { var w = String(q).toUpperCase().split(/\s+/).filter(Boolean); if (!w.every(function (p) { return h.indexOf(p) >= 0; })) return; i = 50; }
      r.push([x, i]);
    });
    return r.sort(function (a, b) { return a[1] - b[1]; }).slice(0, n || 8).map(function (p) { return p[0]; });
  }

  // ── Sincronización Suite 4.0 ⇄ Lazos ⇄ hojas de datos ──────────────────────
  function cargarPlantillas() {
    if (window.HD && window.HD.plantillas && window.HD.plantillas.length > 40) return Promise.resolve(window.HD);
    var arch = ['plantillas.js', 'plantillas2.js', 'plantillas3.js', 'plantillas4.js'];
    return arch.reduce(function (pr, a) { return pr.then(function () { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = BASE + 'hojas-datos/' + a; s.onload = ok; s.onerror = function () { no(new Error('No se pudo cargar ' + a)); }; document.head.appendChild(s); }); }); }, Promise.resolve())
      .then(function () { return window.HD; });
  }
  function uid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function areaWeb(E) {   // ¿las señales del proyecto llevan área? (100-LIT-0101); se usa el área más frecuente
    var c = {}; (E.senales || []).forEach(function (s) { var a = analizar(s.tag); if (a && a.area) c[a.area] = (c[a.area] || 0) + 1; });
    var best = '', n = 0; Object.keys(c).forEach(function (k) { if (c[k] > n) { n = c[k]; best = k; } }); return best;
  }
  function estadoSync() {
    var L = instrumentos(), a4 = 0, aL = 0, sinTipo = [];
    L.forEach(function (x) {
      var ti = T4[x.tipo4]; if (x.fuentes.s4 && ti && ti.sig.some(function (s) { return s[1] !== 'RED'; }) && !esRed(x.con) && !x.sig.length) aL++;
      if (!x.fuentes.s4 && (x.fuentes.lazos || x.fuentes.hd || x.fuentes.pid)) { if (x.tipo4Sug) a4++; else sinTipo.push(x.tag); }
    });
    return { aLazos: aL, aSuite4: a4, sinTipo: sinTipo, total: L.length };
  }
  // Instrumentos de Lazos, hojas de datos o P&ID que aún no están en la Suite 4.0, ya con su tipo (los sin tipo equivalente van a «sinTipo»)
  function nuevosParaSuite4(L, sinTipo) {
    var r = [];
    (L || instrumentos()).forEach(function (x) {
      if (x.fuentes.s4 || !(x.fuentes.lazos || x.fuentes.hd || x.fuentes.pid)) return;
      var ty = x.tipo4Sug; if (!ty) { if (sinTipo) sinTipo.push(x.tag); return; }
      var a = x.a, hasAI = x.sig.some(function (s) { return s.tipo === 'AI'; });
      r.push({ tag: a.L + '-' + a.num + a.suf, desc: x.desc || '', tipo: ty, con: x.con || (ty === 'pi' ? 'LOCAL' : 'DIRECTO'), pid: x.pid || (x.pidCand[0] && x.pidCand[0].hoja) || '', alim: hasAI ? 'loop' : ty === 'xv' ? '24VDC' : '120VAC', origen: 'Suite web' });
    });
    return r;
  }
  function sincronizar(o) {
    o = Object.assign({ aLazos: true, aSuite4: true, aHojas: true }, o || {});
    var pr = P(); if (!pr) return Promise.reject(new Error('Sin proyecto activo.'));
    var L = instrumentos(), inf = { senales: 0, instLazos: 0, suite4: 0, hojas: 0, sinTipo: [] };
    var E = pr.leer('lazos', null) || { senales: [], lazos: {}, inst: [], modulos: [] };
    E.senales = E.senales || []; E.lazos = E.lazos || {}; E.inst = E.inst || [];
    var S4 = pr.leer('suite4', null);
    var ar = (S4 && S4.proy && S4.proy.area) || areaWeb(E);
    if (o.aLazos) L.forEach(function (x) {
      var r = x.fuentes.s4, ti = r && T4[r.tipo]; if (!ti) return;
      var a = analizar(r.tag), tagW = function (letras) { return (ar ? ar + '-' : '') + letras + '-' + a.num + a.suf; };
      var io = ti.sig.filter(function (s) { return s[1] !== 'RED'; });
      if (io.length && !esRed(r.con) && r.con !== 'LOCAL') {
        io.forEach(function (s) {
          var letras = s[0].indexOf('?') >= 0 || (s[0] === 'XY' && s[1] === 'DO') ? a.L : s[0];   // convención de Lazos: la salida lleva el tag de la válvula (XV, FV)
          var ya = E.senales.some(function (w) { var b = analizar(w.tag); if (!b || b.loop !== a.loop || w.tipo !== s[1] || (a.area && b.area && ar && b.area !== ar)) return false; return b.L === letras || s[1] === 'DO' || ((s[1] === 'AO' || s[1] === 'AI') && b.L[0] === letras[0]); });
          if (ya) return;
          E.senales.push({ id: uid(), tag: tagW(letras), tipo: s[1], hilos: 2, servicio: r.desc || '', lazo: '', canal: '', jb: /^JB/i.test(r.con) ? r.con : '', origen: 'Suite 4.0' });
          inf.senales++;
        });
        var lz = (ar ? ar + '-' : '') + a.num + a.suf; if (r.desc && !(E.lazos[lz] || {}).servicio) E.lazos[lz] = Object.assign({}, E.lazos[lz] || {}, { servicio: r.desc });
      } else if (!E.inst.some(function (i) { return clave(i.tag) === a.key; }) && !E.senales.some(function (w) { return clave(w.tag) === a.key; })) {
        E.inst.push({ id: uid(), tag: r.tag, manual: true, servicio: r.desc || '', pid: r.pid || '', obs: 'DESDE SUITE 4.0' + (r.con ? ' · ' + r.con : '') }); inf.instLazos++;
      }
    });
    if (o.aSuite4) {
      var nv = nuevosParaSuite4(L, inf.sinTipo);
      if (nv.length) { S4 = S4 || {}; S4.ins = (S4 && Array.isArray(S4.ins) ? S4.ins : []).concat(nv); inf.suite4 = nv.length; }
    }
    var tareas = Promise.resolve();
    if (o.aHojas) tareas = cargarPlantillas().then(function (HD) {
      var porId = {}; (HD && HD.plantillas || []).forEach(function (p) { porId[p.id] = p; });
      var lista = (S4 && S4.ins) || [];
      lista.forEach(function (r) {
        var ti = T4[r.tipo], pl = ti && ti.hd && porId[ti.hd]; if (!pl || !pl.aplicacion) return;
        var d = pr.leer('hoja:' + pl.id, null) || { v: {}, apl: null, prov: {}, notas: [], revs: null };
        var filas = d.apl ? d.apl : [], k = clave(r.tag);
        if (filas.some(function (f) { return f && clave(f[0]) === k; })) return;
        var cols = pl.aplicacion.columnas || [], f = cols.map(function (c) {
          var t = String(c.t || c || '').toUpperCase();
          if (/^TAG/.test(t)) return (ar ? ar + '-' : '') + r.tag;
          if (/SERVICIO/.test(t)) return r.desc || '';
          if (/P&ID|PID/.test(t)) return r.pid || '';
          if (/DETALLE|MONTAJE/.test(t)) return ti.mont && ti.mont.length > 2 ? ti.mont : '';
          if (/^TIPO/.test(t) && ti.valv) return ti.valv;
          if (/RANGO/.test(t)) return r.rango || '';
          return '';
        });
        if (!cols.length) f = [r.tag, r.desc || ''];
        filas.push(f); d.apl = filas; pr.escribir('hoja:' + pl.id, d); inf.hojas++;
      });
    }).catch(function (e) { inf.errorHojas = e.message; });
    return tareas.then(function () {
      if (inf.senales || inf.instLazos) pr.escribir('lazos', E);
      if (inf.suite4) pr.escribir('suite4', S4);
      try { window.dispatchEvent(new CustomEvent('re-cruces', { detail: inf })); } catch (e) {}
      return inf;
    });
  }

  // ── Resaltar el tag al llegar desde otro módulo (?tag=XXX) ──────────────────
  function resaltarDesdeURL() {
    var tag = ''; try { tag = new URLSearchParams(location.search).get('tag') || ''; } catch (e) {}
    if (!tag) return;
    var k = clave(tag), t0 = Date.now();
    var st = document.createElement('style');
    st.textContent = '.re-tag-hit{outline:3px solid #5DBACB!important;outline-offset:2px;animation:reTagHit 1.6s ease-out 2;scroll-margin:120px}@keyframes reTagHit{0%{box-shadow:0 0 0 0 rgba(93,186,203,.8)}100%{box-shadow:0 0 0 14px rgba(93,186,203,0)}}' +
      '.re-tag-aviso{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99;background:#0F2036;color:#E6EDF5;border:1px solid #5DBACB;border-radius:8px;padding:8px 12px;font:600 13px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}';
    document.head.appendChild(st);
    function intentar() {
      var cand = document.querySelectorAll('td,th,li,input,textarea,b,span,div,button,text');
      for (var i = 0; i < cand.length; i++) {
        var e = cand[i]; if (e.closest('#rcRes,.rs-arbol,.re-tag-aviso,nav,header')) continue;
        var v = e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' ? e.value : (e.children.length > 2 ? '' : e.textContent);
        if (!v || v.length > 60) continue;
        var a = analizar(v.trim()); if (!a || a.key !== k) continue;
        var tr = e.closest('tr') || e; tr.classList.add('re-tag-hit'); tr.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(function () { tr.classList.remove('re-tag-hit'); }, 6000);
        return true;
      }
      return false;
    }
    (function ciclo() {
      if (intentar()) return;
      if (Date.now() - t0 < 6000) return setTimeout(ciclo, 350);
      var av = document.createElement('div'); av.className = 're-tag-aviso'; av.textContent = tag + ' no aparece en esta vista.'; document.body.appendChild(av); setTimeout(function () { av.remove(); }, 4000);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(resaltarDesdeURL, 500); }); else setTimeout(resaltarDesdeURL, 500);

  window.RECruces = { BASE: BASE, T4: T4, analizar: analizar, clave: clave, instrumentos: instrumentos, porTag: porTag, buscar: buscar,
    sincronizar: sincronizar, estadoSync: estadoSync, nuevosParaSuite4: nuevosParaSuite4, nombreMod: nombreMod, hrefMod: hrefMod, esc: esc, tipo4De: tipo4De };
})();
