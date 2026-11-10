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
    function estanque(R, H) {
      var g = G(tubo(R, H, mats.tank, 0, H / 2, 0, 'y'), cyl(R, 1, mats.tank, 0, 0.5, 0, 'y'), cyl(R * 0.98, H * 0.55, mats.liquid, 0, H * 0.275, 0, 'y'));
      var bar = G(); for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; bar.add(cyl(0.8, 30, mats.yellow, Math.cos(a) * (R - 2), H + 15, Math.sin(a) * (R - 2), 'y', 8)); }
      bar.add(M(new THREE.TorusGeometry(R - 2, 0.8, 8, 64).rotateX(Math.PI / 2), mats.yellow, 0, H + 30, 0)); g.add(bar);
      g.add(M(new THREE.TorusGeometry(R, 1.5, 8, 64).rotateX(Math.PI / 2), mats.galv, 0, H, 0));
      return g;
    }
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

    // ── Componentes con proporciones de hojas de datos de fabricantes (cm) ──
    // Bridas ASME B16.5 clase 150 [OD, círculo de pernos, n° pernos, espesor, cara realzada] y OD de cañería ASME B36.10
    var DN_OD = { 0.5: 2.13, 0.75: 2.67, 1: 3.34, 1.5: 4.83, 2: 6.03, 3: 8.89, 4: 11.43, 6: 16.83, 8: 21.91, 10: 27.3, 12: 32.39 };
    var B150 = { 0.5: [8.89, 6.05, 4, 1.11, 3.49], 1: [10.8, 7.94, 4, 1.43, 5.08], 1.5: [12.7, 9.86, 4, 1.75, 7.3], 2: [15.24, 12.07, 4, 1.9, 9.2], 3: [19.05, 15.24, 4, 2.38, 12.7],
      4: [22.86, 19.05, 8, 2.38, 15.7], 6: [27.94, 24.13, 8, 2.54, 21.6], 8: [34.29, 29.85, 8, 2.86, 27], 10: [40.64, 36.2, 12, 3.02, 32.4], 12: [48.26, 43.18, 12, 3.18, 38.1] };
    var mAlu = std(0x8d9caa, 0.7, 0.38), mBronce = std(0xc79a3f, 0.85, 0.35), mPA = std(0x2b3036, 0.1, 0.65), mPc = std(0xd3d8dc, 0.05, 0.45), mRojo = std(0xa8221c, 0.3, 0.45), mFdu = std(0x9aa3ab, 0.1, 0.5);
    function pos(o, x, y, z) { o.position.set(x || 0, y || 0, z || 0); return o; }
    function vertical(o) { o.rotation.z = Math.PI / 2; return o; } // pieza armada sobre +x llevada a +y
    function orient(o, eje) { // la pieza se arma sobre +y; orient la gira hacia el eje pedido
      if (eje === 'x') o.rotation.z = -Math.PI / 2; else if (eje === '-x') o.rotation.z = Math.PI / 2;
      else if (eje === 'z') o.rotation.x = Math.PI / 2; else if (eje === '-z') o.rotation.x = -Math.PI / 2; else if (eje === '-y') o.rotation.x = Math.PI;
      return o;
    }
    function hexN(af, h, mat, y) { return cyl(af / Math.sqrt(3), h, mat, 0, y || 0, 0, 'y', 6); } // hexágono definido entre caras
    function rosca(r, h, y0) { var g = G(cyl(r, h, mats.steel, 0, y0 + h / 2, 0, 'y')); for (var i = 0.25; i < h; i += 0.32) g.add(M(new THREE.TorusGeometry(r, 0.07, 6, 24).rotateX(Math.PI / 2), mats.steel, 0, y0 + i, 0)); return g; }
    function bridaB(dn, conCuello) { // brida B16.5 cl. 150: cara realzada hacia +y, cuello soldable hacia −y
      var b = B150[dn] || B150[2], od = DN_OD[dn] || 6.03, g = G(cyl(b[0] / 2, b[3], mats.flange, 0, -b[3] / 2, 0, 'y'), cyl(b[4] / 2, 0.16, mats.flange, 0, 0.08, 0, 'y'));
      if (conCuello !== false) g.add(cone(Math.min(b[4] / 2, od / 2 + 1.1), od / 2 + 0.2, b[3] * 1.5, mats.flange, 0, -b[3] * 1.75, 0));
      var rp = dn <= 1.5 ? 0.64 : dn <= 4 ? 0.8 : 0.95;
      for (var i = 0; i < b[2]; i++) {
        var a = (i + 0.5) / b[2] * Math.PI * 2, x = Math.cos(a) * b[1] / 2, z = Math.sin(a) * b[1] / 2;
        g.add(cyl(rp, b[3] + 1.4, mats.steel, x, -b[3] / 2 + 0.7, z, 'y', 10), pos(hexN(rp * 3.3, rp * 1.25, mats.steel), x, -b[3] - rp * 0.6, z));
      }
      return g;
    }
    function lineaDN(dn, largo, y, bridas) { // cañería en X con bridas de cuello en los extremos (cara hacia afuera)
      var r = (DN_OD[dn] || 6.03) / 2, g = G(tubo(r, largo, mats.pipe, 0, y, 0, 'x'));
      if (bridas !== false) g.add(pos(orient(bridaB(dn), '-x'), -largo / 2, y, 0), pos(orient(bridaB(dn), 'x'), largo / 2, y, 0));
      return g;
    }
    function boquilla(dn, alto) { // boquilla soldada con brida hacia +y; base en y = 0
      var r = (DN_OD[dn] || 4.83) / 2, b = B150[dn] || B150[1.5];
      return G(cyl(r, alto - b[3] * 2.5, mats.pipe, 0, (alto - b[3] * 2.5) / 2, 0, 'y'), pos(bridaB(dn), 0, alto, 0));
    }
    function lcdTex(lineas, w, h) { // pantalla con texto fijo
      var c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
      var x = c.getContext('2d'); x.fillStyle = '#a9dcb2'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#0d2a14';
      var fs = Math.round(c.height / (lineas.length + 0.6)); x.font = 'bold ' + fs + 'px monospace';
      lineas.forEach(function (t, i) { x.fillText(t, 10, fs * (i + 1)); });
      var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx }));
    }
    // Carcasa de campo de doble compartimiento (aluminio): tapa con visor en +z, tapa ciega en −z, cuello hacia −y, entradas ½" NPT a los lados
    function carcasaCampo(lineas) {
      var g = G(cyl(3.9, 8.6, mats.inst, 0, 0, 0, 'z'),
        cyl(4.15, 2.2, mats.inst, 0, 0, 5.3, 'z'), pos(M(new THREE.TorusGeometry(3.9, 0.3, 8, 40), mats.inst), 0, 0, 6.35), cyl(3.05, 0.25, mats.glass, 0, 0, 6.42, 'z'),
        cyl(4.15, 2.0, mats.inst, 0, 0, -5.2, 'z'), pos(M(new THREE.TorusGeometry(3.9, 0.3, 8, 40), mats.inst), 0, 0, -6.2),
        cyl(1.9, 5, mats.inst, 0, -5.8, 0, 'y'), pos(hexN(3.4, 1.4, mats.ss), 0, -8.6, 0),
        cyl(1.25, 2.4, mats.inst, 4.6, 0.8, 0, 'x'), pos(orient(hexN(2.2, 0.8, mats.steel), 'x'), 6.1, 0.8, 0),
        cyl(1.25, 2.4, mats.inst, -4.6, 0.8, 0, 'x'), box(3.4, 0.15, 2.2, mats.ss, 0, 3.95, 0), cyl(0.35, 0.8, mats.ss, 2.8, -2.6, -3.6, 'x'));
      var p = lcdTex(lineas || ['12.5 mA', 'PV 48.2'], 4.6, 2.8); p.position.set(0, 0, 6.3); g.add(p);
      return g;
    }
    // Cabezal DIN B de aluminio (Ø 80 mm) con tapa roscada y prensaestopas M20; base en y = 0
    function cabezaDIN() {
      return G(cyl(1.6, 1.4, mAlu, 0, 0.7, 0, 'y'), cyl(4, 4.2, mAlu, 0, 3.5, 0, 'y'), cyl(4.1, 1.3, mAlu, 0, 6.2, 0, 'y'),
        cyl(1.0, 2.2, mPA, 4.6, 3.4, 0, 'x'), pos(orient(hexN(2.4, 0.8, mPA), 'x'), 5.5, 3.4, 0), box(1.2, 0.6, 0.4, mats.steel, 0, 6.9, 0));
    }
    function cupulaDIN() { var m = M(new THREE.SphereGeometry(4.1, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), mAlu); m.scale.set(1, 0.32, 1); return m; }
    // Extensión niple–unión–niple ½" NPT de largo L sobre +y
    function cuelloNUN(L) {
      return G(cyl(1.07, L, mats.ss, 0, L / 2, 0, 'y'), pos(hexN(2.7, 1, mats.ss), 0, 0.5, 0), pos(hexN(3.3, 1.3, mats.ss), 0, L * 0.5, 0), cyl(1.95, 0.9, mats.ss, 0, L * 0.5 + 1.1, 0, 'y', 28), pos(hexN(2.7, 1, mats.ss), 0, L - 0.5, 0));
    }
    // Vaina bridada cónica (ASME PTC 19.3 TW-2016): cara de brida en y = 0 hacia −y, cuello T de 5 cm, vástago U hacia −y
    function vainaBridada(U, dn) {
      var b = B150[dn] || B150[1.5], g = G(cyl(b[0] / 2, b[3], mats.ss, 0, b[3] / 2, 0, 'y'), cyl(b[4] / 2, 0.16, mats.ss, 0, -0.08, 0, 'y'),
        cyl(1.6, 5, mats.ss, 0, b[3] + 2.5, 0, 'y'), cone(1.35, 0.95, U, mats.ss, 0, -U / 2, 0), sph(0.95, mats.ss, 0, -U, 0));
      g.userData.alto = b[3] + 5; return g;
    }
    // Vaina roscada de barra perforada ¾" NPT: hexágono en y = 0, vástago hacia −y
    function vainaRoscada(U) { return G(pos(hexN(3.2, 1.6, mats.ss), 0, 0.8, 0), cyl(1.3, 3, mats.ss, 0, 3, 0, 'y'), rosca(1.33, 1.8, -1.8), cone(1.1, 0.85, U, mats.ss, 0, -1.8 - U / 2, 0), sph(0.85, mats.ss, 0, -1.8 - U, 0)); }
    // Caja de interruptor de proceso (fundición de aluminio, conduit ¾" NPT lateral, tapa con 4 tornillos); centro en el origen
    function cajaSwitch() {
      var g = G(rbox(9.5, 15, 8.5, 0.8, mats.cab, 0, 0, 0), rbox(9.9, 15.4, 1.2, 0.6, mats.cab, 0, 0, 4.6), box(5.5, 2.8, 0.2, mats.ss, 0, 3.5, 5.25),
        cyl(1.6, 2.4, mats.cab, 5.6, 4, 0, 'x'), pos(orient(hexN(3.3, 0.9, mats.cab), 'x'), 7, 4, 0), cyl(1.4, 1.2, mats.dark, 0, 8.1, 0, 'y'));
      [[-4, -6.7], [4, -6.7], [-4, 6.7], [4, 6.7]].forEach(function (p) { g.add(cyl(0.35, 0.4, mats.steel, p[0], p[1], 5.3, 'z', 10)); });
      return g;
    }
    // Válvula de bola de ½" roscada con manilla (cuerpo en el origen, paso en x)
    function bolaRoscada(r) {
      r = r || 1.07; return G(pos(orient(hexN(r * 3.1, r * 1.6, mats.ss), 'x'), -r * 2.1, 0, 0), pos(orient(hexN(r * 3.1, r * 1.6, mats.ss), 'x'), r * 2.1, 0, 0),
        cyl(r * 1.55, r * 2.6, mats.ss, 0, 0, 0, 'x'), cyl(0.35, r * 1.6, mats.steel, 0, r * 2.2, 0, 'y'), box(r * 6.5, 0.4, 1.1, mats.red, r * 3.2, r * 3, 0));
    }
    // Manifold de 2 válvulas (bloqueo y purga) con manillas en T
    function manifold2() {
      return G(box(4.2, 6.5, 3.2, mats.ss, 0, 0, 0), cyl(0.5, 4.5, mats.ss, 0, 0, 3.8, 'z'), box(4.5, 0.6, 0.6, mats.steel, 0, 0, 6.2),
        cyl(0.5, 3.6, mats.ss, 3.6, -1.5, 0, 'x'), box(0.6, 3.6, 0.6, mats.steel, 5.5, -1.5, 0), cyl(0.5, 1.6, mats.ss, -2.6, -1.5, 0, 'x'));
    }
    // Transmisor de campo de pared (policarbonato/aluminio) con pantalla, teclas, prensaestopas inferiores, placa y techo de protección
    function transmisorPared(o) {
      o = o || {}; var w = o.w || 21.5, h = o.h || 18, d = o.d || 15.3, g = G();
      g.add(rbox(w, h, d * 0.55, 1.2, o.mat || mPc, 0, 0, -d * 0.22), rbox(w, h, d * 0.45, 1.2, o.tapa || mats.inst, 0, 0, d * 0.28));
      var pan = o.pantalla || lcdTex(o.lineas || ['FIT-101', '48.2 L/s'], w * 0.42, h * 0.26); pan.position.set(-w * 0.1, h * 0.12, d * 0.51); g.add(pan);
      for (var i = 0; i < 3; i++) g.add(cyl(0.8, 0.4, mats.dark, -w * 0.25 + i * w * 0.15, -h * 0.22, d * 0.51, 'z', 16));
      for (var j = 0; j < 4; j++) g.add(cyl(0.3, 0.2, j ? mats.dark : mats.led, w * 0.3, h * 0.25 - j * 1.4, d * 0.51, 'z', 10));
      for (var k = 0; k < (o.glands || 5); k++) g.add(cyl(0.95, 1.6, mPA, -w * 0.36 + k * (w * 0.72 / Math.max(1, (o.glands || 5) - 1)), -h / 2 - 0.8, 0, 'y', 6));
      if (o.techo !== false) { // techo de protección de acero inoxidable
        var tw = w + 1.4, th = h * 1.45, td = d * 1.27;
        g.add(box(tw, 0.3, td, mats.ss, 0, h / 2 + 2.6, td / 2 - d * 0.5 - 2.2), box(tw, th, 0.3, mats.ss, 0, h / 2 + 2.6 - th / 2, -d * 0.5 - 2.2),
          box(0.3, th * 0.55, td, mats.ss, -tw / 2, h / 2 + 2.6 - th * 0.275, td / 2 - d * 0.5 - 2.2), box(0.3, th * 0.55, td, mats.ss, tw / 2, h / 2 + 2.6 - th * 0.275, td / 2 - d * 0.5 - 2.2));
      }
      g.add(box(w * 0.98, 11, 0.4, mats.ss, 0, 0, -d * 0.5 - 1.8)); // placa de montaje en tubo
      return g;
    }
    // Abrazaderas en U a un tubo vertical de 2" (eje y), del lado −z de la placa
    function abrazaderas(x, zc, y0, sep) { var g = G(); [-1, 1].forEach(function (s) { g.add(pos(M(new THREE.TorusGeometry(3.4, 0.45, 8, 24, Math.PI).rotateX(-Math.PI / 2), mats.steel), x, y0 + s * sep / 2, zc)); }); return g; }
    // Sensor ultrasónico (Ø 72 × 110 mm, rosca G 1" en la parte superior, contratuerca de 41 mm, haz de 9°)
    function sensorUS(conTecho) {
      var g = G(cyl(3.6, 9.2, mFdu, 0, 4.6, 0, 'y'), cyl(3.4, 0.4, mats.dark, 0, 0.1, 0, 'y'), rosca(1.67, 3.2, 9.2), pos(hexN(4.1, 1.2, mPA), 0, 11.2, 0), cyl(0.5, 4, mats.black, 0, 13.8, 0, 'y'));
      if (conTecho) g.add(cyl(5.4, 0.4, mats.white, 0, 13, 0, 'y'), tubo(5.4, 6, mats.white, 0, 10, 0, 'y'));
      return g;
    }
    // Brazo voladizo de acero inoxidable con soporte de pivote (500/1000 mm) entre (x0,z0) y el sensor en (x1,z1) a la altura y
    function brazoVoladizo(x0, z0, x1, z1, y) {
      var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), g = G();
      var b = box(L + 8, 4, 4, mats.ss, (x0 + x1) / 2, y, (z0 + z1) / 2); b.rotation.y = -Math.atan2(dz, dx); g.add(b);
      g.add(box(8, 1, 8, mats.ss, x1, y - 2.5, z1), cyl(1.5, 6, mats.ss, x0, y - 3, z0, 'y'), box(10, 14, 1, mats.ss, x0, y - 6, z0));
      return g;
    }
    // Interruptor vibratorio (horquilla de 40 mm, rosca G 1", carcasa de aluminio de una cámara Ø 101 mm), montado sobre +y
    function horquillaVib() {
      var g = G(rosca(1.65, 2, 0), pos(hexN(4.1, 1.5, mats.ss), 0, 2.75, 0), cyl(1.7, 3.5, mats.ss, 0, 5.2, 0, 'y'), cyl(5.05, 7.5, mAlu, 0, 10.7, 0, 'y'),
        cyl(5.1, 2.2, mAlu, 0, 15.5, 0, 'y'), cyl(3.8, 0.6, mAlu, 0, 16.9, 0, 'y'), cyl(1.0, 2.4, mPA, 5.8, 10.8, 0, 'x'), pos(orient(hexN(2.4, 0.8, mPA), 'x'), 6.8, 10.8, 0));
      var t1 = rbox(1.7, 4, 0.3, 0.12, mats.ss, 0, -2.1, 0.55), t2 = rbox(1.7, 4, 0.3, 0.12, mats.ss, 0, -2.1, -0.55);
      g.add(cyl(1.2, 0.8, mats.ss, 0, -0.1, 0, 'y'), t1, t2);
      return g;
    }

    // ── Temperatura (vaina bridada, extensión NUN, cabezal DIN B y transmisor) ──
    function temperaturaBase(dnL) {
      var r = DN_OD[dnL] / 2, y = 90, hN = 16, yF = y + r + hN, b = B150[1.5];
      var tub = lineaDN(dnL, 220, y); tub.add(soporteTubo(-80, y, r), soporteTubo(80, y, r));
      var noz = pos(boquilla(1.5, hN), 0, y + r - 0.5, 0); // cara de brida en yF − 0.5
      var yC = yF - 0.5 + 0.16 + 0.32; // cara de la vaina sobre la empaquetadura
      var U = yC - (y + 0.15 * r), vaina = pos(vainaBridada(U, 1.5), 0, yC, 0);
      var yT = yC + vaina.userData.alto, junta = cyl(b[4] / 2, 0.3, mats.black, 0, yF - 0.5 + 0.31, 0, 'y');
      return { y: y, r: r, tub: tub, noz: noz, vaina: vaina, junta: junta, yT: yT, U: U, yC: yC };
    }
    V['temp-cabezal'] = function () {
      var t = temperaturaBase(8), L = 15, yH = t.yT + L;
      var nun = pos(cuelloNUN(L), 0, t.yT, 0), cab = G(pos(cabezaDIN(), 0, yH, 0), pos(cupulaDIN(), 0, yH + 6.85, 0));
      var elem = G(cyl(0.3, t.U + L + 8, mats.steel, 0, t.yC - t.U + (t.U + L + 8) / 2 + 0.6, 0, 'y'), cyl(2.1, 0.5, mats.cream, 0, yH + 2.4, 0, 'y'), cyl(0.5, 3, mats.steel, 0, yH + 0.9, 0, 'y'));
      var tx = G(cyl(2.2, 1.6, mats.inst, 0, yH + 3.6, 0, 'y'), box(2.4, 0.3, 1.2, mats.white, 0, yH + 4.5, 0));
      var cond = G(conduit([[6.1, yH + 3.4, 0], [20, yH + 2, 0], [36, t.y + 20, 0], [46, 70, 30], [46, 48, 60]]), caja(16, 20, 10, mats.ss, 46, 38, 66));
      var root = G(t.tub, t.noz, t.junta, t.vaina, elem, nun, cab, tx, cond, flecha(-60, t.y + t.r + 6, 0));
      return { root: root, foco: [0, t.yT, 0, 48], partes: [
        [1, 'Tubería de 8" con boquilla bridada de 1½" cl. 150', 1, G(t.tub, t.noz), [0, 0, 0], [-60, t.y, t.r]],
        [2, 'Vaina bridada cónica 1½" cl. 150 (ASME PTC 19.3 TW)', 1, t.vaina, [0, 28, 0], [0, t.yC + 4, 7]],
        [3, 'Empaquetadura espirometálica', 1, t.junta, [0, 14, 0], [7, t.yC - 0.4, 0]],
        [4, 'Extensión niple–unión–niple ½" NPT', 1, nun, [0, 46, 0], [0, t.yT + L / 2, 3]],
        [5, 'Elemento RTD Pt100 de 6 mm con resorte', 1, elem, [0, 90, 0], [0, yH + 2, 0]],
        [6, 'Transmisor de temperatura en cabezal (4–20 mA HART)', 1, tx, [0, 110, 0], [0, yH + 4.6, 2]],
        [7, 'Cabezal DIN B de aluminio con tapa roscada', 1, cab, [0, 70, 0], [0, yH + 8.5, 3]],
        [8, 'Conduit flexible y caja de conexiones', 1, cond, [40, 0, 20], [46, 50, 66]]
      ] };
    };
    V['temp-remoto'] = function () {
      var t = temperaturaBase(8), L = 15, yH = t.yT + L;
      var nun = pos(cuelloNUN(L), 0, t.yT, 0), cab = G(pos(cabezaDIN(), 0, yH, 0), pos(cupulaDIN(), 0, yH + 6.85, 0));
      var elem = G(cyl(0.3, t.U + L + 8, mats.steel, 0, t.yC - t.U + (t.U + L + 8) / 2 + 0.6, 0, 'y'), cyl(2.1, 0.5, mats.cream, 0, yH + 2.4, 0, 'y'));
      var xP = 110, zP = 75, ped = pedestal(125, xP, zP);
      var tx = pos(carcasaCampo(['TT-101', '64.3 C']), xP, 128, zP + 12); tx.rotation.y = -0.3;
      var sop = G(box(12, 14, 0.5, mats.ss, xP, 124, zP + 4), abrazaderas(xP, zP, 124, 8));
      var cable = conduit([[6.1, yH + 3.4, 0], [24, yH + 2, 0], [60, 140, 30], [xP - 6, 130, zP + 12]]);
      var root = G(t.tub, t.noz, t.junta, t.vaina, elem, nun, cab, ped, tx, sop, cable, flecha(-60, t.y + t.r + 6, 0));
      return { root: root, foco: [55, t.yT - 15, 35, 95], partes: [
        [1, 'Tubería de 8" con boquilla bridada de 1½" cl. 150', 1, G(t.tub, t.noz, t.junta), [0, 0, 0], [-60, t.y, t.r]],
        [2, 'Vaina bridada cónica 1½" cl. 150', 1, t.vaina, [0, 28, 0], [0, t.yC + 4, 7]],
        [3, 'Elemento RTD Pt100 de 4 hilos', 1, elem, [0, 80, 0], [0, yH + 2, 0]],
        [4, 'Extensión NUN y cabezal DIN B con bornera', 1, G(nun, cab), [0, 50, 0], [0, yH + 8.5, 3]],
        [5, 'Transmisor de campo de doble compartimiento', 1, tx, [25, 15, 15], [xP, 138, zP + 12]],
        [6, 'Soporte con abrazaderas en U para tubo de 2"', 1, sop, [25, 0, 0], [xP + 8, 118, zP + 4]],
        [7, 'Pedestal de tubo de 2" con placa base', 1, ped, [25, 0, 0], [xP, 60, zP]],
        [8, 'Cable de extensión en conduit flexible', 1, cable, [15, 20, 0], [56, 140, 28]]
      ] };
    };
    V['temp-switch'] = function () {
      var dn = 3, r = DN_OD[dn] / 2, y = 90, root = G();
      var tub = lineaDN(dn, 180, y); tub.add(soporteTubo(-60, y, r), soporteTubo(60, y, r));
      var cpl = G(cyl(1.9, 2.5, mats.pipe, 0, y + r + 0.6, 0, 'y'), pos(hexN(4.2, 2, mats.pipe), 0, y + r + 2, 0)); // coupling ¾" NPT
      var yv = y + r + 3, vaina = pos(vainaRoscada(r + 1.2), 0, yv, 0);
      var sw = G(pos(cajaSwitch(), 0, yv + 16, 0), cyl(1.3, 4, mats.ss, 0, yv + 6.5, 0, 'y'), pos(hexN(2.7, 1, mats.ss), 0, yv + 4.6, 0));
      var cond = conduit([[7.5, yv + 20, 0], [22, yv + 18, 0], [30, 60, 20], [30, 20, 40]]);
      root.add(tub, cpl, vaina, sw, cond, flecha(-45, y + r + 6, 0));
      return { root: root, foco: [0, yv + 10, 0, 38], partes: [[1, 'Tubería de 3" con copla ¾" NPT', 1, G(tub, cpl), [0, 0, 0], [-50, y, r]], [2, 'Vaina roscada de barra perforada ¾" NPT', 1, vaina, [0, 25, 0], [0, yv + 2, 3]],
        [3, 'Interruptor de temperatura de bulbo rígido (TSH)', 1, sw, [0, 50, 0], [0, yv + 25, 0]], [4, 'Conduit flexible ¾"', 1, cond, [25, 0, 0], [30, 60, 20]]] };
    };

    // ── Vortex bridado 3" (Rosemount 8800D: largo cara a cara ≈ 234 mm cl. 150, carcasa Ø 78 mm sobre tubo soporte) ──
    V['vortex'] = function () {
      var dn = 3, r = DN_OD[dn] / 2, b = B150[dn], y = 80, A = 23.4, Lup = 10 * 7.8, Ldn = 5 * 7.8, root = G();
      var aguas = G(lineaDN(dn, Lup, y)); aguas.position.x = -A / 2 - Lup / 2 - 0.3; aguas.add(soporteTubo(-Lup / 2 + 12, y, r));
      var abajo = G(lineaDN(dn, Ldn, y)); abajo.position.x = A / 2 + Ldn / 2 + 0.3;
      var extra1 = G(lineaDN(dn, 60, y)); extra1.position.x = -A / 2 - Lup - 30.6; extra1.add(soporteTubo(0, y, r));
      var extra2 = G(lineaDN(dn, 40, y)); extra2.position.x = A / 2 + Ldn + 20.6; extra2.add(soporteTubo(0, y, r));
      var cuerpo = G(cyl(r + 0.9, A - 2 * b[3], mats.ss, 0, y, 0, 'x'), pos(orient(G(cyl(b[0] / 2, b[3], mats.ss, 0, -b[3] / 2, 0, 'y')), '-x'), -A / 2, y, 0),
        pos(orient(G(cyl(b[0] / 2, b[3], mats.ss, 0, -b[3] / 2, 0, 'y')), 'x'), A / 2, y, 0), box(1.2, 1.4, 2 * r - 0.6, mats.ss, -1.5, y, 0)); // barra generadora horizontal
      // Tubo soporte y carcasa hacia el costado (+z): barra generadora en plano horizontal, recomendado para líquidos
      var zs = r + 0.9, cab = G(cyl(1.6, 12, mats.ss, 0, y, zs + 6, 'z'));
      var hz = G(carcasaCampo(['FT-201', '96.5 m3/h'])); hz.children[0].rotation.x = Math.PI / 2; hz.rotation.z = Math.PI / 2; hz.position.set(0, y, zs + 12 + 8.6);
      cab.add(hz);
      var gasket = G(cyl(b[4] / 2, 0.3, mats.black, -A / 2 - 0.15, y, 0, 'x'), cyl(b[4] / 2, 0.3, mats.black, A / 2 + 0.15, y, 0, 'x'));
      var tramos = G(box(Lup, 0.4, 1, mats.yellow, -A / 2 - Lup / 2, y - r - 7, r + 6), box(Ldn, 0.4, 1, mats.yellow, A / 2 + Ldn / 2, y - r - 7, r + 6));
      var cond = conduit([[0, y - 7, zs + 21.3], [-4, y - 16, zs + 24], [-26, 50, zs + 32], [-30, 20, zs + 40]]);
      root.add(aguas, abajo, extra1, extra2, cuerpo, cab, gasket, tramos, cond, flecha(-A / 2 - Lup - 40, y + r + 8, 0));
      return { root: root, foco: [0, y + 4, 10, 60], partes: [[1, 'Tramo recto aguas arriba 10 D mínimo (35 D sin corrección del factor K)', 1, aguas, [-20, 0, 0], [-A / 2 - Lup / 2, y + r + 4, 0]],
        [2, 'Tramo recto aguas abajo 5 D', 1, abajo, [20, 0, 0], [A / 2 + Ldn / 2, y + r + 4, 0]],
        [3, 'Cuerpo vortex bridado 3" cl. 150 con barra generadora', 1, cuerpo, [0, 25, 0], [0, y + b[0] / 2, 0]],
        [4, 'Empaquetaduras centradas (sin sobresalir al flujo)', 2, gasket, [0, 12, 0], [A / 2 + 1, y - b[0] / 2, 0]],
        [5, 'Transmisor integral sobre tubo soporte, girado al costado', 1, cab, [0, 0, 30], [0, y + 6, zs + 21]],
        [6, 'Conduit flexible con dren', 1, cond, [-15, 0, 20], [-26, 60, zs + 30]]] };
    };
    // ── Másico térmico de inserción con válvula de bola 1" y prensaestopas de compresión ──
    V['termico'] = function () {
      var dn = 8, r = DN_OD[dn] / 2, y = 80, root = G();
      var tub = lineaDN(dn, 240, y); tub.add(soporteTubo(-90, y, r), soporteTubo(90, y, r));
      var base = y + r;
      var hot = G(cyl(2.2, 3, mats.pipe, 0, base + 1, 0, 'y'), pos(hexN(4.4, 2, mats.pipe), 0, base + 3, 0), pos(vertical(bolaRoscada(1.67)), 0, base + 8.5, 0),
        cyl(1.67, 3, mats.ss, 0, base + 14.5, 0, 'y'), pos(hexN(3.6, 2.4, mats.ss), 0, base + 17, 0), pos(hexN(2.9, 1.6, mats.ss), 0, base + 19, 0));
      var sonda = G(cyl(0.95, base + 40 - y, mats.ss, 0, (base + 40 + y) / 2, 0, 'y'), cyl(0.95, 3, mats.ss, 0, y - 1.5, 0, 'y'), cyl(0.25, 3, mats.steel, 0.4, y - 4, 0, 'y'), cyl(0.25, 3, mats.steel, -0.4, y - 4, 0, 'y'));
      var tx = pos(carcasaCampo(['FT-301', '612 Nm3/h']), 0, base + 49, 0);
      var cadena = camino([[0, base + 38, 1], [3, base + 28, 3], [2, base + 19, 2]], 0.25, mats.steel);
      var cond = conduit([[-6.4, base + 49.8, 0], [-18, base + 48, 0], [-40, 70, 30], [-40, 20, 50]]);
      root.add(tub, hot, sonda, tx, cadena, cond, flecha(-70, base + 6, 0));
      return { root: root, foco: [0, base + 18, 0, 52], partes: [[1, 'Tubería de aire de 8" con copla 1" NPT', 1, tub, [0, 0, 0], [-80, y, r]],
        [2, 'Válvula de bola 1" de paso total y prensaestopas de compresión', 1, hot, [0, 15, 12], [0, base + 9, 4]],
        [3, 'Sonda de dispersión térmica Ø 19 mm en el eje de la tubería', 1, sonda, [0, 48, 0], [0, y + 6, 2]],
        [4, 'Transmisor integral de doble compartimiento', 1, tx, [0, 70, 0], [0, base + 55, 0]],
        [5, 'Cadena de retención de la sonda', 1, cadena, [0, 30, 15], [3, base + 30, 4]],
        [6, 'Conduit flexible', 1, cond, [-20, 0, 20], [-40, 70, 30]]] };
    };

    // ── Nivel ultrasónico (sensor Ø 72 mm, distancia de bloqueo 0,3 m, brazo voladizo) y vibratorio (horquilla 40 mm) ──
    V['ultrasonico'] = function () {
      var R = 90, H = 200, root = G(), est = estanque(R, H);
      var xs = R - 2 * R / 6, yS = H + 26; // a 1/6 del diámetro desde la pared
      var brazo = brazoVoladizo(R + 6, 0, xs, 0, yS + 14), piv = G(box(4, 30, 4, mats.ss, R + 6, H + 8, 0), box(10, 10, 1, mats.ss, R + 2, H - 3, 0));
      var sensor = pos(sensorUS(true), xs, yS, 0);
      var cono = M(new THREE.ConeGeometry(Math.tan(4.5 * Math.PI / 180) * (yS - H * 0.55), yS - H * 0.55, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xef5a05, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }), xs, (yS + H * 0.55) / 2, 0);
      var bloqueo = M(new THREE.CylinderGeometry(4.5, 4.5, 30, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xc0392b, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }), xs, yS - 15, 0);
      var xT = R + 60, tx = pos(transmisorPared({ lineas: ['LIT-401', '1.12 m'] }), xT, 140, 13.3);
      var ped = G(pedestal(160, xT, 0), abrazaderas(xT, 0, 140, 8));
      var cable = conduit([[xs, yS + 14, 0], [xs + 20, yS + 20, 2], [R + 20, H + 24, 2], [xT - 6, 160, 4], [xT - 6, 128, 10]]);
      root.add(est, brazo, piv, sensor, cono, bloqueo, tx, ped, cable);
      return { root: root, foco: [R * 0.55, H - 10, 0, 140], partes: [[1, 'Estanque', 1, est, [0, 0, 0], [-R, H * 0.6, 0]],
        [2, 'Sensor ultrasónico G 1" con techo de protección', 1, sensor, [0, 40, 0], [xs, yS + 16, 6]],
        [3, 'Brazo voladizo de acero inoxidable 1000 mm con pivote', 1, G(brazo, piv), [0, 25, 0], [R - 10, yS + 18, 3]],
        [4, 'Distancia de bloqueo 0,3 m (nivel máximo bajo esta zona)', 1, bloqueo, [0, 0, 0], [xs, yS - 30, 6]],
        [5, 'Transmisor de pared con techo de protección', 1, tx, [40, 0, 20], [xT, 160, 12]],
        [6, 'Pedestal de tubo de 2" con abrazaderas', 1, ped, [40, 0, 0], [xT, 70, 0]],
        [7, 'Cable del sensor en conduit', 1, cable, [20, 20, 0], [R + 25, H + 26, 2]]] };
    };
    V['vibratorio'] = function () {
      var R = 70, H = 220, root = G(), est = estanque(R, H);
      function punto(yb) {
        var cpl = G(cyl(2.5, 2.5, mats.ss, R + 0.2, yb, 0, 'x')), sw = horquillaVib();
        sw.rotation.z = -Math.PI / 2; sw.position.set(R + 1, yb, 0); // carcasa afuera, horquilla hacia −x (dentro del estanque); paletas verticales
        return { cpl: cpl, sw: sw };
      }
      var a = punto(H * 0.85), b = punto(H * 0.2);
      var c1 = conduit([[R + 11.8, H * 0.85 - 7.6, 0], [R + 24, H * 0.8, 0], [R + 30, 60, 10], [R + 30, 10, 20]]), c2 = conduit([[R + 11.8, H * 0.2 - 7.6, 0], [R + 24, 40, 4], [R + 30, 10, 20]]);
      root.add(est, a.cpl, a.sw, b.cpl, b.sw, c1, c2);
      return { root: root, partes: [[1, 'Estanque con coplas soldadas G 1"', 1, G(est, a.cpl, b.cpl), [0, 0, 0], [-R, H * 0.6, 0]],
        [2, 'Interruptor vibratorio de alto nivel (LSH), paletas verticales', 1, a.sw, [35, 0, 0], [R + 11, H * 0.85 + 9, 0]],
        [3, 'Interruptor vibratorio de bajo nivel (LSL)', 1, b.sw, [35, 0, 0], [R + 11, H * 0.2 + 9, 0]], [4, 'Conduit flexible', 2, G(c1, c2), [25, 0, 0], [R + 30, 60, 10]]] };
    };

    // ── Interruptor de presión con válvula raíz y manifold de 2 válvulas ──
    V['presion-sw'] = function () {
      var dn = 3, r = DN_OD[dn] / 2, y = 90, root = G();
      var tub = lineaDN(dn, 180, y); tub.add(soporteTubo(-60, y, r), soporteTubo(60, y, r));
      var b = y + r, toma = G(cyl(1.4, 2, mats.pipe, 0, b + 0.6, 0, 'y'), pos(hexN(3.2, 1.6, mats.pipe), 0, b + 1.8, 0), cyl(1.07, 4, mats.ss, 0, b + 4.5, 0, 'y'),
        pos(vertical(bolaRoscada()), 0, b + 9, 0), cyl(1.07, 3, mats.ss, 0, b + 13.5, 0, 'y'));
      var man = pos(manifold2(), 0, b + 18.5, 0);
      var sw = G(pos(cajaSwitch(), 0, b + 33, 0), cyl(3.2, 3.2, mats.ss, 0, b + 24.4, 0, 'y'), cyl(0.7, 2.5, mats.ss, 0, b + 22, 0, 'y'));
      var cond = conduit([[7.5, b + 37, 0], [24, b + 35, 0], [34, 60, 20], [34, 20, 40]]);
      root.add(tub, toma, man, sw, cond, flecha(-45, b + 6, 0));
      return { root: root, foco: [0, b + 20, 0, 36], partes: [[1, 'Tubería de proceso de 3"', 1, tub, [0, 0, 0], [-50, y, r]], [2, 'Copla ½" NPT y válvula raíz de bola', 1, toma, [0, 12, 0], [0, b + 9, 4]],
        [3, 'Manifold de 2 válvulas (bloqueo y purga)', 1, man, [0, 25, 0], [5, b + 19, 4]], [4, 'Interruptor de presión con elemento de diafragma (PSH / PSL)', 1, sw, [0, 45, 0], [0, b + 42, 0]],
        [5, 'Conduit flexible ¾"', 1, cond, [25, 0, 0], [34, 60, 20]]] };
    };

    // ── Analizadores: transmisor de pared con techo de protección y sensores con portasondas ──
    function txAnalisis(xT, zT, lineas) {
      var tx = pos(transmisorPared({ w: 19.4, h: 23.7, d: 16.8, lineas: lineas, glands: 6 }), xT, 140, zT + 14);
      var ped = G(pedestal(165, xT, zT), abrazaderas(xT, zT, 140, 10));
      return { tx: tx, ped: ped };
    }
    V['conductividad'] = function () {
      var dn = 4, r = DN_OD[dn] / 2, y = 80, root = G();
      var tub = lineaDN(dn, 200, y); tub.add(soporteTubo(-75, y, r), soporteTubo(75, y, r));
      var noz = pos(boquilla(2, 12), 0, y + r - 0.5, 0), yF = y + r + 11.5;
      var sensor = G(pos(orient(G(cyl(B150[2][0] / 2, 1.9, mats.ss, 0, 0.95, 0, 'y')), '-y'), 0, yF + 2.3, 0), cyl(1.9, yF - y + 1, mPA, 0, (yF + y) / 2, 0, 'y'),
        pos(M(new THREE.TorusGeometry(2.6, 1.3, 14, 32).rotateY(Math.PI / 2), mPA), 0, y - 1.5, 0), cyl(1.4, 4, mats.ss, 0, yF + 4.3, 0, 'y'), pos(hexN(2.6, 1, mPA), 0, yF + 6.5, 0));
      var t = txAnalisis(95, 70, ['AIT-501', '1.85 mS/cm']);
      var cable = camino([[0, yF + 7, 0], [6, yF + 14, 4], [50, 130, 50], [88, 128, 80]], 0.45, mats.black);
      root.add(tub, noz, sensor, t.tx, t.ped, cable, flecha(-60, y + r + 6, 0));
      return { root: root, foco: [40, y + 25, 35, 90], partes: [[1, 'Tubería de 4" con boquilla bridada 2"', 1, G(tub, noz), [0, 0, 0], [-70, y, r]],
        [2, 'Sensor toroidal (inductivo) con brida 2", toroide dentro del flujo', 1, sensor, [0, 35, 0], [0, yF + 6, 4]],
        [3, 'Transmisor de análisis con techo de protección', 1, t.tx, [30, 0, 0], [95, 156, 84]], [4, 'Pedestal de 2" con abrazaderas', 1, t.ped, [30, 0, 0], [95, 70, 70]],
        [5, 'Cable fijo del sensor', 1, cable, [20, 20, 0], [30, 116, 30]]] };
    };
    // Portasondas pendular: tubo de inmersión Ø 40 mm colgado de la baranda con abrazadera cruzada
    function portasondas(R, H, sensor) {
      var x0 = R - 4, ang = 0.22, Lt = 170, g = G();
      var tubo1 = G(cyl(2, Lt, mats.ss, 0, -Lt / 2, 0, 'y'));
      tubo1.add(pos(sensor, 0, -Lt, 0));
      tubo1.position.set(x0 - 2, H + 30, 0); tubo1.rotation.z = -ang;
      var abr = G(box(6, 6, 6, mats.ss, x0 - 2, H + 30, 0), cyl(1, 30, mats.ss, x0 - 2, H + 30, 0, 'z'), box(4, 3, 4, mats.ss, x0 - 2, H + 30, 6), box(4, 3, 4, mats.ss, x0 - 2, H + 30, -6));
      g.add(tubo1, abr);
      return { g: g, tubo: tubo1, abr: abr, punta: new THREE.Vector3(x0 - 2 - Math.sin(ang) * Lt, H + 30 - Math.cos(ang) * Lt, 0) };
    }
    function analizadorInmersion(nombre, sensor, lineas) {
      var R = 80, H = 160, root = G(), est = estanque(R, H), ps = portasondas(R, H, sensor);
      var t = txAnalisis(R + 55, 0, lineas);
      var cable = camino([[R - 2, H + 32, 0], [R + 10, H + 40, 0], [R + 40, 160, 4], [R + 52, 132, 12]], 0.45, mats.black);
      root.add(est, ps.g, t.tx, t.ped, cable);
      return { root: root, partes: [[1, 'Estanque / cajón', 1, est, [0, 0, 0], [-R, H * 0.6, 0]], [2, nombre, 1, ps.tubo, [0, 50, 0], [ps.punta.x, ps.punta.y + 6, 5]],
        [3, 'Portasondas pendular con abrazadera cruzada a la baranda', 1, ps.abr, [0, 30, 0], [R - 6, H + 36, 6]],
        [4, 'Transmisor de análisis con techo de protección', 1, t.tx, [40, 0, 0], [R + 55, 156, 10]], [5, 'Pedestal de 2" con abrazaderas', 1, t.ped, [40, 0, 0], [R + 55, 70, 0]],
        [6, 'Cable fijo del sensor', 1, cable, [20, 20, 0], [R + 25, H + 40, 0]]] };
    }
    V['turbidez'] = function () { // sensor óptico Ø 60 mm con limpiador
      return analizadorInmersion('Sensor de turbidez Ø 60 mm con limpiador automático', G(cyl(3, 18, mats.ss, 0, -9, 0, 'y'), cyl(3.05, 0.6, mPA, 0, -17.6, 0, 'y'), box(0.4, 0.6, 5, mPA, 0, -18.2, 0)), ['AIT-502', '12.4 FNU']);
    };
    V['orp'] = function () { // electrodo Ø 12 mm en tubo de inmersión con canastillo de protección
      var cana = G(cyl(1.8, 4, mats.ss, 0, -2, 0, 'y'), cyl(0.6, 12, mats.glass, 0, -8, 0, 'y'), cyl(0.5, 1, mats.ss, 0, -14, 0, 'y'));
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; cana.add(cyl(0.18, 12, mats.ss, Math.cos(a) * 1.8, -10, Math.sin(a) * 1.8, 'y', 6)); }
      cana.add(M(new THREE.TorusGeometry(1.8, 0.2, 6, 24).rotateX(Math.PI / 2), mats.ss, 0, -16, 0));
      return analizadorInmersion('Electrodo de ORP Ø 12 mm con canastillo de protección', cana, ['AIT-503', '+412 mV']);
    };
    // Detector de gases fijo (≈ 280 × 150 × 130 mm), sensor hacia abajo con protector contra salpicaduras
    V['gases'] = function () {
      var root = G(), pared = G(muro(300, 280, 0, -8), losa(300, 160, 0, 60)), yD = 45;
      var det = G(rbox(28, 15, 10, 1.5, mats.white, 0, 0, 0), rbox(22, 11, 0.6, 0.5, mats.dark, 0, 0.5, 5.2), cyl(2.8, 6, mPA, 0, -10.5, 0, 'y'), cyl(3.2, 3, mats.dark, 0, -15, 0, 'y'),
        box(5, 3, 0.2, mats.lcd, -4, 1.5, 5.6), cyl(0.4, 0.3, mats.led, 4, 2.5, 5.6, 'z'), cyl(0.4, 0.3, mats.yellow, 6, 2.5, 5.6, 'z'), cyl(0.4, 0.3, mats.red, 8, 2.5, 5.6, 'z'),
        cyl(1.3, 3, mats.white, 15.5, -2, 0, 'x'), box(30, 17, 0.5, mats.ss, 0, 0, -5.4));
      det.position.set(-60, yD, 6);
      var baliza = G(cyl(5, 8, mats.dark, 0, 0, 0, 'y'), cyl(4.6, 9, mats.red, 0, 8, 0, 'y'), box(10, 2, 6, mats.dark, 0, -5, -3)); baliza.position.set(60, 220, 8);
      var caja2 = caja(20, 24, 12, mats.cab, 60, 150, 6);
      var cond = G(conduit([[-44, yD - 2, 6], [-30, yD + 10, 4], [-20, 150, 4], [48, 150, 4]]), conduit([[60, 164, 6], [60, 205, 6]]));
      root.add(pared, det, baliza, caja2, cond);
      return { root: root, foco: [-10, 120, 0, 160], partes: [[1, 'Muro de la sala / área', 1, pared, [0, 0, 0], [-120, 200, 0]], [2, 'Detector fijo de gases a 30–60 cm del piso (gases más densos que el aire)', 1, det, [0, 0, 30], [-60, yD + 12, 12]],
        [3, 'Baliza y alarma audible local', 1, baliza, [0, 0, 30], [60, 230, 12]], [4, 'Caja de conexiones', 1, caja2, [0, 0, 30], [60, 162, 12]], [5, 'Conduit ¾" NPT', 1, cond, [0, 0, 20], [-20, 150, 6]]] };
    };

    // ── Válvula solenoide ½" (cuerpo de bronce 71 × 61 mm, alto 106 mm, bobina con hub ½" NPT) con filtro Y y uniones ──
    V['solenoide'] = function () {
      var r = 1.07, y = 90, root = G();
      var tub = G(tubo(r, 200, mats.pipe, 0, y, 0, 'x')); tub.add(soporteTubo(-80, y, r), soporteTubo(80, y, r));
      var v1 = pos(bolaRoscada(), -45, y, 0), v2 = pos(bolaRoscada(), 45, y, 0);
      var filtro = G(cyl(1.8, 6, mBronce, -26, y, 0, 'x'), cyl(1.4, 6, mBronce, -26, y - 3, 1.2, 'y'), pos(hexN(3, 1, mBronce), -26, y - 6.2, 1.2)); filtro.children[1].rotation.x = 0.6;
      var uniones = G(); [-14, 14].forEach(function (x) { uniones.add(pos(orient(hexN(3.3, 1.4, mBronce), 'x'), x - 1, y, 0), cyl(1.95, 1, mBronce, x + 0.4, y, 0, 'x', 28)); });
      var sol = G(rbox(7.1, 3.6, 6.1, 0.5, mBronce, 0, y, 0), pos(orient(hexN(2.9, 1.2, mBronce), 'x'), -4.1, y, 0), pos(orient(hexN(2.9, 1.2, mBronce), 'x'), 4.1, y, 0),
        cyl(1.8, 1.8, mBronce, 0, y + 2.7, 0, 'y'), cyl(1.0, 2.2, mats.ss, 0, y + 4.6, 0, 'y'), rbox(5.4, 5.6, 5.4, 0.6, mRojo, 0, y + 7.5, 0), cyl(1.3, 2, mRojo, 3.4, y + 8.3, 0, 'x'), box(2.4, 0.6, 2.4, mats.dark, 0, y + 10.5, 0));
      var cond = conduit([[4.4, y + 8.3, 0], [14, y + 10, 0], [26, 60, 30], [28, 20, 44]]);
      root.add(tub, v1, v2, filtro, uniones, sol, cond, flecha(-75, y + 6, 0));
      return { root: root, foco: [0, y + 3, 0, 42], partes: [[1, 'Línea ½" de agua de sello / servicio', 1, tub, [0, 0, 0], [-70, y, r]], [2, 'Válvulas de bola de aislamiento', 2, G(v1, v2), [0, 12, 0], [-45, y + 6, 2]],
        [3, 'Filtro Y aguas arriba de la solenoide', 1, filtro, [0, -12, 0], [-26, y - 8, 2]], [4, 'Uniones para desmontaje', 2, uniones, [0, 8, 0], [14, y + 4, 2]],
        [5, 'Válvula solenoide 2/2 NC, cuerpo de bronce', 1, sol, [0, 25, 0], [0, y + 4, 4]], [6, 'Conduit flexible a la bobina (hub ½" NPT)', 1, cond, [15, 10, 10], [20, 70, 30]]] };
    };

    // ── Desalineamiento: interruptor con rodillo vertical a 50–75 mm del borde de la correa ──
    V['desalineamiento'] = function () {
      var root = G(), cv = correa(360);
      function par(s) { // s = +1 lado +z, −1 lado −z
        var zc = s * 92, g = G(rbox(12, 18, 11, 1, mats.yellow, 0, 100, zc), box(13, 1.2, 12, mats.yellow, 0, 109.6, zc), cyl(1.4, 4, mats.ss, 0, 113, zc, 'y'),
          box(2, 2, 16, mats.ss, 0, 115, zc - s * 7), cyl(0.8, 20, mats.steel, 0, 124, zc - s * 15, 'y'), cyl(3.2, 15, mats.rubber, 0, 126, zc - s * 15, 'y'),
          box(4, 30, 16, mats.galv, 0, 82, zc + s * 2), box(1, 2, 1, mats.dark, 6.2, 104, zc));
        return g;
      }
      var p1 = par(1), p2 = par(-1);
      var cond = G(conduit([[0, 96, 98], [0, 60, 104], [40, 20, 114]]), conduit([[0, 96, -98], [0, 60, -104], [40, 20, -114]]));
      root.add(cv, p1, p2, cond);
      return { root: root, foco: [0, 112, 70, 62], partes: [[1, 'Correa transportadora (estación de polines)', 1, cv, [0, 0, 0], [-160, 120, 0]], [2, 'Interruptor de desalineamiento con rodillo vertical, lado izquierdo', 1, p1, [0, 0, 40], [0, 136, 77]],
        [3, 'Interruptor de desalineamiento, lado derecho', 1, p2, [0, 0, -40], [0, 136, -77]], [4, 'Conduit flexible', 2, cond, [0, -10, 0], [40, 40, 110]]] };
    };

    // ── Contrapeso: interruptores de límite de servicio pesado con palanca y rodillo ──
    V['contrapeso'] = function () {
      var root = G();
      var torre = G(box(10, 400, 10, mats.galv, -60, 200, -60), box(10, 400, 10, mats.galv, 60, 200, -60), box(10, 400, 10, mats.galv, -60, 200, 60), box(10, 400, 10, mats.galv, 60, 200, 60), box(130, 10, 130, mats.galv, 0, 400, 0));
      var peso = G(box(100, 80, 60, mats.concrete, 0, 200, 0), box(108, 6, 66, mats.galv, 0, 243, 0), cyl(30, 70, mats.steel, 0, 280, 0, 'z'), box(4, 10, 4, mats.galv, 52, 240, 0), box(30, 3, 3, mats.galv, 66, 240, 0));
      function sw(y) {
        return G(rbox(6.5, 11, 6, 0.6, mats.yellow, 82, y, 0), cyl(2, 2, mats.dark, 82, y + 6.2, 0, 'y'), box(1.2, 14, 1.2, mats.steel, 82, y + 7, 3.6), cyl(2.4, 1.8, mats.rubber, 82, y + 13.5, 4.6, 'z'),
          box(10, 22, 1, mats.galv, 82, y, -3.5), box(16, 4, 4, mats.galv, 73, y, -3.5));
      }
      var alto = sw(330), bajo = sw(140);
      var cond = conduit([[85.5, 136, 0], [88, 200, 0], [88, 326, 0], [90, 360, 30], [96, 380, 80]]);
      root.add(torre, peso, alto, bajo, cond);
      return { root: root, foco: [60, 240, 0, 150], partes: [[1, 'Torre del tensor', 1, torre, [0, 0, 0], [-60, 380, 60]], [2, 'Contrapeso con leva de accionamiento', 1, peso, [0, 0, 0], [0, 200, 32]],
        [3, 'Interruptor de límite de posición alta (ZSH) con palanca y rodillo', 1, alto, [30, 0, 0], [82, 346, 4]], [4, 'Interruptor de límite de posición baja (ZSL)', 1, bajo, [30, 0, 0], [82, 156, 4]], [5, 'Conduit', 1, cond, [20, 0, 0], [88, 250, 0]]] };
    };

    // ── Cámara PTZ (domo ≈ Ø 23 × 33 cm) con montaje colgante, adaptador de poste y caja de conexiones ──
    V['cctv-ptz'] = function () {
      var root = G(), yB = 560;
      var poste = G(cone(6, 9, 600, mats.galv, 0, 300, 0), box(50, 3, 50, mats.galv, 0, 1.5, 0), box(80, 30, 80, mats.concrete, 0, -15, 0), box(20, 30, 1, mats.galv, 0, 30, 9));
      for (var i = 0; i < 4; i++) poste.add(cyl(1.2, 8, mats.steel, (i % 2 ? 1 : -1) * 20, 4, (i < 2 ? 1 : -1) * 20, 'y', 8));
      var adapt = G(); [-8, 8].forEach(function (dy) { adapt.add(pos(M(new THREE.TorusGeometry(6.6, 0.6, 8, 32).rotateX(Math.PI / 2), mats.ss), 0, yB + dy, 0)); });
      adapt.add(box(14, 26, 2, mats.white, 0, yB, 7.5));
      var brazo = G(cyl(2.4, 34, mats.white, 0, yB + 6, 25, 'z'), cyl(3.4, 4, mats.white, 0, yB + 4, 43, 'y'), sph(3, mats.white, 0, yB + 6, 42), cyl(2.4, 14, mats.white, 0, yB - 4, 43, 'y'));
      var cam = G(cyl(11, 2, mats.white, 0, 0, 0, 'y'), cyl(10.5, 10, mats.white, 0, -6, 0, 'y'), M(new THREE.SphereGeometry(9, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.glass, 0, -11, 0),
        M(new THREE.SphereGeometry(8.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.dark, 0, -11, 0), cyl(2.3, 3, mats.black, 0, -15, 5, 'z'), cyl(12.5, 0.8, mats.white, 0, 1.4, 0, 'y'));
      cam.position.set(0, yB - 12, 43);
      var jb = caja(26, 32, 14, mats.ss, 0, 175, 16);
      var cond = G(conduit([[0, 191, 12], [0, 400, 8.5], [0, yB - 14, 8.5]]), conduit([[0, 159, 12], [0, 60, 10], [0, 30, 10]]));
      var punta = G(cyl(0.6, 80, mats.ss, 0, 640, 0, 'y')), tierra1 = tierra(30, 30);
      root.add(poste, adapt, brazo, cam, jb, cond, punta, tierra1);
      return { root: root, foco: [0, yB - 10, 25, 75], partes: [[1, 'Poste cónico galvanizado con placa base y fundación', 1, poste, [0, 0, 0], [0, 300, 8]], [2, 'Adaptador de poste con zunchos de acero inoxidable', 1, adapt, [0, 0, 20], [0, yB + 16, 10]],
        [3, 'Brazo de montaje colgante', 1, brazo, [0, 20, 30], [0, yB + 12, 30]], [4, 'Cámara domo PTZ IP66 con parasol', 1, cam, [0, 15, 60], [0, yB - 30, 43]],
        [5, 'Caja de terreno CCTV (switch PoE, protección contra sobretensiones)', 1, jb, [0, 0, 40], [0, 196, 24]], [6, 'Conduit de señal y alimentación', 2, cond, [20, 0, 0], [0, 400, 12]],
        [7, 'Punta captora y puesta a tierra', 1, G(punta, tierra1), [0, 20, 0], [0, 660, 0]]] };
    };

    // ── Puerta controlada: lector 84 × 122 × 28 mm, electroimán 600 lb con placa de armadura, pulsadores normalizados ──
    V['puerta'] = function () {
      var root = G(), pared = G(box(130, 260, 15, mats.wall, -135, 130, 0), box(130, 260, 15, mats.wall, 135, 130, 0), box(140, 40, 15, mats.wall, 0, 240, 0), losa(400, 240, 0, 40));
      var marco = G(box(6, 220, 18, mats.dark, -73, 110, 0), box(6, 220, 18, mats.dark, 73, 110, 0), box(152, 6, 18, mats.dark, 0, 223, 0));
      var hoja = G(box(140, 214, 5, mats.housing, 70, 0, 0), box(4, 14, 4, mats.ss, 128, 0, 4), box(18, 6.1, 1.3, mats.ss, 116, 99, 3.2), box(30, 4, 4, mats.dark, 40, 102, -6)); hoja.position.set(-70, 109, 0); hoja.rotation.y = -0.45;
      var iman = G(box(26.6, 6.8, 4.1, mats.ss, 0, 0, 0), box(26, 0.4, 3.9, mats.dark, 0, -3.5, 0), box(30, 2, 6, mats.ss, 0, 4, -1)); iman.position.set(47, 216.5, -11);
      var lector = G(rbox(8.4, 12.2, 2.8, 0.8, mats.black, 0, 0, 0), box(5.6, 5.6, 0.3, mats.dark, 0, 1.6, 1.45), box(4, 0.6, 0.3, mats.led, 0, -4.4, 1.45)); lector.position.set(95, 110, 9);
      var salida = G(rbox(7, 11.5, 2, 0.5, mats.ss, 0, 0, 0), cyl(2.2, 1.2, mats.green, 0, 0.5, 1.3, 'z'), box(4.5, 1, 0.2, mats.white, 0, -3.8, 1.05)); salida.position.set(95, 110, -8.5); salida.rotation.y = Math.PI;
      var emergencia = G(rbox(8.8, 8.8, 4.5, 0.5, mats.green, 0, 0, 0), box(6.2, 6.2, 0.3, mats.white, 0, 0, 2.3)); emergencia.position.set(95, 125, -9.8); emergencia.rotation.y = Math.PI;
      var sensor = G(cyl(1, 2.5, mats.white, 0, 0, 0, 'y')); sensor.position.set(60, 221, 0);
      var ctrl = G(caja(30, 36, 10, mats.cab, 0, 0, 0)); ctrl.position.set(110, 230, -16);
      var cond = conduit([[110, 212, -16], [110, 200, -9], [95, 117, -9]]);
      root.add(pared, marco, hoja, iman, lector, salida, emergencia, sensor, ctrl, cond);
      return { root: root, partes: [[1, 'Muro y marco de puerta', 1, G(pared, marco), [0, 0, 0], [-150, 250, 10]], [2, 'Hoja de puerta con cierrapuertas y placa de armadura', 1, hoja, [0, 0, 30], [-40, 160, 30]],
        [3, 'Electroimán de 600 lb de falla segura en el dintel', 1, iman, [0, 15, -20], [47, 214, -14]], [4, 'Sensor magnético de puerta embutido', 1, sensor, [0, 20, 20], [60, 226, 4]],
        [5, 'Lector de credenciales 13,56 MHz (OSDP), a 1,1 m', 1, lector, [20, 0, 20], [95, 120, 12]], [6, 'Pulsador de salida (lado interior)', 1, salida, [20, 0, -20], [95, 104, -12]],
        [7, 'Pulsador de liberación de emergencia verde', 1, emergencia, [20, 0, -20], [95, 133, -14]], [8, 'Controlador de acceso con batería', 1, ctrl, [20, 0, -30], [110, 252, -20]], [9, 'Conduit', 1, cond, [10, 0, -10], [106, 170, -9]]] };
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
        : pos(sensorUS(true), xw, ys, zs);
      var zPost = (conPozo ? zPozo : -(hwm + t)) - 22;
      var soporte = conPozo ? G(pedestal(ys + 20, xw, zPost), box(5, 5, Math.abs(zPost - zs) + 8, mats.galv, xw, ys + 20, (zPost + zs) / 2))
        : G(pedestal(ys + 8, xw, zPost), brazoVoladizo(xw, zPost, xw, zs, ys + 14));
      var haz = M(new THREE.ConeGeometry(1, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xef5a05, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
      var pozo = null, aguaPozo = null;
      if (conPozo) {
        aguaPozo = cyl(14, 1, mAgua, xw, 0, zPozo, 'y'); aguaPozo.castShadow = false; aguaPozo.userData.scope = 'agua';
        pozo = G(tubo(15, E + 30, mats.tank, xw, yc - 15 + (E + 30) / 2, zPozo, 'y'), cyl(15, 2, mats.concrete, xw, yc - 15, zPozo, 'y'),
          cyl(2.5, -zPozo - hwm, mats.pipe, xw, yc + 4, (zPozo - hwm) / 2, 'z'), valvulaBola(2, xw, yc + 4, -(hwm + t + 8), 'z'));
      }
      var xT = xw + 90, zT = zPost - 30;
      var pantalla = lcd(); pantalla.scale.set(0.75, 0.75, 1);
      var tx = pos(transmisorPared({ pantalla: pantalla }), xT, 140, zT + 13.3);
      var pedT = G(pedestal(160, xT, zT), abrazaderas(xT, zT, 140, 8));
      var cable = conduit([[xw, ys + 15, zs], [xw, ys + 28, zs - 6], [xw + 10, ys + 24, zPost], [xT - 10, 150, zT + 6], [xT - 6, 128, zT + 13]]);
      var root = G(canal, canaleta, agua, regla, sensor, soporte, haz, tx, pedT, cable, flecha(-B - Lap + 30, yc + p.hmax * 100 + 12, 0));
      if (pozo) root.add(pozo, aguaPozo);
      var partes = [
        [1, 'Canal de aproximación con tramo recto', 1, canal, [0, 0, 0], [-B - Lap / 2, yc + E + 6, p.D / 2]],
        [2, 'Canaleta Parshall de ' + SE.w + ' (convergente, garganta, divergente)', 1, canaleta, [0, -10, 0], [F + LG / 2, yc + E + 8, p.C / 2]],
        [3, 'Punto de medición Ha (2/3 de A) con regla limnimétrica', 1, regla, [0, 0, -20], [xm - 25, yc + E + 4, -hwm]],
        [4, conPozo ? 'Sensor radar sobre el pozo de calma' : 'Sensor ultrasónico G 1" con techo, sobre el punto Ha', 1, sensor, [0, 30, 0], [xw, ys + 40, zs]],
        [5, 'Transmisor de flujo con curva Parshall, totalizador y techo de protección', 1, tx, [30, 0, 30], [xT, 178, zT]],
        [6, conPozo ? 'Soporte del sensor y pedestal del transmisor' : 'Brazo voladizo inoxidable y pedestales', 2, G(soporte, pedT), [0, 0, 30], [xw - 10, 40, zPost]],
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

    // ── Válvula modulada con actuador de diafragma (plano típico 4600029931-03360-002AT-00008) ──
    // Proporciones de referencia: globo 2" ASME cl. 150 (cara a cara 267 mm, ISA-75.08.01) con actuador de diafragma
    // de resorte tamaño 30 (área efectiva 297 cm², carrera 19 mm, rango 0,2–1,0 bar), convertidor I/P en el yugo.
    var SV = { mA: 12, accion: 'ato', car: 'eqp', dp: 2, cv: 46, falla: false };
    function valvulaDiafragma() {
      var y = 70, root = G(), od = DN_OD[2], r = od / 2, ff = 26.7, fh = ff / 2;
      var mCuerpo = std(0x55606b, 0.65, 0.42), mAct = std(0x2c5ea8, 0.35, 0.45), mTub = std(0xc9d0d6, 0.95, 0.25);
      // Cañería por piping, con bridas de cuello enfrentadas a la válvula
      var lin = G(tubo(r, 70, mats.pipe, -fh - 0.2 - 35 - 1.9, y, 0, 'x'), tubo(r, 70, mats.pipe, fh + 0.2 + 35 + 1.9, y, 0, 'x'),
        pos(orient(bridaB(2), 'x'), -fh - 0.2, y, 0), pos(orient(bridaB(2), '-x'), fh + 0.2, y, 0), soporteTubo(-80, y, r), soporteTubo(80, y, r));
      // Cuerpo de globo con bridas integrales y bonete
      var cuerpo = G(pos(orient(bridaB(2, false), '-x'), -fh, y, 0), pos(orient(bridaB(2, false), 'x'), fh, y, 0),
        cyl(r + 0.3, ff - 2 * 1.9, mCuerpo, 0, y, 0, 'x'));
      var bulbo = sph(7.2, mCuerpo, 0, y, 0); bulbo.scale.set(1.25, 1, 1); cuerpo.add(bulbo);
      cuerpo.add(cyl(5.4, 1.6, mCuerpo, 0, y + 7.6, 0, 'y'), cyl(4.6, 3.4, mCuerpo, 0, y + 10, 0, 'y'));
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; cuerpo.add(cyl(0.45, 3.4, mats.steel, Math.cos(a) * 4.9, y + 9.6, Math.sin(a) * 4.9, 'y', 8)); }
      cuerpo.add(cyl(2.6, 6, mCuerpo, 0, y + 14.6, 0, 'y'), pos(hexN(4.4, 1.6, mats.ss), 0, y + 18.4, 0));
      // Yugo, actuador de diafragma (carcasa Ø 28,6 cm) y vástago
      var yA = y + 38, act = G();
      [-1, 1].forEach(function (s) { act.add(box(1.8, 17, 3.2, mAct, s * 5.4, y + 28.5, 0)); });
      act.add(cyl(3.6, 2, mAct, 0, y + 20.5, 0, 'y'), cyl(3.8, 2, mAct, 0, yA - 1, 0, 'y'));
      act.add(cone(13.6, 9.5, 5, mAct, 0, yA + 2.5, 0), cyl(14.3, 1.2, mAct, 0, yA + 5.6, 0, 'y'), cone(9.5, 13.6, 5, mAct, 0, yA + 8.7, 0), cyl(9.5, 1, mAct, 0, yA + 11.6, 0, 'y'));
      for (var k = 0; k < 16; k++) { var b = k / 16 * Math.PI * 2; act.add(cyl(0.35, 2.4, mats.steel, Math.cos(b) * 13.6, yA + 5.6, Math.sin(b) * 13.6, 'y', 8)); }
      act.add(cyl(0.9, 1.6, mats.steel, 0, yA + 12.9, 0, 'y'));
      var placaTag = texto('3360-PV-320', 9, 2.2, '#eef1f4'); placaTag.position.set(0, y + 33, 1.65); act.add(placaTag);
      var escala = G(box(0.4, 4.2, 1.6, mats.ss, 5.4 - 1.2, y + 24.5, 1.7)); act.add(escala);
      // Vástago con conector e indicador de carrera (se mueve con la simulación)
      var vastago = G(cyl(0.55, 18, mats.ss, 0, y + 28, 0, 'y'), box(3.2, 2.2, 2.2, mats.ss, 0, y + 24.5, 0), box(3.6, 0.3, 0.5, mats.orange, 2.4, y + 24.5, 1.7));
      vastago.userData.y0 = 0;
      // Convertidor I/P en el yugo (lado +x)
      var ip = G(rbox(7, 9, 8, 0.6, mats.cab, 0, 0, 0), box(6.6, 0.4, 7.6, mats.dark, 0, 4.7, 0));
      var et = texto('I/P', 4, 2.4, '#ffffff'); et.position.set(0, 1, 4.05); ip.add(et);
      ip.add(cyl(0.9, 1.4, mats.cab, 0, -5.2, 0, 'y'), box(1.4, 3, 3, mats.dark, -4.2, 0, 0)); // hub ½" NPT y placa de montaje
      ip.position.set(10.8, y + 27, 0);
      // Item 1: conectores rectos macho 3/8" OD × 1/4" NPT
      function conector(eje) { return orient(G(hexN(1.4, 0.7, mats.ss, 0.35), cyl(0.62, 1, mats.ss, 0, 1.2, 0, 'y'), pos(hexN(1.25, 0.6, mats.ss), 0, 1.9, 0)), eje); }
      var c1 = pos(conector('y'), 10.8, y + 31.6, 0), c2 = pos(conector('x'), 14.4, y + 27, 0), c3 = pos(conector('x'), 12.4, yA + 1.4, 0);
      var conectores = G(c1, c2, c3);
      // Item 2: tubo 3/8" OD de acero inoxidable (alimentación desde el cabezal y salida del I/P al actuador)
      var tubAlim = camino([[-75, y + 31, -3], [-30, y + 31, -3], [-27, y + 33, -3], [-26, y + 56, -3], [-23, y + 59, -3], [22, y + 59, -3], [25, y + 56, -3], [25, y + 37, -3], [22, y + 34.5, -2], [12, y + 34.5, -0.5], [10.8, y + 33.6, 0]], 0.48, mTub);
      var tubSal = camino([[16.6, y + 27, 0], [18.5, y + 27.3, 0], [19.5, y + 29, 0], [19.5, yA - 1, 0], [18.5, yA + 1.2, 0], [14.6, yA + 1.4, 0]], 0.48, mTub);
      var tubing = G(tubAlim, tubSal);
      // Items 3 a 6: conduit flexible, conectores, copla y conduit rígido hacia el gabinete RIO
      var xc = 36, zc = 10, flex = camino([[10.8, y + 20.2, 0], [10.8, y + 15, 1], [16, y + 9, 6], [28, y + 8, 10], [xc, y + 11, zc], [xc, y + 15.4, zc]], 1.25, mats.flex);
      function conFlex(yy) { return G(pos(hexN(3.3, 0.8, mats.galv), 0, yy, 0), cyl(1.6, 1.8, mats.galv, 0, yy + 1.3, 0, 'y')); }
      var cf1 = pos(orient(conFlex(0), '-y'), 10.8, y + 22.2, 0), cf2 = pos(conFlex(0), xc, y + 15.2, zc);
      var copla = cyl(1.75, 4, mats.galv, xc, y + 19.6, zc, 'y');
      var rigido = G(cyl(1.33, 100, mats.galv, xc, y + 71.6, zc, 'y'), cone(0, 2.2, 4, mats.orange, xc, y + 124, zc));
      root.add(lin, cuerpo, act, vastago, ip, conectores, tubing, flex, cf1, cf2, copla, rigido, flecha(-62, y + 6.5, 0));
      var partes = [
        [1, 'Conector recto macho 3/8" OD × 1/4" NPT, AISI 316', 3, conectores, [6, 6, 8], [16, y + 41, 2]],
        [2, 'Tubo 3/8" OD × 0,035" W.T., ASTM A269 AISI 316 (aire de instrumentos)', 'L/R', tubing, [0, 10, -10], [-26, y + 62, -3]],
        [3, 'Conduit flexible metálico revestido en PVC ¾"', 'L/R', flex, [10, -6, 10], [26, y + 4, 10]],
        [4, 'Conector recto para conduit flexible ¾"', 2, G(cf1, cf2), [10, -4, 10], [xc + 2, y + 13, zc]],
        [5, 'Copla galvanizada ¾", ANSI C80.1', 1, copla, [14, 0, 10], [xc + 2, y + 21, zc]],
        [6, 'Conduit rígido de acero galvanizado ¾", ANSI C80.1, hacia gabinete RIO', 'L/R', rigido, [18, 0, 10], [xc, y + 52, zc]],
        [7, 'Válvula globo 2" cl. 150 con bonete y empaquetadura (por proveedor)', 1, cuerpo, [0, -14, 0], [-4, y - 12, 6]],
        [8, 'Actuador de diafragma con resorte, yugo e indicador de carrera', 1, G(act, vastago), [0, 22, 0], [-16, yA + 14, 4]],
        [9, 'Convertidor I/P 4–20 mA / 0,2–1,0 bar', 1, ip, [16, 0, 12], [14, y + 28, 4]],
        [10, 'Línea de proceso bridada (por piping)', 1, lin, [0, 0, 0], [-62, y - 4, 4]]
      ];

      // ── Simulación: 4–20 mA → I/P → presión → carrera → apertura → caudal ──
      function calc() {
        var p = SV.falla ? 0 : 3 + 12 * (Math.min(20, Math.max(4, SV.mA)) - 4) / 16;  // psig
        var carrera = Math.min(1, Math.max(0, (p - 3) / 12));                         // fracción de la carrera nominal (resorte 3–15 psig)
        var ap = SV.accion === 'ato' ? carrera : 1 - carrera;                           // aire abre (falla cerrada) o aire cierra (falla abierta)
        var f = ap <= 0 ? 0 : SV.car === 'lin' ? ap : Math.pow(50, ap - 1);             // característica inherente (R = 50 en igual porcentaje)
        var cv = SV.cv * f, kv = cv * 0.865, q = kv * Math.sqrt(Math.max(0, SV.dp) / 1.0);
        return { p: p, bar: p * 0.0689476, carrera: carrera, ap: ap, cv: cv, q: q };
      }
      var sim = {
        html: '<div class="simg">' +
          '<label>Señal de control <output id="oMa"></output><input type="range" id="sMa" min="4" max="20" step="0.1"></label>' +
          '<label>Acción ante falla de aire<select id="sAc"><option value="ato">Aire abre · falla cerrada (FC)</option><option value="atc">Aire cierra · falla abierta (FO)</option></select></label>' +
          '<label>Característica inherente<select id="sCar"><option value="eqp">Igual porcentaje (R = 50)</option><option value="lin">Lineal</option></select></label>' +
          '<label>Presión diferencial ΔP <output id="oDp"></output><input type="range" id="sDp" min="0.2" max="8" step="0.1"></label>' +
          '<label>Cv nominal del trim <output id="oCv"></output><input type="range" id="sCv" min="5" max="80" step="1"></label></div>' +
          '<dl class="lect" id="lectV"></dl><p class="eq" id="eqV"></p><button type="button" id="sFalla" class="tg" aria-pressed="false">Simular falla de aire</button>',
        montar: function () {
          $('sMa').value = SV.mA; $('sAc').value = SV.accion; $('sCar').value = SV.car; $('sDp').value = SV.dp; $('sCv').value = SV.cv;
          $('sMa').addEventListener('input', function () { SV.mA = +this.value; sim.pintar(); });
          $('sAc').addEventListener('change', function () { SV.accion = this.value; sim.pintar(); });
          $('sCar').addEventListener('change', function () { SV.car = this.value; sim.pintar(); });
          $('sDp').addEventListener('input', function () { SV.dp = +this.value; sim.pintar(); });
          $('sCv').addEventListener('input', function () { SV.cv = +this.value; sim.pintar(); });
          $('sFalla').setAttribute('aria-pressed', String(SV.falla));
          $('sFalla').addEventListener('click', function () { SV.falla = !SV.falla; this.setAttribute('aria-pressed', String(SV.falla)); sim.pintar(); });
          sim.pintar();
        },
        pintar: function () {
          var h = calc(), n = function (v, d) { return v.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d }); };
          $('oMa').textContent = n(SV.mA, 1) + ' mA'; $('oDp').textContent = n(SV.dp, 1) + ' bar'; $('oCv').textContent = n(SV.cv, 0);
          vastago.userData.meta = h.ap * 1.9;   // el tapón sube al abrir (cuerpo de empuje hacia abajo para cerrar)
          var filas = [
            ['Salida del I/P', SV.falla ? '<span class="warn">0 psig · sin aire</span>' : n(h.p, 1) + ' psig · ' + n(h.bar, 2) + ' bar'],
            ['Carrera del vástago', n(h.carrera * 19, 1) + ' mm de 19 mm'],
            ['Apertura de la válvula', n(h.ap * 100, 0) + ' %'],
            ['Posición ante falla de aire', SV.accion === 'ato' ? 'Cerrada (el resorte cierra)' : 'Abierta (el resorte abre)'],
            ['Cv efectivo', n(h.cv, 1)],
            ['Caudal de agua (SG = 1)', n(h.q, 1) + ' m³/h · ' + n(h.q / 3.6, 2) + ' L/s']
          ];
          if (h.ap > 0 && h.ap < 0.1) filas.push(['Alerta', '<span class="warn">Apertura bajo 10 %: control inestable, revisar el dimensionamiento</span>']);
          if (h.ap > 0.9) filas.push(['Alerta', '<span class="warn">Apertura sobre 90 %: válvula sin margen de control</span>']);
          $('lectV').innerHTML = filas.map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>'; }).join('');
          $('eqV').innerHTML = 'P = 3 + 12·(I − 4)/16 psig · carrera = (P − 3)/12 · Q = Kv·√(ΔP/SG) con Kv = 0,865·Cv·f(x), f(x) = x (lineal) o R<sup>x−1</sup> (igual %). Valores de Cv y carrera referenciales para una válvula globo de 2"; usar los del proveedor.';
        },
        tick: function () { // el vástago se mueve suave hacia la posición calculada
          var m = vastago.userData.meta || 0, yv = vastago.position.y - (vastago.userData.base ? vastago.userData.base.y : 0);
          if (Math.abs(m - yv) > 0.005) { vastago.position.y += (m - yv) * 0.15; }
        }
      };
      return { root: root, foco: [4, y + 22, 0, 62], partes: partes, sim: sim };
    }
    V['valvula-diafragma'] = valvulaDiafragma;

    // ── Soportes y paneles de montaje de instrumentos (26) ──
    // Perfil canal plegado 100×50×6, placa de montaje de plancha 3 mm, placa base de plancha 5 mm 250×250
    // con 4 perforaciones Ø14 y pernos de anclaje 1/2" sobre fundación con grout, o espárragos sobre plataforma.
    function canal(largo, eje) { // C 10×5×0,6 cm; vertical ('y') con el alma al frente, horizontal ('x') con las alas hacia atrás
      var e = 0.6, g;
      if (eje === 'x') g = G(box(largo, 10, e, mats.galv, 0, 0, -e / 2), box(largo, e, 5, mats.galv, 0, 5 - e / 2, -2.5), box(largo, e, 5, mats.galv, 0, -5 + e / 2, -2.5));
      else g = G(box(10, largo, e, mats.galv, 0, largo / 2, -e / 2), box(e, largo, 5, mats.galv, 5 - e / 2, largo / 2, -2.5), box(e, largo, 5, mats.galv, -5 + e / 2, largo / 2, -2.5));
      return g;
    }
    function triangulo(a, b, esp, mat) { // triángulo rectángulo de catetos a (x) y b (y), extruido en z
      var s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(a, 0); s.lineTo(0, b); s.lineTo(0, 0);
      var geo = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: false }); geo.translate(0, 0, -esp / 2);
      return M(geo, mat);
    }
    function baseSoporte(x, plataforma) { // placa base 25×25×0,5, cartelas y fijación
      var placa = G(box(25, 0.5, 25, mats.galv, 0, 0.25, -2.5));
      [-1, 1].forEach(function (s) { var t = triangulo(6, 9, 0.5, mats.galv); t.position.set(s * 5, 0.5, -2.5); if (s < 0) t.rotation.y = Math.PI; placa.add(t); });
      var fij = G(), tuercas = G();
      [[-10, -12.5], [10, -12.5], [-10, 7.5], [10, 7.5]].forEach(function (p) {
        if (plataforma) {
          fij.add(cyl(0.64, 9, mats.steel, p[0], -2.6, p[1], 'y', 12));
          tuercas.add(cyl(1.15, 1.1, mats.dark, p[0], 1.05, p[1], 'y', 6), cyl(1.15, 1.1, mats.dark, p[0], -5.6, p[1], 'y', 6));
        } else {
          fij.add(cyl(0.64, 12, mats.steel, p[0], -4.6, p[1], 'y', 12), cyl(1.15, 1.1, mats.dark, p[0], 1.05, p[1], 'y', 6), cyl(1.6, 0.3, mats.steel, p[0], 0.65, p[1], 'y', 16));
        }
      });
      placa.position.x = fij.position.x = tuercas.position.x = x;
      var apoyo;
      if (plataforma) {
        apoyo = G(); for (var i = -11; i <= 11; i++) apoyo.add(box(70, 3, 0.5, mats.galv, 0, -1.5, i * 3 - 2.5));
        for (var j = -3; j <= 3; j++) apoyo.add(box(0.6, 1, 70, mats.galv, j * 10, -0.5, -2.5));
        apoyo.add(box(70, 1, 15, mats.dark, 0, -3.5 - 0.5, -2.5), box(70, 1, 15, mats.dark, 0, -21.5, -2.5), box(70, 17, 0.8, mats.dark, 0, -12.5, -2.5));
        apoyo.position.x = x;
      } else {
        apoyo = G(box(40, 15, 40, mats.concrete, 0, -8.5, -2.5), box(30, 1, 30, std(0x9d9a93, 0, 0.9), 0, -0.5, -2.5)); apoyo.position.x = x;
      }
      return { placa: placa, fij: fij, tuercas: tuercas, apoyo: apoyo };
    }
    function transmisor(x, y, z) { // transmisor de presión con LCD y manifold, referencial
      var g = G(cyl(5.2, 10, mats.inst, 0, 0, 0, 'x'), cyl(5.6, 1, mats.inst, -5.4, 0, 0, 'x'), cyl(5.6, 1, mats.inst, 5.4, 0, 0, 'x'), cyl(3.4, 0.4, mats.lcd, 5.9, 0, 0, 'x'),
        box(8, 6, 7, mats.inst, 0, -8.5, 0), box(9, 3, 8, mats.ss, 0, -13, 0), box(3, 2, 3, mats.red, 5.5, -13, 0), box(3, 2, 3, mats.red, -5.5, -13, 0), box(8, 2, 0.5, mats.ss, 0, -14, -4.5));
      g.children[0].rotation.y = 0; g.rotation.y = -Math.PI / 2; g.position.set(x, y, z);
      return g;
    }
    function soporte(op) {
      var root = G(), panel = op.tipo === 'panel', n = op.n || 1, plat = !!op.plataforma;
      var W = panel ? 100 : [40, 70, 100][n - 1], H = panel ? 165 : 170, yPl = panel ? 45 : 125;
      var patasX = panel ? [-W / 2 + 5, W / 2 - 5] : [0];
      var est = G();
      patasX.forEach(function (x) { var c = canal(H - 0.5, 'y'); c.position.set(x, 0.5, -0.3); est.add(c); });
      if (panel) { var t1 = canal(W - 20, 'x'); t1.position.set(0, yPl + 5, -0.6); var t2 = canal(W - 20, 'x'); t2.position.set(0, H - 5, -0.6); est.add(t1, t2); }
      else { var tb = canal(W - 4, 'x'); tb.position.set(0, H - 5, -0.6); var tb2 = canal(W - 4, 'x'); tb2.position.set(0, yPl + 5, -0.6); est.add(tb, tb2); }
      var placa = G(box(W, H - yPl, 0.3, mats.galv, 0, (H + yPl) / 2, 0.15));
      if (!panel) { // visera de protección: plancha superior con pestaña y laterales triangulares
        placa.add(box(W + 2, 0.3, 20, mats.galv, 0, H + 0.15, 10), box(W + 2, 2, 0.3, mats.galv, 0, H - 0.85, 20));
        [-1, 1].forEach(function (s) { var t = triangulo(20, 30, 0.3, mats.galv); t.rotation.set(Math.PI, -Math.PI / 2, 0); t.position.set(s * (W / 2 + 0.85), H, 0); placa.add(t); });
      }
      var bases = patasX.map(function (x) { return baseSoporte(x, plat); });
      var bp = G(), fj = G(), tu = G(), ap = G();
      bases.forEach(function (b) { bp.add(b.placa); fj.add(b.fij); tu.add(b.tuercas); ap.add(b.apoyo); });
      var equipo, cond = G();
      if (panel) {
        equipo = caja(60, 70, 25, mats.cab, 0, 112, 13);
        equipo.add(box(30, 6, 0.4, mats.white, 0, 25, 13.2));
        [-15, 15].forEach(function (x) { cond.add(cyl(1.6, 4, mats.black, x, 75, 13, 'y'), conduit([[x, 75, 13], [x, 60, 14], [x, 25, 22], [x * 1.4, 4, 40]])); });
      } else {
        equipo = G();
        var paso = W / n;
        for (var i = 0; i < n; i++) {
          var x = -W / 2 + paso * (i + 0.5);
          equipo.add(transmisor(x, 152, 9), box(10, 2, 0.6, mats.ss, x, 138, 0.6));
          cond.add(conduit([[x + 5.5, 152, 9], [x + 9, 144, 10], [x + 9, 120, 4], [x + 9, 60, 4], [x + 18, 6, 30]]));
          cond.add(camino([[x - 2, 137, 9], [x - 2, 128, 10], [x - 2, 100, 14], [x - 20, 70, 40]], 0.48, mats.ss));
        }
      }
      root.add(est, placa, bp, fj, ap, equipo, cond);
      if (plat) root.add(tu);
      var yB = 4, za = 14;
      var partes = [
        [1, 'Perfil canal plegado 100×50×6 mm, acero ASTM A36', 'L.R.', est, [0, 0, -30], [patasX[0] - 4, panel ? 22 : 80, -2]],
        [2, panel ? 'Plancha lisa 3 mm, acero ASTM A36 (placa de montaje)' : 'Plancha lisa 3 mm, acero ASTM A36 (placa de montaje y visera)', 'L.R.', placa, [0, 0, 20], [W / 2 - 6, H - 20, 1]],
        [3, 'Plancha lisa 5 mm, acero ASTM A36 (placa base 250×250 y cartelas)', 'L.R.', bp, [0, 10, 0], [patasX[patasX.length - 1] + 16, 2, za]]
      ];
      if (plat) partes.push([5, 'Perno espárrago 1/2" UNC × 3" de largo, acero al carbono', 4 * patasX.length, fj, [0, -12, 0], [patasX[0] - 16, -5, za]],
        [6, 'Tuerca hexagonal 1/2" UNC, acero al carbono', 8 * patasX.length, tu, [0, 6, 0], [patasX[0] + 16, -7, za]],
        [9, 'Plataforma de rejilla y viga existentes', 1, ap, [0, -20, 0], [patasX[0] - 28, -20, 20]]);
      else partes.push([4, 'Perno de anclaje 1/2" UNC × 4" con golilla y tuerca hexagonal, acero al carbono', 4 * patasX.length, fj, [0, 12, 0], [patasX[0] - 16, yB, za]],
        [9, 'Fundación de hormigón con grout e = 10 mm (obra civil)', patasX.length, ap, [0, -20, 0], [patasX[0] - 26, -14, 18]]);
      partes.push(panel ? [7, 'Tablero de terreno (referencial, otra partida)', 1, equipo, [0, 0, 30], [0, 150, 26]]
        : [7, (n > 1 ? n + ' transmisores' : 'Transmisor') + ' con manifold (referencial)', n, equipo, [0, 0, 25], [0, 162, 12]],
        [8, panel ? 'Conduit flexible y prensaestopas a la canalización' : 'Conduit flexible y tubing de proceso (referencial)', panel ? 2 : 2 * n, cond, [0, -10, 25], [panel ? 28 : W / 2, panel ? 62 : 50, 18]]);
      partes.sort(function (a, b) { return a[0] - b[0]; });

      // ── Cálculo de materiales L.R. ──
      var S = { ancho: W * 10, cant: 1, anc: plat ? 'plat' : 'conc' };
      function kgCanal() { return (100 + 2 * 50 - 2 * 6) * 6 * 7.85e-3; } // kg/m (sección plegada)
      function calc() {
        var w = Math.max(200, +S.ancho || 0) / 1000, k = Math.max(1, Math.round(+S.cant || 1)), patas = patasX.length;
        var mCanal = panel ? patas * 1.65 + 2 * (w - 0.2) : 1.70 + 2 * (w - 0.04);
        var m3 = panel ? w * 1.20 : w * 0.45 + (w + 0.02) * 0.22 + 2 * 0.5 * 0.2 * 0.3;
        var m5 = patas * (0.25 * 0.25 + 2 * 0.5 * 0.06 * 0.09);
        var kg = mCanal * kgCanal() + m3 * 23.55 + m5 * 39.25;
        var pint = mCanal * 0.39 + 2 * m3 + 2 * m5;
        return { canal: mCanal * k, m3: m3 * k, m5: m5 * k, pernos: S.anc === 'conc' ? 4 * patas * k : 0, esp: S.anc === 'plat' ? 4 * patas * k : 0, tue: S.anc === 'plat' ? 8 * patas * k : 0, kg: kg * k, pint: pint * k };
      }
      function f(v, d) { return v.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d }); }
      var sim = {
        html: '<div class="simg">' +
          '<label>Ancho L.R. de la placa <output id="oAn"></output><input type="range" id="sAn" min="300" max="1600" step="50"></label>' +
          '<label>Cantidad de soportes iguales <output id="oCa"></output><input type="range" id="sCa" min="1" max="20" step="1"></label>' +
          '<label>Anclaje<select id="sAnc"><option value="conc">Fundación de hormigón (pernos de anclaje)</option><option value="plat">Plataforma (espárragos y tuercas)</option></select></label></div>' +
          '<dl class="lect" id="lectS"></dl><p class="eq" id="eqS"></p>',
        montar: function () {
          $('sAn').value = S.ancho; $('sCa').value = S.cant; $('sAnc').value = S.anc;
          $('sAn').addEventListener('input', function () { S.ancho = +this.value; sim.pintar(); });
          $('sCa').addEventListener('input', function () { S.cant = +this.value; sim.pintar(); });
          $('sAnc').addEventListener('change', function () { S.anc = this.value; sim.pintar(); });
          sim.pintar();
        },
        pintar: function () {
          var r = calc();
          $('oAn').textContent = f(S.ancho, 0) + ' mm'; $('oCa').textContent = S.cant;
          var filas = [['1 · Perfil canal 100×50×6', f(r.canal, 2) + ' m'], ['2 · Plancha 3 mm', f(r.m3, 2) + ' m²'], ['3 · Plancha 5 mm', f(r.m5, 3) + ' m²']];
          if (r.pernos) filas.push(['4 · Pernos de anclaje 1/2"', r.pernos + ' c/u']);
          if (r.esp) filas.push(['5 · Espárragos 1/2"', r.esp + ' c/u'], ['6 · Tuercas 1/2"', r.tue + ' c/u']);
          filas.push(['Peso de acero', f(r.kg, 1) + ' kg'], ['Superficie a pintar', f(r.pint, 2) + ' m²']);
          $('lectS').innerHTML = filas.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('');
          $('eqS').innerHTML = 'Cantidades «lo requerido» (L.R.) para ' + (panel ? 'el panel de ' + f(S.ancho, 0) + ' × 1.200 mm sobre dos patas de 1.650 mm' : 'la placa de ' + f(S.ancho, 0) + ' × 450 mm con visera sobre un poste de 1.700 mm') +
            '. Pesos: canal ' + f(kgCanal(), 2) + ' kg/m, plancha 3 mm 23,55 kg/m², plancha 5 mm 39,25 kg/m². Sumar 5 % por cortes y despuntes al pedir el material.';
        }
      };
      return { root: root, partes: partes, sim: sim };
    }
    V['soporte-panel'] = function () { return soporte({ tipo: 'panel' }); };
    V['soporte-inst1'] = function () { return soporte({ tipo: 'inst', n: 1 }); };
    V['soporte-inst2'] = function () { return soporte({ tipo: 'inst', n: 2 }); };
    V['soporte-inst3'] = function () { return soporte({ tipo: 'inst', n: 3 }); };
    V['soporte-plataforma'] = function () { return soporte({ tipo: 'inst', n: 1, plataforma: true }); };

    // ── Escalerillas portaconductores (ES) ──────────────────────────────────────────
    // Geometría según catálogo de escalerillas autosoportantes: laterales C de alto H con pestañas de 19 mm,
    // palillos cada 230 mm (normal, lateral 2,0 mm) o 150 mm (reforzada, lateral 2,5 mm), tiras de 3 m,
    // curvas de radio interior R, eclisas apernadas en cada unión y soportación con riel 42×42.
    var ES = { A: 60, H: 10, R: 30, paso: 23, esp: 0.2, pest: 1.9 };
    var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
    var matLat = mats.galv, matPal = std(0xb7bfc6, 0.75, 0.5);
    // Tramo de lateral entre a y b (borde inferior), alto H, con las pestañas hacia "adentro"
    function segLat(a, b, up, adentro, H, g) {
      var T = b.clone().sub(a), len = T.length(); if (len < 0.01) return; T.normalize();
      var U = up.clone().sub(T.clone().multiplyScalar(up.dot(T))).normalize(), Z = T.clone().cross(U);
      var s = Z.dot(adentro) >= 0 ? 1 : -1, e = ES.esp, p = ES.pest;
      var q = G(box(len + 0.05, H, e, matLat, len / 2, H / 2, 0), box(len + 0.05, e, p, matLat, len / 2, e / 2, s * p / 2), box(len + 0.05, e, p, matLat, len / 2, H - e / 2, s * p / 2));
      q.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(T, U, Z)); q.position.copy(a); g.add(q);
    }
    // Lateral a lo largo de una polilínea de muestras {p (centro), t, u, n}; lado s = ±1
    function lateral(M_, s, A, H) {
      var g = G();
      for (var i = 0; i < M_.length - 1; i++) {
        var a = M_[i].p.clone().addScaledVector(M_[i].n, s * A / 2), b = M_[i + 1].p.clone().addScaledVector(M_[i + 1].n, s * A / 2);
        segLat(a, b, M_[i].u, M_[i].n.clone().multiplyScalar(-s), H, g);
      }
      return g;
    }
    function palillo(p, t, u, n, A) { // perfil U de 1,5 mm entre laterales, apoyado sobre la pestaña inferior
      var q = G(box(2.6, 0.15, A - 0.6, matPal, 0, 0.32, 0), box(0.15, 1.3, A - 0.6, matPal, -1.22, 0.9, 0), box(0.15, 1.3, A - 0.6, matPal, 1.22, 0.9, 0));
      q.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, u, t.clone().cross(u))); q.position.copy(p); return q;
    }
    function palillos(M_, A, paso, desde, hasta) {
      var g = G(), acum = 0, sig = paso / 2;
      for (var i = 0; i < M_.length - 1; i++) {
        var a = M_[i], b = M_[i + 1], d = a.p.distanceTo(b.p);
        while (sig <= acum + d) {
          var f = (sig - acum) / d, p = a.p.clone().lerp(b.p, f), t = b.p.clone().sub(a.p).normalize(), u = a.u.clone().lerp(b.u, f).normalize();
          if ((desde === undefined || sig >= desde) && (hasta === undefined || sig <= hasta)) g.add(palillo(p, t, u, t.clone().cross(u), A));
          sig += paso;
        }
        acum += d;
      }
      return g;
    }
    // Muestras de trayectorias (centro del fondo de la escalerilla), en coordenadas locales
    function trRecta(L, n) { var m = []; n = n || 2; for (var i = 0; i <= n; i++) m.push({ p: V3(L * i / n, 0, 0), t: V3(1, 0, 0), u: V3(0, 1, 0), n: V3(0, 0, 1) }); return m; }
    function trCH(Rc, ang) { var m = []; for (var i = 0; i <= 24; i++) { var th = ang * i / 24, c = Math.cos(th), s = Math.sin(th); m.push({ p: V3(Rc * s, 0, Rc * (1 - c)), t: V3(c, 0, s), u: V3(0, 1, 0), n: V3(-s, 0, c) }); } return m; }
    function trCV(R, ang, sube) { var m = [], k = sube ? 1 : -1; for (var i = 0; i <= 24; i++) { var th = ang * i / 24, c = Math.cos(th), s = Math.sin(th); m.push({ p: V3(R * s, k * R * (1 - c), 0), t: V3(c, k * s, 0), u: V3(-k * s, c, 0), n: V3(0, 0, 1) }); } return m; }
    function pieza(M_, A, H, paso, inv) { // escalerilla completa sobre una trayectoria
      return G(lateral(M_, 1, A, H), lateral(M_, -1, A, H), palillos(M_, A, paso));
    }
    // Eclisa: plancha en la cara exterior del lateral con 4 pernos de cabeza redonda y tuercas
    function eclisa(p, t, u, nOut, H) {
      var Z = t.clone().cross(u), s = Z.dot(nOut) >= 0 ? 1 : -1;
      var q = G(box(18, H * 0.62, 0.25, mats.steel, 0, H * 0.5, s * 0.25));
      [-6.5, -2.5, 2.5, 6.5].forEach(function (x) { q.add(cyl(0.75, 0.5, mats.dark, x, H * 0.5, s * 0.6, 'z', 12), cyl(0.62, 0.55, mats.dark, x, H * 0.5, -s * 0.35, 'z', 6)); });
      q.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, u, Z)); q.position.copy(p); return q;
    }
    function eclisasEn(M_, i, A, H) { var m = M_[i], g = G(); [1, -1].forEach(function (s) { g.add(eclisa(m.p.clone().addScaledVector(m.n, s * A / 2), m.t, m.u, m.n.clone().multiplyScalar(s), H)); }); return g; }
    // Riel 42×42 (perfil C con labios), largo L sobre el eje X, abierto hacia +Y
    function riel(L, h) {
      h = h || 4.1; var w = 4.1, e = 0.25;
      return G(box(L, e, w, mats.galv, 0, e / 2, 0), box(L, h, e, mats.galv, 0, h / 2, w / 2 - e / 2), box(L, h, e, mats.galv, 0, h / 2, -w / 2 + e / 2),
        box(L, e, 1.0, mats.galv, 0, h - e / 2, w / 2 - 0.5), box(L, e, 1.0, mats.galv, 0, h - e / 2, -w / 2 + 0.5), box(L, 0.9, e, mats.galv, 0, h - 0.45, w / 2 - 0.95), box(L, 0.9, e, mats.galv, 0, h - 0.45, -w / 2 + 0.95));
    }
    function mordaza(x, y, z, sz) { // mordaza sobre la pestaña inferior del lateral, perno a la tuerca riel
      var g = G(box(3.2, 0.3, 4, mats.steel, 0, 0.6, 0), box(0.3, 0.9, 4, mats.steel, 1.6, 0.25, 0), cyl(0.48, 3.4, mats.dark, -0.4, 0.2, 0, 'y', 10), cyl(0.85, 0.5, mats.dark, -0.4, 1.0, 0, 'y', 6), box(1.6, 0.6, 2.4, mats.dark, -0.4, -2.5, 0));
      if (sz < 0) g.rotation.y = Math.PI; g.position.set(x, y, z); return g;
    }
    function hilo(x, y0, y1, z) { return cyl(0.48, Math.abs(y1 - y0), mats.steel, x, (y0 + y1) / 2, z, 'y', 12); }
    function tuerca(x, y, z) { return G(cyl(0.9, 0.7, mats.dark, x, y, z, 'y', 6), cyl(1.2, 0.15, mats.steel, x, y - 0.45, z, 'y', 16)); }
    function cables(M_, A, n, mat) { // cables sobre los palillos, para ver el llenado
      var g = G(), r = 0.9;
      for (var k = 0; k < n; k++) {
        var off = -A / 2 + 2 + r + k * (2 * r + 0.3); if (off > A / 2 - 2) break;
        var pts = M_.map(function (m) { return m.p.clone().addScaledVector(m.n, off).addScaledVector(m.u, 2.1 + r); });
        g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 3), r, 8, false), k % 3 === 0 ? mats.black : k % 3 === 1 ? mat || mats.cableBlue : mats.cableGrey));
      }
      return g;
    }
    function transf(g, x, y, z, ry, rz) { g.position.set(x || 0, y || 0, z || 0); if (ry) g.rotation.y = ry; if (rz) g.rotation.z = rz; return g; }
    function aplicar(M_, x, y, z, ry) { // lleva muestras locales al mundo (traslación + giro en Y)
      var q = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), ry || 0), o = V3(x || 0, y || 0, z || 0);
      return M_.map(function (m) { return { p: m.p.clone().applyQuaternion(q).add(o), t: m.t.clone().applyQuaternion(q), u: m.u.clone().applyQuaternion(q), n: m.n.clone().applyQuaternion(q) }; });
    }

    // ── Dimensionamiento (simulación compartida por todas las variantes) ──
    function simEscalerilla(base) {
      var S = Object.assign({ A: 600, H: 100, ver: 'n', L: 60, d: 1.5, ch: 4, cv: 2, ct: 1, sop: 'trap', susp: 1.0, niv: 1, ac: 0, llen: 40 }, base || {});
      function calc() {
        var A = S.A / 1000, H = S.H / 1000, tiras = Math.ceil(S.L / 3), acc = S.ch + S.cv + S.ct;
        var nSop = (Math.ceil(S.L / S.d) + 1 + 2 * acc) * (S.sop === 'muro' ? 1 : 1);
        var eL = S.ver === 'r' ? 2.5 : 2.0, paso = S.ver === 'r' ? 0.15 : 0.23, pal = S.ver === 'r' ? 20 : 13;
        var kgLat = (H + 2 * 0.019) * eL * 7.85, kgPal = (0.026 + 2 * 0.013) * 1.5 * 7.85 * (A - 0.006); // kg/m lateral, kg por palillo
        var kgm = 2 * kgLat + kgPal / paso;
        var rielU = S.sop === 'muro' ? A + 0.1 : A + 0.2;
        var n = S.niv, r = {
          tiras: tiras * n, pal: tiras * pal * n, eclRect: (tiras + acc) * n, pernos: (tiras + acc) * 8 * n, sop: nSop, rielM: nSop * rielU * n, rielT: Math.ceil(nSop * rielU * n / 3),
          mord: nSop * 2 * n, kg: kgm * S.L * n, kgm: kgm,
          area: A * 1000 * (H * 1000 - 19), acc: acc * n
        };
        if (S.sop === 'trap') { r.hilo = nSop * 2 * (S.susp + 0.1 * (n - 1) + 0.15); r.bases = nSop; r.omegas = nSop * 2; r.tRes = nSop * 2 * n; r.tHex = nSop * (4 * n + 2); }
        else { r.mens = nSop * n; r.anc = nSop * n * 2; }
        r.llenado = S.ac > 0 ? 100 * S.ac / r.area : 0;
        return r;
      }
      function f(v, d) { return v.toLocaleString('es-CL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
      function sel(id, ops, v) { return '<select id="' + id + '">' + ops.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }
      var sim = {
        html: '<div class="simg">' +
          '<label>Ancho A' + sel('eA', [100, 150, 200, 300, 400, 450, 500, 600, 750, 800, 900, 1000].map(function (x) { return [x, x + ' mm']; }), S.A) + '</label>' +
          '<label>Alto lateral H' + sel('eH', [50, 75, 100, 125, 150, 200].map(function (x) { return [x, x + ' mm']; }), S.H) + '</label>' +
          '<label>Versión' + sel('eV', [['n', 'Normal: lateral 2,0 mm, palillos cada 230 mm'], ['r', 'Reforzada: lateral 2,5 mm, palillos cada 150 mm']], S.ver) + '</label>' +
          '<label>Largo recto del recorrido <output id="oL"></output><input type="range" id="eL" min="3" max="600" step="3"></label>' +
          '<label>Distancia entre soportes <output id="oD"></output><input type="range" id="eD" min="0.9" max="3" step="0.1"></label>' +
          '<label>Curvas horizontales <output id="oCh"></output><input type="range" id="eCh" min="0" max="30" step="1"></label>' +
          '<label>Curvas verticales (C.V.I. / C.V.E.) <output id="oCv"></output><input type="range" id="eCv" min="0" max="30" step="1"></label>' +
          '<label>Tees, cruces y reducciones <output id="oCt"></output><input type="range" id="eCt" min="0" max="20" step="1"></label>' +
          '<label>Soportación' + sel('eS', [['trap', 'Trapecio suspendido (riel 42×42 + hilo corrido)'], ['muro', 'Ménsula en muro o columna (soporte muro riel 42×42)']], S.sop) + '</label>' +
          '<label>Niveles de escalerilla en el mismo soporte' + sel('eN', [[1, '1 nivel'], [2, '2 niveles (fuerza / instrumentación)'], [3, '3 niveles']], S.niv) + '</label>' +
          '<label>Largo de suspensión <output id="oSu"></output><input type="range" id="eSu" min="0.3" max="3" step="0.1"></label>' +
          '<label>Sección de cables a tender [mm²]<input type="number" id="eAc" min="0" step="100" inputmode="numeric"></label>' +
          '<label>Llenado máximo del proyecto [%]<input type="number" id="eLl" min="10" max="100" step="5" inputmode="numeric"></label></div>' +
          '<dl class="lect" id="lectE"></dl><p class="eq" id="eqE"></p>',
        montar: function () {
          var $$ = function (id) { return document.getElementById(id); };
          $$('eL').value = S.L; $$('eD').value = S.d; $$('eCh').value = S.ch; $$('eCv').value = S.cv; $$('eCt').value = S.ct; $$('eSu').value = S.susp; $$('eAc').value = S.ac || ''; $$('eLl').value = S.llen;
          [['eA', 'A'], ['eH', 'H'], ['eV', 'ver'], ['eS', 'sop'], ['eN', 'niv']].forEach(function (k) { $$(k[0]).addEventListener('change', function () { S[k[1]] = /^[0-9.]+$/.test(this.value) ? +this.value : this.value; sim.pintar(); }); });
          [['eL', 'L'], ['eD', 'd'], ['eCh', 'ch'], ['eCv', 'cv'], ['eCt', 'ct'], ['eSu', 'susp'], ['eAc', 'ac'], ['eLl', 'llen']].forEach(function (k) { $$(k[0]).addEventListener('input', function () { S[k[1]] = +this.value || 0; sim.pintar(); }); });
          sim.pintar();
        },
        pintar: function () {
          var $$ = function (id) { return document.getElementById(id); }, r = calc();
          $$('oL').textContent = f(S.L) + ' m'; $$('oD').textContent = f(S.d, 1) + ' m'; $$('oCh').textContent = S.ch; $$('oCv').textContent = S.cv; $$('oCt').textContent = S.ct; $$('oSu').textContent = f(S.susp, 1) + ' m';
          $$('eSu').closest('label').hidden = S.sop !== 'trap';
          var tag = 'ESC ' + S.A + '×' + S.H + (S.ver === 'r' ? ' reforzada' : ' normal');
          var F = [['Escalerilla recta ' + tag + ', tira de 3 m', f(r.tiras) + ' tiras'], ['Palillos incluidos (' + (S.ver === 'r' ? 20 : 13) + ' por tira)', f(r.pal)],
            ['Curvas y derivaciones del mismo ancho y alto', f(r.acc) + ' c/u'], ['Pares de eclisa recta (uno por tira y por curva, incluidos)', f(r.eclRect)], ['Pernos y tuercas de eclisa (8 por par)', f(r.pernos)],
            ['Soportes (cada ' + f(S.d, 1) + ' m + 2 por accesorio)', f(r.sop)], ['Riel 42×42×2,5 mm', f(r.rielM, 1) + ' m · ' + f(r.rielT) + ' tiras de 3 m'], ['Mordazas 42 con perno y tuerca riel', f(r.mord)]];
          if (S.sop === 'trap') F.push(['Hilo corrido 3/8"', f(r.hilo, 1) + ' m'], ['Base de anclaje a losa o viga', f(r.bases)], ['Omegas', f(r.omegas)], ['Tuercas riel 42 con resorte 3/8"', f(r.tRes)], ['Tuercas hexagonales y golillas 3/8"', f(r.tHex)]);
          else F.push(['Soporte muro simple riel 42×42, L = ' + (S.A + 100) + ' mm', f(r.mens)], ['Pernos de anclaje de expansión 3/8"', f(r.anc)]);
          F.push(['Peso de la escalerilla', f(r.kgm, 2) + ' kg/m · ' + f(r.kg) + ' kg'], ['Sección útil A × (H − 19 mm)', f(r.area) + ' mm²']);
          if (r.llenado) F.push(['Llenado de la sección', '<span class="' + (r.llenado > S.llen ? 'warn' : '') + '">' + f(r.llenado, 1) + ' %' + (r.llenado > S.llen ? ' · sobre el ' + S.llen + ' % del proyecto: subir A o H' : ' · cumple') + '</span>']);
          $$('lectE').innerHTML = F.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('');
          $$('eqE').innerHTML = 'Cantidades para ' + S.niv + ' nivel(es) de ' + f(S.L) + ' m. Cada tira recta y cada curva trae su par de eclisas con pernos y tuercas. Distancia entre soportes según la carga de cables y la versión (normal ≤ 1,5 m típico, reforzada hasta 3 m); poner un soporte a menos de 600 mm de cada lado de curvas, tees y cruces. Peso con acero 7,85 kg/dm³ sin recubrimiento.';
        }
      };
      return sim;
    }

    // Variantes de escalerilla y accesorios
    function esRecta(reforzada) {
      var A = ES.A, H = ES.H, paso = reforzada ? 15 : ES.paso, root = G();
      var m1 = trRecta(300, 2), m2 = aplicar(trRecta(120, 2), 300, 0, 0);
      var t1 = pieza(m1, A, H, paso), t2 = pieza(m2, A, H, paso), ecl = eclisasEn(m2, 0, A, H);
      root.add(t1, t2, ecl);
      var y0 = -4.1, sop = G(); [40, 260, 380].forEach(function (x) { var r = transf(riel(A + 20), x, y0, 0, Math.PI / 2); sop.add(r, mordaza(x, 0, A / 2 + 1.4, 1), mordaza(x, 0, -A / 2 - 1.4, -1)); });
      var cab = cables(m1.concat(m2.slice(1)), A, 12);
      root.add(sop, cab);
      return { root: root, foco: [200, 6, 0, 125], partes: [
        [1, 'Escalerilla recta ' + (reforzada ? 'reforzada' : 'normal') + ' 600×100 mm, tira de 3.000 mm', 1, t1, [0, 25, 0], [80, H + 4, A / 2]],
        [2, 'Lateral C de ' + (reforzada ? '2,5' : '2,0') + ' mm con pestañas de 19 mm', 2, G(), [0, 0, 0], [150, H, -A / 2]],
        [3, 'Palillo de 1,5 mm cada ' + paso * 10 + ' mm (' + (reforzada ? 20 : 13) + ' por tira)', reforzada ? 20 : 13, G(), [0, 0, 0], [120, 2, 0]],
        [4, 'Tira siguiente (continuación del tramo)', 1, t2, [40, 0, 0], [360, H + 4, A / 2]],
        [5, 'Par de eclisas recta normal con 8 pernos y tuercas', 1, ecl, [0, 0, 30], [300, H + 6, A / 2 + 2]],
        [6, 'Riel 42×42 de soporte', 3, sop, [0, -25, 0], [260, -6, A / 2 + 10]],
        [7, 'Mordaza 42 con perno 3/8" y tuerca riel', 6, G(), [0, 0, 0], [40, 2, -A / 2 - 6]],
        [8, 'Cables de instrumentación y control (referencial)', 1, cab, [0, 35, 0], [200, 6, 0]]] };
    }
    V['esc-recta'] = function () { var r = esRecta(false); r.sim = simEscalerilla(); return r; };
    V['esc-reforzada'] = function () { var r = esRecta(true); r.sim = simEscalerilla({ ver: 'r', d: 2.5 }); return r; };
    function esCurva(tipo, ang) {
      var A = ES.A, H = ES.H, R = ES.R, root = G(), m, ent, sal, et;
      if (tipo === 'ch') { m = trCH(R + A / 2, ang); et = 'Curva horizontal (C.H.) ' + Math.round(ang * 180 / Math.PI) + '°, R = 300 mm'; }
      else if (tipo === 'cvi') { m = trCV(R + 10, ang, true); et = 'Curva vertical interior (C.V.I.) 90°, R = 300 mm'; }
      else { m = trCV(R + 10, ang, false); et = 'Curva vertical exterior (C.V.E.) 90°, R = 300 mm'; }
      var curva = pieza(m, A, H, ES.paso);
      var u = m[m.length - 1], mEnt = aplicar(trRecta(80, 2), -80, 0, 0);
      var mSal = trRecta(80, 2).map(function (x) { var q = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), u.t); return { p: x.p.clone().applyQuaternion(q).add(u.p), t: u.t.clone(), u: u.u.clone(), n: u.n.clone() }; });
      if (tipo === 'ch') mSal = mSal.map(function (x) { return Object.assign(x, { n: u.n.clone() }); });
      ent = pieza(mEnt, A, H, ES.paso); sal = pieza(mSal, A, H, ES.paso);
      var ecl = G(eclisasEn(m, 0, A, H), eclisasEn(m, m.length - 1, A, H));
      var cab = cables(mEnt.concat(m.slice(1), mSal.slice(1)), A, 10);
      root.add(curva, ent, sal, ecl, cab);
      var sop = G();
      if (tipo === 'ch') { [[-50, 0, 0, Math.PI / 2], [u.p.x + u.t.x * 50, 0, u.p.z + u.t.z * 50, Math.PI / 2 + Math.atan2(-u.t.z, u.t.x)]].forEach(function (s) { sop.add(transf(riel(A + 20), s[0], -4.1, s[2], s[3])); }); }
      else { sop.add(transf(riel(A + 20), -50, -4.1, 0, Math.PI / 2)); }
      root.add(sop);
      var mid = m[12];
      return { root: root, partes: [[1, 'Escalerilla ' + et + ', A = 600 mm, H = 100 mm', 1, curva, [0, 25, 0], [mid.p.x, mid.p.y + H + 4, mid.p.z]],
        [2, 'Tramo recto de entrada', 1, ent, [-30, 0, 0], [-60, H + 4, A / 2]], [3, 'Tramo recto de salida', 1, sal, [u.t.x * 30, u.t.y * 30, u.t.z * 30], [u.p.x + u.t.x * 60, u.p.y + u.t.y * 60 + H, u.p.z + u.t.z * 60]],
        [4, 'Par de eclisas recta normal con 8 pernos y tuercas (incluido con la curva)', 2, ecl, [0, 0, 20], [m[0].p.x, H + 8, A / 2 + 4]],
        [5, 'Soporte riel 42×42 a menos de 600 mm de la curva', sop.children.length, sop, [0, -20, 0], [-50, -8, A / 2 + 10]], [6, 'Cables (radio de curvatura ≥ el mínimo del cable)', 1, cab, [0, 30, 0], [mid.p.x, mid.p.y + 6, mid.p.z]]] };
    }
    V['esc-ch90'] = function () { var r = esCurva('ch', Math.PI / 2); r.sim = simEscalerilla(); return r; };
    V['esc-ch45'] = function () { var r = esCurva('ch', Math.PI / 4); r.sim = simEscalerilla(); return r; };
    V['esc-cvi'] = function () { var r = esCurva('cvi', Math.PI / 2); r.sim = simEscalerilla(); return r; };
    V['esc-cve'] = function () { var r = esCurva('cve', Math.PI / 2); r.sim = simEscalerilla(); return r; };
    // Tee y cruz: lateral pasante continuo y curvas de radio R hacia la derivación
    function esDerivacion(cruz) {
      var A = ES.A, H = ES.H, R = ES.R, L = A + 2 * R, root = G(), lat = G(), y = V3(0, 1, 0);
      function arco(cx, cz, a0, a1, s) { // lateral en arco horizontal, pestañas hacia el centro del arco (s=-1) o fuera (s=1)
        var pts = []; for (var i = 0; i <= 16; i++) { var a = a0 + (a1 - a0) * i / 16; pts.push(V3(cx + R * Math.cos(a), 0, cz + R * Math.sin(a))); }
        for (var k = 0; k < pts.length - 1; k++) { var mid = pts[k].clone().add(pts[k + 1]).multiplyScalar(0.5), dir = V3(cx, 0, cz).sub(mid).normalize().multiplyScalar(s); segLat(pts[k], pts[k + 1], y, dir, H, lat); }
      }
      // lado pasante (z = -A/2) continuo
      if (!cruz) segLat(V3(-L / 2, 0, -A / 2), V3(L / 2, 0, -A / 2), y, V3(0, 0, 1), H, lat);
      [1, cruz ? -1 : null].forEach(function (s) {
        if (s === null) return;
        var z0 = s * A / 2;
        arco(-A / 2 - R, z0 + s * R, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0, -1);
        arco(A / 2 + R, z0 + s * R, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? -Math.PI : Math.PI, -1);
        segLat(V3(-A / 2, 0, z0 + s * R), V3(-A / 2, 0, z0 + s * (R + 40)), y, V3(1, 0, 0), H, lat);
        segLat(V3(A / 2, 0, z0 + s * R), V3(A / 2, 0, z0 + s * (R + 40)), y, V3(-1, 0, 0), H, lat);
      });
      var pal = G(), mMain = aplicar(trRecta(L, 2), -L / 2, 0, 0);
      pal.add(palillos(mMain, A, ES.paso));
      [1, cruz ? -1 : 0].forEach(function (s) { if (!s) return; var mb = trRecta(R + 40 - 2, 2).map(function (x) { return { p: V3(0, 0, s * (A / 2 + 2) + s * x.p.x), t: V3(0, 0, s), u: V3(0, 1, 0), n: V3(s, 0, 0) }; }); pal.add(palillos(mb, A, ES.paso)); });
      var ent = pieza(aplicar(trRecta(60, 2), -L / 2 - 60, 0, 0), A, H, ES.paso), sal = pieza(aplicar(trRecta(60, 2), L / 2, 0, 0), A, H, ES.paso);
      var ecl = G(eclisasEn(aplicar(trRecta(1, 1), -L / 2, 0, 0), 0, A, H), eclisasEn(aplicar(trRecta(1, 1), L / 2, 0, 0), 0, A, H));
      root.add(lat, pal, ent, sal, ecl);
      var cab = cables(aplicar(trRecta(L + 120, 6), -L / 2 - 60, 0, 0), A, 8);
      root.add(cab);
      return { root: root, partes: [[1, 'Escalerilla ' + (cruz ? 'curva cruz (C.C.)' : 'curva tee (C.T.)') + ' A = S = P = 600 mm, R = 300 mm', 1, G(lat, pal), [0, 20, 0], [0, H + 4, -A / 2]],
        [2, 'Tramo recto entrante (A)', 1, ent, [-30, 0, 0], [-L / 2 - 30, H + 4, A / 2]], [3, 'Tramo recto pasante (P)', 1, sal, [30, 0, 0], [L / 2 + 30, H + 4, A / 2]],
        [4, 'Par de eclisas recta normal con 8 pernos y tuercas', cruz ? 4 : 3, ecl, [0, 0, 25], [-L / 2, H + 8, -A / 2 - 4]], [5, 'Cables pasantes (referencial)', 1, cab, [0, 30, 0], [0, 6, -10]]] };
    }
    V['esc-tee'] = function () { var r = esDerivacion(false); r.sim = simEscalerilla(); return r; };
    V['esc-cruz'] = function () { var r = esDerivacion(true); r.sim = simEscalerilla(); return r; };
    V['esc-reduccion'] = function () {
      var A = ES.A, B = 30, H = ES.H, root = G(), lat = G(), y = V3(0, 1, 0), Lr = 48;
      [1, -1].forEach(function (s) { segLat(V3(0, 0, s * A / 2), V3(16, 0, s * A / 2), y, V3(0, 0, -s), H, lat); segLat(V3(16, 0, s * A / 2), V3(Lr - 16, 0, s * B / 2), y, V3(0, 0, -s), H, lat); segLat(V3(Lr - 16, 0, s * B / 2), V3(Lr, 0, s * B / 2), y, V3(0, 0, -s), H, lat); });
      var pal = G(palillo(V3(8, 0, 0), V3(1, 0, 0), y, V3(0, 0, 1), A), palillo(V3(Lr - 8, 0, 0), V3(1, 0, 0), y, V3(0, 0, 1), B), palillo(V3(Lr / 2, 0, 0), V3(1, 0, 0), y, V3(0, 0, 1), (A + B) / 2));
      var ent = pieza(aplicar(trRecta(100, 2), -100, 0, 0), A, H, ES.paso), sal = pieza(aplicar(trRecta(100, 2), Lr, 0, 0), B, H, ES.paso);
      var ecl = G(eclisasEn(aplicar(trRecta(1, 1), 0, 0, 0), 0, A, H), eclisasEn(aplicar(trRecta(1, 1), Lr, 0, 0), 0, B, H));
      root.add(lat, pal, ent, sal, ecl);
      return { root: root, partes: [[1, 'Escalerilla curva reducción central A = 600 → B = 300 mm (480 mm, tramos de 160 mm)', 1, G(lat, pal), [0, 25, 0], [Lr / 2, H + 4, A / 2]],
        [2, 'Tramo recto ancho A = 600 mm', 1, ent, [-30, 0, 0], [-60, H + 4, A / 2]], [3, 'Tramo recto ancho B = 300 mm', 1, sal, [30, 0, 0], [Lr + 60, H + 4, B / 2]],
        [4, 'Par de eclisas recta normal con 8 pernos y tuercas', 2, ecl, [0, 0, 25], [0, H + 8, -A / 2 - 4]]] };
    };
    V['esc-reduccion'] = (function (f) { return function () { var r = f(); r.sim = simEscalerilla(); return r; }; })(V['esc-reduccion']);

    // ── Soportación ──
    function trapecio(x, z, yTecho, niveles, A, H, sep) { // base, omegas, hilo corrido, riel 42×42 por nivel, tuercas
      var g = G(), w = A + 20, xs = [-w / 2 + 4, w / 2 - 4];
      var base = G(box(w + 8, 0.8, 16, mats.galv, 0, yTecho - 0.4, 0)); [-1, 1].forEach(function (s) { [-1, 1].forEach(function (k) { base.add(cyl(0.9, 1.2, mats.dark, s * (w / 2 - 6), yTecho - 1, k * 5, 'y', 6)); }); });
      var omegas = G(); xs.forEach(function (xx) { omegas.add(box(5, 0.3, 4, mats.galv, xx, yTecho - 1, 0), box(0.3, 4, 4, mats.galv, xx - 2.5, yTecho - 3, 0), box(0.3, 4, 4, mats.galv, xx + 2.5, yTecho - 3, 0), box(5, 0.3, 4, mats.galv, xx, yTecho - 5, 0)); });
      var rieles = G(), hilos = G(), tuer = G(), yInf = 0;
      for (var k = 0; k < niveles; k++) {
        var yr = -k * sep; rieles.add(transf(riel(w + 8), 0, yr - 4.1, 0));
        xs.forEach(function (xx) { tuer.add(tuerca(xx, yr - 4.6, 0), tuerca(xx, yr + 0.3, 0)); });
        yInf = yr - 6;
      }
      xs.forEach(function (xx) { hilos.add(hilo(xx, yInf, yTecho - 1, 0)); tuer.add(tuerca(xx, yTecho - 5.6, 0)); });
      g.add(base, omegas, rieles, hilos, tuer); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2;
      return { g: g, base: base, omegas: omegas, rieles: rieles, hilos: hilos, tuer: tuer };
    }
    V['esc-trapecio'] = function (niveles) {
      niveles = niveles || 1;
      var A = ES.A, H = ES.H, sep = 30, root = G(), yT = 70, techo = G(box(320, 12, 70, mats.concrete, 150, yT + 6, 0), box(320, 30, 20, mats.concrete, 150, yT - 3, 0));
      techo.children[1].visible = false;
      var tr = [trapecio(40, 0, yT, niveles, A, H, sep), trapecio(260, 0, yT, niveles, A, H, sep)];
      var escs = G(), mords = G(), cab = G();
      for (var k = 0; k < niveles; k++) {
        var m = aplicar(trRecta(300, 2), 0, -k * sep, 0); escs.add(pieza(m, A, H, ES.paso)); cab.add(cables(m, A, k === 0 ? 14 : 8, k === 0 ? mats.cableBlue : mats.red));
        [40, 260].forEach(function (x) { mords.add(mordaza(x, -k * sep, A / 2 + 1.4, 1), mordaza(x, -k * sep, -A / 2 - 1.4, -1)); });
      }
      tr.forEach(function (t) { t.g.updateMatrix(); ['base', 'omegas', 'rieles', 'hilos', 'tuer'].forEach(function (k) { t[k].applyMatrix4(t.g.matrix); }); });
      root.add(techo, escs, mords, cab);
      var sepTxt = niveles > 1 ? ' · ' + niveles + ' niveles separados 300 mm (fuerza arriba, instrumentación abajo)' : '';
      return { root: root, foco: [150, 20 - (niveles - 1) * 15, 0, 150 + niveles * 15], partes: [
        [1, 'Losa o viga de techo (estructura existente)', 1, techo, [0, 30, 0], [0, yT + 12, 35]],
        [2, 'Base de anclaje con 4 pernos de expansión 3/8"', 2, G(tr[0].base, tr[1].base), [0, 18, 0], [40, yT - 2, A / 2 + 14]],
        [3, 'Omega para hilo corrido', 4, G(tr[0].omegas, tr[1].omegas), [0, 10, 0], [260, yT - 6, A / 2 + 6]],
        [4, 'Hilo corrido 3/8" UNC (largo según suspensión)', 4, G(tr[0].hilos, tr[1].hilos), [0, 0, 0], [40, 35, A / 2 + 6]],
        [5, 'Conjunto soporte recto riel 42×42, L = ' + (A * 10 + 280) + ' mm', 2 * niveles, G(tr[0].rieles, tr[1].rieles), [0, -10, 0], [260, -6, -A / 2 - 10]],
        [6, 'Tuerca riel 42 con resorte, tuercas hexagonales y golillas 3/8"', 2 * (4 * niveles + 2), G(tr[0].tuer, tr[1].tuer), [0, 0, 0], [40, -6, A / 2 + 10]],
        [7, 'Escalerilla recta normal 600×100 mm' + sepTxt, niveles, escs, [0, 0, 0], [150, H + 4, A / 2]],
        [8, 'Mordaza 42 con perno y tuerca riel (una por lateral)', 4 * niveles, mords, [0, 8, 0], [40, 3, -A / 2 - 6]],
        [9, 'Cables (referencial)', 1, cab, [0, 25, 0], [150, 6, 0]]], sim: simEscalerilla({ sop: 'trap', niv: niveles, susp: 0.7 }) };
    };
    V['esc-trapecio2'] = function () { return V['esc-trapecio'](2); };
    V['esc-mensula'] = function () {
      var A = ES.A, H = ES.H, root = G(), L = A + 10, pared = box(300, 110, 15, mats.wall, 115, 25, -A / 2 - 13);
      var mens = G(), anc = G(), mords = G();
      [40, 190].forEach(function (x) {
        var g = G(box(0.6, 30, 4.4, mats.galv, 0, -10, 0), transf(riel(L), L / 2, -4.1, 0));
        g.children[1].rotation.y = 0; g.rotation.y = -Math.PI / 2; g.position.set(x, 0, -A / 2 - 5.5);
        mens.add(g);
        anc.add(cyl(0.9, 1.2, mats.dark, x, 1, -A / 2 - 4.9, 'z', 6), cyl(0.9, 1.2, mats.dark, x, -21, -A / 2 - 4.9, 'z', 6));
        mords.add(mordaza(x, 0, A / 2 + 1.4, 1), mordaza(x, 0, -A / 2 - 1.4, -1));
      });
      var m = trRecta(240, 2), esc = pieza(m, A, H, ES.paso), cab = cables(m, A, 12);
      root.add(pared, mens, anc, mords, esc, cab);
      return { root: root, partes: [[1, 'Muro o columna (estructura existente)', 1, pared, [0, 0, -20], [10, 100, -A / 2 - 5]],
        [2, 'Soporte muro simple riel 42×42, L = ' + (L * 10) + ' mm, placa con 2 perforaciones', 2, mens, [0, 0, 15], [190, -18, -A / 2 + 6]],
        [3, 'Perno de anclaje de expansión 3/8" × 3"', 4, anc, [0, 0, -10], [40, -22, -A / 2 - 2]],
        [4, 'Escalerilla recta normal 600×100 mm', 1, esc, [0, 20, 0], [120, H + 4, A / 2]],
        [5, 'Mordaza 42 con perno y tuerca riel', 4, mords, [0, 6, 0], [40, 3, A / 2 + 6]], [6, 'Cables (referencial)', 1, cab, [0, 25, 0], [120, 6, 0]]], sim: simEscalerilla({ sop: 'muro' }) };
    };
    V['esc-vertical'] = function () {
      var A = ES.A, H = ES.H, root = G(), pared = box(160, 360, 15, mats.wall, 0, 160, -H - 13.1), losa_ = box(220, 10, 160, mats.concrete, 0, -5, 50);
      var m = trRecta(300, 2).map(function (x) { return { p: V3(0, 20 + x.p.x, -H - 1.5), t: V3(0, 1, 0), u: V3(0, 0, 1), n: V3(1, 0, 0) }; });
      m.forEach(function (x) { x.p.z = -1.5 - 0; });
      var mm = m.map(function (x) { return { p: V3(0, x.p.y, -H - 1.5 + 0), t: x.t, u: x.u, n: x.n }; });
      var esc = pieza(mm, A, H, ES.paso), sop = G(), ab = G();
      [60, 180, 290].forEach(function (y) { var r = transf(riel(A + 20), 0, y, -H - 1.5); r.rotation.x = -Math.PI / 2; sop.add(r); sop.add(cyl(0.9, 1.2, mats.dark, -A / 2 - 6, y, -H - 1.5, 'z', 6), cyl(0.9, 1.2, mats.dark, A / 2 + 6, y, -H - 1.5, 'z', 6)); });
      for (var y = 40; y < 320; y += 30) for (var k = 0; k < 3; k++) ab.add(M(new THREE.TorusGeometry(3.2, 0.25, 6, 18), mats.black, -18 + k * 18, y, -H + 4));
      var cabs = G(); for (var k2 = 0; k2 < 10; k2++) cabs.add(cyl(0.9, 300, k2 % 2 ? mats.cableBlue : mats.black, -A / 2 + 4 + k2 * 2.2, 170, -H + 3, 'y', 10));
      root.add(pared, losa_, esc, sop, ab, cabs);
      return { root: root, partes: [[1, 'Muro (estructura existente)', 1, pared, [0, 0, -20], [60, 330, -H - 1]],
        [2, 'Escalerilla recta normal 600×100 mm en vertical', 1, esc, [0, 0, 15], [A / 2, 250, -H + 4]],
        [3, 'Riel 42×42 adosado al muro cada 1.200 mm máx. con 2 pernos de expansión 3/8"', 3, sop, [0, 0, -8], [-A / 2 - 8, 180, -H]],
        [4, 'Amarras de cables a los palillos cada 300 mm (cables en vertical)', 1, ab, [0, 0, 20], [0, 220, -H + 8]], [5, 'Cables (referencial)', 1, cabs, [0, 0, 30], [10, 120, -H + 6]]], sim: simEscalerilla({ sop: 'muro', d: 1.2 }) };
    };

    // ── Recorrido típico con entrada a tablero (como el esquema del catálogo) ──
    V['esc-recorrido'] = function () {
      var A = 40, H = ES.H, R = 30, root = G(), y0 = 230, P = ES.paso;
      var save = ES.A; ES.A = A;
      var piezas = [], partes = [];
      function add(M_, et) { var g = pieza(M_, A, H, P); root.add(g); piezas.push([g, et, M_]); return M_; }
      // 1) recta de 3 m a lo largo de X
      var m1 = add(aplicar(trRecta(300, 2), 0, y0, 0), 'recta');
      // 2) curva horizontal hacia +Z
      var m2 = add(aplicar(trCH(R + A / 2, Math.PI / 2), 300, y0, 0), 'ch');
      var e2 = m2[m2.length - 1];
      // 3) recta en Z
      var m3 = add(trRecta(200, 2).map(function (x) { return { p: V3(e2.p.x, y0, e2.p.z + x.p.x), t: V3(0, 0, 1), u: V3(0, 1, 0), n: V3(-1, 0, 0) }; }), 'recta');
      // 4) curva vertical exterior hacia abajo al final de m1 en el otro extremo (x=0, bajando)
      var mCve = trCV(R + 10, Math.PI / 2, false).map(function (x) { return { p: V3(-x.p.x, y0 + x.p.y, 0), t: V3(-x.t.x, x.t.y, 0), u: V3(-x.u.x, x.u.y, 0), n: V3(0, 0, -1) }; });
      add(mCve, 'cve'); var eC = mCve[mCve.length - 1];
      var mBaj = add(trRecta(eC.p.y - 152, 2).map(function (x) { return { p: V3(eC.p.x, eC.p.y - x.p.x, 0), t: V3(0, -1, 0), u: V3(-1, 0, 0), n: V3(0, 0, -1) }; }), 'bajada');
      var eB = mBaj[mBaj.length - 1];
      // tablero con entrada superior
      var tab = G(caja(70, 100, 30, mats.cab, 0, 0, 0)); tab.position.set(eB.p.x - 5, 100, 0);
      var entrada = G(box(H + 8, 2, A + 8, mats.galv, eB.p.x - 5, eB.p.y - 1, 0));
      // 5) curva vertical interior que sube al final de m3
      var e3 = m3[m3.length - 1];
      var mCvi = trCV(R + 10, Math.PI / 2, true).map(function (x) { return { p: V3(e3.p.x, y0 + x.p.y, e3.p.z + x.p.x), t: V3(0, x.t.y, x.t.x), u: V3(0, x.u.y, x.u.x), n: V3(-1, 0, 0) }; });
      add(mCvi, 'cvi'); var eI = mCvi[mCvi.length - 1];
      add(trRecta(80, 2).map(function (x) { return { p: V3(eI.p.x, eI.p.y + x.p.x, eI.p.z), t: V3(0, 1, 0), u: V3(0, 0, -1), n: V3(-1, 0, 0) }; }), 'subida');
      // 6) tee en la recta m1 hacia -Z (derivación)
      ES.A = save;
      // eclisas en todas las uniones
      var ecl = G(); piezas.forEach(function (p) { ecl.add(eclisasEn(p[2], 0, A, H)); });
      // soportes trapecio bajo los tramos horizontales
      var sopG = G(); [[60, 0, 0], [240, 0, 0], [e2.p.x, e2.p.z + 60, 1], [e2.p.x, e2.p.z + 170, 1]].forEach(function (s) {
        ES.A = A; var t = trapecio(0, 0, 320 - y0, 1, A, H, 30); ES.A = save;
        t.g.position.set(s[0], y0, s[1]); t.g.rotation.y = s[2] ? 0 : Math.PI / 2; sopG.add(t.g);
      });
      var losa_ = box(500, 12, 420, mats.concrete, 150, 326, 120); losa_.visible = false;
      var piso = box(400, 6, 320, mats.concrete, 140, -3, 100);
      var cab = cables(m1.slice().reverse().concat([]), A, 6);
      root.add(tab, entrada, ecl, sopG, piso, cab);
      ES.A = save;
      return { root: root, foco: [140, 165, 90, 215], partes: [
        [1, 'Escalerilla recta 400×100 normal, tiras de 3 m', 3, G(piezas[0][0], piezas[2][0]), [0, 20, 0], [150, y0 + H + 4, A / 2]],
        [2, 'Escalerilla curva horizontal (C.H.) 90°', 1, piezas[1][0], [20, 20, 0], [e2.p.x - 30, y0 + H + 4, 40]],
        [3, 'Escalerilla curva vertical exterior (C.V.E.) 90° hacia el tablero', 1, piezas[3][0], [-20, 0, 0], [-20, y0 + 6, -A / 2]],
        [4, 'Bajada vertical a tablero', 1, piezas[4][0], [-20, 0, 0], [eB.p.x - 30, 178, -A / 2]],
        [5, 'Entrada de tablero', 1, entrada, [0, 10, 0], [eB.p.x + 25, eB.p.y + 2, A / 2 + 6]],
        [6, 'Tablero (referencial)', 1, tab, [20, 0, 0], [eB.p.x - 5, 60, 18]],
        [7, 'Escalerilla curva vertical interior (C.V.I.) 90° de subida', 1, G(piezas[5][0], piezas[6][0]), [0, 20, 0], [e3.p.x, y0 + 40, e3.p.z + 20]],
        [8, 'Pares de eclisa recta con pernos y tuercas', piezas.length, ecl, [0, 0, 0], [300, y0 + H + 8, -A / 2 - 4]],
        [9, 'Trapecio suspendido riel 42×42 con hilo corrido 3/8"', 4, sopG, [0, -15, 0], [60, y0 + 50, -A / 2 - 10]],
        [10, 'Cables (referencial)', 1, cab, [0, 25, 0], [100, y0 + 6, 0]]], sim: simEscalerilla({ A: 400, L: 15, ch: 1, cv: 2, ct: 0, susp: 0.9 }) };
    };

    // ── Interfaz ─────────────────────────────────────────────────────────────────────
    var $ = function (id) { return document.getElementById(id); };
    var estado = { v: DEF.variantes[0], etiquetas: true, explotar: false, giro: false };
    var modelo = null, partes = [], etiquetas = [], ex = 0, exObj = 0, simAct = null, tPrev = 0, foco = null;

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function construir() {
      if (modelo) { scene.remove(modelo); etiquetas.forEach(function (l) { l.element.remove(); }); }
      var r = V[estado.v.m]();
      modelo = r.root; partes = r.partes; etiquetas = []; simAct = r.sim || null; foco = r.foco || null;
      $('simSec').hidden = !simAct; if (simAct) $('sim').innerHTML = simAct.html;
      modelo.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      partes.forEach(function (p) {
        var obj = p[3]; if (obj && obj !== modelo && !obj.parent) modelo.add(obj);
        obj.userData.base = obj.position.clone(); obj.userData.vec = new THREE.Vector3(p[4][0], p[4][1], p[4][2]);
        var el = document.createElement('div'); el.className = 'tag'; el.innerHTML = '<b>' + p[0] + '</b><span>' + esc(p[1]) + '</span>'; el.dataset.pill = p[0] + ' · ' + p[1];
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
      if (foco) { c.set(foco[0], foco[1], foco[2]); r = foco[3]; }
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
      $('iTit').textContent = v.c + ' · ' + v.t;
      $('desc').textContent = v.d;
      $('bomCap').textContent = 'LISTA DE MATERIALES · TIPO ' + v.c;
      $('bom').innerHTML = partes.map(function (p) { return '<tr><td class="n">' + p[0] + '</td><td>' + esc(p[1]) + '</td><td class="n">' + p[2] + '</td></tr>'; }).join('');
      $('notas').innerHTML = (v.n || []).map(function (t, i) { return '<li>Nota ' + (i + 1) + '. ' + esc(t) + '</li>'; }).join('');
      var bp = document.querySelector('[data-plano]'); if (bp) bp.removeAttribute('data-plano');
      if (v.plano || DEF.plano) $('iTit').setAttribute('data-plano', v.plano || DEF.plano);
      Array.prototype.forEach.call($('types').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === v.c)); });
    }
    $('types').innerHTML = DEF.variantes.map(function (v) { return '<button type="button" class="type" data-c="' + v.c + '" aria-pressed="false">' + esc(v.t) + ' <small>' + v.c + '</small></button>'; }).join('');
    $('types').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; estado.v = DEF.variantes.filter(function (v) { return v.c === b.dataset.c; })[0]; construir(); });
    function sw(id, k, fn) { var b = $(id); b.insertAdjacentHTML('afterbegin', '<i aria-hidden="true"></i>'); b.addEventListener('click', function () { estado[k] = !estado[k]; b.setAttribute('aria-pressed', String(estado[k])); fn && fn(); }); b.setAttribute('aria-pressed', String(estado[k])); }
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
    // Plano de montaje A3 (PDF + DXF + PNG): el mismo generador de los primeros detalles de montaje
    if (window.__PLANO) { try { window.__PLANO(scene, renderer, camera, controls, function () { return etiquetas; }, THREE); } catch (e) { console.warn('Plano de montaje', e); } }
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
    { id: 'eq-valvula-control', num: '25', tab: 'ic', plano: '4600029931-03360-002AT-00008', titulo: 'Válvula modulada con actuador de diafragma', sub: 'Válvula globo con actuador de resorte y diafragma, convertidor I/P, tubing de aire y canalización.', variantes: [
      { c: '25-A', t: 'Actuador de diafragma con I/P', m: 'valvula-diafragma', cam: [0.32, 0.22, 1], d: 'Detalle típico 4600029931-03360-002AT-00008: válvula modulada bridada con actuador de diafragma y convertidor I/P en el yugo. El aire de instrumentos llega en tubo 3/8" OD de acero inoxidable y la señal 4–20 mA desde el gabinete RIO por conduit rígido y flexible de ¾". Mueve la señal para ver la presión del I/P, la carrera, la apertura y el caudal.', n: ['La cantidad de material es solo para un instrumento.', 'La forma y dimensiones pueden variar según la información certificada del proveedor.', 'El contratista de montaje verificará el lugar de instalación para dar buen acceso a la operación, lectura y mantención.', 'Usar unión recta tubo a tubo cuando el largo del tubo de 3/8" OD supere 3 m.', 'Dejar el actuador vertical sobre la cañería horizontal y espacio libre para retirar el actuador y el bonete.'] }] },
    { id: 'eq-soportes-paneles', num: '26', tab: 'ic', titulo: 'Soportes y paneles de montaje', sub: 'Paneles para tableros e instrumentos en perfil canal con placa base, anclados a hormigón o a plataforma.', variantes: [
      { c: '26-A', t: 'Soporte para panel', m: 'soporte-panel', cam: [0.55, 0.3, 1], d: 'Panel de plancha de 3 mm y 1.200 mm de alto sobre dos patas de perfil canal plegado 100×50×6 de 1.650 mm, con travesaños, placas base de 250×250×5 mm con cartelas y 4 pernos de anclaje de 1/2" cada una sobre fundación con grout de 10 mm. Sobre el panel se monta un tablero o caja de terreno.', n: ['Las dimensiones están en milímetros salvo indicación contraria.', 'Todos los soportes y materiales llevan limpieza, arenado, antióxido, terminación superficial exterior y pintura anticorrosiva, o galvanizado en caliente según la especificación del proyecto.', 'La forma y dimensiones de los instrumentos pueden variar según la información certificada del proveedor.', 'El montajista debe atiesar la estructura de modo que la placa de montaje no sufra deformación.', 'El contratista de montaje verificará el lugar de instalación de soportes y paneles para que los instrumentos tengan fácil acceso de operación, lectura y mantención, con aprobación previa de la inspección técnica.', 'L.R. = lo requerido; el visor calcula metros de perfil, m² de plancha, pernos y peso según el ancho real de la placa.'] },
      { c: '26-B', t: 'Soporte para un instrumento', m: 'soporte-inst1', cam: [0.6, 0.25, 1], d: 'Poste de perfil canal plegado 100×50×6 de 1.700 mm con placa de montaje de 450 mm de alto y visera de 200 mm con pestaña de 20 mm soldada, placa base de 250×250×5 mm y 4 pernos de anclaje sobre fundación. El instrumento queda con su indicador a 1.400–1.500 mm del piso.', n: ['Las dimensiones están en milímetros salvo indicación contraria.', 'Todos los soportes y materiales llevan limpieza, arenado, antióxido, terminación superficial exterior y pintura anticorrosiva, o galvanizado en caliente según la especificación del proyecto.', 'La forma y dimensiones de los instrumentos pueden variar según la información certificada del proveedor.', 'El montajista debe atiesar la estructura de modo que la placa de montaje no sufra deformación.', 'El contratista de montaje verificará el lugar de instalación de soportes y paneles para que los instrumentos tengan fácil acceso de operación, lectura y mantención, con aprobación previa de la inspección técnica.', 'L.R. = lo requerido; el visor calcula metros de perfil, m² de plancha, pernos y peso según el ancho real de la placa.'] },
      { c: '26-C', t: 'Soporte para dos instrumentos', m: 'soporte-inst2', cam: [0.6, 0.25, 1], d: 'El mismo poste con placa de montaje y visera de ancho suficiente para dos instrumentos, uno junto al otro.', n: ['Las dimensiones están en milímetros salvo indicación contraria.', 'Todos los soportes y materiales llevan limpieza, arenado, antióxido, terminación superficial exterior y pintura anticorrosiva, o galvanizado en caliente según la especificación del proyecto.', 'La forma y dimensiones de los instrumentos pueden variar según la información certificada del proveedor.', 'El montajista debe atiesar la estructura de modo que la placa de montaje no sufra deformación.', 'El contratista de montaje verificará el lugar de instalación de soportes y paneles para que los instrumentos tengan fácil acceso de operación, lectura y mantención, con aprobación previa de la inspección técnica.', 'L.R. = lo requerido; el visor calcula metros de perfil, m² de plancha, pernos y peso según el ancho real de la placa.'] },
      { c: '26-D', t: 'Soporte para tres instrumentos', m: 'soporte-inst3', cam: [0.6, 0.25, 1], d: 'El mismo poste con placa de montaje y visera para tres instrumentos; atiesar la placa con los travesaños de canal para que no se deforme.', n: ['Las dimensiones están en milímetros salvo indicación contraria.', 'Todos los soportes y materiales llevan limpieza, arenado, antióxido, terminación superficial exterior y pintura anticorrosiva, o galvanizado en caliente según la especificación del proyecto.', 'La forma y dimensiones de los instrumentos pueden variar según la información certificada del proveedor.', 'El montajista debe atiesar la estructura de modo que la placa de montaje no sufra deformación.', 'El contratista de montaje verificará el lugar de instalación de soportes y paneles para que los instrumentos tengan fácil acceso de operación, lectura y mantención, con aprobación previa de la inspección técnica.', 'L.R. = lo requerido; el visor calcula metros de perfil, m² de plancha, pernos y peso según el ancho real de la placa.'] },
      { c: '26-E', t: 'Soporte anclado a plataforma', m: 'soporte-plataforma', cam: [0.55, 0.12, 1], d: 'Soporte para instrumento fijado sobre plataforma de rejilla: la placa base se aprieta con 4 espárragos de 1/2" × 3" y 8 tuercas contra la rejilla y la viga, sin perforar el ala de la viga sin autorización.', n: ['Las dimensiones están en milímetros salvo indicación contraria.', 'Todos los soportes y materiales llevan limpieza, arenado, antióxido, terminación superficial exterior y pintura anticorrosiva, o galvanizado en caliente según la especificación del proyecto.', 'La forma y dimensiones de los instrumentos pueden variar según la información certificada del proveedor.', 'El montajista debe atiesar la estructura de modo que la placa de montaje no sufra deformación.', 'El contratista de montaje verificará el lugar de instalación de soportes y paneles para que los instrumentos tengan fácil acceso de operación, lectura y mantención, con aprobación previa de la inspección técnica.', 'L.R. = lo requerido; el visor calcula metros de perfil, m² de plancha, pernos y peso según el ancho real de la placa.'] }] },
    { id: 'eq-escalerillas', num: 'ES-1', tab: 'es', titulo: 'Escalerillas y accesorios', sub: 'Tramos rectos normal y reforzado, curvas horizontales y verticales, tee, cruz y reducción con eclisas.', variantes: [
      { c: 'ES-1A', t: 'Escalerilla recta normal', m: 'esc-recta', cam: [0.45, 0.42, 1], d: 'Tira de 3.000 mm de laterales C de 2,0 mm con pestañas de 19 mm y palillos de 1,5 mm cada 230 mm (13 por tira), unida a la siguiente con un par de eclisas apernadas y fijada a los rieles con mordazas. Ancho A de 100 a 1.000 mm y alto lateral H de 50 a 200 mm.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1B', t: 'Escalerilla recta reforzada', m: 'esc-reforzada', cam: [0.45, 0.42, 1], d: 'Tira de 3.000 mm de laterales de 2,5 mm y palillos de 1,5 mm cada 150 mm (20 por tira), para cargas mayores o vanos entre soportes de hasta 3 m.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1C', t: 'Curva horizontal 90° (C.H.)', m: 'esc-ch90', cam: [0.2, 0.9, 0.6], d: 'Curva horizontal de 90° de radio interior R (200 a 900 mm), con palillos radiales y eclisas a los tramos rectos de entrada y salida.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1D', t: 'Curva horizontal 45° (C.H.)', m: 'esc-ch45', cam: [0.2, 0.9, 0.6], d: 'Curva horizontal de 45°; el catálogo la fabrica de 30° a 90°.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1E', t: 'Curva vertical interior (C.V.I.)', m: 'esc-cvi', cam: [0.3, 0.3, 1], d: 'Curva vertical cóncava de 90° para subir el recorrido, con los palillos hacia el lado exterior de la curva.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1F', t: 'Curva vertical exterior (C.V.E.)', m: 'esc-cve', cam: [0.3, 0.3, 1], d: 'Curva vertical convexa de 90° para bajar el recorrido (por ejemplo, hacia la entrada de un tablero); los cables apoyan sobre el lado exterior.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1G', t: 'Curva tee (C.T.)', m: 'esc-tee', cam: [0.2, 0.9, 0.7], d: 'Derivación en tee: lateral pasante continuo y dos curvas de radio R hacia la salida S; anchos entrante A, saliente S y pasante P de 100 a 1.000 mm.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1H', t: 'Curva cruz (C.C.)', m: 'esc-cruz', cam: [0.2, 0.9, 0.7], d: 'Cruce de cuatro vías con curvas de radio R en las cuatro esquinas.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-1I', t: 'Curva reducción central', m: 'esc-reduccion', cam: [0.3, 0.8, 0.8], d: 'Reducción de ancho A a B en 480 mm (tramos rectos de 160 mm); también existe en versión izquierda y derecha.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] }] },
    { id: 'eq-escalerillas-soportes', num: 'ES-2', tab: 'es', titulo: 'Soportación de escalerillas', sub: 'Trapecio suspendido con riel 42×42 e hilo corrido, doble nivel, ménsula en muro y escalerilla vertical.', variantes: [
      { c: 'ES-2A', t: 'Trapecio suspendido', m: 'esc-trapecio', cam: [0.55, 0.25, 1], d: 'Base de anclaje a la losa o viga, omegas, dos hilos corridos de 3/8", conjunto soporte recto de riel 42×42 con tuercas riel con resorte y mordazas sobre los laterales de la escalerilla.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Distancia entre soportes según la carga de cables y la versión: normal ≤ 1,5 m típico; reforzada hasta 3 m. Verificar la deflexión con la carga real.', 'Fijar la escalerilla a cada soporte con mordazas en ambos laterales; el hilo corrido lleva tuerca y golilla sobre y bajo el riel.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-2B', t: 'Trapecio de dos niveles', m: 'esc-trapecio2', cam: [0.55, 0.2, 1], d: 'Los mismos hilos corridos llevan dos rieles separados 300 mm: el nivel superior para fuerza y el inferior para instrumentación y comunicaciones.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Distancia entre soportes según la carga de cables y la versión: normal ≤ 1,5 m típico; reforzada hasta 3 m. Verificar la deflexión con la carga real.', 'Fijar la escalerilla a cada soporte con mordazas en ambos laterales; el hilo corrido lleva tuerca y golilla sobre y bajo el riel.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-2C', t: 'Ménsula en muro o columna', m: 'esc-mensula', cam: [0.6, 0.35, 1], d: 'Soporte muro simple riel 42×42 (L de 100 a 750 mm) fijado con 2 pernos de expansión; la escalerilla se fija con mordazas.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Distancia entre soportes según la carga de cables y la versión: normal ≤ 1,5 m típico; reforzada hasta 3 m. Verificar la deflexión con la carga real.', 'Fijar la escalerilla a cada soporte con mordazas en ambos laterales; el hilo corrido lleva tuerca y golilla sobre y bajo el riel.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] },
      { c: 'ES-2D', t: 'Escalerilla vertical en muro', m: 'esc-vertical', cam: [0.7, 0.2, 1], d: 'Tramo vertical adosado al muro con rieles 42×42 cada 1.200 mm como máximo; los cables se amarran a los palillos cada 300 mm.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Distancia entre soportes según la carga de cables y la versión: normal ≤ 1,5 m típico; reforzada hasta 3 m. Verificar la deflexión con la carga real.', 'Fijar la escalerilla a cada soporte con mordazas en ambos laterales; el hilo corrido lleva tuerca y golilla sobre y bajo el riel.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] }] },
    { id: 'eq-escalerillas-recorrido', num: 'ES-3', tab: 'es', titulo: 'Recorrido típico con entrada a tablero', sub: 'Recta, curva horizontal, curvas verticales, bajada y entrada a tablero sobre trapecios.', variantes: [
      { c: 'ES-3A', t: 'Recorrido y entrada a tablero', m: 'esc-recorrido', cam: [0.95, 0.4, 1], d: 'Recorrido de escalerilla de 400×100 mm sobre trapecios suspendidos: recta, curva horizontal, curva vertical exterior con bajada y entrada de tablero, y curva vertical interior de subida. El panel lateral dimensiona el recorrido completo.', n: ['Dimensiones en milímetros salvo indicación contraria.', 'Escalerilla autosoportante de acero con recubrimiento electrogalvanizado (zincado), galvanizado en caliente, pintado o dúplex según la especificación del proyecto; en ambientes corrosivos usar galvanizado en caliente o acero inoxidable.', 'Cada tira recta y cada curva incluye un par de eclisas con sus pernos y tuercas; no soldar ni perforar en terreno sin reparar el recubrimiento con galvanizado en frío.', 'Respetar el radio mínimo de curvatura de los cables más rígidos al elegir el radio R de las curvas (200 a 900 mm).', 'Instalar un soporte a menos de 600 mm de cada lado de curvas, tees, cruces y reducciones.', 'Dejar continuidad eléctrica entre tramos (eclisas apretadas o puente de cobre) y conectar la escalerilla a la malla de tierra en sus extremos y cada 15 m como máximo.', 'Separar los cables de fuerza de los de instrumentación y comunicaciones con un nivel distinto o con separador de escalerilla.'] }] },
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

  var ESTILO = ':root{--bg:#EDF1F5;--panel:#FFFFFF;--fg:#0B1A2B;--muted:#4A5868;--line:#D3DAE2;--brand:#034488;--brand-fg:#fff;--brand-muted:#B9C6D4;--accent:#EF5A05;--accent-ink:#B4430A;--stage:#E2E7ED;--chip:#F2F5F8;--f-display:"Barlow Condensed","Arial Narrow",sans-serif;--f-body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#08121E;--panel:#0F1D2D;--fg:#E6ECF2;--muted:#9DABB9;--line:#24384D;--brand:#022A55;--brand-muted:#9DB0C4;--accent:#FF7A2E;--accent-ink:#FF9A5C;--stage:#0C1724;--chip:#142538;color-scheme:dark}}html,body{height:100%;margin:0}body{background:var(--bg);color:var(--fg);font-family:var(--f-body);font-size:13.5px}[hidden]{display:none!important}.app{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr)}header{background:var(--brand);color:var(--brand-fg);padding:9px max(16px,env(safe-area-inset-right)) 9px max(16px,env(safe-area-inset-left));border-bottom:3px solid var(--accent);display:flex;align-items:center;gap:14px;flex-wrap:wrap}.brand{font-family:var(--f-display);font-weight:700;font-size:19px;letter-spacing:.5px}.brand span{color:var(--accent)}.sep{width:2px;height:24px;background:#34506E}header h1{margin:0;font-family:var(--f-display);font-style:italic;font-weight:800;font-size:22px;letter-spacing:.5px;line-height:1}header h1 span{color:var(--accent)}.howto{margin-left:auto;font-size:12px;color:var(--brand-muted)}main{display:grid;grid-template-columns:minmax(0,1fr) 340px;min-height:0}.stage{position:relative;min-height:0;background:var(--stage);overflow:hidden}.stage canvas{display:block;width:100%;height:100%;touch-action:none}.stage canvas:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}.labels{position:absolute;inset:0;pointer-events:none}.badge{position:absolute;top:12px;left:12px;z-index:2;background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 10px;display:flex;align-items:baseline;gap:8px;box-shadow:0 2px 8px rgba(0,20,40,.08)}.badge b{font-family:var(--f-mono);font-size:13px;color:var(--accent-ink)}.badge span{font-weight:600;font-size:13px}.stage-tools{position:absolute;top:12px;right:12px;z-index:2;display:flex;gap:6px}.btn{font:600 12.5px var(--f-body);color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 10px;cursor:pointer;min-height:32px;box-shadow:0 2px 8px rgba(0,20,40,.08)}.tag{font:600 11.5px var(--f-body);background:var(--panel);color:var(--fg);border:1.2px solid var(--fg);border-radius:999px;padding:2px 9px 2px 3px;white-space:nowrap;display:flex;align-items:center;gap:6px;box-shadow:0 1px 4px rgba(0,0,0,.18);transform:translateY(-14px)}.tag b{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;font:700 10.5px var(--f-mono)}aside{background:var(--panel);border-left:1px solid var(--line);overflow-y:auto;padding:14px 16px 22px;display:flex;flex-direction:column;gap:14px}.group{display:flex;flex-direction:column;gap:7px}.group h2{margin:0;font-family:var(--f-display);font-weight:700;font-size:14.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--muted)}.types{display:flex;flex-direction:column;gap:5px}.type{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;font:600 13px var(--f-body);color:var(--fg);background:var(--chip);border:1px solid var(--line);border-radius:6px;padding:8px 10px;cursor:pointer;min-height:36px}.type small{font:500 11.5px var(--f-mono);color:var(--muted)}.type[aria-pressed="true"]{border-color:var(--accent);background:var(--panel);box-shadow:inset 0 0 0 1px var(--accent)}.type[aria-pressed="true"] small{color:var(--accent-ink)}.toggles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.tg{display:flex;align-items:center;gap:8px;font:500 12.5px var(--f-body);color:var(--fg);background:var(--chip);border:1px solid var(--line);border-radius:6px;padding:7px 9px;cursor:pointer;min-height:36px;text-align:left}.tg i{flex-shrink:0;width:28px;height:16px;border-radius:8px;background:var(--line);position:relative;transition:background .15s}.tg i::after{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--panel);transition:transform .15s}.tg[aria-pressed="true"] i{background:var(--accent)}.tg[aria-pressed="true"] i::after{transform:translateX(12px)}button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.info{border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:9px}.info h3{margin:0;font-family:var(--f-display);font-size:20px;font-weight:700;color:var(--fg)}.info p{margin:0;line-height:1.5}.info p b{color:var(--accent-ink);font-size:11.5px;letter-spacing:1px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid var(--line);padding:4px 6px;text-align:left;vertical-align:top}th{background:var(--chip);font-weight:700}td.n,th.n{text-align:center;font-variant-numeric:tabular-nums;width:40px}.cap{background:var(--accent);color:#1B1300;font-family:var(--f-display);font-weight:700;font-size:14px;letter-spacing:1px;padding:3px 9px;border-radius:5px 5px 0 0}ul.notas{margin:0;padding-left:18px;line-height:1.45;font-size:12.5px}.note{font-size:11.5px;color:var(--muted);line-height:1.45}.simg{display:flex;flex-direction:column;gap:9px}.simg label{display:grid;grid-template-columns:1fr auto;gap:4px 8px;font-weight:600;font-size:12.5px;align-items:center}.simg input,.simg select{grid-column:1/-1;width:100%;font:13px var(--f-body);accent-color:var(--accent)}.simg select{min-height:32px;border:1px solid var(--line);border-radius:6px;background:var(--chip);color:var(--fg);padding:4px 8px}.simg output{font:600 12.5px var(--f-mono);color:var(--accent-ink)}dl.lect{display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin:10px 0 8px;font-size:12.5px}dl.lect dt{color:var(--muted)}dl.lect dd{margin:0;font:600 12.5px var(--f-mono);text-align:right}.warn{color:#c0392b;font-family:var(--f-body)}p.eq{margin:0 0 10px;font-size:11.5px;line-height:1.5;color:var(--muted)}@media (max-width:860px){.tag span{display:none}.tag{padding:2px}.app{height:auto;min-height:100%}main{grid-template-columns:1fr}.stage{height:440px}aside{border-left:0;border-top:1px solid var(--line);overflow:visible}.howto{display:none}}@media (max-width:600px){header h1{font-size:17px}.brand{font-size:14px}.sep{display:none}}@media (prefers-reduced-motion:reduce){.tg i,.tg i::after{transition:none}}';

  function htmlVisor(def) {
    var datos = JSON.stringify(CAT);
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<title>Visor 3D ' + def.titulo + '</title>\n<style>' + ESTILO + '</style>\n</head>\n<body>\n<div class="app">\n<header><div class="brand">Rey<span>Engi</span></div><div class="sep" aria-hidden="true"></div>' +
      '<h1>' + def.titulo.toUpperCase() + ' <span>· VISOR 3D DE MONTAJE</span></h1><div class="howto">Arrastra para girar · rueda para acercar · presiona la rueda y arrastra para desplazar</div></header>\n' +
      '<main><div class="stage" id="stage"><div class="badge" aria-live="polite"><b id="vCode"></b><span id="vName"></span></div><div class="stage-tools"><button type="button" class="btn" id="reset">Restablecer vista</button></div></div>\n' +
      '<aside><div class="group"><h2>Tipo de montaje</h2><div class="types" id="types"></div></div>' +
      '<div class="group"><h2>Vista</h2><div class="toggles"><button type="button" class="tg" id="tLabels">Etiquetas</button><button type="button" class="tg" id="tExplode">Despiece</button><button type="button" class="tg" id="tSpin">Giro automático</button></div></div>' +
      '<div class="group" id="simSec" hidden><h2>Simulación y variables</h2><div id="sim"></div></div>' +
      '<div class="info"><h3 id="iTit"></h3><p><b>DESCRIPCIÓN</b><br><span id="desc"></span></p>' +
      '<div><div class="cap" id="bomCap">LISTA DE MATERIALES</div><table><thead><tr><th class="n">Ítem</th><th>Descripción</th><th class="n">Cant.</th></tr></thead><tbody id="bom"></tbody></table></div>' +
      '<p><b>NOTAS DE MONTAJE</b></p><ul class="notas" id="notas"></ul>' +
      '<p class="note">Modelo referencial con proporciones aproximadas (1 u = 1 cm). Los números de ítem coinciden con los globos del modelo y del plano de montaje.</p></div></aside></main>\n</div>\n' +
      (window.__PLANO ? '<script>window.__PLANO = ' + window.__PLANO.toString() + ';<\/script>\n' : '') +
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
