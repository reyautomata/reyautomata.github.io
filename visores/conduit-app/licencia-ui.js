(function () {
  'use strict';
  var L = window.reyLicencia, $ = function (s) { return document.querySelector(s); };
  function pintar(s) {
    $('#eq').textContent = s.equipo || '—';
    var e = $('#est'), cls = 'mal', t = 'Sin licencia', p = s.motivo || '';
    if (s.ok && s.dias <= 30) { cls = 'av'; t = 'Licencia por vencer'; p = 'Vigente hasta el ' + s.vence + ' (' + s.dias + ' días) · ' + s.cliente; }
    else if (s.ok) { cls = 'ok'; t = 'Licencia vigente'; p = 'Hasta el ' + s.vence + ' (' + s.dias + ' días) · ' + s.cliente; }
    else if (s.codigo === 'vencida') { t = 'Licencia vencida'; p = s.motivo + ' Solicita la renovación y pega la nueva clave.'; }
    else if (s.codigo === 'reloj') t = 'Fecha del sistema no válida';
    else if (s.codigo === 'equipo' || s.codigo === 'invalida') t = 'Licencia no válida';
    e.className = 'est ' + cls; e.innerHTML = '<h2></h2><p></p>'; e.querySelector('h2').textContent = t; e.querySelector('p').textContent = p;
    if (s.cliente && !$('#emp').value) $('#emp').value = s.cliente;
  }
  L.estado().then(pintar);
  $('#bCopiar').addEventListener('click', function () { L.copiar($('#eq').textContent); $('#msg').className = 'msg ok'; $('#msg').textContent = 'Código copiado.'; });
  $('#bSolicitar').addEventListener('click', function () { L.solicitar({ plan: document.querySelector('input[name=plan]:checked').value, empresa: $('#emp').value.trim() }); });
  $('#bCerrar').addEventListener('click', function () { L.cerrar(); });
  $('#bActivar').addEventListener('click', function () {
    var c = $('#clave').value.trim(), m = $('#msg');
    if (!c) { m.className = 'msg mal'; m.textContent = 'Pega la clave que recibiste.'; return; }
    L.activar(c).then(function (r) {
      if (r.ok) { m.className = 'msg ok'; m.textContent = 'Licencia activada hasta el ' + r.vence + '. Abriendo…'; pintar(Object.assign({ equipo: $('#eq').textContent }, r)); }
      else { m.className = 'msg mal'; m.textContent = r.motivo; }
    });
  });
})();
