/* Diagramas de lazo · aplicación · ReyEngi
 * Listado de E/S ⇄ tarjetas y canales ⇄ diagramas de lazo (ISA-5.4), por proyecto.
 */
(function () {
  'use strict';
  var T = window.LAZOS_TARJETAS, D = window.LAZOS_DIBUJO, ISA = window.ISA, P = window.REProyectos;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n, k) { n = String(n); while (n.length < k) n = '0' + n; return n; }
  function uid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var TIPOS = ['AI', 'AO', 'DI', 'DO'];
  var NOMBRE_TIPO = { AI: 'Entrada analógica', AO: 'Salida analógica', DI: 'Entrada digital', DO: 'Salida digital' };

  // ── Estado por proyecto ──
  var CFG0 = {
    proveedor: 'rockwell', modelos: { AI: '1756-IF8', AO: '1756-OF8', DI: '1756-IB16', DO: '1756-OB16E' },
    gabinete: 'GABINETE DE CONTROL PLC-01', zonaTerreno: 'TERRENO', zonaSala: 'SALA ELÉCTRICA', zonaControl: 'SALA DE CONTROL', hmi: 'ESTACIÓN DE OPERACIÓN (HMI)',
    prefijoPlano: 'IN-DL-', primerPlano: 1, docIO: '', docInst: '', docCables: '', docPid: '', fuente24: '+24 VDC', fuente0: '0 VDC', tableroAlim: 'TDA-01', tension4h: '120 VAC',
    chasis: 1, slotInicial: 1, cableAnalogico: '1x1p+sh 16 AWG', cable3h: '1x1t+sh 16 AWG', cableDiscreto: '1x2c 16 AWG', cableMultipar: '12 pares + sh 16 AWG',
    sufCableA: '-J001', sufCableD: '-C001', senalAI: '4-20 mA HART', senalAO: '4-20 mA HART', senalDI: '24 VDC', senalDO: '24 VDC'
  };
  var E;
  function cargar() {
    var d = P.leer('lazos', null);
    if (!d) d = ejemplo();
    d.cfg = Object.assign({}, CFG0, d.cfg || {}); d.cfg.modelos = Object.assign({}, CFG0.modelos, (d.cfg || {}).modelos || {});
    d.doc = d.doc || {}; d.modulos = d.modulos || []; d.senales = d.senales || []; d.lazos = d.lazos || {}; d.revs = d.revs || []; d.over = d.over || {}; d.inst = d.inst || []; d.docInst = d.docInst || {}; d.circ = d.circ || []; d.docCirc = d.docCirc || {};
    E = d;
  }
  var tGuardar = 0;
  function guardar() { if (typeof refrescarFlota === 'function') refrescarFlota(); clearTimeout(tGuardar); tGuardar = setTimeout(function () { P.escribir('lazos', E); estado('Guardado en este navegador · ' + new Date().toLocaleTimeString('es-CL')); }, 250); }
  function estado(t) { var e = $('#estado'); if (e) e.textContent = t; }

  // Ejemplo inicial (dos lazos típicos) para que la sección no parta vacía
  function ejemplo() {
    var d = { cfg: Object.assign({}, CFG0), modulos: [], senales: [], lazos: {}, revs: [{ rev: 'A', fecha: P.hoy ? P.hoy() : '', desc: 'EMITIDO PARA COORDINACIÓN INTERNA', por: '' }], over: {} };
    E = d;
    crearTipico('ctrl', { area: '830', num: '0276', v: 'L', servicio: 'Nivel estanque de agua de proceso TK-01' }, true);
    crearTipico('onoff', { area: '830', num: '0310', v: 'X', servicio: 'Válvula de descarga estanque TK-01' }, true);
    crearTipico('sw', { area: '830', num: '0311', v: 'P', servicio: 'Presión alta descarga bomba PP-01' }, true);
    asignarAuto();
    return d;
  }

  // ── Resolución de cada señal para el dibujo ──
  function modulo(id) { return E.modulos.filter(function (m) { return m.id === id; })[0] || null; }
  function lazoId(s) { return (s.lazo || '').trim() || ISA.lazoDe(s.tag); }
  function base() { var p = T.proveedores.filter(function (x) { return x.id === E.cfg.proveedor; })[0]; return p ? p.base : 0; }
  function resolver(s, conControl) {
    var c = E.cfg, m = modulo(s.mod), tj = m ? T.buscar(m.modelo) : null, h = +s.hilos || 2, ca = s.canal === '' || s.canal == null ? null : +s.canal;
    var analog = s.tipo === 'AI' || s.tipo === 'AO';
    return {
      tag: s.tag, tipo: s.tipo, hilos: h, desc: s.desc || ISA.describir(s.tag), servicio: s.servicio || '', rango: s.rango || '',
      senalTxt: s.senal || c['senal' + s.tipo] || '', marca: s.marca || '', modeloInst: s.modeloInst || '',
      cable: s.cable || ISA.compacto(s.tag) + (analog ? c.sufCableA : c.sufCableD),
      cableSpec: s.cableSpec || (analog ? (h === 3 ? c.cable3h : c.cableAnalogico) : c.cableDiscreto),
      jb: s.jb || '', par: s.par || '', cable2: s.cable2 || '', cable2Spec: s.cable2Spec || '', alimTab: s.alimTab || '',
      modulo: m ? { nombre: m.nombre, modelo: m.modelo, chasis: m.chasis, slot: m.slot, tb: m.tb || ('TB' + s.tipo + '-01'), gabinete: m.gabinete } : null,
      canal: ca == null ? 0 : ca, canalVista: ca == null ? '?' : ca + base(),
      tarjeta: tj, bornes: tj && ca != null ? T.bornes(tj.modelo, ca, E.over) : {},
      hmi: s.hmi ? s.hmi.split(/[,;\s]+/).filter(Boolean) : ISA.funcionesHmi(s.tag, s.tipo, conControl)
    };
  }
  function lazos() {
    var g = {}, orden = [];
    E.senales.forEach(function (s) { if (!s.tag) return; var k = lazoId(s); if (!g[k]) { g[k] = []; orden.push(k); } g[k].push(s); });
    orden.sort(function (a, b) { return a.localeCompare(b, 'es', { numeric: true }); });
    // Número correlativo estable: se asigna una sola vez a cada lazo nuevo
    var mx = Object.keys(E.lazos).reduce(function (m, k) { return Math.max(m, +E.lazos[k].num || 0); }, (+E.cfg.primerPlano || 1) - 1), nuevo = false;
    orden.forEach(function (k) { var o = E.lazos[k] = E.lazos[k] || {}; if (!o.num) { o.num = ++mx; nuevo = true; } });
    if (nuevo) guardar();
    return orden.map(function (k, i) {
      var ss = g[k], L = E.lazos[k] || {}, ordenT = { AI: 0, AO: 1, DI: 2, DO: 3 };
      ss = ss.slice().sort(function (a, b) { return ordenT[a.tipo] - ordenT[b.tipo] || a.tag.localeCompare(b.tag); });
      var vAI = ss.filter(function (s) { return s.tipo === 'AI'; }).map(function (s) { return ISA.analizar(s.tag).variable; });
      var control = ss.some(function (s) { return s.tipo === 'AO' && vAI.indexOf(ISA.analizar(s.tag).variable) >= 0; });
      return { id: k, servicio: L.servicio || (ss.filter(function (s) { return s.servicio; })[0] || {}).servicio || '', plano: L.plano || ((E.cfg.prefijoPlano || '') + pad(L.num, 4)),
        rev: L.rev || '', notas: L.notas || '', tags: ss.map(function (s) { return s.tag; }).join(', '), crudas: ss,
        senales: ss.map(function (s) { return resolver(s, control); }) };
    });
  }
  function ctx() { return { cfg: E.cfg, proyecto: P.activo(), logo: '../../img/logo-reyengi.png', revisiones: E.revs }; }

  // ── Asignación de canales ──
  function usados(modId) { var u = {}; E.senales.forEach(function (s) { if (s.mod === modId && s.canal !== '' && s.canal != null) u[+s.canal] = s; }); return u; }
  function nuevoModulo(tipo) {
    var c = E.cfg, n = E.modulos.filter(function (m) { return m.tipo === tipo; }).length + 1;
    var slot = E.modulos.reduce(function (mx, m) { return +m.chasis === +c.chasis ? Math.max(mx, +m.slot || 0) : mx; }, (+c.slotInicial || 1) - 1) + 1;
    var m = { id: uid(), nombre: tipo + '-' + pad(n, 2), tipo: tipo, modelo: c.modelos[tipo], chasis: c.chasis, slot: slot, tb: 'TB' + tipo + '-' + pad(n, 2) };
    E.modulos.push(m); return m;
  }
  function asignarAuto() {
    var n = 0;
    E.senales.forEach(function (s) {
      var m = modulo(s.mod);
      if (m && m.tipo === s.tipo && s.canal !== '' && s.canal != null) return;
      var libres = E.modulos.filter(function (x) { return x.tipo === s.tipo; }), hecho = false;
      libres.some(function (x) {
        var tj = T.buscar(x.modelo), u = usados(x.id);
        for (var c = 0; c < (tj ? tj.canales : 8); c++) if (!u[c]) { s.mod = x.id; s.canal = c; hecho = true; return true; }
        return false;
      });
      if (!hecho) { var nm = nuevoModulo(s.tipo); s.mod = nm.id; s.canal = 0; }
      n++;
    });
    return n;
  }

  // ── Lazos típicos (de lazo a listado de E/S) ──
  var TIPICOS = {
    tx2: { n: 'Transmisor 2 hilos (AI)', s: [['IT', 'AI', 2]] },
    tx3: { n: 'Transmisor 3 hilos (AI)', s: [['IT', 'AI', 3]] },
    tx4: { n: 'Transmisor 4 hilos con alimentación propia (AI)', s: [['IT', 'AI', 4]] },
    ctrl: { n: 'Lazo de control: transmisor + válvula de control (AI + AO)', s: [['IT', 'AI', 2], ['V', 'AO', 2]] },
    ao: { n: 'Salida analógica a posicionador / variador (AO)', s: [['Y', 'AO', 2]] },
    sw: { n: 'Interruptor de proceso, contacto seco (DI 2 hilos)', s: [['SH', 'DI', 2]] },
    prox: { n: 'Sensor inductivo PNP 3 hilos (DI)', s: [['S', 'DI', 3]] },
    onoff: { n: 'Válvula on/off con solenoide y finales de carrera (DO + 2 DI)', s: [['XV', 'DO', 2, true], ['ZSO', 'DI', 2, true], ['ZSC', 'DI', 2, true]] },
    motor: { n: 'Equipo / motor: en servicio, falla y comando por relé (2 DI + DO 4 hilos)', s: [['YS', 'DI', 2, true], ['XA', 'DI', 2, true], ['HS', 'DO', 4, true]] }
  };
  function crearTipico(k, o, silencio) {
    var t = TIPICOS[k], creadas = [];
    t.s.forEach(function (x) {
      var letras = x[3] ? x[0] : o.v + x[0], tag = (o.area ? o.area + '-' : '') + letras + '-' + o.num;
      if (E.senales.some(function (s) { return s.tag === tag; })) return;
      var s = { id: uid(), tag: tag, tipo: x[1], hilos: x[2], servicio: o.servicio || '', lazo: '', canal: '' };
      E.senales.push(s); creadas.push(s);
    });
    var id = (o.area ? o.area + '-' : '') + o.num;
    if (o.servicio) E.lazos[id] = Object.assign({}, E.lazos[id] || {}, { servicio: o.servicio });
    if (!silencio) { asignarAuto(); guardar(); }
    return creadas;
  }

  // ── Vistas ──
  var vista = 'lazos', sel = null;
  function mostrar(v) {
    vista = v;
    $$('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.v === v)); });
    $$('main > section').forEach(function (s) { s.hidden = s.id !== 'v-' + v; });
    var fn = ({ lazos: pintarLazos, io: pintarIO, mod: pintarModulos, cfg: pintarCfg })[v] || (window.LAZOS_VISTAS || {})[v]; if (fn) fn();
    try { localStorage.setItem('reyengi-lazos-vista', v); } catch (e) {}
    if (v === 'lazos' && FL.lazo && FL.abierta) sel = sel || FL.lazo;
    refrescarFlota(true);
  }

  // Lazos: lista y hojas
  function pintarLazos() {
    var Ls = lazos(), q = ($('#buscarLazo').value || '').toLowerCase();
    if (!sel || !Ls.some(function (l) { return l.id === sel; })) sel = Ls[0] ? Ls[0].id : null;
    $('#listaLazos').innerHTML = Ls.filter(function (l) { return !q || (l.id + ' ' + l.servicio + ' ' + l.tags).toLowerCase().indexOf(q) >= 0; }).map(function (l) {
      return '<button type="button" class="itlazo" data-id="' + esc(l.id) + '" aria-pressed="' + (l.id === sel) + '"><b>' + esc(l.id) + '</b><span>' + esc(l.servicio || '—') + '</span><small>' + esc(l.plano) + ' · ' + l.senales.length + ' señal(es)</small></button>';
    }).join('') || '<p class="vacio">Aún no hay lazos. Crea uno típico o agrega señales al listado de E/S.</p>';
    var L = Ls.filter(function (l) { return l.id === sel; })[0];
    $('#hojaVacia').hidden = !!L; $('#hojaLazo').hidden = !L;
    if (!L) return;
    $('#lzServicio').value = L.servicio; $('#lzPlano').value = (E.lazos[L.id] || {}).plano || ''; $('#lzPlano').placeholder = L.plano; $('#lzNotas').value = L.notas;
    $('#lzTitulo').textContent = 'Lazo ' + L.id;
    var hs = D.hojas(L, ctx());
    $('#hojas').innerHTML = hs.map(function (h) { return '<div class="hoja">' + D.svg(h, { mm: false }) + '</div>'; }).join('');
    var sinCanal = L.crudas.filter(function (s) { return !modulo(s.mod) || s.canal === '' || s.canal == null; });
    $('#avisoLazo').hidden = !sinCanal.length;
    $('#avisoLazo').textContent = sinCanal.length ? 'Sin tarjeta o canal asignado: ' + sinCanal.map(function (s) { return s.tag; }).join(', ') + '. Asígnalos en "Tarjetas y canales" o con "Asignar canales automáticamente".' : '';
    $('#tablaLazo').innerHTML = '<tr><th>Tag</th><th>Tipo</th><th>Hilos</th><th>Módulo</th><th>Canal</th><th>Bornes de tarjeta</th></tr>' + L.senales.map(function (s, i) {
      var b = s.bornes || {}, txt = Object.keys(b).filter(function (k) { return k !== 'puentes'; }).map(function (k) { return T.nombreRol[k] + ': ' + b[k].n + ' (' + b[k].s + ')'; }).join(' · ');
      return '<tr><td>' + esc(s.tag) + '</td><td>' + s.tipo + '</td><td>' + s.hilos + '</td><td>' + esc(s.modulo ? s.modulo.nombre + ' · ' + s.modulo.modelo : '—') + '</td><td>' + esc(s.canalVista) + '</td><td class="peq">' + esc(txt) + (s.tarjeta && !s.tarjeta.verificado ? ' <em class="ref">referencial</em>' : '') + '</td></tr>';
    }).join('');
  }
  function lazoSel() { return lazos().filter(function (l) { return l.id === sel; })[0]; }

  // Listado de E/S (tabla editable)
  var COLS = [
    { k: 'tag', l: 'Tag', w: 130 }, { k: 'lazo', l: 'Lazo', w: 90, ph: function (s) { return ISA.lazoDe(s.tag); } },
    { k: 'tipo', l: 'Tipo', w: 62, sel: TIPOS }, { k: 'hilos', l: 'Hilos', w: 56, sel: ['2', '3', '4'] },
    { k: 'desc', l: 'Descripción del instrumento', w: 200, ph: function (s) { return ISA.describir(s.tag); } }, { k: 'servicio', l: 'Servicio', w: 220 },
    { k: 'rango', l: 'Rango', w: 80 }, { k: 'senal', l: 'Señal', w: 92, ph: function (s) { return E.cfg['senal' + s.tipo]; } },
    { k: 'jb', l: 'Caja (JB)', w: 90 }, { k: 'cable', l: 'Cable', w: 130, ph: function (s) { return resolver(s).cable; } },
    { k: 'mod', l: 'Módulo', w: 110, mod: true }, { k: 'canal', l: 'Canal', w: 64, canal: true },
    { k: 'hmi', l: 'HMI', w: 80, ph: function (s) { return resolver(s).hmi.join(','); } },
    { k: 'tagSenal', l: 'Tag señal', w: 130, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.tagSenal(s) : ''; } },
    { k: 'descSenal', l: 'Descripción de la señal', w: 220, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.descSenal(s) : ''; } },
    { k: 'pid', l: 'P&ID', w: 150 }, { k: 'unidad', l: 'Unidad', w: 70, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.rangoUnidad(s)[1] : ''; } },
    { k: 'aLL', l: 'LL', w: 52, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.alarma(s, 'LL') : ''; } }, { k: 'aL', l: 'L', w: 52, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.alarma(s, 'L') : ''; } },
    { k: 'aH', l: 'H', w: 52, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.alarma(s, 'H') : ''; } }, { k: 'aHH', l: 'HH', w: 52, ph: function (s) { return window.LAZOS_DOC ? window.LAZOS_DOC.alarma(s, 'HH') : ''; } },
    { k: 'obs', l: 'Observaciones', w: 180 }, { k: 'rev', l: 'Rev.', w: 50 },
    { k: 'marca', l: 'Marca', w: 90 }, { k: 'modeloInst', l: 'Modelo', w: 90 }
  ];
  function opcionesCanal(s) {
    var m = modulo(s.mod); if (!m) return '<option value="">—</option>';
    var tj = T.buscar(m.modelo), u = usados(m.id), o = ['<option value="">—</option>'];
    for (var c = 0; c < (tj ? tj.canales : 8); c++) { var ocup = u[c] && u[c] !== s; o.push('<option value="' + c + '"' + (+s.canal === c && s.canal !== '' ? ' selected' : '') + (ocup ? ' disabled' : '') + '>' + (c + base()) + (ocup ? ' · ' + esc(u[c].tag) : '') + '</option>'); }
    return o.join('');
  }
  function pintarIO() {
    var q = ($('#buscarIO').value || '').toLowerCase();
    var filas = E.senales.filter(function (s) { return !q || JSON.stringify(s).toLowerCase().indexOf(q) >= 0; });
    $('#tablaIO thead').innerHTML = '<tr><th class="chk"><input type="checkbox" id="chkTodo" aria-label="Seleccionar todo"></th>' + COLS.map(function (c) { return '<th style="min-width:' + c.w + 'px">' + c.l + '</th>'; }).join('') + '</tr>';
    $('#tablaIO tbody').innerHTML = filas.map(function (s) {
      return '<tr data-id="' + s.id + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + esc(s.tag) + '"></td>' + COLS.map(function (c) {
        if (c.sel) return '<td><select data-k="' + c.k + '">' + c.sel.map(function (o) { return '<option' + (String(s[c.k]) === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></td>';
        if (c.mod) return '<td><select data-k="mod"><option value="">—</option>' + E.modulos.filter(function (m) { return m.tipo === s.tipo; }).map(function (m) { return '<option value="' + m.id + '"' + (m.id === s.mod ? ' selected' : '') + '>' + esc(m.nombre) + '</option>'; }).join('') + '</select></td>';
        if (c.canal) return '<td><select data-k="canal">' + opcionesCanal(s) + '</select></td>';
        return '<td><input data-k="' + c.k + '" value="' + esc(s[c.k] || '') + '" placeholder="' + esc(c.ph ? c.ph(s) || '' : '') + '"></td>';
      }).join('') + '</tr>';
    }).join('');
    $('#cuentaIO').textContent = E.senales.length + ' señales · ' + TIPOS.map(function (t) { return E.senales.filter(function (s) { return s.tipo === t; }).length + ' ' + t; }).join(' · ');
  }
  function senal(id) { return E.senales.filter(function (s) { return s.id === id; })[0]; }

  // Tarjetas y canales
  function pintarModulos() {
    var html = TIPOS.map(function (t) {
      var ms = E.modulos.filter(function (m) { return m.tipo === t; });
      return '<h2 class="grupo">' + NOMBRE_TIPO[t] + ' (' + t + ') <button type="button" class="mini" data-nuevo="' + t + '">+ Agregar tarjeta</button></h2>' + (ms.length ? ms.map(fichaModulo).join('') : '<p class="vacio">Sin tarjetas ' + t + '.</p>');
    }).join('');
    $('#modulos').innerHTML = html;
  }
  function fichaModulo(m) {
    var tj = T.buscar(m.modelo), u = usados(m.id), sinAsignar = E.senales.filter(function (s) { return s.tipo === m.tipo && (!modulo(s.mod) || s.canal === '' || s.canal == null); });
    var modelos = T.lista.filter(function (x) { return x.tipo === m.tipo; });
    var cab = '<div class="modcab"><label>Nombre<input data-m="nombre" value="' + esc(m.nombre) + '"></label>' +
      '<label class="ancho">Tarjeta<select data-m="modelo">' + T.proveedores.map(function (p) { var ls = modelos.filter(function (x) { return x.prov === p.id; }); return ls.length ? '<optgroup label="' + esc(p.nombre) + '">' + ls.map(function (x) { return '<option value="' + esc(x.modelo) + '"' + (x.modelo === m.modelo ? ' selected' : '') + '>' + esc(x.modelo + ' · ' + x.desc) + '</option>'; }).join('') + '</optgroup>' : ''; }).join('') + '</select></label>' +
      '<label>Chasis<input data-m="chasis" value="' + esc(m.chasis) + '"></label><label>Columna<input data-m="columna" value="' + esc(m.columna || '') + '"></label><label>Slot<input data-m="slot" value="' + esc(m.slot) + '"></label><label>Bornera<input data-m="tb" value="' + esc(m.tb || '') + '"></label>' +
      '<label class="ancho">Gabinete (opcional)<input data-m="gabinete" value="' + esc(m.gabinete || '') + '" placeholder="' + esc(E.cfg.gabinete) + '"></label>' +
      '<button type="button" class="mini" data-bornes="' + m.id + '">Editar bornes</button><button type="button" class="mini peligro" data-borrar="' + m.id + '">Quitar</button></div>' +
      '<p class="fuente">' + (tj ? (tj.verificado ? '✓ Bornes verificados: ' : 'Bornes referenciales: ') + esc(tj.fuente) + (tj.rtb ? ' · Bornera ' + esc(tj.rtb) : '') + ' · Alimentación del lazo ' + tj.alim + (tj.tension ? ' · ' + tj.tension : '') : 'Modelo no encontrado en la biblioteca') + '</p>';
    var filas = [];
    for (var c = 0; c < (tj ? tj.canales : 8); c++) {
      var s = u[c], bo = tj ? T.bornes(tj.modelo, c, E.over) : {};
      var bt = Object.keys(bo).filter(function (k) { return k !== 'puentes'; }).map(function (k) { return '<span title="' + esc(T.nombreRol[k]) + '">' + esc(bo[k].s) + ' <b>' + esc(bo[k].n) + '</b></span>'; }).join('');
      var ops = '<option value="">— libre —</option>' + (s ? '<option value="' + s.id + '" selected>' + esc(s.tag) + '</option>' : '') + sinAsignar.map(function (x) { return '<option value="' + x.id + '">' + esc(x.tag) + '</option>'; }).join('');
      filas.push('<tr><td class="c">' + (c + base()) + '</td><td class="bornes">' + bt + '</td><td><select data-canal="' + c + '" data-mod="' + m.id + '" aria-label="Instrumento del canal ' + (c + base()) + '">' + ops + '</select></td><td class="peq">' + esc(s ? (s.servicio || ISA.describir(s.tag)) : '') + '</td></tr>');
    }
    return '<article class="modulo" data-id="' + m.id + '">' + cab + '<table class="canales"><tr><th>Canal</th><th>Bornes</th><th>Instrumento</th><th>Servicio</th></tr>' + filas.join('') + '</table></article>';
  }

  // Configuración
  var CAMPOS_CFG = [
    { g: 'Sistema de control', c: [{ k: 'proveedor', l: 'Proveedor / plataforma', prov: 1 }, { k: 'modelos.AI', l: 'Tarjeta AI por defecto', tipo: 'AI' }, { k: 'modelos.AO', l: 'Tarjeta AO por defecto', tipo: 'AO' }, { k: 'modelos.DI', l: 'Tarjeta DI por defecto', tipo: 'DI' }, { k: 'modelos.DO', l: 'Tarjeta DO por defecto', tipo: 'DO' }, { k: 'chasis', l: 'Chasis / rack por defecto' }, { k: 'slotInicial', l: 'Primer slot de E/S' }] },
    { g: 'Zonas del diagrama', c: [{ k: 'zonaTerreno', l: 'Zona de terreno' }, { k: 'zonaSala', l: 'Sala eléctrica' }, { k: 'gabinete', l: 'Gabinete' }, { k: 'zonaControl', l: 'Sala de control' }, { k: 'hmi', l: 'Estación de operación' }] },
    { g: 'Planos y referencias', c: [{ k: 'prefijoPlano', l: 'Prefijo del N° de plano (ej. 3450-IN-DL-)' }, { k: 'primerPlano', l: 'Primer número correlativo' }, { k: 'docIO', l: 'Listado de E/S (N° documento)' }, { k: 'docInst', l: 'Listado de instrumentos (N° documento)' }, { k: 'docCables', l: 'Listado de circuitos (N° documento)' }, { k: 'docPid', l: 'P&ID de referencia' }] },
    { g: 'Alimentación y cables', c: [{ k: 'fuente24', l: 'Barra positiva 24 VDC' }, { k: 'fuente0', l: 'Barra 0 VDC' }, { k: 'tableroAlim', l: 'Tablero de alimentación de 4 hilos' }, { k: 'tension4h', l: 'Tensión de equipos de 4 hilos' }, { k: 'cableAnalogico', l: 'Cable analógico 2 hilos' }, { k: 'cable3h', l: 'Cable analógico 3 hilos' }, { k: 'cableDiscreto', l: 'Cable discreto' }, { k: 'cableMultipar', l: 'Cable multipar JB–gabinete' }, { k: 'sufCableA', l: 'Sufijo de cable analógico' }, { k: 'sufCableD', l: 'Sufijo de cable discreto' }] },
    { g: 'Señales por defecto', c: [{ k: 'senalAI', l: 'Señal AI' }, { k: 'senalAO', l: 'Señal AO' }, { k: 'senalDI', l: 'Señal DI' }, { k: 'senalDO', l: 'Señal DO' }] }
  ];
  function getK(k) { var p = k.split('.'); return p.length > 1 ? E.cfg[p[0]][p[1]] : E.cfg[k]; }
  function setK(k, v) { var p = k.split('.'); if (p.length > 1) E.cfg[p[0]][p[1]] = v; else E.cfg[k] = v; }
  var ROTULO = [['cliente', 'Cliente'], ['proyecto', 'Título del proyecto'], ['numero', 'N° de proyecto'], ['rev', 'Revisión vigente'], ['por', 'Elaboró'], ['porFecha', 'Fecha'], ['reviso', 'Revisó'], ['revisoFecha', 'Fecha'], ['aprobo', 'Aprobó'], ['aproboFecha', 'Fecha']];
  function pintarCfg() {
    var pr = P.activo();
    $('#rotulo').innerHTML = '<legend>Viñeta (rótulo de los planos)</legend>' + ROTULO.map(function (r) { return '<label' + (r[0] === 'proyecto' || r[0] === 'cliente' ? ' class="ancho"' : '') + '>' + r[1] + '<input data-p="' + r[0] + '" value="' + esc(pr[r[0]] || '') + '"></label>'; }).join('') +
      '<p class="ayuda ancho">Estos datos son los del proyecto activo y también los usan las hojas de datos y las especificaciones técnicas.</p>';
    $('#cfgForm').innerHTML = CAMPOS_CFG.map(function (g) {
      return '<fieldset><legend>' + g.g + '</legend>' + g.c.map(function (c) {
        var v = getK(c.k);
        if (c.prov) return '<label>' + c.l + '<select data-c="' + c.k + '">' + T.proveedores.map(function (p) { return '<option value="' + p.id + '"' + (p.id === v ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select></label>';
        if (c.tipo) return '<label>' + c.l + '<select data-c="' + c.k + '">' + T.lista.filter(function (x) { return x.tipo === c.tipo; }).map(function (x) { return '<option value="' + esc(x.modelo) + '"' + (x.modelo === v ? ' selected' : '') + '>' + esc(x.modelo) + (x.prov !== E.cfg.proveedor ? ' (' + x.prov + ')' : '') + '</option>'; }).join('') + '</select></label>';
        return '<label>' + c.l + '<input data-c="' + c.k + '" value="' + esc(v) + '"></label>';
      }).join('') + '</fieldset>';
    }).join('');
    $('#revs').innerHTML = '<tr><th>Rev.</th><th>Fecha</th><th>Descripción</th><th>Por</th><th>Revisó</th><th>Aprobó</th><th>Cliente</th><th></th></tr>' + E.revs.map(function (r, i) {
      return '<tr>' + ['rev', 'fecha', 'desc', 'por', 'reviso', 'aprobo', 'cliente'].map(function (k) { return '<td><input data-r="' + i + '" data-k="' + k + '" value="' + esc(r[k] || '') + '"></td>'; }).join('') + '<td><button type="button" class="mini peligro" data-rq="' + i + '" aria-label="Quitar revisión">×</button></td></tr>';
    }).join('');
  }

  // ── Vista previa flotante (se actualiza mientras se edita el listado, las tarjetas o la viñeta) ──
  var FL = { abierta: false, lazo: null, hoja: 0, z: 1, x: 0, y: 0, ancho: 0 };
  try { var gu = JSON.parse(localStorage.getItem('reyengi-lazos-flota') || '{}'); FL.abierta = !!gu.abierta; FL.pos = gu.pos; } catch (e) {}
  function guardarFlota() { var f = $('#flota'); try { localStorage.setItem('reyengi-lazos-flota', JSON.stringify({ abierta: FL.abierta, pos: { l: f.style.left, t: f.style.top, w: f.style.width, h: f.style.height } })); } catch (e) {} }
  function lazoDeSenal(id) { var s = senal(id); return s && s.tag ? lazoId(s) : null; }
  function flotaVisible() { return FL.abierta && vista !== 'lazos'; }
  var tFlota = 0;
  function refrescarFlota(inmediato) { clearTimeout(tFlota); if (!flotaVisible()) { $('#flota').hidden = true; actualizarBotones(); return; } tFlota = setTimeout(pintarFlota, inmediato ? 0 : 160); }
  function pintarFlota() {
    var f = $('#flota'); f.hidden = !flotaVisible(); actualizarBotones(); if (f.hidden) return;
    var Ls = lazos(); if (!Ls.length) { $('#flLienzo').innerHTML = '<p class="vacio" style="padding:12px">Sin lazos para mostrar.</p>'; return; }
    if (!FL.lazo || !Ls.some(function (l) { return l.id === FL.lazo; })) FL.lazo = sel && Ls.some(function (l) { return l.id === sel; }) ? sel : Ls[0].id;
    var L = Ls.filter(function (l) { return l.id === FL.lazo; })[0], hs = D.hojas(L, ctx());
    if (FL.hoja >= hs.length) FL.hoja = 0;
    $('#flLazo').innerHTML = Ls.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === L.id ? ' selected' : '') + '>' + esc(l.id + (l.servicio ? ' · ' + l.servicio : '')) + '</option>'; }).join('');
    $('#flHoja').textContent = hs.length > 1 ? 'Hoja ' + (FL.hoja + 1) + '/' + hs.length : '';
    $('#flPrev').hidden = $('#flNext').hidden = hs.length < 2;
    var vis = $('#flVista'), w = vis.clientWidth || 600;
    $('#flLienzo').innerHTML = D.svg(hs[FL.hoja], { mm: false }).replace('<svg ', '<svg width="' + w + '" height="' + (w * D.H / D.W).toFixed(0) + '" ');
    FL.ancho = w; aplicarZoom();
  }
  function aplicarZoom() { $('#flLienzo').style.transform = 'translate(' + FL.x + 'px,' + FL.y + 'px) scale(' + FL.z + ')'; $('#flZoom').textContent = Math.round(FL.z * 100) + '%'; }
  function zoomEn(fac, cx, cy) {
    var z2 = Math.min(8, Math.max(0.5, FL.z * fac)); fac = z2 / FL.z;
    FL.x = cx - (cx - FL.x) * fac; FL.y = cy - (cy - FL.y) * fac; FL.z = z2; aplicarZoom();
  }
  function ajustar() { FL.z = 1; FL.x = 0; FL.y = 0; aplicarZoom(); }
  function mirarSenal(id) { // centra la vista en el bloque de la señal editada
    var s = senal(id); if (!s) return;
    var nuevo = lazoDeSenal(id); if (nuevo && nuevo !== FL.lazo) { FL.lazo = nuevo; FL.hoja = 0; pintarFlota(); }
    var L = lazos().filter(function (l) { return l.id === FL.lazo; })[0]; if (!L) return;
    var i = L.crudas.indexOf(s); if (i < 0) return;
    if (Math.floor(i / 4) !== FL.hoja) { FL.hoja = Math.floor(i / 4); pintarFlota(); }
    if (FL.z <= 1.05) return;
    var esc2 = FL.ancho / D.W, yBloque = (26 + (i % 4) * 49.5 + 25) * esc2 * FL.z, vis = $('#flVista');
    FL.y = vis.clientHeight / 2 - yBloque; aplicarZoom();
  }
  function actualizarBotones() { $$('.bVista').forEach(function (b) { b.setAttribute('aria-pressed', String(FL.abierta)); b.textContent = FL.abierta ? 'Ocultar vista previa' : 'Vista previa del lazo'; }); }
  function enlazarFlota() {
    var f = $('#flota'), vis = $('#flVista');
    if (FL.pos && FL.pos.l) { f.style.left = FL.pos.l; f.style.top = FL.pos.t; if (FL.pos.w) f.style.width = FL.pos.w; if (FL.pos.h) f.style.height = FL.pos.h; }
    $$('.bVista').forEach(function (b) { b.addEventListener('click', function () { FL.abierta = !FL.abierta; guardarFlota(); refrescarFlota(true); }); });
    $('#flCerrar').addEventListener('click', function () { FL.abierta = false; guardarFlota(); refrescarFlota(true); });
    $('#flLazo').addEventListener('change', function () { FL.lazo = this.value; FL.hoja = 0; ajustar(); pintarFlota(); });
    $('#flPrev').addEventListener('click', function () { FL.hoja = Math.max(0, FL.hoja - 1); pintarFlota(); });
    $('#flNext').addEventListener('click', function () { FL.hoja++; pintarFlota(); });
    $('#flMas').addEventListener('click', function () { zoomEn(1.4, vis.clientWidth / 2, vis.clientHeight / 2); });
    $('#flMenos').addEventListener('click', function () { zoomEn(1 / 1.4, vis.clientWidth / 2, vis.clientHeight / 2); });
    $('#flAjustar').addEventListener('click', ajustar);
    $('#flAbrir').addEventListener('click', function () { sel = FL.lazo; mostrar('lazos'); });
    vis.addEventListener('wheel', function (e) { e.preventDefault(); var r = vis.getBoundingClientRect(); zoomEn(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    vis.addEventListener('dblclick', function (e) { var r = vis.getBoundingClientRect(); zoomEn(2, e.clientX - r.left, e.clientY - r.top); });
    var arr = null;
    vis.addEventListener('pointerdown', function (e) { e.preventDefault(); arr = { x: e.clientX - FL.x, y: e.clientY - FL.y }; vis.setPointerCapture(e.pointerId); vis.classList.add('arrastra'); });
    vis.addEventListener('pointermove', function (e) { if (!arr) return; FL.x = e.clientX - arr.x; FL.y = e.clientY - arr.y; aplicarZoom(); });
    vis.addEventListener('pointerup', function () { arr = null; vis.classList.remove('arrastra'); });
    // Mover la ventana desde su barra de título
    var mov = null, cab = $('#flCab');
    cab.addEventListener('pointerdown', function (e) { if (e.target.closest('button,select')) return; var r = f.getBoundingClientRect(); mov = { dx: e.clientX - r.left, dy: e.clientY - r.top }; cab.setPointerCapture(e.pointerId); });
    cab.addEventListener('pointermove', function (e) { if (!mov) return; f.style.left = Math.max(0, Math.min(innerWidth - 120, e.clientX - mov.dx)) + 'px'; f.style.top = Math.max(0, Math.min(innerHeight - 40, e.clientY - mov.dy)) + 'px'; f.style.right = 'auto'; f.style.bottom = 'auto'; });
    cab.addEventListener('pointerup', function () { if (mov) { mov = null; guardarFlota(); } });
    if (window.ResizeObserver) new ResizeObserver(function () { if (!f.hidden && Math.abs(vis.clientWidth - FL.ancho) > 8) { guardarFlota(); refrescarFlota(); } }).observe(f);
    // Seguir la fila que se está editando
    $('#tablaIO').addEventListener('focusin', function (e) {
      var tr = e.target.closest('tr[data-id]'); if (!tr) return;
      if (e.target.dataset.k === 'tag') { var s0 = senal(tr.dataset.id); e.target.dataset.antes = s0 ? s0.tag : ''; }
      if (flotaVisible()) mirarSenal(tr.dataset.id);
    });
    $('#tablaIO').addEventListener('input', function (e) {
      var t = e.target, tr = t.closest('tr[data-id]'); if (!tr || t.tagName !== 'INPUT' || !t.dataset.k) return;
      var s = senal(tr.dataset.id); if (!s) return; s[t.dataset.k] = t.dataset.k === 'tag' ? t.value.toUpperCase().trim() : t.value; refrescarFlota();
    });
    $('#modulos').addEventListener('focusin', function (e) { var sl = e.target.closest('select[data-canal]'); if (sl && sl.value && flotaVisible()) mirarSenal(sl.value); });
  }

  // ── Exportar ──
  function descargar(nombre, datos, tipo) {
    var b = new Blob([datos], { type: tipo || 'application/octet-stream' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function nombreArch(s) { return String(s).replace(/[\\/:*?"<>|]+/g, '-'); }
  function imprimir(lista) {
    var cont = $('#imp');
    cont.innerHTML = lista.map(function (L) { return D.hojas(L, ctx()).map(function (h) { return '<div class="hojaImp">' + D.svg(h) + '</div>'; }).join(''); }).join('');
    setTimeout(function () { window.print(); }, 150);
  }
  function dxfLazo(L) { return D.dxf(D.hojas(L, ctx())); }
  function dxfTodos() {
    var Ls = lazos(); if (!Ls.length) return;
    var arch = Ls.map(function (L) { return { nombre: nombreArch(L.plano) + '.dxf', datos: dxfLazo(L) }; });
    descargar('Diagramas de lazo.zip', window.XLSX_RE._zip(arch), 'application/zip');
  }
  var COLS_X = ['tag', 'lazo', 'tipo', 'hilos', 'desc', 'servicio', 'rango', 'senal', 'jb', 'cable', 'modulo', 'modeloTarjeta', 'chasis', 'slot', 'canal', 'bornes', 'hmi', 'marca', 'modeloInst'];
  var TIT_X = ['TAG', 'LAZO', 'TIPO', 'HILOS', 'DESCRIPCIÓN', 'SERVICIO', 'RANGO', 'SEÑAL', 'CAJA (JB)', 'CABLE', 'MÓDULO', 'TARJETA', 'CHASIS', 'SLOT', 'CANAL', 'BORNES DE TARJETA', 'HMI', 'MARCA', 'MODELO'];
  function filaExport(s) {
    var r = resolver(s), m = modulo(s.mod), b = r.bornes || {};
    return { tag: s.tag, lazo: lazoId(s), tipo: s.tipo, hilos: s.hilos, desc: r.desc, servicio: s.servicio || '', rango: s.rango || '', senal: r.senalTxt, jb: s.jb || '', cable: r.cable,
      modulo: m ? m.nombre : '', modeloTarjeta: m ? m.modelo : '', chasis: m ? m.chasis : '', slot: m ? m.slot : '', canal: s.canal === '' || s.canal == null ? '' : +s.canal + base(),
      bornes: Object.keys(b).filter(function (k) { return k !== 'puentes'; }).map(function (k) { return k + ':' + b[k].n; }).join(' '), hmi: r.hmi.join(','), marca: s.marca || '', modeloInst: s.modeloInst || '' };
  }
  function exportarExcel() {
    var X = window.XLSX_RE, lb = X.libro(), h = lb.hoja('Listado E-S', { orientacion: 'landscape' });
    lb.titulo = 'Listado de entradas y salidas'; lb.autor = 'ReyEngi';
    var pr = P.activo();
    h.cols([16, 11, 6, 6, 30, 34, 12, 14, 12, 18, 9, 18, 7, 6, 7, 26, 10, 12, 12]);
    h.combinar(0, 0, 0, 18, 'LISTADO DE ENTRADAS Y SALIDAS · ' + (pr.proyecto || ''), { b: true, sz: 12, fill: '022A55', color: 'FFFFFF', h: 'center' });
    h.combinar(1, 0, 1, 18, (E.cfg.docIO ? 'Doc. ' + E.cfg.docIO + ' · ' : '') + 'Plataforma: ' + (T.proveedores.filter(function (p) { return p.id === E.cfg.proveedor; })[0] || {}).nombre, { sz: 9, h: 'center' });
    TIT_X.forEach(function (t, i) { h.celda(2, i, t, { b: true, fill: 'DCE3EB', color: '022A55', h: 'center', v: 'center', wrap: true }); });
    E.senales.forEach(function (s, r) { var f = filaExport(s); COLS_X.forEach(function (k, i) { h.celda(r + 3, i, f[k] == null ? '' : f[k], { sz: 9 }); }); });
    h.filasTitulo(2, 2);
    descargar('Listado E-S.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  function exportarCsv() {
    var q = function (v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var txt = [TIT_X.join(';')].concat(E.senales.map(function (s) { var f = filaExport(s); return COLS_X.map(function (k) { return q(f[k]); }).join(';'); })).join('\r\n');
    descargar('Listado E-S.csv', '﻿' + txt, 'text/csv;charset=utf-8');
  }

  // ── Importar: pegar desde Excel, CSV o .xlsx ──
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/]+/g, ' ').trim(); }
  var MAPA = {
    tag: ['tag', 'tag instrumento', 'instrumento tag', 'tag n'], lazo: ['lazo', 'loop', 'n lazo'], tipo: ['tipo', 'tipo e/s', 'e/s', 'io', 'tipo senal', 'i/o', 'tipo io'],
    hilos: ['hilos', 'n hilos', 'wires', 'conexion'], desc: ['descripcion', 'description', 'instrumento', 'tipo de instrumento'], servicio: ['servicio', 'service', 'servicio / descripcion'],
    rango: ['rango', 'range'], senal: ['senal', 'signal'], jb: ['jb', 'caja', 'caja de conexion', 'caja de conexiones'], cable: ['cable', 'n cable', 'cable n'],
    modulo: ['modulo', 'tarjeta', 'card', 'module'], chasis: ['chasis', 'rack', 'chassis'], slot: ['slot', 'ranura'], canal: ['canal', 'channel', 'ch', 'punto'],
    hmi: ['hmi'], marca: ['marca', 'fabricante'], modeloInst: ['modelo', 'model']
  };
  function mapear(cab) {
    var m = {}; cab.forEach(function (h, i) { var n = norm(h); Object.keys(MAPA).some(function (k) { if (MAPA[k].indexOf(n) >= 0 && m[k] == null) { m[k] = i; return true; } return false; }); });
    return m;
  }
  function importarFilas(filas) {
    filas = filas.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
    var hi = -1, mp = null;
    for (var i = 0; i < Math.min(filas.length, 10); i++) { var m = mapear(filas[i]); if (m.tag != null) { hi = i; mp = m; break; } }
    if (!mp) return { ok: 0, err: 'No se encontró una fila de encabezado con la columna "Tag".' };
    var n = 0, nuevos = 0, base0 = base();
    filas.slice(hi + 1).forEach(function (r) {
      var g = function (k) { return mp[k] == null ? '' : String(r[mp[k]] == null ? '' : r[mp[k]]).trim(); };
      var tag = g('tag').toUpperCase(); if (!tag) return;
      var tipo = g('tipo').toUpperCase().replace(/[^A-Z]/g, '');
      if (TIPOS.indexOf(tipo) < 0) tipo = /AI|ENTRADA ANAL/.test(tipo) ? 'AI' : /T$|E$/.test(ISA.analizar(tag).letras) ? 'AI' : /V$/.test(ISA.analizar(tag).letras) ? 'AO' : 'DI';
      var s = E.senales.filter(function (x) { return x.tag === tag; })[0];
      if (!s) { s = { id: uid(), tag: tag, canal: '' }; E.senales.push(s); nuevos++; }
      s.tipo = tipo; var h = parseInt(g('hilos'), 10); s.hilos = h >= 2 && h <= 4 ? h : (s.hilos || 2);
      ['lazo', 'desc', 'servicio', 'rango', 'senal', 'jb', 'cable', 'hmi', 'marca', 'modeloInst'].forEach(function (k) { var v = g(k); if (v) s[k] = v; });
      var ch = g('chasis'), sl = g('slot'), mn = g('modulo'), ca = g('canal');
      if (ch !== '' || sl !== '' || mn) {
        var mod = E.modulos.filter(function (m) { return m.tipo === tipo && ((mn && m.nombre === mn) || (!mn && String(m.chasis) === ch && String(m.slot) === sl)); })[0];
        if (!mod) { mod = nuevoModulo(tipo); if (mn) mod.nombre = mn; if (ch !== '') mod.chasis = ch; if (sl !== '') mod.slot = sl; }
        s.mod = mod.id;
      }
      if (ca !== '' && !isNaN(+ca)) s.canal = +ca - base0;
      n++;
    });
    return { ok: n, nuevos: nuevos };
  }
  function parseTabla(txt) {
    var sep = txt.indexOf('\t') >= 0 ? '\t' : (txt.split(';').length > txt.split(',').length ? ';' : ',');
    var filas = [], fila = [], cel = '', q = false;
    for (var i = 0; i < txt.length; i++) {
      var ch = txt[i];
      if (q) { if (ch === '"' && txt[i + 1] === '"') { cel += '"'; i++; } else if (ch === '"') q = false; else cel += ch; continue; }
      if (ch === '"') q = true; else if (ch === sep) { fila.push(cel); cel = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; fila.push(cel); filas.push(fila); fila = []; cel = ''; } else cel += ch;
    }
    if (cel || fila.length) { fila.push(cel); filas.push(fila); }
    return filas;
  }
  // Lector mínimo de .xlsx (primera hoja) con DecompressionStream
  function leerXlsx(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), fin = -1;
    for (var i = u8.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    if (fin < 0) return Promise.reject(new Error('Archivo .xlsx no válido'));
    var n = dv.getUint16(fin + 10, true), off = dv.getUint32(fin + 16, true), ent = {}, dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
      var nom = dec.decode(u8.subarray(off + 46, off + 46 + nl)), ini = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      ent[nom] = { met: met, d: u8.subarray(ini, ini + csz) }; off += 46 + nl + el + cl;
    }
    function texto(nom) {
      var e = ent[nom]; if (!e) return Promise.resolve('');
      if (e.met === 0) return Promise.resolve(dec.decode(e.d));
      var ds = new Blob([e.d]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(ds).text();
    }
    var hoja = Object.keys(ent).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
    return Promise.all([texto('xl/sharedStrings.xml'), texto(hoja)]).then(function (r) {
      var p = new DOMParser(), ss = [], sx = p.parseFromString(r[0] || '<sst/>', 'application/xml');
      Array.prototype.forEach.call(sx.getElementsByTagName('si'), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); });
      var hx = p.parseFromString(r[1], 'application/xml'), filas = [];
      Array.prototype.forEach.call(hx.getElementsByTagName('row'), function (row) {
        var f = [];
        Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
          var ref = c.getAttribute('r') || '', col = 0, m = /^([A-Z]+)/.exec(ref);
          if (m) for (var j = 0; j < m[1].length; j++) col = col * 26 + (m[1].charCodeAt(j) - 64); col--;
          var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0], val = '';
          if (t === 's' && v) val = ss[+v.textContent] || ''; else if (t === 'inlineStr' && is) val = is.textContent; else if (v) val = v.textContent;
          f[col < 0 ? f.length : col] = val;
        });
        for (var j = 0; j < f.length; j++) if (f[j] == null) f[j] = '';
        filas.push(f);
      });
      return filas;
    });
  }

  // ── Diálogos ──
  function dialogo(html, alAceptar, op) {
    var d = $('#dlg'); $('#dlgCuerpo').innerHTML = html; $('#dlgTitulo').textContent = (op && op.titulo) || '';
    $('#dlgOk').textContent = (op && op.ok) || 'Aceptar';
    d.returnValue = ''; d.showModal();
    d.onclose = function () { if (d.returnValue === 'ok' && alAceptar) alAceptar(d); };
  }
  function dlgTipico() {
    dialogo('<label>Lazo típico<select id="tTip">' + Object.keys(TIPICOS).map(function (k) { return '<option value="' + k + '">' + esc(TIPICOS[k].n) + '</option>'; }).join('') + '</select></label>' +
      '<div class="fila3"><label>Área<input id="tArea" value="' + esc((lazoSel() && ISA.analizar(lazoSel().crudas[0].tag).area) || '') + '" placeholder="830"></label><label>N° de lazo<input id="tNum" placeholder="0276" required></label>' +
      '<label>Variable (ISA)<select id="tVar">' + Object.keys(ISA.VAR).map(function (k) { return '<option value="' + k + '"' + (k === 'F' ? ' selected' : '') + '>' + k + ' · ' + esc(ISA.VAR[k]) + '</option>'; }).join('') + '</select></label></div>' +
      '<label>Servicio<input id="tServ" placeholder="Flujo de agua a estanque TK-01"></label><p class="ayuda" id="tPrev"></p>', function () {
      var o = { area: $('#tArea').value.trim(), num: $('#tNum').value.trim(), v: $('#tVar').value, servicio: $('#tServ').value.trim() };
      if (!o.num) return;
      crearTipico($('#tTip').value, o); sel = (o.area ? o.area + '-' : '') + o.num; mostrar('lazos');
    }, { titulo: 'Nuevo lazo típico', ok: 'Crear lazo' });
    function prev() {
      var t = TIPICOS[$('#tTip').value], a = $('#tArea').value.trim(), n = $('#tNum').value.trim() || '####', v = $('#tVar').value;
      $('#tPrev').textContent = 'Se agregarán al listado de E/S: ' + t.s.map(function (x) { return (a ? a + '-' : '') + (x[3] ? x[0] : v + x[0]) + '-' + n + ' (' + x[1] + ', ' + x[2] + ' hilos)'; }).join(' · ');
    }
    ['#tTip', '#tArea', '#tNum', '#tVar'].forEach(function (s) { $(s).addEventListener('input', prev); });
    prev();
  }
  function dlgPegar() {
    dialogo('<p class="ayuda">Copia en Excel las filas del listado de E/S <b>incluyendo la fila de encabezados</b> y pégalas aquí. Se reconocen columnas como Tag, Tipo (AI/AO/DI/DO), Hilos, Servicio, Rango, Caja (JB), Cable, Chasis, Slot, Canal, Módulo y HMI. Los tags que ya existen se actualizan.</p><textarea id="pegado" rows="12" placeholder="TAG&#9;TIPO&#9;HILOS&#9;SERVICIO&#9;CHASIS&#9;SLOT&#9;CANAL"></textarea>', function () {
      var r = importarFilas(parseTabla($('#pegado').value)); resultadoImport(r);
    }, { titulo: 'Pegar desde Excel', ok: 'Importar' });
  }
  function resultadoImport(r) {
    if (r.err) { alert(r.err); return; }
    var nAs = 0; if (confirm(r.ok + ' señales leídas (' + r.nuevos + ' nuevas). ¿Asignar automáticamente los canales que falten?')) nAs = asignarAuto();
    guardar(); mostrar(vista); estado(r.ok + ' señales importadas' + (nAs ? ' · ' + nAs + ' canales asignados' : ''));
  }
  function dlgBornes(m) {
    var tj = T.buscar(m.modelo); if (!tj) return;
    var o = (E.over[tj.modelo] = E.over[tj.modelo] || {}), filas = [];
    for (var c = 0; c < tj.canales; c++) {
      var bo = T.bornes(tj.modelo, c, E.over);
      filas.push('<tr><td class="c">' + (c + base()) + '</td>' + Object.keys(bo).filter(function (k) { return k !== 'puentes'; }).map(function (k) {
        return '<td><label class="mini2">' + esc(T.nombreRol[k]) + '<input data-ov="' + c + ':' + k + '" value="' + esc(bo[k].n + '|' + bo[k].s) + '"></label></td>';
      }).join('') + '</tr>');
    }
    dialogo('<p class="ayuda">Corrige los bornes de <b>' + esc(tj.modelo) + '</b> como <code>número|nombre</code> (por ejemplo <code>2|IN-0</code>). Los cambios se guardan en este proyecto y se aplican a todas las tarjetas de este modelo. Fuente: ' + esc(tj.fuente) + '.</p><div class="tscroll"><table class="canales">' + filas.join('') + '</table></div><button type="button" class="mini" id="ovReset">Restablecer bornes de la biblioteca</button>', function (d) {
      $$('[data-ov]', d).forEach(function (i) { var def = T.bornes(tj.modelo, +i.dataset.ov.split(':')[0], {})[i.dataset.ov.split(':')[1]]; if (i.value && i.value !== def.n + '|' + def.s) o[i.dataset.ov] = i.value; else delete o[i.dataset.ov]; });
      guardar(); mostrar(vista);
    }, { titulo: 'Bornes de ' + tj.modelo, ok: 'Guardar bornes' });
    $('#ovReset').addEventListener('click', function () { delete E.over[tj.modelo]; $('#dlg').close('cancel'); guardar(); mostrar(vista); });
  }

  // ── Eventos ──
  function enlazar() {
    $$('.tabs button').forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.v); }); });
    $('#buscarLazo').addEventListener('input', pintarLazos);
    $('#listaLazos').addEventListener('click', function (e) { var b = e.target.closest('.itlazo'); if (!b) return; sel = b.dataset.id; pintarLazos(); });
    ['#lzServicio', '#lzPlano', '#lzNotas'].forEach(function (s) {
      $(s).addEventListener('change', function () { var L = lazoSel(); if (!L) return; var o = E.lazos[L.id] = E.lazos[L.id] || {}; o.servicio = $('#lzServicio').value; o.plano = $('#lzPlano').value; o.notas = $('#lzNotas').value; guardar(); pintarLazos(); });
    });
    $('#bNuevo').addEventListener('click', dlgTipico); $('#bNuevo2').addEventListener('click', dlgTipico);
    $('#bPdf').addEventListener('click', function () { var L = lazoSel(); if (L) imprimir([L]); });
    $('#bPdfTodos').addEventListener('click', function () { imprimir(lazos()); });
    $('#bDxf').addEventListener('click', function () { var L = lazoSel(); if (L) descargar(nombreArch(L.plano) + '.dxf', dxfLazo(L), 'application/dxf'); });
    $('#bDxfTodos').addEventListener('click', dxfTodos);
    $('#bBorrarLazo').addEventListener('click', function () { var L = lazoSel(); if (!L || !confirm('¿Quitar del listado de E/S las ' + L.crudas.length + ' señales del lazo ' + L.id + '?')) return; E.senales = E.senales.filter(function (s) { return L.crudas.indexOf(s) < 0; }); delete E.lazos[L.id]; sel = null; guardar(); pintarLazos(); });
    $('#bEditarIO').addEventListener('click', function () { var L = lazoSel(); mostrar('io'); if (L) { $('#buscarIO').value = L.id; pintarIO(); } });
    // Listado de E/S
    $('#buscarIO').addEventListener('input', pintarIO);
    $('#tablaIO').addEventListener('change', function (e) {
      var t = e.target, tr = t.closest('tr[data-id]'); if (!tr) { if (t.id === 'chkTodo') $$('.chkf').forEach(function (c) { c.checked = t.checked; }); return; }
      if (t.classList.contains('chkf')) return;
      var s = senal(tr.dataset.id), k = t.dataset.k; if (!s || !k) return;
      var v = t.value;
      if (k === 'tag') v = v.toUpperCase().trim();
      if (k === 'hilos') v = +v;
      if (k === 'canal') v = v === '' ? '' : +v;
      if (k === 'tipo' && v !== s.tipo) { s.mod = ''; s.canal = ''; }
      if (k === 'mod') s.canal = '';
      s[k] = v;
      if (k === 'tag' && window.LAZOS_DOC && t.dataset.antes !== v) { window.LAZOS_DOC.renombrar(t.dataset.antes, v); t.dataset.antes = v; }
      guardar();
      if (['tipo', 'mod', 'tag', 'canal'].indexOf(k) >= 0) pintarIO();
    });
    $('#bAgregar').addEventListener('click', function () { var t = E.senales.length ? E.senales[E.senales.length - 1].tipo : 'AI'; E.senales.push({ id: uid(), tag: '', tipo: t, hilos: 2, canal: '' }); guardar(); pintarIO(); var ins = $$('#tablaIO tbody tr:last-child input[data-k="tag"]'); if (ins[0]) ins[0].focus(); });
    $('#bQuitar').addEventListener('click', function () { var ids = $$('.chkf:checked').map(function (c) { return c.closest('tr').dataset.id; }); if (!ids.length || !confirm('¿Quitar ' + ids.length + ' señal(es)?')) return; E.senales = E.senales.filter(function (s) { return ids.indexOf(s.id) < 0; }); guardar(); pintarIO(); });
    $('#bAsignar').addEventListener('click', function () { var n = asignarAuto(); guardar(); mostrar(vista); estado(n ? n + ' señales asignadas a canales libres' : 'Todas las señales ya tienen canal'); });
    $('#bAsignar2').addEventListener('click', function () { var n = asignarAuto(); guardar(); mostrar(vista); estado(n ? n + ' señales asignadas a canales libres' : 'Todas las señales ya tienen canal'); });
    $('#bLiberar').addEventListener('click', function () { if (!confirm('¿Quitar la asignación de canal de todas las señales? Las tarjetas se mantienen.')) return; E.senales.forEach(function (s) { s.canal = ''; }); guardar(); mostrar(vista); });
    $('#bPegar').addEventListener('click', dlgPegar);
    $('#bImportar').addEventListener('click', function () { $('#archivo').click(); });
    $('#archivo').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; this.value = '';
      if (/\.xlsx$/i.test(f.name)) f.arrayBuffer().then(leerXlsx).then(function (filas) { resultadoImport(importarFilas(filas)); }).catch(function (e) { alert('No se pudo leer el archivo: ' + e.message); });
      else f.text().then(function (t) { resultadoImport(importarFilas(parseTabla(t))); });
    });
    $('#bExcel').addEventListener('click', function () { if (window.LAZOS_DOC) window.LAZOS_DOC.excel(); else exportarExcel(); }); $('#bCsv').addEventListener('click', exportarCsv);
    // Tarjetas y canales
    $('#modulos').addEventListener('change', function (e) {
      var t = e.target, art = t.closest('.modulo');
      if (t.dataset.canal != null) {
        var c = +t.dataset.canal, mid = t.dataset.mod;
        E.senales.forEach(function (s) { if (s.mod === mid && +s.canal === c && s.canal !== '') { s.canal = ''; } });
        if (t.value) { var s = senal(t.value); s.mod = mid; s.canal = c; }
        guardar(); pintarModulos(); return;
      }
      if (art && t.dataset.m) { var m = modulo(art.dataset.id); m[t.dataset.m] = t.value; guardar(); if (t.dataset.m === 'modelo') pintarModulos(); }
    });
    $('#modulos').addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.nuevo) { nuevoModulo(t.dataset.nuevo); guardar(); pintarModulos(); }
      else if (t.dataset.borrar) { var m = modulo(t.dataset.borrar); if (!confirm('¿Quitar la tarjeta ' + m.nombre + '? Sus señales quedarán sin canal.')) return; E.senales.forEach(function (s) { if (s.mod === m.id) { s.mod = ''; s.canal = ''; } }); E.modulos = E.modulos.filter(function (x) { return x !== m; }); guardar(); pintarModulos(); }
      else if (t.dataset.bornes) dlgBornes(modulo(t.dataset.bornes));
    });
    // Configuración
    $('#cfgForm').addEventListener('change', function (e) {
      var t = e.target, k = t.dataset.c; if (!k) return; setK(k, t.value);
      if (k === 'proveedor') { var p = T.proveedores.filter(function (x) { return x.id === t.value; })[0]; if (p) Object.assign(E.cfg.modelos, p.def); }
      guardar(); pintarCfg();
    });
    $('#bAplicarProv').addEventListener('click', function () {
      if (!confirm('¿Cambiar todas las tarjetas existentes a las tarjetas por defecto de la configuración? Las señales mantienen su canal si existe en la nueva tarjeta.')) return;
      E.modulos.forEach(function (m) { m.modelo = E.cfg.modelos[m.tipo]; var tj = T.buscar(m.modelo); E.senales.forEach(function (s) { if (s.mod === m.id && +s.canal >= tj.canales) s.canal = ''; }); });
      guardar(); estado('Tarjetas actualizadas'); asignarAuto(); guardar();
    });
    $('#rotulo').addEventListener('input', function (e) {
      var t = e.target; if (!t.dataset.p) return;
      var id = P.activoId(), d = P.datos(id); d[t.dataset.p] = t.value; P.guardar(id, d); refrescarFlota();
    });
    $('#cfgForm').addEventListener('input', function (e) { var t = e.target; if (t.tagName === 'INPUT' && t.dataset.c) { setK(t.dataset.c, t.value); guardar(); } });
    $('#revs').addEventListener('input', function (e) { var t = e.target; if (t.dataset.r == null) return; E.revs[+t.dataset.r][t.dataset.k] = t.value; guardar(); });
    $('#revs').addEventListener('change', function (e) { var t = e.target; if (t.dataset.r == null) return; E.revs[+t.dataset.r][t.dataset.k] = t.value; guardar(); });
    $('#revs').addEventListener('click', function (e) { var t = e.target; if (t.dataset.rq == null) return; E.revs.splice(+t.dataset.rq, 1); guardar(); pintarCfg(); });
    $('#bRev').addEventListener('click', function () { var u = E.revs[E.revs.length - 1]; E.revs.push({ rev: u ? String.fromCharCode((u.rev || 'A').charCodeAt(0) + 1) : 'A', fecha: P.hoy ? P.hoy() : '', desc: '', por: '' }); guardar(); pintarCfg(); });
    $('#bReiniciar').addEventListener('click', function () { if (!confirm('¿Borrar el listado de E/S, las tarjetas y los lazos de este proyecto y cargar el ejemplo?')) return; P.borrar('lazos'); cargar(); guardar(); mostrar('lazos'); });
    // Proyecto activo
    var sp = $('#proy');
    function listaProy() { sp.innerHTML = P.lista().map(function (p) { return '<option value="' + p.id + '"' + (p.id === P.activoId() ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join(''); }
    listaProy();
    sp.addEventListener('change', function () { P.seleccionar(sp.value); cargar(); sel = null; mostrar(vista); });
    window.addEventListener('afterprint', function () { $('#imp').innerHTML = ''; });
  }

  // ── Inicio ──
  cargar();
  enlazar();
  enlazarFlota();
  var v0 = 'lazos'; try { v0 = localStorage.getItem('reyengi-lazos-vista') || 'lazos'; } catch (e) {}
  if (/^#(io|mod|cfg|lazos|doc|inst|circ)$/.test(location.hash)) v0 = location.hash.slice(1);
  mostrar(v0);
  function mirarLazo(id) { if (!flotaVisible() || !id || id === FL.lazo || !lazos().some(function (l) { return l.id === id; })) return; FL.lazo = id; FL.hoja = 0; pintarFlota(); }
  window.__LAZOS = { mirarLazo: mirarLazo, uid: uid, E: function () { return E; }, resolver: resolver, modulo: modulo, base: base, guardar: guardar, descargar: descargar, lazoId: lazoId, refrescarFlota: function () { refrescarFlota(); }, esc: esc, pad: pad, lazos: lazos, asignarAuto: asignarAuto, importarFilas: importarFilas, parseTabla: parseTabla, leerXlsx: leerXlsx, dxfLazo: dxfLazo, crearTipico: crearTipico };
})();
