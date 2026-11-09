/* Especificaciones técnicas · equipos agregados junto con las hojas de datos mejoradas · ReyEngi */
(function () {
  'use strict';
  var F = window.ET.familias;
  function fam(id) { return F.filter(function (f) { return f.id === id; })[0]; }
  function p(t) { return { p: t }; }
  function agregar(fid, inst) { var f = fam(fid); if (f && !f.instrumentos.some(function (i) { return i.id === inst.id; })) f.instrumentos.push(inst); }
  function enlazar(fid, iid, das) { var f = fam(fid); if (!f) return; f.instrumentos.forEach(function (i) { if (i.id === iid) i.das = (i.das || []).concat(das); }); }

  agregar('flujo', { id: 'fit-term', t: 'Transmisor de flujo másico térmico', das: ['fit-term'], b: [
    p('El medidor será de dispersión térmica, de inserción o en línea según la hoja de datos, para aire y gases de proceso, con compensación de temperatura y salida {senal}.'),
    p('El proveedor indicará los tramos rectos requeridos y, en los de inserción, incluirá la válvula de inserción en caliente cuando se especifique.')
  ] });

  agregar('flujo', { id: 'fit-parshall', t: 'Medidor de flujo en canaleta Parshall', das: ['fit-parshall'], b: [
    p('La medición de flujo en canal abierto se hará con canaleta Parshall según ISO 9826 / ASTM D1941, con el ancho de garganta indicado en la hoja de datos, y un sensor de nivel ultrasónico o radar ubicado a 2/3 de la longitud de la pared convergente aguas arriba de la cresta, directamente o en un pozo de calma.'),
    p('El transmisor calculará el caudal con la ecuación de descarga Q = K·Ha^n de la canaleta, lo totalizará y entregará salida {senal}, salida de pulsos y relés de alarma.'),
    p('El Contratista verificará la nivelación de la canaleta, el cero en la cota de la cresta y que la relación Hb/Ha no supere el límite de sumergencia. Si lo supera, se medirá Hb y se aplicará la corrección por sumergencia.')
  ] });
  agregar('analisis', { id: 'dit-perc', t: 'Densímetro no nuclear', das: ['dit-perc'], b: [
    p('El densímetro será no invasivo y sin fuente radiactiva, montado sobre la tubería, con compensación de temperatura y salida {senal}.'),
    p('El proveedor informará las condiciones de montaje, los pesos dinámicos para el diseño del soporte y la exactitud esperada para la pulpa indicada en la hoja de datos.')
  ] });
  agregar('analisis', { id: 'ait-orp', t: 'Analizador de potencial redox (ORP)', das: ['ait-orp'], b: [
    p('El sensor será de electrodo metálico (platino u oro) con referencia Ag/AgCl, y el transmisor tendrá salida {senal}, compensación de temperatura y contacto de alarma.')
  ] });
  agregar('analisis', { id: 'froth', t: 'Sistema de visión de espuma de flotación', das: ['froth'], b: [
    p('El sistema medirá en línea las características de la espuma (velocidad, tamaño de burbuja, color y estabilidad) mediante cámaras industriales sobre las celdas, con iluminación propia y limpieza del visor.'),
    p('Incluirá licencias, servidor de análisis e integración con el sistema de control por OPC UA o Modbus TCP, además de configuración, calibración y sintonía en sitio.')
  ] });

  agregar('valvulas', { id: 'xv-sol', t: 'Válvula solenoide de proceso', das: ['xv-sol'], b: [
    p('Las válvulas solenoide serán de 2 vías, de acción directa o servoasistida, con cuerpo y sellos compatibles con el fluido, bobina clase H para servicio continuo y grado de protección NEMA 4X.'),
    p('La posición normal y de falla, la tensión de la bobina y la conexión a proceso serán las indicadas en la hoja de datos.')
  ] });

  agregar('tableros', { id: 'tcv', t: 'Tableros de control neumático de válvulas', das: ['tcv'], b: [
    p('Los tableros agruparán las electroválvulas de mando de las válvulas neumáticas de un área, con bloque distribuidor, unidad de mantenimiento de aire (filtro, regulador con manómetro y separador de agua) y válvula de corte.'),
    p('Cuando se indique, el frontal tendrá pulsadores de abrir y cerrar y luces piloto por válvula. Se dejará un 20 % de capacidad de reserva.')
  ] });

  enlazar('fibra', 'odf', ['odf']);
})();

/* ── Seguridad electrónica: CCTV, control de acceso e intercomunicación ── */
(function () {
  'use strict';
  var ET = window.ET, F = ET.familias;
  function p(t) { return { p: t }; }
  F.push({
    id: 'seguridad', area: 'Seguridad electrónica', sistema: true, etiqueta: 'Componentes incluidos',
    titulo: 'SEGURIDAD ELECTRÓNICA: CCTV Y CONTROL DE ACCESO', objeto: 'los sistemas de videovigilancia (CCTV), control de acceso e intercomunicación',
    normas: ['IEC 62676 (series 1 a 5): Sistemas de videovigilancia para aplicaciones de seguridad', 'IEC 60839-11-1/-2: Sistemas electrónicos de control de acceso – requisitos y aplicación', 'IEC 60839-11-5: Open Supervised Device Protocol (OSDP)', 'ONVIF Perfiles S, G, T, A, C y D', 'IEC 60268-16: Inteligibilidad del habla (STI)', 'IEC 62443: Seguridad de sistemas de automatización y control industrial'],
    alimTexto: 'Los equipos centrales se alimentarán en {alim4h} desde UPS; las cámaras y lectores de terreno por PoE o fuentes supervisadas con respaldo de batería.',
    general: [
      p('Los sistemas serán de arquitectura IP abierta, con equipos de línea de producto vigente y soporte del fabricante por al menos {obsolescencia} años.'),
      p('Las cámaras, grabadores y controladores cumplirán los perfiles ONVIF que correspondan para asegurar la interoperabilidad entre marcas.'),
      p('Los equipos de terreno serán aptos para el ambiente del sitio (polvo, corrosión, vibración y radiación UV) y tendrán protección contra descargas y transientes.'),
      p('Los sistemas se conectarán a una red de seguridad segregada de la red de control, según la ET de ciberseguridad del Proyecto.')
    ],
    instrumentos: [
      { id: 'cam', t: 'Cámaras de videovigilancia', das: ['cam-ptz', 'cam-fija'], b: [
        p('Las cámaras serán IP, de resolución Full HD o superior, con compresión H.265, día/noche con iluminación IR y rango dinámico amplio. Las cámaras de proceso tendrán zoom óptico y movimiento PTZ cuando la hoja de datos lo indique.'),
        p('La ubicación y el campo visual de cada cámara se definirán según el objetivo de observación (detección, observación, reconocimiento o identificación) de IEC 62676-4.')
      ] },
      { id: 'grab', t: 'Grabación y gestión de video (NVR / VMS)', das: ['nvr'], b: [
        p('La grabación será continua y por evento durante los días indicados en la hoja de datos, en arreglos RAID con fuentes redundantes. El proveedor entregará el cálculo de almacenamiento.'),
        p('El software de gestión permitirá visualización en vivo, reproducción, exportación con firma digital, videomuro, usuarios por rol con auditoría e integración con control de acceso y alarmas.')
      ] },
      { id: 'tabcctv', t: 'Tableros de terreno y gabinetes', das: ['tab-cctv', 'gab-com'], b: [
        p('Los tableros de terreno alojarán switch PoE, conversores de medios, fuente de poder y protecciones, en gabinetes aptos para ambiente corrosivo. Los gabinetes de comunicaciones serán rack 19" con PDU, bandeja de fibra y conexión a la malla de tierra.')
      ] },
      { id: 'acceso', t: 'Control de acceso', das: ['ca-ctrl', 'ca-lector', 'ca-puerta', 'ca-torn'], b: [
        p('El sistema de control de acceso cumplirá IEC 60839-11-1, con grado de seguridad definido por el análisis de riesgos del Cliente. Los controladores operarán en forma autónoma ante pérdida de comunicación, con respaldo de batería.'),
        p('Los lectores usarán credenciales de alta seguridad (13,56 MHz con cifrado) e interfaz OSDP v2 con canal seguro. Las puertas en vías de evacuación liberarán la cerradura ante corte de energía o alarma de incendio.'),
        p('Los torniquetes y puertas controladas tendrán antipassback, registro de eventos y verificación por video cuando se integre con el CCTV.')
      ] },
      { id: 'icom', t: 'Intercomunicación industrial', das: ['intercom'], b: [
        p('Las estaciones de intercomunicación serán IP (SIP), manos libres, con cancelación de ruido y nivel de audio adecuado al ruido del área, alcanzando un índice de inteligibilidad STI de 0,5 o mejor.')
      ] }
    ],
    extra: [{ t: 'Pruebas', b: [p('Se realizarán pruebas FAT de configuración e integración y pruebas SAT de cobertura de cada cámara, grabación, conmutación por falla, apertura de puertas y modo de emergencia, con protocolo firmado.')] }],
    refsEt: ['redes', 'fibra', 'ciber', 'pruebas']
  });
})();
