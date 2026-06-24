# Documentación Técnica del Proyecto: Los Consentidos

## Esta es la versión que funciona guardando la sesión en el navegador

# Estrategia de Frontend: Base de Datos Local Simulada

Este proyecto ha sido adaptado para funcionar como una aplicación **100% Frontend** (Serverless/Sin Backend). En lugar de depender de una base de datos externa como PostgreSQL (Supabase) o MongoDB, el sistema utiliza el almacenamiento nativo del navegador del usuario para gestionar y persistir los datos.

## 🧠 ¿Cómo funciona la arquitectura?

La aplicación simula un motor de base de datos relacional directamente en el navegador utilizando una combinación estratégica de **`localStorage`**, **Cookies de Sesión** y métodos funcionales de JavaScript.

### 1. El "Truco" de la Sesión (localStorage + Cookie)
El requisito principal del sistema era: *Mantener los datos vivos al cambiar o cerrar pestañas, pero reiniciar el sistema desde cero al cerrar el navegador por completo.*

Para lograr esto, combinamos dos tecnologías:
* **`localStorage`**: Se utiliza para guardar la información porque sobrevive a recargas de página y se comparte automáticamente entre todas las pestañas abiertas (esencial para la funcionalidad del Código QR).
* **Cookie de Sesión (`sesion_restaurante_activa`)**: Actúa como un "interruptor". Las cookies sin fecha de expiración se autodestruyen cuando el usuario cierra todas las ventanas del navegador. 

**Flujo de inicialización:**
Al abrir la página, JavaScript busca esta cookie. Si no la encuentra, asume que es una sesión completamente nueva. Inmediatamente limpia el `localStorage` de cualquier residuo anterior, establece la cookie nuevamente y carga los "datos semilla" (catálogos iniciales de platillos, empleados, mesas, etc.).

### 2. Simulación Relacional (CRUD Local)
En lugar de consultas SQL (como `SELECT`, `INSERT` o `JOIN`), la base de datos se maneja mediante arreglos de objetos en JavaScript:

* **Lectura (`getDB`)**: Obtiene el texto en formato JSON desde `localStorage` y lo convierte en un arreglo de JavaScript. Si la "tabla" está vacía, inyecta los datos semilla por defecto.
* **Escritura (`saveDB`)**: Convierte el arreglo modificado de vuelta a un string JSON y lo guarda en `localStorage`.
* **JOINs Simulados**: Las relaciones entre tablas (por ejemplo, cruzar una `orden` con su `detalle_orden` y los datos del `platillo`) se logran utilizando métodos de orden superior como `.map()`, `.filter()` y `.reduce()`.

## 🛠️ Estructura de Datos Semilla
Para que la aplicación no inicie en blanco, el archivo principal contiene constantes con los catálogos base (tablas dimensionales):
* `seedRoles`
* `seedCategorias`
* `seedPlatillos`
* `seedIngredientes`
* `seedEmpleados`

Cualquier transacción nueva (órdenes, cobros, reseñas, ajustes de inventario) se guardará dinámicamente en el almacenamiento del navegador y se perderá únicamente cuando este se cierre por completo.

## 🔄 Reinicio Manual
Si durante el desarrollo o las pruebas necesitas limpiar la base de datos sin cerrar el navegador, puedes forzar el reinicio ejecutando el siguiente comando en la consola del desarrollador (F12):

```javascript
document.cookie = "sesion_restaurante_activa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; localStorage.clear(); location.reload();
