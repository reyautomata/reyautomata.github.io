/* Explorador de archivos · muestra la carpeta real vinculada al proyecto activo (RE_ARCHIVOS) y la relaciona con el control documental. */
(function () {
  'use strict';
  var A = window.RE_ARCHIVOS, G = window.RE_GESTION, P = window.REProyectos, $ = function (s) { return document.querySelector(s); }; if (!A || !P) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var H = null, abiertos = { '': true }, sel = null, ARCH = [], DIRS = {};
  function tipo(n) { var e = (n.split('.').pop() || '').toLowerCase(); return e === 'pdf' ? 'pdf' : /^(dxf|dwg)$/.test(e) ? 'dxf' : /^(xlsx|xls|csv)$/.test(e) ? 'xls' : /^(docx|doc)$/.test(e) ? 'doc' : /^(png|jpg|jpeg|webp|svg|gif)$/.test(e) ? 'img' : 'otro'; }
  function tam(b) { return b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' kB' : (b / 1048576).toFixed(1) + ' MB'; }
  var fecha = function (ms) { var d = new Date(ms); return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); };

  function sinCarpeta(motivo) {
    $('#vista').hidden = true; ['#bEstr', '#bRefrescar', '#bCambiar'].forEach(function (q) { $(q).hidden = true; });
    var i = $('#inicio'); i.hidden = false;
    var arbol = A.ESTRUCTURA.map(function (e) { return e[0] + '/' + (e[1].length ? '\n' + e[1].map(function (x) { return '    ' + x + '/'; }).join('\n') : ''); }).join('\n');
    i.innerHTML = !A.soportado ? '<h2>Este navegador no permite abrir carpetas</h2><p>El explorador necesita el acceso a archivos de Chrome o Edge de escritorio (o la app de Windows). En este navegador la suite sigue funcionando, pero sin carpeta de proyecto.</p>'
      : '<h2>' + (motivo === 'permiso' ? 'Vuelve a autorizar la carpeta del proyecto' : 'Vincula la carpeta del proyecto «' + esc(P.activo().nombre) + '»') + '</h2>' +
        (motivo === 'permiso' ? '<p>El navegador pide confirmar el acceso cada vez que abres la suite.</p><button type="button" class="pri" id="bPerm">Autorizar «' + esc(H.name) + '»</button> <button type="button" id="bOtra">Elegir otra carpeta</button>'
          : '<p>Elige una carpeta de tu computador (vacía o existente). La suite mostrará sus archivos reales, podrá crear la estructura estándar y guardará ahí una copia de lo que exportes. Nada se sube a Internet.</p><button type="button" class="pri" id="bVinc">Elegir carpeta…</button><p style="margin-top:12px">Estructura estándar (se crea solo cuando tú lo pides):</p><pre>' + esc(arbol) + '</pre>');
    var b = $('#bVinc') || $('#bOtra'); if (b) b.onclick = function () { A.vincular().then(function (h) { H = h; cargar(); }, function () {}); };
    if ($('#bPerm')) $('#bPerm').onclick = function () { A.permiso(H, true).then(function (q) { if (q === 'granted') cargar(); }); };
  }
  // Lee toda la carpeta (tope de 5000 archivos) para poder buscar, filtrar y mostrar recientes
  function leerTodo() {
    ARCH = []; DIRS = { '': [] }; var n = 0;
    function rec(d, ruta, niv) {
      var hijos = DIRS[ruta] = []; var it = d.entries(), cola = [];
      function sig() { return it.next().then(function (x) { if (x.done || n > 5000) return; var nom = x.value[0], h = x.value[1], r = ruta ? ruta + '/' + nom : nom;
        if (h.kind === 'directory') { hijos.push({ dir: true, n: nom, r: r }); if (niv < 8 && !/^(\.|node_modules)/.test(nom)) cola.push(function () { return rec(h, r, niv + 1); }); return sig(); }
        n++; return h.getFile().then(function (f) { var o = { n: nom, r: r, h: h, t: tipo(nom), b: f.size, m: f.lastModified }; hijos.push(o); ARCH.push(o); }, function () {}).then(sig); }); }
      return sig().then(function () { hijos.sort(function (a, b) { return (b.dir ? 1 : 0) - (a.dir ? 1 : 0) || a.n.localeCompare(b.n, 'es', { numeric: true }); }); return cola.reduce(function (p, f) { return p.then(f); }, Promise.resolve()); });
    }
    return rec(H, '', 0);
  }
  function cargar() {
    A.raiz().then(function (h) { H = h; if (!h) return sinCarpeta(); return A.permiso(h, false).then(function (q) { if (q !== 'granted') return sinCarpeta('permiso');
      $('#inicio').hidden = true; $('#vista').hidden = false; ['#bEstr', '#bRefrescar', '#bCambiar'].forEach(function (x) { $(x).hidden = false; });
      $('#ruta').textContent = h.name + '/'; $('#cCopia').checked = A.copiar();
      return leerTodo().then(function () {
        var fc = $('#fCat'), v = fc.value; fc.innerHTML = '<option value="">Todas las carpetas</option>' + (DIRS[''] || []).filter(function (x) { return x.dir; }).map(function (x) { return '<option>' + esc(x.n) + '</option>'; }).join(''); fc.value = v;
        var faltan = 0; A.ESTRUCTURA.forEach(function (e) { if (!DIRS[e[0]]) faltan++; e[1].forEach(function (x) { if (!DIRS[e[0] + '/' + x]) faltan++; }); });
        $('#bEstr').disabled = !faltan; $('#bEstr').textContent = faltan ? 'Crear carpetas que faltan (' + faltan + ')' : 'Estructura completa';
        $('#pie').textContent = ARCH.length + ' archivos en la carpeta.' + (ARCH.length >= 5000 ? ' Se muestran los primeros 5000.' : '') + (faltan ? ' Las carpetas estándar que aún no existen aparecen atenuadas: no están creadas en el disco.' : '');
        pintar();
      }); }); });
  }
  function registros(r) { return G ? G.deArchivo(r) : []; }
  function filaArch(o) { var rg = registros(o.r); return '<li role="none"><button type="button" class="nd f ' + o.t + '" role="treeitem" data-f="' + esc(o.r) + '" aria-selected="' + (sel === o.r) + '" title="' + esc(o.r) + '"><span class="tw"></span><span class="ic"></span><span class="nm">' + esc(o.n) + '</span>' + (rg.length ? '<span class="reg">Rev. ' + esc(rg[0].rev) + ' · ' + esc(rg[0].estado) + '</span>' : '') + '<span class="mt">' + tam(o.b) + '</span></button></li>'; }
  function rama(ruta) {
    var hs = DIRS[ruta] || [], h = '';
    hs.forEach(function (x) { if (x.dir) { var ab = !!abiertos[x.r]; h += '<li role="none"><button type="button" class="nd" role="treeitem" data-d="' + esc(x.r) + '" aria-expanded="' + ab + '"><span class="tw">' + (ab ? '▾' : '▸') + '</span><span class="ic"></span><span class="nm">' + esc(x.n) + '</span><span class="mt">' + ((DIRS[x.r] || []).length || '') + '</span></button>' + (ab ? '<ul role="group">' + (rama(x.r) || '<li class="vacio">Carpeta vacía</li>') + '</ul>' : '') + '</li>'; } else h += filaArch(x); });
    // carpetas estándar que no existen en el disco: se muestran atenuadas, sin simular que existen
    var std = ruta === '' ? A.ESTRUCTURA.map(function (e) { return e[0]; }) : (A.ESTRUCTURA.filter(function (e) { return e[0] === ruta; })[0] || [0, []])[1];
    std.forEach(function (n) { if (!DIRS[ruta ? ruta + '/' + n : n]) h += '<li role="none"><span class="nd falta" title="Aún no existe en el disco"><span class="tw"></span><span class="ic"></span><span class="nm">' + esc(n) + '</span><span class="mt">no creada</span></span></li>'; });
    return h;
  }
  function pintar() {
    var q = $('#fTxt').value.trim().toLowerCase(), c = $('#fCat').value, t = $('#fTipo').value, ar = $('#exArbol');
    if (q || c || t) { var v = ARCH.filter(function (o) { return (!q || o.r.toLowerCase().indexOf(q) >= 0) && (!c || o.r.indexOf(c + '/') === 0) && (!t || o.t === t); }).sort(function (a, b) { return b.m - a.m; });
      ar.innerHTML = v.length ? '<ul>' + v.slice(0, 300).map(function (o) { return filaArch({ n: o.r, r: o.r, t: o.t, b: o.b }); }).join('') + '</ul>' : '<p class="vacio">Ningún archivo coincide.</p>'; }
    else ar.innerHTML = '<ul>' + (rama('') || '<li class="vacio">La carpeta está vacía. Usa «Crear carpetas que faltan» para armar la estructura.</li>') + '</ul>';
    pintarProp();
  }
  function pintarProp() {
    var p = $('#prop'), o = sel && ARCH.filter(function (x) { return x.r === sel; })[0];
    if (!o) { var rec = ARCH.slice().sort(function (a, b) { return b.m - a.m; }).slice(0, 8);
      p.innerHTML = '<h2>Archivos recientes</h2>' + (rec.length ? '<ul class="rec">' + rec.map(function (x) { return '<li><button type="button" data-f="' + esc(x.r) + '">' + esc(x.n) + '</button><span style="color:var(--muted);font:11px var(--f-mono);margin-left:auto">' + fecha(x.m) + '</span></li>'; }).join('') + '</ul>' : '<p class="nota">Aún no hay archivos. Lo que exportes desde los módulos se guardará aquí.</p>'); return; }
    var rg = registros(o.r), docs = G ? G.lista() : [];
    p.innerHTML = '<h2>' + esc(o.n) + '</h2><div class="acc"><button type="button" class="pri" id="pAbrir">Abrir</button><button type="button" id="pCerrar">Cerrar</button></div>' +
      '<dl style="margin-top:10px"><dt>Ubicación</dt><dd>' + esc(o.r) + '</dd><dt>Tamaño</dt><dd>' + tam(o.b) + '</dd><dt>Modificado</dt><dd>' + fecha(o.m) + '</dd></dl>' +
      '<h3>Entregable asociado</h3>' + (rg.length ? '<ul>' + rg.map(function (d) { return '<li><span>' + esc((d.codigo ? d.codigo + ' · ' : '') + d.titulo) + '<br><span style="color:var(--muted)">' + esc(d.tipo) + ' · Rev. ' + esc(d.rev) + ' · ' + esc(d.estado) + '</span></span><button type="button" data-q="' + d.id + '">Quitar</button></li>'; }).join('') + '</ul>' : '<p class="nota" style="margin:0 0 6px">Este archivo no está asociado a ningún entregable registrado.</p>') +
      (docs.length ? '<select id="pDoc" aria-label="Entregable registrado"><option value="">Asociar a un entregable…</option>' + docs.map(function (d) { return '<option value="' + d.id + '">' + esc(d.subcategoria + ' · ' + (d.codigo ? d.codigo + ' · ' : '') + d.titulo) + '</option>'; }).join('') + '</select>' : '<p class="nota">Registra entregables en el Control documental para poder asociarlos.</p>');
    $('#pAbrir').onclick = function () { o.h.getFile().then(function (f) { var u = URL.createObjectURL(f); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }); };
    $('#pCerrar').onclick = function () { sel = null; pintar(); };
    if ($('#pDoc')) $('#pDoc').onchange = function (e) { if (e.target.value) { G.adjuntar(e.target.value, o.r); pintar(); } };
    p.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { G.desvincular(b.dataset.q, o.r); pintar(); }; });
  }
  $('#exArbol').addEventListener('click', function (e) { var b = e.target.closest('button.nd'); if (!b) return; if (b.dataset.d != null) { abiertos[b.dataset.d] = !abiertos[b.dataset.d]; pintar(); } else { sel = b.dataset.f; pintar(); } });
  $('#prop').addEventListener('click', function (e) { var b = e.target.closest('.rec button'); if (b) { sel = b.dataset.f; pintar(); } });
  ['#fTxt', '#fCat', '#fTipo'].forEach(function (q) { $(q).addEventListener('input', pintar); });
  $('#cCopia').addEventListener('change', function (e) { A.fijarCopia(e.target.checked); });
  $('#bRefrescar').addEventListener('click', cargar);
  $('#bCambiar').addEventListener('click', function () { A.vincular().then(function (h) { H = h; sel = null; cargar(); }, function () {}); });
  $('#bEstr').addEventListener('click', function () { A.crearEstructura().then(function () { abiertos['01_DOCUMENTOS_INGENIERIA'] = abiertos['02_PLANOS_INGENIERIA'] = true; cargar(); }, function (e) { $('#pie').textContent = e.message; }); });
  cargar();
})();
