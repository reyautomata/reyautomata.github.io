/* Configuración general · reúne ajustes que ya existen en la suite: proyecto, almacenamiento, asistente e interfaz. */
(function () {
  'use strict';
  var P = window.REProyectos, A = window.RE_ARCHIVOS, G = window.RE_GESTION, $ = function (s) { return document.querySelector(s); }; if (!P) return;
  var pr = P.activo(), CL = 'reyengi-asistente';
  $('#pProy').innerHTML = 'Proyecto activo: <b></b>'; $('#pProy b').textContent = (pr.nombre || pr.proyecto) + (pr.numero ? ' · ' + pr.numero : '') + ' · Rev. ' + (pr.rev || '');
  // Almacenamiento
  var kb = 0; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); kb += (k.length + (localStorage.getItem(k) || '').length) * 2; } } catch (e) {}
  function alm(carp) { $('#pAlm').innerHTML = 'Datos guardados en este navegador: <b>' + (kb / 1048576).toFixed(2) + ' MB</b>. Entregables registrados: <b>' + (G ? G.lista().length : 0) + '</b>. Carpeta del proyecto: <b></b>.'; $('#pAlm').lastElementChild.textContent = carp; }
  alm('comprobando…');
  if (A && A.soportado) A.raiz().then(function (h) { alm(h ? (h.name || 'vinculada') : 'sin vincular'); }, function () { alm('sin vincular'); }); else alm('este navegador no permite vincular carpetas');
  if (A) { $('#cCopia').checked = A.copiar(); $('#cCopia').addEventListener('change', function (e) { A.fijarCopia(e.target.checked); }); } else $('#cCopia').disabled = true;
  $('#bResp').addEventListener('click', function () { if (window.RS_RESPALDO) window.RS_RESPALDO(); });
  $('#bRest').addEventListener('click', function () { var i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.addEventListener('change', function () { if (!i.files[0]) return; i.files[0].text().then(function (t) { var id = P.importar(t); $('#mAlm').textContent = 'Respaldo abierto como proyecto nuevo. Selecciónalo en Proyectos.'; return id; }).catch(function () { $('#mAlm').textContent = 'El archivo no es un respaldo de proyecto de ReyEngi.'; }); }); i.click(); });
  // Motor de IA (mismos ajustes del panel del asistente)
  function leerIa() { var s = { url: 'http://127.0.0.1:11434', modelo: '', nombre: 'ReyEngi AI', inst: '' }; try { Object.assign(s, JSON.parse(localStorage.getItem(CL) || '{}')); } catch (e) {} return s; }
  var S = leerIa(); $('#aNom').value = S.nombre; $('#aUrl').value = S.url; $('#aIns').value = S.inst || '';
  function modelos(l) { var m = $('#aMod'); m.innerHTML = ''; (l.length ? l : (S.modelo ? [S.modelo] : [])).forEach(function (x) { var o = document.createElement('option'); o.textContent = x; m.appendChild(o); }); if (S.modelo) m.value = S.modelo; m.disabled = !m.options.length; }
  modelos([]);
  function urlOk(u) { return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(u); }
  function probar() { var u = $('#aUrl').value.trim().replace(/\/+$/, ''); if (!urlOk(u)) { $('#mIa').textContent = 'La dirección debe ser de este equipo (127.0.0.1 o localhost).'; return; } $('#mIa').textContent = 'Probando…';
    fetch(u + '/api/tags').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { var l = (j.models || []).map(function (x) { return x.name; }); modelos(l); $('#mIa').textContent = l.length ? 'Conectado: ' + l.length + ' modelo' + (l.length > 1 ? 's' : '') + ' disponible' + (l.length > 1 ? 's' : '') + '.' : 'Ollama responde, pero no tiene modelos.'; })
      .catch(function () { $('#mIa').textContent = 'Sin conexión con Ollama. Revisa que esté abierto y autorizado para esta página (OLLAMA_ORIGINS).'; }); }
  $('#bProbar').addEventListener('click', probar);
  $('#bIa').addEventListener('click', function () { var s = leerIa(), u = $('#aUrl').value.trim().replace(/\/+$/, ''); if (!urlOk(u)) { $('#mIa').textContent = 'La dirección debe ser de este equipo (127.0.0.1 o localhost).'; return; }
    s.nombre = $('#aNom').value.trim() || 'ReyEngi AI'; s.url = u; s.inst = $('#aIns').value; if ($('#aMod').value) s.modelo = $('#aMod').value; try { localStorage.setItem(CL, JSON.stringify(s)); } catch (e) {} S = s; $('#mIa').textContent = 'Guardado. El asistente lo usará al abrirlo de nuevo.'; });
  // Interfaz
  $('#bDisp').addEventListener('click', function () { try { localStorage.removeItem('reyengi-marco'); localStorage.removeItem('reyengi-pestanas'); } catch (e) {} $('#mInt').textContent = 'Restablecido. Recargando…'; setTimeout(function () { location.reload(); }, 700); });
})();
