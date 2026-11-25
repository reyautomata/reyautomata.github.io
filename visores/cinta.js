/* Suite ReyEngi · cinta de opciones
 * Franja superior con las tareas de la suite ordenadas como avanza el trabajo:
 *   Inicio (proyecto y datos base) → Documentos → Planos → Control documental → Herramientas → Guía.
 * Cada pestaña agrupa sus tareas en paneles con título. Se arma desde la misma lista del explorador (GRUPOS de suite.js),
 * así que un módulo nuevo aparece solo en ambas partes. Los generadores que aún no existen se muestran «En desarrollo».
 *   · Buscar una tarea: Ctrl+K            · Minimizar o mostrar la cinta: Ctrl+F1 o doble clic en una pestaña
 *   · Si el ancho no alcanza, los paneles se pliegan en un botón, del menos usado al más usado.
 * Dibujos propios, de trazo simple. */
(function () {
  'use strict';
  var CLAVE = 'reyengi-cinta', CLAVE_H = 'reyengi-cinta-h';

  // ── Iconos (20 × 20, solo trazo) ──
  var IC = {
    inicio: '<path d="M3.5 9.5 10 3.8l6.5 5.7"/><path d="M5.2 8.4v7.8h3.4v-4.4h2.8v4.4h3.4V8.4"/>',
    proy: '<path d="M2.8 5.2h4.6l1.6 1.8h8.2v8.6H2.8z"/>',
    senal: '<path d="M3 7h10.5M11 4.5 13.5 7 11 9.5M17 13H6.5M9 10.5 6.5 13 9 15.5"/>',
    tarjeta: '<rect x="5" y="2.8" width="10" height="14.4" rx="1.2"/><path d="M8 6h4M8 9h4M8 12h4M8 15h.1"/>',
    calc: '<rect x="5" y="2.8" width="10" height="14.4" rx="1.2"/><path d="M7.4 5.4h5.2v2.4H7.4zM7.8 11h.1M10 11h.1M12.2 11h.1M7.8 14h.1M10 14h.1M12.2 14h.1"/>',
    doc: '<path d="M5 2.8h6.2L15 6.6v10.6H5z"/><path d="M11 3v3.8h3.8M7.4 10h5.2M7.4 12.8h5.2"/>',
    espec: '<path d="M5 2.8h6.2L15 6.6v10.6H5z"/><path d="M11 3v3.8h3.8M7.6 11.8l1.7 1.7 3.2-3.4"/>',
    hoja: '<rect x="3.5" y="3.5" width="13" height="13" rx="1.2"/><path d="M3.5 7.4h13M3.5 11h13M8.4 7.4v9.1"/>',
    lista: '<path d="M7.4 5.5h9M7.4 10h9M7.4 14.5h9M3.8 5.5h.8M3.8 10h.8M3.8 14.5h.8"/>',
    material: '<path d="M10 2.8 16.5 6v8L10 17.2 3.5 14V6z"/><path d="M3.7 6.1 10 9.2l6.3-3.1M10 9.2v8"/>',
    compra: '<path d="M2.6 4h2.2l1.8 8.4h8.2l1.5-5.9H5.7"/><circle cx="8" cy="15.4" r="1"/><circle cx="13.6" cy="15.4" r="1"/>',
    cruce: '<circle cx="5" cy="5" r="2.4"/><circle cx="15" cy="5" r="2.4"/><circle cx="10" cy="15" r="2.4"/><path d="M7.2 6.2l1.6 6.6M12.8 6.2l-1.6 6.6M7.4 5h5.2"/>',
    imagen: '<rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/><circle cx="7" cy="8" r="1.6"/><path d="M3 15l4.5-4.5 3 3 2.5-2.5 4.5 4.5"/>',
    pid: '<circle cx="10" cy="7.4" r="3.6"/><path d="M6.4 7.4h7.2M10 11v4.4M3 15.4h14"/>',
    lazo: '<circle cx="5.4" cy="10" r="2.4"/><rect x="12.2" y="7.6" width="4.8" height="4.8" rx=".6"/><path d="M7.8 10h4.4M5.4 7.6V4.6h9.2v3M5.4 12.4v3h9.2v-3"/>',
    bloques: '<rect x="2.8" y="7.6" width="4.6" height="4.8" rx=".6"/><rect x="12.6" y="3.4" width="4.6" height="4.4" rx=".6"/><rect x="12.6" y="12.2" width="4.6" height="4.4" rx=".6"/><path d="M7.4 10H10M10 5.6v8.8M10 5.6h2.6M10 14.4h2.6"/>',
    unilineal: '<path d="M10 2.8v5.6M10 13.6v3.6M3.5 5.6h13M5.6 5.6v3M14.4 5.6v3"/><circle cx="10" cy="11" r="2.6"/>',
    montaje: '<path d="M3 16.4h14M10 16.4V9.4M7 13h6"/><circle cx="10" cy="6.2" r="3.2"/>',
    ducto: '<circle cx="10" cy="10" r="6.6"/><circle cx="7.8" cy="8.6" r="1.6"/><circle cx="12.3" cy="8.9" r="1.6"/><circle cx="10" cy="12.6" r="1.6"/>',
    escalerilla: '<path d="M3 6.5h14M3 13.5h14M6 6.5v7M10 6.5v7M14 6.5v7"/>',
    plano: '<rect x="3" y="4" width="14" height="12" rx="1"/><path d="M11 12.6h6M11 12.6V16"/>',
    todos: '<path d="M6.5 5.2h6.4l2.6 2.6v9.4h-9z"/><path d="M4.5 14.6V2.8h7"/>',
    trabajo: '<path d="M4 16l.8-3.4 8.8-8.8 2.6 2.6-8.8 8.8z"/><path d="M12 5.4l2.6 2.6"/>',
    revision: '<circle cx="9" cy="9" r="4.8"/><path d="M12.4 12.4l4 4M7 9l1.5 1.5L11 7.8"/>',
    coord: '<circle cx="7" cy="7" r="2.4"/><circle cx="13.6" cy="8" r="2"/><path d="M2.8 15.8c.4-2.6 2-4 4.2-4s3.8 1.4 4.2 4M12.4 12.2c2.4-.4 4.2.8 4.8 3.4"/>',
    firmas: '<path d="M3 16.4h14M4.4 13c1.6-5 3.4-8 4.6-8s.6 3-1 6.2c1.4-1.8 2.6-2.8 3.2-2.4.8.5-.6 2.4.4 2.8.8.3 1.8-.6 4-.6"/>',
    emitir: '<path d="M3.2 9.6l13.6-6.2-4.4 13.2-2.8-5.2z"/><path d="M9.6 11.4l7.2-8"/>',
    emitido: '<circle cx="10" cy="10" r="6.8"/><path d="M6.8 10.2l2.2 2.2 4.2-4.6"/>',
    archivos: '<rect x="3" y="3.6" width="14" height="4" rx=".8"/><path d="M4.2 7.6v8.8h11.6V7.6M8 11h4"/>',
    tuberia: '<path d="M3 7.4h8a3.6 3.6 0 0 1 3.6 3.6v6M3 11.4h7.6v5.6M3 5.8v7.2M9 17h7.2"/>',
    valvula: '<path d="M3.4 6.6v7.4l6.6-3.7zM16.6 6.6v7.4L10 10.3zM10 10.3V5.6M7.4 5.6h5.2"/>',
    espesador: '<path d="M3 5h14v5.4l-7 5.4-7-5.4z"/><path d="M10 2.6V9M7.4 9h5.2"/>',
    mesa: '<rect x="3" y="3.6" width="14" height="12.8" rx="1.2"/><path d="M3 7.4h14M9 7.4v9"/>',
    etapas: '<path d="M3 15.6h3.6V12h3.6V8.4h3.6V4.8H17"/>',
    disciplina: '<path d="M10 3.4 17 7l-7 3.6L3 7z"/><path d="M3.4 10.4 10 13.8l6.6-3.4M3.4 13.4 10 16.8l6.6-3.4"/>',
    planta: '<path d="M3 16.4V8.6l4.4 2.6V8.6l4.4 2.6V4.4h4.4v12z"/><path d="M6 13.6h.1M9.4 13.6h.1M12.8 13.6h.1"/>',
    norma: '<path d="M10 5.4c-1.6-1.2-4-1.6-6.6-1.4v10.8c2.6-.2 5 .2 6.6 1.4 1.6-1.2 4-1.6 6.6-1.4V4c-2.6-.2-5 .2-6.6 1.4zM10 5.4v10.8"/>',
    libreria: '<path d="M4 3.6h3v12.8H4zM7 3.6h3v12.8H7zM11.2 5.2l2.8-.9 3 11.3-2.8.9z"/>',
    buscar: '<circle cx="8.8" cy="8.8" r="4.8"/><path d="M12.4 12.4l4.2 4.2"/>',
    explorador: '<rect x="3" y="3.6" width="14" height="12.8" rx="1.2"/><path d="M7.6 3.6v12.8"/>',
    tema: '<circle cx="10" cy="10" r="6.6"/><path d="M10 3.4v13.2M10 6.2a3.8 3.8 0 0 1 0 7.6"/>',
    texto: '<path d="M3.2 15.5 7.4 4.5h.8l4.2 11M4.8 11.8h6M13.2 15.5l1.9-5.2h.6l1.9 5.2M14 13.8h2.8"/>',
    reloj: '<circle cx="10" cy="10" r="6.8"/><path d="M10 6.2V10l2.6 1.6"/>',
    arriba: '<path d="M5 12.5 10 7.5l5 5"/>', abajo: '<path d="M5 7.5 10 12.5l5-5"/>'
  };
  // Icono y nombre corto de cada tarea, por su código en el explorador
  var ICOD = { IN: 'inicio', S4: 'plano', TZ: 'cruce', IM: 'imagen', '00': 'proy', FA: 'etapas', AR: 'bloques', FL: 'etapas', E1: 'senal', E2: 'tarjeta', MC: 'calc', '04': 'espec', '03': 'hoja', '02': 'lista', '05': 'senal', '07': 'lista', '12': 'material', '11': 'compra',
    '01': 'pid', '06': 'lazo', '09': 'bloques', '08': 'unilineal', '10': 'montaje', H3: 'ducto', ES: 'escalerilla', GD: 'todos', B1: 'trabajo', B2: 'revision', B3: 'coord', B4: 'firmas', B5: 'emitir', B6: 'emitido', EX: 'archivos',
    H1: 'tuberia', H2: 'valvula', H5: 'espesador', MT: 'mesa', ET: 'etapas', DI: 'disciplina', BF: 'planta', H4: 'norma', BT: 'libreria',
    D02: 'doc', D07: 'doc', D08: 'lista', D09: 'hoja', P05: 'plano', P07: 'plano', P09: 'bloques', P10: 'tarjeta' };
  var CORTO = { IN: 'Tablero', S4: 'Suite 4.0', TZ: 'Cruces por tag', IM: 'Mejora de imagen', '00': 'Datos del proyecto', FA: 'Fase y alcance', AR: 'Arquitectura', FL: 'Flujo de ingeniería', E1: 'Señales E/S e índice', E2: 'Tarjetas y canales', MC: 'Memoria canalizaciones', '04': 'Especificaciones', '03': 'Hojas de datos', '02': 'Instrumentos', '05': 'Entradas y salidas', '07': 'Circuitos', '12': 'Materiales', '11': 'Requisiciones',
    '01': 'Análisis de P&ID', '06': 'Diagramas de lazo', '09': 'Bloques de control', '08': 'Unilineales TDI', '10': 'Detalles de montaje', H3: 'Corte de ductos', ES: 'Escalerillas', GD: 'Todos', B1: 'En trabajo', B2: 'Revisión', B3: 'Coordinación', B4: 'Firmas', B5: 'Para emitir', B6: 'Emitidos', EX: 'Archivos',
    H1: 'Leer P&ID', H2: 'Válvulas', H5: 'Espesador', MT: 'Mesa libre', ET: 'Etapas', DI: 'Disciplinas', BF: 'Brownfield', H4: 'Normativa SEC', BT: 'Manuales y librerías' };
  // Pestañas: [id, título, grupos del explorador que reúne]. Un grupo que no esté aquí se agrega como pestaña propia.
  var PESTANAS = [['ini', 'Inicio', ['ini', 'p00']], ['bas', 'Ingeniería base', ['p01', 'p02', 'p03']], ['pla', 'Diagramas y montaje', ['p04', 'p05']], ['doc', 'Listados y documentos', ['p06', 'p07', 'p08']], ['ctl', 'Control documental', ['ctl']], ['her', 'Herramientas', ['her']], ['gui', 'Guía', ['gui']]];
  // Paneles de cada grupo: [título, códigos de tarea o de subcategoría, tipo]. Lo que no esté nombrado se agrega solo (por subcategoría o en «Más»).
  // Los títulos llevan el número del grupo en el árbol del proyecto (00 a 09), el mismo del explorador.
  var PANELES = {
    ini: [['Proyecto', ['IN', 'S4', 'TZ']]],
    p00: [['00 Proyecto', ['00', 'FA', 'FL']]],
    p01: [['01 P&ID', ['01', 'H1', 'IM']]], p02: [['02 Base de datos', ['E1', 'E2', 'TZ']]], p03: [['03 Arquitectura', ['AR']]],
    p04: [['04 Diagramas', ['06', '09', '08']]], p05: [['05 Montaje y canalizaciones', ['10', 'H3', 'ES']]],
    p06: [['06 Listados', ['02', '05', '07', '12', 'MC']]], p07: [['07 Documentos técnicos', ['03', '04']]], p08: [['08 Compras', ['11']]],
    ctl: [['Entregables', ['GD']], ['Flujo de emisión', ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'], 'flujo'], ['Archivos', ['EX']]],
    her: [['Piping y válvulas', ['H2']], ['Proceso', ['H5']], ['Espacio de trabajo', ['MT']], ['Imagen', ['IM']]],
    gui: [['Guía de ingeniería', ['ET', 'DI', 'BF']], ['Normativa y referencias', ['H4', 'BT']]]
  };
  function svg(n) { return '<svg viewBox="0 0 20 20" aria-hidden="true">' + (IC[n] || IC.doc) + '</svg>'; }

  function montar(api) {
    var d = document, raiz = d.documentElement, esc = api.esc, norm = api.norm, B = api.base;
    var E = { min: false }; try { Object.assign(E, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
    function recordar() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} }
    var movil = window.matchMedia('(max-width: 900px)');

    // ── Modelo: pestañas → paneles → tareas ──
    function panelesDe(g) {
      var items = [], sub = null, subN = {};
      g[2].forEach(function (e) {
        if (!e[2]) { if (e[3] === 'sub') { sub = e[0]; subN[sub] = e[1]; } else { items.push({ cod: e[0], t: e[1], dev: true }); sub = null; } return; }
        items.push({ cod: e[0], t: e[1], href: B + e[2], sub: sub });
      });
      var out = [];
      (PANELES[g[0]] || []).forEach(function (p) {
        var its = items.filter(function (it) { return !it.p && (p[1].indexOf(it.cod) >= 0 || (it.sub && p[1].indexOf(it.sub) >= 0)); });
        its.forEach(function (it) { it.p = 1; });
        if (its.length) out.push({ t: p[0], its: its, tipo: p[2] || '' });
      });
      var porSub = {}, orden = [];
      items.forEach(function (it) { if (it.p || it.dev) return; var k = it.sub || ''; if (!porSub[k]) { porSub[k] = []; orden.push(k); } porSub[k].push(it); });
      orden.forEach(function (k) { out.push({ t: k ? subN[k] : 'Más', its: porSub[k], tipo: '' }); });
      var dev = items.filter(function (it) { return !it.p && it.dev; });
      if (dev.length) out.push({ t: 'En desarrollo', its: dev, tipo: 'dev' });
      return out;
    }
    var tabs = (function () {
      var porId = {}, usados = {}, o = []; api.grupos.forEach(function (g) { porId[g[0]] = g; });
      PESTANAS.forEach(function (p) { var ps = []; p[2].forEach(function (id) { if (!porId[id]) return; usados[id] = 1; panelesDe(porId[id]).forEach(function (n) { var ya = ps.filter(function (x) { return x.t === n.t && x.tipo === n.tipo; })[0]; if (ya) ya.its = ya.its.concat(n.its); else ps.push(n); }); }); if (ps.length) o.push({ id: p[0], t: p[1], ps: ps }); });
      api.grupos.forEach(function (g) { if (!usados[g[0]]) { var ps = panelesDe(g); if (ps.length) o.push({ id: g[0], t: g[1], ps: ps }); } });
      return o;
    })();
    function tabDe(id) { return tabs.filter(function (x) { return x.id === id; })[0] || tabs[0]; }
    function tieneActual(tb) { return tb.ps.some(function (p) { return p.its.some(function (it) { return it.href && api.esActual(it.href); }); }); }
    var deAqui = (tabs.filter(tieneActual)[0] || tabs[0]).id, sel = deAqui;

    // ── Estructura ──
    var cinta = d.createElement('div'); cinta.id = 'rsCinta'; cinta.className = 'rc'; cinta.setAttribute('role', 'navigation'); cinta.setAttribute('aria-label', 'Cinta de opciones');
    cinta.innerHTML = '<div class="rc-fila"><a class="rc-logo" href="' + B + '#inicio" title="ReyEngi · Tablero de inicio" aria-label="ReyEngi, ir al tablero de inicio">' +
      '<img class="rc-lo-o" src="' + B + '../img/logo-reyengi-light.png" alt=""><img class="rc-lo-c" src="' + B + '../img/logo-reyengi.png" alt=""></a>' +
      '<div class="rc-tabs" role="tablist" aria-label="Pestañas de la cinta">' +
      tabs.map(function (tb) { return '<button type="button" class="rc-t" role="tab" id="rcT-' + tb.id + '" data-t="' + tb.id + '" aria-controls="rcPan">' + esc(tb.t) + '</button>'; }).join('') + '</div>' +
      '<div class="rc-bus">' + svg('buscar') + '<input type="search" id="rcBuscar" placeholder="Buscar tarea o tag" aria-label="Buscar una tarea de la suite" role="combobox" aria-expanded="false" aria-controls="rcRes" aria-autocomplete="list" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd><div class="rc-res" id="rcRes" role="listbox" aria-label="Tareas encontradas" hidden></div></div>' +
      '<button type="button" class="rc-min" id="rcMin" aria-pressed="false"></button></div><div class="rc-pan" id="rcPan" role="tabpanel"></div>';
    d.body.insertBefore(cinta, d.body.firstChild);
    var pan = cinta.querySelector('#rcPan'), fila = cinta.querySelector('.rc-tabs'), bq = cinta.querySelector('#rcBuscar'), res = cinta.querySelector('#rcRes'), bMin = cinta.querySelector('#rcMin');

    // ── Dibujo de tareas y paneles ──
    function boton(it) {
      var nom = CORTO[it.cod] || it.t, ic = svg(ICOD[it.cod]);
      if (it.dev) return '<span class="rc-b rc-dev" aria-disabled="true" title="' + esc(it.t) + ' · generador en desarrollo">' + ic + '<span>' + esc(nom) + '</span><em>En desarrollo</em></span>';
      return '<a class="rc-b" href="' + esc(it.href) + '" title="' + esc(it.t) + '"' + (api.esActual(it.href) ? ' aria-current="page"' : '') + '>' + ic + '<span>' + esc(nom) + '</span></a>';
    }
    function menor(it) {
      var ic = svg(it.ic || ICOD[it.cod]);
      if (it.ac) return '<button type="button" class="rc-s" data-ac="' + it.ac + '" title="' + esc(it.tt || it.t) + '">' + ic + '<span>' + esc(it.t) + '</span></button>';
      if (it.dev) return '<span class="rc-s rc-dev" aria-disabled="true" title="' + esc(it.t) + ' · generador en desarrollo">' + ic + '<span>' + esc(it.t) + '</span></span>';
      return '<a class="rc-s" href="' + esc(it.href) + '" title="' + esc((it.c ? it.c + ' · ' : '') + it.t) + '">' + ic + '<span>' + (it.c ? '<b>' + esc(it.c) + '</b> ' : '') + esc(it.t) + '</span></a>';
    }
    function panel(p) {
      var chico = p.tipo === 'dev' || p.tipo === 'men', uno = !chico && p.its.length === 1, p0 = p.its[0] || {};
      return '<div class="rc-g' + (p.tipo === 'dev' ? ' rc-sec' : '') + (uno ? ' rc-uno' : '') + '" role="group" aria-label="' + esc(p.t) + '">' +
        '<button type="button" class="rc-gc" aria-expanded="false" title="' + esc(p.t) + '">' + svg(p.ic || p0.ic || ICOD[p0.cod]) + '<span>' + esc(p.t) + '</span><i aria-hidden="true">▾</i></button>' +
        '<div class="rc-gb' + (p.tipo === 'flujo' ? ' rc-fl' : '') + '">' + (chico ? '<div class="rc-col">' + p.its.map(menor).join('') + '</div>' : p.its.map(boton).join('')) + '</div>' +
        '<div class="rc-gt" aria-hidden="true">' + esc(p.t) + '</div></div>';
    }
    var VISTA = [{ ac: 'exp', t: 'Explorador', ic: 'explorador', tt: 'Mostrar u ocultar el explorador (Ctrl+B)' }, { ac: 'tema', t: 'Tema claro u oscuro', ic: 'tema' }, { ac: 'tam', t: 'Tamaño del texto', ic: 'texto' }];
    var firmaRec = '';
    function firma() { return tabDe(sel).id === 'ini' ? JSON.stringify(api.recientes()) : ''; }
    function pintarPan() {
      var tb = tabDe(sel), ps = tb.ps.slice();
      if (tb.id === 'ini') {
        var rec = api.recientes();
        if (rec.length) ps.push({ t: 'Recientes', tipo: 'men', ic: 'reloj', its: rec.map(function (r) { return { t: r.t, c: r.c, href: B + r.href, ic: 'reloj' }; }) });
        ps.push({ t: 'Vista', tipo: 'men', ic: 'explorador', its: VISTA });
      }
      pan.innerHTML = ps.map(panel).join(''); pan.setAttribute('aria-labelledby', 'rcT-' + tb.id); firmaRec = firma();
      ajustar();
    }
    function pintarTabs() {
      [].forEach.call(fila.children, function (b) {
        var tb = tabDe(b.dataset.t), on = b.dataset.t === sel;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.classList.toggle('rc-aqui', tieneActual(tb));
      });
    }
    // Si los paneles no caben, se pliegan en un botón: primero «En desarrollo», después de derecha a izquierda
    function ajustar() {
      var gs = [].slice.call(pan.children);
      gs.forEach(function (g) { g.classList.remove('rc-pl', 'rc-ab', 'rc-der'); g.firstChild.setAttribute('aria-expanded', 'false'); });
      if (cinta.classList.contains('rc-mn')) return;
      var resto = gs.filter(function (g) { return !g.classList.contains('rc-sec') && !g.classList.contains('rc-uno'); }).reverse();
      var enUso = resto.filter(function (g) { return g.querySelector('[aria-current]'); });   // el panel de la tarea abierta es el último en plegarse
      var cola = gs.filter(function (g) { return g.classList.contains('rc-sec'); }).concat(resto.filter(function (g) { return enUso.indexOf(g) < 0; }), enUso);
      for (var i = 0; i < cola.length && pan.scrollWidth > pan.clientWidth + 1; i++) cola[i].classList.add('rc-pl');
    }
    // ── Alto de la cinta: el resto de la página se acomoda con la variable --rs-cinta ──
    var alto = -1;
    function medir() {
      var h = cinta.offsetHeight; if (h === alto) return; alto = h;
      raiz.style.setProperty('--rs-cinta', h + 'px'); try { localStorage.setItem(CLAVE_H, String(h)); } catch (e) {}
      window.dispatchEvent(new Event('resize'));
    }
    function cerrarPaneles() { [].forEach.call(pan.querySelectorAll('.rc-g.rc-ab'), function (g) { g.classList.remove('rc-ab', 'rc-der'); g.firstChild.setAttribute('aria-expanded', 'false'); }); }
    function cerrarTodo() { cinta.classList.remove('rc-ab'); cerrarPaneles(); cerrarRes(); }
    function aplicarMin() {
      var m = !!E.min || movil.matches; cinta.classList.toggle('rc-mn', m); cinta.classList.toggle('rc-mov', movil.matches); if (!m) cinta.classList.remove('rc-ab');
      bMin.setAttribute('aria-pressed', m ? 'true' : 'false'); bMin.innerHTML = svg(m ? 'abajo' : 'arriba');
      bMin.title = (m ? 'Mostrar la cinta completa' : 'Minimizar la cinta: dejar solo las pestañas') + ' (Ctrl+F1)'; bMin.setAttribute('aria-label', bMin.title);
      pintarTabs(); pintarPan(); medir();
    }
    function alternarMin() { E.min = !E.min; recordar(); aplicarMin(); }
    function elegir(id, foco) {
      if (cinta.classList.contains('rc-mn')) { if (sel === id && cinta.classList.contains('rc-ab')) cinta.classList.remove('rc-ab'); else { sel = id; cinta.classList.add('rc-ab'); } }
      else sel = id;
      pintarTabs(); pintarPan(); if (foco) { var b = d.getElementById('rcT-' + sel); if (b) b.focus(); }
    }
    function accion(ac) {
      if (ac === 'exp') { var id = movil.matches ? 'rsAbrir' : (d.body.classList.contains('rs-plegado') ? 'rsPestana' : 'rsPlegar'), el = d.getElementById(id); if (el) el.click(); }
      else if (ac === 'tema') api.tema(); else if (ac === 'tam') api.tam(); else if (ac === 'min') alternarMin();
    }

    fila.addEventListener('click', function (e) { var b = e.target.closest('.rc-t'); if (b) elegir(b.dataset.t); });
    fila.addEventListener('dblclick', function (e) { if (e.target.closest('.rc-t') && !movil.matches) alternarMin(); });
    fila.addEventListener('keydown', function (e) {
      var b = e.target.closest('.rc-t'); if (!b) return; var i = tabs.indexOf(tabDe(b.dataset.t)), n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length; else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
      if (n < 0) return; e.preventDefault();
      if (cinta.classList.contains('rc-mn') && !cinta.classList.contains('rc-ab')) { var o = d.getElementById('rcT-' + tabs[n].id); [].forEach.call(fila.children, function (x) { x.tabIndex = x === o ? 0 : -1; }); o.focus(); }
      else { sel = tabs[n].id; pintarTabs(); pintarPan(); d.getElementById('rcT-' + sel).focus(); }
    });
    bMin.addEventListener('click', alternarMin);
    pan.addEventListener('click', function (e) {
      var gc = e.target.closest('.rc-gc');
      if (gc) { var g = gc.parentNode, ab = !g.classList.contains('rc-ab'); cerrarPaneles(); if (ab) { g.classList.add('rc-ab'); gc.setAttribute('aria-expanded', 'true'); var r = g.querySelector('.rc-gb').getBoundingClientRect(); if (r.right > window.innerWidth - 4) g.classList.add('rc-der'); } return; }
      var ac = e.target.closest('[data-ac]'); if (ac) { accion(ac.dataset.ac); cerrarPaneles(); return; }
      if (e.target.closest('a[href]')) setTimeout(function () { cinta.classList.remove('rc-ab'); cerrarPaneles(); }, 0);
    });
    d.addEventListener('pointerdown', function (e) { if (!cinta.contains(e.target)) cerrarTodo(); else if (!e.target.closest('.rc-bus')) cerrarRes(); }, true);
    d.addEventListener('keydown', function (e) {
      if (e.key === 'F1' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!movil.matches) alternarMin(); return; }
      if (e.key === 'Escape' && (cinta.classList.contains('rc-ab') || pan.querySelector('.rc-g.rc-ab'))) { cinta.classList.remove('rc-ab'); cerrarPaneles(); }
    });

    // ── Buscar una tarea ──
    var IDX = [];
    tabs.forEach(function (tb) { tb.ps.forEach(function (p) { p.its.forEach(function (it) {
      IDX.push({ t: it.t, c: it.cod, href: it.href, dev: it.dev, ruta: tb.t + ' › ' + p.t, ic: ICOD[it.cod], k: norm(it.cod + ' ' + it.t + ' ' + (CORTO[it.cod] || '') + ' ' + p.t + ' ' + tb.t) });
    }); }); });
    var ACC = [['exp', 'Mostrar u ocultar el explorador', 'explorador'], ['tema', 'Cambiar el tema claro u oscuro', 'tema'], ['tam', 'Cambiar el tamaño del texto', 'texto'], ['min', 'Minimizar o mostrar la cinta', 'arriba']]
      .map(function (a) { return { t: a[1], ac: a[0], ic: a[2], ruta: 'Inicio › Vista', k: norm(a[1] + ' vista') }; });
    var activo = -1;
    function fila1(x, i) {
      var cuerpo = svg(x.ic) + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.ruta) + '</small></span>' + (x.dev ? '<em>En desarrollo</em>' : '');
      if (x.dev) return '<span class="rc-r rc-dev" role="option" aria-disabled="true" id="rcR' + i + '">' + cuerpo + '</span>';
      if (x.ac) return '<button type="button" class="rc-r" role="option" id="rcR' + i + '" data-ac="' + x.ac + '">' + cuerpo + '</button>';
      return '<a class="rc-r" role="option" id="rcR' + i + '" href="' + esc(x.href) + '">' + cuerpo + '</a>';
    }
    function opciones() { return [].slice.call(res.querySelectorAll('.rc-r:not(.rc-dev)')); }
    function marcar(n) { var o = opciones(); if (!o.length) { activo = -1; bq.removeAttribute('aria-activedescendant'); return; } activo = (n + o.length) % o.length; o.forEach(function (x, i) { x.classList.toggle('rc-act', i === activo); x.setAttribute('aria-selected', i === activo ? 'true' : 'false'); }); bq.setAttribute('aria-activedescendant', o[activo].id); o[activo].scrollIntoView({ block: 'nearest' }); }
    function cerrarRes() { res.hidden = true; bq.setAttribute('aria-expanded', 'false'); bq.removeAttribute('aria-activedescendant'); activo = -1; }
    function buscar() {
      var q = norm(bq.value.trim()), L = [], h = '';
      if (!q) {
        L = api.recientes().map(function (r) { return { t: (r.c ? r.c + ' · ' : '') + r.t, href: B + r.href, ruta: 'Abierto hace poco', ic: 'reloj' }; });
        if (!L.length) { cerrarRes(); return; }
        h = '<div class="rc-rh">Recientes</div>';
      } else {
        var pal = q.split(/\s+/), cabe = function (k) { return pal.every(function (w) { return k.indexOf(w) >= 0; }); };
        IDX.concat(ACC).forEach(function (x) { if (cabe(x.k)) L.push(x); });
        IDX.forEach(function (x) { // entregables ya creados que cuelgan de cada módulo: lazos, ductos, hojas…
          if (!x.href || x.dev || L.length > 40) return; var H = []; try { H = api.hijos(x.c) || []; } catch (e) {}
          H.forEach(function (c) { if (c && c.href && cabe(norm((c.t || '') + ' ' + (c.s || '')))) L.push({ t: (c.t || '') + (c.s ? ' · ' + c.s : ''), href: c.href, ruta: x.ruta.split(' › ')[0] + ' › ' + (CORTO[x.c] || x.t), ic: x.ic }); });
        });
        try { if (window.RECruces) window.RECruces.buscar(bq.value.trim(), 6).forEach(function (x) { var r = window.RECruces.porTag(x.tag); L.unshift({ t: x.tag + (x.desc ? ' · ' + x.desc : ''), href: B + 'trazabilidad/?tag=' + encodeURIComponent(x.tag), ruta: 'Tag del proyecto › ' + (r ? r.ok + ' listos · ' + r.falta + ' por completar' : 'cruces'), ic: 'cruce', tagHit: 1 }); }); } catch (e) {}
        var pos = function (x) { if (x.tagHit) return -1; var i = norm(x.t).indexOf(q); return i < 0 ? 99 : i; };
        L = L.map(function (x, i) { return [x, pos(x) + (x.dev ? 200 : 0), i]; }).sort(function (a, b) { return a[1] - b[1] || a[2] - b[2]; }).map(function (a) { return a[0]; }).slice(0, 14);
        if (!L.length) h = '<div class="rc-rh">Nada coincide con «' + esc(bq.value.trim()) + '».</div>';
      }
      res.innerHTML = h + L.map(fila1).join(''); res.hidden = false; bq.setAttribute('aria-expanded', 'true'); activo = -1; if (q) marcar(0);
    }
    bq.addEventListener('input', buscar); bq.addEventListener('focus', buscar);
    bq.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (res.hidden) buscar(); marcar(activo + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(activo - 1); }
      else if (e.key === 'Enter') { var o = opciones(), x = o[activo < 0 ? 0 : activo]; if (x && !res.hidden) { e.preventDefault(); x.click(); } }
      else if (e.key === 'Escape') { if (bq.value) { bq.value = ''; cerrarRes(); } else { cerrarRes(); bq.blur(); } e.stopPropagation(); }
    });
    res.addEventListener('click', function (e) { var ac = e.target.closest('[data-ac]'); if (ac) accion(ac.dataset.ac); if (e.target.closest('.rc-r:not(.rc-dev)')) { bq.value = ''; cerrarRes(); } });
    cinta.querySelector('.rc-bus').addEventListener('focusout', function () { setTimeout(function () { if (!cinta.querySelector('.rc-bus').contains(d.activeElement)) cerrarRes(); }, 120); });

    // ── Arranque ──
    d.body.classList.add('rs-cinta-on'); raiz.classList.remove('rs-pre');
    aplicarMin();
    var tR = 0; window.addEventListener('resize', function () { cancelAnimationFrame(tR); tR = requestAnimationFrame(function () { if (cinta.classList.contains('rc-mov') !== movil.matches) aplicarMin(); else { ajustar(); medir(); } }); });
    if (window.ResizeObserver) new ResizeObserver(function () { medir(); }).observe(cinta);
    return {
      // Tras navegar dentro de la página: se vuelve a marcar la tarea actual sin redibujar (no se pierde el foco); los recientes sí se redibujan si cambiaron
      actualizar: function () {
        var ocupada = pan.contains(d.activeElement) || cinta.classList.contains('rc-ab') || !!pan.querySelector('.rc-g.rc-ab');
        var t = tabs.filter(tieneActual)[0];   // si se cambió de tarea por otro camino (explorador, enlaces), la cinta muestra la pestaña de esa tarea
        if (t && t.id !== deAqui) { deAqui = t.id; if (!ocupada && sel !== t.id) { sel = t.id; pintarTabs(); pintarPan(); return; } }
        pintarTabs();
        if (firma() !== firmaRec && !pan.contains(d.activeElement) && !cinta.classList.contains('rc-ab') && !pan.querySelector('.rc-g.rc-ab')) { pintarPan(); return; }
        [].forEach.call(pan.querySelectorAll('a.rc-b'), function (a) { if (api.esActual(a.href)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      },
      buscar: function () { bq.focus(); bq.select(); },
      ir: function (id) { sel = tabDe(id).id; pintarTabs(); pintarPan(); }
    };
  }
  window.RS_CINTA = { montar: montar };
})();
