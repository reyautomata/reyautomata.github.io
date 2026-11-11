/* Vista previa web de ReyEngi Conduit: simula la API de licencia de la app de escritorio.
 * El modo llega en la dirección (?modo=vigente | porvencer | vencida | sin). No valida claves reales. */
(function () {
  'use strict';
  var modo = (location.search.match(/modo=(\w+)/) || [])[1] || 'vigente';
  function fecha(d) { var x = new Date(); x.setDate(x.getDate() + d); return x.toLocaleDateString('sv-SE'); }
  var base = { equipo: '4F7B-0CB4-9D65-33AC', cliente: 'Empresa Demo SpA', plan: '12m' };
  var E = {
    vigente: Object.assign({ ok: true, dias: 182, vence: fecha(182) }, base),
    porvencer: Object.assign({ ok: true, dias: 12, vence: fecha(12) }, base),
    vencida: Object.assign({ ok: false, codigo: 'vencida', dias: -3, vence: fecha(-3), motivo: 'La licencia venció el ' + fecha(-3) + '.' }, base),
    sin: { ok: false, codigo: 'sin', equipo: base.equipo, motivo: 'Esta copia no tiene licencia activada.' }
  }[modo] || null;
  function avisar(t) { try { parent.postMessage({ reyDemo: t }, '*'); } catch (e) {} }
  window.reyLicencia = {
    estado: function () { return Promise.resolve(E); },
    abrir: function () { avisar('licencia'); return Promise.resolve(true); },
    copiar: function (t) { try { navigator.clipboard.writeText(t); } catch (e) {} return Promise.resolve(true); },
    solicitar: function () { avisar('Vista previa: en la app de escritorio este botón abre WhatsApp con el código de equipo y el plan elegido.'); return Promise.resolve(true); },
    activar: function () { return Promise.resolve({ ok: false, motivo: 'Vista previa: la activación con clave funciona solo en la app de escritorio.' }); },
    cerrar: function () { avisar('cerrar'); return Promise.resolve(true); }
  };
})();
