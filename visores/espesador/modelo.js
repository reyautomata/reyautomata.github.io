/* Modelo dinámico de una planta de espesamiento de relaves · Suite ReyEngi
 * Balance de sólidos y agua del espesador, compactación de la cama, flujo límite de sólidos según la dosis de floculante,
 * claridad del rebose, torque de rastras con levante automático, bombas de descarga (duty / standby) con VDF, preparación y
 * dosificación de floculante, estanque de agua recuperada y sumidero. Lazos PI: densidad de descarga (o inventario de cama)
 * → velocidad de bomba, razón floculante / sólidos → bomba dosificadora, nivel de agua recuperada → bombas de agua.
 * Es un modelo de entrenamiento y estudio de control, de parámetros ajustables; no reemplaza los ensayos de sedimentación
 * ni el dimensionamiento del proveedor del espesador.
 */
(function (g) {
  'use strict';
  var RHO_W = 1.0;

  // Parámetros por defecto: espesador de alta capacidad de relaves (configurables)
  function parametros() {
    return {
      D: 50, H: 8, cono: 3,            // diámetro [m], altura de muro [m], altura del cono [m]
      rhoS: 2.7,                       // gravedad específica de sólidos
      Cgel: 0.40, tau0: 1.5,           // concentración de gel [p/p], constante de compactación [h]
      CuBase: 0.55, CuFloc: 0.12,      // concentración límite de descarga sin / con floculación óptima
      phiCama: 0.32,                   // fracción volumétrica media de la cama
      dosisOpt: 22, dosisSobre: 40,    // dosis óptima y de sobredosificación [g/t]
      GBase: 0.25, GFloc: 0.75,        // flujo límite de sólidos [t/m²·h]
      vBase: 0.5, vFloc: 8,            // velocidad de sedimentación de flóculos [m/h]
      MbTorque: 9000,                  // inventario de cama que da 100 % de torque a rastras abajo [t]
      QmaxBomba: 2000, HBomba: 48,     // caudal a 100 % de velocidad [m³/h], altura a 100 % [m]
      DNdescarga: 0.584,               // diámetro interior de la línea de descarga [m] (24")
      vDepositoMin: 1.0,               // velocidad mínima para evitar depósito [m/s]
      concStock: 0.5, concDosif: 0.05, // % p/v de floculante en preparación y en línea
      volFloc: 40, volAgua: 500, volSumidero: 12  // volúmenes útiles [m³]
    };
  }

  function nuevoEstado(p) {
    var A = Math.PI * p.D * p.D / 4;
    return {
      t: 0,
      // Alimentación (entradas del operador / perturbaciones)
      Qf: 3500, Cwf: 0.28,
      // Espesador
      Mb: 3 * A * p.phiCama * p.rhoS, Cu: 0.62, lift: 0, rastras: true, torque: 0, tss: 80,
      // Bombas de descarga
      bombas: [{ on: true, falla: false, N: 72 }, { on: false, falla: false, N: 0 }], duty: 0, autoStandby: true, tStandby: 0,
      // Floculante
      dosis: 22, dosisReal: 22, flocPump: [{ on: true, falla: false }, { on: false, falla: false }], tkFloc: [0.75, 0.6], tkFlocDuty: 0, prep: false,
      // Agua recuperada y sumidero
      nAgua: 0.55, bombasAgua: [true, true, false], vAgua: 70, nSum: 0.3, sumOn: false,
      // Control
      modo: 'densidad',                 // densidad | cama | manual
      spCu: 0.63, spCama: 3.0, limCama: 5.0, override: false, spAgua: 0.55, kp: 120, ti: 900, integ: 0,
      ratio: true, aguaAuto: true, liftAuto: true,
      // Medidas (con retardo de instrumento)
      m: { DITf: 28, FITf: 3500, DIT: 62, FIT: 1250, LIT: 3, TIT: 0, AIT: 80, LITa: 55, LITf: 75, LITs: 30, FITfl: 0, PIT: 0, vel: 1.3, P: 0 },
      alarmas: {}, log: []
    };
  }

  function rhoPulpa(Cw, rhoS) { return 1 / (Cw / rhoS + (1 - Cw) / RHO_W); }
  function efFloc(p, d) { var f = d / (d + p.dosisOpt * 0.27); if (d > p.dosisSobre) f *= Math.max(0.4, 1 - 0.012 * (d - p.dosisSobre)); return Math.max(0, Math.min(1, f)); }
  function lag(x, y, dt, tau) { return y + (x - y) * Math.min(1, dt / tau); }

  // Un paso de integración de dt segundos
  function paso(s, p, dt) {
    var A = Math.PI * p.D * p.D / 4, h = dt / 3600, P = {};
    s.t += dt;
    // Alimentación
    var rf = rhoPulpa(s.Cwf, p.rhoS), Mf = s.Qf * rf, Ms = Mf * s.Cwf, Wf = Mf - Ms;     // t/h de pulpa, sólidos y agua
    // Floculante: razón dosis × sólidos → caudal de la bomba dosificadora
    var fp = s.flocPump.filter(function (x) { return x.on && !x.falla; }).length > 0;
    var tk = s.tkFloc[s.tkFlocDuty];
    var flocOk = fp && tk > 0.03;
    var qStock = s.ratio ? s.dosis * Ms / 1000 / (s.concStock || p.concStock) / 10 : s.qStockMan || 0;  // m³/h de solución madre (5 kg/m³ al 0,5 %)
    if (!flocOk) qStock = 0;
    var dosisAplicada = qStock * p.concStock * 10 * 1000 / Math.max(Ms, 1);
    s.dosisReal = lag(dosisAplicada, s.dosisReal, dt, 240);
    var ef = efFloc(p, s.dosisReal);
    // Estanques de floculante y preparación por lotes
    s.tkFloc[s.tkFlocDuty] = Math.max(0, tk - qStock * h / p.volFloc);
    if (s.tkFloc[s.tkFlocDuty] < 0.15) { var otro = 1 - s.tkFlocDuty; if (s.tkFloc[otro] > 0.3) { s.tkFlocDuty = otro; evento(s, 'info', 'Cambio de estanque de floculante en servicio'); } }
    var vacio = s.tkFloc[0] < s.tkFloc[1] ? 0 : 1;
    if (!s.prep && s.tkFloc[vacio] < 0.3 && vacio !== s.tkFlocDuty) { s.prep = vacio + 1; evento(s, 'info', 'Inicio de preparación de floculante (lote)'); }
    if (s.prep) { var i = s.prep - 1; s.tkFloc[i] = Math.min(0.92, s.tkFloc[i] + 12 * h / p.volFloc); if (s.tkFloc[i] >= 0.92) { s.prep = false; evento(s, 'info', 'Fin de preparación de floculante'); } }

    // Descarga: bomba en servicio, velocidad por control
    var b = s.bombas[s.duty];
    if ((!b.on || b.falla) && s.autoStandby) {
      s.tStandby += dt;
      if (s.tStandby > 15) { var o = 1 - s.duty; if (!s.bombas[o].falla) { s.duty = o; s.bombas[o].on = true; s.bombas[o].N = Math.max(b.N, 60); evento(s, 'aviso', 'Partida automática de la bomba de respaldo'); } s.tStandby = 0; }
    } else s.tStandby = 0;
    b = s.bombas[s.duty];
    var corre = b.on && !b.falla;
    // Control de velocidad
    if (corre && s.modo !== 'manual') {
      var e = s.modo === 'densidad' ? (s.m.DIT / 100 - s.spCu) * 100 : (s.m.LIT - s.spCama) * 10; // + → más velocidad
      if (s.modo === 'densidad' && s.m.LIT > s.limCama) { var eo = (s.m.LIT - s.limCama) * 20; if (eo > e) { e = eo; if (!s.override) { s.override = true; evento(s, 'aviso', 'Override por nivel de cama: el control pasa de densidad a inventario'); } } } else s.override = false;
      s.integ += e * dt / s.ti;
      s.integ = Math.max(-60, Math.min(60, s.integ));
      b.N = Math.max(35, Math.min(100, 70 + s.kp / 100 * (e + s.integ)));
    }
    var fDens = 1 - 0.6 * Math.max(0, s.Cu - 0.62) / 0.1;                        // pérdida de caudal por reología
    var Qu = corre ? Math.max(0, p.QmaxBomba * b.N / 100 * fDens) : 0;
    var ru = rhoPulpa(s.Cu, p.rhoS), Mu = Math.min(Qu * ru * s.Cu, s.Mb / Math.max(h, 1e-6) * 0.5);
    // Sedimentación: flujo límite y arrastre al rebose
    var G = p.GBase + p.GFloc * ef;                                             // t/m²·h
    var carga = Ms / A, escape = Math.max(0, Ms - G * A);
    var Lb = s.Mb / (A * p.phiCama * p.rhoS);                                    // altura de cama [m]
    var libre = p.H + p.cono - Lb;
    if (libre < 1.2) escape += Ms * Math.min(1, (1.2 - libre) / 1.2);           // cama alcanza el feedwell
    escape = Math.min(escape, Ms);
    var Qo = Math.max(0, (Wf - (Mu / s.Cu - Mu)) / RHO_W);                       // agua al rebose [m³/h]
    var subida = Qo / A, vs = p.vBase + p.vFloc * ef;
    var tssBase = 40 + 1500 * Math.exp(-s.dosisReal / 5) + (subida > vs ? 2500 * (subida - vs) / vs : 0);
    var tss = tssBase + (Qo > 1 ? escape * 1e6 / Qo : 0);
    s.tss = lag(tss, s.tss, dt, 120);
    var Mo = Qo * s.tss / 1e6;
    // Balance de la cama y compactación
    s.Mb = Math.max(0, s.Mb + (Ms - Mu - Mo) * h);
    var tau = s.Mb / Math.max(Mu, 50);                                           // tiempo de residencia de sólidos en la cama [h]
    var CuMax = p.CuBase + p.CuFloc * ef;
    var CuEq = p.Cgel + (CuMax - p.Cgel) * (1 - Math.exp(-tau / p.tau0));
    s.Cu = lag(CuEq, s.Cu, dt, 900);
    // Rastras: torque y levante
    var tq = 100 * Math.pow(s.Mb / p.MbTorque, 1.3) * (1 + 4 * Math.max(0, s.Cu - 0.66)) * (1 - 0.5 * s.lift / 100);
    if (!s.rastras) tq = 0;
    s.torque = lag(tq, s.torque, dt, 30);
    if (s.liftAuto && s.rastras) { if (s.torque > 60) s.lift = Math.min(100, s.lift + 2 * dt / 60); else if (s.torque < 35 && s.lift > 0) s.lift = Math.max(0, s.lift - 1 * dt / 60); }
    if (s.torque >= 100 && s.rastras) { s.rastras = false; evento(s, 'falla', 'Disparo de rastras por torque alto (100 %)'); }
    // Agua recuperada: rebose → estanque → bombas de agua de proceso
    var nOn = s.bombasAgua.filter(Boolean).length;
    if (s.aguaAuto) {
      var ea = (s.nAgua - s.spAgua) * 100; s.vAgua = Math.max(30, Math.min(100, 65 + 2.5 * ea));
      var on = s.bombasAgua.filter(Boolean).length;
      if (s.nAgua > 0.8 && on < 3) { s.bombasAgua[s.bombasAgua.indexOf(false)] = true; evento(s, 'info', 'Partida de bomba de agua recuperada por nivel alto'); }
      else if (s.nAgua < 0.3 && on > 1) { s.bombasAgua[s.bombasAgua.lastIndexOf(true)] = false; evento(s, 'info', 'Detención de bomba de agua recuperada por nivel bajo'); }
      nOn = s.bombasAgua.filter(Boolean).length;
    }
    var Qagua = nOn * 1200 * s.vAgua / 100;
    s.nAgua = Math.max(0, Math.min(1, s.nAgua + (Qo - Qagua) * h / p.volAgua));
    // Sumidero con derrames
    var Qsum = 6 + 4 * Math.sin(s.t / 900);
    if (s.nSum > 0.7) s.sumOn = true; if (s.nSum < 0.2) s.sumOn = false;
    s.nSum = Math.max(0, Math.min(1, s.nSum + (Qsum - (s.sumOn ? 40 : 0)) * h / p.volSumidero));
    // Hidráulica de la descarga
    var area = Math.PI * p.DNdescarga * p.DNdescarga / 4, vel = Qu / 3600 / area;
    var Hb = corre ? p.HBomba * Math.pow(b.N / 100, 2) : 0;
    var kW = corre ? Qu / 3600 * ru * 1000 * 9.81 * Hb / 0.7 / 1000 : 0;
    // Medidas (retardos de instrumento)
    var m = s.m;
    m.FITf = lag(s.Qf, m.FITf, dt, 5); m.DITf = lag(s.Cwf * 100, m.DITf, dt, 10);
    m.FIT = lag(Qu, m.FIT, dt, 5); m.DIT = lag(s.Cu * 100, m.DIT, dt, 15); m.LIT = lag(Lb, m.LIT, dt, 60);
    m.PIT = lag(Lb * p.phiCama * p.rhoS * 9.81 + (p.H + p.cono) * 9.81, m.PIT, dt, 60);   // presión de cama [kPa] aprox.
    m.TIT = s.torque; m.AIT = s.tss; m.LITa = s.nAgua * 100; m.LITf = s.tkFloc[s.tkFlocDuty] * 100; m.LITs = s.nSum * 100;
    m.FITfl = qStock * p.concStock / p.concDosif; m.vel = vel; m.P = kW; m.Ms = Ms; m.Mu = Mu; m.Qo = Qo; m.Qagua = Qagua; m.carga = carga; m.subida = subida; m.vs = vs; m.G = G; m.ef = ef; m.Hb = Hb; m.Lb = Lb;
    alarmas(s, p);
    return s;
  }

  var DEF_ALARMAS = [
    ['DIT_L', function (s) { return s.m.DIT < 55; }, 'aviso', 'Densidad de descarga baja (< 55 % p/p)'],
    ['DIT_H', function (s) { return s.m.DIT > 70; }, 'aviso', 'Densidad de descarga alta (> 70 % p/p): riesgo de embanque'],
    ['TIT_H', function (s) { return s.torque > 70; }, 'aviso', 'Torque de rastras alto (> 70 %)'],
    ['TIT_HH', function (s) { return s.torque > 90; }, 'falla', 'Torque de rastras muy alto (> 90 %)'],
    ['LIT_H', function (s) { return s.m.LIT > 5.5; }, 'aviso', 'Nivel de cama alto (> 5,5 m)'],
    ['AIT_H', function (s) { return s.tss > 300; }, 'aviso', 'Rebose turbio (> 300 mg/L)'],
    ['VEL_L', function (s) { return s.m.FIT > 0 && s.m.vel < 1.0; }, 'aviso', 'Velocidad en la línea de descarga bajo la de depósito'],
    ['UF_OFF', function (s) { var b = s.bombas[s.duty]; return !b.on || b.falla; }, 'falla', 'Sin bomba de descarga en servicio'],
    ['FLOC', function (s) { return s.dosisReal < 8; }, 'aviso', 'Dosis de floculante baja (< 8 g/t)'],
    ['TKF_L', function (s) { return s.tkFloc[s.tkFlocDuty] < 0.15; }, 'aviso', 'Nivel bajo en estanque de floculante en servicio'],
    ['AGUA_H', function (s) { return s.nAgua > 0.9; }, 'aviso', 'Nivel alto en estanque de agua recuperada'],
    ['SUM_H', function (s) { return s.nSum > 0.85; }, 'aviso', 'Nivel alto en sumidero']
  ];
  function alarmas(s) {
    DEF_ALARMAS.forEach(function (a) {
      var act = a[1](s);
      if (act && !s.alarmas[a[0]]) { s.alarmas[a[0]] = { sev: a[2], txt: a[3], t: s.t, rec: false }; evento(s, a[2], a[3]); }
      else if (!act && s.alarmas[a[0]]) delete s.alarmas[a[0]];
    });
  }
  function evento(s, sev, txt) { s.log.unshift({ t: s.t, sev: sev, txt: txt }); if (s.log.length > 200) s.log.pop(); }

  g.ESP_MODELO = { parametros: parametros, nuevoEstado: nuevoEstado, paso: paso, rhoPulpa: rhoPulpa, efFloc: efFloc, evento: evento, ALARMAS: DEF_ALARMAS };
})(typeof window !== 'undefined' ? window : globalThis);
