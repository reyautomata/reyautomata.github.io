/* Suite ReyEngi · menú de entregables en las páginas internas (mismo orden que la portada). */
(function () {
  'use strict';
  var ENT = [['00', 'Proyecto', 'proyectos/'], ['01', 'Análisis de P&ID', 'pid/'], ['02', 'Listado de instrumentos', 'lazos/#inst'], ['03', 'Hojas de datos', 'hojas-datos/'], ['04', 'Especificaciones técnicas', 'especificaciones/'], ['05', 'Listado de entradas y salidas', 'lazos/#doc'], ['06', 'Diagramas de lazo', 'lazos/#lazos'], ['07', 'Listado de circuitos', 'lazos/#circ'], ['08', 'Unilineales TDI', 'lazos/#uni'], ['09', 'Diagrama de bloques de control y comunicaciones', 'lazos/#blq'], ['10', 'Detalles típicos de montaje', '#montajes']];
  function iniciar() {
    var v = document.querySelector('.barra .volver'); if (!v || document.querySelector('.rg-ent')) return;
    var base = v.getAttribute('href') || '../';
    var d = document.createElement('details'); d.className = 'rg-ent';
    d.innerHTML = '<summary aria-label="Ir a otro entregable">Entregables ▾</summary><ol>' + ENT.map(function (e) {
      return '<li><a href="' + base + e[2] + '"><b>' + e[0] + '</b><span>' + e[1] + '</span></a></li>'; }).join('') + '</ol>';
    v.insertAdjacentElement('afterend', d);
    function marcar() {
      var aqui = location.pathname.replace(/index\.html$/, '') + location.hash;
      [].forEach.call(d.querySelectorAll('a'), function (a) {
        var u = new URL(a.href, location.href), p = u.pathname.replace(/index\.html$/, '') + u.hash;
        var ok = p === aqui || (!u.hash && u.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '') && !/^#(inst|doc|lazos|circ|uni|blq)$/.test(location.hash));
        if (ok) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    }
    marcar(); window.addEventListener('hashchange', marcar);
    d.addEventListener('click', function (e) { if (e.target.closest('a')) d.open = false; });
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
