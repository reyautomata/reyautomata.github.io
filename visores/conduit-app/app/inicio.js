/* Arranque de la app: datos del proyecto, abrir/guardar archivo y aviso de licencia. */
(function () {
  'use strict';
  var A = window.__LAZOS, $ = function (s) { return document.querySelector(s); };
  function refrescar() { var c = A.E().cfg; $('#pProy').value = c.proyecto || ''; $('#pCli').value = c.cliente || ''; window.LAZOS_VISTAS.cond(); }
  ['pProy', 'pCli'].forEach(function (id) {
    $('#' + id).addEventListener('input', function (e) { A.E().cfg[id === 'pProy' ? 'proyecto' : 'cliente'] = e.target.value; A.guardar(); });
  });
  $('#pGuardar').addEventListener('click', function () {
    var c = A.E().cfg, n = (c.proyecto || 'Proyecto').replace(/[\\/:*?"<>|]+/g, '-');
    A.descargar(n + '.reyconduit', JSON.stringify({ app: 'reyengi-conduit', v: 1, datos: A.E() }, null, 1), 'application/json');
  });
  $('#pAbrir').addEventListener('click', function () { $('#pArchivo').value = ''; $('#pArchivo').click(); });
  $('#pArchivo').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    f.text().then(function (t) {
      var j = JSON.parse(t), d = j && j.app === 'reyengi-conduit' ? j.datos : j;
      if (!d || typeof d !== 'object' || !('cond' in d || 'cfg' in d)) throw new Error('formato');
      A.reemplazar(d); refrescar();
    }).catch(function () { alert('El archivo no es un proyecto de ReyEngi Conduit.'); });
  });
  // Licencia (solo en la app de escritorio)
  var L = window.reyLicencia;
  if (L) {
    $('#pLic').addEventListener('click', function () { L.abrir(); });
    L.estado().then(function (s) {
      if (!s || !s.ok) return;
      $('#licTxt').textContent = '· Licencia de ' + s.cliente + ', vigente hasta el ' + s.vence + '.';
      if (s.dias <= 30) {
        var av = $('#aviso'); av.hidden = false;
        av.innerHTML = '<span>Tu licencia vence en <b>' + s.dias + ' día' + (s.dias === 1 ? '' : 's') + '</b> (' + s.vence + '). Renueva para seguir usando la app.</span><button type="button" class="btn">Renovar</button>';
        av.querySelector('button').addEventListener('click', function () { L.abrir(); });
      }
    });
  } else $('#pLic').hidden = true;
  // PDF A3 directo desde la app de escritorio (la lámina se arma en #imp y se imprime a archivo)
  if (window.reyPdf) window.print = function () { var c = A.E().cfg; window.reyPdf.guardar('Ductos ' + (c.proyecto || '').replace(/[\\/:*?"<>|]+/g, '-')); };
  refrescar();
})();
