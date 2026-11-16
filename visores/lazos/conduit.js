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
  var A = window.__LAZOS, BASE = ((document.currentScript || {}).src || '').replace(/[^\/]*$/, '');
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
  // Tuberías rígidas con las mismas medidas interiores del conduit rígido pesado (NEC Cap. 9 Tabla 4, RMC): cambian el material o el recubrimiento
  TUBOS.CAGPVC = { n: 'Cañería acero galvanizado con recubrimiento de PVC · ambientes corrosivos', c: 'C.A.G. REVESTIDO', f: 'NEC Cap. 9 Tabla 4 (RMC) + recubrimiento 1 mm', s: TUBOS.CAG.s.map(function (x) { return [x[0], Math.round((x[1] + 2) * 10) / 10, x[2]]; }) };
  TUBOS.INOX = { n: 'Conduit rígido de acero inoxidable 316', c: 'ACERO INOX.', f: 'NEC Cap. 9 Tabla 4 (RMC)', s: TUBOS.CAG.s };
  TUBOS.ALU = { n: 'Conduit rígido de aluminio · ANSI C80.5', c: 'ALUMINIO', f: 'NEC Cap. 9 Tabla 4 (RMC)', s: TUBOS.CAG.s };
  var ORDEN_TUBOS = ['CAG', 'SCH40', 'EMT', 'PVC40', 'CAGPVC', 'INOX', 'ALU'];
  // ── Ambiente de instalación → tipo de tubería recomendado (práctica habitual de proyectos industriales; RIC N°04 5.12.2, 5.41 y 7.16.4; áreas clasificadas: RIC N°12) ──
  //    rec: tuberías recomendadas en orden de preferencia · no: tuberías que no convienen · alt: alternativas fuera del catálogo de la app
  var AMB = {
    '': { n: 'Sin definir' },
    seco: { n: 'Interior seco (salas, oficinas, bodegas)', rec: ['EMT', 'CAG'], no: [], txt: 'Sin humedad ni agentes agresivos: basta tubería metálica liviana. Usa conduit rígido donde pueda recibir golpes.', ref: 'RIC N°04 7.16.4' },
    ext: { n: 'Exterior a la intemperie', rec: ['CAG', 'SCH40', 'ALU'], no: ['EMT'], txt: 'Lluvia, sol y cambios de temperatura: conduit rígido galvanizado en caliente con accesorios estancos. El PVC a la vista solo si es resistente a rayos UV.', ref: 'RIC N°04 5.12.2 y 7.16.4' },
    humedo: { n: 'Húmedo o con lavado frecuente', rec: ['CAG', 'CAGPVC', 'PVC40'], no: ['EMT'], txt: 'Humedad permanente: tubería metálica protegida contra la corrosión por dentro y por fuera, con cajas y uniones estancas; el PVC rígido también sirve.', ref: 'RIC N°04 5.41 y 5.18' },
    corrosivo: { n: 'Corrosivo (ácidos, SX-EW, costa, agua de mar)', rec: ['CAGPVC', 'PVC40', 'INOX'], no: ['EMT', 'CAG', 'SCH40', 'ALU'], txt: 'Neblina ácida, sales o químicos: el galvanizado solo no dura. Usa conduit rígido con recubrimiento de PVC, PVC rígido o acero inoxidable.', ref: 'RIC N°04 5.41', alt: 'Tubería de fibra de vidrio (RTRC): muy resistente a químicos; dimensiónala con las medidas del fabricante.' },
    explosivo: { n: 'Área clasificada (gases, vapores o polvos combustibles)', rec: ['CAG', 'SCH40', 'INOX'], no: ['EMT', 'PVC40'], txt: 'Atmósfera explosiva: conduit rígido roscado con al menos cinco hilos de rosca apretados, sellos cortafuego y cajas y accesorios certificados para la zona.', ref: 'RIC N°12 (RIC N°04 remite a este pliego)', alt: 'Si además hay corrosión, conduit rígido con recubrimiento de PVC certificado para área clasificada.' },
    mecanico: { n: 'Con riesgo de golpes (chancado, correas, tránsito)', rec: ['CAG', 'SCH40'], no: ['EMT', 'PVC40'], txt: 'Golpes, vibración o caída de material: conduit rígido de acero pesado, bien soportado.', ref: 'RIC N°04 7.16.4.1 y Tabla N°4.23' },
    calor: { n: 'Alta temperatura (hornos, fundición, sobre 50 °C)', rec: ['CAG', 'SCH40', 'INOX'], no: ['PVC40', 'CAGPVC'], txt: 'El PVC se ablanda con el calor: usa tubería metálica y cables aptos para esa temperatura.', ref: 'RIC N°04 Tabla N°4.23 (temperatura de servicio)' },
    enterrado: { n: 'Enterrado directo o en banco de ductos', rec: ['PVC40', 'CAGPVC', 'CAG'], no: ['EMT'], txt: 'Bajo tierra: PVC rígido (o HDPE) en banco de ductos; si es metálico, con protección contra la corrosión.', ref: 'RIC N°04 5.41 y 7.9.7', alt: 'Ducto de polietileno de alta densidad (HDPE): dimensiónalo con las medidas del fabricante.' },
    hormigon: { n: 'Embebido en hormigón o losa', rec: ['PVC40', 'CAG'], no: [], txt: 'Embebida en hormigón la tubería queda protegida: PVC rígido o conduit metálico, con uniones selladas para que no entre lechada.', ref: 'RIC N°04 7.16.5 y Tabla N°4.26' },
    sanitario: { n: 'Sanitario o de alimentos', rec: ['INOX', 'CAGPVC'], no: ['EMT', 'CAG', 'SCH40'], txt: 'Lavado con químicos y exigencia de higiene: acero inoxidable con accesorios del mismo material.', ref: 'Práctica habitual; RIC N°04 5.41' }
  };
  var ORDEN_AMB = ['', 'seco', 'ext', 'humedo', 'corrosivo', 'explosivo', 'mecanico', 'calor', 'enterrado', 'hormigon', 'sanitario'];
  function ambiente(dc) { var a = AMB[dc.amb || '']; if (!a || !a.rec) return null; var pos = a.rec.indexOf(dc.tubo); return { a: a, ok: pos >= 0, mejor: a.rec[0], evitar: a.no.indexOf(dc.tubo) >= 0 }; }

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
    fos: 'Fibra óptica sin armadura para conductos · GC fibra óptica', fod: 'Fibra óptica dieléctrica con armadura de fibra de vidrio · GC fibra óptica', foa: 'Fibra óptica con armadura de acero corrugado · GC fibra óptica',
    fou: 'Fibra óptica monotubo sin armadura · GC fibra óptica', folt: 'Fibra óptica loose-tube sin armadura · GC fibra óptica', folta: 'Fibra óptica loose-tube con armadura de acero · GC fibra óptica',
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
  // Fibra óptica: diámetro exterior y radio mínimo de curvatura del catálogo «Cables de fibra óptica» de General Cable (tablas de especificaciones, 12 fibras por módulo).
  //   filas: [fibras, Ø exterior mm, radio mínimo mm, módulos o tubos]
  function fibra(f, cod, filas) { filas.forEach(function (x) { var desc = x[0] + ' fibras'; cat(f, cod, desc, x[1], x[3] || 1, false, '', f + ':' + desc); var c = CAT[CAT.length - 1]; c.fo = true; c.rc = x[2]; }); }
  fibra('fos', 'FO', [['12', 5.5, 60, 1], ['24', 7, 70, 2], ['36', 7, 70, 3], ['48', 8, 80, 4], ['72', 10, 100, 6], ['96', 11.5, 115, 8], ['144', 11.5, 115, 12], ['192', 13, 130, 16], ['288', 16, 160, 24]]);
  fibra('fod', 'FO-D', [['12', 9.2, 110, 1], ['24', 10.6, 140, 2], ['48', 11.6, 150, 4], ['72', 13.5, 170, 6], ['96', 15.5, 195, 8], ['144', 15.5, 195, 12], ['192', 17, 215, 16], ['288', 21.2, 260, 24]]);
  fibra('foa', 'FO-A', [['12', 11, 140, 1], ['24', 12.5, 165, 2], ['36', 12.5, 165, 3], ['48', 13.5, 180, 4], ['72', 15.5, 200, 6], ['96', 17.5, 230, 8], ['144', 17.5, 230, 12], ['192', 18.5, 240, 16], ['288', 18.5, 240, 24]]);
  fibra('fou', 'FO-U', [['1 a 12', 6.5, 70, 1]]);
  fibra('folt', 'FO-LT', [['6 a 72', 11.5, 115, 6], ['72 a 144', 17, 170, 12]]);
  fibra('folta', 'FO-LTA', [['6 a 72', 15.5, 200, 6], ['72 a 144', 20.5, 240, 12]]);
  var CATI = {}; CAT.forEach(function (c) { CATI[c.id] = c; });
  var COLF = { par: '#2f6db3', mpar: '#1d4f8a', mtri: '#5a3fa0', xtcc: '#3c4650', xtmu: '#202020', thhn: '#9a3b1d', otro: '#6b7480',
    pvicp: '#2f6db3', pvict: '#5a3fa0', gfip: '#1f7a6a', gfit: '#2b8c5a', cvtc: '#3c4650', gfc: '#4a6b3a', dlx: '#59606a',
    xtu: '#202020', xtm3: '#202020', xtm3n: '#202020', xtm3nt: '#202020', xtk3: '#202020', sfx3: '#262c33', sfx3nt: '#262c33', rz1m: '#2e6b3a', rz1: '#2e6b3a',
    thgc: '#9a3b1d', evaf: '#8a5a1a', exz: '#6a8a2a', genl: '#8a2a2a', gpt: '#7a4a6a',
    fos: '#C9A227', fod: '#C9A227', foa: '#2b2f36', fou: '#C9A227', folt: '#2b2f36', folta: '#2b2f36' };
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
  // ── Estándar de diseño del proyecto: perfil de criterios y formato del tag de los ductos ──
  //    Los perfiles reúnen criterios habituales de proyectos mineros como parámetros (límite de ocupación, diámetros preferidos, mínimos); el RIC N°04 sigue aplicando siempre.
  var EST = {
    ric: { n: 'RIC N°04 (SEC) · base', d: 'Solo los límites del pliego RIC N°04: 50 % con un conductor y 33 % con dos o más.' },
    min1: { n: 'Gran minería · perfil 1', ocMax: 40, pref: ['3/4"', '1"', '1 1/2"', '2"', '3"', '4"'], minSubt: '2"', tubos: ['CAG', 'SCH40', 'PVC40', 'CAGPVC', 'INOX'], d: 'Ocupación máxima de 40 % (además del RIC), diámetros preferidos 3/4", 1", 1 1/2", 2", 3" y 4", mínimo de 2" en ductos enterrados y tubería rígida de acero galvanizado ANSI C80.1 o PVC; con recubrimiento de PVC en zonas corrosivas.' }
  };
  var PATRONES = [['{ZONA}-{TAG}-{SERV}-{NN}', 'Zona - tag - servicio - correlativo · 0430-FIT101-J-01'], ['{ZONA}-{SERV}-{NN}', 'Zona - servicio - correlativo · 0430-P-01'], ['{ZONA}C{SERV}{NNNN}', 'Zona + C + servicio + correlativo · 0430CP1001'], ['{TAG}-{SERV}-{NN}', 'Tag - servicio - correlativo · JB001-C-01'], ['{SERV}-{NN}', 'Servicio - correlativo · P-01']];
  var SERVL = { P: 'P · Potencia / fuerza', J: 'J · Instrumentación', C: 'C · Control', R: 'R · Comunicaciones y redes' };
  function est() { var b = datos(); b.std = b.std || {}; if (!EST[b.std.perfil]) b.std.perfil = 'ric'; if (!b.std.patron) b.std.patron = PATRONES[0][0]; if (b.std.zona == null) b.std.zona = ''; return b.std; }
  function servLetra(dc) { if (SERVL[dc.sl]) return dc.sl; var c = { P: 0, J: 0, C: 0, R: 0 }; (dc.cables || []).forEach(function (x) { var k = CATI[x.cat]; if (!k) return; var sv = servDe(k.f); c[sv === 'inst' ? 'J' : sv === 'ctrl' ? 'C' : sv === 'fo' ? 'R' : 'P'] += Math.max(1, +x.n || 1); }); return ['P', 'J', 'C', 'R'].sort(function (a, b) { return c[b] - c[a]; })[0]; }
  function tagAuto(dc) {
    var e = est(), b = datos(), usados = {}; b.ductos.forEach(function (d) { if (d !== dc) usados[up(d.tag)] = 1; });
    var zona = up(dc.zona || e.zona || '').replace(/\s+/g, ''), eq = up(dc.eq || '').replace(/[\s\-_\/]+/g, ''), sv = servLetra(dc);
    function arma(n) { var t = e.patron.replace(/\{ZONA\}/g, zona).replace(/\{TAG\}/g, eq).replace(/\{SERV\}/g, sv).replace(/\{(N+)\}/g, function (m, q) { var x = String(n); while (x.length < q.length) x = '0' + x; return x; }); return t.replace(/([\-_\/.])\1+/g, '$1').replace(/^[\-_\/.]+|[\-_\/.]+$/g, ''); }
    if (!/\{N+\}/.test(e.patron)) return arma(1);
    for (var n = 1; n < 10000; n++) { var t = arma(n); if (!usados[t]) return t; } return arma(1);
  }
  // Ruta de cada circuito: los ductos por los que pasa, encadenados por «desde» y «hasta» (por ejemplo instrumento → caja → sala)
  function rutas() {
    var b = datos(), m = {}, orden = [];
    b.ductos.forEach(function (d) { (d.cables || []).forEach(function (c) { var t = up(c.tag || '').trim(); if (!t) return; if (!m[t]) { m[t] = { circ: t, cable: c, ductos: [] }; orden.push(t); } if (m[t].ductos.indexOf(d) < 0) m[t].ductos.push(d); }); });
    return orden.map(function (t) { var x = m[t], ds = x.ductos.slice(), cad = [], k = CATI[x.cable.cat];
      var ini = ds.filter(function (d) { return !ds.some(function (o) { return o !== d && up(o.hasta || '') && up(o.hasta) === up(d.desde || ''); }); })[0] || ds[0];
      while (ini && cad.indexOf(ini) < 0) { cad.push(ini); var sig = ds.filter(function (o) { return cad.indexOf(o) < 0 && up(o.desde || '') && up(o.desde) === up(ini.hasta || ''); })[0]; ini = sig; }
      ds.forEach(function (d) { if (cad.indexOf(d) < 0) cad.push(d); });
      var txt = []; cad.forEach(function (d, i) { if (i === 0 && d.desde) txt.push(up(d.desde)); txt.push('[' + d.tag + ']'); if (d.hasta) txt.push(up(d.hasta)); });
      return { circ: t, cable: k ? (k.cod !== '—' ? k.cod + ' ' : '') + k.desc : '', ductos: cad.map(function (d) { return d.tag; }), ruta: txt.join(' → ') }; });
  }
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
    var PF = EST[est().perfil]; if (PF && PF.ocMax && dc.cond !== 'niple' && lim > PF.ocMax) { lim = PF.ocMax; regla += ' · limitado a ' + PF.ocMax + ' % por el estándar de diseño «' + PF.n + '»'; }
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
    var CLASE = { fos: 'senal', fod: 'senal', foa: 'senal', fou: 'senal', folt: 'senal', folta: 'senal', par: 'senal', mpar: 'senal', mtri: 'senal', pvicp: 'senal', pvict: 'senal', gfip: 'senal', gfit: 'senal', xtcc: 'control', cvtc: 'control', gfc: 'control', dlx: 'control', otro: '' };
    var cls = {}, nFuerza = 0; dc.cables.forEach(function (c) { var k = CATI[c.cat]; if (!k) return; var cl = CLASE[k.f] === undefined ? 'fuerza' : CLASE[k.f]; if (!cl) return; cls[cl] = 1; if (cl === 'fuerza') nFuerza += Math.max(1, Math.round(+c.n || 1)); });
    if (cls.senal && (cls.fuerza || cls.control)) avisos.push('RIC N°04 7.1.7: el ducto mezcla cables de señal con ' + (cls.fuerza ? 'fuerza' : 'control') + '; las canalizaciones de fuerza y de comunicación o control se separan para evitar influencias electromagnéticas. Usa ductos separados.');
    if (nFuerza > 1 && dc.cond !== 'niple') avisos.push('RIC N°04 5.27: en una misma tubería solo van conductores de un mismo circuito; hay ' + nFuerza + ' cables de fuerza. Si son circuitos distintos, sepáralos o usa bandeja / escalerilla.');
    if (dc.cond === 'normal' && +dc.largo > 15 && !(+dc.curvas > 0)) avisos.push('RIC N°04 7.16.1.7: en tramos rectos los registros no pueden quedar a más de 15 m entre sí.');
    if (dc.cond === 'normal' && (+dc.largo > 20 || +dc.curvas > 2)) avisos.push('RIC N°04 7.16.1.13: los valores valen para tramos de hasta 20 m con no más de dos curvas (desviación total ≤ 180°); coloca cajas de paso intermedias.');
    if (dc.cond === 'subt' && +dc.largo > 90) avisos.push('RIC N°04 7.9.7.8: distancia máxima entre cámaras de 90 m (hasta 120 m en tramos rectos con ductos ≥ 50 mm).');
    if (elegido && n === 3 && Object.keys(dist).length === 1) { var rz = elegido.s[2] / lista[0].d; if (rz >= 2.8 && rz <= 3.2) avisos.push('Relación Ø interior / Ø cable = ' + n1(rz, 2) + ': con 3 cables iguales entre 2,8 y 3,2 hay riesgo de atascamiento al tirar (NEC Cap. 9, nota informativa). Considera el tamaño siguiente.'); }
    if (dc.cond === 'subt' && dc.crit === 'RIC') avisos.push('RIC N°04 7.9.7.1: el ducto subterráneo no puede ser menor a 25 mm.');
    return { T: T, C: C, lista: lista, suma: suma, n: n, lim: lim, regla: regla, res: res, req: req, filas: filas, elegido: elegido, avisos: avisos, dmax: dmax, minI: minI, cls: cls, nFuerza: nFuerza };
  }
  // ── Radios de curvatura (RIC N°04) ──
  //    Tubería metálica: Tabla N°4.22 (radio al borde interior, cuando el fabricante no lo indica). Ducto subterráneo: 10 veces el diámetro (7.9.7.8).
  //    Cables (6.2.8): cobre flexible 4 × Ø exterior, alambre o cableado concéntrico 8 ×, apantallados 12 ×.
  var T422 = [[16, 10], [20, 10], [25, 18], [32, 20], [40, 25], [50, 30], [63, 40], [75, 45], [90, 55], [100, 60], [110, 75], [140, 90]];
  var DN = { '1/2"': 16, '3/4"': 20, '1"': 25, '1 1/4"': 32, '1 1/2"': 40, '2"': 50, '2 1/2"': 63, '3"': 75, '3 1/2"': 90, '4"': 100, '5"': 140, '6"': 160 };
  function curvatura(dc, r, s) {
    var o = { ducto: null, refDucto: '', cables: [], cable: null, r: 0 };
    if (s) { var dn = DN[s[0]] || parseFloat(s[0]) || Math.round(s[1]);
      if (dc.cond === 'subt') { o.ducto = 10 * s[1]; o.refDucto = '7.9.7.8: 10 veces el diámetro del ducto (' + n1(s[1], 1) + ' mm)'; }
      else { var f = T422.filter(function (x) { return x[0] >= dn; })[0]; if (f) { o.ducto = f[1] * 10; o.refDucto = 'Tabla N°4.22: tubería de ' + f[0] + ' mm → ' + f[1] + ' cm al borde interior'; } else o.refDucto = 'Tabla N°4.22 no cubre este diámetro: usar el radio que indique el fabricante'; }
      if (!/C\.A\.G|EMT|SCH40|ACERO|RMC|IMC|ALUMINIO/i.test(r.T.c + ' ' + r.T.n) && dc.cond !== 'subt' && o.ducto) o.refDucto += ' (tabla de tuberías metálicas, usada como referencia: confirmar con el fabricante)'; }
    var vistos = {};
    r.lista.forEach(function (x) { var k = x.k, fac = k.rc ? 0 : k.ap ? 12 : /FLEX/i.test(k.cod + ' ' + k.desc) ? 4 : 8, id = (x.c.tag || '') + '|' + k.id; if (vistos[id]) return; vistos[id] = 1;
      o.cables.push({ tag: x.c.tag || '(sin tag)', desc: (k.cod !== '—' ? k.cod + ' ' : '') + k.desc, d: x.d, fac: fac, clase: k.rc ? 'fibra óptica' : k.ap ? 'apantallado' : fac === 4 ? 'cobre flexible' : 'alambre o cableado concéntrico', r: k.rc || fac * x.d, como: k.rc ? 'radio mínimo del fabricante' : fac + ' × Ø ' + n1(x.d, 1) + ' mm' }); });
    o.cables.sort(function (a, b) { return b.r - a.r; }); o.cable = o.cables[0] || null;
    o.r = Math.max(o.ducto || 0, o.cable ? o.cable.r : 0); o.manda = o.cable && o.cable.r > (o.ducto || 0) ? 'cable' : 'ducto';
    return o;
  }
  // ── Soportación y cajas de paso del tramo (materiales de referencia) ──
  //    Distancia entre soportes: RIC N°04 7.16.4.4 (metálica, 1,50 m) y Tabla N°4.24 (no metálica). Cajas: RIC N°04 5.23 y, como referencia de tamaño,
  //    NEC 314.28 (largo ≥ 8 × diámetro comercial en tiro recto). Medidas de abrazaderas, rieles y cajas: catálogo MJM de escalerillas y accesorios (ed. 13-09-2023).
  var MJM = 'Catálogo MJM (ed. 13-09-2023)';
  var ABZ_RUC = { '1/2"': [10, 32, 40, 2], '3/4"': [12.5, 32, 44, 2], '1"': [16, 32, 52, 2], '1 1/4"': [20, 32, 61, 2], '1 1/2"': [25, 32, 71, 2.5], '2"': [31.5, 32, 85, 2.5], '2 1/2"': [37.5, 32, 99, 2.5], '3"': [45, 32, 112, 2.5], '4"': [55, 32, 137, 2.5], '5"': [62.5, 32, 164, 2.5], '6"': [80, 32, 180, 2.5] };
  var ABZ_RT = { '3/4"': [9.5, 26, 34, 2], '1"': [12.5, 26, 40, 2] };   // tubería (EMT); el catálogo llega a 1"
  var CAJ_N4 = [[100, 100, 75], [100, 100, 100], [150, 100, 100], [150, 150, 100], [200, 100, 100], [200, 150, 100], [250, 150, 100], [300, 150, 100], [300, 200, 100], [400, 300, 100], [400, 300, 150], [500, 400, 150]];
  var CAJ_ESP = [['Tipo D', 390, 250, 190], ['Tipo C', 640, 520, 240], ['Tipo B', 730, 720, 200]];
  var T424 = [[25, 1.2], [63, 1.5], [90, 1.8], [140, 2.0], [160, 2.5]];
  function nCajas(dc) { var Lm = parseFloat(String(dc.largo).replace(',', '.')), N = Math.max(0, Math.round(parseFloat(dc.curvas) || 0));
    return dc.cond === 'normal' && Lm > 0 ? Math.max(Lm > 20 ? Math.ceil(Lm / 20) - 1 : 0, N > 2 ? Math.ceil(N / 2) - 1 : 0) : dc.cond === 'subt' && Lm > 90 ? Math.ceil(Lm / 90) - 1 : 0; }
  function soportacion(dc, r, s) {
    var o = { items: [], nSop: 0, sep: 0, cajas: nCajas(dc), caja: null, abz: null, riel: '' }; if (!s) return o;
    var Lm = parseFloat(String(dc.largo).replace(',', '.')) || 0, med = s[0], pulg = med.split(' ').reduce(function (a, t) { var q = t.replace('"', '').split('/'); return a + (q.length === 2 ? q[0] / q[1] : +q[0]); }, 0), dn = DN[med] || Math.round(s[1]);
    var metal = !/PVC/i.test(r.T.c), emt = /EMT/i.test(r.T.c);
    // soportes
    if (dc.cond === 'subt') o.notaSop = 'Ducto subterráneo: va enterrado, sin abrazaderas ni riel.';
    else if (dc.cond === 'niple') o.notaSop = 'Tubería de unión de hasta 1 m: se sostiene en los gabinetes que une.';
    else { o.sep = metal ? 1.5 : (T424.filter(function (x) { return x[0] >= dn; })[0] || T424[4])[1]; o.refSep = metal ? 'RIC N°04 7.16.4.4: tubería metálica, soportes a no más de 1,50 m' : 'RIC N°04 Tabla N°4.24: tubería no metálica de ' + dn + ' mm, soportes cada ' + n1(o.sep, 2) + ' m';
      if (Lm > 0) o.nSop = Math.ceil(Lm / o.sep) + 1 + 2 * o.cajas;
      var t = emt ? ABZ_RT[med] : ABZ_RUC[med];
      o.abz = { tipo: emt ? 'RT (tubería)' : 'RUC (cañería)', med: med, d: t || null };
      o.riel = emt ? 'Riel 35*35*2,0 mm (o 19*35 en cargas livianas), tira de 3000 mm' : 'Riel 42*42*2,0 mm (42*25 o 42*35 según carga), tira de 3000 mm';
      if (o.nSop) { o.items.push({ cant: o.nSop, un: 'un', desc: 'Abrazadera ' + o.abz.tipo + ' ' + med + (t ? ' · ancho ' + t[1] + ' mm, alto ' + t[2] + ' mm, espesor ' + String(t[3]).replace('.', ',') + ' mm' : ' · medida fuera del catálogo, consultar al fabricante') + ', zincada o galvanizada', ref: MJM });
        var mR = o.nSop * 0.3; o.rielM = mR; o.items.push({ cant: Math.ceil(mR / 3), un: 'tira', desc: o.riel + ' · ' + o.nSop + ' tramos de 0,30 m (' + n1(mR, 1) + ' m) para un ducto', ref: MJM }); } }
    // caja de paso
    if (dc.cond !== 'niple') { var Lmin = 8 * pulg * 25.4, An = s[1] + 50, Pr = s[1] + 25, c = CAJ_N4.filter(function (x) { return x[0] >= Lmin && x[1] >= An && x[2] >= Pr; })[0];
      if (c) o.caja = { n: 'Caja de derivación NEMA 4 ' + c[0] + 'x' + c[1] + 'x' + c[2] + ' mm', d: c };
      else { var e = CAJ_ESP.filter(function (x) { return x[1] >= Lmin && x[2] >= An && x[3] >= Pr; })[0]; o.caja = e ? { n: 'Caja especial ' + e[0] + ' ' + e[1] + 'x' + e[2] + 'x' + e[3] + ' mm', d: [e[1], e[2], e[3]] } : { n: 'Caja a medida de al menos ' + Math.ceil(Lmin / 50) * 50 + ' mm de largo', d: [Math.ceil(Lmin / 50) * 50, Math.ceil(An / 50) * 50 + 100, Math.ceil(Pr / 50) * 50 + 50], medida: true }; }
      o.caja.ref = 'Largo ≥ 8 × ' + med + ' = ' + n1(Lmin, 0) + ' mm (referencia NEC 314.28, tiro recto); RIC N°04 5.23 pide 25 % de volumen libre';
      if (dc.cond === 'subt') o.caja.n = 'Cámara de paso (obra civil); como registro: ' + o.caja.n;
      if (o.cajas) o.items.unshift({ cant: o.cajas, un: 'un', desc: o.caja.n + ' · con tapa apernada', ref: o.caja.medida ? 'A medida' : MJM }); }
    return o;
  }
  // ── Detalles de montaje del trazado (dibujos propios, esquemáticos, con las medidas del catálogo) ──
  function cotaH(x1, x2, y, t, ye) { return '<g class="kd-c"><path d="M' + x1 + ' ' + ye + 'V' + y + 'M' + x2 + ' ' + ye + 'V' + y + 'M' + x1 + ' ' + y + 'H' + x2 + '"/><path class="kd-f" d="M' + (x1 - 3) + ' ' + (y + 3) + 'l6 -6M' + (x2 - 3) + ' ' + (y + 3) + 'l6 -6"/><text x="' + (x1 + x2) / 2 + '" y="' + (y - 3) + '" text-anchor="middle">' + t + '</text></g>'; }
  function cotaV(y1, y2, x, t, xe) { return '<g class="kd-c"><path d="M' + xe + ' ' + y1 + 'H' + x + 'M' + xe + ' ' + y2 + 'H' + x + 'M' + x + ' ' + y1 + 'V' + y2 + '"/><path class="kd-f" d="M' + (x - 3) + ' ' + (y1 + 3) + 'l6 -6M' + (x - 3) + ' ' + (y2 + 3) + 'l6 -6"/><text transform="translate(' + (x - 4) + ' ' + (y1 + y2) / 2 + ') rotate(-90)" text-anchor="middle">' + t + '</text></g>'; }
  function detSoporte(so, s, T) {
    var De = s[1], a = so.abz, d = a.d || [De / 2, 32, De + 20, 2], C = d[2], A = d[1], E = d[3], emt = /RT/.test(a.tipo), Rw = emt ? 35 : 42, Rh = emt ? 35 : 42, k = Math.min(2.6, 170 / (C + Rh + 6)), q = function (v) { return Math.round(v * k * 10) / 10; };
    var yR = 262, yT = yR - q(Rh), r = q(De / 2), cy = yT - r, top = yT - q(C), o = '<svg viewBox="0 0 560 320" class="kd-svg" role="img" aria-label="Detalle de abrazadera sobre riel"><rect width="560" height="320" fill="#fff"/>';
    var cx = 150, Lr = 210; o += '<text class="kd-t" x="' + cx + '" y="22" text-anchor="middle">VISTA SEGÚN EL EJE DEL DUCTO</text>';
    o += '<rect class="kd-r" x="' + (cx - Lr / 2) + '" y="' + yT + '" width="' + Lr + '" height="' + q(Rh) + '"/><path class="kd-l" d="M' + (cx - Lr / 2) + ' ' + (yT + q(Rh) * 0.24) + 'H' + (cx + Lr / 2) + '"/>';
    o += '<circle class="kd-d" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><circle class="kd-di" cx="' + cx + '" cy="' + cy + '" r="' + q(s[2] / 2) + '"/>';
    var e = Math.max(2, q(E)), ro = r + e / 2; o += '<path class="kd-a" style="stroke-width:' + e + '" d="M' + (cx - ro) + ' ' + yT + 'V' + cy + 'A' + ro + ' ' + ro + ' 0 0 1 ' + (cx - 5) + ' ' + (cy - ro + 1) + 'V' + top + 'M' + (cx + ro) + ' ' + yT + 'V' + cy + 'A' + ro + ' ' + ro + ' 0 0 0 ' + (cx + 5) + ' ' + (cy - ro + 1) + 'V' + top + '"/>';
    o += '<rect class="kd-p" x="' + (cx - 13) + '" y="' + (top + 4) + '" width="26" height="5"/><rect class="kd-p" x="' + (cx - 17) + '" y="' + (top + 2) + '" width="5" height="9"/><rect class="kd-p" x="' + (cx + 11) + '" y="' + (top + 2.5) + '" width="6" height="8"/>';
    o += cotaH(cx - r, cx + r, Math.max(34, top - 14), 'Ø ' + n1(De, 1), cy) + cotaV(top, yT, cx - Lr / 2 - 16, 'C = ' + C, cx - 6) + cotaH(cx - Lr / 2, cx + Lr / 2, yR + 22, 'tramo de riel 300', yR);
    var x2 = 420, w = q(Rw), t = Math.max(1.6, q(2)), lip = q(9), ab = q(22); o += '<text class="kd-t" x="' + x2 + '" y="22" text-anchor="middle">VISTA SEGÚN EL RIEL</text>';
    o += '<path class="kd-d" d="M' + (x2 - 95) + ' ' + (cy - r) + 'H' + (x2 + 95) + 'V' + (cy + r) + 'H' + (x2 - 95) + 'Z"/>';
    o += '<path class="kd-r2" style="stroke-width:' + t + '" d="M' + (x2 - ab / 2) + ' ' + (yT + lip) + 'V' + yT + 'H' + (x2 - w / 2) + 'V' + yR + 'H' + (x2 + w / 2) + 'V' + yT + 'H' + (x2 + ab / 2) + 'V' + (yT + lip) + '"/>';
    var aw = q(A); o += '<rect class="kd-a2" x="' + (x2 - aw / 2) + '" y="' + top + '" width="' + aw + '" height="' + (yT - top + lip * 0.8) + '"/><circle class="kd-p" cx="' + x2 + '" cy="' + (top + 7) + '" r="3"/>';
    o += cotaH(x2 - aw / 2, x2 + aw / 2, Math.max(34, top - 14), 'A = ' + A, top) + cotaH(x2 - w / 2, x2 + w / 2, yR + 22, Rw, yR) + cotaV(yT, yR, x2 + w / 2 + 26, Rh, x2 + w / 2);
    o += '<text class="kd-n" x="280" y="312" text-anchor="middle">Dibujo esquemático, medidas en mm. Abrazadera de dos piezas enganchada en el riel y cerrada con perno.</text></svg>';
    return { t: 'Soporte: abrazadera ' + a.tipo + ' ' + a.med + ' sobre riel', svg: o, filas: [['Ducto', T.c + ' Ø ' + s[0] + ' · Ø ext. ' + n1(s[1], 1) + ' mm'], ['Abrazadera', a.tipo + ' ' + a.med + (a.d ? '' : ' (medida fuera del catálogo: consultar)')], ['R · radio interior', (a.d ? String(d[0]).replace('.', ',') : n1(De / 2, 1)) + ' mm'], ['A · ancho de la pletina', A + ' mm'], ['C · alto total', C + ' mm'], ['E · espesor', String(E).replace('.', ',') + ' mm'], ['Perforación del perno', 'Ø 6,5 mm'], ['Riel', so.riel], ['Terminación', 'Zincada o galvanizada'], ['Separación', n1(so.sep, 2) + ' m entre soportes (' + so.refSep + ')'], ['Cantidad', so.nSop + ' soportes en el tramo'], ['Fuente de medidas', MJM]] };
  }
  function detCaja(so, s, T, dc) {
    var c = so.caja, d = c.d, L = d[0], W = d[1], P = d[2], De = s[1], k = Math.min(1.1, 300 / (L + 110), 120 / W, 80 / P), q = function (v) { return Math.round(v * k * 10) / 10; }, o = '<svg viewBox="0 0 560 340" class="kd-svg" role="img" aria-label="Detalle de caja de paso"><rect width="560" height="340" fill="#fff"/>';
    var cx = 280, y1 = 52, l = q(L), w = q(W), pr = q(P), de = Math.max(5, q(De)), x0 = cx - l / 2, st = Math.max(28, q(45));
    o += '<text class="kd-t" x="' + cx + '" y="22" text-anchor="middle">VISTA DE FRENTE (TAPA)</text>';
    o += '<rect class="kd-d" x="' + (x0 - st) + '" y="' + (y1 + w / 2 - de / 2) + '" width="' + st + '" height="' + de + '"/><rect class="kd-d" x="' + (x0 + l) + '" y="' + (y1 + w / 2 - de / 2) + '" width="' + st + '" height="' + de + '"/>';
    o += '<rect class="kd-p" x="' + (x0 - 5) + '" y="' + (y1 + w / 2 - de / 2 - 3) + '" width="5" height="' + (de + 6) + '"/><rect class="kd-p" x="' + (x0 + l) + '" y="' + (y1 + w / 2 - de / 2 - 3) + '" width="5" height="' + (de + 6) + '"/>';
    o += '<rect class="kd-k" x="' + x0 + '" y="' + y1 + '" width="' + l + '" height="' + w + '" rx="3"/><rect class="kd-l2" x="' + (x0 + 5) + '" y="' + (y1 + 5) + '" width="' + (l - 10) + '" height="' + (w - 10) + '" rx="2"/>';
    var nb = L >= 300 ? 3 : 2; for (var i = 0; i < nb; i++) { var bx = x0 + 10 + (l - 20) * i / (nb - 1); o += '<circle class="kd-p" cx="' + bx + '" cy="' + (y1 + 10) + '" r="2.6"/><circle class="kd-p" cx="' + bx + '" cy="' + (y1 + w - 10) + '" r="2.6"/>'; }
    o += cotaH(x0, x0 + l, y1 - 12, 'L = ' + L, y1) + cotaV(y1, y1 + w, x0 - st - 14, 'A = ' + W, x0);
    var y2 = y1 + w + 62; o += '<text class="kd-t" x="' + cx + '" y="' + (y2 - 16) + '" text-anchor="middle">VISTA LATERAL</text>';
    o += '<rect class="kd-d" x="' + (x0 - st) + '" y="' + (y2 + pr / 2 - de / 2) + '" width="' + st + '" height="' + de + '"/><rect class="kd-d" x="' + (x0 + l) + '" y="' + (y2 + pr / 2 - de / 2) + '" width="' + st + '" height="' + de + '"/>';
    o += '<rect class="kd-k" x="' + x0 + '" y="' + y2 + '" width="' + l + '" height="' + pr + '"/><rect class="kd-p" x="' + (x0 - 3) + '" y="' + (y2 - 4) + '" width="' + (l + 6) + '" height="4"/>';
    o += cotaV(y2, y2 + pr, x0 - st - 14, 'P = ' + P, x0) + '<text class="kd-n" x="' + (x0 + l + st + 6) + '" y="' + (y2 + pr / 2 + 3) + '">Ø ' + s[0] + '</text>';
    o += '<text class="kd-n" x="280" y="332" text-anchor="middle">Dibujo esquemático, medidas en mm. Tapa apernada; entradas con tuerca, contratuerca y boquilla.</text></svg>';
    return { t: c.n, svg: o, filas: [['Tipo', c.n], ['Largo × ancho × profundidad', L + ' × ' + W + ' × ' + P + ' mm'], ['Ducto que entra', T.c + ' Ø ' + s[0] + ' · Ø ext. ' + n1(De, 1) + ' mm'], ['Criterio de tamaño', c.ref], ['Protección', c.medida ? 'A definir con el fabricante' : /NEMA 4/.test(c.n) ? 'NEMA 4: a prueba de agua y polvo, tapa embutida y apernada' : 'Caja especial, terminación pintada'], ['Terminación', 'Galvanizada, zincada o pintada'], ['Cantidad', so.cajas ? so.cajas + ' en el tramo' : 'El tramo no la necesita; referencia por si se intercala'], ['Fuente de medidas', c.medida ? 'A medida' : MJM]] };
  }
  function cm(mm) { return n1(mm / 10, mm / 10 >= 20 ? 0 : 1) + ' cm'; }
  // ── Verificación de cumplimiento (RIC N°04): cada requisito con su estado, la cláusula y qué hacer si no cumple ──
  //    sev: ok (cumple), warn (advertencia o dato faltante), err (no cumple). «s» es el tamaño que se está mirando.
  function verificar(dc, r, s) {
    var o = [], ric = dc.crit === 'RIC', nor = ric ? 'RIC N°04' : 'NEC', el = r.elegido, T = r.T;
    function add(sev, txt, ref, sug, acc) { var ir = /^(Tabla|Cap\. 9 Tabla|Cabida)/.test(ref || '') && !/nota/.test(ref) ? '#kTam' : /^7\.16\.1\.(13|7)$|^7\.9\.7\.8$/.test(ref || '') ? (/curva/.test(sug || '') && !/Escribe/.test(sug) && !(parseFloat(dc.largo) > 20) ? '#kForm [data-k=curvas]' : '#kForm [data-k=largo]') : /nota/.test(ref || '') ? '#kForm [data-k=cond]' : /^7\.9\.7\.1$|Criterio/.test(ref || '') ? '#kForm [data-k=min]' : '#kCables';
      o.push({ sev: sev, txt: txt, ref: ref || '', sug: sug || '', acc: acc || '', ir: ir }); }   // «ir»: dónde se corrige
    if (!r.n) { add('warn', 'El ducto no tiene cables.', '', 'Agrega los cables a mano o tráelos del listado de circuitos.'); return o; }
    var i = s ? T.s.indexOf(s) : -1, f = i >= 0 ? r.filas[i] : null, occ = f ? f.occ : 0, sigue = el ? 'Usa Ø ' + el.s[0] + ' (ocupación ' + n1(el.occ, 1) + ' %).' : 'Ningún tamaño de ' + T.c + ' alcanza: divide los cables en dos ductos o usa bandeja o escalerilla.';
    var req = r.suma * (1 + r.res / 100) / (r.lim / 100);
    // 1) Ocupación
    if (f && f.Ai >= req - 1e-9) add('ok', 'Ocupación ' + n1(occ, 1) + ' % en Ø ' + s[0] + ', dentro del ' + r.lim + ' % permitido' + (r.res ? ' (con ' + r.res + ' % de reserva)' : '') + '.', ric ? (r.lim === 25 ? 'Tabla N°4.29' : 'Tabla N°4.21 · 7.16.1.14') : 'Cap. 9 Tabla 1');
    else add('err', 'Ocupación ' + n1(occ, 1) + ' % en Ø ' + (s ? s[0] : '—') + ': supera el ' + r.lim + ' % permitido' + (r.res ? ' considerando ' + r.res + ' % de reserva' : '') + '.', ric ? (r.lim === 25 ? 'Tabla N°4.29' : 'Tabla N°4.21 · 7.16.1.14') : 'Cap. 9 Tabla 1', sigue, el && el.s !== s ? 'tam' : '');
    // 2) Los cables caben
    if (f && (s[2] <= r.dmax * 1.05 || f.noCabe)) add('err', 'Los cables no caben en Ø ' + s[0] + ' (Ø interior ' + n1(s[2], 1) + ' mm; el cable mayor mide ' + n1(r.dmax, 1) + ' mm).', 'Cabida física', sigue, el && el.s !== s ? 'tam' : '');
    else if (f) add('ok', 'Los cables caben: el cable mayor mide ' + n1(r.dmax, 1) + ' mm y el Ø interior es ' + n1(s[2], 1) + ' mm.', 'Cabida física');
    // 3) Diámetro mínimo
    if (f && i < r.minI) add('err', 'Ø ' + s[0] + ' es menor que el mínimo ' + (dc.cond === 'subt' && ric && T.s[r.minI][0] !== dc.min ? 'para ducto subterráneo (25 mm)' : 'definido para el proyecto (' + dc.min + ')') + '.', dc.cond === 'subt' && ric ? '7.9.7.1' : 'Criterio del proyecto', sigue, el && el.s !== s ? 'tam' : '');
    else if (f) add('ok', 'Cumple el diámetro mínimo' + (dc.cond === 'subt' && ric ? ' de ducto subterráneo (25 mm).' : ' (' + dc.min + ').'), dc.cond === 'subt' && ric ? '7.9.7.1' : 'Criterio del proyecto');
    // 4) Largo del tramo y curvas
    var L = parseFloat(String(dc.largo).replace(',', '.')), cv = parseFloat(String(dc.curvas).replace(',', '.'));
    if (dc.cond === 'normal') {
      if (!(L > 0)) add('warn', 'Falta el largo del tramo: no se puede verificar el límite de 20 m ni la distancia entre registros.', '7.16.1.13', 'Escribe el largo y la cantidad de curvas del tramo.');
      else if (L > 20 || cv > 2) { var cajas = Math.max(L > 20 ? Math.ceil(L / 20) - 1 : 0, cv > 2 ? Math.ceil(cv / 2) - 1 : 0);
        add('err', 'Tramo de ' + n1(L, 1) + ' m' + (cv > 0 ? ' con ' + cv + ' curva(s)' : '') + ': los porcentajes valen para tramos de hasta 20 m con no más de dos curvas (desviación total ≤ 180°).', '7.16.1.13', 'Intercala ' + cajas + ' caja' + (cajas === 1 ? '' : 's') + ' de paso para que cada tramo quede en ≤ 20 m y ≤ 2 curvas.'); }
      else if (L > 15 && !(cv > 0)) add('warn', 'Tramo recto de ' + n1(L, 1) + ' m: los registros no pueden quedar a más de 15 m entre sí.', '7.16.1.7', 'Agrega una caja de paso o registro intermedio.');
      else add('ok', 'Tramo de ' + n1(L, 1) + ' m' + (cv > 0 ? ' con ' + cv + ' curva(s)' : ' sin curvas') + ', dentro de 20 m y dos curvas.', '7.16.1.13');
    } else if (dc.cond === 'subt') {
      if (!(L > 0)) add('warn', 'Falta el largo entre cámaras.', '7.9.7.8', 'Escribe el largo del tramo subterráneo.');
      else if (L > 120) add('err', 'Tramo subterráneo de ' + n1(L, 0) + ' m: supera la distancia máxima entre cámaras.', '7.9.7.8', 'Intercala ' + (Math.ceil(L / 90) - 1) + ' cámara(s): 90 m como máximo (120 m solo en tramos rectos con ductos de 50 mm o más).');
      else if (L > 90) add(s && s[2] >= 50 ? 'warn' : 'err', 'Tramo subterráneo de ' + n1(L, 0) + ' m: sobre 90 m solo se acepta en tramos rectos con ductos de 50 mm o más (hasta 120 m).', '7.9.7.8', s && s[2] >= 50 ? 'Confirma que el tramo es recto.' : 'Intercala una cámara o usa ducto de 50 mm o más en tramo recto.');
      else add('ok', 'Tramo subterráneo de ' + n1(L, 0) + ' m, dentro de 90 m entre cámaras.', '7.9.7.8');
    } else if (dc.cond === 'niple') {
      if (L > 1) add('err', 'El ducto está definido como unión entre gabinetes (hasta 1 m) y mide ' + n1(L, 1) + ' m: no puede usar el ' + r.lim + ' %.', 'Tabla N°4.21, nota', 'Cambia la condición a «Tramo normal».');
      else add('ok', 'Tubería de unión entre gabinetes de hasta 1 m.', 'Tabla N°4.21, nota');
    }
    // 5) Separación de servicios y circuitos
    if (r.cls.senal && (r.cls.fuerza || r.cls.control)) add('err', 'El ducto mezcla cables de señal con ' + (r.cls.fuerza ? 'fuerza' : 'control') + '.', '7.1.7', 'Lleva los cables de señal por un ducto aparte.', 'separar');
    else add('ok', 'No mezcla cables de señal con fuerza o control.', '7.1.7');
    if (r.nFuerza > 1 && dc.cond !== 'niple') add('warn', 'Hay ' + r.nFuerza + ' cables de fuerza: en una misma tubería solo van conductores de un mismo circuito.', '5.27', 'Si son circuitos distintos, sepáralos en ductos propios o usa bandeja o escalerilla.');
    // 6) Atascamiento (referencial)
    if (f && r.n === 3 && r.lista.every(function (x) { return x.d === r.lista[0].d; })) { var rz = s[2] / r.lista[0].d; if (rz >= 2.8 && rz <= 3.2) add('warn', 'Relación Ø interior / Ø cable = ' + n1(rz, 2) + ': con tres cables iguales entre 2,8 y 3,2 hay riesgo de atascamiento al tirar.', 'NEC Cap. 9 (referencial)', 'Considera el tamaño siguiente.'); }
    // 6a) Estándar de diseño del proyecto
    var pf = EST[est().perfil]; if (pf && pf.pref && el) { var tm = el.s[0], ord = T.s.map(function (x) { return x[0]; });
      if (pf.pref.indexOf(tm) < 0) { var sg = pf.pref.filter(function (x) { return ord.indexOf(x) > ord.indexOf(tm); })[0]; o.push({ sev: 'warn', txt: 'El tamaño ' + tm + ' no está entre los diámetros preferidos del estándar «' + pf.n + '».', ref: 'Estándar de diseño', sug: sg ? 'Usa ' + sg + ' como tamaño mínimo.' : 'Revisa el tamaño con el estándar.', acc: '', ir: '#kForm [data-k=min]' }); }
      else add('ok', 'El tamaño ' + tm + ' es un diámetro preferido del estándar «' + pf.n + '».', 'Estándar de diseño');
      if (dc.cond === 'subt' && pf.minSubt && ord.indexOf(tm) < ord.indexOf(pf.minSubt)) o.push({ sev: 'err', txt: 'Ducto enterrado de ' + tm + ': el estándar pide ' + pf.minSubt + ' como mínimo.', ref: 'Estándar de diseño', sug: 'Sube el tamaño mínimo a ' + pf.minSubt + '.', acc: '', ir: '#kForm [data-k=min]' });
      if (pf.tubos && pf.tubos.indexOf(dc.tubo) < 0) o.push({ sev: 'warn', txt: 'La tubería ' + T.c + ' no es de las que usa el estándar «' + pf.n + '».', ref: 'Estándar de diseño', sug: 'Usa ' + pf.tubos.slice(0, 3).map(function (k) { return TUBOS[k].c; }).join(', ') + '.', acc: '', ir: '#kForm [data-k=tubo]' }); }
    // 6b) Tipo de tubería según el ambiente de instalación
    var am = ambiente(dc); if (am) { if (am.ok) add('ok', 'La tubería ' + T.c + ' es adecuada para el ambiente «' + am.a.n + '».', am.a.ref); else o.push({ sev: am.evitar ? 'err' : 'warn', txt: 'La tubería ' + T.c + (am.evitar ? ' no conviene' : ' no es la recomendada') + ' para el ambiente «' + am.a.n + '».', ref: am.a.ref, sug: 'Cambia el tipo de tubería a ' + am.a.rec.map(function (k) { return TUBOS[k].c; }).join(', o ') + '.', acc: '', ir: '#kForm [data-k=tubo]' }); }
    // 7) Radio de curvatura recomendado para las curvas del tramo
    if (f && ric && dc.cond !== 'niple') { var cu = curvatura(dc, r, s); if (cu.r) add(cv > 0 ? 'ok' : 'ok', 'Curvas con radio no menor a ' + cm(cu.r) + ': manda ' + (cu.manda === 'cable' ? 'el cable ' + cu.cable.tag + ' (' + cu.cable.clase + ', ' + cu.cable.como + ')' : 'la tubería') + '.', cu.manda === 'cable' ? '6.2.8' : (dc.cond === 'subt' ? '7.9.7.8' : 'Tabla N°4.22')); }
    o.norma = nor; return o;
  }
  function estadoRic(dc) { var r = calcular(dc), s = r.elegido ? r.elegido.s : r.T.s[Math.min(r.T.s.length - 1, 3)], c = verificar(dc, r, s); return { mal: c.filter(function (x) { return x.sev === 'err'; }).length, av: c.filter(function (x) { return x.sev === 'warn'; }).length, n: r.n }; }
  // Sugerencia aplicada: los cables de señal pasan a un ducto nuevo con las mismas condiciones
  var CLASE_SENAL = { fos: 1, fod: 1, foa: 1, fou: 1, folt: 1, folta: 1, par: 1, mpar: 1, mtri: 1, pvicp: 1, pvict: 1, gfip: 1, gfit: 1 };
  function separarSenal() { var b = datos(), dc = actual(), sen = dc.cables.filter(function (c) { var k = CATI[c.cat]; return k && CLASE_SENAL[k.f]; }); if (!sen.length || sen.length === dc.cables.length) return;
    var d = nuevo(b.ductos.length + 1); d.tag = dc.tag + '-S'; d.ruta = dc.ruta; d.amb = dc.amb; d.tubo = dc.tubo; d.crit = dc.crit; d.cond = dc.cond; d.min = dc.min; d.reserva = dc.reserva; d.largo = dc.largo; d.curvas = dc.curvas; d.cables = sen;
    dc.cables = dc.cables.filter(function (c) { return sen.indexOf(c) < 0; }); b.ductos.splice(b.ductos.indexOf(dc) + 1, 0, d); }
  // Lleva al lugar donde se corrige: abre su pestaña si está en otra, lo deja a la vista, con el foco y destacado
  function irA(sel) {
    var el = $(sel); if (!el) return;
    function listo() { el.scrollIntoView({ block: 'center', inline: 'nearest' }); var f = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName) ? el : null; if (f) { try { f.focus({ preventScroll: true }); if (f.select && f.tagName === 'INPUT') f.select(); } catch (e) {} }
      var m = f ? (f.closest('label') || f) : el; m.classList.add('kric-dest'); setTimeout(function () { m.classList.remove('kric-dest'); }, 3500); }
    if (el.offsetParent !== null) return listo();
    var g0 = el.closest('.dk-grupo'); if (!g0) return listo();
    var ids = [].map.call(g0.querySelectorAll('.dk-tab:not(.on)'), function (t) { return t.dataset.id; }), i = 0;   // el grupo se redibuja en cada cambio de pestaña: se vuelve a buscar cada vez
    (function sig() { if (el.offsetParent !== null || i >= ids.length) return listo(); var g = el.closest('.dk-grupo'), b = g && g.querySelector('.dk-tab[data-id="' + ids[i++] + '"]'); if (b) b.click(); setTimeout(sig, 70); })();
  }
  // Alerta flotante y descartable: aparece cuando el ducto no cumple; cada incumplimiento trae su sugerencia y el botón que lleva a corregirlo.
  // Si se descarta, no vuelve a salir mientras los incumplimientos de ese ducto sean los mismos.
  var flDesc = {}, flCaja = null;
  function flotante(dc, mal, norma) {
    if (!flCaja) { flCaja = document.createElement('div'); flCaja.id = 'kRicFl'; flCaja.className = 'kric-fl'; flCaja.setAttribute('role', 'alert'); flCaja.hidden = true; document.body.appendChild(flCaja);
      var st = document.createElement('style'); st.textContent = '.kric-fl{position:fixed;z-index:75;top:64px;right:16px;width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 150px);overflow:auto;background:#1b1418;color:#EAF2F8;border:1.5px solid #F85149;border-radius:10px;padding:10px 12px 12px;box-shadow:0 14px 34px rgba(0,0,0,.6);font:12.5px/1.45 system-ui,"Segoe UI",sans-serif;color-scheme:dark}' +
        '.kric-fl[hidden]{display:none}.kric-fl header{display:flex;gap:8px;align-items:flex-start;margin-bottom:6px}.kric-fl header b{flex:1;color:#ff8a82;font-size:13.5px}.kric-fl header small{display:block;color:#94A9BE;font-weight:400;font-size:11.5px}' +
        '.kric-fl ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}.kric-fl li{border-top:1px solid #4a2a2c;padding-top:8px}.kric-fl li p{margin:0 0 3px}.kric-fl li em{display:block;font-style:normal;color:#c9d6e2;margin-bottom:5px}.kric-fl li em::before{content:"Sugerencia: ";font-weight:600;color:#FFB070}' +
        '.kric-fl button{font:600 11.5px system-ui,sans-serif!important;border-radius:6px!important;padding:4px 10px!important;min-height:24px!important;cursor:pointer;margin-right:5px;color:#EAF2F8!important;background:#18283C!important;border:1px solid #2C4563!important}' +
        '.kric-fl button.pri{background:#FF8C32!important;border-color:#FF8C32!important;color:#1b0d02!important}.kric-fl button:focus-visible{outline:2px solid #38C8E8;outline-offset:1px}.kric-fl header button{margin:0;padding:0 8px!important}' +
        '.kric-dest{outline:3px solid #FF8C32!important;outline-offset:2px!important;box-shadow:0 0 0 7px rgba(255,140,50,.22)!important;border-radius:6px}@media print{.kric-fl{display:none!important}}';
      document.head.appendChild(st);
      flCaja.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return;
        if (b.dataset.x) { flDesc[flCaja.dataset.d] = flCaja.dataset.k; flCaja.hidden = true; }
        else if (b.dataset.ir) irA(b.dataset.ir);
        else if (b.dataset.ric === 'tam') { verTam = null; pintar(); } else if (b.dataset.ric === 'separar') { separarSenal(); verTam = null; cambio(); } });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && flCaja && !flCaja.hidden) { flDesc[flCaja.dataset.d] = flCaja.dataset.k; flCaja.hidden = true; } });
      setInterval(function () { if (!flCaja || flCaja.hidden) return; var f = $('#kForm'), sec = f && f.closest('section[id]'); if (!f || (sec && sec.hidden)) flCaja.hidden = true; }, 600);   // al salir de canalizaciones, la alerta se retira
    }
    var k = mal.map(function (x) { return x.txt; }).join('|'), f = $('#kForm'), sec = f && f.closest('section[id]');
    if (!mal.length || (sec && sec.hidden)) { flCaja.hidden = true; if (!mal.length) delete flDesc[dc.id]; return; }
    if (flDesc[dc.id] === k) { flCaja.hidden = true; return; }
    flCaja.dataset.d = dc.id; flCaja.dataset.k = k;
    flCaja.innerHTML = '<header><b>✗ ' + esc(dc.tag) + ' no cumple ' + esc(norma) + '<small>' + mal.length + ' punto' + (mal.length === 1 ? '' : 's') + ' por corregir</small></b><button type="button" data-x="1" aria-label="Descartar la alerta">✕</button></header><ol>' +
      mal.map(function (x) { return '<li><p>' + esc(x.txt) + '</p>' + (x.sug ? '<em>' + esc(x.sug) + '</em>' : '') + '<button type="button" class="pri" data-ir="' + esc(x.ir) + '">Ir a corregir</button>' + (x.acc === 'tam' ? '<button type="button" data-ric="tam">Usar el tamaño recomendado</button>' : x.acc === 'separar' ? '<button type="button" data-ric="separar">Separar la señal en otro ducto</button>' : '') + '</li>'; }).join('') + '</ol>';
    flCaja.hidden = false;
  }
  function pintarRic(dc, r, s) {
    var av = $('#kAvisos'); if (!av) return; var caja = $('#kRic');
    if (!caja) { caja = document.createElement('div'); caja.id = 'kRic'; caja.className = 'kric'; av.parentNode.insertBefore(caja, av);
      var st = document.createElement('style'); st.textContent = '.kric{grid-column:1/-1;margin:8px 0 0}.kric-al{border:1.5px solid #F85149;background:rgba(248,81,73,.1);border-radius:8px;padding:9px 12px;margin-bottom:8px;font-size:12.5px;line-height:1.45}.kric-al b{color:#ff8a82}.kric-al ul{margin:5px 0 0;padding-left:18px}.kric-al li{margin-bottom:5px}.kric-al em{display:block;font-style:normal;color:var(--muted,#94A9BE)}.kric-al em::before{content:"Sugerencia: ";font-weight:600;color:#FFB070}' +
        '.kric button{font:600 11.5px system-ui,sans-serif;color:#1b0d02;background:#FF8C32;border:1px solid #FF8C32;border-radius:6px;padding:3px 9px;margin-top:4px;cursor:pointer}.kric button:focus-visible{outline:2px solid #38C8E8;outline-offset:1px}' +
        '.kric details{border:1.5px solid var(--line,#22364D);border-radius:8px}.kric summary{cursor:pointer;padding:7px 12px;font-weight:600;font-size:13px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.kric summary span{font-size:12px}' +
        '.kric details ul{list-style:none;margin:0;padding:4px 12px 10px;display:grid;gap:4px;font-size:12px}.kric details li{display:grid;grid-template-columns:16px 1fr auto;gap:8px;align-items:baseline}.kric details li small{color:var(--muted,#94A9BE);font-size:11px;white-space:nowrap}.kric details li em{grid-column:2/-1;font-style:normal;color:var(--muted,#94A9BE);font-size:11.5px}.kric details li em::before{content:"Sugerencia: ";font-weight:600;color:#FFB070}' +
        '.kric .bien{color:#3FB950}.kric .av{color:#E6A23C}.kric .mal{color:#F85149}.kric li span{color:var(--fg,#EAF2F8)}.kok{color:#3FB950;font-weight:700}.kav{color:#E6A23C;font-weight:700}';
      document.head.appendChild(st);
      caja.addEventListener('click', function (ev) { var b = ev.target.closest('button[data-ric]'); if (!b) return; if (b.dataset.ric === 'tam') { verTam = null; pintar(); } else if (b.dataset.ric === 'separar') { separarSenal(); verTam = null; cambio(); } });
    }
    var cF = verificar(dc, r, s); flotante(dc, cF.filter(function (x) { return x.sev === 'err'; }), cF.norma || 'RIC N°04');
    var c = cF, mal = c.filter(function (x) { return x.sev === 'err'; }), nav = c.filter(function (x) { return x.sev === 'warn'; }).length, ant = caja.querySelector('details'), abierto = ant ? ant.open : false;
    var boton = function (x) { return x.acc === 'tam' ? '<button type="button" data-ric="tam">Usar el tamaño recomendado</button>' : x.acc === 'separar' ? '<button type="button" data-ric="separar">Separar los cables de señal en otro ducto</button>' : ''; };
    caja.innerHTML =
      '<details' + (abierto ? ' open' : '') + '><summary>Verificación ' + esc(c.norma || 'RIC N°04') + ' <span class="' + (mal.length ? 'mal' : nav ? 'av' : 'bien') + '">' + (mal.length ? mal.length + ' incumplimiento' + (mal.length === 1 ? '' : 's') : 'cumple ✓') + (nav ? ' · ' + nav + ' advertencia' + (nav === 1 ? '' : 's') : '') + '</span></summary><ul>' +
      c.map(function (x) { return '<li class="' + (x.sev === 'ok' ? 'bien' : x.sev === 'warn' ? 'av' : 'mal') + '"><b>' + (x.sev === 'ok' ? '✓' : x.sev === 'warn' ? '!' : '✗') + '</b><span>' + esc(x.txt) + '</span><small>' + esc(x.ref) + '</small>' + (x.sug && x.sev !== 'ok' ? '<em>' + esc(x.sug) + '</em>' : '') + '</li>'; }).join('') + '</ul></details>';
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
    if (k.nc === 1) return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (d * 0.3) + '" fill="' + (k.fo ? '#6cc5ee' : '#d18b47') + '" stroke="' + (k.fo ? '#2a6f93' : '#7a4a1c') + '" stroke-width="' + (d * 0.02) + '"/>';
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
    return ORDEN_FAM.map(function (f) { return '<optgroup label="' + esc(SERV[servDe(f)].n.toUpperCase() + ' · ' + FAM[f]) + '">' + CAT.filter(function (c) { return c.f === f; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === v ? ' selected' : '') + '>' + esc((c.cod !== '—' ? c.cod + ' · ' : '') + c.desc + (c.f !== 'otro' ? ' · Ø ' + n1(c.d, 1) + ' mm' : '')) + '</option>'; }).join('') + '</optgroup>'; }).join('');
  }
  function pintar() {
    var b = datos(), dc = actual(), r = calcular(dc);
    // tabla de ductos
    $('#kDuctos tbody').innerHTML = b.ductos.map(function (d) {
      var q = calcular(d);
      var eR = estadoRic(d), mR = !eR.n ? '' : eR.mal ? ' <span class="kmal" title="' + eR.mal + ' incumplimiento(s): abre el ducto para ver cómo corregir">✗</span>' : eR.av ? ' <span class="kav" title="Cumple, con ' + eR.av + ' advertencia(s)">!</span>' : ' <span class="kok" title="Cumple">✓</span>';
      return '<tr data-d="' + d.id + '"' + (d.id === b.sel ? ' class="sel"' : '') + '><td><b>' + esc(d.tag) + '</b>' + mR + '</td><td>' + esc(d.ruta || '—') + '</td><td>' + esc(q.T.c) + '</td><td class="num">' + q.n + '</td><td class="num">' + n1(q.suma, 0) + '</td><td class="num">' + q.lim + ' %</td><td>' + (q.elegido ? '<b>' + esc(q.elegido.s[0]) + '</b> · ' + n1(q.elegido.occ, 1) + ' %' : (q.n ? '<span class="kmal">no alcanza</span>' : '—')) + '</td></tr>';
    }).join('');
    // formulario
    var f = $('#kForm');
    f.querySelector('[data-k=tag]').value = dc.tag; f.querySelector('[data-k=ruta]').value = dc.ruta || '';
    f.querySelector('[data-k=tubo]').innerHTML = opciones(ORDEN_TUBOS.map(function (k) { return [k, TUBOS[k].n]; }), dc.tubo);
    f.querySelector('[data-k=crit]').innerHTML = opciones(Object.keys(CRIT).map(function (k) { return [k, CRIT[k].n]; }), dc.crit);
    f.querySelector('[data-k=cond]').innerHTML = opciones(COND, dc.cond);
    f.querySelector('[data-k=min]').innerHTML = opciones(r.T.s.map(function (s) { return [s[0], s[0]]; }), dc.min);
    ['reserva', 'largo', 'curvas', 'serv', 'plano', 'obs', 'rev', 'zona', 'eq', 'desde', 'hasta', 'sl'].forEach(function (k) { var q = f.querySelector('[data-k=' + k + ']'); if (q && document.activeElement !== q) q.value = dc[k] == null ? '' : dc[k]; });
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
    var amP = ambiente(dc); if (amP) pasos.push(['Ambiente', '«' + esc(amP.a.n) + '»: ' + esc(amP.a.txt) + ' Tubería recomendada: <b>' + amP.a.rec.map(function (k) { return esc(TUBOS[k].c); }).join(', ') + '</b> (' + esc(amP.a.ref) + ').' + (amP.ok ? '' : ' <b>La tubería elegida no está entre las recomendadas.</b>')]);
    var cuP = s && r.n ? curvatura(dc, r, s) : null;
    if (cuP && cuP.r) pasos.push(['Radio de curvatura', 'Tubería: ' + esc(cuP.refDucto) + '. Cables (RIC N°04 6.2.8): ' + cuP.cables.slice(0, 4).map(function (c) { return esc(c.tag) + ' ' + c.como + ' = ' + cm(c.r); }).join('; ') + (cuP.cables.length > 4 ? '…' : '') + '. Las curvas se hacen con radio no menor a <b>' + cm(cuP.r) + '</b> (manda ' + (cuP.manda === 'cable' ? 'el cable' : 'la tubería') + ').']);
    var soP = s && r.n ? soportacion(dc, r, s) : null;
    if (soP && (soP.sep || soP.caja)) pasos.push(['Soportes y cajas', (soP.sep ? esc(soP.refSep) + (soP.nSop ? ': <b>' + soP.nSop + ' abrazaderas ' + esc(soP.abz.tipo) + ' ' + esc(soP.abz.med) + '</b> sobre riel' : ' (indica el largo para contar abrazaderas)') + '. ' : esc(soP.notaSop || '') + ' ') + (soP.caja ? (soP.cajas ? '<b>' + soP.cajas + ' × ' + esc(soP.caja.n) + '</b>' : 'Si se intercala una caja de paso: ' + esc(soP.caja.n)) + ' (' + esc(soP.caja.ref) + ').' : '') + ' Medidas de referencia: ' + MJM + '.']);
    $('#kPasos').innerHTML = pasos.map(function (p, i) { return '<li><b>' + (i + 1) + '. ' + p[0] + '.</b> ' + p[1] + '</li>'; }).join('');
    $('#kAvisos').innerHTML = ''; $('#kAvisos').hidden = true;   // los avisos sueltos pasan a la verificación, con su sugerencia
    pintarRic(dc, r, s);
    // indicador de ocupación
    var occ = s ? r.suma / area(s[2]) * 100 : 0;
    $('#kMedidor').innerHTML = '<div class="kbar"><span style="width:' + Math.min(100, occ) + '%;background:' + (occ <= r.lim ? '#2e7d32' : '#c62828') + '"></span><i style="left:' + r.lim + '%" title="Límite ' + r.lim + ' %"></i></div><div class="peq">Ocupación en Ø ' + esc(s ? s[0] : '') + ': <b>' + n1(occ, 1) + ' %</b> · límite ' + r.lim + ' % · libre ' + n1(Math.max(0, 100 - occ), 1) + ' %</div>';
    $('#kDibujo').innerHTML = s ? svgCorte(r, s, 420, 'kHatch') : '';
    ultimo = { r: r, s: s }; var b3 = $('#k3dBtn'); if (b3) b3.disabled = !s || !r.lista.length;
    $('#kLeyenda').innerHTML = r.lista.map(function (x, i) { var sv = SERV[servDe(x.k.f)]; return '<li><span class="kdot" style="background:' + COLF[x.k.f] + '"></span><b>' + (i + 1) + '</b> <span class="kserv" style="background:' + sv.c + '" title="' + sv.n + '">' + sv.n.slice(0, 4).toUpperCase() + '</span>' + esc(x.c.tag || '(sin tag)') + ' · ' + esc((x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc) + ' · Ø ' + n1(x.d, 1) + ' mm</li>'; }).join('');
    // tabla de tamaños (como el formato original: "Utilizar >>")
    $('#kTam tbody').innerHTML = r.filas.map(function (q) {
      var es = el && q.i === el.i;
      return '<tr data-t="' + q.i + '" class="' + (es ? 'usar' : '') + (s === q.s ? ' visto' : '') + '"><td>' + (es ? '<b>Utilizar ▶</b>' : '') + '</td><td><b>' + esc(q.s[0]) + '</b></td><td class="num">' + n1(q.s[1], 1) + '</td><td class="num">' + n1(q.s[2], 2) + '</td><td class="num">' + n1(q.Ai, 0) + '</td><td class="num">' + n1(q.util, 0) + '</td><td class="num">' + (r.n ? n1(q.occ, 1) + ' %' : '—') + '</td><td>' + (!r.n ? '' : q.cumple ? '✔ cumple' : q.noCabe ? '<span class="kmal">no caben</span>' : q.i < Math.max(0, r.T.s.map(function (z) { return z[0]; }).indexOf(dc.min)) && q.Ai >= r.req ? 'bajo el mínimo' : '<span class="kmal">✖ excede</span>') + '</td></tr>';
    }).join('');
    $('#kFuente').textContent = 'Dimensiones: ' + r.T.f + '. Verifique con el catálogo del fabricante.';
  }

  function cambio() { A.guardar(); pintar(); var cd = $('#kCatDest'); if (cd) cd.innerHTML = destino(); }
  function leerForm(ev) {
    var t = ev.target, k = t.dataset.k, dc = actual(); if (!k) return;
    dc[k] = k === 'tag' ? t.value.toUpperCase() : t.value;
    if (k === 'tubo') { var T = TUBOS[dc.tubo]; if (T.s.map(function (s) { return s[0]; }).indexOf(dc.min) < 0) dc.min = T.s[0][0]; }
    verTam = null; A.guardar();
    if (ev.type === 'change' || !/^(tag|ruta|serv|plano|obs|rev|zona|eq|desde|hasta)$/.test(k)) pintar(); else { clearTimeout(leerForm.t); leerForm.t = setTimeout(pintar, 250); }
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

  // ── Listado de canalizaciones (entregable): una fila por ducto con la estructura habitual de los listados de proyecto ──
  //    TAG · CARACTERÍSTICAS · DIMENSIONES · SERVICIO [V] · LARGO [m] · PLANO DISP. / CAN. · OBSERVACIONES · REV.
  var LCOL = ['TAG', 'CARACTERÍSTICAS', 'DIMENSIONES', 'SERVICIO [V]', 'LARGO [m]', 'DESDE', 'HASTA', 'CIRCUITOS', 'PLANO DISP. / CAN.', 'OBSERVACIONES', 'REV.'];
  function circuitosDe(dc) { var v = []; (dc.cables || []).forEach(function (c) { var t = up(c.tag || '').trim(); if (t && v.indexOf(t) < 0) v.push(t); }); return v; }
  // Valores sugeridos para el listado (se puede escribir cualquier otro) y notas recomendadas para el pie del anexo
  var SUG_SERV = ['24 VDC', '4-20 mA', '120', '220', '380', '400', '480', '4160', 'Instrumentación', 'Control', 'Comunicaciones', 'Fibra óptica', 'Reserva'];
  var SUG_REV = ['A', 'B', 'C', 'D', 'P', '0', '1', '2', '3'];
  var SUG_OBS = ['Proyectado', 'Existente', 'Existente (Nota 1)', 'Reserva', 'A la vista', 'Enterrado', 'Embebido en hormigón', 'Tramo vertical', 'Sector ', 'Área ', 'Sala eléctrica', 'Sala de control', 'Lleva caja de paso', 'Ver plano de disposición'];
  var SUG_NOTAS = ['Canalización existente por la que se tienden los cables de este proyecto.',
    'Los largos son referenciales; el contratista los verificará en terreno antes de fabricar o comprar.',
    'El tamaño de los ductos se determinó según RIC N°04 de la SEC, Tabla N°4.21 (ocupación máxima de 50 % con un conductor y 33 % con dos o más).',
    'Los tramos de más de 20 m o con más de dos curvas llevan cajas de paso intermedias (RIC N°04 7.16.1.13).',
    'Las curvas respetan el radio mínimo de la tubería y de los cables (RIC N°04 Tabla N°4.22 y 6.2.8).',
    'La tubería metálica a la vista se soporta a no más de 1,50 m, con abrazaderas sobre riel (RIC N°04 7.16.4.4).',
    'Los cables de señal y los de fuerza van en canalizaciones separadas (RIC N°04 7.1.7).',
    'Las canalizaciones metálicas quedan conectadas al sistema de puesta a tierra.',
    'Los ductos se sellan en su ingreso a salas, gabinetes y cajas.',
    'En ambientes corrosivos o enterrados, la tubería metálica lleva protección contra la corrosión (RIC N°04 5.41).',
    'El tipo de tubería y sus accesorios cumplen la especificación técnica del proyecto.',
    'El recorrido definitivo se ajusta en terreno según interferencias, sin superar las curvas indicadas.'];
  function notaTiene(t) { return String(lstDatos().notas || '').indexOf(t) >= 0; }
  function notaAlternar(t) { var l = lstDatos(), ls = String(l.notas || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (notaTiene(t)) ls = ls.filter(function (x) { return x.indexOf(t) < 0; }); else ls.push('Nota X: ' + t);
    var n = 0; l.notas = ls.map(function (x) { return /^Nota\s+\S+:/i.test(x) ? x.replace(/^Nota\s+\S+:/i, 'Nota ' + (++n) + ':') : x; }).join('\n'); }
  function lstDatos() { var b = datos(); b.lst = b.lst || { num: '', proy: '', notas: '' }; return b.lst; }
  function lstFilas() {
    return datos().ductos.map(function (dc) { var r = calcular(dc), T = r.T;
      return [dc.tag || '', T.n.replace(/ \(formato original\)/, '') + (dc.cond === 'subt' ? ' · subterráneo' : ''), r.elegido ? r.elegido.s[0] : (r.n ? 'NO ALCANZA' : dc.min || '—'), dc.serv || '', dc.largo === '' || dc.largo == null ? '' : String(dc.largo).replace('.', ','), up(dc.desde || ''), up(dc.hasta || ''), circuitosDe(dc).join(', '), up(dc.plano || ''), dc.obs || dc.ruta || '', up(dc.rev || docVig('listado'))]; });
  }
  function lstNotas() { return String(lstDatos().notas || '').split(/\n+/).map(function (t) { return t.trim(); }).filter(Boolean); }
  function lstHtml() {
    var l = lstDatos(), f = lstFilas();
    return '<div class="klst-hoja"><div class="klst-tit"><b>LISTADO DE CANALIZACIONES</b>' + (l.num ? '<span>' + esc(up(l.num)) + '</span>' : '') + (l.proy ? '<small>' + esc(l.proy) + '</small>' : '') + '</div>' +
      '<table class="klst-t"><thead><tr>' + LCOL.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (f.map(function (x) { return '<tr>' + x.map(function (v, i) { return '<td' + (i === 9 || i === 7 ? ' class="izq"' : '') + '>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') || '<tr><td colspan="11">Sin ductos.</td></tr>') + '</tbody></table>' +
      lstNotas().map(function (t) { return '<p class="klst-n">' + esc(t) + '</p>'; }).join('') + '</div>';
  }
  function lstExcel() {
    var X = window.XLSX_RE, lb = X.libro(), l = lstDatos(), AZ = '022A55', h = lb.hoja('LISTADO', { orientacion: 'landscape' }), f = lstFilas();
    h.cols([18, 36, 12, 12, 9, 18, 18, 28, 24, 30, 7]);
    h.combinar(0, 0, 0, 10, 'LISTADO DE CANALIZACIONES' + (l.num ? '\n' + up(l.num) : ''), { b: true, sz: 12, h: 'center', v: 'center', wrap: true }); h.alto(0, 36);
    var f0 = 1; if (l.proy) { h.combinar(1, 0, 1, 10, l.proy, { sz: 10, h: 'center' }); f0 = 2; }
    LCOL.forEach(function (t, i) { h.celda(f0, i, t.replace(' [', '\n['), { b: true, sz: 10, fill: AZ, color: 'FFFFFF', h: 'center', v: 'center', wrap: true }); }); h.alto(f0, 30); h.filasTitulo(0, f0);
    f.forEach(function (x, k) { x.forEach(function (v, i) { h.celda(f0 + 1 + k, i, v, { sz: 10, h: i === 9 || i === 7 ? 'left' : 'center', v: 'center', wrap: true }); }); h.alto(f0 + 1 + k, 22); });
    lstNotas().forEach(function (t, k) { h.combinar(f0 + 2 + f.length + k, 0, f0 + 2 + f.length + k, 10, t, { sz: 9, borde: 'none', wrap: true }); });
    var ru = rutas(); if (ru.length) { var g2 = lb.hoja('RUTAS', { orientacion: 'landscape' }); g2.cols([22, 34, 34, 90]); g2.combinar(0, 0, 0, 3, 'RUTAS DE CIRCUITOS' + (l.num ? '\n' + up(l.num) : ''), { b: true, sz: 12, h: 'center', v: 'center', wrap: true }); g2.alto(0, 36); ['CIRCUITO', 'CABLE', 'DUCTOS', 'RUTA'].forEach(function (t, i) { g2.celda(1, i, t, { b: true, sz: 10, fill: AZ, color: 'FFFFFF', h: 'center' }); }); ru.forEach(function (x, k) { [x.circ, x.cable, x.ductos.join(', '), x.ruta].forEach(function (v, i) { g2.celda(2 + k, i, v, { sz: 10, h: i ? 'left' : 'center', wrap: true }); }); }); }
    A.descargar((l.num ? up(l.num).replace(/[\\/:*?"<>|]+/g, '-') : 'Listado_de_canalizaciones') + '.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  // ── Documento a emitir: memoria de cortes de ductos o listado de canalizaciones con su anexo ──
  //    Cada uno lleva su propio cuadro de revisiones. La vista previa se rehace al actualizar la revisión y es lo que se registra al emitir.
  var DOCS = { memoria: 'Memoria de cortes de ductos', listado: 'Listado de canalizaciones y anexo' };
  function docs() { var b = datos(); b.docs = b.docs || {}; if (!DOCS[b.docs.sel]) b.docs.sel = 'memoria'; b.docs.memoria = b.docs.memoria || {}; b.docs.listado = b.docs.listado || {}; return b.docs; }
  function docRevs(id) { var d = docs()[id]; return d && d.revs ? d.revs : null; }
  function docFilas(id) { var c = window.LAZOS_COND && window.LAZOS_COND.comunes; return docRevs(id) || (c ? c() : []) || []; }
  function docVig(id) { var f = docFilas(id); return f.length ? String(f[f.length - 1].rev || '') : ''; }
  function docNum(id) { return id === 'listado' ? lstDatos().num || '' : docs().memoria.num || ''; }
  function docCab(id, tit) {
    var f = docFilas(id), u = f[f.length - 1] || {}, l = lstDatos();
    return '<div class="tit">' + tit + '</div><table class="datos"><tbody><tr><td>Documento N°</td><td>' + esc(up(docNum(id))) + '</td></tr>' + (l.proy ? '<tr><td>Proyecto</td><td>' + esc(l.proy) + '</td></tr>' : '') + '<tr><td>Revisión</td><td>' + esc(u.rev || '') + '</td></tr><tr><td>Fecha</td><td>' + esc(u.fecha || '') + '</td></tr></tbody></table>' +
      '<h3>Control de revisiones</h3><table class="kdoc-rev"><thead><tr><th>Rev.</th><th>Fecha</th><th>Descripción</th><th>Por</th><th>Revisó</th><th>Aprobó</th></tr></thead><tbody>' +
      (f.map(function (x) { return '<tr><td>' + esc(x.rev || '') + '</td><td>' + esc(x.fecha || '') + '</td><td class="izq">' + esc(x.desc || '') + '</td><td>' + esc(x.por || '') + '</td><td>' + esc(x.reviso || '') + '</td><td>' + esc(x.aprobo || '') + '</td></tr>'; }).join('') || '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>') + '</tbody></table>';
  }
  function docHtml(id) {
    var b = datos(), n = b.ductos.length, o = '<div class="kdoc">';
    if (id === 'listado') {
      var tot = 0, planos = []; b.ductos.forEach(function (d) { tot += parseFloat(String(d.largo).replace(',', '.')) || 0; var q = up(d.plano || '').trim(); if (q && planos.indexOf(q) < 0) planos.push(q); });
      o += '<div class="pg v kdoc-pg">' + docCab(id, 'LISTADO DE CANALIZACIONES') +
        '<h3>1. Objetivo</h3><p>Este documento entrega el listado de las canalizaciones del proyecto, con sus características, dimensiones, servicio, largo y plano donde se ubica cada una.</p>' +
        '<h3>2. Alcance</h3><p>El listado incluye ' + n + ' canalización' + (n === 1 ? '' : 'es') + (tot ? ', con un largo total de ' + n1(tot, 1) + ' m' : '') + '. Los largos son referenciales y deben confirmarse en terreno.</p>' +
        '<h3>3. Criterios</h3><p>El tamaño de cada ducto se determinó según el porcentaje de ocupación del Pliego Técnico Normativo RIC N°04 de la SEC (Tabla N°4.21), con los cables indicados en la memoria de cálculo de canalizaciones.</p>' +
        '<h3>4. Documentos de referencia</h3>' + (planos.length ? '<p>' + planos.map(esc).join('<br>') + '</p>' : '<p>Planos de disposición y canalización del proyecto.</p>') +
        '<h3>5. Anexos</h3><p>Anexo A: Listado de canalizaciones.' + (rutas().length ? '<br>Anexo B: Rutas de circuitos.' : '') + '</p></div>' +
        '<div class="pg h kdoc-pg"><p class="kdoc-an">ANEXO A</p>' + lstHtml() + '</div>' +
        (rutas().length ? '<div class="pg h kdoc-pg"><p class="kdoc-an">ANEXO B</p><div class="klst-hoja"><div class="klst-tit"><b>RUTAS DE CIRCUITOS</b>' + (lstDatos().num ? '<span>' + esc(up(lstDatos().num)) + '</span>' : '') + '</div><table class="klst-t"><thead><tr><th>CIRCUITO</th><th>CABLE</th><th>DUCTOS</th><th>RUTA</th></tr></thead><tbody>' + rutas().map(function (x) { return '<tr><td>' + esc(x.circ) + '</td><td class="izq">' + esc(x.cable) + '</td><td>' + esc(x.ductos.join(', ')) + '</td><td class="izq">' + esc(x.ruta) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' : '');
    } else {
      o += '<div class="pg v kdoc-pg">' + docCab(id, 'MEMORIA DE CÁLCULO DE CANALIZACIONES<br>CORTES DE DUCTOS') +
        '<h3>1. Objetivo</h3><p>Determinar el tamaño de cada ducto según los cables que lleva y mostrar su corte con los cables acomodados.</p>' +
        '<h3>2. Criterios</h3><p>Ocupación máxima según RIC N°04 de la SEC, Tabla N°4.21: 50 % con un conductor y 33 % con dos o más. Tramos de hasta 20 m con no más de dos curvas (7.16.1.13).</p>' +
        '<h3>3. Resumen</h3><table><thead><tr><th>Ducto</th><th>Tubería</th><th>N° cables</th><th>Ocupación</th><th>Límite</th><th>Tamaño</th></tr></thead><tbody>' +
        b.ductos.map(function (dc) { var r = calcular(dc); return '<tr><td>' + esc(dc.tag) + '</td><td class="izq">' + esc(r.T.c) + '</td><td>' + r.n + '</td><td>' + (r.elegido ? n1(r.elegido.occ, 1) + ' %' : '—') + '</td><td>' + r.lim + ' %</td><td>' + (r.elegido ? esc(r.elegido.s[0]) : r.n ? 'NO ALCANZA' : '—') + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3>4. Anexo</h3><p>Una lámina por ducto con su corte, tabla de cables y memoria.</p></div>' +
        (b.ductos.filter(function (d) { return d.cables.length; }).map(function (d) { return '<div class="hojaImp kdoc-lam">' + lamina(d) + '</div>'; }).join('') || '<div class="hojaImp kdoc-lam">' + lamina(actual()) + '</div>');
    }
    return o + '</div>';
  }
  function docCaja() {
    var box = $('#kDocBox'); if (box) return box; var sec = $('#v-cond'); if (!sec) return null;
    box = document.createElement('div'); box.id = 'kDocBox';
    box.innerHTML = '<div class="kdoc-barra"><span class="kdoc-seg" role="group" aria-label="Documento a emitir">' + Object.keys(DOCS).map(function (k) { return '<button type="button" data-doc="' + k + '">' + DOCS[k] + '</button>'; }).join('') + '</span><button type="button" class="pri" data-da="pdf">Imprimir / PDF</button><button type="button" data-da="xls">Descargar Excel</button></div>' +
      '<div class="kdoc-id"><label>N° de documento<input data-dl="num" placeholder="Ej.: PRY-0400-EL-LEQ-00001"></label><label>Proyecto o área<input data-dl="proy" placeholder="Opcional"></label><label class="kdoc-notas">Notas al pie del anexo (una por línea)<textarea data-dl="notas" rows="2" placeholder="Nota 1: …"></textarea></label></div>' +
      '<details class="kdoc-sug" id="kDocSug"><summary>Notas recomendadas para el anexo (toca para agregar o quitar)</summary><div class="kdoc-chips"></div></details><div class="kdoc-revs" id="kDocRevs"></div><p class="kdoc-ay" id="kDocAy"></p><div id="kDoc"></div>';
    sec.appendChild(box);
    box.addEventListener('click', function (e) { var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.nota) { notaAlternar(SUG_NOTAS[+t.dataset.nota]); A.guardar(); return pintarDoc(true); }
      if (t.dataset.doc) { docs().sel = t.dataset.doc; A.guardar(); pintarDoc(true); }
      else if (t.dataset.da === 'pdf') { $('#imp').innerHTML = docHtml(docs().sel); setTimeout(function () { window.print(); }, 150); }
      else if (t.dataset.da === 'xls') { if (docs().sel === 'listado') lstExcel(); else excel(); }
      else if (t.dataset.rv) { var id = docs().sel, f = JSON.parse(JSON.stringify(docFilas(id))); if (t.dataset.rv === '+') { var d = new Date(); f.push({ rev: '', fecha: ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear(), desc: '', por: '', reviso: '', aprobo: '' }); } else f.splice(+t.dataset.rv, 1); docs()[id].revs = f; A.guardar(); pintarDoc(true); } });
    box.addEventListener('input', function (e) { var t = e.target, k = t.dataset.dl;
      if (k) { if (k === 'num') { if (docs().sel === 'listado') lstDatos().num = t.value; else docs().memoria.num = t.value; } else lstDatos()[k] = t.value; A.guardar(); $('#kDoc').innerHTML = docHtml(docs().sel); ajustarDoc(); return; }
      if (t.dataset.rc) { var id = docs().sel, f = JSON.parse(JSON.stringify(docFilas(id))); f[+t.dataset.ri][t.dataset.rc] = t.dataset.rc === 'rev' ? t.value.toUpperCase() : t.value; docs()[id].revs = f; A.guardar(); $('#kDoc').innerHTML = docHtml(id); ajustarDoc(); } });
    if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(ajustarDoc.t); ajustarDoc.t = setTimeout(ajustarDoc, 80); }).observe(box);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) pintarDoc(true); }).observe(box);
    return box;
  }
  // La hoja se ajusta al ancho de su ventana (el zoom de la barra se aplica encima para ver detalles)
  function ajustarDoc() { var c = $('#kDoc'), k = c && c.querySelector('.kdoc'); if (!k || c.offsetParent === null) return; var zc = parseFloat(c.style.zoom) || 1, w = (c.parentNode.clientWidth || c.clientWidth) - 32; [].forEach.call(k.children, function (h) { h.style.zoom = ''; var nat = h.offsetWidth; if (zc === 1 && nat > w && w > 120) h.style.zoom = Math.max(0.2, w / nat); }); }
  function pintarTag() { var s2 = est(), dc = actual(), q; if (!(q = $('#kEstPerfil'))) return; q.value = s2.perfil; [['#kEstPatron', s2.patron], ['#kEstZona', s2.zona]].forEach(function (x) { var i = $(x[0]); if (i && document.activeElement !== i) i.value = x[1]; });
    $('#kEstDesc').textContent = EST[s2.perfil].d + ' Formato: {ZONA}, {TAG}, {SERV} (P potencia, J instrumentación, C control, R comunicaciones) y {NN} correlativo.';
    var pr = tagAuto(dc); $('#kTagPrev').innerHTML = up(dc.tag) === pr ? '✓ El tag sigue el formato' : 'Quedaría: <b>' + esc(pr) + '</b>';
    var cs = circuitosDe(dc); $('#kCircs').textContent = cs.length ? 'Circuitos dentro del ducto: ' + cs.join(', ') + '. Se escriben en la pestaña «Cables», columna Tag circuito.' : 'Sin circuitos identificados: escribe el tag de cada circuito en la pestaña «Cables» para que aparezca en el listado y en las rutas.'; }
  function pintarAmb() { var f = $('#kForm'), q = f && f.querySelector('[data-k=amb]'), box = $('#kAmb'); if (!q || !box) return; var dc = actual(); if (document.activeElement !== q) q.value = dc.amb || ''; var am = ambiente(dc);
    if (!am) { box.innerHTML = '<p class="kamb-n">Elige el ambiente para ver qué tipo de tubería conviene.</p>'; return; }
    box.innerHTML = '<p>' + esc(am.a.txt) + '</p><div class="kamb-op">' + am.a.rec.map(function (k, i) { var act = k === dc.tubo; return '<button type="button" data-usa="' + k + '"' + (act ? ' class="act" aria-pressed="true"' : '') + ' title="' + esc(TUBOS[k].n) + '">' + (i === 0 ? '★ ' : '') + esc(TUBOS[k].c) + (act ? ' · en uso' : '') + '</button>'; }).join('') + '</div>' +
      (am.ok ? '<p class="kamb-ok">✓ La tubería elegida es adecuada para este ambiente.</p>' : '<p class="kamb-mal">' + (am.evitar ? '✗ ' : '! ') + esc(TUBOS[dc.tubo].c) + (am.evitar ? ' no conviene' : ' no es la recomendada') + ' aquí. Toca una de las opciones para cambiarla.</p>') +
      (am.a.no.length ? '<p class="kamb-n">Evitar: ' + am.a.no.map(function (k) { return esc(TUBOS[k].c); }).join(', ') + '.</p>' : '') + (am.a.alt ? '<p class="kamb-n">Alternativa: ' + esc(am.a.alt) + '</p>' : '') + '<p class="kamb-n">Referencia: ' + esc(am.a.ref) + '. Recomendación de práctica habitual: confírmala con la especificación del proyecto.</p>'; }
  function pintarDoc(forzar) {
    var box = docCaja(); if (!box) return; if (!forzar && box.offsetParent === null) return;
    var id = docs().sel, l = lstDatos(), mesa = !!(window.RE_EMISION && window.RE_EMISION.adaptadores && window.RE_EMISION.adaptadores['v-cond']);
    [].forEach.call(box.querySelectorAll('[data-doc]'), function (q) { q.setAttribute('aria-pressed', String(q.dataset.doc === id)); });
    [].forEach.call(box.querySelectorAll('[data-dl]'), function (q) { if (document.activeElement !== q) q.value = q.dataset.dl === 'num' ? docNum(id) : l[q.dataset.dl] || ''; });
    box.querySelector('.kdoc-notas').hidden = id !== 'listado'; var sg = $('#kDocSug'); sg.hidden = id !== 'listado'; sg.querySelector('.kdoc-chips').innerHTML = SUG_NOTAS.map(function (t, i) { var on = notaTiene(t); return '<button type="button" data-nota="' + i + '" aria-pressed="' + on + '">' + (on ? '✓ ' : '+ ') + esc(t) + '</button>'; }).join('');
    var rv = $('#kDocRevs');
    if (mesa) { rv.innerHTML = ''; $('#kDocAy').textContent = 'Las revisiones se manejan en la pestaña «Control documental»: 1 · Actualizar revisiones (se refleja aquí para revisarla) y luego 2 · Emitir.'; }
    else if (!(document.activeElement && document.activeElement.dataset.rc && rv.contains(document.activeElement))) { var f = docFilas(id);
      rv.innerHTML = '<b>Revisiones del documento</b><table><thead><tr><th>Rev.</th><th>Fecha</th><th>Descripción</th><th>Por</th><th>Revisó</th><th>Aprobó</th><th></th></tr></thead><tbody>' + f.map(function (x, i) { return '<tr>' + ['rev', 'fecha', 'desc', 'por', 'reviso', 'aprobo'].map(function (k) { return '<td><input data-ri="' + i + '" data-rc="' + k + '"' + (k === 'rev' ? ' list="kDlRev"' : '') + ' value="' + esc(x[k] || '') + '" aria-label="' + k + '"></td>'; }).join('') + '<td><button type="button" data-rv="' + i + '" title="Quitar esta revisión" aria-label="Quitar revisión">×</button></td></tr>'; }).join('') + '</tbody></table><button type="button" data-rv="+">+ Agregar revisión</button>';
      $('#kDocAy').textContent = 'Agrega o corrige la revisión, revisa el documento abajo y luego imprime o descarga.'; }
    $('#kDoc').innerHTML = docHtml(id); ajustarDoc();
  }
  function lstAbrir() { docs().sel = 'listado'; A.guardar(); var box = docCaja(); if (!box) return; var tab = document.querySelector('#v-cond .dk-tab[data-id=doc]'); if (tab) tab.click(); pintarDoc(true); setTimeout(function () { var q = $('#kDocBox'); if (q) q.scrollIntoView({ block: 'start' }); }, 60); }
  // ── Excel de memoria de cálculo ──
  function excel() {
    var X = window.XLSX_RE, lb = X.libro(), b = datos(), AZ = '022A55', h = lb.hoja('DUCTOS', { orientacion: 'landscape' });
    h.cols([12, 26, 34, 10, 14, 12, 16, 14, 14, 12]); h.celda(0, 0, 'DIMENSIONAMIENTO DE CANALIZACIONES · RIC N°04 TABLA N°4.21', { b: true, sz: 12 });
    ['DUCTO', 'RUTA / TRAMO', 'TIPO DE TUBERÍA', 'N° CABLES', 'ΣA CABLES mm²', 'LÍMITE %', 'A REQUERIDA mm²', 'TAMAÑO', 'Ø INT. mm', 'OCUPACIÓN %'].forEach(function (t, i) { h.celda(2, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center', wrap: true }); });
    b.ductos.forEach(function (dc, k) { var r = calcular(dc); [dc.tag, up(dc.ruta), r.T.c, r.n, n1(r.suma, 1), r.lim, n1(r.req, 1), r.elegido ? r.elegido.s[0] : 'NO ALCANZA', r.elegido ? n1(r.elegido.s[2], 2) : '', r.elegido ? n1(r.elegido.occ, 1) : ''].forEach(function (v, i) { h.celda(3 + k, i, String(v), { sz: 9 }); }); });
    var g = lb.hoja('CABLES', { orientacion: 'landscape' }); g.cols([12, 6, 22, 14, 40, 10, 12]);
    ['DUCTO', 'N°', 'TAG CIRCUITO', 'CÓDIGO', 'CABLE', 'Ø mm', 'ÁREA mm²'].forEach(function (t, i) { g.celda(0, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    var f = 1; b.ductos.forEach(function (dc) { calcular(dc).lista.forEach(function (x, i) { [dc.tag, i + 1, x.c.tag || '', x.k.cod, FAM[x.k.f] + ' · ' + x.k.desc, n1(x.d, 1), n1(area(x.d), 1)].forEach(function (v, j) { g.celda(f, j, String(v), { sz: 9 }); }); f++; }); });
    var so = lb.hoja('SOPORTACION', { orientacion: 'landscape' }); so.cols([12, 10, 8, 90, 30]);
    ['DUCTO', 'CANTIDAD', 'UNIDAD', 'MATERIAL DE REFERENCIA', 'FUENTE'].forEach(function (t, i) { so.celda(0, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    var fs = 1; b.ductos.forEach(function (dc) { var r = calcular(dc); if (!r.elegido) return; soportacion(dc, r, r.elegido.s).items.forEach(function (it) { [dc.tag, it.cant, it.un, it.desc, it.ref].forEach(function (v, j) { so.celda(fs, j, String(v), { sz: 9, wrap: j === 3 }); }); fs++; }); });
    so.celda(fs + 1, 3, 'Cantidades referenciales. Soportes: RIC N°04 7.16.4.4 y Tabla N°4.24. Cajas: RIC N°04 5.23 y referencia NEC 314.28. Medidas: ' + MJM + '.', { sz: 9, wrap: true, borde: 'none' });
    var n = lb.hoja('CRITERIOS'); n.cols([110]);
    ['RIC N°04 (SEC, 2020) 7.16.1.14 y Tabla N°4.21: el conductor o haz de conductores, incluida la aislación, ocupará como máximo 50 % (1 conductor), 33 % (2) o 33 % (3 o más) de la sección de la tubería.',
      'Tabla N°4.21, nota: en tuberías de unión de gabinetes de tableros o similares de hasta 1 m se acepta hasta 60 %. Si el conductor de tierra va en el haz se incluye en el cálculo.',
      'RIC N°04 Tabla N°4.29, nota: en ductos subterráneos con más de 10 conductores o secciones distintas, la sección interior será al menos 4 veces la ocupada (25 %). Ø mínimo subterráneo 25 mm (7.9.7.1).',
      'RIC N°04 7.16.1.13: valores válidos para tramos de hasta 20 m, rectos o con no más de dos curvas y desviación total ≤ 180°; en otro caso, cajas de paso intermedias.',
      'Referencia: NEC 2023 Cap. 9 Tabla 1 (53 % / 31 % / 40 %) y Tabla 4 (dimensiones de RMC, EMT y PVC). Un cable multiconductor se considera un conductor.',
      'Diámetros de cables: catálogo Cocesa del formato original y NEC Cap. 9 Tabla 5 (THHN). Verificar con el fabricante.'].forEach(function (t, i) { n.celda(i, 0, t, { sz: 10, wrap: true }); });
    A.descargar('Canalizaciones_RIC04.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }


  // ── Catálogo lateral de cables por servicio y visor 3D del ducto ──
  // Servicio de cada familia (agrupación del formato original: instrumentación, control y fuerza)
  var SERV = { inst: { n: 'Instrumentación', c: '#2F6FB5', d: 'Señales analógicas y de campo: pares y tríadas apantallados, multipares y multitríadas.' },
    ctrl: { n: 'Control', c: '#B7791F', d: 'Señales discretas 24 VDC / 120 VAC, solenoides, interruptores y botoneras: multiconductores.' },
    fuerza: { n: 'Fuerza', c: '#C0392B', d: 'Alimentación 220/380 V de instrumentos, tableros y motores: mono y multiconductores.' },
    fo: { n: 'Fibra óptica', c: '#7E57C2', d: 'Enlaces de comunicaciones y redes de control: cables de fibra óptica de 1 a 288 fibras.' },
    otro: { n: 'Otro', c: '#6b7480', d: 'Cable fuera del catálogo con diámetro manual.' } };
  var FSERV = { par: 'inst', mpar: 'inst', mtri: 'inst', pvicp: 'inst', pvict: 'inst', gfip: 'inst', gfit: 'inst',
    xtcc: 'ctrl', cvtc: 'ctrl', gfc: 'ctrl', dlx: 'ctrl', gpt: 'ctrl', otro: 'otro', fos: 'fo', fod: 'fo', foa: 'fo', fou: 'fo', folt: 'fo', folta: 'fo' };
  function servDe(f) { return FSERV[f] || 'fuerza'; }
  var USO = {
    par: 'Un instrumento: 4–20 mA / HART del transmisor a la caja de conexiones (par) o RTD de 3 hilos (tríada).',
    mpar: 'Troncal de caja de conexiones a sala eléctrica o de control con varias señales analógicas.',
    mtri: 'Troncal para RTD de 3 hilos y señales de tres conductores.',
    pvicp: 'Pares apantallados individual y total (PVC): troncales de señales analógicas.',
    pvict: 'Tríos apantallados (PVC): troncales para RTD y señales de 3 hilos.',
    gfip: 'Pares libres de halógenos (LSZH): salas eléctricas, túneles y recintos cerrados.',
    gfit: 'Tríos libres de halógenos (LSZH): salas eléctricas, túneles y recintos cerrados.',
    xtcc: 'Control 600 V del formato original: discretas, solenoides y comandos.',
    cvtc: 'Control 600 V tipo TC-ER: discretas, solenoides y comandos en bandeja o ducto.',
    gfc: 'Control libre de halógenos (LSZH) para recintos cerrados.',
    dlx: 'Control armado: tramos expuestos a daño mecánico o directamente enterrados.',
    gpt: 'Cable de uso general para cableado interno de tableros y conexiones cortas.',
    xtmu: 'Fuerza 1000 V del formato original: alimentación trifásica.',
    thhn: 'Conductores individuales en ducto: alimentación 220/380 V (NEC Cap. 9 Tabla 5).',
    xtu: 'Monoconductor 600 V para alimentadores en ducto o bandeja.',
    xtm3: 'Alimentación trifásica de motores y equipos (3 fases).', xtm3n: 'Alimentación trifásica con neutro.',
    xtm3nt: 'Alimentación trifásica con neutro y tierra.', xtk3: 'Alimentación trifásica 1 kV.',
    sfx3: 'Multiconductor flexible para equipos móviles o con vibración.', sfx3nt: 'Flexible 3F + N + T para equipos móviles.',
    rz1m: 'Multiconductor 0,6/1 kV libre de halógenos (LSZH).', rz1: 'Monoconductor 0,6/1 kV libre de halógenos (LSZH).',
    thgc: 'Conductores individuales THHN/THWN-2 en ducto.', evaf: 'Cableado interior 450/750 V libre de halógenos.',
    exz: 'Cableado interior 450/750 V libre de halógenos.',
    fos: 'Fibra sin armadura para tender dentro de ductos: enlaces entre salas y gabinetes.', fod: 'Fibra totalmente dieléctrica con protección contra roedores: ductos o directamente enterrada.', foa: 'Fibra con armadura de acero corrugado: enterrada, en canales, zanjas o ductos.',
    fou: 'Monotubo de 1 a 12 fibras para tramos cortos en ducto.', folt: 'Loose-tube sin armadura para ductos, de 6 a 144 fibras.', folta: 'Loose-tube con armadura de acero corrugado: enterrado o en ductos.', genl: 'Cableado interior 450/750 V (PVC).', otro: 'Ingresa el diámetro del catálogo del fabricante.'
  };
  var ORDEN_FAM = Object.keys(FAM).sort(function (a, b) { var o = { inst: 0, ctrl: 1, fuerza: 2, fo: 2.5, otro: 3 }; return o[servDe(a)] - o[servDe(b)]; });
  var catFiltro = 'todos', catTexto = '', ultimo = null;
  function miniCable(k, px) {
    var d = 10;
    return '<svg viewBox="-6 -6 12 12" width="' + px + '" height="' + px + '" aria-hidden="true"><circle r="5" fill="' + COLF[k.f] + '" stroke="#0b1828" stroke-width=".3"/><g>' + nucleos(0, 0, d, k) + '</g></svg>';
  }
  function cssExtra() {
    if (document.getElementById('kExtraCss')) return;
    var s = document.createElement('style'); s.id = 'kExtraCss';
    s.textContent = [
      '#kCatTab{position:fixed;right:0;top:42%;z-index:60;writing-mode:vertical-rl;transform:rotate(180deg);background:#E8A317;color:#1a1205;border:0;border-radius:0 8px 8px 0;padding:14px 8px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '#kCatTab:focus-visible{outline:2px solid #fff;outline-offset:2px}',
      '#kCat{position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);z-index:70;background:#0e1f33;color:#e8eef5;border-left:2px solid #E8A317;box-shadow:-10px 0 30px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;font:13px/1.4 system-ui,"Segoe UI",sans-serif}',
      '#kCat.abierto{transform:none}',
      '@media (min-width:1280px){body.kcat-on{padding-right:420px;transition:padding .22s ease}}',
      '#kCat .kc-cab{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#022A55;border-bottom:1px solid #24405f}#kCat .kc-cab b{flex:1;font-size:15px}',
      '#kCat .kc-cab button{background:transparent;color:#e8eef5;border:1.5px solid #3a5a80;border-radius:8px;min-width:34px;min-height:34px;cursor:pointer;font-size:16px}',
      '#kCat .kc-dest{padding:8px 14px;font-size:12px;color:#9fb0c3;border-bottom:1px solid #24405f}#kCat .kc-dest b{color:#E8A317}',
      '#kCat .kc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px 4px}',
      '#kCat .kc-chips button{border:1.5px solid #3a5a80;background:transparent;color:#e8eef5;border-radius:16px;padding:5px 11px;font:600 12px system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
      '#kCat .kc-chips button i{width:9px;height:9px;border-radius:50%;display:inline-block}',
      '#kCat .kc-chips button[aria-pressed=true]{background:#E8A317;border-color:#E8A317;color:#1a1205}',
      '#kCat .kc-bus{padding:6px 14px 10px}#kCat .kc-bus input{width:100%;box-sizing:border-box;background:#071423;color:#e8eef5;border:1.5px solid #24405f;border-radius:8px;padding:8px 10px;font:13px system-ui,sans-serif}',
      '#kCat .kc-lista{flex:1;overflow:auto;padding:0 10px 16px}',
      '#kCat .kc-serv{margin:12px 4px 6px;font:700 11.5px system-ui,sans-serif;letter-spacing:.8px;text-transform:uppercase;display:flex;align-items:center;gap:8px}',
      '#kCat .kc-serv:after{content:"";flex:1;height:2px;background:currentColor;opacity:.4}',
      '#kCat details{border:1px solid #24405f;border-left:4px solid var(--sc);border-radius:8px;margin:0 0 8px;background:#11243a}',
      '#kCat summary{cursor:pointer;padding:8px 10px;display:flex;gap:8px;align-items:center;list-style:none}#kCat summary::-webkit-details-marker{display:none}',
      '#kCat summary .nm{flex:1;font-weight:600;font-size:12.5px}#kCat summary small{color:#9fb0c3;font-weight:400}',
      '#kCat summary .ct{font-size:11px;color:#9fb0c3;border:1px solid #24405f;border-radius:10px;padding:1px 7px}',
      '#kCat .kc-uso{margin:0 10px 6px;font-size:11.5px;color:#cdd8e4}',
      '#kCat table{width:100%;border-collapse:collapse;font-size:12px}#kCat td{padding:4px 6px;border-top:1px solid #1d3550;vertical-align:middle}',
      '#kCat td.n{text-align:right;white-space:nowrap;color:#cdd8e4}#kCat td.cd{font-weight:700;white-space:nowrap}',
      '#kCat td button{background:#E8A317;color:#1a1205;border:0;border-radius:6px;min-width:30px;min-height:28px;font:700 15px system-ui;cursor:pointer}',
      '#kCat tr.ok td{background:#173d29}',
      '#kCat .kc-pie{padding:8px 14px;font-size:11px;color:#9fb0c3;border-top:1px solid #24405f}',
      '.kserv{display:inline-block;font:700 10px system-ui,sans-serif;padding:1px 6px;border-radius:8px;color:#fff;margin-right:4px;vertical-align:1px}',
      '#kTutTab{position:fixed;left:0;top:30%;z-index:60;writing-mode:vertical-rl;transform:rotate(180deg);background:#2F6FB5;color:#fff;border:0;border-radius:8px 0 0 8px;padding:14px 8px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '#kTutTab:focus-visible{outline:2px solid #fff;outline-offset:2px}',
      '#kTut{position:fixed;top:0;left:0;bottom:0;width:min(400px,100vw);z-index:72;background:#0e1f33;color:#e8eef5;border-right:2px solid #2F6FB5;box-shadow:10px 0 30px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(-105%);transition:transform .22s ease;font:13px/1.45 system-ui,"Segoe UI",sans-serif}',
      '#kTut.abierto{transform:none}',
      '#kTut .kt-cab{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#022A55;border-bottom:1px solid #24405f}#kTut .kt-cab b{flex:1;font-size:15px}',
      '#kTut .kt-cab button{background:transparent;color:#e8eef5;border:1.5px solid #3a5a80;border-radius:8px;min-width:34px;min-height:34px;cursor:pointer;font-size:16px}',
      '#kTut .kt-int{margin:0;padding:10px 14px;color:#9fb0c3;font-size:12.5px;border-bottom:1px solid #24405f}',
      '#kTut .kt-lista{list-style:none;margin:0;padding:10px 12px;overflow:auto;flex:1}',
      '#kTut .kt-lista li{display:grid;grid-template-columns:30px 1fr;gap:10px;padding:10px;border:1px solid #24405f;border-radius:10px;background:#11243a;margin-bottom:8px}',
      '#kTut .kt-lista li.visto{border-color:#2c6b45}#kTut .kt-lista li.visto .kt-n{background:#1f9d55}',
      '#kTut .kt-n{width:28px;height:28px;border-radius:50%;background:#2F6FB5;color:#fff;display:grid;place-items:center;font-weight:700}',
      '#kTut h3{margin:2px 0 4px;font:700 13.5px system-ui,sans-serif;color:#fff;border:0;padding:0;text-transform:none;letter-spacing:0}',
      '#kTut h3::before,#kTut h3::after{display:none}',
      '#kTut .kt-lista p{margin:0 0 8px;color:#cdd8e4;font-size:12.5px}#kTut .kt-lista b{color:#fff}',
      '#kTut .kt-lista button{min-height:0;background:transparent;color:#E8A317;border:1.5px solid #E8A317;border-radius:7px;padding:4px 10px;font:600 12px system-ui,sans-serif;cursor:pointer}',
      '#kTut .kt-lista button:hover{background:#E8A317;color:#1a1205}',
      '#kTut .kt-ref{padding:10px 14px 14px;border-top:1px solid #24405f;font-size:12px;color:#9fb0c3}#kTut .kt-ref table{width:100%;border-collapse:collapse;margin:6px 0}',
      '#kTut .kt-ref td{padding:4px 6px;border-top:1px solid #1d3550;color:#e8eef5}#kTut .kt-ref p{margin:0}',
      '.kt-foco{outline:3px solid #E8A317!important;outline-offset:4px;border-radius:6px;animation:ktPulso 1.2s ease 2}',
      '@keyframes ktPulso{0%,100%{outline-color:#E8A317}50%{outline-color:rgba(232,163,23,.25)}}',
      '@media (prefers-reduced-motion:reduce){#kTut,#kCat{transition:none}.kt-foco{animation:none}}',
      '#kNorTab{position:fixed;left:0;top:calc(30% + 120px);z-index:60;writing-mode:vertical-rl;transform:rotate(180deg);background:#1f7a6a;color:#fff;border:0;border-radius:8px 0 0 8px;padding:14px 8px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '#kNorTab:focus-visible{outline:2px solid #fff;outline-offset:2px}',
      '#kNor{position:fixed;top:0;left:0;bottom:0;width:min(560px,100vw);z-index:73;background:#0e1f33;color:#e8eef5;border-right:2px solid #1f7a6a;box-shadow:10px 0 30px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(-105%);transition:transform .22s ease;font:13px/1.45 system-ui,"Segoe UI",sans-serif}',
      '#kNor.abierto{transform:none}',
      '#kNor .kt-cab{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#022A55;border-bottom:1px solid #24405f}#kNor .kt-cab b{flex:1;font-size:15px}',
      '#kNor .kt-cab button{background:transparent;color:#e8eef5;border:1.5px solid #3a5a80;border-radius:8px;min-width:34px;min-height:34px;cursor:pointer;font-size:16px}',
      '#kNor .kn-ficha{display:flex;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid #24405f;font-size:12.5px;color:#cdd8e4}#kNor .kn-ficha b{color:#fff;font-size:13.5px}',
      '#kNor .kn-sigla{flex:none;background:#1f7a6a;color:#fff;font:800 15px system-ui,sans-serif;border-radius:8px;padding:10px 10px;text-align:center;line-height:1.1}',
      '#kNor .kn-pdf{padding:10px 14px 0}#kNor .kn-pdf button{width:100%;min-height:38px;background:#1f7a6a;color:#fff;border:0;border-radius:8px;font:700 13px system-ui,sans-serif;cursor:pointer}#kNor .kn-pdf button:hover{background:#249078}',
      '#kNor .kn-busca{padding:10px 14px}#kNor .kn-busca input{width:100%;box-sizing:border-box;background:#071423;color:#e8eef5;border:1.5px solid #24405f;border-radius:8px;padding:8px 10px;font:13px system-ui,sans-serif}',
      '#kNor .kt-lista{list-style:none;margin:0;padding:0 12px 10px;overflow:auto;flex:1}',
      '#kNor .kn-item{border:1px solid #24405f;border-left:4px solid #1f7a6a;border-radius:8px;background:#11243a;margin-bottom:8px}',
      '#kNor .kn-item summary{cursor:pointer;padding:9px 10px;display:flex;gap:10px;align-items:baseline;list-style:none}#kNor .kn-item summary::-webkit-details-marker{display:none}',
      '#kNor .kn-cl{flex:none;font:700 11.5px Consolas,monospace;color:#7fd8c4;min-width:118px}#kNor .kn-t{font-weight:700;color:#fff}',
      '#kNor .kn-app{margin:0 10px 8px;color:#cdd8e4;font-size:12.5px}#kNor .kn-app b{color:#E8A317}',
      '#kNor blockquote{margin:0 10px 10px;padding:8px 10px;background:#071423;border-radius:6px;border-left:3px solid #3a5a80;color:#dfe7ef;font-size:12.5px;line-height:1.5}',
      '#kNor .kn-pie{margin:0;padding:10px 14px 14px;border-top:1px solid #24405f;font-size:11.5px;color:#9fb0c3}',
      '#k3dBtn{margin-top:8px}',
      '#kDocBox{margin-top:16px;display:grid;gap:10px}#kDocBox .kdoc-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:center}#kDocBox .kdoc-seg{display:inline-flex;border:1.5px solid #E8A317;border-radius:9px;overflow:hidden;margin-right:auto}#kDocBox .kdoc-seg button{border:0;border-radius:0;padding:7px 13px;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}#kDocBox .kdoc-seg button[aria-pressed=true]{background:#E8A317;color:#1b1203}',
      '#kDocBox .kdoc-id{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}#kDocBox .kdoc-id label{display:grid;gap:3px;font-size:12px;color:#9fb0c3}#kDocBox .kdoc-id input,#kDocBox .kdoc-id textarea,#kDocBox .kdoc-revs input{font:inherit;font-size:13px;padding:5px 7px;border-radius:6px;border:1px solid #3a5a80;background:#0e2238;color:#e8eef5;width:100%;box-sizing:border-box}#kDocBox .kdoc-notas{grid-column:1/-1}',
      '#kDocBox .kdoc-sug summary{cursor:pointer;font-size:12.5px;font-weight:600;color:#ffd27a}#kDocBox .kdoc-chips{display:grid;gap:5px;margin-top:8px}#kDocBox .kdoc-chips button{text-align:left;font:inherit;font-size:12px;padding:5px 9px;border-radius:7px;border:1px solid #3a5a80;background:#0e2238;color:#e8eef5;cursor:pointer}#kDocBox .kdoc-chips button[aria-pressed=true]{border-color:#E8A317;background:rgba(232,163,23,.16)}',
      '#kDocBox .kdoc-revs:empty{display:none}#kDocBox .kdoc-revs table{width:100%;border-collapse:collapse;margin:6px 0}#kDocBox .kdoc-revs th{font-size:11px;color:#9fb0c3;text-align:left;padding:2px 4px}#kDocBox .kdoc-revs td{padding:2px}#kDocBox .kdoc-ay{margin:0;font-size:12px;color:#9fb0c3}',
      '#kDoc{background:#16273b;padding:14px;border-radius:8px;overflow:auto}.kdoc{display:grid;gap:14px;justify-items:start;width:max-content}.kdoc .pg.h{width:297mm;max-width:none}.kdoc .kdoc-lam{width:297mm;background:#fff;box-shadow:0 6px 30px rgba(0,0,0,.45)}.kdoc .kdoc-lam svg{width:100%;height:auto;display:block}',
      '.kdoc .pg td{text-align:center}.kdoc .pg td.izq,.kdoc .pg .datos td{text-align:left}.kdoc .kdoc-an{text-align:center;font-weight:700;color:#022A55;margin:0 0 4mm}.kdoc .klst-hoja{box-shadow:none;padding:0;min-width:0;font-size:9pt}',
      '@media print{#imp .kdoc{display:block}#imp .kdoc .pg.h{width:auto}#imp .kdoc .kdoc-lam{width:420mm;box-shadow:none}#imp .kdoc .kdoc-lam svg{width:420mm;height:297mm}}',
      '.klst-hoja{background:#fff;color:#111;padding:14mm 12mm;min-width:900px;font:11px Arial,Helvetica,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)}.klst-tit{text-align:center;margin-bottom:10px;line-height:1.5}.klst-tit b{display:block;font-size:14px}.klst-tit span{display:block;font-weight:700;font-size:13px}.klst-tit small{display:block;font-size:11px;color:#333}',
      '.klst-t{width:100%;border-collapse:collapse}.klst-t th,.klst-t td{border:1px solid #111;padding:5px 7px;text-align:center;vertical-align:middle;color:#111;background:#fff}.klst-t th{background:#022A55;color:#fff;font-size:10.5px}.klst-t td.izq{text-align:left}.klst-n{margin:8px 0 0;font-size:10.5px;color:#111}',
      '@media print{#imp .klst-hoja{box-shadow:none;padding:0;min-width:0}#imp .klst-t thead{display:table-header-group}#imp .klst-t tr{break-inside:avoid}#imp .klst-t th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
      '#k3d .k3-det{position:absolute;left:12px;top:12px;width:min(600px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;background:#fff;color:#17212C;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.55);z-index:5;color-scheme:light}#k3d .k3-dcab{display:flex;gap:10px;align-items:center;padding:8px 12px;background:#022A55;color:#fff;border-radius:10px 10px 0 0;position:sticky;top:0}#k3d .k3-dcab b{flex:1;font-size:13.5px}#k3d .k3-dcab button{font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid #fff;background:transparent;color:#fff;cursor:pointer}',
      '#k3d .kd-svg{display:block;width:100%;height:auto}.kd-svg text{font:10px Arial,Helvetica,sans-serif;fill:#17212C}.kd-svg .kd-t{font-weight:700;font-size:10.5px;fill:#022A55}.kd-svg .kd-n{font-size:9px;fill:#5A6573}.kd-svg .kd-c path{stroke:#B3261E;stroke-width:.7;fill:none}.kd-svg .kd-c text{fill:#B3261E;font-size:10px}.kd-svg .kd-r{fill:#c7ced6;stroke:#1F2A36;stroke-width:1.2}.kd-svg .kd-r2{fill:#fff;stroke:#1F2A36;stroke-linejoin:miter}.kd-svg .kd-l{stroke:#1F2A36;stroke-width:.7;fill:none}.kd-svg .kd-d{fill:#e3e7ec;stroke:#1F2A36;stroke-width:1.2}.kd-svg .kd-di{fill:#fff;stroke:#1F2A36;stroke-width:.7}.kd-svg .kd-a{fill:none;stroke:#C8901E;stroke-linecap:butt}.kd-svg .kd-a2{fill:#E8B94A;stroke:#7a5608;stroke-width:1}.kd-svg .kd-p{fill:#1F2A36}.kd-svg .kd-k{fill:#F2A65A;stroke:#1F2A36;stroke-width:1.3}.kd-svg .kd-l2{fill:none;stroke:#1F2A36;stroke-width:.7}',
      '#k3d .k3-dt{width:100%;border-collapse:collapse;font-size:12px}#k3d .k3-dt th{text-align:left;font-weight:700;color:#022A55;padding:4px 12px;width:38%;vertical-align:top;border-top:1px solid #DCE3EB}#k3d .k3-dt td{padding:4px 12px 4px 0;border-top:1px solid #DCE3EB;color:#17212C}',
      '#k3d .k3-esc .labels{z-index:2}#k3d .k3-esc .labels .k3-lbl.k3-sug,#k3d .k3-esc .labels .k3-lbl.k3-sop{pointer-events:auto!important;cursor:pointer}',
      '.kamb{grid-column:1/-1;font-size:12.5px;line-height:1.45}.kamb p{margin:0 0 6px}.kamb .kamb-n{color:#9fb0c3;font-size:12px}.kamb .kamb-ok{color:#5fd07a;font-weight:600}.kamb .kamb-mal{color:#ffb454;font-weight:600}.kamb-op{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.kamb-op button{font:inherit;font-size:12px;font-weight:600;padding:5px 10px;border-radius:7px;border:1.5px solid #E8A317;background:transparent;color:inherit;cursor:pointer}.kamb-op button.act{background:#E8A317;color:#1b1203}',
      '.ktag{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:12.5px}.ktag b{color:#ffd27a}.ktag-n{grid-column:1/-1;margin:0;font-size:12px;color:#9fb0c3;line-height:1.45}.ktag-l{grid-column:1/-1;margin-top:8px;padding:8px 0 0;border-top:1px solid #223a57;width:100%;font:700 10.5px ui-monospace,Consolas,monospace;letter-spacing:.09em;text-transform:uppercase;color:#E8A317}',
      '.kbot{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:stretch}.kgrp{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px 6px 8px;border:1px solid #223a57;border-radius:9px;position:relative}.kgrp-t{font:700 9.5px ui-monospace,Consolas,monospace;letter-spacing:.09em;text-transform:uppercase;color:#E8A317;width:100%;margin-bottom:-1px}.kgrp:not(:has(button:not([hidden]))){display:none}',
      '#k3d{width:min(1280px,96vw);height:min(860px,92vh);padding:0;border:1px solid #3a5a80;border-radius:12px;background:#0b1a2b;color:#e8eef5;overflow:hidden}',
      '#k3d[open]{display:flex;flex-direction:column}#k3d::backdrop{background:rgba(0,0,0,.6)}',
      '#k3d .k3-cab{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#022A55;border-bottom:2px solid #E8A317}',
      '#k3d .k3-cab b{flex:1;font:700 15px system-ui,sans-serif}#k3d .k3-cab b small{display:block;font-weight:400;font-size:12px;color:#9fb0c3}',
      '#k3d .k3-cab button{background:transparent;color:#e8eef5;border:1.5px solid #3a5a80;border-radius:8px;padding:7px 12px;font:600 12.5px system-ui,sans-serif;cursor:pointer}',
      '#k3d .k3-cab button[aria-pressed=true]{background:#E8A317;color:#1a1205;border-color:#E8A317}',
      '#k3d .k3-cuerpo{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 270px;min-height:0}',
      '#k3d .k3-esc{position:relative;min-height:0}#k3d .k3-esc canvas{display:block;width:100%;height:100%;outline:none}',
      '#k3d .k3-esc .labels{position:absolute;inset:0;pointer-events:none}',
      '#k3d .k3-lbl{font:700 11px system-ui,sans-serif;background:rgba(11,26,43,.85);color:#fff;border:1px solid #E8A317;border-radius:10px;padding:1px 7px;white-space:nowrap}',
      '#k3d .k3-ley{overflow:auto;padding:10px 12px;border-left:1px solid #24405f;font-size:12px}#k3d .k3-ley li{margin:0 0 6px}',
      '#k3d .k3-ley ol{margin:0;padding-left:20px}#k3d .k3-ayuda{color:#9fb0c3;font-size:11.5px;margin-top:10px}',
      '#k3d .k3-carga{position:absolute;inset:0;display:grid;place-items:center;color:#9fb0c3}',
      '#k3d .k3-modo{display:inline-flex;border:1.5px solid #E8A317;border-radius:9px;overflow:hidden}#k3d .k3-modo button{border:0;border-radius:0;padding:7px 13px}#k3d .k3-cab button[hidden]{display:none}',
      '#k3d .k3-h{margin:12px 0 5px;font:700 10.5px ui-monospace,Consolas,monospace;letter-spacing:.09em;text-transform:uppercase;color:#E8A317}#k3d .k3-h:first-child{margin-top:0}',
      '#k3d .k3-dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:0}#k3d .k3-dl dt{color:#9fb0c3}#k3d .k3-dl dd{margin:0;font-weight:600}#k3d .k3-ley small{display:block;color:#9fb0c3;font-weight:400;font-size:11px}',
      '#k3d .k3-r{margin:0 0 8px;padding:8px 10px;border:1.5px solid #E8A317;border-radius:8px;background:rgba(232,163,23,.1)}#k3d .k3-r b{font-size:17px;color:#ffd27a;white-space:nowrap}',
      '#k3d .k3-ok,#k3d .k3-av,#k3d .k3-mal{margin:8px 0 0;padding:6px 9px;border-radius:6px;border-left:3px solid #3FB950;background:rgba(63,185,80,.1)}#k3d .k3-av{border-color:#E6A23C;background:rgba(230,162,60,.1)}#k3d .k3-mal{border-color:#F85149;background:rgba(248,81,73,.12)}',
      '#k3d ol.k3-cab{display:block;padding:0 0 0 18px;margin:0;background:none;border:0}#k3d .k3-lbl.k3-cur{border-color:#38C8E8}#k3d .k3-lbl.k3-sop{border-color:#E8A317;color:#ffd27a}#k3d .k3-mat{width:100%;border-collapse:collapse;font-size:12px}#k3d .k3-mat td{padding:4px 6px;border-bottom:1px solid #223a57;vertical-align:top}#k3d .k3-mat td:first-child{white-space:nowrap;font-weight:700;color:#ffd27a}#k3d .k3-lbl.k3-sug{border-color:#FF8C32;background:#FF8C32;color:#1b0d02}',
      '@media (max-width:760px){#k3d .k3-cuerpo{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) 150px}#k3d .k3-ley{border-left:0;border-top:1px solid #24405f}}',
      '@media (max-width:700px){#kTutTab,#kNorTab,#kCatTab{top:auto;bottom:0;width:25%;height:54px;writing-mode:horizontal-tb;transform:none;border-radius:0;padding:4px 6px;font-size:11.5px;line-height:1.15;white-space:normal;text-align:center;box-shadow:0 -2px 10px rgba(0,0,0,.35);z-index:61}#kTutTab{left:0}#kNorTab{left:25%}#kCatTab{left:50%;right:auto}body{padding-bottom:58px}body:not(:has(#rsBtn)) #kTutTab,body:not(:has(#rsBtn)) #kNorTab,body:not(:has(#rsBtn)) #kCatTab{width:33.34%}body:not(:has(#rsBtn)) #kNorTab{left:33.33%}body:not(:has(#rsBtn)) #kCatTab{left:66.66%}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function guardarPref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function leerPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function montarCatalogo() {
    if ($('#kCat')) return;
    cssExtra();
    var tab = document.createElement('button'); tab.type = 'button'; tab.id = 'kCatTab'; tab.textContent = 'Catálogo de cables'; tab.setAttribute('aria-controls', 'kCat'); tab.setAttribute('aria-expanded', 'false');
    var p = document.createElement('aside'); p.id = 'kCat'; p.setAttribute('aria-label', 'Catálogo de cables');
    p.innerHTML = '<div class="kc-cab"><b>Catálogo de cables</b><button type="button" id="kCatCerrar" aria-label="Cerrar catálogo">✕</button></div>' +
      '<div class="kc-dest" id="kCatDest"></div>' +
      '<div class="kc-chips" role="group" aria-label="Servicio">' + [['todos', 'Todos', '']].concat(['inst', 'ctrl', 'fuerza', 'fo'].map(function (k) { return [k, SERV[k].n, SERV[k].c]; }))
        .map(function (x) { return '<button type="button" data-s="' + x[0] + '" aria-pressed="' + (x[0] === catFiltro) + '">' + (x[2] ? '<i style="background:' + x[2] + '"></i>' : '') + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="kc-bus"><input type="search" id="kCatBus" placeholder="Buscar: código, AWG, mm², pares…" aria-label="Buscar cable"></div>' +
      '<div class="kc-lista" id="kCatLista"></div>' +
      '<div class="kc-pie">Diámetros exteriores aproximados de los catálogos citados en cada familia; fibra óptica según el catálogo «Cables de fibra óptica» de General Cable. Verificar con el catálogo vigente del fabricante.</div>';
    document.body.appendChild(tab); document.body.appendChild(p);
    function abrir(v) { p.classList.toggle('abierto', v); document.body.classList.toggle('kcat-on', v); tab.setAttribute('aria-expanded', String(v)); tab.hidden = v; guardarPref('reyengi-kcat', v ? '1' : '0'); if (v) pintarCatalogo(); }
    tab.addEventListener('click', function () { abrir(true); $('#kCatBus').focus(); });
    $('#kCatCerrar').addEventListener('click', function () { abrir(false); tab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('abierto') && !document.querySelector('dialog[open]')) abrir(false); });
    p.querySelector('.kc-chips').addEventListener('click', function (e) { var b = e.target.closest('button[data-s]'); if (!b) return; catFiltro = b.dataset.s; p.querySelectorAll('.kc-chips button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintarCatalogo(); });
    $('#kCatBus').addEventListener('input', function (e) { catTexto = e.target.value.trim().toLowerCase(); pintarCatalogo(); });
    $('#kCatLista').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-add]'); if (!b) return;
      var dc = actual(), id = b.dataset.add, ya = dc.cables.filter(function (c) { return c.cat === id && !c.tag; })[0];
      if (ya && e.shiftKey) ya.n = (+ya.n || 1) + 1; else dc.cables.push({ tag: '', cat: id, n: 1 });
      cambio(); var tr = b.closest('tr'); tr.classList.add('ok'); setTimeout(function () { tr.classList.remove('ok'); }, 700);
      $('#kCatDest').innerHTML = destino();
    });
    // abierto por defecto en pantallas anchas, salvo que el usuario lo haya cerrado
    var pref = leerPref('reyengi-kcat'); abrir(pref === null ? window.innerWidth >= 1500 : pref === '1');
    // al salir de la vista de canalizaciones se oculta la pestaña
    var sec = $('#v-cond'); if (sec && window.MutationObserver) new MutationObserver(function () { var v = !sec.hidden; tab.style.display = v ? '' : 'none'; if (!v) { p.classList.remove('abierto'); document.body.classList.remove('kcat-on'); } else if (leerPref('reyengi-kcat') === '1') abrir(true); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
  }
  function destino() { var dc = actual(); return 'Toca <b>+</b> para agregar al ducto <b>' + esc(dc.tag) + '</b> (' + dc.cables.length + ' cable' + (dc.cables.length === 1 ? '' : 's') + ').'; }
  function pintarCatalogo() {
    var L = $('#kCatLista'); if (!L || !$('#kCat').classList.contains('abierto')) return;
    $('#kCatDest').innerHTML = destino();
    var q = catTexto, servAnt = '', html = '';
    ORDEN_FAM.forEach(function (f) {
      var sv = servDe(f); if (catFiltro !== 'todos' && sv !== catFiltro) return;
      var items = CAT.filter(function (c) { return c.f === f && (!q || (FAM[f] + ' ' + c.cod + ' ' + c.desc + ' ' + c.awg + ' ø' + c.d).toLowerCase().indexOf(q) >= 0); });
      if (!items.length) return;
      if (sv !== servAnt) { servAnt = sv; html += '<div class="kc-serv" style="color:' + SERV[sv].c + '">' + SERV[sv].n + '</div>'; }
      var p = FAM[f].split(' · '), abierto = !!q || catFiltro !== 'todos';
      html += '<details style="--sc:' + COLF[f] + '"' + (abierto ? ' open' : '') + '><summary>' + miniCable(items[0], 26) + '<span class="nm">' + esc(p[0]) + (p[1] ? '<br><small>' + esc(p.slice(1).join(' · ')) + '</small>' : '') + '</span><span class="ct">' + items.length + '</span></summary>' +
        '<p class="kc-uso">' + esc(USO[f] || '') + (items[0].ap ? ' Apantallado.' : '') + '</p><table><tbody>' +
        items.map(function (c) {
          return '<tr><td>' + miniCable(c, 22) + '</td><td class="cd">' + esc(c.cod !== '—' ? c.cod : '') + '</td><td>' + esc(c.desc) + '</td><td class="n">' + (f !== 'otro' ? 'Ø ' + n1(c.d, 1) + '<br><small>' + n1(area(c.d), 0) + ' mm²</small>' : '') + '</td>' +
            '<td><button type="button" data-add="' + esc(c.id) + '" aria-label="Agregar ' + esc(c.desc) + '" title="Agregar al ducto">+</button></td></tr>';
        }).join('') + '</tbody></table></details>';
    });
    L.innerHTML = html || '<p class="kc-uso" style="margin:14px 4px">Sin cables para esa búsqueda.</p>';
  }


  // ── Tutorial retráctil (panel izquierdo) ──
  var TUT = [
    ['Crea o elige un ducto', '#kNuevo', 'Pulsa <b>+ Nuevo ducto</b> o toca uno en la tabla de ductos. Cada ducto es un tramo de canalización con sus propios cables. <b>Duplicar</b> copia el ducto activo con sus cables.'],
    ['Define el ducto', '#kForm', 'Escribe el <b>tag</b> y la <b>ruta</b> (por ejemplo JB-101 → sala eléctrica), elige el <b>tipo de tubería</b>, el <b>criterio de ocupación</b> (RIC N°04 Tabla 4.21: 50 % con un conductor y 33 % con dos o más) y la <b>condición del tramo</b>. Con <b>tamaño mínimo</b> fijas el menor diámetro aceptado y con <b>reserva futura</b> dejas holgura para cables que vendrán.'],
    ['Agrega cables desde el catálogo', '#kCatTab', 'Abre el <b>Catálogo de cables</b> en el borde derecho. Filtra por <b>Instrumentación</b>, <b>Control</b> o <b>Fuerza</b>, busca por código, AWG o número de pares y pulsa <b>+</b> para sumar el cable al ducto activo. Cada familia indica su uso típico.'],
    ['Ajusta la lista de cables', '#kCables', 'En <b>Cables del ducto</b> escribe el <b>tag del circuito</b>, cambia el cable en la lista desplegable o la <b>cantidad</b>. Para un cable fuera del catálogo elige «Otro cable» y escribe su diámetro. La ✕ quita el cable.'],
    ['Lee el resultado', '#kDibujo', 'El <b>corte</b> muestra cómo quedan los cables dentro del tubo y el espacio libre (verde rayado). La barra indica la <b>ocupación</b> frente al límite de la norma.'],
    ['Elige el tamaño', '#kTam', 'La fila <b>Utilizar ▶</b> es el menor tamaño que cumple la ocupación y en que los cables caben. Toca otra fila para ver cómo quedarían en ese diámetro.'],
    ['Revisa cómo se calcula', '#kPasos', 'En <b>Cómo se calcula</b> está el paso a paso: área de cada cable, porcentaje permitido, área mínima, tamaño comercial y espacio disponible. Los avisos señalan tramos largos, curvas o mezclas de servicios.'],
    ['Míralo en 3D', '#k3dBtn', 'Pulsa <b>Ver ducto en 3D</b>: arrastra para girar y usa la rueda para acercar. Los cables salen escalonados para ver cubierta, pantalla y conductores. Puedes quitar el corte, ocultar etiquetas o exportar un PNG.'],
    ['Exporta los entregables', '#kPdf', '<b>Imprimir / PDF (A3)</b> genera una lámina por ducto con corte, tabla y memoria. <b>DXF del corte</b> abre en AutoCAD, <b>Excel · memoria</b> entrega todos los ductos con sus cables y <b>Listado de canalizaciones</b> arma el listado del proyecto en Excel o PDF.'],
    ['Guarda tu proyecto', '#pGuardar', 'Escribe <b>Proyecto</b> y <b>Cliente</b> (salen en la lámina). <b>Guardar…</b> crea un archivo .reyconduit y <b>Abrir…</b> lo recupera en este u otro equipo. El trabajo también queda guardado en la app entre sesiones.'],
    ['Consulta la normativa', '#kNorTab', 'La pestaña <b>Normativa RIC N°04</b> muestra cada cláusula que aplica el cálculo, qué hace la app con ella y el texto literal del pliego. Puedes buscar por palabra.'],
    ['Licencia', '#pLic', 'El botón <b>Licencia</b> muestra la vigencia, el código de este equipo y cómo renovar. La app avisa antes del vencimiento.']
  ];
  function montarTutorial() {
    if ($('#kTut')) return;
    var pasos = TUT.filter(function (t) { var e = document.querySelector(t[1]); return e && !e.hidden; });
    var tab = document.createElement('button'); tab.type = 'button'; tab.id = 'kTutTab'; tab.textContent = 'Tutorial'; tab.setAttribute('aria-controls', 'kTut'); tab.setAttribute('aria-expanded', 'false');
    var p = document.createElement('aside'); p.id = 'kTut'; p.setAttribute('aria-label', 'Tutorial');
    p.innerHTML = '<div class="kt-cab"><b>Cómo se usa</b><button type="button" id="kTutCerrar" aria-label="Cerrar tutorial">✕</button></div>' +
      '<p class="kt-int">Dimensiona un ducto en ' + pasos.length + ' pasos. Pulsa <b>Mostrar</b> para ir al lugar de la pantalla.</p>' +
      '<ol class="kt-lista">' + pasos.map(function (t, i) { return '<li><div class="kt-n">' + (i + 1) + '</div><div><h3>' + t[0] + '</h3><p>' + t[2] + '</p><button type="button" data-ir="' + t[1] + '">Mostrar</button></div></li>'; }).join('') + '</ol>' +
      '<div class="kt-ref"><h3>Referencia rápida · RIC N°04 Tabla 4.21</h3><table><tbody><tr><td>1 conductor o cable</td><td><b>50 %</b></td></tr><tr><td>2 o más conductores</td><td><b>33 %</b></td></tr></tbody></table>' +
      '<p>Cada cable multiconductor cuenta como un conductor. Verifica los diámetros con el catálogo vigente del fabricante.</p></div>';
    document.body.appendChild(tab); document.body.appendChild(p);
    function abrir(v) { p.classList.toggle('abierto', v); tab.setAttribute('aria-expanded', String(v)); tab.hidden = v; guardarPref('reyengi-ktut', v ? '1' : '0'); }
    tab.addEventListener('click', function () { abrir(true); $('#kTutCerrar').focus(); });
    $('#kTutCerrar').addEventListener('click', function () { abrir(false); tab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('abierto') && !document.querySelector('dialog[open]')) abrir(false); });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ir]'); if (!b) return;
      var sel = b.dataset.ir, el = document.querySelector(sel); if (!el) return;
      if (sel === '#kNorTab') { el.click(); return; }
      if (sel === '#kCatTab') { el.hidden ? $('#kCat').classList.add('abierto') : el.click(); el = $('#kCat'); }
      if (window.innerWidth < 900) abrir(false);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('kt-foco'); void el.offsetWidth; el.classList.add('kt-foco');
      setTimeout(function () { el.classList.remove('kt-foco'); }, 2600);
      p.querySelectorAll('li').forEach(function (li) { li.classList.toggle('visto', li.contains(b) || li.classList.contains('visto')); });
    });
    // se abre solo la primera vez
    var pt = leerPref('reyengi-ktut'); abrir(pt === null ? !!document.getElementById('pGuardar') : pt === '1'); // en la app de escritorio se abre solo la primera vez
    var sec = $('#v-cond'); if (sec && window.MutationObserver) new MutationObserver(function () { var v = !sec.hidden; tab.style.display = v ? '' : 'none'; if (!v) p.classList.remove('abierto'); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
    if (sec && sec.hidden) tab.style.display = 'none';
  }


  // ── Normativa aplicada: RIC N°04 (panel retráctil) ──
  // Extractos literales del pliego (Res. Ex. N°33.877 de 30/12/2020, SEC) de las cláusulas que usa el cálculo.
  var NORMA = [
    ['Tabla N°4.21 · 7.16.1.14', 'Ocupación máxima de la tubería', 'Límite de ocupación del criterio RIC: 50 % con un conductor, 33 % con dos y con tres o más.',
      '7.16.1.14 Para fijar la cantidad máxima de conductores en una tubería se aceptará que el conductor o haz de conductores, incluyendo la aislación de cada uno de ellos, ocupe un porcentaje de la sección transversal de la tubería que esté de acuerdo con lo prescrito por la tabla Nº4.21.\nTabla Nº4.21 · Porcentaje de sección transversal de la tubería ocupada por los conductores: 1 conductor 50 %; 2 conductores 33 %; 3 o más 33 %.'],
    ['Tabla N°4.21 · condiciones', 'Niples entre gabinetes y conductor de tierra', 'Condición «Tubería de unión entre gabinetes de hasta 1 m» → 60 %. El conductor de tierra se suma como un cable más.',
      'Condiciones de aplicación de la tabla Nº4.21:\n• Cuando se trata de tuberías de unión de gabinetes de tableros o similares, de una longitud no superior a 1 m se podrá considerar un porcentaje de área de hasta el 60 %.\n• Cuando en el cálculo de la cantidad de conductores de un determinado tipo de tubería se obtengan valores decimales, sólo se aproximará al entero superior si el decimal es de 0,8 o mayor.\n• Para combinación de conductores de diferentes secciones nominales se respetarán los valores indicados en la tabla Nº4.21, usando las dimensiones de conductores y tuberías indicadas en las tablas Nº4.17 a Nº4.20, respectivamente.\n• Cuando el conductor de tierra forme parte del haz de conductores deberá incluirse en el cálculo.'],
    ['7.16.1.13', 'Largo y curvas del tramo', 'Aviso cuando el tramo supera 20 m o tiene más de dos curvas.',
      '7.16.1.13 Los valores de las tablas Nº4.17 a N°4.20, serán válidos para tramos de tubería de hasta 20 m de largo, rectos o con no más de dos curvas con una desviación total no superior a 180º. Para tramos de distancias superiores o para desviaciones mayores a las indicadas se deberá colocar cajas de paso intermedias.'],
    ['7.16.1.6', 'Desviación entre cajas', 'Define la condición «Tramo normal» (desviación ≤ 180°); la desviación no se verifica automáticamente.',
      '7.16.1.6 No deberá existir una desviación mayor de 180 grados en un tramo de tubería entre dos cajas o accesorios. En caso de existir la necesidad de tener una mayor desviación se deberán colocar cajas intermedias. Para distancias entre cajas de derivación no superiores a 5,0 m se aceptará una desviación de 270º sin cajas intermedias.'],
    ['7.16.1.7', 'Registros en tramos rectos', 'Aviso cuando un tramo recto supera 15 m.',
      '7.16.1.7 Deberá ser posible la fácil introducción y retirada de los conductores en la tubería después de colocados y fijados éstos y sus accesorios, disponiendo para ello los registros que se consideren convenientes, que en tramos rectos no estarán separados entre sí más de 15 m.'],
    ['5.27', 'Un circuito por tubería', 'Aviso cuando el ducto lleva más de un cable de fuerza.',
      '5.27 En una misma tubería sólo podrán llevarse los conductores pertenecientes a un mismo circuito. Se exceptúan de esta disposición los conductores canalizados en pilares de servicio, bandejas, escalerillas, canastillos o canaletas, los que estarán afectos a las disposiciones de las secciones 7.7, 7.8, 7.10, 7.11, 7.12 y 7.13 de este pliego, respectivamente.'],
    ['7.1.7', 'Separación de fuerza y control o señales', 'Aviso cuando el ducto mezcla instrumentación con control o fuerza.',
      '7.1.7 Las canalizaciones eléctricas y de comunicación o control, instaladas al interior de un mismo conducto, shaft o canal de una construcción, se deberán separar y distanciar adecuadamente para evitar influencias electromagnéticas.'],
    ['7.16.2.1', 'Tubería metálica en corriente alterna', 'No se verifica automáticamente: al canalizar fuerza en tubería metálica, lleva todas las fases y el neutro en el mismo ducto.',
      '7.16.2.1 En alimentaciones de corriente alterna canalizadas en tuberías metálicas deberá evitarse el calentamiento de éstas debido a la inducción electromagnética, colocando todos los conductores, incluido el neutro cuando corresponda, en una misma tubería.'],
    ['7.16.1.15', 'Más de tres conductores', 'No se calcula aquí: la app dimensiona la ocupación; la capacidad de corriente se corrige aparte con la Tabla N°4.6.',
      '7.16.1.15 En tuberías que lleven más de tres conductores se deberán aplicar los factores de corrección de capacidad de transporte de corriente indicados en la tabla Nº4.6.'],
    ['7.9.7.1 · Tabla N°4.29', 'Ducto subterráneo', 'Condición «Ducto subterráneo»: tamaño mínimo de 25 mm y, con más de 10 conductores o secciones distintas, ocupación de 25 %.',
      '7.9.7.1 El diámetro mínimo del ducto de una canalización subterránea no debe ser inferior a 25 mm.\nTabla Nº4.29, nota: Para más de 10 conductores por tubo o para conductores o cables de secciones diferentes a instalar en el mismo tubo, su sección interior será como mínimo, igual a 4 veces la sección ocupada por los conductores.'],
    ['7.9.7.8 a 7.9.7.10', 'Distancia entre cámaras', 'Aviso cuando el tramo subterráneo supera 90 m.',
      '7.9.7.8 Se aceptará una distancia máxima de recorrido entre cámaras de 90 m, con un máximo de dos curvas y una desviación por cada curva no superior a 60º con respecto a la línea recta y radios de curvatura de 10 veces el diámetro del ducto respectivo como mínimo. Si existen más de dos curvas o una desviación superior a la señalada se deberá colocar cámaras intermedias.\n7.9.7.9 En tramos rectos se aceptará, colocar cámaras hasta, una distancia máxima de 120 m entre ellas. El ducto que se utilice en estos casos será de un diámetro mínimo de 50 mm.\n7.9.7.10 En tramos cuyo recorrido no sea superior a 20 m se aceptará que los ductos formen una U, sin colocar cámaras.'],
    ['7.10.19', 'Cuando no cabe: bandeja', 'Sugerencia cuando ningún tamaño de tubería alcanza.',
      '7.10.19 Podrán llevarse la cantidad de conductores o cables multiconductores activos tales que, incluyendo su aislación, no ocupen más del 40 % de la sección transversal de la bandeja. Se deberá aplicar los factores de corrección contenidos en la tabla Nº4.6.']
  ];
  function montarNorma() {
    if ($('#kNor')) return;
    var tab = document.createElement('button'); tab.type = 'button'; tab.id = 'kNorTab'; tab.textContent = 'Normativa RIC N°04'; tab.setAttribute('aria-controls', 'kNor'); tab.setAttribute('aria-expanded', 'false');
    var p = document.createElement('aside'); p.id = 'kNor'; p.setAttribute('aria-label', 'Normativa aplicada');
    var pdf = !!window.reyNorma;
    p.innerHTML = '<div class="kt-cab"><b>Normativa aplicada</b><button type="button" id="kNorCerrar" aria-label="Cerrar normativa">✕</button></div>' +
      '<div class="kn-ficha"><div class="kn-sigla">RIC N°04</div><div><b>Conductores, materiales y sistemas de canalización</b><br>Pliego técnico normativo de la SEC · Resolución Exenta N°33.877 de 30/12/2020 · Fuente reglamentaria: D.S. N°8 de 2019 del Ministerio de Energía.</div></div>' +
      (pdf ? '<div class="kn-pdf"><button type="button" id="kNorPdf">Abrir el pliego completo (PDF oficial SEC)</button></div>' : '') +
      '<div class="kn-busca"><input type="search" id="kNorBus" placeholder="Buscar en las cláusulas: tierra, 20 m, subterráneo…" aria-label="Buscar en la normativa"></div>' +
      '<div class="kt-lista" id="kNorLista">' + NORMA.map(function (n, i) {
        return '<details class="kn-item"' + (i < 2 ? ' open' : '') + ' data-q="' + esc((n[0] + ' ' + n[1] + ' ' + n[2] + ' ' + n[3]).toLowerCase()) + '"><summary><span class="kn-cl">' + esc(n[0]) + '</span><span class="kn-t">' + esc(n[1]) + '</span></summary>' +
          '<p class="kn-app"><b>En la app:</b> ' + esc(n[2]) + '</p><blockquote>' + esc(n[3]).replace(/\n/g, '<br>') + '</blockquote></details>';
      }).join('') + '</div>' +
      '<p class="kn-pie">Extractos literales del pliego vigente a la fecha de esta versión. Verifica en el sitio de la SEC si existen modificaciones posteriores. La app no reemplaza el criterio del proyectista ni la revisión del inspector.</p>';
    document.body.appendChild(tab); document.body.appendChild(p);
    function abrir(v) { p.classList.toggle('abierto', v); tab.setAttribute('aria-expanded', String(v)); tab.hidden = v; if (v) { var t = $('#kTut'); if (t && t.classList.contains('abierto')) $('#kTutCerrar').click(); } }
    tab.addEventListener('click', function () { abrir(true); $('#kNorBus').focus(); });
    $('#kNorCerrar').addEventListener('click', function () { abrir(false); tab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('abierto') && !document.querySelector('dialog[open]')) abrir(false); });
    if (pdf) $('#kNorPdf').addEventListener('click', function () { window.reyNorma.abrir(); });
    $('#kNorBus').addEventListener('input', function (e) {
      var q = e.target.value.trim().toLowerCase();
      p.querySelectorAll('.kn-item').forEach(function (d) { var ok = !q || d.dataset.q.indexOf(q) >= 0; d.hidden = !ok; if (q && ok) d.open = true; });
    });
    document.addEventListener('click', function (e) { if (e.target && e.target.id === 'kTutTab') abrir(false); });
    var sec = $('#v-cond'); if (sec && window.MutationObserver) new MutationObserver(function () { var v = !sec.hidden; tab.style.display = v ? '' : 'none'; if (!v) p.classList.remove('abierto'); }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
    if (sec && sec.hidden) tab.style.display = 'none';
  }

  // ── Visor 3D del ducto con sus conductores ──
  var L3 = null, v3 = null;
  var RUTA_3D = (function () { var s = document.currentScript && document.currentScript.src; return window.RE_LIB3D || (s ? new URL('../lib3d.js', s).href : '../lib3d.js'); })();
  function cargar3d(cb) {
    if (window.__LIB) { if (window.__VPLUS) window.__VPLUS(); return cb(window.__LIB); }
    var s = document.createElement('script'); s.src = RUTA_3D; s.onerror = function () { cb(null); };
    s.onload = function () { // herramientas de exploración comunes (vistas, estilos, corte); si no cargan, el visor abre igual
      if (window.__VPLUS) { window.__VPLUS(); return cb(window.__LIB); }
      var p = document.createElement('script'); p.src = RUTA_3D.replace(/lib3d\.js(\?.*)?$/, 'visor-plus.js'); p.onload = p.onerror = function () { cb(window.__LIB); }; document.head.appendChild(p);
    };
    document.head.appendChild(s);
  }
  function corePos(d, k) { // misma disposición que el corte 2D
    var di = d * 0.74, m = 0, out = [], n = 0; while (1 + 3 * m * (m + 1) < k.nc) m++;
    if (k.nc === 1) return [{ x: 0, y: 0, r: d * 0.3, c: k.fo ? '#6cc5ee' : '#d18b47', cu: !k.fo }];
    if (k.nc === 2 || k.nc === 3) { for (var j = 0; j < k.nc; j++) { var a = j / k.nc * 2 * PI + PI / 2, rr = di * (k.nc === 2 ? 0.25 : 0.28); out.push({ x: rr * Math.cos(a), y: rr * Math.sin(a), r: di * (k.nc === 2 ? 0.24 : 0.21), c: COLCORE[j % 3] }); } return out; }
    var dc = Math.min(di / (2 * m + 1) * 0.92, di * 0.48);
    for (var ring = 0; ring <= m && n < k.nc; ring++) { var cnt = ring === 0 ? 1 : 6 * ring; for (var q = 0; q < cnt && n < k.nc; q++, n++) { var ang = q / cnt * 2 * PI + PI / 2; out.push({ x: ring * dc * Math.cos(ang), y: ring * dc * Math.sin(ang), r: dc / 2 * 0.92, c: COLCORE[n % (k.f === 'mpar' || k.f === 'mtri' ? 2 : COLCORE.length)] }); } }
    return out;
  }
  function abrir3d() {
    if (!ultimo || !ultimo.s) return;
    cssExtra();
    var dlg = $('#k3d');
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'k3d'; dlg.setAttribute('aria-labelledby', 'k3dTit');
      dlg.innerHTML = '<div class="k3-cab"><b id="k3dTit"></b><span class="k3-modo" role="group" aria-label="Qué se muestra"><button type="button" data-m="sec" aria-pressed="true">Sección del ducto</button><button type="button" data-m="tra" aria-pressed="false">Trazado con curvas</button></span><button type="button" data-t="corte" aria-pressed="true">Corte</button><button type="button" data-t="etq" aria-pressed="true">Etiquetas</button><button type="button" data-t="giro" aria-pressed="false">Girar</button><button type="button" data-t="frente">Vista de frente</button><button type="button" data-t="png">PNG</button><button type="button" id="k3dCerrar">Cerrar</button></div>' +
        '<div class="k3-cuerpo"><div class="k3-esc" id="k3dEsc"><div class="k3-carga">Cargando visor 3D…</div></div><div class="k3-ley" id="k3dLey"></div></div>';
      document.body.appendChild(dlg);
      $('#k3dCerrar').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('close', cerrar3d);
      dlg.querySelector('.k3-cab').addEventListener('click', function (e) {
        var bm = e.target.closest('button[data-m]'); if (bm) { modo3 = bm.dataset.m; pintar3d(); return; }
        var b = e.target.closest('button[data-t]'); if (!b || !v3) return; var t = b.dataset.t;
        if (t === 'frente') { v3.frente(); return; }
        if (t === 'png') { v3.png(); return; }
        var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
        if (t === 'corte') v3.corte(on); else if (t === 'etq') v3.etiquetas(on); else v3.controls.autoRotate = on;
      });
    }
    dlg.showModal(); pintar3d();
  }
  var modo3 = 'sec';   // 'sec': sección del ducto con sus cables · 'tra': trazado del tramo con su largo, curvas y radios de curvatura
  function pintar3d() {
    var dlg = $('#k3d'); if (!dlg || !ultimo) return; var r = ultimo.r, s = ultimo.s, dc = actual(), tra = modo3 === 'tra';
    [].forEach.call(dlg.querySelectorAll('.k3-modo button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === modo3)); });
    var bc = dlg.querySelector('[data-t=corte]'); bc.hidden = tra; [['corte', true], ['etq', true], ['giro', false]].forEach(function (x) { var q = dlg.querySelector('[data-t=' + x[0] + ']'); if (q) q.setAttribute('aria-pressed', String(x[1])); }); dlg.querySelector('[data-t=frente]').textContent = tra ? 'Encuadrar' : 'Vista de frente';
    $('#k3dTit').innerHTML = esc(dc.tag) + ' · ' + esc(r.T.c) + ' Ø ' + esc(s[0]) + '<small>' + r.n + ' cable' + (r.n === 1 ? '' : 's') + ' · ocupación ' + n1(r.suma / area(s[2]) * 100, 1) + ' % (límite ' + r.lim + ' %) · Ø int. ' + n1(s[2], 1) + ' mm</small>';
    if (tra) { var cu = curvatura(dc, r, s), L = parseFloat(String(dc.largo).replace(',', '.')), N = Math.max(0, Math.round(parseFloat(dc.curvas) || 0)), ch = verificar(dc, r, s).filter(function (x) { return /^7\.16\.1\.(13|7)$|^7\.9\.7\.8$/.test(x.ref); })[0];
      $('#k3dLey').innerHTML = '<h4 class="k3-h">Tramo</h4><dl class="k3-dl"><dt>Largo</dt><dd>' + (L > 0 ? n1(L, 1) + ' m' : 'sin dato (se dibuja referencial)') + '</dd><dt>Curvas</dt><dd>' + N + ' de 90°</dd></dl>' +
        (ch ? '<p class="k3-' + (ch.sev === 'ok' ? 'ok' : ch.sev === 'warn' ? 'av' : 'mal') + '">' + (ch.sev === 'ok' ? '✓ ' : ch.sev === 'warn' ? '! ' : '✗ ') + esc(ch.txt) + (ch.sug && ch.sev !== 'ok' ? '<br><b>Sugerencia:</b> ' + esc(ch.sug) : '') + '</p>' : '') +
        '<h4 class="k3-h">Radio de curvatura</h4><p class="k3-r">Curvar con radio no menor a <b>' + (cu.r ? cm(cu.r) : '—') + '</b><br>manda ' + (cu.manda === 'cable' ? 'el cable ' + esc(cu.cable.tag) : 'la tubería') + '</p>' +
        '<dl class="k3-dl"><dt>Tubería</dt><dd>' + (cu.ducto ? cm(cu.ducto) : '—') + '<small>' + esc(cu.refDucto) + '</small></dd></dl>' +
        '<h4 class="k3-h">Cables · RIC N°04 6.2.8</h4><ol class="k3-cab">' + cu.cables.map(function (c) { return '<li><b>' + esc(c.tag) + '</b> · ' + cm(c.r) + '<small>' + esc(c.clase) + ': ' + c.como + '</small></li>'; }).join('') + '</ol>' +
        (function () { var so = soportacion(dc, r, s); return '<h4 class="k3-h">Materiales de referencia</h4>' + (so.items.length ? '<table class="k3-mat"><tbody>' + so.items.map(function (i) { return '<tr><td>' + i.cant + ' ' + i.un + '</td><td>' + esc(i.desc) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
          (so.sep ? '<p class="k3-ayuda">' + esc(so.refSep) + ', más una abrazadera a cada lado de cada caja.' + (so.nSop ? '' : ' Indica el largo del tramo para contar los soportes.') + '</p>' : '<p class="k3-ayuda">' + esc(so.notaSop || '') + '</p>') +
          (so.caja ? '<p class="k3-ayuda">' + (so.cajas ? '' : 'Este tramo no necesita caja de paso; si se intercala una: ' + esc(so.caja.n) + '. ') + esc(so.caja.ref) + '.</p>' : '') + '<p class="k3-ayuda">Medidas según ' + MJM + '. Cantidades referenciales: confirmar en terreno y con el fabricante.</p>'; })() +
        '<p class="k3-ayuda">Flexible 4 ×, alambre o cableado concéntrico 8 ×, apantallado 12 × el diámetro exterior. La fibra óptica usa el radio mínimo que indica su fabricante. Tubería metálica según Tabla N°4.22 si el fabricante no indica otro radio.</p>' +
        '<p class="k3-ayuda">El diámetro del tubo se dibuja ampliado para poder verlo; los largos y las curvas mantienen su proporción. Arrastra para girar y usa la rueda para acercar. <b>Haz clic en una abrazadera o en una caja</b> para ver su detalle de montaje.</p>';
    } else
    $('#k3dLey').innerHTML = '<ol>' + r.lista.map(function (x) { var sv = servDe(x.k.f); return '<li><span class="kserv" style="background:' + SERV[sv].c + '">' + SERV[sv].n.slice(0, 4).toUpperCase() + '</span><b>' + esc(x.c.tag || '(sin tag)') + '</b><br>' + esc((x.k.cod !== '—' ? x.k.cod + ' ' : '') + x.k.desc) + ' · Ø ' + n1(x.d, 1) + ' mm</li>'; }).join('') + '</ol>' +
      '<p class="k3-ayuda">Arrastra para girar, rueda o pellizco para acercar, clic derecho o dos dedos para desplazar. Los cables salen escalonados por el extremo para ver cubierta, pantalla y conductores.</p>';
    cargar3d(function (L3) {
      if (!L3) { $('#k3dEsc').innerHTML = '<div class="k3-carga">No se pudo cargar el visor 3D.</div>'; return; }
      if (!dlg.open) return;
      montar3d(L3, r, s, dc, modo3);
    });
  }
  function cerrar3d() { if (!v3) return; cancelAnimationFrame(v3.raf); v3.ro.disconnect(); v3.renderer.dispose(); v3.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); v3 = null; $('#k3dEsc').innerHTML = ''; }
  function montar3d(L, r, s, dc, modo) {
    cerrar3d();
    var THREE = L.THREE, esc3 = $('#k3dEsc'); esc3.innerHTML = '';
    var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('tabindex', '0'); renderer.domElement.setAttribute('aria-label', 'Modelo 3D del ducto ' + dc.tag + ' con sus cables. Arrastra para girar.');
    esc3.appendChild(renderer.domElement);
    var lr = new L.CSS2DRenderer(); lr.domElement.className = 'labels'; esc3.appendChild(lr.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1a2b);
    var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new L.RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.6));
    var sol = new THREE.DirectionalLight(0xffffff, 1.5); sol.position.set(200, 300, 260); scene.add(sol);
    if (modo === 'tra') return trazado3d(L, r, s, dc, renderer, lr, scene, esc3);
    var Re = s[1] / 2, Ri = s[2] / 2, Lc = Math.max(160, Re * 9), x0 = -Lc / 2, x1 = Lc / 2;
    var metal = /PVC|HDPE|PEAD/i.test(r.T.c) ? new THREE.MeshStandardMaterial({ color: 0x8d969e, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: 0xb9c1c8, roughness: 0.32, metalness: 0.85, side: THREE.DoubleSide });
    var tubo = new THREE.Group(), cortado = true;
    function armarTubo(corte) {
      while (tubo.children.length) { var o = tubo.children.pop(); o.geometry.dispose(); }
      var t0 = corte ? PI * 1.1 : 0, tl = corte ? PI * 1.5 : 2 * PI; // corte de 90° hacia el observador
      var sh = new THREE.Shape(); sh.absarc(0, 0, Re, t0, t0 + tl, false); sh.absarc(0, 0, Ri, t0 + tl, t0, true);
      var g = new THREE.ExtrudeGeometry(sh, { depth: Lc, bevelEnabled: false, curveSegments: 72 });
      g.rotateY(PI / 2); g.translate(x0, 0, 0);
      tubo.add(new THREE.Mesh(g, metal));
      // copla con hilo en el extremo trasero (referencial)
      var cp = new THREE.Shape(); cp.absarc(0, 0, Re * 1.12, t0, t0 + tl, false); cp.absarc(0, 0, Re, t0 + tl, t0, true);
      var gc = new THREE.ExtrudeGeometry(cp, { depth: Re * 1.4, bevelEnabled: false, curveSegments: 72 }); gc.rotateY(PI / 2); gc.translate(x0 - Re * 0.2, 0, 0);
      tubo.add(new THREE.Mesh(gc, metal));
    }
    armarTubo(true); scene.add(tubo);
    var pk = r.elegido && r.elegido.s === s ? r.elegido.pack : empacar(Ri, r.lista.map(function (x) { return x.d / 2; }));
    var cables = new THREE.Group(), etqs = [], matC = {};
    function mat(col, rough, met) { var k = col + '|' + rough + '|' + met; return matC[k] || (matC[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: rough, metalness: met })); }
    function cil(rad, a, b, m, y, z) { var g = new THREE.CylinderGeometry(rad, rad, b - a, 28); g.rotateZ(PI / 2); var o = new THREE.Mesh(g, m); o.position.set((a + b) / 2, y, z); return o; }
    var extra = Math.max(18, Re * 0.9);
    r.lista.forEach(function (x, i) {
      var p = pk.pos[i]; if (!p || p.fuera) return;
      var y = p.y, z = p.x, d = x.d, rc = d / 2 * 0.985, k = x.k;
      var paso = (i % 4) * Re * 0.18; // salida escalonada
      var xf = x1 + extra * 0.4 + paso, xs = xf + 4 + d * 0.15, xc = xs + d * 0.9 + extra * 0.5;
      cables.add(cil(rc, x0 - Re * 0.15, xf, mat(COLF[k.f], 0.7, 0.02), y, z));
      // pantalla (apantallados) y relleno
      if (k.ap) cables.add(cil(d * 0.39, xf, xs, mat('#c9ced4', 0.25, 0.9), y, z));
      corePos(d, k).forEach(function (c, j) {
        var cy = y + c.y, cz = z + c.x, xe = xc + (j % 3) * d * 0.12;
        cables.add(cil(c.r, xf, xe, c.cu ? mat('#2b2b2b', 0.6, 0) : mat(c.c, 0.45, 0.02), cy, cz));
        cables.add(cil(c.r * (k.fo ? 0.3 : 0.55), xe, xe + Math.max(3, d * 0.25), k.fo ? mat('#cfeeff', 0.15, 0.1) : mat('#d18b47', 0.25, 1), cy, cz));
      });
      var div = document.createElement('div'); div.className = 'k3-lbl'; div.textContent = (i + 1) + (x.c.tag ? ' · ' + x.c.tag : '');
      var lb = new L.CSS2DObject(div); lb.position.set(xc + d * 0.6, y + d * 0.55, z); cables.add(lb); etqs.push(lb);
    });
    scene.add(cables);
    var camera = new THREE.PerspectiveCamera(32, 1, 0.5, 20000);
    var controls = new L.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotateSpeed = 1.2;
    function frente() { camera.position.set(x1 + Re * 7.5, Re * 2.6, Re * 4.2); controls.target.set(x1 * 0.55, 0, 0); controls.update(); }
    frente();
    var ro = new ResizeObserver(function () { var w = esc3.clientWidth, h = esc3.clientHeight; if (!w || !h) return; renderer.setSize(w, h); lr.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); });
    ro.observe(esc3);
    v3 = { renderer: renderer, scene: scene, controls: controls, ro: ro, raf: 0,
      frente: frente,
      corte: function (on) { cortado = on; armarTubo(on); },
      etiquetas: function (on) { etqs.forEach(function (e) { e.visible = on; e.element.style.display = on ? '' : 'none'; }); },
      png: function () { renderer.render(scene, camera); var a = document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download = 'Ducto_' + dc.tag.replace(/[\\/:*?"<>|]+/g, '-') + '_3D.png'; document.body.appendChild(a); a.click(); a.remove(); } };
    (function loop() { if (!v3 || v3.renderer !== renderer) return; v3.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); lr.render(scene, camera); })();
  }

  // Trazado del tramo: el ducto con su largo y sus curvas de 90°, dibujadas con el radio de curvatura recomendado.
  // Largos y curvas van en proporción; el diámetro del tubo se amplía para que se vea. Unidades de la escena: milímetros.
  function trazado3d(L, r, s, dc, renderer, lr, scene, esc3) {
    var THREE = L.THREE, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
    var cu = curvatura(dc, r, s), Lm = parseFloat(String(dc.largo).replace(',', '.')), N = Math.min(12, Math.max(0, Math.round(parseFloat(dc.curvas) || 0)));
    var Ltot = (Lm > 0 ? Lm : 3 * (N + 1)) * 1000, Re = s[1] / 2, Rv = Math.max(Re, Ltot / 260), Rb = Math.max(cu.r || Re * 6, Rv * 2.4);
    var recto = Math.max(Rv * 3, (Ltot - N * PI / 2 * Rb) / (N + 1));
    var pts = [V(0, 0, 0)], p = V(0, 0, 0), dX = V(1, 0, 0), dZ = V(0, 0, 1), d0 = dX, marcas = [];
    for (var i = 0; i <= N; i++) {
      var a = p.clone(); p = p.clone().addScaledVector(d0, recto); pts.push(p.clone()); marcas.push({ t: 'recto', p: a.clone().lerp(p, 0.5), txt: n1(recto / 1000, recto >= 10000 ? 1 : 2) + ' m' });
      if (i === N) break;
      var d1 = d0 === dX ? dZ : dX, c0 = p.clone();
      for (var k = 1; k <= 14; k++) { var t = k / 14 * PI / 2; pts.push(c0.clone().addScaledVector(d0, Rb * Math.sin(t)).addScaledVector(d1, Rb * (1 - Math.cos(t)))); }
      marcas.push({ t: 'curva', p: c0.clone().addScaledVector(d0, Rb * 0.7).addScaledVector(d1, Rb * 0.3), txt: 'Curva ' + (i + 1) + ' · R ≥ ' + (cu.r ? cm(cu.r) : '—') });
      p = pts[pts.length - 1].clone(); d0 = d1;
    }
    var camino = new THREE.CurvePath(); for (var j = 1; j < pts.length; j++) camino.add(new THREE.LineCurve3(pts[j - 1], pts[j]));
    var metal = /PVC|HDPE|PEAD/i.test(r.T.c) ? new THREE.MeshStandardMaterial({ color: 0x8d969e, roughness: 0.55, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: 0xb9c1c8, roughness: 0.32, metalness: 0.85 });
    var g = new THREE.Group(), etqs = [];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(camino, Math.min(1200, pts.length * 6), Rv, 20, false), metal));
    function etiqueta(pos, txt, cls) { var div = document.createElement('div'); div.className = 'k3-lbl' + (cls ? ' ' + cls : ''); div.textContent = txt; if (cls === 'k3-sug' || cls === 'k3-sop') { div.title = 'Ver detalle de montaje'; div.addEventListener('click', function () { ver(cls === 'k3-sug' ? 'caja' : 'sop'); }); } var lb = new L.CSS2DObject(div); lb.position.copy(pos); lb.position.y += Rv * 2.2; g.add(lb); etqs.push(lb); }
    // extremos (cajas o gabinetes) y cajas de paso sugeridas por la verificación
    var mCaja = new THREE.MeshStandardMaterial({ color: 0x4a5f78, roughness: 0.6, metalness: 0.3 }), mPaso = new THREE.MeshStandardMaterial({ color: 0xFF8C32, roughness: 0.5, metalness: 0.2 }), lado = Rv * 5;
    [[pts[0], 'Inicio'], [pts[pts.length - 1], 'Fin · ' + (Lm > 0 ? n1(Lm, 1) + ' m' : 'largo sin dato')]].forEach(function (e) { var m = new THREE.Mesh(new THREE.BoxGeometry(lado, lado, lado), mCaja); m.position.copy(e[0]); g.add(m); etiqueta(e[0].clone().setY(lado * 0.4), e[1]); });
    var so = soportacion(dc, r, s), cajas = so.cajas, esk = Rv / Re, cd = so.caja ? so.caja.d : [250, 150, 100], pick = [];
    function ver(tipo) { var d = tipo === 'caja' ? detCaja(so, s, r.T, dc) : detSoporte(so, s, r.T), box = esc3.querySelector('.k3-det'); if (!box) { box = document.createElement('div'); box.className = 'k3-det'; esc3.appendChild(box); box.addEventListener('click', function (e) { if (e.target.closest('[data-x]')) box.remove(); }); }
      box.innerHTML = '<div class="k3-dcab"><b>' + esc(d.t) + '</b><button type="button" data-x="1" aria-label="Cerrar detalle">Cerrar</button></div>' + d.svg + '<table class="k3-dt"><tbody>' + d.filas.map(function (f) { return '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</tbody></table>'; }
    for (var q = 1; q <= cajas; q++) { var u = q / (cajas + 1), pc = camino.getPointAt(u), tg = camino.getTangentAt(u), mb = new THREE.Mesh(new THREE.BoxGeometry(cd[1] * esk, cd[2] * esk, cd[0] * esk), mPaso); mb.position.copy(pc); mb.rotation.y = Math.atan2(tg.x, tg.z); mb.userData.det = 'caja'; pick.push(mb); g.add(mb);
      var tp = new THREE.Mesh(new THREE.BoxGeometry(cd[1] * esk * 1.06, cd[2] * esk * 0.08, cd[0] * esk * 1.06), mCaja); tp.position.copy(pc); tp.position.y += cd[2] * esk * 0.54; tp.rotation.y = mb.rotation.y; g.add(tp);
      etiqueta(pc.clone().setY(cd[2] * esk * 0.6), (dc.cond === 'subt' ? 'Cámara · ' : 'Caja · ') + cd[0] + 'x' + cd[1] + 'x' + cd[2], 'k3-sug'); }
    // soportes: abrazadera sobre un tramo de riel, repartidos a la distancia máxima permitida
    if (so.nSop) { var nS = Math.min(so.nSop, 300), gA = new THREE.TorusGeometry(Rv * 1.18, Rv * 0.2, 8, 20), gR = new THREE.BoxGeometry(Rv * 6, Rv * 0.9, Rv * 0.9), mA = new THREE.MeshStandardMaterial({ color: 0xE8A317, roughness: 0.4, metalness: 0.6 }), mR = new THREE.MeshStandardMaterial({ color: 0x7f8a94, roughness: 0.45, metalness: 0.7 });
      for (var w = 0; w < nS; w++) { var uu = (w + 0.5) / nS, ps = camino.getPointAt(uu), ts = camino.getTangentAt(uu), ry = Math.atan2(ts.x, ts.z);
        var ab = new THREE.Mesh(gA, mA); ab.position.copy(ps); ab.rotation.y = ry; ab.userData.det = 'sop'; pick.push(ab); g.add(ab);
        var ri = new THREE.Mesh(gR, mR); ri.position.copy(ps); ri.position.y -= Rv * 1.5; ri.rotation.y = ry; ri.userData.det = 'sop'; pick.push(ri); g.add(ri); }
      var p0 = camino.getPointAt(0.5 / nS); etiqueta(p0.clone().setY(-Rv * 5), 'Abrazadera ' + so.abz.tipo.split(' ')[0] + ' ' + so.abz.med + ' sobre riel · cada ' + n1(so.sep, 2) + ' m', 'k3-sop'); }
    marcas.forEach(function (m) { etiqueta(m.p, m.txt, m.t === 'curva' ? 'k3-cur' : ''); });
    var caja = new THREE.Box3().setFromPoints(pts), cen = caja.getCenter(V(0, 0, 0)), tam = caja.getSize(V(0, 0, 0)), D = Math.max(tam.x, tam.z, Rv * 20);
    var rej = new THREE.GridHelper(D * 1.6, 16, 0x2c4563, 0x1b2f47); rej.position.set(cen.x, -Rv * 3, cen.z); g.add(rej);
    scene.add(g);
    var camera = new THREE.PerspectiveCamera(32, 1, D / 200, D * 40);
    var controls = new L.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotateSpeed = 1.2;
    var Dg = Math.max(Math.hypot(tam.x, tam.z), Rv * 20); function frente() { camera.position.set(cen.x - Dg * 0.2, Dg * 1.3, cen.z + Dg * 1.35); controls.target.copy(cen); controls.update(); }
    frente();
    // clic en una abrazadera, riel o caja: abre su detalle de montaje (no cuenta si fue un arrastre para girar)
    var ray = new THREE.Raycaster(), pt = new THREE.Vector2(), ini = null, cv = renderer.domElement;
    function toca(e) { var b = cv.getBoundingClientRect(); pt.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(pt, camera); var h = ray.intersectObjects(pick, false)[0]; return h ? h.object.userData.det : null; }
    cv.addEventListener('pointerdown', function (e) { ini = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', function (e) { if (!ini || Math.abs(e.clientX - ini[0]) + Math.abs(e.clientY - ini[1]) > 6) return; var t = toca(e); if (t) ver(t); });
    cv.addEventListener('pointermove', function (e) { if (e.buttons) return; cv.style.cursor = toca(e) ? 'pointer' : ''; });
    var ro = new ResizeObserver(function () { var w = esc3.clientWidth, h = esc3.clientHeight; if (!w || !h) return; renderer.setSize(w, h); lr.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); });
    ro.observe(esc3);
    v3 = { renderer: renderer, scene: scene, controls: controls, ro: ro, raf: 0, frente: frente, corte: function () {}, detalle: ver,
      etiquetas: function (on) { etqs.forEach(function (e) { e.visible = on; e.element.style.display = on ? '' : 'none'; }); },
      png: function () { renderer.render(scene, camera); var a = document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download = 'Ducto_' + dc.tag.replace(/[\\/:*?"<>|]+/g, '-') + '_trazado.png'; document.body.appendChild(a); a.click(); a.remove(); } };
    (function loop() { if (!v3 || v3.renderer !== renderer) return; v3.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); lr.render(scene, camera); })();
  }

  // ── Eventos ──
  var listo = false;
  function enganchar() {
    if (listo) return; listo = true;
    var secC = $('#v-cond'); if (secC && !$('#kCjBox')) { var cjb = document.createElement('div'); cjb.id = 'kCjBox'; secC.appendChild(cjb); if (window.REMesaModulo || document.querySelector('#v-lazos')) { var cjc = document.createElement('div'); cjc.id = 'kCjCfgBox'; secC.appendChild(cjc); } setTimeout(function () { try { if (window.LAZOS_CAJA) window.LAZOS_CAJA.montar(); } catch (e) { console.warn('Caja', e); } }, 0); }
    // Botones de la barra de ductos en grupos con nombre
    (function () { var h = $('#kNuevo') && $('#kNuevo').parentNode; if (!h || h.dataset.ord) return; h.dataset.ord = '1'; h.classList.add('kbot'); [].forEach.call(h.querySelectorAll('.esp'), function (x) { x.remove(); });
      [['Ductos', ['kNuevo', 'kDuplicar', 'kBorrar']], ['Entregables', ['kPdf', 'kDxf', 'kExcel', 'kLista']], ['Proyecto', ['kAsignar', 'kCaja']]].forEach(function (gr) { var d = document.createElement('div'); d.className = 'kgrp'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', gr[0]); var t = document.createElement('span'); t.className = 'kgrp-t'; t.textContent = gr[0]; d.appendChild(t); gr[1].forEach(function (id) { var b = document.getElementById(id); if (b) d.appendChild(b); }); h.appendChild(d); });
      var px = $('#kPdf'); if (px) px.textContent = 'Láminas PDF (A3)'; var lx = $('#kLista'); if (lx) { lx.textContent = 'Listado'; lx.classList.remove('pri'); lx.title = 'Listado de canalizaciones con su anexo'; } var ex = $('#kExcel'); if (ex) ex.textContent = 'Excel memoria'; var dx = $('#kDxf'); if (dx) dx.textContent = 'DXF corte'; var ax = $('#kAsignar'); if (ax) { ax.textContent = 'Escribir en circuitos'; ax.classList.remove('pri'); } })();
    (function ocultar(n) { var bjx = $('#kCaja'), tb = document.querySelector('#v-cond .dk-tab[data-id=caja]'); if (bjx && tb) bjx.hidden = true; else if (n < 12) setTimeout(function () { ocultar(n + 1); }, 400); })(0);
    docCaja(); var _pintar = pintar; pintar = function () { _pintar.apply(this, arguments); try { pintarTag(); pintarAmb(); pintarDoc(); } catch (e) { console.warn('Documento', e); } };
    cssExtra(); montarCatalogo();
    var b3 = document.createElement('button'); b3.type = 'button'; b3.id = 'k3dBtn'; b3.className = 'pri'; b3.textContent = 'Ver ducto en 3D'; b3.addEventListener('click', abrir3d);
    var kd = $('#kMedidor'); if (kd) kd.parentNode.appendChild(b3);
    var kx = $('#kExcel'); if (kx && !$('#kLista')) { var bl = document.createElement('button'); bl.type = 'button'; bl.id = 'kLista'; bl.className = 'pri'; bl.textContent = 'Listado de canalizaciones'; bl.addEventListener('click', lstAbrir); kx.parentNode.insertBefore(bl, kx.nextSibling); }
    var kl0 = $('#kLista'); if (kl0 && !$('#kCaja')) { var bj = document.createElement('button'); bj.type = 'button'; bj.id = 'kCaja'; bj.className = 'pri'; bj.textContent = 'Caja de paso / derivación'; bj.title = 'Reúne varios ductos en una caja y sale con uno solo: dimensiona la caja y el ducto de salida'; bj.addEventListener('click', function () { var tb = document.querySelector('#v-cond .dk-tab[data-id=caja]'); if (tb) tb.click(); if (window.LAZOS_CAJA) window.LAZOS_CAJA.abrir(); }); kl0.parentNode.insertBefore(bj, kl0.nextSibling); }
    var kfT = $('#kForm'), fT = kfT && kfT.querySelector('fieldset'); if (fT && !kfT.querySelector('[data-k=zona]')) { var ft = document.createElement('fieldset');
      ft.innerHTML = '<legend>Tag, ruta y circuitos</legend><label>Zona o área<input data-k="zona" placeholder="Ej.: 0430"></label><label>Equipo o tag asociado<input data-k="eq" placeholder="Ej.: FIT-101, JB-001"></label><label>Servicio del ducto<select data-k="sl"><option value="">Automático según los cables</option>' + Object.keys(SERVL).map(function (k) { return '<option value="' + k + '">' + esc(SERVL[k]) + '</option>'; }).join('') + '</select></label><label>Desde<input data-k="desde" placeholder="Ej.: FIT-101"></label><label>Hasta<input data-k="hasta" placeholder="Ej.: JB-001, sala eléctrica"></label>' +
        '<div class="ktag"><button type="button" id="kTagAuto">Generar tag</button><span id="kTagPrev"></span></div><p class="ktag-n" id="kCircs"></p>' +
        '<legend class="ktag-l">Estándar de diseño del proyecto</legend><label class="ancho">Perfil de criterios<select id="kEstPerfil">' + Object.keys(EST).map(function (k) { return '<option value="' + k + '">' + esc(EST[k].n) + '</option>'; }).join('') + '</select></label><label class="ancho">Formato del tag de los ductos<input id="kEstPatron" list="kDlPat" placeholder="{ZONA}-{TAG}-{SERV}-{NN}"></label><datalist id="kDlPat">' + PATRONES.map(function (x) { return '<option value="' + x[0] + '">' + esc(x[1]) + '</option>'; }).join('') + '</datalist><label>Zona por defecto<input id="kEstZona" placeholder="Ej.: 0430"></label><div class="ktag"><button type="button" id="kTagTodos" title="Vuelve a generar el tag de todos los ductos con este formato">Retaguear todos</button></div><p class="ktag-n" id="kEstDesc"></p>';
      fT.parentNode.insertBefore(ft, fT.nextSibling);
      ft.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.id === 'kTagAuto') { var dc = actual(); dc.tag = tagAuto(dc); cambio(); } else if (b.id === 'kTagTodos') { var bb = datos(); bb.ductos.forEach(function (d) { d.tag = ''; }); bb.ductos.forEach(function (d) { d.tag = tagAuto(d); }); cambio(); $('#kEstado').textContent = bb.ductos.length + ' ductos con tag nuevo según el formato ' + est().patron + '.'; } });
      ft.addEventListener('input', function (e) { var t = e.target, s2 = est(); if (t.id === 'kEstPatron') s2.patron = t.value || PATRONES[0][0]; else if (t.id === 'kEstZona') s2.zona = t.value; else return; A.guardar(); pintarTag(); });
      ft.addEventListener('change', function (e) { if (e.target.id === 'kEstPerfil') { est().perfil = e.target.value; verTam = null; cambio(); } }); }
    var kf0 = $('#kForm'), f0 = kf0 && kf0.querySelector('fieldset'); if (f0 && !kf0.querySelector('[data-k=amb]')) { var fa = document.createElement('fieldset'); fa.innerHTML = '<legend>Ambiente de instalación</legend><label class="ancho">Dónde va el ducto<select data-k="amb">' + ORDEN_AMB.map(function (k) { return '<option value="' + k + '">' + esc(AMB[k].n) + '</option>'; }).join('') + '</select></label><div class="kamb" id="kAmb" aria-live="polite"></div>'; f0.parentNode.insertBefore(fa, f0.nextSibling);
      fa.addEventListener('click', function (e) { var b = e.target.closest('button[data-usa]'); if (!b) return; var dc = actual(); dc.tubo = b.dataset.usa; var T = TUBOS[dc.tubo]; if (T.s.map(function (x) { return x[0]; }).indexOf(dc.min) < 0) dc.min = T.s[0][0]; verTam = null; cambio(); }); }
    var kf = $('#kForm'), f1 = kf && kf.querySelector('fieldset'); if (f1 && !kf.querySelector('[data-k=serv]')) { var fs = document.createElement('fieldset'); fs.innerHTML = '<legend>Datos para el listado</legend><label>Servicio [V]<input data-k="serv" list="kDlServ" placeholder="Elige o escribe: 480, 120, 24 VDC…"></label><label>Revisión<input data-k="rev" list="kDlRev" placeholder="Elige o escribe: A, B, 0…"></label><label class="ancho">Plano de disposición / canalización<input data-k="plano" placeholder="N° del plano donde aparece el ducto"></label><label class="ancho">Observaciones<input data-k="obs" list="kDlObs" placeholder="Elige o escribe: sector, existente, nota…"></label>' + [['kDlServ', SUG_SERV], ['kDlRev', SUG_REV], ['kDlObs', SUG_OBS]].map(function (x) { return '<datalist id="' + x[0] + '">' + x[1].map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>'; }).join(''); f1.parentNode.insertBefore(fs, f1.nextSibling); }
    setTimeout(function () { montarNorma(); montarTutorial(); }, 0); // después de que la app agregue sus botones
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
  function vista() { enganchar(); pintar(); pintarCatalogo(); }
  window.LAZOS_COND = { EST: EST, est: est, tagAuto: tagAuto, rutas: rutas, AMB: AMB, ambiente: ambiente, docs: docs, docRevs: docRevs, docHtml: docHtml, docNum: docNum, DOCS: DOCS, docPoner: function (id, f) { docs()[id].revs = f; }, docSel: function () { return docs().sel; }, docDescargar: function (id, f) { if (/excel/i.test(f)) { if (id === 'listado') lstExcel(); else excel(); } else { $('#imp').innerHTML = docHtml(id); setTimeout(function () { window.print(); }, 150); } }, soportacion: soportacion, curvatura: curvatura, verificar: verificar, estadoRic: estadoRic, FAM: FAM, calcular: calcular, empacar: empacar, sugerir: sugerir, TUBOS: TUBOS, CAT: CAT, lamina: lamina, dxf: dxf };
  // Piezas internas que usa el módulo de cajas de paso y derivación (caja-paso.js, cargado desde la misma carpeta)
  window.LAZOS_COND._ = { A: A, datos: datos, nuevo: nuevo, cambio: cambio, esc: esc, n1: n1, up: up, area: area, CATI: CATI, ORDEN_TUBOS: ORDEN_TUBOS, ORDEN_FAM: ORDEN_FAM, SERV: SERV, servDe: servDe, opcionesCat: opcionesCat, opciones: opciones, MJM: MJM, CAJ_N4: CAJ_N4, CAJ_ESP: CAJ_ESP, COLF: COLF, cargar3d: cargar3d, tagAuto: tagAuto, est: est };
  (function () { var sc = document.createElement('script'); sc.src = BASE + 'caja-paso.js'; document.head.appendChild(sc); })();
  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { cond: vista });
  var sec = document.getElementById('v-cond'); if (sec && !sec.hidden) vista();
})();
