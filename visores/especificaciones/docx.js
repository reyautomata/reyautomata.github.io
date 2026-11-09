/* Escritor mínimo de documentos Word (.docx) sin dependencias · ReyEngi
 *
 *   var bytes = DOCX.generar({
 *     titulo, autor,
 *     encabezado: [[celda, celda, celda], ...],      // tabla del encabezado (texto; '{PAG}' = Página X de Y)
 *     bloques: [
 *       { h: 1..4, t: 'Título' }                        // títulos (entran al índice)
 *       { p: 'Texto', b?: true, c?: true, sz?: 20 }     // párrafo (c = centrado)
 *       { ul: ['...', '...'] }                          // viñetas
 *       { tabla: { anchos: [mm...], filas: [[...]], cab: n } }  // cab = filas de encabezado
 *       { indice: true }                                // tabla de contenido (Word la actualiza al abrir)
 *       { salto: true }                                 // salto de página
 *     ]
 *   });
 */
(function () {
  'use strict';

  var enc = new TextEncoder();
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(archivos) {
    var partes = [], central = [], off = 0;
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

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }
  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  var IMG = null, idDib = 1;   // logo del documento: { bytes, w, h } en píxeles
  // Imagen en línea (el logo); ancho en mm, alto proporcional
  function imagen(mm) {
    if (!IMG) return '';
    var cx = Math.round(mm * 36000), cy = Math.round(cx * IMG.h / IMG.w), id = idDib++;
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + id + '" name="Logo ' + id + '"/>' +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }
  var MM = 56.6929; // twips por mm
  var AZUL = '022A55', CLARO = 'DCE3EB';

  function run(t, op) {
    op = op || {};
    var rpr = (op.b ? '<w:b/>' : '') + (op.i ? '<w:i/>' : '') + (op.color ? '<w:color w:val="' + op.color + '"/>' : '') + (op.sz ? '<w:sz w:val="' + op.sz + '"/><w:szCs w:val="' + op.sz + '"/>' : '');
    return '<w:r>' + (rpr ? '<w:rPr>' + rpr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>';
  }
  function campo(instr, op) {
    var rpr = op && op.sz ? '<w:rPr><w:sz w:val="' + op.sz + '"/></w:rPr>' : '';
    return '<w:r>' + rpr + '<w:fldChar w:fldCharType="begin"/></w:r><w:r>' + rpr + '<w:instrText xml:space="preserve"> ' + instr + ' </w:instrText></w:r><w:r>' + rpr + '<w:fldChar w:fldCharType="separate"/></w:r><w:r>' + rpr + '<w:t>1</w:t></w:r><w:r>' + rpr + '<w:fldChar w:fldCharType="end"/></w:r>';
  }
  function texto(t, op) {
    // '{PAG}' -> Página X de Y
    if (String(t).indexOf('{PAG}') >= 0) {
      var partes = String(t).split('{PAG}');
      return run(partes[0], op) + run('Página ', op) + campo('PAGE', op) + run(' de ', op) + campo('NUMPAGES', op) + run(partes[1], op);
    }
    return String(t).split('\n').map(function (l, i) { return (i ? '<w:r><w:br/></w:r>' : '') + run(l, op); }).join('');
  }
  function parrafo(t, op) {
    op = op || {};
    var ppr = (op.estilo ? '<w:pStyle w:val="' + op.estilo + '"/>' : '') + (op.num ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
      (op.c ? '<w:jc w:val="center"/>' : op.j ? '<w:jc w:val="both"/>' : '') + (op.esp !== undefined ? '<w:spacing w:before="0" w:after="' + op.esp + '"/>' : '');
    return '<w:p>' + (ppr ? '<w:pPr>' + ppr + '</w:pPr>' : '') + (op.img ? imagen(op.img) : '') + texto(t, op) + '</w:p>';
  }

  // Celda: string o { t, b, c, fill, color, cs (gridSpan), sz }
  function tabla(def) {
    var anchos = def.anchos.map(function (mm) { return Math.round(mm * MM); });
    var total = anchos.reduce(function (s, w) { return s + w; }, 0);
    var x = ['<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblLayout w:type="fixed"/>' +
      '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (b) { return '<w:' + b + ' w:val="single" w:sz="4" w:space="0" w:color="1F2A36"/>'; }).join('') + '</w:tblBorders>' +
      '<w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>'];
    x.push('<w:tblGrid>' + anchos.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>');
    def.filas.forEach(function (fila, ri) {
      var esCab = ri < (def.cab || 0);
      x.push('<w:tr>' + (esCab ? '<w:trPr><w:tblHeader/></w:trPr>' : ''));
      var col = 0;
      fila.forEach(function (c) {
        if (c === null) return;
        if (typeof c !== 'object') c = { t: c };
        var cs = c.cs || 1, w = 0;
        for (var k = 0; k < cs; k++) w += anchos[col + k] || 0;
        col += cs;
        var fill = c.fill || (esCab ? AZUL : null), color = c.color || (esCab ? 'FFFFFF' : null);
        x.push('<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (cs > 1 ? '<w:gridSpan w:val="' + cs + '"/>' : '') +
          (fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + fill + '"/>' : '') + '<w:vAlign w:val="center"/></w:tcPr>' +
          parrafo(c.t, { b: c.b || esCab, c: c.c || esCab, color: color, sz: c.sz || 18, esp: 0, img: c.img }) + '</w:tc>');
      });
      x.push('</w:tr>');
    });
    x.push('</w:tbl>');
    return x.join('') + parrafo('', { esp: 80 });
  }

  function indice(bloques) {
    var x = [parrafo('TABLA DE CONTENIDO', { estilo: 'TituloIndice' })];
    x.push('<w:p><w:pPr><w:pStyle w:val="TDC1"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9638"/></w:tabs></w:pPr>' +
      '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r></w:p>');
    // Contenido provisional: Word lo regenera con los números de página al actualizar campos
    bloques.forEach(function (b) {
      if (b.h && b.h <= 2) x.push('<w:p><w:pPr><w:pStyle w:val="TDC' + b.h + '"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9638"/></w:tabs></w:pPr>' + run((b.num ? b.num + '  ' : '') + b.t) + '</w:p>');
    });
    x.push('<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>');
    return x.join('');
  }

  function cuerpo(bloques) {
    return bloques.map(function (b) {
      if (b.salto) return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      if (b.indice) return indice(bloques);
      if (b.h) return parrafo((b.num ? b.num + '\t' : '') + b.t, { estilo: 'Titulo' + b.h });
      if (b.ul) return b.ul.map(function (t) { return parrafo(t, { num: true, estilo: 'Vineta' }); }).join('');
      if (b.tabla) return tabla(b.tabla);
      if (b.p !== undefined) return parrafo(b.p, { b: b.b, c: b.c, sz: b.sz, color: b.color, j: !b.c, estilo: b.estilo, img: b.img });
      return '';
    }).join('');
  }

  function estilos() {
    function h(n, sz, antes, mayus) {
      return '<w:style w:type="paragraph" w:styleId="Titulo' + n + '"><w:name w:val="heading ' + n + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
        '<w:pPr><w:keepNext/><w:tabs><w:tab w:val="left" w:pos="' + (n === 1 ? 567 : 851) + '"/></w:tabs><w:spacing w:before="' + antes + '" w:after="120"/><w:jc w:val="left"/><w:outlineLvl w:val="' + (n - 1) + '"/></w:pPr>' +
        '<w:rPr><w:b/>' + (mayus ? '<w:caps/>' : '') + '<w:color w:val="' + AZUL + '"/><w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/></w:rPr></w:style>';
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles ' + NS + '>' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-CL"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      h(1, 24, 360, true) + h(2, 21, 240, false) + h(3, 20, 200, false) + h(4, 20, 160, false) +
      '<w:style w:type="paragraph" w:styleId="Vineta"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/><w:ind w:left="720" w:hanging="360"/><w:jc w:val="both"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="TituloIndice"><w:name w:val="TOC Heading"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="' + AZUL + '"/><w:sz w:val="24"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="TDC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="60" w:after="40"/></w:pPr><w:rPr><w:b/><w:caps/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="TDC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="20"/><w:ind w:left="284"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Portada"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="' + AZUL + '"/><w:sz w:val="32"/></w:rPr></w:style>' +
      '<w:style w:type="table" w:default="1" w:styleId="TablaNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
      '</w:styles>';
  }

  var NUMERACION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering ' + NS + '>' +
    '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>' +
    '<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum>' +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

  function generar(doc) {
    IMG = doc.logo && doc.logo.bytes ? doc.logo : null; idDib = 1;
    var ancho = 170; // mm útiles en A4 con márgenes de 20 mm
    var cab = doc.encabezado ? tabla({ anchos: doc.anchosEncabezado || [45, 80, 45], filas: doc.encabezado.map(function (f) { return f.map(function (c) { return typeof c === 'object' && c ? Object.assign({ sz: 15 }, c) : { t: c, sz: 15 }; }); }) }) : '';
    var sect = '<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:footerReference w:type="default" r:id="rIdF1"/><w:titlePg/>' +
      '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="454" w:gutter="0"/></w:sectPr>';
    var documento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ' + NS + '><w:body>' + cuerpo(doc.bloques) + sect + '</w:body></w:document>';
    var header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ' + NS + '>' + (cab || '<w:p/>') + '</w:hdr>';
    var footer = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ' + NS + '>' + parrafo((doc.pie || '') + '   ·   {PAG}', { c: true, sz: 14, color: '5A6573', esp: 0 }) + '</w:ftr>';
    var fecha = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var RELIMG = IMG ? '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : '';
    var archivos = [
      { nombre: '[Content_Types].xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
        '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
        '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' },
      { nombre: '_rels/.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
      { nombre: 'docProps/core.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:title>' + esc(doc.titulo) + '</dc:title><dc:creator>' + esc(doc.autor) + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + fecha + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + fecha + '</dcterms:modified></cp:coreProperties>' },
      { nombre: 'docProps/app.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>ReyEngi Especificaciones</Application></Properties>' },
      { nombre: 'word/_rels/document.xml.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '<Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
        '<Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
        '<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
        '<Relationship Id="rIdF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' + RELIMG + '</Relationships>' },
      { nombre: 'word/_rels/header1.xml.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + RELIMG + '</Relationships>' },
      { nombre: 'word/document.xml', datos: documento },
      { nombre: 'word/styles.xml', datos: estilos() },
      { nombre: 'word/numbering.xml', datos: NUMERACION },
      { nombre: 'word/settings.xml', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings ' + NS + '><w:updateFields w:val="true"/><w:defaultTabStop w:val="709"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>' },
      { nombre: 'word/header1.xml', datos: header },
      { nombre: 'word/footer1.xml', datos: footer }
    ];
    if (IMG) archivos.push({ nombre: 'word/media/logo.png', datos: IMG.bytes });
    return zip(archivos);
  }

  window.DOCX = { generar: generar, ANCHO_UTIL: 170 };
})();
