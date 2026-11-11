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
      if (s.dias <= (s.plan === '30d' ? 7 : 30)) {
        var av = $('#aviso'); av.hidden = false;
        av.innerHTML = '<span>Tu licencia vence en <b>' + s.dias + ' día' + (s.dias === 1 ? '' : 's') + '</b> (' + s.vence + '). Renueva para seguir usando la app.</span><button type="button" class="btn">Renovar</button>';
        av.querySelector('button').addEventListener('click', function () { L.abrir(); });
      }
    });
  } else $('#pLic').hidden = true;
  // Publicidad de la Suite ReyEngi (botón en el rincón inferior izquierdo)
  (function () {
    var WSP = '56931959479';
    var txt = encodeURIComponent('Hola, uso ReyEngi Conduit y me interesa conocer la Suite ReyEngi de ingeniería de instrumentación y control.');
    var b = document.createElement('button'); b.type = 'button'; b.id = 'rsBtn'; b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = '<img src="' + document.querySelector('.barra .logo').getAttribute('src') + '" alt=""><span>Suite ReyEngi</span>';
    var d = document.createElement('dialog'); d.id = 'rsDlg'; d.setAttribute('aria-labelledby', 'rsTit');
    d.innerHTML = '<button type="button" class="rs-x" aria-label="Cerrar">✕</button>' +
      '<p class="rs-k">ReyEngi · Ingeniería I&amp;C para minería</p>' +
      '<h2 id="rsTit">Esta app es parte de una suite completa de ingeniería de instrumentación y control</h2>' +
      '<p class="rs-l">Una sola base de proyecto para la ingeniería conceptual, básica y de detalle: cambias un tag y se actualiza en todos los documentos.</p>' +
      '<ul>' + ['Listado de instrumentos, hojas de datos ISA-TR20 y especificaciones', 'Listado de E/S y diagramas de lazo ISA-5.4 en PDF y DXF', 'Tarjetas por fabricante, conexionado y listado de circuitos', 'Ductos, escalerillas y unilineales según RIC (SEC)', 'Más de 40 detalles típicos de montaje en 3D con plano A3', 'Requisiciones de compra desde el listado de instrumentos']
        .map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="rs-l">Pensada para proyectos mineros en operación (brownfield) y plantas nuevas. Disponible para empresas de ingeniería, mandantes y equipos de proyecto.</p>' +
      '<a class="rs-wsp" href="https://wa.me/' + WSP + '?text=' + txt + '" target="_blank" rel="noopener">Quiero una demostración · WhatsApp</a>' +
      '<p class="rs-p">Escríbenos y coordinamos una presentación con tu equipo.</p>';
    document.body.appendChild(b); document.body.appendChild(d);
    b.addEventListener('click', function () { d.showModal(); });
    d.querySelector('.rs-x').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  })();
  // PDF A3 directo desde la app de escritorio (la lámina se arma en #imp y se imprime a archivo)
  if (window.reyPdf) window.print = function () { var c = A.E().cfg; window.reyPdf.guardar('Ductos ' + (c.proyecto || '').replace(/[\\/:*?"<>|]+/g, '-')); };
  refrescar();
})();
