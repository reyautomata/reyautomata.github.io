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

  // cfg: { clave, paneles: [{ id, titulo, mover: [selector | función(sec) → elemento(s)] }], inicial, limpiar: [selectores a quitar si quedan vacíos] }
  function apagada() { try { return /[?&]simple=1/.test(location.search) || localStorage.getItem('reyengi-mesa-off') === '1'; } catch (e) { return false; } }
  function fijar(off) { try { if (off) localStorage.setItem('reyengi-mesa-off', '1'); else localStorage.removeItem('reyengi-mesa-off'); } catch (e) {} location.href = location.href.replace(/([?&])simple=1&?/, '$1').replace(/[?&]$/, ''); if (!/[?&]simple=1/.test(location.search)) location.reload(); }
  window.REMesaModulo = function (sec, cfg) {
    if (!sec || sec.dataset.dkm) return null;
    if (apagada()) { sec.dataset.dkm = 'off'; var bs = document.createElement('div'); bs.className = 'dkm-barra sola'; var ba = document.createElement('button'); ba.type = 'button'; ba.textContent = 'Activar mesa de trabajo'; ba.onclick = function () { fijar(false); }; bs.append(ba); sec.insertBefore(bs, sec.firstChild); return null; }
    var piezas = {}, falta = false;
    cfg.paneles.forEach(function (p) { var l = []; p.mover.forEach(function (m) { var r = typeof m === 'function' ? m(sec) : sec.querySelector(m); if (!r) return; (r.length != null && !r.tagName ? [].slice.call(r) : [r]).forEach(function (e) { if (e && l.indexOf(e) < 0) l.push(e); }); }); if (!l.length) falta = true; piezas[p.id] = l; });
    if (falta) return null; // el módulo cambió: se deja como estaba
    sec.dataset.dkm = '1';
    var barra = document.createElement('div'); barra.className = 'dkm-barra'; var bp = document.createElement('button'); bp.type = 'button'; bp.textContent = 'Paneles'; bp.setAttribute('aria-haspopup', 'menu'); var br = document.createElement('button'); br.type = 'button'; br.textContent = 'Restablecer disposición'; var bc = document.createElement('button'); bc.type = 'button'; bc.textContent = 'Vista clásica'; bc.title = 'Volver al diseño anterior, sin paneles'; bc.onclick = function () { fijar(true); }; barra.append(bp, br, bc);
    var host = document.createElement('div'); host.className = 'dkm-host'; sec.append(barra, host);
    var paneles = {}; cfg.paneles.forEach(function (p) { paneles[p.id] = { titulo: p.titulo, montar: function (n) { n.classList.add('dkm-p'); piezas[p.id].forEach(function (e) { n.appendChild(e); }); } }; });
    var nProp, nCtrl; paneles.prop = { titulo: 'Propiedades', montar: function (n) { n.classList.add('dkm-p', 'dkm-comun'); nProp = n; } }; paneles.ctrl = { titulo: 'Control documental', montar: function (n) { n.classList.add('dkm-p', 'dkm-comun'); nCtrl = n; } };
    var dock = window.REDock(host, { clave: 'reyengi-dkm-' + cfg.clave, paneles: paneles, inicial: cfg.inicial, alCambiar: function () { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30); } });
    (cfg.limpiar || []).forEach(function (q) { [].forEach.call(sec.querySelectorAll(q), function (e) { if (!e.closest('.dkm-host') && !e.children.length) e.remove(); else if (!e.closest('.dkm-host') && e.matches('h2')) e.remove(); }); });
    function comunes() { if (nProp) nProp.innerHTML = htmlProp(); if (nCtrl) nCtrl.innerHTML = htmlCtrl(); }
    function alto() { if (sec.hidden || window.matchMedia('(max-width: 900px)').matches) return; var t = host.getBoundingClientRect().top + window.scrollY - (sec.getBoundingClientRect().top + window.scrollY), top = host.getBoundingClientRect().top; host.style.height = Math.max(460, window.innerHeight - Math.max(top, 90) - 30) + 'px'; }
    var clave = ''; setInterval(function () { if (sec.hidden) return; var a = actual(), k = a ? a.href + '|' + (a.hijo ? (a.hijo.t || a.hijo.s) : '') : ''; if (k !== clave) { clave = k; comunes(); } }, 900);
    var tg = 0, esp = setInterval(function () { if (window.RE_GESTION) { clearInterval(esp); window.RE_GESTION.alCambiar(comunes); comunes(); } else if (++tg > 40) clearInterval(esp); }, 200);
    new MutationObserver(function () { if (!sec.hidden) { alto(); comunes(); window.dispatchEvent(new Event('resize')); } }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('resize', alto); alto(); setTimeout(alto, 400); comunes();
    br.addEventListener('click', function () { dock.restablecer(); });
    bp.addEventListener('click', function () { var v = document.querySelector('.dk-menu'); if (v) { v.remove(); return; } var m = document.createElement('div'); m.className = 'dk-menu'; m.setAttribute('role', 'menu'); var r = bp.getBoundingClientRect(), ce = dock.cerrados();
      Object.keys(paneles).forEach(function (id) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemcheckbox'); var ab = ce.indexOf(id) < 0; b.setAttribute('aria-checked', ab); b.textContent = (ab ? '✓ ' : '   ') + paneles[id].titulo; b.onclick = function () { m.remove(); if (ab) dock.cerrar(id); else dock.abrir(id); }; m.append(b); });
      document.body.append(m); m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px'; m.firstChild.focus();
      setTimeout(function () { function fuera(ev) { if (!m.contains(ev.target) && ev.target !== bp) { m.remove(); document.removeEventListener('pointerdown', fuera); } } document.addEventListener('pointerdown', fuera); }, 0); });
    return dock;
  };
})();
