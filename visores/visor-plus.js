/* Suite ReyEngi · herramientas de exploración comunes a todos los visores 3D
 *
 * Se engancha a la biblioteca 3D compartida (window.__LIB) y agrega, a cualquier visor que dibuje con ella:
 * vistas normalizadas con transición, encuadre, indicador de ejes, estilos de presentación (realista, técnico
 * con aristas y rayos X), corte por plano, oclusión ambiental y captura de imagen.
 *
 * No modifica los modelos: los estilos y el corte se aplican solo mientras se dibuja en pantalla, de modo que
 * los planos de montaje y las exportaciones OBJ, STL y DXF salen igual que antes.
 * Es una sola función (window.__VPLUS) para poder insertarla también dentro de los visores que se abren en marco.
 */
window.__VPLUS = function () {
  'use strict';
  var L = window.__LIB; if (!L || L.__vplus) return; L.__vplus = true;
  var T = L.THREE, D = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Registro de controles de órbita (para mover la cámara sin pelear con el visor) ──
  var controles = [];
  if (L.OrbitControls) {
    var OC = L.OrbitControls;
    L.OrbitControls = class extends OC { constructor(a, b) { super(a, b); controles.push(this); } };
  }

  var porEscena = new WeakMap(), visores = [];
  var SP = T.Scene.prototype, antes = SP.onBeforeRender, despues = SP.onAfterRender;

  SP.onBeforeRender = function (r, s, c, rt) {
    try {
      if (!this.userData.__vp) {
        var v = porEscena.get(this);
        if (rt && !(v && v.aTextura)) { if (v && v.lineas.length) { v.ocultas = true; v.lineas.forEach(function (l) { l.visible = false; }); } }
        else {
          if (!v && apto(r, c)) v = crear(r, this, c);
          if (v && v.renderer === r) { v.camera = c; preparar(v); }
        }
      }
    } catch (e) { /* el visor sigue funcionando sin las herramientas */ }
    return antes.apply(this, arguments);
  };
  SP.onAfterRender = function (r) {
    try {
      var v = porEscena.get(this);
      if (v) {
        if (v.ocultas) { v.ocultas = false; v.lineas.forEach(function (l) { l.visible = true; }); }
        if (v.puesto) restaurar(v);
      }
    } catch (e) { /* */ }
    return despues.apply(this, arguments);
  };

  function apto(r, c) {
    var el = r.domElement;
    return el && el.parentElement && el.isConnected && el.clientWidth >= 260 && el.clientHeight >= 200 && c && (c.isPerspectiveCamera || c.isOrthographicCamera);
  }

  // ── Estado por visor ──
  function crear(r, s, c) {
    var v = { renderer: r, scene: s, camera: c, estilo: 'real', eje: '', pos: 50, inv: false, ao: false, n: 0, mallas: [], lineas: [], deLinea: new WeakMap(), mats: new WeakMap(), geos: new WeakMap(), plano: new T.Plane(new T.Vector3(-1, 0, 0), 0), caja: new T.Box3() };
    porEscena.set(s, v); visores.push(v);
    interfaz(v); envolver(v);
    return v;
  }
  function ctl(v) { for (var i = 0; i < controles.length; i++) if (controles[i].object === v.camera) return controles[i]; return null; }

  function esPiso(o) { var t = o.geometry && o.geometry.type; return t === 'PlaneGeometry' || t === 'CircleGeometry' || t === 'RingGeometry'; }
  function esPieza(o) {
    if (!o.isMesh || o.isSprite || o.userData.__vp || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return false;
    var m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.isShadowMaterial || m.isMeshBasicMaterial || m.isShaderMaterial || m.visible === false || m.colorWrite === false) return false;
    return true;
  }
  function recoger(v) {
    var a = []; v.scene.traverseVisible(function (o) { if (esPieza(o)) a.push(o); }); v.mallas = a;
  }
  function limites(v) {
    recoger(v); var b = v.caja.makeEmpty(), todo = new T.Box3(), t = new T.Box3(), d = new T.Vector3();
    v.scene.updateMatrixWorld();
    v.mallas.forEach(function (o) {
      if (esPiso(o)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (!isFinite(t.min.x) || !isFinite(t.max.x)) return;
      todo.union(t); t.getSize(d);
      if (d.y < 0.03 * Math.max(d.x, d.z)) return;      // losas y terrenos planos no cuentan para encuadrar ni para el corte
      b.union(t);
    });
    if (b.isEmpty()) b.copy(todo);
    return b;
  }
  function fondoOscuro(v) {
    var f = v.scene.background; if (f && f.isColor) return (0.299 * f.r + 0.587 * f.g + 0.114 * f.b) < 0.35;
    return true;
  }

  // ── Estilos: se cambian los materiales solo durante el dibujo en pantalla ──
  function juego(v, m) {
    var j = v.mats.get(m);
    if (!j) {
      var osc = fondoOscuro(v);
      j = {
        arcilla: new T.MeshStandardMaterial({ color: 0xC4CCD6, roughness: 0.95, metalness: 0, envMapIntensity: 0.3, side: m.side }),
        fantasma: new T.MeshBasicMaterial({ color: osc ? 0x5CC8EA : 0x2C5EA8, transparent: true, opacity: osc ? 0.1 : 0.08, depthWrite: false, side: T.DoubleSide }),
        linea: new T.LineBasicMaterial({ color: 0x16283A }), lineaX: new T.LineBasicMaterial({ color: osc ? 0x6FD8F5 : 0x0E4C7A, transparent: true, opacity: 0.85 })
      };
      v.mats.set(m, j);
    }
    var cp = m.clippingPlanes || null;
    ['arcilla', 'fantasma', 'linea', 'lineaX'].forEach(function (k) { j[k].clippingPlanes = cp; j[k].clipIntersection = !!m.clipIntersection; });
    return j;
  }
  function aristas(v) {
    v.mallas.forEach(function (o) {
      if (o.isInstancedMesh || o.isSkinnedMesh || esPiso(o) || v.deLinea.has(o)) return;
      var g = o.geometry; if (g.attributes.position.count > 150000) return;
      var e = v.geos.get(g); if (!e) { e = new T.EdgesGeometry(g, 28); v.geos.set(g, e); }
      var m = Array.isArray(o.material) ? o.material[0] : o.material;
      var l = new T.LineSegments(e, juego(v, m).linea); l.userData.__vp = true; l.raycast = function () {}; l.matrixAutoUpdate = false;
      o.add(l); v.deLinea.set(o, l); v.lineas.push(l);
    });
    v.lineas = v.lineas.filter(function (l) { return l.parent; });
  }
  function quitarAristas(v) { v.lineas.forEach(function (l) { if (l.parent) { v.deLinea.delete(l.parent); l.parent.remove(l); } }); v.lineas = []; }

  function preparar(v) {
    var tec = v.estilo !== 'real';
    if (tec && (v.n++ % 20 === 0 || v.sucio)) { v.sucio = false; recoger(v); aristas(v); }
    v.puesto = { mats: null, clip: null };
    if (tec) {
      var x = v.estilo === 'rx', lista = [];
      v.mallas.forEach(function (o) {
        if (!o.parent || esPiso(o)) return;
        var m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m) return;
        var j = juego(v, m); lista.push(o, o.material); o.material = x ? j.fantasma : j.arcilla;
        var l = v.deLinea.get(o); if (l) l.material = x ? j.lineaX : j.linea;
      });
      v.puesto.mats = lista;
    }
    if (v.eje) {
      v.puesto.clip = v.renderer.clippingPlanes;
      v.renderer.clippingPlanes = (v.puesto.clip || []).concat(v.plano);
    }
  }
  function restaurar(v) {
    var p = v.puesto; v.puesto = null;
    if (p.mats) for (var i = 0; i < p.mats.length; i += 2) p.mats[i].material = p.mats[i + 1];
    if (p.clip) v.renderer.clippingPlanes = p.clip;
  }

  function fijarCorte(v) {
    if (!v.eje) return;
    var b = v.cajaCorte || (v.cajaCorte = limites(v).clone()), s = v.inv ? 1 : -1, k = v.eje;
    if (b.isEmpty()) return;
    var d = b.min[k] + (b.max[k] - b.min[k]) * (v.pos / 100);
    v.plano.normal.set(k === 'x' ? s : 0, k === 'y' ? s : 0, k === 'z' ? s : 0); v.plano.constant = -s * d;
  }

  // ── Cámara: vistas normalizadas, encuadre y transición ──
  var VISTAS = { iso: [1, 0.75, 1], frente: [0, 0, 1], atras: [0, 0, -1], der: [1, 0, 0], izq: [-1, 0, 0], planta: [0, 1, 0.0008] };
  function mirar(v, dir, encuadrar) {
    var c = v.camera, k = ctl(v), b = limites(v); if (b.isEmpty()) return;
    var centro = b.getCenter(new T.Vector3()), radio = b.getSize(new T.Vector3()).length() / 2 || 1;
    var obj = k ? k.target.clone() : centro.clone();
    var d = dir ? new T.Vector3(dir[0], dir[1], dir[2]).normalize() : c.position.clone().sub(obj).normalize();
    var dist = c.position.distanceTo(obj);
    if (encuadrar || dir) {
      obj = centro;
      if (c.isPerspectiveCamera) {
        var fv = c.fov * Math.PI / 180, fh = 2 * Math.atan(Math.tan(fv / 2) * c.aspect);
        dist = radio / Math.sin(Math.min(fv, fh) / 2) * 0.9;
        if (k) dist = Math.min(Math.max(dist, k.minDistance || 0), isFinite(k.maxDistance) ? k.maxDistance : dist);
        dist = Math.min(dist, c.far * 0.7);
      }
    }
    var p1 = obj.clone().add(d.multiplyScalar(dist)), p0 = c.position.clone(), o0 = k ? k.target.clone() : obj.clone();
    var zoom0 = c.zoom, zoom1 = zoom0;
    if (c.isOrthographicCamera && (encuadrar || dir)) zoom1 = Math.min((c.right - c.left), (c.top - c.bottom)) / (radio * 2.2);
    var t0 = performance.now(), dur = reduce ? 0 : 420; v.animId = (v.animId || 0) + 1; var id = v.animId;
    var auto = k && k.autoRotate; if (k) k.autoRotate = false;
    (function paso() {
      if (id !== v.animId) return;
      var t = dur ? Math.min(1, (performance.now() - t0) / dur) : 1, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      // se gira alrededor del objetivo para que el modelo no se salga de cuadro a mitad de camino
      var o = o0.clone().lerp(obj, e), a = p0.clone().sub(o0), z = p1.clone().sub(obj), la = a.length(), lz = z.length();
      var dd = a.normalize().lerp(z.normalize(), e); if (dd.lengthSq() < 1e-6) dd.set(0.01, 1, 0.01); dd.normalize();
      c.position.copy(o).add(dd.multiplyScalar(la + (lz - la) * e));
      if (c.isOrthographicCamera) { c.zoom = zoom0 + (zoom1 - zoom0) * e; c.updateProjectionMatrix(); }
      if (k) { k.target.copy(o); k.update(); } else c.lookAt(o);
      if (t < 1) requestAnimationFrame(paso); else if (k && auto) k.autoRotate = true;
    })();
  }

  // ── Oclusión ambiental: sombreado de contacto calculado sobre la profundidad de la imagen ──
  function envolver(v) {
    var r = v.renderer, dibujar = r.render;
    r.render = function (s, c) {
      if (!v.ao || s !== v.scene || r.getRenderTarget()) return dibujar.apply(r, arguments);
      return conAO(v, dibujar, s, c);
    };
  }
  function conAO(v, dibujar, s, c) {
    var r = v.renderer, tam = r.getDrawingBufferSize(new T.Vector2());
    if (!v.rt || v.rt.width !== tam.x || v.rt.height !== tam.y) {
      if (v.rt) { v.rt.depthTexture.dispose(); v.rt.dispose(); }
      v.rt = new T.WebGLRenderTarget(tam.x, tam.y, { depthBuffer: true });
      v.rt.depthTexture = new T.DepthTexture(tam.x, tam.y); v.rt.depthTexture.type = T.UnsignedIntType;
    }
    if (!v.cuad) {
      v.matAO = new T.ShaderMaterial({
        uniforms: { tD: { value: null }, px: { value: new T.Vector2() }, pI: { value: new T.Matrix4() }, pM: { value: new T.Matrix4() }, radio: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: [
          'uniform sampler2D tD; uniform vec2 px; uniform mat4 pI; uniform mat4 pM; uniform float radio; varying vec2 vUv;',
          'vec3 pos(vec2 uv){ float d = texture2D(tD, uv).x; vec4 p = pI * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }',
          'float ruido(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }',
          'void main(){',
          '  float d0 = texture2D(tD, vUv).x, ao = 0.0;',
          '  if (d0 < 0.99999) {',
          '    vec3 p = pos(vUv);',
          '    vec3 n = normalize(cross(dFdx(p), dFdy(p)));',
          '    vec4 q = pM * vec4(p + vec3(radio, 0.0, 0.0), 1.0); float rp = abs(q.x / q.w * 0.5 + 0.5 - vUv.x);',
          '    rp = clamp(rp, 2.0 * px.x, 0.1);',
          '    float a0 = ruido(gl_FragCoord.xy) * 6.2831853, s = 0.0;',
          '    for (int i = 0; i < 16; i++) {',
          '      float f = (float(i) + 0.5) / 16.0, a = a0 + float(i) * 2.3999632;',
          '      vec2 uv = vUv + vec2(cos(a), sin(a) * px.y / px.x) * rp * sqrt(f);',
          '      vec3 w = pos(uv) - p; float l = length(w);',
          '      s += max(0.0, dot(n, w) / (l + 1e-5) - 0.22) * smoothstep(radio * 1.6, radio * 0.4, l);',
          '    }',
          '    ao = clamp(s / 16.0 * 2.4, 0.0, 0.65);',
          '  }',
          '  gl_FragColor = vec4(vec3(1.0 - ao), 1.0);',
          '}'].join('\n'),
        depthTest: false, depthWrite: false, toneMapped: false,
        blending: T.CustomBlending, blendSrc: T.ZeroFactor, blendDst: T.SrcColorFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor
      });
      v.cuad = new T.Scene(); v.cuad.userData.__vp = true;
      var m = new T.Mesh(new T.PlaneGeometry(2, 2), v.matAO); m.frustumCulled = false; v.cuad.add(m);
      v.camC = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    // 1) la escena se dibuja en pantalla como siempre · 2) se toma su profundidad · 3) el sombreado se multiplica encima
    dibujar.call(r, s, c);
    var sm = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false; v.aTextura = true; r.setRenderTarget(v.rt);
    try { dibujar.call(r, s, c); } finally { v.aTextura = false; r.setRenderTarget(null); r.shadowMap.autoUpdate = sm; }
    if (!((v.nAO = (v.nAO || 0) + 1) % 120) || !v.rad) { var b = limites(v); v.rad = b.isEmpty() ? 10 : b.getSize(new T.Vector3()).length(); }
    var u = v.matAO.uniforms; u.tD.value = v.rt.depthTexture; u.px.value.set(1 / tam.x, 1 / tam.y);
    u.pI.value.copy(c.projectionMatrixInverse); u.pM.value.copy(c.projectionMatrix); u.radio.value = v.rad * 0.03;
    var ac = r.autoClear; r.autoClear = false;
    try { dibujar.call(r, v.cuad, v.camC); } finally { r.autoClear = ac; }
  }

  // ── Interfaz ──
  var CSS = '.vp{position:absolute;z-index:8;left:8px;bottom:8px;font:12px/1.35 system-ui,"Segoe UI",sans-serif;color:#EAF2F8;color-scheme:dark;display:flex;align-items:flex-end;gap:8px;pointer-events:none}' +
    '.vp *{box-sizing:border-box}.vp>*{pointer-events:auto}' +
    '.vp button{font:600 12px system-ui,"Segoe UI",sans-serif;color:#EAF2F8;background:#18283C;border:1px solid #2C4563;border-radius:6px;padding:5px 9px;cursor:pointer;min-height:28px}' +
    '.vp button:hover{border-color:#38C8E8}.vp button[aria-pressed=true]{background:#FF8C32;border-color:#FF8C32;color:#1b0d02}' +
    '.vp :focus-visible{outline:2px solid #38C8E8;outline-offset:1px}' +
    '.vp-ab{background:rgba(14,26,42,.92)!important;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
    '.vp-eje{position:absolute!important;z-index:7;inset:auto 8px 8px auto!important;width:74px!important;height:74px!important;display:block;cursor:pointer;border-radius:50%;background:rgba(14,26,42,.55)}@media print{.vp-eje{display:none!important}}' +
    '.vp-pan{position:absolute;left:0;bottom:36px;width:268px;max-width:calc(100vw - 24px);max-height:min(430px,calc(100vh - 70px));overflow:auto;background:rgba(14,26,42,.96);border:1px solid #2C4563;border-radius:10px;padding:10px 12px;box-shadow:0 10px 28px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:6px}' +
    '.vp-pan[hidden]{display:none}.vp-pan h4{margin:6px 0 0;font:600 10px ui-monospace,Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;color:#FFB070}.vp-pan h4:first-child{margin-top:0}' +
    '.vp-f{display:flex;flex-wrap:wrap;gap:4px}.vp-f button{flex:1 1 auto}' +
    '.vp-pan label{display:flex;align-items:center;gap:7px;color:#EAF2F8}.vp-pan input[type=range]{flex:1;min-width:0;accent-color:#FF8C32}.vp-pan input[type=checkbox]{accent-color:#FF8C32;width:15px;height:15px;margin:0}' +
    '.vp-pan p{margin:0;color:#94A9BE;font-size:11px}' +
    '@media print{.vp{display:none!important}}';
  function interfaz(v) {
    if (!D.getElementById('vp-css')) { var st = D.createElement('style'); st.id = 'vp-css'; st.textContent = CSS; D.head.appendChild(st); }
    var cont = v.renderer.domElement.parentElement;
    if (getComputedStyle(cont).position === 'static') cont.style.position = 'relative';
    var caja = D.createElement('div'); caja.className = 'vp';
    caja.innerHTML =
      '<div style="position:relative"><button type="button" class="vp-ab" aria-expanded="false">Explorar</button>' +
      '<div class="vp-pan" hidden role="group" aria-label="Herramientas de exploración del modelo">' +
      '<h4>Vistas</h4><div class="vp-f" data-g="vista"><button data-v="iso">Isométrica</button><button data-v="frente">Frente</button><button data-v="atras">Posterior</button><button data-v="der">Derecha</button><button data-v="izq">Izquierda</button><button data-v="planta">Planta</button></div>' +
      '<div class="vp-f"><button data-a="enc">Encuadrar modelo</button></div>' +
      '<h4>Estilo</h4><div class="vp-f" data-g="estilo"><button data-e="real" aria-pressed="true">Realista</button><button data-e="tec" aria-pressed="false">Técnico</button><button data-e="rx" aria-pressed="false">Rayos X</button></div>' +
      '<label><input type="checkbox" data-a="ao"> Oclusión ambiental (sombras de contacto)</label>' +
      '<h4>Corte</h4><div class="vp-f" data-g="eje"><button data-c="" aria-pressed="true">Sin corte</button><button data-c="x" aria-pressed="false">X</button><button data-c="y" aria-pressed="false">Y</button><button data-c="z" aria-pressed="false">Z</button></div>' +
      '<label>Posición <input type="range" min="0" max="100" value="50" data-a="pos" disabled aria-label="Posición del plano de corte"></label>' +
      '<label><input type="checkbox" data-a="inv" disabled> Invertir el lado que se conserva</label>' +
      '<h4>Imagen</h4><div class="vp-f"><button data-a="png">Guardar captura PNG</button></div>' +
      '<p>El estilo, el corte y la oclusión son solo de pantalla: no cambian el plano de montaje ni las exportaciones.</p>' +
      '</div></div>';
    cont.appendChild(caja);
    var cvEje = D.createElement('canvas'); cvEje.className = 'vp-eje'; cvEje.width = cvEje.height = 148; cvEje.setAttribute('role', 'img');
    cvEje.setAttribute('aria-label', 'Indicador de ejes. Clic en un eje para mirar el modelo desde ahí.'); cont.appendChild(cvEje);
    ['pointerdown', 'touchstart', 'dblclick'].forEach(function (n) { cvEje.addEventListener(n, function (e) { e.stopPropagation(); }); });
    var ab = caja.querySelector('.vp-ab'), pan = caja.querySelector('.vp-pan'), q = function (s) { return pan.querySelector(s); };
    v.ui = { caja: caja, ao: q('[data-a=ao]'), eje: cvEje };
    function abrir(si) { pan.hidden = !si; ab.setAttribute('aria-expanded', String(si)); }
    ab.addEventListener('click', function () { abrir(pan.hidden); });
    caja.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pan.hidden) { e.stopPropagation(); abrir(false); ab.focus(); } });
    ['pointerdown', 'wheel', 'touchstart', 'dblclick', 'contextmenu'].forEach(function (n) { caja.addEventListener(n, function (e) { e.stopPropagation(); }); });
    function marcar(g, b) { [].forEach.call(pan.querySelectorAll('[data-g=' + g + '] button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
    pan.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.v) mirar(v, VISTAS[b.dataset.v]);
      else if (b.dataset.a === 'enc') mirar(v, null, true);
      else if (b.dataset.e) { v.estilo = b.dataset.e; marcar('estilo', b); if (v.estilo === 'real') quitarAristas(v); else v.sucio = true; }
      else if ('c' in b.dataset) {
        v.eje = b.dataset.c; marcar('eje', b); v.cajaCorte = null;
        q('[data-a=pos]').disabled = q('[data-a=inv]').disabled = !v.eje; fijarCorte(v);
      }
      else if (b.dataset.a === 'png') captura(v);
    });
    q('[data-a=pos]').addEventListener('input', function () { v.pos = +this.value; fijarCorte(v); });
    q('[data-a=inv]').addEventListener('change', function () { v.inv = this.checked; fijarCorte(v); });
    v.ui.ao.addEventListener('change', function () { v.ao = this.checked; });
    v.ui.eje.addEventListener('click', function (e) {
      var r = this.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 148, y = (e.clientY - r.top) / r.height * 148, m = null, dm = 18;
      (v.puntos || []).forEach(function (p) { var d = Math.hypot(p.x - x, p.y - y); if (d < dm) { dm = d; m = p; } });
      if (m) mirar(v, m.d[1] ? [m.d[0], m.d[1], 0.0008] : m.d);
    });
    (function ciclo() { if (!caja.isConnected) return; ejes(v); requestAnimationFrame(ciclo); })();
  }

  // Indicador de ejes: X rojo, Y verde (vertical), Z azul, dibujado según la orientación de la cámara
  var EJES = [['X', [1, 0, 0], '#F0625A'], ['Y', [0, 1, 0], '#5BD06A'], ['Z', [0, 0, 1], '#4FA8FF']];
  function ejes(v) {
    var c = v.camera, cv = v.ui.eje, firma = c.quaternion.x.toFixed(4) + c.quaternion.y.toFixed(4) + c.quaternion.z.toFixed(4) + c.quaternion.w.toFixed(4);
    if (firma === v.firma) return; v.firma = firma;
    var g = cv.getContext('2d'), inv = c.quaternion.clone().invert(), pts = [];
    EJES.forEach(function (e) {
      [1, -1].forEach(function (s) {
        var w = new T.Vector3(e[1][0] * s, e[1][1] * s, e[1][2] * s), p = w.clone().applyQuaternion(inv);
        pts.push({ x: 74 + p.x * 48, y: 74 - p.y * 48, z: p.z, s: s, n: e[0], col: e[2], d: [w.x, w.y, w.z] });
      });
    });
    pts.sort(function (a, b) { return a.z - b.z; }); v.puntos = pts;
    g.clearRect(0, 0, 148, 148);
    pts.forEach(function (p) {
      g.globalAlpha = p.z < 0 ? 0.55 : 1;
      if (p.s > 0) { g.strokeStyle = p.col; g.lineWidth = 4; g.beginPath(); g.moveTo(74, 74); g.lineTo(p.x, p.y); g.stroke(); }
      g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.s > 0 ? 15 : 9, 0, 6.2832); g.fill();
      if (p.s > 0) { g.fillStyle = '#08121E'; g.font = '700 17px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.n, p.x, p.y + 1); }
    });
    g.globalAlpha = 1;
  }

  function captura(v) {
    var r = v.renderer;
    r.render(v.scene, v.camera);                     // se dibuja y se lee en el mismo paso, antes de que el navegador limpie el lienzo
    r.domElement.toBlob(function (b) {
      if (!b) return;
      var a = D.createElement('a'), t = (D.title || 'modelo').replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]+/g, ' ').trim().replace(/\s+/g, '-').slice(0, 60) || 'modelo';
      a.href = URL.createObjectURL(b); a.download = 'captura-' + t + '.png'; D.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  }
};
if (window.__LIB) window.__VPLUS();
