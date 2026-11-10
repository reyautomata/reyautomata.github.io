/* Diagramas unilineales de tableros de distribución de instrumentación (TDI) · ReyEngi
 * Formato típico: alimentación desde tablero/UPS, interruptor general, luz piloto, supresor de transientes,
 * medidor opcional, barra de distribución, circuitos con protección termomagnética (y diferencial opcional),
 * cargas con descripción vertical, barra de tierra, simbología, notas, datos del tablero y cuadro de cargas.
 * Los circuitos de instrumentos de 4 hilos se toman del listado de E/S (campo «alimentación» de la señal).
 * Exporta PDF (impresión A3), DXF R12 por capas y Excel del cuadro de cargas.
 */
(function () {
  'use strict';
  var A = window.__LAZOS, D = window.LAZOS_DIBUJO, ISA = window.ISA, P = window.REProyectos;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = A.esc, pad = A.pad, cortar = D.cortar, W = D.W, H = D.H;
  function E() { return A.E(); }
  function up(s) { return String(s == null ? '' : s).toUpperCase(); }
  function num(v, d) { return (+v || 0).toLocaleString('es-CL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  // ── Datos ──
  var NOTAS = [
    'EL FABRICANTE DISEÑARÁ, FABRICARÁ Y PROBARÁ LOS TABLEROS COMPLETOS, LISTOS PARA SU INSTALACIÓN.',
    'LOS INTERRUPTORES Y SECCIONADORES DEBERÁN POSEER LOS TERMINALES ADECUADOS PARA LA CONEXIÓN DE LOS CONDUCTORES.',
    'LAS BARRAS DE FASE SERÁN DESNUDAS, DE COBRE ELECTROLÍTICO, CON BORDES REDONDEADOS Y PROTEGIDAS EN TODA SU EXTENSIÓN CONTRA CONTACTOS ACCIDENTALES; SE UBICARÁN EN LA PARTE SUPERIOR DEL TABLERO DEJANDO ESPACIO SUFICIENTE PARA LA SALIDA DE LOS CONDUCTORES.',
    'LA BARRA DE TIERRA DE PROTECCIÓN SE INSTALARÁ EN LA PARTE INFERIOR DE CADA TABLERO.',
    'EL CONEXIONADO INTERIOR DE CADA TABLERO DEBERÁ SER RETARDANTE A LA LLAMA Y LIBRE DE HALÓGENOS.',
    'TODOS LOS CONDUCTORES LLEVARÁN IDENTIFICACIÓN MEDIANTE MARCAS ADHESIVAS ESCRITAS POR COMPUTADOR Y SE CANALIZARÁN EN CANALETAS PLÁSTICAS RANURADAS.',
    'TODOS LOS INTERRUPTORES SERÁN CON PROTECCIÓN TERMOMAGNÉTICA DE LOS CALIBRES INDICADOS Y CAPACIDAD DE RUPTURA SEGÚN IEC 60898-1 / IEC 60947-2 O UL 489.',
    'EL GABINETE SE DIMENSIONARÁ DE TAL FORMA QUE LOS EQUIPOS TENGAN LA SEPARACIÓN MÍNIMA RECOMENDADA POR EL FABRICANTE, PARA PERMITIR UNA ADECUADA VENTILACIÓN Y OPERACIÓN.',
    'PARA CONEXIÓN A REGLETA SE DEBERÁ USAR TERMINAL TIPO PUNTILLA Y MARCA DE CABLES TIPO DAT O SIMILAR.',
    'EL TABLERO DE INSTRUMENTACIÓN SE ALIMENTARÁ DESDE UNA FUENTE ININTERRUMPIDA (UPS).',
    'DISEÑO SEGÚN PLIEGOS TÉCNICOS NORMATIVOS RIC N°02, 03, 04, 05, 06, 07 Y 10 (SEC): PROTECCIONES, SECCIONES Y CAÍDAS DE TENSIÓN SEGÚN MEMORIA DE CÁLCULO; CAÍDA MÁXIMA 3 % EN EL ALIMENTADOR Y 5 % TOTAL.',
    'EL GABINETE PERMITIRÁ UNA AMPLIACIÓN DE 25 % DE SU CAPACIDAD, CON ESPACIO LIBRE EN BARRAS Y RIELES (RIC N°02 6.1.16.3); MÁXIMO 25 CIRCUITOS POR PROTECCIÓN GENERAL (RIC N°02 6.6.1).',
    'EL TABLERO LLEVARÁ PLACA CON FABRICANTE, TENSIÓN, CORRIENTE NOMINAL Y N° DE FASES, CUADRO DE CIRCUITOS Y ESTE UNILINEAL PROTEGIDO EN SU PUERTA (RIC N°02 5.3.5 A 5.3.7).',
    'CÓDIGO DE COLORES: FASES AZUL, NEGRO Y ROJO; NEUTRO BLANCO; PROTECCIÓN VERDE O VERDE/AMARILLO (RIC N°04). CONDUCTOR DE PROTECCIÓN SEGÚN RIC N°06 ANEXO 6.7.'
  ];
  function nuevoTablero(i) {
    var c = E().cfg;
    return { id: A.uid(), tag: i ? 'TDI-' + pad(i + 1, 2) : (c.tableroAlim || 'TDI-01'), nombre: 'TABLERO DE DISTRIBUCIÓN DE INSTRUMENTACIÓN', ubic: 'SALA ELÉCTRICA', plano: '', rev: '',
      desdeTag: 'UPS-01', desdeDesc: 'UPS DE INSTRUMENTACIÓN Y CONTROL', desdePlano: '', cable: '1x3/c #10 AWG RZ1-K',
      sistema: '1F', v: parseFloat(c.tension4h) || 220, frec: 50, barra: '', ip: 'IP54', ambiente: 'interior', icc: 6,
      gen: { polos: '', In: '', Icc: '' }, piloto: true, spd: true, medidor: false, tc: '50/5', notas: '', cable: '',
      tipoAlim: 'subalimentador', largoAlim: 30, dvAlimMax: 2, metodoAlim: 'B1', secAlim: '', servicio: 90, metodo: 'B1', tAmb: 30, agrup: 3, secMin: 2.5, largoCirc: 30, difEquipos: true, inReserva: 10,
      version: 2, circ: [] };
  }
  function circNuevo(t, o) {
    var c = Object.assign({ id: A.uid(), desc: '', destino: '', uso: 'equipo', pot: '', fp: 0.9, largo: '', fase: '', polos: t.sistema === '3F' ? 1 : 2, In: '', curva: 'C', Icc: '', dif: '', sec: '', ducto: 'EPC' }, o || {});
    if (/^RESERVA/i.test(c.desc)) c.uso = 'reserva';
    return c;
  }
  function tableros() {
    var e = E(); e.tdi = e.tdi || [];
    if (!e.tdi.length) {
      var t = nuevoTablero(0);
      t.circ = [circNuevo(t, { desc: 'ALIMENTACIÓN GABINETE DE CONTROL', destino: e.cfg.gabinete || 'GABINETE PLC', pot: 500 }),
        circNuevo(t, { desc: 'ALIMENTACIÓN SWITCH Y COMUNICACIONES', destino: 'GAB-COM', pot: 150 })];
      e.tdi.push(t); agregarInstrumentos(t, true); t.circ.push(circNuevo(t, { desc: 'RESERVA' }), circNuevo(t, { desc: 'RESERVA' }));
    }
    e.tdi.forEach(migrar);
    return e.tdi;
  }
  // Tableros creados antes del cálculo RIC: protecciones, secciones y diferenciales pasan a automáticos
  function migrar(t) {
    if (t.version >= 2) return;
    var b = nuevoTablero(1);
    ['ambiente', 'tipoAlim', 'largoAlim', 'dvAlimMax', 'metodoAlim', 'secAlim', 'servicio', 'metodo', 'tAmb', 'agrup', 'secMin', 'largoCirc', 'difEquipos', 'inReserva'].forEach(function (k) { if (t[k] == null) t[k] = b[k]; });
    if (t.cable === '1x3/c #10 AWG RZ1-K') t.cable = '';
    t.barra = ''; t.gen = { polos: '', In: '', Icc: '' }; if (+t.icc === 10) t.icc = 6;
    t.circ.forEach(function (c) { c.In = ''; c.Icc = ''; c.sec = ''; delete c.cond; if (!c.uso) c.uso = /^RESERVA/i.test(c.desc || '') ? 'reserva' : 'equipo'; if (c.dif === '') c.dif = ''; });
    t.version = 2;
  }
  var selId = null;
  function actual() { var ts = tableros(); return ts.filter(function (t) { return t.id === selId; })[0] || ts[0]; }

  // Instrumentos de 4 hilos alimentados desde este tablero (campo alimTab de la señal o el tablero por defecto)
  function senales4h() { return E().senales.filter(function (s) { return s.tag && +s.hilos === 4 && (s.tipo === 'AI' || s.tipo === 'AO'); }); }
  function agregarInstrumentos(t, silencio) {
    var e = E(), usados = {}, n = 0;
    e.tdi.forEach(function (x) { x.circ.forEach(function (c) { if (c.inst) usados[c.inst] = 1; }); });
    senales4h().forEach(function (s) {
      var alim = s.alimTab || e.cfg.tableroAlim || '';
      if (usados[s.tag] || (alim && alim !== t.tag && e.tdi.some(function (x) { return x.tag === alim; }))) return;
      s.alimTab = t.tag; usados[s.tag] = 1; n++;
      var i = t.circ.map(function (c) { return up(c.desc); }).indexOf('RESERVA');
      var c = circNuevo(t, { inst: s.tag, pot: 25 });
      if (i >= 0) t.circ.splice(i, 0, c); else t.circ.push(c);
    });
    if (!silencio) A.guardar();
    return n;
  }
  function senalDe(tag) { return E().senales.filter(function (s) { return s.tag === tag; })[0]; }
  // Valores efectivos de un circuito (los vinculados a un instrumento toman descripción y destino de la señal)
  function val(t, c, k) {
    var v = c[k];
    if (v != null && v !== '') return v;
    if (c.inst) { var s = senalDe(c.inst); if (k === 'destino') return c.inst; if (k === 'desc') return 'ALIMENTACIÓN ' + up(s ? (s.desc || ISA.describir(s.tag)) : c.inst); }
    return '';
  }
  // Corrientes, fases y totales
  function calcular(t) {
    var tres = t.sistema === '3F', V = +t.v || 220, carga = { R: 0, S: 0, T: 0 }, out = [];
    t.circ.forEach(function (c, i) {
      var p = +val(t, c, 'pot') || 0, fp = +c.fp || 0.9, pol = +c.polos || 1, trif = tres && pol >= 3;
      var I = p ? (trif ? p / (3 * V * fp) : p / (V * fp)) : 0; // trifásico: P / (√3·VLL·fp) con VLL = √3·Vfn
      var fase = tres ? (trif ? 'RST' : c.fase || '') : 'L';
      out.push({ c: c, i: i, n: 'CB' + pad(i + 1, 2), p: p, I: I, fase: fase, trif: trif, reserva: c.uso === 'reserva' || /^RESERVA/i.test(val(t, c, 'desc')) });
    });
    if (tres) { // reparto automático: cada circuito sin fase va a la fase menos cargada
      out.forEach(function (o) { if (o.trif) { carga.R += o.p / 3; carga.S += o.p / 3; carga.T += o.p / 3; } else if (/^[RST]$/.test(o.fase)) carga[o.fase] += o.p; });
      out.forEach(function (o) { if (!o.trif && !/^[RST]$/.test(o.fase)) { var f = ['R', 'S', 'T'].sort(function (a, b) { return carga[a] - carga[b]; })[0]; if (o.p) { o.fase = f; carga[f] += o.p; } else o.fase = ''; o.auto = true; } });
    }
    var tot = { p: 0, R: 0, S: 0, T: 0, L: 0 };
    out.forEach(function (o) { tot.p += o.p; if (o.trif) { tot.R += o.I; tot.S += o.I; tot.T += o.I; } else if (o.fase) tot[o.fase] = (tot[o.fase] || 0) + o.I; });
    var Imax = tres ? Math.max(tot.R, tot.S, tot.T) : tot.L;
    var r = { filas: out, tot: tot, Imax: Imax, desb: tres && Imax ? (Imax - Math.min(tot.R, tot.S, tot.T)) / Imax * 100 : 0 };
    r.ric = window.RIC.tablero(t, r); // protección general, alimentador, circuitos y verificaciones RIC
    return r;
  }

  // ── Símbolos ──
  function cb(L, x, y) { // interruptor termomagnético: ")" sobre el conductor vertical
    L.l(x, y - 4.5, x, y - 2.6, 'FUERZA').l(x, y + 2.6, x, y + 4.5, 'FUERZA').a(x - 1.6, y, 3, -60, 60, 'PROTECCIONES').l(x - 0.1, y - 2.6, x - 1.1, y - 3.4, 'PROTECCIONES');
  }
  function dif(L, x, y) { L.r(x - 1.6, y - 2, 3.2, 4, 'PROTECCIONES').tx(x, y + 0.9, 'Δ', 2, 'PROTECCIONES', { al: 'c' }); }
  function fusible(L, x, y) { L.r(x - 2, y - 0.8, 4, 1.6, 'PROTECCIONES').l(x - 2, y, x + 2, y, 'PROTECCIONES'); }
  function piloto(L, x, y) { L.c(x, y, 2, 'EQUIPOS').l(x - 1.4, y - 1.4, x + 1.4, y + 1.4, 'EQUIPOS').l(x - 1.4, y + 1.4, x + 1.4, y - 1.4, 'EQUIPOS'); }
  function tierraP(L, x, y) { L.l(x - 3, y, x + 3, y, 'TIERRA'); for (var i = 0; i < 4; i++) L.l(x - 2.6 + i * 1.8, y, x - 3.6 + i * 1.8, y + 1.6, 'TIERRA'); }
  function spd(L, x, y) { L.r(x - 2, y - 3, 4, 6, 'PROTECCIONES').pl([[x + 0.8, y - 2.2], [x - 0.6, y + 0.2], [x + 0.6, y - 0.2], [x - 0.8, y + 2.2]], 'PROTECCIONES'); }
  function tc(L, x, y) { L.a(x - 1.1, y - 1.1, 1.1, 90, 270, 'PROTECCIONES').a(x - 1.1, y + 1.1, 1.1, 90, 270, 'PROTECCIONES'); }
  function medidor(L, x, y) { L.r(x - 2.5, y - 2.5, 5, 5, 'EQUIPOS').tx(x, y + 1, 'M', 2.2, 'EQUIPOS', { al: 'c' }); }
  function carga(L, x, y) { L.r(x - 4.5, y, 9, 6, 'EQUIPOS'); }

  function planoDe(t) { return t.plano || ((E().cfg.prefijoUni || 'IN-UL-') + pad(E().tdi.indexOf(t) + 1, 4)); }
  // ── Hoja ──
  function hojas(t, ctx) {
    var cal = calcular(t), n = t.circ.length, separado = n > 10, de = separado ? 2 : 1, cfg = ctx.cfg || {};
    var plano = planoDe(t);
    var tres = t.sistema === '3F', cond = tres ? 'R-S-T-N-G' : 'L-N-G', sis = tres ? '3 FASES + N + T' : '1 FASE + N + T';
    var datosRot = { refs: 'REFERENCIAS: ' + [t.desdePlano && ('ALIMENTACIÓN ' + t.desdePlano), cfg.docCables && ('LISTADO DE CIRCUITOS ' + cfg.docCables), cfg.docIO && ('LISTADO E/S ' + cfg.docIO)].filter(Boolean).join(' · '),
      titulo: 'DIAGRAMA UNILINEAL', lineas: [cortar(up(t.nombre), 70)[0] || '', 'TAG: ' + up(t.tag)], pie: up(t.ubic || ''), plano: plano, rev: t.rev, de: de };
    var out = [];
    // Hoja 1: diagrama
    var L = new D.Lienzo(); D.marco(L);
    var xf = 150, x0 = 20, x1 = 286, yP0 = 46, yP1 = 142, yB = 100;
    // Alimentación
    L.pl([[xf - 26, 13], [xf + 26, 13], [xf + 26, 29], [xf, 34], [xf - 26, 29]], 'FUERZA', { cerrada: true });
    ['DESDE', up(t.desdeDesc), 'TAG: ' + up(t.desdeTag)].concat(t.desdePlano ? ['VER PLANO', up(t.desdePlano)] : []).forEach(function (s, i, a) { L.tx(xf, 16.6 + i * 2.55 + (5 - a.length) * 1.1, s, 1.7, 'TEXTO', { al: 'c' }); });
    var R = cal.ric, G0 = R.gen, cab = R.alim.txt + (R.alim.dv ? ' · L = ' + t.largoAlim + ' m · ΔV ' + num(R.alim.dv, 2) + ' %' : '');
    L.l(xf, 34, xf, yB, 'FUERZA', { w: 0.35 }).pill(xf - 1.6, 38.3, 3.2, 1.2, 'FUERZA').l(xf + 1.6, 38.9, xf + 4, 37.4, 'TEXTO').tx(xf + 4.4, 37, cab, 1.7, 'TEXTO').l(xf + 4.4, 37.4, xf + 4.4 + cab.length * 1.2, 37.4, 'TEXTO');
    // Tablero
    L.r(x0, yP0, x1 - x0, yP1 - yP0, 'MARCO', { d: true, w: 0.35 });
    L.tx(x0, yP0 - 1.6, up(t.nombre), 1.9, 'TEXTO').tx(x0 + 1.5, yP0 + 3.4, 'TAG: ' + up(t.tag), 1.9, 'TEXTO');
    L.tx(xf + 1.5, 51, cond, 1.7, 'TEXTO');
    // Conductor de tierra hacia la barra G
    var xG = 266, yG = 92;
    L.pl([[xf, 53], [xG + 8, 53], [xG + 8, yG - 0.8]], 'TIERRA');
    L.r(xG - 1, yG - 0.8, 18, 1.6, 'TIERRA'); for (var g = 0; g < 7; g++) L.c(xG + 0.8 + g * 2.4, yG, 0.35, 'TIERRA', { f: true });
    L.tx(xG + 8, yG - 2, 'G', 1.7, 'TIERRA', { al: 'c' }).l(xG + 17, yG, x1 + 6, yG, 'TIERRA'); tierraP(L, x1 + 8, yG); L.tx(x1 + 5, yG - 1.5, 'T.P.', 1.6, 'TIERRA');
    // Luz piloto con fusible
    var yL = 58;
    if (t.piloto) { L.l(xf, yL, xf + 22, yL, 'FUERZA'); fusible(L, xf + 8, yL); L.tx(xf + 8, yL - 1.6, '2 FU', 1.5, 'TEXTO', { al: 'c' }).tx(xf + 8, yL + 3.2, '2 A', 1.5, 'TEXTO', { al: 'c' }); piloto(L, xf + 24, yL); L.tx(xf + 24, yL + 4.6, 'LED', 1.5, 'TEXTO', { al: 'c' }); if (tres) L.tx(xf + 24, yL - 2.8, '3', 1.5, 'TEXTO', { al: 'c' }); }
    // Supresor de transientes
    if (t.spd) { var yS = 64; L.l(xf, yS, xf - 14, yS, 'FUERZA').l(xf - 14, yS, xf - 14, yS + 1, 'FUERZA'); spd(L, xf - 14, yS + 4); L.l(xf - 14, yS + 7, xf - 14, yS + 9, 'TIERRA'); tierraP(L, xf - 14, yS + 9); L.tx(xf - 17, yS + 4.6, 'SPD CLASE II', 1.5, 'TEXTO', { al: 'r' }).tx(xf - 17, yS + 7, 'In 20 kA', 1.5, 'TEXTO', { al: 'r' }); }
    // Interruptor general
    var yM = 74, iccG = +t.gen.Icc || Math.max(6, [6, 10, 15, 25, 36, 50].filter(function (v) { return v >= (+t.icc || 6); })[0] || 50);
    cb(L, xf, yM); L.tx(xf + 2.6, yM - 1.2, G0.polos + 'x' + G0.In + 'A CURVA C', 1.7, 'TEXTO').tx(xf + 2.6, yM + 1.4, iccG + ' kA', 1.7, 'TEXTO').tx(xf + 2.6, yM + 4, 'GENERAL · Ib ' + num(G0.ib, 2) + ' A', 1.5, 'TEXTO');
    // Medidor con transformadores de corriente
    if (t.medidor || G0.In >= 100) { var yT = 88; tc(L, xf, yT); L.l(xf - 1.1, yT, xf + 14, yT, 'EQUIPOS'); medidor(L, xf + 17, yT); L.tx(xf + 20.5, yT - 0.6, 'TENSIÓN: 0–' + (tres ? 600 : 300) + ' V', 1.5, 'TEXTO').tx(xf + 20.5, yT + 1.8, 'CORRIENTE, POTENCIA, ENERGÍA', 1.5, 'TEXTO');
      L.tx(xf - 3, yT - 0.4, (tres ? 3 : 1) + ' TT.CC.', 1.5, 'TEXTO', { al: 'r' }).tx(xf - 3, yT + 2, t.tc || '', 1.5, 'TEXTO', { al: 'r' }); }
    // Barra de distribución
    var xa = 30, xb = 254, dx = n > 1 ? Math.min(22, (xb - xa) / (n - 1)) : 0, xi = n > 1 ? (xa + xb) / 2 - dx * (n - 1) / 2 : xf;
    var bx0 = Math.min(xi - 6, xf - 6), bx1 = Math.max(xi + dx * (n - 1) + 6, xf + 6);
    L.l(bx0, yB, bx1, yB, 'FUERZA', { w: 0.6 }).tx(bx0, yB - 1.5, (t.v || 220) + (tres ? '/' + Math.round((t.v || 231) * Math.sqrt(3)) : '') + ' VAC, ' + (t.frec || 50) + ' Hz, ' + sis + ', ' + G0.barra + ' A', 1.7, 'TEXTO');
    // Barra de tierra inferior, conectada a la barra G
    var yTi = 134; L.l(xG + 4, yG + 0.8, xG + 4, yTi, 'TIERRA');
    cal.filas.forEach(function (o, k) {
      var x = xi + k * dx, c = o.c;
      L.c(x, yB, 0.45, 'FUERZA', { f: true }).l(x, yB, x, 108, 'FUERZA');
      cb(L, x, 112.5);
      var q = o.ric, tx = [o.n, (c.polos || 1) + 'x' + q.In + 'A', 'CURVA ' + (c.curva || 'C'), q.Icc + 'kA'];
      tx.forEach(function (s, j) { L.tx(x + 2.4, 109.6 + j * 2.2, s, 1.45, 'TEXTO'); });
      var yAb = 117;
      if (q.dif) { L.l(x, yAb, x, 121, 'FUERZA'); dif(L, x, 123); cortar(String(q.dif).replace(/\s+/g, ' '), 11).slice(0, 2).forEach(function (s2, j) { L.tx(x + 2.4, 122.6 + j * 1.8, s2, 1.25, 'TEXTO'); }); yAb = 125; }
      L.l(x, yAb, x, 148, 'FUERZA');
      if (!(o.reserva && !o.p)) L.tx(x + 1, 145.4, window.RIC.fmt(q.sec) + ' mm²', 1.25, 'TEXTO');
      // cruce con la barra de tierra (salto) y borne de salida
      var xn = k < n - 1 ? xi + (k + 1) * dx : xG + 4;
      L.a(x, yTi, 1, 180, 360, 'TIERRA').l(x + 1, yTi, xn - (k < n - 1 ? 1 : 0), yTi, 'TIERRA');
      if (k === 0) L.l(x - 1, yTi, x - 3, yTi, 'TIERRA');
      L.c(x, 138.5, 0.55, 'FUERZA');
      L.l(x - 0.4, 136.2, x - 1.6, 138.5, 'TIERRA').l(x - 1.6, 138.5, x - 1.6, yTi, 'TIERRA');
      carga(L, x, 148); L.tx(x, 152, 'C' + (k + 1), 1.5, 'TEXTO', { al: 'c' });
      // Descripción vertical bajo la carga
      var lineas = ['CIRCUITO N° ' + (k + 1)].concat(cortar(up(val(t, c, 'desc') || 'RESERVA'), 26).slice(0, 2));
      var dest = up(val(t, c, 'destino')); if (dest && lineas.length < 4) lineas.push(dest);
      lineas.forEach(function (s, j) { L.tx(x - 2.2 + j * 2.1 - (lineas.length - 2) * 1.05 + 1.05, 190, s, 1.45, 'TEXTO', { rot: 90 }); });
    });
    if (!n) L.tx(xf, 120, 'SIN CIRCUITOS', 2.2, 'TEXTO', { al: 'c' });
    // Cuadro de cargas (en la hoja 1 si cabe; si no, en la hoja 2)
    if (!separado) tablaCargas(L, t, cal, 14, 194, 286, 222);
    else L.tx(150, 205, 'VER CUADRO DE CARGAS EN LA HOJA 2', 2.4, 'TEXTO', { al: 'c', b: true });
    // Simbología, notas y datos del tablero
    simbologia(L, 306, 14);
    var notas = NOTAS.concat(String(t.notas || '').split(/\r?\n/).filter(Boolean));
    L.tx(306, 122, 'NOTAS:', 2.2, 'NOTAS', { b: true });
    var yn = 126.5;
    notas.forEach(function (s, i) { cortar((i + 1) + '.- ' + up(s), 66).forEach(function (l2, j) { if (yn < 222) { L.tx(j ? 309.5 : 306, yn, l2, 1.45, 'NOTAS'); yn += 2.45; } }); });
    datos(L, t, cal, 13, 228);
    D.rotulo(L, ctx, Object.assign({ n: 1 }, datosRot));
    out.push({ prims: L.p, n: 1, de: de, plano: plano });
    if (separado) {
      var L2 = new D.Lienzo(); D.marco(L2);
      tablaCargas(L2, t, cal, 14, 16, 406, 218);
      datos(L2, t, cal, 13, 228);
      D.rotulo(L2, ctx, Object.assign({ n: 2 }, datosRot));
      out.push({ prims: L2.p, n: 2, de: de, plano: plano });
    }
    return out;
  }
  function simbologia(L, x, y) {
    L.tx(x + 30, y + 2, 'SIMBOLOGÍA', 2.8, 'TEXTO', { al: 'c' });
    var it = [[function (yy) { cb(L, x + 6, yy); }, 'INTERRUPTOR TERMOMAGNÉTICO B.T.'], [function (yy) { L.l(x + 6, yy - 3, x + 6, yy + 3, 'FUERZA'); dif(L, x + 6, yy); }, 'PROTECCIÓN DIFERENCIAL 30 mA'],
      [function (yy) { fusible(L, x + 6, yy); }, 'FUSIBLE'], [function (yy) { piloto(L, x + 6, yy); }, 'LUZ PILOTO LED'], [function (yy) { spd(L, x + 6, yy); }, 'SUPRESOR DE TRANSIENTES (SPD)'],
      [function (yy) { tc(L, x + 7, yy); L.l(x + 5.9, yy - 3, x + 5.9, yy + 3, 'FUERZA'); }, 'TRANSFORMADOR DE CORRIENTE'], [function (yy) { medidor(L, x + 6, yy); }, 'EQUIPO DE MEDIDA'],
      [function (yy) { tierraP(L, x + 6, yy - 0.8); }, 'TIERRA DE PROTECCIÓN'], [function (yy) { carga(L, x + 6, yy - 3); }, 'CARGA / CONSUMO']];
    it.forEach(function (q, i) { var yy = y + 9 + i * 10.6; q[0](yy); L.tx(x + 14, yy + 0.8, q[1], 1.6, 'TEXTO'); });
  }
  function datos(L, t, cal, x, y) {
    var tres = t.sistema === '3F';
    var R = cal.ric, malos = R.chk.filter(function (c) { return c.sev === 'err'; }).length;
    var d = [['TENSIÓN', (t.v || 220) + (tres ? '/' + Math.round((t.v || 231) * Math.sqrt(3)) : '') + ' VAC · ' + (t.frec || 50) + ' Hz'], ['SISTEMA', tres ? '3F + N + T' : '1F + N + T'], ['BARRAS', R.gen.barra + ' A'], ['ICC PRESUNTA EN BARRA', (t.icc || 6) + ' kA'],
      ['GRADO DE PROTECCIÓN', (t.ip || '') + ' (MÍN. ' + window.RIC.IP_MIN[t.ambiente || 'interior'] + ')'], ['UBICACIÓN', up(t.ubic)], ['POTENCIA INSTALADA', num(cal.tot.p) + ' W'], ['CORRIENTE DE DISEÑO Ib', num(cal.Imax, 2) + ' A' + (tres ? ' · DESB. ' + num(cal.desb, 0) + ' %' : '')],
      ['PROTECCIÓN GENERAL', R.gen.polos + 'x' + R.gen.In + ' A'], [up(t.tipoAlim || 'subalimentador'), window.RIC.fmt(R.alim.sec) + ' mm² · Iz ' + num(R.alim.iz, 0) + ' A'], ['CAÍDA DE TENSIÓN ALIM.', t.largoAlim ? num(R.alim.dv, 2) + ' % (MÁX. 3 %)' : 'SIN LARGO'],
      ['CIRCUITOS', cal.filas.length + ' (' + cal.filas.filter(function (o) { return o.reserva; }).length + ' RESERVA) · RIC ' + (malos ? malos + ' OBS.' : 'OK')]];
    L.tx(x, y + 1.5, 'DATOS DEL TABLERO ' + up(t.tag), 2, 'NOTAS', { b: true });
    d.forEach(function (r, i) { var cx = x + (i % 4) * 59, cy = y + 6 + Math.floor(i / 4) * 6.4; L.tx(cx, cy, r[0], 1.4, 'NOTAS', { b: true }).tx(cx, cy + 2.6, r[1], 1.55, 'NOTAS'); });
  }
  // Cuadro de cargas dentro del rectángulo (xa, ya)–(xb, yb)
  function columnasTabla(t) {
    var tres = t.sistema === '3F';
    return [['N° CTO', 5], ['DESCRIPCIÓN', 30], ['DESTINO / TAG', 14], ['POTENCIA [W]', 8]].concat(tres ? [['FASE R [A]', 6.5], ['FASE S [A]', 6.5], ['FASE T [A]', 6.5]] : [['FASE', 5], ['CORRIENTE [A]', 8]])
      .concat([['PROTECCIÓN', 11], ['DIFERENCIAL', 12], ['CONDUCTOR [mm²]', 8], ['LARGO [m]', 5.5], ['ΔV TOTAL [%]', 6], ['DUCTO', 6]]);
  }
  function filasTabla(t, cal) {
    var tres = t.sistema === '3F';
    var f = cal.filas.map(function (o, i) {
      var c = o.c, r = [String(i + 1), up(val(t, c, 'desc') || 'RESERVA'), up(val(t, c, 'destino')) || '-', o.p ? num(o.p) : '-'];
      if (tres) ['R', 'S', 'T'].forEach(function (f2) { r.push(o.trif || o.fase === f2 ? (o.I ? num(o.I, 2) : '-') : '-'); });
      else r.push(o.p ? 'L' : '-', o.I ? num(o.I, 2) : '-');
      var q = o.ric, vacio = o.reserva && !o.p;
      r.push((c.polos || 1) + 'x' + q.In + 'A ' + (c.curva || 'C') + ' ' + q.Icc + 'kA', q.dif || '-', vacio ? '-' : window.RIC.fmt(q.sec) + ' + T ' + window.RIC.fmt(q.pe), vacio || !(+c.largo || +t.largoCirc) ? '-' : String(+c.largo || +t.largoCirc), vacio ? '-' : num(q.dvTot, 2), vacio ? '-' : up(c.ducto || ''));
      return r;
    });
    var G0 = cal.ric.gen, tot = ['TOTAL', '', '', num(cal.tot.p)].concat(tres ? [num(cal.tot.R, 2), num(cal.tot.S, 2), num(cal.tot.T, 2)] : ['', num(cal.tot.L, 2)]).concat([G0.polos + 'x' + G0.In + 'A GENERAL', '', window.RIC.fmt(cal.ric.alim.sec) + ' (ALIM.)', t.largoAlim ? String(t.largoAlim) : '', num(cal.ric.alim.dv, 2), '']);
    return { f: f, tot: tot };
  }
  function tablaCargas(L, t, cal, xa, ya, xb, yb) {
    var cols = columnasTabla(t), sum = cols.reduce(function (s, c) { return s + c[1]; }, 0), w = (xb - xa) / sum, ft = filasTabla(t, cal);
    var rows = ft.f.concat([ft.tot]), hT = 3.4, hC = 4.4, hr = Math.min(3.4, (yb - ya - hT - hC) / rows.length), th = Math.min(1.5, hr * 0.55);
    L.r(xa, ya, xb - xa, hT + hC + hr * rows.length, 'TABLAS');
    L.tx((xa + xb) / 2, ya + 2.5, 'CUADRO DE CARGAS ' + up(t.nombre) + ' TAG: ' + up(t.tag), 1.8, 'TABLAS', { al: 'c', b: true });
    L.l(xa, ya + hT, xb, ya + hT, 'TABLAS').l(xa, ya + hT + hC, xb, ya + hT + hC, 'TABLAS');
    var xs = [xa]; cols.forEach(function (c) { xs.push(xs[xs.length - 1] + c[1] * w); });
    cols.forEach(function (c, i) {
      if (i) L.l(xs[i], ya + hT, xs[i], ya + hT + hC + hr * rows.length, 'TABLAS');
      var cx = (xs[i] + xs[i + 1]) / 2, pal = cortar(c[0], Math.max(4, Math.floor(c[1] * w / 1.1)));
      pal.slice(0, 2).forEach(function (s, j) { L.tx(cx, ya + hT + (pal.length > 1 ? 1.9 + j * 1.9 : 2.8), s, 1.3, 'TABLAS', { al: 'c', b: true }); });
    });
    rows.forEach(function (r, k) {
      var y = ya + hT + hC + hr * (k + 1);
      L.l(xa, y, xb, y, 'TABLAS');
      r.forEach(function (s, i) {
        var ancho = (xs[i + 1] - xs[i]), max = Math.floor(ancho / (th * 0.8)), txt = String(s).length > max ? String(s).slice(0, max - 1) + '…' : s;
        L.tx(i === 1 ? xs[i] + 0.8 : (xs[i] + xs[i + 1]) / 2, y - hr / 2 + th / 2, txt, th, 'TABLAS', { al: i === 1 ? 'l' : 'c', b: k === rows.length - 1 });
      });
    });
  }

  // ── Excel del cuadro de cargas ──
  function excel(t) {
    var X = window.XLSX_RE, lb = X.libro(), cal = calcular(t), cols = columnasTabla(t), ft = filasTabla(t, cal), N = cols.length;
    var h = lb.hoja('CUADRO DE CARGAS', { orientacion: 'landscape' });
    h.cols(cols.map(function (c) { return c[1] * 1.15; }));
    var pr = P.activo(), AZ = '022A55', CL = 'DCE3EB';
    h.combinar(0, 0, 0, N - 1, 'CUADRO DE CARGAS ' + up(t.nombre) + ' · TAG: ' + up(t.tag), { b: true, sz: 12, color: AZ, h: 'center', borde: 'none' });
    h.combinar(1, 0, 1, N - 1, [pr.proyecto, pr.cliente, 'Plano ' + planoDe(t)].filter(Boolean).join(' · '), { sz: 9, h: 'center', borde: 'none' });
    cols.forEach(function (c, i) { h.celda(3, i, c[0], { b: true, fill: AZ, color: 'FFFFFF', sz: 8, h: 'center' }); });
    h.alto(3, 30);
    var numero = function (s, i) { return i > 2 && /^-?[\d.]+(,\d+)?$/.test(String(s)) ? +String(s).replace(/\./g, '').replace(',', '.') : s; };
    ft.f.forEach(function (r, k) { r.forEach(function (s, i) { h.celda(4 + k, i, numero(s, i), { sz: 8, h: i === 1 ? 'left' : 'center' }); }); });
    ft.tot.forEach(function (s, i) { h.celda(4 + ft.f.length, i, numero(s, i), { sz: 8, b: true, fill: CL, h: i === 1 ? 'left' : 'center' }); });
    // Memoria de cálculo RIC
    var R = cal.ric, m = lb.hoja('MEMORIA DE CÁLCULO', { orientacion: 'landscape' }), RIC = window.RIC;
    var mc = [['Circuito', 8], ['Descripción', 34], ['Uso', 12], ['P [W]', 8], ['f.p.', 6], ['Ib [A]', 8], ['I diseño [A]', 9], ['In [A]', 7], ['Icc [kA]', 7], ['Diferencial', 18], ['Sección [mm²]', 9], ['PE [mm²]', 8], ['Iz corregida [A]', 10], ['Largo [m]', 8], ['ΔV circuito [%]', 10], ['ΔV total [%]', 9], ['Resultado', 46]];
    m.cols(mc.map(function (c) { return c[1]; }));
    m.combinar(0, 0, 0, mc.length - 1, 'MEMORIA DE CÁLCULO · ' + up(t.nombre) + ' · TAG: ' + up(t.tag), { b: true, sz: 12, color: AZ, h: 'center', borde: 'none' });
    m.combinar(1, 0, 1, mc.length - 1, 'Criterios: RIC N°03 (caída ≤ 3 % alimentador, ≤ 5 % total), RIC N°04 Tabla 4.4 (método ' + (t.metodo || 'B1') + ', ' + (R.cable || '') + ', ' + (t.tAmb || 30) + ' °C, ' + (t.agrup || 3) + ' conductores por canalización), RIC N°10 5.1.4.1 (+10 %), RIC N°07 (motores y climatización ×1,25), RIC N°02 6.2.6, RIC N°06 Anexo 6.7.', { sz: 8, h: 'left', borde: 'none', wrap: true });
    m.alto(1, 30);
    var gen = [['Sistema', (t.sistema === '3F' ? 'Trifásico ' : 'Monofásico ') + (t.v || 220) + ' V fase–neutro, ' + (t.frec || 50) + ' Hz'], ['Corriente de diseño del tablero Ib', +cal.Imax.toFixed(2)], ['Protección general', R.gen.polos + 'x' + R.gen.In + ' A'],
      [up(t.tipoAlim || 'subalimentador'), RIC.fmt(R.alim.sec) + ' mm² + T ' + RIC.fmt(R.alim.pe) + ' mm², Iz ' + num(R.alim.iz, 1) + ' A, L ' + (t.largoAlim || 0) + ' m, ΔV ' + num(R.alim.dv, 2) + ' %'], ['Barras', R.gen.barra + ' A']];
    gen.forEach(function (g2, i) { m.combinar(3 + i, 0, 3 + i, 2, g2[0], { b: true, sz: 9, fill: CL }); m.combinar(3 + i, 3, 3 + i, 8, g2[1], { sz: 9, h: 'left' }); });
    var r0 = 9; mc.forEach(function (c, i) { m.celda(r0, i, c[0], { b: true, fill: AZ, color: 'FFFFFF', sz: 8, h: 'center' }); }); m.alto(r0, 28);
    cal.filas.forEach(function (o, k) {
      var q = o.ric, c = o.c, vacio = o.reserva && !o.p, usoTxt = (RIC.USOS.filter(function (u) { return u[0] === q.uso; })[0] || [0, q.uso])[1];
      [o.n, up(val(t, c, 'desc') || 'RESERVA'), usoTxt, o.p || 0, +c.fp || 0.9, +o.I.toFixed(3), +q.idis.toFixed(3), q.In, q.Icc, q.dif || '-', vacio ? '-' : q.sec, vacio ? '-' : q.pe, vacio ? '-' : +q.iz.toFixed(1), vacio ? '-' : (+c.largo || +t.largoCirc || 0), vacio ? '-' : +q.dv.toFixed(3), vacio ? '-' : +q.dvTot.toFixed(3),
        q.errores.concat(q.avisos).join(' · ') || 'Cumple'].forEach(function (v, i) { m.celda(r0 + 1 + k, i, v, { sz: 8, h: i === 1 || i === 16 ? 'left' : 'center', color: i === 16 ? (q.errores.length ? 'C0392B' : '2F7D32') : undefined }); });
    });
    var rv = r0 + cal.filas.length + 2;
    m.combinar(rv, 0, rv, mc.length - 1, 'VERIFICACIONES DEL TABLERO', { b: true, fill: AZ, color: 'FFFFFF', sz: 9 });
    R.chk.forEach(function (c, i) { m.celda(rv + 1 + i, 0, c.sev === 'ok' ? 'Cumple' : c.sev === 'warn' ? 'Advertencia' : 'No cumple', { sz: 8, b: true, color: c.sev === 'ok' ? '2F7D32' : c.sev === 'warn' ? 'B4430A' : 'C0392B' }); m.combinar(rv + 1 + i, 1, rv + 1 + i, 12, c.txt, { sz: 8, h: 'left' }); m.combinar(rv + 1 + i, 13, rv + 1 + i, 16, c.ref, { sz: 8, h: 'left' }); });
    A.descargar('Cuadro de cargas ' + (t.tag || 'TDI').replace(/[\\/:*?"<>|]+/g, '-') + '.xlsx', X.generar(lb), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ── Interfaz ──
  function ctx() { return { cfg: E().cfg, proyecto: P.activo(), logo: '../../img/logo-reyengi.png', revisiones: E().revs }; }
  var MET = function () { return window.RIC.METODOS; };
  var CAMPOS = [
    { g: 'Tablero', c: [['tag', 'Tag del tablero'], ['plano', 'N° de plano', function (t) { return (E().cfg.prefijoUni || 'IN-UL-') + pad(E().tdi.indexOf(t) + 1, 4); }], ['nombre', 'Nombre', null, 'ancho'], ['ubic', 'Ubicación'], ['rev', 'Revisión del plano', function () { return P.activo().rev || ''; }],
      ['ambiente', 'Instalación (RIC N°02 6.1.21)', null, '', [['interior', 'Interior · IP41 mín.'], ['bajoTecho', 'Exterior bajo techo · IP44 mín.'], ['intemperie', 'Intemperie · IP54 mín.'], ['mojado', 'Lugar mojado · IPX4 mín.']]], ['ip', 'Grado de protección del gabinete']] },
    { g: 'Alimentación', c: [['desdeTag', 'Desde (tag)'], ['desdePlano', 'Plano de origen'], ['desdeDesc', 'Descripción del origen', null, 'ancho'],
      ['sistema', 'Sistema', null, '', [['1F', 'Monofásico 1F + N + T'], ['3F', 'Trifásico 3F + N + T']]], ['v', 'Tensión fase–neutro [V]'], ['frec', 'Frecuencia [Hz]'], ['icc', 'Icc presunta en barra [kA]'],
      ['tipoAlim', 'Tipo', null, '', [['subalimentador', 'Subalimentador (mín. 2,5 mm²)'], ['alimentador', 'Alimentador (mín. 4 mm²)']]], ['largoAlim', 'Largo del alimentador [m]'], ['dvAlimMax', 'ΔV de diseño del alimentador [%] (máx. 3)'],
      ['metodoAlim', 'Método de instalación', null, '', MET], ['secAlim', 'Sección [mm²]', function (t) { return 'auto · ' + window.RIC.fmt(calcular(t).ric.alim.secAuto || '—'); }],
      ['cable', 'Texto del cable (vacío = automático)', function (t) { return calcular(t).ric.alim.txt; }, 'ancho']] },
    { g: 'Protección general y barras', c: [['gen.polos', 'Polos del general', function (t) { return t.sistema === '3F' ? '4' : '2'; }], ['gen.In', 'In del general [A]', function (t) { return 'auto · ' + calcular(t).ric.gen.inAuto; }], ['gen.Icc', 'Icc del general [kA]', function () { return 'auto'; }],
      ['barra', 'Barras [A]', function (t) { return 'auto · ' + calcular(t).ric.gen.barra; }], ['tc', 'Razón de TT.CC.'], ['piloto', 'Luz piloto (RIC N°02 6.2.14)', null, 'chk'], ['spd', 'Supresor de transientes', null, 'chk'], ['medidor', 'Medidor (obligatorio ≥ 100 A)', null, 'chk']] },
    { g: 'Criterios de cálculo (RIC N°04, N°10)', c: [['servicio', 'Conductor', null, '', [['90', 'RZ1-K / THHN · 90 °C'], ['70', 'H07Z1-K / THWN · 70 °C']]], ['metodo', 'Método de los circuitos', null, '', MET], ['tAmb', 'Temperatura ambiente [°C]'],
      ['agrup', 'Conductores activos por canalización'], ['largoCirc', 'Largo típico de circuito [m]'], ['secMin', 'Sección mínima circuitos de equipos [mm²]'], ['inReserva', 'In de los circuitos de reserva [A]'],
      ['difEquipos', 'Diferencial 30 mA también en circuitos de equipos y reservas', null, 'chk'], ['notas', 'Notas propias (una por línea)', null, 'area']] }
  ];
  function leer(t, k) { var p = k.split('.'); return p.length > 1 ? (t[p[0]] || {})[p[1]] : t[k]; }
  function poner(t, k, v) { var p = k.split('.'); if (p.length > 1) { t[p[0]] = t[p[0]] || {}; t[p[0]][p[1]] = v; } else t[k] = v; }
  function pintarForm() {
    var t = actual();
    $('#uForm').innerHTML = CAMPOS.map(function (g) {
      return '<fieldset><legend>' + g.g + '</legend>' + g.c.map(function (c) {
        var v = leer(t, c[0]), ph = c[2] ? c[2](t) : '';
        if (c[3] === 'chk') return '<label class="chk"><input type="checkbox" data-u="' + c[0] + '"' + (v ? ' checked' : '') + '> ' + c[1] + '</label>';
        if (c[3] === 'area') return '<label class="ancho">' + c[1] + '<textarea rows="2" data-u="' + c[0] + '">' + esc(v || '') + '</textarea></label>';
        if (c[4]) { var ops = typeof c[4] === 'function' ? c[4]() : c[4]; return '<label>' + c[1] + '<select data-u="' + c[0] + '">' + ops.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'; }
        return '<label' + (c[3] === 'ancho' ? ' class="ancho"' : '') + '>' + c[1] + '<input data-u="' + c[0] + '" value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(ph) + '"></label>';
      }).join('') + '</fieldset>';
    }).join('');
  }
  var CC = [{ k: 'desc', l: 'Descripción', w: 220 }, { k: 'destino', l: 'Destino / tag', w: 120 }, { k: 'uso', l: 'Uso', w: 150, sel: 'usos' }, { k: 'pot', l: 'Potencia [W]', w: 84 }, { k: 'fp', l: 'f.p.', w: 52 },
    { k: 'largo', l: 'Largo [m]', w: 70 }, { k: 'fase', l: 'Fase', w: 70, sel: ['', 'R', 'S', 'T'] }, { k: 'polos', l: 'Polos', w: 60, sel: ['1', '2', '3', '4'] }, { k: 'In', l: 'In [A]', w: 70 }, { k: 'curva', l: 'Curva', w: 60, sel: ['B', 'C', 'D'] },
    { k: 'Icc', l: 'Icc [kA]', w: 64 }, { k: 'dif', l: 'Diferencial', w: 150 }, { k: 'sec', l: 'Sección [mm²]', w: 76 }, { k: 'ducto', l: 'Ducto', w: 70 }];
  function pintarTabla() {
    var t = actual(), cal = calcular(t), tres = t.sistema === '3F', RIC = window.RIC;
    var cols = CC.filter(function (c) { return tres || c.k !== 'fase'; });
    $('#tablaUni thead').innerHTML = '<tr><th class="chk"><input type="checkbox" id="uTodo" aria-label="Seleccionar todo"></th><th style="min-width:70px">Circuito</th>' + cols.map(function (c) { return '<th style="min-width:' + c.w + 'px">' + c.l + '</th>'; }).join('') +
      '<th style="min-width:70px">Ib [A]</th><th style="min-width:70px">Iz [A]</th><th style="min-width:76px">ΔV total [%]</th><th style="min-width:220px">Verificación RIC</th><th style="min-width:76px">Orden</th></tr>';
    $('#tablaUni tbody').innerHTML = cal.filas.map(function (o) {
      var c = o.c, q = o.ric, vacio = o.reserva && !o.p;
      var auto = { In: 'auto · ' + q.inAuto, Icc: 'auto · ' + q.Icc, dif: q.dif && !String(c.dif || '').trim() ? 'auto · ' + q.dif : (q.difOblig ? 'obligatorio' : 'auto · sin diferencial'), sec: vacio ? '—' : 'auto · ' + RIC.fmt(q.secAuto || '—'), largo: t.largoCirc ? 'típ. ' + t.largoCirc : '' };
      return '<tr data-c="' + c.id + '"><td class="chk"><input type="checkbox" class="chkf" aria-label="Seleccionar ' + o.n + '"></td><td><span class="orig' + (c.inst ? ' io' : '') + '" title="' + (c.inst ? 'Vinculado a ' + esc(c.inst) + ' del listado de E/S' : '') + '">' + o.n + '</span></td>' +
        cols.map(function (x) {
          if (x.sel) {
            var ops = x.sel === 'usos' ? RIC.USOS : x.sel.map(function (sv) { return [sv, sv || (x.k === 'fase' ? 'Auto' + (o.fase ? ' · ' + o.fase : '') : '—')]; });
            var v = String(c[x.k] == null ? '' : c[x.k]); return '<td><select data-k="' + x.k + '">' + ops.map(function (op) { return '<option value="' + op[0] + '"' + (v === op[0] ? ' selected' : '') + '>' + op[1] + '</option>'; }).join('') + '</select></td>';
          }
          var ph = c.inst && (x.k === 'desc' || x.k === 'destino') ? val(t, Object.assign({}, c, { desc: '', destino: '' }), x.k) : (auto[x.k] || '');
          return '<td><input data-k="' + x.k + '" value="' + esc(c[x.k] == null ? '' : c[x.k]) + '" placeholder="' + esc(ph) + '"' + (c.inst && (x.k === 'desc' || x.k === 'destino') ? ' class="enlazado"' : '') + '></td>';
        }).join('') +
        '<td><input value="' + (o.I ? num(o.I, 2) : '') + '" readonly tabindex="-1"></td><td><input value="' + (vacio ? '' : num(q.iz, 1)) + '" readonly tabindex="-1"></td><td><input value="' + (vacio || !q.dvTot ? '' : num(q.dvTot, 2)) + '" readonly tabindex="-1"></td>' +
        '<td class="ric ' + (q.errores.length ? 'mal' : q.avisos.length ? 'av' : 'bien') + '">' + esc(q.errores.concat(q.avisos).join(' · ') || 'Cumple') + '</td>' +
        '<td><button type="button" class="mini" data-mv="-1" aria-label="Subir">↑</button> <button type="button" class="mini" data-mv="1" aria-label="Bajar">↓</button></td></tr>';
    }).join('') || '<tr><td colspan="20" class="vacio">Sin circuitos. Agrega circuitos o trae los instrumentos de 4 hilos del listado de E/S.</td></tr>';
    $('#uCuenta').textContent = cal.filas.length + ' circuitos · ' + num(cal.tot.p) + ' W instalados · Ib ' + num(cal.Imax, 2) + ' A · general ' + cal.ric.gen.polos + 'x' + cal.ric.gen.In + ' A' + (tres ? ' · desbalance ' + num(cal.desb, 0) + ' %' : '');
    pintarRic(cal);
  }
  function pintarRic(cal) {
    var R = cal.ric, mal = R.chk.filter(function (c) { return c.sev === 'err'; }).length, av = R.chk.filter(function (c) { return c.sev === 'warn'; }).length;
    $('#uRic').innerHTML = '<h3>Verificación RIC <span class="' + (mal ? 'mal' : av ? 'av' : 'bien') + '">' + (mal ? mal + ' incumplimientos' : 'cumple') + (av ? ' · ' + av + ' advertencias' : '') + '</span></h3><ul>' +
      R.chk.map(function (c) { return '<li class="' + (c.sev === 'ok' ? 'bien' : c.sev === 'warn' ? 'av' : 'mal') + '"><b>' + (c.sev === 'ok' ? '✓' : c.sev === 'warn' ? '!' : '✗') + '</b><span>' + esc(c.txt) + '</span><small>' + esc(c.ref) + '</small></li>'; }).join('') + '</ul>';
  }
  function pintarPrev() {
    var t = actual(), hs = hojas(t, ctx());
    $('#uHojas').innerHTML = hs.map(function (h) { return '<div class="hoja">' + D.svg(h, { mm: false }) + '</div>'; }).join('');
  }
  function pintarSel() {
    var ts = tableros(); if (!ts.some(function (t) { return t.id === selId; })) selId = ts[0].id;
    $('#uSel').innerHTML = ts.map(function (t) { return '<option value="' + t.id + '"' + (t.id === selId ? ' selected' : '') + '>' + esc(t.tag + ' · ' + t.nombre) + '</option>'; }).join('');
  }
  function pintar() { pintarSel(); pintarForm(); pintarTabla(); pintarPrev(); }
  var tP = 0;
  function cambio(tabla) { A.guardar(); if (tabla) pintarTabla(); clearTimeout(tP); tP = setTimeout(pintarPrev, 250); }
  $('#uSel').addEventListener('change', function () { selId = this.value; pintar(); });
  $('#uNuevo').addEventListener('click', function () { var ts = tableros(), t = nuevoTablero(ts.length); t.circ = [circNuevo(t, { desc: 'RESERVA' }), circNuevo(t, { desc: 'RESERVA' })]; ts.push(t); selId = t.id; A.guardar(); pintar(); });
  $('#uBorrar').addEventListener('click', function () {
    var ts = tableros(); if (ts.length < 2) return alert('Debe quedar al menos un tablero.');
    var t = actual(); if (!confirm('¿Quitar el tablero ' + t.tag + ' y sus circuitos?')) return;
    ts.splice(ts.indexOf(t), 1); selId = ts[0].id; A.guardar(); pintar();
  });
  $('#uForm').addEventListener('input', function (ev) {
    var x = ev.target, k = x.dataset.u; if (!k) return; var t = actual(), viejo = t.tag;
    var v = x.type === 'checkbox' ? x.checked : x.value;
    if (/^(v|frec|barra|icc|gen\.polos|gen\.In|gen\.Icc|largoAlim|dvAlimMax|tAmb|agrup|largoCirc|secMin|inReserva|servicio)$/.test(k) && v !== '') v = +String(v).replace(',', '.') || v;
    if (k === 'tag') { v = String(v).toUpperCase(); E().senales.forEach(function (s) { if (s.alimTab === viejo) s.alimTab = v; }); if (E().cfg.tableroAlim === viejo) E().cfg.tableroAlim = v; }
    poner(t, k, v);
    if (k === 'sistema') { pintarTabla(); }
    if (k === 'v' && t.tag === E().cfg.tableroAlim && v) E().cfg.tension4h = v + ' VAC'; // mismo valor en los diagramas de lazo de 4 hilos
    if (k === 'tag' || k === 'nombre') pintarSel();
    cambio(true);
  });
  $('#uForm').addEventListener('change', function (ev) { if (ev.target.tagName === 'SELECT' || ev.target.type === 'checkbox') { cambio(true); } });
  $('#uForm').addEventListener('focusout', function () { var a = document.activeElement; setTimeout(function () { if (!$('#uForm').contains(document.activeElement)) { var y = window.scrollY; pintarForm(); window.scrollTo(0, y); } }, 0); });
  $('#tablaUni').addEventListener('input', function (ev) {
    var x = ev.target, k = x.dataset.k, tr = x.closest('tr[data-c]'); if (!k || !tr) return;
    var t = actual(), c = t.circ.filter(function (q) { return q.id === tr.dataset.c; })[0]; if (!c) return;
    var v = x.value; if (/^(pot|fp|In|Icc|polos|largo)$/.test(k) && v !== '') v = +String(v).replace(',', '.') || v;
    c[k] = v;
    if (k === 'uso' && v === 'reserva' && !c.desc) c.desc = 'RESERVA';
    cambio(false); refrescarFila(tr, t, c);
  });
  // Actualiza los valores calculados de la fila sin rehacer la tabla (para no perder el foco)
  function refrescarFila(tr, t, c) {
    var cal = calcular(t), o = cal.filas.filter(function (q) { return q.c === c; })[0]; if (!o) return;
    var q = o.ric, vacio = o.reserva && !o.p, celdas = tr.children, n = celdas.length;
    celdas[n - 5].firstChild.value = o.I ? num(o.I, 2) : ''; celdas[n - 4].firstChild.value = vacio ? '' : num(q.iz, 1); celdas[n - 3].firstChild.value = vacio || !q.dvTot ? '' : num(q.dvTot, 2);
    celdas[n - 2].className = 'ric ' + (q.errores.length ? 'mal' : q.avisos.length ? 'av' : 'bien'); celdas[n - 2].textContent = q.errores.concat(q.avisos).join(' · ') || 'Cumple';
    [['In', 'auto · ' + q.inAuto], ['Icc', 'auto · ' + q.Icc], ['sec', vacio ? '—' : 'auto · ' + window.RIC.fmt(q.secAuto || '—')], ['dif', q.dif && !String(c.dif || '').trim() ? 'auto · ' + q.dif : (q.difOblig ? 'obligatorio' : 'auto · sin diferencial')]].forEach(function (p) { var i = tr.querySelector('input[data-k="' + p[0] + '"]'); if (i) i.placeholder = p[1]; });
    $('#uCuenta').textContent = cal.filas.length + ' circuitos · ' + num(cal.tot.p) + ' W instalados · Ib ' + num(cal.Imax, 2) + ' A · general ' + cal.ric.gen.polos + 'x' + cal.ric.gen.In + ' A';
    pintarRic(cal);
  }
  $('#tablaUni').addEventListener('change', function (ev) { if (ev.target.tagName === 'SELECT' && ev.target.dataset.k) cambio(true); });
  $('#tablaUni').addEventListener('change', function (ev) { if (ev.target.id === 'uTodo') document.querySelectorAll('#tablaUni .chkf').forEach(function (c) { c.checked = ev.target.checked; }); });
  $('#tablaUni').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-mv]'); if (!b) return;
    var t = actual(), id = b.closest('tr').dataset.c, i = t.circ.map(function (c) { return c.id; }).indexOf(id), j = i + (+b.dataset.mv);
    if (j < 0 || j >= t.circ.length) return; var c = t.circ.splice(i, 1)[0]; t.circ.splice(j, 0, c); cambio(true);
  });
  $('#uAgregar').addEventListener('click', function () { var t = actual(); t.circ.push(circNuevo(t)); cambio(true); var ins = document.querySelectorAll('#tablaUni input[data-k="desc"]'); if (ins.length) ins[ins.length - 1].focus(); });
  $('#uReserva').addEventListener('click', function () { var t = actual(); t.circ.push(circNuevo(t, { desc: 'RESERVA' }), circNuevo(t, { desc: 'RESERVA' })); cambio(true); });
  $('#uReservaRic').addEventListener('click', function () { // RIC N°02 6.1.16.3: ampliación de 25 %
    var t = actual(), cal = calcular(t), act = cal.filas.filter(function (o) { return !o.reserva; }).length, res = cal.filas.length - act, req = Math.ceil(act * 0.25), n = 0;
    while (res + n < req && t.circ.length < 25) { t.circ.push(circNuevo(t, { desc: 'RESERVA' })); n++; }
    cambio(true); $('#uCuenta').textContent += ' · ' + (n ? n + ' reservas agregadas' : 'las reservas ya cumplen el 25 %');
  });
  $('#uInst').addEventListener('click', function () {
    var n = agregarInstrumentos(actual());
    cambio(true);
    $('#uCuenta').textContent += ' · ' + (n ? n + ' instrumentos de 4 hilos agregados' : 'no hay instrumentos de 4 hilos sin circuito');
  });
  $('#uQuitar').addEventListener('click', function () {
    var t = actual(), ids = []; document.querySelectorAll('#tablaUni .chkf:checked').forEach(function (c) { ids.push(c.closest('tr').dataset.c); });
    if (!ids.length) return;
    t.circ = t.circ.filter(function (c) { if (ids.indexOf(c.id) >= 0) { if (c.inst) { var s = senalDe(c.inst); if (s && s.alimTab === t.tag) s.alimTab = ''; } return false; } return true; });
    cambio(true);
  });
  $('#uPdf').addEventListener('click', function () { var hs = hojas(actual(), ctx()); $('#imp').innerHTML = hs.map(function (h) { return '<div class="hojaImp">' + D.svg(h) + '</div>'; }).join(''); setTimeout(function () { window.print(); }, 150); });
  $('#uDxf').addEventListener('click', function () { var t = actual(), hs = hojas(t, ctx()); A.descargar((hs[0].plano || t.tag).replace(/[\\/:*?"<>|]+/g, '-') + '.dxf', D.dxf(hs), 'application/dxf'); });
  $('#uExcel').addEventListener('click', function () { excel(actual()); });

  // Circuito del tablero que alimenta un instrumento (lo usa el listado de circuitos)
  function circuitoDe(tag) {
    var r = null; (E().tdi || []).some(function (t) { return t.circ.some(function (c, i) { if (c.inst === tag) { r = { tablero: t.tag, cb: 'CB' + pad(i + 1, 2), tension: (t.v || 220) + ' VAC' }; return true; } return false; }); }); return r;
  }
  window.LAZOS_UNI = { hojas: hojas, calcular: calcular, circuitoDe: circuitoDe, tableros: tableros };
  window.LAZOS_VISTAS = Object.assign(window.LAZOS_VISTAS || {}, { uni: pintar });
  if (!$('#v-uni').hidden) pintar();
})();
