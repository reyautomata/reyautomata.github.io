/* Suite ReyEngi · registro central de entregables.
 * Una sola lista define qué genera la suite: categoría (DOCUMENTO o PLANO), subcategoría, módulo, estado y formatos reales.
 * El explorador, el tablero y el asistente leen de aquí: para sumar un entregable basta agregar una línea a GENERADORES.
 * Estado: AVAILABLE (módulo operativo) · EN_DESARROLLO (todavía no existe el generador; se muestra como tal, sin enlace). */
(function () {
  'use strict';
  // Nombre de la carpeta de cada subcategoría dentro del proyecto (explorador de archivos)
  var CARP = { D01: 'Memorias_Calculo', D02: 'Criterios_Diseno', D03: 'Especificaciones', D04: 'Hojas_Datos', D05: 'Listados', D06: 'Requisiciones', D07: 'Informes', D08: 'Protocolos', D09: 'Matrices_Registros',
    P01: 'P&ID', P02: 'Diagramas_Lazo', P03: 'Diagramas_Bloques', P04: 'Unilineales', P05: 'Ubicacion', P06: 'Detalles_Montaje', P07: 'Conexionado', P08: 'Canalizaciones', P09: 'Arquitecturas', P10: 'Disposicion_Tableros' };
  var SUB = [
    // DOCUMENTOS DE INGENIERÍA
    ['D01', 'DOCUMENTO', 'Memorias de cálculo'], ['D02', 'DOCUMENTO', 'Criterios y bases de diseño'], ['D03', 'DOCUMENTO', 'Especificaciones técnicas'],
    ['D04', 'DOCUMENTO', 'Hojas de datos'], ['D05', 'DOCUMENTO', 'Listados de ingeniería'], ['D06', 'DOCUMENTO', 'Requisiciones de compra'],
    ['D07', 'DOCUMENTO', 'Informes técnicos'], ['D08', 'DOCUMENTO', 'Protocolos y procedimientos'], ['D09', 'DOCUMENTO', 'Matrices y registros'],
    // PLANOS DE INGENIERÍA
    ['P01', 'PLANO', 'Diagramas P&ID'], ['P02', 'PLANO', 'Diagramas de lazo'], ['P03', 'PLANO', 'Diagramas de bloques'], ['P04', 'PLANO', 'Diagramas unilineales'],
    ['P05', 'PLANO', 'Planos de ubicación'], ['P06', 'PLANO', 'Detalles típicos de montaje'], ['P07', 'PLANO', 'Diagramas de conexionado'],
    ['P08', 'PLANO', 'Canalizaciones y escalerillas'], ['P09', 'PLANO', 'Arquitecturas de control y comunicaciones'], ['P10', 'PLANO', 'Disposición de tableros']
  ].map(function (s) { return { id: s[0], category: s[1], name: s[2], folder: s[0] + '_' + CARP[s[0]] }; });

  // cod: código corto que ya usa la suite (00 a 11 y herramientas); module: ruta relativa a visores/
  var GENERADORES = [
    { id: 'D01-CONDUIT', subcategory: 'D01', cod: 'MC', name: 'Memoria de cálculo de canalizaciones', discipline: 'ELECTRICIDAD', module: 'lazos/#cond', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'PDF'] },
    { id: 'D03-ET', subcategory: 'D03', cod: '04', name: 'Especificaciones técnicas', discipline: 'INSTRUMENTACION', module: 'especificaciones/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Word', 'PDF'] },
    { id: 'D04-HD', subcategory: 'D04', cod: '03', name: 'Hojas de datos', discipline: 'INSTRUMENTACION', module: 'hojas-datos/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'PDF'] },
    { id: 'D05-INST', subcategory: 'D05', cod: '02', name: 'Listado de instrumentos', discipline: 'INSTRUMENTACION', module: 'lazos/#inst', status: 'AVAILABLE', inputFormats: ['Proyecto', 'P&ID'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D05-ES', subcategory: 'D05', cod: '05', name: 'Listado de entradas y salidas', discipline: 'CONTROL', module: 'lazos/#doc', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D05-CIRC', subcategory: 'D05', cod: '07', name: 'Listado de circuitos', discipline: 'ELECTRICIDAD', module: 'lazos/#circ', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D05-MAT', subcategory: 'D05', cod: '12', name: 'Listado de materiales', discipline: 'INSTRUMENTACION', module: 'lazos/#mat', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Excel', 'Word', 'PDF'] },
    { id: 'D06-REQ', subcategory: 'D06', cod: '11', name: 'Requisiciones de compra', discipline: 'INSTRUMENTACION', module: 'requisiciones/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['Word', 'Excel', 'PDF'] },
    { id: 'P01-PID', subcategory: 'P01', cod: '01', name: 'Análisis de P&ID', discipline: 'PROCESOS', module: 'pid/', status: 'AVAILABLE', inputFormats: ['DXF', 'PDF'], outputFormats: ['Excel', 'Word', 'PDF'], note: 'Lee P&ID existentes y extrae instrumentos; no dibuja P&ID.' },
    { id: 'P02-LAZO', subcategory: 'P02', cod: '06', name: 'Diagramas de lazo', discipline: 'CONTROL', module: 'lazos/#lazos', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF'] },
    { id: 'P03-BLQ', subcategory: 'P03', cod: '09', name: 'Diagrama de bloques de control', discipline: 'CONTROL', module: 'lazos/#blq', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF', 'Excel'] },
    { id: 'P04-UNI', subcategory: 'P04', cod: '08', name: 'Unilineales TDI', discipline: 'ELECTRICIDAD', module: 'lazos/#uni', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['PDF', 'DXF', 'Excel'] },
    { id: 'P06-MONT', subcategory: 'P06', cod: '10', name: 'Detalles típicos de montaje', discipline: 'INSTRUMENTACION', module: '#montajes', status: 'AVAILABLE', inputFormats: ['Modelo 3D'], outputFormats: ['PDF', 'DXF', 'PNG'] },
    { id: 'P08-DUCTO', subcategory: 'P08', cod: 'H3', name: 'Canalizaciones: corte de ductos', discipline: 'ELECTRICIDAD', module: 'lazos/#cond', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['DXF', 'PDF'] },
    { id: 'P08-ESC', subcategory: 'P08', cod: 'ES', name: 'Escalerillas portaconductores', discipline: 'ELECTRICIDAD', module: '#escalerillas', status: 'AVAILABLE', inputFormats: ['Modelo 3D'], outputFormats: [], note: 'Visor 3D de selección y montaje.' },
    { id: 'P09-ARQ', subcategory: 'P09', cod: 'AR', name: 'Arquitectura de control', discipline: 'CONTROL', module: 'arquitectura/', status: 'AVAILABLE', inputFormats: ['Proyecto'], outputFormats: ['SVG', 'PDF'], note: 'Se dibuja desde las tarjetas, gabinetes y cajas de conexiones del proyecto.' }
  ];
  // Fases de ingeniería y alcance de cada generador en cada una (vacío = no aplica en esa fase).
  // La fase sale del dato «Fase de ingeniería» del proyecto activo; el explorador atenúa lo que no aplica.
  var FASES = [
    { id: 'PF', t: 'Prefactibilidad', d: 'Alternativas y orden de magnitud: criterios generales, arquitectura preliminar y materiales paramétricos.' },
    { id: 'CO', t: 'Conceptual', d: 'Alternativa seleccionada: P&ID preliminares, índice de instrumentos y E/S estimados, arquitectura conceptual.' },
    { id: 'BA', t: 'Básica', d: 'Definición para compra de equipos mayores: índice y E/S firmes, hojas de datos, especificaciones, lazos típicos y requisiciones.' },
    { id: 'DE', t: 'Detalle', d: 'Ingeniería para construcción: todos los lazos, conexionados, montajes, circuitos, canalizaciones y materiales.' }
  ];
  var ALCANCE = {
    'D01-CONDUIT': { BA: 'Preliminar', DE: 'Sí' }, 'D03-ET': { BA: 'Sí', DE: 'Actualización' }, 'D04-HD': { BA: 'Sí', DE: 'Actualización' },
    'D05-INST': { CO: 'Preliminar', BA: 'Sí', DE: 'Sí' }, 'D05-ES': { CO: 'Estimado', BA: 'Sí', DE: 'Sí' }, 'D05-CIRC': { DE: 'Sí' },
    'D05-MAT': { PF: 'Paramétrico', CO: 'Estimado', BA: 'Sí', DE: 'Sí' }, 'D06-REQ': { BA: 'Equipos mayores', DE: 'Sí' },
    'P01-PID': { CO: 'Preliminar', BA: 'Sí', DE: 'Sí' }, 'P02-LAZO': { BA: 'Típicos', DE: 'Todos' }, 'P03-BLQ': { CO: 'Conceptual', BA: 'Sí', DE: 'Sí' },
    'P04-UNI': { BA: 'Preliminar', DE: 'Sí' }, 'P06-MONT': { BA: 'Típicos', DE: 'Sí' }, 'P08-DUCTO': { DE: 'Sí' }, 'P08-ESC': { BA: 'Preliminar', DE: 'Sí' },
    'P09-ARQ': { PF: 'Preliminar', CO: 'Conceptual', BA: 'Sí', DE: 'Sí' }
  };
  GENERADORES.forEach(function (g) { g.fases = ALCANCE[g.id] || { PF: 'Sí', CO: 'Sí', BA: 'Sí', DE: 'Sí' }; });
  function faseDe(texto) {   // «Ingeniería de detalles», «Básica», «Conceptual»… → PF · CO · BA · DE
    var t = String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/prefact/.test(t)) return 'PF'; if (/concep|perfil/.test(t)) return 'CO'; if (/basic/.test(t)) return 'BA'; return 'DE';
  }
  function faseActiva() { try { var a = window.REProyectos && window.REProyectos.activo(); return faseDe(a && a.fase); } catch (e) { return 'DE'; } }
  var idx = {}; SUB.forEach(function (s) { idx[s.id] = s; });
  GENERADORES.forEach(function (g) { g.category = idx[g.subcategory].category; });
  SUB.forEach(function (s) { s.status = GENERADORES.some(function (g) { return g.subcategory === s.id && g.status === 'AVAILABLE'; }) ? 'AVAILABLE' : 'EN_DESARROLLO'; });
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  window.RE_ENTREGABLES = {
    subcategorias: SUB, generadores: GENERADORES, FASES: FASES, faseDe: faseDe, faseActiva: faseActiva,
    nombreFase: function (id) { var f = FASES.filter(function (x) { return x.id === id; })[0]; return f ? f.t : ''; },
    porCod: function (cod) { return GENERADORES.filter(function (g) { return g.cod === cod; })[0] || null; },
    aplica: function (g, fase) { return !g || !g.fases || !!g.fases[fase || faseActiva()]; },
    de: function (categoria) { return SUB.filter(function (s) { return s.category === categoria; }).map(function (s) { return { sub: s, gens: GENERADORES.filter(function (g) { return g.subcategory === s.id; }) }; }); },
    registrar: function (g) { if (!g || !g.id || !idx[g.subcategory] || GENERADORES.some(function (x) { return x.id === g.id; })) return false; g.category = idx[g.subcategory].category; GENERADORES.push(g); if (g.status === 'AVAILABLE') idx[g.subcategory].status = 'AVAILABLE'; return true; },
    buscar: function (texto) {
      var q = norm(texto).split(/\s+/).filter(Boolean);
      return GENERADORES.filter(function (g) { var t = norm([g.id, g.name, g.discipline, idx[g.subcategory].name, g.category].join(' ')); return q.every(function (w) { return t.indexOf(w) >= 0; }); });
    }
  };
})();
