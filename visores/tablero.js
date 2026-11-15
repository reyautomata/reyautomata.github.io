/* Suite ReyEngi · tablero del proyecto activo (portada).
 * Muestra solo registros reales guardados en este navegador y el estado real del registro de entregables. */
(function () {
  'use strict';
  var P = window.REProyectos, R = window.RE_ENTREGABLES, main = document.querySelector('main'); if (!P || !R || !main) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sec = document.createElement('section'); sec.id = 'tablero'; sec.className = 'tb'; sec.setAttribute('aria-labelledby', 'tbT'); main.insertBefore(sec, main.firstChild);
  function leer(k) { try { return P.leer(k, null); } catch (e) { return null; } }
  function pintar() {
    var d = P.activo(), L = leer('lazos') || {}, PID = leer('pid') || {}, H = window.RS_HIJOS || function () { return []; };
    var nInst = (L.senales || []).filter(function (s) { return s.tag; }).length + (L.inst || []).filter(function (i) { return i.manual && !i.oculto; }).length;
    var N = { 'D05-INST': nInst, 'D05-ES': (L.senales || []).length, 'P02-LAZO': H('06').length, 'P08-DUCTO': H('H3').length, 'D01-CONDUIT': H('H3').length, 'P01-PID': (PID.cand || []).length };
    var U = { 'D05-INST': 'instrumentos', 'D05-ES': 'señales', 'P02-LAZO': 'lazos', 'P08-DUCTO': 'ductos', 'D01-CONDUIT': 'ductos', 'P01-PID': 'instrumentos detectados' };
    function col(cat, titulo) {
      var g = R.de(cat), disp = g.filter(function (x) { return x.sub.status === 'AVAILABLE'; }).length;
      return '<div class="tb-col"><h3>' + titulo + '<small>' + disp + ' de ' + g.length + ' subcategorías con generador</small></h3><ul>' + g.map(function (x) {
        var ok = x.gens.filter(function (q) { return q.status === 'AVAILABLE'; });
        return '<li' + (ok.length ? '' : ' class="dev"') + '><span class="cod">' + x.sub.id + '</span><span class="nm">' + esc(x.sub.name) + '</span>' + (ok.length ? ok.map(function (q) {
          return '<a href="' + esc(q.module) + '" title="' + esc(q.name + ' · ' + (q.outputFormats.join(', ') || 'visor')) + '">' + esc(q.name) + (N[q.id] ? ' <b>' + N[q.id] + ' ' + U[q.id] + '</b>' : '') + '</a>'; }).join('') : '<em>En desarrollo</em>') + '</li>';
      }).join('') + '</ul></div>';
    }
    function gestion() {
      var G = window.RE_GESTION; if (!G) return '';
      var r = G.resumen(), docs = G.lista(), ult = function (c) { var l = docs.filter(function (x) { return x.categoria === c; }).sort(function (a, b) { return a.modificado < b.modificado ? 1 : -1; })[0]; return l ? '<a href="documentos/">' + esc(l.titulo) + '</a> <em>Rev. ' + esc(l.rev) + ' · ' + esc(l.estado) + '</em>' : '<em>ninguno registrado</em>'; };
      function fila(c, t) { var x = r[c], pend = (x.Borrador || 0) + (x['En desarrollo'] || 0) + (x['Con observaciones'] || 0);
        return '<div class="tb-col"><h3>' + t + ' registrados<small><a href="documentos/">Control documental</a></small></h3><div class="tb-est"><span><b>' + x.total + '</b> total</span><span><b>' + pend + '</b> pendientes</span><span><b>' + (x['En revisión'] || 0) + '</b> en revisión</span><span><b>' + (x.Aprobado || 0) + '</b> aprobados</span><span><b>' + (x.Emitido || 0) + '</b> emitidos</span></div>' +
          (x.total ? '<div class="tb-bar" role="img" aria-label="Avance: ' + ((x.Aprobado || 0) + (x.Emitido || 0)) + ' de ' + x.total + ' aprobados o emitidos"><i style="width:' + Math.round(100 * ((x.Aprobado || 0) + (x.Emitido || 0)) / x.total) + '%"></i></div>' : '') + '<p class="tb-n">Último: ' + ult(c) + '</p></div>'; }
      return '<div class="tb-cols">' + fila('DOCUMENTO', 'Documentos') + fila('PLANO', 'Planos') + '</div>';
    }
    var rec = []; try { rec = (JSON.parse(localStorage.getItem('reyengi-marco') || '{}').rec || []).slice(0, 5); } catch (e) {}
    var revs = (L.revs || []).slice(-4).reverse();
    function dato(k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>' : ''; }
    function ficha(n, t) { return '<div class="tb-f"><b>' + n + '</b><span>' + t + '</span></div>'; }
    sec.innerHTML = '<div class="tb-cab"><div><p class="tb-k">Tablero del proyecto activo</p><h2 id="tbT">' + esc(d.nombre || d.proyecto) + '</h2></div><a class="tb-ir" href="proyectos/">Abrir o cambiar de proyecto</a></div>' +
      '<dl class="tb-datos">' + dato('Código', d.numero) + dato('Proyecto', d.proyecto) + dato('Cliente', d.cliente) + dato('Etapa', d.fase) + dato('Revisión', d.rev) + dato('Ubicación', d.ubicacion) + '</dl>' +
      '<div class="tb-fichas">' + ficha(nInst, 'instrumentos') + ficha((L.senales || []).length, 'señales de E/S') + ficha(H('06').length, 'diagramas de lazo') + ficha((L.modulos || []).length, 'tarjetas') + ficha(H('H3').length, 'ductos') + ficha((PID.hojas || []).length, 'hojas de P&ID cargadas') + '</div>' +
      gestion() +
      '<div class="tb-cols">' + col('DOCUMENTO', 'Documentos de ingeniería') + col('PLANO', 'Planos de ingeniería') + '</div>' +
      '<div class="tb-cols"><div class="tb-col"><h3>Abierto recientemente</h3>' + (rec.length ? '<ul>' + rec.map(function (r) { return '<li><span class="cod">' + esc(r.c || '') + '</span><a href="' + esc(r.href) + '">' + esc(r.t) + '</a></li>'; }).join('') + '</ul>' : '<p class="tb-n">Aún no abres entregables en este navegador.</p>') + '</div>' +
      '<div class="tb-col"><h3>Revisiones registradas</h3>' + (revs.length ? '<ul>' + revs.map(function (r) { return '<li><span class="cod">' + esc(r.rev) + '</span><span class="nm">' + esc(r.desc || '') + '</span><em>' + esc(r.fecha || '') + '</em></li>'; }).join('') + '</ul>' : '<p class="tb-n">Sin revisiones registradas en la configuración de entregables.</p>') + '</div></div>' +
      '<p class="tb-n">Las cifras salen de los datos guardados del proyecto. Los estados y el avance cuentan solo los entregables registrados en el control documental.</p>';
  }
  pintar();
  var tg = 0, esperar = setInterval(function () { if (window.RE_GESTION) { clearInterval(esperar); window.RE_GESTION.alCambiar(pintar); pintar(); } else if (++tg > 40) clearInterval(esperar); }, 100);
  window.addEventListener('storage', function (e) { if (e.key && /reyengi/.test(e.key)) pintar(); });
})();
