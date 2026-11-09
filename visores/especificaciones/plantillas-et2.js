/* Especificaciones técnicas tipo · ampliación: temperatura, analizadores, control y automatización,
 * comunicaciones industriales, montaje y pruebas · ReyEngi
 *
 * Mismo formato que plantillas-et.js. Las familias de sistemas (sistema: true) usan "componentes"
 * en lugar de instrumentos, un capítulo 8 de requerimientos técnicos y secciones propias (extra).
 * Normas de referencia: IEC, ISA, IEEE, TIA, ICEA/NEMA, UL y normativa chilena (SEC/RIC, NCh,
 * Ley 21.663 de ciberseguridad), en su última edición.
 */
(function () {
  'use strict';

  var ET = window.ET, F = ET.familias, C = ET.comun;
  function h(n, t) { return { h: n, t: t }; }
  function p(t) { return { p: t }; }
  function ul(a) { return { ul: a }; }

  // ── Instrumentación: temperatura ────────────────────────────────────────────────
  F.push({
    id: 'temperatura', area: 'Instrumentación de terreno', titulo: 'INSTRUMENTOS DE MEDICIÓN DE TEMPERATURA', objeto: 'los instrumentos de medición de temperatura',
    normas: ['IEC 60751: Termómetros industriales de resistencia de platino (Pt100)', 'IEC 60584-1/-3: Termocuplas, tablas de referencia y cables de extensión', 'ASME PTC 19.3 TW: Termopozos (cálculo de frecuencia de estela y resistencia)', 'IEC 61515: Termocuplas con aislación mineral'],
    general: C.TX_GENERAL, electrico: C.TX_ELECTRICO, senales: C.TX_SENALES, rango: C.TX_RANGO,
    instrumentos: [
      { id: 'te-rtd', t: 'Elemento de temperatura tipo RTD', das: ['tit'], b: [
        p('Los elementos serán RTD Pt100 de 4 hilos (3 hilos cuando la hoja de datos lo permita), clase A según IEC 60751, con aislación mineral y vaina de acero inoxidable AISI 316.'),
        p('Se usarán en rangos de -50 a 400 °C. Se suministrarán con cabezal de conexión, bloque de terminales y resorte de contacto con el fondo del termopozo.')
      ] },
      { id: 'te-tc', t: 'Elemento de temperatura tipo termocupla', das: ['tit'], b: [
        p('Las termocuplas serán tipo K o N según IEC 60584-1, de aislación mineral, con junta aislada de tierra y vaina de Inconel 600 o AISI 316 según la temperatura.'),
        p('Se usarán sobre 400 °C o donde la hoja de datos lo indique. Los cables de extensión serán del tipo y código de colores de IEC 60584-3.')
      ] },
      { id: 'tt', t: 'Transmisor de temperatura', das: ['tit'], b: [
        p('Los transmisores serán inteligentes, de entrada universal (RTD y termocupla), con salida {senal}, aislación galvánica entrada/salida y diagnóstico de rotura o cortocircuito del sensor.'),
        p('Se montarán en el cabezal del sensor o en campo sobre tubo de 2", con indicador local LCD, según la hoja de datos. La exactitud digital será de ± 0,1 °C o mejor para RTD.'),
        p('Cuando se indique se suministrarán con doble entrada y función de respaldo (backup) o promedio.')
      ] },
      { id: 'tw', t: 'Termopozo', das: ['tit'], b: [
        p('Los termopozos serán de barra perforada (bar stock), de acero inoxidable AISI 316 salvo otra indicación, con conexión a proceso bridada ASME B16.5 o roscada, según la hoja de datos.'),
        p('El proveedor entregará el cálculo de frecuencia de estela y de resistencia según ASME PTC 19.3 TW para las condiciones de proceso indicadas.'),
        p('En servicio de pulpa abrasiva se usarán recubrimientos duros (estelita o carburo de tungsteno) o materiales resistentes a la abrasión.')
      ] },
      { id: 'tsw', t: 'Interruptor de temperatura', das: ['tsh'], b: [
        p('Los interruptores serán electrónicos o de bulbo y capilar, con punto de ajuste regulable, banda muerta ajustable y contactos {contactos}.')
      ] }
    ]
  });

  // ── Instrumentación: más analizadores en la familia existente ────────────────────
  var analisis = F.filter(function (f) { return f.id === 'analisis'; })[0];
  if (analisis) {
    analisis.normas = analisis.normas.concat(['IEC 60079-29-1/-2: Detectores de gases, desempeño, selección e instalación', 'ISO 7027: Calidad del agua – determinación de turbidez']);
    analisis.instrumentos.push(
      { id: 'ait-cond', t: 'Analizador de conductividad', das: ['ait-cond'], b: [
        p('El sensor será inductivo (toroidal) en servicios con sólidos o incrustaciones, y de contacto (dos o cuatro electrodos) en agua limpia, con compensación de temperatura integrada.'),
        p('El transmisor tendrá salida {senal}, compensación de temperatura configurable, indicación local y relés de alarma.')
      ] },
      { id: 'ait-turb', t: 'Analizador de turbidez y sólidos suspendidos', das: ['ait-turb'], b: [
        p('El sensor será óptico de luz dispersa a 90° según ISO 7027, con limpieza automática por escobilla o aire, para medición en línea o por inmersión.'),
        p('El transmisor tendrá salida {senal} y rangos configurables en NTU, FNU o mg/L.')
      ] },
      { id: 'ait-gas', t: 'Detector fijo de gases', das: ['ait-gas'], b: [
        p('Los detectores serán para los gases indicados en la hoja de datos (H2S, CO, SO2, O2 u otros), con sensor electroquímico, catalítico o infrarrojo según el gas, desempeño según IEC 60079-29-1.'),
        p('La selección y ubicación de detectores seguirá IEC 60079-29-2. En áreas clasificadas los detectores tendrán certificación para la zona y grupo de gas correspondiente (IEC 60079 / NEC 500).'),
        p('Tendrán salida {senal}, indicación local, dos niveles de alarma y una de falla, alarma audiovisual local cuando se indique, y kit de calibración con gas patrón.')
      ] }
    );
  }

  // ── Bloques comunes de sistemas ───────────────────────────────────────────────────
  var SIS_GENERAL = [
    p('Todos los equipos serán de fabricación estándar, de línea de producto vigente y con soporte del fabricante asegurado por al menos {obsolescencia} años desde la puesta en marcha.'),
    p('Los equipos serán aptos para operación continua en las condiciones de sitio, en salas eléctricas o de control con aire acondicionado, salvo que se indique montaje en terreno.'),
    p('Los equipos electrónicos cumplirán los requisitos de compatibilidad electromagnética para ambientes industriales (IEC 61000-6-2 inmunidad y IEC 61000-6-4 emisión).'),
    p('Cada equipo tendrá una {placa} con su TAG.')
  ];

  // ── Control y automatización ──────────────────────────────────────────────────────
  F.push({
    id: 'control', area: 'Control y automatización', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'SISTEMA DE CONTROL (PLC / DCS)', objeto: 'el sistema de control basado en PLC o DCS',
    normas: ['IEC 61131-2: Controladores programables – requisitos de equipos y ensayos', 'IEC 61131-3: Lenguajes de programación', 'IEC 61512 / ISA-88: Control por lotes', 'IEC 62264 / ISA-95: Integración empresa–control', 'IEC 62541: OPC Unified Architecture', 'IEC 62443: Seguridad de sistemas de automatización y control industrial'],
    alimTexto: 'Los gabinetes del sistema de control se alimentarán en {alim4h} desde un sistema UPS; la alimentación de E/S y de instrumentos de 2 hilos será {alim2h} con fuentes redundantes.',
    general: SIS_GENERAL.concat([p('El sistema será de arquitectura abierta, con comunicaciones basadas en estándares industriales, y permitirá ampliaciones futuras sin detener el proceso.')]),
    instrumentos: [
      { id: 'cpu', t: 'Controladores', das: ['plc'], b: [
        p('Los controladores serán redundantes en caliente (hot standby) para los procesos críticos indicados en la arquitectura, con conmutación automática sin perturbar las salidas.'),
        p('La carga de CPU no superará el 60 % y la memoria utilizada no superará el 60 % al término de la puesta en marcha.'),
        p('Soportarán programación en los lenguajes de IEC 61131-3, modificación en línea, sincronización horaria (NTP o PTP) y diagnóstico de todos los módulos.')
      ] },
      { id: 'io', t: 'Entradas y salidas', das: ['plc'], b: [
        p('Las E/S serán remotas o locales según la arquitectura, con módulos de canales aislados para señales analógicas y señalización de estado por canal.'),
        p('Las entradas analógicas serán {senal} con paso HART hacia la estación de ingeniería o gestión de activos. Las entradas y salidas discretas serán de 24 VDC, salvo indicación distinta.'),
        p('Se dejará una reserva instalada y cableada del 20 % por tipo de señal, más un 20 % de espacio libre en racks y gabinetes.')
      ] },
      { id: 'ing', t: 'Software y estación de ingeniería', das: [], b: [
        p('Se suministrarán las licencias de programación, configuración y diagnóstico a nombre del Cliente, sin fecha de expiración, con la última versión estable a la fecha de entrega.'),
        p('La programación seguirá una biblioteca de bloques estándar del Proyecto (motores, válvulas, instrumentos analógicos, PID) y la estructura de modelo físico de ISA-88 / ISA-95.'),
        p('Se entregará el programa comentado en español, con lista de tags y descripción de interlocks y secuencias.')
      ] },
      { id: 'pwr', t: 'Alimentación y respaldo', das: [], b: [
        p('Las fuentes de 24 VDC serán redundantes, con módulo de diodos o redundancia activa y contacto de falla supervisado por el sistema.'),
        p('El sistema se respaldará con UPS con autonomía mínima de 30 minutos a plena carga, salvo indicación distinta en los criterios del Proyecto.')
      ] }
    ],
    electrico: [p('Los gabinetes del sistema de control cumplirán la ET de tableros y gabinetes del Proyecto.'), { gen: 'electrico' }],
    extra: [
      { t: 'Arquitectura y comunicaciones', b: [
        p('La arquitectura se indica en el diagrama de arquitectura de control del Proyecto. Las redes de control serán redundantes en anillo con recuperación rápida (MRP según IEC 62439-2 o protocolo equivalente).'),
        p('La red de campo será {bus|la definida en la arquitectura del Proyecto (PROFIBUS, PROFINET, EtherNet/IP u otra)}. La integración con sistemas de terceros será por OPC UA o Modbus TCP.')
      ] },
      { t: 'Ciberseguridad', b: [p('El sistema cumplirá la ET de ciberseguridad OT del Proyecto, basada en IEC 62443, con nivel de seguridad objetivo definido en el análisis de riesgos.')] }
    ],
    refsEt: ['scada', 'tableros', 'redes', 'ciber', 'pruebas'],
    pruebas: [p('Se ejecutarán pruebas FAT con simulación de las E/S y de la lógica de control, y pruebas SAT e integración en sitio según la ET de pruebas y puesta en marcha (IEC 62381).')]
  });

  F.push({
    id: 'scada', area: 'Control y automatización', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'SISTEMA SCADA, HMI Y GESTIÓN DE ALARMAS', objeto: 'el sistema SCADA, las interfaces de operación (HMI) y la gestión de alarmas',
    normas: ['ANSI/ISA-101.01: Interfaces humano-máquina para sistemas de automatización de procesos', 'ANSI/ISA-18.2 / IEC 62682: Gestión de sistemas de alarmas', 'EEMUA 191: Alarm systems – a guide to design, management and procurement', 'IEC 62541: OPC Unified Architecture', 'ISO 11064: Diseño ergonómico de salas de control'],
    alimTexto: 'Los servidores y estaciones de operación se alimentarán en {alim4h} desde UPS.',
    general: SIS_GENERAL,
    instrumentos: [
      { id: 'srv', t: 'Servidores', das: [], b: [
        p('Los servidores SCADA serán redundantes, en configuración principal/respaldo con conmutación automática, en hardware de servidor o virtualizado con alta disponibilidad.'),
        p('Incluirán historiador de procesos con almacenamiento en línea de al menos 2 años de datos a la resolución configurada.')
      ] },
      { id: 'hmi', t: 'Estaciones de operación y pantallas', das: [], b: [
        p('Las pantallas de operación se diseñarán según ISA-101: jerarquía de niveles (vista general, área, equipo y diagnóstico), colores en escala de grises con color reservado para condiciones anormales y alarmas, e indicadores de desempeño.'),
        p('Se elaborará una guía de estilo HMI del Proyecto antes del desarrollo de pantallas, aprobada por el Cliente.')
      ] },
      { id: 'alm', t: 'Gestión de alarmas', das: [], b: [
        p('El sistema de alarmas seguirá el ciclo de vida de ISA-18.2 / IEC 62682: filosofía de alarmas, identificación, racionalización, diseño, implementación, operación, mantenimiento y monitoreo.'),
        p('Cada alarma tendrá prioridad, causa, consecuencia, acción del operador y tiempo de respuesta documentados en la base de datos de alarmas racionalizada.'),
        p('El objetivo de desempeño en operación normal será de no más de 1 alarma cada 10 minutos por operador (alrededor de 6 por hora), con menos de 1 % del tiempo en condición de inundación de alarmas.')
      ] },
      { id: 'hist', t: 'Historiador e integración', das: [], b: [
        p('La información se publicará hacia los sistemas de gestión del Cliente mediante OPC UA o protocolos acordados, a través de una zona desmilitarizada (DMZ) según la ET de ciberseguridad.')
      ] }
    ],
    extra: [{ t: 'Sincronización y registro', b: [p('Todos los equipos se sincronizarán con una fuente horaria común (NTP o PTP). Los eventos y acciones de operador quedarán registrados con estampa de tiempo y usuario.')] }],
    refsEt: ['control', 'redes', 'ciber', 'pruebas']
  });

  F.push({
    id: 'tableros', area: 'Control y automatización', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'TABLEROS Y GABINETES DE CONTROL', objeto: 'los tableros y gabinetes de control, de E/S remotas y de distribución de instrumentación',
    normas: ['IEC 61439-1/-2: Conjuntos de aparamenta de baja tensión', 'UL 508A: Tableros de control industrial', 'IEC 60204-1: Equipo eléctrico de máquinas (cuando aplique)', 'IEC 60529 / NEMA 250: Grados de protección de envolventes', 'IEC 60445: Identificación de conductores por colores', 'SEC – Pliego Técnico Normativo RIC N° 02: Tableros eléctricos'],
    alimTexto: 'Los gabinetes se alimentarán en {alim4h}; la distribución interna de control será en 24 VDC.',
    general: SIS_GENERAL.concat([p('Los gabinetes se fabricarán y verificarán según IEC 61439 (o UL 508A cuando el Cliente lo requiera), incluyendo verificación de diseño de elevación de temperatura y resistencia a cortocircuito.')]),
    instrumentos: [
      { id: 'env', t: 'Envolvente', das: ['gab'], b: [
        p('Los gabinetes serán de acero al carbono pintado o acero inoxidable AISI 304/316 según la ubicación, con grado de protección {proteccion} en terreno e IP54 como mínimo en salas.'),
        p('Tendrán placa de montaje, puerta con chapa, bolsillo porta planos, iluminación interior con interruptor de puerta, tomacorriente de servicio y barra de tierra de protección y de tierra de instrumentación aisladas.'),
        p('El cálculo térmico considerará la máxima temperatura ambiente del sitio y la radiación solar en terreno, con protección solar o climatización cuando se requiera.')
      ] },
      { id: 'dist', t: 'Distribución y protecciones', das: ['gab'], b: [
        p('Cada circuito de alimentación de instrumentos y de E/S tendrá protección individual (interruptor o borne fusible con indicación de fusión).'),
        p('Las fuentes de 24 VDC serán redundantes con supervisión de falla. Se instalarán supresores de transientes en las entradas de alimentación y en las señales que vienen de terreno.')
      ] },
      { id: 'alamb', t: 'Alambrado y borneras', das: ['gab'], b: [
        p('El alambrado interno será de cobre flexible, libre de halógenos, con colores según IEC 60445 o el estándar del Proyecto, y marcado en ambos extremos.'),
        p('Las señales intrínsecamente seguras, analógicas, discretas y de potencia irán en canaletas separadas. El llenado de canaletas no superará el 40 %.'),
        p('Las borneras serán de tornillo o resorte, de dos niveles cuando se requiera, con un 20 % de bornes de reserva.')
      ] }
    ],
    electrico: [{ gen: 'electrico' }],
    extra: [{ t: 'Placas y rotulación', b: [p('Cada gabinete tendrá placa de identificación con TAG, tensión, corriente nominal, corriente de cortocircuito admisible y fabricante, y rótulos de advertencia según RIC.')] }],
    refsEt: ['cables', 'montaje', 'pruebas'],
    pruebas: [p('Pruebas de rutina según IEC 61439: inspección visual, continuidad, resistencia de aislación, prueba dieléctrica, funcionalidad de cada circuito y verificación de rotulación, con protocolo firmado.')]
  });

  F.push({
    id: 'sis', area: 'Control y automatización', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'SISTEMA INSTRUMENTADO DE SEGURIDAD (SIS)', objeto: 'el sistema instrumentado de seguridad y sus funciones instrumentadas de seguridad (SIF)',
    normas: ['IEC 61511 / ISA-84.00.01: Seguridad funcional – sistemas instrumentados de seguridad para el sector de procesos', 'IEC 61508: Seguridad funcional de sistemas E/E/PE'],
    alimTexto: 'El SIS se alimentará en {alim4h} desde UPS, con fuentes de 24 VDC redundantes e independientes del sistema de control básico.',
    general: SIS_GENERAL.concat([
      p('El SIS será independiente del sistema de control básico de procesos (BPCS) en sensores, solucionador lógico y elementos finales, salvo que el análisis de riesgos justifique lo contrario.'),
      p('Cada función instrumentada de seguridad tendrá el nivel de integridad (SIL) definido en el análisis de riesgos y en la especificación de requisitos de seguridad (SRS) del Proyecto.')
    ]),
    instrumentos: [
      { id: 'ls', t: 'Solucionador lógico', das: [], b: [
        p('El solucionador lógico estará certificado por un organismo independiente para el SIL requerido según IEC 61508, con arquitectura redundante y diagnóstico de fallas.'),
        p('El software de aplicación se desarrollará con lenguajes de variabilidad limitada y control de versiones, con acceso protegido por contraseña.')
      ] },
      { id: 'sens', t: 'Sensores y elementos finales', das: [], b: [
        p('Los sensores y elementos finales tendrán datos de confiabilidad (tasa de falla, cobertura de diagnóstico) certificados o justificados por uso previo, según IEC 61511.'),
        p('Las válvulas de corte tendrán posición de falla segura, prueba de carrera parcial cuando se requiera y tiempos de cierre compatibles con el tiempo de seguridad del proceso.')
      ] }
    ],
    extra: [{ t: 'Verificación del SIL y pruebas periódicas', b: [
      p('El proveedor entregará el cálculo de la probabilidad de falla en demanda (PFDavg) de cada SIF y el intervalo de prueba periódica (proof test) recomendado, con su procedimiento.'),
      p('La validación del SIS se realizará antes de la puesta en marcha, según IEC 61511.')
    ] }],
    refsEt: ['control', 'pruebas']
  });

  // ── Comunicaciones industriales ─────────────────────────────────────────────────────
  F.push({
    id: 'redes', area: 'Comunicaciones industriales', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'REDES DE COMUNICACIÓN INDUSTRIAL', objeto: 'las redes de comunicación industrial y sus equipos activos',
    normas: ['IEC 61158 / IEC 61784-1/-2: Redes de campo industriales y perfiles de comunicación', 'IEC 61784-5 / IEC 61918: Instalación de redes de comunicación en automatización industrial', 'IEC 62439-2: Redes de alta disponibilidad – MRP', 'IEEE 802.3 / IEEE 802.1Q / IEEE 802.1w', 'PROFIBUS Installation Guideline (PI 8.022) y PROFINET Installation Guideline (PI 8.072)', 'IEC 61000-6-2: Inmunidad electromagnética en ambientes industriales'],
    alimTexto: 'Los equipos activos se alimentarán en 24 VDC redundante desde los gabinetes del sistema de control, o en {alim4h} desde UPS.',
    general: SIS_GENERAL.concat([p('Las redes se diseñarán, instalarán y certificarán según los perfiles de instalación de IEC 61784-5 para cada protocolo y las guías de PROFIBUS & PROFINET International o de la organización del protocolo correspondiente.')]),
    instrumentos: [
      { id: 'sw', t: 'Switches industriales', das: ['sw-eth'], b: [
        p('Los switches serán administrables, de grado industrial, montaje en riel DIN o rack, con alimentación redundante, contacto de falla y rango de temperatura extendido.'),
        p('Soportarán VLAN (IEEE 802.1Q), QoS, IGMP snooping, SNMP v3, redundancia en anillo con recuperación menor a 200 ms (MRP o equivalente) y RSTP, y puertos de fibra óptica SFP.'),
        p('Para PROFINET tendrán certificación de conformidad de la clase requerida.')
      ] },
      { id: 'pbdp', t: 'Red PROFIBUS DP / PA', das: [], b: [
        p('Los segmentos PROFIBUS DP usarán cable tipo A con terminadores activos en ambos extremos y repetidores o enlaces ópticos para distancias o segmentaciones mayores.'),
        p('Los segmentos PROFIBUS PA se alimentarán desde acopladores DP/PA o enlaces redundantes, con cajas de distribución con protección de cortocircuito por derivación. El balance de corriente y la longitud de cada segmento se verificarán en la memoria de cálculo.')
      ] },
      { id: 'pn', t: 'Red PROFINET / EtherNet/IP / Modbus TCP', das: [], b: [
        p('El cableado será de cobre Cat 6A apantallado (S/FTP) o de fibra óptica, con conectores industriales IP67 en terreno.'),
        p('El tiempo de ciclo, la carga de red y la topología se verificarán en la ingeniería de red y en la certificación final.')
      ] },
      { id: 'hart', t: 'Gestión de activos HART', das: [], b: [p('La información HART de los instrumentos se llevará a la estación de gestión de activos a través de las E/S o multiplexores, para diagnóstico y configuración remota.')] }
    ],
    extra: [{ t: 'Certificación de redes', b: [p('Cada segmento de red se certificará con equipo de prueba específico del protocolo (análisis físico y de telegramas), entregando el informe con la topología conforme a construcción.')] }],
    refsEt: ['fibra', 'cables', 'ciber', 'pruebas']
  });

  F.push({
    id: 'fibra', area: 'Comunicaciones industriales', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'FIBRA ÓPTICA Y CABLEADO ESTRUCTURADO', objeto: 'los sistemas de fibra óptica y de cableado estructurado',
    normas: ['ANSI/TIA-568.3-D: Componentes de cableado de fibra óptica', 'ANSI/TIA-568.2-D: Cableado de par trenzado balanceado', 'ANSI/TIA-758: Planta externa de propiedad del cliente', 'ISO/IEC 11801-1: Cableado genérico', 'IEC 60793-2-50 / ITU-T G.652.D: Fibra monomodo', 'IEC 60794: Cables de fibra óptica', 'ANSI/TIA-606: Administración e identificación'],
    general: SIS_GENERAL,
    instrumentos: [
      { id: 'cfo', t: 'Cable de fibra óptica', das: ['cab-fo'], b: [
        p('Los cables troncales serán de fibra monomodo G.652.D (OS2), con el número de fibras indicado más un 50 % de reserva, armados o dieléctricos según la canalización, con protección contra roedores y humedad.'),
        p('En interiores se usarán cables libres de halógenos (LSZH) y en canalización subterránea o aérea cables para planta externa.')
      ] },
      { id: 'odf', t: 'Distribuidores y empalmes', das: [], b: [
        p('Los distribuidores ópticos (ODF) y cajas murales tendrán bandejas de empalme, adaptadores LC o SC y espacio para la reserva de fibra.'),
        p('Todos los empalmes serán por fusión, con pérdida máxima de 0,1 dB por empalme. Se dejará reserva de cable en cada extremo.')
      ] },
      { id: 'cu', t: 'Cableado de cobre', das: [], b: [p('El cableado horizontal será Cat 6A apantallado, certificado según TIA-568.2-D con equipo de clase correspondiente.')] }
    ],
    extra: [{ t: 'Pruebas de certificación', b: [
      p('Cada enlace de fibra se certificará con medidor de potencia y fuente (pérdida de inserción, nivel 1) y con OTDR en ambos sentidos (nivel 2), comparando con el presupuesto de pérdidas calculado.'),
      p('Los informes se entregarán en formato electrónico del equipo de prueba y en PDF.')
    ] }],
    refsEt: ['redes', 'montaje']
  });

  F.push({
    id: 'radio', area: 'Comunicaciones industriales', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'RADIOCOMUNICACIONES INDUSTRIALES', objeto: 'los sistemas de radiocomunicación industrial (enlaces de datos, redes inalámbricas y radio de voz)',
    normas: ['IEEE 802.11: Redes inalámbricas de área local', 'ETSI EN 300 328 / EN 301 893: Equipos de radio en 2,4 y 5 GHz', 'ETSI TS 102 361: Radio móvil digital (DMR)', 'IEC 62591 (WirelessHART) / IEC 62734 (ISA100.11a)', 'Normativa técnica de la Subsecretaría de Telecomunicaciones (SUBTEL)'],
    general: SIS_GENERAL.concat([p('Todos los equipos de radio tendrán homologación y operarán en bandas autorizadas en Chile. Las frecuencias que requieran concesión o permiso serán tramitadas ante SUBTEL según lo indique el Cliente.')]),
    instrumentos: [
      { id: 'ptp', t: 'Enlaces punto a punto y punto multipunto', das: ['radio-ptp'], b: [
        p('Los radios serán de grado industrial, para exterior, con alimentación PoE, cifrado AES y administración remota.'),
        p('El proveedor entregará el estudio de radioenlace (perfil de terreno, zona de Fresnel, margen de desvanecimiento y disponibilidad) para cada enlace.')
      ] },
      { id: 'wlan', t: 'Red inalámbrica industrial', das: [], b: [p('Los puntos de acceso serán de grado industrial, con roaming rápido y seguridad WPA3-Enterprise. Se realizará un estudio de cobertura (site survey) antes y después de la instalación.')] },
      { id: 'whart', t: 'Instrumentación inalámbrica', das: [], b: [p('Cuando se especifique instrumentación inalámbrica, se usará WirelessHART (IEC 62591) o ISA100.11a (IEC 62734), con gateway redundante integrado al sistema de control.')] }
    ],
    extra: [{ t: 'Mástiles, antenas y protección', b: [p('Los mástiles y soportes se diseñarán para el viento del sitio y la condición sísmica. Las antenas y cables tendrán protección contra descargas atmosféricas y puesta a tierra según el Proyecto.')] }],
    refsEt: ['redes', 'ciber']
  });

  F.push({
    id: 'ciber', servicio: true, area: 'Comunicaciones industriales', sistema: true, etiqueta: 'Requisitos incluidos',
    titulo: 'CIBERSEGURIDAD DE SISTEMAS DE CONTROL (OT)', objeto: 'los requisitos de ciberseguridad de los sistemas de automatización y control industrial',
    normas: ['IEC 62443-2-1: Programa de seguridad para propietarios de activos', 'IEC 62443-3-2: Evaluación de riesgos, zonas y conductos', 'IEC 62443-3-3: Requisitos de seguridad del sistema y niveles de seguridad (SL)', 'IEC 62443-4-1 / 4-2: Ciclo de vida de desarrollo seguro y requisitos de componentes', 'NIST SP 800-82 Rev. 3: Guía de seguridad de tecnologías operacionales', 'Ley N° 21.663 Marco de Ciberseguridad (Chile) y normativa de la ANCI'],
    general: [
      p('El sistema de automatización y control se diseñará e implementará según la serie IEC 62443, con el nivel de seguridad objetivo (SL-T) de cada zona definido en la evaluación de riesgos del Proyecto.'),
      p('El proveedor demostrará que sus productos y su proceso de integración cumplen IEC 62443-4-1 y 4-2 o un esquema de certificación equivalente.')
    ],
    instrumentos: [
      { id: 'zonas', t: 'Zonas y conductos', das: [], b: [
        p('La red se segmentará en zonas (control, supervisión, seguridad funcional, DMZ industrial y red corporativa) unidas por conductos con firewalls industriales y reglas de mínimo privilegio.'),
        p('No existirán conexiones directas entre la red corporativa o Internet y la red de control: todo intercambio pasará por la DMZ industrial.')
      ] },
      { id: 'harden', t: 'Robustecimiento de equipos', das: [], b: [
        p('Se deshabilitarán servicios, puertos y cuentas no utilizados; se cambiarán las contraseñas por defecto y se aplicarán listas blancas de aplicaciones y protección antimalware compatible con el sistema de control.'),
        p('Los medios removibles se controlarán con estaciones de descontaminación.')
      ] },
      { id: 'acceso', t: 'Accesos y acceso remoto', das: [], b: [
        p('Los usuarios tendrán cuentas individuales con roles y autenticación centralizada. El acceso remoto de proveedores será solo por un servidor de salto en la DMZ, con autenticación de doble factor, sesiones grabadas y habilitación temporal autorizada por el Cliente.')
      ] },
      { id: 'monit', t: 'Monitoreo, parches y respaldos', das: [], b: [
        p('Se registrarán y centralizarán los eventos de seguridad. Se definirá un procedimiento de gestión de parches validados por el fabricante y de respaldos periódicos verificados de programas y configuraciones.'),
        p('El proveedor informará las vulnerabilidades conocidas de sus productos durante la vida útil del sistema.')
      ] }
    ],
    extra: [{ t: 'Gestión de incidentes', b: [p('Se establecerá un procedimiento de respuesta a incidentes coordinado con el Cliente, que permita cumplir los plazos de reporte de la normativa vigente cuando corresponda (Ley 21.663 y normas de la Agencia Nacional de Ciberseguridad).')] }],
    refsEt: ['control', 'scada', 'redes', 'pruebas'],
    pruebas: [p('Se realizará una prueba de aceptación de ciberseguridad (verificación de configuración, segmentación y robustecimiento) como parte de las pruebas FAT y SAT.')]
  });

  // ── Montaje y pruebas ──────────────────────────────────────────────────────────────
  F.push({
    id: 'cables', area: 'Montaje y pruebas', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'CABLES DE INSTRUMENTACIÓN Y CONTROL', objeto: 'los cables de instrumentación, de control y de comunicaciones',
    normas: ['ICEA S-73-532 / NEMA WC 57: Cables de control, termocupla e instrumentación', 'UL 2250: Instrumentation Tray Cable (ITC)', 'UL 1277: Power and Control Tray Cable (TC)', 'IEC 60228: Conductores de cables aislados', 'IEC 60332-3: Propagación de llama en cables agrupados', 'IEC 60754-1/-2 e IEC 61034: Libres de halógenos y baja emisión de humos', 'SEC – Pliego Técnico Normativo RIC N° 04: Conductores, materiales y sistemas de canalización'],
    general: [
      p('Los cables serán aptos para la canalización indicada (escalerilla, conduit o enterrado), resistentes a la radiación UV, a aceites y a la propagación de llama según IEC 60332-3 categoría A, y libres de halógenos en salas e interiores.'),
      p('Cada carrete se identificará con tipo, formación, largo, número de lote y fecha de fabricación.')
    ],
    instrumentos: [
      { id: 'par', t: 'Cable de instrumentación (pares y tríadas)', das: ['cab-inst'], b: [
        p('Los cables de señales analógicas serán de pares o tríadas trenzados de cobre estañado, mínimo 16 AWG (1,5 mm²) para cables individuales y 18 AWG (1,0 mm²) para multipares, con pantalla individual y general de aluminio-poliéster con drenaje.'),
        p('La aislación será para 300 V (600 V cuando comparta canalización con circuitos de control) y la cubierta exterior de PVC retardante o LSZH, con armadura cuando se instale enterrado o expuesto a daño mecánico.')
      ] },
      { id: 'ctrl', t: 'Cable de control', das: ['cab-inst'], b: [p('Los cables de control serán multiconductores de cobre de 14 AWG (2,5 mm²) mínimo, 600 V, con conductores numerados, tipo TC según UL 1277 o equivalente IEC.')] },
      { id: 'tcx', t: 'Cable de extensión de termocupla', das: ['cab-inst'], b: [p('Los cables de extensión serán del tipo y código de colores de la termocupla según IEC 60584-3, con pantalla individual.')] },
      { id: 'bus', t: 'Cables de bus de campo y Ethernet', das: [], b: [p('Los cables PROFIBUS DP, PROFIBUS PA, PROFINET o Ethernet industrial serán los especificados por la organización del protocolo, de color estándar y aptos para uso industrial.')] },
      { id: 'jb', t: 'Cajas de conexión de terreno', das: ['jb'], b: [p('Las cajas de conexión serán de acero inoxidable o poliéster reforzado con fibra de vidrio, grado {proteccion}, con borneras con 20 % de reserva, barras de tierra de pantallas aisladas y prensaestopas certificados.')] }
    ],
    extra: [{ t: 'Separación y puesta a tierra de pantallas', b: [
      p('Los cables de instrumentación se separarán de los cables de fuerza según las distancias de IEC 61000-5-2 o del criterio del Proyecto, o mediante separadores metálicos en la escalerilla.'),
      p('Las pantallas se conectarán a tierra en un solo extremo (lado del sistema de control) y se aislarán en el extremo de terreno.')
    ] }],
    refsEt: ['montaje', 'tableros', 'pruebas'],
    pruebas: [p('Se realizarán pruebas de rutina de continuidad, resistencia de aislación y prueba dieléctrica en fábrica, y en terreno pruebas de continuidad y aislación después del tendido.')]
  });

  F.push({
    id: 'montaje', servicio: true, area: 'Montaje y pruebas', sistema: true, etiqueta: 'Actividades incluidas',
    titulo: 'MONTAJE DE INSTRUMENTACIÓN', objeto: 'el montaje de instrumentos, cañerías de instrumentos (tubing), canalizaciones y conexionado',
    normas: ['ASME B31.3: Cañerías de proceso (tubing de instrumentos)', 'ASTM A269: Tubos de acero inoxidable sin costura', 'IEEE 1100: Alimentación y puesta a tierra de equipos electrónicos', 'IEEE 142: Puesta a tierra de sistemas industriales', 'SEC – Pliegos Técnicos Normativos RIC N° 04 (canalizaciones) y N° 06 (puesta a tierra y enlace equipotencial)'],
    general: [
      p('El montaje se realizará según los planos de detalles típicos de montaje del Proyecto, las instrucciones de los fabricantes y esta especificación. Cualquier cambio requerirá aprobación del Cliente.'),
      p('Los instrumentos se instalarán accesibles para operación y mantenimiento desde el piso o desde plataformas, protegidos de vibración, calor radiante y daño mecánico.')
    ],
    instrumentos: [
      { id: 'sop', t: 'Soportes', das: [], b: [p('Los instrumentos se montarán en pedestales de tubo de 2", soportes a estructura o soportes con techo según los detalles típicos, de acero galvanizado en caliente o inoxidable. No se soportarán instrumentos de las cañerías de proceso salvo indicación expresa.')] },
      { id: 'tub', t: 'Tubing de instrumentos', das: [], b: [
        p('El tubing será de acero inoxidable AISI 316 sin costura según ASTM A269, de 1/2" o 3/8" de diámetro exterior, con fittings de doble férula del mismo fabricante.'),
        p('Las líneas de impulso tendrán pendiente mínima de 1:12 hacia el proceso (líquidos) o hacia el instrumento (gases), y se probarán hidrostáticamente a 1,5 veces la presión de diseño.')
      ] },
      { id: 'can', t: 'Canalizaciones', das: [], b: [p('Las canalizaciones serán de conduit galvanizado o escalerilla según los planos, conforme a RIC N° 04. La llegada a cada instrumento será con conduit flexible liquid-tight con conectores, con dren en el punto bajo.')] },
      { id: 'tierra', t: 'Puesta a tierra', das: [], b: [p('Se implementarán una tierra de protección y una tierra de instrumentación aisladas entre sí hasta su punto único de unión, según IEEE 1100 y RIC N° 06. Las carcasas de instrumentos se conectarán a la tierra de protección.')] }
    ],
    extra: [{ t: 'Identificación', b: [p('Cada instrumento, caja de conexión, cable y conductor se identificará con placas o marcas indelebles según los listados del Proyecto.')] }],
    refsEt: ['cables', 'pruebas']
  });

  F.push({
    id: 'pruebas', servicio: true, area: 'Montaje y pruebas', sistema: true, etiqueta: 'Etapas incluidas',
    titulo: 'PRUEBAS, PRECOMISIONAMIENTO Y PUESTA EN MARCHA', objeto: 'las pruebas de aceptación, el precomisionamiento y la puesta en marcha de los sistemas de instrumentación y control',
    normas: ['IEC 62381: Pruebas de aceptación en fábrica (FAT), en sitio (SAT) y de integración (SIT)', 'IEC 62382: Verificación de lazos eléctricos y de instrumentación (loop check)', 'IEC 61511: Validación de sistemas instrumentados de seguridad', 'SEC – Pliego Técnico Normativo RIC N° 19: Puesta en servicio'],
    general: [
      p('Las pruebas se ejecutarán con procedimientos y protocolos aprobados previamente por el Cliente, con instrumentos patrón calibrados con certificados trazables vigentes.'),
      p('Cada prueba terminará con un protocolo firmado y la lista de observaciones (punch list) con su clasificación y cierre.')
    ],
    instrumentos: [
      { id: 'fat', t: 'Pruebas de aceptación en fábrica (FAT)', das: [], b: [p('Verificación de hardware, inspección de gabinetes, pruebas de E/S con simulación, lógica de control, pantallas, alarmas, comunicaciones y redundancias, según IEC 62381.')] },
      { id: 'pre', t: 'Precomisionamiento y verificación de lazos', das: [], b: [
        p('Inspección de montaje, continuidad y aislación de cables, calibración o verificación de instrumentos, y verificación de lazos desde el instrumento hasta la pantalla del operador según IEC 62382.'),
        p('Cada lazo se probará al 0, 25, 50, 75 y 100 % del rango (o en sus estados para señales discretas), registrando el resultado en el protocolo de lazo.')
      ] },
      { id: 'sat', t: 'Pruebas de aceptación en sitio e integración (SAT / SIT)', das: [], b: [p('Pruebas funcionales del sistema instalado, integración con equipos paquete y sistemas de terceros, y pruebas de las secuencias e interlocks con los equipos en vacío.')] },
      { id: 'pem', t: 'Puesta en marcha', das: [], b: [p('Pruebas con carga, sintonía de lazos de control, ajuste de alarmas y entrega de la documentación conforme a construcción. La puesta en servicio de las instalaciones eléctricas se declarará según RIC N° 19 cuando corresponda.')] }
    ],
    extra: [{ t: 'Documentación final', b: [p('Al término se entregará el dossier de calidad con todos los protocolos, certificados, listas de observaciones cerradas, respaldos de programas y planos conforme a construcción.')] }],
    refsEt: ['control', 'montaje']
  });
})();
