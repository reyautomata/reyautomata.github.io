/* Entorno mínimo para el módulo de canalizaciones fuera de la suite: datos del proyecto en el almacenamiento
 * local de la app, descarga de archivos y utilidades que el módulo espera de la aplicación de lazos. */
(function () {
  'use strict';
  var K = 'reyengi-conduit-proyecto', E = null;
  try { E = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { E = null; }
  if (!E || typeof E !== 'object') E = { cfg: {}, circ: [], cond: null };
  E.cfg = E.cfg || {}; E.circ = E.circ || [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function guardar() { try { localStorage.setItem(K, JSON.stringify(E)); } catch (e) {} }
  function descargar(nombre, datos, tipo) {
    var b = new Blob([datos], { type: tipo || 'application/octet-stream' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function reemplazar(d) { E = d; E.cfg = E.cfg || {}; E.circ = E.circ || []; guardar(); }
  window.__LAZOS = { E: function () { return E; }, uid: uid, esc: esc, guardar: guardar, descargar: descargar, reemplazar: reemplazar };
})();
