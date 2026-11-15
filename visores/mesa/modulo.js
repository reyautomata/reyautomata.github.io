/* Suite ReyEngi · convierte una sección de un módulo en mesa de trabajo.
 * No reescribe el módulo: toma sus bloques (tabla, formulario, vista previa, plano) y los coloca en paneles acoplables.
 * Los elementos conservan sus ids y eventos, así que el motor del módulo sigue funcionando igual.
 * Agrega dos paneles comunes: Propiedades y Control documental del entregable en pantalla. */
(function () {
  'use strict';
  if (!window.REDock) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var COL = { 'Borrador': '#94A9BE', 'En desarrollo': '#159DDA', 'En revisión': '#E6A23C', 'Con observaciones': '#E35B65', 'Aprobado': '#27B783', 'Emitido': '#38C8E8', 'Obsoleto': '#55657a' };
  function base() { return window.RS_BASE || new URL('../', location.href).href; }
  function actual() { try { return window.RS_ACTUAL ? window.RS_ACTUAL() : null; } catch (e) { return null; } }
  function gens(a) { var R = window.RE_ENTREGABLES; if (!R || !a) return []; var u = new URL(a.href, base()).href; return R.generadores.filter(function (g) { return new URL(g.module, base()).href === u; }); }
  function htmlProp() { var a = actual(), P = window.REProyectos, pr = null; try { pr = P && P.activo(); } catch (e) {} var h = '';
    if (pr) h += '<h3 class="dkm-t">Proyecto</h3><dl class="pr"><dt>Nombre</dt><dd>' + esc(pr.nombre || pr.proyecto) + '</dd><dt>Código</dt><dd>' + esc(pr.numero || '—') + '</dd><dt>Cliente</dt><dd>' + esc(pr.cliente || '—') + '</dd><dt>Etapa</dt><dd>' + esc(pr.fase || '—') + '</dd><dt>Revisión</dt><dd>' + esc(pr.rev || '—') + '</dd></dl>';
    if (a) { h += '<h3 class="dkm-t">En pantalla</h3><dl class="pr"><dt>Módulo</dt><dd>' + esc(a.t) + '</dd>' + (a.hijo ? '<dt>Entregable</dt><dd>' + esc((a.hijo.t ? a.hijo.t + ' · ' : '') + a.hijo.s) + '</dd>' : '') + '</dl>';
      gens(a).forEach(function (g) { h += '<h3 class="dkm-t">' + (g.category === 'PLANO' ? 'Plano' : 'Documento') + ' · ' + g.subcategory + '</h3><dl class="pr"><dt>Entregable</dt><dd>' + esc(g.name) + '</dd><dt>Identificador</dt><dd>' + g.id + '</dd><dt>Disciplina</dt><dd>' + esc(g.discipline) + '</dd><dt>Salidas</dt><dd>' + esc(g.outputFormats.join(', ') || 'visor') + '</dd></dl><p><a href="' + base() + 'generador/#g=' + g.id + '">Abrir en el generador</a></p>'; }); }
    return h || '<p class="nota">Sin datos.</p>'; }
  function htmlCtrl() { var G = window.RE_GESTION, a = actual(); if (!G) return '<p class="nota">El control documental no está disponible.</p>'; var ids = gens(a).map(function (g) { return g.id; }), it = a && a.hijo ? (a.hijo.t || a.hijo.s) : '';
    var l = G.lista().filter(function (d) { return ids.indexOf(d.gen) >= 0; }).sort(function (x, y) { var px = it && (x.item === it || x.titulo.indexOf(it) >= 0) ? 1 : 0, py = it && (y.item === it || y.titulo.indexOf(it) >= 0) ? 1 : 0; return (py - px) || (x.modificado < y.modificado ? 1 : -1); }).slice(0, 20);
    return '<h3 class="dkm-t">Registros de este entregable</h3>' + (l.length ? l.map(function (d) { return '<div class="reg"><b>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo) + '</b><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:' + (COL[d.estado] || '#94A9BE') + '"></i>' + esc(d.estado) + ' · Rev. ' + esc(d.rev) + ((d.archivos || []).length ? ' · ' + d.archivos.length + ' archivo(s)' : '') + '</span></div>'; }).join('') : '<p class="nota">Sin registros todavía. Se crean al exportar.</p>') + '<p><a href="' + base() + 'documentos/">Abrir el control documental</a></p>'; }

  // ── Emisión desde el panel de Control documental ──
  // Un módulo puede registrar un adaptador para emitir sus planos de a uno o por lote y actualizar sus viñetas:
  //   RE_EMISION.registrar(idSeccion, { gen, nombre, items() → [{ id, codigo, titulo, rev }], actual() → id, responsables() → { por, reviso, aprobo },
  //                                     aplicar(ids, fila(id, revVigente) → fila de revisión) → cantidad, formatos: ['PDF', 'DXF'], descargar(ids, formato) })
  // Sin adaptador se emite el entregable en pantalla: queda registrado en el control documental y se ofrecen las descargas del módulo.
  window.RE_EMISION = window.RE_EMISION || { adaptadores: {}, registrar: function (id, ad) { this.adaptadores[id] = ad; },
    // Adaptador corto para entregables que guardan su cuadro de revisiones como lista de filas { rev, fecha, desc, por, reviso, aprobo }:
    //   o = { gen, item(id), items(), actual(), leer(id) → filas propias o null, comunes() → filas por defecto, escribir(id, filas), repintar(), refActual }
    simple: function (sec, o) { function copia(x) { return JSON.parse(JSON.stringify(x || [])); }
      this.registrar(sec, { gen: o.gen, item: o.item, items: o.items, actual: o.actual, refActual: o.refActual, nota: o.nota,
        responsables: function () { return (o.comunes() || []).slice(-1)[0] || {}; },
        revisiones: function (id) { var f = o.leer(id); return { filas: copia(f || o.comunes()), comun: !f }; },
        ponerRevisiones: function (id, filas) { o.escribir(id, filas); o.repintar(); },
        limpiar: function (ids) { ids.forEach(function (id) { o.escribir(id, []); }); o.repintar(); },
        aplicar: function (ids, fila) { var n = 0; ids.forEach(function (id) { var f = copia(o.leer(id) || o.comunes()), vig = (f[f.length - 1] || {}).rev || '', rv = fila(id, vig); if (!rv || !rv.rev) return; var u = f[f.length - 1]; if (u && String(u.rev) === String(rv.rev)) f[f.length - 1] = rv; else f.push(rv); o.escribir(id, f); n++; }); if (n) o.repintar(); return n; } }); } };
  function fechaVin(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : (iso || ''); }
  function hoyIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function formatoDe(t) { if (/pegar|vista previa|importar|cargar|plantilla|todos|todas/i.test(t)) return ''; var m = /\b(PDF|DXF|Excel|Word|PNG)\b/i.exec(t); return m ? m[1] : ''; }
  function estilos() { var css = [].map.call(document.querySelectorAll('style'), function (e) { return e.id === 'vp-css' ? '' : e.textContent; }).join('\n'), enl = [].map.call(document.querySelectorAll('link[rel=stylesheet]'), function (l) { return l.href; }); return { css: css.slice(0, 400000), enlaces: enl }; }
  function emision(nodo, sec, cfg) {
    var G = window.RE_GESTION, ad = function () { return window.RE_EMISION.adaptadores[sec.id] || null; };
    var st = { modo: 'uno', marcas: {}, filtro: '', ultimos: null };
    nodo.innerHTML = '<h3 class="dkm-t">Emitir</h3>' +
      '<div class="em-seg" role="group" aria-label="Alcance de la emisión"><button type="button" data-m="uno" aria-pressed="true">En pantalla</button><button type="button" data-m="lote" aria-pressed="false">Por lote</button></div>' +
      '<p class="em-obj"></p>' +
      '<div class="em-cuadro"></div>' +
      '<div class="em-lote" hidden><div class="em-fl"><input type="search" class="em-q" placeholder="Filtrar planos" aria-label="Filtrar planos"><button type="button" data-a="todos">Todos</button><button type="button" data-a="nada">Ninguno</button></div><div class="em-lista" role="group" aria-label="Planos a emitir"></div><p class="nota em-n"></p></div>' +
      '<label>Qué hacer con la revisión<select class="em-acc"><option value="igual">Mantener la revisión actual (no crea una nueva)</option><option value="copiar">Usar en todos la revisión del plano en pantalla</option><option value="subir">Subir de revisión (declarar una nueva)</option></select></label>' +
      '<div class="em-campos" hidden><label>Tipo de emisión<select class="em-tipo">' + G.TIPOS.map(function (t) { return '<option value="' + t.id + '">' + esc(t.t) + '</option>'; }).join('') + '</select></label>' +
      '<div class="em-2"><label>Revisión<input class="em-rev" maxlength="4" placeholder="automática"></label><label>Fecha<input type="date" class="em-fecha" value="' + hoyIso() + '"></label></div>' +
      '<label>Descripción de la revisión<input class="em-desc" maxlength="60"></label>' +
      '<div class="em-3"><label>Por<input class="em-por" maxlength="6"></label><label>Revisó<input class="em-revi" maxlength="6"></label><label>Aprobó<input class="em-apr" maxlength="6"></label></div>' +
      '</div><p class="nota em-ayuda"></p><div class="em-pasos"><button type="button" class="em-act">1 · Actualizar revisiones</button><button type="button" class="em-ok" disabled>2 · Emitir</button></div><button type="button" class="em-limpiar">Limpiar revisiones existentes</button><p class="em-pend" hidden></p><div class="em-res" aria-live="polite"></div>';
    var q = function (c) { return nodo.querySelector(c); }, descTocada = false;
    function tipo() { return G.TIPOS.filter(function (t) { return t.id === q('.em-tipo').value; })[0]; }
    function ponerDesc() { if (!descTocada) q('.em-desc').value = tipo().desc; }
    function items() { var a = ad(); try { return a ? a.items() : []; } catch (e) { return []; } }
    function unoActual() { var a = ad(); if (a) { var id = a.actual(), it = items().filter(function (x) { return x.id === id; })[0]; return it ? { ad: a, it: it } : null; } var x = actual(); return x ? { pantalla: x } : null; }
    function regDe(a, it) { return G.lista().filter(function (d) { return d.gen === a.gen && d.item === a.item(it.id); })[0] || null; }
    function ids() { return st.modo === 'lote' ? items().filter(function (x) { return st.marcas[x.id]; }).map(function (x) { return x.id; }) : (unoActual() && unoActual().it ? [unoActual().it.id] : []); }
    function pintarLista() {
      var l = items(), f = st.filtro.toLowerCase(), v = l.filter(function (x) { return !f || (x.id + ' ' + x.codigo + ' ' + x.titulo).toLowerCase().indexOf(f) >= 0; });
      q('.em-lista').innerHTML = v.map(function (x) { return '<label><input type="checkbox" data-id="' + esc(x.id) + '"' + (st.marcas[x.id] ? ' checked' : '') + '><span><b>' + esc(x.codigo) + '</b> ' + esc(x.titulo) + '</span><small>' + (x.rev ? 'Rev. ' + esc(x.rev) : 'sin rev.') + '</small></label>'; }).join('') || '<p class="nota">No hay planos que coincidan.</p>';
      var n = l.filter(function (x) { return st.marcas[x.id]; }).length; q('.em-n').textContent = n + ' de ' + l.length + ' seleccionados';
      q('.em-act').textContent = '1 · Actualizar ' + n + ' plano(s)'; q('.em-act').disabled = !n;
    }
    function botones(lista, a) { return '<div class="em-des">' + lista.map(function (f) { return '<button type="button" data-f="' + f + '">' + (f === 'PDF' && a ? 'Imprimir / PDF' : 'Descargar ' + f) + '</button>'; }).join('') + '</div>'; }
    function pintar() {
      var a = ad(), u = unoActual(); if (!a && st.modo === 'lote') st.modo = 'uno';
      q('.em-seg').hidden = !a; q('.em-campos > .em-3').hidden = !a;
      var selA = q('.em-acc'), oc = selA.querySelector('[value=copiar]'); oc.hidden = oc.disabled = !(a && st.modo === 'lote'); if (oc.disabled && selA.value === 'copiar') selA.value = 'igual';
      var accion = selA.value; q('.em-campos').hidden = accion !== 'subir';
      var nl = st.modo === 'lote' ? ids().length : 1; q('.em-limpiar').textContent = st.modo === 'lote' ? 'Limpiar revisiones de ' + nl + ' plano(s)' : 'Limpiar revisiones existentes'; q('.em-limpiar').disabled = !u && st.modo !== 'lote' || (st.modo === 'lote' && !nl); q('.em-lote').hidden = st.modo !== 'lote';
      [].forEach.call(nodo.querySelectorAll('.em-seg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === st.modo)); });
      var o = q('.em-obj'); o.hidden = st.modo === 'lote';
      if (u && u.it) o.innerHTML = '<b>' + esc(u.it.codigo) + '</b> ' + esc(u.it.titulo) + '<small>' + (u.it.rev ? 'Revisión vigente: ' + esc(u.it.rev) : 'Sin revisión emitida') + '</small>';
      else if (u) o.innerHTML = '<b>' + esc(u.pantalla.t) + '</b>' + (u.pantalla.hijo ? ' ' + esc((u.pantalla.hijo.t ? u.pantalla.hijo.t + ' · ' : '') + u.pantalla.hijo.s) : '');
      else o.textContent = 'No hay un entregable en pantalla.';
      q('.em-ayuda').textContent = accion === 'igual' ? 'Actualizar no cambia nada del cuadro: deja ' + (st.modo === 'lote' ? 'cada plano' : 'el entregable') + ' con la revisión que ya tiene, listo para revisar y emitir. Para una revisión nueva elige «Subir de revisión».'
        : accion === 'copiar' ? 'Actualizar copia a todos los seleccionados la última revisión del plano en pantalla (revisión, fecha, descripción y responsables).'
        : 'Actualizar agrega la revisión declarada aquí' + (a ? ' al cuadro y a la viñeta, sin emitir' : '') + '. Revisión vacía: se usa la siguiente que corresponde al tipo de emisión' + (st.modo === 'lote' ? ' en cada plano' : '') + '.';
      if (a && !q('.em-por').dataset.ok) { q('.em-por').dataset.ok = '1'; var r = {}; try { r = a.responsables() || {}; } catch (e) {} q('.em-por').value = r.por || ''; q('.em-revi').value = r.reviso || ''; q('.em-apr').value = r.aprobo || ''; }
      pintarCuadro();
      if (st.modo === 'lote') pintarLista(); else { q('.em-act').textContent = '1 · Actualizar revisión'; q('.em-act').disabled = !u; }
      var pe = st.pend, np = pe ? (pe.ids ? pe.ids.length : 1) : 0, pp = q('.em-pend');
      q('.em-ok').disabled = !pe; q('.em-ok').textContent = pe && pe.ids && np > 1 ? '2 · Emitir ' + np + ' plano(s)' : '2 · Emitir';
      pp.hidden = !pe; if (pe) pp.textContent = (pe.ids ? (pe.igual ? 'Se mantiene la revisión actual en ' + np + ' plano(s)' + (pe.sin ? ' (' + pe.sin + ' sin revisión quedaron fuera)' : '') : 'Revisión actualizada en ' + np + ' plano(s)') + ': revisa las viñetas' + (np > 1 ? ' (selecciona cada lazo para verlo)' : '') + ' y corrige el cuadro si hace falta.' : 'Rev. ' + pe.rev + ' · ' + pe.fecha + ' · ' + pe.desc + ' preparada.') + ' Cuando esté conforme, pulsa «2 · Emitir».';
      // Emisión vigente del entregable en pantalla, con sus descargas
      var res = q('.em-res'), h = '';
      if (st.ultimos) h = '<p class="em-hecho">' + esc(st.ultimos.txt) + '</p>' + botones(st.ultimos.formatos, st.ultimos.ad) + '<p class="em-ir"><a href="' + base() + 'documentos/">Ver el control de emisiones</a></p>';
      else if (st.modo === 'uno' && u) {
        var d = u.it ? regDe(a, u.it) : null;
        if (!u.it) { var x = u.pantalla, k = x.hijo ? (x.hijo.t || x.hijo.s) : ''; d = G.lista().filter(function (r2) { return r2.emision && gens(x).some(function (g) { return g.id === r2.gen; }) && r2.item === k; })[0] || null; }
        if (d && d.emision) h = '<p class="em-hecho">Emitido · Rev. ' + esc(d.emision.rev) + (d.emision.fecha ? ' · ' + esc(d.emision.fecha) : '') + '<small>' + esc(d.emision.desc) + '</small></p>' + botones(a && a.formatos ? a.formatos : formatosSec(), a && a.descargar ? a : null);
      }
      if (res.dataset.h !== h) { res.dataset.h = h; res.innerHTML = h; }
    }
    // ── Cuadro de revisiones del entregable en pantalla: se ve lo ya emitido y se puede corregir, quitar o agregar filas ──
    function regPantalla(x) { var k = x.hijo ? (x.hijo.t || x.hijo.s) : ''; return G.lista().filter(function (r2) { return gens(x).some(function (g) { return g.id === r2.gen; }) && r2.item === k; })[0] || null; }
    function cuadro() { var a = ad(), u = unoActual(); if (!u) return null;
      if (a && u.it) { var r = a.revisiones ? a.revisiones(u.it.id) : { filas: [] }; return { a: a, id: u.it.id, filas: r.filas, comun: r.comun }; }
      if (!u.pantalla) return null; var d = regPantalla(u.pantalla); return { d: d, filas: ((d && d.emisiones) || []).map(function (e) { return { rev: e.rev, fecha: e.fecha, desc: e.desc }; }) }; }
    function pintarCuadro(forzar) {
      var n = q('.em-cuadro'), c = st.modo === 'uno' ? cuadro() : null; n.hidden = !c; if (!c) return;
      var h = '<h3 class="dkm-t">Cuadro de revisiones</h3>' + (c.comun ? '<p class="nota">Este plano usa el cuadro común del proyecto. Si lo editas aquí, pasa a tener su propio cuadro.</p>' : '') +
        (c.filas.map(function (r, i) { return '<div class="em-fila" data-i="' + i + '"><div class="em-f1"><input data-c="rev" value="' + esc(r.rev) + '" maxlength="4" aria-label="Revisión"><input data-c="fecha" value="' + esc(r.fecha) + '" maxlength="10" placeholder="dd-mm-aaaa" aria-label="Fecha de la revisión ' + esc(r.rev) + '"><button type="button" data-cq="del" aria-label="Eliminar la revisión ' + esc(r.rev) + '">✕</button></div>' +
          '<input data-c="desc" value="' + esc(r.desc) + '" maxlength="60" placeholder="Descripción" aria-label="Descripción de la revisión ' + esc(r.rev) + '">' +
          (c.a ? '<div class="em-3"><input data-c="por" value="' + esc(r.por) + '" maxlength="6" placeholder="Por" aria-label="Por"><input data-c="reviso" value="' + esc(r.reviso) + '" maxlength="6" placeholder="Revisó" aria-label="Revisó"><input data-c="aprobo" value="' + esc(r.aprobo) + '" maxlength="6" placeholder="Aprobó" aria-label="Aprobó"></div>' : '') + '</div>'; }).join('') || '<p class="nota">Sin revisiones todavía.</p>') +
        '<button type="button" data-cq="mas">+ Agregar revisión</button>';
      var k = (c.id || (c.d && c.d.id) || '') + '|' + h; if (n.dataset.h === k) return;
      if (!forzar && n.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;   // no se redibuja mientras se escribe
      n.dataset.h = k; n.innerHTML = h;
    }
    function leerCuadro() { return [].map.call(q('.em-cuadro').querySelectorAll('.em-fila'), function (f) { var r = {}; [].forEach.call(f.querySelectorAll('[data-c]'), function (i) { r[i.dataset.c] = i.value.trim().toUpperCase(); }); return r; }); }
    function guardarCuadro(filas) {
      var c = cuadro(); if (!c) return; filas = filas.filter(function (r) { return r.rev; });
      if (c.a) { c.a.ponerRevisiones(c.id, filas); var d = regDe(c.a, { id: c.id }); if (d && d.emision) { G.revisiones(d.id, filas); foto(d.id, c.a, c.id); } }
      else { var d2 = c.d || (filas.length ? G.actual('', false) : null); if (d2) { G.revisiones(d2.id, filas); foto(d2.id); } }
      if (c.a) st.pend = filas.length ? { ids: [c.id], tipo: tipo().id } : null;
      st.ultimos = null; pintar(); pintarCuadro(true);
      var ok = document.createElement('p'); ok.className = 'em-check'; ok.setAttribute('role', 'status'); ok.textContent = '✓ ' + (c.a ? 'Actualizado en el plano o documento: revísalo a la izquierda.' : 'Cuadro actualizado.'); q('.em-cuadro').appendChild(ok); setTimeout(function () { ok.remove(); }, 6000);
    }
    // Copia de la hoja tal como queda emitida, para la vista previa del control documental
    function foto(docId, a, id) { try { var html = '', ancho = 0;
        if (a && a.vista) html = a.vista(id);
        else { var sl = (cfg.paneles || []).map(function (p) { return p.zoom; }).filter(Boolean)[0], el = sl && sec.querySelector(sl); if (el) { var cl = el.cloneNode(true); cl.style.zoom = ''; cl.style.width = ''; html = cl.outerHTML; ancho = Math.round(el.scrollWidth / (parseFloat(el.style.zoom) || 1)); } }
        if (html) { var e = estilos(); G.guardarVista(docId, { html: html.slice(0, 6000000), css: e.css, enlaces: e.enlaces, base: location.href, ancho: ancho }); } } catch (er) { console.warn('Vista previa', er); } }
    function botonesSec() { return [].filter.call(sec.querySelectorAll('button, a.btn'), function (b) { return !b.closest('.dkm-comun') && formatoDe(b.textContent || ''); }); }
    function formatosSec() { var v = []; botonesSec().forEach(function (b) { var f = formatoDe(b.textContent); if (v.indexOf(f) < 0) v.push(f); }); return v; }
    nodo.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) { st.modo = b.dataset.m; st.ultimos = null; if (st.modo === 'lote' && !Object.keys(st.marcas).length) { var u = unoActual(); if (u && u.it) st.marcas[u.it.id] = true; } pintar(); }
      else if (b.dataset.a) { var f = st.filtro.toLowerCase(); items().forEach(function (x) { if (!f || (x.id + ' ' + x.codigo + ' ' + x.titulo).toLowerCase().indexOf(f) >= 0) { if (b.dataset.a === 'todos') st.marcas[x.id] = true; else delete st.marcas[x.id]; } }); pintarLista(); }
      else if (b.dataset.cq === 'mas') { var fs = leerCuadro(), u2 = fs[fs.length - 1]; fs.push({ rev: G.revPara(u2 ? u2.rev : '', tipo().id), fecha: fechaVin(q('.em-fecha').value), desc: (q('.em-desc').value.trim() || tipo().desc).toUpperCase(), por: u2 ? u2.por : '', reviso: u2 ? u2.reviso : '', aprobo: u2 ? u2.aprobo : '' }); guardarCuadro(fs); }
      else if (b.dataset.cq === 'del') { if (b.dataset.seguro) { var i = +b.closest('.em-fila').dataset.i, f2 = leerCuadro(); f2.splice(i, 1); guardarCuadro(f2); } else { b.dataset.seguro = '1'; b.textContent = '¿Eliminar?'; b.classList.add('em-pel'); setTimeout(function () { if (b.isConnected) { delete b.dataset.seguro; b.textContent = '✕'; b.classList.remove('em-pel'); } }, 4000); } }
      else if (b.classList.contains('em-act')) actualizar();
      else if (b.classList.contains('em-limpiar')) { if (b.dataset.seguro) { delete b.dataset.seguro; b.classList.remove('em-pel'); limpiar(); } else { b.dataset.seguro = '1'; b.textContent = '¿Borrar las revisiones escritas? Pulsa otra vez'; b.classList.add('em-pel'); setTimeout(function () { if (b.dataset.seguro) { delete b.dataset.seguro; b.classList.remove('em-pel'); pintar(); } }, 5000); } }
      else if (b.classList.contains('em-ok')) emitir();
      else if (b.dataset.f) { var a = ad();
        if (a && a.descargar) { var l = st.ultimos ? st.ultimos.ids : ids(); a.descargar(l, b.dataset.f); l.forEach(function (id) { var d = regDe(a, { id: id }); if (d) G.anotar(d.id, 'Exportado', b.dataset.f); }); }
        else { var bt = botonesSec().filter(function (x) { return formatoDe(x.textContent) === b.dataset.f; })[0]; if (bt) bt.click(); } }
    });
    nodo.addEventListener('change', function (e) { var t = e.target; if (t.dataset && t.dataset.c && t.closest('.em-cuadro')) { guardarCuadro(leerCuadro()); return; } if (t.dataset && t.dataset.id != null && t.type === 'checkbox') { if (t.checked) st.marcas[t.dataset.id] = true; else delete st.marcas[t.dataset.id]; pintarLista(); } else if (t.classList.contains('em-tipo')) { descTocada = false; ponerDesc(); } else if (t.classList.contains('em-acc')) pintar(); });
    nodo.addEventListener('input', function (e) { var t = e.target; if (t.classList.contains('em-q')) { st.filtro = t.value; pintarLista(); } else if (t.classList.contains('em-desc')) descTocada = true; });
    // Paso 1 · Actualizar revisiones: escribe la revisión en la viñeta de cada plano para revisarla. No emite.
    function aviso(txt) { var res = q('.em-res'); res.dataset.h = ''; res.innerHTML = '<p class="em-error">' + esc(txt) + '</p>'; }
    function enRevision(a, l, its, revs) { l.forEach(function (id) { var it = its.filter(function (x) { return x.id === id; })[0]; if (!it) return;
      var d = G.registrar({ gen: a.gen, ref: a.refActual ? (actual() || {}).href : undefined, item: a.item(id), titulo: it.titulo, codigo: it.codigo, nota: 'Registrado al actualizar la revisión' }); if (d) { if (d.codigo !== it.codigo) G.editar(d.id, { codigo: it.codigo }); G.estado(d.id, 'En revisión', 'Rev. ' + revs[id] + ' por emitir'); } }); }
    function actualizar() {
      var a = ad(), accion = q('.em-acc').value, t = tipo(), rev = q('.em-rev').value.trim().toUpperCase(), fecha = fechaVin(q('.em-fecha').value), desc = (q('.em-desc').value.trim() || t.desc).toUpperCase();
      if (accion === 'subir' && !desc) { aviso('Escribe la descripción de la revisión.'); q('.em-desc').focus(); return; }
      if (a) {
        var l = ids(); if (!l.length) return; var revs = {}, its = items(), sin = 0;
        if (accion === 'subir') { var por = q('.em-por').value.trim().toUpperCase(), revi = q('.em-revi').value.trim().toUpperCase(), apr = q('.em-apr').value.trim().toUpperCase();
          a.aplicar(l, function (id, vig) { var r = rev || G.revPara(vig, t.id); revs[id] = r; return { rev: r, fecha: fecha, desc: desc, por: por, reviso: revi, aprobo: apr, cliente: '' }; }); }
        else if (accion === 'copiar') { var ref = a.revisiones(a.actual()).filas.slice(-1)[0]; if (!ref || !ref.rev) { aviso('El plano en pantalla no tiene revisión que copiar.'); return; }
          a.aplicar(l, function (id) { revs[id] = ref.rev; return JSON.parse(JSON.stringify(ref)); }); }
        else l.forEach(function (id) { var f = a.revisiones(id).filas.slice(-1)[0]; if (f && f.rev) revs[id] = f.rev; else sin++; });   // se mantiene la revisión que cada uno ya tiene
        l = l.filter(function (id) { return revs[id]; });
        if (!l.length) { aviso('Los seleccionados no tienen revisión todavía. Elige «Subir de revisión» para declarar la primera.'); return; }
        enRevision(a, l, its, revs);
        st.pend = { ids: l, tipo: accion === 'subir' ? t.id : 'otra', lote: st.modo === 'lote', sin: sin, igual: accion === 'igual' };
      } else {
        var d0 = G.actual('', false); if (!d0) return;
        if (accion !== 'subir') { if (!d0.emision) { aviso('Este entregable no tiene revisión registrada todavía. Elige «Subir de revisión» para declarar la primera.'); return; } st.pend = { doc: d0.id, tipo: d0.emision.tipo, rev: d0.emision.rev, fecha: d0.emision.fecha, desc: d0.emision.desc }; }
        else st.pend = { doc: d0.id, tipo: t.id, rev: rev || G.revPara(d0.emision ? d0.rev : '', t.id), fecha: fecha, desc: desc };
        G.estado(d0.id, 'En revisión', 'Rev. ' + st.pend.rev + ' por emitir');
      }
      st.ultimos = null; q('.em-rev').value = ''; pintar(); pintarCuadro(true);
    }
    // Limpiar: borra las revisiones escritas (para reutilizar un entregable importado o ya emitido en otro proyecto)
    function limpiar() {
      var a = ad();
      if (a) { var l = ids(); if (!l.length) return;
        if (a.limpiar) a.limpiar(l); else l.forEach(function (id) { a.ponerRevisiones(id, []); });
        l.forEach(function (id) { var d = regDe(a, { id: id }); if (d) G.revisiones(d.id, []); }); }
      else { var u = unoActual(), d2 = u && u.pantalla ? regPantalla(u.pantalla) : null; if (d2) G.revisiones(d2.id, []); }
      st.pend = null; st.ultimos = null; pintar(); pintarCuadro(true);
      var res = q('.em-res'); res.dataset.h = ''; res.innerHTML = '<p class="em-hecho">Revisiones eliminadas. El cuadro quedó en blanco.</p>';
    }
    // Paso 2 · Emitir: registra como emitido lo que ya se actualizó y revisó, con la revisión que tenga la viñeta en ese momento
    function emitir() {
      var a = ad(), pe = st.pend; if (!pe) return;
      if (a && pe.ids) {
        var its = items(), revs = [], fechas = [], n = 0, hechos = [];
        pe.ids.forEach(function (id) { var it = its.filter(function (x) { return x.id === id; })[0], f = it && a.revisiones(id).filas.slice(-1)[0]; if (!it || !f || !f.rev) return;   // sin fila en el cuadro no hay nada que emitir
          var d = G.registrar({ gen: a.gen, ref: a.refActual ? (actual() || {}).href : undefined, item: a.item(id), titulo: it.titulo, codigo: it.codigo, nota: 'Registrado al emitir' }); if (!d) return;
          G.emitir(d.id, { rev: f.rev, fecha: f.fecha, tipo: pe.tipo, desc: f.desc }); foto(d.id, a, id); n++; hechos.push(id); if (revs.indexOf(f.rev) < 0) revs.push(f.rev); if (fechas.indexOf(f.fecha) < 0) fechas.push(f.fecha); });
        st.ultimos = n ? { ids: hechos, ad: a.descargar ? a : null, formatos: a.formatos || formatosSec(), txt: n + ' plano(s) emitido(s) · Rev. ' + revs.join(', ') + ' · ' + fechas.join(', ') } : null;
      } else if (pe.doc) { G.emitir(pe.doc, { rev: pe.rev, fecha: pe.fecha, tipo: pe.tipo, desc: pe.desc }); foto(pe.doc); st.ultimos = null; }
      var txt = st.ultimos ? st.ultimos.txt : (pe.doc ? 'Rev. ' + pe.rev + ' · ' + pe.fecha + ' · ' + pe.desc : '');
      st.pend = null; pintar(); if (txt) avisoEmitido(txt);
    }
    function avisoEmitido(txt) {
      var dl = document.createElement('dialog'); dl.className = 'em-dlg';
      dl.innerHTML = '<h3>Emisión registrada</h3><p>' + esc(txt) + '</p><p>Quedó en el control documental con su vista previa. ¿Quieres ir a ver el control de emisiones?</p><div><a class="em-si" href="' + base() + 'documentos/">Ir a Control documental</a><button type="button">Seguir aquí</button></div>';
      document.body.appendChild(dl); dl.querySelector('button').onclick = function () { dl.close(); }; dl.addEventListener('close', function () { dl.remove(); }); dl.showModal();
    }
    ponerDesc(); pintar();
    return { refrescar: function () { if (st.ultimos && st.modo === 'uno') { var u = unoActual(); if (!u || !u.it || st.ultimos.ids.indexOf(u.it.id) < 0) st.ultimos = null; } pintar(); } };
  }

  // ── Zoom del plano dentro de su panel: rueda para acercar hacia el cursor, arrastrar para mover, botones y doble clic ──
  function zoomPlano(el) {
    if (!el || el.dataset.zm) return; el.dataset.zm = '1'; el.classList.add('zm');
    var z = 1, MAX = 10, barra = document.createElement('div'); barra.className = 'zm-barra';
    barra.innerHTML = '<button type="button" data-z="-" aria-label="Alejar">−</button><output aria-live="polite">100 %</output><button type="button" data-z="+" aria-label="Acercar">+</button><button type="button" data-z="1">Ajustar</button><span>Rueda: zoom · arrastrar: mover</span>';
    el.parentNode.insertBefore(barra, el);
    function caja() { var n = el.parentNode; while (n && n !== document.body) { var o = getComputedStyle(n).overflowY; if (o === 'auto' || o === 'scroll') return n; n = n.parentNode; } return document.scrollingElement; }
    function poner(nz, cx, cy) {
      nz = Math.min(MAX, Math.max(1, nz)); if (Math.abs(nz - z) < 0.001) return;
      var c = caja(), r = el.getBoundingClientRect(); if (cx == null) { var rc = c.getBoundingClientRect(); cx = rc.left + c.clientWidth / 2; cy = rc.top + c.clientHeight / 2; }
      var fx = r.width ? (cx - r.left) / r.width : 0.5, fy = r.height ? (cy - r.top) / r.height : 0.5;
      if (z === 1) el.style.width = el.offsetWidth + 'px';        // ancho fijo: así el zoom agranda el plano en vez de reacomodarlo
      z = nz; el.style.zoom = z === 1 ? '' : z; if (z === 1) el.style.width = ''; el.classList.toggle('zm-on', z > 1);
      var r2 = el.getBoundingClientRect(); c.scrollLeft += r2.left + fx * r2.width - cx; c.scrollTop += r2.top + fy * r2.height - cy;
      barra.querySelector('output').textContent = Math.round(z * 100) + ' %';
    }
    var cs = caja(); if (cs && cs.addEventListener) cs.addEventListener('scroll', function () { barra.style.transform = cs.scrollLeft ? 'translateX(' + cs.scrollLeft + 'px)' : ''; }, { passive: true });   // la barra no se va con el desplazamiento horizontal
    barra.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; poner(b.dataset.z === '1' ? 1 : b.dataset.z === '+' ? z * 1.4 : z / 1.4); });
    el.addEventListener('wheel', function (e) { if (e.shiftKey) return; e.preventDefault(); poner(z * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX, e.clientY); }, { passive: false });
    el.addEventListener('dblclick', function (e) { if (e.target.closest('input, select, textarea, button, a, [contenteditable]')) return; poner(z < MAX ? z * 2 : 1, e.clientX, e.clientY); });
    var arr = null;
    el.addEventListener('pointerdown', function (e) { if (e.button !== 0 || z === 1 || e.target.closest('input, select, textarea, button, a, [contenteditable]')) return; var c = caja(); arr = { x: e.clientX, y: e.clientY, l: c.scrollLeft, t: c.scrollTop, c: c, mov: false }; });
    window.addEventListener('pointermove', function (e) { if (!arr) return; var dx = e.clientX - arr.x, dy = e.clientY - arr.y; if (!arr.mov && Math.hypot(dx, dy) < 4) return; arr.mov = true; el.classList.add('zm-arr'); arr.c.scrollLeft = arr.l - dx; arr.c.scrollTop = arr.t - dy; e.preventDefault(); });
    window.addEventListener('pointerup', function () { if (arr) { el.classList.remove('zm-arr'); arr = null; } });
  }

  // cfg: { clave, paneles: [{ id, titulo, mover: [selector | función(sec) → elemento(s)] }], inicial, limpiar: [selectores a quitar si quedan vacíos] }
  function apagada() { try { return /[?&]simple=1/.test(location.search) || localStorage.getItem('reyengi-mesa-off') === '1'; } catch (e) { return false; } }
  function fijar(off) { try { if (off) localStorage.setItem('reyengi-mesa-off', '1'); else localStorage.removeItem('reyengi-mesa-off'); } catch (e) {} location.href = location.href.replace(/([?&])simple=1&?/, '$1').replace(/[?&]$/, ''); if (!/[?&]simple=1/.test(location.search)) location.reload(); }
  window.REMesaModulo = function (sec, cfg) {
    if (!sec || sec.dataset.dkm) return null;
    if (apagada()) { sec.dataset.dkm = 'off'; var bs = document.createElement('div'); bs.className = 'dkm-barra sola'; var ba = document.createElement('button'); ba.type = 'button'; ba.textContent = 'Activar mesa de trabajo'; ba.onclick = function () { fijar(false); }; bs.append(ba); sec.insertBefore(bs, sec.firstChild); return null; }
    var piezas = {}, falta = false;
    cfg.paneles.forEach(function (p) { var l = []; p.mover.forEach(function (m) { var r = typeof m === 'function' ? m(sec) : sec.querySelector(m); if (!r) return; (r.length != null && !r.tagName ? [].slice.call(r) : [r]).forEach(function (e) { if (e && l.indexOf(e) < 0) l.push(e); }); }); if (!l.length) falta = true; piezas[p.id] = l; });
    if (falta) return null; // el módulo cambió: se deja como estaba
    // Lo que queda fuera de los paneles (barras de botones, estados) pasa a la pestaña Acciones; los textos de introducción se ocultan:
    // así el plano o documento ocupa todo el alto a la izquierda y la edición queda en pestañas a la derecha.
    var todas = []; Object.keys(piezas).forEach(function (k) { todas = todas.concat(piezas[k]); });
    var sobra = [].filter.call(sec.children, function (c) { return !/^(DIALOG|SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName) && !todas.some(function (e) { return c === e || c.contains(e); }); });
    sobra.forEach(function (c) { if (c.matches('p.intro, .intro, h2')) c.classList.add('dkm-oculto'); });
    var nAcc = null;
    var nav = document.querySelector('nav.tabs'), principal = cfg.principal || (cfg.paneles.filter(function (p) { return p.zoom; })[0] || cfg.paneles[0]).id;
    sec.dataset.dkm = '1';
    var barra = document.createElement('div'); barra.className = 'dkm-barra'; var bp = document.createElement('button'); bp.type = 'button'; bp.textContent = 'Paneles'; bp.setAttribute('aria-haspopup', 'menu'); var br = document.createElement('button'); br.type = 'button'; br.textContent = 'Restablecer disposición'; var bc = document.createElement('button'); bc.type = 'button'; bc.textContent = 'Vista clásica'; bc.title = 'Volver al diseño anterior, sin paneles'; bc.onclick = function () { fijar(true); }; barra.append(bp, br, bc);
    var host = document.createElement('div'); host.className = 'dkm-host'; sec.append(host); var pie = document.createElement('div'); pie.className = 'dkm-pie'; pie.innerHTML = '<h3 class="dkm-t">Disposición de paneles</h3>'; pie.append(barra);
    function llena() { var on = !!document.querySelector('[data-dkm="1"]:not([hidden])'); document.body.classList.toggle('dkm-llena', on); document.body.classList.toggle('dkm-shell', on && !!window.RS_GRUPOS); }
    var paneles = {}; cfg.paneles.forEach(function (p) { paneles[p.id] = { titulo: p.titulo, montar: function (n) { n.classList.add('dkm-p'); piezas[p.id].forEach(function (e) { n.appendChild(e); }); } }; });
    var hayAcc = true;
    if (hayAcc) paneles.acc = { titulo: 'Acciones', montar: function (n) { n.classList.add('dkm-p', 'dkm-acc');
      if (nav) { var lb = document.createElement('label'); lb.className = 'dkm-ir'; lb.textContent = 'Ir a otra sección'; var sl = document.createElement('select'); [].forEach.call(nav.querySelectorAll('button, a'), function (b, i) { var o = document.createElement('option'); o.value = i; o.textContent = b.textContent.trim(); if (b.getAttribute('aria-selected') === 'true') o.selected = true; sl.append(o); });
        sl.addEventListener('change', function () { var b = nav.querySelectorAll('button, a')[+sl.value]; if (b) b.click(); }); lb.append(sl); n.append(lb);
        new MutationObserver(function () { [].forEach.call(nav.querySelectorAll('button, a'), function (b, i) { if (b.getAttribute('aria-selected') === 'true') sl.value = i; }); }).observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] }); }
      nAcc = n; } };
    var lado = (hayAcc ? ['acc'] : []).concat(cfg.paneles.map(function (p) { return p.id; }).filter(function (id) { return id !== principal; }), ['prop', 'ctrl']);
    var inicial = { t: 'row', c: [{ t: 'tabs', p: [principal], a: principal }, { t: 'tabs', p: lado, a: lado[hayAcc && lado.length > 3 ? 1 : 0] }], s: [0.66, 0.34] };
    var nProp, nCtrl, nReg, em; paneles.prop = { titulo: 'Propiedades', montar: function (n) { n.classList.add('dkm-p', 'dkm-comun'); nProp = n; } }; paneles.ctrl = { titulo: 'Control documental', montar: function (n) { n.classList.add('dkm-p', 'dkm-comun'); nCtrl = n; } };
    var dock = window.REDock(host, { clave: 'reyengi-dkm3-' + cfg.clave, paneles: paneles, inicial: inicial, alCambiar: function () { setTimeout(function () { avisar(); window.dispatchEvent(new Event('resize')); }, 30); } });
    (cfg.ocultar || []).forEach(function (q) { [].forEach.call(sec.querySelectorAll(q), function (e) { if (!e.closest('.dkm-host')) e.classList.add('dkm-oculto'); }); });
    // Barra de recuperación: aparece solo si hay paneles cerrados o si las pestañas se separaron; permite volver a mostrarlos y reagruparlos
    var av = document.createElement('div'); av.className = 'dkm-aviso'; av.hidden = true; sec.insertBefore(av, host);
    function forma(n) { return n.t === 'tabs' ? 'T(' + n.p.slice().sort().join(',') + ')' : n.t + '[' + n.c.map(forma).join('|') + ']'; }
    function avisar() { var ce = dock.cerrados(), sep = false; try { sep = forma(dock.disposicion()) !== forma(inicial); } catch (e) {}
      var h = ce.map(function (id) { return '<button type="button" class="dkm-mostrar" data-id="' + id + '">Mostrar ' + esc(paneles[id].titulo) + '</button>'; }).join('');
      if (ce.length || sep) h = (ce.length ? '<span>Paneles cerrados:</span>' : '<span>Las pestañas están separadas.</span>') + h + '<button type="button" data-re="1">Reagrupar pestañas</button>';
      if (av.dataset.h !== h) { av.dataset.h = h; av.innerHTML = h; av.hidden = !h; if (typeof alto === 'function') alto(); } }
    av.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.dataset.id && b.dataset.id !== principal) dock.abrir(b.dataset.id); else dock.restablecer();   // el plano o documento vuelve a su lugar, a la izquierda setTimeout(avisar, 50); });
    setTimeout(avisar, 100);
    // Lo que quedó fuera de los paneles (barras de botones, estados) se junta en la pestaña Acciones
    setTimeout(function () { if (!nAcc) return; [].slice.call(sec.children).forEach(function (c) { if (c === host || /^(DIALOG|SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName) || c.classList.contains('dkm-oculto') || c.classList.contains('dkm-aviso')) return; nAcc.appendChild(c); });
      if (!nAcc.children.length) nAcc.innerHTML = '<p class="nota">Este entregable no tiene acciones propias.</p>'; alto(); }, 0);
    cfg.paneles.forEach(function (p) { if (p.zoom) try { zoomPlano(host.querySelector(p.zoom)); } catch (e) {} });
    (cfg.limpiar || []).forEach(function (q) { [].forEach.call(sec.querySelectorAll(q), function (e) { if (!e.closest('.dkm-host') && !e.children.length) e.remove(); else if (!e.closest('.dkm-host') && e.matches('h2')) e.remove(); }); });
    function comunes() { if (nProp) { nProp.innerHTML = htmlProp(); nProp.appendChild(pie); } if (!nCtrl) return;
      if (!window.RE_GESTION) { nCtrl.innerHTML = htmlCtrl(); return; }
      if (!nReg) { nCtrl.innerHTML = ''; var ne = document.createElement('div'); ne.className = 'dkm-em'; nReg = document.createElement('div'); nCtrl.append(ne, nReg); try { em = emision(ne, sec, cfg); } catch (e) { console.warn('Emisión', e); } }
      nReg.innerHTML = htmlCtrl(); if (em) em.refrescar(); }
    function alto() { if (sec.hidden || window.matchMedia('(max-width: 900px)').matches) return; var t = host.getBoundingClientRect().top + window.scrollY - (sec.getBoundingClientRect().top + window.scrollY), top = host.getBoundingClientRect().top; host.style.height = Math.max(460, window.innerHeight - Math.max(top, 90) - 30) + 'px'; }
    var clave = ''; setInterval(function () { if (sec.hidden) return; var a = actual(), k = a ? a.href + '|' + (a.hijo ? (a.hijo.t || a.hijo.s) : '') : ''; try { var ax = window.RE_EMISION.adaptadores[sec.id]; if (ax) k += '|' + ax.actual() + '|' + ax.items().length; } catch (e) {} if (k !== clave) { clave = k; comunes(); } }, 900);
    var tg = 0, esp = setInterval(function () { if (window.RE_GESTION) { clearInterval(esp); window.RE_GESTION.alCambiar(comunes); comunes(); } else if (++tg > 40) clearInterval(esp); }, 200);
    llena(); setTimeout(llena, 1500); new MutationObserver(function () { setTimeout(llena, 0); if (!sec.hidden) { alto(); comunes(); window.dispatchEvent(new Event('resize')); } }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('resize', alto); alto(); setTimeout(alto, 400); comunes();
    br.textContent = 'Reagrupar pestañas'; br.addEventListener('click', function () { dock.restablecer(); setTimeout(avisar, 50); });
    bp.addEventListener('click', function () { var v = document.querySelector('.dk-menu'); if (v) { v.remove(); return; } var m = document.createElement('div'); m.className = 'dk-menu'; m.setAttribute('role', 'menu'); var r = bp.getBoundingClientRect(), ce = dock.cerrados();
      Object.keys(paneles).forEach(function (id) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemcheckbox'); var ab = ce.indexOf(id) < 0; b.setAttribute('aria-checked', ab); b.textContent = (ab ? '✓ ' : '   ') + paneles[id].titulo; b.onclick = function () { m.remove(); if (ab) dock.cerrar(id); else dock.abrir(id); }; m.append(b); });
      document.body.append(m); m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px'; m.firstChild.focus();
      setTimeout(function () { function fuera(ev) { if (!m.contains(ev.target) && ev.target !== bp) { m.remove(); document.removeEventListener('pointerdown', fuera); } } document.addEventListener('pointerdown', fuera); }, 0); });
    return dock;
  };
})();
