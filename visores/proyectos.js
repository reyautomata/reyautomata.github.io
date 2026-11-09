/* Proyectos · ReyEngi
 *
 * Guarda varios proyectos en el navegador. Cada proyecto tiene sus datos generales (cliente,
 * códigos, condiciones de sitio, alimentación, garantías, responsables...) y su propio espacio
 * para las hojas de datos y las especificaciones técnicas. Las hojas de datos (DAS) y las
 * especificaciones técnicas (ET) usan siempre el proyecto activo.
 *
 * Un proyecto se puede exportar a .json e importar en otro equipo.
 */
(function () {
  'use strict';

  var K = 'reyengi-proy-v1:';
  var VIEJO = 'reyengi-hd-v1:';   // versión anterior de las hojas de datos (un solo proyecto)

  // Campos del proyecto, agrupados para el formulario. t: tipo (texto, area, trio, tabla)
  var GRUPOS = [
    { g: 'Identificación', campos: [
      { k: 'nombre', l: 'Nombre corto (para elegirlo en la lista)' },
      { k: 'proyecto', l: 'Título del proyecto', ancho: 1 },
      { k: 'cliente', l: 'Cliente / mandante' },
      { k: 'contratista', l: 'Empresa de ingeniería' },
      { k: 'ubicacion', l: 'Ubicación' },
      { k: 'idCliente', l: 'ID / contrato del cliente' },
      { k: 'numero', l: 'N° de proyecto' },
      { k: 'fase', l: 'Fase de ingeniería' },
      { k: 'prefijo', l: 'Prefijo hojas de datos (DAS)' },
      { k: 'prefijoEt', l: 'Prefijo especificaciones (ET)' },
      { k: 'rev', l: 'Revisión vigente' },
      { k: 'intro', l: 'Introducción del proyecto (párrafo para las ET)', t: 'area', ancho: 1 }
    ] },
    { g: 'Responsables y endosos', campos: [
      { k: 'por', l: 'Elaboró (iniciales)' }, { k: 'porFecha', l: 'Fecha' },
      { k: 'reviso', l: 'Revisó (iniciales)' }, { k: 'revisoFecha', l: 'Fecha' },
      { k: 'aprobo', l: 'Aprobó (iniciales)' }, { k: 'aproboFecha', l: 'Fecha' },
      { k: 'revisoCliente', l: 'Revisó por el cliente' }, { k: 'aproboCliente', l: 'Aprobó por el cliente' }
    ] },
    { g: 'Condiciones de sitio', campos: [
      { k: 'lugar', l: 'Lugar de instalación' },
      { k: 'ambiente', l: 'Tipo de ambiente' },
      { k: 't', l: 'Temperatura ambiente °C (mín / nor / máx)', t: 'trio', ks: ['tMin', 'tNor', 'tMax'] },
      { k: 'hr', l: 'Humedad relativa % (mín / nor / máx)', t: 'trio', ks: ['hrMin', 'hrNor', 'hrMax'] },
      { k: 'altura', l: 'Altura geográfica (m.s.n.m.)' },
      { k: 'patm', l: 'Presión barométrica (kPa abs)', t: 'calc' },
      { k: 'sismo', l: 'Zona sísmica' },
      { k: 'area', l: 'Clasificación de área' },
      { k: 'precipProm', l: 'Precipitación promedio anual (mm)' },
      { k: 'precip24', l: 'Precipitación máxima 24 h (mm)' },
      { k: 'nieve', l: 'Carga de nieve (kg/m²)' },
      { k: 'viento', l: 'Viento de diseño' },
      { k: 'clima', l: 'Clima' },
      { k: 'areas', l: 'Áreas con altitud propia (una por línea: Área ; altitud)', t: 'area', ancho: 1 }
    ] },
    { g: 'Criterios eléctricos y de control', campos: [
      { k: 'alim4h', l: 'Alimentación transmisores 4 hilos' },
      { k: 'alim2h', l: 'Alimentación transmisores 2 hilos' },
      { k: 'alimMotor', l: 'Alimentación de actuadores eléctricos' },
      { k: 'tensionControl', l: 'Tensión de control (interruptores)' },
      { k: 'senal', l: 'Señal analógica estándar' },
      { k: 'bus', l: 'Red de campo (si aplica)' },
      { k: 'contactos', l: 'Contactos de interruptores' },
      { k: 'proteccion', l: 'Grado de protección exterior' },
      { k: 'protCorrosivo', l: 'Grado de protección en zonas corrosivas' },
      { k: 'placa', l: 'Placa de identificación' }
    ] },
    { g: 'Condiciones comerciales', campos: [
      { k: 'garantiaPem', l: 'Garantía desde puesta en marcha (meses)' },
      { k: 'garantiaRec', l: 'Garantía desde recepción (meses)' },
      { k: 'repuestosAnios', l: 'Repuestos valorizados para (años de operación)' },
      { k: 'obsolescencia', l: 'No obsolescencia (años)' },
      { k: 'capacitacion', l: 'Capacitación: n° de personas (vacío = no incluir)' },
      { k: 'aviso', l: 'Aviso previo a pruebas en fábrica (días hábiles)' }
    ] },
    { g: 'Referencias del proyecto', campos: [
      { k: 'refs', l: 'Documentos de referencia (uno por línea: código ; rev ; nombre)', t: 'area', ancho: 1 }
    ] }
  ];

  var DEFECTO = {
    nombre: 'Proyecto tipo',
    proyecto: 'INSTRUMENTACIÓN TIPO · PLANTA CONCENTRADORA',
    cliente: 'REYENGI · AUTOMATIZACIÓN Y CONTROL INDUSTRIAL',
    contratista: 'REYAUTOMATA',
    ubicacion: 'CHILE',
    idCliente: '',
    numero: 'RE-001',
    fase: 'Ingeniería de detalles',
    prefijo: 'RE-001-IN-DAS-',
    prefijoEt: 'RE-001-IN-ETE-',
    rev: 'A',
    intro: 'El proyecto corresponde a una planta concentradora de cobre ubicada en la zona centro-norte de Chile, con etapas de chancado, molienda, flotación, espesamiento de concentrado y relaves, y sistemas de agua fresca y recuperada.',
    por: 'AA', porFecha: '', reviso: '', revisoFecha: '', aprobo: '', aproboFecha: '',
    revisoCliente: '', aproboCliente: '',
    lugar: 'Exterior',
    ambiente: 'Seco y polvoriento',
    tMin: '-5', tNor: '12', tMax: '30',
    hrMin: '10', hrNor: '40', hrMax: '90',
    altura: '2.800',
    sismo: 'Zona 3 NCh 2369 Of. 2003',
    area: 'No clasificada',
    precipProm: '', precip24: '', nieve: '', viento: '', clima: '',
    areas: '',
    alim4h: '120 VAC, 50 Hz ± 10 %',
    alim2h: '24 VDC desde el lazo de corriente',
    alimMotor: '380 VAC, trifásico, 50 Hz',
    tensionControl: '120 VAC, 50 Hz ± 10 %',
    senal: '4-20 mA con protocolo HART',
    bus: '',
    contactos: 'SPDT/DPDT, 5 A @ 120 VAC',
    proteccion: 'NEMA 4X',
    protCorrosivo: 'NEMA 4X',
    placa: 'Placa de acero inoxidable 316 con el TAG grabado',
    garantiaPem: '12', garantiaRec: '24',
    repuestosAnios: '2',
    obsolescencia: '10',
    capacitacion: '5',
    aviso: '10',
    refs: ''
  };

  // ── Almacenamiento ───────────────────────────────────────────────────────────
  function get(k, def) { try { var v = localStorage.getItem(K + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function set(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(K + k); } catch (e) {} }
  function claves(prefijo) {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(prefijo) === 0) out.push(k); } } catch (e) {}
    return out;
  }
  function nuevoId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // Migra los datos de la versión anterior (un solo proyecto en las hojas de datos)
  function iniciar() {
    var lista = get('lista', null);
    if (lista && lista.length) return lista;
    var id = 'tipo';
    var viejo = null;
    try { viejo = JSON.parse(localStorage.getItem(VIEJO + 'proyecto') || 'null'); } catch (e) {}
    set('datos:' + id, Object.assign({}, DEFECTO, viejo || {}));
    claves(VIEJO + 'hoja:').forEach(function (k) {
      try { localStorage.setItem(K + 'p:' + id + ':' + k.slice(VIEJO.length), localStorage.getItem(k)); } catch (e) {}
    });
    lista = [{ id: id }];
    set('lista', lista); set('activo', id);
    return lista;
  }

  function lista() {
    return iniciar().map(function (p) { var d = datos(p.id); return { id: p.id, nombre: d.nombre || d.proyecto || p.id, numero: d.numero || '' }; });
  }
  function activoId() {
    var l = iniciar(), a = get('activo', null);
    if (!l.some(function (p) { return p.id === a; })) { a = l[0].id; set('activo', a); }
    return a;
  }
  function datos(id) { return Object.assign({}, DEFECTO, get('datos:' + (id || activoId()), {})); }
  function activo() { var d = datos(activoId()); d.id = activoId(); return d; }
  function guardar(id, v) { set('datos:' + id, Object.assign({}, DEFECTO, v)); }
  function seleccionar(id) { set('activo', id); }
  function crear(nombre, copiarDe) {
    var l = iniciar(), id = nuevoId();
    var base = copiarDe ? datos(copiarDe) : Object.assign({}, DEFECTO);
    base.nombre = nombre || 'Proyecto nuevo';
    set('datos:' + id, base);
    if (copiarDe) {
      claves(K + 'p:' + copiarDe + ':').forEach(function (k) {
        try { localStorage.setItem(K + 'p:' + id + ':' + k.slice((K + 'p:' + copiarDe + ':').length), localStorage.getItem(k)); } catch (e) {}
      });
    }
    l.push({ id: id }); set('lista', l); set('activo', id);
    return id;
  }
  function eliminar(id) {
    var l = iniciar().filter(function (p) { return p.id !== id; });
    claves(K + 'p:' + id + ':').forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    del('datos:' + id);
    if (!l.length) { set('lista', []); iniciar(); return; }
    set('lista', l);
    if (get('activo') === id) set('activo', l[0].id);
  }

  // Datos de cada proyecto para los módulos (hojas de datos, ET)
  function leer(sub, def) { return get('p:' + activoId() + ':' + sub, def); }
  function escribir(sub, v) { return set('p:' + activoId() + ':' + sub, v); }
  function borrar(sub) { del('p:' + activoId() + ':' + sub); }

  function exportar(id) {
    var pref = K + 'p:' + id + ':', extra = {};
    claves(pref).forEach(function (k) { try { extra[k.slice(pref.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
    return JSON.stringify({ formato: 'reyengi-proyecto', version: 1, exportado: new Date().toISOString(), datos: datos(id), modulos: extra }, null, 1);
  }
  function importar(texto) {
    var j = JSON.parse(texto);
    if (!j || j.formato !== 'reyengi-proyecto' || !j.datos) throw new Error('El archivo no es un proyecto de ReyEngi.');
    var id = nuevoId(), l = iniciar();
    set('datos:' + id, Object.assign({}, DEFECTO, j.datos));
    Object.keys(j.modulos || {}).forEach(function (k) { set('p:' + id + ':' + k, j.modulos[k]); });
    l.push({ id: id }); set('lista', l); set('activo', id);
    return id;
  }

  // Utilidades compartidas
  function numCL(s) { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')); }
  function presionBarometrica(altura) {
    var h = numCL(altura);
    if (!isFinite(h)) return '';
    return (101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588)).toFixed(1).replace('.', ',');
  }
  function filasTexto(s, n) {
    return String(s || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (l) { var c = l.split(/\s*;\s*/); while (c.length < n) c.push(''); return c.slice(0, n); });
  }
  function hoy() {
    var d = new Date();
    return ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear();
  }

  window.REProyectos = {
    GRUPOS: GRUPOS, DEFECTO: DEFECTO,
    lista: lista, activoId: activoId, activo: activo, datos: datos, guardar: guardar,
    seleccionar: seleccionar, crear: crear, eliminar: eliminar,
    leer: leer, escribir: escribir, borrar: borrar,
    exportar: exportar, importar: importar,
    presionBarometrica: presionBarometrica, numCL: numCL, filasTexto: filasTexto, hoy: hoy
  };
})();
