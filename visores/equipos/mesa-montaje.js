/* Detalles de montaje · el visor abierto como mesa de trabajo, igual que el resto de los planos.
 * A la izquierda, a la par, el visor 3D y el plano 2D de montaje (cada uno se activa o desactiva con su botón);
 * a la derecha, en pestañas, Acciones, Propiedades y Control documental (revisiones y emisión).
 * El visor sigue siendo el mismo (va en su marco); aquí solo se le pide la lámina y se le escribe la revisión de la viñeta. */
(function () {
  'use strict';
  var viewer = document.getElementById('viewer'), frame = document.getElementById('frame');
  if (!viewer || !frame || !window.REMesaModulo || window.self !== window.top) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var dock = null, hueco = null, hoja = null, estado = null, ult = null, jpg = '', codigo = '', tGen = 0, generando = false, cola = [];
  function W() { try { return frame.contentWindow; } catch (e) { return null; } }
  function D() { var w = W(); try { return w && w.document; } catch (e) { return null; } }
  function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  // Detalle en pantalla: código del tipo de montaje (por ejemplo 1-A1) y su nombre, tal como los muestra el visor
  function detalle() { var d = D(), b = d && d.querySelector('.badge'); if (!b) return null; var c = txt(b.querySelector('b')), sp = b.querySelectorAll('span'); return c ? { code: c, name: txt(sp[sp.length - 1]) } : null; }
  function datos() { var o = {}; try { o = window.REProyectos.leer('montaje', {}) || {}; } catch (e) {} o.det = o.det || {}; return o; }
  function campo(et) { var d = D(); if (!d) return null; var l = [].filter.call(d.querySelectorAll('.pv-campos label'), function (x) { return txt(x).indexOf(et) === 0; })[0]; return l ? l.querySelector('input') : null; }
  function ponerCampo(et, v) { var i = campo(et), w = W(); if (!i || i.value === v) return; i.value = v; i.dispatchEvent(new w.Event('input', { bubbles: true })); }
  function boton(re) { var d = D(); return d ? [].filter.call(d.querySelectorAll('aside button, .plano-bar button'), function (b) { return re.test(txt(b)); })[0] : null; }

  // ── Estructura: la barra superior queda fija; el visor 3D va en su marco, superpuesto al panel «Visor 3D» ──
  viewer.querySelector('.vbar').classList.add('dkm-fijo'); frame.classList.add('dkm-fijo');
  var conm = document.createElement('div'); conm.className = 'mm-modo'; conm.setAttribute('role', 'group'); conm.setAttribute('aria-label', 'Vistas activas');
  conm.innerHTML = '<button type="button" data-p="v3d" aria-pressed="true">Visor 3D</button><button type="button" data-p="p2d" aria-pressed="true">Plano 2D</button>';
  var tit = document.getElementById('vTitle'); tit.parentNode.insertBefore(conm, tit.nextSibling);
  hueco = document.createElement('div'); hueco.id = 'mmHueco'; hueco.className = 'mm-hueco';
  var plano = document.createElement('div'); plano.id = 'mmPlano'; plano.className = 'mm-plano';
  plano.innerHTML = '<p class="mm-est" id="mmEst" aria-live="polite">El plano se genera desde el modelo 3D.</p><div class="mm-hoja" id="mmHoja"></div>';
  var acc = document.createElement('div'); acc.className = 'herr mm-acc';
  acc.innerHTML = '<button type="button" class="pri" data-m="gen">Actualizar plano 2D</button><button type="button" data-m="aj">Ajustar plano (vistas, globos, viñeta)</button><button type="button" data-m="pdf">Descargar PDF + DXF</button><button type="button" data-m="dxf">Solo DXF</button><button type="button" data-m="png">Descargar PNG</button>' +
    '<p class="nota">El plano 2D toma el tipo de montaje, el despiece y el ángulo que tenga el visor 3D. La revisión de la viñeta sale del cuadro de revisiones, en Control documental.</p>';
  hoja = plano.querySelector('#mmHoja'); estado = plano.querySelector('#mmEst');

  var st = document.createElement('style');
  st.textContent = '.viewer>.dkm-barra.sola{position:absolute;right:12px;bottom:10px;z-index:3;margin:0}.viewer.mm{display:flex;flex-direction:column}.viewer.mm .dkm-host{flex:1;min-height:0;height:auto!important;margin:6px 8px 8px}.viewer.mm .dkm-aviso{margin:6px 8px 0}' +
    '.viewer.mm>iframe{position:fixed;z-index:21;width:auto;height:auto;border:0}.mm-hueco{height:100%;min-height:200px}.dkm-p:has(>.mm-hueco){padding:0;height:100%;box-sizing:border-box}' +
    '.mm-hoja img{display:block;width:100%;height:auto;background:#fff;border-radius:4px;box-shadow:0 6px 24px rgba(0,0,0,.4)}.mm-est{margin:0 0 8px;color:var(--muted);font-size:12.5px}' +
    '.mm-modo{display:flex;gap:4px;flex:none}.vbar .mm-modo button{background:transparent;border:1px solid rgba(255,255,255,.45);color:#fff}.vbar .mm-modo button[aria-pressed=true]{background:#159DDA;border-color:#159DDA;color:#04121c}' +
    '.mm-acc{display:flex;flex-direction:column;gap:6px}.mm-acc button{font:600 12.5px var(--f-body,system-ui,sans-serif);color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:7px 10px;cursor:pointer;text-align:left}' +
    '.mm-acc button.pri{background:var(--accent);border-color:var(--accent);color:#1b0d02}.mm-acc button:hover{border-color:var(--sel)}.mm-acc button:focus-visible{outline:2px solid var(--sel);outline-offset:1px}.mm-acc .nota{color:var(--muted);font-size:12px;margin:4px 0 0}';
  document.head.appendChild(st);

  // ── Revisiones y emisión: un cuadro por tipo de montaje, guardado con el proyecto ──
  if (window.RE_EMISION && window.RE_EMISION.simple) window.RE_EMISION.simple('viewer', {
    gen: 'P06-MONT', item: function (id) { return 'Montaje ' + id; },
    items: function () { var d = detalle(); if (!d) return []; var r = (datos().det[d.code] || {}).revs || []; return [{ id: d.code, codigo: (campo('N° de plano') || {}).value || d.code, titulo: 'Montaje ' + d.code + ' · ' + d.name, rev: (r[r.length - 1] || {}).rev || '' }]; },
    actual: function () { var d = detalle(); return d ? d.code : null; },
    leer: function (id) { var r = datos().det[id]; return r && r.revs ? r.revs : null; }, comunes: function () { return []; },
    escribir: function (id, f) { var o = datos(); o.det[id] = Object.assign({}, o.det[id], { revs: f }); try { window.REProyectos.escribir('montaje', o); } catch (e) { console.warn('Montaje', e); } },
    repintar: function () { vineta(); generar(); }
  });
  if (window.RE_EMISION && window.RE_EMISION.adaptadores.viewer) Object.assign(window.RE_EMISION.adaptadores.viewer, {
    formatos: ['PDF', 'DXF', 'PNG'], vista: function () { return jpg ? '<div style="background:#fff"><img alt="Plano de montaje emitido" style="display:block;width:100%;height:auto" src="' + jpg + '"></div>' : ''; },
    descargar: function (ids, f) { bajar(f === 'PDF' ? 'pdf' : f === 'DXF' ? 'dxf' : 'png'); }
  });
  // La revisión vigente del cuadro se escribe en la viñeta del plano (campo Revisión de la ventana de ajuste del visor)
  function vineta() { var d = detalle(); if (!d) return; var r = (datos().det[d.code] || {}).revs; if (!r) return; var u = r[r.length - 1] || {}; ponerCampo('Revisión', u.rev || ''); if (u.por) ponerCampo('Dibujó', u.por); if (u.reviso) ponerCampo('Revisó', u.reviso); if (u.aprobo) ponerCampo('Aprobó', u.aprobo); }

  // Pestaña Propiedades: ficha del detalle en pantalla, su lista de materiales y sus notas (tal como las muestra el visor)
  function bom() { var d = D(), f = []; if (!d) return f; [].some.call(d.querySelectorAll('aside table'), function (tb) { if (!/ÍTEM|ITEM/i.test(txt(tb.querySelector('thead') || tb.rows[0]))) return false; [].forEach.call(tb.querySelectorAll('tbody tr'), function (r) { var c = [].map.call(r.cells, txt); if (c.length >= 3) f.push(c.slice(0, 3)); }); return true; }); return f; }
  if (window.RE_PROP_EXTRA) window.RE_PROP_EXTRA.viewer = function () {
    var de = detalle(); if (!de) return '<p class="nota">Abriendo el visor…</p>'; var d = D(), b = bom(), r = (datos().det[de.code] || {}).revs || [], u = r[r.length - 1], notas = [];
    [].forEach.call(d.querySelectorAll('aside .notas li, aside p, aside li'), function (li) { var t = txt(li); if (t && (li.closest('.notas') || /^Nota\s*\d+/i.test(t)) && notas.indexOf(t) < 0 && notas.length < 12) notas.push(t); });
    var h = '<h3 class="dkm-t">Detalle de montaje</h3><dl class="dkm-dl"><dt>Código</dt><dd>' + esc(de.code) + '</dd><dt>Tipo</dt><dd>' + esc(de.name) + '</dd><dt>Visor</dt><dd>' + esc((viewer.dataset.title || '').replace(/^Visor 3D /, '')) + '</dd>' +
      '<dt>N° de plano</dt><dd>' + esc((campo('N° de plano') || {}).value || '—') + '</dd><dt>Revisión</dt><dd>' + (u ? esc(u.rev) + ' · ' + esc(u.fecha) : 'sin revisión') + '</dd><dt>Materiales</dt><dd>' + b.length + ' ítem(s)</dd></dl>';
    if (b.length) h += '<h3 class="dkm-t">Lista de materiales</h3><table class="dkm-bom"><tr><th>Ítem</th><th>Descripción</th><th>Cant.</th></tr>' + b.map(function (f) { return '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td><td>' + esc(f[2]) + '</td></tr>'; }).join('') + '</table>';
    if (notas.length) h += '<h3 class="dkm-t">Notas de montaje</h3><ul class="dkm-notas">' + notas.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    return h;
  };
  // ── Plano 2D: se pide la lámina al visor y se muestra a la par ──
  function generar(luego) {
    var w = W(); if (!w || !w.__planoGen) return; if (generando) { if (luego) cola.push(luego); return; }   // si ya se está generando, la descarga espera a esa lámina
    if (dock && dock.cerrados().indexOf('p2d') >= 0 && !luego) return;
    generando = true; estado.textContent = 'Generando el plano 2D…';
    var fin = setTimeout(function () { generando = false; estado.textContent = 'No se pudo generar el plano. Pulsa «Actualizar plano 2D».'; }, 20000);
    try { w.__planoGen(function (g) {
      clearTimeout(fin); generando = false; ult = g;
      hoja.innerHTML = '<img alt="Plano de montaje ' + esc(g.d.code || '') + '" src="' + g.png + '">';
      estado.textContent = 'Plano ' + (g.d.code || '') + ' · generado desde el modelo 3D con la vista actual del visor.';
      var im = new Image(); im.onload = function () { try { var c = document.createElement('canvas'), k = Math.min(1, 2200 / im.width); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); jpg = c.toDataURL('image/jpeg', 0.85); } catch (e) { jpg = ''; } }; im.src = g.png;
      if (luego) luego(g); cola.splice(0).forEach(function (f) { f(g); });
    }); } catch (e) { clearTimeout(fin); generando = false; estado.textContent = 'No se pudo generar el plano en este dispositivo.'; }
  }
  function guardarArchivo(datosB, nombre, tipo) { var a = document.createElement('a'); a.href = URL.createObjectURL(datosB instanceof Blob ? datosB : new Blob([datosB], { type: tipo })); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
  function bajar(f) { generar(function (g) {
    if (f === 'png') fetch(g.png).then(function (r) { return r.blob(); }).then(function (b) { guardarArchivo(b, g.name + '.png'); });
    else { if (f === 'pdf') guardarArchivo(g.pdf, g.name + '.pdf', 'application/pdf'); setTimeout(function () { guardarArchivo(g.dxf, g.name + '.dxf', 'application/dxf'); }, f === 'pdf' ? 400 : 0); }
  }); }
  acc.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var m = b.dataset.m;
    if (m === 'gen') { ult = null; generar(); if (dock) dock.abrir('p2d'); }
    else if (m === 'aj') { var bt = boton(/^Ajustar plano/); if (bt) { if (dock) dock.abrir('v3d'); bt.click(); } }
    else { ult = null; bajar(m); } });

  // ── Montaje de la mesa (la primera vez que se abre un visor) y seguimiento del visor ──
  function encajar() { if (!dock) return; var visible = hueco.offsetParent !== null && !viewer.hidden;
    if (!visible) { frame.style.visibility = 'hidden'; return; } var r = hueco.getBoundingClientRect();
    frame.style.visibility = ''; frame.style.left = r.left + 'px'; frame.style.top = r.top + 'px'; frame.style.width = r.width + 'px'; frame.style.height = r.height + 'px'; }
  function modos() { if (!dock) return; var ce = dock.cerrados(); [].forEach.call(conm.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(ce.indexOf(b.dataset.p) < 0)); }); }
  conm.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || !dock) return; var id = b.dataset.p;
    if (dock.cerrados().indexOf(id) >= 0) { dock.abrir(id); if (id === 'p2d') setTimeout(function () { generar(); }, 200); } else dock.cerrar(id); setTimeout(function () { modos(); encajar(); }, 60); });
  function montar() {
    if (dock || viewer.hidden) return;
    viewer.append(hueco, plano, acc);
    try { dock = window.REMesaModulo(viewer, { clave: 'montaje', principales: ['v3d', 'p2d'], principal: 'v3d', sinNav: true,
      paneles: [{ id: 'v3d', titulo: 'Visor 3D', mover: ['#mmHueco'] }, { id: 'p2d', titulo: 'Plano 2D', mover: ['#mmPlano'], zoom: '#mmHoja' }] }); } catch (e) { console.warn('Mesa de montaje', e); }
    if (!dock) { conm.hidden = true; hueco.remove(); plano.remove(); acc.remove(); return; }   // vista clásica: el visor queda como antes
    viewer.classList.add('mm'); (function ciclo() { encajar(); modos(); requestAnimationFrame(ciclo); })();
  }
  function seguir() { // cada segundo: si cambió el tipo de montaje en el visor, se actualizan la viñeta y el plano
    if (viewer.hidden || !dock) return; var d = detalle(), w = W(); if (!d || !w || !w.__planoGen) return;
    if (d.code !== codigo) { codigo = d.code; ult = null; vineta(); clearTimeout(tGen); tGen = setTimeout(function () { generar(); }, 700); } }
  new MutationObserver(function () { if (!viewer.hidden) { codigo = ''; ult = null; jpg = ''; hoja.innerHTML = ''; estado.textContent = 'El plano se genera desde el modelo 3D.'; setTimeout(montar, 0); } }).observe(viewer, { attributes: true, attributeFilter: ['hidden'] });
  setInterval(seguir, 1000);
  if (!viewer.hidden) setTimeout(montar, 0);
})();
