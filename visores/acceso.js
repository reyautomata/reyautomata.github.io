/* Acceso a ReyEngi (sitio principal y Suite): se ingresa solo con clave de acceso.
 * La clave no está en este archivo: solo su derivación PBKDF2-SHA256 con sal. Una vez desbloqueado,
 * el navegador queda habilitado por 180 días. Para cerrar la sesión en un equipo: agrega ?salir a la dirección.
 * Nota: es un control en el navegador de un sitio público; no reemplaza un acceso con servidor.
 */
(function () {
  'use strict';
  var VIGENCIA = 180 * 24 * 3600 * 1000;    // ms que dura el desbloqueo
  var SAL = 'zDkQVSSi//tclCl/6ym1og==', HASH = '+Z1y3LcZ1C/ZAIKAqJtIOgRn3nb8EcervjcbdwaovYM=', ITER = 210000;
  var K = 'reyengi-acceso';

  function leer() { var d = null; try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} return d || {}; }
  function guardar(d) { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} }
  var d = leer();
  if (/[?&]salir\b/.test(location.search)) { d.ok = 0; guardar(d); }
  function habilitado() { return d.ok && Date.now() - d.ok < VIGENCIA; }
  if (habilitado()) return;

  // Oculta el contenido desde el primer instante, antes de que la página se dibuje
  var oculto = document.createElement('style'); oculto.id = 'rg-oculto';
  oculto.textContent = 'body>*:not(#rg-acceso){visibility:hidden!important}';
  document.head.appendChild(oculto);

  function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function desde64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function verificar(clave) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(false);
    var enc = new TextEncoder().encode(String(clave).trim().toUpperCase());
    return crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: desde64(SAL), iterations: ITER, hash: 'SHA-256' }, k, 256); })
      .then(function (bits) { return b64(bits) === HASH; })
      .catch(function () { return false; });
  }

  var CSS = '#rg-acceso{position:fixed;inset:0;z-index:2147483646;overflow-y:auto;background:#0A1626;color:#E6EDF5;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}' +
    '#rg-acceso .caja{position:relative;width:min(400px,100%);background:#0F2036;color:#E6EDF5;border:1px solid #1E3350;border-top:3px solid #EF5A05;border-radius:10px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    '#rg-acceso .caja .marca{font:700 15px "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.6px;color:#A9B6C6;margin:0 0 10px}#rg-acceso .caja .marca span{color:#EF5A05}' +
    '#rg-acceso .caja h2{color:#fff;text-transform:none;letter-spacing:.2px;line-height:1.1;margin:0 0 6px;font:700 22px "Barlow Condensed","Arial Narrow",sans-serif}#rg-acceso .caja p{margin:0 0 14px;color:#A9B6C6;font-size:13px;line-height:1.5}' +
    '#rg-acceso .caja label{display:block;font-size:12px;font-weight:600;color:#E6EDF5;margin:0 0 6px}' +
    '#rg-acceso .caja input{width:100%;box-sizing:border-box;min-height:40px;font:600 15px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:1px;text-transform:uppercase;color:#E6EDF5;background:#07111F;border:1px solid #1E3350;border-radius:6px;padding:8px 12px}' +
    '#rg-acceso .caja input:focus{outline:2px solid #EF5A05;outline-offset:1px}#rg-acceso .caja button{margin-top:10px;width:100%;min-height:40px;border:0;border-radius:6px;background:#EF5A05;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}' +
    '#rg-acceso .caja button:disabled{opacity:.6;cursor:wait}#rg-acceso .caja .err{color:#FF8A80;font-size:12.5px;min-height:18px;margin:8px 0 0}#rg-acceso .caja .pie{margin:6px 0 0;font-size:11.5px}' +
    '#rg-acceso .caja .sol{margin-top:12px;border-top:1px solid #1E3350;padding-top:12px}#rg-acceso .caja .sol>button.abrir{margin:0;background:transparent;border:1px solid #25D366;color:#E6EDF5;display:flex;align-items:center;justify-content:center;gap:8px}' +
    '#rg-acceso .caja .sol>button.abrir:hover{background:rgba(37,211,102,.12)}#rg-acceso .caja .sol svg{width:18px;height:18px;flex-shrink:0}#rg-acceso .caja .solf{margin-top:10px;display:grid;gap:8px}' +
    '#rg-acceso .caja .solf input,#rg-acceso .caja .solf textarea{text-transform:none;letter-spacing:0;font:13px "IBM Plex Sans",system-ui,sans-serif;min-height:36px}#rg-acceso .caja .solf textarea{width:100%;box-sizing:border-box;color:#E6EDF5;background:#07111F;border:1px solid #1E3350;border-radius:6px;padding:8px 12px;min-height:60px;resize:vertical}' +
    '#rg-acceso .caja .solf textarea:focus{outline:2px solid #EF5A05;outline-offset:1px}#rg-acceso .caja .solf label{margin:0 0 -4px}#rg-acceso .caja .wsp{margin:0;background:#25D366;color:#06210F;display:flex;align-items:center;justify-content:center;gap:8px}#rg-acceso .caja .solf .pie{margin:0}';

  CSS += '#rg-acceso .car .car-v{position:relative;aspect-ratio:16/10;background:#0C1724;overflow:hidden}#rg-acceso .car .car-v img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;transition:opacity .6s ease}#rg-acceso .car .car-v img.on{opacity:1}#rg-acceso .car .car-v img.fit{object-fit:contain;object-position:center;background:#fff}' +
    '#rg-acceso .car-b{position:absolute;top:50%;transform:translateY(-50%);z-index:1;width:36px;height:36px;border-radius:50%;border:0;background:rgba(2,18,38,.72);color:#fff;font:400 24px/1 system-ui;cursor:pointer;opacity:0;transition:opacity .2s}#rg-acceso .car-prev{left:10px}#rg-acceso .car-next{right:10px}' +
    '#rg-acceso .car:hover .car-b,#rg-acceso .car-b:focus-visible{opacity:1}#rg-acceso .car-b:focus-visible{outline:2px solid #fff}@media (hover:none){#rg-acceso .car-b{opacity:.85}}' +
    '#rg-acceso .car figcaption{display:flex;gap:10px;justify-content:space-between;align-items:baseline;min-height:34px;box-sizing:border-box}#rg-acceso .car-n{font:500 11px "IBM Plex Mono",monospace;color:#7F92A8;white-space:nowrap}' +
    '#rg-acceso .car-d{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;padding:0 12px 10px}#rg-acceso .car-d button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#2A4466;cursor:pointer}#rg-acceso .car-d button[aria-current="true"]{background:#EF5A05;width:20px;border-radius:4px}#rg-acceso .car-d button:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){#rg-acceso .car .car-v img{transition:none}}';
  CSS += '#rg-acceso [hidden]{display:none!important}';
  CSS += '#rg-acceso .rg-modal{position:fixed;inset:0;z-index:3;display:grid;place-items:center;padding:16px;overflow-y:auto;background:rgba(2,12,26,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '#rg-acceso .cerrar{position:absolute;top:8px;right:8px;width:32px!important;min-height:32px!important;margin:0!important;padding:0;background:transparent!important;color:#A9B6C6!important;font:400 22px/1 system-ui!important;border-radius:6px}#rg-acceso .cerrar:hover{color:#fff!important;background:#13263F!important}' +
    '#rg-acceso .lp{max-width:1180px;margin:0 auto;padding:0 20px 90px}' +
    '#rg-acceso .lp-top{position:sticky;top:0;z-index:2;background:linear-gradient(180deg,#034488,#022A55);border-bottom:3px solid #EF5A05}#rg-acceso .lp-top>div{max-width:1180px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}' +
    '#rg-acceso .wm{font:700 24px/1 "Barlow Condensed","Arial Narrow",sans-serif;color:#fff;letter-spacing:.4px;display:flex;align-items:baseline;gap:10px}#rg-acceso .wm>span{color:#EF5A05;margin-left:-10px}#rg-acceso .wm small{font:500 11.5px "IBM Plex Mono",monospace;color:#A9B6C6;letter-spacing:.6px}#rg-acceso .lp-top .sp{flex:1}' +
    '#rg-acceso .b{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 13px "IBM Plex Sans",system-ui,sans-serif;border-radius:6px;padding:8px 14px;min-height:36px;cursor:pointer;border:1px solid transparent;text-decoration:none;white-space:nowrap}' +
    '#rg-acceso .b svg{width:17px;height:17px}#rg-acceso .b-pri{background:#EF5A05;color:#fff}#rg-acceso .b-pri:hover{filter:brightness(1.08)}#rg-acceso .b-sec{background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}#rg-acceso .b-sec:hover{border-color:#EF5A05}' +
    '#rg-acceso .b-wsp{background:#25D366;color:#06210F}#rg-acceso .b:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '#rg-acceso .hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:36px;align-items:center;padding:46px 0 30px}' +
    '#rg-acceso .kick{font:600 12px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:1.4px;text-transform:uppercase;color:#FF8A45;margin:0 0 10px}' +
    '#rg-acceso .hero h1{margin:0 0 14px;font:700 clamp(30px,4.4vw,46px)/1.02 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.2px;color:#fff;text-transform:none}#rg-acceso .hero h1 span{color:#EF5A05}' +
    '#rg-acceso .hero p.lead{margin:0 0 20px;font-size:15.5px;line-height:1.6;color:#C3CFDC;max-width:52ch}#rg-acceso .ctas{display:flex;gap:10px;flex-wrap:wrap}' +
    '#rg-acceso .shot{margin:0;border:1px solid #1E3350;border-radius:10px;overflow:hidden;background:#0F2036;box-shadow:0 24px 60px rgba(0,0,0,.45)}#rg-acceso .shot img{display:block;width:100%;height:auto}' +
    '#rg-acceso .shot figcaption{font-size:12px;color:#9FB0C3;padding:8px 12px;border-top:1px solid #1E3350}' +
    '#rg-acceso .cifras{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #1E3350;border-radius:10px;background:#0F2036;margin:8px 0 46px}' +
    '#rg-acceso .cifras div{padding:16px 18px}#rg-acceso .cifras div+div{border-left:1px solid #1E3350}#rg-acceso .cifras b{display:block;font:700 28px/1 "Barlow Condensed","Arial Narrow",sans-serif;color:#fff}#rg-acceso .cifras span{font-size:12.5px;color:#9FB0C3}' +
    '#rg-acceso .sec{margin:0 0 50px}#rg-acceso .sec>h2{margin:0 0 6px;font:700 26px/1.1 "Barlow Condensed","Arial Narrow",sans-serif;color:#fff;text-transform:none;letter-spacing:.2px}#rg-acceso .sec>p.sub{margin:0 0 18px;color:#9FB0C3;font-size:14px;max-width:70ch}' +
    '#rg-acceso .ents{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
    '#rg-acceso .ents li{background:#0F2036;border:1px solid #1E3350;border-radius:8px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:5px}' +
    '#rg-acceso .ents b{font:600 11px "IBM Plex Mono",monospace;color:#FF8A45}#rg-acceso .ents h3{margin:0;font:600 15px "IBM Plex Sans",system-ui,sans-serif;color:#fff}#rg-acceso .ents p{margin:0;font-size:13px;line-height:1.5;color:#9FB0C3;flex:1}' +
    '#rg-acceso .fm{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}#rg-acceso .fm span{font:600 10.5px "IBM Plex Mono",monospace;background:#142A45;border:1px solid #1E3350;border-radius:4px;padding:1px 6px;color:#E6EDF5}' +
    '#rg-acceso .gal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#rg-acceso .gal .shot{box-shadow:none}#rg-acceso .gal img{aspect-ratio:16/10;object-fit:cover;object-position:top;background:#fff}' +
    '#rg-acceso .pasos{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;counter-reset:p}' +
    '#rg-acceso .pasos li{counter-increment:p;background:#0F2036;border:1px solid #1E3350;border-top:3px solid #EF5A05;border-radius:8px;padding:14px}' +
    '#rg-acceso .pasos li::before{content:"0" counter(p);font:700 22px "Barlow Condensed",sans-serif;color:#EF5A05;display:block;margin-bottom:4px}#rg-acceso .pasos h3{margin:0 0 4px;font:600 15px "IBM Plex Sans",system-ui,sans-serif;color:#fff}#rg-acceso .pasos p{margin:0;font-size:13px;line-height:1.5;color:#9FB0C3}' +
    '#rg-acceso .final{background:linear-gradient(135deg,#034488,#022A55);border:1px solid #0A3B70;border-radius:12px;padding:30px;display:flex;align-items:center;gap:24px;flex-wrap:wrap}' +
    '#rg-acceso .final h2{margin:0 0 6px;font:700 28px/1.1 "Barlow Condensed",sans-serif;color:#fff;text-transform:none}#rg-acceso .final p{margin:0;color:#C3CFDC;font-size:14px;max-width:60ch}#rg-acceso .final>div:first-child{flex:1 1 320px}' +
    '#rg-acceso .lp-pie{border-top:1px solid #1E3350;margin-top:40px;padding-top:16px;font-size:12px;color:#7F92A8}' +
    '#rg-acceso .flota{position:fixed;right:18px;bottom:18px;z-index:2;box-shadow:0 10px 30px rgba(0,0,0,.45);border-radius:999px;padding:11px 18px;min-height:44px}' +
    '@media (max-width:900px){#rg-acceso .hero{grid-template-columns:1fr;padding-top:28px;gap:24px}#rg-acceso .ents,#rg-acceso .gal,#rg-acceso .pasos{grid-template-columns:1fr 1fr}#rg-acceso .cifras{grid-template-columns:1fr 1fr}#rg-acceso .cifras div:nth-child(3){border-left:0}#rg-acceso .cifras div:nth-child(n+3){border-top:1px solid #1E3350}}' +
    '@media (max-width:600px){#rg-acceso .lp{padding:0 16px 90px}#rg-acceso .lp-top>div{padding:8px 16px}#rg-acceso .lp-top .b-sec{display:none}#rg-acceso .ents,#rg-acceso .gal,#rg-acceso .pasos{grid-template-columns:1fr}#rg-acceso .final{padding:22px}#rg-acceso .flota span{display:none}#rg-acceso .flota{padding:0;width:52px;height:52px}}' +
    '@media (prefers-reduced-motion:no-preference){#rg-acceso .rg-modal .caja{animation:rgEntra .18s ease-out}@keyframes rgEntra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}';
  var SUITE_IMG = ['visor-3d','plano-a3','diagrama-lazo','unilineal','chancado','v-nivel','v-densimetro','v-onoff','v-tablero','v-fuerza','v-fibra','v-estanque','v-maleta','plano-cctv','plano-parshall','plano-plc','listado','hojas-datos','especificaciones']; // imágenes publicadas en /img/suite
  var WSP = '56931959479'; // número que recibe las solicitudes de acceso
  var ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>';

  function mostrar() {
    if (document.getElementById('rg-acceso')) return;
    // La presentación vive en un Shadow DOM: los estilos de cada página del sitio no la alteran
    var host = document.createElement('div'); host.id = 'rg-acceso'; host.setAttribute('style', 'position:fixed;inset:0;z-index:2147483646');
    var raiz = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var s = document.createElement('style'); s.textContent = ':host{all:initial}' + CSS; raiz.appendChild(s);
    if (!document.querySelector('link[href*="IBM+Plex+Sans"]')) { var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;1,800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'; document.head.appendChild(fl); }
    Array.prototype.forEach.call(document.body.children, function (n) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); });
    document.documentElement.style.overflow = 'hidden';
    var o = document.createElement('div'); o.id = 'rg-acceso'; o.lang = 'es';
    var ENT = [['01', 'Listado de instrumentos', 'Tag, servicio, P&amp;ID, rango y señal de cada instrumento, enlazado al resto de los documentos.', ['Excel', 'Word']],
      ['02', 'Hojas de datos', 'Formularios ISA-TR20 por tipo de instrumento, con tabla de aplicación por tag.', ['PDF', 'Excel']],
      ['03', 'Especificaciones técnicas', 'Instrumentación, control, comunicaciones y cables, listas para el proyecto.', ['Word']],
      ['04', 'Listado de entradas y salidas', 'Señales por tarjeta y canal del PLC, rangos y alarmas.', ['Excel', 'Word']],
      ['05', 'Diagramas de lazo', 'ISA-5.4 desde terreno hasta la sala de control, en lámina A3 con rótulo.', ['PDF', 'DXF']],
      ['06', 'Listado de circuitos', 'Cables de señal, troncales y alimentación con origen, destino y largo.', ['Excel', 'Word']],
      ['07', 'Unilineales TDI', 'Tableros de instrumentos con protecciones, conductores y caída de tensión calculados según el RIC.', ['PDF', 'DXF', 'Excel']],
      ['08', 'Detalles típicos de montaje', 'Visores 3D por instrumento con lista de materiales, notas y plano A3.', ['PDF', 'DXF', 'PNG', 'STL']],
      ['09', 'Emulaciones y procesos', 'Plantas y procesos en 3D con PLC, variadores e instrumentos para practicar y capacitar.', ['3D', 'Simulación']]];
    var CAR = [['visor-3d', 'Visor 3D de montaje: válvula de control con actuador de diafragma y simulación de la señal'],
      ['plano-a3', 'Plano de montaje A3 generado desde el modelo, con lista de materiales y rótulo'],
      ['diagrama-lazo', 'Diagrama de lazo ISA-5.4 generado automáticamente desde el listado de E/S'],
      ['unilineal', 'Unilineal TDI con protecciones y conductores calculados según el RIC'],
      ['chancado', 'Chancado primario en 3D: proceso minero con toda su instrumentación'],
      ['v-nivel', 'Transmisores de nivel: tipos de montaje con despiece y etiquetas'],
      ['v-densimetro', 'Densímetro nuclear: montaje en cañería con soporte y blindaje'],
      ['v-onoff', 'Válvulas ON/OFF con actuador, solenoide e interruptores de posición'],
      ['v-tablero', 'Gabinete de control en 3D: componentes, cableado y energía'],
      ['v-fuerza', 'Tablero de fuerza 380 Vac con interruptores y diferenciales'],
      ['v-fibra', 'Paneles murales de fibra óptica: empalmes, adaptadores y pruebas'],
      ['v-estanque', 'Simulador de estanque e impulsión con PLC y variador'],
      ['v-maleta', 'Maleta de demostración PLC S7-1200 con HMI'],
      ['plano-cctv', 'Plano A3: cámara PTZ de CCTV en poste con lista de materiales'],
      ['plano-parshall', 'Plano A3: canaleta Parshall con sensor ultrasónico'],
      ['plano-plc', 'Plano A3: gabinete PLC con vistas y lista de materiales'],
      ['listado', 'Listado de instrumentos enlazado con E/S, lazos y circuitos'],
      ['hojas-datos', 'Hojas de datos ISA-TR20 por tipo de instrumento'],
      ['especificaciones', 'Especificaciones técnicas listas para el proyecto']].filter(function (c) { return SUITE_IMG.indexOf(c[0]) >= 0; });
    var GAL = [['diagrama-lazo', 'Diagrama de lazo ISA-5.4 generado desde el listado de E/S'], ['unilineal', 'Unilineal TDI con cálculo según RIC'], ['plano-a3', 'Plano de montaje A3 con lista de materiales'],
      ['chancado', 'Chancado primario: proceso minero con su instrumentación'], ['listado', 'Listado de instrumentos enlazado'], ['hojas-datos', 'Hojas de datos ISA-TR20']];
    o.innerHTML = '<div class="lp-top"><div><span class="wm">Rey<span>Engi</span><small>Ingeniería I&amp;C</small></span><span class="sp"></span>' +
      '<button type="button" class="b b-sec" data-abrir="clave">Ingresar con clave</button><button type="button" class="b b-pri" data-abrir="solicitar">Solicitar acceso</button></div></div>' +
      '<main class="lp"><section class="hero"><div><p class="kick">Suite ReyEngi · Ingeniería I&amp;C</p><h1>Toda la ingeniería de instrumentación y control, <span>en un solo lugar.</span></h1>' +
      '<p class="lead">Listados, hojas de datos, diagramas de lazo, unilineales y detalles de montaje que salen de una sola base de datos del proyecto. Cambias un tag y se actualiza en todos los documentos. Descargas en PDF, DXF, Excel y Word con formato de entregable.</p>' +
      '<div class="ctas"><button type="button" class="b b-wsp" data-abrir="solicitar">' + ICO + 'Solicitar acceso por WhatsApp</button><button type="button" class="b b-sec" data-abrir="clave">Ya tengo clave</button></div></div>' +
      '<figure class="shot car" role="region" aria-roledescription="carrusel" aria-label="Ejemplos de la Suite"><div class="car-v">' +
      CAR.map(function (c, i) { return '<img ' + (i ? 'data-src' : 'src') + '="/img/suite/' + c[0] + '.webp" alt="' + c[1] + '" width="1280" height="800"' + (i ? ' aria-hidden="true"' : '') + ' class="' + (i ? '' : 'on ') + (/^plano/.test(c[0]) ? 'fit' : '') + '">'; }).join('') +
      '<button type="button" class="car-b car-prev" aria-label="Ejemplo anterior">‹</button><button type="button" class="car-b car-next" aria-label="Ejemplo siguiente">›</button></div>' +
      '<figcaption><span class="car-t" aria-live="polite">' + CAR[0][1] + '</span><span class="car-n">1 / ' + CAR.length + '</span></figcaption><div class="car-d" role="group" aria-label="Elegir ejemplo">' +
      CAR.map(function (c, i) { return '<button type="button" aria-label="' + (i + 1) + ': ' + c[1] + '"' + (i ? '' : ' aria-current="true"') + '></button>'; }).join('') + '</div></figure></section>' +
      '<div class="cifras"><div><b>9</b><span>entregables enlazados</span></div><div><b>40+</b><span>visores 3D de montaje y procesos</span></div><div><b>PDF · DXF</b><span>Excel y Word con rótulo</span></div><div><b>ISA · RIC</b><span>ISA-5.1, 5.4, TR20 y RIC (SEC)</span></div></div>' +
      '<section class="sec"><h2>Qué puedes hacer</h2><p class="sub">Los entregables de un proyecto de I&amp;C, en el orden en que se desarrollan, conectados entre sí.</p><ul class="ents">' +
      ENT.map(function (e) { return '<li><b>' + e[0] + '</b><h3>' + e[1] + '</h3><p>' + e[2] + '</p><div class="fm">' + e[3].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div></li>'; }).join('') + '</ul></section>' +
      '<section class="sec"><h2>Cómo funciona</h2><p class="sub">Menos horas en tareas repetitivas y documentos que no se contradicen.</p><ol class="pasos">' +
      '<li><h3>Cargas el proyecto</h3><p>Datos del cliente, rótulos y el listado de señales o instrumentos. Se puede importar desde Excel.</p></li>' +
      '<li><h3>Todo queda enlazado</h3><p>Instrumentos, E/S, lazos, circuitos y tableros comparten los mismos datos: un cambio se refleja en todos.</p></li>' +
      '<li><h3>Descargas los entregables</h3><p>Planos A3 en PDF y DXF para AutoCAD, y listados en Excel y Word con formato de entrega.</p></li></ol></section>' +
      '<section class="sec"><h2>Así se ve</h2><p class="sub">Capturas de la Suite en uso.</p><div class="gal">' +
      GAL.map(function (g) { return '<figure class="shot"><img src="/img/suite/' + g[0] + '.webp" alt="' + g[1] + '" loading="lazy" width="960" height="600"><figcaption>' + g[1] + '</figcaption></figure>'; }).join('') + '</div></section>' +
      '<section class="final"><div><h2>¿Quieres verla funcionando?</h2><p>Escríbeme y te envío una clave de acceso para revisar la Suite con tu equipo, o coordinamos una demostración con un proyecto real.</p></div>' +
      '<button type="button" class="b b-wsp" data-abrir="solicitar">' + ICO + 'Solicitar acceso por WhatsApp</button></section>' +
      '<p class="lp-pie">ReyEngi · Automatización y control industrial · Chile</p></main>' +
      '<button type="button" class="b b-wsp flota" data-abrir="solicitar" aria-label="Solicitar acceso por WhatsApp">' + ICO + '<span>Solicitar acceso</span></button>' +
      '<div class="rg-modal" hidden role="dialog" aria-modal="true" aria-labelledby="rg-tit"><div class="caja"><button type="button" class="cerrar" aria-label="Cerrar">×</button><form autocomplete="off"><p class="marca">Rey<span>Engi</span> · Ingeniería I&amp;C</p><h2 id="rg-tit">Acceso a la Suite</h2>' +
      '<p>Ingresa tu clave de acceso para continuar.</p>' +
      '<label for="rg-clave">Clave de acceso</label><input id="rg-clave" type="password" placeholder="REY-XXXX-XXXX-XXXX" spellcheck="false"><button type="submit">Ingresar</button><p class="err" id="rg-err" role="alert"></p>' +
      '</form><div class="sol"><button type="button" class="abrir" aria-expanded="false" aria-controls="rg-solf">' + ICO + '¿No tienes clave? Solicitar acceso</button>' +
      '<form class="solf" id="rg-solf" hidden autocomplete="on"><label for="rg-nom">Nombre</label><input id="rg-nom" required autocomplete="name">' +
      '<label for="rg-emp">Empresa o cargo</label><input id="rg-emp" autocomplete="organization">' +
      '<label for="rg-mot">Motivo (opcional)</label><textarea id="rg-mot" placeholder="Ej.: revisar los detalles de montaje para un proyecto"></textarea>' +
      '<button type="submit" class="wsp">' + ICO + 'Enviar solicitud por WhatsApp</button><p class="pie">Se abrirá WhatsApp con tu solicitud lista; solo toca «Enviar». Te responderán con la clave.</p></form></div></div></div>';
    raiz.appendChild(o); document.body.appendChild(host);
    var sol = o.querySelector('.sol'), sf = o.querySelector('#rg-solf'), ab = sol.querySelector('.abrir');
    ab.addEventListener('click', function () { var v = sf.hidden; sf.hidden = !v; ab.setAttribute('aria-expanded', String(v)); if (v) o.querySelector('#rg-nom').focus(); });
    sf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nom = o.querySelector('#rg-nom').value.trim(), emp = o.querySelector('#rg-emp').value.trim(), mot = o.querySelector('#rg-mot').value.trim();
      if (!nom) { o.querySelector('#rg-nom').focus(); return; }
      var txt = 'Hola, solicito clave de acceso a ReyEngi.\nNombre: ' + nom + (emp ? '\nEmpresa / cargo: ' + emp : '') + (mot ? '\nMotivo: ' + mot : '') + '\nPágina: ' + location.href.split('?')[0];
      window.open('https://wa.me/' + WSP + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
    var f = o.querySelector('.caja form'), inp = o.querySelector('#rg-clave'), btn = f.querySelector('button'), err = o.querySelector('#rg-err'), fallos = 0;
    (function carrusel() {
      var car = o.querySelector('.car'); if (!car) return;
      var ims = [].slice.call(car.querySelectorAll('.car-v img')), ds = [].slice.call(car.querySelectorAll('.car-d button')), t = car.querySelector('.car-t'), n = car.querySelector('.car-n'), i = 0, timer = null, pausa = false;
      var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      function cargar(k) { var im = ims[k]; if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }
      function ir(k) {
        k = (k + ims.length) % ims.length; cargar(k); cargar((k + 1) % ims.length);
        ims[i].classList.remove('on'); ims[i].setAttribute('aria-hidden', 'true'); ds[i].removeAttribute('aria-current');
        i = k; ims[i].classList.add('on'); ims[i].removeAttribute('aria-hidden'); ds[i].setAttribute('aria-current', 'true');
        t.textContent = ims[i].alt; n.textContent = (i + 1) + ' / ' + ims.length;
      }
      function auto() { clearInterval(timer); if (!quieto) timer = setInterval(function () { if (!pausa && !document.hidden) ir(i + 1); }, 4500); }
      car.querySelector('.car-prev').addEventListener('click', function () { ir(i - 1); auto(); });
      car.querySelector('.car-next').addEventListener('click', function () { ir(i + 1); auto(); });
      ds.forEach(function (d, k) { d.addEventListener('click', function () { ir(k); auto(); }); });
      car.addEventListener('mouseenter', function () { pausa = true; }); car.addEventListener('mouseleave', function () { pausa = false; });
      car.addEventListener('focusin', function () { pausa = true; }); car.addEventListener('focusout', function () { pausa = false; });
      var x0 = null; car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      car.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { ir(i + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
      cargar(1); auto();
    })();
    var modal = o.querySelector('.rg-modal'), lp = [o.querySelector('.lp-top'), o.querySelector('.lp'), o.querySelector('.flota')], antes = null;
    function abrir(modo) {
      antes = raiz.activeElement || null; modal.hidden = false; lp.forEach(function (n) { n.setAttribute('inert', ''); });
      var sol = modo === 'solicitar'; sf.hidden = !sol; ab.setAttribute('aria-expanded', String(sol));
      setTimeout(function () { (sol ? o.querySelector('#rg-nom') : inp).focus(); }, 30);
    }
    function cerrar() { modal.hidden = true; lp.forEach(function (n) { n.removeAttribute('inert'); }); if (antes && antes.focus) antes.focus(); }
    [].forEach.call(o.querySelectorAll('[data-abrir]'), function (x) { x.addEventListener('click', function () { abrir(x.dataset.abrir); }); });
    o.querySelector('.cerrar').addEventListener('click', cerrar);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) cerrar(); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!inp.value) return;
      btn.disabled = true; err.textContent = '';
      verificar(inp.value).then(function (ok) {
        if (ok) {
          d.ok = Date.now(); guardar(d); host.remove(); oculto.remove(); document.documentElement.style.overflow = '';
          Array.prototype.forEach.call(document.body.children, function (n) { n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
          return;
        }
        fallos++; inp.value = '';
        setTimeout(function () { btn.disabled = false; err.textContent = 'Clave incorrecta.'; inp.focus(); }, Math.min(8000, 600 * fallos * fallos));
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrar); else mostrar();
})();
