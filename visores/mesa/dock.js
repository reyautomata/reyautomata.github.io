/* Suite ReyEngi · paneles acoplables (propio, sin dependencias).
 * Disposición = árbol de divisiones (fila o columna) y grupos de pestañas. Cada pestaña se arrastra a otro grupo
 * (centro = se suma como pestaña; bordes = divide el grupo). Los separadores se arrastran para cambiar tamaños.
 * La disposición se guarda en el navegador. Todo se puede hacer también sin arrastrar, desde el menú ⋮ de cada grupo. */
(function () {
  'use strict';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  window.REDock = function (raiz, cfg) {
    var P = cfg.paneles, CLAVE = cfg.clave, nodos = {}, L, max = null, cerrados = [];
    Object.keys(P).forEach(function (id) { var n = el('div', 'dk-cont'); n.dataset.panel = id; nodos[id] = n; P[id].montar(n); });
    function copia(o) { return JSON.parse(JSON.stringify(o)); }
    function validos(n, vistos) { // descarta paneles que ya no existen o están repetidos
      if (n.t === 'tabs') { n.p = n.p.filter(function (id) { if (!P[id] || vistos[id]) return false; vistos[id] = 1; return true; }); if (n.p.indexOf(n.a) < 0) n.a = n.p[0]; return n.p.length ? n : null; }
      n.c = n.c.map(function (h) { return validos(h, vistos); }).filter(Boolean); if (!n.c.length) return null; if (n.c.length === 1) return n.c[0];
      if (!n.s || n.s.length !== n.c.length) n.s = n.c.map(function () { return 1 / n.c.length; }); return n;
    }
    function cargar() { var g = null; try { g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {} var v = {}, l = g && g.l ? validos(g.l, v) : null;
      if (!l) { v = {}; l = validos(copia(cfg.inicial), v); cerrados = []; } else cerrados = (g.x || []).filter(function (id) { return P[id] && !v[id]; });
      Object.keys(P).forEach(function (id) { if (!v[id] && cerrados.indexOf(id) < 0) cerrados.push(id); }); L = l; }
    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify({ l: L, x: cerrados })); } catch (e) {} if (cfg.alCambiar) cfg.alCambiar(api); }
    function normal(n) { // une divisiones anidadas de igual sentido y quita las de un solo hijo
      if (n.t === 'tabs') return n; n.c = n.c.map(normal); var c = [], s = [];
      n.c.forEach(function (h, i) { if (h.t === n.t) h.c.forEach(function (x, k) { c.push(x); s.push(n.s[i] * h.s[k]); }); else { c.push(h); s.push(n.s[i]); } });
      var tot = s.reduce(function (a, b) { return a + b; }, 0) || 1; n.c = c; n.s = s.map(function (x) { return x / tot; }); return n.c.length === 1 ? n.c[0] : n;
    }
    function grupoDe(id, n, padre, i) { n = n || L; if (n.t === 'tabs') return n.p.indexOf(id) >= 0 ? { g: n, padre: padre, i: i } : null; for (var k = 0; k < n.c.length; k++) { var r = grupoDe(id, n.c[k], n, k); if (r) return r; } return null; }
    function sacar(id) { var v = {}; (function q(n) { if (n.t === 'tabs') { n.p = n.p.filter(function (x) { return x !== id; }); if (n.a === id) n.a = n.p[0]; } else n.c.forEach(q); })(L); var l = validos(L, v); L = l || { t: 'tabs', p: [], a: null }; }
    function reemplazar(viejo, nuevo, n) { n = n || L; if (n === viejo) { L = nuevo; return true; } if (n.t === 'tabs') return false; for (var k = 0; k < n.c.length; k++) { if (n.c[k] === viejo) { n.c[k] = nuevo; return true; } if (reemplazar(viejo, nuevo, n.c[k])) return true; } return false; }
    // Acopla el panel id respecto del grupo destino: 'c' centro, 'l' 'r' 't' 'b' bordes
    function acoplar(id, destino, zona) {
      if (destino && destino.p.length === 1 && destino.p[0] === id) return; sacar(id); cerrados = cerrados.filter(function (x) { return x !== id; });
      if (!L.p && !L.c) L = { t: 'tabs', p: [], a: null }; if (L.t === 'tabs' && !L.p.length) { L = { t: 'tabs', p: [id], a: id }; return fin(); }
      var d = destino && (function ex(n) { return n === destino || (n.c && n.c.some(ex)); })(L) ? destino : null;
      if (!d) { if (zona === 'c') { d = (function pr(n) { return n.t === 'tabs' ? n : pr(n.c[0]); })(L); } else d = L; }
      if (zona === 'c' && d.t === 'tabs') { d.p.push(id); d.a = id; return fin(); }
      var nuevo = { t: 'tabs', p: [id], a: id }, fila = zona === 'l' || zona === 'r', antes = zona === 'l' || zona === 't';
      var div = { t: fila ? 'row' : 'col', c: antes ? [nuevo, d] : [d, nuevo], s: antes ? [0.32, 0.68] : [0.68, 0.32] };
      if (d === L) L = div; else reemplazar(d, div); fin();
    }
    function fin() { L = normal(L); max = null; pintar(); guardar(); }
    // ── Dibujo ──
    function pintar() {
      Object.keys(nodos).forEach(function (id) { if (nodos[id].parentNode) nodos[id].parentNode.removeChild(nodos[id]); });
      raiz.textContent = ''; raiz.classList.add('dk'); raiz.classList.toggle('dk-max', !!max);
      if (L.t === 'tabs' && !L.p.length) { raiz.append(el('p', 'dk-vacio', 'No hay paneles abiertos. Ábrelos desde el menú «Paneles».')); var b0 = el('div', 'dk-bodega'); b0.hidden = true; cerrados.forEach(function (id) { b0.append(nodos[id]); }); raiz.append(b0); return; }
      raiz.append(dibujar(L)); if (cerrados.length) { var bod = el('div', 'dk-bodega'); bod.hidden = true; cerrados.forEach(function (id) { bod.append(nodos[id]); }); raiz.append(bod); }
      Object.keys(P).forEach(function (id) { if (P[id].alMostrar && nodos[id].parentNode) P[id].alMostrar(nodos[id]); });
    }
    function dibujar(n) {
      if (n.t === 'tabs') return grupo(n);
      var d = el('div', 'dk-div dk-' + n.t);
      n.c.forEach(function (h, i) { var w = el('div', 'dk-celda'); w.style.flex = (n.s[i] * 100) + ' 1 0'; w.append(dibujar(h)); d.append(w);
        if (i < n.c.length - 1) { var s = el('div', 'dk-sep'); s.setAttribute('role', 'separator'); s.setAttribute('aria-orientation', n.t === 'row' ? 'vertical' : 'horizontal'); s.tabIndex = 0; s.setAttribute('aria-label', 'Cambiar el tamaño de los paneles'); separador(s, n, i, d); d.append(s); } });
      return d;
    }
    function separador(s, n, i, cont) {
      function mover(delta) { var tot = n.s[i] + n.s[i + 1], a = Math.min(tot - 0.08, Math.max(0.08, n.s[i] + delta)); n.s[i] = a; n.s[i + 1] = tot - a; var cs = cont.querySelectorAll(':scope > .dk-celda'); cs[i].style.flex = (n.s[i] * 100) + ' 1 0'; cs[i + 1].style.flex = (n.s[i + 1] * 100) + ' 1 0'; }
      s.addEventListener('pointerdown', function (e) { e.preventDefault(); s.setPointerCapture(e.pointerId); raiz.classList.add('dk-arr'); var r = cont.getBoundingClientRect(), largo = n.t === 'row' ? r.width : r.height, p0 = n.t === 'row' ? e.clientX : e.clientY;
        function mv(ev) { var p = n.t === 'row' ? ev.clientX : ev.clientY; mover((p - p0) / largo); p0 = p; }
        function up() { s.removeEventListener('pointermove', mv); s.removeEventListener('pointerup', up); raiz.classList.remove('dk-arr'); guardar(); window.dispatchEvent(new Event('resize')); }
        s.addEventListener('pointermove', mv); s.addEventListener('pointerup', up); });
      s.addEventListener('keydown', function (e) { var k = e.key, d = (k === 'ArrowLeft' || k === 'ArrowUp') ? -0.03 : (k === 'ArrowRight' || k === 'ArrowDown') ? 0.03 : 0; if (d) { e.preventDefault(); mover(d); guardar(); } });
    }
    // Las pestañas inactivas siguen en la página, ocultas: el módulo puede seguir usando sus elementos
    function grupo(n) {
      var g = el('section', 'dk-grupo' + (max === n ? ' max' : '')), cab = el('header', 'dk-cab'), tabs = el('div', 'dk-tabs'), cuerpo = el('div', 'dk-cuerpo'); g._n = n; tabs.setAttribute('role', 'tablist');
      n.p.forEach(function (id) { var b = el('button', 'dk-tab' + (id === n.a ? ' on' : ''), P[id].titulo); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', id === n.a); b.dataset.id = id; b.title = 'Arrastra para mover el panel «' + P[id].titulo + '»';
        b.addEventListener('click', function () { if (arr || n.a === id) return; n.a = id; var nu = grupo(n); g.replaceWith(nu); if (P[id].alMostrar) P[id].alMostrar(nodos[id]); guardar(); var f = nu.querySelector('.dk-tab.on'); if (f) f.focus(); }); arrastre(b, id); tabs.append(b); });
      var mas = el('button', 'dk-b', '⋮'), mx = el('button', 'dk-b', max === n ? '🗗' : '🗖'), cx = el('button', 'dk-b', '✕'); mas.type = mx.type = cx.type = 'button';
      mas.setAttribute('aria-label', 'Mover el panel ' + P[n.a].titulo); mas.title = 'Mover este panel'; mx.setAttribute('aria-label', max === n ? 'Restaurar el tamaño' : 'Maximizar el panel'); mx.title = mx.getAttribute('aria-label'); cx.setAttribute('aria-label', 'Cerrar el panel ' + P[n.a].titulo); cx.title = 'Cerrar el panel';
      mx.onclick = function () { max = max === n ? null : n; raiz.classList.toggle('dk-max', !!max); raiz.querySelectorAll('.dk-grupo.max').forEach(function (x) { x.classList.remove('max'); }); if (max) g.classList.add('max'); mx.textContent = max ? '🗗' : '🗖'; mx.setAttribute('aria-label', max ? 'Restaurar el tamaño' : 'Maximizar el panel'); mx.title = mx.getAttribute('aria-label'); window.dispatchEvent(new Event('resize')); }; // sin redibujar: no recarga la vista
      cx.onclick = function () { var id = n.a; sacar(id); cerrados.push(id); fin(); };
      mas.onclick = function () { menu(mas, [['Acoplar a la izquierda', 'l'], ['Acoplar a la derecha', 'r'], ['Acoplar arriba', 't'], ['Acoplar abajo', 'b']].map(function (o) { return [o[0], function () { acoplar(n.a, null, o[1]); }]; })); };
      cab.append(tabs, mas, mx, cx); n.p.forEach(function (id) { nodos[id].hidden = id !== n.a; cuerpo.append(nodos[id]); }); cuerpo.setAttribute('role', 'tabpanel'); g.append(cab, cuerpo); return g;
    }
    function menu(ancla, items) { var v = document.querySelector('.dk-menu'); if (v) v.remove(); var m = el('div', 'dk-menu'), r = ancla.getBoundingClientRect(); m.setAttribute('role', 'menu');
      items.forEach(function (it) { var b = el('button', '', it[0]); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.onclick = function () { m.remove(); it[1](); }; m.append(b); });
      document.body.append(m); m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px'; m.firstChild.focus();
      setTimeout(function () { function fuera(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', fuera); } } document.addEventListener('pointerdown', fuera); }, 0);
      m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { m.remove(); ancla.focus(); } }); }
    // ── Arrastre de pestañas ──
    var arr = false;
    function arrastre(b, id) {
      b.addEventListener('pointerdown', function (e) { if (e.button) return; var x0 = e.clientX, y0 = e.clientY, fant = null, zona = null, dest = null, marca = null;
        function mv(ev) {
          if (!arr) { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 8) return; arr = true; raiz.classList.add('dk-arr'); fant = el('div', 'dk-fant', P[id].titulo); document.body.append(fant); marca = el('div', 'dk-marca'); document.body.append(marca); }
          fant.style.left = (ev.clientX + 12) + 'px'; fant.style.top = (ev.clientY + 12) + 'px'; fant.style.display = marca.style.display = 'none';
          var bajo = document.elementFromPoint(ev.clientX, ev.clientY), g = bajo && bajo.closest ? bajo.closest('.dk-grupo') : null; fant.style.display = '';
          if (!g || !raiz.contains(g)) { dest = null; zona = null; return; }
          var r = g.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
          zona = fx < 0.24 ? 'l' : fx > 0.76 ? 'r' : fy < 0.24 ? 't' : fy > 0.76 ? 'b' : 'c'; dest = g._n;
          var z = { l: [0, 0, 0.5, 1], r: [0.5, 0, 0.5, 1], t: [0, 0, 1, 0.5], b: [0, 0.5, 1, 0.5], c: [0, 0, 1, 1] }[zona];
          marca.style.cssText = 'display:block;left:' + (r.left + z[0] * r.width) + 'px;top:' + (r.top + z[1] * r.height) + 'px;width:' + (z[2] * r.width) + 'px;height:' + (z[3] * r.height) + 'px';
        }
        function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (fant) fant.remove(); if (marca) marca.remove(); raiz.classList.remove('dk-arr');
          if (arr && dest && zona) acoplar(id, dest, zona); setTimeout(function () { arr = false; }, 0); }
        document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); });
    }
    var api = {
      cerrados: function () { return cerrados.slice(); }, abiertos: function () { return Object.keys(P).filter(function (id) { return cerrados.indexOf(id) < 0; }); },
      abrir: function (id) { if (!P[id]) return; if (cerrados.indexOf(id) >= 0) acoplar(id, null, 'c'); else { var g = grupoDe(id); if (g) { g.g.a = id; pintar(); guardar(); } } },
      cerrar: function (id) { if (cerrados.indexOf(id) < 0) { sacar(id); cerrados.push(id); fin(); } },
      restablecer: function () { try { localStorage.removeItem(CLAVE); } catch (e) {} cargar(); max = null; L = normal(L); pintar(); guardar(); },
      disposicion: function () { return copia(L); }, titulo: function (id) { return P[id].titulo; }
    };
    cargar(); L = normal(L); pintar(); if (cfg.alCambiar) cfg.alCambiar(api);
    return api;
  };
})();
