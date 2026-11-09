/* Especificaciones técnicas · armado del documento, vista, edición y Word · ReyEngi */
(function () {
  'use strict';

  var R = window.REProyectos, F = window.ET.familias, HD = window.HD;
  var LOGO = '../../img/logo-reyengi.png', MARCA = 'ReyEngi · Automatización y Control Industrial';

  function fam(id) { return F.filter(function (f) { return f.id === id; })[0]; }
  // Título en tipo oración, respetando siglas (PLC, SCADA, HMI, SIS, OT...)
  var SIGLAS = ['PLC', 'DCS', 'SCADA', 'HMI', 'SIS', 'OT', 'E/S'];
  function nombreFam(f) {
    var t = f.titulo.charAt(0) + f.titulo.slice(1).toLowerCase();
    SIGLAS.forEach(function (s) { t = t.replace(new RegExp('\\b' + s.toLowerCase().replace('/', '\\/') + '\\b', 'g'), s); });
    return t;
  }
  function datosEt(id) { return R.leer('et:' + id, { sel: null, v: {}, revs: null }); }
  function guardarEt(id, d) { R.escribir('et:' + id, d); }
  function seleccion(f, d) { return d.sel || f.instrumentos.map(function (i) { return i.id; }); }

  function numeroEt(f, pr) { return (pr.prefijoEt || '') + ('000' + (F.indexOf(f) + 1)).slice(-4); }
  function numeroDas(hojaId, pr) {
    if (!HD) return '';
    var i = HD.plantillas.map(function (p) { return p.id; }).indexOf(hojaId);
    return i < 0 ? '' : (pr.prefijo || '') + ('000' + (i + 1)).slice(-4);
  }
  function tituloDas(hojaId) {
    var p = HD && HD.plantillas.filter(function (x) { return x.id === hojaId; })[0];
    return p ? 'Hoja de datos – ' + p.titulo : hojaId;
  }

  // Sustituye {campo} por el dato del proyecto
  function tok(t, pr) {
    // {campo} o {campo|texto por defecto si el campo está vacío}
    return String(t).replace(/\{(\w+)(?:\|([^}]*))?\}/g, function (m, k, def) {
      var v = pr[k];
      if (v === undefined || v === null || String(v).trim() === '') return def !== undefined ? def : '[' + k + ']';
      return String(v);
    });
  }

  // ── Bloques generados con los datos del proyecto ───────────────────────────────
  function sitio(pr) {
    var L = [];
    function add(et, v, u) { if (v !== undefined && v !== null && String(v).trim() !== '') L.push(et + ': ' + v + (u ? ' ' + u : '')); }
    add('Lugar de instalación', pr.lugar);
    add('Tipo de ambiente', pr.ambiente);
    add('Altitud', pr.altura, 'm.s.n.m.');
    add('Presión barométrica', R.presionBarometrica(pr.altura), 'kPa abs');
    if (pr.tMin || pr.tMax) L.push('Temperatura ambiente (mín / normal / máx): ' + [pr.tMin, pr.tNor, pr.tMax].map(function (x) { return x || '—'; }).join(' / ') + ' °C');
    if (pr.hrMin || pr.hrMax) L.push('Humedad relativa (mín / normal / máx): ' + [pr.hrMin, pr.hrNor, pr.hrMax].map(function (x) { return x || '—'; }).join(' / ') + ' %');
    if (pr.precipProm || pr.precip24) L.push('Precipitación (promedio anual / máximo en 24 h): ' + (pr.precipProm || '—') + ' / ' + (pr.precip24 || '—') + ' mm');
    add('Carga de nieve', pr.nieve, 'kg/m²');
    add('Viento', pr.viento);
    add('Clima', pr.clima);
    add('Zona sísmica', pr.sismo);
    var out = [{ ul: L, gen: true }];
    var areas = R.filasTexto(pr.areas, 2);
    if (areas.length) {
      out.push({ p: 'Las altitudes y presiones barométricas de las áreas del proyecto son las siguientes:', gen: true });
      out.push({ tabla: { cab: 1, anchos: [90, 40, 40], filas: [['ÁREA', 'ALTITUD (m.s.n.m.)', 'PRESIÓN (kPa abs)']].concat(areas.map(function (a) { return [a[0], { t: a[1], c: true }, { t: R.presionBarometrica(a[1]), c: true }]; })) }, titulo: 'Condiciones por área' });
    }
    return out;
  }
  function referencias(f, sel, pr) {
    var filas = [], vistos = {};
    f.instrumentos.forEach(function (i) {
      if (sel.indexOf(i.id) < 0) return;
      (i.das || []).forEach(function (d) { if (!vistos[d]) { vistos[d] = 1; filas.push([numeroDas(d, pr), { t: pr.rev, c: true }, tituloDas(d)]); } });
    });
    (f.refsEt || []).forEach(function (id) { var g = fam(id); if (g) filas.push([numeroEt(g, pr), { t: pr.rev, c: true }, 'Especificación técnica ' + nombreFam(g).charAt(0).toLowerCase() + nombreFam(g).slice(1)]); });
    R.filasTexto(pr.refs, 3).forEach(function (r) { filas.push([r[0], { t: r[1], c: true }, r[2]]); });
    if (!filas.length) filas.push(['—', '', f.sistema ? 'Diagrama de arquitectura y criterios de diseño del Proyecto (por definir)' : 'Hojas de datos de los instrumentos (por definir)']);
    return [{ tabla: { cab: 1, anchos: [55, 15, 100], filas: [['CÓDIGO DOCUMENTO', 'REV', 'NOMBRE DOCUMENTO']].concat(filas) }, gen: true }];
  }
  function electrico(pr, f) {
    var L = [];
    if (!f.interruptores && !f.valvulas) L.push('Transmisores de 4 hilos: ' + pr.alim4h + '.', 'Transmisores de 2 hilos: ' + pr.alim2h + '.');
    if (f.valvulas) L.push('Instrumentos y accesorios de 4 hilos: ' + pr.alim4h + '.');
    if (f.sistema) { L = ['Alimentación principal: ' + pr.alim4h + ', desde UPS cuando corresponda.', 'Distribución de control, E/S y equipos de red: 24 VDC redundante.']; }
    return [{ p: 'En caso de requerir una alimentación distinta, se indicará en la hoja de datos correspondiente. Las alimentaciones especificadas son:', gen: true }, { ul: L.length ? L : ['Según hoja de datos.'], gen: true }];
  }

  // ── Documento completo ──────────────────────────────────────────────────────────
  function construir(f, pr, d) {
    var sel = seleccion(f, d);
    var instr = f.instrumentos.filter(function (i) { return sel.indexOf(i.id) >= 0; });
    var B = [];
    var cont = {};
    function k(cap) { cont[cap] = (cont[cap] || 0) + 1; return cap + '.' + cont[cap]; }
    function add(cap, b) {
      if (b.si) { if (String(pr[b.si] || '').trim()) b.b.forEach(function (x) { add(cap, x); }); return; }
      if (b.gen === 'sitio') return sitio(pr).forEach(function (x) { B.push(x); });
      if (b.gen === 'electrico') return electrico(pr, f).forEach(function (x) { B.push(x); });
      if (b.gen === 'referencias') return referencias(f, sel, pr).forEach(function (x) { B.push(x); });
      var c = Object.assign({}, b);
      if (!c.h && !c.gen) c.k = k(cap);
      B.push(c);
    }
    function cap(id, titulo, bloques) { B.push({ h: 1, t: titulo }); (bloques || []).forEach(function (b) { add(id, b); }); }
    function sub(id, n, titulo, bloques) { B.push({ h: n, t: titulo }); (bloques || []).forEach(function (b) { add(id, b); }); }
    var P = function (t) { return { p: t }; }, U = function (a) { return { ul: a }; };

    cap('intro', 'Introducción', [P('{intro}'), P('El presente documento corresponde a la especificación técnica de ' + f.objeto + ' del proyecto {proyecto}, en adelante el Proyecto. En este documento, {cliente} se denomina el Cliente.')]);
    cap('obj', 'Objetivo', [P('Este documento tiene como propósito especificar el diseño, la fabricación, las pruebas y el suministro de ' + f.objeto + ' que se indican en las hojas de datos, de acuerdo con los requerimientos del Cliente para el desarrollo del Proyecto.')]);
    cap('alc', 'Alcance y exclusiones', [
      P(f.servicio ? 'El alcance de la presente especificación comprende:' : f.sistema ? 'El alcance de la presente especificación comprende el suministro, la ingeniería y las pruebas de:' : 'El alcance de la presente especificación considera el suministro de los siguientes equipos:'),
      U(instr.map(function (i) { return i.t + '.'; }).concat(f.servicio ? [] : [f.sistema ? 'Accesorios, licencias y materiales necesarios para el funcionamiento del sistema.' : 'Accesorios necesarios para el funcionamiento de cada instrumento.'])),
      P(f.servicio ? 'Adicionalmente, el contratista debe contemplar:' : 'Adicionalmente, el suministro debe contemplar los siguientes requerimientos y servicios:'),
      U(f.servicio ? ['Procedimientos y protocolos aprobados por el Cliente.', 'Personal calificado, herramientas e instrumentos patrón calibrados.', 'Registro y cierre de observaciones.', 'Dossier de calidad y documentación conforme a construcción.'] : ['Planos de fabricación certificados.', 'Certificados de calibración y de pruebas en fábrica.', 'Pruebas de aceptación en fábrica (FAT), de configuración (CAT) y en sitio (SAT).',
        'Manuales de instalación, operación y mantenimiento en {idioma}.'.replace('{idioma}', 'español'), 'Repuestos para la puesta en marcha y el primer año de operación.',
        'Listado de repuestos, con precios unitarios, para {repuestosAnios} años de operación.', 'Asistencia técnica en terreno para la puesta en marcha.', 'Pruebas de puesta en servicio.',
        'Embalaje y transporte hasta las instalaciones indicadas por el Cliente.']),
      P('La cantidad de instrumentos y sus características particulares se encuentran en las hojas de datos que acompañan a esta especificación. Todos los instrumentos serán de diseño probado, de tipo estándar y de fabricación reciente, en estricta concordancia con las condiciones de trabajo indicadas en esta especificación y en las hojas de datos.'),
      P('Cualquier elemento de una nueva tecnología no considerado en este documento será evaluado según las necesidades del Proyecto, para su posterior aprobación por parte del Cliente.'),
      P('Los siguientes ítems están excluidos del alcance de esta especificación:'),
      U(['Soportes y pernos de montaje, salvo que la hoja de datos indique lo contrario.', 'Materiales y labores de instalación no detallados explícitamente en las hojas de datos.',
        'Conexiones, cables y conduits externos de fuerza y control.', 'Instalación.', 'Alimentación eléctrica externa de los instrumentos.'])
    ]);
    cap('serv', 'Condiciones generales de servicio', [P('A continuación se presentan las condiciones generales de servicio a considerar para el correcto dimensionamiento de los equipos.')]);
    sub('serv1', 2, 'Condiciones ambientales y sísmicas', [P('Los equipos se suministrarán para trabajo continuo, 24 horas al día, 7 días a la semana, 52 semanas al año, en un ambiente expuesto a contaminación y con partículas en suspensión. Las condiciones del sitio son las siguientes:'), { gen: 'sitio' }]);
    sub('serv2', 2, 'Condiciones de operación', [
      P('Cada equipo y sus componentes funcionarán satisfactoriamente en las condiciones ambientales indicadas y de acuerdo con las particularidades consignadas en sus hojas de datos.'),
      P('Los elementos en contacto con el proceso considerarán las características físicas y químicas de los fluidos.'),
      P('Los equipos, incluyendo todos sus componentes y accesorios, soportarán sin daño los esfuerzos producidos por los movimientos sísmicos que puedan ocurrir.')
    ]);
    if (!f.servicio) sub('serv3', 3, 'Suministro eléctrico', [P(f.alimTexto ? f.alimTexto : f.interruptores ? 'Los interruptores operarán con tensión de control {tensionControl}, desde el tablero o gabinete más cercano.' : f.valvulas ? 'Los actuadores eléctricos se alimentarán en {alimMotor}; la tensión de control será {tensionControl}.' : 'Los instrumentos de 4 hilos se alimentarán en {alim4h} desde el gabinete de alimentación más cercano; los de 2 hilos, en {alim2h}. Una tensión distinta se indicará en la hoja de datos.')]);
    sub('serv4', 2, 'Grado de protección', [P('El grado de protección se especifica según NEMA 250. Si el equipo ofrecido indica su protección según IEC 60529 (IP), el proveedor indicará la equivalencia de acuerdo con la publicación NEMA "A Brief Comparison of NEMA 250 and IEC 60529". El grado de protección mínimo en exterior será {proteccion} y en zonas corrosivas {protCorrosivo}.')]);
    sub('serv5', 2, 'Clasificación de áreas', [P('La clasificación de área del Proyecto es: {area}. Las instalaciones en lugares con riesgo de incendio o explosión por gases, vapores, líquidos inflamables, polvos o fibras combustibles se regirán por el Artículo 500 del NEC o por la serie IEC 60079, según se indique en la hoja de datos.')]);
    cap('normas', 'Códigos y normas', [
      P('El diseño, la fabricación y las pruebas de los equipos cumplirán con las normas, códigos y estándares siguientes, en su última edición:'),
      U(['NEMA: National Electrical Manufacturers Association', 'NEC / NFPA 70: National Electrical Code', 'IEC: International Electrotechnical Commission', 'ISA: International Society of Automation', 'ANSI / ASME: American National Standards Institute / American Society of Mechanical Engineers', 'ASTM: American Society for Testing and Materials', 'ISO: International Organization for Standardization', 'IEEE: Institute of Electrical and Electronics Engineers', 'UL: Underwriters Laboratories', 'NCh: Normas Chilenas Oficiales (NCh 2369 Of. 2003, diseño sísmico)', 'SEC: Superintendencia de Electricidad y Combustibles; Pliegos Técnicos Normativos RIC']
        .concat(f.normas || [])),
      P('Adicionalmente, el diseño satisfará todas las leyes, reglamentos y ordenanzas locales. Ante conflictos entre normas se aplicará la de mayor rigor, y la decisión final corresponderá al Cliente. Ante discrepancias entre los códigos, las hojas de datos y los productos ofrecidos, el proveedor las informará al Cliente para su evaluación.'),
      P('Cualquier omisión en las normas o en esta especificación no libera al proveedor de la responsabilidad de que lo suministrado sea apto para el fin al que será destinado.')
    ]);
    cap('unid', 'Unidades de medida de ingeniería', [
      P('Las unidades de ingeniería usadas en planos, documentos, especificaciones y hojas de datos se basarán en el Sistema Internacional (SI), incluyendo las de uso frecuente en proyectos de instrumentación.'),
      P('Las unidades y los rangos de operación de cada variable se indican en la hoja de datos de cada instrumento.')
    ]);
    cap('ref', 'Antecedentes y referencias', [P('Para el desarrollo de este documento se han utilizado los siguientes planos y documentos:'), { gen: 'referencias' }]);
    cap('dis', f.sistema ? 'Requerimientos técnicos' : 'Diseño y construcción', [P('El diseño y la construcción de los equipos y sus accesorios permitirán instalarlos y operarlos de acuerdo con los códigos, normas y condiciones de este documento, las hojas de datos y los criterios de diseño de instrumentación y control del Proyecto, cumpliendo además con lo siguiente.')]);
    sub('gen', 2, 'Características generales', f.general);
    var nI = f.sistema ? 2 : 3;
    instr.forEach(function (i) {
      B.push({ h: nI, t: i.t });
      i.b.forEach(function (b) { if (b.h) B.push({ h: nI + 1, t: b.t }); else add('i-' + i.id, b); });
    });
    if (f.electrico) sub('ele', 2, f.valvulas ? 'Diseño eléctrico de actuadores' : 'Diseño eléctrico', f.electrico);
    if (!f.servicio) sub('prot', 2, 'Grado de protección', [P('Para equipos en exterior el grado de protección será {proteccion}. Un grado de protección IP equivalente quedará sujeto a la aprobación del Cliente.')]);
    if (!f.sistema) sub('caja', 2, 'Diseño de caja de conexión', [
      P('Todos los puntos eléctricos estarán alambrados a una regleta interior de fácil acceso.'),
      P('Los bornes serán para servicio pesado, con capacidad mínima de 5 A, y aceptarán dos conductores N° 14 AWG por borne.'),
      P('El alambrado será de propósito general para áreas no clasificadas, salvo lo indicado en la hoja de datos de cada instrumento. Las entradas de alimentación y de señal serán independientes.')
    ]);
    if (f.senales) sub('sen', 2, 'Señales transmitidas', f.senales);
    if (f.rango) sub('ran', 2, f.valvulas ? 'Dimensionamiento' : 'Rango y precisión', f.rango);
    (f.extra || []).forEach(function (x, j) { sub('x' + j, 2, x.t, x.b); });
    if (!f.servicio) cap('cal', 'Calibración', [
      P('Los equipos serán probados y calibrados en fábrica antes del embarque, según los procedimientos estándar del fabricante y las normas de este documento, para garantizar el funcionamiento en los rangos y condiciones de las hojas de datos.'),
      P('El proveedor adjuntará el certificado y el protocolo de calibración de cada instrumento, identificado por su TAG.'),
      P('Si se requiere un dispositivo especial para la calibración o verificación en terreno, el proveedor lo informará al Cliente para que decida su adquisición.')
    ]);
    if (!f.servicio) cap('pint', 'Pintura y terminaciones', [P('Todas las partes expuestas al ambiente tendrán un tratamiento de pintura adecuado a las condiciones del sitio, aplicado en fábrica según el estándar del fabricante, el que se indicará en la oferta.')]);
    cap('insp', 'Inspección y pruebas', [
      P('El proveedor entregará la información que certifique el plan de control y aseguramiento de calidad del diseño, la fabricación y la calibración.'),
      P('El proveedor recomendará los procedimientos y programas de prueba que garanticen el buen funcionamiento, la seguridad eléctrica y la integridad mecánica. Los parámetros medidos (señal de salida, carga, etc.) se registrarán en protocolos.'),
      P('El proveedor avisará con {aviso} días hábiles de anticipación para coordinar la inspección final en fábrica. Las inspecciones parciales no lo eximen de la garantía.'),
      P('Si un equipo no cumple los requerimientos especificados, el proveedor realizará las correcciones necesarias a la brevedad y sin costo para el Cliente.')
    ].concat(f.pruebas || []).concat(f.valvulas ? [P('Cada conjunto válvula-actuador se probará en fábrica: prueba hidrostática del cuerpo, prueba de asiento según la clase de fuga especificada y prueba funcional del actuador con registro del tiempo de carrera y de la presión o torque necesario a la presión diferencial máxima.')] : []));
    cap('acep', 'Aceptación', [P('Una vez instalado el equipo y demostrada y aprobada su correcta operación por el Cliente, el equipo será aceptado, sujeto solo a la garantía indicada en esta especificación.')]);
    cap('resp', 'Responsabilidad del proveedor', [
      P('El proveedor suministrará los equipos indicados en las hojas de datos con todos los accesorios y cables especiales necesarios para su operación correcta y continua, aunque no estén señalados explícitamente.'),
      P('El proveedor será responsable de la correcta selección y aplicación de los equipos ofrecidos y de su correcto funcionamiento.')
    ]);
    if (!f.servicio) cap('sum', 'Suministro', [P('Los equipos se suministrarán de acuerdo con esta especificación y con las hojas de datos. El TAG de cada instrumento se indicará en los documentos comerciales y en el embalaje, asegurando su trazabilidad hasta la bodega del Cliente y su montaje.')]);
    if (!f.servicio) cap('emb', 'Embalaje, transporte y lugar de entrega', [
      P('El proveedor será responsable del transporte hasta la dirección indicada en la orden de compra.'),
      P('El embalaje resistirá sin daño el transporte y el almacenamiento prolongado en terreno, a prueba de golpes y humedad. Cada bulto se marcará con: nombre del proveedor, destinatario, número de orden de compra, número de ítem, TAG del equipo y peso bruto, e incluirá lista de empaque y de partes.'),
      P('Los repuestos, planos y catálogos se embalarán por separado y debidamente identificados.')
    ]);
    cap('gar', 'Garantías técnicas y repuestos', [
      P('El proveedor garantizará que los equipos están libres de defectos de materiales y fabricación por {garantiaPem} meses desde la puesta en marcha o {garantiaRec} meses desde la recepción, lo que ocurra primero, e indicará en su oferta el procedimiento de garantía.'),
      P('Ante un aviso de falla durante la garantía, el proveedor suministrará sin costo la asesoría y el reemplazo de los componentes defectuosos. Las inspecciones del Cliente no liberan al proveedor de esta responsabilidad.'),
      P('La oferta incluirá los números de parte y precios de los repuestos recomendados, y la ubicación del stock de repuestos más cercano.')
    ]);
    cap('cal2', 'Requerimientos de calidad', [P('Los equipos se diseñarán y fabricarán bajo un plan de control y aseguramiento de calidad del fabricante, preferentemente certificado según ISO 9001. El proveedor entregará la información que el Cliente estime necesaria para verificarlo.')]);
    cap('exc', 'Excepciones a esta especificación', [P('Toda excepción a esta especificación deberá ser presentada por escrito en la oferta y aprobada por escrito por el Cliente.')]);
    if (String(pr.capacitacion || '').trim()) {
      cap('capa', 'Capacitación', [
        P('El proveedor incluirá en su oferta, como ítem opcional, la capacitación en terreno del personal de operación y mantenimiento, considerando {capacitacion} participantes, con material de apoyo, horas y temario, que incluirá como mínimo:'),
        U(['Operación.', 'Configuración y calibración.', 'Mantenimiento preventivo y correctivo.', 'Cambio de componentes.'])
      ]);
    }
    cap('pem', 'Apoyo a montaje y puesta en marcha', [P('El proveedor suministrará, opcionalmente y a requerimiento del Cliente, personal calificado e instrumental para la revisión del montaje, el alambrado, la calibración y la puesta en marcha de los equipos.')]);
    cap('ofe', 'Información que debe incluir la oferta', [
      P('El proveedor entregará toda la información necesaria para el análisis técnico de lo ofrecido, aun cuando esta especificación presente omisiones.'),
      P('El proveedor completará las hojas de datos indicando en la columna "Propuesto" si lo ofrecido cumple con lo indicado en la columna "Especificado".'),
      P('La oferta incluirá como mínimo:'),
      U(['Características operativas, mecánicas y eléctricas de los equipos y accesorios.', 'Catálogos con la descripción técnica de los equipos.', 'Planos dimensionales y diagramas de conexión.', 'Lista valorizada de repuestos para la puesta en marcha y {repuestosAnios} años de operación.', 'Certificado de no obsolescencia de {obsolescencia} años.', 'Lista de excepciones a esta especificación.'])
    ]);
    sub('ofe2', 2, 'Información requerida al proveedor adjudicado', [
      P('El proveedor adjudicado entregará para aprobación, en copia impresa y digital:'),
      U(['Planos de los equipos con dimensiones y pesos.', 'Planos de montaje y diagramas de alambrado.', 'Manuales de instalación, operación, configuración y mantenimiento.', 'Lista de repuestos y consumibles.', 'Protocolos de pruebas, calibración y puesta en marcha.']),
      P('Los manuales y planos se entregarán en formato PDF y, cuando aplique, en formato CAD (DWG).')
    ]);

    // Numeración y textos finales
    var n = [0, 0, 0, 0];
    B.forEach(function (b) {
      if (b.h) {
        n[b.h - 1]++; for (var j = b.h; j < 4; j++) n[j] = 0;
        b.num = n.slice(0, b.h).join('.');
      }
      if (b.k && d.v[b.k] !== undefined) {
        if (b.p !== undefined) b.p = d.v[b.k];
      }
      if (b.k && b.ul) b.ul = b.ul.map(function (t, i) { var o = d.v[b.k + '#' + i]; return o !== undefined ? o : t; });
      if (b.p !== undefined) b.p = tok(b.p, pr);
      if (b.ul) b.ul = b.ul.map(function (t) { return tok(t, pr); });
    });
    return B;
  }

  function portada(f, pr, d) {
    var revs = d.revs || [[pr.rev || 'A', pr.porFecha || R.hoy(), 'Emitido para revisión interna']];
    return {
      datos: [['TIPO DOCUMENTO', 'ESPECIFICACIÓN TÉCNICA'], ['EMPRESA DE INGENIERÍA', pr.contratista || '—'], ['TÍTULO', 'ESPECIFICACIÓN TÉCNICA ' + f.titulo], ['TÍTULO PROYECTO', pr.proyecto], ['CLIENTE', pr.cliente],
        ['ID', pr.idCliente || '—'], ['CÓDIGO', numeroEt(f, pr)], ['FECHA DOCUMENTO', revs[revs.length - 1][1] || R.hoy()]],
      control: [['Preparado por', pr.por, 'Ingeniero de Proyecto'], ['Revisado por', pr.reviso, 'Jefe de Disciplina'], ['Aprobado por', pr.aprobo, 'Jefe de Proyecto'],
        ['Revisado por el Cliente', pr.revisoCliente, 'Contraparte'], ['Aprobado por el Cliente', pr.aproboCliente, 'Jefe de Proyecto']],
      revs: revs
    };
  }

  // ── Vista HTML ─────────────────────────────────────────────────────────────────
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tablaHtml(t) {
    var h = '<table class="tb">';
    t.filas.forEach(function (fila, i) {
      h += '<tr>' + fila.map(function (c) {
        if (c === null) return '';
        if (typeof c !== 'object') c = { t: c };
        var tag = i < (t.cab || 0) ? 'th' : 'td';
        return '<' + tag + (c.cs > 1 ? ' colspan="' + c.cs + '"' : '') + (c.c ? ' class="c"' : '') + '>' + e(c.t) + '</' + tag + '>';
      }).join('') + '</tr>';
    });
    return h + '</table>';
  }
  function html(f, pr, d) {
    var B = construir(f, pr, d), P = portada(f, pr, d), codigo = numeroEt(f, pr);
    var h = ['<article class="doc">'];
    h.push('<section class="portada"><div class="pt-marca"><img src="' + LOGO + '" alt="ReyEngi"><span>' + e(MARCA) + '</span></div>');
    h.push(tablaHtml({ cab: 0, filas: P.datos.map(function (r) { return [{ t: r[0] }, { t: r[1] }]; }) }).replace('<table class="tb">', '<table class="tb pt-datos">'));
    h.push(tablaHtml({ cab: 1, filas: [['Control', 'Nombre', 'Rol', 'Firma', 'Fecha']].concat(P.control.map(function (r) { return [r[0], r[1] || '', r[2], '', '']; })) }));
    h.push('<div class="revs">' + tablaHtml({ cab: 1, filas: [['Revisión', 'Descripción', 'Fecha']].concat(P.revs.map(function (r) { return [{ t: r[0], c: true }, r[2], { t: r[1], c: true }]; })) }) +
      '<div class="no-imprimir acc"><button type="button" data-accion="rev">+ Agregar revisión</button></div></div>');
    h.push('</section>');
    h.push('<section class="indice"><h2>Tabla de contenido</h2><ol>' + B.filter(function (b) { return b.h && b.h <= 2; }).map(function (b) {
      return '<li class="n' + b.h + '"><a href="#s-' + b.num.replace(/\./g, '-') + '">' + e(b.num + '  ' + b.t) + '</a></li>';
    }).join('') + '</ol></section>');
    h.push('<section class="cuerpo">');
    B.forEach(function (b) {
      var ed = b.k ? ' data-k="' + e(b.k) + '" contenteditable="true" spellcheck="true"' : '';
      if (b.h) h.push('<h' + Math.min(6, b.h + 1) + ' id="s-' + b.num.replace(/\./g, '-') + '"><span class="num">' + e(b.num) + '</span> ' + e(b.t) + '</h' + Math.min(6, b.h + 1) + '>');
      else if (b.ul) h.push('<ul>' + b.ul.map(function (t, i) { return '<li' + (b.k ? ' data-k="' + e(b.k + '#' + i) + '" contenteditable="true"' : '') + '>' + e(t) + '</li>'; }).join('') + '</ul>');
      else if (b.tabla) h.push(tablaHtml(b.tabla));
      else if (b.p !== undefined) h.push('<p' + ed + (b.gen ? ' class="gen"' : '') + '>' + e(b.p) + '</p>');
    });
    h.push('</section></article>');
    return { html: h.join(''), codigo: codigo };
  }

  // ── Word ──────────────────────────────────────────────────────────────────────────
  function word(f, pr, d, logo) {
    var B = construir(f, pr, d), P = portada(f, pr, d), codigo = numeroEt(f, pr), C = 'DCE3EB';
    var bloques = [];
    bloques.push(logo ? { p: '', img: 70, c: true } : { p: 'ReyEngi', b: true, c: true, sz: 32, color: '022A55' });
    bloques.push({ p: MARCA, c: true, sz: 16, color: '5A6573' });
    bloques.push({ p: '', c: true });
    bloques.push({ tabla: { anchos: [45, 125], filas: P.datos.map(function (r) { return [{ t: r[0], b: true, fill: C, color: '022A55' }, { t: r[1], b: r[0] === 'TÍTULO' || r[0] === 'CÓDIGO' }]; }) } });
    bloques.push({ tabla: { cab: 1, anchos: [42, 30, 42, 30, 26], filas: [['Control', 'Nombre', 'Rol', 'Firma', 'Fecha']].concat(P.control.map(function (r) { return [{ t: r[0], b: true }, { t: r[1] || '', c: true }, r[2], '', '']; })) } });
    bloques.push({ tabla: { cab: 1, anchos: [25, 110, 35], filas: [['Revisión', 'Descripción', 'Fecha']].concat(P.revs.map(function (r) { return [{ t: r[0], c: true }, r[2], { t: r[1], c: true }]; })) } });
    bloques.push({ p: 'CONTROL DE CAMBIOS', b: true, color: '022A55' });
    bloques.push({ tabla: { cab: 1, anchos: [22, 25, 18, 75, 30], filas: [['Revisión', 'Fecha', 'Página', 'Descripción del cambio', 'Responsable'], ['', '', '', '', ''], ['', '', '', '', '']] } });
    bloques.push({ salto: true });
    bloques.push({ indice: true });
    bloques.push({ salto: true });
    var cuerpo = [];
    B.forEach(function (b) {
      if (b.h === 1 && cuerpo.length) cuerpo.push({ salto: false });
      if (b.h) cuerpo.push({ h: b.h, t: b.t, num: b.num });
      else if (b.ul) cuerpo.push({ ul: b.ul });
      else if (b.tabla) cuerpo.push({ tabla: b.tabla });
      else if (b.p !== undefined) cuerpo.push({ p: b.p });
    });
    // El índice necesita ver los títulos: se le pasan todos los bloques
    var todos = bloques.concat(cuerpo.filter(function (b) { return b.salto !== false; }));
    return window.DOCX.generar({
      titulo: 'Especificación técnica ' + f.titulo, autor: pr.contratista || 'ReyEngi',
      encabezado: [
        [logo ? { t: '', img: 34, c: true } : { t: 'ReyEngi', b: true, c: true }, { t: pr.proyecto || '', c: true }, { t: codigo, b: true, c: true }],
        [{ t: pr.cliente || '', c: true }, { t: 'ESPECIFICACIÓN TÉCNICA ' + f.titulo, c: true, b: true }, { t: 'Rev. ' + (P.revs[P.revs.length - 1][0] || '') + '  ·  {PAG}', c: true }]
      ],
      logo: logo,
      anchosEncabezado: [42, 86, 42],
      pie: codigo,
      bloques: todos
    });
  }

  function cargarLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) {
      if (!b) return null;
      var u = new Uint8Array(b), dv = new DataView(b);
      // tamaño en píxeles desde la cabecera PNG (IHDR)
      return { bytes: u, w: dv.getUint32(16), h: dv.getUint32(20) };
    }).catch(function () { return null; });
  }
  function descargarWord(id) { return cargarLogo().then(function (logo) { guardarWord(id, logo); }); }
  function guardarWord(id, logo) {
    var f = fam(id), pr = R.activo(), d = datosEt(id);
    var bytes = word(f, pr, d, logo), nombre = (numeroEt(f, pr) + ' ET ' + f.titulo).replace(/[\\/:*?"<>|]+/g, '-') + '.docx';
    var url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    var a = document.createElement('a'); a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  window.ETApp = {
    fam: fam, nombreFam: nombreFam, datosEt: datosEt, guardarEt: guardarEt, seleccion: seleccion, numeroEt: numeroEt,
    construir: construir, html: html, word: word, descargarWord: descargarWord
  };
})();
