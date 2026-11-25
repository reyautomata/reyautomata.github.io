/* Suite ReyEngi · Fotos de terreno por tag
 * Las imágenes (pesadas) se guardan en IndexedDB del navegador; la lista liviana (tag, nombre, fecha) va en el proyecto
 * activo, en «fotos», para que los cruces por tag las cuenten y viajen con el resto de los datos del proyecto.
 * API (window.REFotos): guardar(tag, blob, meta) · listar(tag) · obtener(id) · borrar(id) · cuantas(claveTag) · todas() */
(function () {
  'use strict';
  if (window.REFotos) return;
  var DBN = 'reyengi-fotos', ST = 'f', db = null;
  var P = function () { return window.REProyectos; };
  var clave = function (t) { return window.RECruces ? window.RECruces.clave(t) : String(t || '').toUpperCase().trim(); };
  function abrir() {
    if (db) return Promise.resolve(db);
    return new Promise(function (ok, no) {
      if (!window.indexedDB) return no(new Error('Este navegador no permite guardar imágenes.'));
      var r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = function () { var s = r.result.createObjectStore(ST, { keyPath: 'id' }); s.createIndex('pk', 'pk'); };
      r.onsuccess = function () { db = r.result; ok(db); };
      r.onerror = function () { no(r.error || new Error('No se pudo abrir el almacén de imágenes.')); };
    });
  }
  function tx(modo, fn) { return abrir().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction(ST, modo), s = t.objectStore(ST), res = fn(s); t.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); }; t.onerror = function () { no(t.error); }; }); }); }
  function meta() { var m = P() ? P().leer('fotos', null) : null; m = m || {}; m.lista = m.lista || []; return m; }
  function guardarMeta(m) { if (!P()) return; m.conteo = {}; m.lista.forEach(function (f) { m.conteo[f.key] = (m.conteo[f.key] || 0) + 1; }); P().escribir('fotos', m); }
  function guardar(tag, blob, o) {
    if (!P()) return Promise.reject(new Error('Sin proyecto activo.'));
    o = o || {};
    var id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), pid = P().activoId(), k = clave(tag);
    var rec = { id: id, pk: pid + '|' + k, proy: pid, key: k, tag: String(tag || '').toUpperCase(), nombre: o.nombre || 'foto', fecha: new Date().toISOString(), nota: o.nota || '', ancho: o.ancho || 0, alto: o.alto || 0, tipo: o.tipo || 'foto', blob: blob };
    return tx('readwrite', function (s) { s.put(rec); }).then(function () {
      var m = meta(); m.lista.push({ id: id, key: k, tag: rec.tag, nombre: rec.nombre, fecha: rec.fecha, tipo: rec.tipo, nota: rec.nota }); guardarMeta(m); return rec;
    });
  }
  function listar(tag) {
    if (!P()) return Promise.resolve([]);
    var pk = P().activoId() + '|' + clave(tag);
    return tx('readonly', function (s) { return s.index('pk').getAll(pk); }).then(function (r) { return (r || []).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }); });
  }
  function obtener(id) { return tx('readonly', function (s) { return s.get(id); }); }
  function borrar(id) {
    return tx('readwrite', function (s) { s.delete(id); }).then(function () { var m = meta(); m.lista = m.lista.filter(function (f) { return f.id !== id; }); guardarMeta(m); });
  }
  function cuantas(k) { var m = meta(); return (m.conteo && m.conteo[k]) || 0; }
  function todas() { return meta().lista.slice(); }
  window.REFotos = { guardar: guardar, listar: listar, obtener: obtener, borrar: borrar, cuantas: cuantas, todas: todas };
})();
