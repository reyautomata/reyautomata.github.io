/* Diagrama de bloques de control y comunicaciones · ReyEngi
 * Arquitectura del sistema de control por niveles (gestión, supervisión, control y terreno): servidores, estaciones,
 * switches, PLC, I/O remotas, variadores, CCM, paquetes de proveedores e instrumentos agrupados por gabinete, con
 * los medios de comunicación (fibra óptica, Ethernet, buses de campo, cableado y radio).
 * Se genera desde el proyecto (gabinetes y señales del listado de E/S), se edita como tablas de nodos y enlaces y
 * se exporta en lámina A3 (PDF y DXF por capas) y Excel. Incluye consultas sobre el grafo: qué se pierde si falla
 * un equipo y por dónde viaja la señal entre dos equipos.
 */
(function () {
  'use strict';
  var A = window.__LAZOS, D = window.LAZOS_DIBUJO, P = window.REProyectos;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = A.esc, pad = A.pad, cortar = D.cortar;
  function E() { return A.E(); }
  function up(s) { return String(s == null ? '' : s).toUpperCase(); }

  // Capas y colores propios de este plano (se suman a las del motor de dibujo; DXF por capas)
  Object.assign(D.CAPAS, { FIBRA: 30, ETHERNET: 5, BUS: 6, CABLEADO: 7, RADIO: 3, NODOS: 4, NIVELES: 8, RESALTE: 1 });
  Object.assign(D.COL, { FIBRA: '#C0560A', ETHERNET: '#0b3d91', BUS: '#6a1b9a', CABLEADO: '#111', RADIO: '#2f7d32', NODOS: '#0b3d91', NIVELES: '#777', RESALTE: '#E5484D' });

  var NIVELES = [
    [3, 'NIVEL 3', 'GESTIÓN Y RED CORPORATIVA'],
    [2, 'NIVEL 2', 'SUPERVISIÓN · SALA DE CONTROL'],
    [1, 'NIVEL 1', 'CONTROL · SALAS ELÉCTRICAS'],
    [0, 'NIVEL 0', 'TERRENO · EQUIPOS E INSTRUMENTOS']
  ];
  var TIPOS = [
    ['srv', 'Servidor SCADA / aplicación', 2], ['hist', 'Historiador / servidor de datos', 2], ['hmi', 'Estación de operación (HMI)', 2], ['ing', 'Estación de ingeniería', 2],
    ['sw', 'Switch Ethernet', 2], ['fw', 'Firewall / DMZ', 3], ['corp', 'Red corporativa / ERP / MES', 3], ['gps', 'Reloj GPS / NTP', 2],
    ['plc', 'PLC / controlador', 1], ['rio', 'I/O remota (RIO)', 1], ['gw', 'Gateway / convertidor de protocolo', 1], ['pnl', 'Panel de operador local', 1],
    ['ccm', 'CCM / CCM inteligente', 0], ['vdf', 'Variador de frecuencia (VDF)', 0], ['rel', 'Relé de protección / medidor', 0], ['paq', 'Paquete de proveedor (PLC propio)', 0],
    ['inst', 'Instrumentos (grupo)', 0], ['radio', 'Radio / enlace inalámbrico', 0], ['cctv', 'CCTV / seguridad', 0], ['otro', 'Otro equipo', 1]
  ];
  var TIPO = {}; TIPOS.forEach(function (t) { TIPO[t[0]] = t; });
  var MEDIOS = [
    ['FO-SM', 'Fibra óptica monomodo', 'FIBRA'], ['FO-MM', 'Fibra óptica multimodo', 'FIBRA'], ['ETH', 'Ethernet Cat6 (TCP/IP)', 'ETHERNET'],
    ['PN', 'Profinet', 'ETHERNET'], ['EIP', 'EtherNet/IP', 'ETHERNET'], ['MBTCP', 'Modbus TCP', 'ETHERNET'], ['IEC61850', 'IEC 61850', 'ETHERNET'],
    ['PB-DP', 'Profibus DP', 'BUS'], ['PB-PA', 'Profibus PA', 'BUS'], ['MBRTU', 'Modbus RTU (RS-485)', 'BUS'], ['DNET', 'DeviceNet', 'BUS'], ['HART', '4-20 mA + HART', 'CABLEADO'],
    ['HW', 'Cableado (4-20 mA / 24 VDC)', 'CABLEADO'], ['RADIO', 'Radio / inalámbrico', 'RADIO']
  ];
  var MEDIO = {}; MEDIOS.forEach(function (m) { MEDIO[m[0]] = m; });
  var NOTAS = [
    'DIAGRAMA DE BLOQUES REFERENCIAL DE LA ARQUITECTURA DE CONTROL Y COMUNICACIONES; LAS CANTIDADES DE SEÑALES SE TOMAN DEL LISTADO DE ENTRADAS Y SALIDAS.',
    'LA RED DE CONTROL SERÁ INDEPENDIENTE DE LA RED CORPORATIVA; LA CONEXIÓN ENTRE AMBAS SE HARÁ SOLO A TRAVÉS DE FIREWALL (IEC 62443).',
    'LOS ENLACES DE FIBRA ÓPTICA ENTRE SALAS SE INSTALARÁN EN DUCTO O BANDEJA INDEPENDIENTE DE LOS CABLES DE FUERZA Y CON 50 % DE HEBRAS DE RESERVA.',
    'LOS SWITCHES DE LA RED DE CONTROL SERÁN ADMINISTRABLES, DE GRADO INDUSTRIAL Y CON ALIMENTACIÓN REDUNDANTE DESDE UPS.',
    'LOS CABLES ETHERNET SERÁN CAT6 BLINDADOS (S/FTP) CON LARGO MÁXIMO DE 90 M POR TRAMO; SOBRE ESA DISTANCIA SE USARÁ FIBRA ÓPTICA.',
    'TODOS LOS EQUIPOS DE CONTROL Y COMUNICACIONES SE ALIMENTARÁN DESDE EL TABLERO DE INSTRUMENTACIÓN RESPALDADO POR UPS.'
  ];

  // ── Datos ──
  function datos() {
    var e = E(); e.blq = e.blq || { version: 1, nodos: [], enlaces: [], titulo: 'DIAGRAMA DE BLOQUES DE CONTROL Y COMUNICACIONES', plano: '', notas: '' };
    return e.blq;
  }
  function nodo(id) { return datos().nodos.filter(function (n) { return n.id === id; })[0]; }
  function nuevoNodo(o) { return Object.assign({ id: A.uid(), tag: '', desc: '', tipo: 'otro', nivel: 1, ubic: '' }, o || {}); }
  function nuevoEnlace(o) { return Object.assign({ id: A.uid(), a: '', b: '', medio: 'ETH', detalle: '' }, o || {}); }
  // Señales por gabinete según el listado de E/S (las sin tarjeta quedan en «sin asignar»)
  function senalesPorGabinete() {
    var e = E(), out = {};
    e.senales.forEach(function (s) {
      if (!s.tag) return;
      var m = A.modulo(s.mod), g = m ? (m.gabinete || e.cfg.gabinete) : '';
      var k = g || '(SIN TARJETA ASIGNADA)'; out[k] = out[k] || { AI: 0, AO: 0, DI: 0, DO: 0, n: 0 };
      if (out[k][s.tipo] != null) out[k][s.tipo]++; out[k].n++;
    });
    return out;
  }
  function textoSenales(c) { return ['AI', 'AO', 'DI', 'DO'].filter(function (t) { return c[t]; }).map(function (t) { return c[t] + ' ' + t; }).join(' · '); }
  function tagGab(g) { var m = /([A-Z0-9]+-?(PLC|RIO|CP|GC|TC)[- ]?\d+)/i.exec(g); return m ? up(m[1]) : up(g).replace(/^GABINETE (DE )?(CONTROL )?/, '').slice(0, 18) || 'GAB'; }
  // Arquitectura típica a partir del proyecto
  function generar() {
    var b = datos(), N = [], L = [], gs = senalesPorGabinete(), nombres = Object.keys(gs).filter(function (k) { return k.charAt(0) !== '('; });
    if (!nombres.length) nombres = [E().cfg.gabinete || 'GABINETE DE CONTROL PLC-01'];
    var corp = nuevoNodo({ tag: 'RED CORP.', desc: 'RED CORPORATIVA / ERP', tipo: 'corp', nivel: 3, ubic: 'OFICINAS' }),
      fw = nuevoNodo({ tag: 'FW-001', desc: 'FIREWALL / DMZ', tipo: 'fw', nivel: 3, ubic: 'SALA DE SERVIDORES' }),
      s1 = nuevoNodo({ tag: 'SRV-001', desc: 'SERVIDOR SCADA PRINCIPAL', tipo: 'srv', nivel: 2, ubic: 'SALA DE SERVIDORES' }),
      s2 = nuevoNodo({ tag: 'SRV-002', desc: 'SERVIDOR SCADA RESPALDO', tipo: 'srv', nivel: 2, ubic: 'SALA DE SERVIDORES' }),
      hi = nuevoNodo({ tag: 'SRV-003', desc: 'SERVIDOR HISTORIADOR', tipo: 'hist', nivel: 2, ubic: 'SALA DE SERVIDORES' }),
      h1 = nuevoNodo({ tag: 'HMI-001', desc: 'ESTACIÓN DE OPERACIÓN 1', tipo: 'hmi', nivel: 2, ubic: 'SALA DE CONTROL' }),
      h2 = nuevoNodo({ tag: 'HMI-002', desc: 'ESTACIÓN DE OPERACIÓN 2', tipo: 'hmi', nivel: 2, ubic: 'SALA DE CONTROL' }),
      ing = nuevoNodo({ tag: 'EWS-001', desc: 'ESTACIÓN DE INGENIERÍA', tipo: 'ing', nivel: 2, ubic: 'SALA DE CONTROL' }),
      sw = nuevoNodo({ tag: 'SW-001', desc: 'SWITCH NÚCLEO RED DE CONTROL', tipo: 'sw', nivel: 2, ubic: 'SALA DE CONTROL' });
    N.push(corp, fw, s1, s2, hi, h1, h2, ing, sw);
    L.push(nuevoEnlace({ a: corp.id, b: fw.id, medio: 'ETH' }), nuevoEnlace({ a: fw.id, b: sw.id, medio: 'ETH' }));
    [s1, s2, hi, h1, h2, ing].forEach(function (n) { L.push(nuevoEnlace({ a: sw.id, b: n.id, medio: 'ETH' })); });
    nombres.forEach(function (g, i) {
      var esPlc = i === 0 || /PLC/i.test(g), c = gs[g] || { AI: 0, AO: 0, DI: 0, DO: 0, n: 0 };
      var swc = nuevoNodo({ tag: 'SW-' + pad(101 + i, 3), desc: 'SWITCH ' + up(g).slice(0, 26), tipo: 'sw', nivel: 1, ubic: up(g) });
      var ctl = nuevoNodo({ tag: tagGab(g), desc: up(g), tipo: esPlc ? 'plc' : 'rio', nivel: 1, ubic: E().cfg.zonaSala || 'SALA ELÉCTRICA' });
      N.push(swc, ctl);
      L.push(nuevoEnlace({ a: sw.id, b: swc.id, medio: 'FO-MM', detalle: '12 HEBRAS' }), nuevoEnlace({ a: swc.id, b: ctl.id, medio: 'ETH' }));
      if (c.n) { var gi = nuevoNodo({ tag: c.n + ' SEÑALES', desc: 'INSTRUMENTOS ' + textoSenales(c), tipo: 'inst', nivel: 0, ubic: E().cfg.zonaTerreno || 'TERRENO', gab: g }); N.push(gi); L.push(nuevoEnlace({ a: ctl.id, b: gi.id, medio: 'HW', detalle: 'MULTIPAR VÍA CAJAS DE CONEXIÓN' })); }
    });
    if (gs['(SIN TARJETA ASIGNADA)']) { var c0 = gs['(SIN TARJETA ASIGNADA)'], plc0 = N.filter(function (n) { return n.tipo === 'plc'; })[0]; var g0 = nuevoNodo({ tag: c0.n + ' SEÑALES', desc: 'SIN TARJETA ASIGNADA · ' + textoSenales(c0), tipo: 'inst', nivel: 0, ubic: E().cfg.zonaTerreno || 'TERRENO', gab: '' }); N.push(g0); if (plc0) L.push(nuevoEnlace({ a: plc0.id, b: g0.id, medio: 'HW' })); }
    var plc = N.filter(function (n) { return n.tipo === 'plc'; })[0];
    if (plc) {
      var ccm = nuevoNodo({ tag: 'CCM-001', desc: 'CENTRO DE CONTROL DE MOTORES', tipo: 'ccm', nivel: 0, ubic: E().cfg.zonaSala || 'SALA ELÉCTRICA' }),
        vdf = nuevoNodo({ tag: 'VDF', desc: 'VARIADORES DE FRECUENCIA', tipo: 'vdf', nivel: 0, ubic: E().cfg.zonaSala || 'SALA ELÉCTRICA' });
      N.push(ccm, vdf); L.push(nuevoEnlace({ a: plc.id, b: ccm.id, medio: 'EIP' }), nuevoEnlace({ a: plc.id, b: vdf.id, medio: 'PN' }));
    }
    b.nodos = N; b.enlaces = L; return b;
  }
  function actualizarConteos() { // refresca los grupos de instrumentos con el listado de E/S actual
    var gs = senalesPorGabinete(), n = 0;
    datos().nodos.forEach(function (x) { if (x.tipo !== 'inst' || x.gab == null) return; var c = gs[x.gab || '(SIN TARJETA ASIGNADA)']; if (!c) return; x.tag = c.n + ' SEÑALES'; x.desc = (x.gab ? 'INSTRUMENTOS ' : 'SIN TARJETA ASIGNADA · ') + textoSenales(c); n++; });
    return n;
  }

  // ── Grafo y consultas ──
  function vecinos() { var v = {}; datos().nodos.forEach(function (n) { v[n.id] = []; }); datos().enlaces.forEach(function (l) { if (v[l.a] && v[l.b]) { v[l.a].push({ n: l.b, l: l }); v[l.b].push({ n: l.a, l: l }); } }); return v; }
  function supervision() { return datos().nodos.filter(function (n) { return n.nivel >= 2 && /srv|hmi|hist/.test(n.tipo); }); }
  // Nodos que quedan sin comunicación con la supervisión si falla «id»
  function siFalla(id) {
    var v = vecinos(), raiz = supervision().filter(function (n) { return n.id !== id; }), vis = {}; vis[id] = 1;
    var cola = raiz.map(function (n) { vis[n.id] = 1; return n.id; });
    while (cola.length) { var x = cola.shift(); (v[x] || []).forEach(function (w) { if (!vis[w.n]) { vis[w.n] = 1; cola.push(w.n); } }); }
    var antes = {}; (function () { var c2 = supervision().map(function (n) { antes[n.id] = 1; return n.id; }); while (c2.length) { var x2 = c2.shift(); (v[x2] || []).forEach(function (w) { if (!antes[w.n]) { antes[w.n] = 1; c2.push(w.n); } }); } })();
    return datos().nodos.filter(function (n) { return n.id !== id && antes[n.id] && !vis[n.id]; });
  }
  function ruta(a, b) {
    var v = vecinos(), prev = {}, cola = [a]; prev[a] = null;
    while (cola.length) { var x = cola.shift(); if (x === b) break; (v[x] || []).forEach(function (w) { if (!(w.n in prev)) { prev[w.n] = { n: x, l: w.l }; cola.push(w.n); } }); }
    if (!(b in prev)) return null;
    var out = [], c = b; while (prev[c]) { out.unshift({ n: c, l: prev[c].l }); c = prev[c].n; } out.unshift({ n: a, l: null }); return out;
  }

  // ── Dibujo (lámina A3) ──
  var resalte = { nodos: {}, enlaces: {} };
  function planoDe(b) { return b.plano || ((E().cfg.prefijoBlq || 'IN-DB-') + '0001'); }
  function hojas(ctx) {
    var b = datos(), L = new D.Lienzo(); D.marco(L);
    var X0 = 14, X1 = 316, Y0 = 14, Y1 = 222, ETQ = 30;
    var niveles = NIVELES.filter(function (nv) { return b.nodos.some(function (n) { return +n.nivel === nv[0]; }); });
    if (!niveles.length) niveles = NIVELES.slice(1, 3);
    // alto de cada banda según filas necesarias
    var porNivel = {}, filas = {}, maxCol = 7;
    niveles.forEach(function (nv) { porNivel[nv[0]] = b.nodos.filter(function (n) { return +n.nivel === nv[0]; }); filas[nv[0]] = Math.max(1, Math.ceil(porNivel[nv[0]].length / maxCol)); });
    var totF = niveles.reduce(function (s, nv) { return s + filas[nv[0]]; }, 0), hF = Math.min(44, (Y1 - Y0) / totF);
    // orden por baricentro de los vecinos del nivel superior (menos cruces)
    var pos = {}, v = vecinos(), y = Y0;
    niveles.forEach(function (nv, iN) {
      var lista = porNivel[nv[0]].slice(), hB = hF * filas[nv[0]];
      if (iN) lista.sort(function (p, q) { function bc(n) { var xs = (v[n.id] || []).map(function (w) { return pos[w.n] ? pos[w.n].x : null; }).filter(function (x) { return x != null; }); return xs.length ? xs.reduce(function (s, x) { return s + x; }, 0) / xs.length : 9999; } return bc(p) - bc(q); });
      L.r(X0, y, X1 - X0, hB, 'NIVELES', { d: true });
      L.tx(X0 + 3, y + hB / 2 - 1.5, nv[1], 2.2, 'TEXTO', { b: true }); cortar(nv[2], 16).forEach(function (s, j) { L.tx(X0 + 3, y + hB / 2 + 2 + j * 2.3, s, 1.5, 'TEXTO'); });
      L.l(X0 + ETQ, y, X0 + ETQ, y + hB, 'NIVELES');
      var nf = filas[nv[0]], ancho = X1 - X0 - ETQ - 4;
      for (var f = 0; f < nf; f++) {
        var fila = lista.slice(f * maxCol, (f + 1) * maxCol), n = fila.length, w = Math.min(36, (ancho - (n - 1) * 4) / Math.max(n, 1)), paso = ancho / Math.max(n, 1);
        fila.forEach(function (nd, k) { var cx = X0 + ETQ + 2 + paso * (k + 0.5), cy = y + hF * f + hF / 2; pos[nd.id] = { x: cx, y: cy, w: w, h: Math.min(15, hF - 12) }; });
      }
      y += hB;
    });
    // Enlaces: ortogonales entre niveles (canal a media altura), rectos dentro del mismo nivel
    // Reparte los puntos de salida de cada equipo según la posición de sus destinos (menos cruces)
    var salidas = {}, bus = {};
    b.enlaces.forEach(function (l) {
      var pa = pos[l.a], pb = pos[l.b]; if (!pa || !pb) return;
      if (Math.abs(pa.y - pb.y) < 1) { (bus[pa.y] = bus[pa.y] || []).push(l); return; }
      var sup = pa.y < pb.y ? l.a : l.b, inf = sup === l.a ? l.b : l.a; (salidas[sup] = salidas[sup] || []).push({ l: l, inf: inf });
    });
    var xSal = {}, rango = {}, usado = {};
    Object.keys(salidas).forEach(function (id) {
      var p = pos[id], L2 = salidas[id].sort(function (u, w) { return pos[u.inf].x - pos[w.inf].x; }), n = L2.length;
      L2.forEach(function (o, k) { xSal[o.l.id] = n === 1 ? p.x : p.x - p.w / 2 + 3 + (p.w - 6) * k / (n - 1); });
      // el destino más lejano usa el canal más alto: su tramo horizontal no cruza las bajadas de los cercanos
      var porFila = {};
      L2.forEach(function (o) { var f2 = Math.round(pos[o.inf].y); (porFila[f2] = porFila[f2] || []).push(o); });
      Object.keys(porFila).forEach(function (f2) {
        var base = usado[f2] || 0;
        porFila[f2].sort(function (u, w) { return Math.abs(pos[u.inf].x - xSal[u.l.id]) - Math.abs(pos[w.inf].x - xSal[w.l.id]); }).forEach(function (o, r) { rango[o.l.id] = base + r; });
        usado[f2] = base + porFila[f2].length;
      });
    });
    function estilo(l) { var m = MEDIO[l.medio] || MEDIO.ETH, r = resalte.enlaces[l.id]; return { capa: r ? 'RESALTE' : m[2], o: { w: r ? 0.7 : m[2] === 'FIBRA' ? 0.5 : m[2] === 'CABLEADO' ? 0.25 : 0.35, d: m[2] === 'BUS' || m[2] === 'RADIO' } }; }
    b.enlaces.forEach(function (l) {
      var pa = pos[l.a], pb = pos[l.b]; if (!pa || !pb || Math.abs(pa.y - pb.y) < 1) return;
      var es = estilo(l), sup = pa.y < pb.y ? pa : pb, inf = sup === pa ? pb : pa, etq = l.medio + (l.detalle ? ' · ' + up(l.detalle) : '');
      var y1 = sup.y + sup.h / 2, y2 = inf.y - inf.h / 2, ym = y2 - 2.6 - ((rango[l.id] || 0) % 6) * 1.3, xs = xSal[l.id];
      L.l(xs, y1, xs, ym, es.capa, es.o).l(xs, ym, inf.x, ym, es.capa, es.o).l(inf.x, ym, inf.x, y2, es.capa, es.o);
      L.tx(inf.x + 0.8, y2 - 0.7, etq.length > 26 ? l.medio : etq, 1.2, es.capa);
    });
    // Enlaces dentro del mismo nivel: un switch con varios equipos se dibuja como una red (barra) bajo la fila
    Object.keys(bus).forEach(function (yk) {
      var grado = {}; bus[yk].forEach(function (l) { grado[l.a] = (grado[l.a] || 0) + 1; grado[l.b] = (grado[l.b] || 0) + 1; });
      var hubs = Object.keys(grado).filter(function (id) { return grado[id] >= 3; }).sort(function (u, w) { return grado[w] - grado[u]; }), hecho = {}, nb = 0;
      hubs.forEach(function (h) {
        var ls = bus[yk].filter(function (l) { return !hecho[l.id] && (l.a === h || l.b === h); }); if (ls.length < 3) return;
        var ids = [h].concat(ls.map(function (l) { return l.a === h ? l.b : l.a; })), es = estilo(ls[0]), ph = pos[h];
        if (ls.some(function (l) { return resalte.enlaces[l.id]; })) es = { capa: 'RESALTE', o: { w: 0.7 } };
        var yb = ph.y + ph.h / 2 + 3 + nb * 2.2, xs2 = ids.map(function (id) { return pos[id].x; });
        L.l(Math.min.apply(null, xs2), yb, Math.max.apply(null, xs2), yb, es.capa, Object.assign({}, es.o, { w: (es.o.w || 0.35) + 0.15 }));
        ids.forEach(function (id) { var p = pos[id]; L.l(p.x, p.y + p.h / 2, p.x, yb, es.capa, es.o); L.c(p.x, yb, 0.35, es.capa, { f: true }); });
        L.tx(Math.max.apply(null, xs2) + 1, yb + 0.5, (ls[0].medio || 'ETH') + ' · RED ' + up((nodo(h) || {}).tag || ''), 1.25, es.capa);
        ls.forEach(function (l) { hecho[l.id] = 1; }); nb++;
      });
      bus[yk].filter(function (l) { return !hecho[l.id]; }).forEach(function (l, k) {
        var es = estilo(l), pa = pos[l.a], pb = pos[l.b], izq = pa.x < pb.x ? pa : pb, der = izq === pa ? pb : pa;
        var yb = izq.y + izq.h / 2 + 3 + (nb + k % 4) * 2.2;
        L.l(izq.x + 2, izq.y + izq.h / 2, izq.x + 2, yb, es.capa, es.o).l(izq.x + 2, yb, der.x - 2, yb, es.capa, es.o).l(der.x - 2, yb, der.x - 2, der.y + der.h / 2, es.capa, es.o);
        L.tx((izq.x + der.x) / 2, yb - 0.5, l.medio, 1.2, es.capa, { al: 'c' });
      });
    });
    // Nodos
    b.nodos.forEach(function (nd) {
      var p = pos[nd.id]; if (!p) return;
      var capa = resalte.nodos[nd.id] ? 'RESALTE' : 'NODOS', x = p.x - p.w / 2, yy = p.y - p.h / 2;
      if (nd.tipo === 'inst') L.pill(x, yy, p.w, p.h, capa); else L.r(x, yy, p.w, p.h, capa, { f: 'w', w: resalte.nodos[nd.id] ? 0.7 : 0.35 });
      if (nd.tipo === 'srv' || nd.tipo === 'hist') L.l(x + 1.2, yy, x + 1.2, yy + p.h, capa).l(x + p.w - 1.2, yy, x + p.w - 1.2, yy + p.h, capa);
      if (nd.tipo === 'sw') for (var q = 0; q < 4; q++) L.r(x + 1.2 + q * 2, yy + 0.9, 1.4, 1, capa);
      if (nd.tipo === 'fw') L.l(x, yy + p.h - 2, x + p.w, yy + p.h - 2, capa);
      var lin = [up(nd.tag)].concat(cortar(up(nd.desc), Math.max(10, Math.round(p.w / 1.05))).slice(0, 2));
      lin.forEach(function (s, j) { L.tx(p.x, yy + 3.2 + j * 2.3, s, j ? 1.3 : 1.7, j ? 'TEXTO' : capa, { al: 'c', b: !j }); });
      if (nd.ubic && p.h >= 11) L.tx(p.x, yy + p.h - 0.9, up(nd.ubic).slice(0, Math.round(p.w * 1.1)), 1.1, 'NIVELES', { al: 'c' });
    });
    if (!b.nodos.length) L.tx((X0 + X1) / 2, 130, 'SIN EQUIPOS: USA «GENERAR DESDE EL PROYECTO» O AGREGA NODOS', 2.4, 'TEXTO', { al: 'c' });
    // Leyenda de medios
    var xL = 322; L.tx(xL + 42, 18, 'SIMBOLOGÍA DE COMUNICACIONES', 2.4, 'TEXTO', { al: 'c', b: true });
    var usados = {}; b.enlaces.forEach(function (l) { usados[l.medio] = 1; });
    var ley = MEDIOS.filter(function (m) { return usados[m[0]]; }); if (!ley.length) ley = MEDIOS.slice(0, 4);
    ley.forEach(function (m, i) { var yy = 25 + i * 5; L.l(xL, yy, xL + 14, yy, m[2], { w: m[2] === 'FIBRA' ? 0.5 : 0.35, d: m[2] === 'BUS' || m[2] === 'RADIO' }); L.tx(xL + 17, yy + 0.7, m[0] + ' · ' + up(m[1]), 1.5, 'TEXTO'); });
    var yE = 27 + ley.length * 5; L.tx(xL + 42, yE + 2, 'EQUIPOS', 2.2, 'TEXTO', { al: 'c', b: true });
    [['r', 'EQUIPO DE CONTROL / COMUNICACIONES'], ['srv', 'SERVIDOR'], ['sw', 'SWITCH ETHERNET'], ['pill', 'GRUPO DE INSTRUMENTOS (SEÑALES DEL LISTADO DE E/S)']].forEach(function (s, i) {
      var yy = yE + 6 + i * 6;
      if (s[0] === 'pill') L.pill(xL, yy - 2, 12, 4, 'NODOS'); else L.r(xL, yy - 2, 12, 4, 'NODOS');
      if (s[0] === 'srv') L.l(xL + 1, yy - 2, xL + 1, yy + 2, 'NODOS').l(xL + 11, yy - 2, xL + 11, yy + 2, 'NODOS');
      if (s[0] === 'sw') for (var q = 0; q < 3; q++) L.r(xL + 1.5 + q * 2.2, yy + 0.6, 1.4, 1, 'NODOS');
      L.tx(xL + 15, yy + 0.7, s[1], 1.45, 'TEXTO');
    });
    // Notas
    var yN = yE + 34; L.tx(xL, yN, 'NOTAS:', 2.2, 'NOTAS', { b: true }); yN += 4.5;
    NOTAS.concat(String(b.notas || '').split(/\r?\n/).filter(Boolean)).forEach(function (s, i) { cortar((i + 1) + '.- ' + up(s), 62).forEach(function (l2, j) { if (yN < 222) { L.tx(j ? xL + 3.5 : xL, yN, l2, 1.4, 'NOTAS'); yN += 2.4; } }); });
    var plano = planoDe(b), pr = ctx.proyecto || {};
    D.rotulo(L, ctx, { refs: 'REFERENCIAS: LISTADO DE ENTRADAS Y SALIDAS · ' + up(E().cfg.docIO || '') + (b.ref ? ' · ' + up(b.ref) : ''), titulo: 'DIAGRAMA DE BLOQUES', lineas: [up(b.titulo || 'CONTROL Y COMUNICACIONES'), up(pr.area || pr.nombre || '')].filter(Boolean), plano: plano, rev: b.rev || '', n: 1, de: 1 });
    return [{ prims: L.p, n: 1, de: 1, plano: plano }];
  }

  // ── Interfaz ──
  function ctx() { return { cfg: E().cfg, proyecto: P.activo(), logo: '../../img/logo-reyengi.png', revisiones: E().revs }; }
  function opcionesNodos(sel) { return '<option value="">—</option>' + datos().nodos.map(function (n) { return '<option value="' + n.id + '"' + (n.id === sel ? ' selected' : '') + '>' + esc(n.tag || '(sin tag)') + '</option>'; }).join(''); }
  function pintarNodos() {
    var b = datos();
    $('#bNodos thead').innerHTML = '<tr><th class="chk"></th><th style="min-width:120px">Tag</th><th style="min-width:230px">Descripción</th><th style="min-width:190px">Tipo</th><th style="min-width:150px">Nivel</th><th style="min-width:150px">Ubicación</th><th>Enlaces</th></tr>';
    var cnt = {}; b.enlaces.forEach(function (l) { cnt[l.a] = (cnt[l.a] || 0) + 1; cnt[l.b] = (cnt[l.b] || 0) + 1; });
    $('#bNodos tbody').innerHTML = b.nodos.map(function (n) {
      return '<tr data-n="' + n.id + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + esc(n.tag) + '"></td><td><input data-k="tag" value="' + esc(n.tag) + '"></td><td><input data-k="desc" value="' + esc(n.desc) + '"></td>' +
        '<td><select data-k="tipo">' + TIPOS.map(function (t) { return '<option value="' + t[0] + '"' + (n.tipo === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></td>' +
        '<td><select data-k="nivel">' + NIVELES.map(function (nv) { return '<option value="' + nv[0] + '"' + (+n.nivel === nv[0] ? ' selected' : '') + '>' + nv[1] + ' · ' + nv[2].split(' · ')[0].toLowerCase() + '</option>'; }).join('') + '</select></td>' +
        '<td><input data-k="ubic" value="' + esc(n.ubic) + '"></td><td class="peq">' + (cnt[n.id] || 0) + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="vacio" style="padding:12px">Sin equipos. Usa «Generar desde el proyecto» para partir con la arquitectura típica.</td></tr>';
  }
  function pintarEnlaces() {
    var b = datos();
    $('#bEnlaces thead').innerHTML = '<tr><th class="chk"></th><th style="min-width:150px">Desde</th><th style="min-width:150px">Hasta</th><th style="min-width:220px">Medio / protocolo</th><th style="min-width:220px">Detalle (cable, hebras, velocidad)</th></tr>';
    $('#bEnlaces tbody').innerHTML = b.enlaces.map(function (l) {
      return '<tr data-l="' + l.id + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar enlace"></td><td><select data-k="a">' + opcionesNodos(l.a) + '</select></td><td><select data-k="b">' + opcionesNodos(l.b) + '</select></td>' +
        '<td><select data-k="medio">' + MEDIOS.map(function (m) { return '<option value="' + m[0] + '"' + (l.medio === m[0] ? ' selected' : '') + '>' + m[0] + ' · ' + m[1] + '</option>'; }).join('') + '</select></td><td><input data-k="detalle" value="' + esc(l.detalle) + '"></td></tr>';
    }).join('') || '<tr><td colspan="5" class="vacio" style="padding:12px">Sin enlaces.</td></tr>';
  }
  function pintarConsultas() {
    var o = opcionesNodos($('#bqFalla') ? $('#bqFalla').value : '');
    ['#bqFalla', '#bqA', '#bqB'].forEach(function (s) { var x = $(s), v = x.value; x.innerHTML = o; x.value = v; });
  }
  function pintarPrev() { var b = datos(); $('#bForm [data-b="titulo"]').value = b.titulo || ''; $('#bForm [data-b="plano"]').placeholder = planoDe(Object.assign({}, b, { plano: '' })); var hs = hojas(ctx()); $('#bHojas').innerHTML = hs.map(function (h) { return '<div class="hoja">' + D.svg(h, { mm: false }) + '</div>'; }).join(''); var n = datos(); $('#bCuenta').textContent = n.nodos.length + ' equipos · ' + n.enlaces.length + ' enlaces'; }
  function pintarForm() { var b = datos(); ['titulo', 'plano', 'rev', 'ref', 'notas'].forEach(function (k) { var x = $('#bForm [data-b="' + k + '"]'); if (x && document.activeElement !== x) x.value = b[k] || ''; }); }
  function pintar() { var b = datos(); if (!b.nodos.length && !b.generado) { generar(); b.generado = true; A.guardar(); } pintarForm(); pintarNodos(); pintarEnlaces(); pintarConsultas(); pintarPrev(); }
  var tP = 0; function cambio(todo) { A.guardar(); if (todo) { pintarNodos(); pintarEnlaces(); pintarConsultas(); } clearTimeout(tP); tP = setTimeout(pintarPrev, 250); }

  $('#bForm').addEventListener('input', function (ev) { var k = ev.target.dataset.b; if (!k) return; datos()[k] = ev.target.value; cambio(false); });
  $('#bNodos').addEventListener('input', function (ev) { var x = ev.target, k = x.dataset.k, tr = x.closest('tr[data-n]'); if (!k || !tr) return; var n = nodo(tr.dataset.n); if (!n) return; n[k] = k === 'nivel' ? +x.value : k === 'tag' ? x.value.toUpperCase() : x.value; if (k === 'tipo' && TIPO[x.value]) { n.nivel = TIPO[x.value][2]; tr.querySelector('[data-k="nivel"]').value = n.nivel; } if (k === 'tag') { pintarEnlaces(); pintarConsultas(); } cambio(false); });
  $('#bEnlaces').addEventListener('change', function (ev) { var x = ev.target, k = x.dataset.k, tr = x.closest('tr[data-l]'); if (!k || !tr) return; var l = datos().enlaces.filter(function (q) { return q.id === tr.dataset.l; })[0]; if (!l) return; l[k] = x.value; cambio(false); });
  $('#bEnlaces').addEventListener('input', function (ev) { var x = ev.target; if (x.dataset.k !== 'detalle') return; var l = datos().enlaces.filter(function (q) { return q.id === x.closest('tr').dataset.l; })[0]; l.detalle = x.value; cambio(false); });
  $('#bGenerar').addEventListener('click', function () { var b = datos(); if (b.nodos.length && !confirm('¿Reemplazar los equipos y enlaces actuales por la arquitectura generada desde el proyecto?')) return; generar(); resalte = { nodos: {}, enlaces: {} }; cambio(true); });
  $('#bConteos').addEventListener('click', function () { var n = actualizarConteos(); cambio(true); $('#bCuenta').textContent += ' · ' + n + ' grupos de instrumentos actualizados'; });
  $('#bNodo').addEventListener('click', function () { datos().nodos.push(nuevoNodo({ tipo: 'otro', nivel: 1 })); cambio(true); var ins = document.querySelectorAll('#bNodos input[data-k="tag"]'); if (ins.length) ins[ins.length - 1].focus(); });
  $('#bEnlace').addEventListener('click', function () { datos().enlaces.push(nuevoEnlace()); cambio(true); var s = document.querySelectorAll('#bEnlaces select[data-k="a"]'); if (s.length) s[s.length - 1].focus(); });
  $('#bQuitarN').addEventListener('click', function () { var b = datos(), ids = []; document.querySelectorAll('#bNodos .chkf:checked').forEach(function (c) { ids.push(c.closest('tr').dataset.n); }); if (!ids.length) return; b.nodos = b.nodos.filter(function (n) { return ids.indexOf(n.id) < 0; }); b.enlaces = b.enlaces.filter(function (l) { return ids.indexOf(l.a) < 0 && ids.indexOf(l.b) < 0; }); cambio(true); });
  $('#bQuitarL').addEventListener('click', function () { var b = datos(), ids = []; document.querySelectorAll('#bEnlaces .chkf:checked').forEach(function (c) { ids.push(c.closest('tr').dataset.l); }); b.enlaces = b.enlaces.filter(function (l) { return ids.indexOf(l.id) < 0; }); cambio(true); });
  // Consultas
  function tagDe(id) { var n = nodo(id); return n ? n.tag || '(sin tag)' : '?'; }
  $('#bqFallaBtn').addEventListener('click', function () {
    var id = $('#bqFalla').value; if (!id) return; var L = siFalla(id), n = nodo(id);
    resalte = { nodos: {}, enlaces: {} }; resalte.nodos[id] = 1; L.forEach(function (x) { resalte.nodos[x.id] = 1; });
    var sen = 0; L.concat([n]).forEach(function (x) { var m = /^(\d+) SEÑALES/.exec(x.tag || ''); if (x.tipo === 'inst' && m) sen += +m[1]; });
    $('#bqRes').innerHTML = L.length ? '<b>Si falla ' + esc(n.tag) + '</b>, la supervisión pierde comunicación con ' + L.length + ' equipo(s)' + (sen ? ' y ' + sen + ' señales de instrumentos' : '') + ': ' + L.map(function (x) { return '<code>' + esc(x.tag) + '</code>'; }).join(' ') + '.' + (L.length ? ' <span class="peq">Marcados en rojo en el diagrama. Considera redundancia (anillo de fibra, switch o CPU redundante).</span>' : '') : '<b>' + esc(n.tag) + '</b> no es un punto único de falla: todos los demás equipos siguen comunicados con la supervisión.';
    pintarPrev();
  });
  $('#bqRutaBtn').addEventListener('click', function () {
    var a = $('#bqA').value, b2 = $('#bqB').value; if (!a || !b2) return; var r = ruta(a, b2);
    resalte = { nodos: {}, enlaces: {} };
    if (!r) { $('#bqRes').innerHTML = 'No hay camino de comunicación entre <b>' + esc(tagDe(a)) + '</b> y <b>' + esc(tagDe(b2)) + '</b>.'; pintarPrev(); return; }
    r.forEach(function (p) { resalte.nodos[p.n] = 1; if (p.l) resalte.enlaces[p.l.id] = 1; });
    $('#bqRes').innerHTML = '<b>Ruta</b>: ' + r.map(function (p) { return (p.l ? ' —' + esc(p.l.medio) + '→ ' : '') + '<code>' + esc(tagDe(p.n)) + '</code>'; }).join('') + ' <span class="peq">(' + (r.length - 1) + ' tramos)</span>';
    pintarPrev();
  });
  $('#bqLimpiar').addEventListener('click', function () { resalte = { nodos: {}, enlaces: {} }; $('#bqRes').innerHTML = ''; pintarPrev(); });
  // Exportación (sin resaltes)
  function sinResalte(fn) { var r = resalte; resalte = { nodos: {}, enlaces: {} }; try { return fn(); } finally { resalte = r; } }
  $('#bkPdf').addEventListener('click', function () { var hs = sinResalte(function () { return hojas(ctx()); }); $('#imp').innerHTML = hs.map(function (h) { return '<div class="hojaImp">' + D.svg(h) + '</div>'; }).join(''); setTimeout(function () { window.print(); }, 150); });
  $('#bkDxf').addEventListener('click', function () { var hs = sinResalte(function () { return hojas(ctx()); }); A.descargar(hs[0].plano.replace(/[\\/:*?"<>|]+/g, '-') + '.dxf', D.dxf(hs), 'application/dxf'); });
  $('#bkExcel').addEventListener('click', function () {
    var X = window.XLSX_RE, b = datos(), lb = X.libro(), h = lb.hoja('EQUIPOS', { orientacion: 'landscape' }), AZ = '022A55';
    h.cols([6, 18, 44, 30, 22, 26]); h.celda(0, 0, up(b.titulo) + ' · ' + planoDe(b), { b: true, sz: 12 });
    ['N°', 'TAG', 'DESCRIPCIÓN', 'TIPO', 'NIVEL', 'UBICACIÓN'].forEach(function (t, i) { h.celda(2, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    b.nodos.forEach(function (n, k) { [k + 1, n.tag, n.desc, (TIPO[n.tipo] || [0, ''])[1], (NIVELES.filter(function (v) { return v[0] === +n.nivel; })[0] || ['', ''])[1], n.ubic].forEach(function (v, i) { h.celda(3 + k, i, String(v == null ? '' : v), { sz: 9 }); }); });
    var g = lb.hoja('ENLACES', { orientacion: 'landscape' }); g.cols([6, 18, 18, 36, 40]);
    ['N°', 'DESDE', 'HASTA', 'MEDIO / PROTOCOLO', 'DETALLE'].forEach(function (t, i) { g.celda(0, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    b.enlaces.forEach(function (l, k) { [k + 1, tagDe(l.a), tagDe(l.b), (MEDIO[l.medio] || [l.medio, l.medio])[0] + ' · ' + (MEDIO[l.medio] || [0, ''])[1], l.detalle].forEach(function (v, i) { g.celda(1 + k, i, String(v == null ? '' : v), { sz: 9 }); }); });
    A.descargar(planoDe(b).replace(/[\\/:*?"<>|]+/g, '-') + '.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  window.LAZOS_BLQ = { hojas: hojas, generar: generar, siFalla: siFalla, ruta: ruta, datos: datos };
  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { blq: pintar });
  if (!$('#v-blq').hidden) pintar();
})();
