/* Suite ReyEngi · asistente de IA local.
 * Conversa con un modelo servido por Ollama en el computador del usuario (http://127.0.0.1:11434): nada se envía a Internet.
 * El modelo puede pedir herramientas; la página las ejecuta: ir a un módulo, consultar el proyecto activo (solo lectura), calcular y recordar. */
(function () {
  'use strict';
  if (window.__RS_ASIS) return; window.__RS_ASIS = 1;
  var BASE = window.RS_BASE || './', GRUPOS = window.RS_GRUPOS || [], CLAVE = 'reyengi-asistente';
  var S = { abierto: false, url: 'http://127.0.0.1:11434', modelo: '', nombre: 'ReyEngi AI', inst: '', mem: [], msgs: [] };
  try { Object.assign(S, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
  function guardar() { try { S.msgs = S.msgs.slice(-40); while (S.msgs.length && S.msgs[0].role === 'tool') S.msgs.shift(); localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) {} }
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  function enLinea(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function md(t) {
    var out = [], ls = String(t || '').replace(/<think>[\s\S]*?(<\/think>|$)/g, '').split('\n'), i = 0, par = [], RL = /^\s*([-*•]|\d+[.)])\s+/;
    function cerrar() { if (par.length) { out.push('<p>' + par.map(enLinea).join('<br>') + '</p>'); par = []; } }
    while (i < ls.length) {
      var l = ls[i];
      if (/^```/.test(l)) { cerrar(); var c = []; i++; while (i < ls.length && !/^```/.test(ls[i])) c.push(ls[i++]); i++; out.push('<pre><code>' + esc(c.join('\n')) + '</code></pre>'); continue; }
      if (/^#{1,4}\s/.test(l)) { cerrar(); out.push('<h4>' + enLinea(l.replace(/^#+\s*/, '')) + '</h4>'); i++; continue; }
      if (RL.test(l)) { cerrar(); var ord = /^\s*\d/.test(l), it = []; while (i < ls.length && RL.test(ls[i])) it.push('<li>' + enLinea(ls[i++].replace(RL, '')) + '</li>'); out.push((ord ? '<ol>' : '<ul>') + it.join('') + (ord ? '</ol>' : '</ul>')); continue; }
      if (/^\s*\|.*\|\s*$/.test(l)) { cerrar(); var f = []; while (i < ls.length && /^\s*\|.*\|\s*$/.test(ls[i])) f.push(ls[i++]);
        out.push('<div class="ra-tw"><table>' + f.filter(function (x) { return !/^\s*\|[\s:|-]+\|\s*$/.test(x); }).map(function (x, k) { return '<tr>' + x.trim().slice(1, -1).split('|').map(function (y) { return (k ? '<td>' : '<th>') + enLinea(y.trim()) + (k ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table></div>'); continue; }
      if (!l.trim()) { cerrar(); i++; continue; }
      par.push(l); i++;
    }
    cerrar(); return out.join('');
  }

  // ── Calculadora propia (sin eval): + - * / % ^ ( ) y funciones matemáticas ──
  var FUN = { sqrt: Math.sqrt, raiz: Math.sqrt, sin: Math.sin, sen: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log10, log10: Math.log10, ln: Math.log, exp: Math.exp, abs: Math.abs, pow: Math.pow, min: Math.min, max: Math.max, round: Math.round };
  function calcular(src) {
    var s = String(src || '').toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/\*\*/g, '^');
    if (!/(min|max|pow)\(/.test(s)) s = s.replace(/(\d),(?=\d)/g, '$1.');
    var tk = s.match(/\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[a-z_][a-z0-9_]*|[-+*\/%^(),]/g) || [], i = 0;
    if (tk.join('') !== s.replace(/\s+/g, '')) throw new Error('Expresión no válida.');
    function prim() {
      var t = tk[i++];
      if (t === '(') { var v = suma(); if (tk[i++] !== ')') throw new Error('Falta cerrar un paréntesis.'); return v; }
      if (t === '-') return -pot(); if (t === '+') return pot();
      if (/^[\d.]/.test(t || '')) return parseFloat(t);
      if (t === 'pi') return Math.PI;
      if (t && Object.prototype.hasOwnProperty.call(FUN, t)) { if (tk[i++] !== '(') throw new Error('Falta ( después de ' + t + '.'); var a = [suma()]; while (tk[i] === ',') { i++; a.push(suma()); } if (tk[i++] !== ')') throw new Error('Falta cerrar un paréntesis.'); return FUN[t].apply(null, a); }
      throw new Error(t ? 'No conozco «' + t + '».' : 'Expresión incompleta.');
    }
    function pot() { var b = prim(); if (tk[i] === '^') { i++; return Math.pow(b, pot()); } return b; }
    function prod() { var v = pot(); while (tk[i] === '*' || tk[i] === '/' || tk[i] === '%') { var o = tk[i++], d = pot(); v = o === '*' ? v * d : o === '/' ? v / d : v % d; } return v; }
    function suma() { var v = prod(); while (tk[i] === '+' || tk[i] === '-') { var o = tk[i++], d = prod(); v = o === '+' ? v + d : v - d; } return v; }
    var r = suma(); if (i < tk.length) throw new Error('Expresión no válida.'); if (!isFinite(r)) throw new Error('El resultado no es un número.');
    return r;
  }

  // ── Herramientas ──
  function fn(name, description, props, req) { return { type: 'function', function: { name: name, description: description, parameters: { type: 'object', properties: props, required: req || Object.keys(props) } } }; }
  var MODS = []; GRUPOS.forEach(function (g) { g[2].forEach(function (m) { if (m[2] && !MODS.some(function (x) { return x.href === m[2]; })) MODS.push({ grupo: g[1], nombre: m[1], href: m[2] }); }); });
  var HERR = [
    fn('ir_a_modulo', 'Abre un módulo o sección de la Suite ReyEngi en la pantalla del usuario.', { nombre: { type: 'string', description: 'Nombre del módulo, tal como aparece en la lista de módulos' } }),
    fn('proyecto_activo', 'Devuelve los datos del proyecto activo y un resumen de lo que contiene (señales, lazos, tarjetas, ductos).', {}),
    fn('listar_instrumentos', 'Lista instrumentos y señales del proyecto activo, con tag, tipo de señal, servicio y lazo. Admite un filtro de texto.', { filtro: { type: 'string', description: 'Texto a buscar en tag, servicio o tipo; vacío para todos' } }, []),
    fn('buscar_entregables', 'Consulta el registro de entregables de la suite (documentos y planos, con su estado y formatos) y busca en el proyecto activo los lazos e instrumentos asociados a un tag o texto.', { texto: { type: 'string', description: 'Tag o palabras, por ejemplo "LT-101" o "hoja de datos"' } }),
    fn('calcular', 'Evalúa una expresión matemática con exactitud. Úsala siempre para operaciones numéricas.', { expresion: { type: 'string', description: 'Por ejemplo "24/250*1000" o "sqrt(3)*380*12"' } }),
    fn('guardar_recuerdo', 'Guarda un dato duradero sobre el usuario o sus preferencias cuando él pide recordarlo.', { texto: { type: 'string' } })
  ];
  var ROT = { ir_a_modulo: 'Abrir módulo', buscar_entregables: 'Buscó entregables', proyecto_activo: 'Consultó el proyecto', listar_instrumentos: 'Consultó instrumentos', calcular: 'Calculó', guardar_recuerdo: 'Guardó en memoria' };
  function datosLazos() { var P = window.REProyectos; try { return window.__LAZOS && window.__LAZOS.E ? window.__LAZOS.E() : (P && P.leer ? P.leer('lazos', null) : null); } catch (e) { return null; } }
  var irA = null;
  function ejecutar(n, a) {
    a = a || {}; var P = window.REProyectos, L;
    if (n === 'ir_a_modulo') {
      var q = norm(a.nombre).split(/[^a-z0-9&]+/).filter(Boolean), mejor = null, pt = 0;
      MODS.forEach(function (m) { var t = norm(m.nombre), p = 0; q.forEach(function (w) { if (w.length > 1 && t.indexOf(w) >= 0) p += w.length; }); if (t === norm(a.nombre)) p += 100; if (p > pt) { pt = p; mejor = m; } });
      if (!mejor) return { error: 'No existe ese módulo.', modulos: MODS.map(function (m) { return m.nombre; }) };
      irA = new URL(mejor.href, BASE).href; return { abriendo: mejor.nombre };
    }
    if (n === 'proyecto_activo') {
      if (!P) return { error: 'Esta página no tiene acceso a los datos del proyecto. Abre un módulo de la suite (por ejemplo, Listado de instrumentos).' };
      var d = P.activo(); L = datosLazos() || {};
      return { nombre: d.nombre, proyecto: d.proyecto, cliente: d.cliente, numero: d.numero, revision: d.rev, senales: (L.senales || []).length, tarjetas: (L.modulos || []).length, ductos: ((L.cond && L.cond.ductos) || []).length };
    }
    if (n === 'listar_instrumentos') {
      L = datosLazos(); if (!L || !L.senales || !L.senales.length) return { instrumentos: [], nota: P ? 'El proyecto activo no tiene señales cargadas.' : 'Esta página no tiene acceso a los datos del proyecto.' };
      var f = norm(a.filtro).split(/\s+/).filter(Boolean);
      var r = L.senales.filter(function (s) { if (!s.tag) return false; var t = norm([s.tag, s.servicio, s.tipo, s.lazo, s.equipo].join(' ')); return f.every(function (w) { return t.indexOf(w) >= 0; }); });
      return { total: r.length, instrumentos: r.slice(0, 60).map(function (s) { var o = { tag: s.tag, tipo: s.tipo || '' }; if (s.servicio) o.servicio = s.servicio; if (s.lazo) o.lazo = s.lazo; if (s.canal) o.canal = s.canal; return o; }), cortado: r.length > 60 };
    }
    if (n === 'buscar_entregables') {
      var RG = window.RE_ENTREGABLES, o = { tipos_de_entregable: [], en_el_proyecto: [] }, w = norm(a.texto).split(/\s+/).filter(Boolean);
      if (RG) { o.tipos_de_entregable = RG.buscar(a.texto).map(function (g) { return { id: g.id, categoria: g.category, subcategoria: g.subcategory, nombre: g.name, estado: g.status, formatos: g.outputFormats }; });
        if (!o.tipos_de_entregable.length) o.subcategorias_sin_generador = RG.subcategorias.filter(function (x) { return x.status !== 'AVAILABLE' && w.some(function (k) { return norm(x.name).indexOf(k) >= 0; }); }).map(function (x) { return x.id + ' ' + x.name + ' (en desarrollo)'; }); }
      var HJ = window.RS_HIJOS; L = datosLazos();
      if (HJ && w.length) HJ('06').forEach(function (l) { if (w.every(function (k) { return norm(l.t + ' ' + l.s).indexOf(k) >= 0; })) o.en_el_proyecto.push({ tipo: 'Diagrama de lazo (P02)', id: l.t, servicio: l.s }); });
      if (L && L.senales && w.length) L.senales.forEach(function (s) { if (s.tag && w.every(function (k) { return norm(s.tag + ' ' + (s.servicio || '')).indexOf(k) >= 0; })) o.en_el_proyecto.push({ tipo: 'Instrumento en listados (D05)', tag: s.tag, servicio: s.servicio || '' }); });
      o.en_el_proyecto = o.en_el_proyecto.slice(0, 40); return o;
    }
    if (n === 'calcular') { try { return { resultado: calcular(a.expresion) }; } catch (e) { return { error: e.message }; } }
    if (n === 'guardar_recuerdo') { var t = String(a.texto || '').trim().slice(0, 300); if (t && S.mem.indexOf(t) < 0) S.mem.push(t); S.mem = S.mem.slice(-40); guardar(); return { guardado: !!t }; }
    return { error: 'Herramienta desconocida.' };
  }
  function sistema() {
    var f = new Date(), P = window.REProyectos, pr = ''; try { var d = P && P.activo(); if (d) pr = d.nombre || d.proyecto || ''; } catch (e) {}
    return ['Eres ' + (S.nombre || 'ReyEngi AI') + ', el asistente de la Suite ReyEngi, una herramienta de ingeniería de instrumentación y control (I&C). Funcionas con un modelo local en el computador del usuario.',
      'Responde en español, breve y técnico. No inventes datos, tags, normas ni contenidos del proyecto: si no lo sabes o la herramienta no lo entregó, dilo.',
      'La suite organiza los entregables en DOCUMENTOS DE INGENIERÍA (D01 a D09) y PLANOS DE INGENIERÍA (P01 a P10). Cuando pidan generar un entregable, usa buscar_entregables para ubicar su categoría y luego ir_a_modulo para abrir el generador; si la subcategoría está en desarrollo, dilo. Puedes abrir módulos de la suite, consultar el proyecto activo y sus instrumentos (solo lectura), calcular y guardar recuerdos. Usa las herramientas cuando la pregunta dependa del proyecto o de un cálculo. No puedes modificar el proyecto: para eso indica al usuario en qué módulo hacerlo.',
      'Los enclavamientos y protecciones pertenecen al PLC o al sistema de seguridad; tú solo analizas y asistes.',
      'Módulos de la suite: ' + MODS.map(function (m) { return m.nombre; }).join('; ') + '.',
      'Página abierta: ' + document.title + '.' + (pr ? ' Proyecto activo: ' + pr + '.' : ''),
      'Fecha: ' + f.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '.',
      S.mem.length ? 'Lo que recuerdas del usuario:\n- ' + S.mem.join('\n- ') : '', S.inst ? 'Instrucciones del usuario:\n' + S.inst : ''].filter(Boolean).join('\n\n');
  }

  // ── Motor (Ollama local, llamado directo desde el navegador) ──
  var MODELOS = [], MOTOR = null, ctrl = null;
  function comprobar() {
    return fetch(S.url + '/api/tags').then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) {
      MODELOS = (j.models || []).map(function (m) { return m.name; }); MOTOR = true;
      if (MODELOS.length && MODELOS.indexOf(S.modelo) < 0) { S.modelo = MODELOS.filter(function (m) { return /qwen3/i.test(m); })[0] || MODELOS[0]; guardar(); }
    }).catch(function () { MOTOR = false; MODELOS = []; });
  }
  function pedir(mensajes, alTexto) {
    var conHerr = true;
    function una() {
      var cuerpo = { model: S.modelo, messages: mensajes, stream: true, options: { temperature: 0.3, num_ctx: 8192 }, think: false }; if (conHerr) cuerpo.tools = HERR; if (una.sinThink) delete cuerpo.think;
      ctrl = new AbortController();
      return fetch(S.url + '/api/chat', { method: 'POST', body: JSON.stringify(cuerpo), signal: ctrl.signal }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
          var e = String(j.error || '');
          if (r.status === 400 && /tool/i.test(e) && conHerr) { conHerr = false; return una(); }
          if (r.status === 400 && /think/i.test(e) && !una.sinThink) { una.sinThink = true; return una(); }
          throw new Error(r.status === 404 ? 'El modelo «' + S.modelo + '» no está instalado en Ollama.' : e || 'El motor de IA respondió ' + r.status + '.');
        });
        var rd = r.body.getReader(), dec = new TextDecoder(), resto = '', texto = '', llam = [];
        function linea(l) { if (!l.trim()) return; var o; try { o = JSON.parse(l); } catch (e) { return; } var m = o.message || {}; if (m.content) { texto += m.content; alTexto(texto); } if (m.tool_calls) llam = llam.concat(m.tool_calls); }
        function leer() { return rd.read().then(function (x) { if (x.done) { linea(resto); return { texto: texto, llamadas: llam }; } resto += dec.decode(x.value, { stream: true }); var ls = resto.split('\n'); resto = ls.pop(); ls.forEach(linea); return leer(); }); }
        return leer().catch(function (e) { if (ctrl.signal.aborted) return { texto: texto, llamadas: [], cancelado: true }; throw e; });
      }, function (e) { if (ctrl.signal.aborted) return { texto: '', llamadas: [], cancelado: true }; throw new Error('No pude conectar con Ollama en este equipo.'); });
    }
    return una();
  }

  // ── Interfaz ──
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('asistente.css', BASE).href; document.head.appendChild(css);
  var btn = el('button', 'ra-btn'); btn.type = 'button'; btn.id = 'raBtn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'raPanel'); btn.innerHTML = '<i aria-hidden="true"></i><span>Asistente</span>';
  var pan = el('aside', 'ra-panel'); pan.id = 'raPanel'; pan.setAttribute('aria-label', 'Asistente de IA local'); pan.hidden = true;
  pan.innerHTML = '<header><i class="ra-nuc" aria-hidden="true"></i><div><b id="raNom"></b><small id="raEst">Comprobando…</small></div>' +
    '<button type="button" id="raNueva" title="Borrar la conversación">Nueva</button><button type="button" id="raAj" aria-expanded="false">Ajustes</button><button type="button" id="raX" aria-label="Cerrar el asistente">✕</button></header>' +
    '<form id="raCfg" hidden><label>Nombre del asistente<input id="raN" maxlength="40"></label><label>Modelo de Ollama<select id="raM"></select></label>' +
    '<label>Instrucciones propias<textarea id="raI" rows="3" maxlength="2000" placeholder="Ejemplo: responde breve y cita la norma cuando aplique."></textarea></label>' +
    '<label>Dirección de Ollama<input id="raU" spellcheck="false"></label><div id="raMem"></div><button type="submit" class="pri">Guardar</button></form>' +
    '<div id="raHilo" class="ra-hilo" aria-live="polite"></div>' +
    '<form id="raF" class="ra-red"><textarea id="raT" rows="1" placeholder="Pregunta o pide algo…" aria-label="Mensaje para el asistente"></textarea><button type="submit" class="pri" id="raEnv">Enviar</button><button type="button" id="raPar" hidden>Detener</button></form>' +
    '<p class="ra-nota">IA local: se procesa en tu equipo. Verifica los datos técnicos.</p>';
  function $(q) { return pan.querySelector(q); }
  var hilo, ocupado = false;
  function bajar() { hilo.scrollTop = hilo.scrollHeight; }
  function paso(n, a, res) {
    var d = el('div', 'ra-paso'), det = a.nombre || a.filtro || a.expresion || a.texto || '', fin = '';
    if (res) { if (res.error) fin = ' — ' + res.error; else if ('resultado' in res) fin = ' = ' + res.resultado; else if (res.en_el_proyecto) fin = ' — ' + res.en_el_proyecto.length + ' en el proyecto, ' + res.tipos_de_entregable.length + ' tipos'; else if ('total' in res) fin = ' — ' + res.total + ' encontrados'; else if (res.abriendo) fin = ' → ' + res.abriendo; }
    d.append(el('b', '', ROT[n] || n), el('span', '', String(det).slice(0, 90) + fin)); return d;
  }
  function ayudaConexion() {
    var d = el('div', 'ra-falta'), origen = location.origin;
    d.innerHTML = MOTOR === false
      ? '<b>No puedo conectar con Ollama en este equipo.</b><ol><li>Instala y abre Ollama, y descarga un modelo: <code>ollama pull qwen3:4b</code></li>' +
        '<li>Autoriza a esta página a usarlo. En Windows, abre PowerShell y ejecuta:<br><code>setx OLLAMA_ORIGINS "' + esc(origen) + '"</code></li>' +
        '<li>Cierra Ollama desde el icono junto al reloj y vuelve a abrirlo.</li><li>Si el navegador pregunta por el acceso a dispositivos de la red local, permite.</li></ol>' +
        '<button type="button" id="raRe">Reintentar</button><p>Usa Chrome o Edge. La conversación nunca sale de tu computador.</p>'
      : '<b>Ollama está abierto, pero no tiene modelos.</b><p>Ejecuta <code>ollama pull qwen3:4b</code> y reintenta.</p><button type="button" id="raRe">Reintentar</button>';
    d.querySelector('#raRe').onclick = function () { estado().then(pintar); }; return d;
  }
  function pintar() {
    hilo.textContent = '';
    if (MOTOR === false || (MOTOR && !MODELOS.length)) { hilo.append(ayudaConexion()); return; }
    if (!S.msgs.length) {
      var b = el('div', 'ra-bien'); b.append(el('p', '', 'Hola. Puedo abrir módulos, consultar los instrumentos del proyecto activo, calcular y responder dudas de I&C.'));
      ['¿Qué instrumentos de nivel tiene el proyecto?', 'Genera un diagrama de lazo', 'Busca los entregables asociados a LT-0101', 'Calcula la caída de tensión en 500 m de cable 1,5 mm² con 20 mA', '¿Qué puedes hacer?'].forEach(function (t) { var x = el('button', '', t); x.type = 'button'; x.onclick = function () { $('#raT').value = t; $('#raT').focus(); }; b.append(x); });
      hilo.append(b); return;
    }
    S.msgs.forEach(function (m) {
      if (m.role === 'user') hilo.append(el('div', 'ra-yo', m.content));
      else if (m.role === 'assistant') { if (m.content) { var d = el('div', 'ra-ia'); d.innerHTML = md(m.content); hilo.append(d); } (m.tool_calls || []).forEach(function (c) { hilo.append(paso(c.function.name, c.function.arguments || {})); }); }
    });
    bajar();
  }
  function estado() {
    $('#raEst').textContent = 'Comprobando…';
    return comprobar().then(function () { $('#raEst').textContent = !MOTOR ? 'Sin conexión con Ollama' : !MODELOS.length ? 'Ollama sin modelos' : 'Local · ' + S.modelo; $('#raEst').className = MOTOR && MODELOS.length ? 'ok' : 'mal'; });
  }
  function ocupar(v) { ocupado = v; pan.classList.toggle('ra-ocupado', v); $('#raEnv').hidden = v; $('#raPar').hidden = !v; }
  function enviar(texto) {
    if (ocupado || !texto.trim()) return;
    if (!MOTOR || !S.modelo) { estado().then(pintar); return; }
    if (!S.msgs.length) hilo.textContent = '';
    S.msgs.push({ role: 'user', content: texto.trim() }); hilo.append(el('div', 'ra-yo', texto.trim())); ocupar(true); irA = null;
    var esp = el('div', 'ra-esp', 'Pensando…'); hilo.append(esp); bajar();
    function vuelta(k) {
      if (k >= 5) return Promise.resolve();
      var caja = null, hist = S.msgs.slice(-20); while (hist.length && hist[0].role === 'tool') hist.shift();
      return pedir([{ role: 'system', content: sistema() }].concat(hist), function (t) { if (!caja) { caja = el('div', 'ra-ia'); hilo.insertBefore(caja, esp); } caja.innerHTML = md(t); bajar(); }).then(function (r) {
        var limpio = r.texto.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
        if (caja) { if (limpio) caja.innerHTML = md(limpio); else caja.remove(); }
        var m = { role: 'assistant', content: limpio }; if (r.llamadas.length) m.tool_calls = r.llamadas; if (limpio || r.llamadas.length) S.msgs.push(m);
        if (r.cancelado || !r.llamadas.length) { if (!r.cancelado && !limpio) throw new Error('El modelo no entregó respuesta. Intenta de nuevo o cambia de modelo.'); return; }
        r.llamadas.forEach(function (c) {
          var a = c.function.arguments || {}; if (typeof a === 'string') { try { a = JSON.parse(a); } catch (e) { a = {}; } }
          var res; try { res = ejecutar(c.function.name, a); } catch (e) { res = { error: String(e.message || e) }; }
          hilo.insertBefore(paso(c.function.name, a, res), esp); S.msgs.push({ role: 'tool', tool_name: c.function.name, content: JSON.stringify(res).slice(0, 7000) });
        });
        bajar(); return vuelta(k + 1);
      });
    }
    vuelta(0).catch(function (e) { hilo.append(el('div', 'ra-ia ra-err', String(e.message || e))); }).then(function () {
      esp.remove(); ocupar(false); guardar(); bajar();
      if (irA) { var u = irA; irA = null; if (u !== location.href) { var mismo = u.split('#')[0] === location.href.split('#')[0]; location.href = u; if (mismo && u.indexOf('#') < 0) location.reload(); } }
      else $('#raT').focus();
    });
  }
  function abrir(v) {
    S.abierto = v; guardar(); pan.hidden = !v; btn.setAttribute('aria-expanded', v); document.body.classList.toggle('ra-abierto', v);
    if (v) { $('#raNom').textContent = S.nombre || 'ReyEngi AI'; estado().then(function () { pintar(); $('#raT').focus(); }); } else btn.focus();
  }
  function pintarCfg() {
    $('#raN').value = S.nombre; $('#raI').value = S.inst; $('#raU').value = S.url;
    var s = $('#raM'); s.textContent = ''; MODELOS.forEach(function (m) { var o = el('option', '', m); o.value = m; s.append(o); }); s.value = S.modelo; s.disabled = !MODELOS.length;
    var mm = $('#raMem'); mm.textContent = ''; if (S.mem.length) { mm.append(el('small', '', 'Recuerdos (' + S.mem.length + ')')); S.mem.forEach(function (t, i) { var r = el('div', 'ra-rec'); r.append(el('span', '', t)); var x = el('button', '', 'Quitar'); x.type = 'button'; x.onclick = function () { S.mem.splice(i, 1); guardar(); pintarCfg(); }; r.append(x); mm.append(r); }); }
  }
  function iniciar() {
    document.body.append(btn, pan); hilo = $('#raHilo');
    btn.addEventListener('click', function () { abrir(pan.hidden); });
    $('#raX').addEventListener('click', function () { abrir(false); });
    $('#raNueva').addEventListener('click', function () { if (ocupado) return; S.msgs = []; guardar(); pintar(); $('#raT').focus(); });
    $('#raAj').addEventListener('click', function () { var c = $('#raCfg'); c.hidden = !c.hidden; $('#raAj').setAttribute('aria-expanded', !c.hidden); if (!c.hidden) pintarCfg(); });
    $('#raCfg').addEventListener('submit', function (e) {
      e.preventDefault(); S.nombre = $('#raN').value.trim() || 'ReyEngi AI'; S.inst = $('#raI').value; S.modelo = $('#raM').value || S.modelo;
      var u = $('#raU').value.trim().replace(/\/+$/, ''); if (/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(u)) S.url = u; // solo este equipo
      guardar(); $('#raCfg').hidden = true; $('#raAj').setAttribute('aria-expanded', 'false'); $('#raNom').textContent = S.nombre; estado().then(pintar);
    });
    $('#raF').addEventListener('submit', function (e) { e.preventDefault(); var t = $('#raT'), v = t.value; if (ocupado || !v.trim()) return; t.value = ''; t.style.height = ''; enviar(v); });
    $('#raT').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#raF').requestSubmit(); } });
    $('#raT').addEventListener('input', function (e) { e.target.style.height = ''; e.target.style.height = Math.min(140, e.target.scrollHeight + 2) + 'px'; });
    $('#raPar').addEventListener('click', function () { if (ctrl) ctrl.abort(); });
    pan.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ocupado) abrir(false); });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'j') { e.preventDefault(); abrir(pan.hidden); } });
    btn.title = 'Asistente ReyEngi AI (Ctrl+J)';
    if (S.abierto) abrir(true);
  }
  window.__RS_ASIS = { calcular: calcular, ejecutar: ejecutar };
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
