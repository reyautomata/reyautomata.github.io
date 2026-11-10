/* Configuración de planta del simulador de espesamiento · Suite ReyEngi
 * Roles de equipos e instrumentos con tags genéricos. Una configuración extraída de un modelo 3D del proyecto
 * (Navisworks, Plant 3D) se importa como JSON y queda guardada solo en el proyecto activo de este navegador.
 */
(function () {
  'use strict';
  var ROLES = [
    // [rol, grupo, descripción, tag genérico]
    ['thk', 'Espesador', 'Espesador de relaves de alta capacidad', 'THK-01'],
    ['uf1', 'Descarga', 'Bomba centrífuga de descarga A (duty)', 'PP-01A'],
    ['uf2', 'Descarga', 'Bomba centrífuga de descarga B (standby)', 'PP-01B'],
    ['rec', 'Descarga', 'Bomba de recirculación de descarga', 'PP-02'],
    ['loop', 'Descarga', 'Bomba de loop de pruebas', 'PP-03'],
    ['stp', 'Floculante', 'Planta de preparación de floculante', 'FLP-01'],
    ['tkf1', 'Floculante', 'Estanque de solución de floculante A', 'TK-01A'],
    ['tkf2', 'Floculante', 'Estanque de solución de floculante B', 'TK-01B'],
    ['tkag', 'Floculante', 'Estanque agitado', 'TK-02'],
    ['pd1', 'Floculante', 'Bomba de transferencia de floculante A', 'PD-01A'],
    ['pd2', 'Floculante', 'Bomba de transferencia de floculante B', 'PD-01B'],
    ['pd3', 'Floculante', 'Bomba dosificadora de floculante A', 'PD-02A'],
    ['pd4', 'Floculante', 'Bomba dosificadora de floculante B', 'PD-02B'],
    ['tka', 'Agua recuperada', 'Estanque de agua recuperada', 'TK-03'],
    ['pa1', 'Agua recuperada', 'Bomba de agua recuperada A', 'PP-04A'],
    ['pa2', 'Agua recuperada', 'Bomba de agua recuperada B', 'PP-04B'],
    ['pa3', 'Agua recuperada', 'Bomba de agua recuperada C', 'PP-04C'],
    ['sum1', 'Sumideros', 'Bomba de sumidero del túnel', 'PP-05'],
    ['sum2', 'Sumideros', 'Bomba de sumidero sala de bombas', 'PP-06'],
    ['ft_f', 'Instrumentos', 'Flujo de alimentación', 'FIT-01'],
    ['dt_f', 'Instrumentos', 'Densidad de alimentación', 'DIT-01'],
    ['ft_uf1', 'Instrumentos', 'Flujo de descarga (línea A)', 'FIT-02'],
    ['ft_uf2', 'Instrumentos', 'Flujo de descarga (línea B)', 'FIT-03'],
    ['dt_uf', 'Instrumentos', 'Densidad de descarga', 'DIT-02'],
    ['lt_cama', 'Instrumentos', 'Nivel de cama', 'LIT-01'],
    ['pt_cama', 'Instrumentos', 'Presión de cama', 'PIT-01'],
    ['tq', 'Instrumentos', 'Torque de rastras', 'TIT-01'],
    ['at', 'Instrumentos', 'Turbidez del rebose', 'AIT-01'],
    ['ft_fl', 'Instrumentos', 'Flujo de floculante diluido', 'FIT-04'],
    ['ft_a1', 'Instrumentos', 'Flujo de agua recuperada A', 'FIT-05'],
    ['ft_a2', 'Instrumentos', 'Flujo de agua recuperada B', 'FIT-06'],
    ['lt_a', 'Instrumentos', 'Nivel estanque de agua recuperada', 'LIT-02'],
    ['lt_f', 'Instrumentos', 'Nivel estanque de floculante', 'LIT-03'],
    ['lt_s', 'Instrumentos', 'Nivel de sumidero', 'LIT-04']
  ];
  function generica() {
    var c = { nombre: 'Planta de espesamiento de relaves (genérica)', origen: 'Configuración genérica de la suite', equipos: {}, param: {}, notas: [] };
    ROLES.forEach(function (r) { c.equipos[r[0]] = { tag: r[3], desc: r[2], fuente: '' }; });
    return c;
  }
  function cargar() {
    var P = window.REProyectos, c = P && P.leer('espesador', null);
    var g = generica();
    if (!c) return g;
    c.equipos = Object.assign({}, g.equipos, c.equipos || {});
    c.param = c.param || {}; c.notas = c.notas || [];
    return c;
  }
  function guardar(c) { var P = window.REProyectos; if (P) P.escribir('espesador', c); }
  function tag(c, rol) { return ((c.equipos || {})[rol] || {}).tag || rol; }
  window.ESP_PLANTA = { ROLES: ROLES, generica: generica, cargar: cargar, guardar: guardar, tag: tag };
})();
