/* Dibujo de diagramas de lazo (ISA-5.4) · ReyEngi
 *
 * Arma cada hoja A3 como una lista de primitivas en mm (origen arriba a la izquierda) y la entrega
 * como SVG (vista e impresión a PDF) o como DXF R12 (AutoCAD, BricsCAD, etc.), con capas por tipo.
 *
 *   var hojas = LAZOS_DIBUJO.hojas(lazo, ctx);   // [{ prims, n, de }]
 *   LAZOS_DIBUJO.svg(hoja) ; LAZOS_DIBUJO.dxf([hoja, ...])
 */
(function () {
  'use strict';
  var W = 420, H = 297, ISA = window.ISA;
  var CAPAS = { MARCO: 7, ROTULO: 7, TEXTO: 7, ZONAS: 8, INSTRUMENTO: 3, CABLES: 1, BORNES: 5, TARJETA: 4, PANTALLA: 6, HMI: 2, ALIMENTACION: 30, NOTAS: 7 };

  // ── Primitivas ──
  function Lienzo() { this.p = []; }
  Lienzo.prototype.l = function (x1, y1, x2, y2, c, o) { this.p.push({ t: 'l', x1: x1, y1: y1, x2: x2, y2: y2, c: c || 'CABLES', d: o && o.d, w: o && o.w }); return this; };
  Lienzo.prototype.r = function (x, y, w, h, c, o) { this.p.push({ t: 'r', x: x, y: y, w: w, h: h, c: c || 'MARCO', d: o && o.d, w2: o && o.w, f: o && o.f }); return this; };
  Lienzo.prototype.c = function (x, y, r, c, o) { this.p.push({ t: 'c', x: x, y: y, r: r, c: c || 'INSTRUMENTO', f: o && o.f }); return this; };
  Lienzo.prototype.a = function (x, y, r, a1, a2, c) { this.p.push({ t: 'a', x: x, y: y, r: r, a1: a1, a2: a2, c: c || 'CABLES' }); return this; };
  Lienzo.prototype.tx = function (x, y, s, h, c, o) { if (s === '' || s == null) return this; this.p.push({ t: 'tx', x: x, y: y, s: String(s), h: h || 2, c: c || 'TEXTO', al: (o && o.al) || 'l', va: (o && o.va) || 'b', rot: (o && o.rot) || 0, b: o && o.b }); return this; };
  Lienzo.prototype.pl = function (pts, c, o) { this.p.push({ t: 'pl', pts: pts, c: c || 'CABLES', f: o && o.f, cerrada: o && o.cerrada }); return this; };
  Lienzo.prototype.img = function (x, y, w, h, href) { this.p.push({ t: 'img', x: x, y: y, w: w, h: h, href: href }); return this; };
  Lienzo.prototype.flecha = function (x, y, dir, c) { var s = 1.6; this.pl(dir > 0 ? [[x, y], [x - s * 1.6, y - s * 0.6], [x - s * 1.6, y + s * 0.6]] : [[x, y], [x + s * 1.6, y - s * 0.6], [x + s * 1.6, y + s * 0.6]], c, { f: true, cerrada: true }); return this; };

  function pad(n, k) { n = String(n); while (n.length < k) n = '0' + n; return n; }
  function cortar(s, n) { s = String(s || ''); var pal = s.split(/\s+/), out = [], cur = ''; pal.forEach(function (w) { if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; }

  // ── Conexionado típico por tipo de señal, número de hilos y tarjeta ──
  // Devuelve filas: { it: borne del instrumento, tb: {n, fu}, card: borne de tarjeta, busTB, busCard }
  function conexionado(s, cfg) {
    var tj = s.tarjeta || {}, bc = s.bornes || {}, h = +s.hilos || 2, filas = [], puentes = [], potencia = null, notas = [];
    var v24 = cfg.fuente24 || '+24 VDC', v0 = cfg.fuente0 || '0 VDC';
    function f(o) { filas.push(o); return o; }
    function conPuentes() {
      (bc.puentes || []).forEach(function (p) {
        var a = f({ card: p[0] }), bi = -1;
        filas.forEach(function (x, i) { if (x.card && x.card.n === p[1].n && x !== a) bi = i; });
        if (bi < 0) { f({ card: p[1], busCard: v0 }); bi = filas.length - 1; }
        puentes.push([filas.indexOf(a), bi]);
      });
    }
    var pot = function () { potencia = { terms: ['L', 'N', 'PE'], texto: (s.alimTab || cfg.tableroAlim || 'TABLERO DE DISTRIBUCIÓN') + ' · ' + (cfg.tension4h || '120 VAC') }; };
    if (s.tipo === 'AI') {
      if (h === 4) { f({ it: '+', card: bc.inp }); f({ it: '−', card: bc.inn }); conPuentes(); pot(); }
      else if (tj.alim === 'interna' && bc.pwr) {
        if (h === 2) { f({ it: '+', fu: true, card: bc.pwr }); f({ it: '−', card: bc.ret || bc.inp }); }
        else { f({ it: '+', fu: true, card: bc.pwr }); f({ it: 'S', card: bc.ret || bc.inp }); f({ it: '0V', busTB: v0 }); if (bc.inn && bc.inn.n !== (bc.ret || bc.inp).n) f({ card: bc.inn, busCard: v0 }); }
      } else {
        f({ it: '+', fu: true, busTB: v24 }); f({ it: h === 3 ? 'S' : '−', card: bc.inp });
        if (h === 3) f({ it: '0V', busTB: v0 });
        if (bc.inn) f({ card: bc.inn, busCard: v0 });
        conPuentes();
      }
    } else if (s.tipo === 'AO') {
      f({ it: '+', card: bc.out }); f({ it: '−', card: bc.rtn });
      if (h === 3) f({ it: 'PE', busTB: 'TIERRA' });
      if (h === 4) pot();
    } else if (s.tipo === 'DI') {
      var ac = tj.tension === '120 VAC', vb = ac ? 'L 120 VAC' : v24, vc = ac ? 'N 120 VAC' : v0;
      if (h === 3) { f({ it: '+', fu: true, busTB: v24 }); f({ it: 'OUT', card: bc.inp }); f({ it: '−', busTB: v0 }); if (bc.com) f({ card: bc.com, busCard: v0 }); }
      else if (bc.pwr) { f({ it: 'C', card: bc.pwr }); f({ it: 'NA', card: bc.inp }); }
      else { f({ it: 'C', fu: true, busTB: vb }); f({ it: 'NA', card: bc.inp }); if (bc.com) f({ card: bc.com, busCard: vc }); }
      if (h === 4) pot();
    } else if (s.tipo === 'DO') {
      var porCanal = bc.com && /^[−-]$/.test(bc.com.s);
      if (h === 4) {
        var ka = 'KA-' + pad(s.canal + 1, 2);
        f({ card: bc.out, busCard: 'BOBINA ' + ka + ' A1' }); if (bc.com) f({ card: bc.com, busCard: porCanal ? 'BOBINA ' + ka + ' A2' : v0 });
        f({ it: 'C', busTB: 'CONTACTO ' + ka + ' 11' }); f({ it: 'NA', busTB: 'CONTACTO ' + ka + ' 14' });
        notas.push('RELÉ DE INTERPOSICIÓN ' + ka + ' EN GABINETE (BOBINA 24 VDC, CONTACTO 11-14 HACIA EL EQUIPO).');
      } else {
        f({ it: '+', card: bc.out });
        if (porCanal) f({ it: '−', card: bc.com }); else { f({ it: '−', busTB: v0 }); if (bc.com) f({ card: bc.com, busCard: v0 }); }
        if (bc.sup) f({ card: bc.sup, busCard: v24 });
        if (h === 3) f({ it: 'PE', busTB: 'TIERRA' });
      }
    }
    return { filas: filas, puentes: puentes, potencia: potencia, notas: notas };
  }

  // ── Bloque de una señal ──
  var X = { inst: 32, instR: 76, s1: 92, s2: 184, jb: 150, tb: 232, tbW: 15, card: 270, cardW: 20, tab: 293, hmi: 352, zona1: 215, zona2: 340 };
  function bloque(L, s, y0, alto, cfg, num) {
    var c = conexionado(s, cfg), filas = c.filas, analog = s.tipo === 'AI' || s.tipo === 'AO';
    var nIt = filas.filter(function (f) { return f.it; }).length, pot = c.potencia;
    var nFil = filas.length + (analog ? 1 : 0) + (pot ? 3 : 0);
    var top = y0 + 11, dy = Math.min(5, (alto - 15) / Math.max(nFil, 1));
    // Orden: primero las filas con borne de instrumento, después las internas del gabinete, al final la pantalla
    var orden = filas.filter(function (f) { return f.it; }).concat(filas.filter(function (f) { return !f.it; }));
    orden.forEach(function (f, i) { f.y = top + i * dy; });
    var ySh = analog ? top + orden.length * dy : null, yPot = top + (orden.length + (analog ? 1 : 0)) * dy;
    var itF = orden.filter(function (f) { return f.it; }), yIt0 = top - dy * 0.5, yIt1 = (itF.length ? itF[itF.length - 1].y : top) + dy * 0.5;
    var tag = s.tag, tc = ISA.compacto(tag), tb = s.modulo ? s.modulo.tb : 'TB', tbc = ISA.compacto(tb);
    var a = ISA.analizar(tag);

    // Instrumento: caja con tag, descripción vertical, símbolo ISA y bornes
    var bx = X.inst, bw = X.instR - X.inst, by = y0 + 2, ult = pot ? yPot + 2 * dy : (itF.length ? itF[itF.length - 1].y : top);
    var bh = Math.min(alto - 3, Math.max(38, ult + dy / 2 + 7 - by));
    L.r(bx, by, bw, bh, 'INSTRUMENTO').r(bx, by, bw - 10, 5, 'INSTRUMENTO').tx(bx + (bw - 10) / 2, by + 3.6, tag, 2.3, 'INSTRUMENTO', { al: 'c', b: true });
    cortar(s.desc, 22).slice(0, 3).forEach(function (t, i) { L.tx(bx - 6.2 + i * 2.6, by + bh, t, 1.8, 'TEXTO', { rot: 90 }); });
    var cx = bx + 11, cy = by + 15;
    L.c(cx, cy, 5.2, 'INSTRUMENTO').tx(cx, cy - 0.4, a.letras || '', 2.1, 'INSTRUMENTO', { al: 'c' }).tx(cx, cy + 2.8, (a.numero || '') + (a.sufijo || ''), 1.8, 'INSTRUMENTO', { al: 'c' });
    L.tx(bx + 1.5, by + bh - 4.6, 'MARCA: ' + (s.marca || ''), 1.5, 'TEXTO').tx(bx + 1.5, by + bh - 1.8, 'MODELO: ' + (s.modeloInst || ''), 1.5, 'TEXTO');
    if (s.rango) L.tx(bx + 1.5, by + 23.6, 'RANGO: ' + s.rango, 1.5, 'TEXTO');
    if (s.senalTxt) L.tx(bx + 1.5, by + 26.4, s.senalTxt, 1.5, 'TEXTO');
    var tx0 = X.instR - 8;
    itF.forEach(function (f) { L.r(tx0, f.y - dy / 2, 8, dy, 'BORNES').tx(tx0 + 4, f.y + 0.7, f.it, 1.8, 'BORNES', { al: 'c' }); });

    // Cables de campo
    var jb = s.jb, xFin = X.tb;
    function lblHilo(f) { return tc + (f.it === '+' ? '+' : f.it === '−' ? '−' : f.it) + '/' + tbc + '-' + (f.tbn || ''); }
    // Bornera del gabinete: asigna bornes correlativos por canal (4 por canal) y fusibles en la fila de alimentación
    var base = (s.canal || 0) * 4, k = 0;
    orden.forEach(function (f) { if (f.it) { f.tbn = f.fu ? 'FU' + pad((s.canal || 0) + 1, 2) : String(base + (++k)); } });
    if (itF.length) {
      var sx1 = X.s1, sx2 = jb ? X.jb - 8 : X.s2;
      itF.forEach(function (f) {
        L.l(X.instR, f.y, jb ? X.jb : xFin, f.y, 'CABLES');
        L.tx(X.s1 + 4, f.y - 0.7, lblHilo(f), 1.45, 'TEXTO');
      });
      [sx1, sx2].forEach(function (sx, i) { L.a(sx + (i ? -2 : 2), (yIt0 + yIt1) / 2, Math.max(2.5, (yIt1 - yIt0) / 2 + 0.6), i ? -60 : 120, i ? 60 : 240, 'CABLES'); });
      var bxC = jb ? 104 : 118, bwC = 30, byC = yIt0 - 8.2;
      L.r(bxC, byC, bwC, 4.2, 'CABLES').tx(bxC + bwC / 2, byC + 3.1, s.cable, 1.8, 'CABLES', { al: 'c' });
      L.tx(bxC + bwC / 2, byC - 1, s.senalTxt || '', 1.6, 'TEXTO', { al: 'c' });
      if (s.cableSpec) { if (jb) L.tx(bxC + bwC / 2, byC - 3.6, s.cableSpec, 1.5, 'TEXTO', { al: 'c' }); else L.tx(bxC + bwC + 2, byC + 3.1, s.cableSpec, 1.6, 'TEXTO'); }
      if (jb) { // caja de conexiones en terreno
        var jy = yIt0 - 1, jh = yIt1 - yIt0 + 2;
        L.r(X.jb, jy - 6, 14, 5, 'BORNES').tx(X.jb + 7, jy - 2.4, jb, 1.8, 'BORNES', { al: 'c', b: true });
        itF.forEach(function (f, i) { var n = (s.jbBorne ? +s.jbBorne : (s.canal || 0) * 3) + i + 1; L.r(X.jb, f.y - dy / 2, 14, dy, 'BORNES').tx(X.jb + 7, f.y + 0.7, n, 1.8, 'BORNES', { al: 'c' }); L.l(X.jb + 14, f.y, xFin, f.y, 'CABLES'); });
        [X.jb + 20, X.zona1 - 8].forEach(function (sx, i) { L.a(sx + (i ? -2 : 2), (yIt0 + yIt1) / 2, Math.max(2.5, (yIt1 - yIt0) / 2 + 0.6), i ? -60 : 120, i ? 60 : 240, 'CABLES'); });
        var cx2 = X.jb + 22, cw2 = 28, cy2 = yIt1 + 2.6;
        L.r(cx2, cy2, cw2, 4.2, 'CABLES').tx(cx2 + cw2 / 2, cy2 + 3.1, s.cable2 || ('C-' + ISA.compacto(jb)), 1.7, 'CABLES', { al: 'c' });
        L.tx(cx2 + cw2 / 2, cy2 + 6.6, (s.cable2Spec || cfg.cableMultipar || '') + (s.par ? ' · PAR ' + s.par : ''), 1.5, 'TEXTO', { al: 'c' });
      } else {
        itF.forEach(function (f) { L.tx(X.tb - 9, f.y - 0.7, lblHilo(f), 1.45, 'TEXTO', { al: 'r' }); });
      }
      if (analog) { // pantalla: conectada sólo en el gabinete
        L.l(sx1 + 2, ySh, X.tb, ySh, 'PANTALLA', { d: 1 }).tx(sx1 + 4, ySh + 2.6, 'PANTALLA (SH) AISLADA EN TERRENO', 1.4, 'PANTALLA');
        L.r(X.tb, ySh - dy / 2, X.tbW, dy, 'BORNES').tx(X.tb + X.tbW / 2, ySh + 0.7, 'SH', 1.7, 'BORNES', { al: 'c' });
        tierra(L, X.tb + X.tbW + 3, ySh);
      }
    }
    // Bornera
    L.r(X.tb, top - dy / 2 - 5, X.tbW, 5, 'BORNES').tx(X.tb + X.tbW / 2, top - dy / 2 - 1.5, tb, 1.7, 'BORNES', { al: 'c', b: true });
    orden.forEach(function (f) {
      if (f.it) {
        L.r(X.tb, f.y - dy / 2, X.tbW, dy, 'BORNES').tx(X.tb + X.tbW / 2, f.y + 0.7, f.tbn, 1.8, 'BORNES', { al: 'c' });
        if (f.fu) { L.r(X.tb - 5.5, f.y - 0.8, 3.6, 1.6, 'BORNES').l(X.tb - 5.5, f.y, X.tb - 1.9, f.y, 'BORNES'); }
        if (f.card) L.l(X.tb + X.tbW, f.y, X.card, f.y, 'CABLES');
        if (f.busTB) { L.l(X.tb + X.tbW, f.y, X.tb + X.tbW + 3, f.y, 'ALIMENTACION').tx(X.tb + X.tbW + 3.6, f.y + 0.6, f.busTB, 1.5, 'ALIMENTACION'); }
      }
    });
    // Tarjeta: bornes, puentes y datos de ubicación
    var mod = s.modulo || {}, tj = s.tarjeta || {}, cardF = orden.filter(function (f) { return f.card; });
    if (cardF.length) {
      var cy0 = cardF[0].y - dy / 2, cy1 = cardF[cardF.length - 1].y + dy / 2;
      L.r(X.card, cy0 - 5, X.cardW, 5, 'TARJETA').tx(X.card + X.cardW / 2, cy0 - 1.5, 'BORNE', 1.6, 'TARJETA', { al: 'c', b: true });
      cardF.forEach(function (f) {
        L.r(X.card, f.y - dy / 2, X.cardW, dy, 'TARJETA').tx(X.card + 1.2, f.y + 0.7, f.card.n, 1.8, 'TARJETA').tx(X.card + X.cardW - 1, f.y + 0.6, f.card.s, 1.4, 'TARJETA', { al: 'r' });
        if (!f.it && f.busCard) L.l(X.card - 3, f.y, X.card, f.y, 'ALIMENTACION').tx(X.card - 3.6, f.y + 0.6, f.busCard, 1.5, 'ALIMENTACION', { al: 'r' });
      });
      c.puentes.forEach(function (p) { var ya = orden[orden.indexOf(filas[p[0]])].y, yb = orden[orden.indexOf(filas[p[1]])].y; L.pl([[X.card, ya], [X.card - 1.8, ya], [X.card - 1.8, yb], [X.card, yb]], 'TARJETA'); });
      // Tabla tipo / chasis / slot / canal
      var tx1 = X.tab, tw = 40, ty = y0 + 3;
      L.r(tx1, ty, 12, 4, 'TARJETA').tx(tx1 + 6, ty + 2.9, 'TIPO', 1.6, 'TARJETA', { al: 'c', b: true }).r(tx1 + 12, ty, tw - 12, 4, 'TARJETA').tx(tx1 + 12 + (tw - 12) / 2, ty + 2.9, s.tipo + ' (' + (tj.modelo || mod.modelo || '') + ')', 1.5, 'TARJETA', { al: 'c' });
      ['CHASIS', 'SLOT', 'CANAL'].forEach(function (t, i) { L.r(tx1 + i * tw / 3, ty + 4, tw / 3, 4, 'TARJETA').tx(tx1 + i * tw / 3 + tw / 6, ty + 6.9, t, 1.5, 'TARJETA', { al: 'c', b: true }); });
      [mod.chasis, mod.slot, s.canalVista != null ? s.canalVista : s.canal].forEach(function (t, i) { L.r(tx1 + i * tw / 3, ty + 8, tw / 3, 4, 'TARJETA').tx(tx1 + i * tw / 3 + tw / 6, ty + 10.9, t == null ? '' : t, 1.8, 'TARJETA', { al: 'c' }); });
      L.tx(tx1, ty + 15, mod.nombre ? 'MÓDULO ' + mod.nombre : '', 1.5, 'TARJETA');
      // Enlace a la HMI (línea de software ISA-5.1: línea con círculos)
      var ym = (cy0 + cy1) / 2, xa = X.card + X.cardW, entrada = s.tipo === 'AI' || s.tipo === 'DI';
      L.l(xa, ym, tx1 - 0.5, ym, 'HMI');
      var fun = s.hmi || [], xh = X.hmi;
      L.l(tx1 + tw, ym, xh, ym, 'HMI');
      for (var xx = tx1 + tw + 3; xx < xh - 2; xx += 5) L.c(xx, ym, 0.6, 'HMI');
      fun.slice(0, 3).forEach(function (fn, i) {
        var yh = ym - (Math.min(fun.length, 3) - 1) * 5.6 + i * 11.2;
        if (i > 0) L.l(xh - 3, ym, xh - 3, yh, 'HMI').l(xh - 3, yh, xh, yh, 'HMI');
        L.r(xh, yh - 4.6, 9.2, 9.2, 'HMI').c(xh + 4.6, yh, 4.6, 'HMI').l(xh, yh, xh + 9.2, yh, 'HMI')
          .tx(xh + 4.6, yh - 1.1, fn, fn.length > 3 ? 1.6 : 1.9, 'HMI', { al: 'c' }).tx(xh + 4.6, yh + 2.9, (a.numero || '') + (a.sufijo || ''), 1.6, 'HMI', { al: 'c' });
      });
      if (fun.length) { if (entrada) L.flecha(xh, ym - (Math.min(fun.length, 3) - 1) * 5.6, 1, 'HMI'); else L.flecha(xa + 0.2, ym, -1, 'HMI'); }
      cortar(s.servicio || '', 26).slice(0, 3).forEach(function (t, i) { L.tx(xh + 11.5, ym - 4 + i * 2.6 - (Math.min(fun.length, 3) - 1) * 5.6, t, 1.7, 'TEXTO'); });
    }
    // Alimentación de instrumentos de 4 hilos
    if (pot) {
      pot.terms.forEach(function (t, i) {
        var y = yPot + i * dy; L.r(tx0, y - dy / 2, 8, dy, 'BORNES').tx(tx0 + 4, y + 0.7, t, 1.8, 'BORNES', { al: 'c' }).l(X.instR, y, X.s2 - 20, y, 'ALIMENTACION');
      });
      var ym2 = yPot + dy, cbx = 112;
      L.r(cbx, ym2 - 2.1, 30, 4.2, 'ALIMENTACION', { f: 'w' }).tx(cbx + 15, ym2 + 0.9, tc + '-P01', 1.7, 'ALIMENTACION', { al: 'c' });
      L.l(X.s2 - 20, yPot, X.s2 - 20, yPot + 2 * dy, 'ALIMENTACION').l(X.s2 - 20, ym2, X.s2 - 14, ym2, 'ALIMENTACION').flecha(X.s2 - 13.5, ym2, 1, 'ALIMENTACION')
        .tx(X.s2 - 12, ym2 + 0.6, 'A ' + pot.texto, 1.5, 'ALIMENTACION');
    }
    return c.notas;
  }
  function tierra(L, x, y) { L.l(x - 3, y, x, y, 'PANTALLA').l(x, y, x, y + 2, 'PANTALLA').l(x - 1.6, y + 2, x + 1.6, y + 2, 'PANTALLA').l(x - 1, y + 2.7, x + 1, y + 2.7, 'PANTALLA').l(x - 0.4, y + 3.4, x + 0.4, y + 3.4, 'PANTALLA'); }

  // ── Hoja completa ──
  function hoja(lazo, senales, ctx, n, de) {
    var L = new Lienzo(), cfg = ctx.cfg || {}, P = ctx.proyecto || {};
    // Marco con referencias de zona
    L.r(5, 5, W - 10, H - 10, 'MARCO').r(10, 10, W - 20, H - 20, 'MARCO', { w: 0.5 });
    for (var i = 0; i < 8; i++) { var x = 10 + i * 50; if (i) { L.l(x, 5, x, 10, 'MARCO').l(x, H - 10, x, H - 5, 'MARCO'); } L.tx(x + 25, 8.6, i + 1, 2.2, 'MARCO', { al: 'c' }).tx(x + 25, H - 6.4, i + 1, 2.2, 'MARCO', { al: 'c' }); }
    'ABCDEF'.split('').forEach(function (ch, i) { var y = 10 + i * 46.17; if (i) { L.l(5, y, 10, y, 'MARCO').l(W - 10, y, W - 5, y, 'MARCO'); } L.tx(7.5, y + 24, ch, 2.2, 'MARCO', { al: 'c' }).tx(W - 7.5, y + 24, ch, 2.2, 'MARCO', { al: 'c' }); });
    // Zonas
    var yZ = 224;
    L.l(10, 17, 410, 17, 'ZONAS').l(10, 23, 410, 23, 'ZONAS').l(X.zona1, 10, X.zona1, yZ, 'ZONAS', { w: 0.5 }).l(X.zona2, 10, X.zona2, yZ, 'ZONAS', { w: 0.5 });
    L.tx(112, 15.6, cfg.zonaTerreno || 'TERRENO', 4, 'ZONAS', { al: 'c' }).tx(277, 15.6, cfg.zonaSala || 'SALA ELÉCTRICA', 4, 'ZONAS', { al: 'c' }).tx(375, 15.6, cfg.zonaControl || 'SALA DE CONTROL', 4, 'ZONAS', { al: 'c' });
    var gab = senales[0] && senales[0].modulo && senales[0].modulo.gabinete ? senales[0].modulo.gabinete : cfg.gabinete;
    L.tx(112, 21.4, senales.some(function (s) { return s.jb; }) ? 'INSTRUMENTOS Y CAJA DE CONEXIONES' : '', 2.6, 'ZONAS', { al: 'c' }).tx(277, 21.4, gab || 'GABINETE DE CONTROL', 2.8, 'ZONAS', { al: 'c' }).tx(375, 21.4, cfg.hmi || 'ESTACIÓN DE OPERACIÓN (HMI)', 2.6, 'ZONAS', { al: 'c' });
    // Señales (hasta 4 por hoja)
    var alto = (yZ - 26) / 4, notas = [];
    senales.forEach(function (s, k) { notas = notas.concat(bloque(L, s, 26 + k * alto, alto, cfg, k)); });
    L.l(10, yZ, 410, yZ, 'MARCO');
    // Notas
    var nt = ['PARA DETALLES DE MÓDULOS DE E/S VER LISTADO DE ENTRADAS Y SALIDAS DOC. N° ' + (cfg.docIO || '—') + '.',
      'PARA LARGO, TIPO Y CALIBRE DE LOS CABLES VER LISTADO DE CABLES DOC. N° ' + (cfg.docCables || '—') + '.',
      'PANTALLA DE CABLES ANALÓGICOS CONECTADA A TIERRA SÓLO EN EL GABINETE; AISLADA EN TERRENO.',
      'CONTRATISTA DE MONTAJE DEBERÁ VERIFICAR BORNES DE INSTRUMENTOS CON INFORMACIÓN CERTIFICADA DEL PROVEEDOR.'];
    var noVer = senales.filter(function (s) { return s.tarjeta && !s.tarjeta.verificado; }).map(function (s) { return s.tarjeta.modelo; });
    if (noVer.length) nt.push('BORNES DE TARJETA ' + noVer.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + ' REFERENCIALES; VERIFICAR CON EL MANUAL DEL FABRICANTE.');
    nt = nt.concat(notas, (lazo.notas || '').split(/\r?\n/).filter(Boolean));
    L.tx(13, yZ + 4.5, 'NOTAS:', 2.2, 'NOTAS', { b: true });
    var yn = yZ + 8.2;
    nt.slice(0, 8).forEach(function (t, i) { cortar((i + 1) + '.- ' + t, 128).slice(0, 2).forEach(function (l2, j) { if (yn < 255) { L.tx(j ? 17 : 13, yn, l2, 1.75, 'NOTAS'); yn += 2.9; } }); });
    // Referencias y revisiones
    var yR = 257;
    L.l(10, yR - 1.5, 250, yR - 1.5, 'ROTULO').tx(13, yR + 1.6, 'REFERENCIAS: ' + [cfg.docIO && ('LISTADO E/S ' + cfg.docIO), cfg.docCables && ('LISTADO DE CABLES ' + cfg.docCables), cfg.docPid && ('P&ID ' + cfg.docPid)].filter(Boolean).join(' · '), 1.6, 'ROTULO');
    var cols = [10, 20, 40, 170, 190, 210, 230, 250], yT = 260, hr = 5.4;
    L.r(10, yT, 240, 27, 'ROTULO');
    var revs = (ctx.revisiones || []).slice(-3);
    for (var r = 0; r < 4; r++) L.l(10, yT + hr * (r + 1), 250, yT + hr * (r + 1), 'ROTULO');
    cols.slice(1, -1).forEach(function (cx) { L.l(cx, yT, cx, H - 10, 'ROTULO'); });
    ['REV', 'FECHA', 'DESCRIPCIÓN', 'POR', 'REVISÓ', 'APROBÓ', 'CLIENTE'].forEach(function (t, i) { L.tx((cols[i] + cols[i + 1]) / 2, H - 10 - 1.6, t, 1.6, 'ROTULO', { al: 'c', b: true }); });
    revs.forEach(function (rv, k) {
      var y = H - 10 - hr * (k + 1) - 1.6;
      [rv.rev, rv.fecha, rv.desc, rv.por, rv.reviso, rv.aprobo, rv.cliente].forEach(function (t, i) { L.tx(i === 2 ? cols[i] + 1.5 : (cols[i] + cols[i + 1]) / 2, y, t || '', 1.6, 'ROTULO', { al: i === 2 ? 'l' : 'c' }); });
    });
    // Rótulo
    var x0 = 250, x1 = 410;
    L.r(x0, yZ, x1 - x0, H - 10 - yZ, 'ROTULO', { w: 0.5 });
    L.l(x0, 238, x1, 238, 'ROTULO').l(x0 + 46, yZ, x0 + 46, 238, 'ROTULO');
    if (ctx.logo) L.img(x0 + 3, yZ + 2.5, 40, 9, ctx.logo); else L.tx(x0 + 23, yZ + 9, 'ReyEngi', 5, 'ROTULO', { al: 'c', b: true });
    var cli = (P.cliente || '').toUpperCase(), hc = cli.length > 40 ? 2.3 : 3.2;
    L.tx(x0 + 46 + 57, yZ + 6, cli.length > 62 ? cli.slice(0, 60) + '…' : cli, hc, 'ROTULO', { al: 'c', b: true });
    cortar((P.proyecto || '').toUpperCase(), 62).slice(0, 2).forEach(function (t, i) { L.tx(x0 + 46 + 57, yZ + 9.8 + i * 2.7, t, 1.9, 'ROTULO', { al: 'c' }); });
    L.l(x0, 256, x1, 256, 'ROTULO');
    L.tx((x0 + x1) / 2, 242.6, 'DIAGRAMA DE LAZO', 3.2, 'ROTULO', { al: 'c', b: true });
    cortar((lazo.servicio || '').toUpperCase(), 70).slice(0, 2).forEach(function (t, i) { L.tx((x0 + x1) / 2, 247.4 + i * 3, t, 2.2, 'ROTULO', { al: 'c' }); });
    L.tx((x0 + x1) / 2, 254.2, 'LAZO ' + lazo.id + (lazo.tags ? ' · ' + lazo.tags : ''), 1.7, 'ROTULO', { al: 'c' });
    // Responsables y datos
    var xm = x0 + 80;
    L.l(xm, 256, xm, 272, 'ROTULO').l(x0, 272, x1, 272, 'ROTULO');
    [['ELABORÓ', P.por, P.porFecha], ['REVISÓ', P.reviso, P.revisoFecha], ['APROBÓ', P.aprobo, P.aproboFecha]].forEach(function (rw, i) {
      var y = 260.2 + i * 4.6; L.tx(x0 + 2, y, rw[0], 1.6, 'ROTULO', { b: true }).tx(x0 + 22, y, rw[1] || '', 1.7, 'ROTULO').tx(x0 + 52, y, rw[2] || '', 1.6, 'ROTULO');
      if (i < 2) L.l(x0, y + 1.6, xm, y + 1.6, 'ROTULO');
    });
    [['N° PROYECTO', P.numero || ''], ['ESCALA', 'S/E'], ['HOJA', n + ' DE ' + de]].forEach(function (rw, i) {
      var y = 260.2 + i * 4.6; L.tx(xm + 2, y, rw[0], 1.6, 'ROTULO', { b: true }).tx(xm + 26, y, rw[1], 1.8, 'ROTULO');
      if (i < 2) L.l(xm, y + 1.6, x1, y + 1.6, 'ROTULO');
    });
    L.l(x1 - 22, 272, x1 - 22, H - 10, 'ROTULO');
    L.tx(x0 + 2, 275.6, 'PLANO N°', 1.6, 'ROTULO', { b: true }).tx(x0 + 64, 283.2, lazo.plano + (de > 1 ? ' (' + n + '/' + de + ')' : ''), 3.4, 'ROTULO', { al: 'c', b: true });
    L.tx(x1 - 20, 275.6, 'REV.', 1.6, 'ROTULO', { b: true }).tx(x1 - 11, 283.4, lazo.rev || P.rev || '', 3.4, 'ROTULO', { al: 'c', b: true });
    return { prims: L.p, n: n, de: de, plano: lazo.plano };
  }
  function hojas(lazo, ctx) {
    var s = lazo.senales, out = [], porHoja = 4, de = Math.max(1, Math.ceil(s.length / porHoja));
    for (var i = 0; i < de; i++) out.push(hoja(lazo, s.slice(i * porHoja, (i + 1) * porHoja), ctx, i + 1, de));
    return out;
  }

  // ── SVG ──
  function e(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var COL = { MARCO: '#111', ROTULO: '#111', TEXTO: '#111', ZONAS: '#111', INSTRUMENTO: '#0b3d91', CABLES: '#111', BORNES: '#111', TARJETA: '#111', PANTALLA: '#666', HMI: '#0b3d91', ALIMENTACION: '#9a3a00', NOTAS: '#111' };
  function svg(h, op) {
    op = op || {};
    var o = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + W + ' ' + H + '"' + (op.mm !== false ? ' width="' + W + 'mm" height="' + H + 'mm"' : '') + ' font-family="Arial Narrow, Arial, Helvetica, sans-serif">',
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>'];
    h.prims.forEach(function (p) {
      var col = COL[p.c] || '#111', sw = (p.t === 'r' ? p.w2 : p.w) || 0.22;
      if (p.t === 'l') o.push('<line x1="' + p.x1.toFixed(2) + '" y1="' + p.y1.toFixed(2) + '" x2="' + p.x2.toFixed(2) + '" y2="' + p.y2.toFixed(2) + '" stroke="' + col + '" stroke-width="' + sw + '"' + (p.d ? ' stroke-dasharray="1.6 0.8"' : '') + '/>');
      else if (p.t === 'r') o.push('<rect x="' + p.x.toFixed(2) + '" y="' + p.y.toFixed(2) + '" width="' + p.w.toFixed(2) + '" height="' + p.h.toFixed(2) + '" fill="' + (p.f === 'w' ? '#fff' : p.f ? col : 'none') + '" stroke="' + col + '" stroke-width="' + sw + '"' + (p.d ? ' stroke-dasharray="1.6 0.8"' : '') + '/>');
      else if (p.t === 'c') o.push('<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="' + p.r + '" fill="' + (p.f ? col : '#fff') + '" stroke="' + col + '" stroke-width="0.22"/>');
      else if (p.t === 'a') { var r1 = p.a1 * Math.PI / 180, r2 = p.a2 * Math.PI / 180; o.push('<path d="M' + (p.x + p.r * Math.cos(r1)).toFixed(2) + ' ' + (p.y + p.r * Math.sin(r1)).toFixed(2) + ' A' + p.r + ' ' + p.r + ' 0 ' + ((p.a2 - p.a1) % 360 > 180 ? 1 : 0) + ' 1 ' + (p.x + p.r * Math.cos(r2)).toFixed(2) + ' ' + (p.y + p.r * Math.sin(r2)).toFixed(2) + '" fill="none" stroke="' + col + '" stroke-width="0.22"/>'); }
      else if (p.t === 'pl') o.push('<path d="M' + p.pts.map(function (q) { return q[0].toFixed(2) + ' ' + q[1].toFixed(2); }).join(' L') + (p.cerrada ? ' Z' : '') + '" fill="' + (p.f ? col : 'none') + '" stroke="' + col + '" stroke-width="0.22"/>');
      else if (p.t === 'img') o.push('<image x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" href="' + e(p.href) + '" preserveAspectRatio="xMinYMid meet"/>');
      else if (p.t === 'tx') {
        var anc = p.al === 'c' ? 'middle' : p.al === 'r' ? 'end' : 'start', fs = (p.h * 1.38).toFixed(2);
        var tr = p.rot ? ' transform="rotate(-' + p.rot + ' ' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')"' : '';
        o.push('<text x="' + p.x.toFixed(2) + '" y="' + p.y.toFixed(2) + '" font-size="' + fs + '" text-anchor="' + anc + '" fill="' + col + '"' + (p.b ? ' font-weight="700"' : '') + tr + '>' + e(p.s) + '</text>');
      }
    });
    o.push('</svg>');
    return o.join('');
  }

  // ── DXF R12 (AC1009), unidades en mm, capas por tipo de elemento ──
  function dxfTexto(s) {
    return String(s).replace(/−/g, '-').replace(/[^\x20-\x7E]/g, function (ch) { var c = ch.charCodeAt(0).toString(16).toUpperCase(); while (c.length < 4) c = '0' + c; return '\\U+' + c; });
  }
  function dxf(lista) {
    var o = [], n = function (c, v) { o.push(c, v); };
    var ox = 0;
    n(0, 'SECTION'); n(2, 'HEADER'); n(9, '$ACADVER'); n(1, 'AC1009'); n(9, '$INSUNITS'); n(70, 4); n(9, '$DWGCODEPAGE'); n(3, 'ANSI_1252');
    n(9, '$EXTMIN'); n(10, 0); n(20, 0); n(30, 0); n(9, '$EXTMAX'); n(10, W * lista.length + 20 * (lista.length - 1)); n(20, H); n(30, 0);
    n(9, '$LTSCALE'); n(40, 1); n(0, 'ENDSEC');
    n(0, 'SECTION'); n(2, 'TABLES');
    n(0, 'TABLE'); n(2, 'LTYPE'); n(70, 2);
    n(0, 'LTYPE'); n(2, 'CONTINUOUS'); n(70, 0); n(3, 'Solid line'); n(72, 65); n(73, 0); n(40, 0);
    n(0, 'LTYPE'); n(2, 'DASHED'); n(70, 0); n(3, '__ __ __'); n(72, 65); n(73, 2); n(40, 2.4); n(49, 1.6); n(49, -0.8);
    n(0, 'ENDTAB');
    n(0, 'TABLE'); n(2, 'LAYER'); n(70, Object.keys(CAPAS).length);
    Object.keys(CAPAS).forEach(function (k) { n(0, 'LAYER'); n(2, k); n(70, 0); n(62, CAPAS[k]); n(6, k === 'PANTALLA' ? 'DASHED' : 'CONTINUOUS'); });
    n(0, 'ENDTAB');
    n(0, 'TABLE'); n(2, 'STYLE'); n(70, 1); n(0, 'STYLE'); n(2, 'STANDARD'); n(70, 0); n(40, 0); n(41, 0.85); n(50, 0); n(71, 0); n(42, 2.5); n(3, 'romans.shx'); n(4, ''); n(0, 'ENDTAB');
    n(0, 'ENDSEC');
    n(0, 'SECTION'); n(2, 'ENTITIES');
    lista.forEach(function (h) {
      function X(x) { return +(x + ox).toFixed(3); } function Y(y) { return +(H - y).toFixed(3); }
      function linea(x1, y1, x2, y2, c, d) { n(0, 'LINE'); n(8, c); if (d) n(6, 'DASHED'); n(10, X(x1)); n(20, Y(y1)); n(30, 0); n(11, X(x2)); n(21, Y(y2)); n(31, 0); }
      h.prims.forEach(function (p) {
        if (p.t === 'l') linea(p.x1, p.y1, p.x2, p.y2, p.c, p.d);
        else if (p.t === 'r') { linea(p.x, p.y, p.x + p.w, p.y, p.c, p.d); linea(p.x + p.w, p.y, p.x + p.w, p.y + p.h, p.c, p.d); linea(p.x + p.w, p.y + p.h, p.x, p.y + p.h, p.c, p.d); linea(p.x, p.y + p.h, p.x, p.y, p.c, p.d); }
        else if (p.t === 'c') { n(0, 'CIRCLE'); n(8, p.c); n(10, X(p.x)); n(20, Y(p.y)); n(30, 0); n(40, p.r); }
        else if (p.t === 'a') { n(0, 'ARC'); n(8, p.c); n(10, X(p.x)); n(20, Y(p.y)); n(30, 0); n(40, p.r); n(50, ((-p.a2 % 360) + 360) % 360); n(51, ((-p.a1 % 360) + 360) % 360); }
        else if (p.t === 'pl') {
          if (p.f && p.pts.length === 3) { n(0, 'SOLID'); n(8, p.c); [0, 1, 2, 2].forEach(function (k, i) { n(10 + i, X(p.pts[k][0])); n(20 + i, Y(p.pts[k][1])); n(30 + i, 0); }); }
          else { for (var i = 0; i < p.pts.length - 1; i++) linea(p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1], p.c); if (p.cerrada) linea(p.pts[p.pts.length - 1][0], p.pts[p.pts.length - 1][1], p.pts[0][0], p.pts[0][1], p.c); }
        }
        else if (p.t === 'img') { n(0, 'TEXT'); n(8, 'ROTULO'); n(10, X(p.x + 2)); n(20, Y(p.y + p.h * 0.75)); n(30, 0); n(40, 5); n(1, 'ReyEngi'); }
        else if (p.t === 'tx') {
          var ha = p.al === 'c' ? 1 : p.al === 'r' ? 2 : 0;
          n(0, 'TEXT'); n(8, p.c); n(10, X(p.x)); n(20, Y(p.y)); n(30, 0); n(40, p.h); n(1, dxfTexto(p.s));
          if (p.rot) n(50, p.rot);
          n(41, 0.85); n(7, 'STANDARD');
          if (ha) { n(72, ha); n(11, X(p.x)); n(21, Y(p.y)); n(31, 0); }
        }
      });
      ox += W + 20;
    });
    n(0, 'ENDSEC'); n(0, 'EOF');
    var s = []; for (var i = 0; i < o.length; i += 2) s.push(o[i], o[i + 1]);
    return s.join('\r\n') + '\r\n';
  }

  window.LAZOS_DIBUJO = { hojas: hojas, svg: svg, dxf: dxf, conexionado: conexionado, W: W, H: H };
})();
