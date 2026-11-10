/* Simulación de una válvula de control instalada · Suite ReyEngi
 * Sistema: bomba (curva cuadrática) → línea (pérdida ∝ Q²) → válvula (Kv según apertura y característica) → destino.
 * Por cada instante se resuelve el caudal de equilibrio, se verifica flujo ahogado según IEC 60534-2-1
 * (ΔPmax = FL²·(P1 − FF·Pv)), cavitación incipiente y flashing; el actuador sigue la orden con un retardo de primer orden
 * y en modo automático un controlador PI regula el caudal.
 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var f = function (v, d) { return isFinite(v) ? (+v).toLocaleString('es-CL', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) : '—'; };
  var n = function (id) { return parseFloat(String($('#' + id).value).replace(',', '.')); };
  var PATM = 1.01325;
  var cv = $('#sCv'), cx = cv.getContext('2d');
  var st = { h: 60, cmd: 60, integ: 0, q: 0, t: 0, pausa: false, pert: 0, parts: [], burb: [], rot: 0, hist: [] };
  for (var i = 0; i < 70; i++) st.parts.push(Math.random());

  // ── Modelo ──
  function fCar(h, car) { h = Math.max(0, Math.min(1, h)); if (car === 'lin') return h; if (car === 'qo') return Math.sqrt(h); if (h <= 0) return 0; var R = 50, v = Math.pow(R, h - 1); return h < 0.05 ? v * h / 0.05 : v; }
  function datos() {
    var P0 = n('sP0'), Pn = n('sPn'), Qn = n('sQn'), Pl = n('sPl'), Pd = n('sPd') + st.pert;
    return { P0: P0, Pd: Pd, kp: Math.max(0, (P0 - Pn) / (Qn * Qn)), R: Math.max(0, Pl / (Qn * Qn)), G: n('sG') || 1, Pv: n('sPv') || 0, FL: n('sFL') || 0.9, Kv: n('sKv'), car: $('#sCar').value };
  }
  function resolver(d, h) {
    var Kv = d.Kv * fCar(h / 100, d.car), FF = 0.96 - 0.28 * Math.sqrt(Math.max(0, d.Pv) / 221.2), Q = 0, ahog = false;
    if (Kv > 1e-6 && d.P0 > d.Pd) {
      Q = Math.sqrt((d.P0 - d.Pd) / (d.kp + d.R + d.G / (Kv * Kv)));
      var P1 = d.P0 - d.kp * Q * Q - 0.6 * d.R * Q * Q, dpMax = d.FL * d.FL * (P1 + PATM - FF * d.Pv);
      if (d.G * Q * Q / (Kv * Kv) > dpMax) { // flujo ahogado: el caudal queda limitado por ΔPmax (iteración de punto fijo)
        ahog = true; for (var k = 0; k < 30; k++) { P1 = d.P0 - d.kp * Q * Q - 0.6 * d.R * Q * Q; dpMax = Math.max(0, d.FL * d.FL * (P1 + PATM - FF * d.Pv)); Q = 0.5 * Q + 0.5 * Kv * Math.sqrt(dpMax / d.G); }
      }
    }
    var p1 = d.P0 - d.kp * Q * Q - 0.6 * d.R * Q * Q, p2 = d.Pd + 0.4 * d.R * Q * Q, dpv = p1 - p2;
    var xF = dpv / Math.max(1e-6, p1 + PATM - d.Pv), flash = p2 + PATM < d.Pv, cav = !ahog && xF > 0.6 * d.FL * d.FL;
    return { Q: Q, P1: p1, P2: p2, dPv: dpv, ahog: ahog, flash: flash, cav: cav, xF: xF, Kv: Kv };
  }
  function autoridad(d) { var r = resolver(d, 100), tot = d.P0 - d.Pd; return tot > 0 ? r.dPv / tot : NaN; }
  function area() { var P = window.__PIPING, t = (P && P.TUBOS) || null, nps = $('#sLin').value; if (!t) return NaN; var x = t.filter(function (r) { return r[0] === nps; })[0]; if (!x) return NaN; var di = (x[2] - 2 * x[4]) / 1000; return Math.PI * di * di / 4; }

  // ── Paso de simulación ──
  var ult = performance.now();
  function paso(ahora) {
    var dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    if (!st.pausa && $('section[data-t="sim"]') && !$('section[data-t="sim"]').hidden) {
      var d = datos();
      if (st.pert > 0 && (st.t += dt) > 8) { st.pert = 0; st.t = 0; }
      if ($('#sModo').value === 'auto') { // PI de caudal sobre la orden de apertura
        var sp = n('sSp'), e = sp - st.q, Kp = 0.35, Ti = 1.6;
        st.integ = Math.max(0, Math.min(100, st.integ + Kp * e * dt / Ti)); // acción integral con anti-windup
        st.cmd = Math.max(0, Math.min(100, st.integ + Kp * e));
        $('#sAb').value = Math.round(st.cmd); $('#sAbOut').textContent = Math.round(st.h) + ' %';
      } else st.cmd = n('sAb');
      st.h += (st.cmd - st.h) * Math.min(1, dt / 1.2); // actuador: constante de tiempo ≈ 1,2 s
      var r = resolver(d, st.h); st.q += (r.Q - st.q) * Math.min(1, dt / 0.4); st.r = r;
      var A = area(), v = st.q / 3600 / A; st.v = v;
      st.parts = st.parts.map(function (p) { return (p + dt * (isFinite(v) ? v : 0) * 0.07) % 1; });
      st.rot += dt * (st.q / Math.max(1, n('sQn'))) * 14;
      if (r.cav || r.ahog || r.flash) for (var b = 0; b < (r.flash ? 4 : r.ahog ? 3 : 1); b++) st.burb.push({ x: 0, y: (Math.random() - 0.5) * 14, vida: 1, r: 1 + Math.random() * 3 });
      st.burb = st.burb.map(function (b) { b.x += dt * 90; b.vida -= dt * (r.flash ? 0.6 : 1.4); return b; }).filter(function (b) { return b.vida > 0; }).slice(-160);
      dibujar(d, r);
      lecturas(d, r);
      st.k = (st.k || 0) + dt; if (st.k > 0.5) { st.k = 0; curva(d); }
    }
    requestAnimationFrame(paso);
  }

  // ── Dibujo del esquema ──
  function dibujar(d, r) {
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var y = H * 0.58, xP = W * 0.1, xV = W * 0.5, xT = W * 0.86, pipeW = 16;
    // cañería
    cx.fillStyle = '#5E6E80'; cx.fillRect(xP + 30, y - pipeW / 2, xT - xP - 60, pipeW);
    cx.fillStyle = '#9FB7CF'; cx.fillRect(xP + 30, y - pipeW / 2 + 3, xT - xP - 60, pipeW - 6);
    // partículas de flujo
    cx.fillStyle = '#1F5FAF';
    st.parts.forEach(function (p, i) { var x = xP + 32 + p * (xT - xP - 64), yy = y + ((i * 37) % 7 - 3); if (Math.abs(x - xV) < 26 && (st.h < 1)) return; cx.beginPath(); cx.arc(x, yy, 1.8, 0, 7); cx.fill(); });
    // burbujas (cavitación / flashing) aguas abajo de la válvula
    st.burb.forEach(function (b) { cx.strokeStyle = 'rgba(255,255,255,' + b.vida + ')'; cx.lineWidth = 1; cx.beginPath(); cx.arc(xV + 24 + b.x, y + b.y * 0.5, b.r, 0, 7); cx.stroke(); });
    // bomba
    cx.fillStyle = '#13284A'; cx.strokeStyle = '#DCE6F1'; cx.lineWidth = 2; cx.beginPath(); cx.arc(xP, y, 30, 0, 7); cx.fill(); cx.stroke();
    cx.save(); cx.translate(xP, y); cx.rotate(st.rot); cx.strokeStyle = '#FF8A45'; cx.lineWidth = 3; for (var a = 0; a < 6; a++) { cx.rotate(Math.PI / 3); cx.beginPath(); cx.moveTo(0, 0); cx.quadraticCurveTo(10, -6, 20, -14); cx.stroke(); } cx.restore();
    texto('BOMBA', xP, y + 48, 11, '#A9B6C6', 'center'); texto(f(d.P0 - d.kp * st.q * st.q, 2) + ' bar g', xP, y + 62, 12, '#fff', 'center');
    // válvula de control (cuerpo + actuador de diafragma + vástago según apertura)
    cx.fillStyle = r.ahog ? '#5A1E22' : r.cav ? '#4A3A12' : '#13284A'; cx.strokeStyle = '#DCE6F1'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(xV - 26, y - 18); cx.lineTo(xV, y); cx.lineTo(xV - 26, y + 18); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(xV + 26, y - 18); cx.lineTo(xV, y); cx.lineTo(xV + 26, y + 18); cx.closePath(); cx.fill(); cx.stroke();
    var carrera = 22 * st.h / 100;
    cx.beginPath(); cx.moveTo(xV, y); cx.lineTo(xV, y - 64 - carrera * 0.3); cx.stroke();
    cx.fillStyle = '#13284A'; cx.beginPath(); cx.moveTo(xV - 34, y - 64); cx.quadraticCurveTo(xV, y - 108, xV + 34, y - 64); cx.closePath(); cx.fill(); cx.stroke();
    // indicador de carrera
    cx.strokeStyle = '#5E6E80'; cx.beginPath(); cx.moveTo(xV + 40, y - 30); cx.lineTo(xV + 40, y - 56); cx.stroke();
    cx.fillStyle = '#FF8A45'; cx.fillRect(xV + 36, y - 30 - 26 * st.h / 100 - 2, 8, 4);
    texto(Math.round(st.h) + ' %', xV + 50, y - 40, 12, '#FF8A45', 'left');
    texto('FV-101', xV, y - 116, 12, '#fff', 'center');
    // controlador e instrumentos
    burbuja(xV - 110, y - 70, 'PI', '101', f(r.P1, 2) + ' bar g'); linea(xV - 110, y - 52, xV - 110, y - pipeW / 2);
    burbuja(xV + 110, y - 70, 'PI', '102', f(r.P2, 2) + ' bar g'); linea(xV + 110, y - 52, xV + 110, y - pipeW / 2);
    burbuja(xV + 230, y - 70, 'FIT', '101', f(st.q, 1) + ' m³/h'); linea(xV + 230, y - 52, xV + 230, y - pipeW / 2);
    if ($('#sModo').value === 'auto') { burbuja(xV + 230, y - 150, 'FIC', '101', 'SP ' + f(n('sSp'), 0)); cx.setLineDash([5, 4]); linea(xV + 230, y - 88, xV + 230, y - 132); linea(xV + 212, y - 150, xV + 34, y - 150); linea(xV, y - 150, xV, y - 100); cx.setLineDash([]); }
    // estanque destino
    cx.strokeStyle = '#DCE6F1'; cx.lineWidth = 2; cx.fillStyle = '#13284A'; cx.fillRect(xT - 28, y - 80, 70, 120); cx.strokeRect(xT - 28, y - 80, 70, 120);
    cx.fillStyle = '#2B6CB0'; cx.fillRect(xT - 27, y - 10, 68, 49);
    texto('DESTINO', xT + 7, y + 58, 11, '#A9B6C6', 'center'); texto(f(d.Pd, 2) + ' bar g', xT + 7, y + 72, 12, '#fff', 'center');
    // régimen
    var reg = r.flash ? ['FLASHING', '#FF8C8F'] : r.ahog ? ['FLUJO AHOGADO · CAVITACIÓN PLENA', '#FF8C8F'] : r.cav ? ['CAVITACIÓN INCIPIENTE', '#F2B544'] : ['FLUJO NORMAL', '#3FBF7F'];
    texto(reg[0], 14, 24, 13, reg[1], 'left');
    if (st.pert) texto('PERTURBACIÓN: +1 bar EN EL DESTINO', 14, 42, 11, '#F2B544', 'left');
  }
  function texto(t, x, y, s, c, al) { cx.font = '600 ' + s + 'px "IBM Plex Mono", monospace'; cx.fillStyle = c; cx.textAlign = al; cx.fillText(t, x, y); }
  function linea(x1, y1, x2, y2) { cx.strokeStyle = '#A9B6C6'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); }
  function burbuja(x, y, l, num, val) {
    cx.fillStyle = '#0F2036'; cx.strokeStyle = '#DCE6F1'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, 18, 0, 7); cx.fill(); cx.stroke();
    texto(l, x, y - 2, 10, '#fff', 'center'); texto(num, x, y + 10, 9, '#A9B6C6', 'center'); texto(val, x, y - 24, 11, '#FF8A45', 'center');
  }
  function lecturas(d, r) {
    var N = autoridad(d), v = st.v, celdas = [
      ['Caudal', f(st.q, 1) + ' m³/h', ''], ['Velocidad en la línea', f(v, 2) + ' m/s', v > 3 ? 'av' : 'ok'], ['ΔP en la válvula', f(r.dPv, 2) + ' bar', ''], ['Kv en uso', f(r.Kv, 1) + ' m³/h', ''],
      ['Apertura real', f(st.h, 0) + ' %', st.h > 90 || st.h < 10 ? 'av' : 'ok'], ['Autoridad N', f(N, 2), N < 0.25 ? 'av' : 'ok'], ['xF = ΔP/(P1 − Pv)', f(r.xF, 2), r.ahog || r.flash ? 'mal' : r.cav ? 'av' : 'ok'], ['Régimen', r.flash ? 'Flashing' : r.ahog ? 'Ahogado' : r.cav ? 'Cavitación' : 'Normal', r.flash || r.ahog ? 'mal' : r.cav ? 'av' : 'ok']];
    $('#sLect').innerHTML = celdas.map(function (c) { return '<div class="' + c[2] + '">' + c[0] + '<b>' + c[1] + '</b></div>'; }).join('');
  }
  // ── Curva inherente vs instalada ──
  function curva(d) {
    var W = 1100, H = 290, x0 = 64, y0 = 250, w = 1010, h = 220, Qmax = resolver(d, 100).Q || 1, o = [];
    o.push('<rect x="' + x0 + '" y="' + (y0 - h) + '" width="' + w + '" height="' + h + '" fill="none" stroke="#1E3350"/>');
    for (var i = 0; i <= 10; i++) { var gx = x0 + w * i / 10, gy = y0 - h * i / 10; o.push('<line x1="' + gx + '" y1="' + (y0 - h) + '" x2="' + gx + '" y2="' + y0 + '" stroke="#132741"/><line x1="' + x0 + '" y1="' + gy + '" x2="' + (x0 + w) + '" y2="' + gy + '" stroke="#132741"/>'); if (i % 2 === 0) o.push('<text x="' + gx + '" y="' + (y0 + 14) + '" fill="#A9B6C6" font-size="10" text-anchor="middle">' + i * 10 + '</text><text x="' + (x0 - 6) + '" y="' + (gy + 3) + '" fill="#A9B6C6" font-size="10" text-anchor="end">' + f(Qmax * i / 10, 0) + '</text>'); }
    var inh = [], ins = [];
    for (var k = 0; k <= 50; k++) { var hh = k * 2; inh.push((x0 + w * hh / 100) + ',' + (y0 - h * fCar(hh / 100, d.car))); ins.push((x0 + w * hh / 100) + ',' + (y0 - h * resolver(d, hh).Q / Qmax)); }
    o.push('<polyline points="' + inh.join(' ') + '" fill="none" stroke="#7F92A8" stroke-dasharray="5 4" stroke-width="1.6"/>');
    o.push('<polyline points="' + ins.join(' ') + '" fill="none" stroke="#FF8A45" stroke-width="2.2"/>');
    var px = x0 + w * st.h / 100, py = y0 - h * st.q / Qmax; o.push('<circle cx="' + px + '" cy="' + py + '" r="5" fill="#fff" stroke="#FF8A45" stroke-width="2"/>');
    o.push('<text x="' + (x0 + w / 2) + '" y="' + (H - 4) + '" fill="#A9B6C6" font-size="11" text-anchor="middle">Apertura [%]</text><text x="14" y="' + (y0 - h / 2) + '" fill="#A9B6C6" font-size="11" text-anchor="middle" transform="rotate(-90 14 ' + (y0 - h / 2) + ')">Caudal [m³/h]</text>');
    o.push('<line x1="' + (x0 + 12) + '" y1="' + (y0 - h + 14) + '" x2="' + (x0 + 40) + '" y2="' + (y0 - h + 14) + '" stroke="#FF8A45" stroke-width="2.2"/><text x="' + (x0 + 46) + '" y="' + (y0 - h + 18) + '" fill="#E6EDF5" font-size="11">Instalada (sistema real)</text>');
    o.push('<line x1="' + (x0 + 210) + '" y1="' + (y0 - h + 14) + '" x2="' + (x0 + 238) + '" y2="' + (y0 - h + 14) + '" stroke="#7F92A8" stroke-dasharray="5 4" stroke-width="1.6"/><text x="' + (x0 + 244) + '" y="' + (y0 - h + 18) + '" fill="#E6EDF5" font-size="11">Inherente (ΔP constante, escala relativa)</text>');
    o.push('<text x="' + (x0 + w - 8) + '" y="' + (y0 - 10) + '" fill="#E6EDF5" font-size="11" text-anchor="end">Autoridad N = ' + f(autoridad(d), 2) + ' · Q máx ' + f(Qmax, 0) + ' m³/h</text>');
    $('#sCurva').innerHTML = o.join('');
  }

  // ── Interfaz ──
  function tuberias() { var P = window.__PIPING; if (!P || !P.TUBOS) return setTimeout(tuberias, 200); $('#sLin').innerHTML = P.TUBOS.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === '4' ? ' selected' : '') + '>' + t[0] + '" (Sch 40)</option>'; }).join(''); }
  tuberias();
  $('#sAb').addEventListener('input', function () { $('#sAbOut').textContent = this.value + ' %'; });
  $('#sSp').addEventListener('input', function () { $('#sSpOut').textContent = this.value + ' m³/h'; });
  $('#sModo').addEventListener('change', function () { var a = this.value === 'auto'; $('#sSpLbl').hidden = !a; $('#sAb').disabled = a; st.integ = st.h; if (a) { $('#sSp').value = Math.round(st.q); $('#sSpOut').textContent = $('#sSp').value + ' m³/h'; } });
  $('#sPausa').addEventListener('click', function () { st.pausa = !st.pausa; this.textContent = st.pausa ? '▶ Continuar' : '⏸ Pausa'; });
  $('#sPerturba').addEventListener('click', function () { st.pert = 1; st.t = 0; });
  function ajustarRangoSp() { var d = datos(), qm = resolver(d, 100).Q; $('#sSp').max = Math.max(10, Math.ceil(qm * 1.05)); }
  ['sKv', 'sP0', 'sPn', 'sQn', 'sPl', 'sPd', 'sCar'].forEach(function (id) { $('#' + id).addEventListener('input', ajustarRangoSp); $('#' + id).addEventListener('change', ajustarRangoSp); });
  // Desde la calculadora: lleva la válvula preseleccionada al sistema
  $('#bSimular').addEventListener('click', function () {
    var P = window.__PIPING || {}, Q = n('kQ'), p1 = n('kP1'), p2 = n('kP2'), pl = 1;
    if (P.gas) { alert('La simulación es para líquidos: cambia el fluido a líquido en la calculadora.'); return; }
    $('#sKv').value = +(isFinite(P.KvSel) ? P.KvSel : (P.Kv || 100) * 1.4).toFixed(1);
    $('#sCar').value = P.tipo === 'bola' ? 'qo' : 'eq';
    $('#sQn').value = Q; $('#sPn').value = +(p1 + pl * 0.6).toFixed(2); $('#sP0').value = +((p1 + pl * 0.6) * 1.3).toFixed(2); $('#sPl').value = pl; $('#sPd').value = +Math.max(0, p2 - pl * 0.4).toFixed(2);
    $('#sG').value = n('kG'); $('#sPv').value = n('kPv'); $('#sFL').value = n('kFL'); if (P.linea) $('#sLin').value = P.linea;
    ajustarRangoSp(); document.querySelector('.tabs button[data-t="sim"]').click(); window.scrollTo(0, 0);
  });
  ajustarRangoSp(); $('#sSpOut').textContent = $('#sSp').value + ' m³/h';
  requestAnimationFrame(paso);
})();
