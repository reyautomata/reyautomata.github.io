/* Hojas de datos · mejoras a partir de hojas de datos reales de proyectos mineros · ReyEngi
 *
 * Toma la estructura de hojas de datos emitidas en proyectos (datos de línea, proceso con
 * corrosivo/erosivo y tóxico/acumulativo, sensor y transmisor por separado, sello, trim y
 * posicionador en válvulas, actividades y servicios en sistemas, accesorios) y la aplica a las
 * hojas tipo. Los datos son genéricos: no se copian clientes, proyectos ni TAG reales.
 *
 * - reemplaza(id, def): mejora una hoja existente manteniendo su número de documento.
 * - agrega(grupo, def): hoja nueva al final de la lista.
 * Las filas con S('senal'), S('alim2h'), S('alim4h'), S('bus') toman los criterios del proyecto.
 */
(function () {
  'use strict';

  var HD = window.HD, U = HD.util, P = HD.plantillas;
  var f = U.f, S = U.S, mnm = U.mnm, GENERAL = U.GENERAL, SITIO = U.SITIO, REQUISITOS = U.REQUISITOS;
  var C_TAG = U.C_TAG, C_SERV = U.C_SERV, C_PID = U.C_PID, C_DET = U.C_DET;
  var TA = HD.TA, EPV = HD.EPV, REQ = 'Requerido', NA = 'N.A.';
  var C_REV = { t: 'REV', w: 5 }, C_LINEA = { t: 'LÍNEA O EQUIPO', w: 18 };

  function reemplaza(id, def) {
    var i = P.map(function (p) { return p.id; }).indexOf(id);
    if (i < 0) return;
    def.id = id; def.grupo = P[i].grupo; def.visores = P[i].visores; def.notas = def.notas || [];
    P[i] = def;
  }
  function agrega(grupo, def) { def.grupo = grupo; def.visores = def.visores || []; def.notas = def.notas || []; P.push(def); }

  // ── Bloques comunes ─────────────────────────────────────────────────────────────
  function LINEA() {
    return { s: 'DATOS DE LÍNEA', r: [f('N° de línea', '', TA), f('Diámetro de la línea', 'pulg', TA), f('Clase / schedule', '', TA), f('Material de la línea', '', TA)] };
  }
  function PROCESO(extra) {
    return { s: 'DATOS DE PROCESO', r: [
      f('Fluido', '', TA), f('Corrosivo / erosivo', '', TA), f('Tóxico / acumulativo', '', TA)
    ].concat(extra || [f('Presión', 'kPa g', TA), f('Temperatura', '°C', TA), f('Densidad / pH', 't/m³ / –', TA)]) };
  }
  function TRANSMISOR(extra, despues) {
    return { s: 'TRANSMISOR', r: [
      f('Tipo', '', 'Electrónico, basado en microprocesador')
    ].concat(extra || [], [
      f('Tipo de señal', '', S('senal')),
      f('Protocolo de comunicaciones', '', S('bus')),
      f('Exactitud', '% del span', '0,25 o mejor'),
      f('Ajuste de cero y span', '', 'Local y remoto'),
      f('Alarma de falla', '', 'Requerida (NAMUR NE 43)'),
      f('Indicación local', '', 'LCD, 4 dígitos, unidades de ingeniería'),
      f('Configurado por', '', 'Fabricante, según Tabla de Aplicación'),
      f('Material de encapsulamiento', '', 'Aluminio con pintura epóxica / AISI 316'),
      f('Grado de protección', '', 'NEMA 4X / IP66'),
      f('Conexión eléctrica', '', '1/2" NPT'),
      f('Bornes', 'mm²', '2,5')
    ], despues || []) };
  }
  function ACCESORIOS(extra) {
    return { s: 'ACCESORIOS', r: (extra || []).concat([f('Protección contra transientes', '', REQ), f('Kit de montaje', '', REQ)]) };
  }
  function SERVICIOS(extra) {
    return { s: 'ACTIVIDADES Y SERVICIOS', r: [
      f('Ingeniería (planos y documentos)', '', REQ), f('Pruebas FAT', '', REQ), f('Pruebas CAT', '', REQ),
      f('Precomisionamiento y comisionamiento', '', REQ), f('Pruebas SAT', '', REQ), f('Puesta en marcha', '', REQ),
      f('Capacitación', '', REQ)
    ].concat(extra || []) };
  }
  // Requisitos sin repetir el kit de montaje (ya va en ACCESORIOS)
  function CERT(extra) {
    var r = REQUISITOS(extra);
    r.r = r.r.filter(function (x) { return x.d !== 'Kit de montaje'; });
    r.s = 'CERTIFICADOS Y DOCUMENTOS';
    return r;
  }

  // ── Presión ─────────────────────────────────────────────────────────────────────
  reemplaza('pi', {
    tag: 'PI', titulo: 'Manómetro', hoja: 'MANÓMETRO',
    secciones: [GENERAL(), SITIO(), LINEA(), PROCESO(),
      { s: 'MANÓMETRO', r: [
        f('Tipo de elemento', '', 'Tubo Bourdon'), f('Diámetro de dial', 'mm', '100 (4")'), f('Rango', 'kPa g', TA),
        f('Clase de exactitud', '', '1,0 (EN 837-1) / grado 1A (ASME B40.100)'), f('Material de caja y bisel', '', 'AISI 304'),
        f('Material de elemento y conexión', '', 'AISI 316L'), f('Llenado de caja', '', 'Glicerina'), f('Visor', '', 'Vidrio laminado de seguridad'),
        f('Dispositivo de alivio', '', 'Tapón de alivio'), f('Conexión a proceso', '', '1/2" NPT M, inferior'), f('Grado de protección', '', 'IP65')
      ] },
      { s: 'SELLO DE DIAFRAGMA', r: [
        f('Requerido', '', TA), f('Tipo / conexión a proceso', '', TA), f('Material del diafragma', '', TA),
        f('Material del cuerpo', '', 'AISI 316'), f('Fluido de llenado', '', 'Silicona'), f('Conexión de lavado (flushing)', '', 'Requerida en pulpa')
      ] },
      ACCESORIOS([f('Válvula de bloqueo y purga', '', 'AISI 316, 1/2" NPT'), f('Amortiguador de pulsaciones', '', 'Requerido en descarga de bombas')]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 10 },
      { t: 'PRESIÓN (kPa g)', sub: ['MÍN', 'MÁX'], w: 7 }, { t: 'T (°C)', w: 6 }, { t: 'RANGO (kPa g)', w: 10 },
      { t: 'SELLO / DIAFRAGMA', w: 14 }, C_PID, C_DET, C_REV],
      filas: [['2200-PI-0101', 'Descarga bomba de ciclones', '14"-SL-2200-001', 'Pulpa', '80', '220', '25', '0 – 400', 'Bridado 3" / Hastelloy C276', '—', '1-B', 'A'],
        ['4100-PI-0201', 'Descarga bomba agua fresca', '8"-WF-4100-010', 'Agua', '300', '600', '15', '0 – 1.000', 'Sin sello', '—', '1-A', 'A']] }
  });

  reemplaza('pit', {
    tag: 'PIT', titulo: 'Transmisor de presión', hoja: 'TRANSMISOR DE PRESIÓN',
    secciones: [GENERAL(), SITIO(), LINEA(), PROCESO(),
      { s: 'SENSOR', r: [
        f('Variable medida', '', 'Presión manométrica'), f('Tipo de sensor', '', 'Piezorresistivo / capacitivo (EPV)'),
        f('Material del diafragma (partes húmedas)', '', TA), f('Fluido de relleno', '', 'Silicona'),
        f('Conexión a proceso', '', '1/2" NPT H'), f('Límites del sensor', 'kPa g', EPV)
      ] },
      TRANSMISOR([f('Rango calibrado', 'kPa g', TA), f('Alimentación', '', S('alim2h')), f('Montaje', '', 'Tubo de 2"')]),
      { s: 'SELLO DE DIAFRAGMA', r: [
        f('Requerido', '', TA), f('Removible', '', 'Sí'), f('Conexión de lavado (flushing)', '', REQ), f('Tipo / diámetro de conexión', '', TA),
        f('Material del cuerpo', '', 'AISI 316'), f('Capilar', '', TA), f('Largo del capilar', 'm', TA), f('Armadura del capilar', '', 'AISI 316')
      ] },
      ACCESORIOS([f('Manifold', '', '2 vías, AISI 316'), f('Amortiguador de pulsaciones', '', 'Según servicio'), f('Conduit de llegada', '', 'Flexible liquid-tight 1/2"')]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 10 },
      { t: 'PRESIÓN (kPa g)', sub: ['MÍN', 'MÁX'], w: 7 }, { t: 'T (°C)', sub: ['MÍN', 'MÁX'], w: 6 }, { t: 'RANGO (kPa g)', w: 10 },
      { t: 'SELLO / CAPILAR', w: 14 }, C_PID, C_DET, C_REV],
      filas: [['2200-PIT-0110', 'Presión alimentación ciclones', '14"-SL-2200-002', 'Pulpa', '60', '160', '15', '35', '0 – 250', 'Bridado 3" / sin capilar', '—', '2-B', 'A'],
        ['4100-PIT-0210', 'Presión impulsión agua recuperada', '12"-WR-4100-004', 'Agua', '250', '550', '10', '25', '0 – 1.000', 'Sin sello', '—', '2-A', 'A'],
        ['2300-PIT-0320', 'Presión aire a celdas', '24"-AL-2300-001', 'Aire', '30', '60', '10', '40', '0 – 100', 'Roscado 1" / 1,5 m', '—', '2-C', 'A']] },
    notas: ['Si se ofrece anillo de lavado, se debe considerar tapón de cierre.']
  });

  // ── Flujo ───────────────────────────────────────────────────────────────────────
  reemplaza('fit-mag', {
    tag: 'FIT', titulo: 'Flujómetro electromagnético', hoja: 'FLUJÓMETRO ELECTROMAGNÉTICO',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Flujo', 'm³/h', TA), f('Velocidad', 'm/s', TA), f('Presión', 'kPa g', TA), f('Temperatura', '°C', TA), f('Densidad / % sólidos', 't/m³ / %', TA), f('Conductividad mínima', 'µS/cm', '≥ 5')]),
      { s: 'SENSOR', r: [
        f('Tipo de tubo', '', 'Bridado, forma estándar'), f('Diámetro del tubo', 'pulg', TA), f('Conexión a proceso', '', 'Bridas ASME B16.5 Clase 150 RF'),
        f('Material del tubo / bridas', '', 'AISI 304 / acero al carbono'), f('Material del liner', '', TA), f('Empaquetaduras', '', 'Incluidas (EPV)'),
        f('Electrodos', '', 'Estándar, material según fluido (EPV)'), f('Puesta a tierra', '', 'Anillos, material según fluido (EPV)'),
        f('Indicación de dirección de flujo', '', REQ), f('Grado de protección', '', 'IP68 / NEMA 6P'), f('Alimentación', '', 'Desde el transmisor')
      ] },
      TRANSMISOR([f('Montaje', '', TA), f('Largo de cable sensor-transmisor', 'm', TA), f('Rango calibrado', 'm³/h', TA), f('Alimentación', '', S('alim4h')),
        f('Totalizador / salida de pulsos', '', 'Requerido'), f('Contacto on/off de salida', '', REQ), f('Diagnósticos', '', 'Tubería vacía, electrodo recubierto, verificación en línea')]),
      { s: 'INSTALACIÓN', r: [f('Tramos rectos', '', '5 DN aguas arriba / 3 DN aguas abajo'), f('Orientación', '', 'Vertical con flujo ascendente (pulpa)')] },
      ACCESORIOS(),
      CERT([f('Calibración', '', 'En banco húmedo, certificado trazable')])],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 9 }, { t: 'DN (pulg)', w: 6 }, { t: 'LINER', w: 9 },
      { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 }, { t: 'RANGO (m³/h)', w: 9 }, { t: 'P MÁX (kPa g)', w: 7 }, { t: '% SÓL.', w: 5 }, { t: 'MONTAJE', w: 8 }, C_PID, C_REV],
      filas: [['2200-FIT-0130', 'Alimentación a ciclones', '14"-SL-2200-002', 'Pulpa', '14', 'Poliuretano', '900', '1.250', '1.500', '0 – 2.000', '250', '55', 'Remoto', '—', 'A'],
        ['4100-FIT-0230', 'Agua fresca a molienda', '6"-WF-4100-020', 'Agua', '6', 'PTFE', '80', '150', '220', '0 – 300', '600', '0', 'Compacto', '—', 'A']] },
    notas: ['El Vendedor debe entregar los dos anillos de puesta a tierra en material adecuado para el fluido.']
  });

  agrega('Flujo', {
    id: 'fit-term', tag: 'FIT', titulo: 'Flujómetro másico térmico', hoja: 'FLUJÓMETRO MÁSICO TÉRMICO',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Flujo', 'Nm³/h', TA), f('Velocidad', 'm/s', TA), f('Presión', 'kPa g', TA), f('Temperatura', '°C', TA), f('Humedad del gas', '', TA)]),
      { s: 'SENSOR', r: [
        f('Principio de medición', '', 'Dispersión térmica'), f('Tipo', '', 'Inserción / en línea (TA)'), f('Conexión a proceso', '', TA), f('Largo de inserción', 'mm', EPV),
        f('Material del sensor', '', 'AISI 316L'), f('Compensación de temperatura', '', REQ), f('Tiempo de respuesta', '', 'Ajustable'), f('Alimentación', '', 'Desde el transmisor')
      ] },
      TRANSMISOR([f('Montaje', '', 'Remoto en tubo de 2"'), f('Rango calibrado', 'Nm³/h', TA), f('Alimentación', '', S('alim4h')), f('Totalizador', '', REQ)]),
      { s: 'INSTALACIÓN', r: [f('Tramos rectos', '', 'Según fabricante (típico 15 DN / 5 DN)')] },
      ACCESORIOS([f('Válvula de inserción en caliente (hot tap)', '', TA)]),
      CERT([f('Calibración', '', 'Con el gas de proceso o equivalente, certificado trazable')])],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'GAS', w: 9 }, { t: 'DN (pulg)', w: 6 }, { t: 'FLUJO (Nm³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, { t: 'P (kPa g)', w: 7 }, { t: 'T (°C)', w: 6 }, { t: 'TIPO', w: 8 }, C_PID, C_REV],
      filas: [['2300-FIT-0345', 'Aire a celda de flotación 1', '8"-AL-2300-011', 'Aire', '8', '300', '600', '900', '40', '35', 'Inserción', '—', 'A']] }
  });

  // ── Nivel ───────────────────────────────────────────────────────────────────────
  reemplaza('lit-radar', {
    tag: 'LIT', titulo: 'Transmisor de nivel radar', hoja: 'TRANSMISOR DE NIVEL TIPO RADAR',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido / material', '', TA), f('Temperatura', '°C', TA), f('Densidad', 't/m³', TA), f('Nivel (mín / normal / máx)', 'm', TA),
        f('Material del estanque', '', TA), f('Presión de diseño', '', 'Atmosférica'), f('Espuma / polvo / turbulencia', '', TA)] },
      { s: 'SENSOR', r: [
        f('Tipo de sensor', '', 'Radar sin contacto FMCW, 80 GHz'), f('Rango de medición', 'm', TA), f('Tipo de antena', '', 'Lente encapsulada PTFE / PVDF'),
        f('Diámetro de antena', 'pulg', EPV), f('Ángulo de haz', '°', '≤ 8'), f('Resolución', 'mm', '1'), f('Precisión', 'mm', '± 2'),
        f('Posición de montaje', '', 'Vertical'), f('Conexión a proceso', '', TA), f('Purga de aire', '', TA)
      ] },
      TRANSMISOR([f('Montaje', '', 'Integrado / remoto en tubo de 2" (TA)'), f('Rango calibrado', 'm', TA), f('Unidades de ingeniería', '', 'm / %'), f('Alimentación', '', S('alim2h'))]),
      ACCESORIOS([f('Protección solar', '', REQ), f('Indicador remoto', '', TA)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'ESTANQUE / EQUIPO', w: 14 }, { t: 'MATERIAL', w: 10 }, { t: 'NIVEL (m)', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 }, { t: 'RANGO (m)', w: 8 },
      { t: 'CONEXIÓN', w: 10 }, { t: 'ESPUMA', w: 7 }, C_PID, C_DET, C_REV],
      filas: [['2200-LIT-0150', 'Nivel cajón de bombas', '2200-PB-001', 'Pulpa', '1,0', '2,5', '3,8', '0 – 4', 'Brida 4" Cl.150', 'Sí', '—', '6-A', 'A'],
        ['2100-LIT-0020', 'Nivel tolva de gruesos', '2100-BN-001', 'Mineral', '2', '10', '17', '0 – 18', 'Soporte', 'No', '—', '6-B', 'A']] }
  });

  reemplaza('lit-hidro', {
    tag: 'LIT', titulo: 'Transmisor de nivel hidrostático', hoja: 'TRANSMISOR DE NIVEL HIDROSTÁTICO',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Temperatura', '°C', TA), f('Densidad', 't/m³', TA), f('Nivel máximo / mínimo', 'm', TA), f('Presión hidrostática máx / mín', 'kPa', TA), f('Material del estanque', '', TA)] },
      { s: 'SENSOR', r: [
        f('Tipo de sensor', '', 'Presión hidrostática, sonda sumergible o con brida (TA)'), f('Conexión a proceso', '', TA), f('Material de la membrana', '', 'Cerámica / Hastelloy (TA)'),
        f('Material del cuerpo', '', 'AISI 316L'), f('Cable sensor-transmisor', '', 'PUR / FEP con tubo de compensación'), f('Largo del cable', 'm', TA), f('Montaje', '', 'Vertical')
      ] },
      TRANSMISOR([f('Montaje', '', 'Remoto en tubo de 2"'), f('Rango calibrado', 'm', TA), f('Alimentación', '', S('alim2h'))]),
      ACCESORIOS([f('Compensación de temperatura', '', REQ), f('Abrazadera de suspensión del cable', '', REQ)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'ESTANQUE / EQUIPO', w: 14 }, { t: 'FLUIDO', w: 9 }, { t: 'DENSIDAD (t/m³)', w: 8 }, { t: 'NIVEL (m)', sub: ['MÍN', 'MÁX'], w: 6 },
      { t: 'RANGO (m)', w: 8 }, { t: 'CABLE (m)', w: 7 }, C_PID, C_DET, C_REV],
      filas: [['4300-LIT-0270', 'Nivel piscina de emergencia', '4300-PD-001', 'Agua', '1,0', '0,3', '4,5', '0 – 5', '10', '—', '6-D', 'A']] },
    notas: ['El proveedor debe considerar abrazadera de suspensión para el cable.']
  });

  // ── Densidad y análisis ───────────────────────────────────────────────────────────
  agrega('Densidad y análisis', {
    id: 'dit-perc', tag: 'DIT', titulo: 'Densímetro no nuclear tipo percusión', hoja: 'TRANSMISOR DE DENSIDAD NO NUCLEAR',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Dirección de flujo', '', TA), f('Flujo', 'm³/h', TA), f('Densidad nominal', 't/m³', TA), f('Sólidos en suspensión', '% peso', TA), f('Presión', 'kPa g', TA), f('Temperatura', '°C', TA)]),
      { s: 'SENSOR', r: [f('Principio de medición', '', 'Percusión / vibración, no radiactivo (EPV)'), f('Montaje', '', 'No invasivo, sobre la tubería'), f('Material encapsulado', '', EPV),
        f('Información de condiciones de montaje', '', REQ), f('Grado de protección', '', 'NEMA 4X'), f('Alimentación', '', 'Desde el transmisor')] },
      TRANSMISOR([f('Montaje', '', 'Remoto en soporte'), f('Rango calibrado', 't/m³', TA), f('Largo de cable', 'm', '25'), f('Alimentación', '', S('alim4h')), f('Compensación de temperatura', '', REQ)]),
      ACCESORIOS([f('Caja de conexiones con borneras', '', 'Requerida, NEMA 4X')]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 9 }, { t: 'DN (pulg)', w: 6 }, { t: 'DENSIDAD (t/m³)', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 }, { t: '% SÓL.', w: 6 }, { t: 'RANGO (t/m³)', w: 9 }, C_PID, C_REV],
      filas: [['2400-DIT-0620', 'Densidad concentrado a espesador', '6"-SL-2400-005', 'Concentrado', '6', '1,20', '1,35', '1,50', '30', '1,0 – 1,7', '—', 'A']] },
    notas: ['El Vendedor debe informar los pesos dinámicos del equipo para el diseño del soporte.']
  });

  reemplaza('ait-ph', {
    tag: 'AIT', titulo: 'Sensor y transmisor de pH', hoja: 'ANALIZADOR DE pH',
    secciones: [GENERAL(), SITIO(),
      PROCESO([f('Temperatura', '°C', TA), f('Densidad', 't/m³', TA), f('pH (mín / normal / máx)', '', TA), f('Material del estanque / línea', '', TA)]),
      { s: 'ELEMENTO SENSOR', r: [
        f('Diseño del sensor', '', 'Electrodo combinado compacto'), f('Tipo de electrodo', '', 'Vidrio'), f('Elemento de referencia', '', 'Ag/AgCl, doble unión (EPV)'),
        f('Electrolito de referencia', '', EPV), f('Longitud de inserción', 'mm', TA), f('Conexión a proceso', '', TA), f('Tipo de montaje', '', TA),
        f('Compensación de temperatura', '', 'Pt1000 integrado'), f('Grado de protección', '', 'IP68')
      ] },
      TRANSMISOR([f('Montaje', '', 'Remoto en pedestal con techo'), f('Rango calibrado', 'pH', '0 – 14'), f('Repetibilidad', '%', '0,2'), f('Contactos de alarma', '', '2 SPDT'),
        f('Alimentación', '', S('alim4h')), f('Cable al sensor', 'm', TA), f('Terminación del cable', '', 'Bloque de terminales')]),
      ACCESORIOS([f('Portasonda / kit de inmersión', '', TA), f('Limpieza automática', '', TA)]),
      CERT([f('Soluciones de calibración', '', 'Buffer pH 4, 7 y 10'), f('Repuestos recomendados', '', 'Con número de parte')])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'ESTANQUE / LÍNEA', w: 14 }, { t: 'FLUIDO', w: 9 }, { t: 'pH', sub: ['MÍN', 'NOR', 'MÁX'], w: 5 }, { t: 'T (°C)', w: 6 },
      { t: 'MONTAJE', w: 11 }, { t: 'INSERCIÓN (mm)', w: 8 }, { t: 'CABLE (m)', w: 6 }, C_PID, C_DET, C_REV],
      filas: [['2300-AIT-0330', 'pH acondicionador flotación', '2300-TK-001', 'Pulpa', '9,5', '10,5', '11,5', '20', 'Inmersión', '1.500', '20', '—', '8-A', 'A'],
        ['3100-AIT-0450', 'pH relaves a tranque', '20"-TL-3100-001', 'Pulpa', '8,0', '9,0', '10,0', '18', 'Retráctil', '500', '15', '—', '8-B', 'A']] }
  });

  agrega('Densidad y análisis', {
    id: 'ait-orp', tag: 'AIT', titulo: 'Analizador de potencial redox (ORP)', hoja: 'ANALIZADOR DE ORP',
    secciones: [GENERAL(), SITIO(),
      PROCESO([f('Temperatura', '°C', TA), f('Densidad', 't/m³', TA), f('ORP (mín / normal / máx)', 'mV', TA), f('Material del estanque', '', TA)]),
      { s: 'ELEMENTO SENSOR', r: [f('Tipo de sensor', '', 'Electrodo de ORP (platino u oro)'), f('Elemento de referencia', '', 'Ag/AgCl'), f('Longitud de inserción', 'mm', TA),
        f('Conexión a proceso', '', TA), f('Material de superficie del sensor', '', EPV), f('Grado de protección', '', 'IP68')] },
      TRANSMISOR([f('Montaje', '', 'Remoto en tubo de 2"'), f('Rango calibrado', 'mV', TA), f('Repetibilidad', '%', '0,2'), f('Contactos de alarma', '', '1 SPDT'), f('Alimentación', '', S('alim4h')), f('Cable al sensor', 'm', '20')]),
      ACCESORIOS([f('Kit de montaje del sensor', '', TA)]),
      CERT([f('Solución patrón de ORP', '', REQ)])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'ESTANQUE', w: 14 }, { t: 'FLUIDO', w: 9 }, { t: 'ORP (mV)', sub: ['MÍN', 'MÁX'], w: 6 }, { t: 'RANGO (mV)', w: 9 }, { t: 'MONTAJE', w: 10 }, C_PID, C_REV],
      filas: [['2300-AIT-0360', 'Potencial en acondicionador de molibdeno', '2300-TK-005', 'Pulpa', '-450', '-350', '-1.000 – 1.000', 'Inmersión', '—', 'A']] }
  });

  agrega('Densidad y análisis', {
    id: 'froth', tag: 'AE', titulo: 'Sistema de visión de espuma de flotación', hoja: 'SISTEMA DE VISIÓN DE ESPUMA DE FLOTACIÓN',
    secciones: [GENERAL(), SITIO(),
      { s: 'CÁMARA', r: [f('Ubicación', '', TA), f('Tecnología', '', 'Cámara digital industrial'), f('Resolución', '', EPV), f('Lente / enfoque', '', EPV),
        f('Iluminación', '', 'Integrada, estable (EPV)'), f('Variables medidas', '', 'Velocidad, tamaño de burbuja, color, estabilidad'),
        f('Comunicación', '', 'Ethernet (PoE)'), f('Alimentación', '', 'PoE / 24 VDC'), f('Carcasa', '', 'IP66, con limpieza del visor'), f('Soporte', '', 'Sobre la celda, ajustable')] },
      { s: 'SOFTWARE Y SERVIDOR', r: [f('Licencia de software por cámara', '', REQ), f('Servidor de análisis', '', EPV), f('Integración con el sistema de control', '', 'OPC UA / Modbus TCP'),
        f('Control de nivel y aire por espuma', '', TA)] },
      SERVICIOS([f('Configuración, calibración y sintonía', '', REQ), f('Asistencia remota y supervisión de instalación', '', REQ)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, { t: 'CELDA', w: 16 }, { t: 'BANCO', w: 12 }, { t: 'UBICACIÓN', w: 16 }, { t: 'INTEGRACIÓN', w: 12 }, C_PID, C_REV],
      filas: [['2300-AE-0371', '2300-FC-001', 'Rougher', 'Labio de rebalse', 'OPC UA', '—', 'A'], ['2300-AE-0372', '2300-FC-005', 'Cleaner', 'Labio de rebalse', 'OPC UA', '—', 'A']] }
  });

  // ── Válvulas ─────────────────────────────────────────────────────────────────────
  var CUERPO_CTRL = function (tipo) {
    return { s: 'CUERPO DE LA VÁLVULA', r: [
      f('Tipo de válvula', '', tipo), f('Diámetro', 'pulg', TA), f('Material del cuerpo', '', 'Hierro dúctil ASTM A536 / acero (TA)'), f('Liner / revestimiento', '', TA),
      f('Espesor del liner', 'mm', EPV), f('Tipo de conexión / clase', '', 'Bridada ASME B16.5, Clase 150'), f('Dirección de flujo', '', 'Unidireccional / bidireccional (EPV)'),
      f('Tipo y material del bonete', '', EPV), f('Hermeticidad', '', TA)
    ] };
  };
  var TRIM = { s: 'TRIM', r: [f('Tipo', '', EPV), f('Característica', '', 'Isoporcentual / lineal (EPV)'), f('Material disco / bola / tapón', '', TA), f('Material del asiento', '', TA),
    f('Material del vástago', '', 'AISI 316 / dúplex (EPV)'), f('Rango de recorrido', '%', '0 – 100')] };

  reemplaza('fcv', {
    tag: 'FCV', titulo: 'Válvula de control (modulante)', hoja: 'VÁLVULA DE CONTROL MODULANTE',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Flujo (mín / normal / máx)', 'm³/h', TA), f('Velocidad', 'm/s', TA), f('Densidad', 't/m³', TA), f('Temperatura', '°C', TA),
        f('Presión de entrada P1', 'kPa g', TA), f('Presión de salida P2', 'kPa g', TA), f('Sólidos en suspensión', '% peso', TA)]),
      CUERPO_CTRL(TA),
      { s: 'DIMENSIONAMIENTO', r: [f('Cv calculado (mín / normal / máx)', '', EPV), f('Apertura a flujo normal', '%', EPV), f('Nivel de ruido', 'dB(A) @ 1 m', '≤ 85'), f('Cavitación / flashing', '', 'Verificar (EPV)')] },
      TRIM,
      { s: 'ACTUADOR', r: [f('Tipo de actuador', '', TA), f('Servicio', '', 'Regulatorio'), f('Presión de aire mín / máx', 'kPa g', EPV), f('Conexión de aire', 'pulg', '1/2" OD'),
        f('Tiempo de carrera', 's', EPV), f('Posición de falla', '', TA), f('Volante manual', '', TA), f('Grado de protección', '', 'NEMA 4X')] },
      { s: 'POSICIONADOR', r: [f('Tipo', '', 'Digital, basado en microprocesador'), f('Señal de mando', '', S('senal')), f('Protocolo de comunicaciones', '', S('bus')),
        f('Retroalimentación de posición', '', '4-20 mA'), f('Indicación local', '', 'LCD'), f('Grado de protección', '', 'IP66 / NEMA 4X'), f('Conexión eléctrica', '', '1/2" NPT')] },
      ACCESORIOS([f('Filtro regulador con manómetro', '', REQ)]),
      CERT([f('Memoria de cálculo de Cv', '', 'Requerida (IEC 60534-2-1)')])],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 8 }, { t: 'TIPO', w: 8 }, { t: 'DN (pulg)', w: 5 }, { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 },
      { t: 'P1 / P2 (kPa g)', w: 9 }, { t: 'FALLA', w: 5 }, { t: 'ACTUADOR', w: 9 }, C_PID, C_REV],
      filas: [['4100-FCV-0300', 'Agua de dilución a cajón', '8"-WP-4100-030', 'Agua', 'Mariposa', '8', '50', '120', '180', '400 / 250', 'FC', 'Neumático', '—', 'A'],
        ['3100-FCV-0480', 'Descarga espesador', '10"-TL-3100-002', 'Pulpa', 'Pinch', '10', '150', '300', '420', '300 / 180', 'FL', 'Eléctrico', '—', 'A']] }
  });

  reemplaza('xv-mot', {
    tag: 'XV', titulo: 'Válvula on/off con actuador eléctrico', hoja: 'VÁLVULA CON ACTUADOR ELÉCTRICO',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Flujo', 'm³/h', TA), f('Densidad', 't/m³', TA), f('Temperatura', '°C', TA), f('Presión de entrada / salida', 'kPa g', TA), f('Presión diferencial de cierre', 'kPa', TA), f('Sólidos en suspensión', '% peso', TA)]),
      CUERPO_CTRL(TA),
      { s: 'ACTUADOR ELÉCTRICO', r: [f('Tipo', '', 'Multivuelta / cuarto de vuelta (TA)'), f('Servicio', '', 'On/off (S2-15 min) / regulatorio (TA)'), f('Alimentación', '', S('alimMotor')),
        f('Potencia del motor', 'kW', EPV), f('Partidor del motor', '', 'Integrado, inversor de giro'), f('Protección térmica del motor', '', REQ),
        f('Protección por sobretorque', '', REQ), f('Tiempo de apertura / cierre', 's', EPV), f('Posición de falla', '', 'Última posición (FL)'), f('Volante manual', '', REQ),
        f('Panel y mandos locales', '', 'Selector L/O/R, abrir / parar / cerrar'), f('Indicador mecánico de posición', '', REQ), f('Señal de control', '', TA), f('Protocolo de comunicaciones', '', S('bus')),
        f('Calefactor anticondensación', '', REQ), f('Entrada de cables', '', 'M25 / 3/4" NPT'), f('Grado de protección', '', 'IP68')] },
      ACCESORIOS(),
      CERT([f('Prueba de carrera y torque', '', 'Requerida, en fábrica')])],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 8 }, { t: 'TIPO', w: 9 }, { t: 'DN (pulg)', w: 6 }, { t: 'ΔP CIERRE (kPa)', w: 8 }, { t: 'SERVICIO', w: 8 }, { t: 'CONTROL', w: 10 }, C_PID, C_DET, C_REV],
      filas: [['4200-XV-0290', 'Salida estanque agua de proceso', '20"-WP-4200-001', 'Agua', 'Mariposa', '20', '300', 'On/off', 'Profibus DP', '—', '14-B', 'A'],
        ['2200-XV-0190', 'Descarga molino a cajón', '20"-SL-2200-010', 'Pulpa', 'Cuchilla', '20', '150', 'On/off', 'Discretas', '—', '14-A', 'A']] }
  });

  agrega('Válvulas', {
    id: 'xv-sol', tag: 'XY', titulo: 'Válvula solenoide de proceso', hoja: 'VÁLVULA SOLENOIDE',
    secciones: [GENERAL(), SITIO(), LINEA(),
      PROCESO([f('Flujo', 'm³/h', TA), f('Densidad / pH', '', TA), f('Temperatura', '°C', TA), f('Presión', 'kPa g', TA), f('Sólidos en suspensión', '%', TA)]),
      { s: 'VÁLVULA', r: [f('Tipo de válvula', '', 'Solenoide de 2 vías, acción directa / servoasistida (EPV)'), f('Diámetro', 'pulg', TA), f('Material del cuerpo', '', TA),
        f('Material de partes húmedas', '', TA), f('Material del sello', '', 'PTFE / EPDM / NBR (TA)'), f('Conexión a proceso', '', TA), f('Dirección de flujo', '', 'Unidireccional'), f('Operación manual', '', TA)] },
      { s: 'SOLENOIDE', r: [f('Servicio', '', 'On/off'), f('Alimentación / señal', '', TA), f('Cantidad de bobinas', '', '1'), f('Clase de bobina', '', 'H (servicio continuo)'),
        f('Posición normal', '', 'NC (TA)'), f('Posición de falla', '', 'FC (TA)'), f('Tiempo de apertura / cierre', 's', EPV), f('Grado de protección', '', 'NEMA 4X'), f('Conexión eléctrica', '', '1/2" NPT / DIN 43650')] },
      ACCESORIOS([f('Caja de conexiones', '', TA)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, C_SERV, C_LINEA, { t: 'FLUIDO', w: 9 }, { t: 'DN (pulg)', w: 6 }, { t: 'P (kPa g)', w: 7 }, { t: 'MATERIAL CUERPO', w: 11 }, { t: 'POSICIÓN NORMAL', w: 8 }, { t: 'SEÑAL', w: 9 }, C_PID, C_REV],
      filas: [['2200-XY-0260', 'Agua de sello bomba', '1"-WS-2200-004', 'Agua', '1', '600', 'AISI 316', 'NC', '120 VAC', '—', 'A'],
        ['5300-XY-0580', 'Lavado de línea de reactivo', '1/2"-WS-5300-002', 'Agua', '1/2', '400', 'AISI 316', 'NC', '24 VDC', '—', 'A']] }
  });

  // ── Control y automatización ───────────────────────────────────────────────────────
  agrega('Control y automatización', {
    id: 'tcv', tag: 'CP', titulo: 'Tablero de control neumático de válvulas', hoja: 'TABLERO DE CONTROL NEUMÁTICO DE VÁLVULAS',
    secciones: [GENERAL(), SITIO(),
      { s: 'GABINETE', r: [f('Tipo', '', 'Mural, para adosar a soporte o pared'), f('Material', '', 'Acero inoxidable / poliéster reforzado (TA)'), f('Grado de protección', '', 'NEMA 4X'),
        f('Dimensiones (alto × ancho × fondo)', 'mm', TA), f('Capacidad', 'válvulas', TA), f('Reserva', '%', '20'), f('Iluminación interior y portaplanos', '', REQ),
        f('Entrada de cables / aire', '', 'Inferior / lateral'), f('Cerradura', '', REQ)] },
      { s: 'COMPONENTES NEUMÁTICOS', r: [f('Electroválvulas', '', 'Según Tabla de Aplicación (5/2 ó 3/2)'), f('Tensión de bobinas', '', TA), f('Bloque distribuidor (manifold)', '', 'Con puertos de reserva'),
        f('Unidad de mantenimiento (FRL)', '', 'Válvula de corte, filtro, regulador con manómetro y separador de agua'), f('Conectores y tubing', '', 'AISI 316 / poliuretano (EPV)')] },
      { s: 'FRONTAL', r: [f('Pulsadores abrir / cerrar por válvula', '', TA), f('Luces piloto abierta / cerrada', '', TA), f('Placa de identificación del tablero', '', REQ)] },
      SERVICIOS(),
      CERT()],
    aplicacion: { columnas: [C_TAG, { t: 'SERVICIO', w: 22 }, { t: 'UBICACIÓN', w: 16 }, { t: 'N° VÁLVULAS', w: 8 }, { t: 'TIPO ELECTROVÁLVULA', w: 12 }, { t: 'TENSIÓN', w: 9 }, { t: 'DIMENSIONES (mm)', w: 14 }, C_PID, C_REV],
      filas: [['2300-CP-0901', 'Válvulas de dardo celdas rougher', 'Plataforma celdas', '8', '5/2 NAMUR', '24 VDC', '1200 × 800 × 400', '—', 'A']] }
  });

  reemplaza('plc', {
    tag: 'PLC', titulo: 'Controlador PLC y E/S', hoja: 'CONTROLADOR PROGRAMABLE (PLC) Y E/S',
    secciones: [GENERAL(), SITIO(),
      { s: 'CONTROLADOR', r: [f('Familia / plataforma', '', TA), f('Redundancia de CPU', '', TA), f('Memoria de programa', 'MB', EPV), f('Uso máximo de CPU y memoria', '%', '60'),
        f('Lenguajes', '', 'IEC 61131-3'), f('Sincronización horaria', '', 'NTP / PTP'), f('Tarjetas de comunicación', '', TA), f('Intercambio en caliente de módulos', '', REQ)] },
      { s: 'ENTRADAS Y SALIDAS', r: [f('Entradas analógicas (módulos / canales)', '', TA), f('Salidas analógicas (módulos / canales)', '', TA), f('Entradas digitales (módulos / canales)', '', TA),
        f('Salidas digitales (módulos / canales)', '', TA), f('Señal analógica', '', S('senal')), f('Tensión de E/S digitales', '', '24 VDC / 120 VAC (TA)'),
        f('Aislación', '', 'Canales aislados'), f('Indicación de estado por canal', '', REQ), f('Reserva instalada', '%', '20'), f('Fuentes de 24 VDC', '', 'Redundantes con supervisión'), f('Respaldo de energía', '', 'UPS, 30 min mínimo')] },
      SERVICIOS([f('Software y licencias', '', 'A nombre del Cliente, perpetuas'), f('Integración al sistema existente', '', TA)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, { t: 'ÁREA / SERVICIO', w: 22 }, { t: 'UBICACIÓN', w: 16 }, { t: 'CPU REDUND.', w: 7 }, { t: 'E/S (AI / AO / DI / DO)', w: 18 }, { t: 'RED', w: 11 }, { t: 'SISTEMA', w: 10 }, { t: 'PLANO / ARQUITECTURA', w: 18 }, C_REV],
      filas: [['2200-PLC-001', 'Molienda', 'Sala eléctrica 2200', 'Sí', '96 / 32 / 256 / 128', 'PROFINET', 'Nuevo', '—', 'A'],
        ['3300-RIO-001', 'Ampliación de E/S', 'Sala eléctrica existente', 'No', '0 / 0 / 16 / 8', 'Existente', 'Existente', '—', 'A']] },
    notas: ['En ampliaciones, el equipamiento será 100 % compatible en hardware, software y firmware con el sistema existente.', 'Los servicios en terreno incluyen movilización, alimentación y alojamiento del personal del Vendedor.']
  });

  // ── Comunicaciones industriales ─────────────────────────────────────────────────────
  reemplaza('sw-eth', {
    tag: 'NSW', titulo: 'Switch Ethernet industrial', hoja: 'SWITCH ETHERNET INDUSTRIAL',
    secciones: [GENERAL(), SITIO(),
      { s: 'CARACTERÍSTICAS', r: [f('Tipo de montaje', '', 'Riel DIN / rack 19" (TA)'), f('Tecnología', '', 'Ethernet capa 2 / capa 3 (TA)'), f('Puertos de cobre', 'cant. / velocidad', TA),
        f('Puertos ópticos SFP', 'cant. / velocidad', TA), f('Módulos SFP', '', 'Incluidos, monomodo / multimodo (TA)'), f('Puertos de uplink', '', '≥ 2 × 1 Gbps ópticos'),
        f('PoE', '', TA), f('Redundancia de anillo', '', 'MRP (IEC 62439-2) / RSTP'), f('Funciones', '', 'VLAN, QoS, IGMP / filtro multicast, STP, VRF (TA)'),
        f('Seguridad', '', 'Autenticación 802.1X / RADIUS, SNMP v3, listas de acceso'), f('Sincronización de tiempo', '', 'NTP / PTP'), f('Certificación de protocolo', '', TA)] },
      { s: 'ALIMENTACIÓN Y AMBIENTE', r: [f('Alimentación', '', '24 VDC redundante / 100-240 VAC (TA)'), f('Fuente redundante', '', REQ), f('Contacto de falla', '', REQ),
        f('Consumo', 'W', EPV), f('Temperatura de operación', '°C', '-40 a 70 (riel DIN)'), f('Inmunidad y emisiones EMC', '', 'IEC 61000-6-2 / 6-4')] },
      SERVICIOS([f('Configuración según plan de direccionamiento', '', REQ)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, { t: 'UBICACIÓN', w: 20 }, { t: 'RED / ANILLO', w: 14 }, { t: 'PUERTOS Cu', w: 8 }, { t: 'PUERTOS FO', w: 8 }, { t: 'MONTAJE', w: 9 }, { t: 'PROTOCOLO', w: 11 }, { t: 'PLANO / ARQUITECTURA', w: 18 }, C_REV],
      filas: [['2200-NSW-001', 'Gabinete 2200-CP-001', 'Anillo control', '8', '4', 'Riel DIN', 'PROFINET', '—', 'A'],
        ['0150-NSW-001', 'Sala de control central', 'Núcleo', '24', '4', 'Rack 19"', 'Ethernet/IP', '—', 'A']] }
  });

  agrega('Comunicaciones industriales', {
    id: 'odf', tag: 'ODF', titulo: 'Distribuidor de fibra óptica (ODF)', hoja: 'DISTRIBUIDOR DE FIBRA ÓPTICA (ODF)',
    secciones: [GENERAL(), SITIO(),
      { s: 'DISTRIBUIDOR', r: [f('Tipo', '', 'Bandeja rackeable 19" / caja mural (TA)'), f('Cantidad de conectores', '', TA), f('Tipo de conector / pulido', '', 'LC dúplex / UPC (TA)'),
        f('Tipo de fibra', '', 'Monomodo OS2 (TA)'), f('Pigtails', '', 'Incluidos, mismo conector'), f('Bandejas de empalme', '', REQ), f('Ordenadores de cable', '', 'Uno por bandeja'),
        f('Patch cords', '', TA), f('Material', '', 'Acero laminado en frío pintado')] },
      SERVICIOS([f('Fusiones y certificación OTDR', '', REQ)]),
      CERT()],
    aplicacion: { columnas: [C_TAG, { t: 'UBICACIÓN', w: 20 }, { t: 'TIPO', w: 12 }, { t: 'N° CONECTORES', w: 9 }, { t: 'CONECTOR', w: 9 }, { t: 'CABLE ASOCIADO', w: 16 }, { t: 'PLANO / ARQUITECTURA', w: 18 }, C_REV],
      filas: [['0150-ODF-001', 'Sala de control central', 'Rack 19"', '24', 'LC/UPC', 'FO-2200-001', '—', 'A']] },
    notas: ['El proveedor suministrará todos los materiales necesarios para la fusión de los filamentos y la conexión de los equipos.']
  });
})();
