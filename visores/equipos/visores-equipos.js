/* Visores 3D de equipos · ReyEngi
 *
 * Visores de montaje para los instrumentos y equipos de las hojas de datos que no tenían visor:
 * temperatura, flujo vortex y térmico, nivel ultrasónico y vibratorio, interruptor de presión,
 * analizadores, válvula solenoide y tablero neumático, protecciones de correa, gabinetes PLC,
 * comunicaciones, CCTV, control de acceso e intercomunicación.
 *
 * Un solo motor (función MOTOR) arma todos los modelos con piezas paramétricas. Cada visor se
 * agrega a window.__VIEWERS con el mismo formato que los visores existentes, de modo que se abre,
 * exporta a OBJ/STL/DXF y enlaza con su hoja de datos y su ET igual que los demás.
 */
(function () {
  'use strict';

  // ── Motor del visor (se ejecuta dentro del iframe de cada visor) ─────────────────
  function MOTOR(EQID, CAT) {
    var L = window.__LIB, THREE = L.THREE;
    var DEF = CAT.filter(function (c) { return c.id === EQID; })[0];
    var stage = document.getElementById('stage');
    var css = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };

    // Renderizadores y escena
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('tabindex', '0');
    renderer.domElement.setAttribute('aria-label', 'Modelo 3D: ' + DEF.titulo + '. Arrastra para girar.');
    stage.prepend(renderer.domElement);
    var labelRenderer = new L.CSS2DRenderer();
    labelRenderer.domElement.className = 'labels';
    stage.appendChild(labelRenderer.domElement);

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new L.RoomEnvironment(), 0.04).texture;
    var camera = new THREE.PerspectiveCamera(35, 1, 0.5, 6000);
    var controls = new L.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotateSpeed = 1.1;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.55));
    var sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(120, 260, 180); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -320, right: 320, top: 320, bottom: -320, near: 1, far: 1200 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
    scene.add(sun);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    // Materiales
    function std(c, m, r, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, o || {})); }
    var mats = {
      steel: std(0xd4dae0, 0.95, 0.28), pipe: std(0xa3acb5, 0.8, 0.4, { side: THREE.DoubleSide }), flange: std(0x9aa4ae, 0.8, 0.42),
      galv: std(0xc3cad0, 0.75, 0.55), dark: std(0x2a3138, 0.6, 0.42), black: std(0x1c2228, 0.3, 0.6), rubber: std(0x22262b, 0.0, 0.9),
      inst: std(0x2c5ea8, 0.3, 0.45), housing: std(0x47586b, 0.35, 0.5), white: std(0xeef1f4, 0.1, 0.5), cream: std(0xe4e1d8, 0.1, 0.6),
      red: std(0xb8322a, 0.2, 0.5), green: std(0x2f8a4b, 0.2, 0.5), yellow: std(0xe8b417, 0.2, 0.5), orange: std(0xef5a05, 0.2, 0.5),
      concrete: std(0xb9b5ad, 0.0, 0.95), wall: std(0xd9d6cf, 0.0, 0.9), cab: std(0xd8dcdf, 0.3, 0.55), ss: std(0xc9d0d6, 0.9, 0.3),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe3f2, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
      tank: new THREE.MeshPhysicalMaterial({ color: 0xb8c2cc, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }),
      liquid: std(0x3f8fd2, 0, 0.3, { transparent: true, opacity: 0.75 }), pulp: std(0x6d6a63, 0.0, 0.8), ore: std(0x7d746a, 0.0, 0.95),
      lcd: std(0x9fd3a8, 0.0, 0.3, { emissive: 0x2b5a33, emissiveIntensity: 0.6 }), led: std(0x46d36b, 0, 0.3, { emissive: 0x2fbf55, emissiveIntensity: 1.2 }),
      flex: std(0x3a3f45, 0.15, 0.6), cableBlue: std(0x2f6fb5, 0.1, 0.6), cableGrey: std(0x6b737b, 0.1, 0.6), fiber: std(0xe8a317, 0.1, 0.6),
      belt: std(0x202326, 0.0, 0.85), wood: std(0x9b7a52, 0, 0.8)
    };

    // ── Piezas básicas (unidades: cm, Y arriba) ──
    function M(geo, mat, x, y, z, scope) {
      var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true; m.receiveShadow = true; m.userData = { scope: scope || (mat === mats.inst || mat === mats.housing ? 'inst' : 'pipe') };
      return m;
    }
    function G() { var g = new THREE.Group(); for (var i = 0; i < arguments.length; i++) g.add(arguments[i]); return g; }
    function box(w, h, d, mat, x, y, z) { return M(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
    function rbox(w, h, d, r, mat, x, y, z) { return M(new L.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z); }
    function cyl(r, h, mat, x, y, z, eje, seg) {
      var g = new THREE.CylinderGeometry(r, r, h, seg || 40);
      if (eje === 'x') g.rotateZ(Math.PI / 2); if (eje === 'z') g.rotateX(Math.PI / 2);
      return M(g, mat, x, y, z);
    }
    function cone(r1, r2, h, mat, x, y, z, eje) { var g = new THREE.CylinderGeometry(r1, r2, h, 40); if (eje === 'x') g.rotateZ(Math.PI / 2); if (eje === 'z') g.rotateX(Math.PI / 2); return M(g, mat, x, y, z); }
    function sph(r, mat, x, y, z) { return M(new THREE.SphereGeometry(r, 32, 20), mat, x, y, z); }
    function tubo(r, h, mat, x, y, z, eje) { // tubo abierto con espesor visual
      var g = new THREE.CylinderGeometry(r, r, h, 48, 1, true); if (eje === 'x') g.rotateZ(Math.PI / 2); if (eje === 'z') g.rotateX(Math.PI / 2);
      var m = M(g, mat, x, y, z); m.material = mat; return m;
    }
    function camino(puntos, r, mat) {
      var curve = new THREE.CatmullRomCurve3(puntos.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), false, 'catmullrom', 0.08);
      return M(new THREE.TubeGeometry(curve, 120, r, 12, false), mat);
    }
    function brida(r, x, y, z, eje) { // brida con pernos
      var g = G(cyl(r * 1.9, 2.2, mats.flange, 0, 0, 0, 'y'));
      for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; g.add(cyl(0.7, 4.2, mats.steel, Math.cos(a) * r * 1.55, 0, Math.sin(a) * r * 1.55, 'y', 8)); }
      if (eje === 'x') g.rotation.z = Math.PI / 2; if (eje === 'z') g.rotation.x = Math.PI / 2;
      g.position.set(x, y, z); return g;
    }
    // Tubería horizontal en X centrada en el origen, con bridas en los extremos
    function linea(largo, r, y, conBridas) {
      var g = G(tubo(r, largo, mats.pipe, 0, y, 0, 'x'));
      if (conBridas !== false) { g.add(brida(r, -largo / 2, y, 0, 'x')); g.add(brida(r, largo / 2, y, 0, 'x')); }
      return g;
    }
    function soporteTubo(x, yTop, r) { // soporte de tubería en H
      return G(box(4, yTop - r, 4, mats.galv, x, (yTop - r) / 2, 0), box(r * 2.6, 2, 6, mats.galv, x, yTop - r - 1, 0), box(20, 1, 20, mats.concrete, x, 0.5, 0));
    }
    function pedestal(h, x, z) { // pedestal de tubo de 2" con placa base y anclajes
      var g = G(box(26, 1.2, 26, mats.galv, 0, 0.6, 0), cyl(3, h, mats.galv, 0, h / 2, 0, 'y'), cyl(3.4, 1.4, mats.galv, 0, h, 0, 'y'), box(40, 8, 40, mats.concrete, 0, -4, 0));
      for (var i = 0; i < 4; i++) g.add(cyl(0.8, 3, mats.steel, (i % 2 ? 1 : -1) * 10, 1.5, (i < 2 ? 1 : -1) * 10, 'y', 8));
      g.position.set(x || 0, 0, z || 0); return g;
    }
    function cabezal(x, y, z, conLcd) { // transmisor tipo cabezal (doble compartimiento)
      var g = G(cyl(5.2, 11, mats.inst, 0, 0, 0, 'z'), cyl(5.6, 1.2, mats.inst, 0, 0, 5.8, 'z'), cyl(5.6, 1.2, mats.inst, 0, 0, -5.8, 'z'), cyl(1.8, 5, mats.inst, 0, -6.5, 0, 'y'));
      if (conLcd !== false) g.add(cyl(3.6, 0.4, mats.lcd, 0, 0, 6.5, 'z'));
      g.add(cyl(1.1, 3, mats.inst, 5.8, 0, 0, 'x'));
      g.position.set(x, y, z); return g;
    }
    function caja(w, h, d, mat, x, y, z, conTapa) { // caja de conexiones / gabinete pequeño
      var g = G(rbox(w, h, d, 1, mat || mats.cab, 0, 0, 0));
      if (conTapa !== false) { g.add(box(w * 0.92, h * 0.92, 0.6, mat || mats.cab, 0, 0, d / 2 + 0.3)); g.add(box(1.2, 4, 1, mats.dark, w * 0.4, 0, d / 2 + 0.9)); }
      g.position.set(x, y, z); return g;
    }
    function gabAbierto(w, h, d, mat) { // gabinete sin tapa frontal para ver el interior
      var t = 1.5;
      return G(box(w, h, t, mat, 0, 0, -d / 2 + t / 2), box(t, h, d, mat, -w / 2 + t / 2, 0, 0), box(t, h, d, mat, w / 2 - t / 2, 0, 0), box(w, t, d, mat, 0, h / 2 - t / 2, 0), box(w, t, d, mat, 0, -h / 2 + t / 2, 0));
    }
    function conduit(puntos) { return camino(puntos, 1.1, mats.flex); }
    function tierra(x, z) { return G(cyl(0.9, 120, mats.flange, x, -60, z, 'y'), cyl(3, 1, mats.flange, x, 0.5, z, 'y')); }
    function muro(w, h, x, z, rotY) { var m = box(w, h, 15, mats.wall, x, h / 2, z); if (rotY) m.rotation.y = rotY; return m; }
    function losa(w, d, x, z) { return box(w, 10, d, mats.concrete, x || 0, -5, z || 0); }
    function flecha(x, y, z, rotY) { // flecha de flujo sobre la tubería
      var g = G(cyl(0.9, 14, mats.orange, 0, 0, 0, 'x'), cone(0, 2.6, 6, mats.orange, 10, 0, 0, 'x'));
      g.children[1].rotation.z = -Math.PI / 2; g.position.set(x, y, z); if (rotY) g.rotation.y = rotY; g.userData.flecha = true; return g;
    }
    function texto(t, w, h, color) { // cartel con texto (placa)
      var c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
      var x = c.getContext('2d'); x.fillStyle = color || '#f2f4f6'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#0b1a2b'; x.font = 'bold ' + Math.round(c.height * 0.42) + 'px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, c.width / 2, c.height / 2);
      var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 }));
    }

    // ── Ensambles de equipos ──
    function valvulaBola(r, x, y, z, eje) {
      var g = G(sph(r * 1.5, mats.steel, 0, 0, 0), cyl(r * 1.2, r * 4.6, mats.steel, 0, 0, 0, 'x'), cyl(0.6, r * 2, mats.steel, 0, r * 1.6, 0, 'y'), box(r * 5, 0.8, 1.4, mats.red, r * 2.2, r * 2.6, 0));
      if (eje === 'y') g.rotation.z = Math.PI / 2; if (eje === 'z') g.rotation.y = Math.PI / 2;
      g.position.set(x, y, z); return g;
    }
    function camaraPTZ() {
      return G(cyl(7, 3, mats.white, 0, 0, 0, 'y'), sph(9, mats.white, 0, -7, 0), M(new THREE.SphereGeometry(8.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.glass, 0, -9.5, 0),
        cyl(2.6, 4, mats.black, 0, -11, 6, 'z'), cyl(2, 0.5, mats.dark, 0, -11, 8.2, 'z'));
    }
    function camaraBullet() {
      return G(rbox(9, 9, 26, 2, mats.white, 0, 0, 0), box(11, 1.2, 28, mats.white, 0, 5.4, 1.5), cyl(3.4, 0.6, mats.black, 0, 0, 13.2, 'z'), cyl(2.2, 0.4, mats.dark, 0, 0, 13.6, 'z'),
        cyl(1.8, 10, mats.white, 0, -6, -8, 'y'), box(9, 1.2, 9, mats.white, 0, -11, -8));
    }
    function rack42(x, z) {
      var cuerpo = gabAbierto(80, 200, 100, mats.dark); cuerpo.position.y = 100; var g = G(cuerpo, box(74, 190, 1, mats.glass, 0, 100, 50.5));
      var eq = [[30, 4.4, mats.black, 'Switch'], [50, 4.4, mats.black, 'Switch'], [70, 4.4, mats.cab, 'ODF'], [90, 8.8, mats.black, 'NVR'], [110, 8.8, mats.black, 'NVR'], [20, 4.4, mats.cab, 'PDU']];
      eq.forEach(function (e) { g.add(box(48, e[1], 60, e[2], 0, e[0], 18)); if (e[3] === 'Switch') for (var i = 0; i < 12; i++) g.add(box(1.4, 1.2, 0.4, mats.led, -18 + i * 3, e[0] + 1, 48.3)); });
      g.position.set(x || 0, 0, z || 0); return g;
    }

    // ── Catálogo de variantes: cada una devuelve { root, partes } ──
    // partes: [n, texto, cantidad, objeto, [dx,dy,dz] separación, [x,y,z] ancla de etiqueta]
    var V = {};

    // Temperatura
    V['temp-cabezal'] = function () {
      var r = 11, y = 90, root = G();
      var tub = linea(220, r, y); tub.add(soporteTubo(-80, y, r)); tub.add(soporteTubo(80, y, r));
      var nozzle = G(cyl(2.8, 16, mats.pipe, 0, y + r + 8, 0, 'y'), brida(2.8, 0, y + r + 16, 0, 'y'));
      var tw = G(cyl(1.2, 30, mats.ss, 0, y + r + 2, 0, 'y'), brida(2.8, 0, y + r + 18.4, 0, 'y'), cyl(1.6, 6, mats.ss, 0, y + r + 22, 0, 'y'));
      var elem = G(cyl(0.45, 44, mats.steel, 0, y + r + 8, 0, 'y'));
      var tx = G(cyl(5, 7, mats.inst, 0, y + r + 30, 0, 'y'), cyl(5.3, 1.6, mats.inst, 0, y + r + 34.5, 0, 'y'), cyl(3.4, 0.4, mats.lcd, 0, y + r + 35.4, 0, 'y'), cyl(1, 3, mats.inst, 5.5, y + r + 30, 0, 'x'));
      var cond = G(conduit([[7, y + r + 30, 0], [24, y + r + 28, 0], [40, y + r + 10, 0], [46, 80, 30], [46, 40, 60]]), caja(16, 20, 10, mats.ss, 46, 40, 72));
      root.add(tub, nozzle, tw, elem, tx, cond, flecha(-60, y + r + 6, 0));
      return { root: root, partes: [
        [1, 'Tubería de proceso con boquilla bridada', 1, tub, [0, 0, 0], [-60, y, r]],
        [2, 'Termopozo bridado (barra perforada)', 1, tw, [0, 30, 0], [0, y + r + 18, 3]],
        [3, 'Elemento RTD Pt100 / termocupla', 1, elem, [0, 60, 0], [0, y + r + 40, 0]],
        [4, 'Transmisor de temperatura en cabezal', 1, tx, [0, 85, 0], [0, y + r + 36, 0]],
        [5, 'Conduit flexible y caja de conexiones', 1, cond, [40, 0, 20], [46, 52, 72]],
        [6, 'Boquilla de la tubería', 1, nozzle, [0, 0, 0], [0, y + r + 10, 3]]
      ] };
    };
    V['temp-remoto'] = function () {
      var r = 11, y = 90, root = G(), out = V['temp-cabezal']();
      var p = out.partes.filter(function (q) { return q[0] !== 4 && q[0] !== 5; });
      var cabeza = G(cyl(4, 6, mats.ss, 0, y + r + 28, 0, 'y'), cyl(4.4, 1.2, mats.ss, 0, y + r + 31.5, 0, 'y'));
      var ped = pedestal(120, 90, 50);
      var tx = cabezal(90, 112, 50);
      var cable = conduit([[4, y + r + 28, 0], [30, y + r + 26, 0], [70, 118, 40], [84, 106, 50]]);
      var g = G(); out.partes.forEach(function (q) { if (q[0] !== 4 && q[0] !== 5) g.add(q[3]); }); root.add(g, cabeza, ped, tx, cable);
      return { root: root, partes: p.concat([
        [4, 'Cabezal de conexiones del elemento', 1, cabeza, [0, 60, 0], [0, y + r + 32, 0]],
        [5, 'Transmisor remoto en pedestal de 2"', 1, tx, [30, 20, 0], [90, 120, 50]],
        [7, 'Pedestal de tubo de 2" con placa base', 1, ped, [30, 0, 0], [90, 60, 50]],
        [8, 'Cable de extensión en conduit flexible', 1, cable, [20, 30, 0], [60, 120, 30]]
      ]) };
    };
    V['temp-switch'] = function () {
      var r = 8, y = 90, root = G();
      var tub = linea(180, r, y); tub.add(soporteTubo(-60, y, r)); tub.add(soporteTubo(60, y, r));
      var tw = G(cyl(1, 18, mats.ss, 0, y + r - 4, 0, 'y'), cyl(1.8, 6, mats.ss, 0, y + r + 6, 0, 'y'), cyl(2.4, 2, mats.ss, 0, y + r + 9, 0, 'y'));
      var sw = G(rbox(14, 16, 9, 1.5, mats.cab, 0, y + r + 20, 0), box(12, 2, 1, mats.yellow, 0, y + r + 25, 4.8), cyl(1.6, 4, mats.ss, 0, y + r + 11, 0, 'y'), cyl(1, 3, mats.cab, 7.5, y + r + 20, 0, 'x'));
      var cond = conduit([[9, y + r + 20, 0], [24, y + r + 18, 0], [30, 60, 20], [30, 20, 40]]);
      root.add(tub, tw, sw, cond, flecha(-45, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tubería de proceso', 1, tub, [0, 0, 0], [-50, y, r]], [2, 'Termopozo roscado', 1, tw, [0, 25, 0], [0, y + r + 8, 3]],
        [3, 'Interruptor de temperatura (TSH)', 1, sw, [0, 50, 0], [0, y + r + 28, 0]], [4, 'Conduit flexible', 1, cond, [25, 0, 0], [30, 60, 20]]] };
    };

    // Flujo vortex y térmico
    V['vortex'] = function () {
      var r = 8, y = 80, root = G();
      var aguas = G(linea(150, r, y), soporteTubo(-40, y, r)); aguas.position.x = -95;
      var abajo = G(linea(90, r, y), soporteTubo(20, y, r)); abajo.position.x = 65;
      var cuerpo = G(cyl(r * 1.6, 12, mats.ss, 0, y, 0, 'x'), cyl(2.2, 16, mats.ss, 0, y + r + 6, 0, 'y'));
      var tx = cabezal(0, y + r + 20, 0);
      var tramos = G(box(150, 0.4, 1, mats.yellow, -95, y - r - 6, 12), box(90, 0.4, 1, mats.yellow, 65, y - r - 6, 12));
      var cond = conduit([[6, y + r + 20, 0], [20, y + r + 18, 0], [30, 70, 30], [30, 20, 50]]);
      root.add(aguas, abajo, cuerpo, tx, tramos, cond, flecha(-120, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tramo recto aguas arriba (≥ 10 DN)', 1, aguas, [-20, 0, 0], [-120, y + r, 0]], [2, 'Tramo recto aguas abajo (≥ 5 DN)', 1, abajo, [20, 0, 0], [80, y + r, 0]],
        [3, 'Cuerpo vortex tipo wafer / bridado', 1, cuerpo, [0, 20, 0], [0, y, r * 1.6]], [4, 'Transmisor integrado', 1, tx, [0, 50, 0], [0, y + r + 26, 0]], [5, 'Conduit flexible', 1, cond, [20, 0, 20], [30, 70, 30]]] };
    };
    V['termico'] = function () {
      var r = 15, y = 80, root = G();
      var tub = linea(240, r, y); tub.add(soporteTubo(-90, y, r)); tub.add(soporteTubo(90, y, r));
      var hot = G(cyl(3, 12, mats.pipe, 0, y + r + 5, 0, 'y'), valvulaBola(2.2, 0, y + r + 15, 0, 'y'), cyl(2.4, 10, mats.ss, 0, y + r + 24, 0, 'y'));
      var sonda = G(cyl(1, 60, mats.ss, 0, y + r + 6, 0, 'y'), sph(1.4, mats.ss, 0, y - r + 6, 0));
      var tx = G(rbox(16, 12, 10, 2, mats.inst, 0, y + r + 42, 0), box(8, 4, 0.4, mats.lcd, 0, y + r + 43, 5.2), cyl(1, 3, mats.inst, 9, y + r + 42, 0, 'x'));
      var cond = conduit([[10, y + r + 42, 0], [28, y + r + 40, 0], [40, 70, 30], [40, 20, 50]]);
      root.add(tub, hot, sonda, tx, cond, flecha(-70, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tubería de aire / gas', 1, tub, [0, 0, 0], [-80, y, r]], [2, 'Válvula de inserción en caliente (hot tap)', 1, hot, [0, 15, 0], [0, y + r + 15, 4]],
        [3, 'Sonda de dispersión térmica', 1, sonda, [0, 45, 0], [0, y, 2]], [4, 'Transmisor', 1, tx, [0, 70, 0], [0, y + r + 48, 0]], [5, 'Conduit flexible', 1, cond, [20, 0, 20], [40, 70, 30]]] };
    };

    // Nivel ultrasónico y vibratorio
    function estanque(R, H) {
      var g = G(tubo(R, H, mats.tank, 0, H / 2, 0, 'y'), cyl(R, 1, mats.tank, 0, 0.5, 0, 'y'), cyl(R * 0.98, H * 0.55, mats.liquid, 0, H * 0.275, 0, 'y'));
      var bar = G(); for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; bar.add(cyl(0.8, 30, mats.yellow, Math.cos(a) * (R - 2), H + 15, Math.sin(a) * (R - 2), 'y', 8)); }
      bar.add(M(new THREE.TorusGeometry(R - 2, 0.8, 8, 64).rotateX(Math.PI / 2), mats.yellow, 0, H + 30, 0)); g.add(bar);
      g.add(M(new THREE.TorusGeometry(R, 1.5, 8, 64).rotateX(Math.PI / 2), mats.galv, 0, H, 0));
      return g;
    }
    V['ultrasonico'] = function () {
      var R = 90, H = 200, root = G(), est = estanque(R, H);
      var brazo = G(box(60, 5, 5, mats.galv, R - 40, H + 6, 0), box(5, 12, 5, mats.galv, R - 8, H + 1, 0));
      var sensor = G(cyl(5.5, 14, mats.white, R - 62, H - 1, 0, 'y'), brida(4, R - 62, H + 7, 0, 'y'));
      var cono = M(new THREE.ConeGeometry(R * 0.38, H * 0.45, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xef5a05, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }), R - 62, H - 8 - H * 0.225, 0);
      var tx = G(rbox(20, 22, 12, 2, mats.cab, 0, 0, 0), box(10, 5, 0.5, mats.lcd, 0, 4, 6.3), box(26, 2, 18, mats.galv, 0, 14, 2)); tx.position.set(R + 50, 140, 0);
      var ped = pedestal(150, R + 50, 0);
      var cable = conduit([[R - 62, H + 12, 0], [R - 20, H + 20, 0], [R + 20, 170, 0], [R + 44, 150, 0]]);
      root.add(est, brazo, sensor, cono, tx, ped, cable);
      return { root: root, partes: [[1, 'Estanque', 1, est, [0, 0, 0], [-R, H * 0.6, 0]], [2, 'Sensor ultrasónico con brida', 1, sensor, [0, 40, 0], [R - 62, H + 8, 6]],
        [3, 'Soporte del sensor (fuera de la zona muerta)', 1, brazo, [0, 25, 0], [R - 40, H + 8, 3]], [4, 'Transmisor remoto con protección solar', 1, tx, [40, 0, 0], [R + 50, 155, 0]],
        [5, 'Pedestal de tubo de 2"', 1, ped, [40, 0, 0], [R + 50, 70, 0]], [6, 'Cable sensor–transmisor en conduit', 1, cable, [20, 20, 0], [R + 20, 172, 0]]] };
    };
    V['vibratorio'] = function () {
      var R = 70, H = 220, root = G(), est = estanque(R, H);
      function horquilla(yb) {
        var g = G(cyl(3.6, 4, mats.flange, R + 4, yb, 0, 'x'), brida(2.6, R + 7, yb, 0, 'x'), cyl(1.2, 14, mats.ss, R - 4, yb, 0, 'x'), box(8, 0.6, 2, mats.ss, R - 13, yb, 1), box(8, 0.6, 2, mats.ss, R - 13, yb, -1),
          rbox(10, 12, 10, 2, mats.cab, R + 16, yb + 2, 0), cyl(1, 3, mats.cab, R + 16, yb - 6, 0, 'y'));
        return g;
      }
      var alto = horquilla(H * 0.85), bajo = horquilla(H * 0.2);
      var c1 = conduit([[R + 16, H * 0.85 - 8, 0], [R + 30, H * 0.7, 0], [R + 34, 60, 10], [R + 34, 10, 20]]), c2 = conduit([[R + 16, H * 0.2 - 8, 0], [R + 26, 30, 4], [R + 34, 10, 20]]);
      root.add(est, alto, bajo, c1, c2);
      return { root: root, partes: [[1, 'Estanque', 1, est, [0, 0, 0], [-R, H * 0.6, 0]], [2, 'Interruptor vibratorio de alto nivel (LSH)', 1, alto, [40, 0, 0], [R + 16, H * 0.85 + 8, 0]],
        [3, 'Interruptor vibratorio de bajo nivel (LSL)', 1, bajo, [40, 0, 0], [R + 16, H * 0.2 + 8, 0]], [4, 'Conduit flexible', 2, G(c1, c2), [30, 0, 0], [R + 34, 60, 10]]] };
    };

    // Interruptor de presión
    V['presion-sw'] = function () {
      var r = 8, y = 90, root = G();
      var tub = linea(180, r, y); tub.add(soporteTubo(-60, y, r)); tub.add(soporteTubo(60, y, r));
      var toma = G(cyl(1.6, 10, mats.pipe, 0, y + r + 4, 0, 'y'), valvulaBola(1.4, 0, y + r + 12, 0, 'y'), cyl(1, 12, mats.ss, 0, y + r + 22, 0, 'y'), valvulaBola(1, 6, y + r + 26, 0, 'x'));
      var sw = G(rbox(14, 16, 10, 1.5, mats.cab, 0, y + r + 38, 0), box(12, 2, 1, mats.yellow, 0, y + r + 43, 5.2), cyl(2.2, 3, mats.ss, 0, y + r + 29, 0, 'y'));
      var cond = conduit([[7, y + r + 38, 0], [26, y + r + 36, 0], [34, 60, 20], [34, 20, 40]]);
      root.add(tub, toma, sw, cond, flecha(-45, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tubería de proceso', 1, tub, [0, 0, 0], [-50, y, r]], [2, 'Toma con válvula de bloqueo y purga', 1, toma, [0, 15, 0], [0, y + r + 14, 3]],
        [3, 'Interruptor de presión (PSH / PSL)', 1, sw, [0, 45, 0], [0, y + r + 46, 0]], [4, 'Conduit flexible', 1, cond, [25, 0, 0], [34, 60, 20]]] };
    };

    // Analizadores
    function canalOEstanque(R, H) { return estanque(R, H); }
    function sondaInmersion(x, H, y0, color) {
      return G(cyl(1.6, H, mats.galv, x, y0 + H / 2, 0, 'y'), cyl(2.4, 14, color || mats.black, x, y0 - 6, 0, 'y'), box(30, 3, 6, mats.galv, x - 12, y0 + H, 0));
    }
    V['conductividad'] = function () {
      var r = 10, y = 80, root = G();
      var tub = linea(200, r, y); tub.add(soporteTubo(-75, y, r)); tub.add(soporteTubo(75, y, r));
      var sensor = G(cyl(4, 10, mats.pipe, 0, y + r + 3, 0, 'y'), brida(4, 0, y + r + 8, 0, 'y'), M(new THREE.TorusGeometry(3.2, 1.6, 12, 32).rotateX(Math.PI / 2), mats.black, 0, y, 0), cyl(1.4, 24, mats.black, 0, y + r - 2, 0, 'y'));
      var tx = G(rbox(20, 22, 12, 2, mats.cab, 0, 0, 0), box(10, 5, 0.5, mats.lcd, 0, 4, 6.3), box(26, 2, 18, mats.galv, 0, 14, 2)); tx.position.set(60, 130, 50);
      var ped = pedestal(140, 60, 50);
      var cable = conduit([[0, y + r + 12, 0], [20, y + r + 16, 0], [50, 128, 40], [56, 120, 50]]);
      root.add(tub, sensor, tx, ped, cable, flecha(-60, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tubería de proceso', 1, tub, [0, 0, 0], [-70, y, r]], [2, 'Sensor de conductividad toroidal en te bridada', 1, sensor, [0, 35, 0], [0, y + r + 10, 4]],
        [3, 'Transmisor con relés de alarma', 1, tx, [30, 0, 0], [60, 140, 50]], [4, 'Pedestal de tubo de 2"', 1, ped, [30, 0, 0], [60, 70, 50]], [5, 'Cable del sensor en conduit', 1, cable, [20, 20, 0], [30, 120, 30]]] };
    };
    function analizadorInmersion(nombreSensor, colorSensor) {
      var R = 80, H = 160, root = G(), est = canalOEstanque(R, H);
      var sonda = sondaInmersion(R - 30, 150, 40, colorSensor);
      var tx = G(rbox(20, 22, 12, 2, mats.cab, 0, 0, 0), box(10, 5, 0.5, mats.lcd, 0, 4, 6.3), box(26, 2, 18, mats.galv, 0, 14, 2)); tx.position.set(R + 50, 140, 0);
      var ped = pedestal(150, R + 50, 0);
      var cable = conduit([[R - 30, 192, 0], [R, 200, 0], [R + 30, 160, 0], [R + 44, 140, 0]]);
      root.add(est, sonda, tx, ped, cable);
      return { root: root, partes: [[1, 'Estanque / cajón', 1, est, [0, 0, 0], [-R, H * 0.6, 0]], [2, nombreSensor + ' con tubo de inmersión', 1, sonda, [0, 60, 0], [R - 30, 30, 4]],
        [3, 'Transmisor con relés de alarma', 1, tx, [40, 0, 0], [R + 50, 155, 0]], [4, 'Pedestal de tubo de 2"', 1, ped, [40, 0, 0], [R + 50, 70, 0]], [5, 'Cable del sensor en conduit', 1, cable, [20, 20, 0], [R + 20, 175, 0]]] };
    }
    V['turbidez'] = function () { return analizadorInmersion('Sensor óptico de turbidez con limpieza automática', mats.ss); };
    V['orp'] = function () { return analizadorInmersion('Sensor de ORP (electrodo de platino)', mats.black); };
    V['gases'] = function () {
      var root = G(), pared = G(muro(300, 280, 0, -8), losa(300, 160, 0, 60));
      var det = G(rbox(14, 16, 10, 2, mats.yellow, 0, 0, 0), cyl(3, 6, mats.dark, 0, -11, 0, 'y'), cyl(2, 0.6, mats.black, 0, -14.2, 0, 'y'), box(8, 4, 0.4, mats.lcd, 0, 3, 5.2)); det.position.set(-60, 45, 6);
      var baliza = G(cyl(5, 8, mats.dark, 0, 0, 0, 'y'), cyl(4.6, 9, mats.red, 0, 8, 0, 'y'), box(10, 2, 6, mats.dark, 0, -5, -3)); baliza.position.set(60, 220, 8);
      var caja2 = caja(20, 24, 12, mats.cab, 60, 150, 6);
      var cond = G(conduit([[-60, 58, 6], [-60, 120, 4], [-20, 150, 4], [48, 150, 4]]), conduit([[60, 164, 6], [60, 205, 6]]));
      root.add(pared, det, baliza, caja2, cond);
      return { root: root, partes: [[1, 'Muro de la sala / área', 1, pared, [0, 0, 0], [-120, 200, 0]], [2, 'Detector fijo de gases (montaje bajo, gases densos)', 1, det, [0, 0, 30], [-60, 55, 12]],
        [3, 'Baliza y alarma audible local', 1, baliza, [0, 0, 30], [60, 230, 12]], [4, 'Caja de conexiones', 1, caja2, [0, 0, 30], [60, 162, 12]], [5, 'Conduit', 1, cond, [0, 0, 20], [-20, 150, 6]]] };
    };
    V['densimetro'] = function () {
      var r = 9, y = 90, root = G();
      var tub = linea(220, r, y); tub.add(soporteTubo(-80, y, r)); tub.add(soporteTubo(80, y, r));
      var sensor = G(M(new THREE.CylinderGeometry(r + 2.2, r + 2.2, 26, 48, 1, true, 0, Math.PI * 1.2).rotateZ(Math.PI / 2), mats.inst, 0, y, 0), rbox(12, 10, 14, 2, mats.inst, 0, y + r + 6, 0), box(2, 2, 30, mats.ss, 10, y, 0), box(2, 2, 30, mats.ss, -10, y, 0));
      var tx = G(rbox(20, 22, 12, 2, mats.cab, 0, 0, 0), box(10, 5, 0.5, mats.lcd, 0, 4, 6.3)); tx.position.set(0, 140, 60);
      var ped = pedestal(130, 0, 60);
      var cable = conduit([[0, y + r + 10, 4], [0, y + r + 22, 20], [0, 150, 48]]);
      var jb = caja(14, 14, 8, mats.cab, 18, 112, 60);
      root.add(tub, sensor, tx, ped, cable, jb, flecha(-60, y + r + 6, 0));
      return { root: root, partes: [[1, 'Tubería de pulpa', 1, tub, [0, 0, 0], [-70, y, r]], [2, 'Sensor no invasivo abrazado a la tubería', 1, sensor, [0, 30, 0], [0, y + r + 12, 6]],
        [3, 'Transmisor de densidad', 1, tx, [0, 0, 30], [0, 152, 60]], [4, 'Caja de conexiones con borneras', 1, jb, [20, 0, 30], [18, 120, 64]], [5, 'Pedestal de tubo de 2"', 1, ped, [0, 0, 30], [0, 70, 60]], [6, 'Cable sensor–transmisor', 1, cable, [0, 20, 10], [0, 130, 40]]] };
    };
    V['espuma'] = function () {
      var root = G();
      var celda = G(box(300, 160, 200, mats.galv, 0, 80, 0), box(296, 2, 196, mats.pulp, 0, 150, 0), box(300, 6, 30, mats.galv, 0, 152, 115), box(300, 20, 30, mats.galv, 0, 140, 130));
      var espuma = M(new THREE.BoxGeometry(296, 6, 196), std(0xc8bfa8, 0, 0.9), 0, 154, 0);
      var marco = G(box(6, 120, 6, mats.galv, -40, 220, -60), box(100, 6, 6, mats.galv, 10, 280, -60), box(6, 50, 6, mats.galv, 56, 255, -60));
      var cam = G(rbox(18, 18, 30, 3, mats.white, 0, 0, 0), cyl(5, 2, mats.black, 0, -10, 0, 'y'), cyl(9, 1, mats.led, 0, -11, 0, 'y')); cam.position.set(56, 225, -60);
      var tab = caja(40, 50, 20, mats.ss, -120, 220, -100);
      var cab = G(conduit([[56, 240, -60], [56, 280, -58], [-40, 282, -58], [-110, 250, -95]]));
      root.add(celda, espuma, marco, cam, tab, cab);
      return { root: root, partes: [[1, 'Celda de flotación (labio de rebalse)', 1, celda, [0, 0, 0], [-140, 120, 100]], [2, 'Capa de espuma', 1, espuma, [0, 0, 0], [80, 158, 40]],
        [3, 'Cámara de visión con iluminación propia', 1, cam, [0, 40, 0], [56, 210, -60]], [4, 'Estructura soporte sobre la celda', 1, marco, [0, 0, -30], [10, 290, -60]],
        [5, 'Tablero de terreno (switch PoE, fuente)', 1, tab, [-30, 0, 0], [-120, 250, -90]], [6, 'Cable Ethernet / PoE en conduit', 1, cab, [0, 20, 0], [-40, 286, -58]]] };
    };

    // Válvula solenoide y tablero neumático
    V['solenoide'] = function () {
      var r = 3, y = 90, root = G();
      var tub = linea(200, r, y, false); tub.add(soporteTubo(-80, y, r)); tub.add(soporteTubo(80, y, r));
      var v1 = valvulaBola(2.4, -45, y, 0), v2 = valvulaBola(2.4, 45, y, 0);
      var sol = G(rbox(16, 10, 9, 1.5, mats.ss, 0, y, 0), cyl(4.4, 12, mats.black, 0, y + 11, 0, 'y'), box(9, 7, 4, mats.black, 0, y + 11, 6.4), cyl(1, 2, mats.cab, 0, y + 11, 9, 'z'));
      var cond = conduit([[0, y + 11, 9.5], [0, y + 30, 20], [20, 60, 40], [24, 20, 50]]);
      root.add(tub, v1, v2, sol, cond, flecha(-75, y + 8, 0));
      return { root: root, partes: [[1, 'Línea de proceso (agua de sello / servicio)', 1, tub, [0, 0, 0], [-70, y, r]], [2, 'Válvulas de aislamiento', 2, G(v1, v2), [0, 15, 0], [-45, y + 8, 3]],
        [3, 'Válvula solenoide de 2 vías (NC)', 1, sol, [0, 35, 0], [0, y + 20, 0]], [4, 'Conduit flexible a la bobina', 1, cond, [20, 10, 20], [20, 60, 40]]] };
    };
    V['tablero-neumatico'] = function () {
      var root = G(), base = G(box(10, 220, 10, mats.galv, -60, 110, 0), box(10, 220, 10, mats.galv, 60, 110, 0), box(140, 8, 10, mats.galv, 0, 180, 0), box(140, 8, 10, mats.galv, 0, 90, 0), box(160, 10, 40, mats.concrete, 0, -5, 0));
      var gab = G(gabAbierto(100, 120, 40, mats.ss), box(98, 4, 2, mats.ss, 0, 61, 0)); gab.position.set(0, 140, 25);
      var puerta = G(box(96, 116, 1.5, mats.ss, 48, 0, 0)); puerta.position.set(-48, 140, 46); puerta.rotation.y = -1.25;
      var mani = G(box(70, 6, 10, mats.flange, 0, 0, 0)); for (var i = 0; i < 8; i++) mani.add(G(box(6, 14, 8, mats.inst, -31 + i * 9, 9, 0), cyl(2, 5, mats.black, -31 + i * 9, 17, 3, 'z'))); mani.position.set(0, 150, 30);
      var frl = G(cyl(4, 16, mats.glass, -36, 0, 0, 'y'), cyl(4, 16, mats.glass, -24, 0, 0, 'y'), cyl(3, 4, mats.dark, -12, 4, 0, 'y'), sph(3, mats.white, -12, 8, 3), box(40, 4, 8, mats.dark, -24, 10, 0)); frl.position.set(0, 110, 30);
      var frente = G(); for (var j = 0; j < 4; j++) { frente.add(cyl(1.6, 2, mats.green, -30 + j * 20, 170, 48, 'z')); frente.add(cyl(1.6, 2, mats.red, -24 + j * 20, 170, 48, 'z')); }
      var tubing = G(); for (var k = 0; k < 4; k++) tubing.add(camino([[-27 + k * 18, 140, 30], [-27 + k * 18, 70, 30], [-27 + k * 18 + 10, 30, 80], [-27 + k * 18 + 30, 25, 160]], 0.6, mats.ss));
      root.add(base, gab, puerta, mani, frl, frente, tubing);
      return { root: root, partes: [[1, 'Estructura soporte de tablero', 1, base, [0, 0, -20], [60, 200, 0]], [2, 'Gabinete de acero inoxidable NEMA 4X', 1, gab, [0, 0, 0], [40, 205, 25]],
        [3, 'Bloque distribuidor con electroválvulas 5/2', 8, mani, [0, 0, 40], [0, 168, 34]], [4, 'Unidad de mantenimiento (filtro, regulador, separador)', 1, frl, [0, 0, 40], [-24, 124, 34]],
        [5, 'Pulsadores y luces piloto por válvula', 1, frente, [0, 0, 20], [0, 176, 50]], [6, 'Tubing de acero inoxidable a las válvulas', 4, tubing, [0, -20, 20], [10, 60, 60]], [7, 'Puerta del gabinete', 1, puerta, [0, 0, 0], [-60, 180, 70]]] };
    };

    // Protecciones de correa
    function correa(largo) {
      var g = G();
      for (var x = -largo / 2; x <= largo / 2; x += 120) {
        g.add(box(8, 90, 8, mats.galv, x, 45, -75), box(8, 90, 8, mats.galv, x, 45, 75), box(8, 8, 158, mats.galv, x, 92, 0));
        var c = G(cyl(6, 50, mats.steel, x, 104, 0, 'z'), cyl(6, 50, mats.steel, x, 114, 52, 'z'), cyl(6, 50, mats.steel, x, 114, -52, 'z')); c.children[1].rotation.x = Math.PI / 2 - 0.35; c.children[2].rotation.x = Math.PI / 2 + 0.35; g.add(c);
      }
      g.add(box(largo + 40, 10, 6, mats.galv, 0, 96, -78), box(largo + 40, 10, 6, mats.galv, 0, 96, 78));
      var b = M(new THREE.BoxGeometry(largo + 40, 1.2, 140), mats.belt, 0, 111, 0); g.add(b);
      g.add(M(new THREE.BoxGeometry(largo + 40, 10, 90), mats.ore, 0, 117, 0));
      return g;
    }
    V['desalineamiento'] = function () {
      var root = G(), cv = correa(360);
      function par(z) { var s = z > 0 ? 1 : -1; return G(box(12, 22, 10, mats.yellow, 0, 98, z + s * 12), cyl(0.8, 26, mats.steel, 0, 118, z + s * 4, 'y'), cyl(3.4, 16, mats.red, 0, 128, z - s * 2, 'y'), box(10, 4, 20, mats.galv, 0, 86, z + s * 10)); }
      var p1 = par(76), p2 = par(-76);
      var cond = G(conduit([[0, 90, 92], [0, 60, 100], [40, 20, 110]]), conduit([[0, 90, -92], [0, 60, -100], [40, 20, -110]]));
      root.add(cv, p1, p2, cond);
      return { root: root, partes: [[1, 'Correa transportadora (estación de polines)', 1, cv, [0, 0, 0], [-160, 120, 0]], [2, 'Interruptor de desalineamiento lado izquierdo', 1, p1, [0, 0, 40], [0, 132, 74]],
        [3, 'Interruptor de desalineamiento lado derecho', 1, p2, [0, 0, -40], [0, 132, -74]], [4, 'Conduit flexible', 2, cond, [0, -10, 0], [40, 40, 110]]] };
    };
    V['velocidad-cero'] = function () {
      var root = G();
      var polea = G(cyl(40, 150, mats.steel, 0, 100, 0, 'z'), cyl(6, 200, mats.steel, 0, 100, 0, 'z'), box(24, 100, 20, mats.galv, 0, 50, 90), box(24, 100, 20, mats.galv, 0, 50, -90), box(30, 14, 30, mats.dark, 0, 100, 92), box(30, 14, 30, mats.dark, 0, 100, -92));
      var blanco = G(cyl(14, 2, mats.orange, 0, 100, 101, 'z')); for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2; blanco.add(cyl(1.6, 3, mats.steel, Math.cos(a) * 10, 100 + Math.sin(a) * 10, 103, 'z', 10)); }
      var sensor = G(cyl(1.8, 10, mats.ss, 10, 100, 110, 'z'), box(4, 30, 4, mats.galv, 10, 82, 116), box(30, 4, 4, mats.galv, 10, 66, 116));
      var receptor = caja(20, 24, 12, mats.cab, 60, 120, 120);
      var cable = conduit([[10, 100, 116], [30, 110, 122], [52, 118, 122]]);
      var ped = pedestal(110, 60, 126);
      root.add(polea, blanco, sensor, receptor, cable, ped);
      return { root: root, partes: [[1, 'Polea de cola con descansos', 1, polea, [0, 0, 0], [-40, 150, 0]], [2, 'Disco blanco con pernos en el eje', 1, blanco, [0, 0, 20], [0, 116, 104]],
        [3, 'Sensor inductivo con soporte ajustable', 1, sensor, [20, 0, 20], [10, 104, 114]], [4, 'Receptor con retardo de partida', 1, receptor, [30, 0, 10], [60, 136, 128]],
        [5, 'Cable sensor–receptor (≤ 6 m)', 1, cable, [20, 10, 10], [30, 112, 122]], [6, 'Pedestal', 1, ped, [30, 0, 10], [60, 60, 126]]] };
    };
    V['tilt'] = function () {
      var root = G();
      var chute = G(box(120, 6, 100, mats.galv, 0, 190, 0), box(6, 120, 100, mats.galv, -60, 130, 0), box(6, 160, 100, mats.galv, 60, 110, 0), box(120, 120, 6, mats.galv, 0, 130, -50));
      chute.children.forEach(function (m) { m.material = mats.tank; });
      var mineral = M(new THREE.ConeGeometry(50, 50, 24), mats.ore, 0, 95, 0);
      var sonda = G(cyl(0.5, 30, mats.steel, 0, 172, 0, 'y'), cyl(4, 28, mats.ss, 0, 145, 0, 'y'), sph(4, mats.ss, 0, 131, 0));
      var unidad = caja(20, 24, 12, mats.cab, 110, 160, 0);
      var cable = conduit([[0, 192, 0], [40, 200, 0], [90, 180, 0], [100, 168, 0]]);
      root.add(chute, mineral, sonda, unidad, cable);
      return { root: root, partes: [[1, 'Chute de traspaso (vista transparente)', 1, chute, [0, 0, 0], [-60, 200, 40]], [2, 'Sonda tilt colgante de acero inoxidable', 1, sonda, [0, 0, 40], [0, 150, 6]],
        [3, 'Unidad electrónica con filtro antirrebote', 1, unidad, [30, 0, 0], [110, 176, 6]], [4, 'Cable de la sonda', 1, cable, [0, 20, 0], [40, 202, 0]], [5, 'Material acumulado (atollo)', 1, mineral, [0, 0, 0], [30, 100, 30]]] };
    };
    V['contrapeso'] = function () {
      var root = G();
      var torre = G(box(10, 400, 10, mats.galv, -60, 200, -60), box(10, 400, 10, mats.galv, 60, 200, -60), box(10, 400, 10, mats.galv, -60, 200, 60), box(10, 400, 10, mats.galv, 60, 200, 60), box(130, 10, 130, mats.galv, 0, 400, 0));
      var peso = G(box(100, 80, 60, mats.concrete, 0, 200, 0), cyl(30, 100, mats.steel, 0, 270, 0, 'z'), M(new THREE.BoxGeometry(2, 150, 120), mats.belt, -30, 320, 0), M(new THREE.BoxGeometry(2, 150, 120), mats.belt, 30, 320, 0));
      function sw(y) { return G(box(10, 14, 8, mats.yellow, 64, y, 0), box(16, 1.4, 1.4, mats.steel, 54, y + 6, 0), cyl(2, 1.6, mats.black, 46, y + 6, 0, 'z')); }
      var alto = sw(330), bajo = sw(140);
      var cond = conduit([[70, 140, 0], [72, 200, 0], [72, 330, 0], [74, 360, 30], [80, 380, 80]]);
      root.add(torre, peso, alto, bajo, cond);
      return { root: root, partes: [[1, 'Torre del tensor', 1, torre, [0, 0, 0], [-60, 380, 60]], [2, 'Contrapeso y polea tensora', 1, peso, [0, 0, 0], [0, 200, 32]],
        [3, 'Interruptor de posición alta (ZSH)', 1, alto, [30, 0, 0], [64, 340, 4]], [4, 'Interruptor de posición baja (ZSL)', 1, bajo, [30, 0, 0], [64, 150, 4]], [5, 'Conduit', 1, cond, [20, 0, 0], [72, 250, 0]]] };
    };

    // Gabinetes PLC
    V['gabinete-plc'] = function () {
      var root = G(), z0 = 0;
      var caja0 = gabAbierto(120, 200, 60, mats.cab); caja0.position.y = 110; var cuerpo = G(caja0, box(124, 10, 64, mats.dark, 0, 5, 0), box(116, 196, 1, mats.white, 0, 110, -28.5));
      var puerta = G(box(118, 196, 2, mats.cab, 59, 0, 0), box(2, 20, 3, mats.dark, 110, 0, 2)); puerta.position.set(-59, 110, 31); puerta.rotation.y = -1.9;
      var plc = G(box(80, 14, 12, mats.dark, 0, 0, 0)); for (var i = 0; i < 12; i++) plc.add(box(5, 13, 1, i < 2 ? mats.inst : mats.cream, -36 + i * 6.4, 0, 6.5)); plc.position.set(0, 170, -20);
      var fuentes = G(box(14, 13, 12, mats.white, -30, 0, 0), box(14, 13, 12, mats.white, -14, 0, 0), box(10, 13, 12, mats.inst, 2, 0, 0)); fuentes.position.set(0, 145, -20);
      var bornes = G(); for (var r2 = 0; r2 < 3; r2++) { bornes.add(box(96, 1.2, 4, mats.steel, 0, r2 * 30, -2)); for (var b = 0; b < 40; b++) bornes.add(box(2, 6, 7, b % 10 === 9 ? mats.orange : mats.cream, -44 + b * 2.25, r2 * 30 + 3, 0)); } bornes.position.set(0, 60, -20);
      var canal = G(box(100, 6, 8, mats.white, 0, 0, 0), box(100, 6, 8, mats.white, 0, 30, 0), box(100, 6, 8, mats.white, 0, 60, 0), box(100, 6, 8, mats.white, 0, 95, 0), box(6, 120, 8, mats.white, -52, 50, 0), box(6, 120, 8, mats.white, 52, 50, 0)); canal.position.set(0, 50, -22);
      var sw = G(box(14, 13, 11, mats.black, 0, 0, 0)); for (var j = 0; j < 6; j++) sw.add(box(1.4, 1, 0.4, mats.led, -5 + j * 2, 4, 5.8)); sw.position.set(34, 145, -20);
      root.add(cuerpo, puerta, plc, fuentes, bornes, canal, sw);
      return { root: root, partes: [[1, 'Gabinete autosoportado con zócalo', 1, cuerpo, [0, 0, -30], [60, 205, 30]], [2, 'Controlador PLC y módulos de E/S', 1, plc, [0, 0, 40], [0, 180, -12]],
        [3, 'Fuentes de 24 VDC redundantes y módulo de redundancia', 1, fuentes, [0, 0, 40], [-20, 155, -12]], [4, 'Switch industrial', 1, sw, [0, 0, 40], [34, 155, -12]],
        [5, 'Borneras de terreno con reserva (20 %)', 3, bornes, [0, 0, 30], [0, 125, -12]], [6, 'Canaletas ranuradas (llenado ≤ 40 %)', 1, canal, [0, 0, 20], [-52, 100, -16]], [7, 'Puerta con portaplanos', 1, puerta, [0, 0, 0], [-90, 200, 80]]] };
    };
    V['rio-terreno'] = function () {
      var root = G(), est = G(box(8, 200, 8, mats.galv, -50, 100, 0), box(8, 200, 8, mats.galv, 50, 100, 0), box(120, 6, 8, mats.galv, 0, 160, 0), box(120, 6, 8, mats.galv, 0, 80, 0), box(140, 10, 40, mats.concrete, 0, -5, 0));
      var techo = G(box(130, 3, 70, mats.galv, 0, 212, 18)); techo.rotation.x = 0.08;
      var gab = G(box(80, 100, 30, mats.ss, 0, 0, 0), box(78, 98, 1.5, mats.ss, 0, 0, 15.5), box(2, 14, 3, mats.dark, 34, 0, 17)); gab.position.set(0, 125, 20);
      var prensa = G(); for (var i = 0; i < 8; i++) prensa.add(cyl(1.6, 4, mats.black, -28 + i * 8, 73, 20, 'y'));
      var cables = G(); for (var k = 0; k < 4; k++) cables.add(camino([[-24 + k * 16, 72, 20], [-24 + k * 16, 40, 22], [-30 + k * 20, 10, 60]], 1.2, k % 2 ? mats.cableBlue : mats.cableGrey));
      root.add(est, techo, gab, prensa, cables);
      return { root: root, partes: [[1, 'Estructura soporte en terreno', 1, est, [0, 0, -20], [50, 180, 0]], [2, 'Techo de protección solar', 1, techo, [0, 30, 0], [0, 216, 30]],
        [3, 'Gabinete de E/S remotas NEMA 4X', 1, gab, [0, 0, 30], [0, 178, 36]], [4, 'Prensaestopas certificados', 8, prensa, [0, -10, 30], [0, 72, 24]], [5, 'Cables de instrumentación multipar', 4, cables, [0, -20, 30], [10, 40, 30]]] };
    };

    // Comunicaciones
    V['rack'] = function () {
      var root = G(), piso = losa(300, 300), rk = rack42(0, 0);
      var fibra = camino([[20, 200, -30], [20, 230, -30], [20, 240, -120], [20, 240, -160]], 1.4, mats.fiber);
      var pdu = box(48, 4, 10, mats.dark, 0, 12, -30);
      var malla = G(cyl(0.5, 60, mats.flange, -35, 30, -40, 'y'), box(20, 2, 4, mats.flange, -30, 4, -40));
      root.add(piso, rk, fibra, pdu, malla);
      return { root: root, partes: [[1, 'Gabinete rack 19" de 42 U con puerta de vidrio', 1, rk.children[0] ? G(rk.children[0], rk.children[1]) : rk, [0, 0, 0], [40, 205, 50]],
        [2, 'Switches de núcleo administrables', 2, G(), [0, 0, 40], [0, 50, 50]], [3, 'Bandeja de fibra óptica (ODF) con pigtails', 1, G(), [0, 0, 40], [0, 70, 50]],
        [4, 'Grabador de video en red (NVR)', 2, G(), [0, 0, 40], [0, 100, 50]], [5, 'PDU de 120 VAC', 1, pdu, [0, 0, 20], [0, 20, 50]], [6, 'Cable troncal de fibra óptica', 1, fibra, [0, 30, 0], [20, 240, -100]],
        [7, 'Conexión a malla de tierra', 1, malla, [-20, 0, 0], [-35, 40, -40]]], fijo: rk };
    };
    V['jb'] = function () {
      var root = G(), soporte = G(box(6, 160, 6, mats.galv, -30, 80, 0), box(6, 160, 6, mats.galv, 30, 80, 0), box(70, 5, 6, mats.galv, 0, 140, 0), box(70, 5, 6, mats.galv, 0, 80, 0), box(90, 10, 30, mats.concrete, 0, -5, 0));
      var jb = gabAbierto(50, 50, 20, mats.ss); jb.position.set(0, 110, 14);
      var tapa = box(48, 48, 1.4, mats.ss, 24, 0, 0); var tg = G(tapa); tg.position.set(-24, 110, 25); tg.rotation.y = -1.7;
      var bor = G(box(40, 1.2, 4, mats.steel, 0, 0, 0)); for (var b = 0; b < 18; b++) bor.add(box(2, 6, 6, b > 14 ? mats.orange : mats.cream, -18 + b * 2.1, 3, 0)); bor.position.set(0, 112, 18);
      var tierraB = box(30, 2, 2, mats.flange, 0, 94, 18);
      var cables = G(); for (var k = 0; k < 6; k++) cables.add(camino([[-15 + k * 6, 85, 14], [-15 + k * 6, 55, 16], [-40 + k * 15, 15, 60]], 0.9, mats.cableBlue));
      var multi = camino([[0, 135, 14], [0, 170, 14], [0, 190, -20], [0, 192, -80]], 2.2, mats.cableGrey);
      root.add(soporte, jb, tg, bor, tierraB, cables, multi);
      return { root: root, partes: [[1, 'Soporte de caja en terreno', 1, soporte, [0, 0, -20], [30, 150, 0]], [2, 'Caja de conexión de acero inoxidable NEMA 4X', 1, jb, [0, 0, 20], [24, 132, 24]],
        [3, 'Borneras con 20 % de reserva', 1, bor, [0, 0, 40], [0, 120, 22]], [4, 'Barra de tierra de pantallas (aislada)', 1, tierraB, [0, 0, 40], [0, 94, 22]],
        [5, 'Cables de instrumentos (pares blindados)', 6, cables, [0, -20, 20], [-20, 40, 40]], [6, 'Cable multipar a la sala de control', 1, multi, [0, 20, -10], [0, 188, -40]], [7, 'Tapa', 1, tg, [0, 0, 0], [-40, 140, 50]]] };
    };

    // CCTV
    V['cctv-ptz'] = function () {
      var root = G();
      var poste = G(cyl(7, 600, mats.galv, 0, 300, 0, 'y'), box(50, 3, 50, mats.galv, 0, 1.5, 0), box(80, 30, 80, mats.concrete, 0, -15, 0));
      var brazo = G(cyl(2.4, 60, mats.white, 0, 590, 30, 'z'), box(14, 14, 4, mats.white, 0, 590, 4));
      var cam = camaraPTZ(); cam.position.set(0, 586, 60); cam.scale.setScalar(1.3);
      var tab = G(caja(50, 60, 22, mats.ss, 0, 0, 0)); tab.position.set(0, 160, 18);
      var cond = G(conduit([[0, 190, 14], [0, 400, 9], [0, 575, 9]]), conduit([[0, 130, 14], [0, 40, 12], [0, -2, 30]]));
      var pararrayo = G(cyl(0.6, 80, mats.ss, 0, 640, 0, 'y')); var tierra1 = tierra(30, 30);
      root.add(poste, brazo, cam, tab, cond, pararrayo, tierra1);
      return { root: root, partes: [[1, 'Poste de acero galvanizado con fundación', 1, poste, [0, 0, 0], [0, 300, 8]], [2, 'Brazo soporte de la cámara', 1, brazo, [0, 30, 20], [0, 598, 30]],
        [3, 'Cámara IP tipo domo PTZ', 1, cam, [0, 20, 60], [0, 560, 60]], [4, 'Tablero de terreno CCTV (switch PoE, conversor, fuente)', 1, tab, [0, 0, 40], [0, 196, 30]],
        [5, 'Conduit de señal y alimentación', 2, cond, [20, 0, 0], [0, 400, 12]], [6, 'Punta captora y puesta a tierra', 1, G(pararrayo, tierra1), [0, 20, 0], [0, 660, 0]]] };
    };
    V['cctv-fija'] = function () {
      var root = G(), pared = G(muro(320, 420, 0, -8), losa(320, 200, 0, 80));
      var sop = G(box(12, 18, 4, mats.white, 0, 0, 0), cyl(2, 14, mats.white, 0, 0, 8, 'z')); sop.position.set(0, 340, 2);
      var cam = camaraBullet(); cam.position.set(0, 345, 26); cam.rotation.x = 0.25;
      var caja1 = caja(14, 14, 8, mats.white, 0, 316, 4);
      var cond = conduit([[0, 309, 4], [0, 200, 4], [60, 120, 4], [130, 120, 4]]);
      var campo = M(new THREE.ConeGeometry(120, 300, 4, 1, true).rotateX(-Math.PI / 2 - 0.25), new THREE.MeshBasicMaterial({ color: 0xef5a05, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }), 0, 300, 180);
      root.add(pared, sop, cam, caja1, cond, campo);
      return { root: root, partes: [[1, 'Muro', 1, pared, [0, 0, 0], [-120, 380, 0]], [2, 'Soporte de muro', 1, sop, [0, 0, 20], [0, 352, 6]], [3, 'Cámara IP fija (bullet)', 1, cam, [0, 0, 40], [0, 356, 34]],
        [4, 'Caja de conexiones', 1, caja1, [0, 0, 20], [0, 316, 10]], [5, 'Conduit con cable Ethernet PoE', 1, cond, [0, 0, 10], [60, 120, 6]], [6, 'Campo de visión', 1, campo, [0, 0, 0], [0, 200, 220]]] };
    };

    // Control de acceso
    V['puerta'] = function () {
      var root = G(), pared = G(box(130, 260, 15, mats.wall, -135, 130, 0), box(130, 260, 15, mats.wall, 135, 130, 0), box(140, 40, 15, mats.wall, 0, 240, 0), losa(400, 240, 0, 40));
      var marco = G(box(6, 220, 18, mats.dark, -73, 110, 0), box(6, 220, 18, mats.dark, 73, 110, 0), box(152, 6, 18, mats.dark, 0, 223, 0));
      var hoja = G(box(140, 214, 5, mats.housing, 70, 0, 0), box(4, 14, 4, mats.ss, 128, 0, 4)); hoja.position.set(-70, 109, 0); hoja.rotation.y = -0.45;
      var iman = G(box(50, 7, 5, mats.ss, 0, 0, 0)); iman.position.set(40, 215, 10);
      var lector = G(rbox(8, 13, 3, 1, mats.black, 0, 0, 0), box(5, 5, 0.4, mats.inst, 0, 2, 1.6), box(4, 0.8, 0.4, mats.led, 0, -4, 1.6)); lector.position.set(100, 120, 9);
      var salida = G(rbox(8, 8, 2, 1, mats.white, 0, 0, 0), cyl(2.4, 1, mats.green, 0, 0, 1.4, 'z')); salida.position.set(100, 120, -9); salida.rotation.y = Math.PI;
      var emergencia = G(box(9, 9, 3, mats.green, 0, 0, 0), box(6, 6, 0.4, mats.white, 0, 0, 1.6)); emergencia.position.set(100, 145, -9.5); emergencia.rotation.y = Math.PI;
      var sensor = G(box(6, 2, 2, mats.white, 0, 0, 0)); sensor.position.set(60, 221, 10);
      var ctrl = G(caja(30, 36, 10, mats.cab, 0, 0, 0)); ctrl.position.set(110, 230, -16);
      var cond = conduit([[110, 212, -16], [110, 200, -9], [100, 128, -9]]);
      root.add(pared, marco, hoja, iman, lector, salida, emergencia, sensor, ctrl, cond);
      return { root: root, partes: [[1, 'Muro y marco de puerta', 1, G(pared, marco), [0, 0, 0], [-150, 250, 10]], [2, 'Hoja de puerta con cierrapuertas', 1, hoja, [0, 0, 30], [-40, 160, 30]],
        [3, 'Electroimán de falla segura', 1, iman, [0, 15, 20], [40, 222, 14]], [4, 'Sensor magnético de puerta', 1, sensor, [0, 20, 20], [60, 226, 12]],
        [5, 'Lector de credenciales (OSDP)', 1, lector, [20, 0, 20], [100, 132, 12]], [6, 'Pulsador de salida (lado interior)', 1, salida, [20, 0, -20], [100, 128, -14]],
        [7, 'Pulsador de emergencia rompe vidrio', 1, emergencia, [20, 0, -20], [100, 154, -14]], [8, 'Controlador de acceso con batería', 1, ctrl, [20, 0, -30], [110, 252, -20]], [9, 'Conduit', 1, cond, [10, 0, -10], [106, 170, -9]]] };
    };
    V['torniquete'] = function () {
      var root = G(), piso = losa(500, 400);
      function torno(x) {
        var g = G(cyl(4, 230, mats.ss, 0, 115, 0, 'y'));
        for (var n = 0; n < 3; n++) for (var k = 0; k < 10; k++) { var a = n * 2 * Math.PI / 3; g.add(box(55, 2.4, 2.4, mats.ss, Math.cos(a) * 30, 30 + k * 18, Math.sin(a) * 30)); g.children[g.children.length - 1].rotation.y = -a; }
        g.add(G(box(6, 230, 120, mats.ss, 0, 115, 0)));
        g.children[g.children.length - 1].position.set(-70, 0, 0);
        var arco = G(box(6, 230, 6, mats.ss, 70, 115, -60), box(6, 230, 6, mats.ss, 70, 115, 60)); g.add(arco);
        g.position.set(x, 0, 0); return g;
      }
      var t1 = torno(-80), t2 = torno(80);
      var techo = G(box(320, 4, 220, mats.galv, 0, 260, 0), box(6, 260, 6, mats.galv, -155, 130, -105), box(6, 260, 6, mats.galv, 155, 130, -105), box(6, 260, 6, mats.galv, -155, 130, 105), box(6, 260, 6, mats.galv, 155, 130, 105));
      function poste(x, z) { return G(box(8, 110, 8, mats.ss, 0, 55, 0), rbox(8, 13, 4, 1, mats.black, 0, 120, 0), box(5, 5, 0.4, mats.inst, 0, 122, 2.2)); }
      var lec = G(); [[-40, -70], [-40, 70], [120, -70], [120, 70]].forEach(function (p) { var q = poste(); q.position.set(p[0], 0, p[1]); lec.add(q); });
      var pict = G(box(16, 16, 2, mats.green, -80, 200, 62), box(16, 16, 2, mats.red, 80, 200, 62));
      root.add(piso, t1, t2, techo, lec, pict);
      return { root: root, partes: [[1, 'Torniquete de cuerpo completo (2 pasos)', 2, G(t1, t2), [0, 0, 0], [0, 200, 0]], [2, 'Lectores de entrada y salida en pedestal', 4, lec, [0, 0, 30], [-40, 135, -70]],
        [3, 'Pictogramas LED de paso', 2, pict, [0, 0, 20], [-80, 212, 64]], [4, 'Techo de protección', 1, techo, [0, 40, 0], [0, 265, 100]]] };
    };

    // Intercomunicador
    V['intercom'] = function () {
      var root = G(), ped = pedestal(140, 0, 0);
      var ic = G(rbox(24, 34, 9, 2, mats.yellow, 0, 0, 0), cyl(5, 1, mats.black, 0, 6, 4.6, 'z'), cyl(2.6, 1, mats.red, 0, -9, 4.6, 'z'), box(16, 3, 0.4, mats.black, 0, -2, 4.6)); ic.position.set(0, 150, 7);
      var techo = G(box(40, 2, 30, mats.galv, 0, 190, 6)); techo.rotation.x = 0.1;
      var baliza = G(cyl(4.4, 6, mats.dark, 0, 0, 0, 'y'), cyl(4, 8, mats.orange, 0, 7, 0, 'y')); baliza.position.set(0, 196, 0);
      var bocina = G(cone(3, 12, 18, mats.white, 0, 0, 0, 'z'), cyl(4, 8, mats.white, 0, 0, -12, 'z')); bocina.position.set(16, 176, 10);
      var cond = conduit([[0, 132, 4], [0, 60, 4], [20, 10, 30]]);
      root.add(ped, ic, techo, baliza, bocina, cond);
      return { root: root, partes: [[1, 'Pedestal de tubo de 2"', 1, ped, [0, 0, 0], [0, 80, 6]], [2, 'Intercomunicador IP manos libres', 1, ic, [0, 0, 30], [0, 168, 12]],
        [3, 'Techo de protección', 1, techo, [0, 20, 0], [0, 194, 20]], [4, 'Baliza de llamada', 1, baliza, [0, 20, 0], [0, 206, 0]], [5, 'Parlante bocina para ruido alto', 1, bocina, [30, 0, 20], [16, 186, 18]], [6, 'Conduit PoE', 1, cond, [0, 0, 20], [10, 40, 20]]] };
    };

    // ── Canaleta Parshall con medición de nivel y totalizador ──
    // Dimensiones (cm) según ASTM D1941 / USBR Water Measurement Manual; descarga en flujo libre
    // Q = C·Ha^n con Ha en pies y Q en pie³/s (C y n de ASTM D1941), convertida a unidades SI.
    var PARSHALL = {
      '6"': { W: 15.2, A: 62.1, B: 61.0, C: 39.4, D: 40.3, E: 61.0, F: 30.5, G: 61.0, K: 7.6, N: 11.4, c: 2.06, n: 1.58, qmin: 1.5, qmax: 111, hmax: 0.45, sl: 0.60 },
      '9"': { W: 22.9, A: 88.0, B: 86.4, C: 38.1, D: 57.5, E: 76.2, F: 30.5, G: 45.7, K: 7.6, N: 11.4, c: 3.07, n: 1.53, qmin: 2.5, qmax: 251, hmax: 0.61, sl: 0.60 },
      "1'": { W: 30.5, A: 137.2, B: 134.4, C: 61.0, D: 84.5, E: 91.5, F: 61.0, G: 91.5, K: 7.6, N: 22.9, c: 4.00, n: 1.522, qmin: 3.1, qmax: 455, hmax: 0.76, sl: 0.70 },
      "2'": { W: 61.0, A: 152.4, B: 149.5, C: 91.5, D: 120.7, E: 91.5, F: 61.0, G: 91.5, K: 7.6, N: 22.9, c: 8.00, n: 1.550, qmin: 11.9, qmax: 937, hmax: 0.76, sl: 0.70 },
      "3'": { W: 91.5, A: 167.6, B: 164.5, C: 122.0, D: 157.2, E: 91.5, F: 61.0, G: 91.5, K: 7.6, N: 22.9, c: 12.00, n: 1.566, qmin: 17.3, qmax: 1427, hmax: 0.76, sl: 0.70 }
    };
    var SE = { w: "1'", q: null, h2: -0.10, vel: 60, tot: 0 };
    function kSI(p) { return 0.0283168 * p.c * Math.pow(1 / 0.3048, p.n); }              // Q [m³/s] = K·Ha[m]^n
    function qLibre(p, ha) { return ha > 0 ? kSI(p) * Math.pow(ha, p.n) * 1000 : 0; }      // L/s
    function haLibre(p, q) { return q > 0 ? Math.pow(q / 1000 / kSI(p), 1 / p.n) : 0; }     // m
    // Reducción de caudal por sumergencia (aproximación didáctica, no reemplaza las curvas de corrección)
    function qSumergido(p, ha, hb) { var s = hb / ha; if (s <= p.sl) return qLibre(p, ha); var x = Math.min(1, (s - p.sl) / (1 - p.sl)); return qLibre(p, ha) * Math.max(0.05, 1 - 0.45 * Math.pow(x, 1.5)); }
    function hidraulica(p, q, h2) { // q real L/s, h2 nivel aguas abajo sobre la cresta (m)
      var ha = haLibre(p, q), hb = h2, sum = false;
      if (ha > 0 && hb / ha > p.sl) {
        sum = true; var lo = ha, hi = ha * 4 + 0.5;
        for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (qSumergido(p, mid, hb) < q) lo = mid; else hi = mid; }
        ha = (lo + hi) / 2;
      }
      return { ha: ha, hb: hb, s: ha > 0 ? hb / ha : 0, sum: sum, qmed: qLibre(p, ha) };
    }
    function hexa(c, mat) {
      var idx = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0], pos = [];
      idx.forEach(function (i) { pos.push(c[i][0], c[i][1], c[i][2]); });
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      return M(g, mat);
    }
    // Prisma entre x0 y x1 con límites en z (za..zb) y alturas de fondo (yb) y techo (yt) en cada extremo
    function prisma(x0, x1, za0, zb0, za1, zb1, yb0, yb1, yt0, yt1, mat) {
      return hexa([[x0, yb0, za0], [x1, yb1, za1], [x1, yb1, zb1], [x0, yb0, zb0], [x0, yt0, za0], [x1, yt1, za1], [x1, yt1, zb1], [x0, yt0, zb0]], mat);
    }
    var mFrp = std(0xe8e2d2, 0.05, 0.55, { side: THREE.DoubleSide }), mHorm = std(0xb9b5ad, 0, 0.95, { side: THREE.DoubleSide });
    var mAgua = new THREE.MeshPhysicalMaterial({ color: 0x3f8fd2, metalness: 0, roughness: 0.15, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
    function lcd() {
      var c = document.createElement('canvas'); c.width = 256; c.height = 128;
      var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: tx }));
      m.userData.dibujar = function (l1, l2, l3) {
        var x = c.getContext('2d'); x.fillStyle = '#a9dcb2'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#0d2a14';
        x.font = 'bold 34px monospace'; x.fillText(l1, 10, 42); x.font = 'bold 28px monospace'; x.fillText(l2, 10, 82); x.font = '22px monospace'; x.fillText(l3, 10, 116);
        tx.needsUpdate = true;
      };
      return m;
    }
    function parshall(conPozo) {
      var p = PARSHALL[SE.w], t = 4, yc = p.N + 20, E = p.E, B = p.B, F = p.F, LG = p.G;
      var Lap = 120 + p.W, Ldn = 90 + p.W;
      var fd = yc - p.N + p.K;
      // Secciones: [x0, x1, semiancho0, semiancho1, fondo0, fondo1, material]
      var xm = -2 / 3 * B, hwm = p.D / 2 + (p.W / 2 - p.D / 2) / 3;
      var secs = [[-B - Lap, -B, p.D / 2, p.D / 2, yc, yc, mHorm], [-B, xm, p.D / 2, hwm, yc, yc, mFrp], [xm, 0, hwm, p.W / 2, yc, yc, mFrp],
        [0, F, p.W / 2, p.W / 2, yc, yc - p.N, mFrp], [F, F + LG, p.W / 2, p.C / 2, yc - p.N, fd, mFrp], [F + LG, F + LG + Ldn, p.C / 2, p.C / 2, fd, fd, mHorm]];
      var canal = G(), canaleta = G();
      secs.forEach(function (s) {
        var g = s[6] === mHorm ? canal : canaleta;
        g.add(prisma(s[0], s[1], -(s[2] + t), s[2] + t, -(s[3] + t), s[3] + t, 0, 0, s[4], s[5], s[6]));
        [-1, 1].forEach(function (k) { g.add(prisma(s[0], s[1], k * s[2], k * (s[2] + t), k * s[3], k * (s[3] + t), 0, 0, yc + E, yc + E, s[6])); });
      });
      // Agua: se rehace cuando cambian Ha o el nivel aguas abajo
      var agua = G(); agua.userData.scope = 'agua';
      function dibujarAgua(h) {
        while (agua.children.length) { var o = agua.children.pop(); o.geometry.dispose(); }
        var Ha = h.ha * 100, yd = Math.max(fd + 1.5, yc + h.hb * 100);
        var sup = [yc + Ha * 1.01, yc + Ha * 1.005, yc + Ha, Math.max(yc + 0.72 * Ha, h.sum ? yc + h.hb * 100 : 0), Math.max(yc - p.N + 0.4 * Ha, yd), yd, yd];
        if (Ha <= 0.05) return;
        secs.forEach(function (s, i) {
          var a = Math.max(sup[i], s[4] + 0.6), b = Math.max(sup[i + 1], s[5] + 0.6);
          agua.add(prisma(s[0], s[1], -s[2] + 0.2, s[2] - 0.2, -s[3] + 0.2, s[3] - 0.2, s[4] + 0.3, s[5] + 0.3, a, b, mAgua));
        });
        agua.children.forEach(function (m) { m.castShadow = false; m.userData.scope = 'agua'; });
      }
      // Regla limnimétrica en el punto de medición (2/3 de A aguas arriba de la cresta)
      var regla = G(box(1, E, 6, mats.yellow, xm, yc + E / 2, -hwm + 0.6));
      for (var r = 0; r < E; r += 10) regla.add(box(1.2, 1, 3, mats.black, xm, yc + r, -hwm + 3.2));
      // Sensor y soportes
      var ys = yc + E + 30, zs = 0, xw = xm, zPozo = -(hwm + t + 30);
      if (conPozo) zs = zPozo;
      var sensor = conPozo
        ? G(cyl(4, 9, mats.white, xw, ys + 3, zs, 'y'), cone(4.6, 3, 4, mats.white, xw, ys - 3, zs, 'y'), brida(3, xw, ys - 5, zs, 'y'))
        : G(cyl(5.5, 14, mats.white, xw, ys + 7, zs, 'y'), brida(4, xw, ys + 15, zs, 'y'));
      var zPost = (conPozo ? zPozo : -(hwm + t)) - 22;
      var soporte = G(pedestal(ys + 20, xw, zPost), box(5, 5, Math.abs(zPost - zs) + 8, mats.galv, xw, ys + 20, (zPost + zs) / 2));
      var haz = M(new THREE.ConeGeometry(1, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xef5a05, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
      var pozo = null, aguaPozo = null;
      if (conPozo) {
        aguaPozo = cyl(14, 1, mAgua, xw, 0, zPozo, 'y'); aguaPozo.castShadow = false; aguaPozo.userData.scope = 'agua';
        pozo = G(tubo(15, E + 30, mats.tank, xw, yc - 15 + (E + 30) / 2, zPozo, 'y'), cyl(15, 2, mats.concrete, xw, yc - 15, zPozo, 'y'),
          cyl(2.5, -zPozo - hwm, mats.pipe, xw, yc + 4, (zPozo - hwm) / 2, 'z'), valvulaBola(2, xw, yc + 4, -(hwm + t + 8), 'z'));
      }
      var xT = xw + 90, zT = zPost - 30;
      var pantalla = lcd(); pantalla.position.set(0, 3, 6.3);
      var tx = G(rbox(22, 26, 12, 2, mats.cab, 0, 0, 0), pantalla, box(28, 2, 18, mats.galv, 0, 15, 2)); tx.position.set(xT, 140, zT);
      var pedT = pedestal(150, xT, zT);
      var cable = conduit([[xw, ys + 15, zs], [xw, ys + 28, zs - 6], [xw + 10, ys + 24, zPost], [xT - 10, 150, zT + 4], [xT, 126, zT]]);
      var root = G(canal, canaleta, agua, regla, sensor, soporte, haz, tx, pedT, cable, flecha(-B - Lap + 30, yc + p.hmax * 100 + 12, 0));
      if (pozo) root.add(pozo, aguaPozo);
      var partes = [
        [1, 'Canal de aproximación con tramo recto', 1, canal, [0, 0, 0], [-B - Lap / 2, yc + E + 6, p.D / 2]],
        [2, 'Canaleta Parshall de ' + SE.w + ' (convergente, garganta, divergente)', 1, canaleta, [0, -10, 0], [F + LG / 2, yc + E + 8, p.C / 2]],
        [3, 'Punto de medición Ha (2/3 de A) con regla limnimétrica', 1, regla, [0, 0, -20], [xm - 25, yc + E + 4, -hwm]],
        [4, conPozo ? 'Sensor radar sobre el pozo de calma' : 'Sensor ultrasónico sobre el punto Ha', 1, sensor, [0, 30, 0], [xw, ys + 40, zs]],
        [5, 'Transmisor de flujo con totalizador', 1, tx, [30, 0, 30], [xT, 178, zT]],
        [6, 'Soporte del sensor y pedestal del transmisor', 2, G(soporte, pedT), [0, 0, 30], [xw - 10, 40, zPost]],
        [7, 'Cable sensor–transmisor en conduit', 1, cable, [10, 10, 10], [xT - 30, 165, zT + 6]]
      ];
      if (pozo) partes.push([8, 'Pozo de calma con tubo de conexión y válvula', 1, pozo, [0, 0, 30], [xw + 45, yc - 10, zPozo - 16]]);

      // Simulación
      var lect = null, acum = 0;
      function calcular() {
        var h = hidraulica(p, SE.q, SE.h2);
        dibujarAgua(h);
        var yAgua = yc + h.ha * 100, d = ys - yAgua;
        haz.scale.set(conPozo ? 10 : Math.max(4, d * 0.18), Math.max(1, d), conPozo ? 10 : Math.max(4, d * 0.18));
        haz.position.set(xw, yAgua + d / 2, zs); haz.visible = d > 1;
        if (aguaPozo) { var hh = Math.max(1, yAgua - (yc - 14)); aguaPozo.scale.y = hh; aguaPozo.position.y = yc - 14 + hh / 2; }
        lect = h; lect.d = d; lect.h0 = ys - yc;
        return h;
      }
      var sim = {
        html: '<div class="simg">' +
          '<label>Ancho de garganta W<select id="sW">' + Object.keys(PARSHALL).map(function (k) { return '<option' + (k === SE.w ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label>' +
          '<label>Caudal real en el canal <output id="oQ"></output><input type="range" id="sQ" min="' + p.qmin + '" max="' + p.qmax + '" step="0.1"></label>' +
          '<label>Nivel aguas abajo sobre la cresta <output id="oT"></output><input type="range" id="sT" min="-20" max="' + Math.round(p.hmax * 100) + '" step="1"></label>' +
          '<label>Velocidad del totalizador<select id="sV"><option value="1">Tiempo real</option><option value="60">× 60 (1 s = 1 min)</option><option value="3600">× 3600 (1 s = 1 h)</option></select></label></div>' +
          '<dl class="lect" id="lect"></dl><p class="eq" id="eq"></p><button type="button" id="sRes" class="tg">Reiniciar totalizador</button>',
        montar: function () {
          if (SE.q === null || SE.q > p.qmax || SE.q < p.qmin) SE.q = Math.round(p.qmax * 0.35);
          $('sQ').value = SE.q; $('sT').value = Math.round(SE.h2 * 100); $('sV').value = String(SE.vel);
          $('sW').addEventListener('change', function () { SE.w = this.value; SE.q = null; construir(); });
          $('sQ').addEventListener('input', function () { SE.q = +this.value; calcular(); sim.pintar(); });
          $('sT').addEventListener('input', function () { SE.h2 = +this.value / 100; calcular(); sim.pintar(); });
          $('sV').addEventListener('change', function () { SE.vel = +this.value; });
          $('sRes').addEventListener('click', function () { SE.tot = 0; sim.pintar(); });
          calcular(); sim.pintar();
        },
        pintar: function () {
          var h = lect, n = function (v, d) { return v.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d }); };
          var mA = Math.min(20.5, 4 + 16 * h.qmed / p.qmax), err = SE.q > 0 ? (h.qmed - SE.q) / SE.q * 100 : 0, rebalse = h.ha * 100 > E;
          $('oQ').textContent = n(SE.q, 1) + ' L/s'; $('oT').textContent = n(SE.h2 * 100, 0) + ' cm';
          var filas = [
            ['Distancia sensor–agua d', n(h.d * 10, 0) + ' mm'],
            ['Carga Ha = H0 − d', n(h.ha * 1000, 0) + ' mm'],
            ['Nivel aguas abajo Hb', n(h.hb * 1000, 0) + ' mm'],
            ['Sumergencia Hb/Ha', n(h.s * 100, 0) + ' % (límite ' + n(p.sl * 100, 0) + ' %)'],
            ['Régimen', h.sum ? '<span class="warn">Sumergido: medición sobrestimada</span>' : 'Flujo libre'],
            ['Caudal medido', n(h.qmed, 1) + ' L/s · ' + n(h.qmed * 3.6, 1) + ' m³/h'],
            ['Error frente al caudal real', (Math.abs(err) < 0.05 ? '0,0' : (err > 0 ? '+' : '') + n(err, 1)) + ' %'],
            ['Señal 4–20 mA (0–' + n(p.qmax, 0) + ' L/s)', n(mA, 2) + ' mA'],
            ['Totalizador', n(SE.tot, 2) + ' m³']
          ];
          if (rebalse) filas.push(['Alerta', '<span class="warn">Ha supera la altura de la canaleta</span>']);
          $('lect').innerHTML = filas.map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>'; }).join('');
          $('eq').innerHTML = 'Q = K · Ha<sup>n</sup> con K = ' + n(kSI(p), 4) + ' y n = ' + n(p.n, 3) + ' (Q en m³/s, Ha en m). H0 = ' + n(h.h0 * 10, 0) + ' mm es la distancia del sensor a la cresta.';
          pantalla.userData.dibujar(n(h.qmed, 1) + ' L/s', 'Σ ' + n(SE.tot, 1) + ' m3', 'Ha ' + n(h.ha * 1000, 0) + ' mm  ' + n(mA, 1) + ' mA');
        },
        tick: function (dt) {
          if (!lect) return;
          SE.tot += lect.qmed / 1000 * dt * SE.vel; acum += dt;
          if (acum > 0.25) { acum = 0; sim.pintar(); }
        }
      };
      return { root: root, partes: partes, sim: sim };
    }
    V['parshall-us'] = function () { return parshall(false); };
    V['parshall-pozo'] = function () { return parshall(true); };

    // ── Interfaz ─────────────────────────────────────────────────────────────────────
    var $ = function (id) { return document.getElementById(id); };
    var estado = { v: DEF.variantes[0], etiquetas: true, explotar: false, giro: false };
    var modelo = null, partes = [], etiquetas = [], ex = 0, exObj = 0, simAct = null, tPrev = 0;

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function construir() {
      if (modelo) { scene.remove(modelo); etiquetas.forEach(function (l) { l.element.remove(); }); }
      var r = V[estado.v.m]();
      modelo = r.root; partes = r.partes; etiquetas = []; simAct = r.sim || null;
      $('simSec').hidden = !simAct; if (simAct) $('sim').innerHTML = simAct.html;
      modelo.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      partes.forEach(function (p) {
        var obj = p[3]; if (obj && obj !== modelo && !obj.parent) modelo.add(obj);
        obj.userData.base = obj.position.clone(); obj.userData.vec = new THREE.Vector3(p[4][0], p[4][1], p[4][2]);
        var el = document.createElement('div'); el.className = 'tag'; el.innerHTML = '<b>' + p[0] + '</b><span>' + esc(p[1]) + '</span>';
        var lab = new L.CSS2DObject(el); lab.userData.base = new THREE.Vector3(p[5][0], p[5][1], p[5][2]); lab.userData.vec = obj.userData.vec; modelo.add(lab);
        etiquetas.push(lab);
      });
      scene.add(modelo);
      etiquetas.forEach(function (l) { l.visible = estado.etiquetas; });
      encuadrar();
      pintarPanel();
      if (simAct) simAct.montar();
    }
    function encuadrar() {
      partes.forEach(function (p) { p[3].position.copy(p[3].userData.base); });
      var box3 = new THREE.Box3().setFromObject(modelo);
      var c = box3.getCenter(new THREE.Vector3()), r = box3.getSize(new THREE.Vector3()).length() / 2;
      var dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (estado.v.zoom || 1);
      var cd = estado.v.cam || [0.65, 0.42, 1], dir = new THREE.Vector3(cd[0], cd[1], cd[2]).normalize();
      controls.target.copy(c); camera.position.copy(c).addScaledVector(dir, dist);
      camera.near = Math.max(0.5, dist / 60); camera.far = dist * 20; camera.updateProjectionMatrix();
      controls.minDistance = r * 0.25; controls.maxDistance = dist * 3; controls.update();
      ground.position.y = Math.min(0, box3.min.y) - 0.2;
      aplicarSeparacion();
    }
    function aplicarSeparacion() { partes.forEach(function (p) { p[3].position.copy(p[3].userData.base).addScaledVector(p[3].userData.vec, ex); }); etiquetas.forEach(function (l) { l.position.copy(l.userData.base).addScaledVector(l.userData.vec, ex); }); }
    function pintarPanel() {
      var v = estado.v;
      $('vCode').textContent = v.c; $('vName').textContent = v.t;
      $('desc').textContent = v.d;
      $('bom').innerHTML = partes.map(function (p) { return '<li><b>' + p[0] + '</b><span>' + esc(p[1]) + '</span><em>' + p[2] + '</em></li>'; }).join('');
      $('notas').innerHTML = (v.n || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      Array.prototype.forEach.call($('types').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === v.c)); });
    }
    $('types').innerHTML = DEF.variantes.map(function (v) { return '<button type="button" class="type" data-c="' + v.c + '" aria-pressed="false">' + esc(v.t) + ' <small>' + v.c + '</small></button>'; }).join('');
    $('types').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; estado.v = DEF.variantes.filter(function (v) { return v.c === b.dataset.c; })[0]; construir(); });
    function sw(id, k, fn) { var b = $(id); b.addEventListener('click', function () { estado[k] = !estado[k]; b.setAttribute('aria-pressed', String(estado[k])); fn && fn(); }); b.setAttribute('aria-pressed', String(estado[k])); }
    sw('tLabels', 'etiquetas', function () { etiquetas.forEach(function (l) { l.visible = estado.etiquetas; }); });
    sw('tExplode', 'explotar');
    sw('tSpin', 'giro', function () { controls.autoRotate = estado.giro; });
    $('reset').addEventListener('click', encuadrar);

    // Tema, tamaño y bucle
    function tema() { scene.background = new THREE.Color(css('--stage') || '#E2E7ED'); }
    tema();
    var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', tema);
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); labelRenderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loop(ts) {
      var dt = tPrev ? Math.min(0.1, (ts - tPrev) / 1000) : 0; tPrev = ts || 0;
      if (simAct && simAct.tick) simAct.tick(dt);
      var meta = estado.explotar ? 1 : 0;
      if (Math.abs(ex - meta) > 0.001) { ex += (meta - ex) * (reduce ? 1 : 0.12); aplicarSeparacion(); }
      modelo && modelo.traverse(function (o) { if (o.userData.flecha) { o.userData.t = ((o.userData.t || 0) + 0.6) % 60; o.position.x = (o.userData.x0 === undefined ? (o.userData.x0 = o.position.x) : o.userData.x0) + (reduce ? 0 : o.userData.t); } });
      controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    resize(); construir(); requestAnimationFrame(loop);
    new ResizeObserver(resize).observe(stage);
  }

  // ── Catálogo de visores ─────────────────────────────────────────────────────────────
  var CAT = [
    { id: 'eq-temperatura', num: '17', tab: 'ic', titulo: 'Temperatura', sub: 'Termopozo, elemento y transmisor en cabezal o remoto, e interruptor de temperatura.', variantes: [
      { c: '17-A', t: 'Transmisor en cabezal', m: 'temp-cabezal', d: 'Termopozo bridado de barra perforada en boquilla de la tubería, elemento RTD o termocupla y transmisor montado en el cabezal.', n: ['Verificar el cálculo de frecuencia de estela del termopozo (ASME PTC 19.3 TW).', 'Longitud de inserción entre 1/3 y 1/2 del diámetro interior.', 'Conduit con dren en el punto bajo.'] },
      { c: '17-B', t: 'Transmisor remoto en pedestal', m: 'temp-remoto', d: 'Elemento con cabezal de conexiones en la tubería y transmisor remoto en pedestal accesible, unido con cable de extensión.', n: ['Cable de extensión del mismo tipo de la termocupla (IEC 60584-3) o 4 hilos para RTD.', 'Pedestal accesible desde piso o plataforma.'] },
      { c: '17-C', t: 'Interruptor de temperatura', m: 'temp-switch', d: 'Interruptor de temperatura con termopozo roscado para alarmas de alta temperatura.', n: ['Ajustar el punto de operación y la banda muerta en terreno.'] }] },
    { id: 'eq-flujo2', num: '18', tab: 'ic', titulo: 'Flujómetros vortex y térmico', sub: 'Vortex con tramos rectos y másico térmico de inserción con válvula en caliente.', variantes: [
      { c: '18-A', t: 'Vortex en línea', m: 'vortex', d: 'Medidor vortex bridado con transmisor integrado, con los tramos rectos marcados aguas arriba y aguas abajo.', n: ['Mínimo 10 DN aguas arriba y 5 DN aguas abajo.', 'Diámetro interior del medidor igual al de la tubería.'] },
      { c: '18-B', t: 'Térmico de inserción', m: 'termico', d: 'Sonda de dispersión térmica insertada por válvula de bola (hot tap) en tubería de aire o gas.', n: ['Sonda en el eje de la tubería, orientada según la flecha de flujo.', 'Tramos rectos según el fabricante.'] }] },
    { id: 'eq-nivel2', num: '19', tab: 'ic', titulo: 'Nivel ultrasónico y vibratorio', sub: 'Sensor ultrasónico con transmisor remoto e interruptores vibratorios de alto y bajo nivel.', variantes: [
      { c: '19-A', t: 'Ultrasónico con transmisor remoto', m: 'ultrasonico', d: 'Sensor ultrasónico en soporte sobre el estanque, fuera de la zona muerta, con transmisor remoto en pedestal y protección solar.', n: ['El haz no debe tocar paredes, escaleras ni la entrada de alimentación.', 'Respetar la zona muerta indicada por el fabricante.'] },
      { c: '19-B', t: 'Interruptores vibratorios', m: 'vibratorio', d: 'Horquillas vibratorias en montaje lateral para alto y bajo nivel.', n: ['Horquilla con las paletas en posición vertical para que escurra el líquido.'] }] },
    { id: 'eq-presion-sw', num: '20', tab: 'ic', titulo: 'Interruptor de presión', sub: 'Toma con válvulas de bloqueo y purga e interruptor de presión.', variantes: [
      { c: '20-A', t: 'Interruptor en toma de proceso', m: 'presion-sw', d: 'Interruptor de presión sobre la toma con válvula de bloqueo y válvula de purga.', n: ['Instalar sobre la tubería en líquidos limpios y gases; en pulpa usar sello de diafragma.'] }] },
    { id: 'eq-analizadores', num: '21', tab: 'ic', titulo: 'Analizadores y densímetro no nuclear', sub: 'Conductividad, turbidez, ORP, detección de gases, densímetro no nuclear y visión de espuma.', variantes: [
      { c: '21-A', t: 'Conductividad en línea', m: 'conductividad', d: 'Sensor toroidal en te bridada de la tubería con transmisor en pedestal.', n: ['El toroide debe quedar completamente sumergido y con holgura a la pared.'] },
      { c: '21-B', t: 'Turbidez por inmersión', m: 'turbidez', d: 'Sensor óptico con limpieza automática en tubo de inmersión sobre el estanque o canal.', n: ['Evitar burbujas y luz directa sobre la ventana óptica.'] },
      { c: '21-C', t: 'ORP por inmersión', m: 'orp', d: 'Electrodo de ORP en tubo de inmersión con transmisor remoto.', n: ['Mantener el electrodo húmedo; considerar acceso para limpieza y calibración.'] },
      { c: '21-D', t: 'Detector de gases', m: 'gases', d: 'Detector fijo de gases en muro con baliza y alarma local.', n: ['Altura según el gas: bajo para gases más densos que el aire (H2S, SO2), alto para gases livianos.'] },
      { c: '21-E', t: 'Densímetro no nuclear', m: 'densimetro', d: 'Sensor no invasivo abrazado a la tubería de pulpa con transmisor y caja de conexiones.', n: ['Considerar los pesos dinámicos en el soporte.'] },
      { c: '21-F', t: 'Visión de espuma', m: 'espuma', d: 'Cámara de visión sobre el labio de rebalse de la celda de flotación con tablero de terreno.', n: ['Cámara perpendicular a la espuma y protegida de salpicaduras.'] }] },
    { id: 'eq-solenoide', num: '22', tab: 'ic', titulo: 'Válvula solenoide y tablero neumático', sub: 'Solenoide de proceso con válvulas de aislamiento y tablero de electroválvulas.', variantes: [
      { c: '22-A', t: 'Solenoide de proceso', m: 'solenoide', d: 'Válvula solenoide de 2 vías normalmente cerrada con válvulas de aislamiento para mantenimiento.', n: ['Respetar la flecha de flujo del cuerpo.', 'Bobina hacia arriba.'] },
      { c: '22-B', t: 'Tablero de control neumático', m: 'tablero-neumatico', d: 'Tablero con bloque de electroválvulas, unidad de mantenimiento de aire y tubing hacia las válvulas.', n: ['Dejar 20 % de electroválvulas de reserva.', 'Tubing con pendiente y soportado cada 1 m.'] }] },
    { id: 'eq-correa', num: '23', tab: 'ic', titulo: 'Protecciones de correa', sub: 'Desalineamiento, velocidad cero, interruptor tilt e interruptores de contrapeso.', variantes: [
      { c: '23-A', t: 'Desalineamiento', m: 'desalineamiento', d: 'Par de interruptores de desalineamiento en los bordes de la correa.', n: ['Alarma a 10° y detención a 20°.', 'Pares en cabeza, cola y cada 150 m en correas largas.'] },
      { c: '23-B', t: 'Velocidad cero', m: 'velocidad-cero', d: 'Sensor inductivo frente a un disco blanco en el eje de la polea de cola, con receptor en pedestal.', n: ['Distancia sensor–blanco según el fabricante.', 'Agregar sensor en la polea motriz para detectar resbalamiento.'] },
      { c: '23-C', t: 'Interruptor tilt', m: 'tilt', d: 'Sonda tilt colgante en el chute para detectar atollos.', n: ['Ubicar la sonda donde el material la incline al acumularse.'] },
      { c: '23-D', t: 'Contrapeso', m: 'contrapeso', d: 'Interruptores de posición alta y baja del contrapeso del tensor.', n: ['Coordinar las posiciones con el diseño mecánico de la correa.'] }] },
    { id: 'eq-parshall', num: '24', tab: 'ic', titulo: 'Canaleta Parshall', sub: 'Medición de flujo en canal abierto con nivel ultrasónico o radar y totalizador.', variantes: [
      { c: '24-A', t: 'Sensor ultrasónico sobre la canaleta', m: 'parshall-us', cam: [-0.7, 1.4, 1], zoom: 0.72, d: 'Canaleta Parshall con sensor ultrasónico sobre el punto de medición Ha y transmisor que calcula el caudal con la curva Q = K·Ha^n y lo totaliza. Cambia el ancho de garganta, el caudal y el nivel aguas abajo para ver la medición, la señal 4–20 mA y el efecto de la sumergencia.', n: ['Medir Ha a 2/3 de la longitud de la pared convergente (A) aguas arriba de la cresta (ISO 9826 / ASTM D1941).', 'Piso de la sección convergente nivelado en ambos sentidos; el cero del transmisor es la cota de la cresta.', 'Canal de aproximación recto, sin oleaje ni turbulencia y con velocidad baja.', 'Verificar que Hb/Ha no supere el límite de sumergencia (60 % en 6"–9", 70 % en 1–8 pies); si lo supera, medir Hb y corregir.', 'Sensor fuera de su zona muerta, con protección solar y sin espuma bajo el haz.'] },
      { c: '24-B', t: 'Sensor radar sobre pozo de calma', m: 'parshall-pozo', cam: [-0.7, 1.4, 1], zoom: 0.72, d: 'El nivel se mide en un pozo de calma conectado a la pared de la canaleta en el punto Ha, útil con oleaje, espuma o viento. Usa la misma simulación de caudal y totalizador.', n: ['Tubo de conexión al ras de la pared interior y a la altura del piso de la sección convergente.', 'Válvula para limpiar sedimentos del tubo y del pozo.', 'Pozo con protección contra heladas si corresponde.'] }] },
    { id: 'eq-plc', num: 'CP', tab: 'tb', titulo: 'Gabinete PLC y E/S remotas', sub: 'Gabinete de control con PLC, fuentes redundantes y borneras, y E/S remotas en terreno.', variantes: [
      { c: 'CP-A', t: 'Gabinete de control en sala', m: 'gabinete-plc', d: 'Gabinete autosoportado con PLC, módulos de E/S, fuentes redundantes, switch, canaletas y borneras.', n: ['Reserva de 20 % en E/S y borneras.', 'Llenado de canaletas ≤ 40 %.'] },
      { c: 'CP-B', t: 'E/S remotas en terreno', m: 'rio-terreno', d: 'Gabinete NEMA 4X en estructura de terreno con techo de protección solar y prensaestopas.', n: ['Entradas de cables solo por la parte inferior.'] }] },
    { id: 'eq-comunicaciones', num: 'COM', tab: 'fo', titulo: 'Gabinete de comunicaciones y caja de conexión', sub: 'Rack de 42 U con switches, ODF y NVR, y caja de conexión de terreno.', variantes: [
      { c: 'COM-A', t: 'Rack de comunicaciones', m: 'rack', d: 'Gabinete rack de 42 U con switches, ODF, NVR, PDU y conexión a la malla de tierra.', n: ['Dejar 30 % de espacio libre.', 'Anclaje a piso apto para sismo.'] },
      { c: 'COM-B', t: 'Caja de conexión de terreno', m: 'jb', d: 'Caja de acero inoxidable con borneras, barra de tierra de pantallas y cable multipar a la sala de control.', n: ['Pantallas a tierra solo en el lado de la sala de control.'] }] },
    { id: 'eq-cctv', num: 'CCTV', tab: 'se', titulo: 'Cámaras de CCTV', sub: 'Cámara PTZ en poste con tablero de terreno y cámara fija en muro.', variantes: [
      { c: 'CCTV-A', t: 'Cámara PTZ en poste', m: 'cctv-ptz', d: 'Cámara domo PTZ en poste con brazo, tablero de terreno con switch PoE, punta captora y puesta a tierra.', n: ['Altura y ubicación según el objetivo de observación (IEC 62676-4).', 'Puesta a tierra del poste y protección contra descargas.'] },
      { c: 'CCTV-B', t: 'Cámara fija en muro', m: 'cctv-fija', d: 'Cámara bullet en soporte de muro con caja de conexiones y cable PoE en conduit.', n: ['Evitar contraluz directa en el campo de visión.'] }] },
    { id: 'eq-acceso', num: 'ACS', tab: 'se', titulo: 'Control de acceso', sub: 'Puerta controlada con lector, electroimán y pulsadores, y torniquetes de portería.', variantes: [
      { c: 'ACS-A', t: 'Puerta controlada', m: 'puerta', d: 'Puerta con lector OSDP, electroimán de falla segura, sensor de puerta, pulsador de salida, pulsador de emergencia y controlador.', n: ['Puertas de evacuación: falla segura y liberación por alarma de incendio.', 'Lector a 1,1–1,2 m del piso.'] },
      { c: 'ACS-B', t: 'Torniquetes de portería', m: 'torniquete', d: 'Torniquetes de cuerpo completo con lectores de entrada y salida, pictogramas y techo.', n: ['Considerar paso libre ante corte de energía cuando sea vía de evacuación.'] }] },
    { id: 'eq-intercom', num: 'ICS', tab: 'se', titulo: 'Intercomunicador industrial', sub: 'Intercomunicador IP en pedestal con baliza y parlante para áreas ruidosas.', variantes: [
      { c: 'ICS-A', t: 'Intercomunicador en pedestal', m: 'intercom', d: 'Intercomunicador IP manos libres con techo, baliza de llamada y parlante bocina.', n: ['Nivel de audio sobre el ruido del área; inteligibilidad STI ≥ 0,5.'] }] }
  ];

  var ESTILO = ':root{--bg:#EDF1F5;--panel:#FFFFFF;--fg:#0B1A2B;--muted:#4A5868;--line:#D3DAE2;--brand:#034488;--brand-fg:#fff;--brand-muted:#B9C6D4;--accent:#EF5A05;--accent-ink:#B4430A;--stage:#E2E7ED;--chip:#F2F5F8;' +
    '--f-display:"Barlow Condensed","Arial Narrow",sans-serif;--f-body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#08121E;--panel:#0F1D2D;--fg:#E6ECF2;--muted:#9DABB9;--line:#24384D;--brand:#022A55;--brand-muted:#9DB0C4;--accent:#FF7A2E;--accent-ink:#FF9A5C;--stage:#0C1724;--chip:#142538;color-scheme:dark}}' +
    'html,body{height:100%;margin:0}body{background:var(--bg);color:var(--fg);font-family:var(--f-body);font-size:14px}[hidden]{display:none!important}' +
    '.app{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr)}' +
    'header{background:var(--brand);color:var(--brand-fg);padding:12px max(16px,env(safe-area-inset-right)) 12px max(16px,env(safe-area-inset-left));border-bottom:4px solid var(--accent);display:flex;align-items:center;gap:16px;flex-wrap:wrap}' +
    '.brand{font-family:var(--f-display);font-weight:700;font-size:22px}.brand span{color:var(--accent)}.sep{width:2px;height:30px;background:#34506E}' +
    'header h1{margin:0;font-family:var(--f-display);font-style:italic;font-weight:800;font-size:28px;line-height:1}.howto{margin-left:auto;font-size:13px;color:var(--brand-muted)}' +
    'main{display:grid;grid-template-columns:minmax(0,1fr) 370px;min-height:0}.stage{position:relative;min-height:0;background:var(--stage);overflow:hidden}' +
    '.stage canvas{display:block;width:100%;height:100%;touch-action:none}.stage canvas:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}.labels{position:absolute;inset:0;pointer-events:none}' +
    '.badge{position:absolute;top:14px;left:14px;z-index:2;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 12px;display:flex;align-items:baseline;gap:10px;box-shadow:0 2px 8px rgba(0,20,40,.08)}' +
    '.badge b{font-family:var(--f-mono);font-size:15px;color:var(--accent-ink)}.badge span{font-weight:600}' +
    '.tag{font:600 12px var(--f-body);background:var(--panel);color:var(--fg);border:1.5px solid var(--line);border-radius:999px;padding:3px 10px 3px 4px;white-space:nowrap;display:flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(0,20,40,.12);transform:translateY(-14px)}' +
    '.tag b{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font:700 11px var(--f-mono)}' +
    'aside{background:var(--panel);border-left:1px solid var(--line);overflow:auto;padding:16px 18px 24px;display:flex;flex-direction:column;gap:16px}' +
    'h2{margin:0 0 8px;font:600 12px var(--f-mono);text-transform:uppercase;letter-spacing:1px;color:var(--accent-ink)}' +
    '.types{display:flex;flex-direction:column;gap:6px}.type{text-align:left;font:600 14px var(--f-body);background:var(--chip);color:var(--fg);border:1.5px solid var(--line);border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;justify-content:space-between;gap:8px;min-height:44px;align-items:center}' +
    '.type small{font:600 12px var(--f-mono);color:var(--muted)}.type[aria-pressed="true"]{border-color:var(--accent);background:var(--panel)}.type:focus-visible,.tg:focus-visible,#reset:focus-visible{outline:3px solid var(--accent);outline-offset:2px}' +
    'p.desc{margin:0;line-height:1.5;color:var(--muted)}ol.bom{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}' +
    'ol.bom li{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line)}ol.bom b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font:700 11px var(--f-mono)}ol.bom em{font:600 12px var(--f-mono);font-style:normal;color:var(--muted)}' +
    'ul.notas{margin:0;padding-left:18px;line-height:1.5;color:var(--fg)}.toggles{display:flex;flex-wrap:wrap;gap:6px}' +
    '.tg,#reset{font:600 13px var(--f-body);background:transparent;color:var(--fg);border:1.5px solid var(--line);border-radius:8px;padding:8px 12px;cursor:pointer;min-height:40px}.tg[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}' +
    '.foot{font-size:12px;color:var(--muted);line-height:1.5}' +
    '.simg{display:flex;flex-direction:column;gap:10px}.simg label{display:grid;grid-template-columns:1fr auto;gap:4px 8px;font-weight:600;font-size:13px;align-items:center}' +
    '.simg input,.simg select{grid-column:1/-1;width:100%;font:14px var(--f-body);accent-color:var(--accent)}.simg select{min-height:36px;border:1.5px solid var(--line);border-radius:6px;background:var(--chip);color:var(--fg);padding:4px 8px}' +
    '.simg output{font:600 13px var(--f-mono);color:var(--accent-ink)}dl.lect{display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin:12px 0 8px;font-size:13px}' +
    'dl.lect dt{color:var(--muted)}dl.lect dd{margin:0;font:600 13px var(--f-mono);text-align:right}.warn{color:#c0392b;font-family:var(--f-body)}p.eq{margin:0 0 10px;font-size:12px;line-height:1.5;color:var(--muted)}' +
    '@media (max-width:820px){.tag span{display:none}.tag{padding:3px}main{grid-template-columns:1fr;grid-template-rows:minmax(320px,55vh) auto}aside{border-left:0;border-top:1px solid var(--line)}.howto{display:none}}';

  function htmlVisor(def) {
    var datos = JSON.stringify(CAT);
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<title>Visor 3D ' + def.titulo + '</title>\n<style>' + ESTILO + '</style>\n</head>\n<body>\n<div class="app">\n<header><div class="brand">Rey<span>Engi</span></div><div class="sep" aria-hidden="true"></div>' +
      '<h1>' + def.titulo + '</h1><div class="howto">Arrastra para girar · rueda para acercar · clic derecho para desplazar</div></header>\n' +
      '<main><div class="stage" id="stage"><div class="badge" aria-live="polite"><b id="vCode"></b><span id="vName"></span></div></div>\n' +
      '<aside><section><h2>Montaje</h2><div class="types" id="types"></div></section>' +
      '<section><p class="desc" id="desc"></p></section>' +
      '<section><h2>Vista</h2><div class="toggles"><button type="button" class="tg" id="tLabels">Etiquetas</button><button type="button" class="tg" id="tExplode">Separar piezas</button><button type="button" class="tg" id="tSpin">Girar</button><button type="button" id="reset">Restablecer vista</button></div></section>' +
      '<section id="simSec" hidden><h2>Simulación y variables</h2><div id="sim"></div></section>' +
      '<section><h2>Componentes</h2><ol class="bom" id="bom"></ol></section>' +
      '<section><h2>Notas de montaje</h2><ul class="notas" id="notas"></ul></section>' +
      '<p class="foot">Modelo referencial con proporciones aproximadas (1 u = 1 cm). Usa “Hoja de datos”, “Especificación técnica” y “Exportar 3D” en la barra superior.</p></aside></main>\n</div>\n' +
      '<script>/*__LIB__*/<\/script>\n<script>\n(' + MOTOR.toString() + ')(' + JSON.stringify(def.id) + ', ' + datos + ');\n<\/script>\n</body>\n</html>';
  }

  window.__EQ_CATALOGO = CAT;
  if (window.__VIEWERS) {
    CAT.forEach(function (def) {
      if (window.__VIEWERS.some(function (v) { return v.id === def.id; })) return;
      window.__VIEWERS.push({ id: def.id, title: 'Visor 3D ' + def.titulo, html: htmlVisor(def) });
    });
  }
})();
