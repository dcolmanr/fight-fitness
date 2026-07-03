# Fight Fitness - Sistema de Gestion de Gimnasio

Aplicacion web desarrollada con React, TypeScript y Vite para administrar clientes, sedes, membresias, agendas de entrenamiento y solicitudes de traslado de un gimnasio.

## Requisitos

- Node.js 18, 20 o 22+
- npm 9+

> El proyecto usa npm. No hace falta usar pnpm, yarn ni instalar dependencias globales adicionales.

## Instalacion y ejecucion

Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Vite mostrara una URL local parecida a:

```text
http://localhost:5173/
```

Abre esa URL en el navegador.

## Comandos disponibles

```bash
npm run dev
```

Inicia el servidor de desarrollo.

```bash
npm run build
```

Compila el proyecto para produccion y valida TypeScript.

```bash
npm run preview
```

Sirve localmente la version compilada.

## Modulos principales

- Inicio y cierre de sesion.
- Rutas protegidas.
- Gestion de sedes.
- Gestion de membresias.
- Gestion de agendas.
- Solicitudes de traslado.
- Persistencia de datos local.
- Validaciones basicas de formularios.

## Solucion de problemas

Si `npm install` falla con un mensaje sobre Node.js, instala una version LTS actual desde:

https://nodejs.org/

Despues vuelve a ejecutar:

```bash
npm install
npm run dev
```

Si PowerShell bloquea la ejecucion de scripts en Windows, abre PowerShell como administrador y ejecuta:

```powershell
Set-ExecutionPolicy RemoteSigned
```

Confirma con `S` o `Y` y vuelve a intentar los comandos de npm.
