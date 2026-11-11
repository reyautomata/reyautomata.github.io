/* Hojas de datos de instrumentos · ReyEngi
 *
 * Estructura basada en los formularios ISA-TR20.00.01 (datos de operación, especificación del
 * equipo y requisitos generales, más identificación, endosos y crónica de revisiones) y en la
 * práctica habitual de proyectos mineros en Chile (columnas ESPECIFICADO / PROPUESTO, EPV, NA,
 * Tabla de Aplicación por TAG).
 *
 * Valores especiales en la columna ESPECIFICADO:
 *   TA            -> "Ver Tabla de Aplicación" (las celdas iguales seguidas se combinan)
 *   EPV           -> Especificado por el Vendedor
 *   { sitio: 'x' }-> se toma de los Datos del Proyecto (condiciones de sitio)
 *   { mnm: [mín, normal, máx] } -> fila con tres valores
 *
 * Para agregar un instrumento: copia una plantilla, cambia id/tag/titulo y sus secciones.
 */
(function () {
  'use strict';

  var TA = 'Ver Tabla de Aplicación';
  var EPV = 'EPV';

  function f(d, u, e) { return { d: d, u: u || '', e: e === undefined ? '' : e }; }
  function mnm(a, b, c) { return { mnm: [a, b, c] }; }
  function S(key) { return { sitio: key }; }

  // ── Bloques comunes ────────────────────────────────────────────────────────

  function GENERAL() {
    return { s: 'GENERAL', r: [
      f('Cantidad', '', TA), f('N° TAG', '', TA),
      f('Marca', '', EPV), f('Modelo', '', EPV),
      f('Servicio', '', TA), f('P&ID', '', TA)
    ] };
  }

  function SITIO() {
    return { s: 'CONDICIONES DE SITIO', r: [
      f('Lugar de instalación', '', S('lugar')),
      f('Tipo de ambiente', '', S('ambiente')),
      f('Temperatura ambiente', '°C', S('temp')),
      f('Humedad relativa', '%', S('hr')),
      f('Altura geográfica', 'm.s.n.m.', S('altura')),
      f('Presión barométrica', 'kPa abs', S('patm')),
      f('Zona sísmica', '', S('sismo')),
      f('Viento de diseño', '', S('viento')),
      f('Clasificación de área', '', S('area'))
    ] };
  }

  function REQUISITOS(extra) {
    var r = (extra || []).concat([
      f('Kit de montaje', '', 'Requerido'),
      f('Placa de identificación', '', 'Acero inoxidable, TAG grabado, fijada con alambre'),
      f('Certificado de calibración', '', 'Requerido'),
      f('Certificado de aprobación', '', 'Requerido'),
      f('Documentación', '', 'Manual, planos y certificados en español')
    ]);
    return { s: 'REQUISITOS GENERALES', r: r };
  }

  // Columnas iniciales de la mayoría de las tablas de aplicación
  var C_TAG = { t: 'TAG', w: 15 };
  var C_SERV = { t: 'SERVICIO', w: 24 };
  var C_PID = { t: 'P&ID', w: 20 };
  var C_DET = { t: 'DETALLE DE MONTAJE', w: 11 };

  var P = [];

  // ── 1. Manómetro ────────────────────────────────────────────────────────────
  P.push({
    id: 'pi', tag: 'PI', titulo: 'Manómetro', hoja: 'MANÓMETRO', visores: ['1-manometros'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA),
        f('Sólidos en suspensión', '', TA)
      ] },
      { s: 'INSTRUMENTO', r: [
        f('Tipo de elemento', '', 'Tubo Bourdon'),
        f('Diámetro de dial', 'mm', '100 (4")'),
        f('Rango', 'kPa g', TA),
        f('Clase de exactitud', '', '1,0 (EN 837-1 / ASME B40.100 Grado 1A)'),
        f('Material de caja y bisel', '', 'Acero inoxidable AISI 304'),
        f('Material de elemento y conexión', '', 'AISI 316L'),
        f('Llenado de caja', '', 'Glicerina'),
        f('Visor', '', 'Vidrio laminado de seguridad'),
        f('Dispositivo de alivio', '', 'Tapón de alivio en caja'),
        f('Conexión a proceso', '', '1/2" NPT M, inferior'),
        f('Grado de protección', '', 'IP65')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Sello de diafragma', '', TA),
        f('Conexión del sello a proceso', '', TA),
        f('Material del diafragma', '', 'AISI 316L (Hastelloy C276 en servicio corrosivo)'),
        f('Fluido de llenado del sello', '', 'Aceite de silicona'),
        f('Válvula de bloqueo y purga', '', 'Requerida, AISI 316, 1/2" NPT'),
        f('Amortiguador de pulsaciones', '', 'Requerido en descarga de bombas')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 14 },
        { t: 'PRESIÓN DE OPERACIÓN (kPa g)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 },
        { t: 'RANGO (kPa g)', w: 11 }, { t: 'SELLO', w: 12 }, { t: 'TUBERÍA', w: 11 }, C_PID, C_DET],
      filas: [
        ['2200-PI-0101', 'Descarga bomba de ciclones', 'Pulpa', '80', '150', '220', '0 – 400', 'Bridado', 'Horizontal', '—', '1-B'],
        ['4100-PI-0201', 'Descarga bomba agua fresca', 'Agua', '300', '450', '600', '0 – 1.000', 'Sin sello', 'Vertical', '—', '1-A'],
        ['2300-PI-0305', 'Línea de reactivo', 'Reactivo', '100', '200', '300', '0 – 600', 'Roscado', 'Horizontal', '—', '1-C']
      ]
    },
    notas: ['Rango seleccionado para que la presión normal quede entre el 30 % y el 70 % de la escala.']
  });

  // ── 2. Transmisor de presión ──────────────────────────────────────────────────
  P.push({
    id: 'pit', tag: 'PIT', titulo: 'Transmisor de presión', hoja: 'TRANSMISOR DE PRESIÓN', visores: ['2-transmisor-presion'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA),
        f('Presión de diseño', 'kPa g', TA)
      ] },
      { s: 'TRANSMISOR', r: [
        f('Tipo', '', 'Presión manométrica, electrónico inteligente'),
        f('Elemento sensor', '', EPV),
        f('Rango calibrado', 'kPa g', TA),
        f('Límites del sensor (LRL / URL)', 'kPa g', EPV),
        f('Exactitud de referencia', '', '± 0,075 % del span'),
        f('Estabilidad', '', '± 0,15 % URL por 5 años'),
        f('Señal de salida', '', '4-20 mA + HART 7'),
        f('Alimentación', '', '24 VDC desde el lazo (2 hilos)'),
        f('Indicador local', '', 'LCD en unidades de ingeniería'),
        f('Material del diafragma', '', 'AISI 316L'),
        f('Fluido de llenado del sensor', '', 'Silicona'),
        f('Material de carcasa', '', 'Aluminio con pintura epóxica'),
        f('Conexión a proceso', '', '1/2" NPT H'),
        f('Conexión eléctrica', '', '1/2" NPT (2), una con tapón'),
        f('Grado de protección', '', 'IP66 / IP67 · NEMA 4X'),
        f('Protección contra transientes', '', 'Requerida, en bloque de terminales')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Manifold', '', '2 vías, AISI 316'),
        f('Sello de diafragma', '', TA),
        f('Soporte', '', 'Para tubo de 2", AISI 304'),
        f('Conduit de llegada', '', 'Flexible liquid-tight 1/2" con conectores')
      ] },
      REQUISITOS([f('Configuración', '', 'De fábrica según Tabla de Aplicación')])
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 13 },
        { t: 'PRESIÓN DE OPERACIÓN (kPa g)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 },
        { t: 'RANGO CALIBRADO (kPa g)', w: 12 }, { t: 'SELLO', w: 11 }, C_PID, C_DET],
      filas: [
        ['2200-PIT-0110', 'Presión alimentación ciclones', 'Pulpa', '60', '110', '160', '0 – 250', 'Bridado', '—', '2-B'],
        ['4100-PIT-0210', 'Presión impulsión agua recuperada', 'Agua', '250', '400', '550', '0 – 1.000', 'Sin sello', '—', '2-A'],
        ['2300-PIT-0320', 'Presión aire a celdas', 'Aire', '30', '45', '60', '0 – 100', 'Roscado', '—', '2-C']
      ]
    },
    notas: []
  });

  // ── 3. Flujómetro magnético ─────────────────────────────────────────────────────
  P.push({
    id: 'fit-mag', tag: 'FIT', titulo: 'Flujómetro electromagnético', hoja: 'FLUJÓMETRO ELECTROMAGNÉTICO', visores: ['3-flujometro-magnetico'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Concentración de sólidos', '% peso', TA),
        f('Densidad', 't/m³', TA), f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA),
        f('Conductividad mínima', 'µS/cm', '≥ 5'), f('Abrasividad', '', 'Alta (pulpa)')
      ] },
      { s: 'SENSOR', r: [
        f('Diámetro nominal', 'pulg', TA),
        f('Conexión a proceso', '', 'Bridas ASME B16.5 Clase 150 RF'),
        f('Material de bridas', '', 'Acero al carbono'),
        f('Material de tubo de medición', '', 'AISI 304'),
        f('Revestimiento', '', 'Poliuretano / caucho natural (pulpa)'),
        f('Material de electrodos', '', 'Hastelloy C276'),
        f('Puesta a tierra', '', 'Anillos de puesta a tierra AISI 316'),
        f('Grado de protección', '', 'IP68')
      ] },
      { s: 'TRANSMISOR', r: [
        f('Tipo de montaje', '', TA),
        f('Largo de cable sensor-transmisor', 'm', TA),
        f('Exactitud', '', '± 0,25 % del valor medido'),
        f('Señal de salida', '', '4-20 mA + HART; pulsos para totalizado'),
        f('Alimentación', '', '220 VAC 50 Hz'),
        f('Indicador local', '', 'LCD con caudal y totalizador'),
        f('Diagnósticos', '', 'Tubería vacía, electrodo recubierto, verificación'),
        f('Material de carcasa', '', 'Aluminio con pintura epóxica'),
        f('Conexión eléctrica', '', '1/2" NPT'),
        f('Grado de protección', '', 'IP66 / IP67')
      ] },
      { s: 'INSTALACIÓN', r: [
        f('Tramos rectos', '', '5 DN aguas arriba / 2 DN aguas abajo'),
        f('Orientación', '', 'Vertical con flujo ascendente (pulpa)')
      ] },
      REQUISITOS([f('Calibración', '', 'En banco húmedo, certificado trazable')])
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 11 }, { t: 'DN (pulg)', w: 7 },
        { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 },
        { t: 'RANGO (m³/h)', w: 10 }, { t: 'MONTAJE', w: 10 }, C_PID, C_DET],
      filas: [
        ['2200-FIT-0130', 'Alimentación a ciclones', 'Pulpa', '14', '900', '1.250', '1.500', '0 – 2.000', 'Remoto', '—', '3-B'],
        ['4100-FIT-0230', 'Agua fresca a molienda', 'Agua', '6', '80', '150', '220', '0 – 300', 'Compacto', '—', '3-A'],
        ['3100-FIT-0410', 'Relaves a espesador', 'Pulpa', '18', '1.200', '1.800', '2.400', '0 – 3.000', 'Remoto', '—', '3-C']
      ]
    },
    notas: ['Revestimiento y electrodos a confirmar por el Vendedor según análisis de la pulpa.']
  });

  // ── 4. Interruptor de flujo ───────────────────────────────────────────────────────
  P.push({
    id: 'fs', tag: 'FSL', titulo: 'Interruptor de flujo tipo paleta', hoja: 'INTERRUPTOR DE FLUJO TIPO PALETA', visores: ['4-interruptor-flujo'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo normal', 'm³/h', TA), f('Presión de operación', 'kPa g', TA),
        f('Temperatura de operación', '°C', TA), f('Punto de ajuste', 'm³/h', TA), f('Acción', '', TA)
      ] },
      { s: 'INSTRUMENTO', r: [
        f('Tipo', '', 'Paleta con resorte'),
        f('Diámetro de tubería', 'pulg', TA),
        f('Montaje', '', 'En te reductora, eje vertical'),
        f('Material de paleta', '', 'AISI 316'),
        f('Material del cuerpo', '', 'AISI 316 / bronce (EPV)'),
        f('Conexión a proceso', '', '1" NPT M'),
        f('Tipo de contactos', '', 'SPDT 5 A @ 220 VAC / 24 VDC'),
        f('Cantidad de contactos', '', '1'),
        f('Ajuste del punto de operación', '', 'Regulable en terreno'),
        f('Material de carcasa', '', 'Aluminio con pintura epóxica'),
        f('Conexión eléctrica', '', '1/2" NPT'),
        f('Grado de protección', '', 'IP66')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'DN (pulg)', w: 8 },
        { t: 'FLUJO NORMAL (m³/h)', w: 10 }, { t: 'PUNTO DE AJUSTE (m³/h)', w: 11 }, { t: 'ACCIÓN', w: 9 }, C_PID, C_DET],
      filas: [
        ['2200-FSL-0140', 'Agua de sello bomba', 'Agua', '1', '1,2', '0,6', 'FSL', '—', '4-A'],
        ['5100-FSL-0510', 'Agua de enfriamiento compresor', 'Agua', '2', '6', '3', 'FSL', '—', '4-A']
      ]
    },
    notas: []
  });

  // ── 5. Flujómetro sonar ───────────────────────────────────────────────────────────
  P.push({
    id: 'fit-sonar', tag: 'FIT', titulo: 'Flujómetro sonar (no intrusivo)', hoja: 'FLUJÓMETRO TIPO SONAR', visores: ['5-flujometro-sonar'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Velocidad en tubería', 'm/s', TA),
        f('Concentración de sólidos', '% peso', TA), f('Presión de operación', 'kPa g', TA),
        f('Temperatura de operación', '°C', TA)
      ] },
      { s: 'SENSOR', r: [
        f('Principio de medición', '', 'Sonar pasivo, seguimiento de vórtices'),
        f('Tipo de montaje', '', 'Abrazado sobre la tubería (clamp-on)'),
        f('Diámetro nominal', 'pulg', TA),
        f('Material y espesor de tubería', '', TA),
        f('Revestimiento de tubería', '', TA),
        f('Cubierta del sensor', '', 'Acero inoxidable / fibra de vidrio'),
        f('Grado de protección', '', 'IP66 / NEMA 4X'),
        f('Medición de aire atrapado (GVF)', '', 'Opcional, EPV')
      ] },
      { s: 'TRANSMISOR', r: [
        f('Exactitud', '', '± 1 % de lectura (EPV)'),
        f('Señal de salida', '', '4-20 mA + HART'),
        f('Alimentación', '', '220 VAC 50 Hz'),
        f('Indicador local', '', 'LCD'),
        f('Montaje', '', 'Remoto en soporte de tubo de 2"'),
        f('Largo de cable sensor-transmisor', 'm', TA),
        f('Grado de protección', '', 'IP66')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'DN (pulg)', w: 7 }, { t: 'TUBERÍA (material / espesor)', w: 16 },
        { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, C_PID, C_DET],
      filas: [
        ['3100-FIT-0420', 'Relaves a tranque', 'Pulpa', '24', 'HDPE PE100 / 22,7 mm', '1.800', '2.600', '3.200', '—', '5-A'],
        ['2400-FIT-0610', 'Concentrado a espesador', 'Pulpa', '6', 'Acero / 7,1 mm', '60', '90', '120', '—', '5-B']
      ]
    },
    notas: ['Sin partes en contacto con el proceso; instalación sin detener la línea.']
  });

  // ── 6. Flujómetro ultrasónico clamp-on ─────────────────────────────────────────────
  P.push({
    id: 'fit-ut', tag: 'FIT', titulo: 'Flujómetro ultrasónico clamp-on', hoja: 'FLUJÓMETRO ULTRASÓNICO CLAMP-ON', visores: ['5-flujometro-sonar'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Sólidos / burbujas', '% vol', '< 2'),
        f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA)
      ] },
      { s: 'SENSOR', r: [
        f('Principio de medición', '', 'Tiempo de tránsito'),
        f('Cantidad de trayectorias', '', '1 (2 en tramo recto corto)'),
        f('Configuración de transductores', '', 'Modo V o Z (EPV)'),
        f('Diámetro nominal', 'pulg', TA),
        f('Material y espesor de tubería', '', TA),
        f('Acoplante', '', 'Pad de acoplamiento permanente'),
        f('Fijación', '', 'Riel y bandas de acero inoxidable'),
        f('Grado de protección', '', 'IP68')
      ] },
      { s: 'TRANSMISOR', r: [
        f('Exactitud', '', '± 1 % de lectura (calibrado)'),
        f('Señal de salida', '', '4-20 mA + HART; pulsos'),
        f('Alimentación', '', '220 VAC 50 Hz / 24 VDC'),
        f('Indicador local', '', 'LCD con totalizador'),
        f('Montaje', '', 'Remoto en soporte de tubo de 2"'),
        f('Largo de cable transductores-transmisor', 'm', TA),
        f('Grado de protección', '', 'IP66')
      ] },
      { s: 'INSTALACIÓN', r: [
        f('Tramos rectos', '', '10 DN aguas arriba / 5 DN aguas abajo')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'DN (pulg)', w: 7 }, { t: 'TUBERÍA (material / espesor)', w: 16 },
        { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, C_PID, C_DET],
      filas: [
        ['4100-FIT-0240', 'Agua fresca a estanque', 'Agua', '8', 'Acero / 8,2 mm', '120', '200', '260', '—', '5-C'],
        ['4200-FIT-0250', 'Agua de proceso a planta', 'Agua', '12', 'HDPE PE100 / 18,7 mm', '300', '480', '600', '—', '5-D']
      ]
    },
    notas: ['No apto para pulpa ni fluidos con aire atrapado; para ese servicio usar flujómetro sonar o magnético.']
  });

  // ── 7. Transmisor de nivel radar ───────────────────────────────────────────────────
  P.push({
    id: 'lit-radar', tag: 'LIT', titulo: 'Transmisor de nivel radar', hoja: 'TRANSMISOR DE NIVEL TIPO RADAR', visores: ['6-transmisor-nivel'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Material medido', '', TA), f('Estado', '', TA), f('Constante dieléctrica', '', TA),
        f('Presión en estanque', '', 'Atmosférica'), f('Temperatura de operación', '°C', TA),
        f('Condiciones de superficie', '', 'Turbulencia, espuma y polvo')
      ] },
      { s: 'TRANSMISOR', r: [
        f('Principio de medición', '', 'Radar sin contacto FMCW, 80 GHz'),
        f('Rango de medición', 'm', TA),
        f('Antena', '', 'Lente de PTFE / PVDF, encapsulada'),
        f('Ángulo de haz', '°', '≤ 8'),
        f('Exactitud', 'mm', '± 2'),
        f('Señal de salida', '', '4-20 mA + HART'),
        f('Alimentación', '', '24 VDC desde el lazo (2 hilos)'),
        f('Indicador local', '', 'LCD con ajuste por Bluetooth (EPV)'),
        f('Tipo de montaje', '', TA),
        f('Conexión a proceso', '', TA),
        f('Material de carcasa', '', 'Aluminio con pintura epóxica'),
        f('Conexión eléctrica', '', '1/2" NPT'),
        f('Grado de protección', '', 'IP66 / IP68')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Indicador remoto', '', TA),
        f('Purga de aire de antena', '', 'Opcional'),
        f('Protección solar', '', 'Requerida'),
        f('Soporte', '', 'Brazo de acero galvanizado (EPV)')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'MATERIAL', w: 12 }, { t: 'RANGO (m)', w: 8 }, { t: 'ALTURA DE MONTAJE (m)', w: 10 },
        { t: 'MONTAJE', w: 12 }, { t: 'INDICADOR REMOTO', w: 10 }, C_PID, C_DET],
      filas: [
        ['2200-LIT-0150', 'Nivel cajón de bombas', 'Pulpa', '0 – 4', '4,5', 'Brida 4"', 'No', '—', '6-A'],
        ['2100-LIT-0020', 'Nivel tolva de gruesos', 'Mineral', '0 – 18', '19', 'Soporte', 'Sí', '—', '6-B'],
        ['4100-LIT-0260', 'Nivel estanque agua fresca', 'Agua', '0 – 6', '6,5', 'Brida 4"', 'Sí', '—', '6-C']
      ]
    },
    notas: ['En sólidos con polvo, el Vendedor indicará si requiere purga de aire.']
  });

  // ── 8. Transmisor de nivel hidrostático ────────────────────────────────────────────
  P.push({
    id: 'lit-hidro', tag: 'LIT', titulo: 'Transmisor de nivel hidrostático', hoja: 'TRANSMISOR DE NIVEL HIDROSTÁTICO', visores: ['6-transmisor-nivel'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Densidad', 't/m³', TA), f('Temperatura de operación', '°C', TA),
        f('Presión en estanque', '', 'Atmosférica')
      ] },
      { s: 'TRANSMISOR', r: [
        f('Tipo', '', 'Sonda sumergible de presión hidrostática'),
        f('Rango de medición', 'm c.a.', TA),
        f('Exactitud', '', '± 0,2 % del span'),
        f('Celda de medición', '', 'Cerámica capacitiva'),
        f('Material de la sonda', '', 'AISI 316L'),
        f('Cable', '', 'PUR / FEP con tubo de compensación'),
        f('Largo de cable', 'm', TA),
        f('Señal de salida', '', '4-20 mA + HART'),
        f('Alimentación', '', '24 VDC desde el lazo (2 hilos)'),
        f('Grado de protección (sonda)', '', 'IP68')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Caja de terminales', '', 'Con filtro de compensación, IP66'),
        f('Fijación', '', 'Abrazadera de suspensión'),
        f('Tubo tranquilizador', '', 'HDPE / PVC perforado, por otros'),
        f('Indicador local', '', TA)
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'DENSIDAD (t/m³)', w: 9 }, { t: 'RANGO (m c.a.)', w: 9 },
        { t: 'LARGO DE CABLE (m)', w: 9 }, { t: 'INDICADOR LOCAL', w: 10 }, C_PID, C_DET],
      filas: [
        ['4300-LIT-0270', 'Nivel piscina de emergencia', 'Agua', '1,0', '0 – 5', '10', 'Sí', '—', '6-D'],
        ['3100-LIT-0430', 'Nivel pozo de drenaje', 'Agua con sólidos', '1,1', '0 – 3', '8', 'No', '—', '6-D']
      ]
    },
    notas: []
  });

  // ── 9. Densímetro nuclear ─────────────────────────────────────────────────────────
  P.push({
    id: 'dit', tag: 'DIT', titulo: 'Densímetro nuclear', hoja: 'DENSÍMETRO NUCLEAR', visores: ['7-densimetro-nuclear'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Densidad', 't/m³', TA), f('Concentración de sólidos', '% peso', TA),
        f('Diámetro nominal', 'pulg', TA), f('Material y espesor de tubería', '', TA),
        f('Revestimiento de tubería', '', TA), f('Temperatura de operación', '°C', TA)
      ] },
      { s: 'FUENTE', r: [
        f('Isótopo', '', 'Cs-137'),
        f('Actividad', 'mCi', EPV),
        f('Portafuente', '', 'Blindado, con obturador y bloqueo con candado'),
        f('Indicación de obturador', '', 'Visual ABIERTO / CERRADO'),
        f('Tasa de dosis a 1 m', 'µSv/h', EPV),
        f('Prueba de fuga', '', 'Requerida, con certificado'),
        f('Autorización', '', 'Según normativa CChEN (por el Mandante)')
      ] },
      { s: 'DETECTOR Y TRANSMISOR', r: [
        f('Tipo de detector', '', 'Centelleo'),
        f('Rango calibrado', 't/m³', TA),
        f('Exactitud', 't/m³', '± 0,005 (EPV)'),
        f('Constante de tiempo', 's', 'Ajustable 1 – 60'),
        f('Señal de salida', '', '4-20 mA + HART'),
        f('Alimentación', '', '220 VAC 50 Hz'),
        f('Montaje', '', 'Abrazadera sobre la tubería'),
        f('Grado de protección', '', 'IP66')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Señalética radiológica', '', 'Requerida'),
        f('Muestra de calibración', '', 'EPV')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'DN (pulg)', w: 7 }, { t: 'ESPESOR PARED (mm)', w: 9 },
        { t: 'DENSIDAD (t/m³)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, C_PID, C_DET],
      filas: [
        ['3100-DIT-0440', 'Densidad descarga espesador', 'Relave', '16', '12,7', '1,35', '1,55', '1,65', '—', '7-A'],
        ['2200-DIT-0160', 'Densidad alimentación ciclones', 'Pulpa', '14', '9,5', '1,45', '1,60', '1,75', '—', '7-B']
      ]
    },
    notas: ['La fuente se despacha con el obturador cerrado; su instalación la realiza personal autorizado.']
  });

  // ── 10. pH ─────────────────────────────────────────────────────────────────────────
  P.push({
    id: 'ait-ph', tag: 'AIT', titulo: 'Sensor y transmisor de pH', hoja: 'ANALIZADOR DE pH', visores: ['8-sensor-ph'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('pH', '', TA), f('Temperatura de operación', '°C', TA),
        f('Presión de operación', 'kPa g', TA), f('Sólidos', '% peso', TA)
      ] },
      { s: 'SENSOR', r: [
        f('Tipo', '', 'Electrodo combinado de vidrio, referencia de doble unión'),
        f('Rango', 'pH', '0 – 14'),
        f('Compensación de temperatura', '', 'Pt1000 integrado'),
        f('Material del cuerpo', '', 'PVDF'),
        f('Montaje', '', TA),
        f('Portasonda', '', TA),
        f('Limpieza automática', '', 'Opcional, por chorro de agua'),
        f('Largo de cable', 'm', TA)
      ] },
      { s: 'TRANSMISOR', r: [
        f('Canales', '', '1'),
        f('Señal de salida', '', '4-20 mA + HART'),
        f('Relés de alarma', '', '2 SPDT'),
        f('Alimentación', '', '220 VAC 50 Hz'),
        f('Indicador local', '', 'LCD con pH y temperatura'),
        f('Material de carcasa', '', 'Policarbonato / AISI 316'),
        f('Grado de protección', '', 'IP66'),
        f('Montaje', '', 'Remoto, en soporte con techo')
      ] },
      REQUISITOS([f('Soluciones de calibración', '', 'Buffer pH 4, 7 y 10')])
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 },
        { t: 'pH', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 }, { t: 'TEMP. (°C)', w: 7 },
        { t: 'MONTAJE', w: 12 }, C_PID, C_DET],
      filas: [
        ['2300-AIT-0330', 'pH acondicionador flotación', 'Pulpa', '9,5', '10,5', '11,5', '20', 'Inmersión', '—', '8-A'],
        ['3100-AIT-0450', 'pH relaves a tranque', 'Pulpa', '8,0', '9,0', '10,0', '18', 'En línea retráctil', '—', '8-B']
      ]
    },
    notas: []
  });

  // ── 11. Interruptor de nivel microondas ─────────────────────────────────────────────
  P.push({
    id: 'lsh-mw', tag: 'LSH', titulo: 'Interruptor de nivel tipo microondas', hoja: 'INTERRUPTOR DE NIVEL TIPO MICROONDAS', visores: ['9-interruptor-microondas'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Líquido o sólido', '', 'Mineral'), f('Tamaño de mineral', 'mm', TA)
      ] },
      { s: 'CONJUNTO TRANSMISOR-EMISOR-RECEPTOR', r: [
        f('Tipo elemento sensor', '', 'Microondas'),
        f('Material de carcasa', '', EPV),
        f('Tipo de conjunto', '', 'Transmisor - Emisor - Receptor'),
        f('Material de marco de ventana para soldar', '', EPV),
        f('Material de ventanas', '', 'PTFE'),
        f('Cantidad de ventanas', '', '2'),
        f('Diámetro de ventanas', 'pulg', '4"'),
        f('Posición de montaje', '', 'Montaje lateral'),
        f('Grado de protección', '', 'NEMA 4X'),
        f('Tipo de salida', '', 'Relé'),
        f('Tensión de alimentación', '', '220 VAC 50 Hz'),
        f('Tipo de contactos', '', 'SPDT 2 A @ 220 VAC'),
        f('Cantidad de contactos', '', '2'),
        f('Conexión eléctrica', '', '1/2" NPT'),
        f('Cantidad de conexiones eléctricas', '', '2'),
        f('Tiempo de retardo', '', EPV),
        f('Tipo de montaje transmisor', '', 'Remoto en panel'),
        f('Indicador', '', 'Remoto'),
        f('Largo cable transmisor a emisor', 'm', '20'),
        f('Largo cable transmisor a receptor', 'm', '20')
      ] },
      REQUISITOS([f('Soportes antivibratorios', '', 'Requeridos')])
    ],
    aplicacion: {
      columnas: [{ t: 'TAG INTERRUPTOR', w: 15 }, C_SERV, { t: 'TAG CORREA O CHUTE', w: 13 }, { t: 'MATERIAL DE TRANSPORTE', w: 12 },
        { t: 'TAMAÑO MATERIAL (mm)', sub: ['MÍN', 'MÁX'], w: 7 }, { t: 'NIVEL ACTIVACIÓN (m)', w: 11 }, C_PID, C_DET],
      filas: [
        ['2100-LSH-0071', 'Atollo chute descarga chancador', '2100-CH-010', 'Mineral', '0', '200', '—', '—', '9-A'],
        ['2200-LSH-0072', 'Atollo chute traspaso CV-003', '2200-CH-012', 'Mineral', '0', '50', '—', '—', '9-A']
      ]
    },
    notas: ['Ventanas de PTFE para soldar al chute; el haz se corta cuando el chute se llena (atollo).']
  });

  // ── 12. Sirena con baliza ───────────────────────────────────────────────────────────
  P.push({
    id: 'xa', tag: 'XA', titulo: 'Sirena con baliza', hoja: 'SIRENA CON BALIZA', visores: ['10-sirena-baliza'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'SIRENA', r: [
        f('Tipo', '', 'Electrónica multitono'),
        f('Nivel de presión sonora', 'dB(A) @ 1 m', '≥ 110'),
        f('Tonos seleccionables', '', '≥ 32'),
        f('Etapas de alarma', '', '3, seleccionables a distancia'),
        f('Tono asignado', '', TA)
      ] },
      { s: 'BALIZA', r: [
        f('Tipo de luz', '', 'LED destellante'),
        f('Color del lente', '', TA),
        f('Intensidad efectiva', 'cd', EPV),
        f('Frecuencia de destello', 'Hz', '1')
      ] },
      { s: 'CONJUNTO', r: [
        f('Alimentación', '', '24 VDC'),
        f('Consumo', 'mA', EPV),
        f('Activación', '', 'Salida digital de PLC'),
        f('Material', '', 'Policarbonato con base de aluminio'),
        f('Conexión eléctrica', '', '1/2" NPT'),
        f('Grado de protección', '', 'IP66'),
        f('Montaje', '', 'Soporte de plancha en poste de 2"')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, { t: 'ÁREA / SERVICIO', w: 26 }, { t: 'UBICACIÓN', w: 18 }, { t: 'COLOR BALIZA', w: 10 },
        { t: 'TONO', w: 8 }, { t: 'SEÑAL', w: 12 }, C_PID, C_DET],
      filas: [
        ['2100-XA-0030', 'Partida de correa CV-01', 'Torre de traspaso', 'Ámbar', '1', 'DO PLC', '—', '10-A'],
        ['2200-XA-0170', 'Partida de molino SAG', 'Piso de operación', 'Rojo', '3', 'DO PLC', '—', '10-A']
      ]
    },
    notas: ['La sirena debe sonar al menos 10 s antes de la partida del equipo.']
  });

  // ── Válvulas: bloques compartidos ─────────────────────────────────────────────────
  function PROCESO_VALVULA(extra) {
    return { s: 'DATOS DE PROCESO', r: [
      f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Concentración de sólidos', '% peso', TA),
      f('Presión de operación', 'kPa g', TA), f('Presión diferencial de cierre', 'kPa', TA),
      f('Temperatura de operación', '°C', TA)
    ].concat(extra || []) };
  }
  function CUERPO_ONOFF() {
    return { s: 'CUERPO', r: [
      f('Tipo de válvula', '', TA),
      f('Diámetro nominal', 'pulg', TA),
      f('Clase de presión', '', 'ASME Clase 150 / PN 10'),
      f('Tipo de conexión', '', 'Wafer / lug / bridada (EPV)'),
      f('Material del cuerpo', '', 'Hierro dúctil ASTM A536'),
      f('Material de cuchilla / disco', '', 'AISI 316 / Dúplex (pulpa)'),
      f('Asiento', '', 'Elastómero (caucho natural / EPDM)'),
      f('Sentido de flujo', '', 'Bidireccional'),
      f('Estanqueidad', '', 'Cierre hermético (MSS SP-81 / API 598)')
    ] };
  }
  var APL_VALV = [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'TIPO', w: 10 }, { t: 'DN (pulg)', w: 7 },
    { t: 'P. OPER. (kPa g)', w: 8 }, { t: 'ΔP CIERRE (kPa)', w: 8 }, { t: 'FALLA', w: 7 }, C_PID, C_DET];

  // ── 13. Válvula on/off neumática ─────────────────────────────────────────────────────
  P.push({
    id: 'xv-neu', tag: 'XV', titulo: 'Válvula on/off con actuador neumático', hoja: 'VÁLVULA ON/OFF CON ACTUADOR NEUMÁTICO', visores: ['12-valvulas-onoff'],
    secciones: [
      GENERAL(), SITIO(), PROCESO_VALVULA(), CUERPO_ONOFF(),
      { s: 'ACTUADOR', r: [
        f('Tipo', '', 'Neumático (cilindro para cuchilla / piñón-cremallera para mariposa)'),
        f('Acción', '', 'Doble efecto / simple efecto con resorte (EPV)'),
        f('Posición de falla', '', TA),
        f('Presión de aire de suministro', 'kPa g', '550 – 700 (mínimo 400)'),
        f('Tiempo de carrera', 's', EPV),
        f('Accionamiento manual', '', 'Volante / override (EPV)')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Electroválvula', '', '5/2 ó 3/2, 24 VDC, montaje NAMUR'),
        f('Caja de interruptores de posición', '', 'ZSO / ZSC, 2 sensores inductivos'),
        f('Filtro regulador', '', 'Con manómetro y purga'),
        f('Tubing', '', 'AISI 316, 3/8"'),
        f('Señales', '', '1 DO 24 VDC (mando) · 2 DI (posición)')
      ] },
      REQUISITOS([f('Prueba de carrera', '', 'Requerida, en fábrica')])
    ],
    aplicacion: { columnas: APL_VALV, filas: [
      ['2200-XV-0180', 'Descarga cajón de bombas', 'Pulpa', 'Cuchilla', '16', '150', '200', 'FC', '—', '12-A'],
      ['4100-XV-0280', 'Entrada agua fresca', 'Agua', 'Mariposa', '10', '400', '600', 'FC', '—', '12-C']
    ] },
    notas: ['FC: falla cerrada · FO: falla abierta · FL: falla en última posición.']
  });

  // ── 14. Válvula on/off hidráulica ────────────────────────────────────────────────────
  P.push({
    id: 'xv-hid', tag: 'XV', titulo: 'Válvula on/off con actuador hidráulico', hoja: 'VÁLVULA ON/OFF CON ACTUADOR HIDRÁULICO', visores: ['13-valvulas-hidraulicas'],
    secciones: [
      GENERAL(), SITIO(), PROCESO_VALVULA(), CUERPO_ONOFF(),
      { s: 'ACTUADOR', r: [
        f('Tipo', '', 'Cilindro hidráulico doble efecto'),
        f('Presión hidráulica de trabajo', 'bar', EPV),
        f('Fluido hidráulico', '', 'Aceite ISO VG 46'),
        f('Posición de falla', '', 'Última posición (FL)'),
        f('Tiempo de carrera', 's', EPV)
      ] },
      { s: 'SISTEMA HIDRÁULICO', r: [
        f('Unidad hidráulica (HPU)', '', 'Central, por otros / EPV'),
        f('Electroválvula direccional', '', '4/3 centro cerrado, 24 VDC'),
        f('Mangueras', '', 'SAE 100R2AT con conectores rápidos'),
        f('Caja de interruptores de posición', '', 'ZSO / ZSC, 2 sensores inductivos'),
        f('Señales', '', '2 DO 24 VDC (abrir / cerrar) · 2 DI (posición)')
      ] },
      REQUISITOS([f('Prueba de carrera', '', 'Requerida, en fábrica')])
    ],
    aplicacion: { columnas: APL_VALV, filas: [
      ['3100-XV-0460', 'Descarga espesador de relaves', 'Pulpa', 'Cuchilla', '18', '250', '350', 'FL', '—', '13-A'],
      ['3100-XV-0470', 'Bypass espesador', 'Pulpa', 'Mariposa', '18', '250', '350', 'FL', '—', '13-B']
    ] },
    notas: []
  });

  // ── 15. Válvula on/off motorizada ─────────────────────────────────────────────────────
  P.push({
    id: 'xv-mot', tag: 'XV', titulo: 'Válvula on/off con actuador eléctrico', hoja: 'VÁLVULA ON/OFF CON ACTUADOR ELÉCTRICO', visores: ['14-valvulas-motorizadas'],
    secciones: [
      GENERAL(), SITIO(), PROCESO_VALVULA(), CUERPO_ONOFF(),
      { s: 'ACTUADOR ELÉCTRICO', r: [
        f('Tipo', '', 'Multivuelta (cuchilla) / cuarto de vuelta (mariposa, bola)'),
        f('Alimentación', '', '380 VAC, 3F, 50 Hz'),
        f('Clase de servicio', '', 'S2 – 15 min (on/off)'),
        f('Torque de salida', 'N·m', EPV),
        f('Tiempo de carrera', 's', EPV),
        f('Posición de falla', '', 'Última posición (FL)'),
        f('Control', '', TA),
        f('Interruptores de torque y carrera', '', 'Requeridos'),
        f('Mando local', '', 'Selector Local / Off / Remoto y pulsadores'),
        f('Volante manual', '', 'Requerido'),
        f('Calefactor anticondensación', '', 'Requerido'),
        f('Grado de protección', '', 'IP68')
      ] },
      REQUISITOS([f('Prueba de carrera', '', 'Requerida, en fábrica')])
    ],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'TIPO', w: 10 }, { t: 'DN (pulg)', w: 7 },
      { t: 'ΔP CIERRE (kPa)', w: 8 }, { t: 'CONTROL', w: 12 }, C_PID, C_DET], filas: [
      ['4200-XV-0290', 'Salida estanque agua de proceso', 'Agua', 'Mariposa', '20', '300', 'Profibus DP', '—', '14-B'],
      ['2200-XV-0190', 'Descarga molino a cajón', 'Pulpa', 'Cuchilla', '20', '150', 'Discretas', '—', '14-A'],
      ['5200-XV-0520', 'Línea de reactivo', 'Reactivo', 'Bola', '3', '600', 'Discretas', '—', '14-C']
    ] },
    notas: []
  });

  // ── 16. Válvula de control ─────────────────────────────────────────────────────────────
  P.push({
    id: 'fcv', tag: 'FCV', titulo: 'Válvula de control (modulante)', hoja: 'VÁLVULA DE CONTROL', visores: ['15-valvulas-modulantes'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Presión de entrada P1', 'kPa g', TA),
        f('Presión diferencial', 'kPa', TA), f('Temperatura de operación', '°C', TA),
        f('Densidad', 't/m³', TA), f('Concentración de sólidos', '% peso', TA),
        f('Cv calculado (mín / nor / máx)', '', EPV), f('Nivel de ruido', 'dB(A) @ 1 m', '≤ 85')
      ] },
      { s: 'CUERPO', r: [
        f('Tipo de válvula', '', TA),
        f('Diámetro nominal', 'pulg', TA),
        f('Característica de flujo', '', 'Isoporcentual / lineal (EPV)'),
        f('Clase de presión', '', 'ASME Clase 150'),
        f('Material del cuerpo', '', 'Hierro dúctil / acero al carbono'),
        f('Revestimiento / manga', '', 'Caucho natural (pulpa)'),
        f('Clase de fuga', '', 'ANSI/FCI 70-2 Clase IV')
      ] },
      { s: 'ACTUADOR Y POSICIONADOR', r: [
        f('Tipo de actuador', '', TA),
        f('Posicionador', '', 'Digital inteligente'),
        f('Señal de mando', '', TA),
        f('Retroalimentación de posición', '', '4-20 mA'),
        f('Posición de falla', '', TA),
        f('Alimentación', '', 'Aire 550 kPa g / 380 VAC (según actuador)'),
        f('Filtro regulador', '', 'Requerido (actuador neumático)')
      ] },
      REQUISITOS([f('Memoria de cálculo de Cv', '', 'Requerida (ISA-75.01.01 / IEC 60534-2-1)')])
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 9 }, { t: 'TIPO', w: 9 }, { t: 'DN (pulg)', w: 6 },
        { t: 'FLUJO (m³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 6 }, { t: 'ΔP (kPa)', w: 7 },
        { t: 'ACTUADOR / SEÑAL', w: 14 }, C_PID, C_DET],
      filas: [
        ['4100-FCV-0300', 'Agua de dilución a cajón', 'Agua', 'Mariposa', '8', '50', '120', '180', '150', 'Neum. · 4-20 mA HART', '—', '15-A'],
        ['5100-FCV-0530', 'Dosificación de reactivo', 'Reactivo', 'Bola', '2', '0,5', '1,5', '3', '200', 'Eléctrico · 4-20 mA', '—', '15-C'],
        ['3100-FCV-0480', 'Descarga espesador', 'Pulpa', 'Pinch', '10', '150', '300', '420', '120', 'Eléctrico · Profibus DP', '—', '15-D']
      ]
    },
    notas: []
  });

  // ── 17. Válvula reguladora autopilotada ───────────────────────────────────────────────────
  P.push({
    id: 'pcv', tag: 'PCV', titulo: 'Válvula reguladora de presión autopilotada', hoja: 'VÁLVULA REGULADORA DE PRESIÓN', visores: ['16-valvulas-autorreguladoras'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Fluido', '', TA), f('Flujo', 'm³/h', TA), f('Presión de entrada P1', 'kPa g', TA),
        f('Presión de salida P2 (ajuste)', 'kPa g', TA), f('Temperatura de operación', '°C', TA)
      ] },
      { s: 'VÁLVULA', r: [
        f('Tipo', '', TA),
        f('Diámetro nominal', 'pulg', TA),
        f('Patrón del cuerpo', '', 'Globo / en Y (EPV)'),
        f('Clase de presión', '', 'ASME Clase 150 / PN 16'),
        f('Material del cuerpo', '', 'Hierro dúctil con recubrimiento epóxico'),
        f('Diafragma', '', 'Caucho nitrilo reforzado'),
        f('Piloto', '', 'Reductor de presión, rango ajustable (EPV)'),
        f('Relación de reducción', '', TA),
        f('Filtro en circuito de piloto', '', 'Requerido'),
        f('Válvulas de aislamiento del piloto', '', 'Requeridas')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Transmisor de posición', '', TA),
        f('Manómetros P1 / P2', '', 'Requeridos'),
        f('Indicador visual de posición', '', 'Requerido')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, C_SERV, { t: 'TIPO', w: 14 }, { t: 'DN (pulg)', w: 7 }, { t: 'FLUJO NOR. (m³/h)', w: 9 },
        { t: 'P1 (kPa g)', w: 8 }, { t: 'P2 (kPa g)', w: 8 }, { t: 'TRANSMISOR POSICIÓN', w: 10 }, C_PID, C_DET],
      filas: [
        ['200-PCV-0202', 'Reducción agua a planta', 'Autopilotada', '8', '200', '1.200', '450', 'Sí', '—', '16-A'],
        ['4200-PCV-0320', 'Reducción agua de servicios', 'Proporcional 3:1', '4', '40', '900', '300', 'No', '—', '16-B']
      ]
    },
    notas: ['Válvula autoaccionada por el propio fluido; no requiere energía externa.']
  });

  // ── 18. Pull-cord ──────────────────────────────────────────────────────────────────────
  P.push({
    id: 'hs-pull', tag: 'HSS', titulo: 'Interruptor de emergencia por cuerda (pull-cord)', hoja: 'INTERRUPTOR DE EMERGENCIA POR CUERDA', visores: ['pull-cord-correa'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'INTERRUPTOR', r: [
        f('Tipo', '', 'Accionamiento por cuerda, ambos lados'),
        f('Contactos', '', '2 NC + 2 NA, apertura positiva'),
        f('Capacidad de contactos', '', '10 A @ 220 VAC / 24 VDC'),
        f('Reposición', '', 'Manual, en el interruptor'),
        f('Indicación de disparo', '', 'Bandera visual / LED'),
        f('Material de carcasa', '', 'Aluminio fundido con pintura epóxica'),
        f('Conexión eléctrica', '', '2 × M20 / 1/2" NPT'),
        f('Grado de protección', '', 'IP67'),
        f('Normas', '', 'ISO 13850 · IEC 60947-5-5')
      ] },
      { s: 'CUERDA Y ACCESORIOS', r: [
        f('Largo máximo por lado', 'm', '≤ 50'),
        f('Cuerda', '', 'Cable de acero galvanizado con PVC rojo, Ø 5 mm'),
        f('Guías', '', 'Ojales cada 3 m'),
        f('Tensores y resortes', '', 'Requeridos'),
        f('Soporte', '', 'A estructura de correa, acero galvanizado')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, { t: 'CORREA', w: 12 }, { t: 'LADO', w: 9 }, { t: 'UBICACIÓN (m desde cola)', w: 12 },
        { t: 'LARGO CUERDA (m)', w: 10 }, { t: 'SEÑAL', w: 12 }, { t: 'PLANO', w: 18 }, C_DET],
      filas: [
        ['2100-HSS-0041', '2100-CV-001', 'Izquierdo', '0 – 50', '50', 'DI PLC', '—', 'PC'],
        ['2100-HSS-0042', '2100-CV-001', 'Derecho', '0 – 50', '50', 'DI PLC', '—', 'PC']
      ]
    },
    notas: ['Los interruptores se instalan en pares, uno a cada lado de la correa.']
  });

  // ── 19. Pesómetro ──────────────────────────────────────────────────────────────────────────
  P.push({
    id: 'wit', tag: 'WIT', titulo: 'Pesómetro de correa', hoja: 'PESÓMETRO DE CORREA', visores: ['pesometro-correa'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [
        f('Material', '', TA), f('Granulometría máxima', 'mm', TA), f('Densidad aparente', 't/m³', TA),
        f('Capacidad', 't/h', TA), f('Ancho de correa', 'mm', TA), f('Velocidad de correa', 'm/s', TA),
        f('Inclinación de la correa', '°', TA)
      ] },
      { s: 'PUENTE DE PESAJE', r: [
        f('Tipo', '', 'Puente con celdas de carga'),
        f('Cantidad de polines de pesaje', '', '2 (EPV)'),
        f('Celdas de carga', '', 'Strain gauge, acero inoxidable, IP67'),
        f('Exactitud del sistema', '', '± 0,5 % (EPV)'),
        f('Sensor de velocidad', '', 'Encoder en polea de cola')
      ] },
      { s: 'INTEGRADOR', r: [
        f('Indicación', '', 't/h, totalizado (t) y velocidad'),
        f('Señales de salida', '', '4-20 mA (t/h) + pulsos (totalizado)'),
        f('Comunicación', '', 'Profibus DP / Modbus TCP (EPV)'),
        f('Alimentación', '', '220 VAC 50 Hz'),
        f('Montaje', '', 'Remoto, en gabinete IP66'),
        f('Caja digitalizadora', '', 'En terreno, junto al puente')
      ] },
      REQUISITOS([f('Calibración', '', 'Con cadena de prueba / pesas de calibración')])
    ],
    aplicacion: {
      columnas: [C_TAG, { t: 'CORREA', w: 12 }, { t: 'MATERIAL', w: 12 }, { t: 'ANCHO (mm)', w: 8 }, { t: 'VELOC. (m/s)', w: 8 },
        { t: 'CAPACIDAD (t/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, C_PID, C_DET],
      filas: [
        ['2100-WIT-0050', '2100-CV-001', 'Mineral chancado', '1.400', '3,2', '800', '1.500', '2.000', '—', 'PS'],
        ['2200-WIT-0200', '2200-CV-003', 'Alimentación SAG', '1.200', '2,8', '600', '1.100', '1.400', '—', 'PS']
      ]
    },
    notas: []
  });

  // ── 20. Ruptura de correa ────────────────────────────────────────────────────────────────
  P.push({
    id: 'xs-rip', tag: 'XS', titulo: 'Interruptor de ruptura de correa', hoja: 'INTERRUPTOR DE RUPTURA DE CORREA', visores: ['ruptura-correa'],
    secciones: [
      GENERAL(), SITIO(),
      { s: 'INTERRUPTOR', r: [
        f('Tipo', '', 'Par de interruptores con cable cruzado bajo la correa'),
        f('Detección', '', 'Rasgadura longitudinal y material bajo la correa'),
        f('Contactos', '', '1 NC + 1 NA por interruptor'),
        f('Capacidad de contactos', '', '10 A @ 220 VAC / 24 VDC'),
        f('Reposición', '', 'Manual'),
        f('Material de carcasa', '', 'Aluminio fundido / poliéster reforzado'),
        f('Conexión eléctrica', '', 'M20 / 1/2" NPT'),
        f('Grado de protección', '', 'IP67')
      ] },
      { s: 'ACCESORIOS', r: [
        f('Cable de disparo', '', 'Acero galvanizado, a lo ancho de la correa'),
        f('Soportes', '', 'A estructura de correa, acero galvanizado'),
        f('Ubicación', '', 'Después de cada punto de carga')
      ] },
      REQUISITOS()
    ],
    aplicacion: {
      columnas: [C_TAG, { t: 'CORREA', w: 12 }, { t: 'ANCHO CORREA (mm)', w: 10 }, { t: 'UBICACIÓN', w: 22 },
        { t: 'SEÑAL', w: 12 }, { t: 'PLANO', w: 18 }, C_DET],
      filas: [
        ['2100-XS-0061', '2100-CV-001', '1.400', 'Bajo chute de carga', 'DI PLC', '—', 'RC'],
        ['2200-XS-0210', '2200-CV-003', '1.200', 'Bajo chute de carga', 'DI PLC', '—', 'RC']
      ]
    },
    notas: []
  });

  // ── Datos de proyecto por defecto (se editan en "Datos del proyecto") ──────────────
  var PROYECTO = {
    proyecto: 'INSTRUMENTACIÓN TIPO · PLANTA DE PROCESO',
    cliente: 'REYENGI · AUTOMATIZACIÓN Y CONTROL INDUSTRIAL',
    ubicacion: 'CHILE',
    numero: 'RE-001',
    prefijo: 'RE-001-IN-DAS-',
    rev: 'A',
    por: 'AA', porFecha: '',
    reviso: '', revisoFecha: '',
    aprobo: '', aproboFecha: '',
    lugar: 'Exterior',
    ambiente: 'Seco y polvoriento',
    tMin: '-5', tNor: '12', tMax: '30',
    hrMin: '10', hrNor: '40', hrMax: '90',
    altura: '2.800',
    sismo: 'Zona 3 NCh 2369 Of. 2003',
    area: 'No clasificada'
  };

  var NOTAS_GENERALES = [
    'El Vendedor deberá completar o corregir todas las características del equipo propuesto, en la columna PROPUESTO.',
    'El Vendedor deberá entregar las hojas de datos completadas individualmente por TAG.',
    'El Vendedor deberá entregar despiece, números de parte, planos dimensionales y repuestos recomendados.',
    'EPV: Especificado por el Vendedor.',
    'NA: No aplica.',
    'TA: Ver Tabla de Aplicación.'
  ];

  // Grupo de cada hoja (para ordenar el catálogo)
  var GRUPO = { pi: 'Presión', pit: 'Presión', 'fit-mag': 'Flujo', fs: 'Flujo', 'fit-sonar': 'Flujo', 'fit-ut': 'Flujo', 'lit-radar': 'Nivel', 'lit-hidro': 'Nivel', 'lsh-mw': 'Nivel',
    dit: 'Densidad y análisis', 'ait-ph': 'Densidad y análisis', xa: 'Correas transportadoras y alarmas', 'hs-pull': 'Correas transportadoras y alarmas', wit: 'Correas transportadoras y alarmas', 'xs-rip': 'Correas transportadoras y alarmas',
    'xv-neu': 'Válvulas', 'xv-hid': 'Válvulas', 'xv-mot': 'Válvulas', fcv: 'Válvulas', pcv: 'Válvulas' };
  P.forEach(function (p) { p.grupo = GRUPO[p.id] || 'Otros'; });

  window.HD = { plantillas: P, proyecto: PROYECTO, notasGenerales: NOTAS_GENERALES, TA: TA, EPV: EPV,
    util: { f: f, mnm: mnm, S: S, GENERAL: GENERAL, SITIO: SITIO, REQUISITOS: REQUISITOS, C_TAG: C_TAG, C_SERV: C_SERV, C_PID: C_PID, C_DET: C_DET } };
})();
