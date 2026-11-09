/* Exportación 3D de los visores · ReyEngi
 *
 * Toma la escena que el visor está mostrando y la guarda como:
 *   OBJ  (+ MTL con colores, en un .zip)  -> Revit 2025 (vincular), SolidWorks, Blender, 3ds Max
 *   STL  (binario)                       -> SolidWorks, Revit 2025, impresión 3D
 *   DXF  3D (R12, mallas policara)      -> AutoCAD, Revit (importar CAD), BricsCAD
 *
 * Todo sale en milímetros, con Z hacia arriba (convención CAD) y tal como se ve en pantalla:
 * solo las piezas visibles del montaje elegido. Las etiquetas, cotas, haces y rangos simulados
 * (materiales básicos o casi transparentes) no se exportan, igual que en el DXF 2D de cada visor.
 */
(function () {
  'use strict';

  // Milímetros por unidad de cada visor (según la escala declarada en su código)
  var MM_POR_UNIDAD = {
    '3-flujometro-magnetico': 25,
    '4-interruptor-flujo': 8.9,
    '6-transmisor-nivel': 25,
    'estanque-impulsion': 100,
    'chancado-primario': 1000
  };
  var MM_DEFECTO = 10; // 1 u = 1 cm en el resto de los visores

  // ── Recolección de triángulos ─────────────────────────────────────────────────
  function escenaPrincipal(w) {
    var E = w && w.__RE_ESCENAS;
    if (!E || !E.size) return null;
    var mejor = null, max = -1;
    E.forEach(function (s) {
      var n = 0;
      s.traverseVisible(function (o) { if (o.isMesh) n++; });
      if (n > max) { max = n; mejor = s; }
    });
    return mejor;
  }

  function exportable(o) {
    if (!o.isMesh || o.isSprite) return false;
    var m = o.material;
    if (!m || Array.isArray(m)) return false;
    if (m.isShadowMaterial || m.isMeshBasicMaterial || m.isLineBasicMaterial || m.isPointsMaterial) return false;
    if (m.transparent && m.opacity < 0.12) return false;
    if (m.visible === false || m.colorWrite === false) return false;
    var g = o.geometry;
    return !!(g && g.attributes && g.attributes.position);
  }

  function capaDe(o) {
    var x = o;
    while (x) {
      var s = x.userData && x.userData.scope;
      if (s === 'inst') return 'INSTRUMENTO';
      if (s === 'pipe') return 'CANERIA_Y_SOPORTES';
      if (s) return String(s).toUpperCase().replace(/[^A-Z0-9_-]/g, '_').slice(0, 28);
      x = x.parent;
    }
    return 'PIEZAS';
  }

  function colorDe(o) {
    var m = o.material, base = o.userData && o.userData.base;
    var c = (base && base.color) || m.color;
    return c ? c.getHex() : 0xA0A0A0;
  }

  // Devuelve [{ nombre, capa, color, pos: Float64Array (mm, Z arriba), tri: Uint32Array }]
  function recolectar(escena, mm) {
    escena.updateMatrixWorld(true);
    var piezas = [], n = 0;
    escena.traverseVisible(function (o) {
      if (!exportable(o)) return;
      var g = o.geometry, P = g.attributes.position, I = g.index;
      var nInst = o.isInstancedMesh ? o.count : 1;
      for (var k = 0; k < nInst; k++) {
        var M = o.matrixWorld.elements.slice();
        if (o.isInstancedMesh) M = mult(M, o.instanceMatrix.array.slice(k * 16, k * 16 + 16));
        var det = M[0] * (M[5] * M[10] - M[9] * M[6]) - M[4] * (M[1] * M[10] - M[9] * M[2]) + M[8] * (M[1] * M[6] - M[5] * M[2]);
        // Soldar vértices por posición (las geometrías vienen partidas por normales)
        var mapa = new Map(), pos = [], remap = new Uint32Array(P.count);
        for (var i = 0; i < P.count; i++) {
          var x = P.getX(i), y = P.getY(i), z = P.getZ(i);
          var wx = M[0] * x + M[4] * y + M[8] * z + M[12];
          var wy = M[1] * x + M[5] * y + M[9] * z + M[13];
          var wz = M[2] * x + M[6] * y + M[10] * z + M[14];
          // Y arriba (three.js) -> Z arriba (CAD), en mm
          var X = wx * mm, Y = -wz * mm, Z = wy * mm;
          var key = Math.round(X * 100) + ',' + Math.round(Y * 100) + ',' + Math.round(Z * 100);
          var v = mapa.get(key);
          if (v === undefined) { v = pos.length / 3; mapa.set(key, v); pos.push(X, Y, Z); }
          remap[i] = v;
        }
        var nIdx = I ? I.count : P.count, tri = [];
        var rango = g.drawRange || { start: 0, count: Infinity };
        var ini = Math.max(0, rango.start), fin = Math.min(nIdx, ini + rango.count);
        for (var f = ini; f + 2 < fin; f += 3) {
          var a = remap[I ? I.getX(f) : f], b = remap[I ? I.getX(f + 1) : f + 1], c = remap[I ? I.getX(f + 2) : f + 2];
          if (a === b || b === c || a === c) continue;
          if (det < 0) tri.push(a, c, b); else tri.push(a, b, c);
        }
        if (!tri.length) continue;
        n++;
        var capa = capaDe(o);
        piezas.push({ nombre: (o.name || capa.toLowerCase()) .replace(/[^\w-]+/g, '_') + '_' + ('00' + n).slice(-3), capa: capa, color: colorDe(o), pos: new Float64Array(pos), tri: new Uint32Array(tri) });
      }
    });
    return piezas;
  }

  function mult(a, b) { // matrices 4x4 en orden de columnas
    var r = new Array(16);
    for (var c = 0; c < 4; c++) for (var f = 0; f < 4; f++) {
      r[c * 4 + f] = a[f] * b[c * 4] + a[4 + f] * b[c * 4 + 1] + a[8 + f] * b[c * 4 + 2] + a[12 + f] * b[c * 4 + 3];
    }
    return r;
  }

  function num(v) { var s = (Math.round(v * 1000) / 1000).toString(); return s === '-0' ? '0' : s; }
  function hex6(c) { return ('00000' + c.toString(16)).slice(-6); }

  // ── OBJ + MTL ──────────────────────────────────────────────────────────────────
  function obj(piezas, base, titulo) {
    var o = ['# ' + titulo, '# ReyEngi · Visores 3D · unidades: mm · Z hacia arriba', 'mtllib ' + base + '.mtl'];
    var mtl = ['# Materiales ' + titulo], usados = {};
    var off = 1;
    piezas.forEach(function (p) {
      var mat = 'c' + hex6(p.color);
      if (!usados[mat]) {
        usados[mat] = 1;
        var r = ((p.color >> 16) & 255) / 255, g = ((p.color >> 8) & 255) / 255, b = (p.color & 255) / 255;
        mtl.push('newmtl ' + mat, 'Kd ' + r.toFixed(4) + ' ' + g.toFixed(4) + ' ' + b.toFixed(4), 'Ka 0 0 0', 'Ks 0.2 0.2 0.2', 'Ns 30', 'd 1', 'illum 2', '');
      }
      o.push('o ' + p.nombre, 'g ' + p.capa, 'usemtl ' + mat);
      for (var i = 0; i < p.pos.length; i += 3) o.push('v ' + num(p.pos[i]) + ' ' + num(p.pos[i + 1]) + ' ' + num(p.pos[i + 2]));
      for (var t = 0; t < p.tri.length; t += 3) o.push('f ' + (p.tri[t] + off) + ' ' + (p.tri[t + 1] + off) + ' ' + (p.tri[t + 2] + off));
      off += p.pos.length / 3;
    });
    return { obj: o.join('\n') + '\n', mtl: mtl.join('\n') + '\n' };
  }

  // ── STL binario ────────────────────────────────────────────────────────────────
  function stl(piezas, titulo) {
    var total = piezas.reduce(function (s, p) { return s + p.tri.length / 3; }, 0);
    var buf = new ArrayBuffer(84 + total * 50), dv = new DataView(buf);
    var cab = ('ReyEngi ' + titulo + ' - unidades mm').slice(0, 80);
    for (var i = 0; i < cab.length; i++) dv.setUint8(i, cab.charCodeAt(i) & 127);
    dv.setUint32(80, total, true);
    var o = 84;
    piezas.forEach(function (p) {
      var P = p.pos, T = p.tri;
      for (var t = 0; t < T.length; t += 3) {
        var a = T[t] * 3, b = T[t + 1] * 3, c = T[t + 2] * 3;
        var ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
        var vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
        dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
        [a, b, c].forEach(function (k, j) {
          dv.setFloat32(o + 12 + j * 12, P[k], true); dv.setFloat32(o + 16 + j * 12, P[k + 1], true); dv.setFloat32(o + 20 + j * 12, P[k + 2], true);
        });
        dv.setUint16(o + 48, 0, true);
        o += 50;
      }
    });
    return new Uint8Array(buf);
  }

  // ── DXF 3D (R12, mallas policara) ─────────────────────────────────────────────────
  var ACI = [[1, 255, 0, 0], [2, 255, 255, 0], [3, 0, 255, 0], [4, 0, 255, 255], [5, 0, 0, 255], [6, 255, 0, 255],
    [8, 128, 128, 128], [9, 192, 192, 192], [30, 255, 127, 0], [32, 165, 82, 0], [40, 255, 191, 0], [50, 255, 255, 127],
    [140, 0, 127, 255], [150, 0, 63, 255], [160, 0, 0, 165], [170, 0, 0, 127], [10, 255, 127, 127], [12, 165, 0, 0],
    [250, 51, 51, 51], [251, 80, 80, 80], [252, 105, 105, 105], [253, 130, 130, 130], [254, 190, 190, 190], [7, 255, 255, 255]];
  function aci(c) {
    var r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, mejor = 7, d = Infinity;
    ACI.forEach(function (a) { var e = (a[1] - r) * (a[1] - r) + (a[2] - g) * (a[2] - g) + (a[3] - b) * (a[3] - b); if (e < d) { d = e; mejor = a[0]; } });
    return mejor;
  }

  // Aristas casi coplanares se marcan invisibles para que el alámbrico no muestre la triangulación
  function aristasVisibles(p) {
    var P = p.pos, T = p.tri, nF = T.length / 3, N = new Float64Array(nF * 3), E = new Map();
    for (var f = 0; f < nF; f++) {
      var a = T[f * 3] * 3, b = T[f * 3 + 1] * 3, c = T[f * 3 + 2] * 3;
      var ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      var vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      N[f * 3] = nx / l; N[f * 3 + 1] = ny / l; N[f * 3 + 2] = nz / l;
      for (var e = 0; e < 3; e++) {
        var i = T[f * 3 + e], j = T[f * 3 + (e + 1) % 3], k = i < j ? i + ',' + j : j + ',' + i;
        var r = E.get(k); if (r) r.push(f); else E.set(k, [f]);
      }
    }
    var cos = Math.cos(30 * Math.PI / 180);
    return function (f, e) {
      var i = T[f * 3 + e], j = T[f * 3 + (e + 1) % 3], caras = E.get(i < j ? i + ',' + j : j + ',' + i);
      if (!caras || caras.length !== 2) return true;  // borde libre o no manifold
      var g = caras[0] === f ? caras[1] : caras[0];
      return N[f * 3] * N[g * 3] + N[f * 3 + 1] * N[g * 3 + 1] + N[f * 3 + 2] * N[g * 3 + 2] < cos;
    };
  }

  function dxf(piezas, titulo) {
    var L = [];
    function g(c, v) { L.push(String(c), String(v)); }
    var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    piezas.forEach(function (p) { for (var i = 0; i < p.pos.length; i++) { var k = i % 3; if (p.pos[i] < mn[k]) mn[k] = p.pos[i]; if (p.pos[i] > mx[k]) mx[k] = p.pos[i]; } });
    if (!piezas.length) { mn = [0, 0, 0]; mx = [0, 0, 0]; }
    g(999, 'ReyEngi Visores 3D - ' + titulo.replace(/[\r\n]/g, ' ') + ' - mm');
    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$INSBASE'); g(10, 0); g(20, 0); g(30, 0);
    g(9, '$EXTMIN'); g(10, num(mn[0])); g(20, num(mn[1])); g(30, num(mn[2]));
    g(9, '$EXTMAX'); g(10, num(mx[0])); g(20, num(mx[1])); g(30, num(mx[2]));
    g(9, '$INSUNITS'); g(70, 4);
    g(9, '$MEASUREMENT'); g(70, 1);
    g(0, 'ENDSEC');
    // Capas
    var capas = {};
    piezas.forEach(function (p) { if (!capas[p.capa]) capas[p.capa] = aci(p.color); });
    var nombres = Object.keys(capas);
    g(0, 'SECTION'); g(2, 'TABLES');
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0);
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, nombres.length + 1);
    g(0, 'LAYER'); g(2, '0'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    nombres.forEach(function (n) { g(0, 'LAYER'); g(2, n); g(70, 0); g(62, capas[n]); g(6, 'CONTINUOUS'); });
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    var MAX = 32000;
    piezas.forEach(function (p) {
      var vis = aristasVisibles(p), col = aci(p.color), T = p.tri, P = p.pos;
      // Partir mallas grandes: R12 admite hasta 32767 vértices y caras por entidad
      var f0 = 0, nF = T.length / 3;
      while (f0 < nF) {
        var f1 = f0, mapa = new Map(), vs = [];
        while (f1 < nF && f1 - f0 < MAX) {
          var nuevos = 0, e;
          for (e = 0; e < 3; e++) if (!mapa.has(T[f1 * 3 + e])) nuevos++;
          if (vs.length + nuevos > MAX) break;
          for (e = 0; e < 3; e++) { var v = T[f1 * 3 + e]; if (!mapa.has(v)) { mapa.set(v, vs.length + 1); vs.push(v); } }
          f1++;
        }
        g(0, 'POLYLINE'); g(8, p.capa); g(62, col); g(66, 1); g(10, 0); g(20, 0); g(30, 0); g(70, 64); g(71, vs.length); g(72, f1 - f0);
        vs.forEach(function (v) {
          g(0, 'VERTEX'); g(8, p.capa); g(10, num(P[v * 3])); g(20, num(P[v * 3 + 1])); g(30, num(P[v * 3 + 2])); g(70, 192);
        });
        for (var q = f0; q < f1; q++) {
          g(0, 'VERTEX'); g(8, p.capa); g(10, 0); g(20, 0); g(30, 0); g(70, 128);
          for (var s = 0; s < 3; s++) {
            var idx = mapa.get(T[q * 3 + s]);
            g(71 + s, vis(q, s) ? idx : -idx);
          }
        }
        g(0, 'SEQEND'); g(8, p.capa);
        f0 = f1;
      }
    });
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\r\n') + '\r\n';
  }

  // ── ZIP mínimo (para OBJ + MTL) ───────────────────────────────────────────────────
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(archivos) {
    var enc = new TextEncoder(), partes = [], central = [], off = 0;
    archivos.forEach(function (a) {
      var nom = enc.encode(a.nombre), dat = typeof a.datos === 'string' ? enc.encode(a.datos) : a.datos, crc = crc32(dat);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true);
      h.setUint32(18, dat.length, true); h.setUint32(22, dat.length, true); h.setUint16(26, nom.length, true);
      partes.push(new Uint8Array(h.buffer), nom, dat);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, dat.length, true); c.setUint32(24, dat.length, true); c.setUint16(28, nom.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nom);
      off += 30 + nom.length + dat.length;
    });
    var tc = central.reduce(function (s, p) { return s + p.length; }, 0), fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tc, true); fin.setUint32(16, off, true);
    var todo = partes.concat(central, [new Uint8Array(fin.buffer)]), out = new Uint8Array(todo.reduce(function (s, p) { return s + p.length; }, 0)), q = 0;
    todo.forEach(function (p) { out.set(p, q); q += p.length; });
    return out;
  }

  function descargar(datos, nombre, tipo) {
    var url = URL.createObjectURL(new Blob([datos], { type: tipo }));
    var a = document.createElement('a'); a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  // ── API ──────────────────────────────────────────────────────────────────────────
  function exportar(formato, id, titulo, ventana) {
    var escena = escenaPrincipal(ventana);
    if (!escena) throw new Error('El visor todavía no termina de cargar el modelo.');
    var mm = MM_POR_UNIDAD[id] || MM_DEFECTO;
    var piezas = recolectar(escena, mm);
    if (!piezas.length) throw new Error('No hay piezas visibles para exportar.');
    var base = (id || 'modelo').replace(/[^\w-]+/g, '-');
    var tris = piezas.reduce(function (s, p) { return s + p.tri.length / 3; }, 0);
    if (formato === 'obj') {
      var r = obj(piezas, base, titulo);
      var leeme = titulo + '\r\nReyEngi · Visores 3D\r\n\r\nUnidades: milímetros. Eje Z hacia arriba.\r\n' +
        'Revit 2025+: Insertar > Vincular CAD > ' + base + '.obj\r\nSolidWorks: Abrir > tipo Mesh (*.obj), importar como cuerpo de malla o de gráficos.\r\n' +
        'Mantener ' + base + '.mtl junto al .obj para conservar los colores.\r\n';
      descargar(zip([{ nombre: base + '.obj', datos: r.obj }, { nombre: base + '.mtl', datos: r.mtl }, { nombre: 'LEEME.txt', datos: leeme }]), base + '-obj.zip', 'application/zip');
    } else if (formato === 'stl') {
      descargar(stl(piezas, titulo), base + '.stl', 'model/stl');
    } else if (formato === 'dxf') {
      descargar(dxf(piezas, titulo), base + '-3d.dxf', 'application/dxf');
    } else throw new Error('Formato no soportado: ' + formato);
    return { piezas: piezas.length, triangulos: tris };
  }

  window.RE3D = { exportar: exportar, _int: { recolectar: recolectar, obj: obj, stl: stl, dxf: dxf, escenaPrincipal: escenaPrincipal, MM_POR_UNIDAD: MM_POR_UNIDAD } };
})();
