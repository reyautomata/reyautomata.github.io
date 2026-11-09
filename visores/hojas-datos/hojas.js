/* Hojas de datos · armado de la hoja, edición, PDF y Excel · ReyEngi
 *
 * Una sola "grilla" (celdas con fila, columna, combinaciones y estilo) alimenta las dos salidas:
 * la vista HTML imprimible (PDF) y el archivo Excel. Así ambas quedan idénticas.
 */
(function () {
  'use strict';

  var HD = window.HD, XL = window.XLSX_RE;
  var TA = HD.TA;
  var CLAVE = 'reyengi-hd-v1:';
  var LOGO = '../../img/logo-reyengi.png';

  // ── Persistencia (localStorage, siempre con try/catch) ───────────────────────
  // Los datos viven en el proyecto activo (ver ../proyectos.js); sin ese módulo se usa la clave antigua
  var PR = window.REProyectos;
  function leer(k, def) {
    if (PR) return k === 'proyecto' ? PR.datos() : PR.leer(k, def);
    try { var v = localStorage.getItem(CLAVE + k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function guardar(k, v) {
    if (PR) {
      if (k === 'proyecto') { var d = PR.activo(); PR.guardar(d.id, Object.assign(d, v)); } else PR.escribir(k, v);
      return;
    }
    try { localStorage.setItem(CLAVE + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
  }
  function borrar(k) {
    if (PR) {
      if (k === 'proyecto') { var d = PR.activo(); PR.guardar(d.id, Object.assign({}, PR.DEFECTO, { nombre: d.nombre })); } else PR.borrar(k);
      return;
    }
    try { localStorage.removeItem(CLAVE + k); } catch (e) {}
  }

  function proyecto() { return Object.assign({}, HD.proyecto, leer('proyecto', {})); }
  function datosHoja(id) { return leer('hoja:' + id, { v: {}, apl: null, prov: {}, notas: [], revs: null }); }

  // ── Utilidades ────────────────────────────────────────────────────────────────
  function numCL(s) { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')); }
  function fmtCL(n, dec) { return n.toFixed(dec).replace('.', ','); }
  function presionBarometrica(altura) {
    var h = numCL(altura);
    if (!isFinite(h)) return '';
    return fmtCL(101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588), 1);
  }
  function hoy() {
    var d = new Date();
    return ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + String(d.getFullYear()).slice(-2);
  }
  function plantilla(id) { return HD.plantillas.filter(function (p) { return p.id === id; })[0]; }
  function numeroDoc(p, pr) {
    var i = HD.plantillas.indexOf(p) + 1;
    return (pr.prefijo || '') + ('000' + i).slice(-4);
  }

  // Valor de sitio a partir de los datos del proyecto
  function valorSitio(k, pr) {
    switch (k) {
      case 'temp': return [pr.tMin, pr.tNor, pr.tMax];
      case 'hr': return [pr.hrMin, pr.hrNor, pr.hrMax];
      case 'patm': return presionBarometrica(pr.altura);
      default: return pr[k] || '';
    }
  }

  // ── Grilla ─────────────────────────────────────────────────────────────────────
  // Columnas de la hoja de datos (12): sección, ítem, descripción ×3, unidad, especificado ×3, propuesto ×3
  var ANCHOS = [3.4, 3.6, 12, 11, 9, 8, 10.5, 10.5, 10.5, 9, 9, 9];
  var FILAS_CAB = 7;          // filas de encabezado que se repiten en cada página
  var CAPACIDAD = 44;         // filas de cuerpo por página A4 vertical

  function Grilla() { this.celdas = []; this.paginas = []; this.altos = {}; }
  Grilla.prototype.c = function (r, c, v, cls, op) {
    op = op || {};
    this.celdas.push({ r: r, c: c, rs: op.rs || 1, cs: op.cs || 1, v: v === undefined || v === null ? '' : v, cls: cls, key: op.key, ph: op.ph });
  };

  function cabecera(g, p, pr) {
    var doc = numeroDoc(p, pr);
    g.c(0, 0, '', 'logo', { cs: 6 });
    g.c(0, 6, 'ReyEngi · Automatización y Control Industrial', 'marca', { cs: 6 });
    g.altos[0] = 30;
    g.c(1, 0, 'PROYECTO', 'lbl', { cs: 3 }); g.c(1, 3, pr.proyecto, 'vcab', { cs: 3 }); g.c(1, 6, 'HOJA DE DATOS', 'lbl c', { cs: 6 });
    g.c(2, 0, 'CLIENTE', 'lbl', { cs: 3 }); g.c(2, 3, pr.cliente, 'vcab', { cs: 3 });
    g.c(2, 6, p.hoja, 'tit', { cs: 3, rs: 4 });
    g.c(2, 9, 'REG', 'lbl c'); g.c(2, 10, 'ING', 'lbl c'); g.c(2, 11, 'FECHA', 'lbl c');
    g.c(3, 0, 'UBICACIÓN', 'lbl', { cs: 3 }); g.c(3, 3, pr.ubicacion, 'vcab', { cs: 3 });
    g.c(3, 9, 'POR', 'lbl c'); g.c(3, 10, pr.por, 'vcab c'); g.c(3, 11, pr.porFecha || hoy(), 'vcab c');
    g.c(4, 0, 'N° PROYECTO', 'lbl', { cs: 3 }); g.c(4, 3, pr.numero, 'vcab'); g.c(4, 4, 'REV.', 'lbl c'); g.c(4, 5, pr.rev, 'vcab c');
    g.c(4, 9, 'REV', 'lbl c'); g.c(4, 10, pr.reviso, 'vcab c'); g.c(4, 11, pr.revisoFecha, 'vcab c');
    g.c(5, 0, 'DOC. N°', 'lbl', { cs: 3 }); g.c(5, 3, doc, 'vcab', { cs: 3 });
    g.c(5, 9, 'APR', 'lbl c'); g.c(5, 10, pr.aprobo, 'vcab c'); g.c(5, 11, pr.aproboFecha, 'vcab c');
    g.c(6, 0, 'ITEM', 'th', { cs: 2 }); g.c(6, 2, 'DESCRIPCIÓN', 'th', { cs: 3 }); g.c(6, 5, 'UNIDAD', 'th');
    g.c(6, 6, 'ESPECIFICADO', 'th', { cs: 3 }); g.c(6, 9, 'PROPUESTO', 'th', { cs: 3 });
  }

  // Bloques del cuerpo: cada bloque es una lista de filas que no se separan entre páginas
  function bloques(p, pr, dat) {
    var out = [], n = 0;
    p.secciones.forEach(function (sec, si) {
      var filas = sec.r.map(function (f, fi) {
        n++;
        var k = si + '.' + fi;
        var e = f.e;
        if (e && e.sitio) e = valorSitio(e.sitio, pr);
        if (e && e.mnm) e = e.mnm;
        var guard = dat.v['e:' + k];
        if (guard !== undefined) e = guard;
        return { n: n, k: k, d: f.d, u: f.u, e: e, p: dat.v['p:' + k], sec: sec.s };
      });
      // Agrupar filas consecutivas "Ver Tabla de Aplicación"
      var i = 0;
      while (i < filas.length) {
        var f = filas[i];
        if (f.e === TA) {
          var j = i;
          while (j + 1 < filas.length && filas[j + 1].e === TA && j - i < 5) j++;
          out.push({ sec: sec.s, tipo: 'ta', filas: filas.slice(i, j + 1) });
          i = j + 1;
        } else {
          out.push({ sec: sec.s, tipo: Array.isArray(f.e) ? 'mnm' : 'simple', filas: [f] });
          i++;
        }
      }
    });
    return out;
  }
  function altoBloque(b) { return b.tipo === 'mnm' ? 2 : b.filas.length; }

  function cuerpo(g, bl, r0) {
    // Paginación
    var paginas = [[]], usado = 0;
    bl.forEach(function (b) {
      var h = altoBloque(b);
      if (usado + h > CAPACIDAD && paginas[paginas.length - 1].length) { paginas.push([]); usado = 0; }
      paginas[paginas.length - 1].push(b); usado += h;
    });
    var r = r0;
    paginas.forEach(function (pag) {
      var inicio = r;
      var corridas = []; // secciones dentro de la página para la etiqueta vertical
      pag.forEach(function (b) {
        var h = altoBloque(b);
        var ult = corridas[corridas.length - 1];
        if (ult && ult.sec === b.sec) ult.h += h; else corridas.push({ sec: b.sec, r: r, h: h });
        if (b.tipo === 'mnm') {
          var f = b.filas[0];
          g.c(r, 1, f.n, 'n', { rs: 2 });
          g.c(r, 2, f.d, 'd', { cs: 3, rs: 2 });
          g.c(r, 5, f.u, 'u', { rs: 2 });
          g.c(r, 6, 'Mín', 'mh'); g.c(r, 7, 'Normal', 'mh'); g.c(r, 8, 'Máx', 'mh');
          for (var q = 0; q < 3; q++) g.c(r + 1, 6 + q, f.e[q], 'e', { key: 'e:' + f.k + ':' + q });
          g.c(r, 9, f.p, 'p', { cs: 3, rs: 2, key: 'p:' + f.k });
        } else {
          b.filas.forEach(function (f, i) {
            g.c(r + i, 1, f.n, 'n');
            g.c(r + i, 2, f.d, 'd', { cs: 3 });
            g.c(r + i, 5, f.u, 'u');
            g.c(r + i, 9, f.p, 'p', { cs: 3, key: 'p:' + f.k });
          });
          var f0 = b.filas[0];
          g.c(r, 6, f0.e, b.tipo === 'ta' ? 'e ta' : 'e', { cs: 3, rs: b.filas.length, key: 'e:' + f0.k });
        }
        r += h;
      });
      corridas.forEach(function (c) { g.c(c.r, 0, c.sec, 'sec', { rs: c.h }); });
      g.paginas.push({ desde: inicio, hasta: r - 1, orient: 'v' });
    });
    return r;
  }

  function anexos(g, p, pr, dat, r) {
    var inicio = r;
    g.c(r, 0, 'ANTECEDENTES PROVEEDOR', 'th', { cs: 12 }); r++;
    var campos = [['PROVEEDOR', 'PLAZO DE ENTREGA', 'OFERTA N°'], ['REPRESENTANTE', 'LUGAR DE ENTREGA', 'REVISIÓN'],
      ['DIRECCIÓN', 'TRANSPORTE', 'FECHA'], ['TELÉFONO', 'GARANTÍA', 'CORREO']];
    campos.forEach(function (fila) {
      g.c(r, 0, fila[0], 'lbl2', { cs: 2 }); g.c(r, 2, dat.prov[fila[0]], 'p', { cs: 3, key: 'prov:' + fila[0] });
      g.c(r, 5, fila[1], 'lbl2', { cs: 2 }); g.c(r, 7, dat.prov[fila[1]], 'p', { cs: 2, key: 'prov:' + fila[1] });
      g.c(r, 9, fila[2], 'lbl2'); g.c(r, 10, dat.prov[fila[2]], 'p', { cs: 2, key: 'prov:' + fila[2] });
      r++;
    });
    r++;
    g.c(r, 0, 'NOTAS', 'th', { cs: 12 }); r++;
    var notas = HD.notasGenerales.concat(p.notas || []);
    var extra = dat.notas || [];
    var total = Math.max(notas.length + extra.length + 2, 8);
    var r1 = r;
    for (var i = 0; i < total; i++) {
      g.c(r, 1, i + 1, 'n');
      if (i < notas.length) g.c(r, 2, notas[i], 'nota', { cs: 10 });
      else g.c(r, 2, extra[i - notas.length] || '', 'nota ed', { cs: 10, key: 'nota:' + (i - notas.length) });
      r++;
    }
    g.c(r1, 0, 'NOTAS', 'sec', { rs: total });
    r++;
    g.c(r, 0, 'CONTROL DE REVISIONES', 'th', { cs: 12 }); r++;
    g.c(r, 0, 'REV', 'sub', { cs: 2 }); g.c(r, 2, 'FECHA', 'sub'); g.c(r, 3, 'DESCRIPCIÓN', 'sub', { cs: 4 });
    g.c(r, 7, 'POR', 'sub', { cs: 2 }); g.c(r, 9, 'REVISÓ', 'sub'); g.c(r, 10, 'APROBÓ', 'sub', { cs: 2 });
    r++;
    var revs = dat.revs || [[pr.rev, pr.porFecha || hoy(), 'Emitida para cotización', pr.por, pr.reviso, pr.aprobo]];
    for (var k = 0; k < Math.max(revs.length + 1, 4); k++) {
      var rv = revs[k] || [];
      g.c(r, 0, rv[0], 'p', { cs: 2, key: 'rev:' + k + ':0' }); g.c(r, 2, rv[1], 'p', { key: 'rev:' + k + ':1' });
      g.c(r, 3, rv[2], 'p izq', { cs: 4, key: 'rev:' + k + ':2' }); g.c(r, 7, rv[3], 'p', { cs: 2, key: 'rev:' + k + ':3' });
      g.c(r, 9, rv[4], 'p', { key: 'rev:' + k + ':4' }); g.c(r, 10, rv[5], 'p', { cs: 2, key: 'rev:' + k + ':5' });
      r++;
    }
    g.paginas.push({ desde: inicio, hasta: r - 1, orient: 'v' });
    return r;
  }

  function hojaDatos(p, pr, dat) {
    var g = new Grilla();
    g.anchos = ANCHOS;
    cabecera(g, p, pr);
    var r = cuerpo(g, bloques(p, pr, dat), FILAS_CAB);
    anexos(g, p, pr, dat, r);
    g.filasCab = FILAS_CAB;
    return g;
  }

  // Tabla de aplicación (hoja horizontal)
  function filasAplicacion(p, dat) {
    return (dat.apl || p.aplicacion.filas).map(function (f) { return f.slice(); });
  }
  function tablaAplicacion(p, pr, dat) {
    var g = new Grilla();
    var cols = [];
    p.aplicacion.columnas.forEach(function (c) {
      if (c.sub) c.sub.forEach(function () { cols.push(c.w); }); else cols.push(c.w);
    });
    var N = cols.length;
    g.anchos = cols;
    // Cabecera compacta
    var mitad = Math.max(2, Math.floor(N * 0.55));
    g.c(0, 0, '', 'logo', { cs: mitad }); g.c(0, mitad, 'ReyEngi · Automatización y Control Industrial', 'marca', { cs: N - mitad });
    g.altos[0] = 30;
    g.c(1, 0, 'PROYECTO', 'lbl'); g.c(1, 1, pr.proyecto, 'vcab', { cs: mitad - 1 }); g.c(1, mitad, 'TABLA DE APLICACIÓN', 'lbl c', { cs: N - mitad });
    g.c(2, 0, 'CLIENTE', 'lbl'); g.c(2, 1, pr.cliente, 'vcab', { cs: mitad - 1 }); g.c(2, mitad, p.hoja, 'tit', { cs: N - mitad, rs: 3 });
    g.c(3, 0, 'UBICACIÓN', 'lbl'); g.c(3, 1, pr.ubicacion, 'vcab', { cs: mitad - 1 });
    g.c(4, 0, 'DOC. N°', 'lbl'); g.c(4, 1, numeroDoc(p, pr) + '   ·   REV. ' + (pr.rev || ''), 'vcab', { cs: mitad - 1 });
    var r = 5, conSub = p.aplicacion.columnas.some(function (c) { return c.sub; });
    var c = 0;
    p.aplicacion.columnas.forEach(function (col) {
      if (col.sub) {
        g.c(r, c, col.t, 'th', { cs: col.sub.length });
        col.sub.forEach(function (s, i) { g.c(r + 1, c + i, s, 'th'); });
        c += col.sub.length;
      } else {
        g.c(r, c, col.t, 'th', { rs: conSub ? 2 : 1 });
        c++;
      }
    });
    r += conSub ? 2 : 1;
    var cab = r;
    filasAplicacion(p, dat).forEach(function (fila, i) {
      for (var j = 0; j < N; j++) g.c(r, j, fila[j], j === 0 ? 'p tag' : 'p', { key: 'apl:' + i + ':' + j });
      g.altos[r] = 24;
      r++;
    });
    g.filasApl = { desde: cab, hasta: r - 1, n: N };
    g.filasCab = cab;
    g.c(r, 0, 'NOTAS', 'th', { cs: N }); r++;
    var notasApl = ['Valores de proceso referenciales: deben confirmarse con el balance de masa y los P&ID vigentes.',
      'La columna DETALLE DE MONTAJE indica el código del visor 3D correspondiente.', ''];
    notasApl.forEach(function (t, i) { g.c(r, 0, i + 1, 'n'); g.c(r, 1, t, 'nota', { cs: N - 1 }); r++; });
    g.paginas.push({ desde: cab, hasta: r - 1, orient: 'h' });
    return g;
  }

  // ── HTML ────────────────────────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tablaHtml(g, filasIncluidas, anchoMm) {
    var total = g.anchos.reduce(function (s, w) { return s + w; }, 0);
    var h = ['<table class="hd"><colgroup>'];
    g.anchos.forEach(function (w) { h.push('<col style="width:' + (w / total * anchoMm).toFixed(2) + 'mm">'); });
    h.push('</colgroup><tbody>');
    // Las filas incluidas no son necesariamente consecutivas en la grilla (cabecera + página)
    var map = {};
    filasIncluidas.forEach(function (r, i) { map[r] = i; });
    var porFila = {};
    g.celdas.forEach(function (c) { if (map[c.r] !== undefined) (porFila[c.r] = porFila[c.r] || []).push(c); });
    filasIncluidas.forEach(function (r) {
      var alto = g.altos[r] ? ' style="height:' + (g.altos[r] * 0.3528).toFixed(1) + 'mm"' : '';
      h.push('<tr' + alto + '>');
      (porFila[r] || []).sort(function (a, b) { return a.c - b.c; }).forEach(function (c) {
        var attrs = ' class="' + c.cls + '"';
        if (c.cs > 1) attrs += ' colspan="' + c.cs + '"';
        if (c.rs > 1) attrs += ' rowspan="' + c.rs + '"';
        if (c.key) attrs += ' data-k="' + escHtml(c.key) + '" contenteditable="true" spellcheck="false"';
        var v = c.cls === 'logo' ? '<img src="' + LOGO + '" alt="ReyEngi">' : (c.cls === 'sec' ? '<span>' + escHtml(c.v) + '</span>' : escHtml(c.v));
        h.push('<td' + attrs + '>' + v + '</td>');
      });
      h.push('</tr>');
    });
    h.push('</tbody></table>');
    return h.join('');
  }

  function rango(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }

  function htmlHoja(p) {
    var pr = proyecto(), dat = datosHoja(p.id);
    var g = hojaDatos(p, pr, dat), ga = tablaAplicacion(p, pr, dat);
    var pags = [];
    var cab = rango(0, g.filasCab - 1);
    var totalPag = g.paginas.length + 1;
    g.paginas.forEach(function (pg, i) {
      pags.push('<section class="pagina">' + tablaHtml(g, cab.concat(rango(pg.desde, pg.hasta)), 194) +
        '<div class="pie"><span>' + escHtml(numeroDoc(p, pr)) + '</span><span>Página ' + (i + 1) + ' de ' + totalPag + '</span></div></section>');
    });
    var cabA = rango(0, ga.filasCab - 1);
    pags.push('<section class="pagina horizontal">' + tablaHtml(ga, cabA.concat(rango(ga.paginas[0].desde, ga.paginas[0].hasta)), 281) +
      '<div class="acciones-apl no-imprimir"><button type="button" data-accion="fila-mas">+ Agregar TAG</button><button type="button" data-accion="fila-menos">− Quitar último</button></div>' +
      '<div class="pie"><span>' + escHtml(numeroDoc(p, pr)) + '</span><span>Página ' + totalPag + ' de ' + totalPag + '</span></div></section>');
    return pags.join('');
  }

  // Guarda una celda editada
  function guardarCelda(id, key, valor) {
    var p = plantilla(id), dat = datosHoja(id);
    var partes = key.split(':');
    if (partes[0] === 'e' || partes[0] === 'p') {
      if (partes.length === 3) {
        var base = 'e:' + partes[1];
        var actual = dat.v[base];
        if (!Array.isArray(actual)) {
          // tomar los valores actuales desde la plantilla/proyecto
          var si = +partes[1].split('.')[0], fi = +partes[1].split('.')[1];
          var e = p.secciones[si].r[fi].e;
          actual = e && e.sitio ? valorSitio(e.sitio, proyecto()) : (e && e.mnm ? e.mnm.slice() : ['', '', '']);
          actual = actual.slice();
        }
        actual[+partes[2]] = valor;
        dat.v[base] = actual;
      } else {
        dat.v[key] = valor;
      }
    } else if (partes[0] === 'prov') {
      dat.prov[partes[1]] = valor;
    } else if (partes[0] === 'nota') {
      dat.notas[+partes[1]] = valor;
    } else if (partes[0] === 'rev') {
      var pr = proyecto();
      dat.revs = dat.revs || [[pr.rev, pr.porFecha || hoy(), 'Emitida para cotización', pr.por, pr.reviso, pr.aprobo]];
      while (dat.revs.length <= +partes[1]) dat.revs.push(['', '', '', '', '', '']);
      dat.revs[+partes[1]][+partes[2]] = valor;
    } else if (partes[0] === 'apl') {
      dat.apl = filasAplicacion(p, dat);
      dat.apl[+partes[1]][+partes[2]] = valor;
    }
    guardar('hoja:' + id, dat);
  }

  function filaAplicacion(id, delta) {
    var p = plantilla(id), dat = datosHoja(id);
    dat.apl = filasAplicacion(p, dat);
    var n = p.aplicacion.columnas.reduce(function (s, c) { return s + (c.sub ? c.sub.length : 1); }, 0);
    if (delta > 0) dat.apl.push(new Array(n).fill(''));
    else if (dat.apl.length > 1) dat.apl.pop();
    guardar('hoja:' + id, dat);
  }

  // ── Excel ─────────────────────────────────────────────────────────────────────────
  var NAVY = '022A55', NARANJA = 'EF5A05', CLARO = 'DCE3EB', ITEM = '2E4A6B';
  function estiloXl(cls) {
    var k = cls.split(' ');
    var has = function (x) { return k.indexOf(x) >= 0; };
    var e;
    switch (k[0]) {
      case 'logo': e = { borde: 'none' }; break;
      case 'marca': e = { borde: 'none', h: 'right', v: 'bottom', color: '5A6573', sz: 8, i: true }; break;
      case 'lbl': e = { b: true, fill: NAVY, color: 'FFFFFF', sz: 8 }; break;
      case 'lbl2': e = { b: true, fill: CLARO, color: NAVY, sz: 8 }; break;
      case 'vcab': e = { sz: 8, color: '1F2A36' }; break;
      case 'tit': e = { b: true, sz: 11, h: 'center', color: NAVY }; break;
      case 'th': e = { b: true, fill: NAVY, color: 'FFFFFF', h: 'center', sz: 8 }; break;
      case 'sub': e = { b: true, fill: CLARO, color: NAVY, h: 'center', sz: 8 }; break;
      case 'sec': e = { b: true, fill: CLARO, color: NAVY, h: 'center', rot: 90, sz: 7 }; break;
      case 'n': e = { b: true, fill: ITEM, color: 'FFFFFF', h: 'center', sz: 8 }; break;
      case 'd': e = { sz: 8.5 }; break;
      case 'u': e = { sz: 8, h: 'center' }; break;
      case 'mh': e = { b: true, sz: 7.5, h: 'center', fill: 'F1F4F7' }; break;
      case 'e': e = { sz: 8.5, h: 'center', i: has('ta') }; break;
      case 'p': e = { sz: 8.5, h: has('izq') ? 'left' : 'center', b: has('tag') }; break;
      case 'nota': e = { sz: 8.5 }; break;
      default: e = { sz: 9 };
    }
    if (has('c')) e.h = 'center';
    return e;
  }

  function volcar(g, hoja, logo) {
    hoja.cols(g.anchos);
    g.celdas.forEach(function (c) {
      var e = estiloXl(c.cls);
      var v = c.v;
      if (typeof v === 'number') v = String(v);
      if (c.rs > 1 || c.cs > 1) hoja.combinar(c.r, c.c, c.r + c.rs - 1, c.c + c.cs - 1, v, e);
      else hoja.celda(c.r, c.c, v, e);
    });
    Object.keys(g.altos).forEach(function (r) { hoja.alto(+r, g.altos[r]); });
    // Excel no ajusta el alto de filas con texto largo en celdas combinadas: se estima aquí
    var lineas = {};
    g.celdas.forEach(function (c) {
      if (c.cls === 'logo' || c.cls === 'marca' || c.cls === 'sec' || c.v === '' || c.v === null) return;
      var ancho = 0;
      for (var k = 0; k < c.cs; k++) ancho += g.anchos[c.c + k] || 8;
      var n = Math.ceil(String(c.v).length / Math.max(4, ancho * 1.45)) / c.rs;
      lineas[c.r] = Math.max(lineas[c.r] || 1, n);
    });
    var maxR = g.celdas.reduce(function (m, c) { return Math.max(m, c.r + c.rs - 1); }, 0);
    for (var r = 1; r <= maxR; r++) {
      if (g.altos[r]) continue;
      var nl = Math.ceil(lineas[r] || 1);
      hoja.alto(r, nl > 1 ? 11 * nl + 3 : 14);
    }
    if (logo) hoja.imagen(logo, 0, 0, 125, 35, 4, 3);
    hoja.filasTitulo(0, g.filasCab - 1);
  }

  function agregarHojas(libro, p, logo) {
    var pr = proyecto(), dat = datosHoja(p.id);
    var g = hojaDatos(p, pr, dat);
    var h = libro.hoja(p.tag + ' ' + p.titulo, { orientacion: 'portrait', pie: numeroDoc(p, pr) + ' · ' + p.hoja });
    volcar(g, h, logo);
    g.paginas.forEach(function (pg, i) { if (i > 0) h.salto(pg.desde); });
    var ga = tablaAplicacion(p, pr, dat);
    var ha = libro.hoja('TA ' + p.tag + ' ' + p.titulo, { orientacion: 'landscape', pie: numeroDoc(p, pr) + ' · Tabla de aplicación' });
    volcar(ga, ha, logo);
  }

  function hojaIndice(libro, lista) {
    var pr = proyecto();
    var h = libro.hoja('Índice', { orientacion: 'portrait' });
    h.cols([22, 7, 44, 24, 30]);
    h.combinar(0, 0, 0, 4, 'HOJAS DE DATOS DE INSTRUMENTOS · ' + pr.proyecto, { b: true, sz: 12, color: NAVY, borde: 'none' });
    h.alto(0, 26);
    h.combinar(1, 0, 1, 4, pr.cliente + ' · ' + pr.ubicacion + ' · Rev. ' + pr.rev, { sz: 9, color: '5A6573', borde: 'none' });
    ['DOC. N°', 'TAG', 'INSTRUMENTO', 'VISOR 3D', 'TAGS EN TABLA'].forEach(function (t, i) { h.celda(3, i, t, { b: true, fill: NAVY, color: 'FFFFFF', h: 'center', sz: 8 }); });
    lista.forEach(function (p, i) {
      var dat = datosHoja(p.id);
      var r = 4 + i;
      h.alto(r, 24);
      h.celda(r, 0, numeroDoc(p, pr), { sz: 9 });
      h.celda(r, 1, p.tag, { sz: 9, h: 'center', b: true });
      h.celda(r, 2, p.hoja, { sz: 9 });
      h.celda(r, 3, (p.visores || []).join(', '), { sz: 8, color: '5A6573' });
      h.celda(r, 4, filasAplicacion(p, dat).map(function (f) { return f[0]; }).filter(Boolean).join(', '), { sz: 8 });
    });
  }

  function cargarLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.arrayBuffer() : null; })
      .then(function (b) { return b ? new Uint8Array(b) : null; })
      .catch(function () { return null; });
  }

  function descargar(bytes, nombre) {
    var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportarExcel(ids) {
    return cargarLogo().then(function (logo) {
      var pr = proyecto();
      var lista = ids.map(plantilla).filter(Boolean);
      var libro = XL.libro();
      libro.titulo = 'Hojas de datos · ' + pr.proyecto;
      libro.autor = 'ReyEngi';
      if (lista.length > 1) hojaIndice(libro, lista);
      lista.forEach(function (p) { agregarHojas(libro, p, logo); });
      var nombre = lista.length === 1 ? numeroDoc(lista[0], pr) + ' ' + lista[0].titulo : (pr.prefijo || 'Hojas-de-datos') + 'Hojas de datos';
      descargar(XL.generar(libro), nombre.replace(/[\\/:*?"<>|]+/g, '-') + '.xlsx');
    });
  }

  window.HDApp = {
    proyecto: proyecto, guardarProyecto: function (v) { guardar('proyecto', v); },
    reiniciarProyecto: function () { borrar('proyecto'); },
    reiniciarHoja: function (id) { borrar('hoja:' + id); },
    datosHoja: datosHoja, plantilla: plantilla, numeroDoc: numeroDoc, presionBarometrica: presionBarometrica,
    htmlHoja: htmlHoja, guardarCelda: guardarCelda, filaAplicacion: filaAplicacion,
    exportarExcel: exportarExcel, filasAplicacion: filasAplicacion,
    _grillas: { hojaDatos: hojaDatos, tablaAplicacion: tablaAplicacion }
  };
})();
