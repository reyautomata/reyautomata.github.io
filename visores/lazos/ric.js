/* Cálculo eléctrico de tableros según los Pliegos Técnicos Normativos RIC (SEC, Chile) · ReyEngi
 * RIC N°02 Tableros · N°03 Alimentadores y demanda · N°04 Conductores · N°05 Protección contra tensiones peligrosas
 * N°06 Puesta a tierra · N°07 Instalaciones de equipos · N°10 Instalaciones de uso general.
 * Todo es referencial: el proyectista verifica los resultados y los datos de los fabricantes.
 */
(function () {
  'use strict';
  // RIC N°04 Tabla N°4.4: corriente admisible [A] de conductores de cobre aislados, 30 °C ambiente
  var SECC = [1.5, 2.5, 4, 6, 10, 16, 25, 35];
  var IZ = {
    70: { A1: [14, 18, 24, 31, 42, 56, 73, 89], B1: [16, 21, 28, 36, 50, 68, 89, 110], E: [19, 24, 31, 43, 60, 80, 101, 126] },
    90: { A1: [17, 23, 31, 40, 54, 73, 95, 117], A2: [17, 22, 30, 38, 51, 68, 89, 109], B1: [18, 24, 37, 48, 66, 88, 117, 144], B2: [19, 24, 35, 44, 60, 80, 105, 128],
      D1: [19, 33, 42, 52, 68, 89, 113, 136], D2: [23, 38, 59, 74, 98, 126, 161, 194], E: [19, 32, 42, 54, 75, 100, 127, 158] }
  };
  var METODOS = [['A1', 'A1 · en ducto embutido en muro'], ['A2', 'A2 · multiconductor en ducto embutido'], ['B1', 'B1 · en ducto o bandeja adosada a muro'], ['B2', 'B2 · multiconductor en ducto adosado'],
    ['D1', 'D1 · en ducto enterrado'], ['D2', 'D2 · directamente enterrado'], ['E', 'E · multiconductor en escalerilla o bandeja perforada']];
  var CABLE = { 70: 'H07Z1-K (70 °C)', 90: 'RZ1-K 0,6/1 kV (90 °C)' };
  // RIC N°04 Tabla N°4.6: factor por cantidad de conductores activos en la misma canalización
  function fn(n) { n = +n || 3; return n <= 3 ? 1 : n <= 6 ? 0.8 : n <= 24 ? 0.7 : n <= 42 ? 0.6 : 0.5; }
  // RIC N°04 Tabla N°4.7: factor por temperatura ambiente (tramos de 5 °C, sin factores mayores que 1)
  function ft(t, serv, met) {
    t = +t || 30; if (t <= 30) return /^D/.test(met) ? 0.93 : 1;
    var k = Math.min(6, Math.ceil((t - 30) / 5)) - 1;
    var T70 = [0.94, 0.87, 0.79, 0.71, 0.61, 0.50], T90 = [0.96, 0.91, 0.87, 0.82, 0.76, 0.71], TD = [0.89, 0.85, 0.80, 0.76, 0.71, 0.65];
    return (/^D/.test(met) ? TD : +serv === 70 ? T70 : T90)[k];
  }
  function izDe(sec, serv, met) { var tab = (IZ[serv] || IZ[90])[met] || (IZ[serv] || IZ[90]).B1 || IZ[90].B1, i = SECC.indexOf(+sec); return i < 0 ? 0 : tab[i]; }
  var STD_IN = [2, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
  var STD_DIF = [25, 40, 63, 80, 100, 125];
  var STD_ICC = [6, 10, 15, 25, 36, 50];
  var STD_BARRA = [63, 100, 125, 160, 200, 250, 400];
  function sobre(lista, x) { for (var i = 0; i < lista.length; i++) if (lista[i] >= x - 1e-9) return lista[i]; return lista[lista.length - 1]; }
  function rho(serv) { return +serv === 70 ? 0.0206 : 0.0225; } // Ω·mm²/m del cobre a la temperatura de servicio
  // RIC N°06 Anexo 6.7: sección mínima del conductor de protección
  function secPE(s) { return s <= 25 ? s : s <= 50 ? 25 : s / 2; }
  var USOS = [['equipo', 'Equipos / instrumentos'], ['alumbrado', 'Alumbrado'], ['enchufes', 'Enchufes'], ['motor', 'Motor'], ['clima', 'Climatización / calefacción'], ['reserva', 'Reserva']];
  var IP_MIN = { interior: 'IP41', bajoTecho: 'IP44', intemperie: 'IP54', mojado: 'IPX4' };
  function ipOk(ip, min) {
    var a = /IP\s*([\dX])([\dX])/i.exec(ip || ''), b = /IP\s*([\dX])([\dX])/i.exec(min);
    if (!a) return false; return [1, 2].every(function (k) { return b[k] === 'X' || (a[k] !== 'X' && +a[k] >= +b[k]); });
  }

  // Dimensiona un circuito: corriente de diseño, protección, conductor y caída de tensión
  // c: datos del circuito; o: { p, I(=Ib), trif } ya calculado; t: tablero; dvAlim: caída del alimentador [%]
  function circuito(t, c, o, dvAlim) {
    var serv = +t.servicio || 90, met = c.metodo || t.metodo || 'B1', V = +t.v || 220, tres = t.sistema === '3F';
    var uso = c.uso || 'equipo', res = uso === 'reserva' || o.reserva, r = { uso: uso, avisos: [], errores: [] };
    var k = uso === 'motor' || uso === 'clima' ? 1.25 : 1.10;           // RIC N°07 5.5.2 y 7.3.4 · RIC N°10 5.1.4.1
    r.idis = o.I * k;
    r.inAuto = res && !o.p ? (+t.inReserva || 10) : sobre(STD_IN, Math.max(r.idis, 6));
    r.In = +c.In || r.inAuto; r.inManual = !!+c.In;
    if (r.inManual && r.In < r.idis) r.errores.push('In ' + r.In + ' A menor que la corriente de diseño ' + dec(r.idis, 2) + ' A');
    r.Icc = +c.Icc || sobre(STD_ICC, Math.max(6, +t.icc || 6));
    if (+t.icc && r.Icc < +t.icc) r.errores.push('Capacidad de ruptura ' + r.Icc + ' kA menor que Icc en barra ' + t.icc + ' kA');
    // Conductor: sección mínima por uso (RIC N°04 5.4), protección del conductor In ≤ Iz (RIC N°10 5.1.5.1) y caída total ≤ 5 % (RIC N°03 5.1.3)
    var secMin = uso === 'alumbrado' ? 1.5 : uso === 'enchufes' || uso === 'motor' || uso === 'clima' ? 2.5 : (+t.secMin || 2.5);
    var f = fn(c.agrup || t.agrup) * ft(t.tAmb, serv, met), L = +c.largo || +t.largoCirc || 0, Vref = tres && o.trif ? V * Math.sqrt(3) : V;
    function dv(s) { return !L || !o.I ? 0 : (o.trif ? Math.sqrt(3) : 2) * L * o.I * rho(serv) / s / Vref * 100; }
    var s = null;
    for (var i = 0; i < SECC.length; i++) { var sc = SECC[i]; if (sc < secMin) continue; if (izDe(sc, serv, met) * f >= r.In && dvAlim + dv(sc) <= 5) { s = sc; break; } }
    r.secAuto = s; r.sec = +String(c.sec || '').replace(',', '.') || s; r.secManual = !!+String(c.sec || '').replace(',', '.');
    if (!r.sec) { r.errores.push('Ninguna sección hasta 35 mm² cumple: revisar largo, método o protección'); r.sec = SECC[SECC.length - 1]; }
    r.iz = izDe(r.sec, serv, met) * f; r.f = f;
    r.dv = dv(r.sec); r.dvTot = dvAlim + r.dv; r.pe = secPE(r.sec);
    if (res && !o.p) { r.iz = 0; r.dv = 0; r.dvTot = 0; }
    else {
      if (r.secManual && r.sec < secMin) r.errores.push('Sección ' + r.sec + ' mm² menor que la mínima de ' + secMin + ' mm² (RIC N°04 5.4)');
      if (r.In > r.iz + 1e-9) r.errores.push('In ' + r.In + ' A mayor que Iz ' + dec(r.iz, 1) + ' A del conductor (RIC N°10 5.1.5.1)');
      if (r.dvTot > 5) r.errores.push('Caída de tensión total ' + dec(r.dvTot, 2) + ' % sobre 5 % (RIC N°03 5.1.3)');
      if (!L) r.avisos.push('Sin largo: caída de tensión no calculada');
    }
    // Protección diferencial: obligatoria en alumbrado y enchufes (RIC N°10 5.1.3.5), motores (RIC N°07 5.6.2.9) y climatización (RIC N°07 7.6.5.4)
    var oblig = uso === 'alumbrado' || uso === 'enchufes' || uso === 'motor' || uso === 'clima';
    var quiere = oblig || (uso === 'equipo' && t.difEquipos !== false) || (res && t.difEquipos !== false);
    var manual = String(c.dif || '').trim();
    r.difOblig = oblig;
    if (/^no$/i.test(manual)) { r.dif = ''; if (oblig) r.errores.push('Diferencial obligatorio para ' + uso + ' (RIC N°10 5.1.3.5 / RIC N°07)'); }
    else if (manual) r.dif = manual;
    else if (quiere) {
      var pol = tres ? (o.trif ? 4 : 2) : 2;
      r.difIn = sobre(STD_DIF, r.In);                                    // RIC N°02 6.2.6: In diferencial ≥ In termomagnético aguas arriba
      r.dif = pol + 'x' + r.difIn + 'A 30mA ' + (uso === 'equipo' || uso === 'reserva' ? 'TIPO A' : 'TIPO AC');   // RIC N°05 7.8.2 y 7.8.3 (cargas no lineales: tipo A)
    } else r.dif = '';
    return r;
  }

  // Alimentador del tablero, protección general, barra y verificaciones de RIC N°02
  function tablero(t, cal) {
    var serv = +t.servicio || 90, met = t.metodoAlim || t.metodo || 'B1', V = +t.v || 220, tres = t.sistema === '3F', chk = [];
    function ok(c, txt, ref, sev) { chk.push({ ok: !!c, sev: c ? 'ok' : (sev || 'err'), txt: txt, ref: ref }); }
    var activos = cal.filas.filter(function (o) { return !o.reserva; }), reservas = cal.filas.length - activos.length;
    var Ib = cal.Imax, maxIn = 0;
    cal.filas.forEach(function (o) { maxIn = Math.max(maxIn, circuito(t, o.c, o, 0).In); });
    // Protección general: ≥ 1,25·Ib del tablero y selectiva con el mayor circuito (criterio de diseño: 1,6 × In mayor)
    var g = {}; g.ib = Ib; g.inAuto = sobre(STD_IN, Math.max(Ib * 1.25, maxIn * 1.6, 10));
    g.In = +t.gen.In || g.inAuto; g.polos = +t.gen.polos || (tres ? 4 : 2);
    // Alimentador o subalimentador: Iz ≥ In general, sección mínima (RIC N°03 5.1.2) y caída ≤ 3 % (RIC N°03 5.1.3)
    var smin = t.tipoAlim === 'alimentador' ? 4 : 2.5, L = +t.largoAlim || 0, Vref = tres ? V * Math.sqrt(3) : V, f = fn(t.agrupAlim || 3) * ft(t.tAmb, serv, met);
    function dv(s) { return !L || !Ib ? 0 : (tres ? Math.sqrt(3) : 2) * L * Ib * rho(serv) / s / Vref * 100; }
    var s = null; for (var i = 0; i < SECC.length; i++) { if (SECC[i] < smin) continue; if (izDe(SECC[i], serv, met) * f >= g.In && dv(SECC[i]) <= Math.min(3, +t.dvAlimMax || 3)) { s = SECC[i]; break; } }
    var a = { secAuto: s, sec: +String(t.secAlim || '').replace(',', '.') || s || 35 };
    a.iz = izDe(a.sec, serv, met) * f; a.dv = dv(a.sec); a.pe = secPE(a.sec);
    a.txt = t.cable || ((tres ? '4' : '2') + 'x' + fmt(a.sec) + ' mm² + T ' + fmt(a.pe) + ' mm² ' + (CABLE[serv] || ''));
    // Circuitos
    cal.filas.forEach(function (o) { o.ric = circuito(t, o.c, o, a.dv); });
    g.selectivo = g.In >= maxIn * 1.6;
    var barra = sobre(STD_BARRA, g.In); g.barra = +t.barra || barra;
    // Verificaciones
    ok(g.In >= Ib * 1.25 - 1e-9, 'Protección general ' + g.polos + 'x' + g.In + ' A para Ib = ' + dec(Ib, 2) + ' A', 'RIC N°03 5.2.2');
    ok(g.selectivo, 'Selectividad: general ' + g.In + ' A ≥ 1,6 × mayor circuito (' + maxIn + ' A)', 'Criterio de diseño', 'warn');
    ok(a.iz >= g.In, 'Alimentador ' + fmt(a.sec) + ' mm²: Iz ' + dec(a.iz, 1) + ' A ≥ In general ' + g.In + ' A', 'RIC N°03 5.2.2 · RIC N°04 Tabla 4.4');
    ok(a.sec >= smin, 'Sección del ' + (t.tipoAlim === 'alimentador' ? 'alimentador' : 'subalimentador') + ' ' + fmt(a.sec) + ' mm² ≥ ' + fmt(smin) + ' mm²', 'RIC N°03 5.1.2');
    ok(!L || a.dv <= 3, L ? 'Caída de tensión del alimentador ' + dec(a.dv, 2) + ' % ≤ 3 %' : 'Falta el largo del alimentador para calcular la caída de tensión', 'RIC N°03 5.1.3', L ? 'err' : 'warn');
    ok(g.barra >= g.In, 'Barras de ' + g.barra + ' A ≥ protección general ' + g.In + ' A', 'RIC N°02 6.2.10');
    ok(cal.filas.length <= 25, cal.filas.length + ' circuitos por protección general (máximo 25)', 'RIC N°02 6.6.1');
    var req = Math.ceil(activos.length * 0.25);
    ok(reservas >= req, reservas + ' reservas para ampliación del 25 % (se requieren ' + req + ')', 'RIC N°02 6.1.16.3');
    ok(t.piloto !== false, 'Luz piloto de presencia de tensión ' + (tres ? 'en cada fase' : ''), 'RIC N°02 6.2.14');
    ok(g.In < 100 || t.medidor, g.In >= 100 ? 'Tablero ≥ 100 A: instrumentos de tensión y corriente por fase' : 'Instrumentos de medida no obligatorios (< 100 A)', 'RIC N°02 6.2.13');
    var ipMin = IP_MIN[t.ambiente || 'interior'];
    ok(ipOk(t.ip, ipMin), 'Grado de protección ' + (t.ip || '—') + ' ≥ ' + ipMin + ' para ' + ({ interior: 'interior', bajoTecho: 'exterior bajo techo', intemperie: 'intemperie', mojado: 'lugar mojado' })[t.ambiente || 'interior'], 'RIC N°02 6.1.21');
    var porUso = {}; activos.forEach(function (o) { var u = o.ric.uso; porUso[u] = (porUso[u] || 0) + 1; });
    var usos = Object.keys(porUso).filter(function (u) { return porUso[u] >= 4; });
    ok(usos.length <= 1, usos.length > 1 ? 'Servicios con 4 o más circuitos (' + usos.join(', ') + '): cada uno requiere su protección general omnipolar' : 'Un servicio por protección general', 'RIC N°02 6.6.3', 'warn');
    var errC = cal.filas.filter(function (o) { return o.ric.errores.length; });
    ok(!errC.length, errC.length ? 'Circuitos con observaciones: ' + errC.map(function (o) { return o.n; }).join(', ') : 'Todos los circuitos cumplen protección, sección, caída de tensión y diferencial', 'RIC N°04 · N°05 · N°07 · N°10');
    if (tres) ok(!cal.desb || cal.desb <= 20, 'Desbalance de fases ' + dec(cal.desb, 0) + ' %', 'Criterio de diseño', 'warn');
    return { gen: g, alim: a, chk: chk, reservasReq: req, cable: CABLE[serv] };
  }
  function fmt(s) { return String(s).replace('.', ','); }
  function dec(v, d) { return (+v || 0).toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  window.RIC = { tablero: tablero, circuito: circuito, SECC: SECC, METODOS: METODOS, USOS: USOS, CABLE: CABLE, IP_MIN: IP_MIN, STD_IN: STD_IN, fmt: fmt, secPE: secPE };
})();
