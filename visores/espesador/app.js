/* Simulador de planta de espesamiento · interfaz · Suite ReyEngi */
(function () {
  'use strict';
  var MOD = window.ESP_MODELO, PL = window.ESP_PLANTA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var f = function (v, d) { return isFinite(v) ? (+v).toLocaleString('es-CL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : '—'; };

  var cfg = PL.cargar(), p = Object.assign(MOD.parametros(), cfg.param || {}), s = MOD.nuevoEstado(p);
  var vel = 10, corriendo = true, hist = [], vista = null;
  function tg(r) { return PL.tag(cfg, r); }

  // ── Pestañas ──
  var tabs = $$('.tabs button'), secs = $$('main > section[data-t]');
  function mostrar(t) {
    if (!secs.some(function (x) { return x.dataset.t === t; })) t = 'sim';
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.t === t)); });
    secs.forEach(function (x) { x.hidden = x.dataset.t !== t; });
    try { history.replaceState(null, '', '#' + t); } catch (e) {}
    if (t === 'planta') pintarPlanta(); if (t === 'proceso') pintarProceso();
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.t); }); });

  // ── Panel de operación ──
  function slider(id, lab, min, max, step, val, uni) { return '<label>' + lab + ' <output id="o' + id + '"></output><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"' + (uni ? ' data-u="' + uni + '"' : '') + '></label>'; }
  function armarPanel() {
    $('#panel').innerHTML =
      '<div class="fp"><h3>Alimentación <small id="tFeed"></small></h3>' + slider('iQf', 'Caudal de pulpa [m³/h]', 1000, 5000, 50, s.Qf) + slider('iCw', 'Sólidos en peso [%]', 15, 40, 0.5, s.Cwf * 100) + '<div class="lect" id="lFeed"></div></div>' +
      '<div class="fp"><h3>Floculante <small id="tFloc"></small></h3>' + slider('iDos', 'Dosis [g/t]', 0, 60, 0.5, s.dosis) +
        '<div class="fila"><label class="chk"><input type="checkbox" id="iRatio" checked> Control de razón floculante / sólidos</label></div>' +
        '<div class="fila" id="bFloc"></div><div class="lect" id="lFloc"></div></div>' +
      '<div class="fp"><h3>Espesador <small id="tThk"></small></h3><div class="lect" id="lThk"></div>' +
        '<div class="fila"><button type="button" id="bRastras">Rastras</button><label class="chk"><input type="checkbox" id="iLift" checked> Levante automático</label></div>' + slider('iLiftM', 'Levante manual [%]', 0, 100, 1, 0) + '</div>' +
      '<div class="fp"><h3>Descarga <small id="tUF"></small></h3>' +
        '<label>Control de velocidad<select id="iModo"><option value="densidad">Densidad de descarga (con override por cama)</option><option value="cama">Inventario / nivel de cama</option><option value="manual">Manual</option></select></label>' +
        slider('iSpCu', 'Consigna de densidad [% p/p]', 50, 72, 0.5, s.spCu * 100) + slider('iSpCama', 'Consigna de cama [m]', 1, 7, 0.1, s.spCama) + slider('iN', 'Velocidad manual [%]', 0, 100, 1, 72) +
        '<div class="fila" id="bUF"></div><label class="chk"><input type="checkbox" id="iStby" checked> Respaldo automático</label><div class="lect" id="lUF"></div></div>' +
      '<div class="fp"><h3>Agua recuperada y sumideros <small id="tAgua"></small></h3><div class="fila" id="bAgua"></div><label class="chk"><input type="checkbox" id="iAgua" checked> Control de nivel automático</label><div class="lect" id="lAgua"></div></div>';
    var on = function (id, ev, fn) { $('#' + id).addEventListener(ev, fn); };
    on('iQf', 'input', function () { s.Qf = +this.value; }); on('iCw', 'input', function () { s.Cwf = this.value / 100; });
    on('iDos', 'input', function () { s.dosis = +this.value; }); on('iRatio', 'change', function () { s.ratio = this.checked; if (!s.ratio) s.qStockMan = s.dosis * s.m.Ms / 1000 / 5; });
    on('iLift', 'change', function () { s.liftAuto = this.checked; }); on('iLiftM', 'input', function () { if (!s.liftAuto) s.lift = +this.value; });
    on('bRastras', 'click', function () { s.rastras = !s.rastras; MOD.evento(s, 'info', s.rastras ? 'Rastras en marcha' : 'Rastras detenidas por el operador'); });
    on('iModo', 'change', function () { s.modo = this.value; s.integ = 0; });
    on('iSpCu', 'input', function () { s.spCu = this.value / 100; }); on('iSpCama', 'input', function () { s.spCama = +this.value; });
    on('iN', 'input', function () { if (s.modo === 'manual') s.bombas[s.duty].N = +this.value; });
    on('iStby', 'change', function () { s.autoStandby = this.checked; }); on('iAgua', 'change', function () { s.aguaAuto = this.checked; });
    if (armarPanel.listo) return; armarPanel.listo = true;
    $('#panel').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-a]'); if (!b) return;
      var a = b.dataset.a, i = +b.dataset.i;
      if (a === 'uf') { var x = s.bombas[i]; if (x.falla) { x.falla = false; MOD.evento(s, 'info', tg(i ? 'uf2' : 'uf1') + ' repuesta'); } else { x.on = !x.on; if (x.on) { s.duty = i; x.N = Math.max(x.N, 50); } } }
      if (a === 'ufFalla') { s.bombas[i].falla = true; s.bombas[i].on = false; MOD.evento(s, 'falla', 'Falla de ' + tg(i ? 'uf2' : 'uf1') + ' (protección del motor)'); }
      if (a === 'pd') { var y = s.flocPump[i]; if (y.falla) y.falla = false; else y.on = !y.on; }
      if (a === 'pdFalla') { s.flocPump[i].falla = true; MOD.evento(s, 'falla', 'Falla de ' + tg(i ? 'pd4' : 'pd3')); }
      if (a === 'pa') s.bombasAgua[i] = !s.bombasAgua[i];
      pintarPanel();
    });
  }
  function estadoBtn(st) { return st === 'falla' ? 'mal' : st === 'on' ? 'ok' : ''; }
  function lect(arr) { return arr.map(function (x) { return '<div class="' + (x[3] || '') + '"><span>' + esc(x[0]) + '</span><b>' + x[1] + '</b><i>' + esc(x[2] || '') + '</i></div>'; }).join(''); }
  function pintarPanel() {
    var m = s.m, b = s.bombas[s.duty];
    $('#tFeed').textContent = tg('ft_f') + ' · ' + tg('dt_f'); $('#tFloc').textContent = tg('stp') + ' · ' + tg('ft_fl'); $('#tThk').textContent = tg('thk'); $('#tUF').textContent = tg('uf1') + ' / ' + tg('uf2'); $('#tAgua').textContent = tg('tka') + ' · ' + tg('sum1');
    $('#oiQf').textContent = f(s.Qf); $('#oiCw').textContent = f(s.Cwf * 100, 1); $('#oiDos').textContent = f(s.dosis, 1); $('#oiSpCu').textContent = f(s.spCu * 100, 1); $('#oiSpCama').textContent = f(s.spCama, 1); $('#oiN').textContent = f(b.N); $('#oiLiftM').textContent = f(s.lift);
    $('#lFeed').innerHTML = lect([['Sólidos', f(m.Ms), 't/h'], ['Carga', f(m.carga, 2), 't/m²·h'], ['Subida', f(m.subida, 2), 'm/h', m.subida > m.vs ? 'av' : '']]);
    $('#bFloc').innerHTML = [0, 1].map(function (i) { var x = s.flocPump[i], st = x.falla ? 'falla' : x.on ? 'on' : 'off'; return '<button type="button" class="eq ' + estadoBtn(st) + '" data-a="pd" data-i="' + i + '">' + esc(tg(i ? 'pd4' : 'pd3')) + '</button><button type="button" class="mini" data-a="pdFalla" data-i="' + i + '" title="Simular falla">⚡</button>'; }).join('');
    $('#lFloc').innerHTML = lect([['Dosis aplicada', f(s.dosisReal, 1), 'g/t', s.dosisReal < 8 ? 'mal' : ''], ['Floculante diluido', f(m.FITfl, 1), 'm³/h'], [tg('tkf1'), f(s.tkFloc[0] * 100), '%' + (s.tkFlocDuty === 0 ? ' · en servicio' : ''), s.tkFloc[0] < 0.15 ? 'av' : ''], [tg('tkf2'), f(s.tkFloc[1] * 100), '%' + (s.tkFlocDuty === 1 ? ' · en servicio' : ''), s.tkFloc[1] < 0.15 ? 'av' : ''], ['Eficiencia de floculación', f(m.ef * 100), '%']]);
    $('#lThk').innerHTML = lect([[tg('lt_cama') + ' cama', f(m.LIT, 2), 'm', m.LIT > 5.5 ? 'av' : ''], [tg('dt_uf') + ' descarga', f(m.DIT, 1), '% p/p', m.DIT < 55 || m.DIT > 70 ? 'av' : 'ok'], [tg('tq') + ' torque', f(s.torque), '%', s.torque > 90 ? 'mal' : s.torque > 70 ? 'av' : ''], ['Levante', f(s.lift), '%'], [tg('at') + ' rebose', f(s.tss), 'mg/L', s.tss > 300 ? 'mal' : ''], [tg('pt_cama') + ' presión', f(m.PIT), 'kPa'], ['Inventario de sólidos', f(s.Mb), 't'], ['Flujo límite', f(m.G, 2), 't/m²·h', m.carga > m.G ? 'mal' : '']]);
    $('#bRastras').textContent = s.rastras ? 'Rastras en marcha · detener' : 'Rastras detenidas · partir'; $('#bRastras').className = s.rastras ? 'ok' : 'mal';
    $('#iModo').value = s.modo; $('#iLiftM').disabled = s.liftAuto; $('#iN').disabled = s.modo !== 'manual'; $('#iSpCu').disabled = s.modo !== 'densidad'; $('#iSpCama').disabled = s.modo !== 'cama';
    $('#bUF').innerHTML = [0, 1].map(function (i) { var x = s.bombas[i], st = x.falla ? 'falla' : x.on ? 'on' : 'off'; return '<button type="button" class="eq ' + estadoBtn(st) + '" data-a="uf" data-i="' + i + '">' + esc(tg(i ? 'uf2' : 'uf1')) + (s.duty === i ? ' · duty' : '') + '</button><button type="button" class="mini" data-a="ufFalla" data-i="' + i + '" title="Simular falla">⚡</button>'; }).join('');
    $('#lUF').innerHTML = lect([[tg(s.duty ? 'ft_uf2' : 'ft_uf1') + ' caudal', f(m.FIT), 'm³/h'], ['Velocidad bomba', f(b.on ? b.N : 0), '%'], ['Velocidad en línea', f(m.vel, 2), 'm/s', m.vel < p.vDepositoMin && m.FIT > 0 ? 'mal' : ''], ['Altura', f(m.Hb, 1), 'm'], ['Potencia', f(m.P), 'kW'], ['Sólidos descargados', f(m.Mu), 't/h']].concat(s.override ? [['Override por cama', 'activo', '', 'av']] : []));
    $('#bAgua').innerHTML = s.bombasAgua.map(function (on, i) { return '<button type="button" class="eq ' + (on ? 'ok' : '') + '" data-a="pa" data-i="' + i + '">' + esc(tg('pa' + (i + 1))) + '</button>'; }).join('');
    $('#lAgua').innerHTML = lect([[tg('lt_a') + ' nivel', f(s.nAgua * 100), '%', s.nAgua > 0.9 ? 'av' : ''], ['Rebose', f(m.Qo), 'm³/h'], ['Agua bombeada', f(m.Qagua), 'm³/h'], ['Velocidad bombas', f(s.vAgua), '%'], [tg('lt_s') + ' sumidero', f(s.nSum * 100), '%' + (s.sumOn ? ' · bombeando' : '')]]);
    // Alarmas
    var act = Object.keys(s.alarmas).map(function (k) { return s.alarmas[k]; });
    $('#alarmas').innerHTML = (act.length ? act.map(function (a) { return '<li class="' + a.sev + '">' + esc(a.txt) + '</li>'; }).join('') : '<li class="ok">Sin alarmas activas</li>');
    $('#bitacora').innerHTML = s.log.slice(0, 40).map(function (e) { return '<li class="' + e.sev + '"><span>' + reloj(e.t) + '</span> ' + esc(e.txt) + '</li>'; }).join('');
    $('#reloj').textContent = reloj(s.t);
  }
  function reloj(t) { var h = Math.floor(t / 3600), mi = Math.floor(t / 60) % 60; return 'T+' + h + ' h ' + ('0' + mi).slice(-2) + ' min'; }

  // ── Tendencias ──
  var SER = [
    ['DIT', 'Densidad descarga [%]', '#FF8A45', 40, 75, function () { return s.m.DIT; }],
    ['SP', 'Consigna densidad [%]', '#FFD23F', 40, 75, function () { return s.modo === 'densidad' ? s.spCu * 100 : NaN; }],
    ['LIT', 'Cama [m] ×10', '#7FB2E5', 0, 100, function () { return s.m.LIT * 10; }],
    ['TQ', 'Torque [%]', '#E5484D', 0, 100, function () { return s.torque; }],
    ['N', 'Velocidad bomba [%]', '#3FBF7F', 0, 100, function () { var b = s.bombas[s.duty]; return b.on && !b.falla ? b.N : 0; }],
    ['TSS', 'Rebose log [mg/L]', '#A98BFF', 0, 100, function () { return Math.log10(Math.max(10, s.tss)) * 25; }]
  ];
  function tendencias() {
    var cv = $('#trend'), w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    c.strokeStyle = '#1E3350'; c.lineWidth = 1; for (var i = 0; i <= 4; i++) { var y = 8 + (h - 24) * i / 4; c.beginPath(); c.moveTo(36, y); c.lineTo(w - 6, y); c.stroke(); }
    c.fillStyle = '#A9B6C6'; c.font = '10px IBM Plex Mono, monospace'; c.fillText('100', 4, 12); c.fillText('0', 18, h - 14);
    var n = hist.length; if (n < 2) return;
    var t0 = hist[0].t, t1 = hist[n - 1].t, span = Math.max(1, t1 - t0);
    c.fillText(reloj(t0).replace('T+', ''), 36, h - 2); c.fillText(reloj(t1).replace('T+', ''), w - 110, h - 2);
    SER.forEach(function (se, k) {
      c.strokeStyle = se[2]; c.lineWidth = k === 1 ? 1 : 1.6; c.setLineDash(k === 1 ? [4, 3] : []); c.beginPath(); var pen = false;
      hist.forEach(function (pt) { var v = pt.v[k]; if (!isFinite(v)) { pen = false; return; } var x = 36 + (w - 42) * (pt.t - t0) / span, y = 8 + (h - 24) * (1 - (v - (k < 2 ? 40 : 0)) / (k < 2 ? 35 : 100)); y = Math.max(4, Math.min(h - 14, y)); if (pen) c.lineTo(x, y); else { c.moveTo(x, y); pen = true; } });
      c.stroke();
    });
    c.setLineDash([]);
  }
  $('#leyenda').innerHTML = SER.map(function (x) { return '<span><i style="background:' + x[2] + '"></i>' + esc(x[1]) + '</span>'; }).join('') + '<span class="peq">densidad 40–75 % en escala propia</span>';

  // ── Escenarios ──
  var ESC = {
    base: function () { s = MOD.nuevoEstado(p); hist = []; MOD.evento(s, 'info', 'Operación normal'); },
    alim: function () { s.Qf = Math.round(s.Qf * 1.2); MOD.evento(s, 'aviso', 'Escenario: alimentación +20 %'); },
    gruesos: function () { s.Cwf = Math.min(0.4, s.Cwf + 0.06); MOD.evento(s, 'aviso', 'Escenario: alimentación más concentrada (+6 puntos)'); },
    floc: function () { s.flocPump.forEach(function (x) { x.falla = true; }); MOD.evento(s, 'falla', 'Escenario: falla total de dosificación de floculante'); },
    sobre: function () { s.dosis = 55; MOD.evento(s, 'aviso', 'Escenario: sobredosificación de floculante (55 g/t)'); },
    bomba: function () { var b = s.bombas[s.duty]; b.falla = true; b.on = false; MOD.evento(s, 'falla', 'Escenario: falla de la bomba de descarga en servicio'); },
    rastras: function () { s.rastras = false; MOD.evento(s, 'falla', 'Escenario: rastras detenidas'); },
    acumula: function () { s.Mb *= 1.8; MOD.evento(s, 'aviso', 'Escenario: inventario de cama acumulado (+80 %)'); }
  };
  $('#esc').addEventListener('change', function () { var fn = ESC[this.value]; if (fn) { fn(); armarPanel(); pintarPanel(); } this.value = ''; });
  $('#bPlay').addEventListener('click', function () { corriendo = !corriendo; this.textContent = corriendo ? '⏸ Pausa' : '▶ Continuar'; });
  $$('#velocidad button').forEach(function (b) { b.addEventListener('click', function () { vel = +b.dataset.v; $$('#velocidad button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
  $('#iCorte').addEventListener('change', function () { if (vista) vista.corte(this.checked); });
  $('#vistas').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-vista]'); if (b && vista) vista.vista(b.dataset.vista); });

  // ── Bucle ──
  var ult = performance.now(), acum = 0, ultHist = -1e9, ultPanel = 0;
  function bucle(ahora) {
    var real = Math.min(0.25, (ahora - ult) / 1000); ult = ahora;
    if (corriendo) { acum += real * vel; var n = 0; while (acum >= 1 && n < 2000) { MOD.paso(s, p, 1); acum -= 1; n++; if (s.t - ultHist >= 20) { hist.push({ t: s.t, v: SER.map(function (x) { return x[5](); }) }); if (hist.length > 1080) hist.shift(); ultHist = s.t; } } }
    if (ahora - ultPanel > 400) { pintarPanel(); tendencias(); ultPanel = ahora; }
    if (vista) vista.actualizar(s, cfg);
    requestAnimationFrame(bucle);
  }
  function iniciar3D() { if (window.__LIB && window.ESP_3D) { vista = window.ESP_3D.crear($('#v3d')); if (vista) vista.actualizar(s, cfg); } else $('#v3d').innerHTML = '<p class="peq" style="padding:20px">No se pudo cargar el motor 3D; la simulación sigue funcionando.</p>'; }

  // ── Proceso y control ──
  function pintarProceso() {
    var m = s.m, A = Math.PI * p.D * p.D / 4;
    $('#balance').innerHTML = '<tbody>' + [
      ['Área del espesador', 'A = π·D²/4', f(A) + ' m²'],
      ['Sólidos alimentados', 'Ms = Q·ρpulpa·Cw', f(m.Ms) + ' t/h'],
      ['Carga de sólidos', 'Ms / A', f(m.carga, 2) + ' t/m²·h'],
      ['Flujo límite con la dosis actual', 'G = G₀ + G_f·η(dosis)', f(m.G, 2) + ' t/m²·h'],
      ['Velocidad de subida del rebose', 'Qo / A', f(m.subida, 2) + ' m/h (sedimentación ' + f(m.vs, 1) + ' m/h)'],
      ['Inventario de la cama', 'dMb/dt = Ms − Mu − Mo', f(s.Mb) + ' t'],
      ['Tiempo de residencia de sólidos', 'τ = Mb / Mu', f(s.Mb / Math.max(m.Mu, 1), 1) + ' h'],
      ['Densidad de descarga de equilibrio', 'Cu = Cgel + (Cmax − Cgel)(1 − e^(−τ/τ₀))', f(m.DIT, 1) + ' % p/p'],
      ['Agua al rebose', 'Qo = agua alimentada − agua en la descarga', f(m.Qo) + ' m³/h'],
      ['Potencia de la bomba de descarga', 'ρ·g·Q·H / η', f(m.P) + ' kW']
    ].map(function (r) { return '<tr><td>' + r[0] + '</td><td><code>' + r[1] + '</code></td><td><b>' + r[2] + '</b></td></tr>'; }).join('') + '</tbody>';
    $('#pParam').innerHTML = [['D', 'Diámetro [m]'], ['H', 'Altura de muro [m]'], ['cono', 'Altura del cono [m]'], ['rhoS', 'Gravedad específica de sólidos'], ['QmaxBomba', 'Caudal de la bomba a 100 % [m³/h]'], ['DNdescarga', 'Diámetro interior de la descarga [m]'], ['dosisOpt', 'Dosis óptima de floculante [g/t]'], ['MbTorque', 'Inventario que da 100 % de torque [t]']]
      .map(function (x) { return '<label>' + x[1] + '<input data-p="' + x[0] + '" type="number" step="any" value="' + p[x[0]] + '"></label>'; }).join('');
  }
  $('#pParam').addEventListener('change', function (ev) { var k = ev.target.dataset.p; if (!k) return; p[k] = +ev.target.value; cfg.param = cfg.param || {}; cfg.param[k] = p[k]; PL.guardar(cfg); pintarProceso(); });

  // ── Planta del modelo ──
  function pintarPlanta() {
    $('#cfgNombre').textContent = cfg.nombre + (cfg.origen ? ' · ' + cfg.origen : '');
    var grupos = {}; PL.ROLES.forEach(function (r) { (grupos[r[1]] = grupos[r[1]] || []).push(r); });
    $('#tPlanta tbody').innerHTML = Object.keys(grupos).map(function (g) {
      return '<tr class="grp"><td colspan="4">' + esc(g) + '</td></tr>' + grupos[g].map(function (r) { var e = cfg.equipos[r[0]] || {}; return '<tr><td><input data-r="' + r[0] + '" data-k="tag" value="' + esc(e.tag || '') + '" aria-label="Tag de ' + esc(r[2]) + '"></td><td><input data-r="' + r[0] + '" data-k="desc" value="' + esc(e.desc || r[2]) + '"></td><td class="peq">' + esc(e.fuente || '') + '</td><td class="peq">' + esc(r[2]) + '</td></tr>'; }).join('');
    }).join('');
    $('#cfgNotas').innerHTML = (cfg.notas || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') || '<li>Configuración genérica: importa la configuración extraída del modelo de tu proyecto para usar sus tags.</li>';
  }
  $('#tPlanta').addEventListener('change', function (ev) { var t = ev.target; if (!t.dataset.r) return; cfg.equipos[t.dataset.r] = cfg.equipos[t.dataset.r] || {}; cfg.equipos[t.dataset.r][t.dataset.k] = t.dataset.k === 'tag' ? t.value.toUpperCase() : t.value; PL.guardar(cfg); });
  $('#bImportar').addEventListener('click', function () { $('#fImportar').click(); });
  $('#fImportar').addEventListener('change', function () {
    var fl = this.files[0]; if (!fl) return; var rd = new FileReader();
    rd.onload = function () { try { var c = JSON.parse(rd.result); if (!c.equipos) throw new Error('sin equipos'); cfg = Object.assign(PL.generica(), c); cfg.equipos = Object.assign(PL.generica().equipos, c.equipos); PL.guardar(cfg); p = Object.assign(MOD.parametros(), cfg.param || {}); s = MOD.nuevoEstado(p); hist = []; armarPanel(); pintarPlanta(); $('#cfgEstado').textContent = 'Configuración importada y guardada en el proyecto activo.'; } catch (e) { $('#cfgEstado').textContent = 'El archivo no es una configuración válida.'; } };
    rd.readAsText(fl); this.value = '';
  });
  $('#bExportar').addEventListener('click', function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 1)], { type: 'application/json' })); a.download = 'planta-espesamiento.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400); });
  $('#bGenerica').addEventListener('click', function () { cfg = PL.generica(); PL.guardar(cfg); p = MOD.parametros(); s = MOD.nuevoEstado(p); hist = []; armarPanel(); pintarPlanta(); $('#cfgEstado').textContent = 'Se restableció la configuración genérica.'; });

  armarPanel(); pintarPanel(); mostrar(location.hash.slice(1));
  if (document.readyState === 'complete') iniciar3D(); else window.addEventListener('load', iniciar3D);
  requestAnimationFrame(bucle);
})();
