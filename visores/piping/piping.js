/* Piping para leer P&ID y dimensionamiento de válvulas y actuadores · Suite ReyEngi
 * Datos de referencia: ASME B36.10M / B36.19M (diámetros y espesores), ASME B16.5 (rating P-T, grupo 1.1),
 * ISA-5.1 e ISO 10628 (simbología), IEC 60534-2-1 / ANSI/ISA-75.01.01 (coeficiente de flujo), ANSI/FCI 70-2 (clases de fuga),
 * ISO 5211 (acoplamiento de actuadores de cuarto de vuelta), EN 15714-2 (clases de servicio de actuadores eléctricos).
 * Los resultados son de preselección: el tamaño final y el actuador se confirman con el software o catálogo del fabricante.
 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var f = function (v, d) { return isFinite(v) ? (+v).toLocaleString('es-CL', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) : '—'; };
  var num = function (id) { var x = $('#' + id); return x ? parseFloat(String(x.value).replace(',', '.')) : NaN; };

  // ── Pestañas ──
  var tabs = $$('.tabs button'), secs = $$('main > section[data-t]');
  function mostrar(t) {
    if (!secs.some(function (s) { return s.dataset.t === t; })) t = 'aprender';
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.t === t)); });
    secs.forEach(function (s) { s.hidden = s.dataset.t !== t; });
    try { history.replaceState(null, '', '#' + t); } catch (e) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.t); }); });
  window.addEventListener('hashchange', function () { mostrar(location.hash.slice(1)); });

  // ══════════════ 1. PIPING PARA LEER P&ID ══════════════

  // Simbología (dibujos simplificados según ISA-5.1 / ISO 10628; cada proyecto define la suya en la hoja de simbología)
  var T = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"';
  var linea = '<path d="M2 30 H22 M58 30 H78" ' + T + '/>';
  var mono = '<path d="M22 20 L40 30 L22 40 Z M58 20 L40 30 L58 40 Z" ' + T + '/>';
  function vas(extra, sinMono) { return linea + (sinMono ? '' : mono) + (extra || ''); }
  function vastago(top) { return '<path d="M40 30 V' + top + '" ' + T + '/>'; }
  var SIMB = [
    { g: 'Válvulas manuales', l: [
      ['Compuerta (gate)', vas(), 'Aislamiento todo/nada; no se usa para regular.'],
      ['Globo (globe)', vas('<circle cx="40" cy="30" r="3.2" fill="currentColor"/>'), 'Regulación manual y estrangulamiento; alta pérdida de carga.'],
      ['Bola (ball)', vas('<circle cx="40" cy="30" r="6" ' + T + ' style="fill:var(--sym-bg)"/>'), 'Aislamiento rápido de cuarto de vuelta; paso total o reducido.'],
      ['Mariposa (butterfly)', linea + '<path d="M22 20 V40 M58 20 V40 M22 30 H58 M34 22 L46 38" ' + T + '/>', 'Grandes diámetros y baja presión; cuarto de vuelta, wafer o lug.'],
      ['Retención (check)', vas('<path d="M22 20 L40 30 L22 40 Z" fill="currentColor"/>') + '<path d="M44 14 L56 14 M52 11 L56 14 L52 17" ' + T + '/>', 'Impide el retroceso; la flecha indica el sentido de flujo permitido.'],
      ['Cuchillo (knife gate)', vas('<path d="M34 12 H46 V20 H34 Z" ' + T + '/>' + vastago(12)), 'Pulpas y sólidos en minería; corta el flujo con una hoja.'],
      ['Diafragma', vas('<path d="M30 20 Q40 10 50 20" ' + T + '/>'), 'Fluidos corrosivos o con sólidos; el diafragma sella contra el cuerpo.'],
      ['Pinch (manga)', linea + '<path d="M22 20 Q40 32 58 20 M22 40 Q40 28 58 40 M22 20 V40 M58 20 V40" ' + T + '/>', 'Pulpas abrasivas; una manga elástica se aprieta para cerrar.'],
      ['Tres vías', vas('<path d="M33 48 L40 30 L47 48 Z" ' + T + '/><path d="M40 48 V58" ' + T + '/>'), 'Desvía o mezcla flujos entre tres conexiones.'],
      ['Alivio / seguridad (PSV)', '<path d="M2 44 H30 M40 44 V58" ' + T + '/><path d="M30 34 L40 44 L30 54 Z M40 34 L50 44 L40 54 Z" ' + T + '/><path d="M40 34 V12 M34 30 L46 26 L34 22 L46 18 L34 14" ' + T + '/>', 'Protege contra sobrepresión (ASME VIII / API 520); el resorte fija la presión de disparo.']
    ] },
    { g: 'Actuadores', l: [
      ['Neumático de diafragma', vas(vastago(16) + '<path d="M28 16 Q40 2 52 16 Z" ' + T + '/>'), 'Válvulas de control: resorte y diafragma; define la posición de falla (FC / FO).'],
      ['Neumático de pistón', vas(vastago(16) + '<path d="M30 6 H50 V16 H30 Z M40 6 V2" ' + T + '/>'), 'Mayor empuje o carrera; on/off o modulante con posicionador.'],
      ['Motorizado (MOV)', vas(vastago(17) + '<circle cx="40" cy="10" r="7" ' + T + '/><text x="40" y="13.5" font-size="9" text-anchor="middle" fill="currentColor">M</text>'), 'Actuador eléctrico multivuelta o de cuarto de vuelta.'],
      ['Solenoide', vas(vastago(18) + '<path d="M33 4 H47 V18 H33 Z" ' + T + '/><text x="40" y="14.5" font-size="9" text-anchor="middle" fill="currentColor">S</text>'), 'Pilotaje on/off de una válvula neumática (XY) o válvula solenoide directa.'],
      ['Manual con volante', vas(vastago(12) + '<path d="M30 12 H50" ' + T + '/>'), 'Operación manual; el volante puede ser con engranaje en diámetros grandes.'],
      ['Posicionador / I/P', vas(vastago(16) + '<path d="M28 16 Q40 2 52 16 Z" ' + T + '/><path d="M52 10 H64 V22 H52" ' + T + '/>'), 'Convierte 4-20 mA en presión de aire y asegura la posición del vástago.']
    ] },
    { g: 'Accesorios de cañería', l: [
      ['Reducción concéntrica', '<path d="M2 30 H28 M52 30 H78 M28 18 L52 24 V36 L28 42 Z" ' + T + '/>', 'Cambio de diámetro con eje común (líneas verticales).'],
      ['Reducción excéntrica', '<path d="M2 30 H28 M52 34 H78 M28 18 L52 28 V42 H28 Z" ' + T + '/>', 'Lado plano arriba en succión de bombas (evita bolsas de aire).'],
      ['Unión bridada', '<path d="M2 30 H35 M45 30 H78 M35 18 V42 M45 18 V42" ' + T + '/>', 'Brida ASME B16.5 / B16.47: clase 150, 300, 600…'],
      ['Brida ciega', '<path d="M2 30 H35 M35 18 V42 M41 18 V42" ' + T + '/><path d="M35 18 H41 V42 H35 Z" fill="currentColor"/>', 'Cierra un extremo; se usa en conexiones futuras o de limpieza.'],
      ['Figura 8 (spectacle)', '<path d="M2 30 H30 M50 30 H78" ' + T + '/><circle cx="40" cy="22" r="6" ' + T + '/><circle cx="40" cy="38" r="6" fill="currentColor"/><path d="M40 28 V32" ' + T + '/>', 'Aislamiento positivo para mantenimiento (abierta / ciega).'],
      ['Filtro Y (strainer)', '<path d="M2 30 H78 M34 30 L46 46 M40 30 L52 46 M46 46 L52 46" ' + T + '/>', 'Retiene partículas aguas arriba de instrumentos y válvulas.'],
      ['Junta de expansión', '<path d="M2 30 H24 M56 30 H78 M24 20 V40 M56 20 V40 M24 20 L30 40 L36 20 L42 40 L48 20 L56 40" ' + T + '/>', 'Absorbe dilatación y vibración (fuelle o caucho).'],
      ['Conexión de manguera', '<path d="M2 30 H40 M40 22 V38 M44 22 Q52 30 44 38" ' + T + '/>', 'Servicios: agua de lavado, aire de planta.'],
      ['Trampa de vapor', '<path d="M2 30 H28 M52 30 H78 M28 18 H52 V42 H28 Z" ' + T + '/><text x="40" y="34" font-size="11" text-anchor="middle" fill="currentColor">T</text>', 'Descarga condensado sin dejar pasar vapor.']
    ] },
    { g: 'Líneas (ISA-5.1)', l: [
      ['Proceso principal', '<path d="M2 30 H78" stroke="currentColor" stroke-width="3.2"/>', 'Línea gruesa: flujo primario del proceso.'],
      ['Proceso secundario / servicio', '<path d="M2 30 H78" ' + T + '/>', 'Línea delgada: servicios (agua, aire, vapor).'],
      ['Futura / proveedor', '<path d="M2 30 H78" ' + T + ' stroke-dasharray="8 5"/>', 'Trazo segmentado: alcance futuro o de otro proveedor.'],
      ['Señal eléctrica', '<path d="M2 30 H78" ' + T + ' stroke-dasharray="5 4"/>', '4-20 mA, discreta 24 VDC (ISA-5.1: segmentada).'],
      ['Señal neumática', '<path d="M2 30 H78 M30 24 L24 36 M38 24 L32 36 M54 24 L48 36 M62 24 L56 36" ' + T + '/>', 'Aire de instrumentos: barras dobles cada tramo.'],
      ['Capilar', '<path d="M2 30 H78 M30 24 L38 36 M38 24 L30 36 M54 24 L62 36 M62 24 L54 36" ' + T + '/>', 'Sistemas rellenos (sellos remotos, termómetros a bulbo).'],
      ['Hidráulica', '<path d="M2 30 H78 M30 22 V30 H36 M54 22 V30 H60" ' + T + '/>', 'Aceite hidráulico de actuadores.'],
      ['Enlace de datos / software', '<path d="M2 30 H78" ' + T + '/><circle cx="26" cy="30" r="3" style="fill:var(--sym-bg)" ' + T + '/><circle cx="54" cy="30" r="3" style="fill:var(--sym-bg)" ' + T + '/>', 'Comunicación digital entre sistemas (bus, red, función de software).']
    ] },
    { g: 'Instrumentos (ISA-5.1)', l: [
      ['Instrumento en terreno', '<circle cx="40" cy="30" r="16" ' + T + '/><text x="40" y="29" font-size="9" text-anchor="middle" fill="currentColor">PIT</text><text x="40" y="40" font-size="8" text-anchor="middle" fill="currentColor">101</text>', 'Burbuja sin línea: montado en terreno, accesible al operador local.'],
      ['Panel principal (sala de control)', '<circle cx="40" cy="30" r="16" ' + T + '/><path d="M24 30 H56" ' + T + '/><text x="40" y="27" font-size="9" text-anchor="middle" fill="currentColor">FIC</text><text x="40" y="41" font-size="8" text-anchor="middle" fill="currentColor">201</text>', 'Línea continua: en la consola o panel principal del operador.'],
      ['Pantalla compartida DCS / PLC', '<path d="M24 14 H56 V46 H24 Z" ' + T + '/><circle cx="40" cy="30" r="16" ' + T + '/><path d="M24 30 H56" ' + T + '/><text x="40" y="27" font-size="9" text-anchor="middle" fill="currentColor">LAH</text><text x="40" y="41" font-size="8" text-anchor="middle" fill="currentColor">315</text>', 'Función en el sistema de control mostrada en la HMI (alarmas, indicaciones).'],
      ['Función de PLC / lógica', '<path d="M24 14 H56 V46 H24 Z M40 16 L54 30 L40 44 L26 30 Z" ' + T + '/><text x="40" y="33" font-size="8" text-anchor="middle" fill="currentColor">I</text>', 'Lógica de enclavamiento o secuencia en PLC.'],
      ['Función de computador', '<path d="M26 30 L33 16 H47 L54 30 L47 44 H33 Z" ' + T + '/>', 'Cálculo en computador o servidor (no en el controlador).'],
      ['Placa orificio', '<path d="M2 30 H34 M46 30 H78 M36 16 V44 M44 16 V44" ' + T + '/>', 'Elemento primario de flujo por presión diferencial (ISO 5167).'],
      ['Flujómetro magnético', '<path d="M2 30 H28 M52 30 H78 M28 20 H52 V40 H28 Z" ' + T + '/><text x="40" y="34" font-size="10" text-anchor="middle" fill="currentColor">M</text>', 'Líquidos conductivos y pulpas; sin pérdida de carga.'],
      ['Sello / cámara de diafragma', '<path d="M2 30 H78 M40 30 V22 M32 22 H48 M32 18 H48 M32 18 V22 M48 18 V22" ' + T + '/>', 'Separa el instrumento de fluidos corrosivos, viscosos o con sólidos.']
    ] }
  ];
  function pintarSimbolos() {
    $('#simbolos').innerHTML = SIMB.map(function (g) {
      return '<h3 class="sub">' + g.g + '</h3><div class="sgrid">' + g.l.map(function (s) {
        return '<figure class="sym"><svg viewBox="0 0 80 60" role="img" aria-label="' + esc(s[0]) + '">' + s[1] + '</svg><figcaption><b>' + esc(s[0]) + '</b><span>' + esc(s[2]) + '</span></figcaption></figure>';
      }).join('') + '</div>';
    }).join('');
  }

  // Designación de líneas
  var SERV = { AP: 'Aire de planta', AI: 'Aire de instrumentos', IA: 'Aire de instrumentos', PA: 'Aire de planta', CW: 'Agua de enfriamiento', DS: 'Agua supresión de polvo', DW: 'Agua potable', FP: 'Agua contra incendio', FW: 'Agua fresca', WFR: 'Agua fresca', PW: 'Agua de proceso', RW: 'Agua recuperada', SW: 'Agua de mar', GSF: 'Agua de sello (fresca filtrada)', GSS: 'Agua de sello (agua de mar)', GR: 'Grasa alta presión', SL: 'Pulpa (slurry)', SLR: 'Pulpa', TA: 'Relaves', ST: 'Vapor', CD: 'Condensado', N: 'Nitrógeno', LO: 'Aceite lubricante', HO: 'Aceite hidráulico', FL: 'Floculante', RE: 'Reactivo', CO: 'Concentrado', MI: 'Mineral' };
  var AISL = { H: 'aislación térmica (conservación de calor)', P: 'protección personal', C: 'aislación en frío', ET: 'traceado eléctrico', ST: 'traceado con vapor', IH: 'aislación térmica', PP: 'protección personal', A: 'acústica' };
  function explicarLinea() {
    var v = $('#lineaTxt').value.trim().toUpperCase(), p0 = v.split('-').filter(Boolean), p = [], out = [];
    p0.forEach(function (t, i) { if (p.length && /^\d+$/.test(p[p.length - 1]) && /^\d\/\d+["”]?$/.test(t)) p[p.length - 1] += '-' + t; else p.push(t); });
    p.forEach(function (s, i) {
      var t = '', c = 'otro';
      if (/^\d{3,5}$/.test(s) && i === 0) { t = 'Área / WBS del proyecto donde está la línea (aquí ' + s + ').'; c = 'area'; }
      else if (/^[\d\/-]+(["”]|IN|MM)$/.test(s)) { t = 'Diámetro nominal (NPS ' + s + '). En mm equivale a DN ' + (DN[s.replace(/["”IN]/g, '')] || '—') + '.'; c = 'nps'; }
      else if (/^[A-Z]{1,4}$/.test(s) && i <= 2 && !out.some(function (o) { return o.c === 'serv'; })) { t = 'Código de servicio o fluido: ' + (SERV[s] || 'definido en la tabla de servicios del proyecto') + '.'; c = 'serv'; }
      else if (/^[A-Z]{1,3}\d[A-Z0-9]{0,3}$/.test(s)) { t = 'Especificación de cañería (pipe class): define material, rating de bridas (clase ASME), espesor y tipo de válvulas. Se lee en la especificación de materiales de cañerías del proyecto.'; c = 'spec'; }
      else if (/^\d{2,5}$/.test(s)) { t = 'Número correlativo de la línea (único por área y servicio).'; c = 'corr'; }
      else if (AISL[s]) { t = 'Código de aislación o traceado: ' + AISL[s] + '.'; c = 'aisl'; }
      else { t = 'Segmento propio del estándar del proyecto (revisa la hoja de simbología: P&ID 0100 / PRPD 0001).'; }
      out.push({ s: s, t: t, c: c });
    });
    $('#lineaRes').innerHTML = '<div class="linea">' + out.map(function (o) { return '<span class="seg ' + o.c + '">' + esc(o.s) + '</span>'; }).join('<span class="guion">-</span>') + '</div><ul class="lst">' + out.map(function (o) { return '<li><b>' + esc(o.s) + '</b> · ' + esc(o.t) + '</li>'; }).join('') + '</ul>';
  }

  // Cañerías: ASME B36.10M (acero al carbono) / B36.19M (inoxidable, 10S). Espesores en mm.
  var TUBOS = [
    ['1/2', 15, 21.3, 2.11, 2.77, 3.73, 4.78], ['3/4', 20, 26.7, 2.11, 2.87, 3.91, 5.56], ['1', 25, 33.4, 2.77, 3.38, 4.55, 6.35], ['1-1/4', 32, 42.2, 2.77, 3.56, 4.85, 6.35],
    ['1-1/2', 40, 48.3, 2.77, 3.68, 5.08, 7.14], ['2', 50, 60.3, 2.77, 3.91, 5.54, 8.74], ['2-1/2', 65, 73.0, 3.05, 5.16, 7.01, 9.53], ['3', 80, 88.9, 3.05, 5.49, 7.62, 11.13],
    ['4', 100, 114.3, 3.05, 6.02, 8.56, 13.49], ['6', 150, 168.3, 3.40, 7.11, 10.97, 18.26], ['8', 200, 219.1, 3.76, 8.18, 12.70, 23.01], ['10', 250, 273.0, 4.19, 9.27, 15.09, 28.58],
    ['12', 300, 323.8, 4.57, 10.31, 17.48, 33.32], ['14', 350, 355.6, 6.35, 11.13, 19.05, 35.71], ['16', 400, 406.4, 6.35, 12.70, 21.44, 40.49], ['18', 450, 457.0, 6.35, 14.27, 23.83, 45.24],
    ['20', 500, 508.0, 6.35, 15.09, 26.19, 50.01], ['24', 600, 610.0, 6.35, 17.48, 30.96, 59.54]
  ];
  var SCH = ['10 / 10S', '40', '80', '160'];
  var DN = {}; TUBOS.forEach(function (t) { DN[t[0]] = t[1]; });
  var VEL = [['agua', 'Agua: descarga de bomba', 1.5, 3.0], ['succion', 'Agua: succión de bomba', 0.6, 1.5], ['pulpa', 'Pulpa (sobre la velocidad de depósito)', 1.5, 3.0], ['aire', 'Aire comprimido', 6, 20], ['vapor', 'Vapor saturado', 20, 35], ['aceite', 'Aceite / fluidos viscosos', 0.5, 1.5]];
  function pintarTubos() {
    $('#tTubos').innerHTML = '<thead><tr><th>NPS [in]</th><th>DN</th><th>DE [mm]</th>' + SCH.map(function (s) { return '<th>Sch ' + s + ' · e / DI [mm]</th>'; }).join('') + '</tr></thead><tbody>' +
      TUBOS.map(function (t) { return '<tr><td><b>' + t[0] + '"</b></td><td>' + t[1] + '</td><td>' + f(t[2], 1) + '</td>' + t.slice(3).map(function (e) { return '<td>' + f(e, 2) + ' / ' + f(t[2] - 2 * e, 1) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
    $('#vNps').innerHTML = TUBOS.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === '4' ? ' selected' : '') + '>' + t[0] + '" · DN ' + t[1] + '</option>'; }).join('');
    $('#vSch').innerHTML = SCH.map(function (s, i) { return '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>Sch ' + s + '</option>'; }).join('');
    $('#vServ').innerHTML = VEL.map(function (v) { return '<option value="' + v[0] + '">' + v[1] + ' (' + v[2] + '–' + v[3] + ' m/s)</option>'; }).join('');
  }
  function calcVelocidad() {
    var t = TUBOS.filter(function (x) { return x[0] === $('#vNps').value; })[0], e = t[3 + +$('#vSch').value], di = (t[2] - 2 * e) / 1000, A = Math.PI * di * di / 4, Q = num('vQ') / 3600, v = Q / A;
    var s = VEL.filter(function (x) { return x[0] === $('#vServ').value; })[0], ok = v >= s[2] && v <= s[3];
    // diámetro interior que deja la velocidad al centro del rango
    var vm = (s[2] + s[3]) / 2, diM = Math.sqrt(4 * Q / Math.PI / vm) * 1000, sug = TUBOS.filter(function (x) { return x[2] - 2 * x[3 + +$('#vSch').value] >= diM * 0.97; })[0];
    $('#vRes').innerHTML = '<div class="res ' + (isFinite(v) ? (ok ? 'bien' : 'av') : '') + '"><b>' + f(v, 2) + ' m/s</b> · DI ' + f(di * 1000, 1) + ' mm · área ' + f(A * 1e4, 1) + ' cm²<br>' +
      (isFinite(v) ? (ok ? 'Dentro del rango recomendado para ' + s[1].toLowerCase() + '.' : 'Fuera del rango recomendado (' + s[2] + '–' + s[3] + ' m/s). ') + (sug && !ok ? 'Diámetro sugerido: <b>NPS ' + sug[0] + '"</b> (DN ' + sug[1] + ').' : '') : 'Ingresa el caudal.') + '</div>';
  }

  // ASME B16.5 grupo 1.1 (A105, A216 WCB): presión de trabajo máxima [bar g] por clase y temperatura [°C]
  var PT_T = [38, 50, 100, 150, 200, 250, 300, 350, 400];
  var PT = { 150: [19.6, 19.2, 17.7, 15.8, 13.8, 12.1, 10.2, 8.4, 6.5], 300: [51.1, 50.1, 46.6, 45.1, 43.8, 41.9, 39.8, 37.6, 34.7], 600: [102.1, 100.2, 93.2, 90.2, 87.6, 83.9, 79.6, 75.1, 69.4], 900: [153.2, 150.4, 139.8, 135.2, 131.4, 125.8, 119.5, 112.7, 104.2], 1500: [255.3, 250.6, 233.0, 225.4, 219.0, 209.7, 199.1, 187.8, 173.6], 2500: [425.5, 417.7, 388.3, 375.6, 365.0, 349.5, 331.8, 313.0, 289.3] };
  function ptA(cl, T) { var a = PT[cl]; if (T <= PT_T[0]) return a[0]; for (var i = 1; i < PT_T.length; i++) if (T <= PT_T[i]) return a[i - 1] + (a[i] - a[i - 1]) * (T - PT_T[i - 1]) / (PT_T[i] - PT_T[i - 1]); return NaN; }
  function pintarPT() {
    $('#tPT').innerHTML = '<thead><tr><th>Clase</th>' + PT_T.map(function (t) { return '<th>' + (t === 38 ? '−29 a 38' : t) + ' °C</th>'; }).join('') + '</tr></thead><tbody>' + Object.keys(PT).map(function (c) { return '<tr><td><b>' + c + '</b></td>' + PT[c].map(function (v) { return '<td>' + f(v, 1) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  }
  function calcClase() {
    var P = num('cP'), T = num('cT'), cl = Object.keys(PT).filter(function (c) { return ptA(c, T) >= P; })[0];
    $('#cRes').innerHTML = '<div class="res ' + (cl ? 'bien' : 'mal') + '">' + (T > 400 ? 'Sobre 400 °C revisa la tabla del material en ASME B16.5 (grupo 1.1 pierde resistencia por creep).' : cl ? 'Clase mínima: <b>ASME ' + cl + '</b> (admite ' + f(ptA(cl, T), 1) + ' bar g a ' + f(T, 0) + ' °C). Usa la presión de diseño, no la de operación.' : 'Ninguna clase de la tabla cumple: revisa material o condición de diseño.') + '</div>';
  }

  // ══════════════ 2. VÁLVULAS: TAMAÑO Y ACTUADOR ══════════════
  // IEC 60534-2-1 / ISA-75.01.01 · unidades: Q [m³/h], p [bar abs], T [K], Kv [m³/h], Cv = 1,156 Kv
  var N1 = 1, N9 = 24.6e2; // N1 = 1 (Kv, m³/h, bar) · N9 = 2,46·10³ (Kv, m³/h normales a 0 °C, bar)
  // Capacidad típica (Cv nominal a 100 % de apertura) por tipo: Cv ≈ k · d² (d en pulgadas). Solo para preselección.
  var TIPOV = {
    globo: { n: 'Globo asiento simple (igual %)', k: 15, FL: 0.9, xT: 0.72, apert: 80, tam: ['1/2', '3/4', '1', '1-1/2', '2', '3', '4', '6', '8', '10', '12'] },
    segmento: { n: 'Bola segmentada / V-port', k: 40, FL: 0.8, xT: 0.55, apert: 80, tam: ['1', '1-1/2', '2', '3', '4', '6', '8', '10', '12', '14', '16', '20', '24'] },
    mariposa: { n: 'Mariposa alto desempeño (60°)', k: 20, FL: 0.7, xT: 0.4, apert: 70, tam: ['2', '3', '4', '6', '8', '10', '12', '14', '16', '18', '20', '24'] },
    bola: { n: 'Bola paso total (on/off)', k: 65, FL: 0.6, xT: 0.2, apert: 100, tam: ['1/2', '3/4', '1', '1-1/2', '2', '3', '4', '6', '8', '10', '12'] }
  };
  function dIn(t) { var m = /^(\d+)(?:-(\d)\/(\d))?$/.exec(t) || /^(\d)\/(\d)$/.exec(t); if (!m) return NaN; if (/^\d\/\d$/.test(t)) return +m[1] / +m[2]; return +m[1] + (m[2] ? +m[2] / +m[3] : 0); }
  function cvNominal(tipo, t) { return TIPOV[tipo].k * Math.pow(dIn(t), 2); }
  function aplicarTipo() { var t = TIPOV[$('#kTipo').value]; $('#kFL').value = t.FL; $('#kxT').value = t.xT; }
  function calcKv() {
    var gas = $('#kFase').value === 'gas', tipo = $('#kTipo').value, TV = TIPOV[tipo];
    var p1 = num('kP1') + 1.01325, p2 = num('kP2') + 1.01325, dp = p1 - p2, FL = num('kFL'), out = [], Kv, ahogado = false, txt = [];
    if (!(dp > 0)) { $('#kRes').innerHTML = '<div class="res mal">La presión aguas abajo debe ser menor que la de entrada.</div>'; return null; }
    if (!gas) {
      var Q = num('kQ'), G = num('kG'), pv = num('kPv'), pc = num('kPc') || 221.2, FF = 0.96 - 0.28 * Math.sqrt(Math.max(0, pv) / pc), dpMax = FL * FL * (p1 - FF * pv);
      ahogado = dp >= dpMax; Kv = Q / N1 * Math.sqrt(G / (ahogado ? dpMax : dp));
      var sigma = (p1 - pv) / dp, xF = dp / (p1 - pv);
      txt.push('ΔP ' + f(dp, 2) + ' bar · ΔP de flujo ahogado ' + f(dpMax, 2) + ' bar (FF = ' + f(FF, 3) + ')');
      if (ahogado) txt.push((p2 < pv ? '<b class="mal">Flashing</b>: la presión de salida queda bajo la presión de vapor; usa trim y cuerpo para flashing (aleación dura, salida ampliada).' : '<b class="mal">Flujo ahogado (cavitación plena)</b>: el caudal ya no aumenta con ΔP; usa trim anticavitación o reparte la caída en etapas.'));
      else if (xF > 0.6 * FL * FL) txt.push('<b class="av">Riesgo de cavitación incipiente</b> (xF = ' + f(xF, 2) + ' sobre ~0,6·FL²); verifica con el índice del fabricante (z o σ).');
      else txt.push('Sin cavitación esperable (σ = ' + f(sigma, 1) + ').');
    } else {
      var Qn = num('kQ'), M = num('kM'), Tk = num('kT') + 273.15, kk = num('kk') || 1.4, Z = num('kZ') || 1, xT = num('kxT'), Fk = kk / 1.4, x = dp / p1, xLim = Fk * xT;
      ahogado = x >= xLim; var xe = Math.min(x, xLim), Y = Math.max(2 / 3, 1 - xe / (3 * Fk * xT));
      Kv = Qn / (N9 * p1 * Y) * Math.sqrt(M * Tk * Z / xe);
      txt.push('x = ΔP/P1 = ' + f(x, 3) + ' · límite Fγ·xT = ' + f(xLim, 3) + ' · Y = ' + f(Y, 3));
      txt.push(ahogado ? '<b class="mal">Flujo crítico (sónico)</b>: el caudal no aumenta con más ΔP; revisa ruido (IEC 60534-8-3) y velocidad de salida.' : 'Flujo subcrítico.');
    }
    var Cv = Kv * 1.156;
    // Preselección de tamaño: el Cv requerido al caudal máximo queda bajo la apertura recomendada del tipo
    var sel = TV.tam.filter(function (t) { return cvNominal(tipo, t) * TV.apert / 100 >= Cv; })[0], linea = $('#kLinea').value;
    var cvSel = sel ? cvNominal(tipo, sel) : NaN, ap = sel ? Cv / cvSel * 100 : NaN;
    if (sel && dIn(sel) < dIn(linea) / 2) txt.push('<b class="av">El cuerpo queda bajo la mitad del diámetro de la línea</b>: confirma la pérdida en reductores (factor FP) y la velocidad en la válvula.');
    if (sel && dIn(sel) > dIn(linea)) txt.push('<b class="av">El cuerpo sale mayor que la línea</b>: revisa el diámetro de cañería o el tipo de válvula.');
    $('#kRes').innerHTML = '<div class="res ' + (ahogado ? 'av' : 'bien') + '"><div class="big"><span>Kv <b>' + f(Kv, 1) + '</b></span><span>Cv <b>' + f(Cv, 1) + '</b></span><span>Cuerpo sugerido <b>' + (sel ? sel + '"' : 'sobre ' + TV.tam[TV.tam.length - 1] + '"') + '</b></span><span>Uso del Cv nominal <b>' + (sel ? f(ap, 0) + ' %' : '—') + '</b></span></div><ul class="lst">' + txt.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '<li class="peq">Cv nominal típico ' + esc(TV.n.toLowerCase()) + ' de ' + (sel || '—') + '": ≈ ' + f(cvSel, 0) + ' (estimación k·d²; confirma con el catálogo del fabricante).</li></ul></div>';
    // pasa el diámetro de asiento sugerido al cálculo del actuador
    if (sel && !$('#aDs').dataset.manual) $('#aDs').value = String(Math.round(Math.max(0.5, dIn(sel) * 0.85) * 25.4));
    if (!$('#aDp').dataset.manual && isFinite(num('kP1'))) $('#aDp').value = String(+num('kP1').toFixed(2));
    return { Kv: Kv, Cv: Cv, sel: sel };
  }
  function fase() { var g = $('#kFase').value === 'gas'; $$('.liq').forEach(function (x) { x.hidden = g; }); $$('.gas').forEach(function (x) { x.hidden = !g; }); $('#kQlbl').firstChild.textContent = g ? 'Caudal máximo [Nm³/h, 0 °C y 1 atm]' : 'Caudal máximo [m³/h]'; calcKv(); }

  // Actuador lineal (válvula de globo): empuje = desbalance + fricción de empaquetadura + carga de asiento (ANSI/FCI 70-2)
  var ASIENTO = { II: 20, III: 40, IV: 40, V: '', VI: '' }; // lbf por pulgada de circunferencia de asiento (valores usuales de fabricantes)
  var AREAS = [300, 450, 700, 1000, 1400, 2000, 2800, 4000]; // áreas efectivas de diafragma típicas [cm²]
  function calcLineal() {
    var ds = num('aDs') / 10, dp = num('aDp'), cls = $('#aClase').value, carga = num('aSeat'), fric = num('aFric'), sf = num('aSF') || 1.25;
    var A = Math.PI * ds * ds / 4; // cm²
    var Fdes = A * dp * 1.0197; // kgf (1 bar = 1,0197 kgf/cm²)
    var Fasi = isFinite(carga) ? carga * 0.4536 * Math.PI * ds / 2.54 : NaN; // lbf/in × circunferencia [in] → kgf
    var Ftot = Fdes + fric + Fasi;
    var Freq = Ftot * sf, N = Freq * 9.80665;
    var ps = num('aPs'), r1 = num('aR1'), r2 = num('aR2'), modo = $('#aFalla').value;
    // Falla cierra (aire abre): cierra el resorte con su precarga r1 · Falla abre (aire cierra): cierra el aire sobre el resorte
    var pNeta = modo === 'FC' ? r1 : ps - r2, Areq = pNeta > 0 ? Freq / (pNeta * 1.0197) : NaN, Asel = AREAS.filter(function (a) { return a >= Areq; })[0];
    var avisos = [];
    if (!isFinite(carga)) avisos.push('<b class="av">Clase ' + cls + '</b>: ingresa la carga de asiento del fabricante (depende del tipo de asiento, metálico o blando, y de la presión).');
    if (pNeta <= 0) avisos.push('<b class="mal">La presión neta para cerrar es nula</b>: sube la presión de suministro o cambia el rango de resorte.');
    if (Areq > 1000) avisos.push('Actuador grande: evalúa <b>trim balanceado</b> (reduce el desbalance) o un resorte de mayor precarga' + (modo === 'FC' ? ' (por ejemplo 1,4–2,6 bar con suministro de 4 bar g)' : '') + '.');
    if (Asel && Asel > 2.5 * Areq) avisos.push('Revisa el sobredimensionamiento: un actuador muy grande puede dañar el asiento.');
    $('#aRes').innerHTML = '<div class="res ' + (isFinite(Freq) && Asel ? 'bien' : 'av') + '"><div class="big"><span>Empuje requerido <b>' + f(Freq, 0) + ' kgf</b> (' + f(N / 1000, 2) + ' kN)</span><span>Área efectiva mín. <b>' + f(Areq, 0) + ' cm²</b></span><span>Tamaño sugerido <b>' + (Asel ? Asel + ' cm²' : '—') + '</b></span></div>' +
      '<ul class="lst"><li>Desbalance ΔP·A asiento: ' + f(Fdes, 0) + ' kgf (asiento Ø ' + f(ds * 10, 0) + ' mm, ' + f(A, 1) + ' cm²; trim balanceado lo reduce)</li><li>Fricción de empaquetadura: ' + f(fric, 0) + ' kgf</li><li>Carga de asiento clase ' + cls + ': ' + (isFinite(Fasi) ? f(Fasi, 0) + ' kgf' : '—') + '</li><li>Factor de seguridad ' + f(sf, 2) + ' · presión neta disponible para cerrar ' + f(pNeta, 2) + ' bar (' + (modo === 'FC' ? 'precarga del resorte' : 'suministro − rango superior del resorte') + ')</li>' + avisos.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>';
  }
  // Actuador de cuarto de vuelta (bola, mariposa, segmento): torque del fabricante × factor de seguridad, acople ISO 5211
  var ISO5211 = [['F03', 32], ['F04', 63], ['F05', 125], ['F07', 250], ['F10', 500], ['F12', 1000], ['F14', 2000], ['F16', 4000], ['F25', 8000], ['F30', 16000], ['F35', 32000], ['F40', 63000], ['F48', 125000]];
  function calcRotativo() {
    var bto = num('rBto'), sf = num('rSF') || 1.3, tipo = $('#rTipo').value, req = bto * sf, iso = ISO5211.filter(function (x) { return x[1] >= req; })[0];
    var t = num('rTiempo'), eta = (num('rEta') || 50) / 100, ang = tipo === 'multi' ? NaN : Math.PI / 2;
    var P = req * ang / t / eta; // W, sobre torque requerido y tiempo de maniobra de 90°
    var KW = [0.04, 0.06, 0.09, 0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5], kw = KW.filter(function (k) { return k * 1000 >= P; })[0];
    var I = kw ? kw * 1000 / (Math.sqrt(3) * 380 * 0.75 * 0.8) : NaN;
    var spring = tipo === 'sr', clase = $('#rClase').value;
    var avisos = [];
    if (spring) avisos.push('Actuador de retorno por resorte: el torque de <b>fin de carrera del resorte</b> debe superar ' + f(req, 0) + ' N·m (torque de cierre o apertura de asiento, según la falla).');
    if (tipo === 'sy') avisos.push('Yugo escocés (scotch yoke): entrega más torque en los extremos, conveniente para mariposas y bolas con alto torque de asiento.');
    $('#rRes').innerHTML = '<div class="res ' + (iso ? 'bien' : 'av') + '"><div class="big"><span>Torque requerido <b>' + f(req, 0) + ' N·m</b></span><span>Acople ISO 5211 mín. <b>' + (iso ? iso[0] : '—') + '</b>' + (iso ? ' (hasta ' + f(iso[1], 0) + ' N·m)' : '') + '</span><span>Motor eléctrico <b>' + (kw ? f(kw, 2) + ' kW' : '—') + '</b>' + (kw ? ' · ' + f(I, 2) + ' A a 380 V' : '') + '</span></div>' +
      '<ul class="lst"><li>Torque de despegue del fabricante (BTO) ' + f(bto, 0) + ' N·m × factor ' + f(sf, 2) + '</li><li>Potencia mecánica ' + f(P, 0) + ' W para 90° en ' + f(t, 0) + ' s con eficiencia del reductor ' + f(eta * 100, 0) + ' %</li><li>Clase de servicio EN 15714-2: ' + esc(clase) + '</li>' + avisos.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>';
  }
  // Resumen para la hoja de datos
  function resumen() {
    var k = calcKv() || {}, l = [];
    l.push('VÁLVULA: ' + TIPOV[$('#kTipo').value].n.toUpperCase());
    l.push('FLUIDO: ' + ($('#kFase').value === 'gas' ? 'GAS' : 'LÍQUIDO') + ' · Q MÁX ' + $('#kQ').value + ($('#kFase').value === 'gas' ? ' Nm3/h' : ' m3/h') + ' · P1 ' + $('#kP1').value + ' bar g · P2 ' + $('#kP2').value + ' bar g');
    l.push('Kv CALC. ' + f(k.Kv, 1) + ' · Cv CALC. ' + f(k.Cv, 1) + ' · CUERPO PRESELECCIONADO ' + (k.sel ? k.sel + '"' : '—') + ' · LÍNEA ' + $('#kLinea').value + '"');
    l.push('ACTUADOR LINEAL: ' + $('#aRes .big').textContent.replace(/\s+/g, ' ').trim());
    l.push('ACTUADOR ROTATIVO: ' + $('#rRes .big').textContent.replace(/\s+/g, ' ').trim());
    l.push('CRITERIOS: IEC 60534-2-1 / ISA-75.01.01 · ANSI/FCI 70-2 CLASE ' + $('#aClase').value + ' · ISO 5211 · EN 15714-2. PRESELECCIÓN A CONFIRMAR CON EL FABRICANTE.');
    return l.join('\n');
  }

  // ── Eventos e inicio ──
  pintarSimbolos(); pintarTubos(); pintarPT();
  $('#lineaTxt').addEventListener('input', explicarLinea); explicarLinea();
  $$('#vQ, #vNps, #vSch, #vServ').forEach(function (x) { x.addEventListener('input', calcVelocidad); x.addEventListener('change', calcVelocidad); }); calcVelocidad();
  $$('#cP, #cT').forEach(function (x) { x.addEventListener('input', calcClase); }); calcClase();
  $('#kLinea').innerHTML = TUBOS.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === '4' ? ' selected' : '') + '>' + t[0] + '"</option>'; }).join('');
  $('#kTipo').innerHTML = Object.keys(TIPOV).map(function (k) { return '<option value="' + k + '">' + TIPOV[k].n + '</option>'; }).join('');
  $('#kTipo').addEventListener('change', function () { aplicarTipo(); calcKv(); calcLineal(); });
  $('#kFase').addEventListener('change', fase);
  $$('#vKv input, #vKv select').forEach(function (x) { if (x.id !== 'kTipo' && x.id !== 'kFase') x.addEventListener('input', function () { calcKv(); calcLineal(); }); });
  $('#aClase').addEventListener('change', function () { var v = ASIENTO[this.value]; $('#aSeat').value = v === '' ? '' : v; $('#aSeat').placeholder = v === '' ? 'del fabricante' : ''; calcLineal(); });
  $$('#vAct input, #vAct select').forEach(function (x) { x.addEventListener('input', function () { if (x.id === 'aDs' || x.id === 'aDp') x.dataset.manual = 1; calcLineal(); }); x.addEventListener('change', calcLineal); });
  $$('#vRot input, #vRot select').forEach(function (x) { x.addEventListener('input', calcRotativo); x.addEventListener('change', calcRotativo); });
  $('#bResumen').addEventListener('click', function () {
    var t = resumen(), ok = function () { $('#msgRes').textContent = 'Resumen copiado: pégalo en la hoja de datos o en la memoria de cálculo.'; };
    $('#txtRes').value = t; $('#txtRes').hidden = false;
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () { $('#msgRes').textContent = 'Selecciona y copia el texto.'; }); else ok();
  });
  aplicarTipo(); fase(); calcLineal(); calcRotativo();
  mostrar(location.hash.slice(1) || 'aprender');
})();
