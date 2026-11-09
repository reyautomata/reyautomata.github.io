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
