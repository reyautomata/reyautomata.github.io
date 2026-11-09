/* Especificaciones técnicas tipo (ET) de instrumentos · ReyEngi
 *
 * Estructura tipificada a partir de especificaciones de proyectos mineros chilenos: 20 capítulos
 * comunes (alcance, condiciones de servicio, normas, referencias, diseño, calibración, pruebas,
 * garantías, oferta...) más un capítulo 8 con una subsección por instrumento.
 *
 * Bloques:  { h: nivel, t: 'Título' }   { p: 'Párrafo' }   { ul: ['viñeta', ...] }
 *           { gen: 'sitio' | 'alcance' | 'referencias' | 'electrico' }  (se arman con los datos del proyecto)
 *           { si: 'campo' , b: [bloques] }  (solo si el campo del proyecto tiene valor)
 * Los textos aceptan {campo} con cualquier dato del proyecto (ver ../proyectos.js).
 */
(function () {
  'use strict';

  function h(n, t) { return { h: n, t: t }; }
  function p(t) { return { p: t }; }
  function ul(a) { return { ul: a }; }

  // ── Textos comunes a los transmisores ─────────────────────────────────────────
  var TX_GENERAL = [
    p('Todos los instrumentos cubiertos por el alcance de la presente especificación serán de fabricación estándar, de diseño probado en aplicaciones mineras, y trabajarán con señales normalizadas de acuerdo con los estándares ISA.'),
    p('Los transmisores serán del tipo inteligente, basados en microprocesador, con configuración desde teclado o menú local y unidades de ingeniería seleccionables. La configuración se mantendrá en memoria no volátil ante una falla de energía.'),
    p('La electrónica tendrá ajuste independiente de cero y span, filtros de ruido, amortiguación ajustable y funciones de autodiagnóstico.'),
    p('Los transmisores tendrán compartimientos separados para la electrónica y para las conexiones de terreno, sellados para impedir el ingreso de humedad y atmósferas corrosivas.'),
    p('Los transmisores tendrán indicación local digital (LCD) de la variable en unidades de ingeniería o en porcentaje, según la hoja de datos. Cuando queden expuestos al sol se suministrará una protección solar orientada para evitar la incidencia directa sobre la pantalla.'),
    p('El proveedor garantizará el suministro de repuestos durante al menos {obsolescencia} años. La conexión eléctrica será mediante bornes atornillados.'),
    p('Cada instrumento tendrá una {placa}, de acuerdo con el TAG indicado en la hoja de datos.'),
    p('Todos los instrumentos se suministrarán con los elementos y accesorios necesarios para el tipo de montaje especificado en las hojas de datos, y serán inmunes a golpes y vibraciones propias de la operación.')
  ];
  var TX_ELECTRICO = [
    p('Los transmisores tendrán circuitos de estado sólido. Cualquier excepción deberá indicarse claramente en la oferta.'),
    p('Las señales de salida no serán afectadas por interferencias electromagnéticas ni por ruido de circuitos eléctricos, variadores de frecuencia o equipos de radiocomunicación (compatibilidad electromagnética según IEC 61326-1).'),
    p('Los encapsulamientos y cajas serán de materiales adecuados para las temperaturas ambientales indicadas en este documento y en las hojas de datos.'),
    p('Los cables de interconexión entre sensor y transmisor, cuando se requieran, serán suministrados por el proveedor con el largo indicado en la hoja de datos.'),
    { gen: 'electrico' }
  ];
  var TX_SENALES = [
    p('Los transmisores entregarán una señal de salida aislada de {senal}, capaz de operar con una carga mínima de 500 Ω, con protocolo HART para configuración, calibración y diagnóstico.'),
    { si: 'bus', b: [p('Cuando la hoja de datos lo indique, los instrumentos se comunicarán mediante {bus}, con los archivos de descripción de dispositivo (GSD/DD) correspondientes.')] }
  ];
  var TX_RANGO = [
    p('El rango calibrado se indica en la hoja de datos de cada instrumento. El indicador local se configurará de 0 a 100 % del rango de la señal de salida, o en las unidades de ingeniería solicitadas.'),
    p('El rango de operación podrá modificarse sin retirar el instrumento del proceso.'),
    p('La exactitud será la indicada en la hoja de datos o, si no se indica, ± 0,5 % del span calibrado o mejor.')
  ];

  // ── Textos comunes a los interruptores ─────────────────────────────────────────
  var SW_GENERAL = [
    p('Todos los instrumentos serán para servicio pesado, sellados herméticamente y estancos al agua y al polvo, con grado de protección {proteccion}.'),
    p('Los interruptores serán de contacto seco, con punto de operación ajustable, y tendrán como mínimo dos contactos {contactos}, según se indique en la hoja de datos.'),
    p('Todos los puntos eléctricos estarán alambrados a una regleta de fácil acceso.'),
    p('Las señales de salida no serán afectadas por equipos de radiocomunicación ni por interferencias electromagnéticas (IEC 61000-4-3).'),
    p('Cada instrumento tendrá una {placa}, de acuerdo con el TAG indicado en la hoja de datos.')
  ];
  var SW_ELECTRICO = [
    p('Los interruptores y todas sus partes se suministrarán para:'),
    ul(['Tensión de control: {tensionControl}.', 'Capacidad de contactos: {contactos}.']),
    { gen: 'electrico' }
  ];

  // ── Familias ───────────────────────────────────────────────────────────────────
  var F = [];

  F.push({
    id: 'presion', titulo: 'INSTRUMENTOS DE MEDICIÓN DE PRESIÓN', objeto: 'los instrumentos de medición de presión',
    normas: ['ASME B40.100: Pressure Gauges and Gauge Attachments', 'EN 837-1/-2: Manómetros de tubo Bourdon', 'IEC 61298: Process measurement and control devices – evaluation of performance'],
    general: TX_GENERAL, electrico: TX_ELECTRICO, senales: TX_SENALES, rango: TX_RANGO,
    instrumentos: [
      { id: 'manometro', t: 'Manómetro', das: ['pi'], b: [
        p('Los manómetros serán de tubo Bourdon, con dial de 100 mm (4") como mínimo, caja y bisel de acero inoxidable AISI 304 y elemento y conexión de acero inoxidable AISI 316L.'),
        p('Tendrán clase de exactitud 1,0 según EN 837-1 o grado 1A según ASME B40.100, visor de vidrio laminado de seguridad y dispositivo de alivio en la caja.'),
        p('Las cajas serán llenas de glicerina en servicios con vibración o pulsaciones. En descarga de bombas se incluirá amortiguador de pulsaciones.'),
        p('El rango se seleccionará de modo que la presión normal de operación quede entre el 30 % y el 70 % de la escala.'),
        p('Cuando la hoja de datos lo indique, el manómetro tendrá sello de diafragma (bridado o roscado) con diafragma de AISI 316L o Hastelloy C276 y fluido de llenado compatible con el proceso.'),
        p('Cada manómetro incluirá válvula de bloqueo y purga de acero inoxidable.')
      ] },
      { id: 'pit', t: 'Transmisor de presión', das: ['pit'], b: [
        p('Los transmisores de presión serán electrónicos, inteligentes, con elemento sensor capacitivo o piezorresistivo y salida {senal}.'),
        p('Tendrán exactitud de referencia de ± 0,075 % del span o mejor y estabilidad de ± 0,15 % del límite superior en 5 años.'),
        p('El diafragma será de acero inoxidable AISI 316L, a menos que la hoja de datos indique otro material, y el fluido de llenado del sensor será silicona.'),
        p('Cada transmisor se suministrará con manifold de 2 vías de acero inoxidable (3 o 5 vías en presión diferencial) y soporte para tubo de 2".'),
        p('En servicios con pulpa, fluidos viscosos o corrosivos se suministrará sello de diafragma según la hoja de datos.'),
        p('Se incluirá protección contra transientes en el bloque de terminales.')
      ] },
      { id: 'psw', t: 'Interruptor de presión', das: [], b: [
        p('Los interruptores de presión serán de diafragma o pistón, con punto de ajuste regulable en terreno y banda muerta indicada por el proveedor.'),
        p('Tendrán contactos {contactos}, carcasa de aluminio con pintura epóxica y partes húmedas de acero inoxidable AISI 316.'),
        p('La repetibilidad será de ± 1 % del rango o mejor.')
      ] }
    ]
  });

  F.push({
    id: 'flujo', titulo: 'INSTRUMENTOS DE MEDICIÓN DE FLUJO', objeto: 'los instrumentos de medición de flujo',
    normas: ['ISO 6817: Measurement of conductive liquid flow in closed conduits – electromagnetic flowmeters', 'ISO 20456: Electromagnetic flowmeters for conductive liquids', 'ISO 12764: Vortex shedding flowmeters'],
    general: TX_GENERAL, electrico: TX_ELECTRICO, senales: TX_SENALES, rango: TX_RANGO,
    instrumentos: [
      { id: 'fit-mag', t: 'Transmisor de flujo tipo magnético', das: ['fit-mag'], b: [
        p('El conjunto incluirá como mínimo: sensor electromagnético, transmisor, cables de interconexión cuando se requieran, soportes y accesorios de montaje, y anillos o electrodos de puesta a tierra.'),
        p('Se usarán en líquidos y pulpas conductores, con conductividad mínima de 5 µS/cm.'),
        h(4, 'Sensor'),
        p('El diámetro del sensor será el indicado en la hoja de datos, validado por el proveedor. El proveedor podrá proponer otro diámetro siempre que la velocidad de flujo quede entre 0,5 y 3 m/s (hasta 5 m/s en pulpa).'),
        p('El cuerpo y las bridas se diseñarán para la presión máxima de trabajo. El tubo de medición y las bridas serán de una sola pieza, de acero inoxidable salvo indicación distinta en la hoja de datos.'),
        p('El revestimiento interior (liner) será el indicado en la hoja de datos (poliuretano o caucho natural en pulpas abrasivas), con espesor y material validados por el proveedor. Los electrodos serán compatibles con el fluido.'),
        p('Se suministrarán los anillos de puesta a tierra y de protección del liner, y todas las empaquetaduras necesarias para la instalación. Las bobinas estarán encapsuladas en resina epóxica y serán aptas para inmersión.'),
        p('Se requerirá un mínimo de 5 diámetros de tubería recta aguas arriba y 3 aguas abajo, salvo que el fabricante indique otro valor.'),
        h(4, 'Transmisor'),
        p('El transmisor tendrá salida {senal}, salida de pulsos para totalizado e indicación local de caudal y totalizador. Se montará en un soporte de tubo de 2" o en superficie, próximo al sensor (montaje remoto) o integrado (montaje compacto) según la hoja de datos.'),
        p('Incluirá diagnósticos de tubería vacía, electrodo recubierto y verificación del medidor en línea.')
      ] },
      { id: 'fit-vortex', t: 'Transmisor de flujo tipo vortex', das: [], b: [
        p('El conjunto incluirá sensor de flujo tipo vortex, transmisor, cables de interconexión cuando se requieran y accesorios de montaje. Se usará en aire de proceso, gases y vapor.'),
        p('El diámetro será el indicado en la hoja de datos y validado por el proveedor según las condiciones de operación. El cuerpo y las bridas se diseñarán para la presión máxima de trabajo, en acero inoxidable salvo otra indicación.'),
        p('El elemento sensor será reemplazable sin afectar la integridad del cuerpo y será inmune a vibraciones.'),
        p('Se requerirá un mínimo de 10 diámetros de tubería recta aguas arriba y 5 aguas abajo.'),
        p('El transmisor tendrá salida {senal} y compensación de temperatura (y presión, cuando la hoja de datos lo indique) para entregar flujo normalizado.')
      ] },
      { id: 'fit-sonar', t: 'Transmisor de flujo tipo sonar', das: ['fit-sonar'], b: [
        p('El medidor será no intrusivo, de tipo sonar pasivo, que mide la velocidad de los vórtices del flujo mediante un arreglo de sensores abrazado a la tubería. Se usará en pulpas y relaves.'),
        p('El sensor se instalará sin detener la línea y sin partes en contacto con el proceso. El proveedor verificará la aplicación con el material, espesor y revestimiento de la tubería indicados en la hoja de datos.'),
        p('El transmisor tendrá salida {senal}, indicación local y, cuando se especifique, medición de aire atrapado (GVF).'),
        p('Se incluirán la banda sensora, la cubierta protectora y el cable preamplificador–transmisor con el largo indicado.')
      ] },
      { id: 'fit-ut', t: 'Transmisor de flujo ultrasónico de tiempo de tránsito', das: ['fit-ut'], b: [
        p('El medidor será ultrasónico de tiempo de tránsito, con transductores abrazados a la tubería (clamp-on). Se usará en agua y líquidos limpios, con menos de 2 % de sólidos o burbujas.'),
        p('La configuración de transductores (modo V o Z) y el número de trayectorias serán definidos por el proveedor según el diámetro y el tramo recto disponible.'),
        p('Se suministrarán rieles y bandas de acero inoxidable, y pad de acoplamiento permanente.'),
        p('Se requerirá un mínimo de 10 diámetros de tubería recta aguas arriba y 5 aguas abajo.'),
        p('El transmisor tendrá salida {senal}, salida de pulsos e indicación local con totalizador.')
      ] },
      { id: 'fs', t: 'Interruptor de flujo', das: ['fs'], b: [
        p('Los interruptores de flujo serán de paleta, para montaje en te reductora, con punto de operación ajustable en terreno.'),
        p('La paleta y el cuerpo serán de acero inoxidable AISI 316. La longitud de la paleta se ajustará al diámetro de la tubería, dejando la holgura indicada por el fabricante.'),
        p('Tendrán contactos {contactos} y carcasa con grado de protección {proteccion}.')
      ] }
    ]
  });

  F.push({
    id: 'nivel', titulo: 'INSTRUMENTOS DE MEDICIÓN DE NIVEL', objeto: 'los instrumentos de medición de nivel',
    normas: ['ETSI EN 302 372 / EN 302 729: Equipos radar de medición de nivel', 'IEC 60947-5-1: Dispositivos de control y elementos de conmutación'],
    general: TX_GENERAL, electrico: TX_ELECTRICO, senales: TX_SENALES,
    rango: [p('El rango del sensor será a lo menos 1,2 veces el span de nivel a medir (2,0 veces en medidores ultrasónicos).')].concat(TX_RANGO),
    instrumentos: [
      { id: 'lit-radar', t: 'Transmisor de nivel tipo radar', das: ['lit-radar'], b: [
        p('Los transmisores serán radar sin contacto, de onda continua modulada en frecuencia (FMCW), de 80 GHz, con ángulo de haz de 8° o menor.'),
        p('La antena será encapsulada (lente de PTFE o PVDF) y apta para ambientes con polvo, espuma y condensación. Cuando el proveedor lo recomiende se incluirá conexión de purga de aire.'),
        p('La exactitud será de ± 2 mm o mejor. La electrónica tendrá supresión de ecos falsos y promedio de ecos.'),
        p('El montaje será con brida o en soporte, según la hoja de datos, e incluirá protección solar e indicador remoto cuando se especifique.')
      ] },
      { id: 'lit-us', t: 'Transmisor de nivel tipo ultrasónico', das: [], b: [
        p('Los transmisores serán ultrasónicos sin contacto, de tipo compuesto (sensor y transmisor separados). El conjunto incluirá sensor, transmisor, cable de interconexión y accesorios de montaje.'),
        h(4, 'Sensor'),
        p('El sensor transmitirá pulsos ultrasónicos hacia la superficie y recibirá su eco. El proveedor indicará en la hoja de datos la potencia y la frecuencia de operación.'),
        p('La conexión a proceso será con brida ASME B16.5 de 3", salvo indicación distinta en la hoja de datos.'),
        h(4, 'Transmisor'),
        p('El transmisor será inteligente, con salida {senal}, indicación local y funciones de promedio de ecos y filtros para minimizar los efectos de la agitación de la superficie.'),
        p('El cable sensor–transmisor se fabricará según el estándar del fabricante, informando la norma aplicada.')
      ] },
      { id: 'lit-hidro', t: 'Transmisor de nivel hidrostático', das: ['lit-hidro'], b: [
        p('Los transmisores serán sondas sumergibles de presión hidrostática, con celda cerámica capacitiva y cuerpo de acero inoxidable AISI 316L.'),
        p('El cable será de PUR o FEP con tubo de compensación atmosférica, del largo indicado en la hoja de datos, y terminará en una caja de terminales con filtro de compensación.'),
        p('La exactitud será de ± 0,2 % del span o mejor. Se suministrará la abrazadera de suspensión.')
      ] },
      { id: 'lsw-vib', t: 'Interruptor de nivel tipo vibratorio', das: [], b: [
        p('El interruptor funcionará con una horquilla vibratoria de acero inoxidable cuya frecuencia cambia al quedar cubierta por el medio, activando la salida.'),
        p('El montaje será lateral; el nivel de activación queda definido por la altura de la conexión a proceso en el estanque.'),
        p('La conexión a proceso será con brida ASME B16.5 Clase 150 de 1", de acero inoxidable, salvo otra indicación en la hoja de datos.'),
        p('La carcasa será de aluminio con grado de protección {proteccion}. La unidad electrónica tendrá dos contactos secos DPDT y una indicación luminosa del estado del relé.')
      ] },
      { id: 'lsh-mw', t: 'Interruptor de nivel tipo microondas', das: ['lsh-mw'], b: [
        p('El interruptor será del tipo barrera de microondas, compuesto por emisor, receptor y unidad de evaluación (transmisor) remota. Detectará la presencia de mineral en chutes y tolvas sin contacto con el material.'),
        p('El emisor y el receptor se montarán en ventanas de PTFE para soldar al equipo, con soportes antivibratorios.'),
        p('La unidad de evaluación tendrá salida a relé con contactos {contactos}, tiempo de retardo ajustable e indicación del estado del haz, y se instalará en panel.'),
        p('Los cables emisor–transmisor y receptor–transmisor se suministrarán con el largo indicado en la hoja de datos.')
      ] }
    ]
  });

  F.push({
    id: 'analisis', titulo: 'INSTRUMENTOS DE DENSIDAD Y ANÁLISIS', objeto: 'los instrumentos de medición de densidad y análisis',
    normas: ['D.S. N° 133/1984: Reglamento sobre autorizaciones para instalaciones radiactivas (Chile)', 'IEC 60746-2: Expression of performance of electrochemical analyzers – pH value'],
    general: TX_GENERAL, electrico: TX_ELECTRICO, senales: TX_SENALES, rango: TX_RANGO,
    instrumentos: [
      { id: 'dit', t: 'Densímetro nuclear', das: ['dit'], b: [
        p('El densímetro será de absorción de radiación gamma, con fuente de Cs-137, portafuente blindado con obturador bloqueable con candado e indicación visual ABIERTO / CERRADO.'),
        p('La actividad de la fuente será calculada por el proveedor según el diámetro, espesor y revestimiento de la tubería, de modo que la tasa de dosis en el exterior cumpla la normativa vigente.'),
        p('El detector será de centelleo, con compensación de temperatura y constante de tiempo ajustable. El transmisor tendrá salida {senal}.'),
        p('El proveedor entregará el certificado de la fuente, el certificado de prueba de fuga y la información necesaria para la autorización ante la autoridad competente (CChEN), además de la señalética radiológica.'),
        p('La fuente se despachará con el obturador cerrado y será instalada por personal autorizado.')
      ] },
      { id: 'ait-ph', t: 'Analizador de pH', das: ['ait-ph'], b: [
        p('El sistema incluirá sensor, portasonda, cable y transmisor. El sensor será de vidrio combinado con referencia de doble unión y compensación de temperatura integrada (Pt100 o Pt1000).'),
        p('El portasonda será de inmersión o retráctil con válvula de bola, según la hoja de datos, y permitirá retirar el sensor sin detener el proceso en montaje en línea.'),
        p('El transmisor tendrá salida {senal}, dos relés de alarma, indicación de pH y temperatura, y calibración en dos puntos con soluciones buffer.'),
        p('Cuando la hoja de datos lo indique se incluirá limpieza automática por chorro de agua o aire.')
      ] }
    ]
  });

  F.push({
    id: 'correas', titulo: 'INSTRUMENTOS PARA CORREAS TRANSPORTADORAS', objeto: 'los instrumentos de protección y control de correas transportadoras', interruptores: true,
    normas: ['ISO 13850: Seguridad de máquinas – función de parada de emergencia', 'IEC 60947-5-5: Dispositivos de parada de emergencia con enclavamiento mecánico', 'CEMA: Belt Conveyors for Bulk Materials'],
    general: SW_GENERAL.concat([p('Las correas transportadoras incorporarán todos los instrumentos necesarios para la seguridad de las personas y de los equipos, según se describe a continuación.')]),
    electrico: SW_ELECTRICO,
    instrumentos: [
      { id: 'zs-des', t: 'Interruptor de desalineamiento', das: [], b: [
        p('Cada control consistirá en dos interruptores, uno a cada lado de la correa, con brazo de rodillo y operación ajustable según el ángulo del brazo.'),
        p('Cada interruptor tendrá dos microinterruptores con contactos {contactos}: alarma a 10° y detención a 20° de la vertical.'),
        p('El brazo o rodillo será recubierto con material de bajo roce y desgaste.'),
        p('Se instalará al menos un par en cabeza y otro en cola. En correas de más de 300 m se agregarán pares intermedios cada 150 m.')
      ] },
      { id: 'hs-pull', t: 'Interruptor de piola de seguridad (pull-cord)', das: ['hs-pull'], b: [
        p('Las correas tendrán un cable de acero continuo a lo largo de los pasillos, conectado a interruptores de doble accionamiento que operan tirando en cualquier sentido.'),
        p('Cada interruptor tendrá palanca-banderola de color rojo que indica el disparo, con enclavamiento mecánico: una vez accionado solo podrá reponerse en forma intencional en el propio interruptor.'),
        p('Tendrá como mínimo un microinterruptor con contactos {contactos}, de apertura positiva.'),
        p('El suministro incluirá pernos de ojo, guías, tensores, resortes y abrazaderas de remate del cable.'),
        p('Los interruptores se instalarán cada 30 m (cada 60 m como máximo en correas de más de 600 m), a ambos lados de la correa o donde exista acceso.')
      ] },
      { id: 'ss-cero', t: 'Interruptor de velocidad cero', das: [], b: [
        p('El sensor será inductivo, sin contacto, y el receptor tendrá retardo ajustable de 5 a 50 s y al menos un contacto {contactos} con punto de operación ajustable según las RPM.'),
        p('El sensor se instalará en la polea de cola (o de cabeza si el accionamiento está en cola). Además se instalará un sensor en la polea motriz para detectar resbalamiento por diferencia de velocidad.'),
        p('El cable sensor–receptor se suministrará con el equipo.')
      ] },
      { id: 'xs-rip', t: 'Interruptor de rasgadura de correa', das: ['xs-rip'], b: [
        p('Los interruptores serán del tipo cuerda tensa y se instalarán en pares a ambos lados de la correa, unidos por cables que pasan bajo la cara inferior a no más de 5 cm.'),
        p('Cuando un objeto o una porción dañada de la correa cuelga, tira de los cables y activa un contacto {contactos}. La reposición será manual.'),
        p('Se instalarán después de cada punto de carga.')
      ] },
      { id: 'ls-tilt', t: 'Interruptor de nivel tipo tilt', das: [], b: [
        p('El instrumento tendrá una sonda de acero inoxidable que, al ser inclinada por el material, abre su contacto interno. La sonda se conectará a la unidad electrónica mediante un cable suministrado con el equipo.'),
        p('La unidad electrónica rechazará aperturas falsas por rebote y validará el tiempo de permanencia del contacto abierto. Tendrá dos contactos {contactos} e indicación luminosa del estado del relé.')
      ] },
      { id: 'zs-cp', t: 'Interruptor de posición en contrapeso', das: [], b: [
        p('En las correas que lo requieran, según el diseño mecánico, se instalarán interruptores de posición para supervisar que el sistema tensor se encuentre en la posición correcta.'),
        p('Cada interruptor tendrá un microinterruptor con contacto {contactos}. La cantidad depende del diseño de cada correa.')
      ] },
      { id: 'xa', t: 'Bocinas y balizas', das: ['xa'], b: [
        p('Las correas tendrán bocinas y balizas para advertir al personal de la partida. El tiempo de advertencia será ajustable en el sistema de control.'),
        p('Las bocinas serán electrónicas multitono o resonantes, de 110 dB(A) a 1 m como mínimo, complementadas con balizas LED destellantes.'),
        p('Cada correa tendrá como mínimo una bocina y una baliza en cabeza o en cola; en correas largas se instalarán cada 100 m.')
      ] },
      { id: 'wit', t: 'Pesómetro de correa', das: ['wit'], b: [
        p('El pesómetro estará compuesto por puente de pesaje con celdas de carga, sensor de velocidad, caja digitalizadora en terreno e integrador remoto.'),
        p('La exactitud del sistema será de ± 0,5 % o mejor, en el rango de 20 % a 100 % de la capacidad nominal.'),
        p('El integrador indicará flujo (t/h), totalizado (t) y velocidad, con salida {senal}, pulsos de totalizado y comunicación a red cuando se especifique.'),
        p('Se suministrará cadena de prueba o pesas de calibración.')
      ] }
    ]
  });

  F.push({
    id: 'valvulas', titulo: 'VÁLVULAS Y ACTUADORES', objeto: 'las válvulas de control, on/off y autorreguladoras con sus actuadores', valvulas: true,
    normas: ['ASME B16.34: Valves – Flanged, Threaded and Welding End', 'ASME B16.5: Pipe Flanges and Flanged Fittings', 'ANSI/FCI 70-2: Control Valve Seat Leakage', 'MSS SP-61 / API 598: Pressure Testing of Valves', 'ISA-75.01.01 / IEC 60534-2-1: Flow equations for sizing control valves', 'ISO 5211: Part-turn actuator attachments'],
    general: [
      p('Toda válvula deberá demostrar aplicación en condiciones de servicio similares. Los materiales serán adecuados para el fluido especificado y garantizados por el proveedor.'),
      p('Las válvulas con actuador serán aptas para montaje en cualquier posición y operación a la intemperie, y tendrán indicador mecánico de posición visible a 3 m como mínimo.'),
      p('Las válvulas operarán en los rangos de presión de ASME B16.34 y en las presiones indicadas en las hojas de datos, considerando un transiente de sobrepresión de al menos 10 % sobre la presión de diseño.'),
      p('Cada válvula y actuador se dimensionarán para la presión diferencial máxima de cierre. Si la válvula no es bidireccional, la dirección preferente estará marcada en el cuerpo.'),
      p('Las válvulas on/off tendrán cierre hermético, clase V como mínimo según ANSI/FCI 70-2 o MSS SP-61.'),
      p('La empaquetadura del vástago podrá mantenerse y reemplazarse en terreno sin desmontar la válvula.'),
      p('La válvula y el actuador se suministrarán como un conjunto completo, montado, ajustado y probado en fábrica.')
    ],
    electrico: [
      p('Los actuadores eléctricos y los accesorios se suministrarán para:'),
      ul(['Fuerza: {alimMotor}.', 'Control y señales discretas: {tensionControl}.', 'Señales analógicas: {senal}.']),
      { gen: 'electrico' }
    ],
    rango: [p('Las válvulas de control se dimensionarán para operar entre 20 % y 80 % de apertura en el rango de flujo indicado en la hoja de datos. El proveedor entregará la memoria de cálculo de Cv y del nivel de ruido (máximo 85 dB(A) a 1 m).')],
    instrumentos: [
      { id: 'xv-neu', t: 'Válvula on/off con actuador neumático', das: ['xv-neu'], b: [
        p('Las válvulas serán de cuchilla o mariposa según la hoja de datos, de cuerpo de hierro dúctil, con cuchilla o disco de acero inoxidable o dúplex y asiento elastomérico en servicio de pulpa.'),
        p('El actuador será neumático (cilindro o piñón-cremallera), de doble efecto o simple efecto con resorte para la posición de falla indicada.'),
        p('Incluirá electroválvula 24 VDC con montaje NAMUR, caja de interruptores de posición abierta/cerrada, filtro regulador con manómetro y tubing de acero inoxidable.'),
        p('La presión de aire de diseño será la indicada en la hoja de datos; el actuador operará correctamente con la presión mínima de suministro.')
      ] },
      { id: 'xv-hid', t: 'Válvula on/off con actuador hidráulico', das: ['xv-hid'], b: [
        p('El actuador será un cilindro hidráulico de doble efecto, comandado desde una unidad hidráulica (HPU) con electroválvula direccional.'),
        p('Las mangueras serán SAE 100R2AT con conectores rápidos. El fluido hidráulico será el indicado por el proveedor (ISO VG 46 o similar).'),
        p('Incluirá caja de interruptores de posición abierta/cerrada.')
      ] },
      { id: 'xv-mot', t: 'Válvula on/off con actuador eléctrico', das: ['xv-mot'], b: [
        p('El actuador será eléctrico, de cuarto de vuelta o multivuelta según el tipo de válvula, dimensionado para las condiciones de la hoja de datos.'),
        p('El motor será de inducción jaula de ardilla, trifásico, alimentado en {alimMotor}, con aislación clase F, protección térmica y factor de servicio 1,15.'),
        p('Incluirá interruptores de torque y de final de carrera ajustables, volante manual que se desacopla al operar el motor, indicador mecánico de posición, selector Local/Off/Remoto, contactores, protecciones y calefactor anticondensación.'),
        p('Entregará contactos libres de potencial para: abierta, cerrada, falla y local/remoto, y aceptará comandos remotos de abrir, cerrar y parar. Cuando se indique, se comunicará por {bus}.'),
        p('El proveedor indicará los tiempos de apertura y cierre en la hoja de datos.')
      ] },
      { id: 'fcv', t: 'Válvula de control', das: ['fcv'], b: [
        p('El tipo de válvula (mariposa, bola, globo o pinch), la característica de flujo y la clase de fuga serán los indicados en la hoja de datos.'),
        p('El actuador será neumático con posicionador digital inteligente, o eléctrico modulante, con señal de mando {senal} y retroalimentación de posición.'),
        p('La posición de falla será la indicada en la hoja de datos. En actuadores neumáticos se incluirá filtro regulador.'),
        p('El proveedor entregará la memoria de cálculo de Cv para los flujos mínimo, normal y máximo.')
      ] },
      { id: 'pcv', t: 'Válvula reguladora de presión autopilotada', das: ['pcv'], b: [
        p('La válvula será de diafragma, autoaccionada por el propio fluido mediante un piloto reductor de presión ajustable, sin energía externa.'),
        p('El cuerpo será de hierro dúctil con recubrimiento epóxico. El circuito del piloto incluirá filtro y válvulas de aislamiento.'),
        p('Se incluirá indicador visual de posición y, cuando la hoja de datos lo indique, transmisor de posición {senal}.')
      ] }
    ]
  });

  window.ET = { familias: F };
})();
