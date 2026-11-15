/* Suite ReyEngi · portada por ventanas.
 * Cada sección de la página principal se muestra sola, como una ventana propia, con un botón para volver al inicio.
 * Inicio = tablero del proyecto + accesos a las secciones + resumen. El logo de la cabecera siempre vuelve al inicio. */
(function () {
  'use strict';
  var main = document.querySelector('main'); if (!main || !document.body.classList.contains('rs-portada')) return;
  var SEC = [
    ['ciclo', 'Etapas del proyecto', 'Qué entregables corresponden a la ingeniería conceptual, básica y de detalle, la construcción y la operación.'],
    ['ingenieria', 'Ingeniería por disciplina', 'Los entregables ordenados por disciplina: procesos, instrumentación, control, electricidad y comunicaciones.'],
    ['brownfield', 'Brownfield y mejora continua', 'Cómo usar la suite en plantas en operación: levantamiento, modificaciones y mejoras.'],
    ['montajes', 'Detalles típicos y visores 3D', 'Detalles de montaje, escalerillas, tableros, fibra óptica, radiocomunicación y procesos, con plano A3.'],
    ['formacion', 'Formación', 'Rutas de aprendizaje para ingenieros y proyectistas de I&C.']
  ].filter(function (s) { return document.getElementById(s[0]); });
  var IDS = SEC.map(function (s) { return s[0]; }), vista = null;
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  // Accesos a las secciones (solo en Inicio)
  var menu = el('section', 'pt-menu'); menu.id = 'secciones'; menu.setAttribute('aria-label', 'Secciones de la suite');
  menu.appendChild(el('h2', '', 'Secciones'));
  var gr = el('div', 'pt-grid');
  SEC.forEach(function (s) { var a = el('a', 'pt-card'); a.href = '#' + s[0]; a.appendChild(el('b', '', s[1])); a.appendChild(el('span', '', s[2])); if (s[0] === 'formacion') a.appendChild(el('em', '', 'Próximamente')); gr.appendChild(a); });
  menu.appendChild(gr);
  var tb = document.getElementById('tablero'), hero = document.getElementById('inicio');
  main.insertBefore(menu, main.firstChild); // primero los accesos, luego el tablero y el resumen
  // Botón de regreso en cada sección
  SEC.forEach(function (s) { var sec = document.getElementById(s[0]), v = el('a', 'pt-volver', '← Volver al inicio'); v.href = '#inicio'; sec.insertBefore(v, sec.firstChild); });
  // Logo de la cabecera: más grande y lleva al inicio
  var logo = document.querySelector('.brandlogo');
  if (logo) { logo.classList.add('pt-logo'); logo.setAttribute('role', 'link'); logo.tabIndex = 0; logo.title = 'Ir al inicio'; if (!logo.alt) logo.alt = 'ReyEngi · ir al inicio';
    var ir = function () { location.hash = '#inicio'; mostrar('inicio', true); }; logo.addEventListener('click', ir); logo.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } }); }

  function deHash() { var h = decodeURIComponent(location.hash.replace(/^#/, '')); if (!h || h === 'inicio' || h === 'tablero' || h === 'secciones') return 'inicio'; return IDS.indexOf(h) >= 0 ? h : 'montajes'; } // pestañas y visores pertenecen a Detalles típicos
  function mostrar(v, arriba) {
    var cambio = v !== vista; vista = v;
    [tb, menu, hero].forEach(function (x) { if (x) x.classList.toggle('pt-oculta', v !== 'inicio'); });
    SEC.forEach(function (s) { document.getElementById(s[0]).classList.toggle('pt-oculta', s[0] !== v); });
    document.body.dataset.vista = v;
    [].forEach.call(document.querySelectorAll('.topnav a'), function (a) { var on = a.getAttribute('href') === '#' + v; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (cambio && arriba) { window.scrollTo(0, 0); if (location.hash === '#tablero' && tb) tb.scrollIntoView(); }
    if (cambio) window.dispatchEvent(new Event('resize'));
  }
  window.addEventListener('hashchange', function () { var v = deHash(); mostrar(v, true); if (v === 'inicio' && location.hash !== '#tablero') setTimeout(function () { window.scrollTo(0, 0); }, 0); });
  // Las pestañas del catálogo cambian la dirección sin avisar: se revisa después de cada clic
  document.addEventListener('click', function () { setTimeout(function () { if (location.hash.length > 1) { var v = deHash(); if (v !== vista) mostrar(v, true); } }, 0); });
  mostrar(deHash(), false);
  setTimeout(function () { mostrar(vista, false); }, 400); // el observador de la portada marca la navegación al cargar
})();
