/* Suite ReyEngi · Canalizaciones · Cajas de paso y de derivación
 * Reúne los ductos de varios instrumentos en una caja y sale con un solo ducto. El usuario arma la caja a mano
 * (entradas por cada cara, cable de cada una, cara de salida) y la app entrega: tamaño de cada ducto de entrada,
 * cable y ducto de salida, medidas mínimas de la caja, caja comercial recomendada, verificaciones y materiales.
 *
 * Criterios:
 *  - Ocupación de ductos: RIC N°04 (SEC) Tabla N°4.21, con el mismo cálculo del módulo de canalizaciones.
 *  - Caja: RIC N°04 5.23 (25 % de volumen libre) y 5.24 (tuercas, contratuercas y boquillas). Como el RIC no da una
 *    fórmula de medidas, se usa de referencia NEC 314.28: tiro recto ≥ 8 × diámetro comercial del ducto mayor;
 *    tiro en ángulo o en U ≥ 6 × el ducto mayor + la suma de los demás ductos de la misma cara.
 *  - Con regleta: un borne por conductor y por pantalla, más reserva; paso de 5,2 mm (borne de 2,5 mm²).
 *  - Cajas: medidas del catálogo MJM (ed. 13-09-2023) y medidas comerciales habituales de cajas de bornes IP66.
 */
(function () {
  'use strict';
  var C = window.LAZOS_COND, I = C && C._; if (!I) return;
  var A = I.A, esc = I.esc, n1 = I.n1, up = I.up, $ = function (s, r) { return (r || document).querySelector(s); };
  var LADOS = { izq: 'Izquierda', der: 'Derecha', arr: 'Arriba', aba: 'Abajo' }, OPU = { izq: 'der', der: 'izq', arr: 'aba', aba: 'arr' };
  var MODOS = { paso: 'Caja de paso (los cables siguen sin cortarse)', bornes: 'Caja de derivación con regleta de bornes' };
  var CRIT = { nec: 'Holgado · referencia NEC 314.28 (8 × y 6 ×)', compacto: 'Compacto · espacio físico y radio de curvatura de los cables' };
  // Cajas de bornes de chapa de acero IP66: medidas comerciales habituales (ancho × alto × fondo, mm)
  var CAJ_COM = [[150, 150, 80], [150, 150, 120], [300, 150, 80], [300, 150, 120], [200, 200, 80], [300, 200, 120], [400, 200, 80], [400, 200, 120]];
  var PASO_BORNE = 5.2;

  function base() { var b = I.datos(); b.cajas = b.cajas || []; if (!b.cajas.length) b.cajas.push(nueva(1)); if (!b.cajas.some(function (c) { return c.id === b.cajaSel; })) b.cajaSel = b.cajas[0].id; return b; }
  function nueva(i) { return { id: A.uid(), tag: 'JB-' + (i < 10 ? '00' : i < 100 ? '0' : '') + i, modo: 'bornes', crit: 'nec', tubo: 'CAG', reserva: 20, salida: { lado: 'der', med: '' }, ent: [ent('izq'), ent('izq')] }; }
  function ent(lado) { return { id: A.uid(), lado: lado, tag: '', cat: 'par:UI-01:0', n: 1, med: '' }; }
  function actual() { var b = base(); return b.cajas.filter(function (c) { return c.id === b.cajaSel; })[0]; }
  function pulg(med) { return String(med).split(' ').reduce(function (a, t) { var q = t.replace('"', '').split('/'); return a + (q.length === 2 ? q[0] / q[1] : +q[0]); }, 0); }
  function tr(med) { return pulg(med) * 25.4; }
  function catDe(id) { return I.CATI[id] || I.CATI['par:UI-01:0'] || C.CAT[0]; }
  function tubo(cj, cables, med) { // ducto para un conjunto de cables; med manual opcional
    var dc = { tag: '', tubo: cj.tubo, crit: 'RIC', cond: 'normal', min: '3/4"', reserva: 0, largo: '', curvas: '', cables: cables }, r = C.calcular(dc), T = C.TUBOS[cj.tubo];
    var s = r.elegido ? r.elegido.s : null, man = med && T.s.filter(function (x) { return x[0] === med; })[0];
    if (man) { var f = r.filas ? r.filas.filter(function (x) { return x.s[0] === med; })[0] : null; return { r: r, s: man, occ: f ? f.occ : r.suma / I.area(man[2]) * 100, ok: f ? f.ok !== false && (f.occ <= r.lim) : r.suma / I.area(man[2]) * 100 <= r.lim, manual: true, auto: s }; }
    return { r: r, s: s || T.s[T.s.length - 1], occ: r.elegido ? r.elegido.occ : 0, ok: !!r.elegido, manual: false, auto: s };
  }
  function cuenta(k) { var m = /^(\d+)\s*(pares?|tr[ií]os?|tr[ií]adas?)/i.exec(k.desc); return m ? { n: +m[1], tipo: /^p/i.test(m[2]) ? 'par' : 'trio' } : null; }
  function elegir(fam, tipo, falta, awg) { // cable multipar / multitrío / multiconductor que cubra «falta» elementos
    var c = C.CAT.filter(function (x) { return x.f === fam && String(x.awg) === String(awg); }).map(function (x) { var q = cuenta(x); return { k: x, n: tipo === 'cond' ? x.nc : q ? q.n : 0 }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return a.n - b.n; });
    if (!c.length) return null; var uno = c.filter(function (x) { return x.n >= falta; })[0]; if (uno) return { k: uno.k, n: 1, cap: uno.n };
    var mx = c[c.length - 1], nn = Math.ceil(falta / mx.n), por = Math.ceil(falta / nn), cada = c.filter(function (x) { return x.n >= por; })[0] || mx; return { k: cada.k, n: nn, cap: cada.n * nn };
  }

  function calcular(cj) {
    var o = { ent: [], avisos: [], mats: [], sal: null }, res = 1 + (Math.max(0, +cj.reserva || 0)) / 100, cls = {};
    var pares = 0, trios = 0, cond = 0, otros = [], bornes = 0, awgS = {}, awgC = {}, rcMax = 0, volCab = 0;
    cj.ent.forEach(function (e) {
      var k = catDe(e.cat), n = Math.max(1, Math.round(+e.n || 1)), t = tubo(cj, [{ tag: e.tag, cat: k.id, n: n }], e.med), sv = I.servDe(k.f), q = cuenta(k);
      o.ent.push({ e: e, k: k, n: n, t: t, sv: sv }); cls[sv] = 1;
      var rc = k.rc || (k.ap ? 12 : /FLEX/i.test(k.cod + k.desc) ? 4 : 8) * k.d; if (rc > rcMax) rcMax = rc;
      if (k.fo) otros.push({ tag: e.tag, cat: k.id, n: n });
      else if (sv === 'inst') { var np = q ? q.n : 1, tri = (q && q.tipo === 'trio') || (!q && k.nc === 3); if (tri) trios += np * n; else pares += np * n; awgS[k.awg] = (awgS[k.awg] || 0) + n; bornes += (k.nc + (k.ap ? np : 0)) * n; }
      else if (sv === 'ctrl') { cond += k.nc * n; awgC[k.awg] = (awgC[k.awg] || 0) + n; bornes += k.nc * n; }
      else { otros.push({ tag: e.tag, cat: k.id, n: n }); bornes += k.nc * n; }
    });
    function mayor(m, def) { var ks = Object.keys(m); return ks.length ? ks.sort(function (a, b) { return m[b] - m[a]; })[0] : def; }
    // cables de salida
    var sal = [];
    if (cj.modo === 'bornes') {
      if (pares) { var a = elegir('pvicp', 'par', Math.ceil(pares * res), mayor(awgS, '18')) || elegir('pvicp', 'par', Math.ceil(pares * res), '18'); if (a) sal.push({ tag: cj.tag + '-MP', cat: a.k.id, n: a.n, nota: pares + ' pares en uso de ' + a.cap }); }
      if (trios) { var b = elegir('pvict', 'trio', Math.ceil(trios * res), mayor(awgS, '18')) || elegir('pvict', 'trio', Math.ceil(trios * res), '18'); if (b) sal.push({ tag: cj.tag + '-MT', cat: b.k.id, n: b.n, nota: trios + ' tríos en uso de ' + b.cap }); }
      if (cond) { var c = elegir('cvtc', 'cond', Math.ceil(cond * res), mayor(awgC, '14')) || elegir('cvtc', 'cond', Math.ceil(cond * res), '14'); if (c) sal.push({ tag: cj.tag + '-MC', cat: c.k.id, n: c.n, nota: cond + ' conductores en uso de ' + c.cap }); }
      otros.forEach(function (x) { sal.push(x); });
    } else cj.ent.forEach(function (e) { var k = catDe(e.cat); sal.push({ tag: e.tag, cat: k.id, n: Math.max(1, Math.round(+e.n || 1)) }); });
    o.cables = sal; o.sal = tubo(cj, sal, cj.salida.med); o.pares = pares; o.trios = trios; o.cond = cond;
    sal.forEach(function (x) { var k = catDe(x.cat), rc = k.rc || (k.ap ? 12 : 8) * k.d; if (rc > rcMax) rcMax = rc; });
    // regleta
    if (cj.modo === 'bornes') { o.bornes = Math.ceil(bornes * res); o.riel = Math.ceil(o.bornes * PASO_BORNE + 20); o.filas = Math.max(1, Math.ceil(o.riel / 500)); }
    // medidas mínimas de la caja: L entre caras izquierda y derecha, A entre arriba y abajo, P fondo
    var todos = o.ent.map(function (x) { return { lado: x.e.lado, med: x.t.s[0], de: x.t.s[1] }; }).concat([{ lado: cj.salida.lado, med: o.sal.s[0], de: o.sal.s[1], sal: true }]);
    var porLado = { izq: [], der: [], arr: [], aba: [] }; todos.forEach(function (x) { porLado[x.lado].push(x); });
    var Lm = 100, Am = 100, razones = [], sl = cj.salida.lado, eje = function (l) { return l === 'izq' || l === 'der' ? 'L' : 'A'; };
    function sube(e, v, por) { v = Math.ceil(v); if (e === 'L') { if (v > Lm) { Lm = v; razones.L = por; } } else if (v > Am) { Am = v; razones.A = por; } }
    if (cj.crit === 'nec') {
      o.ent.forEach(function (x) { if (x.e.lado === OPU[sl]) { var m = Math.max(tr(x.t.s[0]), tr(o.sal.s[0])); sube(eje(sl), 8 * m, 'tiro recto: 8 × ' + (tr(x.t.s[0]) >= tr(o.sal.s[0]) ? x.t.s[0] : o.sal.s[0]) + ' = ' + n1(8 * m, 0) + ' mm'); } });
      Object.keys(porLado).forEach(function (l) { var v = porLado[l]; if (!v.length) return; var angulo = l === sl ? v.length > 1 || o.ent.some(function (x) { return x.e.lado !== OPU[sl]; }) : l !== OPU[sl]; if (!angulo) return;
        var mx = v.slice().sort(function (a, b) { return tr(b.med) - tr(a.med); })[0], sum = v.reduce(function (a, x) { return a + tr(x.med); }, 0) - tr(mx.med), val = 6 * tr(mx.med) + sum;
        sube(eje(l), val, 'tiro en ángulo desde la cara ' + LADOS[l].toLowerCase() + ': 6 × ' + mx.med + (sum ? ' + ' + n1(sum, 0) + ' mm de los demás ductos' : '') + ' = ' + n1(val, 0) + ' mm'); });
    } else {
      o.ent.forEach(function (x) { if (x.e.lado === OPU[sl]) sube(eje(sl), Math.max(150, 2 * rcMax), 'tiro recto: el doble del radio de curvatura del cable más exigente (' + n1(rcMax, 0) + ' mm)'); else { sube(eje(x.e.lado), rcMax + x.t.s[1] + 40, 'giro del cable: radio de curvatura ' + n1(rcMax, 0) + ' mm más el ducto'); sube(eje(sl), rcMax + o.sal.s[1] + 40, 'giro del cable: radio de curvatura ' + n1(rcMax, 0) + ' mm más el ducto'); } });
    }
    // espacio físico de cada cara: conectores lado a lado con 25 mm entre ellos y a los bordes
    Object.keys(porLado).forEach(function (l) { var v = porLado[l]; if (!v.length) return; var nec = v.reduce(function (a, x) { return a + x.de + 12 + 25; }, 25); sube(eje(l) === 'L' ? 'A' : 'L', nec, v.length + ' conector(es) en la cara ' + LADOS[l].toLowerCase() + ' con 25 mm de separación'); });
    var Pm = Math.max(75, Math.ceil(Math.max.apply(null, todos.map(function (x) { return x.de; })) + 40));
    if (cj.modo === 'bornes') { var lr = Math.ceil(o.riel / o.filas) + 100, al = o.filas * 125 + 75; var horiz = sl === 'izq' || sl === 'der' || true; sube('L', lr, 'regleta de ' + o.bornes + ' bornes (' + o.riel + ' mm' + (o.filas > 1 ? ' en ' + o.filas + ' filas' : '') + ') más 50 mm por lado'); sube('A', al, o.filas + ' fila(s) de bornes con espacio para peinar los cables'); Pm = Math.max(Pm, 120); }
    o.min = { L: Lm, A: Am, P: Pm }; o.razones = razones;
    // caja comercial que cubre las medidas (se acepta girada)
    function sirve(d) { return d[2] >= Pm && ((d[0] >= Lm && d[1] >= Am) || (d[0] >= Am && d[1] >= Lm)); }
    function orienta(d) { return d[0] >= Lm && d[1] >= Am ? d : [d[1], d[0], d[2]]; }
    var cands = I.CAJ_N4.map(function (d) { return { d: d, n: 'Caja de derivación NEMA 4', f: I.MJM }; }).concat(CAJ_COM.map(function (d) { return { d: d, n: 'Caja de bornes de chapa de acero IP66', f: 'Medida comercial habitual' }; }), I.CAJ_ESP.map(function (x) { return { d: [x[1], x[2], x[3]], n: 'Caja especial ' + x[0], f: I.MJM }; }))
      .filter(function (x) { return sirve(x.d); }).sort(function (a, b) { return a.d[0] * a.d[1] * a.d[2] - b.d[0] * b.d[1] * b.d[2]; });
    if (cands.length) { var d = orienta(cands[0].d); o.caja = { n: cands[0].n + ' ' + cands[0].d[0] + 'x' + cands[0].d[1] + 'x' + cands[0].d[2] + ' mm', d: d, f: cands[0].f, otras: cands.slice(1, 3).map(function (x) { return x.n + ' ' + x.d.join('x') + ' mm (' + x.f + ')'; }) }; }
    else { var r50 = function (v) { return Math.ceil(v / 50) * 50; }; o.caja = { n: 'Caja a medida de ' + r50(Lm) + 'x' + r50(Am) + 'x' + r50(Pm) + ' mm', d: [r50(Lm), r50(Am), r50(Pm)], f: 'A medida', medida: true, otras: [] }; }
    // volumen libre (RIC N°04 5.23)
    var Lc = 1.3 * Math.max(o.caja.d[0], o.caja.d[1]); cj.ent.forEach(function (e) { var k = catDe(e.cat); volCab += I.area(k.d) * Math.max(1, +e.n || 1) * Lc; }); if (cj.modo === 'bornes') sal.forEach(function (x) { volCab += I.area(catDe(x.cat).d) * x.n * Lc; });
    o.vol = volCab / (o.caja.d[0] * o.caja.d[1] * o.caja.d[2]) * 100;
    // verificaciones
    function av(sev, txt, ref, sug) { o.avisos.push({ sev: sev, txt: txt, ref: ref || '', sug: sug || '' }); }
    if (!cj.ent.length) av('warn', 'La caja no tiene entradas.', '', 'Agrega una entrada con el signo + de la cara por donde llega el ducto.');
    if ((cls.inst || cls.fo) && cls.fuerza) av('err', 'La caja junta cables de señal con cables de fuerza.', 'RIC N°04 7.1.7', 'Lleva la fuerza por otra caja y otro ducto.');
    else if (cls.inst && cls.ctrl) av('warn', 'La caja junta instrumentación con control.', 'RIC N°04 7.1.7', 'Si el control es de 120 VAC, usa cajas separadas o un separador metálico dentro de la caja.');
    else if (cj.ent.length) av('ok', 'Los cables de la caja son de un mismo tipo de servicio.', 'RIC N°04 7.1.7');
    o.ent.forEach(function (x, i) { if (x.t.manual && !x.t.ok) av('err', 'Entrada ' + (i + 1) + ': el ducto de ' + x.t.s[0] + ' queda con ' + n1(x.t.occ, 1) + ' % de ocupación, sobre el límite de ' + x.t.r.lim + ' %.', 'RIC N°04 Tabla N°4.21', 'Usa ' + (x.t.auto ? x.t.auto[0] : 'un tamaño mayor') + ' o deja el tamaño en automático.'); });
    if (o.sal.manual && !o.sal.ok) av('err', 'El ducto de salida de ' + o.sal.s[0] + ' queda con ' + n1(o.sal.occ, 1) + ' % de ocupación, sobre el límite de ' + o.sal.r.lim + ' %.', 'RIC N°04 Tabla N°4.21', 'Usa ' + (o.sal.auto ? o.sal.auto[0] : 'dos ductos de salida') + ' o deja el tamaño en automático.');
    else if (!o.sal.ok) av('err', 'Ningún tamaño de tubería alcanza para la salida.', 'RIC N°04 Tabla N°4.21', 'Divide la caja en dos o sal con dos ductos.');
    else if (sal.length) av('ok', 'Ducto de salida ' + o.sal.s[0] + ' con ' + n1(o.sal.occ, 1) + ' % de ocupación (límite ' + o.sal.r.lim + ' %).', 'RIC N°04 Tabla N°4.21');
    av(o.vol <= 75 ? 'ok' : 'err', 'Los cables ocupan cerca del ' + n1(o.vol, 0) + ' % del volumen de la caja' + (o.vol <= 75 ? ': queda más del 25 % libre.' : ': no queda el 25 % libre.'), 'RIC N°04 5.23', o.vol <= 75 ? '' : 'Usa una caja más profunda o más grande.');
    if (cj.crit === 'nec') av('ok', 'Medidas con el criterio holgado (8 × en tiro recto, 6 × en ángulo). Es obligatorio en el NEC solo para conductores 4 AWG o mayores; en instrumentación deja espacio cómodo para tender y peinar.', 'NEC 314.28 (referencia)');
    else av('warn', 'Medidas con el criterio compacto: revisa en terreno que los cables giren sin forzarse.', 'RIC N°04 6.2.8', 'Si hay espacio, usa el criterio holgado.');
    if (o.caja.medida) av('warn', 'Ninguna caja de los catálogos cubre ' + Lm + ' × ' + Am + ' × ' + Pm + ' mm.', '', 'Pide una caja a medida, reparte las entradas en dos cajas o usa el criterio compacto.');
    if (cj.modo === 'bornes' && sal.some(function (x) { return x.n > 1 && /-M[PTC]$/.test(x.tag); })) av('warn', 'La salida necesita más de un multicable del mismo tipo.', '', 'Revisa si conviene dividir la caja.');
    // materiales de referencia
    o.mats.push({ c: 1, u: 'un', d: o.caja.n + ' · tapa apernada con empaquetadura', f: o.caja.f });
    var conn = {}; todos.forEach(function (x) { conn[x.med] = (conn[x.med] || 0) + 1; });
    Object.keys(conn).sort(function (a, b) { return tr(a) - tr(b); }).forEach(function (m) { o.mats.push({ c: conn[m], u: 'jgo', d: 'Conector estanco de ' + m + ' con tuerca, contratuerca y boquilla', f: 'RIC N°04 5.24' }); });
    if (cj.modo === 'bornes') { o.mats.push({ c: o.bornes, u: 'un', d: 'Borne de paso de 2,5 mm² (incluye ' + (+cj.reserva || 0) + ' % de reserva)', f: 'Criterio de la app' }); o.mats.push({ c: o.filas, u: 'un', d: 'Riel DIN tipo omega de ' + (Math.ceil(o.riel / o.filas) <= 290 ? 290 : 1000) + ' mm' + (Math.ceil(o.riel / o.filas) <= 290 ? '' : ', cortado a ' + Math.ceil(o.riel / o.filas) + ' mm'), f: I.MJM }); o.mats.push({ c: 2 * o.filas, u: 'un', d: 'Tope final de regleta', f: 'Criterio de la app' }); if (cls.inst) o.mats.push({ c: 1, u: 'un', d: 'Barra de tierra aislada para pantallas', f: 'Criterio de la app' }); o.mats.push({ c: 1, u: 'un', d: 'Placa de montaje', f: 'Criterio de la app' }); }
    sal.forEach(function (x) { var k = catDe(x.cat); if (/-M[PTC]$/.test(x.tag)) o.mats.push({ c: x.n, u: 'cable', d: 'Cable de salida ' + (k.cod !== '—' ? k.cod + ' ' : '') + k.desc + ' · Ø ' + n1(k.d, 1) + ' mm' + (x.nota ? ' (' + x.nota + ')' : ''), f: (C.FAM[k.f] || '').split(' · ').slice(-1)[0] }); });
    return o;
  }

  // ── Dibujo ──
  function dibujo(cj, o, sel) {
    var d = o.caja.d, L = d[0], Al = d[1], W = 880, H = 700, mx = 215, sup = 170, inf = 172, k = Math.min((W - 2 * mx) / L, (H - sup - inf) / Al), l = L * k, a = Al * k, x0 = (W - l) / 2, y0 = sup + (H - sup - inf - a) / 2, stub = 58;
    function corta(t, n) { t = String(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="cj-svg" role="img" aria-label="Caja ' + esc(cj.tag) + ' con sus entradas y su salida"><rect width="' + W + '" height="' + H + '" fill="#fff"/><rect class="cj-banda" width="' + W + '" height="40"/><text class="cj-tit" x="16" y="25">' + esc(up(cj.tag)) + '</text><text class="cj-sub" x="' + (W - 16) + '" y="25" text-anchor="end">' + esc(corta(o.caja.n, 70)) + '</text>';
    var porLado = { izq: [], der: [], arr: [], aba: [] }; o.ent.forEach(function (x, i) { porLado[x.e.lado].push({ x: x, i: i }); }); porLado[cj.salida.lado].push({ sal: true });
    var pts = [], salP = null;
    Object.keys(porLado).forEach(function (ld) { var v = porLado[ld], n = v.length; v.forEach(function (it, j) {
      var f = (j + 1) / (n + 1), hz = ld === 'arr' || ld === 'aba', px = hz ? x0 + l * f : (ld === 'izq' ? x0 : x0 + l), py = hz ? (ld === 'arr' ? y0 : y0 + a) : y0 + a * f;
      var de = Math.max(9, (it.sal ? o.sal.s[1] : it.x.t.s[1]) * k), dx = ld === 'izq' ? -1 : ld === 'der' ? 1 : 0, dy = ld === 'arr' ? -1 : ld === 'aba' ? 1 : 0;
      var rx = dx ? Math.min(px, px + dx * stub) : px - de / 2, ry = dy ? Math.min(py, py + dy * stub) : py - de / 2, rw = dx ? stub : de, rh = dy ? stub : de;
      var cls = it.sal ? 'cj-sal' : 'cj-ent' + (it.x.e.id === sel ? ' sel' : ''), at = it.sal ? ' data-sal="1"' : ' data-e="' + it.x.e.id + '"';
      s += '<g class="' + cls + '"' + at + ' tabindex="0" role="button" aria-label="' + (it.sal ? 'Ducto de salida' : 'Entrada ' + (it.i + 1)) + '"><rect x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh + '"/><rect class="cj-con" x="' + (dx ? px - 4 + (dx < 0 ? -3 : 0) : px - de / 2 - 3) + '" y="' + (dy ? py - 4 + (dy < 0 ? -3 : 0) : py - de / 2 - 3) + '" width="' + (dx ? 7 : de + 6) + '" height="' + (dy ? 7 : de + 6) + '"/>';
      // rótulos: a los lados van junto al ducto; arriba y abajo se escalonan en dos niveles para que no se pisen entre sí
      var niv = hz && n > 1 ? j % 2 : 0, tx = dx ? px + dx * (stub + 8) : Math.max(95, Math.min(W - 95, px)), ty = py + dy * (stub + 14 + niv * 30), anc = dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', t1 = corta(it.sal ? 'SALIDA · ' + o.sal.s[0] : (it.x.e.tag || 'Entrada ' + (it.i + 1)) + ' · ' + it.x.t.s[0], 26), t2 = corta(it.sal ? n1(o.sal.occ, 0) + ' % ocupado' : (it.x.n > 1 ? it.x.n + ' × ' : '') + it.x.k.desc, 30);
      if (niv) s += '<path class="cj-guia" d="M' + px + ' ' + (py + dy * (stub + 2)) + 'V' + (py + dy * (stub + 30)) + '"/>';
      var y1 = dy ? (dy < 0 ? ty - 13 : ty + 4) : py - 3, y2 = dy ? (dy < 0 ? ty - 1 : ty + 16) : py + 10;
      s += '<text x="' + tx + '" y="' + y1 + '" text-anchor="' + anc + '" class="cj-t1">' + esc(t1) + '</text><text x="' + tx + '" y="' + y2 + '" text-anchor="' + anc + '" class="cj-t2">' + esc(t2) + '</text></g>';
      if (it.sal) salP = { x: px, y: py, dx: dx, dy: dy }; else pts.push({ x: px, y: py, dx: dx, dy: dy, c: I.SERV[it.x.sv].c });
    }); });
    s += '<rect class="cj-caja" x="' + x0 + '" y="' + y0 + '" width="' + l + '" height="' + a + '" rx="4"/><rect class="cj-tapa" x="' + (x0 + 6) + '" y="' + (y0 + 6) + '" width="' + (l - 12) + '" height="' + (a - 12) + '" rx="3"/>';
    // cables por dentro
    var cx = x0 + l / 2, cy = y0 + a / 2;
    if (cj.modo === 'bornes') { var rl = Math.min(l - 40, Math.max(40, o.riel / o.filas * k)); for (var f = 0; f < o.filas; f++) { var yy = cy + (f - (o.filas - 1) / 2) * Math.min(46, a / (o.filas + 1)); s += '<rect class="cj-riel" x="' + (cx - rl / 2) + '" y="' + (yy - 7) + '" width="' + rl + '" height="14"/>'; for (var q = 0, nq = Math.min(60, Math.floor(rl / 5)); q < nq; q++) s += '<path class="cj-bor" d="M' + (cx - rl / 2 + (q + 0.5) * rl / nq) + ' ' + (yy - 7) + 'v14"/>'; }
      pts.forEach(function (p, i) { var bx = cx + (i - (pts.length - 1) / 2) * Math.min(34, (rl - 20) / Math.max(1, pts.length)); s += '<path class="cj-cab" style="stroke:' + p.c + '" d="M' + p.x + ' ' + p.y + 'C' + (p.x - p.dx * 50) + ' ' + (p.y - p.dy * 50) + ' ' + bx + ' ' + (cy + (p.y < cy ? -40 : 40)) + ' ' + bx + ' ' + (cy + (p.y < cy ? -8 : 8)) + '"/>'; });
      if (salP) s += '<path class="cj-cab cj-cs" d="M' + cx + ' ' + cy + 'C' + cx + ' ' + (cy + (salP.y < cy ? -40 : 40)) + ' ' + (salP.x - salP.dx * 60) + ' ' + (salP.y - salP.dy * 60) + ' ' + salP.x + ' ' + salP.y + '"/>';
    } else if (salP) pts.forEach(function (p) { s += '<path class="cj-cab" style="stroke:' + p.c + '" d="M' + p.x + ' ' + p.y + 'C' + (p.x - p.dx * l * 0.35) + ' ' + (p.y - p.dy * a * 0.35) + ' ' + (salP.x - salP.dx * l * 0.35) + ' ' + (salP.y - salP.dy * a * 0.35) + ' ' + salP.x + ' ' + salP.y + '"/>'; });
    // botones + de cada cara
    [['izq', x0 - 17, y0 + a - 13], ['der', x0 + l + 17, y0 + 13], ['arr', x0 + 13, y0 - 17], ['aba', x0 + l - 13, y0 + a + 17]].forEach(function (b) { var bx = b[1], by = b[2];
      s += '<g class="cj-mas" data-add="' + b[0] + '" tabindex="0" role="button" aria-label="Agregar una entrada por la cara ' + LADOS[b[0]].toLowerCase() + '"><title>Agregar una entrada por la cara ' + LADOS[b[0]].toLowerCase() + '</title><circle cx="' + bx + '" cy="' + by + '" r="10"/><path d="M' + (bx - 5) + ' ' + by + 'h10M' + bx + ' ' + (by - 5) + 'v10"/></g>'; });
    // cotas
    var yc = H - 30, xc = 30;
    s += '<g class="cj-cota"><path d="M' + x0 + ' ' + yc + 'H' + (x0 + l) + 'M' + x0 + ' ' + (yc - 6) + 'v12M' + (x0 + l) + ' ' + (yc - 6) + 'v12"/><text x="' + cx + '" y="' + (yc + 17) + '" text-anchor="middle">L = ' + L + ' mm</text><path d="M' + xc + ' ' + y0 + 'V' + (y0 + a) + 'M' + (xc - 6) + ' ' + y0 + 'h12M' + (xc - 6) + ' ' + (y0 + a) + 'h12"/><text transform="translate(' + (xc - 9) + ' ' + cy + ') rotate(-90)" text-anchor="middle">A = ' + Al + ' mm</text><text x="' + (W - 16) + '" y="' + (yc + 17) + '" text-anchor="end">Fondo P = ' + d[2] + ' mm</text></g></svg>';
    return s;
  }

  // ── Interfaz ──
  var selE = null;
  function css() {
    if ($('#cjCss')) return; var st = document.createElement('style'); st.id = 'cjCss';
    st.textContent = ['#kCj{background:#0b1a2b;color:#e8eef5;border:1px solid #223a57;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;margin-top:14px}',
      '#kCj .cj-cab{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 14px;background:#022A55;border-bottom:2px solid #E8A317}#kCj .cj-cab b{font-size:15px;margin-right:6px}#kCj .cj-cab .esp{flex:1}#kCj button{font:inherit;font-size:12.5px;font-weight:600;padding:6px 11px;border-radius:7px;border:1px solid #5d7ea6;background:#12304f;color:#e8eef5;cursor:pointer}#kCj button.pri{background:#FF8C32;border-color:#FF8C32;color:#1b0d02}#kCj button.pel{border-color:#F85149;color:#ffb1ab}#kCj button:focus-visible,#kCj [tabindex]:focus-visible{outline:2px solid #38C8E8;outline-offset:2px}',
      '#kCj select,#kCj input{font:inherit;font-size:13px;padding:5px 7px;border-radius:6px;border:1px solid #3a5a80;background:#0e2238;color:#e8eef5;width:100%;box-sizing:border-box}#kCj .cj-cab select{width:auto;max-width:220px}',
      '#kCj .cj-cuerpo{display:grid;grid-template-columns:300px minmax(0,1fr) 330px}#kCj .cj-izq,#kCj .cj-der{padding:12px 14px;display:grid;gap:10px;align-content:start}#kCj .cj-izq{border-right:1px solid #223a57}#kCj .cj-der{border-left:1px solid #223a57}#kCj .cj-cen{min-width:0;background:#16273b;padding:14px;display:grid;gap:8px;align-content:start}',
      '#kCj.cj-ang .cj-cuerpo{grid-template-columns:1fr 1fr}#kCj.cj-ang .cj-cen{grid-column:1/-1;order:-1}#kCj.cj-uno .cj-cuerpo{grid-template-columns:1fr}#kCj.cj-uno .cj-cen{order:-1}#kCj.cj-uno .cj-izq,#kCj.cj-uno .cj-der{border:0}',
      '#kCj .cj-vista{display:inline-flex;border:1.5px solid #E8A317;border-radius:9px;overflow:hidden;justify-self:start}#kCj .cj-vista button{border:0;border-radius:0;background:transparent}#kCj .cj-vista button[aria-pressed=true]{background:#E8A317;color:#1b1203}#kCj .cj-3d{position:relative;height:min(560px,62vh);border-radius:8px;overflow:hidden;background:#0b1a2b}#kCj .cj-3d canvas{display:block;width:100%;height:100%;outline:none}#kCj .cj-3d .labels{position:absolute;inset:0;pointer-events:none}#kCj .cj-lbl{font:700 11px system-ui,sans-serif;background:rgba(11,26,43,.85);color:#fff;border:1px solid #E8A317;border-radius:10px;padding:1px 7px;white-space:nowrap}#kCj .cj-lbl.sal{border-color:#38C8E8}#kCj .cj-carga{position:absolute;inset:0;display:grid;place-items:center;color:#9fb0c3}',
      '#kCj label{display:grid;gap:3px;font-size:12px;color:#9fb0c3}#kCj h4{margin:6px 0 0;font:700 10.5px ui-monospace,Consolas,monospace;letter-spacing:.09em;text-transform:uppercase;color:#E8A317}#kCj .cj-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}#kCj .cj-ay{margin:0;font-size:12px;color:#9fb0c3;line-height:1.45}',
      '#kCj .cj-lista{display:grid;gap:5px}#kCj .cj-it{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;text-align:left;font-weight:500;background:#0e2238}#kCj .cj-it.sel{border-color:#E8A317;background:#1a3050}#kCj .cj-it small{display:block;color:#9fb0c3;font-weight:400}#kCj .cj-ed{border:1.5px solid #E8A317;border-radius:9px;padding:10px;display:grid;gap:8px}',
      '.cj-svg{display:block;width:100%;height:auto;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.4)}.cj-svg text{font:12px Arial,Helvetica,sans-serif;fill:#17212C}.cj-svg .cj-tit{font-weight:700;font-size:15px;fill:#fff}.cj-svg .cj-sub{font-size:11.5px;fill:#dbe6f3}.cj-svg .cj-banda{fill:#022A55}.cj-svg .cj-guia{stroke:#8a96a3;stroke-width:.8;stroke-dasharray:3 2;fill:none}.cj-svg .cj-t1{font-weight:700}.cj-svg .cj-t2{font-size:10.5px;fill:#5A6573}.cj-svg .cj-caja{fill:#F6D9B8;stroke:#1F2A36;stroke-width:2}.cj-svg .cj-tapa{fill:none;stroke:#1F2A36;stroke-width:.7;stroke-dasharray:4 3}',
      '.cj-svg .cj-ent rect,.cj-svg .cj-sal rect{fill:#dfe4ea;stroke:#1F2A36;stroke-width:1.2}.cj-svg .cj-con{fill:#1F2A36!important}.cj-svg .cj-ent,.cj-svg .cj-sal,.cj-svg .cj-mas{cursor:pointer}.cj-svg .cj-ent.sel rect{fill:#FFE2A6;stroke:#C8901E;stroke-width:2}.cj-svg .cj-sal rect{fill:#BFE3F5;stroke:#0B6E99;stroke-width:1.6}.cj-svg .cj-sal .cj-t1{fill:#0B6E99}',
      '.cj-svg .cj-cab{fill:none;stroke-width:2.2;stroke-linecap:round;opacity:.85}.cj-svg .cj-cs{stroke:#0B6E99;stroke-width:4}.cj-svg .cj-riel{fill:#c7ced6;stroke:#1F2A36;stroke-width:1}.cj-svg .cj-bor{stroke:#1F2A36;stroke-width:.5}.cj-svg .cj-mas circle{fill:#FF8C32;stroke:#7a3a05}.cj-svg .cj-mas path{stroke:#1b0d02;stroke-width:2;fill:none}.cj-svg .cj-cota path{stroke:#B3261E;stroke-width:.8;fill:none}.cj-svg .cj-cota text{fill:#B3261E}',
      '#kCj .cj-res{margin:0;padding:9px 11px;border:1.5px solid #E8A317;border-radius:8px;background:rgba(232,163,23,.1);font-size:13px;line-height:1.5}#kCj .cj-res b{color:#ffd27a;font-size:15px}#kCj .cj-av{list-style:none;margin:0;padding:0;display:grid;gap:5px;font-size:12.5px}#kCj .cj-av li{padding:6px 9px;border-radius:6px;border-left:3px solid #3FB950;background:rgba(63,185,80,.1)}#kCj .cj-av li.warn{border-color:#E6A23C;background:rgba(230,162,60,.1)}#kCj .cj-av li.err{border-color:#F85149;background:rgba(248,81,73,.12)}#kCj .cj-av small{display:block;color:#9fb0c3}',
      '#kCj .cj-mat{width:100%;border-collapse:collapse;font-size:12px}#kCj .cj-mat td{padding:4px 6px;border-bottom:1px solid #223a57;vertical-align:top}#kCj .cj-mat td:first-child{white-space:nowrap;font-weight:700;color:#ffd27a}#kCj .cj-mat small{color:#9fb0c3}',
      '#kCj.cj-solo .cj-cuerpo{grid-template-columns:1fr}#kCjCfg{margin-top:0;border:0;background:transparent}#kCjCfg .cj-cfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));align-items:start}#kCjCfg .cj-izq,#kCjCfg .cj-der{border:0;padding:6px 4px}',
      '#imp .cj-imp h2{font-size:13pt;color:#022A55;margin:0 0 3mm}#imp .cj-imp svg{width:170mm;height:auto;border:0.5pt solid #9FB0C3}#imp .cj-imp td.izq{text-align:left}'].join('\n').replace(/#kCj(?=[ .{\[:])/g, ':is(#kCj,#kCjCfg)');
    document.head.appendChild(st);
  }
  // La caja vive en un bloque de la sección (#kCjBox): en la suite es la pestaña «Caja de paso / derivación»; en Conduit queda al final de la página
  function montar() {
    var cont = $('#kCjBox'); if (!cont) return null; var r = $('#kCj'); if (r) return r; css();
    r = document.createElement('div'); r.id = 'kCj';
    r.innerHTML = '<div class="cj-cab"><b>Caja de paso / derivación</b><select id="cjSel" aria-label="Caja"></select><button type="button" data-a="nueva">+ Nueva caja</button><button type="button" data-a="borrar" class="pel">Eliminar</button><span class="esp"></span><button type="button" class="pri" data-a="ducto" title="Lleva al proyecto un ducto por cada entrada y el ducto de salida, con sus circuitos, rutas y tags">Crear ductos en el proyecto</button><button type="button" data-a="pdf">Imprimir / PDF</button></div>' +
      '<div class="cj-cuerpo"><div class="cj-izq" id="cjIzq"></div><div class="cj-cen"><span class="cj-vista" role="group" aria-label="Vista"><button type="button" data-v="2d" aria-pressed="true">Vista 2D</button><button type="button" data-v="3d" aria-pressed="false">Vista 3D</button></span><div id="cjDib"></div><div class="cj-3d" id="cj3d" hidden></div><p class="cj-ay" id="cjAy"></p></div><div class="cj-der" id="cjDer"></div></div>';
    cont.appendChild(r);
    // En la suite, la configuración y el resultado van en su propia pestaña de la ventana derecha; a la izquierda queda solo el visor
    var cfgBox = $('#kCjCfgBox'); if (cfgBox) { var cf = document.createElement('div'); cf.id = 'kCjCfg'; cf.innerHTML = '<div class="cj-cfg"></div>'; cf.firstChild.append($('#cjIzq', r), $('#cjDer', r)); cfgBox.appendChild(cf); r.classList.add('cj-solo');
      cf.addEventListener('click', clic); cf.addEventListener('input', entrada); cf.addEventListener('change', entrada); }
    r.addEventListener('click', clic); r.addEventListener('input', entrada); r.addEventListener('change', entrada);
    r.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.cj-svg [tabindex]')) { e.preventDefault(); clic(e); } });
    r.addEventListener('pointerdown', arrastre);
    if (window.ResizeObserver && !cfgBox) new ResizeObserver(function () { var w = r.clientWidth; r.classList.toggle('cj-ang', w < 1080 && w >= 640); r.classList.toggle('cj-uno', w > 0 && w < 640); }).observe(r);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { pintar(true); verCfg(); } }).observe(r);
    return r;
  }
  function verCfg() { var t = document.querySelector('#v-cond .dk-tab[data-id=cajacfg]'); if (t && !t.classList.contains('on')) t.click(); }
  function abrir() { var r = montar(); if (!r) return; selE = null; pintar(true); setTimeout(function () { r.scrollIntoView({ block: 'start' }); }, 60); }
  // ── Vista 3D ──
  var ver3 = false, e3 = null, t3 = null;
  function soltar3() { if (!e3) return; cancelAnimationFrame(e3.raf); if (e3.ro) e3.ro.disconnect(); e3.controls.dispose(); e3.scene.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(function (m) { m.dispose(); }); }); e3.renderer.dispose(); if (e3.renderer.forceContextLoss) e3.renderer.forceContextLoss(); e3 = null; }
  function pintar3(cj, o) {
    var cont = $('#cj3d'); if (!cont) return; if (!I.cargar3d) { cont.innerHTML = '<div class="cj-carga">La vista 3D no está disponible.</div>'; return; }
    if (!e3) cont.innerHTML = '<div class="cj-carga">Cargando vista 3D…</div>';
    clearTimeout(t3); t3 = setTimeout(function () { I.cargar3d(function (L3) { if (!L3) { cont.innerHTML = '<div class="cj-carga">No se pudo cargar la vista 3D.</div>'; return; } if (!ver3) return; try { escena3(L3, cj, o, cont); } catch (er) { console.warn('Caja 3D', er); cont.innerHTML = '<div class="cj-carga">No se pudo dibujar la vista 3D.</div>'; } }); }, e3 ? 180 : 0);
  }
  function escena3(L3, cj, o, cont) {
    var T = L3.THREE, cam0 = e3 ? { p: e3.camera.position.clone(), t: e3.controls.target.clone() } : null; soltar3(); cont.innerHTML = '';
    var V = function (x, y, z) { return new T.Vector3(x, y, z); }, d = o.caja.d, Lx = d[0], Ay = d[1], Pz = d[2], esp = 3;
    var renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('tabindex', '0'); renderer.domElement.setAttribute('aria-label', 'Modelo 3D de la caja ' + cj.tag + '. Arrastra para girar.'); cont.appendChild(renderer.domElement);
    var lr = new L3.CSS2DRenderer(); lr.domElement.className = 'labels'; cont.appendChild(lr.domElement);
    var scene = new T.Scene(); scene.background = new T.Color(0x0b1a2b); var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(new L3.RoomEnvironment(), 0.04).texture;
    scene.add(new T.HemisphereLight(0xffffff, 0x334455, 0.6)); var sol = new T.DirectionalLight(0xffffff, 1.4); sol.position.set(Lx, Ay * 1.5, Pz * 6); scene.add(sol);
    function mat(c, r, m, op) { return new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m, transparent: op != null, opacity: op == null ? 1 : op, side: T.DoubleSide }); }
    var mCaja = mat(0xE8943A, 0.55, 0.25), g = new T.Group();
    function caja(w, h, p, x, y, z, m) { var b = new T.Mesh(new T.BoxGeometry(w, h, p), m); b.position.set(x, y, z); g.add(b); return b; }
    caja(Lx, Ay, esp, 0, 0, -Pz / 2, mCaja); caja(esp, Ay, Pz, -Lx / 2, 0, 0, mCaja); caja(esp, Ay, Pz, Lx / 2, 0, 0, mCaja); caja(Lx, esp, Pz, 0, Ay / 2, 0, mCaja); caja(Lx, esp, Pz, 0, -Ay / 2, 0, mCaja);
    caja(Lx + 16, Ay + 16, 2, 0, 0, Pz / 2 + 1, mat(0x9fc4e8, 0.2, 0.1, 0.16));   // tapa, translúcida para ver el interior
    var bordes = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(Lx + 16, Ay + 16, 2)), new T.LineBasicMaterial({ color: 0xffd27a })); bordes.position.set(0, 0, Pz / 2 + 1); g.add(bordes);
    // ductos de cada cara (la salida va última en su cara, igual que en la vista 2D)
    var porLado = { izq: [], der: [], arr: [], aba: [] }; o.ent.forEach(function (x, i) { porLado[x.e.lado].push({ x: x, i: i }); }); porLado[cj.salida.lado].push({ sal: true });
    var mTubo = mat(0xb9c1c8, 0.32, 0.85), mSal = mat(0x4FB3E0, 0.35, 0.6), mCon = mat(0x2a3440, 0.5, 0.6), pts = [], salP = null, etq = [];
    Object.keys(porLado).forEach(function (ld) { var v = porLado[ld], n = v.length; v.forEach(function (it, j) {
      var f = (j + 1) / (n + 1), hz = ld === 'arr' || ld === 'aba', dx = ld === 'izq' ? -1 : ld === 'der' ? 1 : 0, dy = ld === 'arr' ? 1 : ld === 'aba' ? -1 : 0;
      var px = hz ? -Lx / 2 + Lx * f : dx * Lx / 2, py = hz ? dy * Ay / 2 : Ay / 2 - Ay * f, de = it.sal ? o.sal.s[1] : it.x.t.s[1], largo = Math.max(120, de * 3.5);
      var c = new T.Mesh(new T.CylinderGeometry(de / 2, de / 2, largo, 28), it.sal ? mSal : mTubo); if (dx) c.rotation.z = Math.PI / 2; c.position.set(px + dx * largo / 2, py + dy * largo / 2, 0); g.add(c);
      var h = new T.Mesh(new T.CylinderGeometry(de / 2 + 6, de / 2 + 6, 16, 6), mCon); if (dx) h.rotation.z = Math.PI / 2; h.position.set(px, py, 0); g.add(h);
      var div = document.createElement('div'); div.className = 'cj-lbl' + (it.sal ? ' sal' : ''); div.textContent = it.sal ? 'Salida · ' + o.sal.s[0] : (it.x.e.tag || 'Entrada ' + (it.i + 1)) + ' · ' + it.x.t.s[0]; var lb = new L3.CSS2DObject(div); lb.position.set(px + dx * (largo + 20), py + dy * (largo + 20), 0); g.add(lb); etq.push(lb);
      var P = { p: V(px, py, 0), q: V(px - dx * Math.min(60, Lx / 4), py - dy * Math.min(60, Ay / 4), 0) };
      if (it.sal) salP = P; else pts.push({ P: P, c: I.SERV[it.x.sv].c, r: Math.max(2, it.x.k.d / 2), n: it.x.n });
    }); });
    function cable(lista, color, r) { g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lista, false, 'catmullrom', 0.4), 40, r, 10, false), mat(color, 0.6, 0.05))); }
    var zf = -Pz / 2 + 22;
    if (cj.modo === 'bornes') { var paso = Math.min(125, Ay / (o.filas + 1));
      for (var f2 = 0; f2 < o.filas; f2++) { var yy = (f2 - (o.filas - 1) / 2) * paso, len = Math.min(Lx - 60, o.riel / o.filas); caja(len + 20, 35, 7, 0, yy, -Pz / 2 + 8, mat(0xc7ced6, 0.3, 0.9)); caja(len, 46, 40, 0, yy, -Pz / 2 + 30, mat(0xd9d2bf, 0.7, 0.05)); }
      pts.forEach(function (p, i) { var bx = (i + 1) / (pts.length + 1) * Math.min(Lx - 80, o.riel / o.filas) - Math.min(Lx - 80, o.riel / o.filas) / 2, arriba = p.P.p.y >= 0; cable([p.P.p, p.P.q, V(bx, arriba ? 40 : -40, zf + 30), V(bx, arriba ? 22 : -22, zf + 24)], p.c, p.r); });
      if (salP) o.cables.forEach(function (x, i) { var k = I.CATI[x.cat], ab = salP.p.y >= 0; cable([V((i - (o.cables.length - 1) / 2) * 30, ab ? 22 : -22, zf + 24), V((i - (o.cables.length - 1) / 2) * 30, ab ? 50 : -50, zf + 30), salP.q, salP.p], '#0B6E99', Math.max(3, (k ? k.d : 10) / 2)); });
    } else if (salP) pts.forEach(function (p, i) { var m = p.P.q.clone().lerp(salP.q, 0.5); m.z = -Pz / 4 + (i % 3) * 8; cable([p.P.p, p.P.q, m, salP.q, salP.p], p.c, p.r); });
    scene.add(g);
    var D = Math.max(Lx, Ay) + 300, camera = new T.PerspectiveCamera(32, 1, D / 100, D * 30), controls = new L3.OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
    if (cam0) { camera.position.copy(cam0.p); controls.target.copy(cam0.t); } else { camera.position.set(D * 0.55, D * 0.45, D * 1.75); controls.target.set(0, 0, 0); } controls.update();
    var ro = new ResizeObserver(function () { var w = cont.clientWidth, h = cont.clientHeight; if (!w || !h) return; renderer.setSize(w, h); lr.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }); ro.observe(cont);
    e3 = { renderer: renderer, scene: scene, camera: camera, controls: controls, ro: ro, raf: 0 };
    (function loop() { if (!e3 || e3.renderer !== renderer) return; e3.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); lr.render(scene, camera); })();
  }
  function guardar() { A.guardar(); }
  function clic(e) {
    var b = base(), cj = actual(), t = e.target, bv = t.closest('button[data-v]'), bt = t.closest('button[data-a]'), g = t.closest('.cj-svg [data-add], .cj-svg [data-e], .cj-svg [data-sal]'), it = t.closest('[data-it]');
    if (bv) { ver3 = bv.dataset.v === '3d'; return pintar(false); }
    if (bt) { var a = bt.dataset.a;
      if (a === 'nueva') { var n = nueva(b.cajas.length + 1); b.cajas.push(n); b.cajaSel = n.id; selE = null; }
      else if (a === 'borrar') { if (b.cajas.length > 1) { b.cajas.splice(b.cajas.indexOf(cj), 1); b.cajaSel = b.cajas[0].id; } else { cj.ent = []; } selE = null; }
      else if (a === 'quitar') { cj.ent = cj.ent.filter(function (x) { return x.id !== selE; }); selE = null; }
      else if (a === 'dup') { var o = cj.ent.filter(function (x) { return x.id === selE; })[0]; if (o) { var c = JSON.parse(JSON.stringify(o)); c.id = A.uid(); c.tag = ''; cj.ent.splice(cj.ent.indexOf(o) + 1, 0, c); selE = c.id; } }
      else if (a === 'ducto') return crearDucto();
      else if (a === 'pdf') return imprimir();
      guardar(); return pintar(true); }
    if (g) { verCfg(); if (g.dataset.add) { var ne = ent(g.dataset.add), ult = cj.ent[cj.ent.length - 1]; if (ult) { ne.cat = ult.cat; } cj.ent.push(ne); selE = ne.id; guardar(); } else if (g.dataset.e) selE = g.dataset.e; else selE = 'sal'; return pintar(true); }
    if (it) { selE = it.dataset.it; pintar(true); }
  }
  function entrada(e) {
    var t = e.target, b = base(), cj = actual(), k;
    if (t.id === 'cjSel') { b.cajaSel = t.value; selE = null; guardar(); return pintar(true); }
    if ((k = t.dataset.c)) { cj[k] = k === 'tag' ? t.value.toUpperCase() : t.value; }
    else if ((k = t.dataset.s)) { cj.salida[k] = t.value; }
    else if ((k = t.dataset.en)) { var o = cj.ent.filter(function (x) { return x.id === selE; })[0]; if (!o) return; o[k] = k === 'tag' ? t.value.toUpperCase() : t.value; }
    else return;
    guardar(); pintar(e.type === 'change' && t.tagName === 'SELECT');
  }
  // arrastrar una entrada (o la salida) a otra cara de la caja
  function arrastre(e) {
    var g = e.target.closest && e.target.closest('.cj-svg [data-e], .cj-svg [data-sal]'); if (!g) return; var svg = g.closest('svg'), x0 = e.clientX, y0 = e.clientY, mov = false, cj = actual();
    function mv(ev) { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 10) { mov = true; svg.style.cursor = 'grabbing'; } }
    function upf(ev) { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', upf); svg.style.cursor = ''; if (!mov) return;
      var r = svg.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width - 0.5, fy = (ev.clientY - r.top) / r.height - 0.5, lado = Math.abs(fx) * r.width > Math.abs(fy) * r.height ? (fx < 0 ? 'izq' : 'der') : (fy < 0 ? 'arr' : 'aba');
      if (g.dataset.sal) cj.salida.lado = lado; else { var o = cj.ent.filter(function (x) { return x.id === g.dataset.e; })[0]; if (o) { o.lado = lado; selE = o.id; } }
      guardar(); pintar(true); }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', upf);
  }
  function opc(obj, v) { return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(obj[k]) + '</option>'; }).join(''); }
  function meds(cj, v, auto) { return '<option value="">Automático' + (auto ? ' (' + esc(auto) + ')' : '') + '</option>' + C.TUBOS[cj.tubo].s.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === v ? ' selected' : '') + '>' + esc(x[0]) + '</option>'; }).join(''); }
  function pintar(todo) {
    var b = base(), cj = actual(), o = calcular(cj);
    $('#cjSel').innerHTML = b.cajas.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cj.id ? ' selected' : '') + '>' + esc(c.tag || '(sin tag)') + '</option>'; }).join('');
    var r0 = montar(); if (!r0) return; [].forEach.call(r0.querySelectorAll('.cj-vista button'), function (q) { q.setAttribute('aria-pressed', String((q.dataset.v === '3d') === ver3)); });
    $('#cjDib').hidden = ver3; $('#cj3d').hidden = !ver3; $('#cjAy').innerHTML = ver3 ? 'Arrastra para girar la caja y usa la rueda para acercar. La tapa se dibuja translúcida para ver los cables' + (cj.modo === 'bornes' ? ' y la regleta' : '') + '. Para agregar o mover entradas vuelve a la vista 2D o usa la lista de la izquierda.' : 'Arma la caja a mano: toca un <b>+</b> naranjo para agregar una entrada por esa cara, toca un ducto para editarlo y arrástralo a otra cara para moverlo. El ducto celeste es la salida.';
    if (ver3) pintar3(cj, o); else { soltar3(); $('#cjDib').innerHTML = dibujo(cj, o, selE); }
    if (todo) {
      var sel = o.ent.filter(function (x) { return x.e.id === selE; })[0], h = '<h4>Caja</h4><div class="cj-2"><label>Tag<input data-c="tag" value="' + esc(cj.tag) + '"></label><label>Reserva [%]<input data-c="reserva" type="number" min="0" max="100" step="5" value="' + esc(cj.reserva) + '"></label></div>' +
        '<label>Tipo de caja<select data-c="modo">' + opc(MODOS, cj.modo) + '</select></label><label>Criterio de medidas<select data-c="crit">' + opc(CRIT, cj.crit) + '</select></label>' +
        '<label>Tipo de tubería<select data-c="tubo">' + I.ORDEN_TUBOS.map(function (k) { return '<option value="' + k + '"' + (k === cj.tubo ? ' selected' : '') + '>' + esc(C.TUBOS[k].n) + '</option>'; }).join('') + '</select></label>' +
        '<h4>Salida</h4><div class="cj-2"><label>Cara<select data-s="lado">' + opc(LADOS, cj.salida.lado) + '</select></label><label>Tamaño<select data-s="med">' + meds(cj, cj.salida.med, o.sal.auto ? o.sal.auto[0] : '') + '</select></label></div>' +
        '<label>Destino de la salida<input data-c="destino" value="' + esc(cj.destino || '') + '" placeholder="Ej.: sala eléctrica, gabinete"></label><h4>Entradas (' + cj.ent.length + ')</h4><div class="cj-lista">' + (o.ent.map(function (x, i) { return '<button type="button" class="cj-it' + (x.e.id === selE ? ' sel' : '') + '" data-it="' + x.e.id + '"><span>' + (i + 1) + ' · ' + esc(x.e.tag || 'sin tag') + '<small>' + esc((x.n > 1 ? x.n + ' × ' : '') + x.k.desc) + ' · cara ' + LADOS[x.e.lado].toLowerCase() + '</small></span><b>' + esc(x.t.s[0]) + '</b></button>'; }).join('') || '<p class="cj-ay">Sin entradas. Toca un + en el dibujo.</p>') + '</div>';
      if (sel) h += '<div class="cj-ed"><h4 style="margin:0">Entrada seleccionada</h4><label>Tag del instrumento o del ducto<input data-en="tag" value="' + esc(sel.e.tag) + '" placeholder="Ej.: FIT-101"></label><label>Cable<select data-en="cat">' + I.opcionesCat(sel.k.id) + '</select></label><div class="cj-2"><label>Cantidad<input data-en="n" type="number" min="1" step="1" value="' + sel.n + '"></label><label>Cara<select data-en="lado">' + opc(LADOS, sel.e.lado) + '</select></label></div><label>Tamaño del ducto<select data-en="med">' + meds(cj, sel.e.med, sel.t.auto ? sel.t.auto[0] : '') + '</select></label><div class="cj-2"><button type="button" data-a="dup">Duplicar</button><button type="button" data-a="quitar" class="pel">Quitar entrada</button></div></div>';
      else h += '<p class="cj-ay">Toca una entrada del dibujo o de la lista para editar su cable, cantidad, cara y tamaño.</p>';
      $('#cjIzq').innerHTML = h;
    }
    var m = o.min, r = '<h4>Recomendación</h4><p class="cj-res">Caja: <b>' + esc(o.caja.n) + '</b><br>Medidas mínimas: ' + m.L + ' × ' + m.A + ' × ' + m.P + ' mm<br>Ducto de salida: <b>' + esc(C.TUBOS[cj.tubo].c) + ' Ø ' + esc(o.sal.s[0]) + '</b> · ' + n1(o.sal.occ, 1) + ' % ocupado</p>' +
      '<p class="cj-ay">' + (o.razones.L ? '<b>Largo:</b> ' + esc(o.razones.L) + '. ' : '') + (o.razones.A ? '<b>Alto:</b> ' + esc(o.razones.A) + '.' : '') + '</p>' + (o.caja.otras.length ? '<p class="cj-ay">También sirven: ' + o.caja.otras.map(esc).join('; ') + '.</p>' : '') +
      '<h4>Cables de salida</h4><table class="cj-mat"><tbody>' + (o.cables.map(function (x) { var k = catDe(x.cat); return '<tr><td>' + x.n + ' ×</td><td>' + esc((k.cod !== '—' ? k.cod + ' ' : '') + k.desc) + ' · Ø ' + n1(k.d, 1) + ' mm' + (x.nota ? '<br><small>' + esc(x.nota) + '</small>' : x.tag ? '<br><small>' + esc(x.tag) + '</small>' : '') + '</td></tr>'; }).join('') || '<tr><td></td><td>Sin cables</td></tr>') + '</tbody></table>' +
      (cj.modo === 'bornes' ? '<p class="cj-ay">Regleta: ' + o.bornes + ' bornes de 2,5 mm² (un borne por conductor y por pantalla, más ' + (+cj.reserva || 0) + ' % de reserva), ' + o.riel + ' mm de riel' + (o.filas > 1 ? ' en ' + o.filas + ' filas' : '') + '.</p>' : '') +
      '<h4>Verificación</h4><ul class="cj-av">' + o.avisos.map(function (a) { return '<li class="' + a.sev + '">' + (a.sev === 'ok' ? '✓ ' : a.sev === 'warn' ? '! ' : '✗ ') + esc(a.txt) + (a.sug ? '<small><b>Sugerencia:</b> ' + esc(a.sug) + '</small>' : '') + (a.ref ? '<small>' + esc(a.ref) + '</small>' : '') + '</li>'; }).join('') + '</ul>' +
      '<h4>Materiales de referencia</h4><table class="cj-mat"><tbody>' + o.mats.map(function (x) { return '<tr><td>' + x.c + ' ' + x.u + '</td><td>' + esc(x.d) + '<br><small>' + esc(x.f) + '</small></td></tr>'; }).join('') + '</tbody></table><p class="cj-ay">Cantidades y medidas de referencia: confírmalas con el fabricante y con la especificación del proyecto.</p>';
    $('#cjDer').innerHTML = r;
  }
  // Lleva la caja al proyecto: un ducto por cada entrada (instrumento → caja) y el ducto de salida (caja → destino), con sus circuitos y su tag
  function crearDucto() {
    var cj = actual(), o = calcular(cj), b = I.datos(), ids = {}, n = 0;
    function pone(d, cables, eq, desde, hasta, med) { d.tubo = cj.tubo; d.min = med || '3/4"'; d.cables = cables; d.eq = eq; d.desde = desde; d.hasta = hasta; d.ruta = up(desde || '') + (hasta ? ' → ' + up(hasta) : ''); d.tag = ''; d.tag = I.tagAuto(d); n++; }
    o.ent.forEach(function (x, i) { var e = x.e; ids[e.id] = 1; var d = b.ductos.filter(function (q) { return q.caja === cj.id && q.cajaEnt === e.id; })[0]; if (!d) { d = I.nuevo(b.ductos.length + 1); b.ductos.push(d); d.caja = cj.id; d.cajaEnt = e.id; }
      pone(d, [{ tag: e.tag || '', cat: x.k.id, n: x.n }], e.tag || cj.tag, e.tag || 'ENTRADA ' + (i + 1), cj.tag, e.med); });
    b.ductos = b.ductos.filter(function (q) { return !(q.caja === cj.id && q.cajaEnt && !ids[q.cajaEnt]); });
    var s = b.ductos.filter(function (q) { return q.caja === cj.id && !q.cajaEnt; })[0]; if (!s) { s = I.nuevo(b.ductos.length + 1); b.ductos.push(s); s.caja = cj.id; }
    pone(s, o.cables.map(function (x) { return { tag: x.tag || '', cat: x.cat, n: x.n }; }), cj.tag, cj.tag, cj.destino || '', cj.salida.med); b.sel = s.id;
    I.cambio(); var est = $('#kEstado'); if (est) est.textContent = 'Caja ' + cj.tag + ': se crearon o actualizaron ' + n + ' ductos (' + o.ent.length + ' de entrada y el de salida ' + s.tag + '), con sus circuitos y rutas.';
    var av = $('#cjAy'); if (av) av.innerHTML = '✓ ' + n + ' ductos de la caja ' + esc(cj.tag) + ' en el proyecto: revísalos en la pestaña «Ductos» y en el listado.';
  }
  function imprimir() {
    var cj = actual(), o = calcular(cj), m = o.min, imp = $('#imp'); if (!imp) return;
    imp.innerHTML = '<div class="pg v cj-imp"><h2>CAJA ' + esc(up(cj.tag)) + ' · ' + esc(MODOS[cj.modo].split(' (')[0].toUpperCase()) + '</h2>' + dibujo(cj, o, null) +
      '<h3>Recomendación</h3><table class="datos"><tbody><tr><td>Caja</td><td>' + esc(o.caja.n) + ' (' + esc(o.caja.f) + ')</td></tr><tr><td>Medidas mínimas</td><td>' + m.L + ' × ' + m.A + ' × ' + m.P + ' mm · ' + esc(CRIT[cj.crit]) + '</td></tr><tr><td>Ducto de salida</td><td>' + esc(C.TUBOS[cj.tubo].c) + ' Ø ' + esc(o.sal.s[0]) + ' · ' + n1(o.sal.occ, 1) + ' % ocupado</td></tr></tbody></table>' +
      '<h3>Entradas</h3><table><thead><tr><th>N°</th><th>Tag</th><th>Cable</th><th>Cant.</th><th>Cara</th><th>Ducto</th><th>Ocupación</th></tr></thead><tbody>' + o.ent.map(function (x, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(x.e.tag) + '</td><td class="izq">' + esc((x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc) + '</td><td>' + x.n + '</td><td>' + LADOS[x.e.lado] + '</td><td>' + esc(x.t.s[0]) + '</td><td>' + n1(x.t.occ, 1) + ' %</td></tr>'; }).join('') + '</tbody></table>' +
      '<h3>Verificación</h3><table><tbody>' + o.avisos.map(function (a) { return '<tr><td>' + (a.sev === 'ok' ? 'Cumple' : a.sev === 'warn' ? 'Revisar' : 'No cumple') + '</td><td class="izq">' + esc(a.txt) + (a.sug ? ' Sugerencia: ' + esc(a.sug) : '') + '</td><td>' + esc(a.ref) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<h3>Materiales de referencia</h3><table><thead><tr><th>Cant.</th><th>Un.</th><th>Descripción</th><th>Fuente</th></tr></thead><tbody>' + o.mats.map(function (x) { return '<tr><td>' + x.c + '</td><td>' + x.u + '</td><td class="izq">' + esc(x.d) + '</td><td>' + esc(x.f) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    setTimeout(function () { window.print(); }, 150);
  }
  (function inicio(n) { try { if (montar()) return pintar(true); } catch (e) { console.warn('Caja', e); } if (n < 20) setTimeout(function () { inicio(n + 1); }, 500); })(0);
  window.LAZOS_CAJA = { abrir: abrir, montar: function () { if (montar()) pintar(true); }, calcular: calcular, base: base, nueva: nueva };
})();
