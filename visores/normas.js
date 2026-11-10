/* Base normativa · Suite ReyEngi
 * Catálogo de normas eléctricas chilenas (SEC, CNE, Minería, Salud) con su estado, a qué entregables aporta y las reglas
 * concretas que usan los algoritmos de la suite. Fuente: textos oficiales de los pliegos RIC N°01–19 (Res. Ex. SEC
 * N°33.877/2020), pliegos RPTD N°01–17 (Res. Ex. SEC N°33.277/2020), NTSyCS (CNE, sept. 2020), D.S. N°132 (Minería),
 * D.S. N°594 (Salud). Las citas son extractos breves; el texto que rige es siempre el publicado por el organismo.
 *
 * Uso:  RE_NORMAS.P            parámetros numéricos que leen los cálculos (ocupación de ductos, IP, caídas, etc.)
 *       RE_NORMAS.CATALOGO     normas con estado, vigencia y aporte por entregable
 *       RE_NORMAS.REGLAS       cláusulas → entregable → dónde las usa la app (aplicada / nueva / pendiente)
 *       RE_NORMAS.paraEntregable(cod)   normas y reglas de un entregable (para secciones "Normas de referencia")
 *       RE_NORMAS.citasDocumento(cod)   textos listos para la lista de normas de un documento
 *       RE_NORMAS.exCompatible(zona, modo)   verifica modo de protección Ex vs zona (RIC N°12 5.1–5.3)
 *       RE_NORMAS.revisar()     revisa el proyecto activo y devuelve hallazgos por entregable
 */
(function () {
  'use strict';

  var ENTREGABLES = [
    ['00', 'Proyecto', 'proyectos/'], ['01', 'Análisis de P&ID', 'pid/'], ['02', 'Listado de instrumentos', 'lazos/#inst'],
    ['03', 'Hojas de datos', 'hojas-datos/'], ['04', 'Especificaciones técnicas', 'especificaciones/'], ['05', 'Listado de E/S', 'lazos/#doc'],
    ['06', 'Diagramas de lazo', 'lazos/#lazos'], ['07', 'Listado de circuitos', 'lazos/#circ'], ['08', 'Unilineales TDI', 'lazos/#uni'],
    ['09', 'Diagrama de bloques', 'lazos/#blq'], ['10', 'Detalles de montaje', '#montajes'], ['H3', 'Canalizaciones (conduit)', 'lazos/#cond']
  ];

  // ── Parámetros que consumen los algoritmos ──
  var P = {
    ocupacionDucto: { uno: 50, dos: 33, tresOMas: 33, niple: 60, subterraneo: 25, cita: 'RIC N°04 Tabla N°4.21 y Tabla N°4.29' },
    tramoDucto: { largoMax: 20, curvasMax: 2, desviacionMax: 180, registroRecto: 15, cita: 'RIC N°04 7.16.1.6, 7.16.1.7 y 7.16.1.13' },
    ductoSubterraneo: { diametroMin: 25, distCamaras: 90, distCamarasRecto: 120, cita: 'RIC N°04 7.9.7.1 y 7.9.7.8' },
    bandeja: { ocupacion: 40, peMin: 8.37, apoyos: 1.5, techo: 0.30, piso: 2.0, entreBandejas: 0.30, cita: 'RIC N°04 7.10.12, 7.10.18, 7.10.19, 7.10.27 y 7.10.29' },
    escalerilla: { capas: 2, secMin: 4, cita: 'RIC N°04 7.11.12 y 7.11.16' },
    ipTablero: { interior: 'IP41', bajoTecho: 'IP44', intemperie: 'IP54', mojado: 'IPX4', cita: 'RIC N°02 6.1.21' },
    tablero: { reserva: 25, circPorGeneral: 25, medicionDesde: 100, controlMaxA: 10, canaletaInterna: 50, alturaMando: [0.45, 2.0], cita: 'RIC N°02 6.1.16, 6.1.22, 6.2.13–6.2.15, 6.6.1' },
    espacioTrabajo: { condicion1: 0.9, condicion2: 1.2, condicion3: 1.5, frenteEnergizado: 1.5, acceso: [0.80, 2.20], lux: 500, cita: 'RIC N°02 5.4.2–5.4.6 y Tabla N°2.1' },
    caidaTension: { alimentador: 3, total: 5, cita: 'RIC N°03 5.1.3' },
    tensionSeguridad: { secoCA: 50, secoCC: 120, humedoCA: 24, humedoCC: 60, cita: 'RIC N°05 5.8' },
    diferencial: { mA: 30, cita: 'RIC N°05 7.8.2' },
    tierra: { servicioMaxOhm: 20, camarillaMin: 160, cita: 'RIC N°06 5.15 y 6.1' },
    motor: { factorConductor: 1.25, paradaCorreasCada: 20, cita: 'RIC N°07 5.4.9 y 5.5.2' },
    aislamiento: [['MBTS / MBTP', 250, 0.25], ['Hasta 500 V', 500, 0.5], ['Sobre 500 V', 1000, 1.0]],
    ex: { tMin: -20, tMax: 40, cita: 'RIC N°12 5.1–5.3 y 9.2.1.3' },
    salaElectrica: { pasilloUnLado: [1.0, 3.0], pasilloAmbos: [1.2, 2.0], ventNatural: 20, ventForzada: 20, cita: 'RIC N°13 6.4.8 y 8.10' },
    presentacion: { formatos: 'Serie A (NCh 13 Of. 93)', escalas: ['1:20', '1:50', '1:100', '1:200', '1:500'], cita: 'RIC N°18 6.3' },
    sitr: { disponibilidad: 99.5, errorTiempoUs: 100, retardoS: 5, cita: 'NTSyCS Cap. 4, Título 4-2' },
    vccControl: { normalizadas: [24, 48, 110, 125], cita: 'RPTD N°10 5.11.5' },
    altitud: { umbral: 1000, cita: 'RPTD N°05 5.7 y 8.2' },
    mineria: { interruptorDerivacion: 15, cita: 'D.S. N°132 Art. 443' }
  };

  // ── Catálogo ──
  // estado: vigente · modificada (vigente con cambios posteriores) · reemplazada · derogada · consulta · fuera (sin aporte a I&C)
  // e: aporte por entregable (3 alto, 2 medio, 1 bajo)
  var CATALOGO = [
    { id: 'DS8', sigla: 'D.S. N°8/2019', t: 'Reglamento de seguridad de las instalaciones de consumo de energía eléctrica', org: 'Ministerio de Energía', estado: 'vigente', desde: '2021', base: 'Reglamento que ordena dictar los pliegos RIC (art. 12).', e: { '00': 3, '04': 2, '08': 2 } },
    { id: 'RIC01', sigla: 'RIC N°01', t: 'Empalmes', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '00': 1, '08': 1 }, aporte: 'Solo cuando el TDI o la sala se alimentan desde un empalme propio.' },
    { id: 'RIC02', sigla: 'RIC N°02', t: 'Tableros eléctricos', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 3, '04': 2, '10': 2, '00': 1 }, aporte: 'Grado IP, reserva 25 %, luces piloto, medición ≥100 A, 25 circuitos por general, rotulado, espacios de trabajo, CCM (IEC 61439).' },
    { id: 'RIC03', sigla: 'RIC N°03', t: 'Alimentadores y demanda de una instalación', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020 (V1.1)', e: { '08': 3, '07': 2 }, aporte: 'Caída de tensión 3 % alimentador / 5 % total, sección mínima y protección del alimentador.' },
    { id: 'RIC04', sigla: 'RIC N°04', t: 'Conductores, materiales y sistemas de canalización', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '07': 3, 'H3': 3, '08': 3, '10': 3, '04': 2, '06': 1 }, aporte: 'Capacidad de corriente (tablas 4.4/4.6/4.7), colores, ocupación de ductos, bandejas y escalerillas, separación fuerza / control, un circuito por tubería.' },
    { id: 'RIC05', sigla: 'RIC N°05', t: 'Medidas de protección contra tensiones peligrosas y descargas eléctricas', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 3, '04': 1, '06': 1 }, aporte: 'Diferenciales 30 mA, tensiones de seguridad (24 VDC de instrumentación), esquemas TN/TT/IT.' },
    { id: 'RIC06', sigla: 'RIC N°06', t: 'Puesta a tierra y enlace equipotencial', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 3, '10': 3, '04': 2, '06': 1 }, aporte: 'Conductor de protección (Anexo 6.7), interconexión de todas las tierras, tierra funcional al borne principal, tierra de servicio ≤ 20 Ω.' },
    { id: 'RIC07', sigla: 'RIC N°07', t: 'Instalaciones de equipos', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020 (V1.1)', e: { '02': 2, '05': 2, '08': 2, '03': 1 }, aporte: 'Motores (1,25·In), parada de emergencia a la vista y cada 20 m en correas transportadoras.' },
    { id: 'RIC08', sigla: 'RIC N°08', t: 'Sistemas de emergencia', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 2, '09': 1, '04': 1 }, aporte: 'UPS (IEC 62040), autonomía hasta entrada del respaldo, iluminación de emergencia.' },
    { id: 'RIC09', sigla: 'RIC N°09 / 9.1', t: 'Sistemas de autogeneración', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.877/2020', e: {}, aporte: 'Sin aporte directo a I&C (generación y fotovoltaica).' },
    { id: 'RIC10', sigla: 'RIC N°10', t: 'Instalaciones de uso general', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 2, '00': 1, '10': 1 }, aporte: 'Protección de circuitos (In ≤ Iz, +10 %), iluminancia de salas de control 500 lx (Anexo 10.1).' },
    { id: 'RIC11', sigla: 'RIC N°11', t: 'Instalaciones especiales', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '04': 1 }, aporte: 'Recintos médicos, húmedos, piscinas, ferias; aporte marginal a I&C.' },
    { id: 'RIC12', sigla: 'RIC N°12', t: 'Instalaciones en ambientes explosivos', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '02': 3, '03': 3, '04': 3, '10': 3, '07': 2, '00': 2, '06': 1 }, aporte: 'Zonas 0/1/2 y 20/21/22, modo de protección por zona (ia, ib, ic, d, e, p…), marcado, temperatura ambiente, sellos, documentación Ex del proyecto.' },
    { id: 'RIC13', sigla: 'RIC N°13', t: 'Subestaciones y salas eléctricas', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020 · deroga NSEG 20 E.p.78', e: { '10': 2, '00': 2, '08': 1 }, aporte: 'Pasillos de 1,0 m / 1,2 m, ventilación 20 cm²/kVA o 20 renovaciones/h, iluminación.' },
    { id: 'RIC14', sigla: 'RIC N°14', t: 'Exigencias de eficiencia energética para edificios', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.877/2020', e: {}, aporte: 'Sin aporte directo a I&C.' },
    { id: 'RIC15', sigla: 'RIC N°15', t: 'Infraestructura para la recarga de vehículos eléctricos', org: 'SEC', estado: 'modificada', desde: '2024', res: 'Actualizado por Res. Ex. N°23.900/2024', e: {}, aporte: 'Sin aporte a I&C.' },
    { id: 'RIC16', sigla: 'RIC N°16', t: 'Subsistemas de distribución', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.877/2020', e: { '08': 1 }, aporte: 'Redes internas de distribución.' },
    { id: 'RIC17', sigla: 'RIC N°17', t: 'Operación y mantenimiento', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.877/2020', e: { '04': 1, '00': 1 }, aporte: 'Planes de mantenimiento y evaluación de riesgos.' },
    { id: 'RIC18', sigla: 'RIC N°18', t: 'Presentación de proyectos', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '00': 3, '06': 2, '08': 3, '09': 2, '10': 2, '07': 2 }, aporte: 'Formatos serie A (NCh 13), rotulación, lámina N de M, lista de láminas, simbología, escalas, contenido mínimo del unilineal, coordenadas UTM/WGS84.' },
    { id: 'RIC19', sigla: 'RIC N°19', t: 'Puesta en servicio', org: 'SEC', estado: 'vigente', desde: '11-07-2021', res: 'Res. Ex. N°33.877/2020', e: { '04': 2, '00': 2, '08': 1 }, aporte: 'Pruebas: continuidad, resistencia de aislamiento (Tabla 19.1), diferenciales, polaridad, secuencia de fases, caída de tensión.' },
    { id: 'DS109', sigla: 'D.S. N°109/2017', t: 'Reglamento de seguridad de las instalaciones eléctricas de producción, transporte y distribución', org: 'Ministerio de Energía', estado: 'vigente', desde: '2020', base: 'Reglamento de los pliegos RPTD.', e: { '00': 1 } },
    { id: 'RPTD03', sigla: 'RPTD N°03', t: 'Proyectos y estudios', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.277/2020', e: { '00': 1 } },
    { id: 'RPTD05', sigla: 'RPTD N°05', t: 'Aislación', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.277/2020', e: { '03': 1, '04': 1 }, aporte: 'BIL/BSL hasta 1.000 m; sobre 1.000 m corrección por altura (faenas en altura).' },
    { id: 'RPTD06', sigla: 'RPTD N°06', t: 'Puesta a tierra', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.277/2020', e: { '10': 1 }, aporte: 'Mallas de subestaciones de alta tensión.' },
    { id: 'RPTD10', sigla: 'RPTD N°10', t: 'Centrales de producción y subestaciones', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.277/2020', e: { '09': 2, '08': 1, '04': 1 }, aporte: 'Casa de control, baterías redundantes para protección y control, tensiones CC normalizadas 24–48–110–125 V.' },
    { id: 'RPTDx', sigla: 'RPTD N°01, 02, 04, 07–09, 11–17', t: 'Resto de pliegos de producción, transporte y distribución', org: 'SEC', estado: 'vigente', desde: '2021', res: 'Res. Ex. N°33.277/2020', e: {}, aporte: 'Líneas, franjas, incendio, señalización, O&M y SGIIE: aporte marginal a I&C de planta.' },
    { id: 'NTSYCS', sigla: 'NTSyCS', t: 'Norma Técnica de Seguridad y Calidad de Servicio', org: 'CNE', estado: 'modificada', desde: '2020', res: 'Versión de los archivos: septiembre 2020; modificada después por la CNE (verificar texto vigente)', e: { '09': 3, '05': 1, '00': 1 }, aporte: 'Solo instalaciones coordinadas por el CEN: SITR con disponibilidad ≥ 99,5 %, estampa de tiempo GPS ±100 µs, retardo ≤ 5 s, respaldo de alimentación y redundancia de comunicaciones.' },
    { id: 'DS132', sigla: 'D.S. N°132/2002', t: 'Reglamento de Seguridad Minera', org: 'Ministerio de Minería', estado: 'vigente', desde: '07-02-2004', res: 'Texto refundido (verificar modificaciones posteriores)', e: { '00': 3, '08': 3, '10': 2, '04': 2, '02': 1, '05': 1, '07': 1 }, aporte: 'Planos y registros eléctricos actualizados, unilineal en cada recinto, bloqueo, protecciones, cajas herméticas, interruptor ≤ 15 m de la derivación, un solo dispositivo de partida, mallas de tierra.' },
    { id: 'DS594', sigla: 'D.S. N°594/1999', t: 'Condiciones sanitarias y ambientales básicas en los lugares de trabajo', org: 'Ministerio de Salud', estado: 'vigente', desde: '1999', e: { '00': 1, '03': 1 }, aporte: 'Iluminación (Art. 103) y ruido 85 dB(A) / 8 h (Art. 74–75): alarmas audibles y salas.' },
    { id: 'DS40', sigla: 'D.S. N°40/1969', t: 'Reglamento sobre prevención de riesgos profesionales', org: 'Ministerio del Trabajo', estado: 'vigente', e: {}, aporte: 'Gestión de riesgos; sin aporte de diseño.' },
    { id: 'DS327', sigla: 'D.S. N°327/1997', t: 'Reglamento de la Ley General de Servicios Eléctricos', org: 'Ministerio de Minería', estado: 'vigente', e: {}, aporte: 'Marco general del sector.' },
    { id: 'DS1', sigla: 'D.S. N°1/2022 · D.S. N°43/2012', t: 'Norma de emisión para contaminación lumínica', org: 'Ministerio del Medio Ambiente', estado: 'vigente', e: {}, aporte: 'Alumbrado exterior; sin aporte a I&C.' },
    { id: 'NCH4', sigla: 'NCh Elec. 4/2003', t: 'Instalaciones de consumo en baja tensión', org: 'SEC', estado: 'reemplazada', por: 'D.S. N°8/2019 y pliegos RIC N°01–19', e: {}, aporte: 'No usar en proyectos nuevos; los catálogos antiguos citan sus tablas.' },
    { id: 'NSEG5', sigla: 'NSEG 5 E.n.71', t: 'Instalaciones eléctricas de corrientes fuertes', org: 'SEC', estado: 'derogada', por: 'Res. Ex. N°33.277/2020 (pliegos RPTD)', e: {} },
    { id: 'NSEG6', sigla: 'NSEG 6 E.n.71', t: 'Cruces y paralelismos de líneas eléctricas', org: 'SEC', estado: 'derogada', por: 'Res. Ex. N°33.277/2020', e: {} },
    { id: 'NSEG8', sigla: 'NSEG 8 E.n.75', t: 'Tensiones normales para sistemas e instalaciones', org: 'SEC', estado: 'derogada', por: 'Res. Ex. N°33.277/2020 (en lo pertinente); ver RPTD N°01', e: {} },
    { id: 'NSEG16', sigla: 'NSEG 16 E.n.78', t: 'Especificaciones de transformadores de distribución', org: 'SEC', estado: 'derogada', por: 'Res. Ex. N°33.277/2020 (en lo pertinente)', e: {} },
    { id: 'NSEG20', sigla: 'NSEG 20 E.p.78', t: 'Subestaciones transformadoras interiores', org: 'SEC', estado: 'derogada', por: 'Res. Ex. N°33.877/2020 (RIC N°13)', e: {} },
    { id: 'NCH2', sigla: 'NCh Elec. 2/84 · 10/84', t: 'Elaboración y presentación de proyectos · trámite de puesta en servicio', org: 'SEC', estado: 'reemplazada', por: 'RIC N°18 y N°19 (verificar acto de derogación)', e: {} },
    { id: 'NSEGx', sigla: 'NSEG 3, 9, 12, 14, 15, 21, 32, 34', t: 'Medidores, alumbrado público, empalmes aéreos, luminarias y tarifas', org: 'SEC', estado: 'fuera', e: {}, aporte: 'Fuera del alcance de los entregables de I&C.' }
  ];

  // ── Reglas: cláusula → entregable → dónde la usa la app ──
  // u: archivo o vista que la aplica · s: aplicada (ya en el algoritmo) · nueva (agregada con la base normativa) · pendiente (mejora sugerida)
  var REGLAS = [
    { id: 'r02-ip', n: 'RIC02', c: '6.1.21', ent: ['08', '04'], txt: 'Grado de protección mínimo de tableros: IP41 interior, IP44 exterior bajo techo, IP54 intemperie, IPX4 en lugares mojados.', u: 'Unilineal TDI (lazos/ric.js)', s: 'aplicada' },
    { id: 'r02-reserva', n: 'RIC02', c: '6.1.16.3', ent: ['08'], txt: 'Gabinetes nuevos con espacio para ampliar 25 % por tipo de servicio, con espacio en barras y riel DIN.', u: 'Unilineal TDI (verificación y botón de reservas)', s: 'aplicada' },
    { id: 'r02-canaleta', n: 'RIC02', c: '6.1.16.1', ent: ['08', '04'], txt: 'Cableado interno en bandejas portaconductores no metálicas ocupadas como máximo al 50 % (salvo tableros con menos de 8 circuitos).', u: 'Notas del unilineal TDI', s: 'nueva' },
    { id: 'r02-general', n: 'RIC02', c: '6.6.1', ent: ['08'], txt: 'Máximo 25 circuitos por protección general.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r02-piloto', n: 'RIC02', c: '6.2.13–6.2.14', ent: ['08'], txt: 'Luces piloto por fase en todo tablero; instrumentos de tensión y corriente por fase desde 100 A.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r02-control', n: 'RIC02', c: '6.2.15', ent: ['08'], txt: 'Luces piloto, instrumentos y dispositivos de control con circuito independiente protegido a 10 A como máximo.', u: 'Revisión normativa del TDI', s: 'nueva' },
    { id: 'r02-regletas', n: 'RIC02', c: '6.2.12', ent: ['08', '06'], txt: 'Los consumos externos se conectan a regletas, no directamente a las protecciones (salvo tableros de menos de 8 circuitos).', u: 'Notas del unilineal y diagramas de lazo (regletas)', s: 'aplicada' },
    { id: 'r02-rotulo', n: 'RIC02', c: '5.3.6–5.3.9', ent: ['08'], txt: 'Cuadro de circuitos y unilineal actualizado y protegido en el tablero; cada protección rotulada con N° de circuito y servicio.', u: 'Notas del unilineal TDI', s: 'aplicada' },
    { id: 'r02-altura', n: 'RIC02', c: '6.1.22', ent: ['10', '04'], txt: 'Dispositivos de comando entre 0,45 m y 2,0 m sobre piso terminado (excepto CCM y armarios).', u: 'Detalles de montaje de gabinetes', s: 'pendiente' },
    { id: 'r02-espacio', n: 'RIC02', c: '5.4.2–5.4.6', ent: ['10', '00'], txt: 'Espacios de trabajo frente a tableros 0,9 / 1,2 / 1,5 m según condición (1,5 m con partes energizadas al frente); acceso 0,80 × 2,20 m; 500 lx.', u: 'Layout de salas eléctricas', s: 'pendiente' },
    { id: 'r02-ccm', n: 'RIC02', c: '6.9.1', ent: ['04'], txt: 'CCM fabricados según IEC 61439-1 y 61439-2 y ensayados a falla de arco según IEC TR 61641.', u: 'Especificación de CCM', s: 'pendiente' },
    { id: 'r03-caida', n: 'RIC03', c: '5.1.3', ent: ['08', '07'], txt: 'Caída de tensión máxima 3 % en el alimentador y 5 % total hasta el consumo.', u: 'Unilineal TDI (lazos/ric.js)', s: 'aplicada' },
    { id: 'r04-ampacidad', n: 'RIC04', c: 'Tablas 4.4, 4.6, 4.7', ent: ['08', '07'], txt: 'Corriente admisible por método de instalación, factor por cantidad de conductores y por temperatura ambiente.', u: 'Unilineal TDI (lazos/ric.js)', s: 'aplicada' },
    { id: 'r04-secmin', n: 'RIC04', c: '5.4', ent: ['08'], txt: 'Secciones mínimas: alumbrado 1,5 mm², enchufes y subalimentadores 2,5 mm².', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r04-colores', n: 'RIC04', c: '5.30–5.33', ent: ['08', '04', '06'], txt: 'Fases azul, negro, rojo; neutro blanco; protección verde o verde/amarillo. Canalizaciones eléctricas sin colores rojo, amarillo ni azul.', u: 'Notas del unilineal TDI', s: 'aplicada' },
    { id: 'r04-ocupacion', n: 'RIC04', c: '7.16.1.14 · Tabla 4.21', ent: ['H3', '07'], txt: 'Ocupación máxima de la tubería: 1 conductor 50 %, 2 conductores 33 %, 3 o más 33 %; 60 % en uniones de gabinetes de hasta 1 m.', u: 'Canalizaciones (lazos/conduit.js)', s: 'aplicada' },
    { id: 'r04-subt', n: 'RIC04', c: 'Tabla 4.29 · 7.9.7', ent: ['H3', '07', '10'], txt: 'Subterráneo: con más de 10 conductores o secciones distintas, interior ≥ 4 × sección ocupada; Ø mínimo 25 mm; cámaras cada 90 m (120 m rectos con ductos ≥ 50 mm).', u: 'Canalizaciones', s: 'aplicada' },
    { id: 'r04-tramo', n: 'RIC04', c: '7.16.1.6, 7.16.1.7, 7.16.1.13', ent: ['H3', '10'], txt: 'Tramos de hasta 20 m con no más de dos curvas (≤ 180°); registros cada 15 m como máximo en tramos rectos.', u: 'Canalizaciones', s: 'nueva' },
    { id: 'r04-uncircuito', n: 'RIC04', c: '5.27', ent: ['H3', '07'], txt: 'En una misma tubería solo conductores de un mismo circuito (excepto bandejas, escalerillas, canastillos y canaletas).', u: 'Canalizaciones · aviso al mezclar circuitos de fuerza', s: 'nueva' },
    { id: 'r04-separacion', n: 'RIC04', c: '7.1.6–7.1.7, 7.10.24, 7.11.10.3', ent: ['H3', '07', '10'], txt: 'Canalizaciones de fuerza y de comunicación o control separadas y distanciadas; en bandejas, compartimento separado; en escalerillas no comparten salvo blindaje a tierra o separador.', u: 'Canalizaciones · aviso al mezclar señal con fuerza o control', s: 'nueva' },
    { id: 'r04-bandeja', n: 'RIC04', c: '7.10.19', ent: ['H3', '07'], txt: 'Bandejas: los cables, con su aislación, no ocupan más del 40 % de la sección transversal, aplicando los factores de la Tabla 4.6.', u: 'Cálculo de bandejas (sugerido)', s: 'pendiente' },
    { id: 'r04-escalerilla', n: 'RIC04', c: '7.11.12, 7.11.16', ent: ['H3', '10'], txt: 'Escalerillas: máximo dos capas de cables; sección mínima 4 mm² salvo multiconductores.', u: 'Cálculo de escalerillas (sugerido)', s: 'pendiente' },
    { id: 'r04-pebandeja', n: 'RIC04', c: '7.10.26–7.10.27', ent: ['10', '07'], txt: 'Bandejas metálicas con conductor de protección desnudo común de sección ≥ 8,37 mm², unido en cada tramo.', u: 'Detalles de montaje de bandejas', s: 'pendiente' },
    { id: 'r04-montajeBandeja', n: 'RIC04', c: '7.10.12, 7.10.18, 7.10.29', ent: ['10'], txt: 'Soportes cada 1,5 m (hasta 3 m justificado); 0,30 m libres sobre la bandeja y 2 m sobre piso de tránsito; 0,3 m entre bandejas apiladas.', u: 'Detalles de montaje de bandejas', s: 'pendiente' },
    { id: 'r05-dif', n: 'RIC05', c: '7.8.2–7.8.3', ent: ['08'], txt: 'Diferenciales de 30 mA como protección complementaria; tipo A con cargas no senoidales.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r05-tseg', n: 'RIC05', c: '5.8', ent: ['06', '05', '04'], txt: 'Tensión de seguridad: 50 V CA / 120 V CC en lugares secos; 24 V CA / 60 V CC en lugares húmedos. Los lazos de 24 VDC quedan bajo ese límite.', u: 'Revisión normativa (tensión de control del proyecto)', s: 'nueva' },
    { id: 'r06-pe', n: 'RIC06', c: 'Anexo 6.7', ent: ['08'], txt: 'Sección mínima del conductor de protección según la sección de fase.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r06-interconexion', n: 'RIC06', c: '5.10–5.11.1', ent: ['10', '04', '06'], txt: 'Todas las puestas a tierra se interconectan; la tierra funcional (instrumentación) llega al borne principal de tierra.', u: 'Especificaciones (sección puesta a tierra)', s: 'aplicada' },
    { id: 'r06-servicio', n: 'RIC06', c: '6.1', ent: ['08'], txt: 'Tierra de servicio ≤ 20 Ω y tensión de conductores activos a tierra ≤ 250 V en falla.', u: 'Revisión normativa', s: 'pendiente' },
    { id: 'r06-camarilla', n: 'RIC06', c: '5.15', ent: ['10'], txt: 'Punto accesible de medición: camarilla Ø ≥ 160 mm o caja de 30 × 30 cm.', u: 'Detalles de montaje de puesta a tierra', s: 'pendiente' },
    { id: 'r07-motor', n: 'RIC07', c: '5.5.2', ent: ['08'], txt: 'Conductores de motores para 1,25 veces la corriente de plena carga.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r07-parada', n: 'RIC07', c: '5.4.9', ent: ['02', '05', '03'], txt: 'Parada de emergencia cercana y a la vista en máquinas con riesgo mecánico; en correas transportadoras cada 20 m como máximo.', u: 'Asistente de tirantes en Normativa', s: 'nueva' },
    { id: 'r08-ups', n: 'RIC08', c: '8.11', ent: ['08', '04', '09'], txt: 'UPS según IEC 62040-1/-2/-3/-4, con autonomía suficiente hasta que entre el respaldo alternativo.', u: 'Notas del TDI y especificaciones', s: 'aplicada' },
    { id: 'r10-lux', n: 'RIC10', c: 'Anexo 10.1', ent: ['00', '10'], txt: 'Salas de control: 500 lx.', u: 'Criterios de diseño', s: 'pendiente' },
    { id: 'r12-zona', n: 'RIC12', c: '5.1–5.3', ent: ['02', '03', '04'], txt: 'Modo de protección por zona: Zona 0/20 → ia, ma, ta; Zona 1/21 → además d, e, ib, pb/px, q, o, mb, tb; Zona 2/22 → además nA, nC, nL, ic, pc, mc, tc.', u: 'Verificador Ex en Normativa', s: 'nueva' },
    { id: 'r12-temp', n: 'RIC12', c: '9.2.1.3', ent: ['03', '04'], txt: 'Si la temperatura ambiente sale de −20 °C a +40 °C, el equipo Ex debe estar marcado para ese rango.', u: 'Revisión normativa (condiciones de sitio)', s: 'nueva' },
    { id: 'r12-doc', n: 'RIC12', c: '8.4.1–8.4.2', ent: ['00', '04'], txt: 'El proyecto incluye clasificación de áreas con fuentes de escape y plano, adecuación del modo de protección por zona, instrucciones de instalación y conexión; se conservan certificados y documentos de sistemas de seguridad intrínseca.', u: 'Revisión normativa', s: 'nueva' },
    { id: 'r12-cables', n: 'RIC12', c: '11.1', ent: ['07', '04'], txt: 'Cableado de seguridad intrínseca según IEC 60079-14/-25/-27; el resto con tensión asignada ≥ 450/750 V.', u: 'Especificación de cables', s: 'pendiente' },
    { id: 'r12-sellos', n: 'RIC12', c: '11.3.5', ent: ['10'], txt: 'Sellos cortafuego de envolventes "d" rellenos con masa certificada, a 50 mm de la envolvente y con unión doble.', u: 'Detalles de montaje Ex', s: 'pendiente' },
    { id: 'r13-pasillo', n: 'RIC13', c: '6.4.8 · 8.10', ent: ['10', '00'], txt: 'Pasillos de 1,0 m (equipo a un lado) o 1,2 m (ambos lados); ventilación natural 20 cm²/kVA (mín. 0,1 m²) o forzada 20 renovaciones/h.', u: 'Layout de salas eléctricas', s: 'pendiente' },
    { id: 'r18-formato', n: 'RIC18', c: '6.3.2–6.3.4', ent: ['00', '06', '08', '09', '10'], txt: 'Planos en DWG o equivalente, formatos serie A (NCh 13 Of. 93) y rotulación según Anexo 18.2.', u: 'Láminas A3 con DXF de toda la suite', s: 'aplicada' },
    { id: 'r18-laminas', n: 'RIC18', c: '6.3.7–6.3.8', ent: ['00', '06'], txt: 'Cada lámina indica N° correlativo y total (lámina N de M); la primera lista el título de todas.', u: 'Rótulo "HOJA N DE M" de los diagramas de lazo', s: 'aplicada' },
    { id: 'r18-ubicacion', n: 'RIC18', c: '6.3.5–6.3.6', ent: ['00'], txt: 'La primera lámina indica coordenadas UTM o geodésicas WGS84 y un croquis de ubicación.', u: 'Datos del proyecto', s: 'pendiente' },
    { id: 'r18-simbologia', n: 'RIC18', c: '6.3.9–6.3.10', ent: ['06', '08', '09', '10'], txt: 'Cuadro de simbología con las características técnicas de cada símbolo.', u: 'Simbología de lazos y bloques', s: 'aplicada' },
    { id: 'r18-unilineal', n: 'RIC18', c: '6.3.15', ent: ['08'], txt: 'El unilineal muestra alimentadores con cantidad, longitud, sección y canalización; protecciones con In, Icu, curva, marca, modelo y polos; y el sistema de puesta a tierra.', u: 'Unilineal TDI', s: 'aplicada' },
    { id: 'r19-aisl', n: 'RIC19', c: '7.3 · Tabla 19.1', ent: ['04', '00'], txt: 'Resistencia de aislamiento mínima: MBTS 250 VCC ≥ 0,25 MΩ; hasta 500 V 500 VCC ≥ 0,5 MΩ; sobre 500 V 1000 VCC ≥ 1,0 MΩ.', u: 'Especificaciones (pruebas)', s: 'nueva' },
    { id: 'rp05-altitud', n: 'RPTD05', c: '5.7 · 8.2', ent: ['03', '04'], txt: 'Niveles de aislación definidos hasta 1.000 m; sobre esa altura se aplica factor de corrección por altitud.', u: 'Revisión normativa (altura del proyecto)', s: 'nueva' },
    { id: 'rp10-cc', n: 'RPTD10', c: '5.11', ent: ['09', '08', '04'], txt: 'Protección y control de subestaciones en CC desde baterías con cargador, redundantes; tensiones normalizadas 24, 48, 110 y 125 V.', u: 'Revisión normativa (tensión de control)', s: 'nueva' },
    { id: 'nt-sitr', n: 'NTSYCS', c: 'Título 4-2', ent: ['09', '05'], txt: 'Instalaciones coordinadas: enlace de datos al Coordinador con disponibilidad ≥ 99,5 % mensual, estampa de tiempo con error ≤ ±100 µs respecto de GPS, retardo ≤ 5 s y respaldo de alimentación.', u: 'Revisión del diagrama de bloques', s: 'nueva' },
    { id: 'ds132-planos', n: 'DS132', c: 'Art. 396–398', ent: ['00', '08'], txt: 'Planos y registros eléctricos actualizados en faena; unilineal disponible en cada recinto con equipos energizados.', u: 'Revisión normativa', s: 'nueva' },
    { id: 'ds132-protec', n: 'DS132', c: 'Art. 431, 439, 443, 446, 459', ent: ['08', '10', '04'], txt: 'Protecciones contra sobrecarga, falla a tierra y cortocircuito; fusibles e interruptores en cajas herméticas; interruptor a no más de 15 m de la derivación; motores con protección de bajo voltaje; un solo dispositivo de partida cerca del equipo.', u: 'Revisión normativa', s: 'nueva' },
    { id: 'ds132-tierra', n: 'DS132', c: 'Art. 424, 434–438', ent: ['10', '08'], txt: 'Mallas de tierra individuales en subestaciones > 600 V, inspección anual, terminales apropiados y sin elementos que interrumpan el conductor de tierra.', u: 'Detalles de montaje de puesta a tierra', s: 'pendiente' },
    { id: 'ds594-ruido', n: 'DS594', c: 'Art. 74–75 · 103', ent: ['03', '00'], txt: 'Exposición a ruido 85 dB(A) en 8 h; niveles mínimos de iluminación por actividad.', u: 'Hojas de datos de alarmas audibles', s: 'pendiente' }
  ];

  // ── Verificador Ex (RIC N°12 5.1–5.3) ──
  var EX = {
    '0': ['ia', 'ma', 'da'], '20': ['ia', 'ma', 'ta', 'iaD', 'maD', 'taD'],
    '1': ['ia', 'ib', 'ma', 'mb', 'd', 'db', 'e', 'eb', 'px', 'py', 'pb', 'q', 'o', 'sb'], '21': ['ia', 'ib', 'ma', 'mb', 'ta', 'tb', 'pD', 'iaD', 'ibD', 'maD', 'mbD', 'taD', 'tbD', 'sb'],
    '2': ['ia', 'ib', 'ic', 'ma', 'mb', 'mc', 'd', 'db', 'dc', 'e', 'eb', 'ec', 'px', 'py', 'pb', 'pz', 'pc', 'q', 'o', 'nA', 'nC', 'nL', 'nR', 'sc'],
    '22': ['ia', 'ib', 'ic', 'ma', 'mb', 'mc', 'ta', 'tb', 'tc', 'pD', 'iaD', 'ibD', 'icD', 'maD', 'mbD', 'taD', 'tbD', 'tcD', 'sc']
  };
  var EPL = { '0': 'Ga', '1': 'Gb', '2': 'Gc', '20': 'Da', '21': 'Db', '22': 'Dc' };
  function exCompatible(zona, marcado) {
    zona = String(zona || '').replace(/\D/g, '');
    if (!EX[zona]) return { ok: null, msg: 'Indica la zona: 0, 1, 2, 20, 21 o 22.' };
    var m = String(marcado || ''), modos = (m.match(/\b(ia|ib|ic|ma|mb|mc|da|db|dc|eb|ec|e|d|px|py|pz|pb|pc|pD|q|o|nA|nC|nL|nR|ta|tb|tc|sb|sc)\b/g) || []);
    var epl = (m.match(/\b(Ga|Gb|Gc|Da|Db|Dc)\b/) || [])[1];
    if (!modos.length && !epl) return { ok: null, msg: 'No se reconoce el modo de protección en el marcado (ej.: Ex ia IIC T4 Ga).' };
    var orden = { a: 3, b: 2, c: 1 }, req = EPL[zona], okEpl = !epl || (epl[0] === req[0] && orden[epl[1]] >= orden[req[1]]);
    var okModo = !modos.length || modos.some(function (x) { return EX[zona].indexOf(x) >= 0; });
    var ok = okEpl && okModo;
    return { ok: ok, req: req, msg: ok ? 'Apto para Zona ' + zona + ' (EPL requerido ' + req + ').' : 'No apto para Zona ' + zona + ': requiere EPL ' + req + ' y un modo de protección de RIC N°12 ' + ({ '0': '5.1', '20': '5.1', '1': '5.2', '21': '5.2', '2': '5.3', '22': '5.3' })[zona] + '.' };
  }

  // ── Consultas ──
  var NI = {}; CATALOGO.forEach(function (n) { NI[n.id] = n; });
  function paraEntregable(cod) {
    return {
      normas: CATALOGO.filter(function (n) { return n.e && n.e[cod]; }).sort(function (a, b) { return b.e[cod] - a.e[cod]; }),
      reglas: REGLAS.filter(function (r) { return r.ent.indexOf(cod) >= 0; })
    };
  }
  // Lista para la sección "Normas de referencia" de un documento: solo normas vigentes con aporte medio o alto
  function citasDocumento(cod, opc) {
    opc = opc || {};
    return paraEntregable(cod).normas.filter(function (n) { return (n.estado === 'vigente' || n.estado === 'modificada') && n.e[cod] >= (opc.min || 2) && (n.id !== 'NTSYCS' || opc.coordinado) && (n.id !== 'DS132' || opc.minero !== false); })
      .sort(function (a, b) { return (/^D\.S\./.test(b.sigla) ? 1 : 0) - (/^D\.S\./.test(a.sigla) ? 1 : 0); })
      .map(function (n) { return n.sigla + ': ' + n.t + (n.org === 'SEC' ? ' (SEC)' : ' (' + n.org + ')'); });
  }

  // ── Revisión del proyecto activo ──
  function revisar() {
    var PR = window.REProyectos, out = [];
    if (!PR) return out;
    var pr = PR.activo(), cfg = PR.leer('normativa', {}) || {}, L = PR.leer('lazos', null) || {};
    function h(ent, sev, regla, txt) { out.push({ ent: ent, sev: sev, regla: regla, txt: txt }); }
    var num = function (s) { var v = PR.numCL(s); return isFinite(v) ? v : NaN; };
    // Proyecto y condiciones de sitio
    var alt = num(pr.altura);
    if (alt > P.altitud.umbral) h('03', 'aviso', 'rp05-altitud', 'El proyecto está a ' + pr.altura + ' m.s.n.m.: indica en hojas de datos y especificaciones la corrección por altitud de aislación y la reducción de capacidad (RPTD N°05 8.2).');
    var area = String(pr.area || '').toLowerCase();
    var clasificada = area && !/no clasificad|segura|n\/a|ninguna|^-$/.test(area);
    if (clasificada) {
      h('00', 'aviso', 'r12-doc', 'Clasificación de área "' + pr.area + '": el proyecto debe incluir el plano de clasificación con fuentes de escape y la adecuación del modo de protección por zona (RIC N°12 8.4.1).');
      var tmin = num(pr.tMin), tmax = num(pr.tMax);
      if ((isFinite(tmin) && tmin < P.ex.tMin) || (isFinite(tmax) && tmax > P.ex.tMax)) h('03', 'error', 'r12-temp', 'Temperatura de sitio ' + (pr.tMin || '?') + ' / ' + (pr.tMax || '?') + ' °C fuera de −20…+40 °C: los equipos Ex deben venir marcados para ese rango (RIC N°12 9.2.1.3).');
    }
    if (cfg.minero !== false) h('00', 'info', 'ds132-planos', 'Faena minera: mantener planos y registros eléctricos actualizados y un unilineal disponible en cada recinto con equipos energizados (D.S. N°132 Art. 396–398).');
    if (!pr.ubicacion) h('00', 'info', 'r18-ubicacion', 'Agrega la ubicación del proyecto; RIC N°18 6.3.5 pide coordenadas UTM o WGS84 en la primera lámina.');
    var tc = String(pr.tensionControl || '');
    var vc = parseFloat(tc.replace(',', '.'));
    if (/vdc|vcc|cc\b/i.test(tc) && isFinite(vc) && P.vccControl.normalizadas.indexOf(vc) < 0) h('04', 'aviso', 'rp10-cc', 'Tensión de control ' + tc + ': las tensiones CC normalizadas son 24, 48, 110 y 125 V (RPTD N°10 5.11.5).');
    if (/vac|vca/i.test(tc) && vc > P.tensionSeguridad.secoCA) h('06', 'info', 'r05-tseg', 'Control en ' + tc + ': sobre la tensión de seguridad de 50 V CA, requiere protección contra contactos directos e indirectos (RIC N°05 5.8 y 7.2).');
    // Unilineales TDI
    (L.tdi || []).forEach(function (t) {
      if (window.LAZOS_UNI && window.LAZOS_UNI.calcular) { try { var ric = (window.LAZOS_UNI.calcular(t) || {}).ric || {}; (ric.chk || []).filter(function (c) { return !c.ok && c.sev === 'err'; }).forEach(function (c) { h('08', 'error', '', t.tag + ': ' + c.txt + ' (' + c.ref + ')'); }); } catch (e) {} }
      else h('08', 'info', 'r02-ip', t.tag + ': la verificación completa (RIC N°02, 03, 04, 05, 06 y 07) se muestra en Unilineales TDI.');
    });
    // Listado de circuitos y canalizaciones
    var circ = L.circ || [], cond = (L.cond && L.cond.ductos) || [];
    var sinDucto = circ.filter(function (x) { return !x.oculto && !x.ducto; }).length;
    if (circ.length && sinDucto) h('07', 'aviso', 'r18-unilineal', sinDucto + ' circuitos con registro propio sin ducto definido: dimensiónalos en Canalizaciones y usa «Escribir en el listado» (RIC N°18 6.3.1 pide dimensiones y tipo de canalización).');
    if (window.LAZOS_COND) cond.forEach(function (d) { var r = window.LAZOS_COND.calcular(d); r.avisos.forEach(function (a) { var id = /RIC N°04 5\.27/.test(a) ? 'r04-uncircuito' : /RIC N°04 7\.1\.7/.test(a) ? 'r04-separacion' : /RIC N°04 7\.16/.test(a) ? 'r04-tramo' : /RIC N°04 7\.9/.test(a) ? 'r04-subt' : ''; if (id) h('H3', 'aviso', id, d.tag + ': ' + a); }); if (r.n && !r.elegido) h('H3', 'error', 'r04-ocupacion', d.tag + ': ningún tamaño cumple la ocupación de RIC N°04 Tabla 4.21.'); });
    // Diagrama de bloques
    var blq = L.blq || {}, nodos = blq.nodos || [];
    if (cfg.coordinado && !nodos.length) h('09', 'aviso', 'nt-sitr', 'Instalación coordinada: genera el diagrama de bloques para verificar reloj GPS, respaldo de alimentación y redundancia del enlace al Coordinador (NTSyCS Título 4-2).');
    if (nodos.length) {
      var tiene = function (t) { return nodos.some(function (n) { return n.tipo === t; }); };
      if (cfg.coordinado && !tiene('gps')) h('09', 'error', 'nt-sitr', 'Instalación coordinada sin reloj GPS / NTP: NTSyCS exige estampa de tiempo con error ≤ ±100 µs respecto de GPS.');
      else if (!tiene('gps') && (tiene('srv') || tiene('hist'))) h('09', 'info', 'nt-sitr', 'Hay servidores SCADA o historiador sin reloj GPS / NTP: agrega uno para sincronizar eventos (obligatorio si la instalación es coordinada, NTSyCS Título 4-2).');
      if (cfg.coordinado) h('09', 'aviso', 'nt-sitr', 'Verifica que los equipos del enlace al Coordinador tengan respaldo de alimentación (UPS) y redundancia, con disponibilidad ≥ 99,5 % mensual (NTSyCS Título 4-2).');
    }
    // Paradas de emergencia de correas (RIC N°07 5.4.9)
    (cfg.correas || []).forEach(function (c) { var req = Math.ceil((+c.largo || 0) / P.motor.paradaCorreasCada) + 1, lados = +c.lados || 2; if (+c.tirantes < req * lados) h('02', 'error', 'r07-parada', (c.tag || 'Correa') + ': ' + (c.tirantes || 0) + ' tirantes para ' + c.largo + ' m; se requieren al menos ' + req * lados + ' (' + req + ' por lado, cada 20 m, RIC N°07 5.4.9).'); });
    return out;
  }

  window.RE_NORMAS = { ENTREGABLES: ENTREGABLES, P: P, CATALOGO: CATALOGO, REGLAS: REGLAS, NI: NI, paraEntregable: paraEntregable, citasDocumento: citasDocumento, exCompatible: exCompatible, revisar: revisar };
})();
