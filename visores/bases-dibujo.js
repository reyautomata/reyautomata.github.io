/* Suite ReyEngi · bases de dibujo de los planos
 * Un perfil reúne lo que fija un estándar CAD de proyecto: formatos, textos, capas con su color, grosor y tipo de línea,
 * tabla de plumas por color y reglas de acotado. Los planos de la suite (lazos, unilineales, bloques, canalizaciones y
 * montajes) leen el perfil activo al exportar a DXF, para que el archivo abra en AutoCAD con las capas del proyecto.
 *
 * Perfiles: «ReyEngi» (capas por tipo de elemento, como venía la suite) y «Gran minería · perfil 1» (capas comunes y de
 * instrumentación con plumas por color, textos Arial de 3, 4 y 5 mm, formatos A1 y A3). El perfil se guarda con el proyecto. */
(function () {
  'use strict';
  if (window.RE_DIBUJO) return;
  // Capa: [nombre, color ACI, grosor en A1 (mm), tipo de línea, uso]
  var COMUNES = [['EJES', 240, 0.18, 'DASHDOT', 'Líneas de ejes'], ['COTAS', 7, 0.20, 'CONTINUOUS', 'Acotado'], ['TEXTO', 254, 0.25, 'CONTINUOUS', 'Textos comunes'], ['SUBTITULO', 4, 0.40, 'CONTINUOUS', 'Texto destacado'],
    ['TITULO', 9, 0.60, 'CONTINUOUS', 'Texto de títulos'], ['ACHURADO', 61, 0.13, 'CONTINUOUS', 'Líneas muy finas'], ['SEGMENTO', 2, 0.25, 'HIDDEN2', 'Líneas segmentadas'], ['SIMBOLOS', 253, 0.20, 'CONTINUOUS', 'Simbología (bloques)'],
    ['G_GRUESA', 100, 0.80, 'CONTINUOUS', 'Línea extra gruesa'], ['INST_EXIST', 8, 0.05, 'PHANTOM2', 'Instalaciones existentes'], ['FORMATO_LF', 143, 0.20, 'CONTINUOUS', 'Línea fina del formato'], ['FORMATO_LM', 151, 0.35, 'CONTINUOUS', 'Línea mediana del formato'],
    ['FORMATO_LG', 135, 0.50, 'CONTINUOUS', 'Línea gruesa del formato'], ['FTEX_SUBTIT', 251, 0.20, 'CONTINUOUS', 'Texto de subtítulo del formato'], ['FTEX_TITULO', 252, 0.35, 'CONTINUOUS', 'Texto de título del formato'], ['FTEX_VINETA', 252, 0.50, 'CONTINUOUS', 'Texto de la viñeta']];
  var INSTR = [['I_FINO', 7, 0.20, 'CONTINUOUS', 'Líneas finas'], ['I_MED', 2, 0.25, 'CONTINUOUS', 'Líneas medianas'], ['I_GR', 1, 0.50, 'CONTINUOUS', 'Líneas gruesas'], ['I_ESC', 254, 0.25, 'CONTINUOUS', 'Escalerillas'],
    ['I_EQUIP', 14, 0.25, 'CONTINUOUS', 'Equipos de automatización'], ['I_CANL', 2, 0.25, 'CONTINUOUS', 'Canalizaciones'], ['I_EXIST', 8, 0.05, 'PHANTOM2', 'Instrumentación existente'], ['I_MISC1', 3, 0.35, 'CONTINUOUS', 'Misceláneo mediano'], ['I_MISC2', 120, 0.25, 'CONTINUOUS', 'Misceláneo típico']];
  // Capa interna de la suite → capa del perfil (líneas)
  var MAPA1 = { MARCO: 'FORMATO_LG', ROTULO: 'FORMATO_LF', ZONAS: 'FORMATO_LF', TEXTO: 'TEXTO', NOTAS: 'TEXTO', TABLAS: 'I_FINO', INSTRUMENTO: 'SIMBOLOS', CABLES: 'I_MED', BORNES: 'I_FINO', TARJETA: 'I_EQUIP', HMI: 'I_EQUIP', EQUIPOS: 'I_EQUIP',
    PANTALLA: 'SEGMENTO', ALIMENTACION: 'I_MISC1', FUERZA: 'I_GR', PROTECCIONES: 'I_MED', TIERRA: 'I_MISC2', DUCTO: 'I_CANL', COTAS: 'COTAS', EJES: 'EJES', SIMBOLOS: 'SIMBOLOS', EXISTENTE: 'I_EXIST', ESCALERILLA: 'I_ESC' };
  var LTYPES = { CONTINUOUS: { d: 'Solid line', p: [] }, DASHED: { d: '__ __ __', p: [1.6, -0.8] }, HIDDEN2: { d: 'Hidden (.5x) _ _ _ _', p: [3.175, -1.5875] }, PHANTOM2: { d: 'Phantom (.5x) ___ _ _ ___', p: [15.875, -3.175, 3.175, -3.175, 3.175, -3.175] }, DASHDOT: { d: 'Dash dot __ . __ .', p: [12.7, -6.35, 0, -6.35] } };
  var PERFILES = {
    reyengi: { n: 'ReyEngi · capas por elemento', d: 'Una capa por tipo de elemento (instrumento, cables, bornes, tarjeta…), texto con fuente de trazo y colores libres. Es como exportaba la suite hasta ahora.' },
    min1: { n: 'Gran minería · perfil 1', d: 'Capas comunes y de instrumentación con la pluma definida por el color, textos Arial en mayúsculas de 3, 4 y 5 mm, y formatos A1 y A3.',
      capas: COMUNES.concat(INSTR), mapa: MAPA1,
      texto: { fuente: 'Arial', archivo: 'arial.ttf', estilo: 'ARIAL', general: 3, sub: 4, titulo: 5, ancho: [0.667, 0.75, 0.8], mayus: true },
      formatos: [['A1', 841, 594], ['A3', 420, 297]], ltscale: 0.5,
      acotado: 'En milímetros, texto de 3 mm con factor de ancho 0,667, en la capa COTAS; el valor no se edita a mano.',
      escalas: [1, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000],
      reglas: ['Color, grosor y tipo de línea siempre «por capa».', 'Todo texto en mayúsculas y en español; se evita el texto de varias líneas.', 'En el espacio modelo va el diseño a escala 1:1 con sus cotas, símbolos y textos.', 'En la hoja de ploteo van el formato, la viñeta, las notas generales, las tablas, el norte y las nubes de revisión.', 'El nombre del archivo lleva el número del cliente, sin espacios ni barras.', 'En formato A2, A3 u 11×17 cada pluma tiene la mitad del grosor de A0 y A1.'] }
  };
  var CLAVE = 'reyengi-bases-dibujo', P = window.REProyectos;
  function id() { var v = null; try { v = P && P.leer ? P.leer('dibujo', null) : null; } catch (e) {} if (!v) { try { v = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {} } return v && PERFILES[v.perfil] ? v.perfil : 'reyengi'; }
  function poner(k) { if (!PERFILES[k]) return; var v = { perfil: k }; try { if (P && P.escribir) P.escribir('dibujo', v); } catch (e) {} try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch (e) {} try { window.dispatchEvent(new CustomEvent('reyengi-bases-dibujo', { detail: k })); } catch (e) {} }
  function perfil() { return PERFILES[id()]; }
  function activo() { return !!perfil().capas; }
  // Capa del perfil para una capa interna de la suite. Los textos van a su capa de texto según tamaño y ubicación.
  function capa(interna, prim) { var p = perfil(); if (!p.capas) return interna; var k = String(interna || '').toUpperCase();
    if (prim && prim.t === 'tx') { if (k === 'ROTULO' || k === 'MARCO') return prim.b || prim.h >= 3.5 ? 'FTEX_TITULO' : prim.h >= 2.4 ? 'FTEX_VINETA' : 'FTEX_SUBTIT'; return prim.h >= 4.5 ? 'TITULO' : prim.b || prim.h >= 3.4 ? 'SUBTITULO' : 'TEXTO'; }
    return p.mapa[k] || (p.capas.some(function (c) { return c[0] === k; }) ? k : 'I_MISC2'); }
  function capas() { var p = perfil(); return p.capas ? p.capas.map(function (c) { return { n: c[0], color: c[1], grosor: c[2], ltype: c[3], uso: c[4] }; }) : null; }
  function texto(s) { var p = perfil(); return p.texto && p.texto.mayus ? String(s).toUpperCase() : String(s); }
  // Tablas de un DXF R12 (tipos de línea, capas y estilo de texto) según el perfil; n(c, v) agrega un par código-valor
  function tablasDxf(n) { var p = perfil(), usados = ['CONTINUOUS', 'DASHED']; p.capas.forEach(function (c) { if (usados.indexOf(c[3]) < 0) usados.push(c[3]); });
    n(0, 'TABLE'); n(2, 'LTYPE'); n(70, usados.length);
    usados.forEach(function (k) { var L = LTYPES[k], tot = L.p.reduce(function (a, v) { return a + Math.abs(v); }, 0); n(0, 'LTYPE'); n(2, k); n(70, 0); n(3, L.d); n(72, 65); n(73, L.p.length); n(40, tot); L.p.forEach(function (v) { n(49, v); }); });
    n(0, 'ENDTAB'); n(0, 'TABLE'); n(2, 'LAYER'); n(70, p.capas.length);
    p.capas.forEach(function (c) { n(0, 'LAYER'); n(2, c[0]); n(70, 0); n(62, c[1]); n(6, c[3]); });
    n(0, 'ENDTAB'); n(0, 'TABLE'); n(2, 'STYLE'); n(70, 1); n(0, 'STYLE'); n(2, p.texto.estilo); n(70, 0); n(40, 0); n(41, p.texto.ancho[0]); n(50, 0); n(71, 0); n(42, p.texto.general); n(3, p.texto.archivo); n(4, ''); n(0, 'ENDTAB'); }
  // Ventana de consulta de las bases del perfil activo
  function mostrar() {
    var p = perfil(), dl = document.createElement('dialog'), esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    dl.className = 'rs-bases'; dl.setAttribute('aria-labelledby', 'rsBasesT');
    var h = '<div class="cab"><h2 id="rsBasesT">Bases de dibujo · ' + esc(p.n) + '</h2><button type="button" data-x>Cerrar</button></div><div class="cuerpo"><p>' + esc(p.d) + '</p>';
    if (p.capas) {
      h += '<h3>Formatos</h3><p>' + p.formatos.map(function (f) { return f[0] + ' · ' + f[2] + ' × ' + f[1] + ' mm'; }).join(' &nbsp;·&nbsp; ') + '. En milímetros y en español; el formato se inserta a escala 1:1 en el origen de la hoja de ploteo.</p>' +
        '<h3>Textos</h3><table><thead><tr><th>Uso</th><th>Fuente</th><th>Altura</th><th>Factor de ancho</th><th>Capa</th></tr></thead><tbody><tr><td>Texto general</td><td>' + p.texto.fuente + '</td><td>' + p.texto.general + ' mm</td><td>' + String(p.texto.ancho[0]).replace('.', ',') + '</td><td>TEXTO</td></tr><tr><td>Subtítulos</td><td>' + p.texto.fuente + '</td><td>' + p.texto.sub + ' mm</td><td>' + String(p.texto.ancho[1]).replace('.', ',') + '</td><td>SUBTITULO</td></tr><tr><td>Títulos</td><td>' + p.texto.fuente + '</td><td>' + p.texto.titulo + ' mm</td><td>' + String(p.texto.ancho[2]).replace('.', ',') + '</td><td>TITULO</td></tr></tbody></table>' +
        '<h3>Capas comunes y de instrumentación</h3><table><thead><tr><th>Capa</th><th>Color</th><th>Grosor A0 / A1</th><th>Grosor A3</th><th>Tipo de línea</th><th>Uso</th></tr></thead><tbody>' + p.capas.map(function (c) { return '<tr><td><b>' + c[0] + '</b></td><td>' + c[1] + '</td><td>' + c[2].toFixed(2).replace('.', ',') + ' mm</td><td>' + (c[2] / 2).toFixed(3).replace(/0$/, '').replace('.', ',') + ' mm</td><td>' + c[3].charAt(0) + c[3].slice(1).toLowerCase() + '</td><td>' + esc(c[4]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3>Cómo se asignan las capas de la suite</h3><table><thead><tr><th>Elemento del plano</th><th>Capa al exportar</th></tr></thead><tbody>' + [['Marco de la hoja', 'MARCO'], ['Viñeta y cuadro de revisiones', 'ROTULO'], ['Instrumentos y símbolos', 'INSTRUMENTO'], ['Cables y conductores', 'CABLES'], ['Bornes y regletas', 'BORNES'], ['Tarjetas, gabinetes y equipos', 'TARJETA'], ['Pantallas de cables', 'PANTALLA'], ['Alimentación', 'ALIMENTACION'], ['Circuitos de fuerza', 'FUERZA'], ['Puesta a tierra', 'TIERRA'], ['Ductos y canalizaciones', 'DUCTO'], ['Tablas', 'TABLAS']].map(function (x) { return '<tr><td>' + x[0] + '</td><td><b>' + p.mapa[x[1]] + '</b></td></tr>'; }).join('') + '<tr><td>Textos</td><td><b>TEXTO</b>, <b>SUBTITULO</b> o <b>TITULO</b> según su altura; en la viñeta, <b>FTEX_SUBTIT</b>, <b>FTEX_VINETA</b> o <b>FTEX_TITULO</b></td></tr></tbody></table>' +
        '<h3>Acotado</h3><p>' + esc(p.acotado) + ' Escalas de acotado: 1:' + p.escalas.join(', 1:') + '.</p><h3>Reglas</h3><ul>' + p.reglas.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
        '<p class="nota">La suite aplica estas bases al exportar a DXF: capas, colores, tipos de línea, estilo de texto Arial y mayúsculas. Las alturas de texto de los planos A3 de la suite no se cambian; revísalas si el proyecto exige 3 mm en A3.</p>';
    } else h += '<p class="nota">Este perfil no fija capas ni plumas de proyecto. Elige «Gran minería · perfil 1» para exportar con capas, colores y textos normalizados.</p>';
    dl.innerHTML = h + '</div>'; document.body.appendChild(dl); dl.addEventListener('click', function (e) { if (e.target.closest('[data-x]')) dl.close(); }); dl.addEventListener('close', function () { dl.remove(); }); dl.showModal();
  }
  var st = document.createElement('style');
  st.textContent = 'dialog.rs-bases{width:min(940px,96vw);max-height:90vh;padding:0;border:1px solid var(--line,#3f3f3f);border-radius:8px;background:var(--panel,#2b2b2b);color:var(--fg,#fff);font:14px/20px var(--f-body,system-ui,sans-serif)}dialog.rs-bases::backdrop{background:rgba(0,0,0,.5)}' +
    'dialog.rs-bases .cab{display:flex;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line,#3f3f3f);position:sticky;top:0;background:var(--panel,#2b2b2b)}dialog.rs-bases h2{flex:1;margin:0;font:600 20px/28px var(--f-tit,var(--f-body,system-ui))}dialog.rs-bases .cab button{font:inherit;padding:5px 12px;min-height:32px;border-radius:4px;border:1px solid var(--line,#3f3f3f);background:var(--panel2,#323232);color:inherit;cursor:pointer}' +
    'dialog.rs-bases .cuerpo{padding:8px 16px 16px;overflow:auto}dialog.rs-bases h3{margin:16px 0 8px;font:600 14px/20px var(--f-body,system-ui)}dialog.rs-bases p{margin:0 0 8px}dialog.rs-bases .nota{color:var(--muted,#c8c8c8);font-size:12px;line-height:16px}dialog.rs-bases table{width:100%;border-collapse:collapse;font-size:12px;line-height:16px}dialog.rs-bases th,dialog.rs-bases td{text-align:left;padding:4px 8px;border-bottom:1px solid var(--line,#3f3f3f)}dialog.rs-bases th{font-weight:600;background:var(--panel2,#323232)}dialog.rs-bases ul{margin:0;padding-left:20px}';
  (document.head || document.documentElement).appendChild(st);
  window.RE_DIBUJO = { PERFILES: PERFILES, id: id, poner: poner, perfil: perfil, activo: activo, capa: capa, capas: capas, texto: texto, tablasDxf: tablasDxf, mostrar: mostrar };
})();
