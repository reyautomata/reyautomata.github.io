/* Mesa de trabajo · explorar y analizar el proyecto con paneles acoplables (REDock). Todo sale de datos reales del proyecto. */
(function () {
  'use strict';
  var R = window.RE_ENTREGABLES, G = window.RE_GESTION, P = window.REProyectos, $ = function (s) { return document.querySelector(s); }; if (!R || !P || !window.REDock) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var COL = { 'Borrador': '#94A9BE', 'En desarrollo': '#159DDA', 'En revisión': '#E6A23C', 'Con observaciones': '#E35B65', 'Aprobado': '#27B783', 'Emitido': '#38C8E8', 'Obsoleto': '#55657a' };
  var sel = null, filtro = '', N = {};
  function leer(k) { try { return P.leer(k, null); } catch (e) { return null; } }
  function contar() { var L = leer('lazos') || {}, PID = leer('pid') || {}, H = window.RS_HIJOS || function () { return []; }, s = (L.senales || []).filter(function (x) { return x.tag; }).length;
    N = { instrumentos: s + (L.inst || []).filter(function (i) { return i.manual && !i.oculto; }).length, senales: (L.senales || []).length, lazos: H('06').length, tarjetas: (L.modulos || []).length, ductos: H('H3').length, pid: (PID.cand || []).length };
    return { 'D05-INST': N.instrumentos, 'D05-ES': N.senales, 'P02-LAZO': N.lazos, 'P08-DUCTO': N.ductos, 'D01-CONDUIT': N.ductos, 'P01-PID': N.pid }; }
  function gen() { return R.generadores.filter(function (g) { return g.id === sel; })[0] || null; }
  // ── Panel: entregables ──
  function pEnt(n) { n.className += ' p'; n.innerHTML = '<input type="search" id="eBus" placeholder="Filtrar entregables" aria-label="Filtrar entregables"><ul class="lst" id="eLst"></ul>'; n.querySelector('#eBus').addEventListener('input', function (e) { filtro = e.target.value.toLowerCase(); lista(); }); }
  function lista() { var ul = document.getElementById('eLst'); if (!ul) return; var C = contar(), h = '';
    [['DOCUMENTO', 'Documentos de ingeniería'], ['PLANO', 'Planos de ingeniería']].forEach(function (c) { var filas = '';
      R.de(c[0]).forEach(function (x) { var ok = x.gens.filter(function (g) { return g.status === 'AVAILABLE' && (!filtro || (g.name + ' ' + x.sub.name + ' ' + g.id).toLowerCase().indexOf(filtro) >= 0); });
        if (!ok.length) { if (!filtro && x.sub.status !== 'AVAILABLE') filas += '<li class="dev"><span class="cod">' + x.sub.id + '</span><span>' + esc(x.sub.name) + '</span><em>En desarrollo</em></li>'; return; }
        ok.forEach(function (g) { filas += '<li><button type="button" data-g="' + g.id + '" aria-current="' + (g.id === sel) + '"><span class="cod">' + g.subcategory + '</span><span>' + esc(g.name) + '</span>' + (C[g.id] ? '<span class="ct">' + C[g.id] + '</span>' : '') + '</button></li>'; }); });
      if (filas) h += '<li><h4>' + c[1] + '</h4></li>' + filas; });
    ul.innerHTML = h || '<li class="nota">Nada coincide con el filtro.</li>'; }
  // ── Panel: vista del módulo ──
  var marco = null;
  function pVista(n) { n.style.cssText = 'position:relative;height:100%'; marco = document.createElement('iframe'); marco.className = 'vista'; marco.title = 'Vista del módulo seleccionado'; n.append(marco); var v = document.createElement('p'); v.className = 'nota p'; v.id = 'vNota'; n.append(v); }
  function vista() { if (!marco) return; var g = gen(), nota = document.getElementById('vNota');
    if (!g) { marco.hidden = true; nota.hidden = false; nota.textContent = 'Elige un entregable en el panel «Entregables» para verlo aquí.'; return; }
    var u = new URL('../' + g.module, location.href).href; if (/^#/.test(g.module)) { marco.hidden = true; nota.hidden = false; nota.innerHTML = 'Este entregable usa visores 3D en la portada. <a href="' + esc(u) + '">Abrir ' + esc(g.name) + '</a>'; return; }
    nota.hidden = true; marco.hidden = false; if (marco.dataset.u !== u) { marco.dataset.u = u; marco.src = u; } }
  // ── Panel: propiedades ──
  function pProp(n) { n.className += ' p'; n.id = 'pProp'; }
  function prop() { var n = document.getElementById('pProp'); if (!n) return; var g = gen(), pr = P.activo();
    n.innerHTML = '<h3>Proyecto</h3><dl class="pr"><dt>Nombre</dt><dd>' + esc(pr.nombre || pr.proyecto) + '</dd><dt>Código</dt><dd>' + esc(pr.numero || '—') + '</dd><dt>Cliente</dt><dd>' + esc(pr.cliente || '—') + '</dd><dt>Etapa</dt><dd>' + esc(pr.fase || '—') + '</dd><dt>Revisión</dt><dd>' + esc(pr.rev || '—') + '</dd></dl>' +
      (g ? '<h3>Entregable</h3><dl class="pr"><dt>Nombre</dt><dd>' + esc(g.name) + '</dd><dt>Categoría</dt><dd>' + (g.category === 'PLANO' ? 'Plano' : 'Documento') + ' · ' + g.subcategory + '</dd><dt>Identificador</dt><dd>' + g.id + '</dd><dt>Disciplina</dt><dd>' + esc(g.discipline) + '</dd><dt>Entradas</dt><dd>' + esc(g.inputFormats.join(', ')) + '</dd><dt>Salidas</dt><dd>' + esc(g.outputFormats.join(', ') || 'visor') + '</dd></dl>' + (g.note ? '<p class="nota">' + esc(g.note) + '</p>' : '') +
        '<p><a href="../generador/#g=' + g.id + '">Abrir en el generador</a> · <a href="' + esc(new URL('../' + g.module, location.href).href) + '">Abrir el módulo completo</a></p>' : '<p class="nota">Sin entregable seleccionado.</p>'); }
  // ── Panel: control documental ──
  function pCtrl(n) { n.className += ' p'; n.id = 'pCtrl'; }
  function ctrl() { var n = document.getElementById('pCtrl'); if (!n) return; var docs = G ? G.lista() : [], g = gen(), l = docs.filter(function (d) { return !g || d.gen === g.id; }).sort(function (a, b) { return a.modificado < b.modificado ? 1 : -1; });
    n.innerHTML = '<h3>' + (g ? 'Registros de ' + esc(g.name) : 'Todos los registros') + '</h3>' + (l.length ? l.slice(0, 30).map(function (d) { return '<div class="reg"><b>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo) + '</b><span><i class="est" style="background:' + (COL[d.estado] || '#94A9BE') + '"></i>' + esc(d.estado) + ' · Rev. ' + esc(d.rev) + ((d.archivos || []).length ? ' · ' + d.archivos.length + ' archivo(s)' : '') + '</span></div>'; }).join('') : '<p class="nota">Sin registros todavía. Se crean al exportar un entregable o desde el generador.</p>') + '<p><a href="../documentos/">Abrir el control documental</a></p>'; }
  // ── Panel: resumen con gráficos ──
  function pRes(n) { n.className += ' p'; n.id = 'pRes'; }
  function res() { var n = document.getElementById('pRes'); if (!n) return; contar(); var docs = G ? G.lista() : [];
    var filas = [['Instrumentos', N.instrumentos], ['Señales de E/S', N.senales], ['Diagramas de lazo', N.lazos], ['Tarjetas', N.tarjetas], ['Ductos', N.ductos], ['Instrumentos en P&ID', N.pid]], mx = Math.max.apply(null, filas.map(function (f) { return f[1]; }).concat(1));
    var porEst = {}; docs.forEach(function (d) { porEst[d.estado] = (porEst[d.estado] || 0) + 1; }); var ests = Object.keys(porEst), tot = docs.length, C = 2 * Math.PI * 46, ac = 0;
    var arcos = ests.map(function (e) { var f = porEst[e] / tot, a = '<circle cx="60" cy="60" r="46" fill="none" stroke="' + COL[e] + '" stroke-width="16" stroke-dasharray="0 ' + C + '" data-d="' + (f * C) + ' ' + (C - f * C) + '" stroke-dashoffset="' + (-ac * C) + '" transform="rotate(-90 60 60)"/>'; ac += f; return a; }).join('');
    n.innerHTML = '<h3>Datos del proyecto</h3><div class="barras">' + filas.map(function (f) { return '<div class="bar"><span>' + f[0] + '</span><div><i data-w="' + (100 * f[1] / mx) + '"></i></div><b>' + f[1] + '</b></div>'; }).join('') + '</div>' +
      '<h3>Entregables registrados por estado</h3>' + (tot ? '<div class="dona"><svg viewBox="0 0 120 120" role="img" aria-label="' + tot + ' entregables registrados: ' + ests.map(function (e) { return porEst[e] + ' ' + e; }).join(', ') + '"><circle cx="60" cy="60" r="46" fill="none" stroke="#18283C" stroke-width="16"/>' + arcos + '<text x="60" y="58" text-anchor="middle" fill="#EAF2F8" font-size="22" font-weight="700">' + tot + '</text><text x="60" y="74" text-anchor="middle" fill="#94A9BE" font-size="9">registrados</text></svg><ul>' + ests.map(function (e) { return '<li><i style="background:' + COL[e] + '"></i>' + esc(e) + ' <b>' + porEst[e] + '</b></li>'; }).join('') + '</ul></div>' : '<p class="nota">Aún no hay entregables registrados en el control documental.</p>') +
      '<p class="nota">Cifras tomadas de los datos guardados del proyecto activo.</p>';
    requestAnimationFrame(function () { requestAnimationFrame(function () { n.querySelectorAll('.bar i').forEach(function (i) { i.style.width = i.dataset.w + '%'; }); n.querySelectorAll('circle[data-d]').forEach(function (c) { c.setAttribute('stroke-dasharray', c.dataset.d); }); }); }); }
  function todo() { lista(); vista(); prop(); ctrl(); res(); }
  function elegir(id) { sel = id; try { sessionStorage.setItem('reyengi-mesa-sel', id); } catch (e) {} history.replaceState(null, '', '#g=' + id); todo(); }
  var dock = window.REDock(document.getElementById('mesa'), { clave: 'reyengi-mesa',
    paneles: { ent: { titulo: 'Entregables', montar: pEnt }, vista: { titulo: 'Vista del módulo', montar: pVista }, prop: { titulo: 'Propiedades', montar: pProp }, ctrl: { titulo: 'Control documental', montar: pCtrl }, res: { titulo: 'Resumen', montar: pRes } },
    inicial: { t: 'row', c: [{ t: 'tabs', p: ['ent'], a: 'ent' }, { t: 'col', c: [{ t: 'tabs', p: ['vista'], a: 'vista' }, { t: 'tabs', p: ['res', 'ctrl'], a: 'res' }], s: [0.64, 0.36] }, { t: 'tabs', p: ['prop'], a: 'prop' }], s: [0.2, 0.58, 0.22] },
    alCambiar: function () { setTimeout(todo, 0); } });
  document.getElementById('mesa').addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (b) elegir(b.dataset.g); });
  $('#bReset').addEventListener('click', function () { dock.restablecer(); });
  $('#bPaneles').addEventListener('click', function () { var v = document.querySelector('.dk-menu'); if (v) { v.remove(); return; } var m = document.createElement('div'); m.className = 'dk-menu'; m.setAttribute('role', 'menu'); var r = $('#bPaneles').getBoundingClientRect(), ce = dock.cerrados();
    ['ent', 'vista', 'prop', 'ctrl', 'res'].forEach(function (id) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemcheckbox'); var ab = ce.indexOf(id) < 0; b.setAttribute('aria-checked', ab); b.textContent = (ab ? '✓ ' : '   ') + dock.titulo(id); b.onclick = function () { m.remove(); if (ab) dock.cerrar(id); else dock.abrir(id); }; m.append(b); });
    document.body.append(m); m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px'; m.firstChild.focus();
    setTimeout(function () { function fuera(ev) { if (!m.contains(ev.target) && ev.target !== $('#bPaneles')) { m.remove(); document.removeEventListener('pointerdown', fuera); } } document.addEventListener('pointerdown', fuera); }, 0); });
  var h = /#g=([A-Z0-9-]+)/.exec(location.hash), s0 = null; try { s0 = sessionStorage.getItem('reyengi-mesa-sel'); } catch (e) {}
  sel = (h && h[1]) || s0 || 'P02-LAZO'; if (!gen()) sel = 'P02-LAZO'; todo();
  if (G) G.alCambiar(function () { ctrl(); res(); });
  window.addEventListener('storage', function (e) { if (e.key && /reyengi/.test(e.key) && e.key !== 'reyengi-mesa') { lista(); ctrl(); res(); prop(); } });
})();
