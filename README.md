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
   - [3.3 Jerarquía ISA](#33-jerarquía-isa)
   - [3.4 Entidades Débiles](#34-entidades-débiles)
   - [3.5 Diagrama EER](#35-diagrama-eer)
4. [Modelo Relacional](#4-modelo-relacional)
   - [4.1 Estrategia de Transformación](#41-estrategia-de-transformación)
   - [4.2 Tablas Resultantes del Esquema Relacional](#42-tablas-resultantes-del-esquema-relacional)
   - [4.3 Diagrama del Modelo Relacional](#43-diagrama-del-modelo-relacional)
   - [4.4 Diccionario de Datos](#44-diccionario-de-datos)

---

## 1. Introducción

El presente documento constituye la documentación técnica completa del proyecto final de la materia **Bases de Datos**, desarrollado por el equipo del Grupo **3CV2** de la Escuela Superior de Cómputo (**ESCOM**) del Instituto Politécnico Nacional (**IPN**). El proyecto consiste en el diseño, modelado e implementación de un sistema de gestión integral para el restaurante **"Los Consentidos"**, establecimiento de comida tradicional mexicana ubicado en la colonia Lindavista, Ciudad de México.

El sistema fue desarrollado como una aplicación web desplegada en **GitHub Pages**, utilizando **HTML5**, **CSS3** y **JavaScript vanilla** como tecnologías de frontend, y **Supabase** (**PostgreSQL** en la nube) como backend de base de datos. La solución permite digitalizar y automatizar las operaciones críticas del restaurante: toma de órdenes en mesa, control de inventario de ingredientes, gestión de personal, administración de caja y generación de reseñas de clientes mediante códigos QR.

El proyecto es el resultado de cuatro prácticas progresivas que abarcan desde el levantamiento de requerimientos y el modelado conceptual (**Modelo E-R** y **E-R Extendido**), pasando por la transformación al modelo relacional, hasta la implementación física con **DDL** y la asignación de permisos con **DCL**. Cada etapa se encuentra documentada en las secciones correspondientes de este documento.

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

### 3.3 Jerarquía ISA

En el diagrama relacional, la tabla **EMPLEADO** centraliza todos los atributos del personal sin subtipos explícitos. Esto refleja una estrategia de tabla única, donde el campo **rol** (`INT`, FK → `ROLES`) discrimina el tipo de empleado y el campo **turno** (`VARCHAR(50)`) diferencia el horario asignado. En el modelo conceptual EER, esta decisión corresponde a:

- **Supertipo EMPLEADO:** contiene atributos globales: nombre, paterno, materno, teléfono, fecha_ingreso, fecha_egreso, rol y turno.
- **Discriminador de tipo:** el campo rol (FK → tabla ROLES) identifica el perfil del trabajador, como mesero, cocinero, cajero, etc.
- **Especialización disjunta y total:** todo empleado debe tener un rol asignado y pertenece a un único perfil.

La tabla **ROLES** (`id INT`, `nombre_rol VARCHAR`) actúa como catálogo de los tipos de empleado admitidos en el sistema.

### 3.4 Entidades Débiles

- **DETALLE_ORDEN** (dependencia de identificación): su clave primaria es compuesta (`id_orden` + `id_platillo`). No tiene significado sin la orden que la contiene. Si una orden se elimina, todos sus renglones se eliminan en cascada. Esta entidad resuelve el requerimiento de registrar múltiples platillos con cantidad variable en una sola orden.
- **RECETA** (dependencia de identificación): tabla puente entre **PLATILLO** e **INGREDIENTES**. Su identidad depende de ambas claves foráneas (`id_platillo` + `id_ingrediente`). Almacena la `cantidad_usada` de cada ingrediente por platillo, habilitando el cálculo de consumo de inventario al procesar una orden.
- **INGRESO** (dependencia de existencia): posee su propio id, pero su existencia está condicionada a la orden que lo origina (FK: `id_orden`). Si la orden se cancela antes de cobrarse, el ingreso debe eliminarse con ella.

### 3.5 Diagrama EER

<img src="https://cdn.discordapp.com/attachments/1474619815225196635/1512152393473724476/9kX9qQAAAABklEQVQDAMp0R9zMNK9AAAAAElFTkSuQmCC.png?ex=6a230d29&is=6a21bba9&hm=018bb53314c11c6c1b051f8463fda5733bea8224847359051b7f5b36485524b6" alt="Diagrama EER del sistema Los Consentidos" loading="lazy">

---

## 4. Modelo Relacional

### 4.1 Estrategia de Transformación

La transformación del modelo EER al modelo relacional se realizó aplicando las ocho reglas estándar de conversión. Las decisiones de diseño más relevantes fueron:

- **Jerarquía ISA:** se utilizó el campo `rol` en la tabla **EMPLEADO** como discriminador, referenciando a la tabla **ROLES**.
- **Relaciones N:M:** se resolvieron mediante tablas asociativas, como **RECETA**, que conecta **PLATILLO** e **INGREDIENTES**.
- **Relación 1:1 ORDEN–INGRESO:** se propagó `id_orden` como FK en **INGRESO**, garantizando que ninguna orden se cobre dos veces.
- **Entidad débil DETALLE_ORDEN:** se implementó con referencia a **ORDEN** y **PLATILLO**, asegurando que los detalles dependan de una orden existente.
- **Control de inventario:** se modeló mediante **INGREDIENTES**, **INVENTARIO**, **RECETA**, **PROVEEDORES** y **EGRESOS**.

### 4.2 Tablas Resultantes del Esquema Relacional

El modelo relacional final del restaurante **Los Consentidos**, derivado del diagrama relacional entregado, está compuesto por 14 tablas:

| Tabla | Tipo | Descripción |
|---|---|---|
| EMPLEADO | Fuerte / Supertipo | Datos generales de todos los empleados: nombre, apellidos, teléfono, fechas de ingreso/egreso, rol (FK → ROLES) y turno. |
| ROLES | Catálogo | Catálogo de roles del personal (id, nombre_rol). Referenciado por EMPLEADO. |
| PLATILLO | Fuerte | Catálogo de platillos del menú con nombre, precio, stock e id_categorias (FK → CATEGORIAS). |
| CATEGORIAS | Catálogo | Catálogo de categorías de platillos (id, nombre). Referenciado por PLATILLO. |
| MESA | Fuerte | Mesas del restaurante: número, estado, id_orden_activa (FK → ORDEN) y hora_ocupada. |
| ORDEN | Fuerte / Transaccional | Registro de cada servicio prestado: fecha, empleado (FK → EMPLEADO), mesa (FK → MESA) y fuente. |
| DETALLE_ORDEN | Débil (identificación) | Renglones de platillo dentro de una orden (PK compuesta: id_orden + id_platillo, cantidad INT). |
| INGREDIENTES | Fuerte | Insumos del inventario con nombre, unidad y cantidad mínima de alerta. |
| RECETA | Asociativa N:M | Tabla puente entre PLATILLO e INGREDIENTES; almacena cantidad_usada por ingrediente por platillo. |
| INVENTARIO | Transaccional | Movimientos de inventario por ingrediente (id_ingrediente FK, fecha, cantidad). |
| PROVEEDORES | Fuerte | Empresas proveedoras de insumos (nombre, teléfono). |
| EGRESOS | Fuerte / Transaccional | Pagos a proveedores; referencia inventario (id_inventario FK) y proveedor (id_proveedor FK), monto y fecha. |
| INGRESO | Débil (existencia) | Registro financiero del cobro de una orden: id_orden (FK, 1:1), monto, fecha, método de pago, comensales. |
| RESENA | Transaccional | Reseñas de clientes por mesa (numero_mesa INT, calificación INT, comentario TEXT, fecha). |

**Tabla 3. Tablas del esquema relacional**

### 4.3 Diagrama del Modelo Relacional

<img src="https://cdn.discordapp.com/attachments/1474619815225196635/1512142639791870084/1f79e42e-b291-4254-bee1-a4f458ee004b.png?ex=6a230413&is=6a21b293&hm=cf9037f0001085b2a1c4bb0e110dcd0825753213da549179dd75ae7e1f88e0fa" alt="Diagrama del modelo relacional del sistema Los Consentidos" loading="lazy">

### 4.4 Diccionario de Datos

A continuación, se muestra el diccionario de datos de la tabla **EMPLEADO** como ejemplo representativo.

| Tabla | Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|---|
| EMPLEADO | numero_empleado | SERIAL | PK, NOT NULL | Identificador único del empleado. |
| EMPLEADO | nombre | VARCHAR(60) | NOT NULL | Nombre del empleado. |
| EMPLEADO | apellido_paterno | VARCHAR(60) | NOT NULL | Primer apellido. |
| EMPLEADO | apellido_materno | VARCHAR(60) | NOT NULL | Segundo apellido. |
| EMPLEADO | puesto | VARCHAR(40) | NOT NULL | Cargo en el restaurante. |
| EMPLEADO | fecha_ingreso | DATE | NOT NULL | Fecha de contratación. |
| EMPLEADO | fecha_egreso | DATE | CHECK | Fecha de baja. |


