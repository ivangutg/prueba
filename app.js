/* ═══════════════════════════════════════════════════
   app.js — Los Consentidos (Versión 100% Frontend)
   Base de Datos: sessionStorage (Simulación Relacional)
═══════════════════════════════════════════════════ */

// ── Estado global ────────────────────────────────────
let carrito        = {};   
let allPlatillos   = [];
let allCategorias  = [];
let allIngredientes = [];
let currentFilter  = 'all';
let allMesas       = [];
let mesaSeleccionada = null;
let allEmpleados   = [];   
let allRoles       = [];
let allOrdenes     = [];
let notifInterval  = null;
let pagoMetodoActual = 'Efectivo';
let pagoOrdenActual  = null;
let pagoMontoActual  = 0;
let estrellaSeleccionada = 0;

/* ════════════════════════════════════════════════
   MOTOR DE BASE DE DATOS LOCAL
════════════════════════════════════════════════ */
const generateId = () => Math.floor(Math.random() * 1000000) + Date.now();

function getDB(table, seedData = []) {
  const data = sessionStorage.getItem(table);
  if (data) return JSON.parse(data);
  sessionStorage.setItem(table, JSON.stringify(seedData));
  return seedData;
}

function saveDB(table, data) {
  sessionStorage.setItem(table, JSON.stringify(data));
}

// ── Datos Semilla (Catálogos Iniciales) ──
const seedRoles = [
  { id: 1, nombre_rol: 'Administrador' }, { id: 2, nombre_rol: 'Mesero' }, { id: 3, nombre_rol: 'Cajero' }
];
const seedCategorias = [
  { id: 1, nombre: 'Entradas' }, { id: 2, nombre: 'Plato Principal' }, { id: 3, nombre: 'Bebidas' }, { id: 4, nombre: 'Postres' }
];
const seedPlatillos = [
  { id: 1, nombre: 'Enchiladas de Mole Negro', precio: 360, id_categorias: 2 },
  { id: 2, nombre: 'Caldo de Piedra', precio: 280, id_categorias: 1 },
  { id: 3, nombre: 'Agua de Jamaica', precio: 80, id_categorias: 3 }
];
const seedIngredientes = [
  { id: 1, nombre: 'Masa de maíz', unidad: 'KG', minimo: 20 },
  { id: 2, nombre: 'Chile ancho', unidad: 'KG', minimo: 10 }
];
const seedInventario = [
  { id: 1, id_ingrediente: 1, cantidad: 50, fecha: new Date().toISOString() },
  { id: 2, id_ingrediente: 2, cantidad: 20, fecha: new Date().toISOString() }
];
const seedEmpleados = [
  { id: 1, nombre: 'Valentina', paterno: 'Ruiz', materno: 'Torres', telefono: '5511223344', fecha_ingreso: new Date().toISOString().slice(0, 10), fecha_egreso: null, rol: 1, turno: 'Mañana' },
  { id: 2, nombre: 'Diego', paterno: 'Morales', materno: 'Herrera', telefono: '5544332211', fecha_ingreso: new Date().toISOString().slice(0, 10), fecha_egreso: null, rol: 2, turno: 'Tarde' }
];

/* ════════════════════════════════════════════════
   UTILIDADES Y MODALES
════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅  ' : '❌  ') + msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

const fmt = val => '$' + Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const esc = str => str == null ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function openModal(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'modalOrden') renderPlatillosOrden(allPlatillos);
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOutside(e, id) { if (e.target === e.currentTarget) closeModal(id); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ════════════════════════════════════════════════
   CARRITO
════════════════════════════════════════════════ */
function agregarAlCarrito(id, nombre, precio) {
  if (carrito[id]) carrito[id].cantidad++;
  else carrito[id] = { nombre, precio: Number(precio), cantidad: 1 };
  renderCarrito();
}

function cambiarCantidad(id, delta) {
  if (!carrito[id]) return;
  carrito[id].cantidad += delta;
  if (carrito[id].cantidad <= 0) delete carrito[id];
  renderCarrito();
}

function limpiarCarrito() {
  carrito = {};
  renderCarrito();
}

function renderCarrito() {
  const wrap = document.getElementById('carritoItems');
  const totalEl = document.getElementById('carritoTotal');
  const keys = Object.keys(carrito);

  if (!keys.length) {
    wrap.innerHTML = '<p class="carrito-empty">Selecciona platillos del menú →</p>';
    totalEl.textContent = '$0.00';
    return;
  }

  let total = 0;
  wrap.innerHTML = keys.map(id => {
    const item = carrito[id];
    const sub = item.precio * item.cantidad;
    total += sub;
    return `
      <div class="carrito-item">
        <div class="ci-info">
          <span class="ci-nombre">${esc(item.nombre)}</span>
          <span class="ci-precio">${fmt(item.precio)} c/u</span>
        </div>
        <div class="ci-controls">
          <button class="ci-btn" onclick="cambiarCantidad('${id}', -1)">−</button>
          <span class="ci-cant">${item.cantidad}</span>
          <button class="ci-btn" onclick="cambiarCantidad('${id}', 1)">+</button>
        </div>
        <span class="ci-sub">${fmt(sub)}</span>
      </div>`;
  }).join('');
  totalEl.textContent = fmt(total);
}

function filtrarPlatillosOrden(q) {
  renderPlatillosOrden(allPlatillos.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase())));
}

function renderPlatillosOrden(lista) {
  const wrap = document.getElementById('platillosOrdenList');
  if (!lista.length) {
    wrap.innerHTML = '<p class="carrito-empty">No se encontraron platillos.</p>';
    return;
  }
  wrap.innerHTML = lista.map(p => `
    <div class="plat-orden-item" onclick="agregarAlCarrito(${p.id}, '${esc(p.nombre)}', ${p.precio})">
      <div class="poi-info">
        <span class="poi-nombre">${esc(p.nombre)}</span>
        <span class="poi-cat">${esc(p.categoria || 'Sin categoría')}</span>
      </div>
      <div class="poi-right">
        <span class="poi-precio">${fmt(p.precio)}</span>
        <span class="poi-add">+</span>
      </div>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════
   STATS & CATEGORÍAS
════════════════════════════════════════════════ */
function loadStats() {
  const hoy = new Date().toISOString().slice(0, 10);
  const plat = getDB('platillo', seedPlatillos);
  const ord = getDB('orden', []).filter(o => o.fecha.startsWith(hoy));
  const ing = getDB('ingredientes', seedIngredientes);
  
  document.getElementById('statPlatillos').textContent = plat.length;
  document.getElementById('statOrdenes').textContent = ord.length;
  document.getElementById('statIngredientes').textContent = ing.length;
}

function loadCategorias() {
  allCategorias = getDB('categorias', seedCategorias);
  allCategorias.sort((a,b) => a.nombre.localeCompare(b.nombre));

  const sel = document.getElementById('plat-cat');
  sel.innerHTML = allCategorias.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('');

  const wrap = document.getElementById('menuFilters');
  wrap.innerHTML = `<button class="filter-btn active" data-filter="all">Todo 🌟</button>`;
  allCategorias.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = c.nombre;
    btn.textContent = c.nombre;
    wrap.appendChild(btn);
  });

  wrap.addEventListener('click', e => {
    if (!e.target.classList.contains('filter-btn')) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderMenu(allPlatillos);
  });
}

/* ════════════════════════════════════════════════
   MENÚ
════════════════════════════════════════════════ */
function loadMenu() {
  const platillos = getDB('platillo', seedPlatillos);
  const cats = getDB('categorias', seedCategorias);
  const catMap = {};
  cats.forEach(c => { catMap[c.id] = c.nombre; });

  allPlatillos = platillos.map(p => ({
    ...p, categoria: catMap[p.id_categorias] || 'Sin categoría'
  })).sort((a,b) => a.nombre.localeCompare(b.nombre));
  
  renderMenu(allPlatillos);
  renderPlatillosOrden(allPlatillos);
}

const EMOJIS = { 'Tacos': '🌮', 'Quesadilla': '🧀', 'Pozole': '🍲', 'Agua': '🥤', 'Enchilada': '🌯', 'Sopa': '🍜', 'Chile': '🌶️', 'default': '🍽️' };
function getEmoji(nombre) {
  for (const [key, emoji] of Object.entries(EMOJIS)) {
    if (key !== 'default' && nombre.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return EMOJIS.default;
}
function catClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('entrada')) return 'cat-entrada';
  if (c.includes('postre')) return 'cat-postre';
  if (c.includes('bebida')) return 'cat-bebida';
  return 'cat-principal';
}

function renderMenu(platillos) {
  const grid = document.getElementById('menuGrid');
  const list = currentFilter === 'all' ? platillos : platillos.filter(p => p.categoria === currentFilter);

  if (!list.length) {
    grid.innerHTML = '<div class="menu-loading"><p>No hay platillos en esta categoría 🍃</p></div>';
    return;
  }
  
  grid.innerHTML = list.map(p => `
    <div class="menu-card" onclick="agregarDesdeMenu(${p.id}, '${esc(p.nombre)}', ${p.precio})">
      <span class="menu-card-emoji">${getEmoji(p.nombre)}</span>
      <span class="menu-card-cat ${catClass(p.categoria)}">${esc(p.categoria)}</span>
      <h3>${esc(p.nombre)}</h3>
      <p>Delicioso platillo preparado al momento con ingredientes frescos.</p>
      <div class="menu-card-footer">
        <div class="menu-price">${fmt(p.precio)}</div>
        <span class="menu-add-hint">Toca para ordenar</span>
      </div>
    </div>
  `).join('');
}

function agregarDesdeMenu(id, nombre, precio) {
  agregarAlCarrito(id, nombre, precio);
  showToast(`${nombre} agregado a la orden`);
  if (!document.getElementById('modalOrden').classList.contains('open')) openModal('modalOrden');
}

function crearPlatillo() {
  const nombre = document.getElementById('plat-nombre').value.trim();
  const cat_id = document.getElementById('plat-cat').value;
  const precio = parseFloat(document.getElementById('plat-precio').value);

  if (!nombre) return showToast('El nombre es obligatorio', 'error');
  if (isNaN(precio) || precio < 0) return showToast('Ingresa un precio válido', 'error');

  const platillos = getDB('platillo', seedPlatillos);
  platillos.push({
    id: generateId(), nombre, id_categorias: cat_id ? parseInt(cat_id) : null, precio
  });
  
  saveDB('platillo', platillos);
  showToast('¡Platillo agregado al menú! 🎉');
  closeModal('modalPlatillo');
  document.getElementById('plat-nombre').value = '';
  document.getElementById('plat-precio').value = '';
  loadMenu(); loadStats();
}

/* ════════════════════════════════════════════════
   ÓRDENES (Simulación de JOINs)
════════════════════════════════════════════════ */
function loadOrdenes() {
  const grid = document.getElementById('ordenesGrid');
  const hoyStr = new Date().toISOString().slice(0, 10);
  
  let ordenesDB = getDB('orden', []).filter(o => o.fecha.startsWith(hoyStr)).sort((a,b) => b.id - a.id);
  const detallesDB = getDB('detalle_orden', []);
  const platillosDB = getDB('platillo', seedPlatillos);
  const ingresosDB = getDB('ingreso', []).filter(i => i.fecha.startsWith(hoyStr));
  const cobradas = new Set(ingresosDB.map(i => i.id_orden));

  // Simular el JOIN orden -> detalle_orden -> platillo
  const ordenes = ordenesDB.map(o => {
    const detalles = detallesDB.filter(d => d.id_orden === o.id).map(d => ({
      ...d, platillo: platillosDB.find(p => p.id === d.id_platillo)
    }));
    return { ...o, detalle_orden: detalles };
  });

  if (!ordenes.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎉</span><p>Sin órdenes por ahora.</p></div>';
    return;
  }

  const empMap = {};
  allEmpleados.forEach(e => { empMap[e.id] = `${e.nombre} ${e.paterno}`; });

  grid.innerHTML = ordenes.map(o => {
    const total = o.detalle_orden.reduce((s, d) => s + (d.platillo?.precio || 0) * d.cantidad, 0);
    const cobrada = cobradas.has(o.id);
    const empNombre = empMap[o.empleado] || `Emp. #${o.empleado}`;
    
    return `
      <div class="orden-card ${cobrada ? 'servida' : ''}">
        <div class="orden-header">
          <div class="orden-mesa-num">👨‍💼 ${esc(empNombre)}</div>
          <span class="badge ${cobrada ? 'badge-cerrada' : 'badge-activa'}">
            ${cobrada ? '✓ Cobrada' : '● Pendiente'}
          </span>
        </div>
        <div class="orden-total">${fmt(total)}</div>
        <div class="orden-fecha">📅 ${new Date(o.fecha).toLocaleString('es-MX')}</div>
        <div style="font-size:13px;color:var(--gris);margin-top:0.4rem">
          ${o.detalle_orden.map(d => `${d.cantidad}× ${esc(d.platillo?.nombre || '?')}`).join(', ')}
        </div>
        ${!cobrada ? `<button class="action-btn" style="margin-top:0.75rem" onclick="abrirModalPago(${o.id}, ${total})">💳 Registrar cobro</button>` : ''}
      </div>`;
  }).join('');
}

function crearOrden() {
  const empId = document.getElementById('ord-empleado').value.trim();
  const items = Object.entries(carrito);

  if (!empId) return showToast('Selecciona un empleado', 'error');
  if (!items.length) return showToast('Agrega al menos un platillo', 'error');

  const ordenesDB = getDB('orden', []);
  const detallesDB = getDB('detalle_orden', []);
  
  const nuevaOrden = {
    id: generateId(), empleado: parseInt(empId), fecha: new Date().toISOString()
  };
  ordenesDB.push(nuevaOrden);

  let total = 0;
  items.forEach(([id, v]) => {
    detallesDB.push({
      id: generateId(), id_orden: nuevaOrden.id, id_platillo: parseInt(id), cantidad: v.cantidad
    });
    total += v.precio * v.cantidad;
  });

  saveDB('orden', ordenesDB);
  saveDB('detalle_orden', detallesDB);
  
  showToast(`Orden #${nuevaOrden.id} creada — ${fmt(total)} 🛒`);
  closeModal('modalOrden');
  limpiarCarrito();
  document.getElementById('ord-empleado').value = '';
  loadOrdenes(); loadStats(); checkNotificaciones();
}

/* ════════════════════════════════════════════════
   INVENTARIO
════════════════════════════════════════════════ */
function loadInventario() {
  const ings = getDB('ingredientes', seedIngredientes);
  const inv = getDB('inventario', seedInventario);

  const stockMap = {};
  inv.forEach(r => {
    stockMap[r.id_ingrediente] = (stockMap[r.id_ingrediente] || 0) + parseFloat(r.cantidad);
  });

  allIngredientes = ings.map(i => ({
    ...i, existencia: stockMap[i.id] || 0
  })).sort((a,b) => a.nombre.localeCompare(b.nombre));

  renderInventario(allIngredientes);
  renderStockAlerts(allIngredientes);
}

function renderStockAlerts(items) {
  const wrap = document.getElementById('stockAlerts');
  const low = items.filter(i => i.existencia > 0 && i.existencia < parseFloat(i.minimo));
  const empty = items.filter(i => i.existencia <= 0);
  let html = '';
  empty.forEach(i => { html += `<div class="alert-card danger">❌ <strong>${esc(i.nombre)}</strong> — AGOTADO</div>`; });
  low.forEach(i => { html += `<div class="alert-card">⚠️ <strong>${esc(i.nombre)}</strong> — Bajo (${i.existencia} ${i.unidad})</div>`; });
  wrap.innerHTML = html;
}

function renderInventario(items) {
  const tbody = document.getElementById('invBody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">🧺 Sin ingredientes registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(i => {
    const ex = parseFloat(i.existencia), mn = parseFloat(i.minimo);
    let sc, sl;
    if (ex <= 0) { sc = 'empty'; sl = '❌ Agotado'; }
    else if (ex < mn) { sc = 'low'; sl = '⚠️ Bajo'; }
    else { sc = 'ok'; sl = '✅ OK'; }
    
    return `
      <tr>
        <td><strong>${esc(i.nombre)}</strong></td>
        <td>${i.existencia}</td>
        <td>${i.minimo}</td>
        <td>${esc(i.unidad)}</td>
        <td><span class="stock-pill ${sc}">${sl}</span></td>
        <td>
          <button class="action-btn" onclick="agregarStock(${i.id}, ${i.existencia})">+ Stock</button>
          <button class="action-btn del" onclick="eliminarIngrediente(${i.id})">Eliminar</button>
        </td>
      </tr>`;
  }).join('');
}

function filterInventario(q) {
  renderInventario(allIngredientes.filter(i => i.nombre.toLowerCase().includes(q.toLowerCase())));
}

function crearIngrediente() {
  const nombre = document.getElementById('ing-nombre').value.trim();
  const cantidad = Number(document.getElementById('ing-existencia').value);
  const minimo = Number(document.getElementById('ing-minimo').value);
  const unidad = document.getElementById('ing-unidad').value;

  if (!nombre) return showToast('El nombre es obligatorio', 'error');

  const ingredientes = getDB('ingredientes', seedIngredientes);
  const nuevoIng = { id: generateId(), nombre, unidad, minimo };
  ingredientes.push(nuevoIng);
  saveDB('ingredientes', ingredientes);

  if (cantidad > 0) {
    const inventario = getDB('inventario', seedInventario);
    inventario.push({ id: generateId(), id_ingrediente: nuevoIng.id, cantidad, fecha: new Date().toISOString() });
    saveDB('inventario', inventario);
  }

  showToast('¡Ingrediente registrado! 🧺');
  closeModal('modalIngrediente');
  ['ing-nombre', 'ing-existencia', 'ing-minimo'].forEach(id => document.getElementById(id).value = '');
  loadInventario(); loadStats(); checkNotificaciones();
}

function agregarStock(idIngrediente, actual) {
  const entrada = prompt(`Stock actual acumulado: ${actual}\nIngresa la cantidad a AÑADIR:`);
  if (entrada === null || entrada.trim() === '') return;
  const cant = Number(entrada);
  if (cant <= 0) return showToast('La cantidad debe ser mayor a 0', 'error');
  
  const inventario = getDB('inventario', seedInventario);
  inventario.push({ id: generateId(), id_ingrediente: idIngrediente, cantidad: cant, fecha: new Date().toISOString() });
  saveDB('inventario', inventario);
  
  showToast('Stock actualizado ✓');
  loadInventario(); checkNotificaciones();
}

function eliminarIngrediente(id) {
  if (!confirm('¿Eliminar este ingrediente? Se borrarán también sus entradas de inventario.')) return;
  
  const ingredientes = getDB('ingredientes', seedIngredientes).filter(i => i.id !== id);
  const inventario = getDB('inventario', seedInventario).filter(i => i.id_ingrediente !== id);
  
  saveDB('ingredientes', ingredientes);
  saveDB('inventario', inventario);
  
  showToast('Ingrediente eliminado');
  loadInventario(); loadStats(); checkNotificaciones();
}

/* ════════════════════════════════════════════════
   NOTIFICACIONES
════════════════════════════════════════════════ */
function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) checkNotificaciones();
}

function checkNotificaciones() {
  const alertas = [];
  const hoyStr = new Date().toISOString().slice(0, 10);

  const ings = getDB('ingredientes', seedIngredientes);
  const inv = getDB('inventario', seedInventario);
  const stockMap = {};
  inv.forEach(r => { stockMap[r.id_ingrediente] = (stockMap[r.id_ingrediente] || 0) + parseFloat(r.cantidad); });
  
  ings.forEach(i => {
    const ex = stockMap[i.id] || 0;
    const mn = parseFloat(i.minimo);
    if (ex <= 0) alertas.push({ tipo: 'danger', titulo: `❌ ${i.nombre} — AGOTADO`, sub: 'Reabastecer urgente' });
    else if (ex < mn) alertas.push({ tipo: 'warning', titulo: `⚠️ ${i.nombre} — Stock bajo`, sub: `${ex} ${i.unidad} (mín ${mn})` });
  });

  const ordenes = getDB('orden', []).filter(o => o.fecha.startsWith(hoyStr));
  const ingresos = getDB('ingreso', []).filter(i => i.fecha.startsWith(hoyStr));
  const cobradas = new Set(ingresos.map(i => i.id_orden));
  const pendientes = ordenes.filter(o => !cobradas.has(o.id));
  
  if (pendientes.length > 0) {
    alertas.push({ tipo: 'warning', titulo: `💳 ${pendientes.length} orden(es) sin cobrar`, sub: 'Revisa la sección Órdenes' });
  }

  renderNotificaciones(alertas);
  const badge = document.getElementById('notifBadge');
  if (alertas.length > 0) {
    badge.textContent = alertas.length;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function renderNotificaciones(alertas) {
  const body = document.getElementById('notifBody');
  if (!alertas.length) {
    body.innerHTML = '<p class="notif-empty">✅ Sin alertas por ahora</p>';
    return;
  }
  body.innerHTML = alertas.map(a => `<div class="notif-item ${a.tipo}"><strong>${a.titulo}</strong><span>${a.sub}</span></div>`).join('');
}

/* ════════════════════════════════════════════════
   EMPLEADOS
════════════════════════════════════════════════ */
function loadMeseros() {
  const grid = document.getElementById('mesesGrid');
  const empleados = getDB('empleado', seedEmpleados).filter(e => e.fecha_egreso === null).sort((a,b) => a.nombre.localeCompare(b.nombre));
  const roles = getDB('roles', seedRoles);
  const ordenes = getDB('orden', []).filter(o => o.fecha.startsWith(new Date().toISOString().slice(0,10)));

  allEmpleados = empleados;
  const rolMap = {};
  roles.forEach(r => { rolMap[r.id] = r.nombre_rol; });

  const countMap = {};
  ordenes.forEach(o => { countMap[o.empleado] = (countMap[o.empleado] || 0) + 1; });

  const turnos = { 'Mañana': 0, 'Tarde': 0, 'Noche': 0 };
  empleados.forEach(m => { if (m.turno && turnos[m.turno] !== undefined) turnos[m.turno]++; });
  
  document.getElementById('mesesStats').innerHTML = `
    <div class="mesero-stat"><span class="ms-icon">👥</span> <span>${empleados.length} activos</span></div>
    <div class="mesero-stat"><span class="ms-icon">🌅</span> <span>${turnos['Mañana']} Mañana</span></div>
    <div class="mesero-stat"><span class="ms-icon">🌤️</span> <span>${turnos['Tarde']} Tarde</span></div>
    <div class="mesero-stat"><span class="ms-icon">🌙</span> <span>${turnos['Noche']} Noche</span></div>
  `;

  if (!empleados.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">👨‍💼</span><p>No hay personal activo.</p></div>';
    return;
  }

  const turnoClass = { 'Mañana': 'turno-M', 'Tarde': 'turno-T', 'Noche': 'turno-N' };
  grid.innerHTML = empleados.map(m => `
    <div class="mesero-card">
      <button class="mesero-delete" onclick="darBajaEmpleado(${m.id})" title="Dar de baja">🗑️</button>
      <div class="mesero-avatar">👨‍💼</div>
      <div class="mesero-nombre">${esc(m.nombre)} ${esc(m.paterno)}</div>
      <div class="mesero-num">Tel: ${esc(m.telefono)}</div>
      <span class="mesero-turno ${turnoClass[m.turno] || 'turno-M'}">${m.turno || '—'}</span>
      <div style="font-size:12px;color:var(--gris);margin-top:0.3rem">${esc(rolMap[m.rol] || 'Sin rol')}</div>
      <div class="mesero-ordenes">📋 ${countMap[m.id] || 0} órdenes hoy</div>
    </div>
  `).join('');

  poblarSelectorEmpleado(empleados);
}

function poblarSelectorEmpleado(empleados) {
  const sel = document.getElementById('ord-empleado-sel');
  if (sel) sel.innerHTML = '<option value="">— Selecciona empleado —</option>' + empleados.map(e => `<option value="${e.id}">${esc(e.nombre)} ${esc(e.paterno)}</option>`).join('');
}

function crearMesero() {
  const nombre = document.getElementById('mes-nombre').value.trim();
  const paterno = document.getElementById('mes-paterno').value.trim();
  const telefono = document.getElementById('mes-telefono').value.trim();
  const turno = document.getElementById('mes-turno').value;
  const rolId = document.getElementById('mes-rol').value;

  if (!nombre || !paterno) return showToast('Nombre y apellido obligatorios', 'error');
  if (!telefono || telefono.length !== 10) return showToast('Ingresa un teléfono de 10 dígitos', 'error');
  if (!rolId) return showToast('Selecciona un rol', 'error');

  const empleados = getDB('empleado', seedEmpleados);
  empleados.push({
    id: generateId(), nombre, paterno, materno: null, telefono, fecha_ingreso: new Date().toISOString().slice(0, 10), fecha_egreso: null, rol: parseInt(rolId), turno
  });
  
  saveDB('empleado', empleados);
  showToast(`¡Personal ${nombre} registrado! 👨‍💼`);
  closeModal('modalMesero');
  ['mes-nombre', 'mes-paterno', 'mes-telefono'].forEach(id => document.getElementById(id).value = '');
  loadMeseros();
}

function darBajaEmpleado(id) {
  if (!confirm('¿Dar de baja a este empleado? Se registrará la fecha de egreso.')) return;
  const empleados = getDB('empleado', seedEmpleados).map(e => e.id === id ? { ...e, fecha_egreso: new Date().toISOString().slice(0, 10) } : e);
  saveDB('empleado', empleados);
  showToast('Empleado dado de baja');
  loadMeseros();
}

function cargarRolesEnModal() {
  const roles = getDB('roles', seedRoles).sort((a,b) => a.nombre_rol.localeCompare(b.nombre_rol));
  const sel = document.getElementById('mes-rol');
  if (sel) sel.innerHTML = '<option value="">— Selecciona rol —</option>' + roles.map(r => `<option value="${r.id}">${esc(r.nombre_rol)}</option>`).join('');
}

/* ════════════════════════════════════════════════
   MESAS Y PLANO
════════════════════════════════════════════════ */
function loadMesas() {
  const defaultMesas = Array.from({length: 12}, (_, i) => ({ id_mesa: i+1, numero: i+1, estado: false, id_orden_activa: null, hora_ocupada: null }));
  allMesas = getDB('mesa', defaultMesas);
  renderMesas();
}

function renderMesas() {
  const wrap = document.getElementById('mapaMesas');
  const mesasCroquis = allMesas.filter(m => m.numero >= 1 && m.numero <= 10);

  if (!mesasCroquis.length) {
    wrap.innerHTML = '<p style="text-align:center; padding-top: 25%; color: var(--text-light);">No hay mesas. Haz clic en "Inicializar Layout".</p>';
    poblarQRSelector(); return;
  }

  let html = `
    <div class="pared-principal"></div><div class="anexo-superior"></div><div class="anexo-derecho"></div>
    <div class="cuarto-caja">Caja</div><div class="cuarto-cocina">Cocina</div><div class="cuarto-buffet">Buffet</div><div class="zona-gris"></div>
  `;

  html += mesasCroquis.map(m => `
    <div class="mesa-card mesa-pos-${m.numero} ${m.estado ? 'ocupada' : 'libre'}" onclick="clickMesa(${m.id_mesa})">
      <div class="mesa-num">${m.numero}</div>
    </div>
  `).join('');

  wrap.innerHTML = html;
  poblarQRSelector();
}

function clickMesa(idMesa) {
  const mesa = allMesas.find(m => m.id_mesa === idMesa);
  if (!mesa) return;
  mesaSeleccionada = mesa;
  if (mesa.estado) {
    const mins = mesa.hora_ocupada ? Math.floor((Date.now() - new Date(mesa.hora_ocupada)) / 60000) : 0;
    document.getElementById('mesaModalNum').textContent = `Mesa ${mesa.numero}`;
    document.getElementById('mesaModalTiempo').textContent = mesa.hora_ocupada ? `Ocupada hace ${mins} minutos` : 'Ocupada';
    openModal('modalMesa');
  } else {
    if (confirm(`¿Ocupar Mesa ${mesa.numero}?`)) ocuparMesa(idMesa);
  }
}

function ocuparMesa(idMesa) {
  const mesas = getDB('mesa', []).map(m => m.id_mesa === idMesa ? { ...m, estado: true, hora_ocupada: new Date().toISOString() } : m);
  saveDB('mesa', mesas);
  showToast('Mesa marcada como ocupada 🍽️');
  loadMesas();
}

function liberarMesaActual() {
  if (!mesaSeleccionada) return;
  const mesas = getDB('mesa', []).map(m => m.id_mesa === mesaSeleccionada.id_mesa ? { ...m, estado: false, id_orden_activa: null, hora_ocupada: null } : m);
  saveDB('mesa', mesas);
  showToast(`Mesa ${mesaSeleccionada.numero} liberada ✅`);
  closeModal('modalMesa');
  loadMesas();
}

function inicializarMesas() {
  if (!confirm('¿Crear 12 mesas? (Restaurará sus estados a Libre)')) return;
  const datos = Array.from({ length: 12 }, (_, i) => ({ id_mesa: i+1, numero: i + 1, estado: false, id_orden_activa: null, hora_ocupada: null }));
  saveDB('mesa', datos);
  showToast('12 mesas restauradas ✅');
  loadMesas();
}

/* ════════════════════════════════════════════════
   CAJA Y FINANZAS
════════════════════════════════════════════════ */
function loadCaja() {
  const grid = document.getElementById('cajaGrid');
  const hoyStr = new Date().toISOString().slice(0, 10);

  const ordenesDB = getDB('orden', []).filter(o => o.fecha.startsWith(hoyStr)).sort((a,b) => b.id - a.id);
  const detallesDB = getDB('detalle_orden', []);
  const platillosDB = getDB('platillo', seedPlatillos);
  const ingresosDB = getDB('ingreso', []).filter(i => i.fecha.startsWith(hoyStr));
  const cobradas = new Set(ingresosDB.map(i => i.id_orden));

  const pendientes = ordenesDB.filter(o => !cobradas.has(o.id)).map(o => {
    const detalles = detallesDB.filter(d => d.id_orden === o.id).map(d => ({
      ...d, platillo: platillosDB.find(p => p.id === d.id_platillo)
    }));
    return { ...o, detalle_orden: detalles };
  });

  if (!pendientes.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎉</span><p>Sin órdenes pendientes de cobro.</p></div>';
    return;
  }

  const empMap = {};
  allEmpleados.forEach(e => { empMap[e.id] = `${e.nombre} ${e.paterno}`; });

  grid.innerHTML = pendientes.map(o => {
    const total = o.detalle_orden.reduce((s, d) => s + (d.platillo?.precio || 0) * d.cantidad, 0);
    return `
      <div class="caja-card">
        <div class="caja-card-header">
          <div class="caja-orden-num">Orden #${o.id}</div>
          <span class="caja-badge">⏳ Pendiente</span>
        </div>
        <div class="caja-info">👨‍💼 ${esc(empMap[o.empleado] || 'Emp. #' + o.empleado)}</div>
        <div class="caja-info">📅 ${new Date(o.fecha).toLocaleString('es-MX')}</div>
        <div class="caja-total">${fmt(total)}</div>
        <div class="caja-actions">
          <button class="btn-primary" onclick="abrirModalPago(${o.id}, ${total})">💳 Cobrar</button>
          <button class="btn-secondary" onclick="verTicket(${o.id}, ${total})">🧾 Ticket</button>
        </div>
      </div>`;
  }).join('');
}

function abrirModalPago(idOrden, total) {
  pagoOrdenActual = idOrden; pagoMontoActual = total; pagoMetodoActual = 'Efectivo';
  document.getElementById('pagoTotal').textContent = fmt(total);
  document.getElementById('pagoComensales').value = 1;
  actualizarDivision();
  document.querySelectorAll('.pago-metodo-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.pago-metodo-btn[data-metodo="Efectivo"]').classList.add('selected');
  openModal('modalPago');
}

function seleccionarMetodo(metodo) {
  pagoMetodoActual = metodo;
  document.querySelectorAll('.pago-metodo-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.pago-metodo-btn[data-metodo="${metodo}"]`).classList.add('selected');
}

function actualizarDivision() {
  const comensales = parseInt(document.getElementById('pagoComensales').value) || 1;
  document.getElementById('pagoPorPersona').textContent = comensales > 1 ? `${fmt(pagoMontoActual / comensales)} por persona (${comensales})` : '';
}

function procesarPago() {
  if (!pagoOrdenActual) return;
  const comensales = parseInt(document.getElementById('pagoComensales').value) || 1;
  
  const ingresos = getDB('ingreso', []);
  ingresos.push({ id: generateId(), id_orden: pagoOrdenActual, monto: pagoMontoActual, fecha: new Date().toISOString(), metodo: pagoMetodoActual, comensales });
  saveDB('ingreso', ingresos);
  
  showToast(`✅ Cobro registrado — ${pagoMetodoActual} — ${fmt(pagoMontoActual)}`);
  closeModal('modalPago');
  loadCaja(); loadOrdenes(); checkNotificaciones();
}

function verTicket(idOrden, total) {
  const ticket = document.getElementById('ticketContenido');
  const detallesDB = getDB('detalle_orden', []).filter(d => d.id_orden === idOrden);
  const platillosDB = getDB('platillo', seedPlatillos);

  const lineasDetalle = detallesDB.map(d => {
    const p = platillosDB.find(pl => pl.id === d.id_platillo);
    return `<div class="ticket-line"><span>${d.cantidad}× ${esc(p?.nombre || '?')}</span><span>${fmt((p?.precio || 0) * d.cantidad)}</span></div>`;
  }).join('');

  ticket.innerHTML = `
    <div style="text-align:center;margin-bottom:0.5rem"><strong>🌮 LOS CONSENTIDOS</strong><br>Sistema de Meseros · ESCOM IPN<br>${new Date().toLocaleString('es-MX')}</div>
    <hr class="ticket-divider"><div class="ticket-line"><span>Orden:</span><span>#${idOrden}</span></div><hr class="ticket-divider">
    ${lineasDetalle}
    <hr class="ticket-divider"><div class="ticket-line ticket-total"><span>TOTAL</span><span>${fmt(total)}</span></div><hr class="ticket-divider">
    <div style="text-align:center;margin-top:0.5rem">¡Gracias por su visita! 😊</div>
  `;
  openModal('modalTicket');
}

function imprimirTicket() {
  const contenido = document.getElementById('ticketContenido').innerHTML;
  const ventana = window.open('', '_blank', 'width=400,height=500');
  ventana.document.write(`<html><head><title>Ticket</title><style>body{font-family:'Courier New',monospace;font-size:14px;padding:20px}hr{border:none;border-top:1px dashed #999;margin:8px 0}.ticket-line{display:flex;justify-content:space-between}.ticket-total{font-weight:700}</style></head><body>${contenido}</body></html>`);
  ventana.document.close(); ventana.print();
}

/* ════════════════════════════════════════════════
   RESEÑAS Y QR
════════════════════════════════════════════════ */
function poblarQRSelector() {
  const sel = document.getElementById('qrMesaSelect');
  if (!sel) return;
  const nums = allMesas.length ? allMesas.map(m => m.numero) : Array.from({ length: 12 }, (_, i) => i + 1);
  sel.innerHTML = '<option value="">— elige una mesa —</option>' + nums.map(n => `<option value="${n}">Mesa ${n}</option>`).join('');
}

function generarQR(numMesa) {
  const wrap = document.getElementById('qrDisplay');
  if (!numMesa) { wrap.innerHTML = '<p class="qr-placeholder">Selecciona una mesa para ver su QR</p>'; return; }
  const url = `${window.location.href.split('?')[0]}?resena=true&mesa=${numMesa}`;
  wrap.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=E63946&bgcolor=FFFBF0" alt="QR Mesa ${numMesa}" width="200" height="200"/><p style="font-weight:700;margin-top:0.5rem">Mesa ${numMesa}</p><p class="qr-url" style="word-break: break-all; font-size: 10px; color: gray;">${url}</p><button class="btn-secondary" style="margin-top:0.5rem" onclick="window.open('${url}','_blank')">🔗 Abrir enlace</button>`;
}

function loadResenas() {
  const lista = document.getElementById('resenasLista');
  const statsWrap = document.getElementById('resenasStats');
  const data = getDB('resena', []).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--gris);text-align:center;padding:2rem">Sin reseñas aún. ¡Comparte los QRs!</p>';
    statsWrap.innerHTML = ''; return;
  }
  
  const total = data.length;
  const promedio = (data.reduce((s, r) => s + r.calificacion, 0) / total).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map(n => ({ stars: n, count: data.filter(r => r.calificacion === n).length }));
  
  statsWrap.innerHTML = `
    <div class="resena-stat-card"><div class="rsc-num">${promedio}⭐</div><div class="rsc-label">Promedio</div></div>
    <div class="resena-stat-card"><div class="rsc-num">${total}</div><div class="rsc-label">Reseñas</div></div>
    ${dist.map(d => `<div class="resena-stat-card"><div class="rsc-num">${d.count}</div><div class="rsc-label">${'⭐'.repeat(d.stars)}</div></div>`).join('')}
  `;
  lista.innerHTML = data.map(r => `
    <div class="resena-item">
      <div class="resena-stars">${'⭐'.repeat(r.calificacion)}${'☆'.repeat(5 - r.calificacion)}</div>
      <div class="resena-comentario">${esc(r.comentario || '(sin comentario)')}</div>
      <div class="resena-meta">Mesa ${r.numero_mesa} · ${new Date(r.fecha).toLocaleString('es-MX')}</div>
    </div>
  `).join('');
}

function seleccionarEstrella(n) {
  estrellaSeleccionada = n;
  document.querySelectorAll('.star-btn').forEach((b, i) => { b.textContent = i < n ? '⭐' : '☆'; });
}

function enviarResenaPublica() {
  const mesa = new URLSearchParams(window.location.search).get('mesa');
  const comentario = document.getElementById('resenaComentario').value.trim();
  if (!estrellaSeleccionada) return showToast('Selecciona una calificación', 'error');
  
  const resenas = getDB('resena', []);
  resenas.push({ id: generateId(), numero_mesa: parseInt(mesa), calificacion: estrellaSeleccionada, comentario, fecha: new Date().toISOString() });
  saveDB('resena', resenas);

  document.getElementById('resenaPublicaOverlay').innerHTML = `<div class="resena-publica-card"><div style="font-size:4rem">🎉</div><h2>¡Gracias!</h2><p style="color:var(--gris);margin-top:1rem">Tu opinión nos ayuda a mejorar. ¡Vuelve pronto!</p></div>`;
  showToast('¡Reseña enviada! Gracias 🙏');
}

function checkResenaPublica() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('resena') === 'true' && params.get('mesa')) {
    document.getElementById('resenaPublicaOverlay').style.display = 'flex';
    document.getElementById('resenaPublicaMesa').textContent = `Mesa ${params.get('mesa')}`;
  }
}

/* ════════════════════════════════════════════════
   ARRANQUE
════════════════════════════════════════════════ */
function init() {
  loadCategorias();
  loadMeseros();
  loadMenu();
  loadStats();
  loadOrdenes();
  loadMesas();
  poblarQRSelector();
  checkResenaPublica();
  cargarRolesEnModal();

  checkNotificaciones();
  notifInterval = setInterval(checkNotificaciones, 60000);
}

document.addEventListener('DOMContentLoaded', init);