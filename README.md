# Documentación Técnica del Proyecto: Los Consentidos

## Esta es la versión que funciona guardando la sesión en el navegador

## Índice

1. [Introducción](#1-introducción)
2. [Planteamiento del Problema](#2-planteamiento-del-problema)
   - [2.1 Descripción de la Problemática](#21-descripción-de-la-problemática)
   - [2.2 Levantamiento de Requerimientos](#22-levantamiento-de-requerimientos)
3. [Diseño Conceptual](#3-diseño-conceptual)
   - [3.1 Identificación de Entidades](#31-identificación-de-entidades)
   - [3.2 Relaciones y Cardinalidades](#32-relaciones-y-cardinalidades)

---

## 1. Introducción

El presente documento constituye la documentación técnica completa del proyecto final de la materia **Bases de Datos**, desarrollado por el equipo del Grupo **3CV2** de la Escuela Superior de Cómputo (**ESCOM**) del Instituto Politécnico Nacional (**IPN**). El proyecto consiste en el diseño, modelado e implementación de un sistema de gestión integral para el restaurante **"Los Consentidos"**, establecimiento de comida tradicional mexicana ubicado en la colonia Lindavista, Ciudad de México.

El sistema fue desarrollado como una aplicación web desplegada en **GitHub Pages**, utilizando **HTML5**, **CSS3** y **JavaScript vanilla** como tecnologías de frontend. La solución permite digitalizar y automatizar las operaciones críticas del restaurante: toma de órdenes en mesa, control de inventario de ingredientes, gestión de personal, administración de caja y generación de reseñas de clientes mediante códigos QR.

---

## 2. Planteamiento del Problema

### 2.1 Descripción de la Problemática

El restaurante **"Los Consentidos"** operaba con un modelo de gestión completamente manual que presentaba múltiples vulnerabilidades operativas. Los procesos críticos afectados eran los siguientes:

- **Gestión de órdenes en papel:** cada mesero contaba con una libreta personal donde anotaba el número de mesa, los platillos solicitados, sus precios y el total. Este proceso generaba errores frecuentes al no recordar los pedidos correctamente o al realizar cálculos aritméticos equivocados.
- **Cuadre de caja manual:** al final de cada jornada, el cajero debía conciliar el dinero en caja contra la suma de todas las órdenes registradas. La posibilidad de errores humanos en este proceso representaba un riesgo financiero directo para el negocio.
- **Control de inventario deficiente:** el inventario de ingredientes se llevaba en papel y no se actualizaba en tiempo real, lo que causaba que ciertos insumos se agotaran sin previo aviso, resultando en clientes insatisfechos y compras reactivas a proveedores.

### 2.2 Levantamiento de Requerimientos

Se realizó una entrevista simulada entre el analista del equipo y el dueño del restaurante, de la cual se extrajeron los siguientes requerimientos funcionales del sistema:

- Registrar y vincular cada orden con el mesero responsable y la mesa atendida.
- Permitir el registro de múltiples platillos con cantidad en una sola orden.
- Alertar cuando algún ingrediente del inventario esté por debajo de su cantidad mínima.
- Asociar cada ingrediente con su proveedor correspondiente.
- Registrar los ingresos diarios basados en la suma total de las órdenes cobradas.
- Registrar egresos por compras realizadas a proveedores.
- Proporcionar acceso a información del personal del restaurante.
- Identificar los platillos más ordenados para gestionar la demanda de ingredientes.

---

## 3. Diseño Conceptual

### 3.1 Identificación de Entidades

A partir del análisis del problema y el levantamiento de requerimientos, se identificaron las siguientes entidades para el modelo E-R inicial, las cuales se corresponden directamente con las tablas presentes en el diagrama relacional final:

| Entidad | Descripción |
|---|---|
| EMPLEADO | Trabajadores del restaurante. Contiene nombre, apellidos, teléfono, fecha de ingreso, fecha de egreso, rol y turno. |
| PLATILLO | Comidas y bebidas ofrecidas en el menú, con nombre, precio, stock e id de categoría. |
| MESA | Espacio físico ocupado por los clientes; registra número, estado, id de orden activa y hora de ocupación. |
| INGREDIENTES | Insumos del inventario utilizados para preparar los platillos, con unidad de medida y cantidad mínima. |
| PROVEEDORES | Empresas o personas que abastecen al restaurante de ingredientes. |
| ORDEN | Registro del servicio prestado a una mesa, con fecha, empleado responsable, mesa y fuente de la orden. |
| DETALLE_ORDEN | Entidad débil que registra cada platillo y su cantidad dentro de una orden (id_orden + id_platillo). |
| RECETA | Tabla asociativa que vincula platillo con ingredientes, indicando la cantidad usada de cada ingrediente. |
| INVENTARIO | Registro de movimientos de inventario por ingrediente, con fecha y cantidad. |
| INGRESO | Dinero recibido; vinculado a una orden, con monto, fecha, método de pago y número de comensales. |
| EGRESOS | Pagos realizados a proveedores por compra de insumos, referenciando inventario y proveedor. |
| CATEGORIAS | Catálogo de categorías de platillos (relación con PLATILLO). |
| ROLES | Catálogo de roles del personal (relación con EMPLEADO). |
| RESENA | Reseñas de clientes asociadas a un número de mesa, con calificación, comentario y fecha. |

**Tabla 1. Entidades identificadas en el modelo E-R**

### 3.2 Relaciones y Cardinalidades

Las relaciones entre entidades se definieron con cardinalidades mínimas y máximas conforme al modelo EER. Las relaciones se derivan directamente de las claves foráneas visibles en el diagrama relacional:

| Relación | Tipo | Cardinalidad | Descripción |
|---|---:|---|---|
| EMPLEADO – genera – ORDEN | 1:N | (1,N) : (1,1) | Un empleado genera muchas órdenes; cada orden tiene un solo empleado responsable (FK: orden.empleado). |
| ORDEN – registrada en – MESA | N:1 | (N,1) : (0,1) | Muchas órdenes pueden registrarse en una misma mesa; una mesa tiene como máximo una orden activa (FK: orden.mesa / mesa.id_orden_activa). |
| ORDEN – contiene – DETALLE_ORDEN | 1:N | (1,N) : (1,30) | Una orden tiene entre 1 y 30 renglones de detalle (FK: detalle_orden.id_orden). |
| DETALLE_ORDEN – referencia – PLATILLO | N:1 | (N,1) : (1,1) | Cada renglón de detalle referencia un platillo (FK: detalle_orden.id_platillo). |
| PLATILLO – descrito en – RECETA | 1:N | (1,N) : (1,1) | Un platillo puede tener múltiples renglones de receta, uno por ingrediente (FK: receta.id_platillo). |
| RECETA – usa – INGREDIENTES | N:1 | (N,1) : (1,1) | Cada renglón de receta referencia un ingrediente (FK: receta.id_ingrediente). |
| INGREDIENTES – registrado en – INVENTARIO | 1:N | (1,N) : (1,1) | Un ingrediente tiene múltiples registros de movimiento de inventario (FK: inventario.id_ingrediente). |
| INVENTARIO – genera – EGRESOS | 1:N | (0,N) : (1,1) | Un movimiento de inventario puede generar uno o más egresos (FK: egresos.id_inventario). |
| PROVEEDORES – asociado en – EGRESOS | 1:N | (0,N) : (1,1) | Un proveedor puede tener múltiples egresos asociados (FK: egresos.id_proveedor). |
| ORDEN – genera – INGRESO | 1:1 | (1,1) : (1,1) | Cada orden al cobrarse genera exactamente un ingreso (FK: ingreso.id_orden). |
| PLATILLO – clasificado en – CATEGORIAS | N:1 | (N,1) : (1,1) | Muchos platillos pertenecen a una categoría (FK: platillo.id_categorias). |
| EMPLEADO – tiene – ROLES | N:1 | (N,1) : (1,1) | Muchos empleados pueden tener el mismo rol (FK: empleado.rol). |
| MESA – tiene – RESENA | 1:N | (0,N) : (1,1) | Una mesa puede recibir múltiples reseñas de clientes (FK: resena.numero_mesa). |

**Tabla 2. Relaciones y cardinalidades del modelo EER**

