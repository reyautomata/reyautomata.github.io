/* Suite ReyEngi · tutor: busca en la base de conocimiento (guías de uso, instrumentación, normativa, ingeniería) y arma la respuesta.
 * No depende de la IA: con el modelo apagado entrega la guía tal cual; con el modelo encendido le pasa las guías como contexto. */
(function () {
  'use strict';
  var B = window.RE_TUTOR_BASE; if (!B || window.RE_TUTOR) return;
  var BASE = window.RS_BASE || './';
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var VACIAS = {}; ('como que cual cuales donde cuando para por con sin del los las una unos unas este esta esto eso ese hago hacer hace puedo puede quiero necesito debo hay tiene tengo ser son esta estan mas muy pero sobre desde hasta entre algo todo todos cada uno dos tres paso pasos explica explicame dime ayuda ayudame suite app aplicacion pagina tutor').split(' ').forEach(function (w) { VACIAS[w] = 1; });
  var SIN = { planilla: 'excel', xlsx: 'excel', docx: 'word', bajar: 'exportar', descargar: 'exportar', sacar: 'exportar', imprimir: 'pdf', crear: 'generar', armar: 'generar', nuevo: 'crear', anadir: 'agregar', sumar: 'agregar', loop: 'lazo', loops: 'lazos', datasheet: 'hoja', conduit: 'ducto', tuberia: 'ducto', tablero: 'tdi', backup: 'respaldo', guardar: 'respaldo', normas: 'normativa', norma: 'normativa', sensor: 'instrumento', sensores: 'instrumentos', caudal: 'flujo', caudalimetro: 'flujometro', tension: 'tension', voltaje: 'tension' };
  function terminos(t) { var o = []; norm(t).split(/[^a-z0-9&]+/).forEach(function (w) { if (!w || VACIAS[w] || (w.length < 3 && !/\d/.test(w))) return; o.push(w); if (SIN[w]) o.push(SIN[w]); if (w.length > 4 && /s$/.test(w)) o.push(w.replace(/e?s$/, '')); }); return o.filter(function (w, i) { return o.indexOf(w) === i; }); }
  // Corpus: guías + saber + normas chilenas del catálogo de la suite (si está cargado)
  var DOCS = B.guias.concat(B.saber).map(function (d) { return { d: d, t: norm(d.t), k: norm(d.k), x: norm(d.tipo === 'guia' ? d.p.join(' ') + ' ' + d.n : d.x) }; });
  function sumarNormas() {
    var N = window.RE_NORMAS; if (!N || sumarNormas.ok) return; sumarNormas.ok = 1;
    (N.CATALOGO || []).forEach(function (n) { var reglas = (N.REGLAS || []).filter(function (r) { return r.n === n.id; }).slice(0, 4).map(function (r) { return (r.c ? r.c + ': ' : '') + (r.txt || ''); }).filter(Boolean);
      var x = (n.org ? n.org + '. ' : '') + (n.estado ? 'Estado: ' + n.estado + (n.desde ? ' desde ' + n.desde : '') + '. ' : '') + (n.base || '') + ' ' + (n.aporte || '') + (reglas.length ? ' Reglas que usa la suite: ' + reglas.join(' · ') : '');
      var d = { id: 'cat-' + n.id, tipo: 'saber', a: 'Normativa', t: n.sigla + ' · ' + n.t, k: n.sigla + ' ' + n.id, x: x.trim() + ' El texto que rige es el publicado por el organismo.', mod: 'normativa/' };
      DOCS.push({ d: d, t: norm(d.t), k: norm(d.k), x: norm(d.x) }); });
  }
  function buscar(texto, cuantos) {
    sumarNormas(); var q = terminos(texto), res = []; if (!q.length) return [];
    DOCS.forEach(function (o) { var s = 0, m = 0; q.forEach(function (w) { var a = 0; if (o.t.indexOf(w) >= 0) a += 3; if (o.k.indexOf(w) >= 0) a += 3; if (o.x.indexOf(w) >= 0) a += 1; if (a) { s += Math.min(a, 5); m++; } });
      if (!m) return; s *= 0.5 + 0.5 * m / q.length; if (o.d.tipo === 'guia' && /\b(como|pasos|donde|hago|hacer|crear|generar|exportar|agregar|cargar|usar)\b/.test(norm(texto))) s *= 1.25;
      res.push({ d: o.d, s: s, pct: Math.min(100, Math.round(100 * s / (q.length * 5 * 1.25))) }); });
    return res.sort(function (a, b) { return b.s - a.s; }).slice(0, cuantos || 4);
  }
  function texto(d) { return d.tipo === 'guia' ? 'GUÍA DE USO: ' + d.t + '\nMódulo: ' + d.mod + '\nPasos:\n' + d.p.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + (d.n ? '\nNota: ' + d.n : '') : 'CONOCIMIENTO (' + d.a + '): ' + d.t + '\n' + d.x; }
  function contexto(res) { // lo que recibe el modelo
    return 'Material del manual interno de la Suite ReyEngi relacionado con la pregunta (úsalo como fuente principal):\n\n' + res.slice(0, 3).map(function (r) { return texto(r.d); }).join('\n\n') +
      '\n\nResponde como tutor experto de la suite: si es una guía de uso, entrega los pasos numerados con los nombres de botones y menús exactamente como aparecen arriba; si es conocimiento de instrumentación, normativa o ingeniería, explica y razona con ese material y agrega sugerencias prácticas para el proyecto. No inventes botones ni funciones que no estén en el material. Sobre normas, aclara que el texto que rige es el del organismo.';
  }
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  function irA(d) { // abre el módulo y destaca el botón de la guía
    try { if (d.sel) sessionStorage.setItem('rs-tutor-dest', d.sel); else sessionStorage.removeItem('rs-tutor-dest'); } catch (e) {}
    var u = new URL(d.mod, BASE).href, mismo = u.split('#')[0] === location.href.split('#')[0]; if (u === location.href) { destacar(); return; } location.href = u; if (mismo) setTimeout(destacar, 500);
  }
  function hallar(sel) { if (!sel) return null; if (sel.indexOf('texto:') === 0) { var t = sel.slice(6); return [].filter.call(document.querySelectorAll('main button, main a.btn, .barra button, header button, .cinta button'), function (b) { return (b.textContent || '').trim().indexOf(t) === 0 && b.offsetParent !== null; })[0] || null; } try { var e = document.querySelector(sel); return e && e.offsetParent !== null ? e : null; } catch (x) { return null; } }
  function destacar() {
    var sel = null; try { sel = sessionStorage.getItem('rs-tutor-dest'); } catch (e) {} if (!sel) return; var n = 0;
    (function probar() { var e = hallar(sel); if (!e) { if (++n < 14) setTimeout(probar, 350); else { try { sessionStorage.removeItem('rs-tutor-dest'); } catch (x) {} } return; }
      try { sessionStorage.removeItem('rs-tutor-dest'); } catch (x) {} e.scrollIntoView({ block: 'center' }); e.classList.add('ra-dest'); setTimeout(function () { e.classList.remove('ra-dest'); }, 9000); })();
  }
  function ampliar(src, alt) { var d = document.createElement('dialog'); d.className = 'ra-zoom'; var i = el('img'); i.src = src; i.alt = alt; var b = el('button', '', 'Cerrar'); b.type = 'button'; b.onclick = function () { d.close(); }; d.append(i, b); d.addEventListener('close', function () { d.remove(); }); d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); document.body.appendChild(d); d.showModal(); }
  function imagen(d) { if (!d.img) return null; var b = el('button', 'ra-img'); b.type = 'button'; var i = el('img'); i.loading = 'lazy'; i.alt = 'Pantalla de la suite: ' + d.t; i.src = BASE + 'tutor/img/' + d.img + '.jpg'; i.onerror = function () { b.remove(); }; b.title = 'Ampliar la imagen'; b.onclick = function () { ampliar(i.src, i.alt); }; b.append(i); return b; }
  // Tarjeta completa de una guía o artículo (respuesta sin IA)
  function tarjeta(d, alPreguntar, otros) {
    var c = el('div', 'ra-guia'); c.append(el('small', '', d.tipo === 'guia' ? 'Guía de la suite' : d.a), el('h4', '', d.t));
    var im = d.tipo === 'guia' ? imagen(d) : null; if (im) c.append(im);
    if (d.tipo === 'guia') { var ol = el('ol'); d.p.forEach(function (p) { ol.append(el('li', '', p)); }); c.append(ol); if (d.n) c.append(el('p', 'ra-gn', d.n)); } else c.append(el('p', '', d.x));
    c.append(pie(d)); if (otros && otros.length) c.append(relacionadas(otros, alPreguntar));
    return c;
  }
  function pie(d) { var f = el('div', 'ra-gp'); if (d.mod) { var b = el('button', 'pri', d.tipo === 'guia' ? 'Llévame ahí' : 'Abrir el módulo relacionado'); b.type = 'button'; b.onclick = function () { irA(d); }; f.append(b); } return f; }
  function relacionadas(l, alPreguntar) { var r = el('div', 'ra-rel'); r.append(el('span', '', 'Relacionado:')); l.forEach(function (o) { var b = el('button', '', o.d.t); b.type = 'button'; b.onclick = function () { alPreguntar(o.d.t); }; r.append(b); }); return r; }
  // Complemento bajo una respuesta de la IA: imagen y botón de la mejor guía
  function apoyo(r, alPreguntar, otros) { var c = el('div', 'ra-guia ra-apoyo'), d = r.d; c.append(el('small', '', (d.tipo === 'guia' ? 'Guía: ' : d.a + ': ') + d.t)); var im = d.tipo === 'guia' ? imagen(d) : null; if (im) c.append(im); c.append(pie(d)); if (otros && otros.length) c.append(relacionadas(otros, alPreguntar)); return c; }
  var TEMAS = ['¿Cómo creo un proyecto?', '¿Cómo cargo un P&ID?', '¿Cómo hago un diagrama de lazo?', '¿Cómo exporto el listado de instrumentos?', '¿Cómo se arma un tag ISA?', '¿Cómo elijo un transmisor de nivel?', '¿Qué normas usa la suite?', '¿Qué se entrega en cada etapa?', 'Sugerencias para ingeniería de detalle'];
  window.RE_TUTOR = { buscar: buscar, contexto: contexto, tarjeta: tarjeta, apoyo: apoyo, destacar: destacar, TEMAS: TEMAS, total: function () { sumarNormas(); return DOCS.length; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', destacar); else setTimeout(destacar, 300);
})();
