# Fight Fitness - Sistema de Gestión de Gimnasio

## Descripción del Proyecto

Fight Fitness es una aplicación web desarrollada con React y TypeScript que permite administrar clientes, sedes, membresías y agendas de entrenamiento dentro de un gimnasio.

El sistema implementa autenticación de usuarios, control de acceso mediante rutas protegidas y operaciones CRUD para la gestión de la información.

### Módulos Principales

#### 1. Gestión de Agendas

Permite administrar los horarios de entrenamiento de los usuarios.

**Usuario**

* Crear una agenda de entrenamiento.
* Solicitar modificaciones de horario.
* Consultar su agenda asignada.

**Administrador**

* Aprobar solicitudes.
* Rechazar solicitudes.
* Modificar agendas directamente.

---

#### 2. Gestión de Sedes y Autenticación

Permite administrar el acceso al sistema y las sucursales disponibles.

**Usuario**

* Registrarse.
* Iniciar sesión.
* Seleccionar una sede.

**Administrador**

* Crear sedes.
* Editar sedes.
* Eliminar sedes.
* Gestionar solicitudes de traslado entre sucursales.

---

#### 3. Gestión de Membresías

Permite controlar el estado de las suscripciones de los clientes.

**Administrador**

* Crear membresías.
* Editar membresías.
* Eliminar membresías.
* Activar o modificar suscripciones.

### Flujo General del Sistema

1. El usuario se registra y selecciona una sede.
2. Se le asigna una membresía activa.
3. Con la membresía habilitada puede gestionar su agenda.
4. El administrador supervisa y administra toda la información.

---

## Tecnologías Utilizadas

* React 18
* TypeScript
* React Router DOM
* Vite
* CSS

---

## Estructura General

src/

├── paginas/

├── componentes/

├── contextos/

├── rutas/

├── datos/

├── interfaces/

└── App.tsx

---


### Paso 1: Abrir el proyecto

Abrir la carpeta del proyecto en Visual Studio Code.

Ubicar el archivo:

package.json

Hacer clic derecho sobre él y seleccionar:

"Open in Integrated Terminal"

---

### Paso 2: Instalar dependencias

Si es la primera vez que se ejecuta el proyecto:

npm install

---

### Paso 3: Iniciar el servidor

Ejecutar:

npm run dev

El sistema mostrará una salida similar a:

VITE vX.X.X

Local: http://localhost:5173/

Abrir el enlace desde el navegador.

---

### Solución de Problemas

Si aparecen errores relacionados con permisos de PowerShell:

Abrir PowerShell como Administrador y ejecutar:

Set-ExecutionPolicy RemoteSigned

Confirmar con "Y" o "Sí".

Luego volver a ejecutar:

npm install

npm run dev

---


## Funcionalidades Implementadas

* Inicio de sesión.
* Cierre de sesión.
* Rutas protegidas.
* Gestión de sedes.
* Gestión de membresías.
* Gestión de agendas.
* Solicitudes de traslado.
* Persistencia de datos local.
* Validaciones básicas de formularios.

---

## Conceptos React Utilizados

### useState

Permite almacenar y actualizar estados dentro de los componentes.

### useEffect

Permite ejecutar lógica al cargar componentes o cuando cambian determinadas dependencias.

### useContext

Permite compartir información global, como la sesión del usuario autenticado.

### React Router

Permite navegar entre páginas sin recargar la aplicación.

### TypeScript

Permite definir interfaces y validar estructuras de datos para reducir errores durante el desarrollo.

---

## Cierre del Servidor

Para detener la aplicación:

Ctrl + C

Si aparece:

¿Desea terminar el trabajo por lotes? (S/N)

Responder:

S

y presionar Enter.
