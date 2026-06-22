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

  // Sim