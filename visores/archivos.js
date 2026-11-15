/* Suite ReyEngi · carpeta real del proyecto.
 * El usuario vincula una carpeta de su computador (acceso a archivos del navegador: Chrome, Edge y Electron).
 * La suite puede crear en ella la estructura estándar, listar sus archivos reales y guardar ahí una copia de lo que exporta.
 * Nunca se sobrescribe un archivo: si el nombre existe, se guarda con la revisión y un número. Nada se sube a Internet. */
(function () {
  'use strict';
  var P = window.REProyectos, R = window.RE_ENTREGABLES; if (!P || !R || window.RE_ARCHIVOS) return;
  var SOPORTE = typeof window.showDirectoryPicker === 'function';
  function carp(cat) { return R.subcategorias.filter(function (s) { return s.category === cat; }).map(function (s) { return s.folder; }); }
  var ESTRUCTURA = [['00_GESTION_PROYECTO', ['Datos_Proyecto', 'Configuracion', 'Revisiones']], ['01_DOCUMENTOS_INGENIERIA', carp('DOCUMENTO')], ['02_PLANOS_INGENIERIA', carp('PLANO')],
    ['03_REFERENCIAS', ['Manuales', 'Normativa', 'Catalogos', 'Planos_Referencia']], ['04_MODELOS_3D', []], ['05_EXPORTACIONES', []], ['06_RESPALDOS', []]];
  function db() { return new Promise(function (ok, no) { var r = indexedDB.open('reyengi-fs', 1); r.onupgradeneeded = function () { r.result.createObjectStore('carpetas'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); }
  function idb(modo, f) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('carpetas', modo), q = f(t.objectStore('carpetas')); t.oncomplete = function () { ok(q && q.result); }; t.onerror = function () { no(t.error); }; }); }); }
  var cache = {};
  function raiz() { var id = P.activoId(); if (cache[id] !== undefined) return Promise.resolve(cache[id]); return idb('readonly', function (s) { return s.get(id); }).then(function (h) { cache[id] = h || null; return cache[id]; }).catch(function () { return null; }); }
  function permiso(h, pedir) {
    if (!h) return Promise.resolve('sin-carpeta'); if (!h.queryPermission) return Promise.resolve('granted');
    return h.queryPermission({ mode: 'readwrite' }).then(function (q) { return q !== 'granted' && pedir ? h.requestPermission({ mode: 'readwrite' }) : q; }).catch(function () { return 'denied'; });
  }
  function dir(h, partes, crear) { return partes.reduce(function (p, n) { return p.then(function (d) { return d.getDirectoryHandle(n, { create: !!crear }); }); }, Promise.resolve(h)); }
  function existe(d, n) { return d.getFileHandle(n).then(function () { return true; }, function () { return false; }); }
  function rutaSub(subId) { var s = R.subcategorias.filter(function (x) { return x.id === subId; })[0]; return s ? [s.category === 'PLANO' ? '02_PLANOS_INGENIERIA' : '01_DOCUMENTOS_INGENIERIA', s.folder] : ['05_EXPORTACIONES']; }
  var limpio = function (n) { return String(n || 'archivo').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'archivo'; };

  var A = window.RE_ARCHIVOS = {
    soportado: SOPORTE, ESTRUCTURA: ESTRUCTURA, raiz: raiz, permiso: permiso, dir: dir, rutaSub: rutaSub,
    vincular: function () { return window.showDirectoryPicker({ mode: 'readwrite' }).then(function (h) { var id = P.activoId(); cache[id] = h; return idb('readwrite', function (s) { return s.put(h, id); }).then(function () { return h; }, function () { return h; }); }); }, // si no se puede recordar, vale para esta sesión
    desvincular: function () { var id = P.activoId(); cache[id] = null; return idb('readwrite', function (s) { return s.delete(id); }); },
    // Crea físicamente las carpetas que falten; devuelve cuántas creó
    crearEstructura: function () {
      return raiz().then(function (h) { return permiso(h, true).then(function (q) { if (q !== 'granted') throw new Error('Sin permiso para escribir en la carpeta.'); var n = 0, cola = Promise.resolve();
        ESTRUCTURA.forEach(function (e) { [[e[0]]].concat(e[1].map(function (x) { return [e[0], x]; })).forEach(function (ru) { cola = cola.then(function () { return dir(h, ru, false).catch(function () { n++; return dir(h, ru, true); }); }); }); });
        return cola.then(function () { return n; }); }); });
    },
    // Guarda un archivo en la subcarpeta de su subcategoría sin sobrescribir; devuelve la ruta relativa o null si no hay carpeta con permiso
    guardarCopia: function (subId, nombre, blob, rev) {
      return raiz().then(function (h) { if (!h) return null; return permiso(h, false).then(function (q) { if (q !== 'granted') return null;
        var ru = rutaSub(subId); nombre = limpio(nombre); var p = nombre.lastIndexOf('.'), base = p > 0 ? nombre.slice(0, p) : nombre, ext = p > 0 ? nombre.slice(p) : '';
        return dir(h, ru, true).then(function (d) {
          function probar(k) { var n = k === 0 ? nombre : base + (rev ? '_Rev' + rev : '') + (k > 1 ? '_' + k : '') + ext; return existe(d, n).then(function (si) { return si ? (k > 60 ? base + '_' + Date.now() + ext : probar(k + 1)) : n; }); }
          return probar(0).then(function (n) { return d.getFileHandle(n, { create: true }).then(function (f) { return f.createWritable(); }).then(function (w) { return w.write(blob).then(function () { return w.close(); }); }).then(function () { return ru.concat(n).join('/'); }); });
        }); }); }).catch(function () { return null; });
    },
    copiar: function () { try { return localStorage.getItem('reyengi-fs-copia') !== '0'; } catch (e) { return true; } },
    fijarCopia: function (v) { try { localStorage.setItem('reyengi-fs-copia', v ? '1' : '0'); } catch (e) {} }
  };

  // ── Copia automática de lo exportado: cada descarga generada por la suite se guarda también en la carpeta del proyecto ──
  var EXT = { pdf: 'PDF', dxf: 'DXF', xlsx: 'Excel', xls: 'Excel', docx: 'Word', doc: 'Word', png: 'PNG', csv: 'CSV', zip: 'DXF' };
  function aviso(t) { var d = document.createElement('div'); d.setAttribute('role', 'status'); d.style.cssText = 'position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:95;background:#111D2E;color:#EAF2F8;border:1px solid #38C8E8;border-radius:8px;padding:8px 14px;font:12.5px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:90vw'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4500); }
  var clic = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var a = this, href = a.href, nom = a.download;
    try { if (nom && /^blob:/.test(href) && A.copiar() && !/\.(reypid|json|rey)$/i.test(nom) && !document.querySelector('main.gd, main.ex')) {
      var G = window.RE_GESTION, f = EXT[(nom.split('.').pop() || '').toLowerCase()];
      var pb = fetch(href).then(function (r) { return r.blob(); }); // antes de que el módulo libere el enlace
      raiz().then(function (h) { if (!h) return; var d = G && f ? G.actual(f, G.conjunto()) : null;
        return pb.then(function (b) { return A.guardarCopia(d ? d.subcategoria : '', nom, b, d ? d.rev : ''); }).then(function (ruta) {
          if (ruta) { if (d) G.adjuntar(d.id, ruta); aviso('Copia guardada en la carpeta del proyecto: ' + ruta); } else aviso('No se guardó copia en la carpeta del proyecto: falta permiso. Ábrela en Proyecto › Explorador de archivos.'); }); }).catch(function () {});
    } } catch (e) {}
    return clic.apply(a, arguments);
  };
})();
