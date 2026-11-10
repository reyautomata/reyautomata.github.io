/* Normativa · Suite ReyEngi
 * Catálogo de normas, matriz norma × entregable, reglas que usa la app, revisión del proyecto activo y mejoras sugeridas.
 * Los datos viven en ../normas.js (RE_NORMAS), que también leen Canalizaciones, Unilineales y Especificaciones.
 */
(function () {
  'use strict';
  var N = window.RE_NORMAS, PR = window.REProyectos;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ENT = {}; N.ENTREGABLES.forEach(function (e) { ENT[e[0]] = e; });
  var EST = { vigente: 'Vigente', modificada: 'Vigente · modificada', reemplazada: 'Reemplazada', derogada: 'Derogada', fuera: 'Fuera de alcance', consulta: 'En consulta' };
  var PUNTOS = { 3: '●●●', 2: '●●', 1: '●' };
  function link(cod) { var e = ENT[cod]; return e ? '<a href="../' + e[2] + '">' + esc(cod + ' ' + e[1]) + '</a>' : esc(cod); }

  // ── Pestañas ──
  var tabs = $$('.tabs button'), secs = $$('main > section[data-t]');
  function mostrar(t) {
    if (!secs.some(function (s) { return s.dataset.t === t; })) t = 'normas';
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.t === t)); });
    secs.forEach(function (s) { s.hidden = s.dataset.t !== t; });
    try { history.replaceState(null, '', '#' + t); } catch (e) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.t); }); });
  window.addEventListener('hashchange', function () { mostrar(location.hash.slice(1)); });

  // ── Normas ──
  function opcionesEnt(sel) { sel.innerHTML += N.ENTREGABLES.map(function (e) { return '<option value="' + e[0] + '">' + esc(e[0] + ' · ' + e[1]) + '</option>'; }).join(''); }
  opcionesEnt($('#nEnt')); opcionesEnt($('#rEnt'));
  var orgs = {}; N.CATALOGO.forEach(function (n) { orgs[n.org] = 1; });
  $('#nOrg').innerHTML += Object.keys(orgs).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('');
  function pintarNormas() {
    var q = ($('#nBuscar').value || '').toLowerCase(), es = $('#nEstado').value, og = $('#nOrg').value, en = $('#nEnt').value;
    var cuenta = {}; N.CATALOGO.forEach(function (n) { cuenta[n.estado] = (cuenta[n.estado] || 0) + 1; });
    var conAporte = N.CATALOGO.filter(function (n) { return Object.keys(n.e || {}).length && (n.estado === 'vigente' || n.estado === 'modificada'); }).length;
    $('#nResumen').innerHTML = [['Normas revisadas', N.CATALOGO.length], ['Vigentes', (cuenta.vigente || 0) + (cuenta.modificada || 0)], ['Aportan a I&C', conAporte], ['Derogadas o reemplazadas', (cuenta.derogada || 0) + (cuenta.reemplazada || 0)], ['Reglas en la app', N.REGLAS.length]]
      .map(function (x) { return '<div><b>' + x[1] + '</b>' + esc(x[0]) + '</div>'; }).join('');
    var reglasDe = function (id) { return N.REGLAS.filter(function (r) { return r.n === id; }); };
    var L = N.CATALOGO.filter(function (n) {
      if (es && n.estado !== es) return false; if (og && n.org !== og) return false; if (en && !(n.e && n.e[en])) return false;
      if (!q) return true;
      return [n.sigla, n.t, n.org, n.aporte, n.res, n.por].concat(reglasDe(n.id).map(function (r) { return r.c + ' ' + r.txt; })).join(' ').toLowerCase().indexOf(q) >= 0;
    });
    $('#nCards').innerHTML = L.map(function (n) {
      var e = n.e || {}, ks = Object.keys(e).sort(function (a, b) { return e[b] - e[a] || a.localeCompare(b); }), nr = reglasDe(n.id).length;
      return '<article class="card ' + n.estado + '"><h3>' + esc(n.sigla) + ' <span class="est ' + n.estado + '">' + esc(EST[n.estado]) + '</span><small>' + esc(n.t) + '</small></h3>' +
        '<div class="meta">' + esc(n.org) + (n.desde ? ' · rige desde ' + esc(n.desde) : '') + (n.res ? ' · ' + esc(n.res) : '') + '</div>' +
        (n.por ? '<p><b>Reemplazada por:</b> ' + esc(n.por) + '</p>' : '') + (n.base ? '<p>' + esc(n.base) + '</p>' : '') + (n.aporte ? '<p>' + esc(n.aporte) + '</p>' : '') +
        (ks.length ? '<div class="chips">' + ks.map(function (k) { return '<span class="chip w' + e[k] + '" title="Aporte ' + PUNTOS[e[k]] + '">' + esc(k + ' ' + ENT[k][1]) + '</span>'; }).join('') + '</div>' : '') +
        (nr ? '<div class="meta">' + nr + ' regla' + (nr > 1 ? 's' : '') + ' en la app · <a href="#reglas" data-norma="' + n.id + '">ver</a></div>' : '') + '</article>';
    }).join('') || '<p class="peq">Sin resultados.</p>';
  }
  ['#nBuscar', '#nEstado', '#nOrg', '#nEnt'].forEach(function (s) { $(s).addEventListener('input', pintarNormas); });
  $('#nCards').addEventListener('click', function (ev) { var a = ev.target.closest('a[data-norma]'); if (!a) return; ev.preventDefault(); $('#rNorma').value = a.dataset.norma; $('#rEnt').value = ''; $('#rEst').value = ''; pintarReglas(); mostrar('reglas'); });

  // ── Matriz ──
  var conAp = N.CATALOGO.filter(function (n) { return Object.keys(n.e || {}).length && (n.estado === 'vigente' || n.estado === 'modificada'); });
  function pintarMatriz() {
    var cols = N.ENTREGABLES;
    $('#mTabla').innerHTML = '<thead><tr><th>Norma</th>' + cols.map(function (e) { return '<th class="v" title="' + esc(e[1]) + '">' + esc(e[0] + ' ' + e[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      conAp.map(function (n) { return '<tr><td><b>' + esc(n.sigla) + '</b><br><span class="peq">' + esc(n.t) + '</span></td>' + cols.map(function (e) { var w = n.e[e[0]]; return w ? '<td class="c w' + w + '" data-n="' + n.id + '" data-e="' + e[0] + '" tabindex="0" aria-label="' + esc(n.sigla + ' en ' + e[1]) + '">' + PUNTOS[w] + '</td>' : '<td></td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td class="peq"><b>Normas por entregable</b></td>' + cols.map(function (e) { return '<td class="c w1">' + conAp.filter(function (n) { return n.e[e[0]]; }).length + '</td>'; }).join('') + '</tr></tbody>';
  }
  function detalle(nid, cod) {
    var n = N.NI[nid], rs = N.REGLAS.filter(function (r) { return r.n === nid && r.ent.indexOf(cod) >= 0; }), d = $('#mDetalle');
    $$('#mTabla td.c.sel').forEach(function (c) { c.classList.remove('sel'); });
    var c = $('#mTabla td.c[data-n="' + nid + '"][data-e="' + cod + '"]'); if (c) c.classList.add('sel');
    d.hidden = false;
    d.innerHTML = '<h2>' + esc(n.sigla) + ' → ' + link(cod) + '</h2><p>' + esc(n.aporte || n.t) + '</p>' + (rs.length ? '<div class="tscroll" style="max-height:none"><table class="t"><thead><tr><th>Cláusula</th><th>Requisito</th><th>En la app</th></tr></thead><tbody>' +
      rs.map(function (r) { return '<tr><td><b>' + esc(r.c) + '</b></td><td>' + esc(r.txt) + '</td><td>' + esc(r.u) + ' <span class="st ' + r.s + '">' + r.s + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="peq">Sin reglas específicas registradas: aplica como criterio general del entregable.</p>');
  }
  $('#mTabla').addEventListener('click', function (ev) { var c = ev.target.closest('td.c[data-n]'); if (c) detalle(c.dataset.n, c.dataset.e); });
  $('#mTabla').addEventListener('keydown', function (ev) { if (ev.key !== 'Enter') return; var c = ev.target.closest('td.c[data-n]'); if (c) detalle(c.dataset.n, c.dataset.e); });

  // ── Reglas ──
  $('#rNorma').innerHTML += conAp.filter(function (n) { return N.REGLAS.some(function (r) { return r.n === n.id; }); }).map(function (n) { return '<option value="' + n.id + '">' + esc(n.sigla) + '</option>'; }).join('');
  function pintarReglas() {
    var en = $('#rEnt').value, nm = $('#rNorma').value, st = $('#rEst').value;
    var L = N.REGLAS.filter(function (r) { return (!en || r.ent.indexOf(en) >= 0) && (!nm || r.n === nm) && (!st || r.s === st); });
    var c = { aplicada: 0, nueva: 0, pendiente: 0 }; L.forEach(function (r) { c[r.s]++; });
    $('#rCuenta').textContent = L.length + ' reglas · ' + c.aplicada + ' aplicadas · ' + c.nueva + ' nuevas · ' + c.pendiente + ' pendientes';
    $('#rTabla tbody').innerHTML = L.map(function (r) {
      return '<tr><td><b>' + esc(N.NI[r.n].sigla) + '</b><br><span class="meta">' + esc(r.c) + '</span></td><td>' + esc(r.txt) + '</td><td><div class="chips">' + r.ent.map(function (k) { return '<span class="chip">' + esc(k) + '</span>'; }).join('') + '</div></td><td>' + esc(r.u) + '</td><td><span class="st ' + r.s + '">' + r.s + '</span></td></tr>';
    }).join('');
  }
  ['#rEnt', '#rNorma', '#rEst'].forEach(function (s) { $(s).addEventListener('input', pintarReglas); });
  function valor(v) { return Array.isArray(v) ? v.map(function (x) { return Array.isArray(x) ? x.join(' · ') : x; }).join(' / ') : String(v); }
  $('#rParam').innerHTML = '<thead><tr><th>Parámetro</th><th>Valores</th><th>Fuente</th></tr></thead><tbody>' + Object.keys(N.P).map(function (k) {
    var o = N.P[k], cita = o.cita || (k === 'aislamiento' ? 'RIC N°19 Tabla N°19.1' : '');
    var vals = Array.isArray(o) ? o.map(function (x) { return x[0] + ': ' + x[1] + ' VCC ≥ ' + String(x[2]).replace('.', ',') + ' MΩ'; }).join(' · ') : Object.keys(o).filter(function (j) { return j !== 'cita'; }).map(function (j) { return j + ' ' + valor(o[j]); }).join(' · ');
    return '<tr><td><code>' + esc(k) + '</code></td><td>' + esc(vals) + '</td><td class="peq">' + esc(cita) + '</td></tr>';
  }).join('') + '</tbody>';
  $('#rExcel').addEventListener('click', function () {
    var X = window.XLSX_RE; if (!X) return;
    var lb = X.libro(), AZ = '022A55', h = lb.hoja('NORMAS', { orientacion: 'landscape' });
    h.cols([22, 50, 22, 16, 30, 40, 60]); h.celda(0, 0, 'NORMATIVA ELÉCTRICA CHILENA APLICADA A ENTREGABLES DE I&C', { b: true, sz: 12 });
    ['NORMA', 'TÍTULO', 'ORGANISMO', 'ESTADO', 'ACTO / VIGENCIA', 'REEMPLAZADA POR', 'APORTE'].forEach(function (t, i) { h.celda(2, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    N.CATALOGO.forEach(function (n, k) { [n.sigla, n.t, n.org, EST[n.estado], [n.res, n.desde ? 'rige ' + n.desde : ''].filter(Boolean).join(' · '), n.por || '', n.aporte || n.base || ''].forEach(function (v, i) { h.celda(3 + k, i, String(v || ''), { sz: 9, wrap: true }); }); });
    var m = lb.hoja('MATRIZ', { orientacion: 'landscape' }); m.cols([22].concat(N.ENTREGABLES.map(function () { return 9; })));
    m.celda(0, 0, 'NORMA', { b: true, fill: AZ, color: 'FFFFFF' }); N.ENTREGABLES.forEach(function (e, i) { m.celda(0, 1 + i, e[0] + ' ' + e[1], { b: true, fill: AZ, color: 'FFFFFF', wrap: true, h: 'center' }); });
    conAp.forEach(function (n, k) { m.celda(1 + k, 0, n.sigla, { sz: 9, b: true }); N.ENTREGABLES.forEach(function (e, i) { var w = n.e[e[0]]; m.celda(1 + k, 1 + i, w ? ['', 'BAJO', 'MEDIO', 'ALTO'][w] : '', { sz: 9, h: 'center' }); }); });
    var r = lb.hoja('REGLAS', { orientacion: 'landscape' }); r.cols([14, 22, 80, 22, 40, 12]);
    ['NORMA', 'CLÁUSULA', 'REQUISITO', 'ENTREGABLES', 'USO EN LA APP', 'ESTADO'].forEach(function (t, i) { r.celda(0, i, t, { b: true, fill: AZ, color: 'FFFFFF', h: 'center' }); });
    N.REGLAS.forEach(function (x, k) { [N.NI[x.n].sigla, x.c, x.txt, x.ent.join(', '), x.u, x.s.toUpperCase()].forEach(function (v, i) { r.celda(1 + k, i, String(v), { sz: 9, wrap: true }); }); });
    var blob = X.generar(lb), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = 'Normativa_IC_ReyEngi.xlsx'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  // ── Revisión del proyecto ──
  function cfg() { var c = (PR && PR.leer('normativa', {})) || {}; if (c.minero == null) c.minero = true; c.correas = c.correas || []; return c; }
  function guardar(c) { if (PR) PR.escribir('normativa', c); }
  function pintarRevision() {
    var c = cfg(), pr = PR ? PR.activo() : {};
    $('#vProyecto').textContent = 'Proyecto activo: ' + (pr.proyecto || pr.numero || '—') + (pr.altura ? ' · ' + pr.altura + ' m.s.n.m.' : '') + (pr.area ? ' · área ' + pr.area : '') + (pr.tensionControl ? ' · control ' + pr.tensionControl : '');
    $('#vMinero').checked = c.minero !== false; $('#vCoord').checked = !!c.coordinado;
    $('#vCorreas tbody').innerHTML = c.correas.map(function (x, i) {
      var req = (Math.ceil((+x.largo || 0) / N.P.motor.paradaCorreasCada) + 1) * (+x.lados || 2), ok = +x.tirantes >= req;
      return '<tr data-i="' + i + '"><td><input data-k="tag" value="' + esc(x.tag || '') + '" aria-label="Tag de la correa"></td><td><input data-k="largo" type="number" min="0" value="' + esc(x.largo || '') + '" style="width:80px" aria-label="Largo"></td><td><select data-k="lados" aria-label="Lados con tirante"><option value="2"' + (+x.lados !== 1 ? ' selected' : '') + '>2</option><option value="1"' + (+x.lados === 1 ? ' selected' : '') + '>1</option></select></td><td><input data-k="tirantes" type="number" min="0" value="' + esc(x.tirantes || '') + '" style="width:80px" aria-label="Tirantes previstos"></td><td><b class="' + (ok ? '' : 'mal') + '">' + req + '</b></td><td><button type="button" data-q="' + i + '" aria-label="Quitar correa">✕</button></td></tr>';
    }).join('') || '<tr><td colspan="6" class="peq">Agrega las correas del proyecto para verificar los tirantes de parada de emergencia (uno cada 20 m como máximo por lado).</td></tr>';
  }
  $('#vMinero').addEventListener('change', function () { var c = cfg(); c.minero = this.checked; guardar(c); });
  $('#vCoord').addEventListener('change', function () { var c = cfg(); c.coordinado = this.checked; guardar(c); });
  $('#vAgregarCorrea').addEventListener('click', function () { var c = cfg(); c.correas.push({ tag: 'CV-' + (c.correas.length + 1), largo: 100, lados: 2, tirantes: '' }); guardar(c); pintarRevision(); });
  $('#vCorreas').addEventListener('change', function (ev) { var t = ev.target, tr = t.closest('tr[data-i]'); if (!tr || !t.dataset.k) return; var c = cfg(), x = c.correas[+tr.dataset.i]; x[t.dataset.k] = t.value; guardar(c);
    var req = (Math.ceil((+x.largo || 0) / N.P.motor.paradaCorreasCada) + 1) * (+x.lados || 2), b = tr.querySelector('td:nth-child(5) b'); b.textContent = req; b.className = +x.tirantes >= req ? '' : 'mal'; });
  $('#vCorreas').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-q]'); if (!b) return; var c = cfg(); c.correas.splice(+b.dataset.q, 1); guardar(c); pintarRevision(); });
  $('#vRevisar').addEventListener('click', function () {
    var H = N.revisar(), por = {};
    H.forEach(function (x) { (por[x.ent] = por[x.ent] || []).push(x); });
    var orden = { error: 0, aviso: 1, info: 2 };
    $('#vEstado').textContent = H.length ? H.filter(function (x) { return x.sev === 'error'; }).length + ' incumplimientos · ' + H.filter(function (x) { return x.sev === 'aviso'; }).length + ' avisos · ' + H.filter(function (x) { return x.sev === 'info'; }).length + ' notas' : 'Sin observaciones con los datos actuales.';
    $('#vHall').innerHTML = N.ENTREGABLES.filter(function (e) { return por[e[0]]; }).map(function (e) {
      return '<div class="blk"><h2>' + link(e[0]) + '</h2><ul>' + por[e[0]].sort(function (a, b) { return orden[a.sev] - orden[b.sev]; }).map(function (x) {
        var r = N.REGLAS.filter(function (q) { return q.id === x.regla; })[0];
        return '<li class="' + x.sev + '">' + esc(x.txt) + (r ? '<span class="meta">' + esc(N.NI[r.n].sigla + ' ' + r.c) + '</span>' : '') + '</li>';
      }).join('') + '</ul></div>';
    }).join('');
  });
  function exVer() {
    var r = N.exCompatible($('#exZona').value, $('#exMarca').value), p = $('#exRes');
    p.textContent = r.msg; p.className = 'exres' + (r.ok === true ? ' ok' : r.ok === false ? ' no' : '');
  }
  $('#exZona').addEventListener('input', exVer); $('#exMarca').addEventListener('input', exVer);

  // ── Mejoras ──
  function pintarMejoras() {
    var peso = function (r) { return r.ent.reduce(function (s, k) { var n = N.NI[r.n]; return s + ((n.e && n.e[k]) || 1); }, 0); };
    var L = N.REGLAS.filter(function (r) { return r.s === 'pendiente'; }).sort(function (a, b) { return peso(b) - peso(a); });
    var grupos = {}; L.forEach(function (r) { (grupos[r.u] = grupos[r.u] || []).push(r); });
    $('#mjLista').innerHTML = Object.keys(grupos).map(function (u, i) {
      var rs = grupos[u], ents = {}; rs.forEach(function (r) { r.ent.forEach(function (k) { ents[k] = 1; }); });
      return '<div class="blk"><h2>' + (i + 1) + '. ' + esc(u) + '</h2><div class="chips" style="margin-bottom:8px">' + Object.keys(ents).sort().map(function (k) { return '<span class="chip">' + esc(k + ' ' + ENT[k][1]) + '</span>'; }).join('') + '</div><ul class="lst">' +
        rs.map(function (r) { return '<li><b>' + esc(N.NI[r.n].sigla + ' ' + r.c) + '</b> · ' + esc(r.txt) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
  }

  pintarNormas(); pintarMatriz(); pintarReglas(); pintarRevision(); exVer(); pintarMejoras();
  mostrar(location.hash.slice(1));
})();
