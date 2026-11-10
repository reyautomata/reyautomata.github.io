/* Análisis de P&ID · Suite ReyEngi
 * 1) Extrae instrumentos desde DXF (bloques con atributos), TXT/CSV de atributos (ATTOUT / extracción de datos),
 *    PDF con texto (pdf.js) o un archivo JSON de extracción; en PDF sin texto permite marcar cada burbuja a mano.
 * 2) Revisión: el revisor valida, corrige o rechaza cada instrumento viendo su ubicación en el plano y lo cruza
 *    con el listado de instrumentos existente (Excel).
 * 3) Exporta lo validado al proyecto activo: señales al listado de E/S (lazos, circuitos) y el resto al listado de instrumentos.
 */
(function () {
  'use strict';
  var P = window.REProyectos, ISA = window.ISA;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var uid = function () { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var hoy = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };

  // ── Estado (por proyecto) ──
  var S;
  function cargar() { S = P.leer('pid', null) || {}; S.hojas = S.hojas || []; S.cand = S.cand || []; S.listado = S.listado || null; S.revisor = S.revisor || ''; }
  var tG = 0;
  function guardar() { clearTimeout(tG); tG = setTimeout(function () { if (!P.escribir('pid', S)) toast('No se pudo guardar: el almacenamiento del navegador está lleno.'); }, 200); }
  function toast(t, ms) { var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, ms || 4500); }

  // ── Archivos de plano (PDF o geometría DXF) en IndexedDB: no caben en el almacenamiento normal ──
  var IDB = null;
  function db() {
    if (IDB) return IDB;
    IDB = new Promise(function (ok, mal) {
      try { var r = indexedDB.open('reyengi-pid', 1); r.onupgradeneeded = function () { r.result.createObjectStore('hojas'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); }; } catch (e) { mal(e); }
    });
    return IDB;
  }
  function idbPut(k, v) { return db().then(function (d) { return new Promise(function (ok) { var t = d.transaction('hojas', 'readwrite'); t.objectStore('hojas').put(v, k); t.oncomplete = ok; t.onerror = ok; }); }).catch(function () {}); }
  function idbGet(k) { return db().then(function (d) { return new Promise(function (ok) { var r = d.transaction('hojas').objectStore('hojas').get(k); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(null); }; }); }).catch(function () { return null; }); }
  function idbDel(k) { return db().then(function (d) { d.transaction('hojas', 'readwrite').objectStore('hojas').delete(k); }).catch(function () {}); }

  // ── Reglas ISA para reconocer letras de instrumento ──
  var PRIM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', SIG = 'ABCDEGHIKLMNOPQRSTUVWXYZ';
  var NO_TAG = { DE: 1, LA: 1, EL: 1, EN: 1, NO: 1, SI: 1, AND: 1, THE: 1, FOR: 1, TO: 1, OF: 1, REV: 1, PLN: 1, PID: 1, NOTA: 1, NOTE: 1, VER: 1, SEE: 1, TIPO: 1, TYPE: 1, MIN: 1, MAX: 1, DN: 1, NPS: 1, CL: 1, SCH: 1, RF: 1, NC: 1, NA: 1, FC: 1, FO: 1, FL: 1, LO: 1, LC: 1, PLC: 1, DCS: 1, MCC: 1, CCM: 1, VDF: 1, VSD: 1, UPS: 1, HMI: 1, TK: 1, BN: 1, CV: 1, PP: 1, PU: 1, CH: 1, SC: 1, CY: 1, FE2: 1, ID: 1, OD: 1, QTY: 1, SPEC: 1 };
  function esLetras(t) {
    t = String(t || '').toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(t) || NO_TAG[t]) return false;
    if (PRIM.indexOf(t[0]) < 0) return false;
    for (var i = 1; i < t.length; i++) if (SIG.indexOf(t[i]) < 0) return false;
    return t.length >= 2 || t === 'M';
  }
  var RX_NUM = /^\d{2,6}[A-Z]?$/;
  function partirNum(n) { var m = /^(\d+)([A-Z]?)$/.exec(String(n || '').toUpperCase()); return m ? { num: m[1], suf: m[2] } : { num: String(n || ''), suf: '' }; }
  function limpiarAtt(v) { return String(v == null ? '' : v).replace(/\\[A-Za-z][^;\\]*;/g, '').replace(/\\P/g, ' ').replace(/[{}]/g, '').replace(/^<>$/, '').replace(/%%[cdpCDP]/g, '').trim(); }

  // Tipo de señal sugerido a partir de las letras (el revisor lo confirma)
  function tipoSugerido(l) {
    l = String(l || '').toUpperCase(); var v = l[0], f = l.slice(1);
    if (!l) return '';
    if (/^(HS|HSS|PB|HIC)$/.test(l)) return l === 'HIC' ? 'AO' : 'DI';
    if (/^[A-Z]D?E$/.test(l) || /^[A-Z]{1,2}G$/.test(l) || /^[A-Z]D?I$/.test(l) || /^[A-Z](W|X|P)$/.test(l)) return 'NA';
    if (/^Z[SI](O|C|H|L|HH|LL)?$/.test(l)) return 'DI';
    if (/^XV$|^XY$|^YV$|^SDV$|^[A-Z]SV$|^BDV$/.test(l)) return 'DO';
    if (/^(F|L|P|T|PD|A)C?V$/.test(l)) return 'AO';
    if (/^(F|L|P|T|PD|A)Y$/.test(l)) return 'AO';
    if (/^Y[LASE]$|^XA$|^XS$|^XL$|^YI$/.test(l)) return 'DI';
    if (/^Y[CK]$/.test(l)) return 'DO';
    if (/(IT|T|QT|IQT)$/.test(f) || /^[A-Z]{1,2}T$/.test(l)) return 'AI';
    if (/S(H|L|HH|LL|HL)?$/.test(f) && v !== 'H') return 'DI';
    if (/A(H|L|HH|LL)?$/.test(f)) return 'DI';
    if (/IC$|C$/.test(f)) return 'AI';
    return '';
  }
  var TIPOS = ['', 'AI', 'AO', 'DI', 'DO', 'NA'];
  var TIPO_TXT = { '': '—', AI: 'AI', AO: 'AO', DI: 'DI', DO: 'DO', NA: 'Sin E/S' };

  function tagDe(c) { var l = String(c.letras || '').toUpperCase(), n = String(c.num || '') + String(c.suf || ''); if (!l && !n) return ''; return (c.area ? c.area + '-' : '') + l + (n ? '-' + n : ''); }
  function clave(c) { return String(c.letras || '').toUpperCase() + '|' + String(c.num || '').replace(/^0+/, '') + String(c.suf || '').toUpperCase(); }
  function nuevoCand(o, hoja) {
    var c = Object.assign({ id: uid(), hoja: hoja ? hoja.id : '', pag: 1, x: null, y: null, area: hoja ? hoja.area || '' : '', letras: '', num: '', suf: '', tipo: '', servicio: '', equipo: '', nota: '', conf: 'media', origen: '', estado: 'pendiente' }, o);
    c.letras = String(c.letras || '').toUpperCase(); if (!c.area && hoja) c.area = hoja.area || '';
    if (!c.tipo) c.tipo = tipoSugerido(c.letras);
    return c;
  }
  var SIN_DIBUJO = /^(Atributos|Extracción|Manual|Listado|Desde listado)/;
  function agregarHoja(nombre, origen, extra) {
    var h = Object.assign({ id: uid(), nombre: nombre, plano: planoDesdeNombre(nombre), area: '', origen: origen, fecha: hoy() }, extra || {});
    // Un mismo plano cargado como dibujo (DXF/PDF) y como datos (atributos/JSON) se une en una sola hoja
    var nuevoSin = SIN_DIBUJO.test(origen), igual = S.hojas.filter(function (x) { return norm(x.plano) === norm(h.plano) && SIN_DIBUJO.test(x.origen) !== nuevoSin && x.origen.indexOf(' + ') < 0; })[0];
    if (igual) {
      if (!nuevoSin) { ['ancho', 'alto', 'paginas', 'tipoVista'].forEach(function (k) { if (h[k] != null) igual[k] = h[k]; }); }
      igual.origen = nuevoSin ? igual.origen + ' + ' + origen : origen + ' + ' + igual.origen;
      if (!igual.area && h.area) igual.area = h.area;
      return igual;
    }
    if (!h.area) { var m = /-(\d{4})-PI-PID/i.exec(nombre) || /(\d{4})-[A-Z]{2,3}-PID/i.exec(nombre); h.area = m ? m[1] : ''; }
    S.hojas.push(h); return h;
  }
  function planoDesdeNombre(n) { var m = /([A-Z0-9]+(?:-[A-Z0-9]+){2,})/i.exec(String(n).replace(/\.[a-z0-9]+$/i, '')); return m ? m[1].toUpperCase().replace(/-(R|REV)[A-Z0-9]{1,2}$/, '') : String(n).replace(/\.[a-z0-9]+$/i, ''); }
  // Evita duplicados dentro de una misma hoja (mismo tag y casi la misma posición)
  function sumar(lista, hoja) {
    var n = 0, vistos = {};
    S.cand.filter(function (c) { return c.hoja === hoja.id; }).forEach(function (c) { vistos[clave(c) + '@' + (c.x == null ? '' : Math.round(c.x * 200) + ',' + Math.round(c.y * 200))] = 1; });
    lista.forEach(function (o) {
      var c = nuevoCand(o, hoja), k = clave(c) + '@' + (c.x == null ? '' : Math.round(c.x * 200) + ',' + Math.round(c.y * 200));
      if (vistos[k] && c.x != null) return; if (c.x == null && S.cand.some(function (z) { return z.hoja === hoja.id && clave(z) === clave(c); })) return;
      vistos[k] = 1; S.cand.push(c); n++;
    });
    hoja.n = S.cand.filter(function (c) { return c.hoja === hoja.id; }).length;
    return n;
  }

  // ── Lectura de archivos ──
  function leerTexto(buf) {
    var u8 = new Uint8Array(buf);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch (e) { return new TextDecoder('windows-1252').decode(u8); }
  }
  function procesar(files) {
    var lista = Array.prototype.slice.call(files || []);
    if (!lista.length) return;
    var cadena = Promise.resolve(), res = [];
    lista.forEach(function (f) {
      cadena = cadena.then(function () {
        var ext = (f.name.split('.').pop() || '').toLowerCase();
        toast('Leyendo ' + f.name + '…', 2500);
        var p = ext === 'dxf' ? f.arrayBuffer().then(function (b) { return desdeDxf(f.name, leerTexto(b)); })
          : ext === 'pdf' ? f.arrayBuffer().then(function (b) { return desdePdf(f.name, b); })
          : ext === 'json' ? f.text().then(function (t) { return desdeJson(f.name, t); })
          : (ext === 'txt' || ext === 'csv') ? f.arrayBuffer().then(function (b) { return desdeAtributos(f.name, leerTexto(b)); })
          : Promise.reject(new Error('Formato no soportado: .' + ext + (ext === 'dwg' ? ' (guarda el plano como DXF desde AutoCAD)' : '')));
        return p.then(function (r) { res.push(f.name + ': ' + r); }).catch(function (e) { res.push(f.name + ': ' + (e && e.message || e)); });
      });
    });
    cadena.then(function () { guardar(); pintarTodo(); toast(res.join(' · '), 9000); if (S.hojas.length) mostrarHoja(S.hojas[S.hojas.length - 1].id); });
  }

  // DXF: bloques insertados con atributos (las burbujas de instrumento) + geometría para la vista
  function desdeDxf(nombre, txt) {
    var L = txt.split(/\r?\n/), pares = [];
    for (var i = 0; i + 1 < L.length; i += 2) pares.push([parseInt(L[i], 10), L[i + 1]]);
    var sec = '', bloques = {}, blq = null, ents = [], ent = null, enBloque = false, i2;
    function cerrar() { if (!ent || ent.t === 'IGN' || ent.t === 'ATTRIB' || ent.t === 'VERTEX') { ent = null; return; } if (enBloque && blq) blq.ents.push(ent); else if (sec === 'ENTITIES') ents.push(ent); ent = null; }
    for (i2 = 0; i2 < pares.length; i2++) {
      var g = pares[i2][0], v = pares[i2][1]; var vt = v.trim();
      if (g === 0) {
        if (vt === 'SECTION') { cerrar(); sec = ''; continue; }
        if (vt === 'ENDSEC') { cerrar(); sec = ''; continue; }
        if (sec === 'BLOCKS' && vt === 'BLOCK') { cerrar(); blq = { nombre: '', ents: [], bx: 0, by: 0 }; enBloque = true; ent = null; continue; }
        if (sec === 'BLOCKS' && vt === 'ENDBLK') { cerrar(); if (blq) bloques[blq.nombre] = blq; blq = null; enBloque = false; continue; }
        cerrar();
        if (vt === 'ATTRIB' && (enBloque ? blq && blq.ents.length : ents.length)) { var padre = (enBloque ? blq.ents : ents); padre = padre[padre.length - 1]; if (padre && padre.t === 'INSERT') { ent = { t: 'ATTRIB', d: {}, padre: padre }; continue; } }
        if (vt === 'SEQEND' || vt === 'ATTDEF' || vt === 'VERTEX') { ent = vt === 'VERTEX' ? { t: 'VERTEX', d: {} } : { t: 'IGN', d: {} }; if (vt === 'VERTEX') { var pl = (enBloque ? blq.ents : ents); pl = pl[pl.length - 1]; if (pl && pl.t === 'POLYLINE') { ent.padre = pl; } } continue; }
        ent = { t: vt, d: {}, xs: [], ys: [], bulge: [] };
        continue;
      }
      if (g === 2 && sec === '' && pares[i2 - 1] && pares[i2 - 1][0] === 0 && pares[i2 - 1][1].trim() === 'SECTION') { sec = vt; continue; }
      if (enBloque && !ent && blq) { if (g === 2) blq.nombre = vt; if (g === 10) blq.bx = +v; if (g === 20) blq.by = +v; continue; }
      if (!ent) continue;
      if (ent.t === 'IGN') continue;
      if (ent.t === 'ATTRIB') {
        if (g === 2) ent.d.tag = vt; else if (g === 1) ent.d.val = (ent.d.val || '') + v; else if (ent.d[g] == null) ent.d[g] = +v;
        if (g === 1 || g === 2) { ent.padre.att = ent.padre.att || {}; if (ent.d.tag != null && ent.d.val != null) ent.padre.att[ent.d.tag.toUpperCase()] = ent.d.val; }
        if (!ent.reg) { ent.reg = 1; (ent.padre.attEnts = ent.padre.attEnts || []).push(ent.d); }
        continue;
      }
      if (ent.t === 'VERTEX') { if (g === 10) ent.d.x = +v; if (g === 20) { ent.d.y = +v; if (ent.padre) { ent.padre.xs.push(ent.d.x); ent.padre.ys.push(ent.d.y); } } continue; }
      if (ent.t === 'LWPOLYLINE') { if (g === 10) ent.xs.push(+v); else if (g === 20) ent.ys.push(+v); else if (g === 70) ent.d.cerrada = (+v & 1) === 1; else if (g === 42) ent.bulge[ent.xs.length - 1] = +v; else if (g === 67) ent.d.ps = +v; continue; }
      ent.d[g] = ent.d[g] == null ? v : ent.d[g];
      if (g === 1 && ent.t === 'MTEXT') ent.d.txt = (ent.d.txt || '') + v; if (g === 3 && ent.t === 'MTEXT') ent.d.txt = (ent.d.txt || '') + v;
    }
    cerrar();
    // Instrumentos: INSERT con atributos de letras + número
    var cands = [], textos = [];
    var NOMS_L = /^(NOM|LETRAS?|FUNC(ION)?|INST(RUMENTO)?|ISA|ID|TAG1|TAGL|LETTERS?|FUNCTION|PREFIJO)$/;
    var NOMS_N = /^(TAG|NUM(ERO)?|N°|NO|LOOP|LAZO|CORRELATIVO|TAG2|TAGN|NUMBER|LOOPNO|TAGNO)$/;
    function desdeAtt(att) {
      var l = '', n = '', a = '', serv = '', eq = '', extra = [];
      Object.keys(att).forEach(function (k) {
        var v = limpiarAtt(att[k]).toUpperCase(); if (!v) return;
        if (!l && NOMS_L.test(k) && esLetras(v)) l = v;
        else if (!n && NOMS_N.test(k) && RX_NUM.test(v)) n = v;
        else if (/^(AREA|ÁREA|WBS)$/.test(k)) a = v;
        else if (/SERVICIO|DESCRIP/.test(k)) serv = serv || v;
        else if (/EQUIPO|LINEA|LÍNEA|LINE/.test(k)) eq = eq || v;
        else if (/^TXT_/.test(k) && v.length < 14) extra.push(v);
      });
      if (!l || !n) Object.keys(att).forEach(function (k) {
        var v = limpiarAtt(att[k]).toUpperCase(); if (!v) return;
        var m = /^(?:(\d{3,5})-)?([A-Z]{1,5})-?(\d{2,6}[A-Z]?)$/.exec(v.replace(/\s+/g, '-'));
        if (m && esLetras(m[2]) && !l) { a = a || m[1] || ''; l = m[2]; n = m[3]; return; }
        if (!l && esLetras(v)) l = v; else if (!n && RX_NUM.test(v)) n = v;
      });
      if (!l || !n) return null;
      var pn = partirNum(n);
      return { letras: l, num: pn.num, suf: pn.suf, area: /^\d{3,5}$/.test(a) ? a : '', servicio: serv, equipo: eq, nota: extra.join(' ') };
    }
    var bx = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    function ext(x, y) { if (!isFinite(x) || !isFinite(y)) return; if (x < bx.x0) bx.x0 = x; if (x > bx.x1) bx.x1 = x; if (y < bx.y0) bx.y0 = y; if (y > bx.y1) bx.y1 = y; }
    // Geometría (espacio modelo) con bloques expandidos
    var seg = [], circ = [], txts = [], N_MAX = 600000;
    function texto(m, d, val) {
      var alin = (+d[72] || 0) !== 0 || (+d[74] || 0) !== 0 || (+d[73] || 0) !== 0, x = alin && d[11] != null ? +d[11] : +d[10], y = alin && d[21] != null ? +d[21] : +d[20];
      if (!isFinite(x) || !isFinite(y)) return; var t = limpiarAtt(val); if (!t) return;
      var p = tr(m, x, y), esc1 = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1, rot = (+d[50] || 0) + Math.atan2(m[2], m[0]) * 180 / Math.PI;
      var h72 = +d[72] || 0, ha = h72 === 1 || h72 === 4 ? 'c' : h72 === 2 ? 'r' : (d[71] != null && /[258]/.test(String(d[71]))) ? 'c' : 'l';
      txts.push([p[0], p[1], (+d[40] || 2.5) * esc1, rot, t.slice(0, 60), ha]);
    }
    function tr(m, x, y) { return [m[0] * x + m[1] * y + m[4], m[2] * x + m[3] * y + m[5]]; }
    function mult(a, b) { return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[0] * b[4] + a[1] * b[5] + a[4], a[2] * b[4] + a[3] * b[5] + a[5]]; }
    function dibujar(lista, m, prof) {
      for (var k = 0; k < lista.length && seg.length < N_MAX; k++) {
        var e = lista[k], d = e.d; if (d[67] != null && +d[67] === 1 && prof === 0) continue;
        if ((e.t === 'TEXT' || e.t === 'MTEXT') && txts.length < 80000) { texto(m, d, e.t === 'MTEXT' ? d.txt : d[1]); continue; }
        if (e.t === 'LINE') { var a1 = tr(m, +d[10], +d[20]), b1 = tr(m, +d[11], +d[21]); seg.push(a1[0], a1[1], b1[0], b1[1]); }
        else if (e.t === 'LWPOLYLINE' || e.t === 'POLYLINE') { for (var j = 0; j + 1 < e.xs.length; j++) { var p1 = tr(m, e.xs[j], e.ys[j]), p2 = tr(m, e.xs[j + 1], e.ys[j + 1]); seg.push(p1[0], p1[1], p2[0], p2[1]); } if ((d.cerrada || (+d[70] & 1)) && e.xs.length > 2) { var q1 = tr(m, e.xs[e.xs.length - 1], e.ys[e.ys.length - 1]), q2 = tr(m, e.xs[0], e.ys[0]); seg.push(q1[0], q1[1], q2[0], q2[1]); } }
        else if (e.t === 'CIRCLE' || e.t === 'ARC') {
          var cx = +d[10], cy = +d[20], r = +d[40], a0 = e.t === 'ARC' ? +d[50] * Math.PI / 180 : 0, a2 = e.t === 'ARC' ? +d[51] * Math.PI / 180 : Math.PI * 2; if (a2 <= a0) a2 += Math.PI * 2;
          var nn = Math.max(8, Math.min(48, Math.round((a2 - a0) * 8))), prev = null;
          for (var s = 0; s <= nn; s++) { var an = a0 + (a2 - a0) * s / nn, pt = tr(m, cx + r * Math.cos(an), cy + r * Math.sin(an)); if (prev) seg.push(prev[0], prev[1], pt[0], pt[1]); prev = pt; }
          if (e.t === 'CIRCLE') { var cc = tr(m, cx, cy), rr = Math.abs(r * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))); circ.push(cc[0], cc[1], rr); }
        }
        else if (e.t === 'INSERT' && prof < 5) {
          var b = bloques[(d[2] || '').trim()]; if (!b) continue;
          var sx = d[41] != null ? +d[41] : 1, sy = d[42] != null ? +d[42] : sx, rot = (+d[50] || 0) * Math.PI / 180, co = Math.cos(rot), si = Math.sin(rot);
          var mi = [co * sx, -si * sy, si * sx, co * sy, +d[10] || 0, +d[20] || 0]; mi = mult(mi, [1, 0, 0, 1, -b.bx, -b.by]);
          dibujar(b.ents, mult(m, mi), prof + 1);
          if (e.attEnts && txts.length < 80000) e.attEnts.forEach(function (a) { if (!(+a[70] & 1)) texto(m, a, a.val); });
        }
      }
    }
    dibujar(ents, [1, 0, 0, 1, 0, 0], 0);
    for (var q = 0; q < seg.length; q += 2) ext(seg[q], seg[q + 1]);
    // Candidatos desde atributos (también INSERT anidados de primer nivel no aplican: las burbujas van en espacio modelo)
    ents.forEach(function (e) {
      if (e.t !== 'INSERT' || !e.att) return; if (e.d[67] != null && +e.d[67] === 1) return;
      var c = desdeAtt(e.att); if (!c) return;
      c.px = +e.d[10]; c.py = +e.d[20]; c.bloque = (e.d[2] || '').trim(); cands.push(c);
    });
    // Respaldo: textos sueltos (TEXT/MTEXT) de letras ISA con número debajo
    if (!cands.length) {
      ents.forEach(function (e) { if ((e.t === 'TEXT' || e.t === 'MTEXT') && !(+e.d[67] === 1)) { var t = limpiarAtt(e.t === 'MTEXT' ? e.d.txt : e.d[1]).toUpperCase(); if (t) textos.push({ t: t, x: +e.d[10], y: +e.d[20], h: +e.d[40] || 2.5 }); } });
      emparejarTextos(textos, true).forEach(function (c) { cands.push(c); });
    }
    if (!isFinite(bx.x0)) cands.forEach(function (c) { ext(c.px, c.py); });
    var W = (bx.x1 - bx.x0) || 1, H = (bx.y1 - bx.y0) || 1;
    var hoja = agregarHoja(nombre, 'DXF', { ancho: W, alto: H, tipoVista: 'dxf' });
    cands.forEach(function (c) { c.x = (c.px - bx.x0) / W; c.y = 1 - (c.py - bx.y0) / H; c.conf = c.bloque ? 'alta' : 'media'; c.origen = 'DXF' + (c.bloque ? ' · bloque ' + c.bloque : ' · texto'); delete c.px; delete c.py; });
    // Guarda la geometría normalizada para la vista (Float32 compacto)
    var g32 = new Float32Array(seg.length); for (var z = 0; z < seg.length; z += 2) { g32[z] = (seg[z] - bx.x0) / W; g32[z + 1] = 1 - (seg[z + 1] - bx.y0) / H; }
    var tx = txts.map(function (t) { return [(t[0] - bx.x0) / W, 1 - (t[1] - bx.y0) / H, t[2] / H, t[3], t[4], t[5]]; });
    idbPut(hoja.id, { tipo: 'dxf', seg: g32, txt: tx, ar: W / H });
    var n = sumar(cands, hoja);
    return n + ' instrumentos desde atributos' + (seg.length >= N_MAX ? ' (vista simplificada)' : '');
  }

  // Empareja letras ISA con el número que va debajo (burbuja) o al lado
  function emparejarTextos(T, yArriba) {
    var out = [], usados = {};
    T.forEach(function (a, i) {
      var full = /^(?:(\d{3,5})-)?([A-Z]{1,5})[- ](\d{2,6}[A-Z]?)$/.exec(a.t);
      if (full && esLetras(full[2])) { var pf = partirNum(full[3]); out.push({ letras: full[2], num: pf.num, suf: pf.suf, area: full[1] || '', px: a.x, py: a.y, conf: 'media' }); usados[i] = 1; return; }
    });
    T.forEach(function (a, i) {
      if (usados[i] || !esLetras(a.t)) return;
      var mejor = -1, dm = Infinity;
      T.forEach(function (b, j) {
        if (j === i || usados[j] || !RX_NUM.test(b.t)) return;
        var dy = yArriba ? a.y - b.y : b.y - a.y, dx = Math.abs(b.x - a.x), h = Math.max(a.h, b.h);
        if (dy > 0.2 * h && dy < 2.6 * h && dx < 2.2 * h) { var dd = dy + dx * 0.7; if (dd < dm) { dm = dd; mejor = j; } }
      });
      if (mejor >= 0) { usados[i] = usados[mejor] = 1; var b = T[mejor], pn = partirNum(b.t); out.push({ letras: a.t, num: pn.num, suf: pn.suf, px: (a.x + b.x) / 2, py: (a.y + b.y) / 2, conf: 'media' }); }
    });
    return out;
  }

  // TXT/CSV de atributos (ATTOUT, EATTEXT o extracción de datos de AutoCAD)
  function desdeAtributos(nombre, txt) {
    var lin = txt.split(/\r?\n/).filter(function (l) { return l.trim(); }); if (!lin.length) throw new Error('archivo vacío');
    var sep = lin[0].indexOf('\t') >= 0 ? '\t' : (lin[0].split(';').length > lin[0].split(',').length ? ';' : ',');
    var filas = lin.map(function (l) { return l.split(sep).map(function (c) { return c.replace(/^"|"$/g, ''); }); });
    var cab = filas[0].map(function (c) { return limpiarAtt(c).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w&%°]/g, ''); });
    function col(rx) { for (var i = 0; i < cab.length; i++) if (rx.test(cab[i])) return i; return -1; }
    var cL = col(/^(NOM|LETRAS?|FUNCION|INSTRUMENTO|ISA|LETTERS?)$/), cN = col(/^(TAG|NUM|NUMERO|CORRELATIVO|LOOP|LAZO|NUMBER)$/), cA = col(/^(AREA|WBS)$/), cS = col(/^(SERVICIO|DESCRIPCION|SERVICE|DESCRIPTION)$/), cE = col(/^(LINEA|EQUIPO|LINE|EQUIPMENT)$/), cP = col(/^(P&ID|PID|PLANO)$/);
    var hoja = agregarHoja(nombre, 'Atributos');
    var lista = [];
    filas.slice(1).forEach(function (f) {
      var l = cL >= 0 ? limpiarAtt(f[cL]).toUpperCase() : '', n = cN >= 0 ? limpiarAtt(f[cN]).toUpperCase() : '', extra = [];
      if (cL < 0 || cN < 0 || !esLetras(l) || !RX_NUM.test(n)) {
        // busca letras y número en cualquier columna
        l = ''; n = '';
        f.forEach(function (c) { var v = limpiarAtt(c).toUpperCase(); var m = /^(?:(\d{3,5})-)?([A-Z]{1,5})-(\d{2,6}[A-Z]?)$/.exec(v); if (m && esLetras(m[2]) && !l) { l = m[2]; n = m[3]; } });
        if (!l) return;
      }
      cab.forEach(function (h, i) { if (/^TXT_/.test(h)) { var v = limpiarAtt(f[i]); if (v && v.length < 14) extra.push(v.toUpperCase()); } });
      var pn = partirNum(n), a = cA >= 0 ? limpiarAtt(f[cA]) : '';
      lista.push({ letras: l, num: pn.num, suf: pn.suf, area: /^\d{3,5}$/.test(a) ? a : hoja.area, servicio: cS >= 0 ? limpiarAtt(f[cS]).toUpperCase() : '', equipo: cE >= 0 ? limpiarAtt(f[cE]).toUpperCase() : '', nota: extra.join(' '), conf: 'alta', origen: 'Atributos de AutoCAD' });
      if (cP >= 0 && limpiarAtt(f[cP]) && !hoja.planoFijo) { hoja.plano = limpiarAtt(f[cP]).toUpperCase(); hoja.planoFijo = 1; }
    });
    var n = sumar(lista, hoja);
    return n + ' instrumentos desde atributos';
  }

  // JSON de extracción (formato de la Suite, preparado con IA o con otra herramienta)
  function desdeJson(nombre, txt) {
    var d = JSON.parse(txt), hs = d.hojas || [{ nombre: d.plano || nombre, plano: d.plano || '', area: d.area || '' }], inst = d.instrumentos || d.cand || [], total = 0;
    var mapa = {};
    hs.forEach(function (h, i) { var x = agregarHoja(h.nombre || h.plano || (nombre + ' ' + (i + 1)), 'Extracción (JSON)', { plano: h.plano || planoDesdeNombre(h.nombre || nombre), area: h.area || '' }); mapa[h.id || h.plano || h.nombre || i] = x; if (i === 0) mapa._0 = x; });
    var porHoja = {};
    inst.forEach(function (o) {
      var h = mapa[o.hoja] || mapa[o.plano] || mapa._0, l = o.letras, n = o.num, a = o.area || '';
      if (!l && o.tag) { var t = ISA.analizar(o.tag); l = t.letras; n = t.numero + (t.sufijo || ''); a = a || t.area; }
      if (!l || !n) return; var pn = partirNum(n);
      (porHoja[h.id] = porHoja[h.id] || { h: h, l: [] }).l.push({ letras: l, num: pn.num, suf: pn.suf, area: a || h.area, x: o.x == null ? null : +o.x, y: o.y == null ? null : +o.y, pag: o.pag || 1, tipo: o.tipo || '', servicio: (o.servicio || '').toUpperCase(), equipo: (o.equipo || o.linea || '').toUpperCase(), nota: o.nota || '', conf: o.conf || 'media', origen: d.origen || 'Extracción (JSON)' });
    });
    Object.keys(porHoja).forEach(function (k) { total += sumar(porHoja[k].l, porHoja[k].h); });
    return total + ' instrumentos desde el archivo de extracción';
  }

  // PDF: texto con posición (pdf.js); si no hay texto, el plano queda de fondo para marcar a mano
  var PDFJS = null;
  function pdfjs() {
    if (PDFJS) return PDFJS;
    PDFJS = import(new URL('pdf.min.mjs', BASE_VENDOR).href).then(function (m) { m.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', BASE_VENDOR).href; return m; });
    return PDFJS;
  }
  var BASE_VENDOR = new URL('vendor/', (document.currentScript && document.currentScript.src) || location.href);
  function desdePdf(nombre, buf) {
    var copia = buf.slice(0);
    return pdfjs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(buf) }).promise; }).then(function (doc) {
      var hoja = agregarHoja(nombre, 'PDF', { paginas: doc.numPages, tipoVista: 'pdf' });
      idbPut(hoja.id, { tipo: 'pdf', datos: copia });
      var cands = [], nTxt = 0, cad = Promise.resolve();
      for (var p = 1; p <= Math.min(doc.numPages, 40); p++) (function (pg) {
        cad = cad.then(function () { return doc.getPage(pg); }).then(function (page) {
          var vp = page.getViewport({ scale: 1 });
          if (pg === 1) { hoja.ancho = vp.width; hoja.alto = vp.height; }
          return page.getTextContent().then(function (tc) {
            var T = [];
            tc.items.forEach(function (it) {
              var t = String(it.str || '').trim().toUpperCase(); if (!t) return; nTxt++;
              var pt = vp.convertToViewportPoint(it.transform[4], it.transform[5]), h = Math.hypot(it.transform[2], it.transform[3]) || it.height || 6;
              t.split(/\s{2,}/).forEach(function (pz) { T.push({ t: pz.trim(), x: pt[0] + (it.width || 0) / 2, y: pt[1], h: h }); });
            });
            emparejarTextos(T, false).forEach(function (c) { c.x = c.px / vp.width; c.y = c.py / vp.height; c.pag = pg; c.origen = 'PDF · texto'; delete c.px; delete c.py; cands.push(c); });
          });
        });
      })(p);
      return cad.then(function () {
        var n = sumar(cands, hoja);
        if (!nTxt) hoja.sinTexto = 1;
        return nTxt ? n + ' instrumentos desde el texto del PDF' : 'el PDF no tiene texto (letras dibujadas o escaneo): usa «Marcar en el plano» o carga el JSON de extracción';
      });
    });
  }

  // ── Listado de instrumentos existente (Excel) para cruzar ──
  function leerXlsx(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), fin = -1;
    for (var i = u8.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    if (fin < 0) return Promise.reject(new Error('Archivo .xlsx no válido'));
    var n = dv.getUint16(fin + 10, true), off = dv.getUint32(fin + 16, true), ent = {}, dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
      var nom = dec.decode(u8.subarray(off + 46, off + 46 + nl)), ini = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      ent[nom] = { met: met, d: u8.subarray(ini, ini + csz) }; off += 46 + nl + el + cl;
    }
    function texto(nom) { var e = ent[nom]; if (!e) return Promise.resolve(''); if (e.met === 0) return Promise.resolve(dec.decode(e.d)); return new Response(new Blob([e.d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); }
    var hojas = Object.keys(ent).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort(function (a, b) { return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10); });
    return Promise.all([texto('xl/sharedStrings.xml'), texto('xl/workbook.xml')].concat(hojas.map(texto))).then(function (r) {
      var p = new DOMParser(), ss = [], sx = p.parseFromString(r[0] || '<sst/>', 'application/xml');
      Array.prototype.forEach.call(sx.getElementsByTagName('si'), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); });
      var nombres = Array.prototype.map.call(p.parseFromString(r[1] || '<w/>', 'application/xml').getElementsByTagName('sheet'), function (s) { return s.getAttribute('name'); });
      return r.slice(2).map(function (xml, ih) {
        var hx = p.parseFromString(xml, 'application/xml'), filas = [];
        Array.prototype.forEach.call(hx.getElementsByTagName('row'), function (row) {
          var f = [];
          Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
            var ref = c.getAttribute('r') || '', col = 0, m = /^([A-Z]+)/.exec(ref);
            if (m) for (var j = 0; j < m[1].length; j++) col = col * 26 + (m[1].charCodeAt(j) - 64); col--;
            var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0], val = '';
            if (t === 's' && v) val = ss[+v.textContent] || ''; else if (t === 'inlineStr' && is) val = is.textContent; else if (v) val = v.textContent;
            f[col < 0 ? f.length : col] = val;
          });
          for (var j = 0; j < f.length; j++) if (f[j] == null) f[j] = '';
          filas.push(f);
        });
        return { nombre: nombres[ih] || ('Hoja ' + (ih + 1)), filas: filas };
      });
    });
  }
  var norm = function (s) { return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); };
  function interpretarListado(hojas) {
    var mejor = null;
    hojas.forEach(function (h) {
      for (var r = 0; r < Math.min(h.filas.length, 30); r++) {
        var cab = h.filas[r].map(norm), ct = cab.findIndex(function (c) { return /^TAG\b/.test(c) && !/ANTERIOR|EQUIPO/.test(c); });
        if (ct < 0) continue;
        var items = [];
        var col = function (rx) { return cab.findIndex(function (c) { return rx.test(c); }); };
        var cS = col(/^SERVICIO/), cD = col(/^DESCRIPCION|^INSTRUMENTO$|WORK ELEMENT/), cTp = col(/TIPO DE SENAL|SENAL/), cP = col(/^P&ID|^PLANO|^DRAWING/), cE = col(/LINEA O EQUIPO|^EQUIPO|^LINEA|TAG EQUIPO/), cA = col(/^AREA$|^WBS$/);
        h.filas.slice(r + 1).forEach(function (f) {
          var tag = norm(f[ct]); if (!tag) return;
          var a = ISA.analizar(tag.replace(/\//g, ' ')); var letras = String(tag.split('-').filter(function (p) { return /^[A-Z/]+$/.test(p); })[0] || a.letras);
          var num = (/-(\d{2,6}[A-Z]?)\s*$/.exec(tag) || [])[1] || a.numero;
          letras.split('/').forEach(function (l) { if (!esLetras(l) || !num) return; var pn = partirNum(num); items.push({ tag: tag, letras: l, num: pn.num, suf: pn.suf, area: (/^(\d{3,5})-/.exec(tag) || [])[1] || (cA >= 0 ? norm(f[cA]) : ''), servicio: cS >= 0 ? norm(f[cS]) : '', desc: cD >= 0 ? norm(f[cD]) : '', senal: cTp >= 0 ? norm(f[cTp]) : '', pid: cP >= 0 ? norm(f[cP]) : '', equipo: cE >= 0 ? norm(f[cE]) : '' }); });
        });
        var claves = {}, areas = {}; S.cand.forEach(function (c) { claves[clave(c)] = 1; areas[clave(c) + '@' + c.area] = 1; });
        var punt = 0; items.forEach(function (it) { if (claves[clave(it)]) punt += 1; if (areas[clave(it) + '@' + it.area]) punt += 0.5; });
        if (!mejor || punt > mejor.punt || (punt === mejor.punt && items.length > mejor.items.length)) mejor = { hoja: h.nombre, items: items, punt: punt };
        break;
      }
    });
    return mejor;
  }
  function tipoDeSenal(txt, letras) {
    var t = norm(txt), sug = tipoSugerido(letras);
    if (sug === 'NA') return 'NA';
    if (/ANALOG|4-20/.test(t)) return sug === 'AO' ? 'AO' : (sug === 'AI' || sug === 'AO' ? sug : 'AI');
    if (/DIGITAL|DISCRET|ON\/OFF|CONTACTO/.test(t)) return sug === 'DO' ? 'DO' : 'DI';
    if (/PROFIBUS|ETHERNET|MODBUS|HART|DEVICENET|PROFINET|SERIAL|RED/.test(t)) return 'NA';
    return '';
  }
  function cruzar() {
    if (!S.listado) return;
    var idx = {};
    S.listado.items.forEach(function (it) { (idx[clave(it)] = idx[clave(it)] || []).push(it); });
    S.cand.forEach(function (c) {
      var m = (idx[clave(c)] || [])[0];
      c.enListado = !!m;
      if (!m) return;
      if (!c.area && m.area) c.area = m.area;
      var hj = S.hojas.filter(function (h) { return h.id === c.hoja; })[0];
      if (m.area && c.area !== m.area && c.estado === 'pendiente' && (!c.area || (hj && c.area === hj.area))) c.area = m.area;
      if (!c.servicio && (m.servicio || m.desc)) c.servicio = m.servicio || '';
      if (!c.equipo && m.equipo) c.equipo = m.equipo;
      var tp = tipoDeSenal(m.senal, c.letras); if (tp && c.estado === 'pendiente') c.tipo = tp;
      c.listadoTag = m.tag;
    });
  }
  function delPlano(it, planos) { return it.pid && planos.some(function (p) { return p.length > 6 && (it.pid.indexOf(p) >= 0 || p.indexOf(it.pid) >= 0); }); }
  function faltantes() {
    if (!S.listado) return [];
    var hay = {}; S.cand.forEach(function (c) { if (c.estado !== 'rechazado') hay[clave(c)] = 1; });
    var planos = S.hojas.map(function (h) { return norm(h.plano); }).filter(Boolean);
    return S.listado.items.filter(function (it) {
      if (hay[clave(it)]) return false;
      return delPlano(it, planos);
    });
  }

  // ── Vista del plano (canvas con zoom y desplazamiento) ──
  var V = { hoja: null, img: null, seg: null, ar: 1.414, z: 1, ox: 0, oy: 0, marcar: false, pag: 1, cargando: false };
  var cv = $('#lienzo'), cx = cv.getContext('2d');
  function tamCanvas() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
  function hojaWH() { var W = cv.width, H = cv.height, ar = V.ar || 1.414, w = W, h = W / ar; if (h > H) { h = H; w = H * ar; } return { w: w, h: h }; }
  function ajustar() { tamCanvas(); var s = hojaWH(); V.z = 0.96; V.ox = (cv.width - s.w * V.z) / 2; V.oy = (cv.height - s.h * V.z) / 2; pintarVista(); }
  function aPantalla(x, y) { var s = hojaWH(); return [V.ox + x * s.w * V.z, V.oy + y * s.h * V.z]; }
  function aHoja(px, py) { var s = hojaWH(); return [(px - V.ox) / (s.w * V.z), (py - V.oy) / (s.h * V.z)]; }
  function pintarVista() {
    var W = cv.width, H = cv.height; cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#F4F6F8'; cx.fillRect(0, 0, W, H);
    if (!V.hoja) return;
    var s = hojaWH(), o = aPantalla(0, 0), sw = s.w * V.z, sh = s.h * V.z;
    cx.fillStyle = '#fff'; cx.fillRect(o[0], o[1], sw, sh); cx.strokeStyle = '#C9D2DC'; cx.lineWidth = 1; cx.strokeRect(o[0], o[1], sw, sh);
    if (V.img) cx.drawImage(V.img, o[0], o[1], sw, sh);
    else if (V.seg) {
      cx.strokeStyle = '#1B2733'; cx.lineWidth = Math.max(0.6, (window.devicePixelRatio || 1) * 0.6); cx.beginPath();
      var g = V.seg; for (var i = 0; i < g.length; i += 4) { var x1 = o[0] + g[i] * sw, y1 = o[1] + g[i + 1] * sh, x2 = o[0] + g[i + 2] * sw, y2 = o[1] + g[i + 3] * sh; if ((x1 < 0 && x2 < 0) || (x1 > W && x2 > W) || (y1 < 0 && y2 < 0) || (y1 > H && y2 > H)) continue; cx.moveTo(x1, y1); cx.lineTo(x2, y2); }
      cx.stroke();
      if (V.txt) {
        cx.fillStyle = '#1B2733';
        for (var k = 0; k < V.txt.length; k++) {
          var t = V.txt[k], fs = t[2] * sh; if (fs < 3.5) continue; var tx2 = o[0] + t[0] * sw, ty2 = o[1] + t[1] * sh; if (tx2 < -400 || tx2 > W + 400 || ty2 < -50 || ty2 > H + 50) continue;
          cx.save(); cx.translate(tx2, ty2); if (t[3]) cx.rotate(-t[3] * Math.PI / 180); cx.font = Math.round(fs) + 'px "Arial Narrow", Arial, sans-serif'; cx.textAlign = t[5] === 'c' ? 'center' : t[5] === 'r' ? 'right' : 'left'; cx.textBaseline = 'alphabetic'; cx.fillText(t[4], 0, 0); cx.restore();
        }
      }
    }
    var d = window.devicePixelRatio || 1, r = Math.max(7 * d, Math.min(26 * d, 0.012 * sw));
    S.cand.forEach(function (c) {
      if (c.hoja !== V.hoja.id || c.x == null || (c.pag || 1) !== V.pag) return;
      var p = aPantalla(c.x, c.y), col = c.estado === 'validado' ? '#1E9E61' : c.estado === 'rechazado' ? '#D93A3F' : '#EF7A05';
      cx.beginPath(); cx.arc(p[0], p[1], r, 0, Math.PI * 2); cx.lineWidth = (c.id === selId ? 4 : 2.2) * d; cx.strokeStyle = col; cx.stroke();
      if (c.id === selId) { cx.fillStyle = 'rgba(239,90,5,.15)'; cx.fill(); }
      if (sw > 900 * d || c.id === selId) { cx.font = '600 ' + Math.round(11 * d) + 'px "IBM Plex Mono", monospace'; var t = String(c.letras || '?') + '-' + (c.num || '?') + (c.suf || ''), tw = cx.measureText(t).width; cx.fillStyle = col; cx.fillRect(p[0] + r + 2 * d, p[1] - 8 * d, tw + 8 * d, 16 * d); cx.fillStyle = '#fff'; cx.fillText(t, p[0] + r + 6 * d, p[1] + 4 * d); }
    });
  }
  function mostrarHoja(id, centrar) {
    var h = S.hojas.filter(function (x) { return x.id === id; })[0]; if (!h) return;
    var cambia = !V.hoja || V.hoja.id !== h.id; V.hoja = h; $('#vHoja').value = h.id; $('#vVacio').hidden = true;
    if (!cambia) { if (centrar) centrar(); else pintarVista(); return Promise.resolve(); }
    V.img = null; V.seg = null; V.txt = null; V.ar = h.ancho && h.alto ? h.ancho / h.alto : 1.414; V.pag = 1; ajustar();
    return idbGet(h.id).then(function (d) {
      if (!d) { $('#vVacio').hidden = false; $('#vVacio').textContent = h.origen === 'Atributos' || h.origen === 'Extracción (JSON)' ? 'Esta hoja no trae dibujo (' + h.origen.toLowerCase() + '). Carga el DXF o el PDF del mismo plano para ubicar los instrumentos.' : 'El dibujo de esta hoja no está guardado en este navegador.'; pintarVista(); return; }
      if (d.tipo === 'dxf') { V.seg = d.seg; V.txt = d.txt || null; V.ar = d.ar || V.ar; ajustar(); if (centrar) centrar(); return; }
      if (d.tipo === 'pdf') return renderPdf(d.datos, V.pag).then(function () { if (centrar) centrar(); });
    });
  }
  function renderPdf(datos, pag) {
    V.cargando = true; $('#vInfo').textContent = 'Dibujando el plano…';
    return pdfjs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(datos.slice(0)) }).promise; }).then(function (doc) { return doc.getPage(pag); }).then(function (page) {
      var vp0 = page.getViewport({ scale: 1 }), esc2 = Math.min(4, 5200 / Math.max(vp0.width, vp0.height)), vp = page.getViewport({ scale: esc2 });
      var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      return page.render({ canvasContext: c.getContext('2d'), viewport: vp, canvas: c }).promise.then(function () { V.img = c; V.ar = vp0.width / vp0.height; ajustar(); V.cargando = false; $('#vInfo').textContent = 'Rueda: zoom · arrastrar: mover · clic en un marcador: seleccionar'; });
    }).catch(function (e) { V.cargando = false; $('#vInfo').textContent = 'No se pudo dibujar el PDF: ' + (e && e.message || e); });
  }
  function centrarEn(c) {
    return function () { if (c.x == null) return pintarVista(); tamCanvas(); var s = hojaWH(); V.z = Math.max(V.z, 4); V.ox = cv.width / 2 - c.x * s.w * V.z; V.oy = cv.height / 2 - c.y * s.h * V.z; pintarVista(); };
  }
  // Interacción
  var arr = null;
  cv.addEventListener('wheel', function (e) { if (!V.hoja) return; e.preventDefault(); var d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * d, py = (e.clientY - r.top) * d, f = Math.exp(-e.deltaY * 0.0015), z2 = Math.min(60, Math.max(0.3, V.z * f)); f = z2 / V.z; V.ox = px - (px - V.ox) * f; V.oy = py - (py - V.oy) * f; V.z = z2; pintarVista(); }, { passive: false });
  cv.addEventListener('pointerdown', function (e) { if (!V.hoja) return; cv.setPointerCapture(e.pointerId); arr = { x: e.clientX, y: e.clientY, ox: V.ox, oy: V.oy, mov: false }; });
  cv.addEventListener('pointermove', function (e) { if (!arr) return; var d = window.devicePixelRatio || 1, dx = e.clientX - arr.x, dy = e.clientY - arr.y; if (Math.abs(dx) + Math.abs(dy) > 4) arr.mov = true; if (arr.mov) { V.ox = arr.ox + dx * d; V.oy = arr.oy + dy * d; pintarVista(); } });
  cv.addEventListener('pointerup', function (e) {
    var a = arr; arr = null; if (!a || a.mov || !V.hoja) return;
    var d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * d, py = (e.clientY - r.top) * d;
    var cerca = null, dm = 18 * d;
    S.cand.forEach(function (c) { if (c.hoja !== V.hoja.id || c.x == null || (c.pag || 1) !== V.pag) return; var p = aPantalla(c.x, c.y), dd = Math.hypot(p[0] - px, p[1] - py); if (dd < dm) { dm = dd; cerca = c; } });
    if (cerca && !V.marcar) { seleccionar(cerca.id, true); return; }
    if (V.marcar) { var h = aHoja(px, py); if (h[0] < 0 || h[0] > 1 || h[1] < 0 || h[1] > 1) return; var c = nuevoCand({ x: h[0], y: h[1], pag: V.pag, conf: 'manual', origen: 'Marcado en el plano' }, V.hoja); S.cand.push(c); V.hoja.n = (V.hoja.n || 0) + 1; guardar(); $('#fEstado').value = ''; pintarTodo(); seleccionar(c.id, false); var inp = document.querySelector('#tCand tr[data-id="' + c.id + '"] input[data-k="letras"]'); if (inp) inp.focus(); }
  });
  window.addEventListener('resize', function () { if (V.hoja) { tamCanvas(); pintarVista(); } });
  $('#vAjustar').addEventListener('click', ajustar);
  $('#vMarcar').addEventListener('click', function () { V.marcar = !V.marcar; this.setAttribute('aria-pressed', String(V.marcar)); $('#visor').classList.toggle('marcar', V.marcar); $('#vInfo').textContent = V.marcar ? 'Clic sobre una burbuja: agrega el instrumento en ese punto y escribe sus letras y número' : 'Rueda: zoom · arrastrar: mover · clic en un marcador: seleccionar'; });
  $('#vHoja').addEventListener('change', function () { mostrarHoja(this.value); });

  // ── Tabla de revisión ──
  var selId = null;
  var COLS = [['letras', 'Letras', 62, 'l'], ['num', 'Número', 70, 'n'], ['suf', 'Suf.', 40, 'n'], ['area', 'Área', 62, 'n'], ['tipo', 'Señal', 84], ['servicio', 'Servicio', 200], ['equipo', 'Equipo / línea', 130], ['nota', 'Nota', 90]];
  function visibles() {
    var fe = $('#fEstado').value, fh = $('#fHoja').value, q = norm($('#fBuscar').value);
    return S.cand.filter(function (c) { return (!fe || c.estado === fe) && (!fh || c.hoja === fh) && (!q || norm(tagDe(c) + ' ' + c.servicio + ' ' + c.equipo + ' ' + c.nota).indexOf(q) >= 0); });
  }
  function pintarTabla() {
    $('#tCand thead').innerHTML = '<tr><th class="chk"><input type="checkbox" id="cTodo" aria-label="Seleccionar todos"></th><th>Tag</th>' + COLS.map(function (c) { return '<th style="min-width:' + c[2] + 'px">' + c[1] + '</th>'; }).join('') + '<th>Listado</th><th>Origen</th><th>Estado</th><th></th></tr>';
    var nomH = {}; S.hojas.forEach(function (h) { nomH[h.id] = h.plano || h.nombre; });
    var vis = visibles();
    $('#tCand tbody').innerHTML = vis.map(function (c) {
      return '<tr data-id="' + c.id + '" class="' + c.estado + (c.id === selId ? ' sel' : '') + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + esc(tagDe(c)) + '"></td>' +
        '<td><b style="font:700 12px var(--f-mono);white-space:nowrap">' + esc(tagDe(c) || '—') + '</b><br><span class="conf">' + esc(nomH[c.hoja] || '') + '</span></td>' +
        COLS.map(function (k) {
          if (k[0] === 'tipo') return '<td><select data-k="tipo" aria-label="Tipo de señal">' + TIPOS.map(function (t) { return '<option value="' + t + '"' + (c.tipo === t ? ' selected' : '') + '>' + TIPO_TXT[t] + '</option>'; }).join('') + '</select></td>';
          return '<td class="' + (k[3] || '') + '"><input data-k="' + k[0] + '" value="' + esc(c[k[0]] || '') + '" aria-label="' + k[1] + '"' + (k[0] === 'letras' && c.letras && !esLetras(c.letras) ? ' style="color:#FF8C8F"' : '') + '></td>';
        }).join('') +
        '<td>' + (S.listado ? (c.enListado ? '<span class="lst si" title="' + esc(c.listadoTag || '') + '">✓ sí</span>' : '<span class="lst no">no está</span>') : '<span class="conf">—</span>') + '</td>' +
        '<td><span class="conf" title="' + esc(c.origen || '') + '">' + esc(c.conf || '') + '</span></td>' +
        '<td><span class="est ' + c.estado + '">' + c.estado + (c.exportado ? ' · exp.' : '') + '</span></td>' +
        '<td class="acc"><button type="button" class="mini ok" data-a="val" title="Validar" aria-label="Validar ' + esc(tagDe(c)) + '">✓</button> <button type="button" class="mini" data-a="rec" title="Rechazar" aria-label="Rechazar ' + esc(tagDe(c)) + '">✗</button> <button type="button" class="mini" data-a="ver" title="Ver en el plano" aria-label="Ver en el plano"' + (c.x == null ? ' disabled' : '') + '>◎</button></td></tr>';
    }).join('') || '<tr><td colspan="' + (COLS.length + 7) + '" style="padding:14px;color:var(--muted)">' + (S.cand.length ? 'No hay instrumentos con este filtro.' : 'Aún no hay instrumentos. Carga un P&amp;ID en el paso 1.') + '</td></tr>';
  }
  function pintarResumen() {
    var n = S.cand.length, v = 0, r = 0, p = 0, x = 0, io = 0;
    S.cand.forEach(function (c) { if (c.estado === 'validado') { v++; if (/^(AI|AO|DI|DO)$/.test(c.tipo)) io++; } else if (c.estado === 'rechazado') r++; else p++; if (c.exportado) x++; });
    $('#resumen').innerHTML = '<span>Total <b>' + n + '</b></span><span>Pendientes <b>' + p + '</b></span><span>Validados <b>' + v + '</b> (' + io + ' con E/S)</span><span>Rechazados <b>' + r + '</b></span><span>Exportados <b>' + x + '</b></span>' + (S.listado ? '<span>En listado <b>' + S.cand.filter(function (c) { return c.enListado; }).length + '</b> / ' + S.listado.items.length + '</span>' : '');
    $('#cuentaCand').textContent = n ? n + ' detectados' : '';
    var pasos = document.querySelectorAll('#pasos li');
    pasos[0].classList.toggle('hecho', S.hojas.length > 0); pasos[1].classList.toggle('hecho', n > 0 && p === 0); pasos[2].classList.toggle('hecho', x > 0 && x >= v && v > 0);
    pasos[1].classList.toggle('on', n > 0 && p > 0); pasos[2].classList.toggle('on', n > 0 && p === 0 && x < v);
  }
  function pintarHojas() {
    var t = $('#tHojas'); t.hidden = !S.hojas.length;
    $('#cuentaHojas').textContent = S.hojas.length ? S.hojas.length + ' hoja' + (S.hojas.length === 1 ? '' : 's') : '';
    t.querySelector('tbody').innerHTML = S.hojas.map(function (h) {
      return '<tr data-h="' + h.id + '"><td>' + esc(h.nombre) + (h.sinTexto ? ' <span class="conf">(sin texto)</span>' : '') + '</td><td><input data-k="plano" value="' + esc(h.plano || '') + '" aria-label="N° de plano"></td><td><input data-k="area" value="' + esc(h.area || '') + '" style="max-width:90px" aria-label="Área por defecto"></td><td>' + esc(h.origen) + '</td><td>' + S.cand.filter(function (c) { return c.hoja === h.id; }).length + '</td><td style="white-space:nowrap"><button type="button" class="mini" data-a="ver">Ver</button> <button type="button" class="mini" data-a="area" title="Aplica el área a los instrumentos pendientes sin área">Aplicar área</button> <button type="button" class="mini" data-a="quitar" aria-label="Quitar hoja">Quitar</button></td></tr>';
    }).join('');
    var opts = S.hojas.map(function (h) { return '<option value="' + h.id + '">' + esc(h.plano || h.nombre) + '</option>'; }).join('');
    var fh = $('#fHoja').value; $('#fHoja').innerHTML = '<option value="">Todas las hojas</option>' + opts; $('#fHoja').value = fh;
    $('#vHoja').innerHTML = opts || '<option value="">Sin hojas</option>'; if (V.hoja) $('#vHoja').value = V.hoja.id;
  }
  function pintarListadoMsg() {
    var el = $('#msgListado'); if (!S.listado) { el.innerHTML = ''; return; }
    var f = faltantes(), planos = S.hojas.map(function (h) { return norm(h.plano); }), nPl = S.listado.items.filter(function (it) { return delPlano(it, planos); }).length;
    el.innerHTML = '<div class="' + (f.length || !nPl ? 'aviso' : 'okmsg') + '">Listado existente: <b>' + esc(S.listado.archivo || '') + '</b> (hoja «' + esc(S.listado.hoja) + '», ' + S.listado.items.length + ' instrumentos). ' +
      (!nPl ? 'Ningún instrumento del listado indica como P&amp;ID uno de los planos cargados: revisa el N° de plano de cada hoja para comparar qué falta. ' : f.length ? f.length + ' instrumentos del listado no aparecen en los P&amp;ID cargados: <button type="button" class="mini" id="bAgrFalt">Agregarlos como pendientes</button><details><summary style="cursor:pointer;margin-top:6px">Ver la lista</summary><ul class="falt">' + f.map(function (x) { return '<li>' + esc(x.tag) + '</li>'; }).join('') + '</ul></details>' : 'Los ' + nPl + ' instrumentos del listado de estos planos fueron encontrados.') + ' <button type="button" class="mini" id="bQuitarListado">Quitar listado</button></div>';
  }
  function pintarTodo() { pintarHojas(); pintarTabla(); pintarResumen(); pintarListadoMsg(); pintarVista(); }
  function cand(id) { return S.cand.filter(function (c) { return c.id === id; })[0]; }
  function seleccionar(id, desdeVista) {
    selId = id; var c = cand(id); if (!c) return;
    document.querySelectorAll('#tCand tr.sel').forEach(function (t) { t.classList.remove('sel'); });
    var tr = document.querySelector('#tCand tr[data-id="' + id + '"]');
    if (tr) { tr.classList.add('sel'); if (desdeVista) tr.scrollIntoView({ block: 'nearest' }); }
    else if (desdeVista) { $('#fEstado').value = ''; $('#fHoja').value = ''; $('#fBuscar').value = ''; pintarTabla(); var t2 = document.querySelector('#tCand tr[data-id="' + id + '"]'); if (t2) t2.scrollIntoView({ block: 'nearest' }); }
    if (c.pag && c.pag !== V.pag && V.hoja && V.hoja.id === c.hoja) { V.pag = c.pag; idbGet(c.hoja).then(function (d) { if (d && d.tipo === 'pdf') renderPdf(d.datos, V.pag).then(centrarEn(c)); }); return; }
    if (!desdeVista) mostrarHoja(c.hoja, centrarEn(c)); else pintarVista();
  }
  function marcar(c, est) {
    c.estado = est; if (est === 'validado') { c.revisor = $('#revisor').value.trim(); c.fechaRev = $('#fechaRev').value || hoy(); } else { delete c.revisor; }
    if (est !== 'validado') c.exportado = c.exportado && est === 'validado';
  }
  $('#tCand').addEventListener('input', function (e) {
    var t = e.target, k = t.dataset.k, tr = t.closest('tr[data-id]'); if (!k || !tr) return; var c = cand(tr.dataset.id); if (!c) return;
    var v = t.value; if (k === 'letras' || k === 'suf') v = v.toUpperCase();
    c[k] = v; if (k === 'letras' && (!c.tipoManual)) { c.tipo = tipoSugerido(v); var s = tr.querySelector('select[data-k="tipo"]'); if (s) s.value = c.tipo; }
    if (k === 'tipo') c.tipoManual = 1;
    if (S.listado && (k === 'letras' || k === 'num' || k === 'suf')) cruzar();
    tr.querySelector('td b').textContent = tagDe(c) || '—';
    guardar(); pintarResumen(); pintarVista();
  });
  $('#tCand').addEventListener('change', function (e) { if (e.target.id === 'cTodo') document.querySelectorAll('#tCand .chkf').forEach(function (x) { x.checked = e.target.checked; }); });
  $('#tCand').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'), tr = e.target.closest('tr[data-id]'); if (!tr) return; var c = cand(tr.dataset.id); if (!c) return;
    if (!b) { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') seleccionar(c.id, false); else if (selId !== c.id) seleccionar(c.id, false); return; }
    if (b.dataset.a === 'ver') { seleccionar(c.id, false); return; }
    if (b.dataset.a === 'val' && (!c.letras || !c.num)) { toast('Completa letras y número antes de validar.'); return; }
    marcar(c, b.dataset.a === 'val' ? 'validado' : 'rechazado'); guardar();
    var sig = tr.nextElementSibling; pintarTabla(); pintarResumen(); pintarVista();
    if ($('#fEstado').value === 'pendiente' && sig && sig.dataset.id) seleccionar(sig.dataset.id, false);
  });
  function seleccionados() { var ids = []; document.querySelectorAll('#tCand .chkf:checked').forEach(function (x) { ids.push(x.closest('tr').dataset.id); }); return ids.map(cand).filter(Boolean); }
  $('#bValSel').addEventListener('click', function () { var L = seleccionados().filter(function (c) { return c.letras && c.num; }); L.forEach(function (c) { marcar(c, 'validado'); }); guardar(); pintarTodo(); toast(L.length + ' validados.'); });
  $('#bRecSel').addEventListener('click', function () { var L = seleccionados(); L.forEach(function (c) { marcar(c, 'rechazado'); }); guardar(); pintarTodo(); toast(L.length + ' rechazados.'); });
  $('#bValAlta').addEventListener('click', function () {
    var L = S.cand.filter(function (c) { return c.estado === 'pendiente' && c.conf === 'alta' && esLetras(c.letras) && c.num && (S.listado ? c.enListado : c.tipo); });
    if (!L.length) { toast('No hay pendientes de confianza alta' + (S.listado ? ' que estén en el listado.' : ' con tipo de señal.')); return; }
    if (!confirm('¿Validar ' + L.length + ' instrumentos de confianza alta? Revisa igual los que queden pendientes.')) return;
    L.forEach(function (c) { marcar(c, 'validado'); }); guardar(); pintarTodo(); toast(L.length + ' validados.');
  });
  $('#bNuevo').addEventListener('click', function () { var h = V.hoja || S.hojas[0] || agregarHoja('Ingreso manual', 'Manual'); var c = nuevoCand({ conf: 'manual', origen: 'Ingreso manual' }, h); S.cand.push(c); guardar(); $('#fEstado').value = ''; pintarTodo(); var i = document.querySelector('#tCand tr[data-id="' + c.id + '"] input[data-k="letras"]'); if (i) { i.focus(); i.scrollIntoView({ block: 'nearest' }); } });
  ['#fEstado', '#fHoja'].forEach(function (s) { $(s).addEventListener('change', pintarTabla); }); $('#fBuscar').addEventListener('input', pintarTabla);

  // Hojas
  $('#tHojas').addEventListener('input', function (e) { var t = e.target, tr = t.closest('tr[data-h]'); if (!tr || !t.dataset.k) return; var h = S.hojas.filter(function (x) { return x.id === tr.dataset.h; })[0]; h[t.dataset.k] = t.value.trim().toUpperCase(); guardar(); if (t.dataset.k === 'plano') pintarTabla(); });
  $('#tHojas').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'), tr = e.target.closest('tr[data-h]'); if (!b || !tr) return; var id = tr.dataset.h, h = S.hojas.filter(function (x) { return x.id === id; })[0];
    if (b.dataset.a === 'ver') { mostrarHoja(id); $('#visor').scrollIntoView({ block: 'nearest' }); }
    if (b.dataset.a === 'area') { var n = 0; S.cand.forEach(function (c) { if (c.hoja === id && c.estado === 'pendiente' && !c.area) { c.area = h.area; n++; } }); guardar(); pintarTabla(); toast('Área ' + h.area + ' aplicada a ' + n + ' instrumentos.'); }
    if (b.dataset.a === 'quitar') { if (!confirm('¿Quitar la hoja ' + (h.plano || h.nombre) + ' y sus instrumentos no exportados?')) return; S.hojas = S.hojas.filter(function (x) { return x.id !== id; }); S.cand = S.cand.filter(function (c) { return c.hoja !== id; }); idbDel(id); if (V.hoja && V.hoja.id === id) { V.hoja = null; V.img = null; V.seg = null; $('#vVacio').hidden = false; } guardar(); pintarTodo(); }
  });

  // Carga de archivos
  var drop = $('#drop'), inp = $('#archivos');
  drop.addEventListener('click', function () { inp.click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
  inp.addEventListener('change', function () { procesar(inp.files); inp.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('sobre'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('sobre'); }); });
  drop.addEventListener('drop', function (e) { procesar(e.dataTransfer.files); });
  $('#bListado').addEventListener('click', function () { $('#archListado').click(); });
  $('#archListado').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    f.arrayBuffer().then(leerXlsx).then(function (hs) {
      var l = interpretarListado(hs); if (!l || !l.items.length) throw new Error('no encontré una columna TAG');
      S.listado = { archivo: f.name, hoja: l.hoja, items: l.items }; cruzar(); guardar(); pintarTodo();
      toast('Listado cruzado: ' + S.cand.filter(function (c) { return c.enListado; }).length + ' instrumentos coinciden.');
    }).catch(function (e) { toast('No se pudo leer el listado: ' + (e && e.message || e)); });
  });
  document.addEventListener('click', function (e) {
    if (e.target.id === 'bQuitarListado') { S.listado = null; S.cand.forEach(function (c) { delete c.enListado; delete c.listadoTag; }); guardar(); pintarTodo(); }
    if (e.target.id === 'bAgrFalt') {
      var f = faltantes(), h = S.hojas[0] || agregarHoja('Desde listado', 'Listado'), porPlano = {};
      S.hojas.forEach(function (x) { if (x.plano) porPlano[norm(x.plano)] = x; });
      f.forEach(function (it) { var hh = Object.keys(porPlano).filter(function (p) { return it.pid && (it.pid.indexOf(p) >= 0 || p.indexOf(it.pid) >= 0); }).map(function (p) { return porPlano[p]; })[0] || h; S.cand.push(nuevoCand({ letras: it.letras, num: it.num, suf: it.suf, area: it.area, servicio: it.servicio, equipo: it.equipo, tipo: tipoDeSenal(it.senal, it.letras), conf: 'listado', origen: 'Solo en listado: ubicar en el plano', nota: 'NO DETECTADO EN P&ID', enListado: true, listadoTag: it.tag }, hh)); });
      guardar(); pintarTodo(); toast(f.length + ' agregados como pendientes: búscalos en el plano y valídalos o recházalos.');
    }
  });
  $('#bLimpiar').addEventListener('click', function () { if (!confirm('¿Vaciar todo el análisis de P&ID de este proyecto? (no afecta a los entregables ya exportados)')) return; S.hojas.forEach(function (h) { idbDel(h.id); }); S.hojas = []; S.cand = []; S.listado = null; V.hoja = null; V.img = null; V.seg = null; $('#vVacio').hidden = false; guardar(); pintarTodo(); });

  // ── Excel de revisión (registro de lo validado) ──
  $('#bExcelRev').addEventListener('click', function () {
    var X = window.XLSX_RE; if (!X) return;
    var lb = X.libro(), h = lb.hoja('REVISION P&ID', { orientacion: 'landscape' }), pr = P.activo() || {};
    var cab = ['N°', 'P&ID', 'TAG', 'LETRAS', 'NÚMERO', 'ÁREA', 'SEÑAL', 'SERVICIO', 'EQUIPO / LÍNEA', 'EN LISTADO', 'ORIGEN', 'CONFIANZA', 'ESTADO', 'REVISOR', 'FECHA', 'EXPORTADO', 'NOTA'];
    h.cols([5, 26, 20, 8, 9, 7, 8, 34, 22, 10, 22, 10, 11, 18, 11, 10, 22]);
    h.celda(0, 0, 'REVISIÓN DE INSTRUMENTOS DESDE P&ID · ' + String(pr.nombre || '').toUpperCase(), { b: true, sz: 12 });
    h.celda(1, 0, 'Generado en la Suite ReyEngi el ' + hoy() + (S.listado ? ' · cruzado con ' + S.listado.archivo : ''), { color: '555555' });
    cab.forEach(function (t, i) { h.celda(3, i, t, { b: true, fill: '022A55', color: 'FFFFFF', h: 'center', borde: true }); });
    var nomH = {}; S.hojas.forEach(function (x) { nomH[x.id] = x.plano || x.nombre; });
    S.cand.forEach(function (c, i) {
      var f = [i + 1, nomH[c.hoja] || '', tagDe(c), c.letras, c.num + (c.suf || ''), c.area, TIPO_TXT[c.tipo] || '', c.servicio, c.equipo, S.listado ? (c.enListado ? 'SÍ' : 'NO') : '', c.origen, c.conf, c.estado.toUpperCase(), c.revisor || '', c.fechaRev || '', c.exportado ? 'SÍ' : '', c.nota];
      var st = { borde: true, fill: c.estado === 'validado' ? 'E3F4EA' : c.estado === 'rechazado' ? 'FBE4E4' : 'FFF4DC' };
      f.forEach(function (v, j) { h.celda(4 + i, j, String(v == null ? '' : v), st); });
    });
    var bytes = X.generar(lb), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = 'Revision-PID.xlsx'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  });

  // ── Exportación a los entregables del proyecto ──
  $('#revisor').addEventListener('input', function () { S.revisor = this.value; guardar(); });
  $('#bExportar').addEventListener('click', function () {
    var rev = $('#revisor').value.trim();
    if (!rev) { toast('Indica el nombre del revisor antes de exportar.'); $('#revisor').focus(); return; }
    var L = S.cand.filter(function (c) { return c.estado === 'validado' && !c.exportado && c.letras && c.num; });
    if (!L.length) { toast('No hay instrumentos validados pendientes de exportar.'); return; }
    var pend = S.cand.filter(function (c) { return c.estado === 'pendiente'; }).length;
    if (pend && !confirm('Quedan ' + pend + ' instrumentos pendientes de revisión. ¿Exportar igual los ' + L.length + ' validados?')) return;
    var E = P.leer('lazos', null) || { senales: [], inst: [], lazos: {}, modulos: [], revs: [], over: {}, cfg: {}, doc: {} };
    E.senales = E.senales || []; E.inst = E.inst || []; E.lazos = E.lazos || {};
    var existe = {}; E.senales.forEach(function (s) { existe[String(s.tag).toUpperCase()] = 1; }); E.inst.forEach(function (x) { if (x.tag) existe[String(x.tag).toUpperCase()] = 1; });
    var nomH = {}; S.hojas.forEach(function (x) { nomH[x.id] = x.plano || x.nombre; });
    var nS = 0, nI = 0, nD = 0, nL = {};
    L.forEach(function (c) {
      var tag = tagDe(c).toUpperCase(), pid = nomH[c.hoja] || '';
      if (existe[tag]) { nD++; c.exportado = true; return; }
      existe[tag] = 1;
      if (/^(AI|AO|DI|DO)$/.test(c.tipo)) {
        E.senales.push({ id: uid(), tag: tag, tipo: c.tipo, hilos: '2', servicio: c.servicio || '', lazo: '', canal: '', pid: pid, obs: c.nota || '', origenPid: true });
        if (c.equipo) E.inst.push({ id: uid(), tag: tag, linea: c.equipo, pid: pid });
        nS++;
      } else {
        E.inst.push({ id: uid(), tag: tag, manual: true, servicio: c.servicio || '', linea: c.equipo || '', pid: pid, obs: c.nota || '' });
        nI++;
      }
      var lz = ISA.lazoDe(tag); if (c.servicio && !(E.lazos[lz] && E.lazos[lz].servicio)) E.lazos[lz] = Object.assign({}, E.lazos[lz] || {}, { servicio: c.servicio });
      nL[lz] = 1; c.exportado = true; c.revisor = c.revisor || rev;
    });
    if (!P.escribir('lazos', E)) { toast('No se pudo guardar en el proyecto (almacenamiento lleno).'); return; }
    S.exportaciones = (S.exportaciones || []).concat([{ fecha: hoy(), revisor: rev, senales: nS, inst: nI }]);
    guardar(); pintarTodo();
    $('#msgExport').innerHTML = '<div class="okmsg">Exportado por <b>' + esc(rev) + '</b>: ' + nS + ' señales al listado de E/S (' + Object.keys(nL).length + ' lazos), ' + nI + ' instrumentos sin E/S al listado de instrumentos' + (nD ? ', ' + nD + ' ya existían y no se duplicaron' : '') + '.<br>Revisa: <a href="../lazos/#inst">Listado de instrumentos</a> · <a href="../lazos/#io">Listado de E/S</a> (asigna tarjeta y canal) · <a href="../lazos/#lazos">Diagramas de lazo</a> · <a href="../lazos/#circ">Listado de circuitos</a></div>';
  });

  // ── Proyecto activo ──
  var sp = $('#proy');
  function listaProy() { sp.innerHTML = P.lista().map(function (p) { return '<option value="' + p.id + '"' + (p.id === P.activoId() ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join(''); }
  sp.addEventListener('change', function () { P.seleccionar(sp.value); iniciar(); });
  function iniciar() {
    cargar(); V.hoja = null; V.img = null; V.seg = null; $('#vVacio').hidden = false;
    $('#revisor').value = S.revisor || ''; if (!$('#fechaRev').value) $('#fechaRev').value = hoy();
    listaProy(); pintarTodo(); tamCanvas(); pintarVista();
    if (S.hojas.length) mostrarHoja(S.hojas[0].id);
  }
  iniciar();
  window.__PID = { estado: function () { return S; }, tipoSugerido: tipoSugerido, esLetras: esLetras };
})();
