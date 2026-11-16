/* Suite ReyEngi · Índice de tags del proyecto
 * Una fila por instrumento con su avance en cada entregable: tarjeta y canal, diagrama de lazo, hoja de datos,
 * detalle de montaje, circuito y ducto. Sirve para ver de un vistazo qué le falta a cada tag y saltar a completarlo.
 * No guarda datos propios: lee lo que ya tienen los demás listados, así que nunca queda desfasado. */
(function () {
  'use strict';
  var cont = document.getElementById('idxTags'); if (!cont) return;
  var Z = function () { return window.__LAZOS; }, D = function () { return window.LAZOS_DOC; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var up = function (s) { return String(s || '').toUpperCase().trim(); };
  var filtro = 'todos', busca = '';
  var st = document.createElement('style');
  st.textContent = '#idxTags{display:grid;gap:12px}#idxTags .ix-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:center}#idxTags .ix-barra input{max-width:240px}#idxTags .ix-res{margin:0;color:var(--muted);font-size:12px}' +
    '#idxTags .ix-seg{display:inline-flex;gap:4px;padding:4px;background:var(--bg);border-radius:4px}#idxTags .ix-seg button{border:0!important;background:transparent!important}#idxTags .ix-seg button[aria-pressed=true]{background:var(--panel2)!important;box-shadow:inset 0 -2px 0 var(--accent);font-weight:600}' +
    '#idxTags table{width:100%;border-collapse:collapse}#idxTags th{position:sticky;top:0;text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}#idxTags td{padding:4px 8px;border-bottom:1px solid var(--line);vertical-align:middle}' +
    '#idxTags tbody tr:hover{background:var(--hover,rgba(255,255,255,.05))}#idxTags td.tag{font:600 12px var(--f-mono,monospace);white-space:nowrap}#idxTags td small{display:block;color:var(--muted)}' +
    '#idxTags td:nth-child(2){min-width:220px}#idxTags table{min-width:1080px}html body main #idxTags button.ix-c{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;gap:6px;align-items:center;padding:2px 8px!important;min-height:24px!important;border-radius:4px!important;border:1px solid var(--line);font-size:12px!important;line-height:16px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#idxTags .ix-c:hover{border-color:var(--sel)}#idxTags .ix-c:focus-visible{outline:2px solid var(--sel);outline-offset:1px}' +
    '#idxTags .ix-c.ok::before{content:"✓";color:var(--ok);font-weight:700}#idxTags .ix-c.fa::before{content:"!";color:var(--warn);font-weight:700}html body main #idxTags button.ix-c.fa{border-style:dashed;color:var(--muted)}#idxTags .ix-c.na::before{content:"–";color:var(--muted)}' +
    '#idxTags .ix-av{display:flex;gap:8px;align-items:center;white-space:nowrap}#idxTags .ix-av i{display:block;width:64px;height:6px;border-radius:3px;background:var(--line);overflow:hidden}#idxTags .ix-av i b{display:block;height:100%;background:var(--ok)}#idxTags .ix-av.pend i b{background:var(--warn)}';
  document.head.appendChild(st);
  cont.innerHTML = '<div class="ix-barra"><span class="ix-seg" role="group" aria-label="Qué tags mostrar"><button type="button" data-f="todos" aria-pressed="true">Todos</button><button type="button" data-f="pend" aria-pressed="false">Con pendientes</button><button type="button" data-f="ok" aria-pressed="false">Completos</button></span><input type="search" id="ixBuscar" placeholder="Filtrar por tag o servicio" aria-label="Filtrar el índice de tags"><button type="button" id="ixAct">Actualizar</button><button type="button" id="ixCsv">Exportar CSV</button></div><p class="ix-res" id="ixRes" aria-live="polite"></p><div class="tscroll"><table><thead><tr><th>Tag</th><th>Servicio</th><th>E/S · tarjeta</th><th>Lazo</th><th>Hoja de datos</th><th>Montaje</th><th>Circuito</th><th>Ducto</th><th>Avance</th></tr></thead><tbody id="ixCuerpo"></tbody></table></div>';

  function filas() {
    var z = Z(), d = D(); if (!z || !d) return [];
    var E = z.E(), circs = [], ductos = (E.cond && E.cond.ductos) || []; try { circs = d.circuitos(); } catch (e) {}
    return d.instrumentos().filter(function (r) { return !(r.x && r.x.oculto); }).map(function (r) {
      var s = r.s || r.ref || {}, x = r.x || {}, m = s.mod ? z.modulo(s.mod) : null, canal = s.canal !== '' && s.canal != null, t = up(r.tag);
      var cs = circs.filter(function (c) { return (c.senales || []).some(function (q) { return up(q.tag) === t; }); }), c0 = cs[0], tagC = c0 ? ((c0.x && c0.x.tagC) || (c0.auto && c0.auto.tagC) || '') : '';
      var du = ductos.filter(function (q) { return up(q.eq) === t || up(q.desde) === t || (q.cables || []).some(function (k) { var kt = up(k.tag); return kt && (kt === t || kt === up(tagC)); }); }), dTxt = du.map(function (q) { return q.tag; }).join(', ') || (c0 && ((c0.x && c0.x.ducto) || (c0.auto && c0.auto.ducto))) || '';
      var hd = x.hd === '-' ? 'na' : x.hd ? 'ok' : r.hdAuto ? 'sug' : 'fa';
      var it = { tag: r.tag, serv: x.servicio || s.servicio || '', sen: !!s.tipo,
        es: { ok: !!(m && canal), t: s.tipo ? s.tipo + (m ? ' · ' + m.nombre + (canal ? ' · canal ' + (+s.canal + z.base()) : ' · sin canal') : ' · sin tarjeta') : 'Sin señal', ir: 'io', na: !s.tipo },
        lazo: { ok: !!r.lazo, t: r.lazo || 'Sin lazo', ir: r.lazo ? 'lazo=' + encodeURIComponent(r.lazo) : 'lazos', na: !s.tipo },
        hd: { ok: hd === 'ok' || hd === 'sug', na: hd === 'na', t: hd === 'na' ? 'No aplica' : hd === 'ok' ? 'Asignada' : hd === 'sug' ? 'Sugerida' : 'Sin hoja', ir: 'inst' },
        mont: { ok: !!x.montaje, t: x.montaje || 'Sin montaje', ir: 'inst' },
        circ: { ok: !!c0, t: tagC || (c0 ? 'Con circuito' : 'Sin circuito'), ir: 'circ', na: !s.tipo },
        ducto: { ok: !!dTxt, t: dTxt || 'Sin ducto', ir: 'cond', na: !s.tipo } };
      var v = [it.es, it.lazo, it.hd, it.mont, it.circ, it.ducto].filter(function (q) { return !q.na; }); it.tot = v.length; it.hechos = v.filter(function (q) { return q.ok; }).length;
      return it; });
  }
  function celda(q, tag) { return '<button type="button" class="ix-c ' + (q.na ? 'na' : q.ok ? 'ok' : 'fa') + '" data-ir="' + esc(q.ir) + '" data-tag="' + esc(tag) + '" title="' + esc(q.t) + ' · ir a completarlo">' + esc(q.t) + '</button>'; }
  function pintar() {
    if (cont.offsetParent === null) return; var f = filas(), b = up(busca), v = f.filter(function (x) { return (filtro === 'todos' || (filtro === 'pend') === (x.hechos < x.tot)) && (!b || up(x.tag).indexOf(b) >= 0 || up(x.serv).indexOf(b) >= 0); });
    var comp = f.filter(function (x) { return x.hechos === x.tot; }).length;
    document.getElementById('ixRes').textContent = f.length ? f.length + ' tags · ' + comp + ' completos · ' + (f.length - comp) + ' con pendientes' + (v.length !== f.length ? ' · se muestran ' + v.length : '') + '. Toca una casilla para ir al listado donde se completa.' : 'Aún no hay instrumentos: agrega señales en la pestaña «Señales de E/S».';
    document.getElementById('ixCuerpo').innerHTML = v.map(function (x) { var pc = x.tot ? Math.round(x.hechos / x.tot * 100) : 100;
      return '<tr><td class="tag">' + esc(x.tag) + '</td><td>' + esc(x.serv) + '</td><td>' + celda(x.es, x.tag) + '</td><td>' + celda(x.lazo, x.tag) + '</td><td>' + celda(x.hd, x.tag) + '</td><td>' + celda(x.mont, x.tag) + '</td><td>' + celda(x.circ, x.tag) + '</td><td>' + celda(x.ducto, x.tag) + '</td><td><span class="ix-av' + (x.hechos < x.tot ? ' pend' : '') + '"><i><b style="width:' + pc + '%"></b></i>' + x.hechos + ' de ' + x.tot + '</span></td></tr>'; }).join('');
    [].forEach.call(cont.querySelectorAll('[data-f]'), function (q) { q.setAttribute('aria-pressed', String(q.dataset.f === filtro)); });
  }
  cont.addEventListener('click', function (e) { var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.f) { filtro = t.dataset.f; return pintar(); }
    if (t.id === 'ixAct') return pintar();
    if (t.id === 'ixCsv') { var f = filas(), L = [['Tag', 'Servicio', 'E/S y tarjeta', 'Lazo', 'Hoja de datos', 'Montaje', 'Circuito', 'Ducto', 'Avance']].concat(f.map(function (x) { return [x.tag, x.serv, x.es.t, x.lazo.t, x.hd.t, x.mont.t, x.circ.t, x.ducto.t, x.hechos + ' de ' + x.tot]; })); var csv = '﻿' + L.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n'); return Z().descargar('Indice_de_tags.csv', csv, 'text/csv;charset=utf-8'); }
    if (t.dataset.ir) { var ir = t.dataset.ir, tag = t.dataset.tag; location.hash = '#' + ir; if (ir === 'io') { var tb = document.querySelector('#v-io .dk-tab[data-id=tabla]'); if (tb) tb.click(); }
      setTimeout(function () { var el = [].filter.call(document.querySelectorAll('main > section:not([hidden]) td input, main > section:not([hidden]) td'), function (q) { return up(q.value || (q.children.length ? '' : q.textContent)) === up(tag); })[0]; if (el) { el.scrollIntoView({ block: 'center' }); var fila = el.closest('tr') || el; fila.classList.add('ir-flash'); setTimeout(function () { fila.classList.remove('ir-flash'); }, 2600); } }, 500); } });
  cont.addEventListener('input', function (e) { if (e.target.id === 'ixBuscar') { busca = e.target.value; pintar(); } });
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) pintar(); }).observe(cont);
  window.addEventListener('hashchange', function () { setTimeout(pintar, 300); });
  window.LAZOS_INDICE = { filas: filas, pintar: pintar };
})();
