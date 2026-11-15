/* Generador universal de entregables · marco estándar de cinco paneles sobre los motores existentes.
 * 1 Configuración · 2 Editor y 3 Vista previa (el módulo real, incrustado) · 4 Acciones · 5 Historial (control documental).
 * No reemplaza ningún motor: «Exportar» pulsa el botón de exportación del propio módulo y deja el evento en el registro. */
(function () {
  'use strict';
  var R = window.RE_ENTREGABLES, G = window.RE_GESTION, A = window.RE_ARCHIVOS, P = window.REProyectos, $ = function (s) { return document.querySelector(s); }; if (!R || !G || !P) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fecha = function (i) { var d = new Date(i); return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); };
  var NOINC = { 'P06-MONT': 1, 'P08-ESC': 1 }; // viven en la portada: se abren en su módulo
  var DISC = { INSTRUMENTACION: 'Instrumentación', CONTROL: 'Control', ELECTRICIDAD: 'Electricidad', PROCESOS: 'Procesos' };
  var marco = $('#marco'), gen = null, reg = null;
  function leer(k) { try { return P.leer(k, null); } catch (e) { return null; } }
  function msg(t, mal) { var m = $('#msg'); m.textContent = t || ''; m.style.color = mal ? 'var(--bad)' : 'var(--sel)'; }
  function genDe(id) { return R.generadores.filter(function (g) { return g.id === id; })[0] || null; }

  // ── 1 Configuración ──
  function llenarTipos() {
    var h = ''; [['DOCUMENTO', 'Documentos de ingeniería'], ['PLANO', 'Planos de ingeniería']].forEach(function (c) {
      h += '<optgroup label="' + c[1] + '">'; R.de(c[0]).forEach(function (x) { var ok = x.gens.filter(function (g) { return g.status === 'AVAILABLE'; });
        if (!ok.length) h += '<option disabled>' + x.sub.id + ' · ' + esc(x.sub.name) + ' (en desarrollo)</option>'; ok.forEach(function (g) { h += '<option value="' + g.id + '">' + x.sub.id + ' · ' + esc(g.name) + '</option>'; }); }); h += '</optgroup>'; });
    $('#cGen').innerHTML = h;
  }
  function entradas() { // datos de entrada reales del proyecto para este generador
    var L = leer('lazos') || {}, PID = leer('pid') || {}, s = (L.senales || []).filter(function (x) { return x.tag; }).length, d = ((L.cond && L.cond.ductos) || []).length, h = (PID.hojas || []).length;
    var id = gen.id, req = null, txt = 'Sin datos de entrada obligatorios.';
    if (/^(D05-INST|D05-ES|D05-CIRC|P02-LAZO|P03-BLQ|P04-UNI)$/.test(id)) { req = s; txt = s + ' señales con tag en el proyecto'; }
    else if (/^(D01-CONDUIT|P08-DUCTO)$/.test(id)) { req = d; txt = d + ' ductos definidos'; }
    else if (id === 'P01-PID') { req = h; txt = h + ' hojas de P&ID cargadas'; }
    return { req: req, txt: txt };
  }
  function pintarCfg() {
    var pr = P.activo(), regs = G.lista().filter(function (d) { return d.gen === gen.id; }).sort(function (a, b) { return a.modificado < b.modificado ? 1 : -1; });
    if (reg && !regs.some(function (d) { return d.id === reg; })) reg = null;
    $('#cReg').innerHTML = '<option value="">Nuevo registro (se crea al guardar o exportar)</option>' + regs.map(function (d) { return '<option value="' + d.id + '"' + (d.id === reg ? ' selected' : '') + '>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo + ' · Rev. ' + d.rev) + '</option>'; }).join('');
    var d = reg && G.uno(reg);
    $('#cTit').value = d ? d.titulo : gen.name; $('#cCod').value = d ? d.codigo : ''; $('#cArea').value = d ? (d.area || '') : '';
    var f = $('#cFmt'), v = f.value; f.innerHTML = gen.outputFormats.map(function (x) { return '<option>' + x + '</option>'; }).join('') || '<option value="">Sin exportación directa</option>'; if (gen.outputFormats.indexOf(v) >= 0) f.value = v;
    $('#cProy').innerHTML = '<small>Proyecto</small>' + esc(pr.nombre || pr.proyecto) + (pr.numero ? ' · ' + esc(pr.numero) : '') + '<small><a href="../proyectos/" style="color:var(--sel)">Editar datos del proyecto</a></small>';
    $('#cDisc').innerHTML = '<small>Disciplina · categoría</small>' + (DISC[gen.discipline] || gen.discipline) + ' · ' + (gen.category === 'PLANO' ? 'Plano' : 'Documento') + ' ' + gen.subcategory;
    $('#cEnt').innerHTML = '<small>Datos de entrada (' + esc(gen.inputFormats.join(', ')) + ')</small>' + esc(entradas().txt) + (gen.note ? '<small>' + esc(gen.note) + '</small>' : '');
    pintarHist();
  }
  // ── 2 y 3 Editor y vista previa: el módulo real ──
  function cargarModulo() {
    var url = new URL('../' + gen.module, location.href).href, s = $('#sin');
    $('#cMod').textContent = gen.name; $('#aMod').href = url;
    if (NOINC[gen.id]) { marco.hidden = true; s.hidden = false; s.innerHTML = '<h3>' + esc(gen.name) + '</h3><p>Este generador trabaja con visores 3D en la portada y se usa en su propio módulo. Aquí puedes llevar su registro, estado y revisiones.</p><a class="btn" href="' + esc(url) + '">Abrir ' + esc(gen.name) + '</a>'; return; }
    s.hidden = true; marco.hidden = false; if (marco.dataset.url !== url) { marco.dataset.url = url; marco.src = url; } else { try { marco.contentWindow.location.reload(); } catch (e) { marco.src = url; } }
  }
  marco.addEventListener('load', function () { // las descargas del módulo incrustado también dejan copia en la carpeta del proyecto
    try { var w = marco.contentWindow, orig = w.HTMLAnchorElement.prototype.click; if (!A || orig.__re) return;
      var nuevo = function () { var a = this, nom = a.download, href = a.href;
        if (nom && /^blob:/.test(href) && A.copiar() && !/\.(reypid|json|rey)$/i.test(nom)) { var pb = w.fetch(href).then(function (r) { return r.blob(); });
          A.raiz().then(function (h) { if (!h) return; var d = asegurar(); return pb.then(function (b) { return A.guardarCopia(gen.subcategory, nom, b, d ? d.rev : ''); }).then(function (ruta) { if (ruta) { if (d) G.adjuntar(d.id, ruta); msg('Copia guardada: ' + ruta); } else msg('Exportado. No se guardó copia: autoriza la carpeta en el Explorador de archivos.'); }); }).catch(function () {}); }
        return orig.apply(a, arguments); }; nuevo.__re = true; w.HTMLAnchorElement.prototype.click = nuevo;
    } catch (e) {}
  });
  // ── Registro ──
  function asegurar() { // crea el registro si aún no existe y guarda la configuración
    var t = $('#cTit').value.trim() || gen.name, d = reg && G.uno(reg);
    if (!d) { d = G.registrar({ gen: gen.id, titulo: t, codigo: $('#cCod').value.trim(), item: 'gu-' + Date.now().toString(36), manual: true }); if (!d) return null; reg = d.id; }
    G.editar(d.id, { titulo: t, codigo: $('#cCod').value, area: $('#cArea').value }); return G.uno(reg);
  }
  // ── 4 Acciones ──
  function validar() {
    var pr = P.activo(), e = entradas(), d = reg && G.uno(reg), f = $('#cFmt').value, o = [];
    function r(tipo, t) { o.push('<li class="' + tipo + '">' + esc(t) + '</li>'); }
    pr.numero && pr.cliente ? r('', 'Proyecto con código y cliente.') : r('e', 'Faltan el código o el cliente en los datos del proyecto.');
    $('#cCod').value.trim() ? r('', 'Código de documento: ' + $('#cCod').value.trim()) : r('w', 'Falta el código de documento.');
    if ($('#cCod').value.trim() && G.lista().some(function (x) { return x.id !== reg && x.codigo && x.codigo.toLowerCase() === $('#cCod').value.trim().toLowerCase(); })) r('e', 'Ese código ya lo usa otro entregable registrado.');
    if (e.req === null) r('i', e.txt); else e.req > 0 ? r('', 'Datos de entrada: ' + e.txt + '.') : r('e', 'Sin datos de entrada: ' + e.txt + '.');
    f ? r('', 'Formato de salida disponible: ' + f + '.') : r('w', 'Este generador no tiene exportación directa desde aquí.');
    if (f && !NOINC[gen.id]) boton(f) ? r('', 'El módulo tiene listo el botón de exportación ' + f + '.') : r('w', 'El módulo aún no muestra un botón ' + f + ': abre o selecciona el entregable en el editor.');
    d ? (d.estado === 'Obsoleto' ? r('w', 'El registro está marcado como obsoleto.') : r('', 'Registro: Rev. ' + d.rev + ' · ' + d.estado + '.')) : r('i', 'Aún sin registro: se creará al guardar o exportar.');
    var fin = function () { $('#val').innerHTML = o.join(''); var n = o.filter(function (x) { return /class="e"/.test(x); }).length; msg(n ? n + ' problema' + (n > 1 ? 's' : '') + ' por resolver.' : 'Validación sin errores.', n > 0); };
    if (A && A.soportado) A.raiz().then(function (h) { h ? r('', 'Carpeta del proyecto vinculada: ' + h.name + '.') : r('i', 'Sin carpeta de proyecto vinculada: la exportación solo se descarga.'); fin(); }, fin); else fin();
  }
  function boton(f) { // botón de exportación visible del módulo incrustado para ese formato
    try { var doc = marco.contentDocument, re = new RegExp('\\b' + (f === 'Excel' ? 'Excel' : f === 'Word' ? 'Word' : f) + '\\b', 'i');
      return [].filter.call(doc.querySelectorAll('button, a.btn'), function (b) { var t = b.textContent || ''; return re.test(t) && !/pegar|vista previa|importar|todos|todas/i.test(t) && b.offsetParent !== null && !b.disabled; })[0] || null; } catch (e) { return null; }
  }
  $('#bVal').addEventListener('click', validar);
  $('#bGen').addEventListener('click', function () { cargarModulo(); msg(NOINC[gen.id] ? 'Este generador se usa en su módulo.' : 'Vista del módulo actualizada con los datos del proyecto.'); });
  $('#bGua').addEventListener('click', function () { var d = asegurar(); if (d) { pintarCfg(); msg('Guardado en el control documental · Rev. ' + d.rev + '.'); } });
  $('#bRev').addEventListener('click', function () { var d = asegurar(); if (!d) return; d = G.nuevaRevision(d.id); pintarCfg(); msg('Nueva revisión ' + d.rev + '. La anterior queda en el historial.'); });
  $('#bExp').addEventListener('click', function () {
    var f = $('#cFmt').value; if (!f || NOINC[gen.id]) { msg('Este generador exporta desde su propio módulo.', true); return; }
    var b = boton(f); if (!b) { msg('El módulo no muestra un botón ' + f + ' ahora: abre o selecciona el entregable en el editor y reintenta.', true); return; }
    var d = asegurar(); if (!d) return; G.anotar(d.id, 'Exportado', f + ' · «' + b.textContent.trim() + '»'); pintarCfg(); msg('Exportación ' + f + ' solicitada al módulo.'); b.click();
  });
  // ── 5 Historial ──
  function pintarHist() {
    var d = reg && G.uno(reg);
    $('#hEst').innerHTML = d ? '<small>Registro</small>Rev. ' + esc(d.rev) + ' · ' + esc(d.estado) + '<small><a href="../documentos/" style="color:var(--sel)">Cambiar estado en el control documental</a></small>' : '<small>Registro</small>Sin registro todavía';
    $('#hist').innerHTML = d ? d.historial.slice().reverse().map(function (h) { return '<li><b>' + esc(h.a) + '</b> ' + esc(h.d) + '<small>' + fecha(h.f) + ' · Rev. ' + esc(h.rev) + '</small></li>'; }).join('') : '';
    $('#bRev').disabled = false;
  }
  function elegir(id, sinHash) { gen = genDe(id) || R.generadores[0]; $('#cGen').value = gen.id; reg = null; $('#val').innerHTML = ''; msg(''); if (!sinHash) history.replaceState(null, '', '#g=' + gen.id); pintarCfg(); cargarModulo(); }
  $('#cGen').addEventListener('change', function (e) { elegir(e.target.value); });
  $('#cReg').addEventListener('change', function (e) { reg = e.target.value || null; pintarCfg(); });
  ['izq', 'der'].forEach(function (k) { var b = $(k === 'izq' ? '#bIzq' : '#bDer'); b.addEventListener('click', function () { var o = $('#gu').classList.toggle('sin' + k); b.setAttribute('aria-pressed', !o); }); });
  G.alCambiar(pintarHist);
  llenarTipos(); var m = /#g=([A-Z0-9-]+)/.exec(location.hash); elegir(m ? m[1] : 'D05-INST', true);
  window.addEventListener('hashchange', function () { var x = /#g=([A-Z0-9-]+)/.exec(location.hash); if (x && (!gen || x[1] !== gen.id)) elegir(x[1], true); });
})();
