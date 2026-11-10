/* Vista 3D de la planta de espesamiento · Suite ReyEngi
 * Escena procedural (three.js): espesador en corte con cama, zona clara, feedwell, puente y rastras con levante;
 * túnel y sala de bombas de descarga, línea de relaves, planta de floculante, estanque de agua recuperada y sumideros.
 * Los colores y niveles siguen al modelo dinámico; las etiquetas muestran los tags de la configuración de planta.
 */
(function () {
  'use strict';
  function crear(cont) {
    var LIB = window.__LIB; if (!LIB) return null;
    var T = LIB.THREE, R = new T.WebGLRenderer({ antialias: true });
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.localClippingEnabled = true;
    R.toneMapping = T.ACESFilmicToneMapping; R.outputColorSpace = T.SRGBColorSpace; cont.appendChild(R.domElement);
    var lab = new LIB.CSS2DRenderer(); lab.domElement.className = 'lab3d'; cont.appendChild(lab.domElement);
    var esc = new T.Scene(); esc.background = new T.Color(0x0b1828);
    var pm = new T.PMREMGenerator(R); esc.environment = pm.fromScene(new LIB.RoomEnvironment(), 0.04).texture;
    esc.add(new T.HemisphereLight(0xffffff, 0x334455, 0.7)); var sol = new T.DirectionalLight(0xffffff, 1.3); sol.position.set(60, 90, 40); esc.add(sol);
    var cam = new T.PerspectiveCamera(40, 1, 0.5, 2000); cam.position.set(55, 42, 66);
    var ctl = new LIB.OrbitControls(cam, R.domElement); ctl.enableDamping = true; ctl.target.set(6, 0, 4); ctl.maxPolarAngle = Math.PI * 0.49;
    var corte = new T.Plane(new T.Vector3(0, 0, -1), 0);
    function M(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, metalness: 0.3, roughness: 0.6, side: T.DoubleSide }, o || {})); }
    function C(m) { m.clippingPlanes = [corte]; return m; }
    function cil(r1, r2, h, mat, seg) { return new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 48, 1, true), mat); }
    function caja(x, y, z, mat) { return new T.Mesh(new T.BoxGeometry(x, y, z), mat); }
    function tubo(pts, r, mat) { var c = new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }), false, 'catmullrom', 0.05); return new T.Mesh(new T.TubeGeometry(c, Math.max(12, pts.length * 10), r, 10, false), mat); }
    function etiqueta(obj, x, y, z) { var d = document.createElement('div'); d.className = 'tag3d'; var o = new LIB.CSS2DObject(d); o.position.set(x, y, z); obj.add(o); return d; }

    var p = window.ESP_MODELO.parametros(), Rt = p.D / 2, H = p.H, K = p.cono;
    var raiz = new T.Group(); esc.add(raiz);
    // Terreno con hueco para el cono
    var piso = new T.Mesh(new T.RingGeometry(Rt + 0.6, 140, 64), M(0x1d2b3a, { roughness: 1 })); piso.rotation.x = -Math.PI / 2; piso.position.y = -0.02; raiz.add(piso);
    // Estanque: muro, cono y anillo
    var concreto = C(M(0x8d96a0, { roughness: 0.9 }));
    raiz.add(cil(Rt, Rt, H, concreto, 96).translateY(H / 2));
    var cono = cil(Rt, 1.2, K, concreto, 96); cono.position.y = -K / 2; raiz.add(cono);
    var borde = new T.Mesh(new T.TorusGeometry(Rt, 0.35, 8, 96), M(0x6f7a85)); borde.rotation.x = Math.PI / 2; borde.position.y = H; raiz.add(borde);
    var canaleta = new T.Mesh(new T.TorusGeometry(Rt - 1.0, 0.45, 8, 96), C(M(0x5d6872))); canaleta.rotation.x = Math.PI / 2; canaleta.position.y = H - 0.5; raiz.add(canaleta);
    // Cama y zona clara (geometría de revolución que se regenera con el nivel)
    var matCama = C(M(0x6b4f33, { roughness: 1 })), matAgua = C(M(0x3b7fae, { transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false }));
    var cama = new T.Mesh(new T.BufferGeometry(), matCama), agua = new T.Mesh(new T.BufferGeometry(), matAgua); raiz.add(cama, agua);
    function rCono(y) { return y >= 0 ? Rt : Math.max(1.2, 1.2 + (Rt - 1.2) * (y + K) / K); }
    function perfil(y0, y1) { var pts = [new T.Vector2(0.01, y0)], n = 14; for (var i = 0; i <= n; i++) { var y = y0 + (y1 - y0) * i / n; pts.push(new T.Vector2(rCono(y) - 0.05, y)); } pts.push(new T.Vector2(0.01, y1)); return pts; }
    var ultLb = -1;
    function geometriaCama(Lb) {
      var yb = Math.min(H - 0.6, -K + Math.max(0.05, Lb));
      cama.geometry.dispose(); cama.geometry = new T.LatheGeometry(perfil(-K, yb), 72);
      agua.geometry.dispose(); agua.geometry = new T.LatheGeometry(perfil(yb, H - 0.25), 72);
      return yb;
    }
    // Feedwell, puente, accionamiento, eje y rastras
    var acero = M(0xb8c2cc, { metalness: 0.6, roughness: 0.4 }), azul = M(0x2a5d94, { metalness: 0.4 });
    var feedwell = cil(4, 4, 4, C(M(0x9aa8b6, { metalness: 0.5, transparent: true, opacity: 0.85 }))); feedwell.position.y = H - 2.2; raiz.add(feedwell);
    var puente = caja(Rt + 2, 0.9, 3, azul); puente.position.set(-(Rt + 2) / 2, H + 1.6, 0); raiz.add(puente);
    var baranda = caja(Rt + 2, 0.08, 0.08, M(0xffd23f)); baranda.position.set(-(Rt + 2) / 2, H + 2.8, 1.5); raiz.add(baranda);
    var accion = cil(2.2, 2.2, 1.8, M(0x2a4f7a), 32); accion.position.y = H + 2.9; raiz.add(accion);
    var tapa = new T.Mesh(new T.CircleGeometry(2.2, 32), M(0x2a4f7a)); tapa.rotation.x = -Math.PI / 2; tapa.position.y = H + 3.8; raiz.add(tapa);
    var rot = new T.Group(); raiz.add(rot);
    var eje = cil(0.45, 0.45, H + K + 2, acero, 16); eje.position.y = (H - K + 2) / 2 - 0.5; rot.add(eje);
    var brazos = new T.Group(); rot.add(brazos);
    [0, Math.PI].forEach(function (a) {
      var largo = Rt * 0.94, ang = Math.atan2(K, Rt - 1.2);
      var brazo = caja(largo, 0.5, 0.7, acero); brazo.position.set(Math.cos(a) * largo / 2, -K + 0.9 + Math.tan(ang) * largo / 2, -Math.sin(a) * largo / 2); brazo.rotation.y = a; brazo.rotation.z = ang; brazos.add(brazo);
      for (var i = 1; i < 9; i++) { var d = i * largo / 9, hoja = caja(0.15, 0.9, 1.6, M(0x7a8794)); hoja.position.set(Math.cos(a) * d, -K + 0.5 + Math.tan(ang) * d, -Math.sin(a) * d); hoja.rotation.y = a + 0.5; brazos.add(hoja); }
    });
    // Alimentación
    var matFeed = M(0xd9822b, { metalness: 0.4 });
    raiz.add(tubo([[-Rt - 30, 1.5, 0], [-Rt - 12, H + 2.4, 0], [-4, H + 2.4, 0], [0, H - 0.5, 0]], 0.45, matFeed));
    // Túnel y sala de bombas de descarga
    var xs = Rt + 16, yT = -K - 2;
    var tunel = caja(xs - 4, 3.2, 4, C(M(0x59636d, { transparent: true, opacity: 0.35 }))); tunel.position.set((xs - 4) / 2, yT + 1.2, 0); raiz.add(tunel);
    var sala = caja(16, 7, 16, M(0x3d5a7a, { transparent: true, opacity: 0.18, depthWrite: false })); sala.position.set(xs + 3, 3.5, 0); raiz.add(sala);
    var losa = caja(16, 0.3, 16, M(0x59636d)); losa.position.set(xs + 3, 0.15, 0); raiz.add(losa);
    var matUF = M(0x8a6a48, { metalness: 0.3 });
    raiz.add(tubo([[0, -K - 0.2, 0], [0, yT + 1, 0], [xs - 7, yT + 1, 0], [xs - 4, 1.2, 0], [xs - 2, 1.2, 0]], 0.38, matUF));
    var bombas = [], ruedas = [];
    [-3, 3].forEach(function (z, i) {
      var g = new T.Group(); g.position.set(xs + 1, 0.3, z); raiz.add(g);
      var cuerpo = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 0.9, 32), M(0x8a96a3, { metalness: 0.5 })); cuerpo.rotation.x = Math.PI / 2; cuerpo.position.y = 1.2; g.add(cuerpo);
      var motor = caja(2.4, 1.3, 1.3, M(0x555f6a)); motor.position.set(2.2, 1.2, 0); g.add(motor);
      var base = caja(5, 0.4, 2, M(0x333a42)); base.position.set(1, 0.2, 0); g.add(base);
      var luz = new T.Mesh(new T.SphereGeometry(0.35, 12, 8), new T.MeshBasicMaterial({ color: 0x777777 })); luz.position.set(2.2, 2.3, 0); g.add(luz);
      var rueda = caja(0.15, 1.5, 0.2, M(0xdddddd)); rueda.position.set(0, 1.2, 0.5); g.add(rueda);
      bombas.push({ g: g, luz: luz }); ruedas.push(rueda);
      raiz.add(tubo([[xs - 2, 1.2, 0], [xs - 0.8, 1.3, z * 0.6], [xs + 0.1, 1.5, z]], 0.3, matUF));
      raiz.add(tubo([[xs + 1, 2.7, z], [xs + 4, 5, z], [xs + 9, 5.5, z * 0.3]], 0.3, matUF));
    });
    var linea = tubo([[xs + 9, 5.5, 0], [xs + 20, 1.2, 0], [xs + 70, 1.2, -10]], 0.42, matUF); raiz.add(linea);
    // Planta de floculante
    var fx = -Rt - 22, fz = 22, matTk = M(0xc8d0d8, { metalness: 0.4, transparent: true, opacity: 0.45, depthWrite: false });
    var tkF = [], nivF = [];
    [[-4, 0], [4, 0]].forEach(function (o, i) {
      var t = cil(2.5, 2.5, 5.5, matTk, 32); t.position.set(fx + o[0], 2.75, fz + o[1]); raiz.add(t);
      var n = new T.Mesh(new T.CylinderGeometry(2.35, 2.35, 1, 32), M(0x7fc38a, { transparent: true, opacity: 0.85 })); n.position.set(fx + o[0], 0.5, fz + o[1]); raiz.add(n);
      tkF.push(t); nivF.push(n);
    });
    var tkAg = cil(3, 3, 5, matTk, 32); tkAg.position.set(fx, 2.5, fz + 9); raiz.add(tkAg);
    var agit = caja(0.2, 4, 0.2, acero); agit.position.set(fx, 3, fz + 9); raiz.add(agit);
    var prep = caja(6, 3, 3.5, M(0x3c6e4a)); prep.position.set(fx, 1.5, fz - 7); raiz.add(prep);
    var matFloc = M(0x7fd38a, { emissive: 0x1e5a2a, emissiveIntensity: 0.3 });
    var dosif = tubo([[fx + 2, 3, fz - 2], [fx + 10, H + 3, 8], [-6, H + 3, 3], [-1.5, H - 0.2, 1.5]], 0.15, matFloc); raiz.add(dosif);
    // Agua recuperada
    var ax = Rt + 12, az = -32;
    var tkA = cil(7, 7, 6, matTk, 48); tkA.position.set(ax, 3, az); raiz.add(tkA);
    var nivA = new T.Mesh(new T.CylinderGeometry(6.85, 6.85, 1, 48), M(0x3b7fae, { transparent: true, opacity: 0.7 })); nivA.position.set(ax, 0.5, az); raiz.add(nivA);
    raiz.add(tubo([[Rt - 0.5, H - 0.6, -2], [Rt + 4, H - 1.2, -10], [ax - 4, 6.2, az + 5]], 0.4, M(0x3b7fae)));
    var bombasA = [];
    [-4, 0, 4].forEach(function (dx) { var b = new T.Mesh(new T.SphereGeometry(0.7, 14, 10), new T.MeshBasicMaterial({ color: 0x777777 })); b.position.set(ax + 10, 0.7, az + dx); raiz.add(b); bombasA.push(b); });
    // Sumideros
    var sum = caja(3, 1.2, 3, M(0x4a5560, { transparent: true, opacity: 0.6 })); sum.position.set(xs + 7, 0.6, 6.5); raiz.add(sum);
    var luzSum = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshBasicMaterial({ color: 0x777777 })); luzSum.position.set(xs + 7, 1.6, 6.5); raiz.add(luzSum);

    // Etiquetas
    var E = {
      thk: etiqueta(raiz, -Rt * 0.55, H + 6, 0), cama: etiqueta(raiz, Rt * 0.45, 0.5, -Rt * 0.25), feed: etiqueta(raiz, -Rt - 14, H + 4.5, 0),
      uf1: etiqueta(raiz, xs + 2, 4.2, -3.5), uf2: etiqueta(raiz, xs + 2, 4.2, 3.5), linea: etiqueta(raiz, xs + 30, 3.5, -2),
      floc: etiqueta(raiz, fx, 8, fz), agua: etiqueta(raiz, ax, 8.5, az), sum: etiqueta(raiz, xs + 8, 2.6, 8), torque: etiqueta(raiz, 0, H + 6.5, -2)
    };

    function tamano() { var w = cont.clientWidth, h = cont.clientHeight; if (!w || !h) return; R.setSize(w, h); lab.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    new ResizeObserver(tamano).observe(cont); tamano();
    var reloj = new T.Clock(), estado = null, cfg = null, angulo = 0, conCorte = true;
    var cBed0 = new T.Color(0x9a7a52), cBed1 = new T.Color(0x4a3420), cClear = new T.Color(0x3b7fae), cTurb = new T.Color(0x8a6a48), tmp = new T.Color();
    function f1(v) { return (+v).toLocaleString('es-CL', { maximumFractionDigits: 1, minimumFractionDigits: 1 }); }
    function f0(v) { return Math.round(+v).toLocaleString('es-CL'); }
    function luz(m, s) { m.color.setHex(s === 'on' ? 0x3fbf7f : s === 'falla' ? 0xe5484d : 0x6b7480); }
    function cuadro() {
      var dt = Math.min(0.05, reloj.getDelta());
      if (estado) {
        var s = estado, m = s.m, tg = function (r) { return window.ESP_PLANTA.tag(cfg, r); };
        corte.constant = conCorte ? 0 : 1000;
        if (Math.abs(m.Lb - ultLb) > 0.03 || ultLb < 0) { geometriaCama(m.Lb); ultLb = m.Lb; }
        var yb = -K + Math.max(0.05, m.Lb);
        matCama.color.copy(tmp.copy(cBed0).lerp(cBed1, Math.max(0, Math.min(1, (s.Cu - 0.45) / 0.25))));
        matAgua.color.copy(tmp.copy(cClear).lerp(cTurb, Math.max(0, Math.min(1, Math.log10(Math.max(10, s.tss)) / 4 - 0.4))));
        if (s.rastras) angulo += dt * 0.35; rot.rotation.y = angulo;
        brazos.position.y = 1.5 * s.lift / 100;
        s.bombas.forEach(function (b, i) { var st = b.falla ? 'falla' : b.on ? 'on' : 'off'; luz(bombas[i].luz.material, st); if (st === 'on') ruedas[i].rotation.z += dt * 20 * b.N / 100; });
        s.tkFloc.forEach(function (v, i) { nivF[i].scale.y = Math.max(0.02, v * 5.3); nivF[i].position.y = Math.max(0.02, v * 5.3) / 2; });
        nivA.scale.y = Math.max(0.02, s.nAgua * 5.8); nivA.position.y = nivA.scale.y / 2;
        s.bombasAgua.forEach(function (on, i) { luz(bombasA[i].material, on ? 'on' : 'off'); });
        luz(luzSum.material, s.sumOn ? 'on' : 'off');
        dosif.visible = s.dosisReal > 0.5; agit.rotation.y += dt * 3;
        var b = s.bombas[s.duty];
        E.thk.innerHTML = '<b>' + tg('thk') + '</b> · Ø ' + p.D + ' m<br>Cama ' + f1(m.LIT) + ' m · Rebose ' + f0(s.tss) + ' mg/L';
        E.torque.innerHTML = '<b>' + tg('tq') + '</b> ' + f0(s.torque) + ' % · levante ' + f0(s.lift) + ' %' + (s.rastras ? '' : ' · <span class="mal">DETENIDAS</span>');
        E.cama.innerHTML = '<b>' + tg('dt_uf') + '</b> ' + f1(m.DIT) + ' % p/p';
        E.feed.innerHTML = '<b>' + tg('ft_f') + '</b> ' + f0(m.FITf) + ' m³/h · ' + f1(m.DITf) + ' %<br>Floculante ' + f1(s.dosisReal) + ' g/t';
        ['uf1', 'uf2'].forEach(function (r, i) { var x = s.bombas[i]; E[r].innerHTML = '<b>' + tg(r) + '</b> ' + (x.falla ? '<span class="mal">FALLA</span>' : x.on ? f0(x.N) + ' %' : 'detenida'); });
        E.linea.innerHTML = '<b>' + tg(s.duty ? 'ft_uf2' : 'ft_uf1') + '</b> ' + f0(m.FIT) + ' m³/h · ' + f1(m.vel) + ' m/s';
        E.floc.innerHTML = '<b>' + tg('tkf1') + ' / ' + tg('tkf2') + '</b><br>' + f0(s.tkFloc[0] * 100) + ' % · ' + f0(s.tkFloc[1] * 100) + ' %' + (s.prep ? ' · preparando' : '');
        E.agua.innerHTML = '<b>' + tg('tka') + '</b> ' + f0(s.nAgua * 100) + ' % · ' + f0(m.Qagua) + ' m³/h';
        E.sum.innerHTML = '<b>' + tg('sum1') + '</b> ' + f0(s.nSum * 100) + ' %';
      }
      ctl.update(); R.render(esc, cam); lab.render(esc, cam);
    }
    R.setAnimationLoop(cuadro);
    return {
      actualizar: function (s, c) { estado = s; cfg = c; },
      corte: function (v) { conCorte = v; },
      vista: function (n) { var V = { general: [[55, 42, 66], [6, 0, 4]], espesador: [[0, 30, 45], [0, 0, 0]], bombas: [[xs + 20, 12, 24], [xs + 2, 1.5, 0]], floculante: [[fx + 18, 14, fz + 22], [fx, 2, fz]] }[n]; if (!V) return; cam.position.set.apply(cam.position, V[0]); ctl.target.set.apply(ctl.target, V[1]); }
    };
  }
  window.ESP_3D = { crear: crear };
})();
