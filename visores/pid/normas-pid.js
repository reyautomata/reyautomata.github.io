/* Análisis de P&ID · pestaña retráctil «Normativa P&ID» · ReyEngi
 * 1) Verificación: revisa los instrumentos detectados contra la identificación ISA-5.1 (letras, orden, niveles,
 *    números de lazo, coherencia del lazo y del tipo de señal) y lleva al instrumento con un clic.
 * 2) Normas: fichas de las normas que rigen un P&ID y qué revisa la app de cada una.
 * 3) Letras ISA: tabla de identificación y un probador de tags.
 * Los textos son resúmenes propios; ante dudas manda la edición vigente de cada norma y el estándar del mandante.
 */
(function () {
  'use strict';
  var PID = window.__PID, ISA = window.ISA;
  if (!PID || !ISA) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ── Identificación ISA-5.1 (resumen propio de la tabla de letras) ──
  // Primeras letras «a elección del usuario» en ISA-5.1: la suite les da el uso habitual en minería
  var ELECCION = { C: 1, D: 1, G: 1, M: 1, N: 1, O: 1 };
  var FUN_OK = 'ABCEGHIKLMNOPQRSTUVWXYZ'; // letras siguientes (función pasiva, de salida o modificador de lectura)
  var LECTURA = 'IRGLAQ', SALIDA = 'CTSVYZK'; // pasivas o de lectura / de salida (para revisar el orden)
  var NIVEL = /(HH|LL|HL|H|L|M)$/;
  var AUX = { Z: 1, Y: 1, H: 1, X: 1, U: 1 }; // variables que suelen compartir número con el lazo principal

  // Reglas: [id, gravedad, título, explicación (qué pide la norma y cómo corregir)]
  var REGLAS = {
    letras: ['error', 'Letras no válidas', 'El tag debe tener una primera letra (variable) y al menos una letra de función, solo con letras de la tabla ISA-5.1.'],
    funcion: ['error', 'Letra de función no reconocida', 'Después de la primera letra (y su modificador D, F, J, K, Q o S) solo van letras de función de la tabla ISA-5.1. Revisa si se leyó mal la burbuja.'],
    largo: ['aviso', 'Identificación demasiado larga', 'ISA-5.1 recomienda usar las letras mínimas que describan el instrumento; más de 5 letras suele indicar dos funciones que conviene separar en burbujas distintas.'],
    orden: ['aviso', 'Orden de las letras', 'Las letras de lectura o pasivas (I, R, G…) van antes de las de salida (C, T, S, V, Y…): FIT y no FTI, LIC y no LCI.'],
    nivel: ['aviso', 'Interruptor o alarma sin nivel', 'Un interruptor (S) o alarma (A) de proceso debe indicar su nivel con H, L, HH o LL (PSH, LSLL, TAH). Excepción: posición (ZS), manual (HS) y estado (YS/XS).'],
    numero: ['error', 'Sin número de lazo', 'Cada instrumento se identifica con letras y número de lazo; sin número no se puede asignar al lazo ni al listado.'],
    digitos: ['info', 'Número con otra cantidad de dígitos', 'La numeración de lazos del proyecto debe ser uniforme (por ejemplo, siempre 4 dígitos: 0101).'],
    area: ['info', 'Sin área', 'El resto de los instrumentos lleva prefijo de área; revisa el área por defecto de la hoja o el estándar de tags del mandante.'],
    lazoVar: ['info', 'Mismo lazo con otra variable', 'Un lazo se identifica por su variable y su número. Si el mismo número aparece con variables distintas (PIT-0101 y FIT-0101), confirma que no sea un error de lectura o que el estándar del proyecto lo permita.'],
    sinFinal: ['info', 'Lazo de control sin elemento final', 'Hay un controlador (…C) o salida de control en el lazo, pero no aparece la válvula o elemento final (…V, …CV, …Y, …Z) en los P&ID cargados.'],
    sinMedicion: ['info', 'Válvula de control sin medición', 'La válvula de control no tiene un transmisor (…T) del mismo lazo en los P&ID cargados; puede estar en otra hoja aún no cargada.'],
    senal: ['aviso', 'Tipo de señal no calza con las letras', 'Los indicadores locales (PI, TI, LG) y elementos primarios (FE, TE) no llevan E/S propia; un transmisor (…T) va como AI y una válvula on/off como DO.'],
    duplicado: ['info', 'Tag repetido en varias hojas', 'El mismo tag aparece en más de un plano: puede ser una continuación (normal) o un número duplicado (error).'],
    atributo: ['aviso', 'Atributos del bloque distintos de lo dibujado', 'El bloque guarda en atributos ocultos un tag o número distinto del que se ve en el plano (típico de bloques copiados o de planos exportados de SmartPlant). La app usa lo dibujado; corrige los atributos en el CAD para que la base de datos y el plano digan lo mismo.'],
    servicio: ['info', 'Sin servicio', 'El servicio (qué mide o controla) es obligatorio en el listado de instrumentos y en la hoja de datos.']
  };
  var GRAV = { error: 0, aviso: 1, info: 2 }, GTXT = { error: 'Error', aviso: 'Aviso', info: 'Revisar' };

  // Analiza un juego de letras: devuelve los problemas de identificación propios del tag
  function revisarLetras(letras) {
    var l = String(letras || '').toUpperCase(), out = [];
    if (!/^[A-Z]{2,7}$/.test(l)) { out.push('letras'); return out; }
    var a = ISA.analizar(l + '-1'), f = a.funciones;
    // modificadores adicionales de la primera letra (J, K, Q, S) que isa.js no separa
    if (/^[JK]./.test(f)) f = f.slice(1); // J (barrido) y K (tasa de cambio) modifican a la primera letra
    if (!f) { out.push('letras'); return out; }
    for (var i = 0; i < f.length; i++) if (FUN_OK.indexOf(f[i]) < 0) { out.push('funcion'); break; }
    if (l.length > 5) out.push('largo');
    var base = f.replace(NIVEL, '').replace(/[OC]$/, '');
    var iSal = -1, iLec = -1;
    for (var j = 0; j < base.length; j++) { if (SALIDA.indexOf(base[j]) >= 0 && iSal < 0) iSal = j; if (LECTURA.indexOf(base[j]) >= 0) iLec = j; }
    if (iSal >= 0 && iLec > iSal) out.push('orden');
    if (/[SA]$/.test(f) && !AUX[a.variable] && a.variable !== 'B' && !/^(Y|X|H|Z)/.test(l)) out.push('nivel');
    return out;
  }

  // ── Verificación de todos los instrumentos ──
  function verificar() {
    var S = PID.estado(), soloVal = $('#npSoloVal') && $('#npSoloVal').checked;
    var C = S.cand.filter(function (c) { return c.estado !== 'rechazado' && (!soloVal || c.estado === 'validado'); });
    var hall = [], nomH = {};
    S.hojas.forEach(function (h) { nomH[h.id] = h.plano || h.nombre; });
    function add(regla, c, extra) { hall.push({ r: regla, c: c, extra: extra || '' }); }
    // dígitos y áreas dominantes
    var dig = {}, conArea = 0;
    C.forEach(function (c) { if (c.num) dig[String(c.num).length] = (dig[String(c.num).length] || 0) + 1; if (c.area) conArea++; });
    var digMod = Object.keys(dig).sort(function (a, b) { return dig[b] - dig[a]; })[0];
    var porTag = {}, porLazo = {};
    C.forEach(function (c) {
      var tag = PID.tagDe(c).toUpperCase();
      revisarLetras(c.letras).forEach(function (r) { add(r, c); });
      if (!c.num) add('numero', c);
      else if (digMod && String(c.num).length !== +digMod && C.length > 3) add('digitos', c, c.num.length + ' dígitos; el proyecto usa ' + digMod);
      if (!c.area && conArea > C.length / 2) add('area', c);
      if (!String(c.servicio || '').trim()) add('servicio', c);
      if (c.aviso) add('atributo', c, c.aviso);
      var sug = PID.tipoSugerido(c.letras);
      if (c.tipo && sug && c.tipo !== sug && (c.tipo === 'NA' || sug === 'NA' || (c.tipo[0] !== sug[0]))) add('senal', c, 'indicado ' + (c.tipo === 'NA' ? 'sin E/S' : c.tipo) + ', esperado ' + (sug === 'NA' ? 'sin E/S' : sug));
      (porTag[tag] = porTag[tag] || []).push(c);
      if (c.num) { var k = (c.area || '') + '|' + String(c.num).replace(/^0+/, ''); (porLazo[k] = porLazo[k] || []).push(c); }
    });
    Object.keys(porTag).forEach(function (t) {
      var L = porTag[t], hojas = {}; L.forEach(function (c) { hojas[c.hoja] = 1; });
      if (Object.keys(hojas).length > 1) add('duplicado', L[0], Object.keys(hojas).map(function (h) { return nomH[h]; }).join(', '));
    });
    Object.keys(porLazo).forEach(function (k) {
      var L = porLazo[k], vars = {}, letras = L.map(function (c) { return String(c.letras || '').toUpperCase(); });
      L.forEach(function (c) { var v = String(c.letras || '')[0]; if (v && !AUX[v]) vars[v] = 1; });
      if (Object.keys(vars).length > 1) add('lazoVar', L[0], 'lazo ' + L[0].num + ': ' + letras.join(', '));
      var ctrl = letras.some(function (l) { return /^[A-Z]D?I?C$|^[A-Z]D?IC$|^[A-Z]D?Y$/.test(l) && !/CV$/.test(l); });
      var final = letras.some(function (l) { return /V$|^[A-Z]D?Y$|Z$/.test(l); });
      var med = letras.some(function (l) { return /T$|^[A-Z]D?E$/.test(l); });
      var vc = L.filter(function (c) { return /^[FLPTA]D?C?V$/.test(String(c.letras || '').toUpperCase()) && c.tipo === 'AO'; })[0];
      if (ctrl && !final) add('sinFinal', L[0], 'lazo ' + L[0].num + ': ' + letras.join(', '));
      if (vc && !med) add('sinMedicion', vc, 'lazo ' + vc.num);
    });
    hall.sort(function (a, b) { return GRAV[REGLAS[a.r][0]] - GRAV[REGLAS[b.r][0]]; });
    return { hall: hall, n: C.length };
  }

  // ── Fichas de normas (resumen propio; verificar contra la edición vigente) ──
  var NORMAS = [
    { s: 'ISA 5.1', t: 'ANSI/ISA-5.1-2024 · Instrumentation and Control Symbols and Identification', a: 'Identificación de instrumentos (letras y número de lazo), burbujas según ubicación (campo, panel, sistema de control compartido), líneas de señal y símbolos de válvulas y actuadores. La edición 2024 reemplaza a la 2009; sus guías pasaron a los informes ISA-TR5.1.02 (identificación) e ISA-TR5.1.03 (símbolos).', v: 'Letras válidas, orden de letras, niveles de alarmas e interruptores, número de lazo, coherencia del lazo.' },
    { s: 'PIP', t: 'PIP PIC001:2026 · Piping and Instrumentation Diagram Documentation Criteria', a: 'Qué debe mostrar un P&ID y cómo: equipos, líneas con su identificación, válvulas, instrumentos, enclavamientos, notas y leyenda. Muy usado como criterio de revisión de P&ID en proyectos con ingeniería norteamericana.', v: 'Servicio de cada instrumento, tags repetidos entre hojas y elementos de lazo faltantes.' },
    { s: 'ISO 10628', t: 'ISO 10628-1:2014 y -2:2012 · Diagramas para la industria química y petroquímica', a: 'Tipos de diagrama (de bloques, de flujo de proceso, P&ID), su contenido mínimo y los símbolos gráficos de equipos, cañerías y accesorios.', v: 'Referencia para la lectura de los planos; la app no revisa símbolos de equipos.' },
    { s: 'IEC 62424', t: 'IEC 62424:2016 · Representación de requerimientos de control de proceso en P&ID', a: 'Cómo se piden las funciones de control en el P&ID (óvalos PCE con categoría y función) y el intercambio de datos entre herramientas de P&ID y de control. Común en proyectos con ingeniería europea; usa letras propias distintas de ISA.', v: 'Si el P&ID usa IEC 62424, las letras pueden no calzar con ISA: revisa los avisos con ese criterio.' },
    { s: 'ISA 5.2', t: 'ISA-5.2 · Binary Logic Diagrams for Process Operations', a: 'Símbolos para describir enclavamientos y secuencias (AND, OR, memorias, temporizadores) a los que remiten las notas del P&ID.', v: 'No aplica a la extracción; sirve para documentar los enclavamientos indicados en el P&ID.' },
    { s: 'ISA 5.4', t: 'ISA-5.4 · Instrument Loop Diagrams', a: 'Contenido de los diagramas de lazo que nacen de cada lazo del P&ID: instrumentos, cajas, borneras, cables y E/S.', v: 'Cada lazo validado con E/S genera después su diagrama de lazo en la Suite.' },
    { s: 'ISA 5.5', t: 'ISA-5.5 · Graphic Symbols for Process Displays', a: 'Símbolos y colores para las pantallas de operación (HMI) que representan el proceso del P&ID.', v: 'Referencia; no se verifica en el P&ID.' },
    { s: 'Mandante', t: 'Estándar de identificación del mandante y del proyecto', a: 'Formato de tag (área, separadores, cantidad de dígitos), numeración de lazos y simbología propia. Cuando existe, prevalece sobre las recomendaciones generales y define cómo leer los avisos de esta verificación.', v: 'Área por defecto de cada hoja, dígitos uniformes y prefijo de área.' }
  ];

  // ── Interfaz ──
  var est = document.createElement('style');
  est.textContent = [
    '#npTab{position:fixed;right:0;top:calc(30% + 40px);z-index:60;writing-mode:vertical-rl;background:#1f7a6a;color:#fff;border:0;border-radius:8px 0 0 8px;padding:14px 8px;font:700 13px/1 system-ui,"Segoe UI",sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);min-height:0}',
    '#npTab:focus-visible{outline:2px solid #fff;outline-offset:2px}#npTab .npN{display:inline-block;margin-top:6px;background:#E5484D;border-radius:9px;padding:4px 3px;font-size:11px}',
    '#npPanel{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:73;background:#0e1f33;color:#e8eef5;border-left:2px solid #1f7a6a;box-shadow:-10px 0 30px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;font:13px/1.45 system-ui,"Segoe UI",sans-serif}',
    '#npPanel.abierto{transform:none}',
    '#npPanel .np-cab{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#022A55;border-bottom:1px solid #24405f}#npPanel .np-cab b{flex:1;font-size:15px}',
    '#npPanel .np-cab button{background:transparent;color:#e8eef5;border:1.5px solid #3a5a80;border-radius:8px;min-width:34px;min-height:34px;cursor:pointer;font-size:16px;justify-content:center}',
    '#npPanel .np-tabs{display:flex;border-bottom:1px solid #24405f}#npPanel .np-tabs button{flex:1;border:0;border-radius:0;background:transparent;color:#9fb0c3;min-height:40px;font:700 12.5px system-ui,sans-serif;justify-content:center;border-bottom:3px solid transparent}',
    '#npPanel .np-tabs button[aria-selected=true]{color:#fff;border-bottom-color:#1f7a6a}',
    '#npPanel .np-cuerpo{flex:1;overflow:auto;padding:12px 14px}',
    '#npPanel .np-res{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}#npPanel .np-res span{border-radius:6px;padding:4px 9px;font:600 12px system-ui,sans-serif;background:#11243a;border:1px solid #24405f}',
    '#npPanel .g-error{color:#FF8C8F}#npPanel .g-aviso{color:#F2B544}#npPanel .g-info{color:#8CC8FF}',
    '#npPanel .np-ops{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;font-size:12.5px}#npPanel .np-ops label{display:flex;gap:6px;align-items:center;color:#cdd8e4;font-weight:500}#npPanel .np-ops input{width:16px;min-height:16px}',
    '#npPanel details.np-r{border:1px solid #24405f;border-radius:8px;background:#11243a;margin-bottom:8px}#npPanel details.np-r summary{cursor:pointer;padding:8px 10px;display:flex;gap:8px;align-items:baseline;list-style:none}#npPanel details.np-r summary::-webkit-details-marker{display:none}',
    '#npPanel .np-g{flex:none;font:700 10.5px Consolas,monospace;text-transform:uppercase;min-width:58px}#npPanel .np-t{flex:1;font-weight:700;color:#fff}#npPanel .np-c{font:600 11.5px Consolas,monospace;color:#9fb0c3}',
    '#npPanel .np-exp{margin:0 10px 8px;color:#cdd8e4;font-size:12.5px}',
    '#npPanel .np-tags{display:flex;flex-wrap:wrap;gap:5px;margin:0 10px 10px}#npPanel .np-tags button{background:#071423;color:#e8eef5;border:1px solid #3a5a80;border-radius:6px;min-height:26px;padding:2px 8px;font:600 11.5px Consolas,monospace;cursor:pointer}#npPanel .np-tags button:hover{border-color:#E8A317}#npPanel .np-tags small{color:#9fb0c3;font-family:system-ui,sans-serif;font-weight:500;margin-left:4px}',
    '#npPanel .np-ok{border:1px solid #2A8C5E;color:#9BE3BD;border-radius:8px;padding:10px 12px}',
    '#npPanel .np-norma{border:1px solid #24405f;border-left:4px solid #1f7a6a;border-radius:8px;background:#11243a;margin-bottom:8px;padding:9px 11px}#npPanel .np-norma h4{margin:0 0 4px;font-size:13px;color:#fff;display:flex;gap:8px;align-items:baseline}#npPanel .np-norma h4 span{flex:none;background:#1f7a6a;color:#fff;border-radius:5px;padding:1px 6px;font:800 11px system-ui,sans-serif}',
    '#npPanel .np-norma p{margin:0 0 4px;color:#cdd8e4;font-size:12.5px}#npPanel .np-norma p b{color:#E8A317}',
    '#npPanel table.np-l{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px}#npPanel table.np-l th{text-align:left;background:#022A55;color:#fff;padding:4px 6px;font-size:11.5px}#npPanel table.np-l td{border-bottom:1px solid #24405f;padding:3px 6px;vertical-align:top}#npPanel table.np-l td:first-child{font:700 13px Consolas,monospace;color:#7fd8c4;width:28px}',
    '#npPanel .np-prueba{display:flex;gap:6px;margin-bottom:8px}#npPanel .np-prueba input{flex:1;background:#071423;color:#e8eef5;border:1.5px solid #24405f;border-radius:8px;padding:8px 10px;font:600 13px Consolas,monospace;text-transform:uppercase}',
    '#npPanel .np-sal{background:#071423;border-radius:8px;padding:9px 11px;margin-bottom:14px;font-size:12.5px;min-height:20px}#npPanel .np-sal b{color:#fff}',
    '#npPanel .np-pie{margin:0;padding:10px 14px 12px;border-top:1px solid #24405f;font-size:11.5px;color:#9fb0c3}',
    '#npPanel h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#E8A317;margin:4px 0 8px}',
    '@media (max-width:700px){#npTab{top:auto;bottom:0;right:auto;left:0;width:25%;height:54px;writing-mode:horizontal-tb;border-radius:0;padding:4px 6px;font-size:11.5px;z-index:61}#npTab .npN{margin:0 0 0 4px}}'
  ].join('\n');
  document.head.appendChild(est);

  var tab = document.createElement('button'); tab.type = 'button'; tab.id = 'npTab'; tab.setAttribute('aria-controls', 'npPanel'); tab.setAttribute('aria-expanded', 'false');
  tab.innerHTML = 'Normativa P&amp;ID<span class="npN" hidden></span>';
  var pn = document.createElement('aside'); pn.id = 'npPanel'; pn.setAttribute('aria-label', 'Normativa del P&ID y verificación ISA'); pn.inert = true;
  pn.innerHTML = '<div class="np-cab"><b>Normativa del P&amp;ID</b><button type="button" id="npCerrar" aria-label="Cerrar">✕</button></div>' +
    '<div class="np-tabs" role="tablist"><button type="button" role="tab" data-t="ver" aria-selected="true">Verificación ISA</button><button type="button" role="tab" data-t="normas" aria-selected="false">Normas</button><button type="button" role="tab" data-t="letras" aria-selected="false">Letras ISA-5.1</button></div>' +
    '<div class="np-cuerpo" id="npCuerpo"></div>' +
    '<p class="np-pie">Resumen propio de cada norma para la revisión del P&amp;ID. Verificar contra la edición vigente y el estándar de identificación del mandante, que prevalece.</p>';
  document.body.appendChild(tab); document.body.appendChild(pn);
  var vista = 'ver';
  function abrir(si) { pn.classList.toggle('abierto', si); pn.inert = !si; tab.setAttribute('aria-expanded', String(si)); if (si) { pintar(); setTimeout(function () { $('#npCerrar').focus(); }, 50); } }
  tab.addEventListener('click', function () { abrir(!pn.classList.contains('abierto')); });
  $('#npCerrar').addEventListener('click', function () { abrir(false); tab.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pn.classList.contains('abierto') && !document.querySelector('dialog[open]')) { abrir(false); tab.focus(); } });
  pn.querySelector('.np-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]'); if (!b) return; vista = b.dataset.t;
    pn.querySelectorAll('.np-tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); }); pintar();
  });

  var soloVal = false;
  function pintarVer() {
    var V = verificar(), por = {}, cnt = { error: 0, aviso: 0, info: 0 };
    V.hall.forEach(function (h) { (por[h.r] = por[h.r] || []).push(h); cnt[REGLAS[h.r][0]]++; });
    var h = '<div class="np-ops"><label><input type="checkbox" id="npSoloVal"' + (soloVal ? ' checked' : '') + '> Solo validados</label><span style="color:#9fb0c3">' + V.n + ' instrumentos revisados (sin rechazados)</span></div>' +
      '<div class="np-res"><span class="g-error">' + cnt.error + ' errores</span><span class="g-aviso">' + cnt.aviso + ' avisos</span><span class="g-info">' + cnt.info + ' por revisar</span></div>';
    if (!V.n) h += '<p class="np-ok" style="border-color:#3a5a80;color:#cdd8e4">Carga un P&amp;ID en el paso 1 para verificar sus instrumentos.</p>';
    else if (!V.hall.length) h += '<p class="np-ok">Sin observaciones: las identificaciones cumplen las reglas de ISA-5.1 que revisa la app.</p>';
    Object.keys(REGLAS).filter(function (k) { return por[k]; }).sort(function (a, b) { return GRAV[REGLAS[a][0]] - GRAV[REGLAS[b][0]]; }).forEach(function (k) {
      var R = REGLAS[k], L = por[k];
      h += '<details class="np-r"' + (R[0] !== 'info' ? ' open' : '') + '><summary><span class="np-g g-' + R[0] + '">' + GTXT[R[0]] + '</span><span class="np-t">' + R[1] + '</span><span class="np-c">' + L.length + '</span></summary>' +
        '<p class="np-exp">' + esc(R[2]) + '</p><div class="np-tags">' + L.map(function (x) { return '<button type="button" data-id="' + x.c.id + '" title="Ver en la revisión y en el plano">' + esc(PID.tagDe(x.c) || '(sin tag)') + (x.extra ? '<small>' + esc(x.extra) + '</small>' : '') + '</button>'; }).join('') + '</div></details>';
    });
    $('#npCuerpo').innerHTML = h;
    var nErr = cnt.error + cnt.aviso, b = tab.querySelector('.npN'); b.hidden = !nErr; b.textContent = nErr;
  }
  function pintarNormas() {
    $('#npCuerpo').innerHTML = NORMAS.map(function (n) { return '<div class="np-norma"><h4><span>' + esc(n.s) + '</span>' + esc(n.t) + '</h4><p>' + esc(n.a) + '</p><p><b>En la app:</b> ' + esc(n.v) + '</p></div>'; }).join('');
  }
  function fila(k, v, nota) { return '<tr><td>' + k + '</td><td>' + esc(v) + (nota ? ' <span style="color:#9fb0c3">(' + nota + ')</span>' : '') + '</td></tr>'; }
  function pintarLetras() {
    var h = '<h3>Probar un tag</h3><div class="np-prueba"><input id="npTag" placeholder="Ej.: 100-PDSHH-0101" aria-label="Tag a probar" spellcheck="false"></div><div class="np-sal" id="npSal">Escribe un tag para ver cómo se lee según ISA-5.1.</div>';
    h += '<h3>Primera letra · variable medida o de inicio</h3><table class="np-l"><tbody>' + Object.keys(ISA.VAR).map(function (k) { return fila(k, ISA.VAR[k], ELECCION[k] ? 'a elección del usuario; uso habitual' : ''); }).join('') + '</tbody></table>';
    h += '<h3>Modificador de la primera letra</h3><table class="np-l"><tbody>' + Object.keys(ISA.MOD).map(function (k) { return fila(k, ISA.MOD[k]); }).join('') + '</tbody></table>';
    h += '<h3>Letras siguientes · función</h3><table class="np-l"><tbody>' + Object.keys(ISA.FUN).map(function (k) { return fila(k, ISA.FUN[k], k === 'H' || k === 'L' || k === 'M' ? 'también nivel de alarma o interruptor' : ''); }).join('') + '</tbody></table>';
    h += '<p style="color:#9fb0c3;font-size:12px">Formato de tag de la Suite: ÁREA-LETRAS-NÚMERO[SUFIJO], por ejemplo 100-LIT-0101 o 200-PDSH-0201A. El estándar del mandante puede definir otro formato.</p>';
    $('#npCuerpo').innerHTML = h;
  }
  function probar(t) {
    var s = $('#npSal'); t = String(t || '').trim().toUpperCase(); if (!t) { s.textContent = 'Escribe un tag para ver cómo se lee según ISA-5.1.'; return; }
    var a = ISA.analizar(t), p = a.letras ? revisarLetras(a.letras) : ['letras'];
    if (a.letras && !a.numero) p.push('numero');
    s.innerHTML = '<b>' + esc(ISA.describir(t) || '—') + '</b><br>Área: ' + esc(a.area || '—') + ' · Variable: ' + esc(a.variable ? a.variable + ' = ' + (ISA.VAR[a.variable] || '?') : '—') + (a.modificador ? ' · Modificador: ' + a.modificador + ' = ' + (ISA.MOD[a.modificador] || '?') : '') +
      ' · Funciones: ' + esc(a.funciones ? a.funciones.split('').map(function (f) { return f + ' = ' + (ISA.FUN[f] || '?'); }).join(', ') : '—') + ' · Lazo: ' + esc(a.numero || '—') +
      '<br>' + (p.length ? p.map(function (r) { return '<span class="g-' + REGLAS[r][0] + '">' + GTXT[REGLAS[r][0]] + ': ' + esc(REGLAS[r][1]) + '</span>'; }).join('<br>') : '<span style="color:#9BE3BD">Cumple las reglas de identificación que revisa la app.</span>');
  }
  function pintar() { if (vista === 'ver') pintarVer(); else if (vista === 'normas') pintarNormas(); else pintarLetras(); }
  pn.addEventListener('change', function (e) { if (e.target.id === 'npSoloVal') { soloVal = e.target.checked; pintarVer(); } });
  pn.addEventListener('input', function (e) { if (e.target.id === 'npTag') probar(e.target.value); });
  pn.addEventListener('click', function (e) {
    var b = e.target.closest('.np-tags button[data-id]'); if (!b) return;
    PID.seleccionar(b.dataset.id);
    abrir(false); // el panel tapa el visor: se cierra para ver el instrumento en el plano
  });
  // El contador de la pestaña se actualiza cuando cambia la revisión
  var t0 = 0;
  window.PID_NORMAS = { cambio: function () { clearTimeout(t0); t0 = setTimeout(function () { if (pn.classList.contains('abierto') && vista === 'ver') pintarVer(); else { var V = verificar(), n = V.hall.filter(function (h) { return REGLAS[h.r][0] !== 'info'; }).length, b = tab.querySelector('.npN'); b.hidden = !n; b.textContent = n; } }, 400); }, verificar: verificar, revisarLetras: revisarLetras };
  window.PID_NORMAS.cambio();
})();
