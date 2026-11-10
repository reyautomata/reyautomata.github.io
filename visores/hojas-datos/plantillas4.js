/* Hojas de datos · seguridad electrónica: CCTV, control de acceso e intercomunicación · ReyEngi
 * Estructura basada en hojas de datos de sistemas CCTV y comunicaciones de proyectos mineros
 * (cámaras IP, tableros de terreno, gabinete de comunicaciones) y en IEC 62676 (videovigilancia),
 * IEC 60839-11 (control de acceso), OSDP (IEC 60839-11-5) y perfiles ONVIF. Datos genéricos.
 */
(function () {
  'use strict';

  var HD = window.HD, U = HD.util, P = HD.plantillas;
  var f = U.f, S = U.S, GENERAL = U.GENERAL, SITIO = U.SITIO, REQUISITOS = U.REQUISITOS, C_TAG = U.C_TAG;
  var TA = HD.TA, EPV = HD.EPV, REQ = 'Requerido';
  var G = 'Seguridad electrónica';
  var C_UBIC = { t: 'UBICACIÓN', w: 24 }, C_PLANO = { t: 'PLANO / DIAGRAMA DE BLOQUES', w: 18 }, C_REV = { t: 'REV', w: 5 };

  function agrega(def) { def.grupo = G; def.visores = []; def.notas = def.notas || []; P.push(def); }
  function SERV(extra) {
    return { s: 'SERVICIOS', r: [f('Ingeniería y configuración', '', REQ), f('Pruebas FAT', '', REQ), f('Instalación y pruebas SAT', '', TA),
      f('Puesta en marcha', '', REQ), f('Capacitación', '', REQ), f('Soporte y garantía', 'años', '≥ 1')].concat(extra || []) };
  }
  function CERT() { var r = REQUISITOS(); r.s = 'CERTIFICADOS Y DOCUMENTOS'; return r; }
  var NOTA_COMPAT = 'En ampliaciones, el equipamiento será 100 % compatible en hardware, software y firmware con el sistema existente.';

  // ── CCTV ──────────────────────────────────────────────────────────────────────────
  agrega({
    id: 'cam-ptz', tag: 'CCTV', titulo: 'Cámara IP tipo domo PTZ', hoja: 'CÁMARA IP TIPO DOMO PTZ',
    secciones: [GENERAL(), SITIO(),
      { s: 'IMAGEN', r: [f('Sensor de imagen', '', 'CMOS progresivo ≥ 1/2,8"'), f('Resolución', '', '1920 × 1080 (Full HD) o superior'), f('Cuadros por segundo', 'fps', '30 a resolución máxima'),
        f('Zoom óptico / digital', '', '≥ 30× / 16×'), f('Lente', '', 'Varifocal motorizado, auto-iris'), f('Sensibilidad color / B-N', 'lux', '≤ 0,005 / ≤ 0,0005'),
        f('Visión nocturna', '', 'Día/noche con filtro IR removible; iluminador IR ≥ 150 m (TA)'), f('Rango dinámico (WDR)', 'dB', '≥ 120'),
        f('Compensación de contraluz, ganancia y enfoque automáticos', '', REQ), f('Estabilización de imagen', '', REQ), f('Desempañador / limpiaparabrisas', '', TA)] },
      { s: 'MOVIMIENTO', r: [f('Giro horizontal (pan)', '°', '360 continuo'), f('Inclinación (tilt)', '°', '-20 a 90, auto-flip'), f('Posiciones predefinidas / rondas', '', '≥ 256 / ≥ 8')] },
      { s: 'RED Y VIDEO', r: [f('Compresión', '', 'H.265 / H.264, múltiples flujos'), f('Protocolos', '', 'TCP/IP, RTSP, RTP/RTCP, HTTPS, NTP, SNMP v3, 802.1X'),
        f('Compatibilidad', '', 'ONVIF Perfil S, G y T'), f('Analítica de video', '', TA), f('Puerto', '', 'RJ45 / SFP (TA)'), f('Ciberseguridad', '', 'Firmware firmado, HTTPS, cuentas por rol')] },
      { s: 'CONSTRUCCIÓN', r: [f('Alimentación', '', 'PoE++ (802.3bt) / 24 VAC (TA)'), f('Consumo', 'W', EPV), f('Material de carcasa', '', 'Aluminio / acero inoxidable (ambiente corrosivo)'),
        f('Grado de protección', '', 'IP66 / IK10 / NEMA 4X'), f('Temperatura de operación', '°C', '-30 a 60'), f('Soporte', '', 'A muro, poste o pedestal (TA)'), f('Protección contra descargas', '', REQ)] },
      SERV(), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'VISTA / OBJETIVO', w: 22 }, { t: 'TABLERO DE TERRENO', w: 14 }, { t: 'SOPORTE', w: 10 }, { t: 'ALIMENTACIÓN', w: 10 }, C_PLANO, C_REV],
      filas: [['2300-CCTV-0901', 'Plataforma celdas de flotación', 'Labios de rebalse banco rougher', '2300-FR-0902', 'Poste', 'PoE', '—', 'A'],
        ['2100-CCTV-0902', 'Torre de traspaso', 'Chute de descarga CV-001', '2100-FR-0901', 'Muro', '24 VAC', '—', 'A']] },
    notas: [NOTA_COMPAT, 'El Vendedor debe incluir los patch cords desde cada cámara hasta su tablero de terreno.']
  });

  agrega({
    id: 'cam-fija', tag: 'CCTV', titulo: 'Cámara IP fija (bullet / domo)', hoja: 'CÁMARA IP FIJA',
    secciones: [GENERAL(), SITIO(),
      { s: 'IMAGEN', r: [f('Tipo', '', 'Bullet / minidomo (TA)'), f('Resolución', '', '≥ 4 MP'), f('Lente', '', 'Varifocal motorizado (TA)'), f('Ángulo horizontal', '°', TA),
        f('Iluminación IR', 'm', TA), f('Rango dinámico (WDR)', 'dB', '≥ 120'), f('Analítica de video', '', 'Cruce de línea, intrusión, LPR (TA)')] },
      { s: 'RED Y VIDEO', r: [f('Compresión', '', 'H.265 / H.264'), f('Compatibilidad', '', 'ONVIF Perfil S, G y T'), f('Almacenamiento local', '', 'Ranura microSD (respaldo)'), f('Ciberseguridad', '', 'HTTPS, 802.1X, firmware firmado')] },
      { s: 'CONSTRUCCIÓN', r: [f('Alimentación', '', 'PoE (802.3af/at)'), f('Grado de protección', '', 'IP67 / IK10'), f('Temperatura de operación', '°C', '-30 a 60'), f('Soporte', '', TA)] },
      SERV(), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'VISTA / OBJETIVO', w: 22 }, { t: 'TIPO', w: 9 }, { t: 'LENTE', w: 10 }, { t: 'ANALÍTICA', w: 12 }, C_PLANO, C_REV],
      filas: [['0100-CCTV-0101', 'Portería principal', 'Acceso vehicular, lectura de patentes', 'Bullet', '8–32 mm', 'LPR', '—', 'A'],
        ['0300-CCTV-0102', 'Sala eléctrica', 'Interior sala', 'Minidomo', '2,8–12 mm', 'Intrusión', '—', 'A']] }
  });

  agrega({
    id: 'nvr', tag: 'NVR', titulo: 'Grabador de video en red (NVR / VMS)', hoja: 'GRABADOR DE VIDEO EN RED Y SOFTWARE VMS',
    secciones: [GENERAL(), SITIO(),
      { s: 'GRABADOR / SERVIDOR', r: [f('Tipo', '', 'NVR dedicado / servidor con VMS (TA)'), f('Canales IP', 'cant.', TA), f('Licencias de cámara', 'cant.', 'Canales + 20 % de reserva'),
        f('Ancho de banda de entrada', 'Mbps', EPV), f('Almacenamiento', 'días', 'TA, a resolución completa y 15 fps'), f('Capacidad de disco', 'TB', 'Según cálculo (EPV)'),
        f('Arreglo de discos', '', 'RAID 5 / 6, discos de vigilancia intercambiables en caliente'), f('Fuente de poder', '', 'Redundante'), f('Montaje', '', 'Rack 19"')] },
      { s: 'SOFTWARE VMS', r: [f('Compatibilidad', '', 'ONVIF Perfil S / G / T'), f('Clientes de visualización', 'cant.', TA), f('Videomuro', '', TA),
        f('Usuarios y permisos', '', 'Por rol, con registro de auditoría'), f('Exportación de video', '', 'Con marca de agua y firma digital'), f('Integración', '', 'Control de acceso, alarmas, SCADA (TA)'),
        f('Sincronización horaria', '', 'NTP')] },
      SERV([f('Cálculo de almacenamiento', '', REQ)]), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'CANALES', w: 8 }, { t: 'DÍAS GRAB.', w: 8 }, { t: 'TB ÚTILES', w: 8 }, { t: 'CLIENTES', w: 8 }, { t: 'VIDEOMURO', w: 10 }, C_PLANO, C_REV],
      filas: [['0150-NVR-001', 'Sala de control central, rack 0150-FR-901', '64', '30', '96', '4', '2 × 2 pantallas', '—', 'A']] },
    notas: [NOTA_COMPAT]
  });

  agrega({
    id: 'tab-cctv', tag: 'FR', titulo: 'Tablero de terreno de CCTV', hoja: 'TABLERO DE TERRENO DE CCTV Y COMUNICACIONES',
    secciones: [GENERAL(), SITIO(),
      { s: 'GABINETE', r: [f('Material', '', 'Acero inoxidable AISI 304/316 / poliéster reforzado (TA)'), f('Grado de protección', '', TA), f('Dimensiones', 'mm', EPV),
        f('Carriles DIN y placa de montaje', '', REQ), f('Mini bandeja óptica', '', '12 puertos LC'), f('Barra de tierra', '', REQ), f('Protección', '', 'Interruptor termomagnético por circuito'),
        f('Supresor de transientes', '', 'Alimentación y red'), f('Entrada de cables', '', 'Inferior'), f('Iluminación y portaplanos', '', REQ), f('Soporte de fijación exterior', '', TA)] },
      { s: 'EQUIPAMIENTO', r: [f('Switch industrial', '', 'Administrable, puertos PoE según cámaras (TA)'), f('Conversor de medios', '', 'Industrial, FO monomodo LC / RJ45, riel DIN (TA)'),
        f('Fuente de poder', '', '120 VAC / 24 VDC, modular, con LED de estado'), f('Transformador para cámaras', '', '120 / 24 VAC (TA)'), f('Reserva de espacio', '%', '20')] },
      SERV([f('Instalación en terreno', '', TA)]), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'CÁMARAS ASOCIADAS', w: 22 }, { t: 'PUERTOS PoE', w: 8 }, { t: 'ENLACE', w: 12 }, { t: 'PROTECCIÓN', w: 10 }, C_PLANO, C_REV],
      filas: [['2300-FR-0902', 'Plataforma celdas', '2300-CCTV-0901 / 0903', '8', 'FO monomodo', 'NEMA 4X', '—', 'A']] },
    notas: ['Los materiales del tablero serán aptos para ambiente corrosivo y húmedo.']
  });

  agrega({
    id: 'gab-com', tag: 'FR', titulo: 'Gabinete de comunicaciones (rack)', hoja: 'GABINETE DE COMUNICACIONES',
    secciones: [GENERAL(), SITIO(),
      { s: 'GABINETE', r: [f('Tipo', '', 'Rack metálico 19"'), f('Capacidad', 'U', '42 (TA)'), f('Dimensiones (alto × ancho × fondo)', 'mm', '2000 × 800 × 1000 (TA)'),
        f('Puertas', '', 'Delantera de vidrio, trasera metálica, con llave'), f('Grado de protección', '', 'NEMA 12 / IP54 (interior)'), f('Capacidad de carga', 'kg', EPV),
        f('Anclaje', '', 'A piso, apto para sismo'), f('Ordenadores de cable', '', 'Horizontales y verticales'), f('Ventilación', '', 'Ventiladores con termostato (TA)')] },
      { s: 'EQUIPAMIENTO', r: [f('Bandeja de fibra óptica con pigtails', '', REQ), f('PDU', '', '120 VAC, con protección, montaje inferior'), f('Conexión a malla de tierra', '', REQ),
        f('Equipos a alojar', '', 'Switches, NVR, servidores (TA)'), f('Reserva de espacio', '%', '30')] },
      SERV([f('Armado y alambrado del gabinete', '', REQ)]), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'CAPACIDAD (U)', w: 8 }, { t: 'DIMENSIONES (mm)', w: 16 }, { t: 'EQUIPOS', w: 22 }, C_PLANO, C_REV],
      filas: [['0150-FR-901', 'Sala de control central', '42', '2000 × 800 × 1000', 'Switch núcleo, NVR, ODF', '—', 'A']] }
  });

  // ── Control de acceso ───────────────────────────────────────────────────────────────
  agrega({
    id: 'ca-ctrl', tag: 'ACS', titulo: 'Controlador de control de acceso', hoja: 'CONTROLADOR DE CONTROL DE ACCESO',
    secciones: [GENERAL(), SITIO(),
      { s: 'CONTROLADOR', r: [f('Puertas / lectores por controlador', 'cant.', TA), f('Entradas supervisadas', 'cant.', 'Sensor de puerta y pulsador de salida por puerta'),
        f('Salidas de relé', 'cant.', 'Una por cerradura + auxiliares'), f('Interfaz de lectores', '', 'OSDP v2 con canal seguro (IEC 60839-11-5) / Wiegand (TA)'),
        f('Capacidad de usuarios / eventos', '', '≥ 50.000 / ≥ 100.000'), f('Operación autónoma', '', 'Sí, sin conexión al servidor'), f('Funciones', '', 'Antipassback, esclusa, horarios, doble credencial'),
        f('Comunicación', '', 'Ethernet TCP/IP cifrada'), f('Sincronización horaria', '', 'NTP'), f('Alimentación', '', '12/24 VDC con fuente supervisada'),
        f('Respaldo de batería', 'h', '≥ 4'), f('Tamper de gabinete', '', REQ), f('Gabinete', '', 'Metálico con cerradura, NEMA 4X en terreno')] },
      { s: 'SOFTWARE', r: [f('Software de gestión', '', 'Licencias para puertas y usuarios del proyecto + 20 %'), f('Integración', '', 'CCTV (verificación por video), RR.HH., alarmas (TA)'),
        f('Grado de seguridad', '', 'IEC 60839-11-1, grado según análisis de riesgos'), f('Registro y reportes', '', 'Eventos, asistencia, auditoría')] },
      SERV(), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'PUERTAS', w: 8 }, { t: 'LECTORES', w: 8 }, { t: 'FUNCIONES', w: 18 }, { t: 'RED', w: 10 }, C_PLANO, C_REV],
      filas: [['0100-ACS-001', 'Portería principal', '4', '6', 'Torniquetes, antipassback', 'Ethernet', '—', 'A'],
        ['0300-ACS-002', 'Salas eléctricas', '6', '6', 'Acceso restringido por rol', 'Ethernet', '—', 'A']] },
    notas: ['Las puertas de vías de evacuación liberarán la cerradura ante corte de energía o alarma de incendio (falla segura).']
  });

  agrega({
    id: 'ca-lector', tag: 'RDR', titulo: 'Lector de credenciales', hoja: 'LECTOR DE CREDENCIALES DE CONTROL DE ACCESO',
    secciones: [GENERAL(), SITIO(),
      { s: 'LECTOR', r: [f('Tecnología', '', 'Tarjeta sin contacto 13,56 MHz (MIFARE DESFire EV2/EV3) (TA)'), f('Lectura adicional', '', 'Teclado PIN / biométrico / móvil BLE-NFC (TA)'),
        f('Distancia de lectura', 'cm', '≥ 5'), f('Interfaz', '', 'OSDP v2 canal seguro (preferente) / Wiegand'), f('Indicación', '', 'LED multicolor y zumbador'),
        f('Alimentación', '', '12 VDC desde el controlador'), f('Grado de protección', '', 'IP65 / IK08 en exterior'), f('Temperatura de operación', '°C', '-25 a 60'), f('Montaje', '', 'Muro / pedestal (TA)')] },
      { s: 'CREDENCIALES', r: [f('Tarjetas', 'cant.', TA), f('Personalización', '', 'Impresión con foto (TA)'), f('Claves de seguridad', '', 'Propias del Cliente, no por defecto')] },
      CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'PUERTA / ACCESO', w: 18 }, { t: 'SENTIDO', w: 8 }, { t: 'TECNOLOGÍA', w: 14 }, { t: 'CONTROLADOR', w: 12 }, C_PLANO, C_REV],
      filas: [['0100-RDR-001', 'Portería principal', 'Torniquete 1', 'Entrada', 'Tarjeta + biométrico', '0100-ACS-001', '—', 'A'],
        ['0100-RDR-002', 'Portería principal', 'Torniquete 1', 'Salida', 'Tarjeta', '0100-ACS-001', '—', 'A']] }
  });

  agrega({
    id: 'ca-puerta', tag: 'DL', titulo: 'Cerradura y accesorios de puerta', hoja: 'CERRADURA Y ACCESORIOS DE PUERTA CONTROLADA',
    secciones: [GENERAL(), SITIO(),
      { s: 'CERRADURA', r: [f('Tipo', '', 'Electroimán / cerradura eléctrica de embutir (TA)'), f('Fuerza de retención', 'kgf', '≥ 600 (electroimán)'), f('Modo', '', 'Falla segura / falla asegurada (TA)'),
        f('Alimentación', '', '12/24 VDC'), f('Sensor de estado de cerradura', '', REQ), f('Material', '', 'Acero inoxidable / aluminio anodizado'), f('Grado de protección', '', 'IP65 en exterior')] },
      { s: 'ACCESORIOS', r: [f('Sensor magnético de puerta', '', REQ), f('Pulsador de salida', '', 'Sin contacto / mecánico (TA)'), f('Pulsador de emergencia (rompe vidrio)', '', 'En vías de evacuación'),
        f('Cierrapuertas', '', TA), f('Protección de diodo / varistor', '', REQ)] },
      CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'PUERTA', w: 16 }, { t: 'TIPO', w: 12 }, { t: 'MODO', w: 10 }, { t: 'EVACUACIÓN', w: 9 }, C_PLANO, C_REV],
      filas: [['0300-DL-001', 'Sala eléctrica 2200', 'Puerta principal', 'Electroimán', 'Falla segura', 'Sí', '—', 'A']] }
  });

  agrega({
    id: 'ca-torn', tag: 'TRN', titulo: 'Torniquete de control de acceso', hoja: 'TORNIQUETE DE CONTROL DE ACCESO',
    secciones: [GENERAL(), SITIO(),
      { s: 'TORNIQUETE', r: [f('Tipo', '', 'Cuerpo completo / trípode / puerta batiente (TA)'), f('Sentido', '', 'Bidireccional, controlado'), f('Material', '', 'Acero inoxidable AISI 304/316'),
        f('Caudal', 'personas/min', '≥ 20'), f('Modo ante corte de energía', '', 'Libre paso (evacuación) / bloqueado (TA)'), f('Integración de lectores', '', 'Entrada y salida'),
        f('Señalización', '', 'Pictogramas LED de paso'), f('Alimentación', '', '220 VAC / 24 VDC'), f('Grado de protección', '', 'IP54 o superior; techo en exterior (TA)'), f('Ciclos MCBF', '', '≥ 3.000.000')] },
      SERV([f('Obras civiles de anclaje', '', TA)]), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'TIPO', w: 12 }, { t: 'CANTIDAD DE PASOS', w: 9 }, { t: 'LECTORES', w: 14 }, { t: 'TECHO', w: 7 }, C_PLANO, C_REV],
      filas: [['0100-TRN-001', 'Portería principal', 'Cuerpo completo', '2', '0100-RDR-001 / 002', 'Sí', '—', 'A']] }
  });

  // ── Intercomunicación ───────────────────────────────────────────────────────────────
  agrega({
    id: 'intercom', tag: 'ICS', titulo: 'Intercomunicador industrial IP', hoja: 'INTERCOMUNICADOR INDUSTRIAL IP',
    secciones: [GENERAL(), SITIO(),
      { s: 'EQUIPO', r: [f('Tipo', '', 'Estación de terreno manos libres / con auricular (TA)'), f('Protocolo', '', 'SIP sobre IP'), f('Nivel de audio', 'dB(A) @ 1 m', '≥ 100'),
        f('Cancelación de ruido', '', REQ), f('Inteligibilidad', '', 'STI ≥ 0,5 (IEC 60268-16)'), f('Pulsadores', '', 'Llamada / emergencia (TA)'), f('Salida para baliza o parlante externo', '', TA),
        f('Alimentación', '', 'PoE (802.3af/at)'), f('Material', '', 'Aluminio / acero inoxidable'), f('Grado de protección', '', 'IP66 / IK09'), f('Temperatura de operación', '°C', '-30 a 60')] },
      { s: 'SISTEMA', r: [f('Servidor / central', '', 'Existente / nuevo (TA)'), f('Integración', '', 'Megafonía, CCTV (cámara asociada), radio (TA)')] },
      SERV(), CERT()],
    aplicacion: { columnas: [C_TAG, C_UBIC, { t: 'TIPO', w: 14 }, { t: 'NIVEL DE RUIDO (dB)', w: 9 }, { t: 'CÁMARA ASOCIADA', w: 14 }, C_PLANO, C_REV],
      filas: [['2200-ICS-001', 'Piso de operación molino SAG', 'Manos libres', '95', '2200-CCTV-0905', '—', 'A']] }
  });
})();

/* Enlace de las hojas de datos con los visores 3D de equipos (visores/equipos/visores-equipos.js) */
(function () {
  'use strict';
  var ENLACES = {
    'eq-temperatura': ['tit', 'tsh'], 'eq-flujo2': ['fit-vortex', 'fit-term'], 'eq-parshall': ['fit-parshall'], 'eq-valvula-control': ['fcv'], 'eq-nivel2': ['lit-us', 'lsw-vib'], 'eq-presion-sw': ['psh'],
    'eq-analizadores': ['ait-cond', 'ait-turb', 'ait-orp', 'ait-gas', 'dit-perc', 'froth'], 'eq-solenoide': ['xv-sol', 'tcv'],
    'eq-correa': ['zs-des', 'ss-cero', 'ls-tilt', 'zs-cp'], 'eq-plc': ['plc', 'gab'],
    'eq-comunicaciones': ['sw-eth', 'odf', 'gab-com', 'jb', 'tab-cctv', 'cab-inst', 'cab-fo'], 'eq-cctv': ['cam-ptz', 'cam-fija', 'nvr', 'tab-cctv'],
    'eq-acceso': ['ca-ctrl', 'ca-lector', 'ca-puerta', 'ca-torn'], 'eq-intercom': ['intercom'], 'eq-soportes-paneles': ['pit', 'jb'], 'rocket-m5-omni': ['radio-ptp']
  };
  var P = window.HD.plantillas;
  Object.keys(ENLACES).forEach(function (v) {
    ENLACES[v].forEach(function (id) {
      P.forEach(function (p) { if (p.id === id) { p.visores = p.visores || []; if (p.visores.indexOf(v) < 0) p.visores.push(v); } });
    });
  });
})();
