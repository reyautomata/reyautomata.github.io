/* Suite ReyEngi · mesa de trabajo: pestañas de lo que se tiene abierto, panel de propiedades y atajos de guardar y abrir.
 * Las pestañas recuerdan los módulos y entregables abiertos (la suite navega entre páginas, así que cada pestaña es un enlace vivo).
 * El panel de propiedades muestra lo que la suite sabe del entregable en pantalla: registro, formatos, revisión, estado y archivos. */
(function () {
  'use strict';
  if (window.__RS_TRABAJO || window.top !== window || !window.RS_ACTUAL) return; window.__RS_TRABAJO = 1;
  var BASE = window.RS_BASE, R = window.RE_ENTREGABLES, P = window.REProyectos, CL = 'reyengi-pestanas';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var T = { tabs: [], prop: false }; try { Object.assign(T, JSON.parse(localStorage.getItem(CL) || '{}')); } catch (e) {} T.tabs = T.tabs || [];
  function guardar() { try { localStorage.setItem(CL, JSON.stringify(T)); } catch (e) {} }
  var ruta = document.getElementById('rsRuta'); if (!ruta) return;
  var bar = document.createElement('nav'); bar.className = 'rs-tabsw'; bar.id = 'rsTabs'; bar.setAttribute('aria-label', 'Pestañas de trabajo'); ruta.insertAdjacentElement('afterend', bar);
  var pan = document.createElement('aside'); pan.className = 'rs-prop'; pan.id = 'rsProp'; pan.setAttribute('aria-label', 'Propiedades'); pan.hidden = true; document.body.appendChild(pan);
  var clave = '';
  function item() { var a = window.RS_ACTUAL(); if (!a) return null; var h = a.hijo; return h ? { k: a.href + '|' + (h.t || h.s), c: h.t || a.cod, t: h.s || a.t, href: h.href.indexOf(BASE) === 0 ? h.href.slice(BASE.length) : (/^#/.test(h.href) ? a.href.replace(/#.*$/, '') + h.href : h.href) } : { k: a.href, c: a.cod, t: a.t, href: a.href }; }
  function pintarTabs() {
    var it = item();
    bar.innerHTML = '<div class="rs-tl" role="list">' + T.tabs.map(function (x, i) { var on = it && x.k === it.k;
      return '<span class="rs-tab' + (on ? ' on' : '') + '" role="listitem"><a href="' + esc(BASE + x.href) + '"' + (on ? ' aria-current="page"' : '') + ' title="' + esc(x.t) + '"><b>' + esc(x.c || '') + '</b> ' + esc(x.t) + '</a><button type="button" data-x="' + i + '" aria-label="Cerrar la pestaña ' + esc(x.t) + '">×</button></span>'; }).join('') + '</div>' +
      '<button type="button" id="rsPropBtn" aria-pressed="' + !!T.prop + '" title="Mostrar u ocultar las propiedades">Propiedades</button>';
    var on = bar.querySelector('.rs-tab.on'), tl = bar.querySelector('.rs-tl'); if (on && tl) tl.scrollLeft = Math.max(0, on.offsetLeft - tl.offsetLeft - 40);
  }
  function anotar() { var it = item(); if (!it) return; var i = -1; T.tabs.forEach(function (x, j) { if (x.k === it.k) i = j; });
    if (i < 0) { T.tabs.push(it); if (T.tabs.length > 9) T.tabs.shift(); guardar(); } }
  bar.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]'); if (x) { var q = T.tabs.splice(+x.dataset.x, 1)[0], it = item(); cerradas[q.k] = 1; guardar(); pintarTabs(); if (it && q.k === it.k) { var sig = T.tabs[T.tabs.length - 1]; location.href = sig ? BASE + sig.href : BASE; } return; }
    if (e.target.closest('#rsPropBtn')) { T.prop = !T.prop; guardar(); pintarTabs(); pintarProp(); }
  });
  var cerradas = {};
  // ── Propiedades ──
  function pintarProp() {
    pan.hidden = !T.prop; document.body.classList.toggle('rs-conprop', !!T.prop); if (!T.prop) return;
    var a = window.RS_ACTUAL(), G = window.RE_GESTION, h = '<div class="rs-pc"><b>Propiedades</b><button type="button" id="rsPropX" aria-label="Cerrar las propiedades">✕</button></div>';
    if (!a) { pan.innerHTML = h + '<p class="rs-pn">Abre un módulo o entregable para ver sus propiedades.</p>'; return; }
    var gens = R ? R.generadores.filter(function (g) { return new URL(g.module, BASE).href === new URL(a.href, BASE).href; }) : [], pr = P ? P.activo() : null;
    function fila(k, v) { return v ? '<dt>' + k + '</dt><dd>' + esc(v) + '</dd>' : ''; }
    h += '<h3>' + esc(a.hijo ? ((a.hijo.t ? a.hijo.t + ' · ' : '') + a.hijo.s) : a.t) + '</h3><dl>' + fila('Módulo', a.t) + fila('Grupo', a.g) + (pr ? fila('Proyecto', (pr.nombre || pr.proyecto) + (pr.numero ? ' · ' + pr.numero : '')) + fila('Revisión del proyecto', pr.rev) : '') + '</dl>';
    gens.forEach(function (g) { h += '<h4>' + (g.category === 'PLANO' ? 'Plano' : 'Documento') + ' · ' + g.subcategory + '</h4><dl>' + fila('Entregable', g.name) + fila('Identificador', g.id) + fila('Disciplina', g.discipline) + fila('Entradas', g.inputFormats.join(', ')) + fila('Salidas', g.outputFormats.join(', ') || 'visor') + '</dl><p><a href="' + BASE + 'generador/#g=' + g.id + '">Abrir en el generador</a></p>'; });
    if (G && gens.length) { var ids = gens.map(function (g) { return g.id; }), it = a.hijo ? (a.hijo.t || a.hijo.s) : '';
      var regs = G.lista().filter(function (d) { return ids.indexOf(d.gen) >= 0 && (!it || d.item === it || d.titulo.indexOf(it) >= 0); }).sort(function (x, y) { return x.modificado < y.modificado ? 1 : -1; }).slice(0, 6);
      h += '<h4>Control documental</h4>' + (regs.length ? regs.map(function (d) { return '<div class="rs-pr"><b>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo) + '</b><span>Rev. ' + esc(d.rev) + ' · ' + esc(d.estado) + '</span>' + ((d.archivos || []).length ? '<span>' + d.archivos.length + ' archivo' + (d.archivos.length > 1 ? 's' : '') + ' en la carpeta del proyecto</span>' : '') + '</div>'; }).join('') : '<p class="rs-pn">Sin registros todavía: se crean al exportar o desde el generador.</p>') + '<p><a href="' + BASE + 'documentos/">Abrir el control documental</a></p>'; }
    if (!gens.length) h += '<p class="rs-pn">Esta página es una herramienta o vista de datos: no genera un entregable registrado.</p>';
    pan.innerHTML = h;
  }
  pan.addEventListener('click', function (e) { if (e.target.closest('#rsPropX')) { T.prop = false; guardar(); pintarTabs(); pintarProp(); } });
  function ciclo() { var it = item(), k = it ? it.k : ''; if (k === clave) return; clave = k; if (it && !cerradas[it.k]) anotar(); pintarTabs(); pintarProp(); }
  ciclo(); setInterval(ciclo, 700);
  var tg = 0, esp = setInterval(function () { if (window.RE_GESTION) { clearInterval(esp); window.RE_GESTION.alCambiar(pintarProp); pintarProp(); } else if (++tg > 40) clearInterval(esp); }, 150);

  // ── Atajos: Ctrl+S guarda un respaldo del proyecto · Ctrl+O abre el control documental ──
  function aviso(t) { var d = document.createElement('div'); d.setAttribute('role', 'status'); d.className = 'rs-aviso'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4500); }
  window.RS_RESPALDO = function () {
    if (!P) return; var pr = P.activo(), txt = P.exportar(pr.id), nom = String(pr.nombre || pr.proyecto || 'Proyecto').replace(/[\\/:*?"<>|]+/g, '-') + ' - respaldo ' + new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '') + '.json';
    var A = window.RE_ARCHIVOS, blob = new Blob([txt], { type: 'application/json' });
    function bajar() { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); aviso('Respaldo del proyecto descargado: ' + nom); }
    if (!A) return bajar();
    A.raiz().then(function (h) { if (!h) return bajar(); return A.permiso(h, true).then(function (q) { if (q !== 'granted') return bajar();
      return A.dir(h, ['06_RESPALDOS'], true).then(function (d) { return d.getFileHandle(nom, { create: true }); }).then(function (f) { return f.createWritable(); }).then(function (w) { return w.write(blob).then(function () { return w.close(); }); }).then(function () { aviso('Respaldo guardado en la carpeta del proyecto: 06_RESPALDOS/' + nom); }); }); }).catch(bajar);
  };
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return; var k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); window.RS_RESPALDO(); } else if (k === 'o') { e.preventDefault(); location.href = BASE + 'documentos/'; }
  });
})();
