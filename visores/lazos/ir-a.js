/* Entregables del proyecto · ir a donde se encuentra un equipo.
 * Al tocar una casilla que contiene el tag de un instrumento o de un tablero aparece una ventana flotante que ofrece ir
 * a los lugares donde ese equipo figura: su diagrama de lazo, el listado de E/S, tarjetas y canales, el listado de
 * instrumentos, el listado de circuitos y el unilineal que lo alimenta. Al llegar, la fila queda destacada. */
(function () {
  'use strict';
  if (window.self !== window.top) return;
  var Z = function () { return window.__LAZOS; }, pop = null, ancla = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var st = document.createElement('style');
  st.textContent = '.ir-pop{position:fixed;z-index:80;width:min(290px,calc(100vw - 16px));background:#111D2E;color:#EAF2F8;border:1px solid #38C8E8;border-radius:10px;padding:10px 12px;box-shadow:0 12px 30px rgba(0,0,0,.55);font:12px/1.4 var(--f-body,system-ui,sans-serif);color-scheme:dark}' +
    '.ir-pop header{display:flex;gap:8px;align-items:flex-start;margin-bottom:6px}.ir-pop header div{flex:1;min-width:0}.ir-pop b{display:block;font:700 13px var(--f-mono,monospace);overflow-wrap:anywhere}.ir-pop small{display:block;color:#94A9BE;font-size:11px;overflow-wrap:anywhere}' +
    '.ir-pop p{margin:0 0 6px;color:#94A9BE}.ir-pop nav{display:flex;flex-direction:column;gap:4px}' +
    '.ir-pop button{font:600 12px var(--f-body,system-ui,sans-serif)!important;color:#EAF2F8!important;background:#18283C!important;border:1px solid #2C4563!important;border-radius:6px!important;padding:5px 9px!important;min-height:26px!important;cursor:pointer;text-align:left}' +
    '.ir-pop button:hover{border-color:#38C8E8!important}.ir-pop button:focus-visible{outline:2px solid #38C8E8;outline-offset:1px}.ir-pop nav button::before{content:"→ ";color:#FF8C32}.ir-pop header button{padding:0 7px!important;min-height:22px!important;flex:none}' +
    '.ir-flash{outline:2px solid #FF8C32!important;outline-offset:1px!important;background:rgba(255,140,50,.18)!important;transition:background .6s}' +
    '@media print{.ir-pop{display:none!important}}';
  document.head.appendChild(st);

  function vista() { var s = [].filter.call(document.querySelectorAll('main > section'), function (x) { return !x.hidden; })[0]; return s ? s.id.replace(/^v-/, '') : ''; }
  function cerrar() { if (pop) { pop.remove(); pop = null; ancla = null; } }
  function texto(t) { if (!t || !t.tagName) return ''; if (t.tagName === 'INPUT' && /^(text|search|)$/.test(t.type || '')) return t.value || t.placeholder || ''; /* los circuitos vinculados muestran el tag como texto de fondo */ if (/^(TD|SPAN|B|SMALL|A)$/.test(t.tagName) && !t.children.length) return t.textContent; return ''; }
  // Lugares donde figura el tag
  function destinos(tag) {
    var z = Z(); if (!z) return null; var E = z.E(), s = E.senales.filter(function (x) { return x.tag === tag; })[0], tb = (E.tdi || []).filter(function (x) { return x.tag === tag; })[0], v = vista(), o = [];
    if (s) {
      var lz = z.lazoId(s), m = z.modulo(s.mod), td = (E.tdi || []).filter(function (t) { return (t.circ || []).some(function (c) { return c.inst === tag; }); })[0];
      if (v !== 'lazos' || z.seleccionado() !== lz) o.push({ t: 'Diagrama de lazo ' + lz, ir: function () { location.hash = '#lazo=' + encodeURIComponent(lz); } });
      if (v !== 'io') o.push({ t: 'Señales de E/S', v: 'io' });
      if (m && v !== 'mod') o.push({ t: 'Tarjeta ' + m.nombre + (s.canal !== '' && s.canal != null ? ' · canal ' + (+s.canal + z.base()) : ''), v: 'mod' });
      if (v !== 'inst') o.push({ t: 'Listado de instrumentos', v: 'inst' });
      if (v !== 'circ') o.push({ t: 'Listado de circuitos', v: 'circ' });
      if (td && v !== 'uni') o.push({ t: 'Unilineal ' + td.tag + ' (su alimentación)', v: 'uni', tab: td.id });
      return { tit: tag, sub: s.desc || s.servicio || 'Instrumento del listado de E/S', op: o };
    }
    if (tb) { if (v !== 'uni') o.push({ t: 'Unilineal ' + tb.tag, v: 'uni', tab: tb.id }); if (v !== 'circ') o.push({ t: 'Listado de circuitos', v: 'circ' }); return o.length ? { tit: tag, sub: tb.nombre || 'Tablero de distribución', op: o } : null; }
    return null;
  }
  // Al llegar: se abre la pestaña que contiene el tag, se desplaza hasta él y queda destacado unos segundos
  function destacar(tag, n) {
    var sec = [].filter.call(document.querySelectorAll('main > section'), function (x) { return !x.hidden; })[0]; if (!sec) return;
    var c = [].filter.call(sec.querySelectorAll('input, td, b, span'), function (e) { var x = e.tagName === 'INPUT' ? (e.value || e.placeholder) : (e.children.length ? '' : e.textContent); return x && x.trim().toUpperCase() === tag; });
    if (!c.length) c = [].filter.call(sec.querySelectorAll('input, td'), function (e) { var x = e.tagName === 'INPUT' ? (e.value || e.placeholder) : (e.children.length ? '' : e.textContent); return x && x.toUpperCase().indexOf(tag) >= 0; });
    if (!c.length) { if ((n || 0) < 6) setTimeout(function () { destacar(tag, (n || 0) + 1); }, 300); return; }
    var el = c.filter(function (e) { return e.offsetParent !== null; })[0];
    if (!el) { var tabs = [].slice.call(sec.querySelectorAll('.dk-tab:not(.on)')), i = 0; (function sig() { el = c.filter(function (e) { return e.offsetParent !== null; })[0]; if (el || i >= tabs.length) { if (el) marcar(el); return; } var id = tabs[i++].dataset.id, b = sec.querySelector('.dk-tab[data-id="' + id + '"]'); if (b) b.click(); setTimeout(sig, 60); })(); return; }
    marcar(el);
  }
  function marcar(el) { var f = el.closest('tr') || el; el.scrollIntoView({ block: 'center', inline: 'nearest' }); f.classList.add('ir-flash'); setTimeout(function () { f.classList.remove('ir-flash'); }, 3200); }
  function ir(d, tag) {
    cerrar();
    if (d.ir) d.ir(); else location.hash = '#' + d.v;
    setTimeout(function () {
      if (d.tab) { var s = document.getElementById('uSel'); if (s && s.value !== d.tab) { s.value = d.tab; s.dispatchEvent(new Event('change', { bubbles: true })); } }
      setTimeout(function () { destacar(tag); }, 250);
    }, 200);
  }
  function abrir(el, tag, d, x, y) {
    cerrar(); ancla = el;
    pop = document.createElement('div'); pop.className = 'ir-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Ir a donde se encuentra ' + tag);
    pop.innerHTML = '<header><div><b>' + esc(d.tit) + '</b><small>' + esc(d.sub) + '</small></div><button type="button" data-x="1" aria-label="Cerrar">✕</button></header><p>¿Ir a donde se encuentra este equipo?</p><nav>' +
      d.op.map(function (o, i) { return '<button type="button" data-i="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</nav>';
    document.body.appendChild(pop);
    var w = pop.offsetWidth, h = pop.offsetHeight; pop.style.left = Math.max(8, Math.min(x + 12, innerWidth - w - 8)) + 'px'; pop.style.top = Math.max(8, Math.min(y + 14, innerHeight - h - 8)) + 'px';
    pop.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.dataset.x) cerrar(); else ir(d.op[+b.dataset.i], tag); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return; if (pop && pop.contains(t)) return;
    if (!t.closest('main') || t.closest('.dkm-comun, .dk-cab, .dkm-acc, .zm-barra, button, select, a, label, [role=tabpanel] .herr')) { cerrar(); return; }
    var tag = texto(t).trim().toUpperCase(); if (!tag || tag.length > 40) { cerrar(); return; }
    var d = destinos(tag); if (!d || !d.op.length) { cerrar(); return; }
    abrir(t, tag, d, e.clientX, e.clientY);
  });
  document.addEventListener('keydown', function (e) { if (!pop) return; if (e.key === 'Escape') { cerrar(); return; } if (ancla && e.target === ancla && e.key.length === 1) cerrar(); }, true);   // al escribir en la casilla, la ventana se retira
  window.addEventListener('hashchange', cerrar);
})();
