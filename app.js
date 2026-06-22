/* ═══════════════════════════════════════════════════
   SABOR & FUEGO — app.js (Versión sessionStorage)
   Frontend: Funciona sin backend usando Web Storage API
═══════════════════════════════════════════════════ */

// Emojis por categoría de platillo
const CAT_EMOJI = {
  entrada:   '🥗',
  principal: '🍽️',
  postre:    '🍮',
  bebida:    '🥤',
  otro:      '🍴',
};

let allIngredientes = [];
let allPlatillos    = [];
let currentFilter   = 'all';

/* ════════════════════════════════════════════════
   UTILIDADES Y STORAGE (BASE DE DATOS SIMULADA)
════════════════════════════════════════════════ */
// Generador de IDs únicos simulando MongoDB
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Funciones CRUD para sessionStorage
function getDB(table, seedData = []) {
  const data = sessionStorage.getItem(table);
  if (data) return JSON.parse(data);
  sessionStorage.setItem(table, JSON.stringify(seedData));
  return seedData;
}

function saveDB(table, data) {
  sessionStorage.setItem(table, JSON.stringify(data));
}

// Datos iniciales por si la sesión está vacía
const seedPlatillos = [
  { _id: generateId(), nombre: 'Caldo de piedra', descripcion: 'Caldo ancestral de camarón cocido con piedras volcánicas calientes.', categoria: 'entrada', precio: 280, frecuencia: 14 },
  { _id: generateId(), nombre: 'Mixiote de borrego', descripcion: 'Borrego marinado en adobo rojo.', categoria: 'principal', precio: 420, frecuencia: 31 },
  { _id: generateId(), nombre: 'Agua de Jamaica', descripcion: 'Agua fresca de flor de jamaica.', categoria: 'bebida', precio: 80, frecuencia: 40 }
];

const seedIngredientes = [
  { _id: generateId(), nombre: 'Chile ancho', existencia: 20, minimo: 10, unidad: 'kg' },
  { _id: generateId(), nombre: 'Masa de maíz', existencia: 50, minimo: 20, unidad: 'kg' },
  { _id: generateId(), nombre: 'Crema de rancho', existencia: 0, minimo: 5, unidad: 'litros' }
];

/* ════════════════════════════════════════════════
   UI HELPERS & NAVBAR
════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = type === 'success' ? '✅  ' + msg : '❌  ' + msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3500);
}

function fmt(val) {
  return '$' + Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════════
   MODALES
════════════════════════════════════════════════ */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOutside(e, id) { if (e.target === e.currentTarget) closeModal(id); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ════════════════════════════════════════════════
   STATS
════════════════════════════════════════════════ */
function loadStats() {
  const platillos = getDB('platillos', seedPlatillos);
  const ordenes = getDB('ordenes', []);
  const ingredientes = getDB('ingredientes', seedIngredientes);
  
  document.getElementById('statPlatillos').textContent    = platillos.length;
  document.getElementById('statOrdenes').textContent      = ordenes.filter(o => o.estado).length;
  document.getElementById('statIngredientes').textContent = ingredientes.length;
}

/* ════════════════════════════════════════════════
   MENÚ DE PLATILLOS
════════════════════════════════════════════════ */
function loadMenu() {
  const platillos = getDB('platillos', seedPlatillos);
  allPlatillos = platillos;
  renderMenu(platillos);
  populatePlatillosSelect(platillos);
}

function renderMenu(platillos) {
  const grid = document.getElementById('menuGrid');
  const list = currentFilter === 'all'
    ? platillos
    : platillos.filter(p => p.categoria === currentFilter);

  if (!list.length) {
    grid.innerHTML = '<div class="menu-loading"><p>No hay platillos en esta categoría 🍃</p></div>';
    return;
  }

  grid.innerHTML = list.map(p => {
    const emoji   = CAT_EMOJI[p.categoria] || '🍴';
    const catClass = `cat-${p.categoria || 'otro'}`;
    return `
      <div class="menu-card">
        <span class="menu-card-emoji">${emoji}</span>
        <span class="menu-card-cat ${catClass}">${p.categoria || 'platillo'}</span>
        <h3>${escHtml(p.nombre)}</h3>
        <p>${escHtml(p.descripcion || 'Preparado con ingredientes frescos de la región.')}</p>
        <div class="menu-card-footer">
          <div class="menu-price">${fmt(p.precio)}</div>
          ${p.frecuencia > 0 ? `<span class="menu-freq-badge">⭐ ${p.frecuencia} pedidos</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function populatePlatillosSelect(platillos) {
  const sel = document.getElementById('ord-platillos');
  sel.innerHTML = platillos.map(p =>
    `<option value="${p._id}">${CAT_EMOJI[p.categoria] || '🍴'} ${escHtml(p.nombre)} — ${fmt(p.precio)}</option>`
  ).join('');
}

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderMenu(allPlatillos);
  });
});

function crearPlatillo() {
  const nombre = document.getElementById('plat-nombre').value.trim();
  const desc   = document.getElementById('plat-desc').value.trim();
  const cat    = document.getElementById('plat-cat').value;
  const precio = parseFloat(document.getElementById('plat-precio').value);

  if (!nombre)      return showToast('El nombre es obligatorio', 'error');
  if (isNaN(precio)) return showToast('Ingresa un precio válido', 'error');

  const platillos = getDB('platillos', seedPlatillos);
  platillos.push({
    _id: generateId(),
    nombre, descripcion: desc, categoria: cat, precio, frecuencia: 0
  });
  
  saveDB('platillos', platillos);
  showToast('¡Platillo agregado al menú! 🎉');
  closeModal('modalPlatillo');
  ['plat-nombre', 'plat-desc', 'plat-precio'].forEach(id => document.getElementById(id).value = '');
  loadMenu();
  loadStats();
}

/* ════════════════════════════════════════════════
   ÓRDENES
════════════════════════════════════════════════ */
function loadOrdenes() {
  const grid = document.getElementById('ordenesGrid');
  const ordenes = getDB('ordenes', []);
  
  if (!ordenes.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎉</span><p>Sin órdenes por ahora — ¡todo tranquilo!</p></div>';
    return;
  }
  
  grid.innerHTML = ordenes.map(o => {
    const activa = o.estado;
    return `
      <div class="orden-card ${activa ? '' : 'cerrada'}">
        <div class="orden-header">
          <div class="orden-mesa-num">Mesa ${o.mesa_numero || '—'}</div>
          <span class="badge ${activa ? 'badge-activa' : 'badge-cerrada'}">${activa ? '● Activa' : '✓ Cerrada'}</span>
        </div>
        <div class="orden-total">${fmt(o.cuenta_total || 0)}</div>
        <div class="orden-fecha">📅 ${new Date(o.fecha).toLocaleString('es-MX')}</div>
        ${activa ? `<button class="action-btn" style="margin-top:0.75rem" onclick="cerrarOrden('${o._id}')">Cerrar orden</button>` : ''}
      </div>
    `;
  }).join('');
}

function crearOrden() {
  const mesa      = document.getElementById('ord-mesa').value.trim();
  const empId     = document.getElementById('ord-empleado').value.trim();
  const selEl     = document.getElementById('ord-platillos');
  const platillosSeleccionados = Array.from(selEl.selectedOptions).map(o => o.value);

  if (!mesa) return showToast('Indica el número de mesa', 'error');
  if (!platillosSeleccionados.length) return showToast('Selecciona al menos un platillo', 'error');

  const platillosDB = getDB('platillos', seedPlatillos);
  let cuenta_total = 0;
  
  // Aumentar la frecuencia de los platillos pedidos y calcular el total
  platillosSeleccionados.forEach(id => {
    const platillo = platillosDB.find(p => p._id === id);
    if (platillo) {
      cuenta_total += platillo.precio;
      platillo.frecuencia += 1;
    }
  });
  saveDB('platillos', platillosDB); // Guardar frecuencias actualizadas

  const ordenes = getDB('ordenes', []);
  ordenes.unshift({ // Agregar al inicio para ver las más recientes primero
    _id: generateId(),
    mesa_numero: Number(mesa),
    empleado_id: empId || null,
    platillos: platillosSeleccionados,
    estado: true, // true = activa
    cuenta_total: cuenta_total,
    fecha: Date.now()
  });
  
  saveDB('ordenes', ordenes);
  showToast('¡Orden creada! 🛒');
  closeModal('modalOrden');
  
  document.getElementById('ord-mesa').value = '';
  document.getElementById('ord-empleado').value = '';
  Array.from(selEl.options).forEach(o => o.selected = false);
  
  loadMenu(); // Actualizar estrellas de frecuencia
  loadOrdenes();
  loadStats();
}

function cerrarOrden(id) {
  let ordenes = getDB('ordenes', []);
  ordenes = ordenes.map(o => o._id === id ? { ...o, estado: false } : o);
  
  saveDB('ordenes', ordenes);
  showToast('Orden cerrada ✓');
  loadOrdenes();
  loadStats();
}

/* ════════════════════════════════════════════════
   INVENTARIO
════════════════════════════════════════════════ */
function loadInventario() {
  const ingredientes = getDB('ingredientes', seedIngredientes);
  allIngredientes = ingredientes;
  renderInventario(ingredientes);
  renderStockAlerts(ingredientes);
}

function renderStockAlerts(items) {
  const wrap = document.getElementById('stockAlerts');
  const low   = items.filter(i => i.existencia > 0 && i.existencia < i.minimo);
  const empty = items.filter(i => i.existencia <= 0);

  let html = '';
  empty.forEach(i => {
    html += `<div class="alert-card danger">❌ <strong>${escHtml(i.nombre)}</strong> — AGOTADO</div>`;
  });
  low.forEach(i => {
    html += `<div class="alert-card">⚠️ <strong>${escHtml(i.nombre)}</strong> — Stock bajo (${i.existencia} ${i.unidad})</div>`;
  });
  wrap.innerHTML = html;
}

function renderInventario(items) {
  const tbody = document.getElementById('invBody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">🧺 Sin ingredientes registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(i => {
    let sc, sl;
    if (i.existencia <= 0)            { sc = 'empty'; sl = '❌ Agotado'; }
    else if (i.existencia < i.minimo) { sc = 'low';   sl = '⚠️ Bajo'; }
    else                              { sc = 'ok';    sl = '✅ OK'; }
    return `
      <tr>
        <td><strong>${escHtml(i.nombre)}</strong></td>
        <td>${i.existencia}</td>
        <td>${i.minimo}</td>
        <td>${escHtml(i.unidad)}</td>
        <td><span class="stock-pill ${sc}">${sl}</span></td>
        <td>
          <button class="action-btn" onclick="editarStock('${i._id}', ${i.existencia})">Editar</button>
          <button class="action-btn del" onclick="eliminarIngrediente('${i._id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterInventario(q) {
  renderInventario(allIngredientes.filter(i =>
    i.nombre.toLowerCase().includes(q.toLowerCase())
  ));
}

function crearIngrediente() {
  const nombre     = document.getElementById('ing-nombre').value.trim();
  const existencia = Number(document.getElementById('ing-existencia').value);
  const minimo     = Number(document.getElementById('ing-minimo').value);
  const unidad     = document.getElementById('ing-unidad').value.trim();

  if (!nombre || !unidad) return showToast('Nombre y unidad son obligatorios', 'error');

  const ingredientes = getDB('ingredientes', seedIngredientes);
  ingredientes.push({
    _id: generateId(),
    nombre, existencia, minimo, unidad
  });
  
  saveDB('ingredientes', ingredientes);
  showToast('¡Ingrediente agregado! 🧺');
  closeModal('modalIngrediente');
  
  ['ing-nombre', 'ing-existencia', 'ing-minimo', 'ing-unidad'].forEach(id => {
    document.getElementById(id).value = '';
  });
  
  loadInventario();
  loadStats();
}

function editarStock(id, actual) {
  const nuevo = prompt(`Existencia actual: ${actual}\nNueva cantidad:`);
  if (nuevo === null || nuevo.trim() === '') return;
  
  let ingredientes = getDB('ingredientes', seedIngredientes);
  ingredientes = ingredientes.map(i => i._id === id ? { ...i, existencia: Number(nuevo) } : i);
  
  saveDB('ingredientes', ingredientes);
  showToast('Stock actualizado ✓');
  loadInventario();
}

function eliminarIngrediente(id) {
  if (!confirm('¿Seguro que quieres eliminar este ingrediente?')) return;
  
  let ingredientes = getDB('ingredientes', seedIngredientes);
  ingredientes = ingredientes.filter(i => i._id !== id);
  
  saveDB('ingredientes', ingredientes);
  showToast('Ingrediente eliminado');
  loadInventario();
  loadStats();
}

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  loadStats();
  // Simulamos click en actualizar órdenes para pintarlas inicialmente
  loadOrdenes();
  loadInventario();
});