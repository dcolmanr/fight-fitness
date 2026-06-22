# Fight & Fitness Center - Evaluacion 3

Intranet basada en el proyecto de las evaluaciones 1 y 2 de Fight & Fitness Center.

## Modulos

- `crud_agendas.html`: CRUD de agendas realizado como primer avance por el compañero. Se mantiene intacto como modulo legado.
- React + TypeScript: modulo 2 de Autenticacion y Gestion de Sedes.

## Modulo 2: Autenticacion y Gestion de Sedes

Funcionalidades implementadas:

- Registro de cliente con seleccion de sede inicial.
- Inicio y cierre de sesion.
- Sesion persistida en `localStorage`.
- Contexto global de autenticacion con `useContext`.
- Rutas protegidas con React Router.
- CRUD de sedes para administrador.
- Busqueda de sedes.
- Ruta dinamica `/sedes/:id` usando `useParams`.
- Solicitud de traslado de sede por parte del cliente.
- Aprobacion o rechazo de traslado por parte del administrador.
- Coordinacion con el modulo de agendas mediante `localStorage` y enlace a `crud_agendas.html`.

## Datos de prueba

Administrador:

- Usuario: `ADMIN`
- Contrasena: `ADMIN123`

## Ejecucion local

```bash
npm install
npm run dev
```

Luego abrir la URL que muestra Vite en la terminal.
