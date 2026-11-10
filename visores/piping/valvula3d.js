/* Visor 3D de tipos de válvula · Suite ReyEngi
 * Ventana flotante con un modelo en corte de cada tipo (globo, bola segmentada, mariposa, cuchillo, pinch y bola de
 * paso total), su actuador y el flujo animado según la apertura. Modelos referenciales con proporciones aproximadas.
 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var LIB = null, T, R, escena, cam, ctl, lab, raiz, modelo = null, plano, reloj, abierto = false, anim = { ap: 60, obj: 60, ciclo: true, t: 0 };

  var INFO = {
    globo: { t: 'Válvula de globo con actuador de diafragma', d: 'El obturador (tapón) sube y baja sobre el asiento. El fluido cambia de dirección dentro del cuerpo para pasar por el asiento; eso permite un control fino, con más pérdida de carga. El actuador neumático de resorte y diafragma mueve el vástago y define la posición de falla.' },
    segmento: { t: 'Válvula de bola segmentada (V-port)', d: 'Un segmento de esfera con una entalladura en V gira un cuarto de vuelta frente al asiento. La V da una característica de igual porcentaje y una acción de corte que arrastra sólidos, por eso se usa en pulpas finas y fibras.' },
    mariposa: { t: 'Válvula mariposa de alto desempeño', d: 'Un disco gira sobre su eje dentro del cuerpo. A 90° queda paralelo al flujo y casi no ofrece resistencia; el rango útil de control está entre 20° y 70°. Es liviana y económica en diámetros grandes.' },
    cuchillo: { t: 'Válvula de cuchillo (knife gate)', d: 'Una placa delgada con borde biselado baja y corta el flujo cuando la válvula cierra; al abrir se retira completa del paso. Es la válvula de aislamiento típica de pulpas y relaves en minería.' },
    pinch: { t: 'Válvula pinch (manga)', d: 'El fluido solo toca una manga de caucho. Para cerrar, dos barras (o aire a presión) aprietan la manga hasta sellarla. No hay partes metálicas en contacto con la pulpa, por eso resiste la abrasión.' },
    bola: { t: 'Válvula de bola de paso total', d: 'Una esfera con un agujero del mismo diámetro de la cañería gira 90°. Abierta, no tiene pérdida de carga; cerrada, sella contra asientos blandos. Se usa en aislamiento on/off, no para regular.' }
  };

  function iniciar() {
    if (LIB) return true;
    LIB = window.__LIB; if (!LIB) return false; T = LIB.THREE;
    var cont = $('#v3dLienzo');
    R = new T.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.localClippingEnabled = true;
    R.toneMapping = T.ACESFilmicToneMapping; R.outputColorSpace = T.SRGBColorSpace; cont.appendChild(R.domElement);
    lab = new LIB.CSS2DRenderer(); lab.domElement.className = 'v3dlab'; cont.appendChild(lab.domElement);
    escena = new T.Scene(); escena.background = new T.Color(0x0b1828);
    var pm = new T.PMREMGenerator(R); escena.environment = pm.fromScene(new LIB.RoomEnvironment(), 0.04).texture;
    escena.add(new T.HemisphereLight(0xffffff, 0x334455, 0.6)); var dl = new T.DirectionalLight(0xffffff, 1.4); dl.position.set(40, 80, 60); escena.add(dl);
    cam = new T.PerspectiveCamera(38, 1, 1, 2000); cam.position.set(70, 55, 110);
    ctl = new LIB.OrbitControls(cam, R.domElement); ctl.enableDamping = true; ctl.target.set(0, 12, 0);
    plano = new T.Plane(new T.Vector3(0, 0, -1), 0);
    var piso = new T.Mesh(new T.CircleGeometry(120, 48), new T.MeshStandardMaterial({ color: 0x14263c, roughness: 1 })); piso.rotation.x = -Math.PI / 2; piso.position.y = -32; escena.add(piso);
    reloj = new T.Clock();
    new ResizeObserver(tamano).observe(cont);
    R.setAnimationLoop(cuadro);
    return true;
  }
  function tamano() { var c = $('#v3dLienzo'), w = c.clientWidth, h = c.clientHeight; if (!w || !h) return; R.setSize(w, h); lab.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }

  // ── Materiales y piezas ──
  function M(color, o) { return new T.MeshStandardMaterial(Object.assign({ color: color, metalness: 0.55, roughness: 0.38, side: T.DoubleSide }, o || {})); }
  var C = { cuerpo: 0x3b6ea8, acero: 0xb8c2cc, inox: 0xd9dee4, act: 0x2a4f7a, goma: 0x2a2a2a, latón: 0xc9a14a, rojo: 0xd9452b, tubo: 0x8d99a6 };
  function corte(m) { m.clippingPlanes = [plano]; m.clipShadows = true; return m; }
  function cil(r1, r2, h, mat, seg) { return new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 40, 1, false), mat); }
  function tuboX(r, largo, x, mat) { var m = cil(r, r, largo, mat, 40); m.rotation.z = Math.PI / 2; m.position.x = x; return m; }
  function brida(x, r, mat) { var g = tuboX(r * 1.75, 3, x, mat); var grupo = new T.Group(); grupo.add(g); for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, p = cil(0.9, 0.9, 5, M(C.inox)); p.rotation.z = Math.PI / 2; p.position.set(x, Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45); grupo.add(p); } return grupo; }
  function etiqueta(txt, obj, x, y, z) { var d = document.createElement('div'); d.className = 'v3dtag'; d.textContent = txt; var o = new LIB.CSS2DObject(d); o.position.set(x, y, z); obj.add(o); return o; }
  function cañerias(g, r, lx) {
    var mT = corte(M(C.tubo, { metalness: 0.4 }));
    g.add(tuboX(r, 40, -lx - 20, mT), tuboX(r, 40, lx + 20, mT), brida(-lx, r, corte(M(C.cuerpo))), brida(lx, r, corte(M(C.cuerpo))));
    etiqueta('Entrada', g, -lx - 34, r + 6, 0); etiqueta('Salida', g, lx + 34, r + 6, 0);
  }
  function actRotativo(g, y) {
    var caja = new T.Mesh(new LIB.RoundedBoxGeometry(30, 12, 14, 3, 2), M(C.act, { metalness: 0.3, roughness: 0.5 })); caja.position.y = y + 6; g.add(caja);
    var ind = new T.Mesh(new T.BoxGeometry(10, 1.6, 2.4), M(0xffd23f, { metalness: 0.1 })); ind.position.y = y + 13; g.add(ind);
    etiqueta('Actuador rotativo (cuarto de vuelta)', g, 0, y + 20, 0); return ind;
  }
  // Partículas de flujo: recorren el eje X por una trayectoria; la apertura define cuántas pasan y a qué velocidad
  function flujo(g, r, tray) {
    var n = 160, geo = new T.SphereGeometry(0.75, 8, 6), mat = new T.MeshBasicMaterial({ color: 0x7fd3ff }), im = new T.InstancedMesh(geo, mat, n), seed = [];
    for (var i = 0; i < n; i++) seed.push({ u: Math.random(), a: Math.random() * Math.PI * 2, rr: Math.sqrt(Math.random()) * r * 0.75 });
    g.add(im); return { im: im, seed: seed, tray: tray, n: n };
  }
  var M4 = null;
  function moverFlujo(F, ap, dt) {
    if (!M4) M4 = new T.Matrix4();
    var v = 0.05 + 0.25 * ap, activos = Math.round(F.n * Math.min(1, ap * 1.15));
    F.seed.forEach(function (s, i) {
      if (i >= activos) { M4.makeScale(0, 0, 0); F.im.setMatrixAt(i, M4); return; }
      s.u = (s.u + dt * v) % 1; var p = F.tray(s.u, s, ap); M4.makeTranslation(p[0], p[1], p[2]); F.im.setMatrixAt(i, M4);
    });
    F.im.instanceMatrix.needsUpdate = true;
  }
  function recta(lx, r) { return function (u, s, ap) { var x = -lx - 38 + u * (2 * lx + 76), k = Math.abs(x) < 16 ? Math.max(0.25, ap) : 1; return [x, Math.cos(s.a) * s.rr * k, Math.sin(s.a) * s.rr * k]; }; }

  // ── Modelos ──
  function mGlobo() {
    var g = new T.Group(), r = 7, lx = 26, mc = corte(M(C.cuerpo));
    cañerias(g, r, lx);
    var perfil = []; for (var i = 0; i <= 20; i++) { var t = i / 20; perfil.push(new T.Vector2(14 + 6 * Math.sin(t * Math.PI), -18 + 36 * t)); }
    var bulbo = new T.Mesh(new T.LatheGeometry(perfil, 48), mc); bulbo.rotation.z = Math.PI / 2; g.add(bulbo);
    g.add(tuboX(r * 1.15, 2 * lx - 4, 0, mc));
    var bon = cil(8, 10, 16, mc); bon.position.y = 24; g.add(bon);
    var asiento = new T.Mesh(new T.TorusGeometry(5.5, 1.1, 12, 40), M(C.inox)); asiento.rotation.x = Math.PI / 2; asiento.position.y = 0; g.add(asiento);
    var tabique = new T.Mesh(new T.BoxGeometry(1.4, 18, 22), corte(M(C.cuerpo))); tabique.position.set(-7, -2, 0); g.add(tabique);
    var mov = new T.Group(); g.add(mov);
    var tapon = cil(5.2, 3.2, 6, M(C.inox)); tapon.position.y = 3; mov.add(tapon);
    var vastago = cil(1, 1, 62, M(C.inox)); vastago.position.y = 34; mov.add(vastago);
    var yugo1 = new T.Mesh(new T.BoxGeometry(2.4, 26, 3), M(C.act)); yugo1.position.set(-9, 44, 0); g.add(yugo1); var yugo2 = yugo1.clone(); yugo2.position.x = 9; g.add(yugo2);
    var cupula = new T.Mesh(new T.SphereGeometry(20, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2.4), M(C.act, { metalness: 0.3 })); cupula.position.y = 58; g.add(cupula);
    var base = cil(20, 20, 3, M(C.act)); base.position.y = 58; g.add(base);
    var ind = new T.Mesh(new T.BoxGeometry(5, 1, 1), M(0xffd23f)); ind.position.set(5, 40, 0); mov.add(ind);
    etiqueta('Cuerpo (vista en corte)', g, 0, -22, 14); etiqueta('Asiento', g, 8, -4, 8); etiqueta('Obturador (tapón)', mov, -14, 3, 6); etiqueta('Vástago', mov, 6, 30, 0); etiqueta('Actuador de diafragma y resorte', g, 0, 76, 0); etiqueta('Indicador de carrera', mov, 16, 40, 0);
    var F = flujo(g, r, function (u, s, ap) { // sube por el asiento: trayectoria en S
      var x = -lx - 38 + u * (2 * lx + 76), y = Math.cos(s.a) * s.rr, z = Math.sin(s.a) * s.rr * 0.8;
      if (x > -14 && x < 14) { var t = (x + 14) / 28; y = -8 + 16 * t + Math.sin(t * Math.PI) * 2; if (Math.abs(x) < 4) { y = -1 + 3 * ap + Math.cos(s.a) * 2 * Math.max(0.2, ap); z = Math.sin(s.a) * 4; } }
      return [x, y, z];
    });
    return { g: g, F: F, act: function (ap) { mov.position.y = 7 * ap; } };
  }
  function cuerpoRecto(g, r, lx, mat) { g.add(tuboX(r * 1.6, 2 * lx, 0, mat)); }
  function mSegmento() {
    var g = new T.Group(), r = 8, lx = 20, mc = corte(M(C.cuerpo)); cañerias(g, r, lx); cuerpoRecto(g, r, lx, mc);
    var cuello = cil(4, 5, 14, mc); cuello.position.y = r * 1.6 + 5; g.add(cuello);
    var rot = new T.Group(); g.add(rot);
    var seg = new T.Mesh(new T.SphereGeometry(r * 1.15, 40, 24, -Math.PI / 3, Math.PI / 1.5, Math.PI * 0.2, Math.PI * 0.6), M(C.inox)); rot.add(seg);
    var v = new T.Mesh(new T.ConeGeometry(4, 9, 3), M(0x0b1828)); v.rotation.z = Math.PI; v.position.set(r * 1.12, -2, 0); v.scale.z = 0.25; rot.add(v);
    var eje = cil(1.3, 1.3, 40, M(C.inox)); eje.position.y = 12; rot.add(eje);
    var asiento = new T.Mesh(new T.TorusGeometry(r * 0.95, 1, 10, 40), M(C.latón)); asiento.rotation.y = Math.PI / 2; asiento.position.x = r * 1.18; g.add(asiento);
    var ind = actRotativo(g, r * 1.6 + 12);
    etiqueta('Segmento con entalladura en V', rot, 0, -r * 1.3, 10); etiqueta('Asiento', g, r * 1.3, -r, 8); etiqueta('Eje', g, 4, r * 1.6 + 4, 0);
    var F = flujo(g, r, recta(lx, r));
    return { g: g, F: F, act: function (ap) { rot.rotation.y = -ap * Math.PI / 2 * 0.95; ind.rotation.y = -ap * Math.PI / 2; } };
  }
  function mMariposa() {
    var g = new T.Group(), r = 11, lx = 7, mc = corte(M(C.cuerpo)); cañerias(g, r, lx);
    var anillo = tuboX(r * 1.5, 12, 0, mc); g.add(anillo);
    var cuello = cil(4, 5, 12, mc); cuello.position.y = r * 1.5 + 5; g.add(cuello);
    var rot = new T.Group(); g.add(rot);
    var disco = cil(r * 0.98, r * 0.98, 2.2, M(C.inox), 48); disco.rotation.z = Math.PI / 2; rot.add(disco);
    var eje = cil(1.3, 1.3, 2 * r + 30, M(C.inox)); eje.position.y = 10; rot.add(eje);
    var ind = actRotativo(g, r * 1.5 + 11);
    etiqueta('Disco', rot, 0, -r * 0.6, 8); etiqueta('Cuerpo wafer (corte)', g, 0, -r * 1.6, 12); etiqueta('Eje', g, 4, r * 1.5 + 3, 0);
    var F = flujo(g, r, recta(lx, r));
    return { g: g, F: F, act: function (ap) { rot.rotation.y = ap * Math.PI / 2; ind.rotation.y = -ap * Math.PI / 2; } };
  }
  function mCuchillo() {
    var g = new T.Group(), r = 10, lx = 5, mc = corte(M(C.cuerpo)); cañerias(g, r, lx);
    var cuerpo = new T.Mesh(new T.BoxGeometry(10, r * 2.8, r * 2.8), mc); g.add(cuerpo);
    var guia = new T.Mesh(new T.BoxGeometry(8, 40, r * 2.4), mc); guia.position.y = r * 1.4 + 18; g.add(guia);
    var mov = new T.Group(); g.add(mov);
    var hoja = new T.Mesh(new T.BoxGeometry(1.4, r * 2.4, r * 2.2), M(C.inox)); mov.add(hoja);
    var bisel = new T.Mesh(new T.ConeGeometry(r * 1.1, 3, 4), M(C.inox)); bisel.rotation.y = Math.PI / 4; bisel.scale.set(0.12, 1, 1); bisel.position.y = -r * 1.2 - 1.2; bisel.rotation.x = Math.PI; mov.add(bisel);
    var vast = cil(1.2, 1.2, 50, M(C.inox)); vast.position.y = r * 1.2 + 25; mov.add(vast);
    var cil1 = cil(7, 7, 34, M(C.act, { metalness: 0.3 })); cil1.position.y = r * 1.4 + 58; g.add(cil1);
    etiqueta('Hoja (cuchillo) con borde biselado', mov, 0, -r * 0.5, 14); etiqueta('Cilindro neumático', g, 10, r * 1.4 + 70, 0); etiqueta('Cuerpo (corte)', g, 0, -r * 1.6, 14);
    var F = flujo(g, r, function (u, s, ap) { var x = -lx - 38 + u * (2 * lx + 76), y = Math.cos(s.a) * s.rr, z = Math.sin(s.a) * s.rr; if (Math.abs(x) < 6) { var tope = -r + 2 * r * ap; y = -r * 0.75 + (y + r * 0.75) * ap * 0.9; if (y > tope) y = tope; } return [x, y, z]; });
    return { g: g, F: F, act: function (ap) { mov.position.y = r * 2.3 * ap; } };
  }
  function mPinch() {
    var g = new T.Group(), r = 9, lx = 18, mc = corte(M(C.cuerpo, { transparent: true, opacity: 0.35 })); cañerias(g, r, lx);
    var caja = tuboX(r * 1.7, 2 * lx - 2, 0, mc); g.add(caja);
    var geo = new T.CylinderGeometry(r, r, 2 * lx, 40, 30, true), manga = new T.Mesh(geo, corte(M(C.goma, { metalness: 0, roughness: 0.9 }))); manga.rotation.z = Math.PI / 2; g.add(manga);
    var base = geo.attributes.position.array.slice();
    var b1 = new T.Mesh(new T.BoxGeometry(6, 2.4, r * 2.6), M(C.inox)), b2 = b1.clone(); g.add(b1, b2);
    etiqueta('Manga de caucho', g, -lx * 0.6, r + 3, 10); etiqueta('Barras de apriete', g, 0, r + 12, 0); etiqueta('Carcasa (transparente)', g, lx * 0.7, -r * 1.8, 0);
    var F = flujo(g, r, function (u, s, ap) { var x = -lx - 38 + u * (2 * lx + 76), k = Math.abs(x) < lx ? 1 - (1 - Math.max(0.12, ap)) * Math.cos(x / lx * Math.PI / 2) : 1; return [x, Math.cos(s.a) * s.rr * k, Math.sin(s.a) * s.rr]; });
    return { g: g, F: F, act: function (ap) {
      var p = geo.attributes.position.array, c = 1 - ap; // en la geometría el eje de la manga es Y (luego rotado): se aprieta la coordenada X local
      for (var i = 0; i < p.length; i += 3) { var yl = base[i + 1], k = Math.cos(Math.min(1, Math.abs(yl) / lx) * Math.PI / 2); p[i] = base[i] * (1 - 0.92 * c * k); }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      var sep = r * (1 - 0.92 * c) + 1.3; b1.position.y = sep; b2.position.y = -sep;
    } };
  }
  function mBola() {
    var g = new T.Group(), r = 8, lx = 18, mc = corte(M(C.cuerpo)); cañerias(g, r, lx); cuerpoRecto(g, r, lx, mc);
    var cuello = cil(4, 5, 12, mc); cuello.position.y = r * 1.6 + 5; g.add(cuello);
    var rot = new T.Group(); g.add(rot);
    var bola = new T.Mesh(new T.SphereGeometry(r * 1.4, 48, 32), M(C.inox)); rot.add(bola);
    var ab = Math.asin(0.7); [-1, 1].forEach(function (sg) { var boca = new T.Mesh(new T.SphereGeometry(r * 1.405, 40, 8, 0, Math.PI * 2, 0, ab), M(0x0d1a2a, { metalness: 0, roughness: 1 })); boca.rotation.z = -sg * Math.PI / 2; rot.add(boca); var aro = new T.Mesh(new T.TorusGeometry(r * 0.98, 0.4, 8, 40), M(0x8a96a3)); aro.rotation.y = Math.PI / 2; aro.position.x = sg * r * Math.cos(ab) * 1.4; rot.add(aro); });
    var eje = cil(1.4, 1.4, 22, M(C.inox)); eje.position.y = r * 1.4 + 6; rot.add(eje);
    var as1 = new T.Mesh(new T.TorusGeometry(r * 1.05, 1, 10, 40), M(0xf2f2f2, { metalness: 0 })); as1.rotation.y = Math.PI / 2; as1.position.x = -r * 1.05; var as2 = as1.clone(); as2.position.x = r * 1.05; g.add(as1, as2);
    var ind = actRotativo(g, r * 1.6 + 11);
    etiqueta('Bola con paso total', rot, 0, -r * 1.6, 10); etiqueta('Asientos blandos', g, r * 1.2, r * 1.1, 8);
    var F = flujo(g, r, recta(lx, r));
    return { g: g, F: F, act: function (ap) { rot.rotation.y = (1 - ap) * Math.PI / 2; ind.rotation.y = -ap * Math.PI / 2; } };
  }
  var MOD = { globo: mGlobo, segmento: mSegmento, mariposa: mMariposa, cuchillo: mCuchillo, pinch: mPinch, bola: mBola };

  function cargar(tipo) {
    if (modelo) { escena.remove(modelo.g); modelo.g.traverse(function (o) { if (o.element && o.element.remove) o.element.remove(); if (o.geometry) o.geometry.dispose(); }); }
    modelo = MOD[tipo](); escena.add(modelo.g);
    $('#v3dTit').textContent = INFO[tipo].t; $('#v3dDesc').textContent = INFO[tipo].d;
    document.querySelectorAll('#v3dTipos button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === tipo)); });
    var ty = { globo: 26, cuchillo: 22 }[tipo] || 8, d = ({ globo: 1.45, cuchillo: 1.3 }[tipo] || 1) * Math.max(1, 1.5 / (cam.aspect || 1.5)); ctl.target.set(0, ty, 0); cam.position.set(78 * d, ty + 38 * d, 118 * d);
  }
  function cuadro() {
    if (!abierto) return;
    var dt = Math.min(0.05, reloj.getDelta());
    if (anim.ciclo) { anim.t += dt; anim.obj = 50 + 50 * Math.sin(anim.t * 0.7); $('#v3dAp').value = Math.round(anim.obj); }
    anim.ap += (anim.obj - anim.ap) * Math.min(1, dt * 4);
    $('#v3dApOut').textContent = Math.round(anim.ap) + ' %';
    if (modelo) { modelo.act(anim.ap / 100); moverFlujo(modelo.F, anim.ap / 100, dt); }
    plano.constant = $('#v3dCorte').checked ? 0 : 1000;
    ctl.update(); R.render(escena, cam); lab.render(escena, cam);
  }

  // ── Ventana flotante ──
  var dlg = $('#dlg3d');
  function abrir(tipo) {
    if (!iniciar()) { alert('No se pudo cargar el motor 3D.'); return; }
    abierto = true; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(function () { tamano(); cargar(tipo); }, 30);
  }
  function cerrar() { abierto = false; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  $('#v3dCerrar').addEventListener('click', cerrar);
  dlg.addEventListener('close', function () { abierto = false; });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrar(); });
  $('#v3dAp').addEventListener('input', function () { anim.ciclo = false; $('#v3dCiclo').checked = false; anim.obj = +this.value; });
  $('#v3dCiclo').addEventListener('change', function () { anim.ciclo = this.checked; anim.t = Math.asin(Math.max(-1, Math.min(1, (anim.ap - 50) / 50))) / 0.7; });
  $('#v3dTipos').addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (b) cargar(b.dataset.v); });
  document.querySelectorAll('tr[data-v3d]').forEach(function (tr) {
    tr.tabIndex = 0; tr.title = 'Ver en 3D';
    tr.addEventListener('click', function () { abrir(tr.dataset.v3d); });
    tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(tr.dataset.v3d); } });
  });
  window.__V3D = { abrir: abrir };
})();
