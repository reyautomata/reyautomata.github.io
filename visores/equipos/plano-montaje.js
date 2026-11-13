/* Plano de montaje A3 (PDF + DXF + PNG) generado desde el modelo 3D.
 * Es el mismo generador de los visores 1 al 16; aquí se comparte con los visores del motor de equipos (17 en adelante)
 * para que todos los detalles de montaje entreguen la misma lámina, con lista de materiales, notas y rótulo ReyEngi. */
window.__PLANO = function (scene, renderer, camera, controls, labelsFn, THREE) {
/* ---------- Plano de montaje: lámina generada desde el modelo 3D (PNG / PDF) ---------- */
(() => {
  const aside = document.querySelector('aside');
  if (!aside) return;
  const st = document.createElement('style');
  st.textContent = `
.plano-ov { position: fixed; inset: 0; z-index: 60; background: rgba(6, 14, 24, .94); display: grid; grid-template-rows: auto minmax(0, 1fr); }
.plano-ov[hidden] { display: none; }
.plano-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px max(12px, env(safe-area-inset-right, 0px)) 10px max(12px, env(safe-area-inset-left, 0px)); padding-top: calc(10px + env(safe-area-inset-top, 0px)); background: #022A55; color: #fff; border-bottom: 3px solid #EF5A05; }
.plano-bar b { font: 700 18px var(--f-display, sans-serif); letter-spacing: .5px; margin-right: auto; }
.plano-bar button { font: 600 13px var(--f-body, sans-serif); border-radius: 8px; padding: 8px 12px; min-height: 40px; cursor: pointer; border: 1.5px solid #2C5A8C; background: #0A3B70; color: #fff; }
.plano-bar button.pri { background: #EF5A05; border-color: #EF5A05; color: #fff; }
.plano-bar button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.plano-body { overflow: auto; padding: 12px; display: grid; place-items: start center; -webkit-overflow-scrolling: touch; }
.plano-body img { width: 100%; max-width: 1600px; height: auto; background: #fff; box-shadow: 0 6px 30px rgba(0, 0, 0, .5); cursor: zoom-in; }
.plano-body img.zoom { width: 260%; max-width: none; cursor: zoom-out; }
.plano-msg { color: #cfd8e3; font: 500 15px var(--f-body, sans-serif); padding: 40px 10px; text-align: center; }
.plano-sec .pbtns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.plano-sec .pbtns button { font: 600 13.5px var(--f-body, sans-serif); color: var(--fg); background: var(--chip); border: 1.5px solid var(--line); border-radius: 8px; padding: 9px 10px; min-height: 44px; cursor: pointer; text-align: center; }
.plano-sec .pbtns button.wide { grid-column: 1 / -1; }
.plano-sec .pbtns button.pri { background: var(--accent); border-color: var(--accent); color: #fff; }
.plano-sec .pbtns button:disabled { opacity: .55; cursor: progress; }
.plano-sec .pbtns button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.plano-sec .pstat { min-height: 1.2em; }
.plano-pv .pv-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; padding: 10px; overflow: hidden; min-height: 0; }
.plano-pv .pv-stage { position: relative; display: grid; place-items: center; min-height: 0; }
.plano-pv canvas { display: block; width: auto; height: auto; max-width: 100%; max-height: calc(100vh - 90px); background: #fff; box-shadow: 0 6px 30px rgba(0, 0, 0, .5); touch-action: none; }
.plano-pv .pv-busy { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: #EF5A05; color: #fff; font: 600 12.5px var(--f-body, sans-serif); padding: 4px 12px; border-radius: 999px; }
.plano-pv .pv-panel { color: #E6ECF2; font: 12.5px var(--f-body, sans-serif); display: flex; flex-direction: column; gap: 7px; overflow: auto; min-height: 0; padding-right: 4px; }
.plano-pv .pv-panel h3 { margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #24405f; font: 700 11px var(--f-mono, monospace); letter-spacing: 1px; text-transform: uppercase; color: #FF9A5C; }
.plano-pv .pv-panel h3:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
.plano-pv .pv-panel p { margin: 0; color: #9FB0C2; line-height: 1.4; font-size: 11.5px; }
.plano-pv .pv-panel select, .plano-pv .pv-panel input[type=text] { width: 100%; box-sizing: border-box; font: 12.5px var(--f-body, sans-serif); color: #E6ECF2; background: #0B1B2E; border: 1px solid #2C5A8C; border-radius: 6px; padding: 4px 7px; min-height: 28px; }
.plano-pv .pv-panel select:focus-visible, .plano-pv .pv-panel input:focus-visible { outline: 2px solid #EF5A05; outline-offset: 1px; }
.plano-pv .pv-vista { display: grid; gap: 3px; }
.plano-pv .pv-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.plano-pv .pv-campos label { display: grid; gap: 2px; font-weight: 600; font-size: 11px; color: #9FB0C2; }
.plano-pv .pv-btns button.wide { grid-column: 1 / -1; }
.plano-pv .pv-panel label { display: flex; justify-content: space-between; font-weight: 600; }
.plano-pv .pv-panel output { font-family: var(--f-mono, monospace); color: #FF9A5C; }
.plano-pv .pv-panel input[type=range] { width: 100%; accent-color: #EF5A05; }
.plano-pv .pv-btns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.plano-pv .pv-btns button { font: 600 12.5px var(--f-body, sans-serif); border-radius: 8px; padding: 8px 8px; min-height: 38px; cursor: pointer; border: 1.5px solid #2C5A8C; background: #0A3B70; color: #fff; }
@media (max-width: 760px) { .plano-pv .pv-body { grid-template-columns: 1fr; overflow: auto; } .plano-pv canvas { max-height: 58vh; } .plano-pv .pv-panel { overflow: visible; } }
.plano-hint { color: #9fb0c2; font: 12.5px var(--f-body, sans-serif); text-align: center; padding: 8px 0 0; }
`;
  document.head.appendChild(st);
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  // Sección "Plano de montaje" en el panel derecho
  const sec = mk('div', 'group plano-sec');
  sec.appendChild(mk('h2', '', 'Plano de montaje'));
  sec.appendChild(mk('p', 'note', 'Lámina A3 generada desde el modelo, con globos numerados, lista de ítems y rótulo. En la ventana de ajuste eliges la vista de cada recuadro (isométrica, frontal, posterior, laterales, planta, inferior), mueves los globos y eliges la viñeta antes de exportar.'));
  const pb = mk('div', 'pbtns');
  const bPrev = mk('button', 'wide pri', 'Ajustar plano antes de exportar');
  pb.appendChild(bPrev);
  const bView = mk('button', 'wide', 'Ver plano'), bGenPdf = mk('button', 'pri', 'Descargar PDF + DXF'), bGenPng = mk('button', '', 'Descargar PNG'), bGenDxf = mk('button', 'wide', 'Solo DXF (AutoCAD)');
  pb.append(bView, bGenPdf, bGenPng, bGenDxf); sec.appendChild(pb);
  sec.appendChild(mk('p', 'note', 'El DXF (R12, en mm, A3 a escala 1:1 de la lámina) abre directo en AutoCAD, BricsCAD o LibreCAD; para tenerlo en DWG ábrelo y usa «Guardar como» DWG.'));
  let bOrig = null, bOrigPdf = null;
  if (window.__ORIG) {
    sec.appendChild(mk('h2', '', 'Plano original · ' + (typeof window.__ORIG.hoja === 'number' ? 'hoja ' : '') + window.__ORIG.hoja));
    const pb2 = mk('div', 'pbtns');
    bOrig = mk('button', '', 'Ver hoja'); bOrigPdf = mk('button', '', 'Descargar PDF');
    pb2.append(bOrig, bOrigPdf); sec.appendChild(pb2);
    sec.appendChild(mk('p', 'note', 'Solo en tu app offline: hoja del plano del proyecto, uso interno.'));
  }
  const stat = mk('p', 'note pstat'); stat.setAttribute('aria-live', 'polite'); sec.appendChild(stat);
  [bPrev, bView, bGenPdf, bGenPng, bGenDxf, bOrig, bOrigPdf].forEach((b) => { if (b) b.type = 'button'; });
  const firstInfo = [...aside.children].find((c) => c.classList.contains('info'));
  aside.insertBefore(sec, firstInfo || null);

  const ov = mk('div', 'plano-ov'); ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  const bar = mk('div', 'plano-bar'), ttl = mk('b'), body = mk('div', 'plano-body');
  const bPdf = mk('button', 'pri', 'Descargar PDF + DXF'), bDxf = mk('button', '', 'Solo DXF'), bPng = mk('button', '', 'Descargar PNG'), bClose = mk('button', '', 'Cerrar');
  [bPdf, bDxf, bPng, bClose].forEach((b) => { b.type = 'button'; });
  bar.append(ttl, bPdf, bDxf, bPng, bClose); ov.append(bar, body); document.body.appendChild(ov);
  let current = null;                                  // { png: dataURL | null, pdf: Uint8Array, name }
  const close = () => { ov.hidden = true; body.innerHTML = ''; current = null; };
  bClose.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ov.hidden) close(); });
  // En claude.ai las descargas pasan por la capacidad "downloads"; en la app y la web, enlace normal.
  const dlReady = (window.claude && typeof window.claude.use === 'function') ? Promise.resolve(window.claude.use('downloads')).catch(() => null) : Promise.resolve(null);
  async function save(blob, name) {
    const ns = await dlReady;
    if (ns) { try { await ns.save({ filename: name, data: blob }); } catch (e) { /* el usuario declinó o no disponible */ } return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  }
  const savePdfDxf = async (g) => { await save(new Blob([g.pdf], { type: 'application/pdf' }), g.name + '.pdf'); if (g.dxf) setTimeout(() => save(g.dxf, g.name + '.dxf'), 700); };
  bPdf.addEventListener('click', () => { if (current) { if (current.dxf) savePdfDxf(current); else save(new Blob([current.pdf], { type: 'application/pdf' }), current.name + '.pdf'); } });
  bDxf.addEventListener('click', () => { if (current && current.dxf) save(current.dxf, current.name + '.dxf'); });
  bPng.addEventListener('click', () => { if (current && current.png) fetch(current.png).then((r) => r.blob()).then((b) => save(b, current.name + '.png')); });
  function show(title, src, hint) {
    body.innerHTML = '';
    const img = new Image(); img.alt = title; img.src = src;
    img.addEventListener('click', () => img.classList.toggle('zoom'));
    const wrap = mk('div'); wrap.style.width = '100%'; wrap.style.textAlign = 'center';
    wrap.append(img, mk('div', 'plano-hint', hint));
    body.appendChild(wrap);
  }

  /* --- Datos de la lámina leídos desde la página --- */
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  function sheetData() {
    const badge = document.querySelector('.badge');
    const code = txt(badge && badge.querySelector('b'));
    const spans = badge ? badge.querySelectorAll('span') : [];
    const name = txt(spans[spans.length - 1]);
    const h1 = document.querySelector('header h1');
    const main = h1 ? txt(h1.firstChild && h1.firstChild.nodeType === 3 ? { textContent: h1.firstChild.textContent } : h1).split('·')[0].trim() : document.title;
    let bom = [];
    for (const tb of document.querySelectorAll('aside table')) {
      const head = txt(tb.querySelector('thead') || tb.rows[0]).toUpperCase();
      if (!/ÍTEM|ITEM/.test(head)) continue;
      const cap = tb.previousElementSibling && /LISTA/i.test(txt(tb.previousElementSibling)) ? txt(tb.previousElementSibling) : '';
      for (const r of tb.querySelectorAll('tbody tr')) { const c = [...r.cells].map(txt); if (c.length >= 3) bom.push(c.slice(0, 3)); }
      bom.cap = cap; break;
    }
    const notes = [];
    document.querySelectorAll('aside p, aside li').forEach((p) => { const t = txt(p); if (/^Nota\s*\d+\.?/i.test(t) && !notes.includes(t)) notes.push(t); });
    const all = txt(document.querySelector('aside'));
    const ref = '';
    const hoja = (all.match(/hoja\s+(\d+)/i) || ['', ''])[1];
    const bp = document.querySelector('[data-plano]');
    if (bp) return { code, name, main, bom, notes, ref: bp.dataset.plano, hoja: bp.dataset.hoja || '' };
    const hn = (code.match(/^(\d+)-/) || ['', ''])[1];
    return { code, name, main, bom, notes, ref, hoja: hoja || hn };
  }

  /* --- Render de vistas en líneas (pasada de ID + normales y detección de bordes) --- */
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  /* --- Exportación DXF (R12, mm, A3 420 × 297): vistas en líneas vectoriales con ocultas eliminadas --- */
  let REC = null;
  const ADJ = new WeakMap();
  function adjOf(geo) {                                // aristas con sus dos caras (vértices soldados por posición)
    let a = ADJ.get(geo); if (a) return a;
    const pos = geo.attributes.position, idx = geo.index, n = idx ? idx.count : pos.count, key = new Map(), vid = new Int32Array(pos.count), P = [];
    for (let i = 0; i < pos.count; i++) { const k = Math.round(pos.getX(i) * 1e4) + ',' + Math.round(pos.getY(i) * 1e4) + ',' + Math.round(pos.getZ(i) * 1e4); let v = key.get(k); if (v === undefined) { v = P.length / 3; key.set(k, v); P.push(pos.getX(i), pos.getY(i), pos.getZ(i)); } vid[i] = v; }
    const E = new Map(), FN = new Float32Array(Math.floor(n / 3) * 3), tri = new THREE.Triangle(), nv = V3(0, 0, 0), pa = V3(0, 0, 0), pb = V3(0, 0, 0), pc = V3(0, 0, 0);
    for (let f = 0; f < Math.floor(n / 3); f++) {
      const v = [0, 1, 2].map((j) => vid[idx ? idx.getX(f * 3 + j) : f * 3 + j]);
      if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) continue;
      pa.fromArray(P, v[0] * 3); pb.fromArray(P, v[1] * 3); pc.fromArray(P, v[2] * 3); tri.set(pa, pb, pc).getNormal(nv); FN[f * 3] = nv.x; FN[f * 3 + 1] = nv.y; FN[f * 3 + 2] = nv.z;
      for (let e = 0; e < 3; e++) { const p = v[e], q = v[(e + 1) % 3], k = p < q ? p * 4194304 + q : q * 4194304 + p, r = E.get(k); if (r) { if (r[3] < 0) r[3] = f; else r[4] = 1; } else E.set(k, [Math.min(p, q), Math.max(p, q), f, -1, 0]); }
    }
    a = { P: new Float32Array(P), E: [...E.values()], FN }; ADJ.set(geo, a); return a;
  }
  function vecLines(cam, w, h, set, dep) {            // aristas vivas, de contorno y bordes, recortadas por el buffer de profundidad
    const out = [], dirW = V3(0, 0, -1).applyQuaternion(cam.quaternion), nm = new THREE.Matrix3(), A = V3(0, 0, 0), B = V3(0, 0, 0), n1 = V3(0, 0, 0), n2 = V3(0, 0, 0), cosT = Math.cos(38 * Math.PI / 180);
    const eps = (set.size || 10) * 0.006 / Math.max(1e-6, cam.far - cam.near);
    const D = (x, y) => { const i = ((h - 1 - y) * w + x) * 4; return (255 / 256) * (dep[i] / 255 / 16777216 + dep[i + 1] / 255 / 65536 + dep[i + 2] / 255 / 256 + dep[i + 3] / 255); };
    const vis = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y); let mx = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = Math.min(w - 1, Math.max(0, xi + dx)), Y = Math.min(h - 1, Math.max(0, yi + dy)); mx = Math.max(mx, D(X, Y)); } return z <= mx + eps; };
    for (const m of set.meshes) {
      const geo = m.geometry; if (!geo || !geo.attributes || !geo.attributes.position || m.isInstancedMesh) continue;
      const ad = adjOf(geo), mw = m.matrixWorld; nm.getNormalMatrix(mw);
      for (const e of ad.E) {
        n1.fromArray(ad.FN, e[2] * 3).applyMatrix3(nm).normalize();
        let draw = e[3] < 0 || e[4];
        if (!draw) { n2.fromArray(ad.FN, e[3] * 3).applyMatrix3(nm).normalize(); draw = n1.dot(n2) < cosT || n1.dot(dirW) * n2.dot(dirW) <= 0; }
        if (!draw) continue;
        A.fromArray(ad.P, e[0] * 3).applyMatrix4(mw).project(cam); B.fromArray(ad.P, e[1] * 3).applyMatrix4(mw).project(cam);
        const ax = (A.x + 1) / 2 * w, ay = (1 - A.y) / 2 * h, az = (A.z + 1) / 2, bx = (B.x + 1) / 2 * w, by = (1 - B.y) / 2 * h, bz = (B.z + 1) / 2;
        if ((ax < 0 && bx < 0) || (ax > w && bx > w) || (ay < 0 && by < 0) || (ay > h && by > h)) continue;
        const ns = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5)); let run = null;
        for (let s = 0; s <= ns; s++) {
          const t = s / ns, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t;
          if (x >= 0 && x < w && y >= 0 && y < h && vis(x, y, z)) { if (!run) run = [x, y, x, y]; else { run[2] = x; run[3] = y; } }
          else if (run) { if (Math.hypot(run[2] - run[0], run[3] - run[1]) > 0.8) out.push(run); run = null; }
        }
        if (run && Math.hypot(run[2] - run[0], run[3] - run[1]) > 0.8) out.push(run);
      }
    }
    return out;
  }
  function dxfBuilder() {
    const K = 420 / W, E = [], f = (v) => (Math.round(v * 1000) / 1000).toString();
    const P = (p) => [p[0] * K, (H - p[1]) * K];
    const aci = (c) => { c = String(c).toLowerCase(); return c === '#034488' ? 5 : c === '#ef5a05' ? 30 : c === '#c9d6e3' ? 9 : (c === '#fff' || c === '#ffffff') ? 255 : 7; };
    const R = { layer: 'MARCO', E };
    const ent = (type, layer, color, codes) => E.push('0\n' + type + '\n8\n' + layer + '\n' + (color !== 7 ? '62\n' + color + '\n' : '') + codes.map(([g, v]) => g + '\n' + v).join('\n') + '\n');
    R.line = (a, b, layer, c = 7) => { const p = P(a), q = P(b); ent('LINE', layer, c, [[10, f(p[0])], [20, f(p[1])], [30, 0], [11, f(q[0])], [21, f(q[1])], [31, 0]]); };
    R.strokePath = (path, col) => {
      const c = aci(col);
      for (const sp of path) {
        if (sp.arc) { const [x, y, r, a0, a1, ccw] = sp.arc, p = P([x, y]); if (Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6) ent('CIRCLE', R.layer, c, [[10, f(p[0])], [20, f(p[1])], [30, 0], [40, f(r * K)]]); else { const s = ccw ? -a0 : -a1, e = ccw ? -a1 : -a0; ent('ARC', R.layer, c, [[10, f(p[0])], [20, f(p[1])], [30, 0], [40, f(r * K)], [50, f(s * 180 / Math.PI)], [51, f(e * 180 / Math.PI)]]); } continue; }
        for (let i = 1; i < sp.length; i++) R.line(sp[i - 1], sp[i], R.layer, c);
        if (sp.closed && sp.length > 2) R.line(sp[sp.length - 1], sp[0], R.layer, c);
      }
    };
    const solid = (pts, c) => { const q = pts.map(P), o = [q[0], q[1], q[3] || q[2], q[2]]; ent('SOLID', R.layer, c, [[10, f(o[0][0])], [20, f(o[0][1])], [30, 0], [11, f(o[1][0])], [21, f(o[1][1])], [31, 0], [12, f(o[2][0])], [22, f(o[2][1])], [32, 0], [13, f(o[3][0])], [23, f(o[3][1])], [33, 0]]); };
    R.fillPath = (path, col) => { const c = aci(col); if (c === 255) return; for (const sp of path) if (!sp.arc && sp.length >= 3 && sp.length <= 4) solid(sp, c); };
    R.fillRect = (a, b, col) => { const c = aci(col); if (c === 255 && R.layer !== 'ROTULO') return; if (c === 255) return; solid([a, [b[0], a[1]], b, [a[0], b[1]]], c); };
    R.text = (t, p, font, align, base, col) => {
      t = String(t).replace(/[\r\n]+/g, ' '); if (!t.trim()) return;
      const px = parseFloat((String(font).match(/(\d+(?:\.\d+)?)px/) || [0, 20])[1]), hh = px * K * 0.7, q = P(p);
      const h72 = align === 'center' ? 1 : (align === 'right' || align === 'end') ? 2 : 0, v73 = base === 'middle' ? 2 : base === 'top' || base === 'hanging' ? 3 : base === 'bottom' ? 1 : 0;
      const codes = [[10, f(q[0])], [20, f(q[1])], [30, 0], [40, f(hh)], [1, t], [7, 'REYENGI']];
      if (h72 || v73) codes.push([72, h72], [11, f(q[0])], [21, f(q[1])], [31, 0], [73, v73]);
      ent('TEXT', R.layer === 'VISTAS' ? 'TEXTO' : R.layer, aci(col) === 255 ? 255 : aci(col), codes);
    };
    R.vec = (lines, off) => { for (const l of lines) R.line([l[0] + off[0], l[1] + off[1]], [l[2] + off[0], l[3] + off[1]], 'VISTAS', 7); };
    R.bytes = () => {
      const LAY = [['MARCO', 7], ['VISTAS', 7], ['GLOBOS', 7], ['TITULOS', 7], ['TABLA', 7], ['ROTULO', 7], ['TEXTO', 7]];
      const head = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSBASE\n10\n0.0\n20\n0.0\n30\n0.0\n9\n$EXTMIN\n10\n0.0\n20\n0.0\n30\n0.0\n9\n$EXTMAX\n10\n420.0\n20\n297.0\n30\n0.0\n9\n$LIMMIN\n10\n0.0\n20\n0.0\n9\n$LIMMAX\n10\n420.0\n20\n297.0\n9\n$DWGCODEPAGE\n3\nANSI_1252\n0\nENDSEC\n' +
        '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLTYPE\n70\n1\n0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n0\nENDTAB\n' +
        '0\nTABLE\n2\nLAYER\n70\n' + LAY.length + '\n' + LAY.map(([n, c]) => '0\nLAYER\n2\n' + n + '\n70\n0\n62\n' + c + '\n6\nCONTINUOUS\n').join('') + '0\nENDTAB\n' +
        '0\nTABLE\n2\nSTYLE\n70\n1\n0\nSTYLE\n2\nREYENGI\n70\n0\n40\n0.0\n41\n1.0\n50\n0.0\n71\n0\n42\n2.5\n3\narial.ttf\n4\n\n0\nENDTAB\n0\nENDSEC\n';
      const str = head + '0\nSECTION\n2\nENTITIES\n' + E.join('') + '0\nENDSEC\n0\nEOF\n';
      const SP = { 0x2014: 0x97, 0x2013: 0x96, 0x201C: 0x93, 0x201D: 0x94, 0x2018: 0x91, 0x2019: 0x92, 0x2022: 0x95, 0x2026: 0x85, 0x20AC: 0x80, 0x3BC: 0xB5 };
      const parts = []; let buf = [];
      for (const ch of str) { const c = ch.codePointAt(0); if (c < 128 || (c >= 160 && c < 256)) buf.push(c); else if (SP[c]) buf.push(SP[c]); else for (const b of '\\U+' + c.toString(16).toUpperCase().padStart(4, '0')) buf.push(b.charCodeAt(0)); if (buf.length > 65536) { parts.push(Uint8Array.from(buf)); buf = []; } }
      parts.push(Uint8Array.from(buf));
      return new Blob(parts, { type: 'application/dxf' });
    };
    return R;
  }
  function recorder(ctx, R) {                         // contexto 2D que dibuja y además registra en el DXF
    let path = [], cur = null;
    const T = (x, y) => { const m = ctx.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
    const api = {
      beginPath() { path = []; cur = null; ctx.beginPath(); },
      moveTo(x, y) { cur = [T(x, y)]; path.push(cur); ctx.moveTo(x, y); },
      lineTo(x, y) { if (!cur) { cur = [T(x, y)]; path.push(cur); } else cur.push(T(x, y)); ctx.lineTo(x, y); },
      closePath() { if (cur) cur.closed = true; ctx.closePath(); },
      arc(x, y, r, a0, a1, ccw) { path.push({ arc: [...T(x, y), r, a0, a1, !!ccw] }); cur = null; ctx.arc(x, y, r, a0, a1, ccw); },
      rect(x, y, w, h) { const p = [T(x, y), T(x + w, y), T(x + w, y + h), T(x, y + h)]; p.closed = true; path.push(p); cur = null; ctx.rect(x, y, w, h); },
      stroke() { R.strokePath(path, ctx.strokeStyle); ctx.stroke(); },
      fill() { R.fillPath(path, ctx.fillStyle); ctx.fill(); },
      strokeRect(x, y, w, h) { const p = [T(x, y), T(x + w, y), T(x + w, y + h), T(x, y + h)]; p.closed = true; R.strokePath([p], ctx.strokeStyle); ctx.strokeRect(x, y, w, h); },
      fillRect(x, y, w, h) { R.fillRect(T(x, y), T(x + w, y + h), ctx.fillStyle); ctx.fillRect(x, y, w, h); },
      fillText(t, x, y) { R.text(t, T(x, y), ctx.font, ctx.textAlign, ctx.textBaseline, ctx.fillStyle); ctx.fillText(t, x, y); },
      drawImage(img, ...a) { ctx.drawImage(img, ...a); if (img.__vec) R.vec(img.__vec, T(a[0], a[1])); else if (img === LOGO) R.text('ReyEngi', T(a[0], a[1] + (a[3] || 72) / 2), '700 46px x', 'left', 'middle', '#fff'); },
    };
    return new Proxy(ctx, { get(t, k) { if (k in api) return api[k]; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v) { if (k === '__layer') R.layer = v; else t[k] = v; return true; } });
  }
  function visibleChain(o) { for (let p = o; p; p = p.parent) if (p.visible === false || (p.userData && p.userData.noPlano)) return false; return true; }
  function collect() {
    const hide = [], meshes = [];
    scene.traverse((o) => {
      if (!o.visible) return;
      if (o.userData && o.userData.noPlano) { hide.push(o); return; }
      const m = o.material;
      if (o.isLine || o.isPoints || o.isSprite || (o.isMesh && (Array.isArray(m) || m.isShadowMaterial || m.isMeshBasicMaterial || (m.transparent && m.opacity < 0.12)))) { hide.push(o); return; }
      if (o.isMesh && visibleChain(o)) meshes.push(o);
    });
    return { hide, meshes };
  }
  function anchors() {
    const pts = [], items = [];
    let anyVis = labelsFn().some((l) => l.visible && l.parent);
    for (const l of labelsFn()) {
      if (!l.parent || !visibleChain(l.parent) || (anyVis && !l.visible)) continue;
      const p = new THREE.Vector3(); l.getWorldPosition(p); pts.push(p);
      const pill = (l.element.querySelector('.pill') || { textContent: l.element.dataset.pill || l.element.textContent });
      items.push({ p, text: txt(pill) });
    }
    return { pts, items };
  }
  function boundsOf(pts, meshes) {
    const b = new THREE.Box3();
    if (pts.length >= 3) pts.forEach((p) => b.expandByPoint(p));
    else meshes.forEach((m) => b.expandByObject(m));
    const s = b.getSize(V3(0, 0, 0)), pad = Math.max(s.x, s.y, s.z) * 0.08 + 1;
    b.expandByScalar(pad);
    return b;
  }
  function renderLines(cam, w, h, set) {
    const rt = new THREE.WebGLRenderTarget(w, h);
    const prevBg = scene.background, prevTarget = renderer.getRenderTarget(), prevShadow = renderer.shadowMap.enabled;
    const orig = set.meshes.map((m) => m.material);
    const idMats = set.meshes.map((m, i) => { const k = i + 1; return new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB((k & 255) / 255, ((k >> 8) & 255) / 255, 0), side: THREE.DoubleSide, toneMapped: false }); });
    const nMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    set.hide.forEach((o) => { o.visible = false; });
    renderer.shadowMap.enabled = false;
    const read = () => { const b = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, b); return b; };
    let ids, nor, dep = null;
    const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
    try {
      scene.background = new THREE.Color(0, 0, 0);
      set.meshes.forEach((m, i) => { m.material = idMats[i]; });
      renderer.setRenderTarget(rt); renderer.render(scene, cam); ids = read();
      set.meshes.forEach((m) => { m.material = nMat; });
      renderer.render(scene, cam); nor = read();
      if (REC) { const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }); scene.background = null; renderer.setClearColor(0xffffff, 1); set.meshes.forEach((m) => { m.material = dm; }); renderer.render(scene, cam); dep = read(); dm.dispose(); }
    } finally {
      renderer.setClearColor(prevClear, prevAlpha);
      set.meshes.forEach((m, i) => { m.material = orig[i]; });
      set.hide.forEach((o) => { o.visible = true; });
      renderer.setRenderTarget(prevTarget); renderer.shadowMap.enabled = prevShadow;
      scene.background = prevBg;
      idMats.forEach((m) => m.dispose()); nMat.dispose(); rt.dispose();
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), out = img.data;
    const id = (x, y) => { const i = ((h - 1 - y) * w + x) * 4; return ids[i] | (ids[i + 1] << 8); };
    const nd = (x1, y1, x2, y2) => { const a = ((h - 1 - y1) * w + x1) * 4, b = ((h - 1 - y2) * w + x2) * 4; return Math.abs(nor[a] - nor[b]) + Math.abs(nor[a + 1] - nor[b + 1]) + Math.abs(nor[a + 2] - nor[b + 2]); };
    const edge = new Uint8Array(w * h);
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
      const a = id(x, y);
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const b = id(x + dx, y + dy);
        if (a !== b || (a && nd(x, y, x + dx, y + dy) > 110)) { edge[y * w + x] = 1; edge[(y + dy) * w + x + dx] = 1; }
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, e = edge[y * w + x], filled = id(x, y) !== 0;
      const v = e ? 25 : (filled ? 246 : 255);
      out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (REC && dep) cv.__vec = vecLines(cam, w, h, set, dep);
    return cv;
  }
  function orthoCam(b, view, w, h, fx = 1, fy = 1) {
    const c = b.getCenter(V3(0, 0, 0)), s = b.getSize(V3(0, 0, 0));
    const hw = view === 'front' ? s.x : s.z, hh = s.y, aw = w * fx, ah = h * fy;
    let ww = hw / 2, hh2 = hh / 2;
    if (ww / hh2 > aw / ah) hh2 = ww * ah / aw; else ww = hh2 * aw / ah;
    ww /= fx; hh2 /= fy;
    const cam = new THREE.OrthographicCamera(-ww, ww, hh2, -hh2, 0.1, 100000);
    const d = s.length() * 3 + 100;
    cam.position.copy(c).add(view === 'front' ? V3(0, 0, d) : V3(d, 0, 0));
    cam.up.set(0, 1, 0); cam.lookAt(c); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    return cam;
  }
  function tightBox(b, meshes) {                       // caja de las piezas, recortada a la zona de las etiquetas
    const mb = new THREE.Box3();
    meshes.forEach((m) => { const bb = new THREE.Box3().setFromObject(m); if (!bb.isEmpty() && bb.intersectsBox(b)) mb.union(bb.intersect(b)); });
    if (mb.isEmpty()) return b;
    const s = mb.getSize(V3(0, 0, 0)); mb.expandByScalar(Math.max(s.x, s.y, s.z) * 0.03 + 0.5);
    return mb;
  }
  function corners(b) { const o = []; for (let i = 0; i < 8; i++) o.push(V3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)); return o; }
  const VO = { set: false, az: 45, el: 35, zoom: 1, px: 0, py: 0 };   // encuadre de la isométrica ajustado en la previsualización
  function camAngles() { const d = camera.position.clone().sub(controls.target).normalize(); return { az: Math.round(Math.atan2(d.x, d.z) * 180 / Math.PI), el: Math.round(Math.asin(Math.max(-1, Math.min(1, d.y))) * 180 / Math.PI) }; }
  function viewDir() {
    if (!VO.set) return camera.position.clone().sub(controls.target).normalize();
    const a = VO.az * Math.PI / 180, e = VO.el * Math.PI / 180; return V3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
  }
  // Ajustes de la lámina hechos en la ventana de ajuste: vista de cada recuadro, acercamiento, globos movidos y viñeta
  const PL = { v: ['iso', 'front', 'right'], z: [1, 1, 1], gl: {}, vin: 'reyengi', c: {} };
  const VISTAS = { iso: ['Isométrica (libre)', 'VISTA ISOMÉTRICA', null], front: ['Frontal', 'VISTA FRONTAL', [0, 0, 1]], back: ['Posterior', 'VISTA POSTERIOR', [0, 0, -1]], right: ['Lateral derecha', 'VISTA LATERAL DERECHA', [1, 0, 0]], left: ['Lateral izquierda', 'VISTA LATERAL IZQUIERDA', [-1, 0, 0]], top: ['Planta (desde arriba)', 'VISTA EN PLANTA', [0, 1, 0]], bottom: ['Inferior (desde abajo)', 'VISTA INFERIOR', [0, -1, 0]], none: ['Sin vista', '', null] };
  let HITS = [];                                       // globos dibujados en la última composición (para arrastrarlos)
  const LC = new Map();                                // líneas ya calculadas de cada vista, mientras la ventana de ajuste está abierta
  function isoCam(box, w, h, reg) { return dirCam(box, w, h, reg, viewDir(), VO.set ? VO.zoom : 1, VO.set ? VO.px : 0, VO.set ? VO.py : 0); }
  function viewCam(kind, box, w, h, reg, zoom) { return kind === 'iso' ? isoCam(box, w, h, reg) : dirCam(box, w, h, reg, V3(...VISTAS[kind][2]), zoom || 1, 0, 0); }
  function dirCam(box, w, h, reg, dir, zoom, px, py) { // vista ortogonal desde una dirección; el modelo ocupa la región reg (fracciones)
    const c = box.getCenter(V3(0, 0, 0));
    const D = box.getSize(V3(0, 0, 0)).length() * 2 + 100;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, D * 4);
    cam.position.copy(c).addScaledVector(dir, D);
    cam.up.set(0, 1, 0); if (Math.abs(dir.y) > 0.98) cam.up.set(0, 0, dir.y > 0 ? -1 : 1);
    cam.lookAt(c); cam.updateMatrixWorld(true);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    corners(box).forEach((p) => { p.applyMatrix4(cam.matrixWorldInverse); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    const s = Math.max((x1 - x0) / ((reg.x1 - reg.x0) * w), (y1 - y0) / ((reg.y1 - reg.y0) * h)) / zoom;
    const cx = (reg.x0 + reg.x1) / 2 * w, cy = (reg.y0 + reg.y1) / 2 * h;
    cam.left = (x0 + x1) / 2 - cx * s - px * w * s; cam.right = cam.left + w * s;
    cam.top = (y0 + y1) / 2 + cy * s - py * h * s; cam.bottom = cam.top - h * s;
    cam.updateProjectionMatrix();
    return cam;
  }
  // Apila las llamadas cerca de su punto, sin solaparse (agrupa las que chocan y las centra en su promedio)
  function stack(order, top, bottom, gap) {
    const cl = order.map((c) => ({ items: [c], sum: c.sy, n: 1, H: c.h }));
    const pos = (k) => Math.min(Math.max(k.sum / k.n - k.H / 2, top), Math.max(top, bottom - k.H));
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 1; i < cl.length; i++) {
        const a = cl[i - 1], b = cl[i];
        if (pos(a) + a.H + gap > pos(b)) { a.items.push(...b.items); a.sum += b.sum; a.n += b.n; a.H += gap + b.H; cl.splice(i, 1); changed = true; break; }
      }
    }
    for (const k of cl) { let y = pos(k); for (const c of k.items) { c.y = y + c.h / 2; y += c.h + gap; } }
  }
  function drawCallouts(g, list, Vr, ext, BR, off, slot) {   // globos con número de ítem a ambos lados de una vista
    const occ = {};
    const [mx0, mx1] = ext, midX = (mx0 + mx1) / 2;
    const L = list.filter((c) => c.sx < midX), R = list.filter((c) => c.sx >= midX);
    const byCenter = (a, b2) => Math.abs(a.sx - midX) - Math.abs(b2.sx - midX);
    while (L.length - R.length > 2) { L.sort(byCenter); R.push(L.shift()); }
    while (R.length - L.length > 2) { R.sort(byCenter); L.push(R.shift()); }
    const GAP = Math.max(6, Math.round(BR * 0.45)), TOP = Vr.y + 12, BOT = Vr.y + Vr.h - 12, AR = 16 * BR / 26;
    for (const [side, col] of [[-1, L], [1, R]]) {
      if (!col.length) continue;
      const colX = side < 0 ? Math.max(Vr.x + 8, mx0 - off - 2 * BR) : Math.min(Vr.x + Vr.w - 8, mx1 + off + 2 * BR);
      col.forEach((c) => { c.h = BR * 2 + 4; c.w = BR * 2; c.ex = side < 0 ? colX + c.w + 8 : colX - c.w - 8; });
      const edgeTxt = side < 0 ? Math.max(...col.map((c) => c.ex)) + 14 : Math.min(...col.map((c) => c.ex)) - 14;
      const knee = side < 0 ? Math.max(edgeTxt, mx0 - 30) : Math.min(edgeTxt, mx1 + 30);
      const kneeX = side < 0 ? Math.min(knee, ...col.map((c) => c.sx - 6)) : Math.max(knee, ...col.map((c) => c.sx + 6));
      const order = col.slice().sort((a, b2) => a.sy - b2.sy);
      stack(order, TOP, BOT, GAP);
      for (let it = 0; it < 60; it++) {
        let hit = null;
        for (let i = 0; i < order.length && !hit; i++) for (let j = i + 1; j < order.length; j++) {
          const a = order[i], c2 = order[j];
          if (crosses([kneeX, a.y], [a.sx, a.sy], [kneeX, c2.y], [c2.sx, c2.sy])) { hit = [i, j]; break; }
        }
        if (!hit) break;
        [order[hit[0]], order[hit[1]]] = [order[hit[1]], order[hit[0]]];
        stack(order, TOP, BOT, GAP);
      }
      for (const c of order) {
        g.strokeStyle = INK; g.lineWidth = BR > 20 ? 2 : 1.6;
        const key = slot + ':' + c.num + ':' + (occ[c.num] = (occ[c.num] || 0) + 1), mv = PL.gl[key];
        if (mv) {                                        // globo movido a mano: línea recta desde el borde del globo hasta la pieza
          const bx = Vr.x + mv.fx * Vr.w, by = Vr.y + mv.fy * Vr.h, a2 = Math.atan2(c.sy - by, c.sx - bx);
          g.beginPath(); g.arc(bx, by, BR, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke();
          g.fillStyle = INK; g.font = '600 ' + Math.round(BR * (String(c.num).length > 2 ? 0.8 : 1)) + 'px ' + F.s; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.num, bx, by + 1);
          g.beginPath(); g.moveTo(bx + BR * Math.cos(a2), by + BR * Math.sin(a2)); g.lineTo(c.sx, c.sy); g.stroke();
          g.beginPath(); g.moveTo(c.sx, c.sy); g.lineTo(c.sx - AR * Math.cos(a2 - 0.3), c.sy - AR * Math.sin(a2 - 0.3)); g.lineTo(c.sx - AR * Math.cos(a2 + 0.3), c.sy - AR * Math.sin(a2 + 0.3)); g.closePath(); g.fill();
          HITS.push({ k: key, x: bx, y: by, r: BR, slot, num: c.num, tx: c.sx, ty: c.sy }); continue;
        }
        const cx = side < 0 ? colX + BR + 1 : colX - BR - 1;
        HITS.push({ k: key, x: cx, y: c.y, r: BR, slot, num: c.num, tx: c.sx, ty: c.sy });
        g.beginPath(); g.arc(cx, c.y, BR, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke();
        g.fillStyle = INK; g.font = '600 ' + Math.round(BR * (String(c.num).length > 2 ? 0.8 : 1)) + 'px ' + F.s; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.num, cx, c.y + 1);
        const ex = cx - side * BR;
        g.beginPath(); g.moveTo(ex, c.y); g.lineTo(kneeX, c.y); g.lineTo(c.sx, c.sy); g.stroke();
        const ang = Math.atan2(c.sy - c.y, c.sx - kneeX);
        g.beginPath(); g.moveTo(c.sx, c.sy); g.lineTo(c.sx - AR * Math.cos(ang - 0.3), c.sy - AR * Math.sin(ang - 0.3)); g.lineTo(c.sx - AR * Math.cos(ang + 0.3), c.sy - AR * Math.sin(ang + 0.3)); g.closePath(); g.fill();
      }
    }
  }
  function crosses(p1, p2, p3, p4) {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && d1 && d2 && d3 && d4;
  }

  /* --- Composición de la lámina --- */
  const W = 2970, H = 2100, NAVY = '#034488', AMBER = '#EF5A05', INK = '#111';
  const LOGO = new Image(); LOGO.src = 'data:image/png;base64,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';
  const F = { s: '"IBM Plex Sans", "Segoe UI", Arial, sans-serif', d: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif', m: '"IBM Plex Mono", Consolas, monospace' };
  function wrapLines(g, text, maxW) {
    const words = String(text).split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  function viewTitle(g, x, y, t) {
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '600 34px ' + F.s; g.fillText(t, x, y);
    const tw = g.measureText(t).width; g.fillRect(x - tw / 2, y + 8, tw, 2.5);
    g.font = '24px ' + F.s; g.fillText('ESCALA: S/E', x, y + 40);
  }
  function compose(d, opt = {}) {
    const set = collect(), an = anchors(), b = boundsOf(an.pts, set.meshes);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = REC ? recorder(cv.getContext('2d'), REC) : cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.__layer = 'MARCO';
    // Marco con zonas
    g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(30, 30, W - 60, H - 60);
    g.lineWidth = 5; g.strokeRect(62, 62, W - 124, H - 124);
    g.font = '20px ' + F.s; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 10; i++) { const x = 62 + (W - 124) * (i + 0.5) / 10; g.fillText(String(i + 1), x, 46); g.fillText(String(i + 1), x, H - 46); if (i) { g.lineWidth = 1.5; g.beginPath(); g.moveTo(62 + (W - 124) * i / 10, 30); g.lineTo(62 + (W - 124) * i / 10, 62); g.moveTo(62 + (W - 124) * i / 10, H - 62); g.lineTo(62 + (W - 124) * i / 10, H - 30); g.stroke(); } }
    for (let i = 0; i < 6; i++) { const y = 62 + (H - 124) * (i + 0.5) / 6, L = 'ABCDEF'[i]; g.fillText(L, 46, y); g.fillText(L, W - 46, y); if (i) { const yy = 62 + (H - 124) * i / 6; g.beginPath(); g.moveTo(30, yy); g.lineTo(62, yy); g.moveTo(W - 62, yy); g.lineTo(W - 30, yy); g.stroke(); } }
    // Vistas
    const ISO = { x: 90, y: 90, w: 1210, h: 1800 }, FR = { x: 1320, y: 90, w: 720, h: 860 }, LA = { x: 1320, y: 1050, w: 720, h: 840 };
    const tb = tightBox(b, set.meshes); set.size = tb.getSize(V3(0, 0, 0)).length();
    const REG = { x0: 0.27, x1: 0.73, y0: 0.05, y1: 0.95 };
    const FX = 0.58, FY = 0.9, REG2 = { x0: (1 - FX) / 2, x1: (1 + FX) / 2, y0: (1 - FY) / 2, y1: (1 + FY) / 2 };
    const SLOT = [ISO, FR, LA], REGS = [REG, REG2, REG2];
    HITS = [];
    const kinds = SLOT.map((_, i) => (i && opt.isoOnly ? 'none' : (VISTAS[PL.v[i]] ? PL.v[i] : 'none')));
    if (kinds[0] === 'none') kinds[0] = 'iso';
    const cams = SLOT.map((Vr, i) => (kinds[i] === 'none' ? null : viewCam(kinds[i], tb, Vr.w, Vr.h, REGS[i], PL.z[i])));
    const lineas = (i) => {                              // líneas de la vista; en la ventana de ajuste se reutilizan mientras no cambie el encuadre
      const Vr = SLOT[i]; if (REC || !opt.cache) return renderLines(cams[i], Vr.w, Vr.h, set);
      const k = [i, kinds[i], Vr.w, Vr.h, kinds[i] === 'iso' ? [VO.set, VO.az, VO.el, VO.zoom, VO.px, VO.py, VO.set ? '' : camera.position.toArray().map((n) => n.toFixed(2))].join(',') : PL.z[i]].join('|');
      if (!LC.has(k)) { if (LC.size > 12) LC.clear(); LC.set(k, renderLines(cams[i], Vr.w, Vr.h, set)); }
      return LC.get(k);
    };
    const isoC = cams[0];
    cams.forEach((cam, i) => { if (cam) g.drawImage(lineas(i), SLOT[i].x, SLOT[i].y); });
    if (!opt.isoOnly) {
      g.__layer = 'TITULOS';
      cams.forEach((cam, i) => { if (cam) viewTitle(g, SLOT[i].x + SLOT[i].w / 2, SLOT[i].y + SLOT[i].h + (i ? 46 : 52), VISTAS[kinds[i]][1]); });
    }
    // Numeración común: cada componente lleva el número de ítem de la tabla (si no tiene, se agrega al final)
    const norm = (t) => String(t).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ').trim();
    const rows = d.bom.map((r) => r.slice());
    let next = rows.reduce((m, r) => Math.max(m, parseInt(r[0], 10) || 0), 0);
    const byText = {};
    const items = an.items.map((it) => { const m = it.text.match(/^(\d+)\s*·\s*(.*)$/), v = it.p.clone().project(isoC); return { p: it.p, num: m ? m[1] : null, text: (m ? m[2] : it.text).toUpperCase().replace(/(\d) ?MA\b/g, '$1 mA'), ix: v.x, iy: v.y }; });
    items.slice().sort((a, b2) => (a.ix < 0) - (b2.ix < 0) || b2.iy - a.iy).forEach((c) => {
      if (c.num && d.bom.some((r) => String(r[0]) === c.num)) return;
      c.num = null;
      const k = norm(c.text);
      if (byText[k]) { c.num = byText[k]; return; }
      const hit = rows.find((r, i) => { const t = norm(r[1]); return t && (t === k || (i < d.bom.length && k.length > 5 && t.length > 5 && (t.includes(k) || k.includes(t)))); });
      if (hit) c.num = String(hit[0]); else { next += 1; c.num = String(next); rows.push([c.num, c.text, d.bom.length ? '—' : '']); }
      byText[k] = c.num;
    });
    // En las vistas frontal y lateral solo se indican las piezas que se ven (no las tapadas por otras)
    const rc = new THREE.Raycaster(), tol = tb.getSize(V3(0, 0, 0)).length() * 0.02 + 0.4;
    const seen3 = (cam, p) => { const dir = V3(0, 0, -1).applyQuaternion(cam.quaternion), D = tb.getSize(V3(0, 0, 0)).length() * 2 + 10, o = p.clone().addScaledVector(dir, -D); rc.set(o, dir); rc.far = D + tol; const h = rc.intersectObjects(set.meshes, false)[0]; return !h || h.distance > D - tol; };
    const place = (cam, Vr, occl) => items.map((it) => { const v = it.p.clone().project(cam); return { sx: Vr.x + (v.x + 1) / 2 * Vr.w, sy: Vr.y + (1 - v.y) / 2 * Vr.h, num: it.num, z: v.z, p: it.p }; })
      .filter((c) => c.z < 1 && c.z > -1 && c.sx > Vr.x + 4 && c.sx < Vr.x + Vr.w - 4 && c.sy > Vr.y + 4 && c.sy < Vr.y + Vr.h - 4 && (!occl || seen3(cam, c.p)));
    const extent = (cam, Vr, r0, r1) => { let a = Infinity, b2 = -Infinity; corners(tb).forEach((p) => { const v = p.project(cam), x = Vr.x + (v.x + 1) / 2 * Vr.w; a = Math.min(a, x); b2 = Math.max(b2, x); }); return [Math.max(a, Vr.x + Vr.w * r0), Math.min(b2, Vr.x + Vr.w * r1)]; };
    g.__layer = 'GLOBOS';
    cams.forEach((cam, i) => {
      if (!cam) return; const Vr = SLOT[i];
      if (!i && kinds[0] === 'iso') { const isoL = place(cam, Vr); drawCallouts(g, isoL, Vr, extent(cam, Vr, REG.x0, REG.x1), isoL.length > 26 ? 21 : 26, 150, 0); return; }
      const seen = new Set(), l = place(cam, Vr, true).filter((c) => (seen.has(c.num) ? false : (seen.add(c.num), true)));
      if (i) drawCallouts(g, l, Vr, extent(cam, Vr, REG2.x0, REG2.x1), l.length > 16 ? 15 : 18, 40, i);
      else drawCallouts(g, l, Vr, extent(cam, Vr, REG.x0, REG.x1), l.length > 26 ? 21 : 26, 150, 0);
    });
    if (opt.isoOnly) return cv;
    // Columna derecha: lista de materiales, notas y rótulo
    const RX = 2090, RW = W - 90 - RX; g.__layer = 'TABLA';
    let y = 100;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = INK;
    const bomTitle = d.bom.length ? 'LISTA DE MATERIALES - TIPO "' + d.code + '"' : 'COMPONENTES PRINCIPALES';
    g.font = '600 32px ' + F.s; g.fillText(bomTitle, RX + RW / 2, y + 28);
    const tw = g.measureText(bomTitle).width; g.fillRect(RX + RW / 2 - tw / 2, y + 36, tw, 2.5);
    y += 62;
    const cw = [92, RW - 92 - 130, 130];
    g.lineWidth = 2; g.strokeStyle = INK;
    const head = ['ÍTEM', 'DESCRIPCIÓN', d.bom.length ? 'CANTIDAD' : ''];
    g.font = '600 22px ' + F.s;
    g.strokeRect(RX, y, RW, 40);
    let x = RX; head.forEach((t, i) => { g.textAlign = 'center'; g.fillText(t, x + cw[i] / 2, y + 28); if (i) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 40); g.stroke(); } x += cw[i]; });
    y += 40;
    rows.sort((a, b2) => (parseInt(a[0], 10) || 0) - (parseInt(b2[0], 10) || 0));
    const cmp = rows.length > 14, LH = cmp ? 20 : 26, LIM = cmp ? 1400 : 1120; let cut = false;
    g.font = (cmp ? 17 : 21) + 'px ' + F.s;
    for (const r of rows) {
      const lines = wrapLines(g, String(r[1]).toUpperCase(), cw[1] - 16);
      const rh = Math.max(cmp ? 28 : 36, lines.length * LH + 10);
      if (y + rh > LIM) { cut = true; break; }
      g.strokeRect(RX, y, RW, rh);
      g.beginPath(); g.moveTo(RX + cw[0], y); g.lineTo(RX + cw[0], y + rh); g.moveTo(RX + cw[0] + cw[1], y); g.lineTo(RX + cw[0] + cw[1], y + rh); g.stroke();
      g.textAlign = 'center'; g.fillText(r[0], RX + cw[0] / 2, y + rh / 2 + 7);
      g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, RX + cw[0] + 8, y + (cmp ? 20 : 25) + i * LH));
      g.textAlign = 'center'; g.fillText(r[2] || '', RX + cw[0] + cw[1] + cw[2] / 2, y + rh / 2 + 7);
      y += rh;
    }
    if (cut) { g.textAlign = 'left'; g.font = '20px ' + F.s; g.fillText('(LISTA COMPLETA EN EL VISOR)', RX, y + 28); y += 36; }
    if (d.bom.length && /L\.R\./.test(d.bom.map((r) => r[2]).join(' '))) { g.textAlign = 'left'; g.font = '20px ' + F.s; g.fillText('L.R. = LO QUE SE REQUIERA', RX, y + 28); y += 36; }
    // Notas
    y += 30;
    if (d.notes.length) {
      g.textAlign = 'left'; g.font = '600 24px ' + F.s; g.fillText('NOTAS:', RX, y + 24); y += 40;
      g.font = '20px ' + F.s;
      d.notes.forEach((n) => {
        const t = n.replace(/^Nota\s*(\d+)\.?\s*/i, '$1. ').toUpperCase();
        wrapLines(g, t, RW - 10).forEach((l) => { if (y < 1500) { g.fillText(l, RX + 4, y + 20); y += 26; } });
        y += 8;
      });
    }
    // Rótulo (viñeta): el diseño se elige en la ventana de ajuste
    const TY = 1540, TH = H - 90 - TY; g.__layer = 'ROTULO';
    const CA = PL.c || {}, up = (t) => String(t || '').toUpperCase();
    if (PL.vin === 'neutra') { rotuloNeutro(g, d, RX, TY, RW, TH, CA); return cv; }
    g.lineWidth = 3; g.strokeRect(RX, TY, RW, TH);
    g.fillStyle = NAVY; g.fillRect(RX, TY, RW, 86);
    g.fillStyle = AMBER; g.fillRect(RX, TY + 86, RW, 6);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    if (LOGO.complete && LOGO.naturalWidth) { const lh = 72, lw = LOGO.naturalWidth * lh / LOGO.naturalHeight; g.drawImage(LOGO, RX + 16, TY + 7, lw, lh); }
    else { g.font = '700 46px ' + F.d; g.fillText('REYENGI', RX + 24, TY + 45); }
    g.font = '500 20px ' + F.s; g.textAlign = 'right'; g.fillStyle = '#C9D6E3'; g.fillText('reyengi.cl', RX + RW - 20, TY + 45);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3;
    const cy = TY + 92 + 95;
    g.beginPath(); g.arc(RX + 90, cy, 66, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center';
    if (d.code && d.code.length > 11 && d.code.indexOf('-') > 0) { const k = d.code.indexOf('-'); g.font = '700 20px ' + F.s; g.fillText(d.code.slice(0, k), RX + 90, cy - 12); g.fillText(d.code.slice(k + 1), RX + 90, cy + 14); }
    else { g.font = '700 ' + (d.code.length > 6 ? 21 : d.code.length > 4 ? 34 : 42) + 'px ' + F.s; g.fillText(d.code || 'REF', RX + 90, cy + 2); }
    g.textAlign = 'left'; g.font = '600 30px ' + F.s; g.fillText('DETALLE DE MONTAJE', RX + 180, cy - 44);
    g.font = '600 27px ' + F.s;
    wrapLines(g, (d.name && d.name.toUpperCase().includes(d.main.toUpperCase()) ? d.name : d.main + (d.name ? ' · ' + d.name : '')).toUpperCase(), RW - 200).slice(0, 3).forEach((l, i) => g.fillText(l, RX + 180, cy - 4 + i * 34));
    const ry = TY + 92 + 196;
    g.lineWidth = 2; g.beginPath(); g.moveTo(RX, ry); g.lineTo(RX + RW, ry); g.stroke();
    const today = new Date(), dd = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();
    const cells = [['ESCALA', 'S/E'], ['FECHA', dd], ['HOJA', '1 DE 1']];
    cells.forEach((c, i) => {
      const cx2 = RX + RW * i / 3;
      if (i) { g.beginPath(); g.moveTo(cx2, ry); g.lineTo(cx2, ry + 64); g.stroke(); }
      g.textAlign = 'left'; g.font = '18px ' + F.s; g.fillText(c[0], cx2 + 12, ry + 18);
      g.font = '600 26px ' + F.s; g.fillText(c[1], cx2 + 12, ry + 46);
    });
    g.beginPath(); g.moveTo(RX, ry + 64); g.lineTo(RX + RW, ry + 64); g.stroke();
    g.font = '18px ' + F.s; g.textAlign = 'left';
    const src = d.ref ? 'BASADO EN PLANO ' + d.ref + (d.hoja ? ' · HOJA ' + d.hoja : '') : 'MODELO REFERENCIAL REYENGI';
    wrapLines(g, src, RW - 24).slice(0, 2).forEach((l, i) => g.fillText(l, RX + 12, ry + 88 + i * 24));
    g.fillText('DIBUJO GENERADO DESDE MODELO 3D · PROPORCIONES REFERENCIALES', RX + 12, ry + 88 + (src.length > 60 ? 2 : 1) * 24);
    const extra = [CA.proyecto && 'PROYECTO: ' + up(CA.proyecto), CA.plano && 'PLANO N° ' + up(CA.plano), CA.rev && 'REV. ' + up(CA.rev), CA.dibujo && 'DIB. ' + up(CA.dibujo)].filter(Boolean).join(' · ');
    if (extra) { g.font = '600 18px ' + F.s; g.fillText(wrapLines(g, extra, RW - 24)[0], RX + 12, ry + 88 + (src.length > 60 ? 3 : 2) * 24); }
    return cv;
  }
  // Viñeta neutra: sin marca, con los datos del proyecto y las firmas, para emitir con el formato del mandante
  function rotuloNeutro(g, d, RX, TY, RW, TH, CA) {
    const up = (t) => String(t || '').toUpperCase();
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3; g.strokeRect(RX, TY, RW, TH);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    const celda = (x, y, w, h, lab, val, big) => { g.lineWidth = 2; g.strokeRect(x, y, w, h); g.font = '16px ' + F.s; g.fillText(lab, x + 10, y + 15); g.font = '600 ' + (big || 24) + 'px ' + F.s; const t = wrapLines(g, up(val), w - 20)[0] || ''; g.fillText(t, x + 10, y + h - 22); };
    const h1 = 58; let y = TY;
    celda(RX, y, RW * 0.5, h1, 'CLIENTE', CA.cliente || ''); celda(RX + RW * 0.5, y, RW * 0.5, h1, 'PROYECTO', CA.proyecto || ''); y += h1;
    // Título con el código del detalle
    const ht = TH - h1 * 4 - 46; g.lineWidth = 2; g.strokeRect(RX, y, RW, ht);
    const cy = y + ht / 2; g.lineWidth = 3; g.beginPath(); g.arc(RX + 84, cy, Math.min(60, ht / 2 - 10), 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center';
    if (d.code && d.code.length > 11 && d.code.indexOf('-') > 0) { const k = d.code.indexOf('-'); g.font = '700 19px ' + F.s; g.fillText(d.code.slice(0, k), RX + 84, cy - 12); g.fillText(d.code.slice(k + 1), RX + 84, cy + 14); }
    else { g.font = '700 ' + (d.code.length > 6 ? 20 : d.code.length > 4 ? 32 : 40) + 'px ' + F.s; g.fillText(d.code || 'REF', RX + 84, cy + 2); }
    g.textAlign = 'left'; g.font = '600 28px ' + F.s; g.fillText('DETALLE DE MONTAJE', RX + 166, cy - 40);
    g.font = '600 25px ' + F.s;
    wrapLines(g, (d.name && d.name.toUpperCase().includes(d.main.toUpperCase()) ? d.name : d.main + (d.name ? ' · ' + d.name : '')).toUpperCase(), RW - 186).slice(0, 2).forEach((l, i) => g.fillText(l, RX + 166, cy - 2 + i * 32));
    y += ht;
    const today = new Date(), dd = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();
    celda(RX, y, RW * 0.46, h1, 'PLANO N°', CA.plano || ''); celda(RX + RW * 0.46, y, RW * 0.14, h1, 'REV.', CA.rev || ''); celda(RX + RW * 0.6, y, RW * 0.16, h1, 'ESCALA', 'S/E'); celda(RX + RW * 0.76, y, RW * 0.24, h1, 'FECHA', dd, 22); y += h1;
    celda(RX, y, RW / 3, h1, 'DIBUJÓ', CA.dibujo || ''); celda(RX + RW / 3, y, RW / 3, h1, 'REVISÓ', CA.reviso || ''); celda(RX + RW * 2 / 3, y, RW / 3, h1, 'APROBÓ', CA.aprobo || ''); y += h1;
    celda(RX, y, RW * 0.76, h1, 'REFERENCIA', d.ref ? 'PLANO ' + d.ref + (d.hoja ? ' · HOJA ' + d.hoja : '') : 'MODELO 3D REFERENCIAL', 20); celda(RX + RW * 0.76, y, RW * 0.24, h1, 'HOJA', '1 DE 1'); y += h1;
    g.font = '16px ' + F.s; g.textAlign = 'left'; g.fillText('DIBUJO GENERADO DESDE MODELO 3D · PROPORCIONES REFERENCIALES', RX + 10, y + 23);
  }

  /* --- PDF de una página con la imagen JPEG (A3 horizontal) --- */
  function pdfFromJpeg(bytes, w, h) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const PW = 1190.55, PH = 841.89;
    const content = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q';
    put('%PDF-1.4\n%\xC7\xEC\n');
    const obj = (n, s) => { offs[n] = len; put(n + ' 0 obj\n' + s + '\nendobj\n'); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offs[4] = len;
    put('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n');
    put(bytes); put('\nendstream\nendobj\n');
    obj(5, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    const x = len;
    let xr = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) xr += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    put(xr + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF\n');
    const out = new Uint8Array(len); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  }
  const b64bytes = (s) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };

  let busy = false;
  function generate(then) {                            // genera la lámina con la vista actual
    if (busy) return; busy = true;
    [bView, bGenPdf, bGenPng, bGenDxf].forEach((b) => { b.disabled = true; });
    stat.textContent = 'Generando plano…';
    setTimeout(() => {
      try {
        REC = dxfBuilder();
        const d = sheetData(), cv = compose(d), dxf = REC.bytes(); REC = null;
        const png = cv.toDataURL('image/png');
        const jpg = b64bytes(cv.toDataURL('image/jpeg', 0.92).split(',')[1]);
        const g = { d, png, dxf, pdf: pdfFromJpeg(jpg, cv.width, cv.height), name: 'Plano-' + (d.code || 'detalle').replace(/[^\w-]+/g, '_') };
        stat.textContent = 'Plano ' + (d.code || '') + ' listo.';
        then(g);
      } catch (err) {
        REC = null; stat.textContent = 'No se pudo generar el plano en este dispositivo.';
      } finally {
        busy = false; [bView, bGenPdf, bGenPng, bGenDxf].forEach((b) => { b.disabled = false; });
      }
    }, 40);
  }
  const showSheet = (g) => {
    current = g; ttl.textContent = 'Plano ' + (g.d.code || '') + ' · generado desde el modelo';
    bPdf.hidden = bPng.hidden = bDxf.hidden = false; ov.hidden = false;
    show(ttl.textContent, g.png, (VO.set || Object.keys(PL.gl).length || PL.v.join() !== 'iso,front,right' ? 'La lámina usa lo ajustado en la ventana de ajuste. ' : 'La lámina usa la vista actual del visor (tipo de montaje, despiece y ángulo). ') + 'Toca la imagen para ampliar.');
    bClose.focus();
  };
  bView.addEventListener('click', () => generate(showSheet));
  bGenPdf.addEventListener('click', () => generate(savePdfDxf));
  bGenDxf.addEventListener('click', () => generate((g) => save(g.dxf, g.name + '.dxf')));
  window.__planoGen = (cb) => generate(cb);
  bGenPng.addEventListener('click', () => generate((g) => fetch(g.png).then((r) => r.blob()).then((b) => save(b, g.name + '.png'))));
  /* --- Ventana de ajuste: la lámina completa antes de imprimir o exportar ---
     Se elige la vista de cada recuadro, se gira y acerca la isométrica, se arrastran los globos y se elige la viñeta. */
  const pv = mk('div', 'plano-ov plano-pv'); pv.hidden = true; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', 'Ajustar el plano antes de exportar');
  const pbar = mk('div', 'plano-bar'), pGen = mk('button', 'pri', 'Ver plano final'), pPdf = mk('button', '', 'Descargar PDF + DXF'), pPng = mk('button', '', 'Descargar PNG'), pClose = mk('button', '', 'Cerrar');
  pbar.append(mk('b', '', 'Ajustar plano antes de exportar'), pGen, pPdf, pPng, pClose);
  const pbody = mk('div', 'pv-body'), pstage = mk('div', 'pv-stage'), pcv = document.createElement('canvas'), pbusy = mk('div', 'pv-busy', 'Actualizando…');
  pcv.width = W / 2; pcv.height = H / 2; pcv.setAttribute('aria-label', 'Lámina del plano: arrastra un globo para moverlo; arrastra la vista isométrica para girarla'); pstage.append(pcv, pbusy);
  const panel = mk('div', 'pv-panel');
  const sub = (t) => panel.appendChild(mk('h3', '', t));
  // 1) Vistas de cada recuadro
  sub('Vistas');
  panel.appendChild(mk('p', '', 'Elige qué vista va en cada recuadro de la lámina. La rueda del mouse sobre un recuadro lo acerca o aleja.'));
  const NOM_SLOT = ['Recuadro principal', 'Recuadro superior', 'Recuadro inferior'], selV = [], zV = [];
  NOM_SLOT.forEach((nom, i) => {
    const w = mk('div', 'pv-vista'), l = mk('label'), sl = document.createElement('select'), o = mk('output'), r = document.createElement('input');
    Object.keys(VISTAS).forEach((k) => { if (!i && k === 'none') return; const op = document.createElement('option'); op.value = k; op.textContent = VISTAS[k][0]; sl.appendChild(op); });
    sl.setAttribute('aria-label', nom); r.type = 'range'; r.min = 50; r.max = 250; r.step = 5; r.setAttribute('aria-label', 'Acercamiento del ' + nom.toLowerCase());
    l.append(mk('span', '', nom), o); w.append(l, sl, r); panel.appendChild(w);
    sl.addEventListener('change', () => { PL.v[i] = sl.value; clearGl(i); syncInputs(); pvSchedule(); });
    r.addEventListener('input', () => { if (PL.v[i] === 'iso') { VO.zoom = +r.value / 100; VO.set = true; clearIso(); } else { PL.z[i] = +r.value / 100; clearGl(i); } syncInputs(); pvSchedule(); });
    selV.push(sl); zV.push({ r, o });
  });
  // 2) Encuadre de la isométrica libre
  sub('Isométrica libre');
  panel.appendChild(mk('p', '', 'Arrastra sobre la vista isométrica para girarla, o usa los controles.'));
  const SL = [['az', 'Giro', -180, 180, 1, '°', 1], ['el', 'Inclinación', -89, 89, 1, '°', 1], ['px', 'Mover horizontal', -45, 45, 1, ' %', 100], ['py', 'Mover vertical', -45, 45, 1, ' %', 100]];
  const inp = {};
  SL.forEach(([k, lab, mn, mx, stp, u, f]) => {
    const w = mk('div'), l = mk('label'), o = mk('output'), r = document.createElement('input');
    r.type = 'range'; r.min = mn; r.max = mx; r.step = stp; r.setAttribute('aria-label', lab);
    l.append(mk('span', '', lab), o); w.append(l, r); panel.appendChild(w);
    r.addEventListener('input', () => { VO[k] = +r.value / f; VO.set = true; o.textContent = r.value + u; clearIso(); pvSchedule(); });
    inp[k] = { r, o, u, f };
  });
  const pbt = mk('div', 'pv-btns'), bIso = mk('button', '', 'Isométrica estándar'), bCam = mk('button', '', 'Usar vista del visor'), bCen = mk('button', '', 'Centrar y 100 %'), bFr = mk('button', '', 'Desde el frente');
  pbt.append(bIso, bFr, bCam, bCen); panel.appendChild(pbt);
  // 3) Globos
  sub('Globos de ítem');
  panel.appendChild(mk('p', '', 'Arrastra cualquier globo sobre la lámina para ubicarlo donde se lea mejor; la flecha sigue apuntando a su pieza.'));
  const pbg = mk('div', 'pv-btns'), bGl = mk('button', 'wide', 'Volver los globos a su lugar'); pbg.append(bGl); panel.appendChild(pbg);
  // 4) Viñeta
  sub('Viñeta (rótulo)');
  const wv = mk('div', 'pv-vista'), selVin = document.createElement('select'); selVin.setAttribute('aria-label', 'Tipo de viñeta');
  [['reyengi', 'ReyEngi (estándar)'], ['neutra', 'Neutra, con datos del proyecto y firmas']].forEach(([k, t]) => { const op = document.createElement('option'); op.value = k; op.textContent = t; selVin.appendChild(op); });
  wv.append(selVin); panel.appendChild(wv);
  const CAMPOS = [['cliente', 'Cliente'], ['proyecto', 'Proyecto'], ['plano', 'N° de plano'], ['rev', 'Revisión'], ['dibujo', 'Dibujó'], ['reviso', 'Revisó'], ['aprobo', 'Aprobó']], inC = {};
  const gc = mk('div', 'pv-campos');
  CAMPOS.forEach(([k, lab]) => { const l = mk('label', '', lab), x = document.createElement('input'); x.type = 'text'; x.autocomplete = 'off'; l.appendChild(x); gc.appendChild(l); inC[k] = x; x.addEventListener('input', () => { PL.c[k] = x.value; guardarAj(); pvSchedule(); }); });
  panel.appendChild(gc);
  selVin.addEventListener('change', () => { PL.vin = selVin.value; guardarAj(); pvSchedule(); });
  const pstat = mk('p', ''); pstat.setAttribute('aria-live', 'polite'); panel.appendChild(pstat);
  [pGen, pPdf, pPng, pClose, bIso, bCam, bCen, bFr, bGl].forEach((b) => { b.type = 'button'; });
  pbody.append(pstage, panel); pv.append(pbar, pbody); document.body.appendChild(pv);

  // Los ajustes se recuerdan por detalle en este navegador (si el almacenamiento está disponible)
  const claveAj = () => 'reyengi-plano:' + (sheetData().code || document.title || 'detalle');
  function guardarAj() { try { localStorage.setItem(claveAj(), JSON.stringify({ v: PL.v, z: PL.z, gl: PL.gl, vin: PL.vin, vo: VO })); localStorage.setItem('reyengi-plano-campos', JSON.stringify(PL.c)); } catch (e) {} }
  function cargarAj() {
    try { const c = JSON.parse(localStorage.getItem('reyengi-plano-campos') || 'null'); if (c) PL.c = c; } catch (e) {}
    try { const a = JSON.parse(localStorage.getItem(claveAj()) || 'null'); if (a) { if (Array.isArray(a.v) && a.v.length === 3) PL.v = a.v.map((k, i) => (VISTAS[k] && (i || k !== 'none') ? k : PL.v[i])); if (Array.isArray(a.z)) PL.z = a.z.map((n) => +n || 1); PL.gl = a.gl || {}; if (a.vin) PL.vin = a.vin; if (a.vo && a.vo.set) Object.assign(VO, a.vo); } } catch (e) {}
  }
  function clearGl(i) { Object.keys(PL.gl).forEach((k) => { if (k.indexOf(i + ':') === 0) delete PL.gl[k]; }); }
  function clearIso() { PL.v.forEach((k, i) => { if (k === 'iso') clearGl(i); }); }
  const syncInputs = () => {
    SL.forEach(([k]) => { const q = inp[k], v = Math.round(VO[k] * q.f); q.r.value = v; q.o.textContent = v + q.u; });
    PL.v.forEach((k, i) => { selV[i].value = k; const z = Math.round((k === 'iso' ? VO.zoom : PL.z[i]) * 100); zV[i].r.value = z; zV[i].o.textContent = k === 'none' ? '' : z + ' %'; zV[i].r.disabled = k === 'none'; });
    selVin.value = PL.vin; CAMPOS.forEach(([k]) => { if (document.activeElement !== inC[k]) inC[k].value = PL.c[k] || ''; });
  };
  let lastCv = null;
  function pintarPv(fantasma) {                        // lámina a media resolución; durante un arrastre, además el globo en su nueva posición
    const g2 = pcv.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, pcv.width, pcv.height);
    if (lastCv) g2.drawImage(lastCv, 0, 0, W, H, 0, 0, pcv.width, pcv.height);
    if (fantasma) {
      const k = pcv.width / W; g2.save(); g2.scale(k, k);
      g2.strokeStyle = '#EF5A05'; g2.lineWidth = 4; g2.setLineDash([14, 10]);
      g2.beginPath(); g2.moveTo(fantasma.x, fantasma.y); g2.lineTo(fantasma.tx, fantasma.ty); g2.stroke(); g2.setLineDash([]);
      g2.beginPath(); g2.arc(fantasma.x, fantasma.y, fantasma.r, 0, Math.PI * 2); g2.fillStyle = '#fff'; g2.fill(); g2.stroke();
      g2.fillStyle = '#EF5A05'; g2.font = '600 ' + Math.round(fantasma.r) + 'px ' + F.s; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(fantasma.num, fantasma.x, fantasma.y + 1);
      g2.restore();
    }
  }
  let pvT = 0;
  function pvRender() {
    pbusy.hidden = false;
    clearTimeout(pvT);
    pvT = setTimeout(() => {
      try {
        lastCv = compose(sheetData(), { cache: true }); pintarPv();
        const mov = Object.keys(PL.gl).length;
        pstat.textContent = 'Vistas: ' + PL.v.filter((k) => k !== 'none').map((k) => VISTAS[k][0].replace(/ \(.*/, '').toLowerCase()).join(', ') + (mov ? ' · ' + mov + ' globo' + (mov === 1 ? '' : 's') + ' movido' + (mov === 1 ? '' : 's') : '') + '.';
        guardarAj();
      } catch (e) { pstat.textContent = 'No se pudo dibujar la lámina en este dispositivo.'; }
      pbusy.hidden = true;
    }, 30);
  }
  let pvD = 0; function pvSchedule() { pbusy.hidden = false; clearTimeout(pvD); pvD = setTimeout(pvRender, 220); }
  const fromCam = () => { const a = camAngles(); Object.assign(VO, { az: a.az, el: a.el, zoom: 1, px: 0, py: 0 }); };
  let ajCargado = false;
  bPrev.addEventListener('click', () => { if (!ajCargado) { cargarAj(); ajCargado = true; } if (!VO.set) fromCam(); LC.clear(); syncInputs(); pv.hidden = false; pClose.focus(); pvRender(); });
  bIso.addEventListener('click', () => { Object.assign(VO, { set: true, az: 45, el: 35 }); clearIso(); syncInputs(); pvSchedule(); });
  bFr.addEventListener('click', () => { Object.assign(VO, { set: true, az: 20, el: 18 }); clearIso(); syncInputs(); pvSchedule(); });
  bCam.addEventListener('click', () => { fromCam(); VO.set = false; clearIso(); syncInputs(); pvSchedule(); });
  bCen.addEventListener('click', () => { Object.assign(VO, { set: true, zoom: 1, px: 0, py: 0 }); PL.z = [1, 1, 1]; PL.gl = {}; syncInputs(); pvSchedule(); });
  bGl.addEventListener('click', () => { PL.gl = {}; pvSchedule(); });
  { // Interacción sobre la lámina: arrastrar globos, girar la isométrica, acercar con la rueda
    const RECT = [{ x: 90, y: 90, w: 1210, h: 1800 }, { x: 1320, y: 90, w: 720, h: 860 }, { x: 1320, y: 1050, w: 720, h: 840 }];
    const aLamina = (e) => { const r = pcv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    const slotEn = (x, y) => RECT.findIndex((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    let dr = null;
    pcv.addEventListener('pointerdown', (e) => {
      const [x, y] = aLamina(e), hit = HITS.slice().reverse().find((h) => Math.hypot(h.x - x, h.y - y) <= h.r + 10);
      if (hit) { dr = { t: 'globo', h: hit, dx: hit.x - x, dy: hit.y - y }; pcv.style.cursor = 'grabbing'; }
      else { const i = slotEn(x, y); if (i >= 0 && PL.v[i] === 'iso') dr = { t: 'giro', x: e.clientX, y: e.clientY, az: VO.az, el: VO.el }; else return; }
      pcv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    pcv.addEventListener('pointermove', (e) => {
      const [x, y] = aLamina(e);
      if (!dr) { pcv.style.cursor = HITS.some((h) => Math.hypot(h.x - x, h.y - y) <= h.r + 10) ? 'grab' : (PL.v[slotEn(x, y)] === 'iso' ? 'move' : 'default'); return; }
      if (dr.t === 'globo') {
        const q = RECT[dr.h.slot], bx = Math.max(q.x + dr.h.r, Math.min(q.x + q.w - dr.h.r, x + dr.dx)), by = Math.max(q.y + dr.h.r, Math.min(q.y + q.h - dr.h.r, y + dr.dy));
        dr.pos = { x: bx, y: by }; pintarPv({ x: bx, y: by, r: dr.h.r, num: dr.h.num, tx: dr.h.tx, ty: dr.h.ty });
      } else { VO.set = true; VO.az = ((dr.az - (e.clientX - dr.x) * 0.45 + 540) % 360) - 180; VO.el = Math.max(-89, Math.min(89, dr.el + (e.clientY - dr.y) * 0.35)); clearIso(); syncInputs(); pvSchedule(); }
    });
    const soltar = () => {
      if (dr && dr.t === 'globo' && dr.pos) { const q = RECT[dr.h.slot]; PL.gl[dr.h.k] = { fx: (dr.pos.x - q.x) / q.w, fy: (dr.pos.y - q.y) / q.h }; pvRender(); }
      dr = null; pcv.style.cursor = 'default';
    };
    pcv.addEventListener('pointerup', soltar); pcv.addEventListener('pointercancel', soltar);
    pcv.addEventListener('wheel', (e) => {
      const [x, y] = aLamina(e), i = slotEn(x, y); if (i < 0 || PL.v[i] === 'none') return; e.preventDefault();
      const f = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      if (PL.v[i] === 'iso') { VO.set = true; VO.zoom = Math.max(0.5, Math.min(2.5, VO.zoom * f)); clearIso(); } else { PL.z[i] = Math.max(0.5, Math.min(2.5, PL.z[i] * f)); clearGl(i); }
      syncInputs(); pvSchedule();
    }, { passive: false }); }
  window.__ajHits = () => HITS.map((h) => ({ k: h.k, x: h.x, y: h.y, r: h.r, slot: h.slot, num: h.num }));
  const ajustado = () => VO.set || PL.v.join() !== 'iso,front,right' || Object.keys(PL.gl).length || PL.vin !== 'reyengi';
  const pvClose = () => { pv.hidden = true; LC.clear(); stat.textContent = ajustado() ? 'Plano ajustado: se usará así al generar o descargar.' : ''; };
  pClose.addEventListener('click', pvClose);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pv.hidden) pvClose(); });
  pGen.addEventListener('click', () => { pv.hidden = true; LC.clear(); generate(showSheet); });
  pPdf.addEventListener('click', () => generate(savePdfDxf));
  pPng.addEventListener('click', () => generate((g) => fetch(g.png).then((r) => r.blob()).then((b) => save(b, g.name + '.png'))));
  if (bOrig) {
    const o = window.__ORIG;
    bOrig.addEventListener('click', () => {
      ttl.textContent = 'Plano original · ' + (typeof o.hoja === 'number' ? 'hoja ' : '') + o.hoja;
      current = { png: null, dxf: null, pdf: b64bytes(o.pdf), name: 'Plano-original-' + String(o.hoja).replace(/[^\w-]+/g, '_') };
      bPng.hidden = true; bDxf.hidden = true; bPdf.hidden = false; ov.hidden = false;
      show(ttl.textContent, o.png, 'Hoja del plano original del proyecto (uso interno). Toca la imagen para ampliar.');
      bClose.focus();
    });
    bOrigPdf.addEventListener('click', () => save(new Blob([b64bytes(o.pdf)], { type: 'application/pdf' }), 'Plano-original-' + String(o.hoja).replace(/[^\w-]+/g, '_') + '.pdf'));
  }
})();
};
