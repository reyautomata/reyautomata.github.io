/* Tipos de requisición de compra · Suite ReyEngi
 * Cada tipo define el alcance por defecto de la Tabla 5.1, los trabajos excluidos (5.2), la familia de
 * especificación técnica y las hojas de datos que se citan en la Tabla 4.1, y qué tags del listado de
 * instrumentos entran en el suministro.
 *
 *   letras: función (letras ISA del tag) → descripción del ítem, o '' si el tag no pertenece al tipo
 *   grupos: agrupa los ítems de equipos (ej. transmisores / interruptores) en subítems 1.1, 1.2 …
 *   equipos / software / servicios: filas [cantidad, unidad, descripción]
 */
(function () {
  'use strict';

  // ── Textos comunes ──
  var SERV_INST = [
    [1, 'Gl', 'Certificado de calibración.'],
    [1, 'Gl', 'Pruebas de aceptación de configuración – Pruebas CAT.'],
    [1, 'Gl', 'Pruebas de aceptación en fábrica – Pruebas FAT.'],
    [1, 'Gl', 'Pruebas de aceptación en sitio – Pruebas SAT.'],
    [1, 'Gl', 'Repuestos para la puesta en servicio y {REP} de operación.'],
    [1, 'Gl', 'Calibración en terreno.'],
    [1, 'Gl', 'Pruebas de puesta en servicio.'],
    [1, 'Gl', 'Asistencia técnica en terreno para la puesta en servicio.'],
    [1, 'Gl', 'Capacitación para operación y mantenimiento.'],
    [1, 'Gl', 'Embalaje y transporte a las instalaciones indicadas por el cliente.']
  ];
  var EXCL_INST = [
    'Instalación de los equipos y sus accesorios en terreno.',
    'Cables de alimentación externos a las cajas o gabinetes.',
    'Suministro e instalación de canalizaciones.',
    'Cables de fibra óptica externos a las cajas o gabinetes.',
    'Sistema de respaldo UPS.'
  ];
  var EXCL_SIS = [
    'Jumpers de fibra óptica exteriores a los gabinetes suministrados.',
    'Sistema de respaldo UPS.',
    'Alimentación eléctrica de los gabinetes suministrados.',
    'Alambrado y conexionado exterior.',
    'Trabajos y materiales relacionados con la instalación de gabinetes, paneles y consolas en la planta, salas de control o salas eléctricas.'
  ];
  function servSis(nombre) {
    return [
      [1, 'c/u', 'Ingeniería del proveedor para la implementación del ' + nombre + '.'],
      [1, 'c/u', 'Servicio de configuración y programación del ' + nombre + '.'],
      [1, 'c/u', 'Pruebas de aceptación en fábrica – Pruebas FAT.'],
      [1, 'c/u', 'Pruebas de aceptación de configuración – Pruebas CAT.'],
      [1, 'c/u', 'Pruebas de aceptación en sitio – Pruebas SAT.'],
      [1, 'c/u', 'Comisionamiento del ' + nombre + '.'],
      [1, 'c/u', 'Apoyo a la puesta en marcha en planta.'],
      [1, 'c/u', 'Capacitación del ' + nombre + ' al personal de planta.'],
      [1, 'c/u', 'Embalaje y transporte a las instalaciones indicadas por el cliente.']
    ];
  }
  var REP_SIS = [1, 'Gl', 'Repuestos para la puesta en marcha y {REP} de operación.'];

  // Letras ISA → función: ¿es transmisor, interruptor, indicador local…?
  function es(l, lista) { return lista.indexOf(l) >= 0; }

  var T = [
    // ── Instrumentos de terreno ──
    { id: 'manometros', grupo: 'Instrumentos', titulo: 'MANÓMETROS', objeto: 'manómetros', et: 'presion', das: ['pi'],
      letras: function (l) { return es(l, ['PI', 'PG', 'PDI']) ? (l === 'PDI' ? 'Manómetro diferencial' : 'Manómetro') : ''; } },
    { id: 'presion', grupo: 'Instrumentos', titulo: 'TRANSMISORES DE PRESIÓN', objeto: 'transmisores de presión', et: 'presion', das: ['pit', 'psh'],
      letras: function (l) {
        if (es(l, ['PIT', 'PT', 'PE/PIT'])) return 'Transmisor de presión';
        if (es(l, ['PDIT', 'PDT'])) return 'Transmisor de presión diferencial';
        if (/^PS(H|L|HH|LL)?$/.test(l)) return 'Interruptor de presión';
        return '';
      },
      grupos: function (d) { return /Interruptor/.test(d) ? 'Interruptores de presión' : 'Transmisores de presión'; } },
    { id: 'flujo', grupo: 'Instrumentos', titulo: 'TRANSMISORES DE FLUJO MAGNÉTICO', objeto: 'transmisores de flujo tipo magnético', et: 'flujo', das: ['fit-mag'],
      letras: function (l) { return es(l, ['FIT', 'FT', 'FE/FIT', 'FQIT', 'FE']) ? 'Transmisor de flujo tipo magnético' : ''; } },
    { id: 'densidad', grupo: 'Instrumentos', titulo: 'DENSÍMETROS', objeto: 'sensores y transmisores de densidad', et: 'analisis', das: ['dit', 'dit-perc'],
      letras: function (l) { return es(l, ['DIT', 'DT', 'DE/DIT', 'DE']) ? 'Sensor/transmisor de densidad' : ''; } },
    { id: 'nivel', grupo: 'Instrumentos', titulo: 'TRANSMISORES E INTERRUPTORES DE NIVEL', objeto: 'transmisores e interruptores de nivel', et: 'nivel', das: ['lit-radar', 'lit-us', 'lit-hidro', 'lsw-vib', 'lsh-mw'],
      letras: function (l) {
        if (es(l, ['LIT', 'LT', 'LE/LIT'])) return 'Sensor/transmisor de nivel';
        if (/^LS(H|L|HH|LL)?$/.test(l)) return 'Interruptor de nivel';
        return '';
      },
      grupos: function (d) { return /Interruptor/.test(d) ? 'Interruptores de nivel' : 'Sensores y transmisores de nivel'; } },
    { id: 'temperatura', grupo: 'Instrumentos', titulo: 'TRANSMISORES DE TEMPERATURA', objeto: 'transmisores de temperatura', et: 'temperatura', das: ['tit', 'tsh'],
      letras: function (l) {
        if (es(l, ['TIT', 'TT', 'TE/TIT', 'TE'])) return 'Sensor/transmisor de temperatura';
        if (es(l, ['TI', 'TG'])) return 'Termómetro bimetálico';
        if (/^TS(H|L|HH|LL)?$/.test(l)) return 'Interruptor de temperatura';
        return '';
      } },
    { id: 'analizador', grupo: 'Instrumentos', titulo: 'ANALIZADORES EN LÍNEA', objeto: 'analizadores en línea', et: 'analisis', das: ['ait-ph', 'ait-cond', 'ait-turb', 'ait-orp', 'ait-gas'],
      letras: function (l) { return es(l, ['AIT', 'AT', 'AE/AIT', 'AE']) ? 'Analizador en línea' : ''; } },
    { id: 'valvulas', grupo: 'Instrumentos', titulo: 'VÁLVULAS DE CONTROL Y ON/OFF', objeto: 'válvulas de control y on/off con sus actuadores', et: 'valvulas', das: ['fcv', 'xv-neu', 'xv-mot', 'xv-sol'],
      letras: function (l) {
        if (/^[FLPTA]C?V$/.test(l) && l !== 'XV') return 'Válvula de control con actuador y posicionador';
        if (es(l, ['XV', 'HV', 'KV'])) return 'Válvula on/off con actuador';
        return '';
      },
      grupos: function (d) { return /control/.test(d) ? 'Válvulas de control' : 'Válvulas on/off'; } },
    { id: 'correas', grupo: 'Instrumentos', titulo: 'INSTRUMENTOS PARA CORREAS TRANSPORTADORAS', objeto: 'instrumentos de protección de correas transportadoras', et: 'correas', das: ['zs-des', 'hs-pull', 'ss-cero', 'xs-rip', 'ls-tilt'],
      letras: function (l) {
        if (es(l, ['ZSD', 'ZS'])) return 'Interruptor de desalineamiento';
        if (es(l, ['HS', 'HSP'])) return 'Interruptor de piola de seguridad';
        if (es(l, ['SS', 'SSL'])) return 'Interruptor de velocidad cero';
        if (es(l, ['XS', 'YS'])) return 'Interruptor de rasgadura';
        if (es(l, ['WIT', 'WT'])) return 'Pesómetro de correa';
        return '';
      } },
    // ── Sistemas ──
    { id: 'control', grupo: 'Sistemas', titulo: 'SISTEMA DE CONTROL', objeto: 'el sistema de control', et: 'control', das: ['plc', 'gab'], sistema: true, docsLazos: ['docIO'],
      equipos: [
        [1, 'Un.', 'Gabinete de servidores del sistema de control:\nIncluye gabinete metálico con servidores de control redundantes y servidor terminal.'],
        ['{PLC}', 'Un.', 'Gabinete PLC:\nIncluye gabinete metálico con backplane, fuente de poder redundante, CPU redundante e interfaz acopladora, tarjetas y equipamiento de comunicaciones industriales.'],
        ['{RIO}', 'Un.', 'Gabinete RIO:\nIncluye gabinete metálico con backplane, fuente de poder redundante, tarjeta de comunicaciones y tarjetas de entradas/salidas.'],
        [2, 'Un.', 'Estación de operación:\nIncluye equipo de escritorio y pantallas LCD de 24".'],
        [1, 'Un.', 'Estación de ingeniería:\nIncluye equipo de escritorio y pantallas LCD de 24".'],
        [1, 'Un.', 'Servidor de históricos rackeable de 19".'],
        [1, 'Un.', 'Servidor de aplicación rackeable de 19".'],
        REP_SIS
      ],
      software: [
        [1, 'Un.', 'Licencias de software de monitoreo y control para las estaciones de operación.'],
        [1, 'Un.', 'Licencias de software de ingeniería y programación del PLC.'],
        [1, 'Un.', 'Licencias y software para servidores.'],
        [1, 'Un.', 'Licencias de software antivirus.']
      ],
      servicios: servSis('sistema de control').concat([[1, 'c/u', 'Configuración de base de datos, pantallas de monitoreo y comando, tendencias, reportes y estaciones cliente.'], [1, 'c/u', 'Servicio de soporte (hot-line) durante el período de garantía.']]),
      excluidos: EXCL_SIS },
    { id: 'informatica', grupo: 'Sistemas', titulo: 'SISTEMA DE INFORMÁTICA INDUSTRIAL', objeto: 'el sistema de informática industrial', et: 'scada', das: ['gab-com'], sistema: true,
      equipos: [[1, 'Un.', 'Switch consola KVM.'], [1, 'Un.', 'Gabinete de 42U.'], [2, 'Un.', 'Unidades de distribución de energía (PDU).'], [1, 'Gl', 'Conjunto de servidores de procesamiento rackeables 19".'],
        [1, 'Gl', 'Conjunto de servidores de almacenamiento rackeables 19".'], [1, 'Gl', 'Conjunto de switches y firewalls rackeables 19".'], REP_SIS],
      software: [[1, 'Gl', 'Licencias de software del sistema y de los equipos.'], [1, 'Gl', 'Licencias de software antivirus.'], [1, 'Gl', 'Licencias de software de visibilidad y reportabilidad operacional.'], [1, 'Gl', 'Licencias de software de ingreso manual de datos.']],
      servicios: servSis('sistema de informática industrial'),
      excluidos: ['Excavaciones.', 'Instalación de canalizaciones: bandejas, escalerillas y ductos.', 'Alimentación eléctrica.'],
      notas: ['La cantidad de servidores de procesamiento y almacenamiento y de switches será indicada por el proveedor según el dimensionamiento del sistema.'] },
    { id: 'switches', grupo: 'Sistemas', titulo: 'SWITCHES DE COMUNICACIONES', objeto: 'los switches de comunicaciones', et: 'redes', das: ['sw-eth'], sistema: true,
      equipos: [['{SWB}', 'Un.', 'Switch de comunicaciones multiservicio de borde.'], [2, 'Un.', 'Switch de comunicaciones multiservicio de core.'], REP_SIS],
      software: [[1, 'Gl', 'Licencias y software para switches de acceso.'], [1, 'Gl', 'Licencias y software para switches de distribución.']],
      servicios: servSis('sistema de comunicaciones'), excluidos: EXCL_SIS.concat(['Mobiliario.']) },
    { id: 'fibra', grupo: 'Sistemas', titulo: 'SISTEMA DE COMUNICACIONES (FIBRA ÓPTICA)', objeto: 'el sistema de comunicaciones por fibra óptica', et: 'fibra', das: ['cab-fo', 'odf'], sistema: true,
      equipos: [[0, 'm', 'Fibra óptica monomodo armada de 24 filamentos.'], [0, 'm', 'Fibra óptica multimodo armada de 6 filamentos.'], [0, 'Un.', 'Cabeceras de fibra óptica rackeables 19", NEMA 12.'],
        [0, 'Un.', 'Cabeceras de fibra óptica para muro, NEMA 12.'], [0, 'Un.', 'Cabeceras de fibra óptica para intemperie, NEMA 4X.'],
        [1, 'Gl', 'Accesorios de instalación (termofusiones, mufas, bandejas, pigtails y terminaciones).'], [1, 'Gl', 'Jumpers de fibra óptica.'], [1, 'Gl', 'Ferretería de montaje.']],
      servicios: [[1, 'Gl', 'Servicio de instalación del sistema de fibra óptica.'], [1, 'Gl', 'Servicio de configuración.'], [1, 'Gl', 'Pruebas de cables y del sistema.'],
        [1, 'Gl', 'Certificación del cableado (reflectometría OTDR y potencia).'], [1, 'Gl', 'Puesta en marcha.'], [1, 'Gl', 'Capacitación del personal.']],
      excluidos: ['Excavaciones.', 'Instalación de canalizaciones: bandejas, escalerillas y ductos.', 'Jumpers de fibra óptica exteriores.', 'Trabajos y materiales relacionados con la instalación de gabinetes, paneles y consolas en la planta, salas de control o garita de acceso.'] },
    { id: 'cableado', grupo: 'Sistemas', titulo: 'CABLEADO ESTRUCTURADO', objeto: 'el sistema de cableado estructurado', et: 'fibra', das: ['gab-com'], sistema: true,
      equipos: [[0, 'Un.', 'Gabinete de 16U de anclaje a muro.'], [0, 'Un.', 'Gabinete de 42U de anclaje a piso.'], [1, 'Gl', 'Repuestos y listado de repuestos para la puesta en marcha y {REP} de operación.']],
      servicios: [[1, 'Gl', 'Estudios preliminares para la implementación del cableado estructurado.'], [1, 'Gl', 'Descripción funcional del sistema.'], [1, 'Gl', 'Manual de operación e instalación.'],
        [1, 'Gl', 'Pruebas de aceptación en fábrica – Pruebas FAT.'], [1, 'Gl', 'Pruebas de aceptación de configuración – Pruebas CAT.'], [1, 'Gl', 'Pruebas de aceptación en sitio – Pruebas SAT.'],
        [1, 'Gl', 'Transporte, almacenamiento y despacho.'], [1, 'Gl', 'Supervisión de montaje.'], [1, 'Gl', 'Comisionamiento.'], [1, 'Gl', 'Puesta en marcha.'], [1, 'Gl', 'Capacitación en terreno.']],
      excluidos: ['Jumpers de fibra óptica exteriores.', 'Fuente de poder externa.', 'Sistema de respaldo UPS.', 'Sistemas de soporte de operación para radiocomunicaciones, telefonía y control de acceso.'] },
    { id: 'telefonia', grupo: 'Sistemas', titulo: 'SISTEMA DE TELEFONÍA IP', objeto: 'el sistema de telefonía IP', et: 'redes', das: [], sistema: true,
      equipos: [[1, 'c/u', 'Central telefónica IP.'], [0, 'c/u', 'Teléfono IP básico.'], [0, 'c/u', 'Teléfono IP ejecutivo.'], [1, 'c/u', 'Teléfono multilínea.']],
      software: [[1, 'Gl', 'Licencia de la central telefónica.'], [1, 'Gl', 'Licencias para la cantidad de abonados requerida.']],
      servicios: [[1, 'c/u', 'Servicio de configuración.'], [1, 'c/u', 'Servicio de puesta en marcha.'], [1, 'c/u', 'Capacitación del personal.']],
      excluidos: EXCL_SIS.slice(0, 3).concat(['Trabajos y materiales relacionados con la instalación de gabinetes y consolas en la planta, salas de control o garita de acceso.', 'Mobiliario.', 'Configuración de la red IP.']) },
    { id: 'cctv', grupo: 'Sistemas', titulo: 'SISTEMA DE CCTV', objeto: 'el sistema de circuito cerrado de televisión (CCTV)', et: 'seguridad', das: ['cam-ptz', 'cam-fija', 'nvr', 'tab-cctv'], sistema: true,
      equipos: [[0, 'c/u', 'Cámara IP domo.'], [0, 'c/u', 'Cámara IP PTZ.'], [0, 'c/u', 'Cámara IP fija.'], [2, 'c/u', 'Switch de distribución de comunicación principal.'], [0, 'c/u', 'Switch de comunicación en área.'],
        [2, 'c/u', 'Estación de trabajo para supervisión y seguridad.'], [2, 'c/u', 'Servidor de proceso y grabación.'], [1, 'c/u', 'Gabinete 19" rackeable 42U.']],
      software: [[1, 'Gl', 'Licencias y software de monitoreo para estaciones de seguridad y supervisión.'], [1, 'Gl', 'Licencias de sistema operativo y antivirus.'], [1, 'Gl', 'Licencias y software para servidores.']],
      servicios: servSis('sistema de CCTV'), excluidos: EXCL_SIS.slice(0, 3).concat(['Trabajos y materiales relacionados con la instalación de gabinetes y consolas en la planta, salas de control o garita de acceso.', 'Mobiliario.']) },
    // ── Materiales ──
    { id: 'cables', grupo: 'Materiales', titulo: 'CABLES DE INSTRUMENTACIÓN Y COMUNICACIONES', objeto: 'cables de instrumentación, control y comunicaciones', et: 'cables', das: ['cab-inst'], sistema: true, cables: true,
      servicios: [[1, 'Gl', 'Certificados de pruebas de fábrica de cada carrete.'], [1, 'Gl', 'Embalaje en carretes identificados y transporte a las instalaciones indicadas por el cliente.']],
      excluidos: ['Tendido, conexionado y pruebas de los cables en terreno.', 'Suministro e instalación de canalizaciones.', 'Terminales, prensaestopas y accesorios de conexión.'] }
  ];

  // Tabla 6.1 · documentos del proveedor: [documento, cotización, revisión, aprobación, final]
  var DOCS = [
    ['Información de catálogo, datos técnicos, etc.', '1D', '', '', ''],
    ['Planos dimensionales (arreglo general), planos de diseño y dimensiones.', '', '1D', '1D', '1D+3P'],
    ['Planos de secciones / lista de partes y componentes.', '', '1D', '1D', '1D+3P'],
    ['Modelo 3D.', '', '1D', '1D', '1D'],
    ['Especificación / listado de componentes principales.', '1D', '1D', '1D', '1D+3P'],
    ['Diagramas de conexionado interno.', '', '1D', '1D', '1D+3P'],
    ['Diagrama de alambrado de control e instrumentación.', '', '1D', '1D', '1D+3P'],
    ['Planos de componentes de fuerza y control.', '', '1D', '1D', '1D+3P'],
    ['Requerimientos e instrucciones de conexión a tierra.', '', '1D', '1D', '1D+3P'],
    ['Hoja de datos de instrumentos.', '', '1D', '1D', '1D+3P'],
    ['Listado de repuestos recomendados para la operación y programa para el ciclo de vida del proyecto.', '1D', '', '', '1D+3P'],
    ['Listado valorizado de repuestos para montaje y puesta en marcha.', '1D', '1D', '1D', '1D+3P'],
    ['Lista detallada de partes, con números.', '', '1D', '1D', '1D+3P'],
    ['Programa de inspección, programa de embarque y lista de embalaje.', '', '1D', '1D', '1D+3P'],
    ['Programa de fabricación, incluyendo subproveedores.', '', '1D', '1D', '1D+3P'],
    ['Listado de pesos de partes y piezas para montaje, peso unitario de embarque y peso instalado.', '', '1D', '1D', '1D+3P'],
    ['Protocolos y garantías del proveedor.', '1D', '1D', '1D', '1D+3P'],
    ['Certificados de pruebas con número estampado.', '', '', '', '1D+3P'],
    ['Manuales de instalación, operación y mantenimiento en español (requiere copia impresa).', '', '1D+1P', '1D+1P', '1D+3P'],
    ['Manual de aseguramiento de calidad, procedimientos y control de calidad.', '1D', '1D', '1D', '1D+3P'],
    ['Lista de embarque.', '', '1D', '1D', '1D+3P'],
    ['Instrucciones de embarque.', '', '1D', '1D', '1D+3P'],
    ['Dossier de calidad.', '', '1D', '1D', '1D+3P']
  ];

  // Tabla 7.1 · planilla de inspección: [n°, descripción, marcas 'CP DP I R P C A O'] (sección si no lleva marcas y el n° no tiene punto)
  var QA_COLS = ['CP', 'DP', 'I', 'R', 'P', 'C', 'A', 'O'];
  var QA = [
    ['1', 'Plan de calidad del proveedor', 'CP R'], ['2', 'Procedimientos de ensayo no destructivo', ''],
    ['3', 'MATERIALES', null], ['3.1', 'Certificados de materiales', ''], ['3.2', 'Materiales en bruto', ''], ['3.3', 'Listado de materiales subcontratados', ''], ['3.4', 'Materiales', ''],
    ['4', 'PRUEBAS', null], ['4.1', 'Tratamiento térmico', ''], ['4.2', 'Procedimiento de soldadura', ''], ['4.3', 'Calificación de soldadores', ''], ['4.4', 'Pruebas radiográficas', ''],
    ['4.5', 'Pruebas de líquidos penetrantes', ''], ['4.6', 'Pruebas de partículas magnéticas', ''], ['4.7', 'Pruebas de ultrasonido', ''], ['4.8', 'Orientación de la descarga', ''], ['4.9', 'Prueba de operación', 'CP DP R'],
    ['5', 'CONSTRUCCIÓN Y MONTAJE', null], ['5.1', 'Desarme', ''], ['5.2', 'Plan de calidad del proveedor de revestimiento interior', ''], ['5.3', 'Lista de materiales de revestimiento', ''], ['5.4', 'Inspección después de arenado', ''],
    ['5.5', 'Procedimientos de revestimiento', ''], ['5.6', 'Soldaduras internas y externas', ''], ['5.7', 'Dimensiones', 'CP DP R'], ['5.8', 'Inspección interna', 'CP DP'],
    ['6', 'FINAL', null], ['6.1', 'Documentación final', 'CP DP R'], ['6.2', 'Certificado de calibración', 'CP DP R'], ['6.3', 'Presentación', ''], ['6.4', 'Limpieza / pintura', 'CP DP'],
    ['6.5', 'Marca / numeración', 'CP DP R O'], ['6.6', 'Empaque', 'CP DP R O']
  ];

  window.RQ_TIPOS = { tipos: T, DOCS: DOCS, QA: QA, QA_COLS: QA_COLS, SERV_INST: SERV_INST, EXCL_INST: EXCL_INST,
    tipo: function (id) { return T.filter(function (t) { return t.id === id; })[0] || T[0]; } };
})();
