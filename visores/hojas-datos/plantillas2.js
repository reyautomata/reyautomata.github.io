/* Hojas de datos · ampliación para cubrir las especificaciones técnicas tipo · ReyEngi
 * Mismo formato que plantillas.js (ver la explicación de valores especiales allí).
 */
(function () {
  'use strict';

  var HD = window.HD, U = HD.util, P = HD.plantillas;
  var f = U.f, GENERAL = U.GENERAL, SITIO = U.SITIO, REQUISITOS = U.REQUISITOS;
  var C_TAG = U.C_TAG, C_SERV = U.C_SERV, C_PID = U.C_PID;
  var TA = HD.TA, EPV = HD.EPV;
  var C_PLANO = { t: 'PLANO / ARQUITECTURA', w: 20 };

  function add(grupo, def) { def.grupo = grupo; def.visores = def.visores || []; def.notas = def.notas || []; P.push(def); }

  // Bloques repetidos
  var TX = function (extra) {
    return [f('Señal de salida', '', '4-20 mA + HART')].concat(extra || [], [
      f('Alimentación', '', '24 VDC desde el lazo (2 hilos)'),
      f('Indicador local', '', 'LCD en unidades de ingeniería'),
      f('Material de carcasa', '', 'Aluminio con pintura epóxica'),
      f('Conexión eléctrica', '', '1/2" NPT'),
      f('Grado de protección', '', 'IP66 / NEMA 4X')
    ]);
  };
  var SW = function (extra) {
    return (extra || []).concat([
      f('Tipo de contactos', '', 'SPDT/DPDT, 5 A @ 120 VAC'),
      f('Cantidad de contactos', '', '2'),
      f('Material de carcasa', '', 'Aluminio fundido con pintura epóxica'),
      f('Conexión eléctrica', '', '1/2" NPT / M20'),
      f('Grado de protección', '', 'NEMA 4X')
    ]);
  };

  // ── Presión ───────────────────────────────────────────────────────────────
  add('Presión', {
    id: 'psh', tag: 'PSH', titulo: 'Interruptor de presión', hoja: 'INTERRUPTOR DE PRESIÓN',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA), f('Punto de ajuste', 'kPa g', TA), f('Acción', '', TA)] },
      { s: 'INTERRUPTOR', r: SW([f('Elemento sensor', '', 'Diafragma / pistón (EPV)'), f('Rango ajustable', 'kPa g', EPV), f('Banda muerta', '', 'Ajustable (EPV)'), f('Repetibilidad', '', '± 1 % del rango'), f('Material partes húmedas', '', 'AISI 316'), f('Conexión a proceso', '', '1/2" NPT H')]) },
      REQUISITOS([f('Accesorios', '', 'Válvula de bloqueo y purga, AISI 316')])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'P. OPERACIÓN (kPa g)', w: 10 }, { t: 'AJUSTE (kPa g)', w: 9 }, { t: 'ACCIÓN', w: 9 }, C_PID],
      filas: [['5100-PSL-0540', 'Baja presión aire de instrumentos', 'Aire', '650', '450', 'PSL', '—'], ['2200-PSH-0220', 'Alta presión aceite de lubricación', 'Aceite', '250', '400', 'PSH', '—']] }
  });

  // ── Flujo ──────────────────────────────────────────────────────────────────
  add('Flujo', {
    id: 'fit-vortex', tag: 'FIT', titulo: 'Flujómetro tipo vortex', hoja: 'FLUJÓMETRO TIPO VORTEX',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Flujo', 'Nm³/h', TA), f('Presión de operación', 'kPa g', TA), f('Temperatura de operación', '°C', TA), f('Densidad en condiciones de operación', 'kg/m³', TA), f('Viscosidad', 'cP', EPV)] },
      { s: 'SENSOR', r: [f('Diámetro nominal', 'pulg', TA), f('Conexión a proceso', '', 'Bridas ASME B16.5 Clase 150 RF'), f('Material del cuerpo', '', 'AISI 316'), f('Elemento sensor', '', 'Reemplazable sin despresurizar (EPV)'), f('Compensación', '', 'Temperatura integrada; presión según TA')] },
      { s: 'TRANSMISOR', r: TX([f('Exactitud', '', '± 1 % del valor medido (gases)'), f('Montaje', '', 'Compacto / remoto (EPV)')]) },
      REQUISITOS([f('Tramos rectos', '', '10 DN aguas arriba / 5 DN aguas abajo')])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'DN (pulg)', w: 7 }, { t: 'FLUJO (Nm³/h)', sub: ['MÍN', 'NOR', 'MÁX'], w: 7 }, { t: 'P (kPa g)', w: 8 }, C_PID],
      filas: [['2300-FIT-0340', 'Aire de baja presión a celdas', 'Aire', '12', '4.000', '6.500', '8.000', '45', '—'], ['5100-FIT-0550', 'Aire de planta', 'Aire', '4', '600', '1.000', '1.400', '700', '—']] }
  });

  // ── Nivel ──────────────────────────────────────────────────────────────────
  add('Nivel', {
    id: 'lit-us', tag: 'LIT', titulo: 'Transmisor de nivel ultrasónico', hoja: 'TRANSMISOR DE NIVEL TIPO ULTRASÓNICO',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Material medido', '', TA), f('Estado', '', TA), f('Temperatura de operación', '°C', TA), f('Condiciones de superficie', '', 'Turbulencia, espuma (EPV)')] },
      { s: 'SENSOR', r: [f('Principio de medición', '', 'Ultrasónico sin contacto'), f('Rango de medición', 'm', TA), f('Zona muerta', 'm', EPV), f('Frecuencia y potencia', '', EPV), f('Material del sensor', '', 'PVDF / ETFE'), f('Conexión a proceso', '', 'Brida ASME B16.5 3"'), f('Grado de protección', '', 'IP68')] },
      { s: 'TRANSMISOR', r: [f('Tipo de montaje', '', 'Remoto'), f('Largo de cable sensor-transmisor', 'm', TA), f('Exactitud', '', '± 0,25 % del rango'), f('Señal de salida', '', '4-20 mA + HART'), f('Relés', '', '2 SPDT'), f('Alimentación', '', '120 VAC 50 Hz'), f('Indicador local', '', 'LCD'), f('Grado de protección', '', 'IP66 / NEMA 4X')] },
      REQUISITOS([f('Protección solar', '', 'Requerida')])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'MATERIAL', w: 12 }, { t: 'RANGO (m)', w: 8 }, { t: 'ALTURA MONTAJE (m)', w: 10 }, { t: 'LARGO CABLE (m)', w: 9 }, C_PID],
      filas: [['4200-LIT-0280', 'Nivel estanque agua de proceso', 'Agua', '0 – 7', '7,5', '30', '—'], ['2300-LIT-0350', 'Nivel cajón de colas', 'Pulpa', '0 – 3', '3,5', '20', '—']] }
  });

  add('Nivel', {
    id: 'lsw-vib', tag: 'LSH', titulo: 'Interruptor de nivel vibratorio', hoja: 'INTERRUPTOR DE NIVEL TIPO VIBRATORIO',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Medio', '', TA), f('Densidad mínima', 't/m³', TA), f('Temperatura de operación', '°C', TA), f('Presión de operación', 'kPa g', TA), f('Acción', '', TA)] },
      { s: 'INTERRUPTOR', r: [f('Principio', '', 'Horquilla vibratoria'), f('Material de la horquilla', '', 'AISI 316L'), f('Montaje', '', 'Lateral'), f('Conexión a proceso', '', 'Brida ASME B16.5 1" Clase 150'), f('Salida', '', '2 contactos DPDT'), f('Capacidad de contactos', '', '2 A @ 120 VAC'), f('Retardo', 's', 'Ajustable (EPV)'), f('Alimentación', '', '120 VAC 50 Hz'), f('Indicación', '', 'LED de estado'), f('Material de carcasa', '', 'Aluminio'), f('Grado de protección', '', 'NEMA 4X')] },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'MEDIO', w: 12 }, { t: 'EQUIPO', w: 14 }, { t: 'ACCIÓN', w: 9 }, C_PID],
      filas: [['5200-LSH-0560', 'Alto nivel estanque de reactivo', 'Reactivo', '5200-TK-001', 'LSH', '—'], ['5200-LSL-0561', 'Bajo nivel estanque de reactivo', 'Reactivo', '5200-TK-001', 'LSL', '—']] }
  });

  // ── Temperatura ─────────────────────────────────────────────────────────────
  add('Temperatura', {
    id: 'tit', tag: 'TIT', titulo: 'Transmisor de temperatura con elemento y termopozo', hoja: 'TRANSMISOR DE TEMPERATURA',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Temperatura de operación', '°C', TA), f('Presión de operación', 'kPa g', TA), f('Velocidad del fluido', 'm/s', TA)] },
      { s: 'ELEMENTO', r: [f('Tipo de elemento', '', TA), f('Clase / tolerancia', '', 'Pt100 clase A (IEC 60751) / TC clase 1 (IEC 60584)'), f('Configuración', '', '4 hilos (RTD) / junta aislada (TC)'), f('Vaina', '', 'Aislación mineral, AISI 316'), f('Diámetro de vaina', 'mm', '6')] },
      { s: 'TERMOPOZO', r: [f('Tipo', '', 'Barra perforada'), f('Material', '', 'AISI 316'), f('Conexión a proceso', '', TA), f('Longitud de inserción', 'mm', TA), f('Cálculo ASME PTC 19.3 TW', '', 'Requerido')] },
      { s: 'TRANSMISOR', r: TX([f('Montaje', '', TA), f('Rango calibrado', '°C', TA), f('Exactitud digital', '', '± 0,1 °C (RTD)')]) },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 10 }, { t: 'T. OPER. (°C)', w: 8 }, { t: 'RANGO (°C)', w: 9 }, { t: 'ELEMENTO', w: 8 }, { t: 'CONEXIÓN', w: 12 }, { t: 'INSERCIÓN (mm)', w: 9 }, C_PID],
      filas: [['2200-TIT-0230', 'Temperatura aceite lubricación molino', 'Aceite', '45', '0 – 100', 'Pt100', 'Brida 1" Cl.150', '250', '—'], ['2100-TIT-0060', 'Temperatura descanso chancador', 'Aceite', '50', '0 – 120', 'Pt100', '1/2" NPT', '150', '—']] }
  });

  add('Temperatura', {
    id: 'tsh', tag: 'TSH', titulo: 'Interruptor de temperatura', hoja: 'INTERRUPTOR DE TEMPERATURA',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Temperatura de operación', '°C', TA), f('Punto de ajuste', '°C', TA), f('Acción', '', TA)] },
      { s: 'INTERRUPTOR', r: SW([f('Tipo', '', 'Electrónico / bulbo y capilar (EPV)'), f('Rango ajustable', '°C', EPV), f('Banda muerta', '', 'Ajustable'), f('Termopozo', '', 'Barra perforada AISI 316')]) },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'T. OPER. (°C)', w: 9 }, { t: 'AJUSTE (°C)', w: 9 }, { t: 'ACCIÓN', w: 8 }, C_PID],
      filas: [['2200-TSH-0240', 'Alta temperatura aceite reductor', 'Aceite', '55', '75', 'TSH', '—']] }
  });

  // ── Análisis ────────────────────────────────────────────────────────────────
  add('Densidad y análisis', {
    id: 'ait-cond', tag: 'AIT', titulo: 'Analizador de conductividad', hoja: 'ANALIZADOR DE CONDUCTIVIDAD',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Conductividad', 'µS/cm', TA), f('Temperatura de operación', '°C', TA), f('Sólidos', '% peso', TA)] },
      { s: 'SENSOR', r: [f('Tipo', '', 'Inductivo (toroidal) / contacto (EPV)'), f('Rango', 'µS/cm', TA), f('Compensación de temperatura', '', 'Pt1000 integrado'), f('Material', '', 'PEEK / PVDF'), f('Montaje', '', TA), f('Largo de cable', 'm', '10')] },
      { s: 'TRANSMISOR', r: [f('Señal de salida', '', '4-20 mA + HART'), f('Relés', '', '2 SPDT'), f('Alimentación', '', '120 VAC 50 Hz'), f('Indicador local', '', 'LCD'), f('Grado de protección', '', 'IP66')] },
      REQUISITOS([f('Soluciones de calibración', '', 'Requeridas')])],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'RANGO (µS/cm)', w: 11 }, { t: 'MONTAJE', w: 12 }, C_PID],
      filas: [['200-AIT-0201', 'Conductividad agua recuperada', 'Agua', '0 – 5.000', 'En línea', '—']] }
  });

  add('Densidad y análisis', {
    id: 'ait-turb', tag: 'AIT', titulo: 'Analizador de turbidez', hoja: 'ANALIZADOR DE TURBIDEZ / SÓLIDOS SUSPENDIDOS',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE PROCESO', r: [f('Fluido', '', TA), f('Turbidez / sólidos', 'NTU / mg/L', TA), f('Temperatura de operación', '°C', TA)] },
      { s: 'SENSOR', r: [f('Principio', '', 'Óptico, luz dispersa 90° (ISO 7027)'), f('Rango', '', TA), f('Limpieza', '', 'Escobilla automática / aire'), f('Material', '', 'AISI 316 / PVC'), f('Montaje', '', TA)] },
      { s: 'TRANSMISOR', r: [f('Señal de salida', '', '4-20 mA + HART'), f('Relés', '', '2 SPDT'), f('Alimentación', '', '120 VAC 50 Hz'), f('Grado de protección', '', 'IP66')] },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'FLUIDO', w: 12 }, { t: 'RANGO', w: 12 }, { t: 'MONTAJE', w: 12 }, C_PID],
      filas: [['3100-AIT-0490', 'Turbidez rebalse espesador relaves', 'Agua', '0 – 500 NTU', 'Inmersión', '—']] }
  });

  add('Densidad y análisis', {
    id: 'ait-gas', tag: 'AIT', titulo: 'Detector fijo de gases', hoja: 'DETECTOR FIJO DE GASES',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE APLICACIÓN', r: [f('Gas a detectar', '', TA), f('Rango', 'ppm / % LEL / % vol', TA), f('Ubicación', '', TA), f('Clasificación de área del punto', '', TA)] },
      { s: 'DETECTOR', r: [f('Tecnología del sensor', '', 'Electroquímico / catalítico / infrarrojo (EPV)'), f('Desempeño', '', 'IEC 60079-29-1'), f('Tiempo de respuesta T90', 's', EPV), f('Vida útil del sensor', 'años', EPV), f('Alarmas', '', '2 niveles + falla'), f('Señal de salida', '', '4-20 mA + HART'), f('Relés', '', '3 SPDT'), f('Alimentación', '', '24 VDC'), f('Certificación', '', 'Según área (IEC 60079 / NEC 500)'), f('Grado de protección', '', 'IP66')] },
      REQUISITOS([f('Kit de calibración y gas patrón', '', 'Requerido'), f('Alarma audiovisual local', '', TA)])],
    aplicacion: { columnas: [C_TAG, { t: 'ÁREA / UBICACIÓN', w: 26 }, { t: 'GAS', w: 8 }, { t: 'RANGO', w: 10 }, { t: 'ALARMAS', w: 12 }, { t: 'BALIZA LOCAL', w: 8 }, C_PID],
      filas: [['5300-AIT-0570', 'Sala de reactivos', 'H2S', '0 – 50 ppm', '10 / 15 ppm', 'Sí', '—'], ['2200-AIT-0250', 'Túnel de alimentación', 'CO', '0 – 300 ppm', '25 / 50 ppm', 'Sí', '—']] }
  });

  // ── Correas ────────────────────────────────────────────────────────────────
  var C_CORREA = { t: 'CORREA', w: 12 }, C_UBIC = { t: 'UBICACIÓN', w: 18 };
  add('Correas transportadoras y alarmas', {
    id: 'zs-des', tag: 'ZS', titulo: 'Interruptor de desalineamiento', hoja: 'INTERRUPTOR DE DESALINEAMIENTO DE CORREA',
    secciones: [GENERAL(), SITIO(),
      { s: 'INTERRUPTOR', r: SW([f('Tipo', '', 'Brazo con rodillo, ambos sentidos'), f('Ajuste de alarma', '°', '10'), f('Ajuste de detención', '°', '20'), f('Rodillo', '', 'Recubierto, bajo roce'), f('Reposición', '', 'Automática')]) },
      REQUISITOS([f('Soporte', '', 'A estructura de correa, acero galvanizado')])],
    aplicacion: { columnas: [C_TAG, C_CORREA, { t: 'LADO', w: 9 }, C_UBIC, { t: 'ANCHO CORREA (mm)', w: 10 }, C_PLANO],
      filas: [['2100-ZS-0071', '2100-CV-001', 'Izquierdo', 'Cabeza', '1.400', '—'], ['2100-ZS-0072', '2100-CV-001', 'Derecho', 'Cabeza', '1.400', '—']] }
  });

  add('Correas transportadoras y alarmas', {
    id: 'ss-cero', tag: 'SSL', titulo: 'Interruptor de velocidad cero', hoja: 'INTERRUPTOR DE VELOCIDAD CERO',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE APLICACIÓN', r: [f('Polea supervisada', '', TA), f('Velocidad nominal de polea', 'rpm', TA), f('Punto de ajuste', '% vel. nominal', '80')] },
      { s: 'SENSOR', r: [f('Tipo', '', 'Inductivo sin contacto'), f('Distancia de detección', 'mm', EPV), f('Blanco', '', 'Disco o perno en la polea (EPV)'), f('Largo de cable sensor-receptor', 'm', '≤ 6')] },
      { s: 'RECEPTOR', r: SW([f('Retardo de partida', 's', 'Ajustable 5 – 50'), f('Alimentación', '', '120 VAC 50 Hz')]) },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_CORREA, { t: 'POLEA', w: 12 }, { t: 'RPM NOMINAL', w: 9 }, { t: 'AJUSTE (%)', w: 8 }, C_PLANO],
      filas: [['2100-SSL-0081', '2100-CV-001', 'Cola', '60', '80', '—'], ['2100-SSL-0082', '2100-CV-001', 'Motriz', '60', '90', '—']] }
  });

  add('Correas transportadoras y alarmas', {
    id: 'ls-tilt', tag: 'LSH', titulo: 'Interruptor de nivel tipo tilt', hoja: 'INTERRUPTOR DE NIVEL TIPO TILT',
    secciones: [GENERAL(), SITIO(),
      { s: 'DATOS DE APLICACIÓN', r: [f('Material', '', 'Mineral'), f('Equipo', '', TA), f('Tamaño máximo de material', 'mm', TA)] },
      { s: 'SONDA', r: [f('Tipo', '', 'Sonda de inclinación'), f('Material', '', 'Acero inoxidable'), f('Ángulo de actuación', '°', '15 – 20 (EPV)'), f('Largo de cable', 'm', TA)] },
      { s: 'UNIDAD ELECTRÓNICA', r: SW([f('Filtro antirrebote', '', 'Requerido'), f('Retardo', 's', 'Ajustable'), f('Indicación', '', 'LED de estado del relé'), f('Alimentación', '', '120 VAC 50 Hz')]) },
      REQUISITOS()],
    aplicacion: { columnas: [C_TAG, C_SERV, { t: 'EQUIPO', w: 14 }, { t: 'MATERIAL (mm)', w: 10 }, { t: 'LARGO CABLE (m)', w: 9 }, C_PID],
      filas: [['2100-LSH-0091', 'Atollo chute de traspaso', '2100-CH-011', '0 – 150', '10', '—']] }
  });

  add('Correas transportadoras y alarmas', {
    id: 'zs-cp', tag: 'ZS', titulo: 'Interruptor de posición en contrapeso', hoja: 'INTERRUPTOR DE POSICIÓN EN CONTRAPESO',
    secciones: [GENERAL(), SITIO(),
      { s: 'INTERRUPTOR', r: SW([f('Tipo', '', 'Fin de carrera de palanca / inductivo (EPV)'), f('Posiciones supervisadas', '', TA), f('Material del actuador', '', 'Acero inoxidable')]) },
      REQUISITOS([f('Soporte', '', 'A estructura del contrapeso, acero galvanizado')])],
    aplicacion: { columnas: [C_TAG, C_CORREA, { t: 'POSICIÓN', w: 14 }, { t: 'ACCIÓN', w: 9 }, C_PLANO],
      filas: [['2100-ZSH-0101', '2100-CV-001', 'Contrapeso alto', 'Alarma', '—'], ['2100-ZSL-0102', '2100-CV-001', 'Contrapeso bajo', 'Detención', '—']] }
  });

  // ── Control y automatización ───────────────────────────────────────────────────
  add('Control y automatización', {
    id: 'plc', tag: 'PLC', titulo: 'Controlador PLC y E/S', hoja: 'CONTROLADOR PROGRAMABLE (PLC) Y E/S',
    secciones: [GENERAL(), SITIO(),
      { s: 'CONTROLADOR', r: [f('Familia / plataforma', '', EPV), f('Redundancia de CPU', '', TA), f('Memoria de programa', 'MB', EPV), f('Uso máximo de CPU y memoria', '%', '60'), f('Lenguajes', '', 'IEC 61131-3'), f('Sincronización horaria', '', 'NTP / PTP'), f('Puertos de comunicación', '', TA)] },
      { s: 'ENTRADAS Y SALIDAS', r: [f('Entradas analógicas', 'canales', TA), f('Salidas analógicas', 'canales', TA), f('Entradas digitales', 'canales', TA), f('Salidas digitales', 'canales', TA), f('Tipo de señal analógica', '', '4-20 mA + HART, canales aislados'), f('Tensión de E/S digitales', '', '24 VDC'), f('Reserva instalada', '%', '20'), f('E/S remotas', '', TA), f('Fuentes de 24 VDC', '', 'Redundantes con supervisión'), f('Respaldo de energía', '', 'UPS, 30 min mínimo')] },
      
      REQUISITOS([f('Licencias', '', 'A nombre del Cliente, perpetuas'), f('Pruebas FAT', '', 'Requeridas (IEC 62381)')])],
    aplicacion: { columnas: [C_TAG, { t: 'ÁREA / SERVICIO', w: 24 }, { t: 'UBICACIÓN', w: 16 }, { t: 'CPU REDUND.', w: 8 }, { t: 'E/S (AI / AO / DI / DO)', w: 18 }, { t: 'RED', w: 12 }, C_PLANO],
      filas: [['2200-PLC-001', 'Molienda', 'Sala eléctrica 2200', 'Sí', '96 / 32 / 256 / 128', 'PROFINET', '—'], ['4100-PLC-001', 'Agua fresca', 'Estación de bombeo', 'No', '24 / 8 / 64 / 32', 'Modbus TCP', '—']] }
  });

  add('Control y automatización', {
    id: 'gab', tag: 'CP', titulo: 'Gabinete de control', hoja: 'GABINETE DE CONTROL / E/S REMOTAS',
    secciones: [GENERAL(), SITIO(),
      { s: 'ENVOLVENTE', r: [f('Tipo', '', 'Autosoportado / mural (TA)'), f('Dimensiones (alto × ancho × fondo)', 'mm', TA), f('Material', '', 'Acero al carbono pintado / AISI 304 (TA)'), f('Color', '', 'RAL 7035'), f('Grado de protección', '', TA), f('Acceso', '', 'Frontal, puerta con chapa'), f('Ventilación / climatización', '', 'Según cálculo térmico (EPV)'), f('Protección solar', '', TA)] },
      { s: 'EQUIPAMIENTO', r: [f('Alimentación de entrada', '', '120 VAC 50 Hz'), f('Fuentes 24 VDC', '', 'Redundantes, con supervisión'), f('Protecciones', '', 'Individuales por circuito'), f('Supresores de transientes', '', 'Alimentación y señales de terreno'), f('Borneras', '', 'Tornillo / resorte, 20 % reserva'), f('Canaletas', '', 'Llenado ≤ 40 %'), f('Barras de tierra', '', 'Protección e instrumentación aisladas'), f('Iluminación y tomacorriente', '', 'Requeridos'), f('Norma de fabricación', '', 'IEC 61439 / UL 508A')] },
      REQUISITOS([f('Pruebas de rutina', '', 'Requeridas, con protocolo')])],
    aplicacion: { columnas: [C_TAG, { t: 'SERVICIO', w: 24 }, { t: 'UBICACIÓN', w: 16 }, { t: 'TIPO', w: 11 }, { t: 'DIMENSIONES (mm)', w: 16 }, { t: 'PROTECCIÓN', w: 10 }, C_PLANO],
      filas: [['2200-CP-001', 'Gabinete PLC molienda', 'Sala eléctrica', 'Autosoportado', '2000 × 1200 × 600', 'IP54', '—'], ['2100-RIO-001', 'E/S remotas chancado', 'Terreno', 'Mural', '1000 × 800 × 300', 'NEMA 4X', '—']] }
  });

  // ── Comunicaciones industriales ─────────────────────────────────────────────────
  add('Comunicaciones industriales', {
    id: 'sw-eth', tag: 'NSW', titulo: 'Switch Ethernet industrial', hoja: 'SWITCH ETHERNET INDUSTRIAL',
    secciones: [GENERAL(), SITIO(),
      { s: 'SWITCH', r: [f('Tipo', '', 'Administrable, grado industrial'), f('Montaje', '', 'Riel DIN / rack 19" (TA)'), f('Puertos de cobre 10/100/1000', 'cant.', TA), f('Puertos SFP de fibra', 'cant.', TA), f('Redundancia de anillo', '', 'MRP (IEC 62439-2) / RSTP'), f('Tiempo de recuperación', 'ms', '≤ 200'), f('Funciones', '', 'VLAN, QoS, IGMP, SNMP v3, port security'), f('Certificación de protocolo', '', TA), f('Alimentación', '', '24 VDC redundante'), f('Contacto de falla', '', 'Requerido'), f('Temperatura de operación', '°C', '-40 a 70'), f('Inmunidad EMC', '', 'IEC 61000-6-2')] },
      REQUISITOS([f('Configuración', '', 'De fábrica según plan de direccionamiento')])],
    aplicacion: { columnas: [C_TAG, { t: 'UBICACIÓN', w: 20 }, { t: 'RED / ANILLO', w: 14 }, { t: 'PUERTOS Cu', w: 8 }, { t: 'PUERTOS FO', w: 8 }, { t: 'PROTOCOLO', w: 12 }, C_PLANO],
      filas: [['2200-NSW-001', 'Gabinete 2200-CP-001', 'Anillo control', '8', '4', 'PROFINET', '—'], ['2100-NSW-001', 'Gabinete 2100-RIO-001', 'Anillo control', '8', '2', 'PROFINET', '—']] }
  });

  add('Comunicaciones industriales', {
    id: 'cab-fo', tag: 'FO', titulo: 'Cable de fibra óptica', hoja: 'CABLE DE FIBRA ÓPTICA',
    secciones: [GENERAL(), SITIO(),
      { s: 'CABLE', r: [f('Tipo de fibra', '', 'Monomodo G.652.D (OS2)'), f('Número de fibras', '', TA), f('Construcción', '', 'Tubo holgado relleno de gel / seco'), f('Elemento de tracción', '', 'Dieléctrico'), f('Armadura', '', TA), f('Cubierta', '', 'PE (exterior) / LSZH (interior)'), f('Protección contra roedores', '', 'Requerida'), f('Atenuación máxima a 1310 / 1550 nm', 'dB/km', '0,35 / 0,22'), f('Radio mínimo de curvatura', '', '20 × diámetro (instalado)'), f('Normas', '', 'IEC 60793-2-50 / IEC 60794 / TIA-568.3-D')] },
      REQUISITOS([f('Certificado de fábrica por carrete', '', 'Requerido'), f('Pruebas instalado', '', 'Potencia y OTDR bidireccional')])],
    aplicacion: { columnas: [{ t: 'TAG / TRAMO', w: 16 }, { t: 'DESDE', w: 18 }, { t: 'HASTA', w: 18 }, { t: 'N° FIBRAS', w: 8 }, { t: 'LARGO (m)', w: 8 }, { t: 'CANALIZACIÓN', w: 14 }, C_PLANO],
      filas: [['FO-2200-001', 'Sala control central', 'Sala eléctrica 2200', '24', '850', 'Escalerilla', '—'], ['FO-4100-001', 'Sala control central', 'Estación de bombeo', '12', '3.200', 'Enterrado en ducto', '—']] }
  });

  add('Comunicaciones industriales', {
    id: 'radio-ptp', tag: 'RAD', titulo: 'Radio de enlace industrial', hoja: 'RADIO DE ENLACE INDUSTRIAL',
    secciones: [GENERAL(), SITIO(),
      { s: 'RADIO', r: [f('Tipo de enlace', '', TA), f('Banda de frecuencia', 'GHz', TA), f('Capacidad efectiva requerida', 'Mbps', TA), f('Distancia del enlace', 'km', TA), f('Antena', '', 'Integrada / externa (EPV)'), f('Ganancia de antena', 'dBi', EPV), f('Cifrado', '', 'AES-128 o superior'), f('Alimentación', '', 'PoE 24/48 V'), f('Grado de protección', '', 'IP67'), f('Homologación', '', 'SUBTEL')] },
      { s: 'INSTALACIÓN', r: [f('Mástil', '', TA), f('Protección contra descargas', '', 'Requerida'), f('Estudio de radioenlace', '', 'Requerido (Fresnel, margen, disponibilidad)')] },
      REQUISITOS()],
    aplicacion: { columnas: [{ t: 'TAG / ENLACE', w: 16 }, { t: 'SITIO A', w: 18 }, { t: 'SITIO B', w: 18 }, { t: 'BANDA (GHz)', w: 8 }, { t: 'DISTANCIA (km)', w: 9 }, { t: 'CAPACIDAD (Mbps)', w: 9 }, C_PLANO],
      filas: [['RAD-4100-001', 'Sala control central', 'Estación de bombeo 1', '5,8', '6,5', '50', '—']] }
  });

  // ── Cables y conexiones ─────────────────────────────────────────────────────────
  add('Cables y conexiones', {
    id: 'cab-inst', tag: 'CBL', titulo: 'Cable de instrumentación', hoja: 'CABLE DE INSTRUMENTACIÓN Y CONTROL',
    secciones: [GENERAL(), SITIO(),
      { s: 'CABLE', r: [f('Tipo', '', TA), f('Formación', '', TA), f('Sección del conductor', 'AWG / mm²', TA), f('Conductor', '', 'Cobre estañado, clase 2 (IEC 60228)'), f('Aislación', '', 'PVC / XLPE, 300 V o 600 V (TA)'), f('Pantalla individual', '', 'Aluminio-poliéster con drenaje (TA)'), f('Pantalla general', '', 'Aluminio-poliéster con drenaje'), f('Armadura', '', TA), f('Cubierta', '', 'PVC retardante / LSZH (TA)'), f('Comportamiento al fuego', '', 'IEC 60332-3 cat. A'), f('Normas', '', 'ICEA S-73-532 / UL 2250 / UL 1277')] },
      REQUISITOS([f('Identificación', '', 'Pares numerados; marca, tipo y metraje en la cubierta')])],
    aplicacion: { columnas: [{ t: 'CÓDIGO', w: 14 }, { t: 'DESCRIPCIÓN', w: 30 }, { t: 'FORMACIÓN', w: 12 }, { t: 'SECCIÓN', w: 9 }, { t: 'ARMADO', w: 8 }, { t: 'LARGO TOTAL (m)', w: 10 }],
      filas: [['C-1P16', 'Par blindado, señal analógica', '1 par', '16 AWG', 'No', '6.500'], ['C-12P18', 'Multipar blindado individual y general', '12 pares', '18 AWG', 'Sí', '2.400'], ['C-7C14', 'Cable de control', '7 cond.', '14 AWG', 'No', '3.800']] }
  });

  add('Cables y conexiones', {
    id: 'jb', tag: 'JB', titulo: 'Caja de conexión de terreno', hoja: 'CAJA DE CONEXIÓN DE TERRENO',
    secciones: [GENERAL(), SITIO(),
      { s: 'CAJA', r: [f('Material', '', 'AISI 316 / poliéster reforzado (TA)'), f('Dimensiones', 'mm', TA), f('Grado de protección', '', 'NEMA 4X'), f('Borneras', '', 'Tornillo, 2,5 mm², 20 % reserva'), f('Cantidad de bornes', '', TA), f('Barra de tierra de pantallas', '', 'Aislada'), f('Barra de tierra de protección', '', 'Requerida'), f('Entradas', '', 'Placa removible inferior, prensaestopas certificados'), f('Tipo de señales', '', TA), f('Montaje', '', 'Mural / en soporte')] },
      REQUISITOS([f('Placa de identificación', '', 'TAG en la puerta')])],
    aplicacion: { columnas: [C_TAG, { t: 'ÁREA', w: 18 }, { t: 'SEÑALES', w: 14 }, { t: 'N° BORNES', w: 9 }, { t: 'DIMENSIONES (mm)', w: 14 }, { t: 'MATERIAL', w: 12 }, C_PLANO],
      filas: [['2200-JB-001', 'Molino SAG', 'Analógicas 4-20 mA', '48', '400 × 400 × 200', 'AISI 316', '—'], ['2200-JB-002', 'Molino SAG', 'Discretas 24 VDC', '72', '500 × 400 × 200', 'AISI 316', '—']] }
  });

  // Grupo de las hojas ya existentes
  P.forEach(function (p) { if (!p.grupo) p.grupo = 'Otros'; });
})();
