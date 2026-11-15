/* Suite ReyEngi · registro central de entregables.
 * Una sola lista define qué genera la suite: categoría (DOCUMENTO o PLANO), subcategoría, módulo, estado y formatos reales.
 * El explorador, el tablero y el asistente leen de aquí: para sumar un entregable basta agregar una línea a GENERADORES.
 * Estado: AVAILABLE (módulo operativo) · EN_DESARROLLO (todavía no existe el generador; se muestra como tal, sin enlace). */
(function () {
  'use strict';
  var SUB = [
    // DOCUMENTOS DE INGENIERÍA
    ['D01', 'DOCUMENTO', 'Memorias de cálculo'], ['D02', 'DOCUMENTO', 'Criterios y bases de diseño'], ['D03', 'DOCUMENTO', 'Especificaciones técnicas'],
    ['D04', 'DOCUMENTO', 'Hojas de datos'], ['D05', 'DOCUMENTO', 'Listados de ingeniería'], ['D06', 'DOCUMENTO', 'Requisiciones de compra'],
    ['D07', 'DOCUMENTO', 'Informes técnicos'], ['D08', 'DOCUMENTO', 'Protocolos y procedimientos'], ['D09', 'DOCUMENTO', 'Matrices y registros'],
    // PLANOS DE INGENIERÍA
    ['P01', 'PLANO', 'Diagramas P&ID'], ['P02', 'PLANO', 'Diagramas de lazo'], ['P03', 'PLANO', 'Diagramas de bloques'], ['P04', 'PLANO', 'Diagramas unilineales'],
    ['P05', 'PLANO', 'Planos de ubicación'], ['P06', 'PLANO', 'Detalles típicos de montaje'], ['P07', 'PLANO', 'Diagramas de conexionado'],
    ['P08', 'PLANO', 'Canalizaciones y escalerillas'], ['P09', 'PLANO', 'Arquitecturas de control y comunicaciones'], ['P10', 'PLANO', 'Disposición de tableros']
  ].map(function (s) { return { id: s[0], category: s[1], name: s[2] }; });

  // cod: código corto que ya usa la suite (00 a 11 y herramientas); module: ruta relativa a visores/
  var GENERADORES = [
    { id: 'D01-CONDUIT', subcategory: 'D01', cod: 'MC', name: 'Memoria de cálculo de canalizaciones', discipline: 'ELECTRICIDAD', module: 'lazos/#cond', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'PDF'] },
    { id: 'D03-ET', subcategory: 'D03', cod: '04', name: 'Especificaciones técnicas', discipline: 'INSTRUMENTACION', module: 'especificaciones/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Word', 'PDF'] },
    { id: 'D04-HD', subcategory: 'D04', cod: '03', name: 'Hojas de datos', discipline: 'INSTRUMENTACION', module: 'hojas-datos/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'PDF'] },
    { id: 'D05-INST', subcategory: 'D05', cod: '02', name: 'Listado de instrumentos', discipline: 'INSTRUMENTACION', module: 'lazos/#inst', status: 'AVAILABLE', inputFormats: ['Proyecto', 'P&ID'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D05-ES', subcategory: 'D05', cod: '05', name: 'Listado de entradas y salidas', discipline: 'CONTROL', module: 'lazos/#doc', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D05-CIRC', subcategory: 'D05', cod: '07', name: 'Listado de circuitos', discipline: 'ELECTRICIDAD', module: 'lazos/#circ', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D06-REQ', subcategory: 'D06', cod: '11', name: 'Requisiciones de compra', discipline: 'INSTRUMENTACION', module: 'requisiciones/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Word', 'Excel', 'PDF'] },
    { id: 'P01-PID', subcategory: 'P01', cod: '01', name: 'Análisis de P&ID', discipline: 'PROCESOS', module: 'pid/', status: 'AVAILABLE', inputFormats: ['DXF', 'PDF'], outputFormats: ['Excel', 'Word', 'PDF'], note: 'Lee P&ID existentes y extrae instrumentos; no dibuja P&ID.' },
    { id: 'P02-LAZO', subcategory: 'P02', cod: '06', name: 'Diagramas de lazo', discipline: 'CONTROL', module: 'lazos/#lazos', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF'] },
    { id: 'P03-BLQ', subcategory: 'P03', cod: '09', name: 'Diagrama de bloques de control', discipline: 'CONTROL', module: 'lazos/#blq', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF', 'Excel'] },
    { id: 'P04-UNI', subcategory: 'P04', cod: '08', name: 'Unilineales TDI', discipline: 'ELECTRICIDAD', module: 'lazos/#uni', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF', 'Excel'] },
    { id: 'P06-MONT', subcategory: 'P06', cod: '10', name: 'Detalles típicos de montaje', discipline: 'INSTRUMENTACION', module: '#montajes', status: 'AVAILABLE', inputFormats: ['Modelo 3D'], outputFormats: ['PDF', 'DXF', 'PNG'] },
    { id: 'P08-DUCTO', subcategory: 'P08', cod: 'H3', name: 'Canalizaciones: corte de ductos', discipline: 'ELECTRICIDAD', module: 'lazos/#cond', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['DXF', 'PDF'] },
    { id: 'P08-ESC', subcategory: 'P08', cod: 'ES', name: 'Escalerillas portaconductores', discipline: 'ELECTRICIDAD', module: '#escalerillas', status: 'AVAILABLE', inputFormats: ['Modelo 3D'], outputFormats: [], note: 'Visor 3D de selección y montaje.' }
  ];
  var idx = {}; SUB.forEach(function (s) { idx[s.id] = s; });
  GENERADORES.forEach(function (g) { g.category = idx[g.subcategory].category; });
  SUB.forEach(function (s) { s.status = GENERADORES.some(function (g) { return g.subcategory === s.id && g.status === 'AVAILABLE'; }) ? 'AVAILABLE' : 'EN_DESARROLLO'; });
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  window.RE_ENTREGABLES = {
    subcategorias: SUB, generadores: GENERADORES,
    de: function (categoria) { return SUB.filter(function (s) { return s.category === categoria; }).map(function (s) { return { sub: s, gens: GENERADORES.filter(function (g) { return g.subcategory === s.id; }) }; }); },
    registrar: function (g) { if (!g || !g.id || !idx[g.subcategory] || GENERADORES.some(function (x) { return x.id === g.id; })) return false; g.category = idx[g.subcategory].category; GENERADORES.push(g); if (g.status === 'AVAILABLE') idx[g.subcategory].status = 'AVAILABLE'; return true; },
    buscar: function (texto) {
      var q = norm(texto).split(/\s+/).filter(Boolean);
      return GENERADORES.filter(function (g) { var t = norm([g.id, g.name, g.discipline, idx[g.subcategory].name, g.category].join(' ')); return q.every(function (w) { return t.indexOf(w) >= 0; }); });
    }
  };
})();
