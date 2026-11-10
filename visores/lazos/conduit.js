/* Dimensionamiento de canalizaciones (conduit) · ReyEngi
 * Ocupación de la sección de la tubería según RIC N°04 (SEC, 2020) Tabla N°4.21 y 7.16.1: 1 conductor 50 %,
 * 2 conductores 33 %, 3 o más 33 %; 60 % en tuberías de hasta 1 m entre gabinetes; en ductos subterráneos con más de
 * 10 conductores o secciones distintas, sección interior ≥ 4 veces la ocupada (Tabla N°4.29). Como referencia se
 * ofrece NEC Cap. 9 Tabla 1 (53 / 31 / 40 %).
 * Cada ducto lleva sus cables (del listado de circuitos o manuales); se calcula el tamaño mínimo, se dibuja la sección
 * con los cables acomodados por gravedad y sus conductores interiores, y el resultado se escribe en el listado de
 * circuitos (columnas Ducto y Ruta de canalización). Exporta lámina A3 (PDF), DXF del corte y Excel de memoria.
 */
(function () {
  'use strict';
  var A = window.__LAZOS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = A.esc;
  function E() { return A.E(); }
  function up(s) { return String(s == null ? '' : s).toUpperCase(); }
  function n1(v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('es-CL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  var PI = Math.PI;
  function area(d) { return PI * d * d / 4; }

  // ── Tuberías: [designación, Ø exterior mm, Ø interior mm] ──
  var TUBOS = {
    CAG: { n: 'Cañería acero galvanizado pesado (c.a.g.) · ANSI C80.1 / RMC', c: 'C.A.G.', f: 'NEC Cap. 9 Tabla 4 (RMC)', s: [['1/2"', 21.3, 16.1], ['3/4"', 26.7, 21.2], ['1"', 33.4, 27.0], ['1 1/4"', 42.2, 35.4], ['1 1/2"', 48.3, 41.2], ['2"', 60.3, 52.9], ['2 1/2"', 73.0, 63.2], ['3"', 88.9, 78.5], ['3 1/2"', 101.6, 90.7], ['4"', 114.3, 102.9], ['5"', 141.3, 128.9], ['6"', 168.3, 154.8]] },
    SCH40: { n: 'Cañería acero galvanizado Schedule 40 · ASTM A53 (formato original)', c: 'C.A.G. SCH40', f: 'ASME B36.10 Sch 40', s: [['1/2"', 21.3, 15.76], ['3/4"', 26.7, 20.96], ['1"', 33.4, 26.64], ['1 1/4"', 42.2, 35.08], ['1 1/2"', 48.3, 40.94], ['2"', 60.3, 52.48], ['2 1/2"', 73.0, 62.68], ['3"', 88.9, 77.92], ['3 1/2"', 101.6, 90.12], ['4"', 114.3, 102.26], ['5"', 141.3, 128.2], ['6"', 168.3, 154.08]] },
    EMT: { n: 'Tubería metálica eléctrica liviana (EMT) · ANSI C80.3', c: 'EMT', f: 'NEC Cap. 9 Tabla 4 (EMT)', s: [['1/2"', 17.9, 15.8], ['3/4"', 23.4, 20.9], ['1"', 29.5, 26.6], ['1 1/4"', 38.4, 35.1], ['1 1/2"', 44.2, 40.9], ['2"', 55.8, 52.5], ['2 1/2"', 73.0, 69.4], ['3"', 88.9, 85.2], ['3 1/2"', 101.6, 97.4], ['4"', 114.3, 110.1]] },
    PVC40: { n: 'Tubería PVC rígida Schedule 40', c: 'PVC SCH40', f: 'NEC Cap. 9 Tabla 4 (PVC Sch 40)', s: [['1/2"', 21.3, 15.3], ['3/4"', 26.7, 20.4], ['1"', 33.4, 26.1], ['1 1/4"', 42.2, 34.5], ['1 1/2"', 48.3, 40.4], ['2"', 60.3, 52.0], ['2 1/2"', 73.0, 62.1], ['3"', 88.9, 77.3], ['3 1/2"', 101.6, 89.4], ['4"', 114.3, 101.5], ['5"', 141.3, 127.4], ['6"', 168.3, 153.2]] }
  };
  var ORDEN_TUBOS = ['CAG', 'SCH40', 'EMT', 'PVC40'];

  // ── Criterios de ocupación ──
  var CRIT = {
    RIC: (function () { var o = (window.RE_NORMAS && window.RE_NORMAS.P.ocupacionDucto) || { uno: 50, dos: 33, tresOMas: 33, niple: 60 }; return { n: 'RIC N°04 (Chile, vigente) · Tabla N°4.21', p: [o.uno, o.dos, o.tresOMas], niple: o.niple }; })(),
    NEC: { n: 'NEC 2023 Cap. 9 Tabla 1 (referencia)', p: [53, 31, 40], niple: 60 }
  };
  var COND = [['normal', 'Tramo normal (≤ 20 m, ≤ 2 curvas, desviación ≤ 180°)'], ['niple', 'Tubería de unión entre gabinetes de hasta 1 m'], ['subt', 'Ducto subterráneo']];

  // ── Catálogo de cables ──
  // Diámetros exteriores aproximados de: Catálogo general de conductores General Cable/Cocesa 2013 y Catálogo de productos
  // General Cable 2019 (tablas «Información técnica adicional»); se mantienen los valores del formato original (Cocesa,
  // códigos UI/HU/EN) y THHN de NEC Cap. 9 Tabla 5. Los ids del formato original no cambian (proyectos guardados).
  var FAM = {
    pvicp: 'PVIC pares apantallados · GC/Cocesa 2013', pvict: 'PVIC tríos apantallados · GC/Cocesa 2013',
    gfip: 'GenFree-Instrumentación pares (LSZH) · GC/Cocesa 2013', gfit: 'GenFree-Instrumentación tríos (LSZH) · GC/Cocesa 2013',
    cvtc: 'CVTC control 600 V (TC-ER) · GC/Cocesa 2013', gfc: 'GenFree-control (LSZH) · GC/Cocesa 2013', dlx: 'Duralox-control armado · GC/Cocesa 2013',
    xtu: 'XTU monoconductor 600 V · GC/Cocesa 2013', xtm3: 'XTMU 600 V · 3 fases · GC/Cocesa 2013', xtm3n: 'XTMU 600 V · 3 fases + neutro · GC/Cocesa 2013',
    xtm3nt: 'XTMU 600 V · 3 fases + neutro + tierra · GC/Cocesa 2013', xtk3: 'XTMU 1 kV · 3 fases · GC/Cocesa 2013',
    sfx3: 'SUPERFLEX multiconductor · 3 fases · GC/Cocesa 2013', sfx3nt: 'SUPERFLEX multiconductor · 3F + N + T · GC/Cocesa 2013',
    rz1m: 'EXZHELLENT XXI RZ1-K multiconductor · GC 2019', rz1: 'EXZHELLENT XXI RZ1-K monoconductor · GC 2019',
    thgc: 'THHN-PLUS (THHN/THWN-2) · GC 2019', evaf: 'EVAFLEX H07Z1-K · GC 2019', exz: 'EXZHELLENT XXI H07Z1-K · GC/Cocesa 2013',
    genl: 'GENLIS ECO H07V-U · GC 2019', gpt: 'GPT (TAC) · GC/Cocesa 2013',
    par: 'Par / tríada apantallado · formato original (Cocesa)', mpar: 'Multipar apantallado · formato original (Cocesa)', mtri: 'Multitríada apantallada · formato original (Cocesa)',
    xtcc: 'Control XTCC 600 V · formato original (Cocesa)', xtmu: 'Fuerza XTMU 1000 V · formato original (Cocesa)', thhn: 'THHN / THWN-2 · NEC Cap. 9 Tabla 5',
    otro: 'Otro cable (Ø manual)'
  };
  var CAT = [];
  function cat(f, cod, desc, d, nc, ap, awg, id) { CAT.push({ id: id || f + ':' + cod + ':' + CAT.length, f: f, cod: cod, desc: desc, d: d, nc: nc, ap: ap, awg: awg }); }
  // formato original (ids históricos: familia:código:índice)
  [['UI-01', 20, 1, 6.0], ['UI-26', 18, 1, 6.5], ['UI-51', 16, 1, 7.1]].forEach(function (x) { cat('par', x[0], '1 par #' + x[1] + ' AWG', x[3], 2, true, x[1]); });
  [['UI-19', 20, 6.4], ['UI-44', 18, 7.0], ['UI-70', 16, 7.7]].forEach(function (x) { cat('par', x[0], '1 tríada #' + x[1] + ' AWG', x[2], 3, true, x[1]); });
  [['UI-12', 20, 8, 14.6], ['UI-13', 20, 12, 18], ['UI-14', 20, 16, 19.6], ['UI-15', 20, 20, 22.2], ['UI-16', 20, 24, 24.7], ['UI-35', 18, 2, 10.1], ['UI-36', 18, 4, 12.7], ['UI-37', 18, 8, 16.1], ['UI-38', 18, 12, 19.8], ['UI-39', 18, 16, 23.9], ['UI-40', 18, 20, 26.8], ['UI-41', 18, 24, 27.4],
    ['UI-61', 16, 2, 12], ['UI-62', 16, 4, 14], ['UI-63', 16, 8, 18.5], ['UI-64', 16, 12, 22.2], ['UI-65', 16, 16, 25.9], ['UI-66', 16, 20, 29.7], ['UI-67', 16, 24, 32.1]].forEach(function (x) { cat('mpar', x[0], x[2] + ' pares #' + x[1] + ' AWG', x[3], x[2] * 2, true, x[1]); });
  [['UI-20', 20, 2, 11], ['UI-13', 20, 4, 12.6], ['UI-14', 20, 8, 14.6], ['UI-15', 20, 12, 19.7], ['UI-16', 20, 16, 21.8], ['UI-35', 18, 2, 12.1], ['UI-36', 18, 4, 13.8], ['UI-37', 18, 8, 18.7], ['UI-38', 18, 12, 21.8], ['UI-39', 18, 16, 24.7],
    ['UI-61', 16, 2, 13.2], ['UI-62', 16, 4, 15.4], ['UI-63', 16, 8, 21], ['UI-64', 16, 12, 25], ['UI-65', 16, 16, 27.7]].forEach(function (x) { cat('mtri', x[0], x[2] + ' tríadas #' + x[1] + ' AWG', x[3], x[2] * 3, true, x[1]); });
  [[16, 2, 8.3], [16, 3, 8.8], [16, 4, 9.5], [16, 5, 10.5], [16, 7, 11.3], [16, 9, 13.1], [16, 12, 15.6], [16, 19, 18], [16, 26, 21.3], [14, 2, 9.6], [14, 3, 10.2], [14, 4, 11.1], [14, 5, 12.3], [14, 7, 13.3], [14, 9, 16.4], [14, 12, 18.2], [14, 19, 21.3], [14, 26, 26.5]]
    .forEach(function (x) { cat('xtcc', 'HU' + (x[1] < 10 ? '0' : '') + x[1], x[1] + 'C #' + x[0] + ' AWG', x[2], x[1], false, x[0]); });
  [['EN31', 14, 9.8], ['EN32', 12, 10.8]].forEach(function (x) { cat('xtmu', x[0], '3C #' + x[1] + ' AWG', x[2], 3, false, x[1]); });
  [['14', 2.82], ['12', 3.30], ['10', 4.17], ['8', 5.49], ['6', 6.45], ['4', 8.23], ['3', 8.94], ['2', 9.75], ['1', 11.33], ['1/0', 12.34], ['2/0', 13.51], ['3/0', 14.83], ['4/0', 16.31]].forEach(function (x) { cat('thhn', '#' + x[0], '1C #' + x[0] + ' AWG', x[1], 1, false, x[0]); });
  cat('otro', '—', 'Ø según catálogo del fabricante', 10, 1, false, '', 'otro:—:73');
  // catálogos General Cable/Cocesa (id estable: familia:descripción)
  function serie(f, awg, tabla, uni, mult, ap, cod) { // tabla {n: Ø}; uni: 'pares' | 'tríos' | 'C'
    Object.keys(tabla).forEach(function (n) {
      var t = n === '3+T' ? '3C+T' : (uni === 'C' ? n + 'C' : n + ' ' + uni), desc = t + ' #' + awg + ' AWG';
      cat(f, cod || '', desc, tabla[n], n === '3+T' ? 4 : (+n) * mult, ap, awg, f + ':' + desc);
    });
  }
  serie('pvicp', 20, { 2: 8.0, 4: 8.3, 8: 10.8, 12: 16.3, 16: 17.9, 20: 19.8, 24: 21.5, 36: 25.8, 50: 30.2 }, 'pares', 2, true, 'PVIC');
  serie('pvicp', 18, { 2: 9.7, 4: 10.4, 8: 12.3, 12: 19.3, 16: 21.5, 20: 24.3, 24: 26.4, 36: 30.9, 50: 36.8 }, 'pares', 2, true, 'PVIC');
  serie('pvicp', 16, { 2: 8.8, 4: 12.9, 8: 16.9, 12: 21.7, 16: 24.6, 20: 27.4, 24: 29.6, 36: 35.3, 50: 42.0 }, 'pares', 2, true, 'PVIC');
  serie('pvict', 20, { 2: 8.6, 4: 9.3, 8: 14.4, 12: 17.9, 16: 19.8, 20: 21.8, 24: 24.3, 36: 28.3 }, 'tríos', 3, true, 'PVIC');
  serie('pvict', 18, { 2: 8.2, 4: 11.3, 8: 17.6, 12: 21.3, 16: 24.4, 20: 26.9, 24: 29.1, 36: 34.7 }, 'tríos', 3, true, 'PVIC');
  serie('pvict', 16, { 2: 9.3, 4: 12.8, 8: 20.0, 12: 24.6, 16: 27.3, 20: 30.4, 24: 33.3, 36: 40.4 }, 'tríos', 3, true, 'PVIC');
  serie('gfip', 18, { 2: 13.0, 4: 16.0, 8: 21.7, 12: 26.2, 16: 29.0, 20: 32.1, 24: 36.8, 36: 41.9, 50: 53.0 }, 'pares', 2, true, 'GenFree');
  serie('gfip', 16, { 2: 14.9, 4: 17.2, 6: 20.3, 8: 23.2, 12: 28.2, 16: 34.3, 20: 34.7, 24: 39.9, 36: 50.3, 50: 55.0 }, 'pares', 2, true, 'GenFree');
  serie('gfit', 18, { 2: 15.1, 4: 17.5, 8: 23.9, 12: 28.8, 16: 32.1, 20: 35.7, 24: 39.8, 36: 47.2 }, 'tríos', 3, true, 'GenFree');
  serie('gfit', 16, { 2: 16.3, 4: 18.9, 8: 25.8, 12: 31.2, 16: 34.8, 20: 38.7, 24: 44.7, 36: 51.2 }, 'tríos', 3, true, 'GenFree');
  serie('cvtc', 14, { 2: 9.3, 3: 9.9, 4: 10.8, 5: 11.8, 7: 14.9, 9: 15.8, 12: 17.3, 19: 20.3, 25: 25.0, 30: 26.7, 37: 28.7 }, 'C', 1, false, 'CVTC');
  serie('cvtc', 12, { 2: 10.4, '3+T': 11.1, 3: 11.1, 4: 12.1, 5: 13.1, 7: 15.1, 9: 17.7, 12: 19.8, 19: 23.6, 25: 27.8, 30: 29.2, 37: 31.5 }, 'C', 1, false, 'CVTC');
  serie('cvtc', 10, { 2: 11.6, '3+T': 12.3, 3: 12.3, 4: 13.1, 5: 15.6, 7: 17.0, 9: 19.9, 12: 22.7 }, 'C', 1, false, 'CVTC');
  serie('gfc', 14, { 2: 9.4, 3: 9.9, 4: 10.8, 5: 11.8, 7: 12.8, 9: 15.8, 12: 17.8, 19: 20.7, 25: 23.8, 30: 26.2, 37: 28.2 }, 'C', 1, false, 'GenFree');
  serie('gfc', 12, { 2: 10.4, '3+T': 11.1, 3: 11.1, 4: 12.1, 5: 13.2, 7: 15.1, 9: 17.7, 12: 19.4, 19: 23.9, 25: 27.8, 30: 29.2, 37: 31.5 }, 'C', 1, false, 'GenFree');
  serie('gfc', 10, { 2: 11.6, '3+T': 12.3, 3: 12.3, 4: 14.2, 5: 15.6, 7: 17.0, 9: 19.3, 12: 22.9 }, 'C', 1, false, 'GenFree');
  serie('dlx', 14, { 2: 15.3, 3: 16.0, 4: 16.8, 5: 17.6, 7: 18.8, 9: 21.1, 12: 22.9, 19: 25.9, 25: 29.7, 37: 32.8 }, 'C', 1, false, 'Duralox');
  serie('dlx', 12, { 2: 16.3, 3: 16.8, 4: 18.1, 5: 19.1, 7: 20.6, 9: 22.6, 12: 24.7, 19: 28.0, 25: 32.5, 37: 35.8 }, 'C', 1, false, 'Duralox');
  serie('dlx', 10, { 3: 18.3, 4: 19.6 }, 'C', 1, false, 'Duralox');
  function fuerza(f, cod, nc, filas) { filas.forEach(function (x) { var desc = (nc > 1 ? nc + 'C ' : '1C ') + '#' + x[0] + (/^\d{3,}$/.test(x[0]) ? ' kcmil' : ' AWG'); cat(f, cod, desc, x[1], nc, false, x[0], f + ':' + desc); }); }
  fuerza('xtu', 'XTU', 1, [['14', 5.2], ['12', 5.7], ['10', 6.3], ['8', 7.7], ['6', 8.6], ['4', 9.8], ['2', 11.2], ['1', 13.4], ['1/0', 14.4], ['2/0', 15.5], ['3/0', 16.7], ['4/0', 18.0], ['250', 19.7], ['350', 23.2], ['500', 26.4]]);
  fuerza('xtm3', 'XTMU', 3, [['14', 10.2], ['12', 11.2], ['10', 12.5], ['8', 16.4], ['6', 18.3], ['4', 21.0], ['2', 25.3], ['1', 28.3], ['1/0', 30.4], ['2/0', 32.8], ['3/0', 35.4], ['4/0', 38.5]]);
  fuerza('xtm3n', 'XTMU', 4, [['14', 11.4], ['12', 12.4], ['10', 14.0], ['8', 18.3], ['6', 20.5], ['4', 24.7], ['2', 28.4], ['1', 31.8], ['1/0', 34.2]]);
  fuerza('xtm3nt', 'XTMU', 5, [['14', 12.2], ['12', 13.4], ['10', 15.9], ['8', 19.7], ['6', 22.1], ['4', 26.6], ['2', 30.6], ['1', 34.3], ['1/0', 37.0], ['2/0', 39.9], ['3/0', 43.2], ['4/0', 48.7]]);
  fuerza('xtk3', 'XTMU 1 kV', 3, [['14', 11.4], ['12', 12.3], ['10', 13.7], ['8', 15.0], ['6', 16.9], ['4', 20.5], ['2', 23.7], ['1', 26.0], ['1/0', 28.1]]);
  fuerza('sfx3', 'SUPERFLEX', 3, [['14', 11.4], ['12', 12.5], ['10', 13.9], ['8', 15.6], ['6', 17.7], ['4', 21.4], ['2', 25.5], ['1', 28.0], ['1/0', 29.7]]);
  fuerza('sfx3nt', 'SUPERFLEX', 5, [['14', 13.3], ['12', 14.7], ['10', 16.4], ['8', 18.7], ['6', 21.3], ['4', 26.1], ['2', 30.3], ['1', 34.4], ['1/0', 37.4]]);
  fuerza('thgc', 'THHN-PLUS', 1, [['14', 3.0], ['12', 3.5], ['10', 4.3], ['8', 5.5], ['6', 6.4], ['4', 8.3], ['2', 9.7], ['1', 11.1], ['1/0', 12.1], ['2/0', 13.1], ['3/0', 14.3], ['4/0', 15.7], ['250', 17.4], ['300', 18.6], ['350', 19.8], ['400', 20.9], ['500', 23.1]]);
  fuerza('gpt', 'GPT', 1, [['20', 2.6], ['18', 2.8], ['16', 3.1], ['14', 3.5], ['12', 4.0], ['10', 5.5]]);
  function mm(f, cod, filas) { filas.forEach(function (x) { var p = String(x[0]).split('x'), nc = p.length > 1 ? +p[0] : 1, sec = p[p.length - 1], desc = (nc > 1 ? nc + ' x ' : '1 x ') + sec.replace('.', ',') + ' mm²'; cat(f, cod, desc, x[1], nc, false, '', f + ':' + desc); }); }
  mm('rz1m', 'RZ1-K', [['3x1.5', 9.0], ['3x2.5', 9.9], ['3x4', 11.1], ['4x1.5', 9.9], ['4x2.5', 10.9], ['4x4', 12.2], ['4x6', 13.5], ['5x35', 28.4], ['5x50', 33.1], ['5x70', 39.0], ['5x95', 43.4]]);
  mm('rz1', 'RZ1-K', [['2.5', 5.6], ['4', 6.1], ['6', 6.8], ['10', 7.5], ['16', 8.8], ['25', 10.6], ['35', 11.7], ['50', 14.6], ['70', 15.9], ['95', 17.7], ['120', 19.6], ['150', 21.5], ['185', 23.9], ['240', 26.6]]);
  mm('evaf', 'H07Z1-K', [['1.5', 3.1], ['2.5', 3.8], ['4', 4.3], ['6', 4.9], ['10', 6.4], ['16', 7.4], ['25', 9.2], ['35', 10.4], ['50', 12.7], ['70', 14.3], ['95', 16.5], ['120', 18.2], ['150', 20.5], ['185', 22.6], ['240', 25.6]]);
  mm('exz', 'H07Z1-K', [['1.5', 2.9], ['2.5', 3.5], ['4', 4.1], ['6', 4.6], ['10', 6.0], ['16', 7.0], ['25', 8.6], ['35', 9.7], ['50', 11.5], ['70', 13.4], ['95', 15.4], ['120', 17.2], ['150', 19.0], ['185', 20.9], ['240', 24.2]]);
  mm('genl', 'H07V-U', [['1.5', 2.9], ['2.5', 3.5], ['4', 4.0], ['6', 4.5], ['10', 5.8]]);
  var CATI = {}; CAT.forEach(function (c) { CATI[c.id] = c; });
  var COLF = { par: '#2f6db3', mpar: '#1d4f8a', mtri: '#5a3fa0', xtcc: '#3c4650', xtmu: '#202020', thhn: '#9a3b1d', otro: '#6b7480',
    pvicp: '#2f6db3', pvict: '#5a3fa0', gfip: '#1f7a6a', gfit: '#2b8c5a', cvtc: '#3c4650', gfc: '#4a6b3a', dlx: '#59606a',
    xtu: '#202020', xtm3: '#202020', xtm3n: '#202020', xtm3nt: '#202020', xtk3: '#202020', sfx3: '#262c33', sfx3nt: '#262c33', rz1m: '#2e6b3a', rz1: '#2e6b3a',
    thgc: '#9a3b1d', evaf: '#8a5a1a', exz: '#6a8a2a', genl: '#8a2a2a', gpt: '#7a4a6a' };
  // Familias preferidas al traer cables del listado de circuitos
  var PREF_INST = [['pvic', 'PVIC (GC/Cocesa)'], ['gfi', 'GenFree-Instrumentación (LSZH)'], ['orig', 'Formato original (UI)']];
  var PREF_CTRL = [['cvtc', 'CVTC (GC/Cocesa)'], ['gfc', 'GenFree-control (LSZH)'], ['dlx', 'Duralox-control armado'], ['orig', 'Formato original XTCC (HU)']];
  function pref() { var b = E().cond || {}; return b.pref || { inst: 'pvic', ctrl: 'cvtc' }; }

  // Sugiere el cable del catálogo a partir del diseño escrito en el listado ("1PR #16 AWG", "8 PARES #18", "1x3C #14 AWG")
  function sugerir(diseno, tipo, obs) {
    var t = up(diseno) + ' ' + up(tipo), awg = (t.match(/#?\s*(\d{1,2})\s*AWG/) || [])[1], m, P = pref();
    var fam = /TR[IÍ]AD|TRIO|\bTR\b/.test(t) ? 'tri' : /PAR|\bPR\b|\bP\b/.test(t) ? 'par' : /\dC\b|COND|MULTICONDUCTOR/.test(t) ? 'cond' : '';
    var nx = 1;
    if ((m = t.match(/(\d+)\s*(PARES|PR|TR[IÍ]ADAS|TRIADAS|TR)\b/))) nx = +m[1];
    else if ((m = t.match(/(\d+)\s*X\s*(\d+)\s*C\b/))) nx = +m[2];
    else if ((m = t.match(/(\d+)\s*C\b/))) nx = +m[1];
    if (/MULTIPAR/.test(t) && nx <= 1) { var o = (String(obs || '').match(/(\d+)\s*PARES/) || [])[1]; nx = Math.max(2, +o || 8); }
    var famInst = function (tri) { return P.inst === 'gfi' ? (tri ? 'gfit' : 'gfip') : P.inst === 'orig' ? (tri ? 'mtri' : 'mpar') : (tri ? 'pvict' : 'pvicp'); };
    var famCtrl = P.ctrl === 'orig' ? 'xtcc' : P.ctrl;
    var cand;
    if (fam === 'tri') cand = CAT.filter(function (c) { return (nx > 1 ? c.f === famInst(true) : c.f === 'par' && c.nc === 3); });
    else if (fam === 'par') cand = CAT.filter(function (c) { return (nx > 1 ? c.f === famInst(false) : c.f === 'par' && c.nc === 2); });
    else if (fam === 'cond') cand = CAT.filter(function (c) { return c.f === famCtrl; });
    else cand = CAT.filter(function (c) { return c.f === 'par' && c.nc === 2; });
    var porAwg = cand.filter(function (c) { return !awg || String(c.awg) === awg; }); if (porAwg.length) cand = porAwg;
    var cuenta = function (c) { return fam === 'cond' ? c.nc : c.f === 'par' ? 1 : c.nc / (fam === 'tri' ? 3 : 2); };
    var ok = cand.filter(function (c) { return cuenta(c) >= nx; }).sort(function (a, b) { return cuenta(a) - cuenta(b) || a.d - b.d; });
    return (ok[0] || cand.sort(function (a, b) { return b.d - a.d; })[0] || CAT[1]).id;
  }

  // ── Estado ──
  function datos() {
    var e = E(); e.cond = e.cond || { ductos: [], sel: '' };
    if (!e.cond.ductos.length) e.cond.ductos.push(nuevo(1));
    if (!e.cond.ductos.some(function (d) { return d.id === e.cond.sel; })) e.cond.sel = e.cond.ductos[0].id;
    return e.cond;
  }
  function nuevo(i) { return { id: A.uid(), tag: 'D-' + (i < 10 ? '00' : i < 100 ? '0' : '') + i, ruta: '', tubo: 'CAG', crit: 'RIC', cond: 'normal', min: '3/4"', reserva: 0, largo: '', curvas: '', cables: [] }; }
  function actual() { var b = datos(); return b.ductos.filter(function (d) { return d.id === b.sel; })[0]; }
  function dCable(c) { return c.cat && CATI[c.cat] && CATI[c.cat].f !== 'otro' && !(+c.d > 0 && c.dMan) ? CATI[c.cat].d : (+c.d || (CATI[c.cat] || {}).d || 0); }

  // ── Cálculo ──
  function calcular(dc) {
    var T = TUBOS[dc.tubo] || TUBOS.CAG, C = CRIT[dc.crit] || CRIT.RIC, lista = [], suma = 0, n = 0, dist = {};
    dc.cables.forEach(function (c) {
      var d = dCable(c), q = Math.max(1, Math.round(+c.n || 1));
      for (var i = 0; i < q; i++) lista.push({ d: d, c: c, k: CATI[c.cat] || CATI['otro:—:73'] });
      suma += q * area(d); n += q; dist[d] = 1;
    });
    var regla, lim;
    if (dc.cond === 'niple') { lim = C.niple; regla = (dc.crit === 'RIC' ? 'RIC N°04 Tabla N°4.21, nota: tubería de unión entre gabinetes de hasta 1 m' : 'NEC Cap. 9 Nota 4: niple de hasta 600 mm') + ' → ' + lim + ' %'; }
    else if (dc.cond === 'subt' && dc.crit === 'RIC' && (n > 10 || Object.keys(dist).length > 1)) { lim = 25; regla = 'RIC N°04 Tabla N°4.29, nota: más de 10 conductores o secciones distintas → sección interior ≥ 4 × sección ocupada (25 %)'; }
    else { lim = n <= 1 ? C.p[0] : n === 2 ? C.p[1] : C.p[2]; regla = (dc.crit === 'RIC' ? 'RIC N°04 Tabla N°4.21' : 'NEC Cap. 9 Tabla 1') + ': ' + (n <= 1 ? '1 conductor' : n === 2 ? '2 conductores' : '3 o más conductores') + ' → ' + lim + ' %'; }
    var res = Math.max(0, +dc.reserva || 0), req = suma * (1 + res / 100) / (lim / 100);
    var minI = Math.max(0, T.s.map(function (s) { return s[0]; }).indexOf(dc.min));
    if (dc.cond === 'subt' && dc.crit === 'RIC') { var i25 = T.s.findIndex(function (s) { return s[2] >= 25; }); if (i25 > minI) minI = i25; }
    var dmax = lista.reduce(function (m, x) { return Math.max(m, x.d); }, 0);
    var filas = T.s.map(function (s, i) { var Ai = area(s[2]); return { s: s, i: i, Ai: Ai, util: Ai * lim / 100, occ: Ai ? suma / Ai * 100 : 0, cumple: Ai >= req - 1e-9 && s[2] > dmax * 1.05 && i >= minI }; });
    var elegido = null;
    for (var j = 0; j < filas.length; j++) if (filas[j].cumple) {
      // además debe caber geométricamente (acomodo por gravedad)
      var pk = empacar(filas[j].s[2] / 2, lista.map(function (x) { return x.d / 2; }));
      if (pk.ok) { elegido = filas[j]; elegido.pack = pk; break; }
      filas[j].noCabe = true; filas[j].cumple = false;
    }
    var avisos = [];
    if (!n) avisos.push('Agrega los cables que van por este ducto.');
    if (n && !elegido) avisos.push('Ningún tamaño de ' + T.c + ' alcanza: divide los cables en dos ductos o usa bandeja / escalerilla (RIC N°04 7.10.19: ocupación ≤ 40 % en bandejas).');
    // Clase de cada cable: señal (instrumentación y comunicaciones), control o fuerza
    var CLASE = { par: 'senal', mpar: 'senal', mtri: 'senal', pvicp: 'senal', pvict: 'senal', gfip: 'senal', gfit: 'senal', xtcc: 'control', cvtc: 'control', gfc: 'control', dlx: 'control', otro: '' };
    var cls = {}, nFuerza = 0; dc.cables.forEach(function (c) { var k = CATI[c.cat]; if (!k) return; var cl = CLASE[k.f] === undefined ? 'fuerza' : CLASE[k.f]; if (!cl) return; cls[cl] = 1; if (cl === 'fuerza') nFuerza += Math.max(1, Math.round(+c.n || 1)); });
    if (cls.senal && (cls.fuerza || cls.control)) avisos.push('RIC N°04 7.1.7: el ducto mezcla cables de señal con ' + (cls.fuerza ? 'fuerza' : 'control') + '; las canalizaciones de fuerza y de comunicación o control se separan para evitar influencias electromagnéticas. Usa ductos separados.');
    if (nFuerza > 1 && dc.cond !== 'niple') avisos.push('RIC N°04 5.27: en una misma tubería solo van conductores de un mismo circuito; hay ' + nFuerza + ' cables de fuerza. Si son circuitos distintos, sepáralos o usa bandeja / escalerilla.');
    if (dc.cond === 'normal' && +dc.largo > 15 && !(+dc.curvas > 0)) avisos.push('RIC N°04 7.16.1.7: en tramos rectos los registros no pueden quedar a más de 15 m entre sí.');
    if (dc.cond === 'normal' && (+dc.largo > 20 || +dc.curvas > 2)) avisos.push('RIC N°04 7.16.1.13: los valores valen para tramos de hasta 20 m con no más de dos curvas (desviación total ≤ 180°); coloca cajas de paso intermedias.');
    if (dc.cond === 'subt' && +dc.largo > 90) avisos.push('RIC N°04 7.9.7.8: distancia máxima entre cámaras de 90 m (hasta 120 m en tramos rectos con ductos ≥ 50 mm).');
    if (elegido && n === 3 && Object.keys(dist).length === 1) { var rz = elegido.s[2] / lista[0].d; if (rz >= 2.8 && rz <= 3.2) avisos.push('Relación Ø interior / Ø cable = ' + n1(rz, 2) + ': con 3 cables iguales entre 2,8 y 3,2 hay riesgo de atascamiento al tirar (NEC Cap. 9, nota informativa). Considera el tamaño siguiente.'); }
    if (dc.cond === 'subt' && dc.crit === 'RIC') avisos.push('RIC N°04 7.9.7.1: el ducto subterráneo no puede ser menor a 25 mm.');
    return { T: T, C: C, lista: lista, suma: suma, n: n, lim: lim, regla: regla, res: res, req: req, filas: filas, elegido: elegido, avisos: avisos, dmax: dmax };
  }
  function textoDucto(dc, r) { return r.elegido ? r.T.c + ' Ø ' + r.elegido.s[0] : ''; }

  // ── Acomodo de los cables dentro del tubo (por gravedad, del más grueso al más delgado) ──
  function empacar(R, rs) {
    var idx = rs.map(function (r, i) { return i; }).sort(function (a, b) { return rs[b] - rs[a]; }), P = [], pos = new Array(rs.length), ok = true, eps = 1e-6;
    function libre(x, y, r) {
      if (Math.hypot(x, y) > R - r + eps) return false;
      for (var k = 0; k < P.length; k++) if (Math.hypot(x - P[k].x, y - P[k].y) < P[k].r + r - eps) return false;
      return true;
    }
    function cortes(x0, y0, r0, x1, y1, r1) {
      var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); if (d < 1e-9 || d > r0 + r1 || d < Math.abs(r0 - r1)) return [];
      var a = (r0 * r0 - r1 * r1 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r0 * r0 - a * a)), xm = x0 + a * dx / d, ym = y0 + a * dy / d;
      return [[xm + h * dy / d, ym - h * dx / d], [xm - h * dy / d, ym + h * dx / d]];
    }
    idx.forEach(function (i) {
      var r = rs[i], cs = [[0, -(R - r)]];
      if (r > R) { ok = false; pos[i] = { x: 0, y: 0, r: r, fuera: true }; return; }
      P.forEach(function (p) { cs = cs.concat(cortes(0, 0, R - r, p.x, p.y, p.r + r)); });
      for (var a = 0; a < P.length; a++) for (var b = a + 1; b < P.length; b++) cs = cs.concat(cortes(P[a].x, P[a].y, P[a].r + r, P[b].x, P[b].y, P[b].r + r));
      var mejor = null;
      cs.forEach(function (c) { if (libre(c[0], c[1], r) && (!mejor || c[1] < mejor[1] - 1e-7 || (Math.abs(c[1] - mejor[1]) <= 1e-7 && Math.abs(c[0]) < Math.abs(mejor[0])))) mejor = c; });
      if (!mejor) { ok = false; pos[i] = { x: 0, y: 0, r: r, fuera: true }; return; }
      var p = { x: mejor[0], y: mejor[1], r: r }; P.push(p); pos[i] = p;
    });
    return { ok: ok, pos: pos };
  }

  // ── Dibujo de la sección (SVG). Coordenadas en mm, y hacia arriba ──
  var COLCORE = ['#111', '#f4f4f4', '#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6d4c41', '#8e24aa'];
  function nucleos(cx, cy, d, k, sv) {
    // conductores interiores: cubierta ~78 % del Ø, núcleos en anillos (1, 6, 12, 18…)
    var di = d * 0.74, m = 0; while (1 + 3 * m * (m + 1) < k.nc) m++;
    var dc = Math.min(di / (2 * m + 1) * 0.92, di * 0.48), out = '', n = 0;
    if (k.ap) out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (di / 2 + d * 0.035) + '" fill="none" stroke="#c9ced4" stroke-width="' + (d * 0.03) + '" stroke-dasharray="' + (d * 0.05) + ' ' + (d * 0.03) + '"/>';
    if (k.nc === 1) return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (d * 0.3) + '" fill="#d18b47" stroke="#7a4a1c" stroke-width="' + (d * 0.02) + '"/>';
    if (k.nc === 2 || k.nc === 3) { // par o tríada trenzada
      for (var j = 0; j < k.nc; j++) { var a = j / k.nc * 2 * PI + PI / 2, rr = di * (k.nc === 2 ? 0.25 : 0.28); out += core(cx + rr * Math.cos(a), cy + rr * Math.sin(a), di * (k.nc === 2 ? 0.24 : 0.21), COLCORE[j % 3]); }
      return out;
    }
    for (var ring = 0; ring <= m && n < k.nc; ring++) {
      var cnt = ring === 0 ? 1 : 6 * ring; for (var q = 0; q < cnt && n < k.nc; q++, n++) { var ang = q / cnt * 2 * PI + PI / 2; out += core(cx + ring * dc * Math.cos(ang), cy + ring * dc * Math.sin(ang), dc / 2 * 0.92, COLCORE[n % (k.f === 'mpar' || k.f === 'mtri' ? 2 : COLCORE.length)]); }
    }
    return out;
    function core(x, y, r, col) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + col + '" stroke="#555" stroke-width="' + r * 0.18 + '"/><circle cx="' + x + '" cy="' + y + '" r="' + r * 0.5 + '" fill="#d18b47"/>'; }
  }
  // Devuelve el SVG del corte con el tamaño s ([nombre, Øe, Øi]); px = tamaño del lienzo; numeros = etiquetas de los cables
  function svgCorte(r, s, px, idT) {
    var Re = s[1] / 2, Ri = s[2] / 2, pk = r.elegido && r.elegido.s === s ? r.elegido.pack : empacar(Ri, r.lista.map(function (x) { return x.d / 2; }));
    var vb = Re * 2.5, o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-vb / 2) + ' ' + (-vb / 2) + ' ' + vb + ' ' + vb + '" width="' + px + '" height="' + px + '" role="img" aria-label="Sección del ducto ' + esc(s[0]) + '">';
    o += '<defs><pattern id="' + idT + '" width="' + (Ri / 6) + '" height="' + (Ri / 6) + '" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="100%" height="100%" fill="#e9f6ec"/><line x1="0" y1="0" x2="0" y2="' + (Ri / 6) + '" stroke="#9fd3ad" stroke-width="' + (Ri / 40) + '"/></pattern></defs>';
    o += '<circle r="' + Re + '" fill="#9aa4ae"/><circle r="' + Ri + '" fill="url(#' + idT + ')" stroke="#5d6770" stroke-width="' + (Re / 60) + '"/>';
    o += '<g transform="scale(1,-1)">';
    r.lista.forEach(function (x, i) {
      var p = pk.pos[i]; if (!p || p.fuera) return;
      o += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (x.d / 2) + '" fill="' + COLF[x.k.f] + '" stroke="#0b1828" stroke-width="' + (x.d * 0.03) + '"/>' + nucleos(p.x, p.y, x.d, x.k);
    });
    o += '</g>';
    var fs = Ri / 9;
    r.lista.forEach(function (x, i) { var p = pk.pos[i]; if (!p || p.fuera) return; o += '<text x="' + p.x + '" y="' + (-p.y - x.d / 2 - fs * 0.25) + '" font-size="' + Math.min(fs, x.d * 0.45) + '" text-anchor="middle" font-family="Arial" font-weight="700" fill="#0b1828" paint-order="stroke" stroke="#fff" stroke-width="' + fs * 0.15 + '">' + (i + 1) + '</text>'; });
    var libre = area(s[2]) - r.suma;
    o += '<text y="' + (Re + fs * 1.4) + '" font-size="' + fs * 0.95 + '" text-anchor="middle" font-family="Arial" fill="#2a3540">' + esc(r.T.c + ' Ø ' + s[0]) + ' · Ø int. ' + n1(s[2], 1) + ' mm</text>';
    o += '<text y="' + (-Re - fs * 0.6) + '" font-size="' + fs * 0.9 + '" text-anchor="middle" font-family="Arial" fill="#2e7d32">Espacio libre ' + n1(Math.max(0, libre), 0) + ' mm² (' + n1(Math.max(0, libre / area(s[2]) * 100), 0) + ' %)</text>';
    if (!pk.ok && r.lista.length) o += '<text y="0" font-size="' + fs * 1.2 + '" text-anchor="middle" font-family="Arial" font-weight="700" fill="#c62828">NO CABE</text>';
    return o + '</svg>';
  }

  // ── Interfaz ──
  var verTam = null; // tamaño que se muestra en el dibujo (null = el elegido)
  function opciones(lista, v) { return lista.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function opcionesCat(v) {
    return Object.keys(FAM).map(function (f) { return '<optgroup label="' + esc(FAM[f]) + '">' + CAT.filter(function (c) { return c.f === f; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === v ? ' selected' : '') + '>' + esc((c.cod !== '—' ? c.cod + ' · ' : '') + c.desc + (c.f !== 'otro' ? ' · Ø ' + n1(c.d, 1) + ' mm' : '')) + '</option>'; }).join('') + '</optgroup>'; }).join('');
  }
  function pintar() {
    var b = datos(), dc = actual(), r = calcular(dc);
    // tabla de ductos
    $('#kDuctos tbody').innerHTML = b.ductos.map(function (d) {
      var q = calcular(d);
      return '<tr data-d="' + d.id + '"' + (d.id === b.sel ? ' class="sel"' : '') + '><td><b>' + esc(d.tag) + '</b></td><td>' + esc(d.ruta || '—') + '</td><td>' + esc(q.T.c) + '</td><td class="num">' + q.n + '</td><td class="num">' + n1(q.suma, 0) + '</td><td class="num">' + q.lim + ' %</td><td>' + (q.elegido ? '<b>' + esc(q.elegido.s[0]) + '</b> · ' + n1(q.elegido.occ, 1) + ' %' : (q.n ? '<span class="kmal">no alcanza</span>' : '—')) + '</td></tr>';
    }).join('');
    // formulario
    var f = $('#kForm');
    f.querySelector('[data-k=tag]').value = dc.tag; f.querySelector('[data-k=ruta]').value = dc.ruta || '';
    f.querySelector('[data-k=tubo]').innerHTML = opciones(ORDEN_TUBOS.map(function (k) { return [k, TUBOS[k].n]; }), dc.tubo);
    f.querySelector('[data-k=crit]').innerHTML = opciones(Object.keys(CRIT).map(function (k) { return [k, CRIT[k].n]; }), dc.crit);
    f.querySelector('[data-k=cond]').innerHTML = opciones(COND, dc.cond);
    f.querySelector('[data-k=min]').innerHTML = opciones(r.T.s.map(function (s) { return [s[0], s[0]]; }), dc.min);
    ['reserva', 'largo', 'curvas'].forEach(function (k) { f.querySelector('[data-k=' + k + ']').value = dc[k] == null ? '' : dc[k]; });
    // cables
    $('#kCables tbody').innerHTML = dc.cables.map(function (c, i) {
      var k = CATI[c.cat] || CATI['otro:—:73'], d = dCable(c), man = k.f === 'otro';
      return '<tr data-i="' + i + '"><td class="num">' + (i + 1) + '</td><td><input data-c="tag" value="' + esc(c.tag || '') + '" placeholder="Tag del circuito"' + (c.ck ? ' class="enlazado" title="Vinculado al listado de circuitos"' : '') + '></td><td><select data-c="cat">' + opcionesCat(c.cat) + '</select></td><td><input data-c="n" type="number" min="1" step="1" value="' + (c.n || 1) + '" style="width:60px"></td><td><input data-c="d" type="number" min="1" step="0.1" value="' + n1(d, 1).replace(',', '.') + '" style="width:72px"' + (man || c.dMan ? '' : ' title="Del catálogo; escribe otro valor si tu cable es distinto"') + '></td><td class="num">' + n1(area(d) * (Math.max(1, +c.n || 1)), 1) + '</td><td><button type="button" class="mini peligro" data-quitar="' + i + '" aria-label="Quitar cable ' + (i + 1) + '">✕</button></td></tr>';
    }).join('') || '<tr><td colspan="7" class="vacio">Sin cables. Agrega cables a mano o tráelos del listado de circuitos.</td></tr>';
    // paso a paso
    var el = r.elegido, s = verTam != null ? (r.T.s[verTam] || (el && el.s)) : (el && el.s) || r.T.s[Math.min(r.T.s.length - 1, 3)];
    var pasos = [
      ['Sección de cada cable', 'A = π · Ø² / 4 (con su aislación y cubierta). Suma de ' + r.n + ' cable' + (r.n === 1 ? '' : 's') + ': <b>ΣA = ' + n1(r.suma, 1) + ' mm²</b>.'],
      ['Porcentaje permitido', r.regla + '. Cada cable multiconductor cuenta como un conductor; si va el conductor de tierra dentro del tubo, también se incluye.'],
      ['Área interior mínima', 'A<sub>req</sub> = ΣA' + (r.res ? ' × (1 + ' + r.res + ' % de reserva)' : '') + ' / ' + r.lim + ' % = <b>' + n1(r.req, 1) + ' mm²</b>' + (r.req ? ' → Ø interior ≥ ' + n1(Math.sqrt(r.req * 4 / PI), 1) + ' mm' : '') + '.'],
      ['Tamaño comercial', el ? 'El menor ' + esc(r.T.c) + ' con área interior ≥ ' + n1(r.req, 0) + ' mm², no menor a ' + esc(dc.min) + ' y en que los cables caben: <b>Ø ' + esc(el.s[0]) + '</b> (Ø int. ' + n1(el.s[2], 1) + ' mm, área ' + n1(el.Ai, 0) + ' mm², ocupación ' + n1(el.occ, 1) + ' %).' : (r.n ? '<span class="kmal">Ningún tamaño alcanza.</span>' : '—')],
      ['Espacio disponible', el && r.n ? 'Queda ' + n1(el.Ai - r.suma, 0) + ' mm² libres; hasta el límite de la norma se pueden sumar ' + n1(Math.max(0, el.util - r.suma), 0) + ' mm² de cables (≈ ' + Math.floor(Math.max(0, el.util - r.suma) / area(r.dmax || 1)) + ' cables más del mayor Ø).' : '—']
    ];
    $('#kPasos').innerHTML = pasos.map(function (p, i) { return '<li><b>' + (i + 1) + '. ' + p[0] + '.</b> ' + p[1] + '</li>'; }).join('');
    $('#kAvisos').innerHTML = r.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
    $('#kAvisos').hidden = !r.avisos.length;
    // indicador de ocupación
    var occ = s ? r.suma / area(s[2]) * 100 : 0;
    $('#kMedidor').innerHTML = '<div class="kbar"><span style="width:' + Math.min(100, occ) + '%;background:' + (occ <= r.lim ? '#2e7d32' : '#c62828') + '"></span><i style="left:' + r.lim + '%" title="Límite ' + r.lim + ' %"></i></div><div class="peq">Ocupación en Ø ' + esc(s ? s[0] : '') + ': <b>' + n1(occ, 1) + ' %</b> · límite ' + r.lim + ' % · libre ' + n1(Math.max(0, 100 - occ), 1) + ' %</div>';
    $('#kDibujo').innerHTML = s ? svgCorte(r, s, 420, 'kHatch') : '';
    $('#kLeyenda').innerHTML = r.lista.map(function (x, i) { return '<li><span class="kdot" style="background:' + COLF[x.k.f] + '"></span><b>' + (i + 1) + '</b> ' + esc(x.c.tag || '(sin tag)') + ' · ' + esc((x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc) + ' · Ø ' + n1(x.d, 1) + ' mm</li>'; }).join('');
    // tabla de tamaños (como el formato original: "Utilizar >>")
    $('#kTam tbody').innerHTML = r.filas.map(function (q) {
      var es = el && q.i === el.i;
      return '<tr data-t="' + q.i + '" class="' + (es ? 'usar' : '') + (s === q.s ? ' visto' : '') + '"><td>' + (es ? '<b>Utilizar ▶</b>' : '') + '</td><td><b>' + esc(q.s[0]) + '</b></td><td class="num">' + n1(q.s[1], 1) + '</td><td class="num">' + n1(q.s[2], 2) + '</td><td class="num">' + n1(q.Ai, 0) + '</td><td class="num">' + n1(q.util, 0) + '</td><td class="num">' + (r.n ? n1(q.occ, 1) + ' %' : '—') + '</td><td>' + (!r.n ? '' : q.cumple ? '✔ cumple' : q.noCabe ? '<span class="kmal">no caben</span>' : q.i < Math.max(0, r.T.s.map(function (z) { return z[0]; }).indexOf(dc.min)) && q.Ai >= r.req ? 'bajo el mínimo' : '<span class="kmal">✖ excede</span>') + '</td></tr>';
    }).join('');
    $('#kFuente').textContent = 'Dimensiones: ' + r.T.f + '. Verifique con el catálogo del fabricante.';
  }

  function cambio() { A.guardar(); pintar(); }
  function leerForm(ev) {
    var t = ev.target, k = t.dataset.k, dc = actual(); if (!k) return;
    dc[k] = k === 'tag' ? t.value.toUpperCase() : t.value;
    if (k === 'tubo') { var T = TUBOS[dc.tubo]; if (T.s.map(function (s) { return s[0]; }).indexOf(dc.min) < 0) dc.min = T.s[0][0]; }
    verTam = null; A.guardar();
    if (ev.type === 'change' || k !== 'tag' && k !== 'ruta') pintar(); else { clearTimeout(leerForm.t); leerForm.t = setTimeout(pintar, 250); }
  }

  // Selector de circuitos del listado
  function abrirSelector() {
    var D = window.LAZOS_DOC; if (!D) return;
    var dc = actual(), ya = {}; dc.cables.forEach(function (c) { if (c.ck) ya[c.ck] = 1; });
    var Cs = D.circuitos(), val = function (c, k) { var v = c.x && c.x[k]; return v != null && v !== '' ? v : (c.auto[k] == null ? '' : c.auto[k]); };
    var dlg = $('#kSel'), q = $('#kSelFiltro');
    function lista() {
      var f = (q.value || '').toLowerCase();
      $('#kSelLista').innerHTML = Cs.filter(function (c) { return !f || [val(c, 'tagC'), val(c, 'equipo'), val(c, 'diseno'), val(c, 'ruta'), val(c, 'hGab'), val(c, 'dGab')].join(' ').toLowerCase().indexOf(f) >= 0; }).map(function (c) {
        var k = CATI[sugerir(val(c, 'diseno'), val(c, 'tipo'), val(c, 'obs'))];
        return '<label class="ksel"><input type="checkbox" value="' + esc(c.key) + '"' + (ya[c.key] ? ' checked disabled' : '') + '><b>' + esc(val(c, 'tagC') || '(sin tag)') + '</b> <span>' + esc(String(val(c, 'tipo')) + ' · ' + String(val(c, 'diseno'))) + '</span><span class="peq">' + esc(String(val(c, 'dGab')).replace(/\n/g, ' ') + ' → ' + String(val(c, 'hGab')).replace(/\n/g, ' ')) + (val(c, 'ruta') ? ' · ruta ' + esc(val(c, 'ruta')) : '') + '</span><span class="peq">Se tomará: ' + esc((k.cod !== '—' ? k.cod + ' ' : '') + k.desc + ' · Ø ' + n1(k.d, 1) + ' mm') + '</span></label>';
      }).join('') || '<p class="vacio">No hay circuitos en el listado. Genera el listado de E/S o agrega circuitos en «Listado de circuitos».</p>';
    }
    var P = pref(), sI = $('#kPrefI'), sC = $('#kPrefC');
    sI.innerHTML = opciones(PREF_INST, P.inst); sC.innerHTML = opciones(PREF_CTRL, P.ctrl);
    sI.onchange = sC.onchange = function () { datos().pref = { inst: sI.value, ctrl: sC.value }; A.guardar(); lista(); };
    q.value = dc.ruta || ''; q.oninput = lista; lista();
    $('#kSelOk').onclick = function () {
      dlg.querySelectorAll('input[type=checkbox]:checked:not(:disabled)').forEach(function (x) {
        var c = Cs.filter(function (z) { return z.key === x.value; })[0]; if (!c) return;
        dc.cables.push({ ck: c.key, tag: val(c, 'tagC'), cat: sugerir(val(c, 'diseno'), val(c, 'tipo'), val(c, 'obs')), n: 1 });
      });
      dlg.close(); cambio();
    };
    dlg.showModal();
  }

  // Escribe el tamaño y la ruta en el listado de circuitos (todos los ductos)
  function asignar() {
    var D = window.LAZOS_DOC; if (!D) return;
    var Cs = D.circuitos(), por = {}, n = 0, b = datos();
    b.ductos.forEach(function (dc) {
      var r = calcular(dc), txt = textoDucto(dc, r); if (!txt) return;
      dc.cables.forEach(function (c) { if (!c.ck) return; (por[c.ck] = por[c.ck] || []).push({ tag: dc.tag, txt: txt, ruta: dc.ruta }); });
    });
    Object.keys(por).forEach(function (key) {
      var c = Cs.filter(function (z) { return z.key === key; })[0]; if (!c) return;
      var L = por[key], dTxt = L.length === 1 ? L[0].txt : L.map(function (x) { return x.tag + ': ' + x.txt; }).join(' / '), rTxt = L.map(function (x) { return x.tag; }).join(' – ');
      var x = c.x; if (!x) { x = c.x = { key: c.key }; E().circ.push(x); }
      x.ducto = dTxt; x.ruta = rTxt; n++;
    });
    A.guardar();
    $('#kEstado').textContent = n ? n + ' circuitos actualizados en el listado (columnas Ducto y Ruta de canalización).' : 'No hay cables vinculados al listado de circuitos con un tamaño calculado.';
  }

  // ── Lámina A3 del ducto (SVG 420 × 297 mm) para imprimir o PDF ──
  function lamina(dc) {
    var r = calcular(dc), s = r.elegido ? r.elegido.s : r.T.s[3], cfg = E().cfg || {}, W = 420, H = 297;
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="420mm" height="297mm" font-family="Arial">';
    o += '<rect width="420" height="297" fill="#fff"/><rect x="10" y="10" width="400" height="277" fill="none" stroke="#000" stroke-width="0.5"/>';
    o += '<text x="20" y="24" font-size="7" font-weight="700">DETALLE DE CANALIZACIÓN · ' + esc(dc.tag) + (dc.ruta ? ' · ' + esc(up(dc.ruta)) : '') + '</text>';
    o += '<text x="20" y="31" font-size="3.6">' + esc(r.T.n) + ' · Criterio ' + esc(r.C.n) + ' · ' + esc((COND.filter(function (c) { return c[0] === dc.cond; })[0] || ['', ''])[1]) + '</text>';
    var corte = svgCorte(r, s, 150, 'hLam' + dc.id).replace(/width="150" height="150"/, 'x="20" y="38" width="150" height="150"');
    o += corte;
    // resumen de cálculo
    var y = 46, L = function (t, b) { o += '<text x="182" y="' + y + '" font-size="3.6"' + (b ? ' font-weight="700"' : '') + '>' + esc(t) + '</text>'; y += 6; };
    L('MEMORIA DE CÁLCULO', true);
    L('1. Suma de secciones de ' + r.n + ' cables (A = π·Ø²/4): ΣA = ' + n1(r.suma, 1) + ' mm²');
    L('2. ' + r.regla);
    L('3. Área interior mínima: ΣA' + (r.res ? ' × ' + n1(1 + r.res / 100, 2) : '') + ' / ' + r.lim + ' % = ' + n1(r.req, 1) + ' mm²');
    L('4. Ducto: ' + (r.elegido ? r.T.c + ' Ø ' + s[0] + ' (Ø int. ' + n1(s[2], 1) + ' mm, área ' + n1(area(s[2]), 0) + ' mm²) · ocupación ' + n1(r.elegido.occ, 1) + ' %' : 'NINGÚN TAMAÑO ALCANZA'), true);
    if (r.elegido) L('5. Espacio libre ' + n1(area(s[2]) - r.suma, 0) + ' mm² · disponible hasta el límite ' + n1(Math.max(0, r.elegido.util - r.suma), 0) + ' mm²');
    y += 2;
    // tabla de cables
    var cols = [[182, 'N°'], [192, 'CIRCUITO'], [242, 'CABLE'], [330, 'Ø mm'], [350, 'ÁREA mm²']];
    o += '<rect x="180" y="' + (y - 4) + '' + '" width="200" height="6" fill="#022A55"/>';
    cols.forEach(function (c) { o += '<text x="' + c[0] + '" y="' + y + '" font-size="3.2" font-weight="700" fill="#fff">' + c[1] + '</text>'; }); y += 5.5;
    r.lista.slice(0, 30).forEach(function (x, i) {
      [[182, String(i + 1)], [192, x.c.tag || '—'], [242, (x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc], [330, n1(x.d, 1)], [350, n1(area(x.d), 1)]].forEach(function (c) { o += '<text x="' + c[0] + '" y="' + y + '" font-size="3">' + esc(String(c[1]).slice(0, 40)) + '</text>'; });
      o += '<line x1="180" x2="380" y1="' + (y + 1.4) + '" y2="' + (y + 1.4) + '" stroke="#bbb" stroke-width="0.15"/>'; y += 4.6;
    });
    if (r.lista.length > 30) { o += '<text x="182" y="' + y + '" font-size="3">… ' + (r.lista.length - 30) + ' cables más (ver Excel)</text>'; y += 4.6; }
    // notas
    var notas = ['LOS PORCENTAJES DE OCUPACIÓN CORRESPONDEN A RIC N°04 TABLA N°4.21 (1 CONDUCTOR 50 %, 2 CONDUCTORES 33 %, 3 O MÁS 33 %), INCLUYENDO LA AISLACIÓN Y CUBIERTA DE CADA CABLE.',
      'VALORES VÁLIDOS PARA TRAMOS DE HASTA 20 m CON NO MÁS DE DOS CURVAS Y DESVIACIÓN TOTAL ≤ 180° (RIC N°04 7.16.1.13); EN OTRO CASO SE INSTALARÁN CAJAS DE PASO INTERMEDIAS.',
      'LAS SEÑALES DE INSTRUMENTACIÓN ANALÓGICAS NO COMPARTIRÁN DUCTO CON CABLES DE FUERZA.',
      'DIÁMETROS DE CABLES REFERENCIALES; VERIFICAR CON EL CATÁLOGO DEL FABRICANTE ANTES DE CONSTRUIR.'];
    var yn = 205; o += '<text x="20" y="' + yn + '" font-size="3.6" font-weight="700">NOTAS</text>'; yn += 5;
    notas.forEach(function (t, i) { (window.LAZOS_DIBUJO && window.LAZOS_DIBUJO.cortar ? window.LAZOS_DIBUJO.cortar((i + 1) + '. ' + t, 95) : [(i + 1) + '. ' + t]).forEach(function (ln) { o += '<text x="20" y="' + yn + '" font-size="3">' + esc(ln) + '</text>'; yn += 4; }); });
    // rótulo
    o += '<rect x="250" y="250" width="160" height="37" fill="none" stroke="#000" stroke-width="0.4"/>';
    o += '<text x="254" y="258" font-size="3.2">PROYECTO: ' + esc(up(cfg.proyecto || cfg.cliente || '')) + '</text><text x="254" y="266" font-size="4.6" font-weight="700">DETALLE DUCTO ' + esc(dc.tag) + '</text><text x="254" y="274" font-size="3.2">' + esc(r.T.c + (r.elegido ? ' Ø ' + s[0] : '')) + ' · ' + r.n + ' CABLES</text><text x="254" y="282" font-size="3">ReyEngi · Suite de ingeniería I&amp;C</text>';
    return o + '</svg>';
  }

  // ── DXF del corte (R12, mm) para pegar en los planos de rutas de canalización ──
  function dxf(dc) {
    var r = calcular(dc), s = r.elegido ? r.elegido.s : r.T.s[3], pk = r.elegido ? r.elegido.pack : empacar(s[2] / 2, r.lista.map(function (x) { return x.d / 2; }));
    var L = ['0', 'SECTION', '2', 'ENTITIES'];
    function c(capa, x, y, rr) { L.push('0', 'CIRCLE', '8', capa, '10', x.toFixed(3), '20', y.toFixed(3), '30', '0', '40', rr.toFixed(3)); }
    function t(capa, x, y, h, txt) { L.push('0', 'TEXT', '8', capa, '10', x.toFixed(3), '20', y.toFixed(3), '30', '0', '40', h.toFixed(3), '1', String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '')); }
    c('DUCTO', 0, 0, s[1] / 2); c('DUCTO', 0, 0, s[2] / 2);
    r.lista.forEach(function (x, i) { var p = pk.pos[i]; if (!p || p.fuera) return; c('CABLES', p.x, p.y, x.d / 2); t('TEXTO', p.x - x.d * 0.15, p.y - x.d * 0.15, Math.max(1, x.d * 0.3), String(i + 1)); });
    var h = Math.max(2, s[1] / 18), y = -s[1] / 2 - h * 2;
    t('TEXTO', -s[1] / 2, y, h, dc.tag + ' ' + r.T.c + ' DIAM ' + s[0] + ' - ' + r.n + ' CABLES - OCUPACION ' + (r.elegido ? n1(r.elegido.occ, 1) : '-') + ' %');
    r.lista.forEach(function (x, i) { y -= h * 1.5; t('TEXTO', -s[1] / 2, y, h * 0.8, (i + 1) + '. ' + (x.c.tag || '') + ' ' + (x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc + ' D=' + x.d + ' mm'); });
    L.push('0', 'ENDSEC', '0', 'EOF');
    return L.join('\r\n');
  }

  // ── Excel de memoria de cálculo ──
  function excel() {
    var X = window.XLSX_RE, lb = X.libro(), b = datos(), AZ = '022A55', h = lb.hoja('DUCTOS', { orientacion: 'landscape' });
    h.cols([12, 26, 34, 10, 14, 12, 16, 14, 14, 12]); h.celda(0, 0, 'DIMENSIONAMIENTO DE CANALIZACIONES · RIC N°04 TABLA N°4.21', { b: true, sz: 12 });
    ['DUCTO', 'RUTA / TRAMO', 'TIPO DE TUBERÍA', 'N° CABLES', 'ΣA CABLES mm²', 'LÍMITE %', 'A REQUERIDA mm²', 'TAMAÑO', 'Ø INT. mm', 'OCUPACIÓN %'].forEach(function (t, i) { h.celda(2, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center', wrap: true }); });
    b.ductos.forEach(function (dc, k) { var r = calcular(dc); [dc.tag, up(dc.ruta), r.T.c, r.n, n1(r.suma, 1), r.lim, n1(r.req, 1), r.elegido ? r.elegido.s[0] : 'NO ALCANZA', r.elegido ? n1(r.elegido.s[2], 2) : '', r.elegido ? n1(r.elegido.occ, 1) : ''].forEach(function (v, i) { h.celda(3 + k, i, String(v), { sz: 9 }); }); });
    var g = lb.hoja('CABLES', { orientacion: 'landscape' }); g.cols([12, 6, 22, 14, 40, 10, 12]);
    ['DUCTO', 'N°', 'TAG CIRCUITO', 'CÓDIGO', 'CABLE', 'Ø mm', 'ÁREA mm²'].forEach(function (t, i) { g.celda(0, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    var f = 1; b.ductos.forEach(function (dc) { calcular(dc).lista.forEach(function (x, i) { [dc.tag, i + 1, x.c.tag || '', x.k.cod, FAM[x.k.f] + ' · ' + x.k.desc, n1(x.d, 1), n1(area(x.d), 1)].forEach(function (v, j) { g.celda(f, j, String(v), { sz: 9 }); }); f++; }); });
    var n = lb.hoja('CRITERIOS'); n.cols([110]);
    ['RIC N°04 (SEC, 2020) 7.16.1.14 y Tabla N°4.21: el conductor o haz de conductores, incluida la aislación, ocupará como máximo 50 % (1 conductor), 33 % (2) o 33 % (3 o más) de la sección de la tubería.',
      'Tabla N°4.21, nota: en tuberías de unión de gabinetes de tableros o similares de hasta 1 m se acepta hasta 60 %. Si el conductor de tierra va en el haz se incluye en el cálculo.',
      'RIC N°04 Tabla N°4.29, nota: en ductos subterráneos con más de 10 conductores o secciones distintas, la sección interior será al menos 4 veces la ocupada (25 %). Ø mínimo subterráneo 25 mm (7.9.7.1).',
      'RIC N°04 7.16.1.13: valores válidos para tramos de hasta 20 m, rectos o con no más de dos curvas y desviación total ≤ 180°; en otro caso, cajas de paso intermedias.',
      'Referencia: NEC 2023 Cap. 9 Tabla 1 (53 % / 31 % / 40 %) y Tabla 4 (dimensiones de RMC, EMT y PVC). Un cable multiconductor se considera un conductor.',
      'Diámetros de cables: catálogo Cocesa del formato original y NEC Cap. 9 Tabla 5 (THHN). Verificar con el fabricante.'].forEach(function (t, i) { n.celda(i, 0, t, { sz: 10, wrap: true }); });
    A.descargar('Canalizaciones_RIC04.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ── Eventos ──
  var listo = false;
  function enganchar() {
    if (listo) return; listo = true;
    $('#kForm').addEventListener('input', leerForm); $('#kForm').addEventListener('change', leerForm);
    $('#kDuctos').addEventListener('click', function (ev) { var tr = ev.target.closest('tr[data-d]'); if (!tr) return; datos().sel = tr.dataset.d; verTam = null; cambio(); });
    $('#kNuevo').addEventListener('click', function () { var b = datos(), d = nuevo(b.ductos.length + 1), a = actual(); d.tubo = a.tubo; d.crit = a.crit; d.min = a.min; b.ductos.push(d); b.sel = d.id; verTam = null; cambio(); $('#kForm [data-k=tag]').focus(); });
    $('#kDuplicar').addEventListener('click', function () { var b = datos(), d = JSON.parse(JSON.stringify(actual())); d.id = A.uid(); d.tag = nuevo(b.ductos.length + 1).tag; b.ductos.push(d); b.sel = d.id; cambio(); });
    $('#kBorrar').addEventListener('click', function () { var b = datos(); if (b.ductos.length <= 1) { b.ductos = []; } else b.ductos = b.ductos.filter(function (d) { return d.id !== b.sel; }); b.sel = ''; verTam = null; cambio(); });
    $('#kAgregar').addEventListener('click', function () { actual().cables.push({ tag: '', cat: CAT[1].id, n: 1 }); cambio(); var t = document.querySelectorAll('#kCables input[data-c=tag]'); if (t.length) t[t.length - 1].focus(); });
    $('#kDesde').addEventListener('click', abrirSelector);
    $('#kSelCerrar').addEventListener('click', function () { $('#kSel').close(); });
    $('#kCables').addEventListener('click', function (ev) { var q = ev.target.dataset.quitar; if (q == null) return; actual().cables.splice(+q, 1); cambio(); });
    $('#kCables').addEventListener('change', function (ev) {
      var t = ev.target, k = t.dataset.c, tr = t.closest('tr[data-i]'); if (!k || !tr) return;
      var c = actual().cables[+tr.dataset.i];
      if (k === 'cat') { c.cat = t.value; delete c.dMan; if (CATI[c.cat].f === 'otro' && !+c.d) c.d = 10; }
      else if (k === 'd') { c.d = +t.value; c.dMan = CATI[c.cat] && CATI[c.cat].f !== 'otro' && Math.abs(+t.value - CATI[c.cat].d) > 1e-6; }
      else if (k === 'n') c.n = Math.max(1, Math.round(+t.value || 1));
      else c[k] = k === 'tag' ? t.value.toUpperCase() : t.value;
      cambio();
    });
    $('#kTam').addEventListener('click', function (ev) { var tr = ev.target.closest('tr[data-t]'); if (!tr) return; verTam = +tr.dataset.t; pintar(); });
    $('#kAsignar').addEventListener('click', asignar);
    $('#kPdf').addEventListener('click', function () { $('#imp').innerHTML = datos().ductos.filter(function (d) { return d.cables.length; }).map(function (d) { return '<div class="hojaImp">' + lamina(d) + '</div>'; }).join('') || '<div class="hojaImp">' + lamina(actual()) + '</div>'; setTimeout(function () { window.print(); }, 150); });
    $('#kDxf').addEventListener('click', function () { var d = actual(); A.descargar('Ducto_' + d.tag.replace(/[\\/:*?"<>|]+/g, '-') + '.dxf', dxf(d), 'application/dxf'); });
    $('#kExcel').addEventListener('click', excel);
  }
  function vista() { enganchar(); pintar(); }
  window.LAZOS_COND = { FAM: FAM, calcular: calcular, empacar: empacar, sugerir: sugerir, TUBOS: TUBOS, CAT: CAT, lamina: lamina, dxf: dxf };
  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { cond: vista });
  var sec = document.getElementById('v-cond'); if (sec && !sec.hidden) vista();
})();
