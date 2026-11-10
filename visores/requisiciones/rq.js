/* Motor de requisiciones de compra · Suite ReyEngi
 * Arma la requisición (portada, 9 secciones, tablas 2.1 a 7.1) desde el proyecto activo:
 * datos del proyecto, listado de instrumentos y señales (Diagramas de lazo), especificaciones técnicas
 * y hojas de datos. El mismo juego de bloques sirve para la vista previa, Word y PDF.
 *
 *   RQ.cargar() / RQ.guardar(D)      estado en REProyectos 'requisiciones'
 *   RQ.nueva(D, tipoId)              crea una requisición con alcance y referencias automáticos
 *   RQ.bloques(rq, pr)               bloques del documento (formato DOCX.generar)
 *   RQ.html(rq) / RQ.word(rq, logo)  vista previa / bytes .docx
 *   RQ.excelIndice(D) / RQ.excelHR(rq)
 */
(function () {
  'use strict';
  var P = window.REProyectos, TT = window.RQ_TIPOS;
  var LOGO = '../../img/logo-reyengi.png', MARCA = 'ReyEngi · Automatización y Control Industrial';
  var AZUL = '022A55', CLARO = 'DCE3EB';

  function pad(n, k) { return ('0000' + n).slice(-(k || 4)); }
  function up(s) { return String(s == null ? '' : s).toUpperCase(); }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function cap(s) { s = String(s || '').toLowerCase().replace(/\b(plc|dcs|scada|hmi|sis|cctv|ot|ip|i&c)\b/g, function (x) { return x.toUpperCase(); }); return s.charAt(0).toUpperCase() + s.slice(1); }
  function hoy() { return P && P.hoy ? P.hoy() : new Date().toLocaleDateString('es-CL'); }

  // ── Estado ──
  function cfg0(pr) {
    return { prefijo: (pr.numero ? pr.numero + '-' : '') + 'IN-RQS-', bases: [['', 'Bases especiales de compra']], envio: 'A confirmar por el cliente.', largo: 60, largoTroncal: 150, reserva: 10 };
  }
  function cargar() {
    var pr = P.activo(), D = P.leer('requisiciones', null) || {};
    D.cfg = Object.assign(cfg0(pr), D.cfg || {});
    D.lista = (D.lista || []).map(normalizar);
    return D;
  }
  function guardar(D) { P.escribir('requisiciones', D); }
  // Completa una requisición importada o de una versión anterior con los valores por defecto
  function normalizar(r) {
    var t = TT.tipo(r.tipo);
    r.id = r.id || uid(); r.tipo = t.id; r.num = r.num || '0001'; r.titulo = r.titulo || t.titulo; r.objeto = r.objeto || t.objeto;
    r.revs = r.revs && r.revs.length ? r.revs : [{ rev: 'A', fecha: hoy(), emitido: 'Emitido para revisión interna', por: '', reviso: '', aprobo: '', cliente: '' }];
    r.refs = r.refs || []; r.items = r.items || []; r.hr = r.hr || []; r.notas = r.notas || [];
    r.excluidos = r.excluidos || (t.excluidos || TT.EXCL_INST).slice();
    r.docs = r.docs || TT.DOCS.map(function (x) { return x.slice(); });
    r.qa = r.qa || TT.QA.map(function (x) { return x.slice(); });
    r.gPem = r.gPem || '12'; r.gComp = r.gComp || '24';
    return r;
  }

  // ── Tags del proyecto (señales de Diagramas de lazo + listado de instrumentos) ──
  function letras(tag) {
    var t = up(tag).split(/[-_\s]+/).filter(function (x) { return /^[A-Z]+(\/[A-Z]+)?$/.test(x); });
    if (!t.length) { var m = up(tag).match(/[A-Z]{1,6}/); return m ? m[0] : ''; }
    var l = t[t.length - 1];
    return l.indexOf('/') > 0 ? l.split('/').pop() : l;
  }
  function tagsProyecto() {
    var L = P.leer('lazos', null) || {}, por = {}, out = [];
    (L.senales || []).forEach(function (s) {
      if (!s.tag) return;
      var x = por[s.tag] || (por[s.tag] = { tag: s.tag, servicio: '', pid: '', hd: '', senales: [] });
      x.servicio = x.servicio || s.servicio || ''; x.pid = x.pid || s.pid || ''; x.senales.push(s);
    });
    (L.inst || []).forEach(function (i) {
      if (!i.tag || i.oculto) return;
      var x = por[i.tag] || (por[i.tag] = { tag: i.tag, servicio: '', pid: '', hd: '', senales: [] });
      if (i.servicio) x.servicio = i.servicio; if (i.hd) x.hd = i.hd; if (i.pid) x.pid = i.pid;
    });
    Object.keys(por).forEach(function (k) { por[k].letras = letras(k); out.push(por[k]); });
    out.sort(function (a, b) { return a.tag.localeCompare(b.tag, 'es', { numeric: true }); });
    return { tags: out, cfg: L.cfg || {}, senales: L.senales || [], modulos: L.modulos || [] };
  }
  function tagsDeTipo(t, TP) {
    if (!t.letras) return [];
    return (TP || tagsProyecto()).tags.map(function (x) { var d = t.letras(x.letras); return d ? Object.assign({ desc: d }, x) : null; }).filter(Boolean);
  }
  // Hoja de datos por descripción (si el listado de instrumentos no la indica)
  var DAS = {
    'Manómetro': 'pi', 'Manómetro diferencial': 'pi', 'Transmisor de presión': 'pit', 'Transmisor de presión diferencial': 'pit', 'Interruptor de presión': 'psh',
    'Transmisor de flujo tipo magnético': 'fit-mag', 'Sensor/transmisor de densidad': 'dit', 'Sensor/transmisor de nivel': 'lit-radar', 'Interruptor de nivel': 'lsw-vib',
    'Sensor/transmisor de temperatura': 'tit', 'Interruptor de temperatura': 'tsh', 'Analizador en línea': 'ait-ph', 'Válvula de control con actuador y posicionador': 'fcv',
    'Válvula on/off con actuador': 'xv-neu', 'Interruptor de desalineamiento': 'zs-des', 'Interruptor de piola de seguridad': 'hs-pull', 'Interruptor de velocidad cero': 'ss-cero',
    'Interruptor de rasgadura': 'xs-rip', 'Pesómetro de correa': 'wit'
  };

  // ── Documentos de la suite ──
  function famEt(id) { var F = window.ET && window.ET.familias; return F ? F.filter(function (f) { return f.id === id; })[0] : null; }
  function numEt(id, pr) { var F = window.ET && window.ET.familias, f = famEt(id); return f ? (pr.prefijoEt || '') + pad(F.indexOf(f) + 1) : ''; }
  function numDas(id, pr) {
    var H = window.HD && window.HD.plantillas; if (!H) return '';
    var i = H.map(function (p) { return p.id; }).indexOf(id);
    return i < 0 ? '' : (pr.prefijo || '') + pad(i + 1);
  }
  function tituloDas(id) { var H = window.HD && window.HD.plantillas, p = H && H.filter(function (x) { return x.id === id; })[0]; return p ? 'Hoja de datos ' + p.titulo : 'Hoja de datos ' + id; }

  function refsAuto(rq, pr, TP) {
    var t = TT.tipo(rq.tipo), out = [], vistos = {};
    function add(c, r, n) { if (!c || vistos[c]) return; vistos[c] = 1; out.push([c, r || '', n]); }
    (P.filasTexto ? P.filasTexto(pr.refs, 3) : []).forEach(function (f) { add(f[0], f[1], f[2]); });
    var et = numEt(t.et, pr), f = famEt(t.et);
    if (et) add(et, pr.rev, 'Especificación técnica ' + cap(f.titulo));
    TP = TP || tagsProyecto();
    var tags = tagsDeTipo(t, TP), das = [];
    tags.forEach(function (x) { var d = x.hd && x.hd !== '-' ? x.hd : DAS[x.desc]; if (d && das.indexOf(d) < 0) das.push(d); });
    if (!tags.length && t.sistema) das = t.das.slice();
    das.forEach(function (d) { add(numDas(d, pr), pr.rev, tituloDas(d)); });
    var c = TP.cfg || {};
    if (t.docsLazos || t.cables) { add(c.docIO, pr.rev, 'Listado de entradas y salidas'); add(c.docInst, pr.rev, 'Listado de instrumentos'); }
    if (t.cables) add(c.docCables, pr.rev, 'Listado de circuitos');
    var pids = [];
    (t.cables ? TP.tags : tags).forEach(function (x) { if (x.pid && pids.indexOf(x.pid) < 0) pids.push(x.pid); });
    if (!pids.length && c.docPid && tags.length) pids.push(c.docPid);
    pids.sort().forEach(function (p) { add(p, '', 'P&ID'); });
    return out;
  }

  function anios(n) { n = +n || 1; return n === 1 ? 'un año' : n + ' años'; }
  function fila(x, pr, k) {
    var c = String(x[0]).replace('{PLC}', k.PLC).replace('{RIO}', k.RIO).replace('{SWB}', k.SWB);
    return { k: 'i', cant: c, un: x[1], desc: String(x[2]).replace('{REP}', anios(pr.repuestosAnios)), tag: '' };
  }
  function equiposAuto(rq, pr, TP) {
    var t = TT.tipo(rq.tipo), out = [];
    TP = TP || tagsProyecto();
    if (t.cables) return cablesAuto(rq, TP);
    if (t.letras) {
      var tags = tagsDeTipo(t, TP), grupos = {}, orden = [];
      tags.forEach(function (x) {
        var g = t.grupos ? t.grupos(x.desc) : '';
        if (!grupos[g]) { grupos[g] = []; orden.push(g); }
        grupos[g].push({ k: 'i', cant: 1, un: 'Un.', desc: x.desc + (x.servicio ? ' · ' + x.servicio : ''), tag: x.tag });
      });
      var varios = orden.length > 1;
      orden.forEach(function (g) { if (varios && g) out.push({ k: 'g', desc: g }); out.push.apply(out, grupos[g]); });
      if (t.equipos) out.push.apply(out, t.equipos.map(function (x) { return fila(x, pr, {}); }));
      return out;
    }
    var gab = {}; TP.modulos.forEach(function (m) { if (m.gabinete) gab[m.gabinete] = 1; });
    var k = { PLC: 1, RIO: Math.max(0, Object.keys(gab).length - 1), SWB: 0 };
    return (t.equipos || []).map(function (x) { return fila(x, pr, k); });
  }
  function cablesAuto(rq, TP) {
    var D = cargarCfg(), c = TP.cfg || {}, por = {}, orden = [], jb = {};
    function add(spec, m) { spec = spec || 'Cable sin diseño'; if (!por[spec]) { por[spec] = 0; orden.push(spec); } por[spec] += m; }
    var cables = {};
    TP.senales.forEach(function (s) {
      if (!s.tag) return;
      var an = s.tipo === 'AI' || s.tipo === 'AO', spec = s.cableSpec || (an ? (s.hilos === 3 ? c.cable3h : c.cableAnalogico) : c.cableDiscreto);
      var id = s.cable || (s.tag + ':' + s.tipo);
      if (cables[id]) return; cables[id] = 1;
      add(spec, +D.largo || 60);
      if (s.jb) jb[s.jb] = s.cable2Spec || c.cableMultipar;
    });
    Object.keys(jb).forEach(function (k) { add(jb[k], +D.largoTroncal || 150); });
    var f = 1 + (+D.reserva || 0) / 100;
    return orden.map(function (spec) {
      return { k: 'i', cant: Math.ceil(por[spec] * f / 100) * 100, un: 'm', desc: 'Cable de instrumentación y control ' + spec + ', aislación y chaqueta resistentes a rayos UV, retardante a la llama y libre de halógenos.', tag: '' };
    });
  }
  function cargarCfg() { var D = P.leer('requisiciones', null) || {}; return Object.assign(cfg0(P.activo()), D.cfg || {}); }

  function itemsAuto(rq, pr, TP) {
    var t = TT.tipo(rq.tipo), out = [{ k: 's', desc: 'SUMINISTRO DE EQUIPOS' }].concat(equiposAuto(rq, pr, TP));
    if (t.software) { out.push({ k: 's', desc: 'SUMINISTRO DE SOFTWARE' }); out.push.apply(out, t.software.map(function (x) { return fila(x, pr, {}); })); }
    out.push({ k: 's', desc: 'SUMINISTRO DE SERVICIOS' });
    out.push.apply(out, (t.servicios || TT.SERV_INST).map(function (x) { return fila(x, pr, {}); }));
    return out;
  }
  // Reemplaza solo la sección de equipos (primera sección) por la versión automática
  function actualizarEquipos(rq, pr) {
    var it = rq.items || [], i0 = -1, i1 = it.length;
    it.forEach(function (x, i) { if (x.k === 's') { if (i0 < 0) i0 = i; else if (i1 === it.length && i > i0) i1 = i; } });
    var nuevos = equiposAuto(rq, pr);
    if (i0 < 0) { rq.items = itemsAuto(rq, pr); return; }
    rq.items = it.slice(0, i0 + 1).concat(nuevos, it.slice(i1));
  }

  function siguienteNum(D) { var n = 0; D.lista.forEach(function (r) { n = Math.max(n, parseInt(r.num, 10) || 0); }); return pad(n + 1); }
  function nueva(D, tipoId) {
    var pr = P.activo(), t = TT.tipo(tipoId);
    var rq = { id: uid(), num: siguienteNum(D), tipo: t.id, titulo: t.titulo, objeto: t.objeto, estado: '',
      revs: [{ rev: 'A', fecha: hoy(), emitido: 'Emitido para revisión interna', por: pr.por || '', reviso: pr.reviso || '', aprobo: pr.aprobo || '', cliente: '' }],
      gPem: pr.garantiaPem || '12', gComp: pr.garantiaRec || '24', excluidos: (t.excluidos || TT.EXCL_INST).slice(), notas: (t.notas || []).slice(),
      docs: TT.DOCS.map(function (r) { return r.slice(); }), qa: TT.QA.map(function (r) { return r.slice(); }), hr: [], paginas: '' };
    rq.refs = refsAuto(rq, pr);
    rq.items = itemsAuto(rq, pr);
    D.lista.push(rq);
    return rq;
  }
  // Una requisición por cada tipo de instrumento presente en el proyecto que aún no la tenga
  function sugerir(D) {
    var TP = tagsProyecto(), creadas = [];
    TT.tipos.forEach(function (t) {
      if (!t.letras || D.lista.some(function (r) { return r.tipo === t.id; })) return;
      if (tagsDeTipo(t, TP).length) creadas.push(nueva(D, t.id));
    });
    return creadas;
  }
  // Tags del proyecto que no aparecen en ninguna requisición vigente
  function sinRequisicion(D) {
    var en = {};
    D.lista.forEach(function (r) { if (r.estado !== 'anulada') (r.items || []).forEach(function (x) { if (x.tag) en[x.tag] = r.num; }); });
    var cubre = function (x) { return TT.tipos.some(function (t) { return t.letras && t.letras(x.letras); }); };
    return tagsProyecto().tags.filter(function (x) { return !en[x.tag] && cubre(x); });
  }

  // ── Numeración de la Tabla 5.1 ──
  function numerar(items) {
    var s = 0, g = 0, i = 0;
    return (items || []).map(function (x) {
      var n;
      if (x.k === 's') { s++; g = 0; i = 0; n = String(s); }
      else if (x.k === 'g') { g++; i = 0; n = s + '.' + g; }
      else { i++; n = g ? s + '.' + g + '.' + i : s + '.' + i; }
      return Object.assign({ n: x.n || n }, x);
    });
  }
  function codigo(rq, D) { D = D || cargar(); return (D.cfg.prefijo || '') + (rq.num || ''); }
  function revActual(rq) { var r = rq.revs || []; return r.length ? r[r.length - 1] : { rev: '', fecha: '' }; }
  function cant(c) { if (c === '' || c == null || +c === 0 && String(c).trim() === '0') return '—'; var n = P.numCL ? P.numCL(String(c)) : +c; return isFinite(n) && String(c).indexOf('.') < 0 ? Number(n).toLocaleString('es-CL') : String(c); }

  // ── Bloques del documento ──
  function bloques(rq, pr, D) {
    D = D || cargar(); pr = pr || P.activo();
    var cod = codigo(rq, D), cli = pr.cliente || 'el cliente', B = [], H1 = 0, H2 = 0, H3 = 0, NT = {};
    function h(n, t) {
      if (n === 1) { H1++; H2 = 0; H3 = 0; B.push({ h: 1, t: t, num: H1 + '.' }); }
      else if (n === 2) { H2++; H3 = 0; B.push({ h: 2, t: t, num: H1 + '.' + H2 }); }
      else { H3++; B.push({ h: 3, t: t, num: H1 + '.' + H2 + '.' + H3 }); }
    }
    function p(t, o) { B.push(Object.assign({ p: t }, o || {})); }
    function ct(t) { NT[H1] = (NT[H1] || 0) + 1; var n = 'Tabla ' + H1 + '.' + NT[H1]; p(n + ': ' + t, { c: true, b: true, sz: 18, cap: n }); return n; }
    function tb(anchos, filas, cab) { B.push({ tabla: { anchos: anchos, filas: filas, cab: cab || 1 } }); }
    var objeto = rq.objeto || cap(rq.titulo);

    h(1, 'INTRODUCCIÓN');
    String(pr.intro || '').split(/\n+/).filter(Boolean).forEach(function (l) { p(l); });
    p('El presente documento corresponde a la requisición de ' + objeto + (rq.estado === 'anulada' ? '. Documento ANULADO.' : '.'));

    h(1, 'DEFINICIONES');
    ct('Definiciones del proyecto.');
    tb([40, 130], [['TÉRMINO', 'DEFINICIÓN'],
      [{ t: 'Comprador', b: true }, 'Se refiere a ' + cli + ' o quien este designe en su nombre.'],
      [{ t: 'Proponente', b: true }, 'La parte o las partes que se ofrecen para ejecutar el trabajo, llamadas mediante una invitación específica.'],
      [{ t: 'Proveedor', b: true }, 'El proponente a quien se ha adjudicado una orden de compra para ejecutar el trabajo.'],
      [{ t: 'Ingeniero', b: true }, 'Se refiere a ' + (pr.contratista || 'la empresa de ingeniería') + ', que actúa como representante técnico de ' + cli + '.']]);

    h(1, 'REFERENCIAS');
    p('El presente documento se complementa con los documentos citados en la Tabla 3.1.');
    ct('Referencias.');
    tb([60, 110], [['CÓDIGO DOCUMENTO', 'NOMBRE DOCUMENTO']].concat((D.cfg.bases || []).map(function (b) { return [{ t: b[0] || '—', c: true }, b[1]]; })));

    h(1, 'DATOS TÉCNICOS');
    p('El siguiente listado de documentos cubre los requerimientos técnicos para el suministro especificado en la Sección 5.');
    ct('Documentos de referencia para el suministro.');
    tb([55, 20, 95], [['CÓDIGO DOCUMENTO', 'REVISIÓN', 'NOMBRE DOCUMENTO']].concat((rq.refs || []).length ? rq.refs.map(function (r) { return [{ t: r[0], c: true }, { t: r[1], c: true }, r[2]]; }) : [[{ t: 'Sin documentos de referencia', cs: 3, c: true }]]));

    h(1, 'ALCANCE DEL SUMINISTRO');
    h(2, 'SUMINISTRO INCLUIDO');
    p('El alcance del suministro debe entregarse completo, necesitando mínimas conexiones en terreno, con todos sus componentes y accesorios conformes con los estándares y códigos indicados en la especificación técnica y en concordancia con la documentación técnica de la Sección 4 de esta requisición, excluyendo lo expuesto en el punto 5.2.');
    ct('Suministro incluido.');
    var conTag = (rq.items || []).some(function (x) { return x.tag; });
    var filas = [conTag ? ['ÍTEM', 'CANT.', 'UN.', 'TAG', 'DESCRIPCIÓN'] : ['ÍTEM', 'CANT.', 'UN.', 'DESCRIPCIÓN']];
    numerar(rq.items).forEach(function (x) {
      if (x.k === 's' || x.k === 'g') {
        var f = [{ t: x.n, b: true, fill: x.k === 's' ? CLARO : null }, { t: x.desc, b: true, cs: conTag ? 4 : 3, c: x.k === 's', fill: x.k === 's' ? CLARO : null }];
        filas.push(f.concat(conTag ? [null, null, null] : [null, null]));
      } else filas.push([{ t: x.n, c: true }, { t: cant(x.cant), c: true }, { t: x.un || '', c: true }].concat(conTag ? [{ t: x.tag || '', c: true }] : [], [x.desc || '']));
    });
    tb(conTag ? [14, 16, 12, 34, 94] : [14, 18, 14, 124], filas);
    if (!(rq.notas || []).some(function (n) { return /^Las características/.test(n); })) p('Las características de los equipos, software y servicios considerados en el suministro se indican en los documentos de referencia de la Tabla 4.1.');
    (rq.notas || []).filter(Boolean).forEach(function (n) { p(n); });
    p('El proponente deberá ofertar el equipamiento completo, incluyendo todos los elementos, dispositivos y accesorios necesarios para su correcta y completa operación según su especificación, aun cuando no hayan sido indicados explícitamente en ella.');
    h(2, 'TRABAJO NO INCLUIDO');
    p('Los siguientes trabajos y materiales quedan excluidos del alcance del suministro, salvo indicación contraria en las condiciones comerciales o especificaciones técnicas:');
    B.push({ ul: (rq.excluidos || []).filter(Boolean) });

    h(1, 'REQUERIMIENTOS DE PLANOS Y DATOS');
    h(2, 'INSTRUCCIONES DE ENVÍO');
    p(rq.envio || D.cfg.envio || 'A confirmar por el cliente.');
    h(2, 'REQUERIMIENTOS DE DOCUMENTACIÓN PARA ACTIVACIÓN DE LA GESTIÓN DE COMPRA');
    p('A continuación se presenta el formulario de planos y datos de ingeniería solicitados al proveedor:');
    ct('Requerimientos de documentación para la activación de la gestión de compra.');
    tb([58, 20, 20, 22, 20, 30], [
      [{ t: 'PLANOS Y DATOS REQUERIDOS', vm: 'start' }, { t: 'PARA COTIZACIÓN', vm: 'start' }, { t: 'DESPUÉS DE RECIBIR LA ORDEN DE COMPRA', cs: 3 }, null, null, { t: 'ENTREGA', vm: 'start' }],
      [{ t: '', vm: true }, { t: '', vm: true }, 'REVISIÓN', 'APROBACIÓN', 'FINAL', { t: '', vm: true }]
    ].concat((rq.docs || []).map(function (r) { return [r[0], { t: r[1], c: true }, { t: r[2], c: true }, { t: r[3], c: true }, { t: r[4], c: true }, { t: 'Con documentación técnica', c: true, sz: 14 }]; })), 2);
    p('Nota: D = documento digital / P = documento impreso.', { sz: 16 });
    p('Los datos del proveedor deben estar claramente identificados en cada plano, manual, etc., e indicar además la descripción del material, el nombre del cliente, el N° de la orden de compra y el N° del proyecto' + (pr.numero ? ' (' + pr.numero + ')' : '') + '.');
    p('Formato:');
    B.push({ ul: ['Planos: A3 420 × 297 mm.', 'Documentos: tamaño carta.'] });

    h(1, 'CALIDAD');
    h(2, 'GENERAL');
    p('El proveedor documentará, implementará y mantendrá un sistema de gestión de calidad (QA) de acuerdo con los requisitos de esta sección y de la norma ISO 9001, "Sistemas de gestión de la calidad".');
    h(2, 'DOCUMENTACIÓN');
    h(3, 'DESCRIPCIÓN DEL PROGRAMA DE CONTROL DE CALIDAD');
    p('Se deberá presentar junto con la oferta una breve descripción del programa de control de calidad (QA), indicando el estándar a utilizar y, como mínimo:');
    B.push({ ul: ['Un organigrama con una breve descripción de las funciones de control de calidad.', 'Códigos y normas utilizados.', 'Una lista de los procedimientos aplicables a la implementación del programa de control de calidad.', 'Una descripción general de cómo se cumplirá cada requisito del sistema de control de calidad durante el diseño, adquisición, fabricación, montaje y pruebas.'] });
    h(3, 'SISTEMA DE GESTIÓN DE CALIDAD');
    p('Al momento de la adjudicación, la documentación del sistema de gestión de calidad (QA) deberá presentarse en español.');
    p('La documentación de gestión de calidad, incluidos sus manuales, deberá ser aprobada por ' + cli + ' antes de iniciar la fabricación. Se requerirá un mínimo de cinco días hábiles para su revisión.');
    h(3, 'INFORMACIÓN PARA COMPLETAR EL PROCESO DE CALIDAD');
    p('Al momento de la entrega, el proveedor deberá enviar la siguiente información:');
    B.push({ ul: ['Todos los certificados y pruebas realizadas según las especificaciones.', 'Todos los documentos que verifican la inspección, el control y las pruebas realizadas de acuerdo con las especificaciones.', 'Listas de identificación con referencias cruzadas entre documentos, con fines de trazabilidad.'] });
    h(2, 'CONFORMIDAD');
    p(cli + ' tendrá derecho a realizar auditorías en las instalaciones del proveedor y de sus subcontratistas para verificar el cumplimiento de la documentación incluida en la orden de compra.');
    p('Para la evaluación y la auditoría, el proveedor y sus subcontratistas darán libre acceso a sus instalaciones y a sus documentos y registros de calidad. Los registros podrán ser solicitados en cualquier momento durante la fabricación y deberán enviarse en español dentro de cinco días hábiles desde la solicitud.');
    p('El proveedor deberá responder por escrito a cualquier solicitud de acción correctiva y, si se le solicita, tomar oportunamente las medidas necesarias.');
    h(2, 'INSPECCIÓN DE CALIDAD');
    ct('Planilla de inspección de calidad.');
    var Q = TT.QA_COLS;
    tb([12, 62, 10, 10, 9, 9, 9, 9, 9, 9, 22], [
      [{ t: 'N°', vm: 'start' }, { t: 'DESCRIPCIÓN', vm: 'start' }, { t: 'PROV.', cs: 2 }, null, { t: 'CLIENTE', cs: 6 }, null, null, null, null, null, { t: 'NOTA', vm: 'start' }],
      [{ t: '', vm: true }, { t: '', vm: true }].concat(Q, [{ t: '', vm: true }])
    ].concat((rq.qa || []).map(function (r) {
      if (r[2] === null) return [{ t: r[0], b: true, fill: CLARO }, { t: r[1], b: true, fill: CLARO, cs: 10 }, null, null, null, null, null, null, null, null, null];
      var m = String(r[2] || '').split(/\s+/);
      return [{ t: r[0], c: true }, r[1]].concat(Q.map(function (q) { return { t: m.indexOf(q) >= 0 ? 'X' : '', c: true, b: true }; }), [r[3] || '']);
    })), 2);
    B.push({ ul: ['Tipo de requerimiento: CP = control de calidad del proveedor · DP = documentos de soporte del proveedor · I = inspección · R = revisión · P = presencia · C = inspección condicional · A = auditoría · O = observación.', 'Acción: X = acción del proveedor requerida.'] });
    p('El proveedor no debe despachar ninguna partida de esta orden sin que la inspección final se haya realizado satisfactoriamente y sin recibir la autorización de embarque del representante de control de calidad del comprador, o su autorización por escrito.');

    h(1, 'EMBALAJE Y TRANSPORTE');
    ['Todos los conjuntos o subconjuntos serán entregados con los elementos adecuados para su transporte por vía terrestre.',
      'En la fabricación se deberán considerar las limitaciones de pesos y dimensiones vigentes para el transporte de carga en el país al momento del embarque.',
      'Los elementos serán entregados en fábrica o en terreno, según se indique en la requisición u orden de compra correspondiente.',
      'Cada parte se entregará armada en conjuntos de tamaño adecuado para el transporte. Las dimensiones y pesos de cada subconjunto deberán informarse a la inspección técnica del proyecto.',
      'Si por restricciones de carga los elementos se envían desarmados, cada subconjunto o pieza deberá identificar el conjunto al que pertenece y su marca de conexión o montaje.',
      'Los envíos parciales deberán ser completos para el elemento o equipo considerado, evitando mezclar elementos que puedan producir confusión en terreno.'].forEach(function (t) { p(t); });

    h(1, 'GARANTÍAS');
    p('El proveedor deberá asegurar los requisitos de capacidad de diseño especificados y acordados durante la negociación de compra. Las condiciones de la garantía deben adjuntarse a la orden de compra.');
    p('El proveedor es responsable de los equipos y materiales suministrados por sus subproveedores.');
    p('El proveedor garantizará todos los materiales, componentes y equipos y su rendimiento durante ' + (rq.gPem || 12) + ' meses después de la puesta en servicio, y ' + (rq.gComp || 24) + ' meses en los componentes principales.');
    p('El proveedor garantizará el diseño y el cumplimiento de los requisitos del proceso cuando el equipo se utilice en las condiciones especificadas en las hojas de datos.');
    p('El proveedor debe incluir una garantía por defectos de calidad, fabricación, materiales u operación, con el compromiso de rectificarlos sin costo adicional para ' + cli + '.');
    return B;
  }

  function portada(rq, pr, D) {
    var cod = codigo(rq, D);
    return {
      datos: [['CLIENTE', pr.cliente || ''], ['PROYECTO', pr.proyecto || ''], ['EMPRESA DE INGENIERÍA', pr.contratista || ''], ['N° DE PROYECTO', pr.numero || ''],
        ['ID CLIENTE', pr.idCliente || '—'], ['TÍTULO', 'REQUISICIÓN ' + up(rq.titulo)], ['DOCUMENTO N°', cod]],
      revs: (rq.revs || []).slice().reverse()
    };
  }

  // ── Vista HTML ──
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/\n/g, '<br>'); }
  function tablaHtml(t, clase) {
    var R = t.filas, span = {}, h = '<table class="tb' + (clase ? ' ' + clase : '') + '">';
    // rowspan de celdas con vm: 'start'
    R.forEach(function (f, ri) {
      var col = 0;
      f.forEach(function (c) {
        if (c === null) { col++; return; }
        var cs = (typeof c === 'object' && c.cs) || 1;
        if (c && c.vm === 'start') { var n = 1; for (var k = ri + 1; k < R.length; k++) { var x = celdaEn(R[k], col); if (x && x.vm === true) n++; else break; } span[ri + ':' + col] = n; }
        col += cs;
      });
    });
    R.forEach(function (f, ri) {
      var col = 0, th = ri < (t.cab || 0);
      h += '<tr>';
      f.forEach(function (c) {
        if (c === null) { col++; return; }
        if (typeof c !== 'object') c = { t: c };
        var cs = c.cs || 1, rs = span[ri + ':' + col];
        if (c.vm === true) { col += cs; return; }
        var tag = th ? 'th' : 'td', st = c.fill ? ' style="background:#' + c.fill + '"' : '';
        h += '<' + tag + (cs > 1 ? ' colspan="' + cs + '"' : '') + (rs > 1 ? ' rowspan="' + rs + '"' : '') + ((c.c || th) ? ' class="c' + (c.b ? ' b' : '') + '"' : c.b ? ' class="b"' : '') + st + '>' + e(c.t) + '</' + tag + '>';
        col += cs;
      });
      h += '</tr>';
    });
    return h + '</table>';
  }
  function celdaEn(f, col) { var x = 0; for (var i = 0; i < f.length; i++) { var c = f[i]; if (x === col) return c; x += c && typeof c === 'object' && c.cs ? c.cs : 1; if (x > col) return null; } return null; }

  function html(rq) {
    var D = cargar(), pr = P.activo(), B = bloques(rq, pr, D), PT = portada(rq, pr, D), r = revActual(rq);
    var o = ['<article class="doc' + (rq.estado === 'anulada' ? ' anulada' : '') + '">'];
    o.push('<section class="portada"><div class="pt-marca"><img src="' + LOGO + '" alt="ReyEngi"><span>' + e(MARCA) + '</span></div>');
    o.push('<h2 class="pt-tit">REQUISICIÓN ' + e(up(rq.titulo)) + '</h2>');
    o.push(tablaHtml({ cab: 0, filas: PT.datos.map(function (d) { return [{ t: d[0], b: true }, { t: d[1], b: d[0] === 'DOCUMENTO N°' }]; }) }, 'pt-datos'));
    o.push(tablaHtml({ cab: 1, filas: [['REV.', 'FECHA', 'EMITIDO PARA', 'POR', 'REVISÓ', 'APROBÓ', 'APROBÓ CLIENTE']].concat(PT.revs.map(function (v) { return [{ t: v.rev, c: true }, { t: v.fecha, c: true }, v.emitido, { t: v.por, c: true }, { t: v.reviso, c: true }, { t: v.aprobo, c: true }, { t: v.cliente, c: true }]; })) }));
    o.push('</section><section class="indice"><h3>Tabla de contenido</h3><ol>' + B.filter(function (b) { return b.h && b.h <= 2; }).map(function (b) { return '<li class="n' + b.h + '">' + e(b.num + '  ' + b.t) + '</li>'; }).join('') +
      '</ol><h3>Lista de tablas</h3><ol>' + B.filter(function (b) { return b.cap; }).map(function (b) { return '<li class="n2">' + e(b.p) + '</li>'; }).join('') + '</ol></section><section class="cuerpo">');
    o.push('<div class="cab-pag"><span>' + e(pr.proyecto || '') + '</span><b>' + e(codigo(rq, D)) + '</b><span>Rev. ' + e(r.rev) + '</span></div>');
    B.forEach(function (b) {
      if (b.h) o.push('<h' + (b.h + 2) + '><span class="num">' + e(b.num) + '</span> ' + e(b.t) + '</h' + (b.h + 2) + '>');
      else if (b.ul) o.push('<ul>' + b.ul.map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>');
      else if (b.tabla) o.push(tablaHtml(b.tabla));
      else if (b.p !== undefined) o.push('<p class="' + (b.c ? 'c ' : '') + (b.b ? 'b' : '') + '">' + e(b.p) + '</p>');
    });
    o.push('</section></article>');
    return o.join('');
  }

  // ── Word ──
  function word(rq, logo) {
    var D = cargar(), pr = P.activo(), B = bloques(rq, pr, D), PT = portada(rq, pr, D), cod = codigo(rq, D), r = revActual(rq);
    var x = [];
    x.push(logo ? { p: '', img: 70, c: true } : { p: 'ReyEngi', b: true, c: true, sz: 32, color: AZUL });
    x.push({ p: MARCA, c: true, sz: 16, color: '5A6573' });
    x.push({ p: '', c: true });
    x.push({ p: 'REQUISICIÓN ' + up(rq.titulo), c: true, b: true, sz: 30, color: AZUL });
    if (rq.estado === 'anulada') x.push({ p: 'DOCUMENTO ANULADO', c: true, b: true, sz: 28, color: 'C0392B' });
    x.push({ p: '', c: true });
    x.push({ tabla: { anchos: [50, 120], filas: PT.datos.map(function (d) { return [{ t: d[0], b: true, fill: CLARO, color: AZUL }, { t: d[1], b: d[0] === 'DOCUMENTO N°' || d[0] === 'TÍTULO' }]; }) } });
    x.push({ p: '', c: true });
    x.push({ tabla: { cab: 1, anchos: [12, 22, 40, 24, 24, 24, 24], filas: [['REV.', 'FECHA', 'EMITIDO PARA', 'POR', 'REVISÓ', 'APROBÓ', 'APROBÓ CLIENTE']].concat(PT.revs.map(function (v) {
      return [{ t: v.rev, c: true }, { t: v.fecha, c: true }, v.emitido || '', { t: v.por || '', c: true }, { t: v.reviso || '', c: true }, { t: v.aprobo || '', c: true }, { t: v.cliente || '', c: true }]; })) } });
    x.push({ salto: true }, { indice: true }, { salto: true });
    return window.DOCX.generar({
      titulo: 'Requisición ' + rq.titulo, autor: pr.contratista || 'ReyEngi', logo: logo,
      encabezado: [
        [logo ? { t: '', img: 34, c: true } : { t: 'ReyEngi', b: true, c: true }, { t: pr.proyecto || '', c: true }, { t: cod, b: true, c: true }],
        [{ t: pr.cliente || '', c: true }, { t: 'REQUISICIÓN ' + up(rq.titulo), c: true, b: true }, { t: 'Rev. ' + (r.rev || '') + '  ·  {PAG}', c: true }]
      ],
      anchosEncabezado: [42, 86, 42], pie: cod,
      bloques: x.concat(B)
    });
  }
  function cargarLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) {
      if (!b) return null; var dv = new DataView(b); return { bytes: new Uint8Array(b), w: dv.getUint32(16), h: dv.getUint32(20) };
    }).catch(function () { return null; });
  }
  function bajar(bytes, nombre, tipo) {
    var url = URL.createObjectURL(new Blob([bytes], { type: tipo })), a = document.createElement('a');
    a.href = url; a.download = nombre.replace(/[\\/:*?"<>|]+/g, '-'); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }
  var XLSXT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function descargarWord(rq) {
    return cargarLogo().then(function (logo) {
      bajar(word(rq, logo), codigo(rq) + ' Rev ' + revActual(rq).rev + ' Requisición ' + cap(rq.titulo) + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  }

  // ── Excel: índice de requisiciones y suministro consolidado ──
  function excelIndice(D) {
    var X = window.XLSX_RE, lb = X.libro(), pr = P.activo(), A = { b: true, fill: AZUL, color: 'FFFFFF', h: 'center' };
    var h = lb.hoja('Índice', { orientacion: 'landscape' });
    h.cols([26, 50, 8, 12, 30, 12, 10, 10]);
    h.celda(0, 0, 'ÍNDICE DE REQUISICIONES · ' + up(pr.proyecto || ''), { b: true, sz: 12, borde: 'none' });
    h.celda(1, 0, (pr.cliente || '') + (pr.numero ? ' · ' + pr.numero : ''), { borde: 'none' });
    ['DOCUMENTO N°', 'TÍTULO', 'REV.', 'FECHA', 'EMITIDO PARA', 'ESTADO', 'ÍTEMS', 'TAGS'].forEach(function (t, i) { h.celda(3, i, t, A); });
    D.lista.forEach(function (rq, k) {
      var r = revActual(rq), it = (rq.items || []).filter(function (x) { return x.k === 'i'; });
      [codigo(rq, D), 'REQUISICIÓN ' + up(rq.titulo), r.rev, r.fecha, r.emitido, rq.estado === 'anulada' ? 'ANULADA' : 'VIGENTE', String(it.length), String(it.filter(function (x) { return x.tag; }).length)]
        .forEach(function (v, i) { h.celda(4 + k, i, v || '', { sz: 9, h: i === 1 || i === 4 ? 'left' : 'center', color: rq.estado === 'anulada' ? '9A9A9A' : null }); });
    });
    var s = lb.hoja('Suministro', { orientacion: 'landscape' });
    s.cols([26, 8, 10, 8, 22, 70]);
    ['REQUISICIÓN', 'ÍTEM', 'CANT.', 'UN.', 'TAG', 'DESCRIPCIÓN'].forEach(function (t, i) { s.celda(0, i, t, A); });
    var f = 1;
    D.lista.forEach(function (rq) {
      if (rq.estado === 'anulada') return;
      numerar(rq.items).forEach(function (x) {
        var hdr = x.k !== 'i';
        [codigo(rq, D), x.n, hdr ? '' : String(x.cant == null ? '' : x.cant), hdr ? '' : x.un || '', x.tag || '', x.desc || ''].forEach(function (v, i) {
          s.celda(f, i, v, { sz: 9, b: hdr, fill: x.k === 's' ? CLARO : null, h: i >= 4 ? 'left' : 'center' });
        });
        f++;
      });
    });
    bajar(X.generar(lb), 'Indice de requisiciones ' + (pr.numero || '') + '.xlsx', XLSXT);
  }
  // Hoja de respuesta a comentarios del cliente (HR)
  function excelHR(rq) {
    var X = window.XLSX_RE, lb = X.libro(), pr = P.activo(), D = cargar(), r = revActual(rq), A = { b: true, fill: AZUL, color: 'FFFFFF', h: 'center' }, L = { b: true, fill: CLARO, color: AZUL };
    var h = lb.hoja('HR', { orientacion: 'landscape' });
    h.cols([8, 10, 60, 18, 60]);
    h.combinar(0, 0, 0, 4, 'HOJA DE RESPUESTA A COMENTARIOS', { b: true, sz: 12, h: 'center', fill: AZUL, color: 'FFFFFF' });
    [['PROYECTO', (pr.numero ? pr.numero + ' ' : '') + (pr.proyecto || '')], ['Documento:', codigo(rq, D)], ['Revisión emisor:', r.rev], ['Revisión cliente:', rq.revCliente || r.rev],
      ['Revisor cliente:', rq.revisorCliente || ''], ['Nombre doc.:', 'REQUISICIÓN ' + up(rq.titulo)], ['Emisor:', pr.contratista || ''], ['Número de páginas:', String(rq.paginas || '')]]
      .forEach(function (x, i) { h.combinar(1 + i, 0, 1 + i, 1, x[0], L); h.combinar(1 + i, 2, 1 + i, 4, x[1], {}); });
    ['Ítem', 'Página', 'Comentario cliente', 'Referencia', 'Respuesta ' + (pr.contratista || 'emisor')].forEach(function (t, i) { h.celda(10, i, t, A); });
    var hr = (rq.hr || []).length ? rq.hr : [{}];
    hr.forEach(function (c, k) { [String(k + 1), c.pag || '', c.com || '', c.ref || '', c.resp || ''].forEach(function (v, i) { h.celda(11 + k, i, v, { sz: 9, h: i < 2 || i === 3 ? 'center' : 'left', v: 'top' }); }); });
    bajar(X.generar(lb), 'HR-' + codigo(rq, D) + ' R' + (r.rev || '') + '.xlsx', XLSXT);
  }

  window.RQ = {
    cargar: cargar, guardar: guardar, normalizar: normalizar, nueva: nueva, sugerir: sugerir, sinRequisicion: sinRequisicion, tagsProyecto: tagsProyecto, tagsDeTipo: tagsDeTipo, letras: letras,
    refsAuto: refsAuto, itemsAuto: itemsAuto, actualizarEquipos: actualizarEquipos, numerar: numerar, codigo: codigo, revActual: revActual,
    bloques: bloques, html: html, word: word, descargarWord: descargarWord, excelIndice: excelIndice, excelHR: excelHR, bajar: bajar, uid: uid, hoy: hoy
  };
})();
