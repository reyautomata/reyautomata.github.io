/* Escritor mínimo de archivos Excel (.xlsx) sin dependencias externas · ReyEngi
 *
 * Soporta: varias hojas, celdas de texto, estilos (fuente, relleno, bordes, alineación,
 * texto vertical), celdas combinadas, anchos de columna, altos de fila, imagen PNG (logo),
 * configuración de impresión (A4, orientación, ajustar al ancho, filas de título, saltos).
 *
 *   var libro = XLSX.libro();
 *   var h = libro.hoja('PIT', { orientacion: 'portrait' });
 *   h.cols([5, 30, 10]);
 *   h.celda(0, 0, 'Hola', { b: true, fill: '022A55', color: 'FFFFFF' });
 *   h.combinar(1, 0, 1, 2, 'Texto en tres columnas', { h: 'center' });
 *   var bytes = XLSX.generar(libro);  // Uint8Array
 */
(function () {
  'use strict';

  // ── ZIP (método "store", sin compresión) ─────────────────────────────────────
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(b) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  var enc = new TextEncoder();

  function zip(archivos) {
    var partes = [], central = [], offset = 0;
    var d = new Date();
    var hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    archivos.forEach(function (a) {
      var nombre = enc.encode(a.nombre);
      var datos = typeof a.datos === 'string' ? enc.encode(a.datos) : a.datos;
      var crc = crc32(datos);
      var loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
      loc.setUint16(8, 0, true); loc.setUint16(10, hora, true); loc.setUint16(12, fecha, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, datos.length, true); loc.setUint32(22, datos.length, true);
      loc.setUint16(26, nombre.length, true); loc.setUint16(28, 0, true);
      partes.push(new Uint8Array(loc.buffer), nombre, datos);
      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true); cen.setUint16(12, hora, true);
      cen.setUint16(14, fecha, true); cen.setUint32(16, crc, true); cen.setUint32(20, datos.length, true);
      cen.setUint32(24, datos.length, true); cen.setUint16(28, nombre.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nombre);
      offset += 30 + nombre.length + datos.length;
    });
    var tamCentral = central.reduce(function (s, p) { return s + p.length; }, 0);
    var fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
    var todo = partes.concat(central, [new Uint8Array(fin.buffer)]);
    var total = todo.reduce(function (s, p) { return s + p.length; }, 0);
    var out = new Uint8Array(total), pos = 0;
    todo.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  // ── Utilidades ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }
  function col(c) { var s = ''; c++; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }
  function ref(r, c) { return col(c) + (r + 1); }

  // ── Estilos ──────────────────────────────────────────────────────────────────────
  function Estilos() {
    this.fonts = ['<font><sz val="9"/><name val="Arial"/><family val="2"/></font>'];
    this.fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
    this.borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
    this.xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
    this.mapa = {};
  }
  Estilos.prototype.indice = function (lista, xml) {
    var i = lista.indexOf(xml);
    if (i < 0) { lista.push(xml); i = lista.length - 1; }
    return i;
  };
  // e: { b, i, sz, color, fill, h, v, wrap, rot, borde: 'thin'|'medium'|'none' }
  Estilos.prototype.id = function (e) {
    if (!e) return 0;
    var k = JSON.stringify(e);
    if (this.mapa[k] !== undefined) return this.mapa[k];
    var font = '<font>' + (e.b ? '<b/>' : '') + (e.i ? '<i/>' : '') + '<sz val="' + (e.sz || 9) + '"/>' +
      (e.color ? '<color rgb="FF' + e.color + '"/>' : '') + '<name val="Arial"/><family val="2"/></font>';
    var fontId = this.indice(this.fonts, font);
    var fillId = e.fill ? this.indice(this.fills, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + e.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0;
    var bw = e.borde === undefined ? 'thin' : e.borde;
    var borderId = 0;
    if (bw && bw !== 'none') {
      var lado = function (n) { return '<' + n + ' style="' + bw + '"><color rgb="FF1F2A36"/></' + n + '>'; };
      borderId = this.indice(this.borders, '<border>' + lado('left') + lado('right') + lado('top') + lado('bottom') + '<diagonal/></border>');
    }
    var al = '<alignment horizontal="' + (e.h || 'left') + '" vertical="' + (e.v || 'center') + '"' +
      (e.wrap !== false ? ' wrapText="1"' : '') + (e.rot ? ' textRotation="' + e.rot + '"' : '') + '/>';
    var xf = '<xf numFmtId="0" fontId="' + fontId + '" fillId="' + fillId + '" borderId="' + borderId + '" xfId="0" applyFont="1"' +
      (fillId ? ' applyFill="1"' : '') + (borderId ? ' applyBorder="1"' : '') + ' applyAlignment="1">' + al + '</xf>';
    var id = this.indice(this.xfs, xf);
    this.mapa[k] = id;
    return id;
  };
  Estilos.prototype.xml = function () {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="' + this.fonts.length + '">' + this.fonts.join('') + '</fonts>' +
      '<fills count="' + this.fills.length + '">' + this.fills.join('') + '</fills>' +
      '<borders count="' + this.borders.length + '">' + this.borders.join('') + '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + this.xfs.length + '">' + this.xfs.join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  };

  // ── Hoja ──────────────────────────────────────────────────────────────────────────
  function Hoja(nombre, op) {
    this.nombre = nombre.replace(/[\\/?*[\]:]/g, '-').slice(0, 31);
    this.op = op || {};
    this._cols = [];
    this.filas = {};   // r -> { c -> {v, e} }
    this.altos = {};
    this.combinadas = [];
    this.saltos = [];
    this.titulos = null;
    this.imagenes = [];
  }
  Hoja.prototype.cols = function (anchos) { this._cols = anchos; return this; };
  Hoja.prototype.alto = function (r, h) { this.altos[r] = h; return this; };
  Hoja.prototype.celda = function (r, c, v, e) {
    (this.filas[r] = this.filas[r] || {})[c] = { v: v, e: e };
    return this;
  };
  Hoja.prototype.combinar = function (r1, c1, r2, c2, v, e) {
    for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) this.celda(r, c, r === r1 && c === c1 ? v : null, e);
    if (r2 > r1 || c2 > c1) this.combinadas.push(ref(r1, c1) + ':' + ref(r2, c2));
    return this;
  };
  Hoja.prototype.salto = function (r) { this.saltos.push(r); return this; };
  Hoja.prototype.filasTitulo = function (r1, r2) { this.titulos = [r1, r2]; return this; };
  // bytes: Uint8Array PNG; ancho/alto en píxeles
  Hoja.prototype.imagen = function (bytes, r, c, ancho, alto, dx, dy) {
    this.imagenes.push({ bytes: bytes, r: r, c: c, w: ancho, h: alto, dx: dx || 0, dy: dy || 0 });
    return this;
  };

  Hoja.prototype.xml = function (estilos, conDibujo) {
    var self = this, x = [];
    var maxR = 0, maxC = 0;
    Object.keys(this.filas).forEach(function (r) {
      maxR = Math.max(maxR, +r);
      Object.keys(self.filas[r]).forEach(function (c) { maxC = Math.max(maxC, +c); });
    });
    x.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
    x.push('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
    x.push('<dimension ref="A1:' + ref(maxR, maxC) + '"/>');
    x.push('<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100"/></sheetViews>');
    x.push('<sheetFormatPr defaultRowHeight="15"/>');
    if (this._cols.length) {
      x.push('<cols>' + this._cols.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>');
    }
    x.push('<sheetData>');
    var filas = Object.keys(Object.assign({}, this.filas, this.altos)).map(Number).sort(function (a, b) { return a - b; });
    filas.forEach(function (r) {
      var celdas = self.filas[r] || {};
      var h = self.altos[r];
      x.push('<row r="' + (r + 1) + '"' + (h ? ' ht="' + h + '" customHeight="1"' : '') + '>');
      Object.keys(celdas).map(Number).sort(function (a, b) { return a - b; }).forEach(function (c) {
        var cel = celdas[c], s = estilos.id(cel.e);
        var v = cel.v;
        if (v === null || v === undefined || v === '') {
          x.push('<c r="' + ref(r, c) + '" s="' + s + '"/>');
        } else if (typeof v === 'number') {
          x.push('<c r="' + ref(r, c) + '" s="' + s + '"><v>' + v + '</v></c>');
        } else {
          x.push('<c r="' + ref(r, c) + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>');
        }
      });
      x.push('</row>');
    });
    x.push('</sheetData>');
    if (this.combinadas.length) {
      x.push('<mergeCells count="' + this.combinadas.length + '">' + this.combinadas.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>');
    }
    x.push('<printOptions horizontalCentered="1"/>');
    x.push('<pageMargins left="0.4" right="0.4" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>');
    x.push('<pageSetup paperSize="9" orientation="' + (this.op.orientacion || 'portrait') + '" fitToWidth="1" fitToHeight="0"/>');
    x.push('<headerFooter><oddFooter>&amp;L&amp;8' + esc(this.op.pie || '') + '&amp;R&amp;8Página &amp;P de &amp;N</oddFooter></headerFooter>');
    if (this.saltos.length) {
      x.push('<rowBreaks count="' + this.saltos.length + '" manualBreakCount="' + this.saltos.length + '">' +
        this.saltos.map(function (r) { return '<brk id="' + r + '" max="16383" man="1"/>'; }).join('') + '</rowBreaks>');
    }
    if (conDibujo) x.push('<drawing r:id="rId1"/>');
    x.push('</worksheet>');
    return x.join('');
  };

  // Ancho de columna Excel -> píxeles aproximados (Arial 9)
  function colPx(w) { return Math.round(w * 7 + 5); }

  function dibujoXml(hoja) {
    var x = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
    hoja.imagenes.forEach(function (im, i) {
      var EMU = 9525;
      x.push('<xdr:oneCellAnchor><xdr:from><xdr:col>' + im.c + '</xdr:col><xdr:colOff>' + im.dx * EMU + '</xdr:colOff><xdr:row>' + im.r +
        '</xdr:row><xdr:rowOff>' + im.dy * EMU + '</xdr:rowOff></xdr:from><xdr:ext cx="' + Math.round(im.w * EMU) + '" cy="' + Math.round(im.h * EMU) + '"/>' +
        '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' + (i + 2) + '" name="Logo ' + (i + 1) + '"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
        '<xdr:blipFill><a:blip r:embed="rId' + (i + 1) + '"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>' +
        '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + Math.round(im.w * EMU) + '" cy="' + Math.round(im.h * EMU) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>');
    });
    x.push('</xdr:wsDr>');
    return x.join('');
  }

  // ── Libro ─────────────────────────────────────────────────────────────────────────
  function Libro() { this.hojas = []; this.titulo = ''; this.autor = ''; }
  Libro.prototype.hoja = function (nombre, op) {
    var base = nombre.replace(/[\\/?*[\]:]/g, '-').slice(0, 31), n = base, k = 2;
    var usados = this.hojas.map(function (h) { return h.nombre.toLowerCase(); });
    while (usados.indexOf(n.toLowerCase()) >= 0) { n = base.slice(0, 28) + ' ' + k++; }
    var h = new Hoja(n, op);
    this.hojas.push(h);
    return h;
  };

  function generar(libro) {
    var estilos = new Estilos();
    var archivos = [], ct = [], wbRels = [], sheetsXml = [], nombres = [];
    var media = 0, dibujos = 0;

    libro.hojas.forEach(function (h, i) {
      var n = i + 1, conDibujo = h.imagenes.length > 0;
      archivos.push({ nombre: 'xl/worksheets/sheet' + n + '.xml', datos: h.xml(estilos, conDibujo) });
      ct.push('<Override PartName="/xl/worksheets/sheet' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
      wbRels.push('<Relationship Id="rId' + n + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + n + '.xml"/>');
      sheetsXml.push('<sheet name="' + esc(h.nombre) + '" sheetId="' + n + '" r:id="rId' + n + '"/>');
      if (h.titulos) {
        nombres.push('<definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">\'' + esc(h.nombre.replace(/'/g, "''")) + '\'!$' + (h.titulos[0] + 1) + ':$' + (h.titulos[1] + 1) + '</definedName>');
      }
      if (conDibujo) {
        dibujos++;
        archivos.push({ nombre: 'xl/worksheets/_rels/sheet' + n + '.xml.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing' + dibujos + '.xml"/></Relationships>' });
        archivos.push({ nombre: 'xl/drawings/drawing' + dibujos + '.xml', datos: dibujoXml(h) });
        ct.push('<Override PartName="/xl/drawings/drawing' + dibujos + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>');
        var rels = h.imagenes.map(function (im, j) {
          media++;
          archivos.push({ nombre: 'xl/media/image' + media + '.png', datos: im.bytes });
          return '<Relationship Id="rId' + (j + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image' + media + '.png"/>';
        });
        archivos.push({ nombre: 'xl/drawings/_rels/drawing' + dibujos + '.xml.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels.join('') + '</Relationships>' });
      }
    });

    var nh = libro.hojas.length;
    wbRels.push('<Relationship Id="rId' + (nh + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');

    var fecha = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var inicio = [
      { nombre: '[Content_Types].xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        (media ? '<Default Extension="png" ContentType="image/png"/>' : '') +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
        ct.join('') + '</Types>' },
      { nombre: '_rels/.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
      { nombre: 'docProps/core.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:title>' + esc(libro.titulo) + '</dc:title><dc:creator>' + esc(libro.autor) + '</dc:creator>' +
        '<dcterms:created xsi:type="dcterms:W3CDTF">' + fecha + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + fecha + '</dcterms:modified></cp:coreProperties>' },
      { nombre: 'docProps/app.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>ReyEngi Hojas de Datos</Application></Properties>' },
      { nombre: 'xl/workbook.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<bookViews><workbookView activeTab="0"/></bookViews><sheets>' + sheetsXml.join('') + '</sheets>' +
        (nombres.length ? '<definedNames>' + nombres.join('') + '</definedNames>' : '') + '</workbook>' },
      { nombre: 'xl/_rels/workbook.xml.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + wbRels.join('') + '</Relationships>' }
    ];
    // styles.xml se genera al final, cuando ya se registraron todos los estilos usados
    var todo = inicio.concat(archivos, [{ nombre: 'xl/styles.xml', datos: estilos.xml() }]);
    return zip(todo);
  }

  var XLSX = { libro: function () { return new Libro(); }, generar: generar, colPx: colPx, _zip: zip, _crc32: crc32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = XLSX;
  if (typeof window !== 'undefined') window.XLSX_RE = XLSX;
})();
