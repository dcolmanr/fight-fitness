# Fight Fitness - Sistema de Gestion de Gimnasio

Aplicacion web desarrollada con React, TypeScript y Vite para administrar clientes, sedes, membresias, agendas de entrenamiento y solicitudes de traslado de un gimnasio. Usa Firebase Authentication para el login y registro, y Firestore como base de datos.

Hay dos roles:

- **Administrador**: correo definido en `VITE_FIREBASE_ADMIN_EMAIL`. Gestiona sedes, revisa y aprueba/rechaza traslados, y ve las agendas y membresias de todos los clientes.
- **Cliente**: se registra por si mismo desde la pantalla de login (correo, contraseña, nombre y sede). Gestiona su propia membresia, sus agendas de entrenamiento y sus solicitudes de traslado entre sedes.

## Requisitos

- Node.js 18, 20 o 22+
- npm 9+

> El proyecto usa npm. No hace falta usar pnpm, yarn ni instalar dependencias globales adicionales.

## Instalacion y ejecucion

Desde la carpeta del proyecto:
npm install
npm run dev

Vite mostrara una URL local parecida a:
> http://localhost:5173/

Abre esa URL en el navegador.

## Configuracion del archivo .env

El proyecto necesita credenciales de Firebase para poder autenticar usuarios y leer/escribir datos en Firestore. Esas credenciales no se suben a GitHub por seguridad; en su lugar se guardan en un archivo local llamado `.env`, que nunca se comparte por el repositorio.

Pasos para configurarlo:

1. Copia el archivo `.env.example` y renombra la copia a `.env` (en la raiz del proyecto).
2. Entra a la [consola de Firebase](https://console.firebase.google.com/), selecciona el proyecto y ve a **Configuracion del proyecto > Tus apps > SDK de Firebase**.
3. Copia cada valor dentro de `.env`, respetando estas variables:
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_ADMIN_EMAIL=""

4. Guarda el archivo y reinicia el servidor (`npm run dev`) para que Vite cargue las nuevas variables.

Notas importantes:

- El archivo `.env` ya esta incluido en `.gitignore`, por lo que nunca se sube al repositorio. Cada persona que clona el proyecto (incluido el profesor al momento de la demostracion) debe crear su propio `.env` a partir de `.env.example` y pegar los valores reales manualmente.
- Todas las variables empiezan con el prefijo `VITE_` porque asi Vite las expone al codigo del navegador (`import.meta.env.VITE_...`).
- `VITE_FIREBASE_ADMIN_EMAIL` define que correo entra como administrador; cualquier otro correo registrado entra como cliente.
- Si `npm run dev` no puede conectarse a Firebase, lo primero que hay que revisar es que el `.env` exista y tenga los valores correctos.

## Comandos disponibles
npm run dev

Inicia el servidor de desarrollo.
npm run build

Compila el proyecto para produccion y valida TypeScript.
npm run preview

Sirve localmente la version compilada.

## Modulos principales

- **Login y registro** (`/login`): inicio de sesion con Firebase Authentication (email y contraseña) y registro de clientes nuevos, con validaciones basicas (correo, largo de contraseña, nombre, sede activa seleccionada).
- **Rutas protegidas**: todo lo que esta dentro de `RutaProtegida` valida la sesion contra el estado de Firebase Auth (`sesion` del `AuthContext`), no contra localStorage. Sin sesion, redirige a `/login`.
- **Panel** (`/`): resumen de bienvenida segun el rol de la sesion.
- **Sedes** (`/sedes`, `/sedes/:id`): CRUD de sedes conectado a Firestore. Al iniciar la app se siembran automaticamente 3 sedes si la coleccion esta vacia (solo funciona si quien esta logeado es el admin, por las reglas de seguridad).
- **Membresias** (`/membresias`, `/membresias/:id`): cada cliente tiene como maximo una membresia vigente (el documento en Firestore usa el correo como id). El admin puede ver y editar las de todos los clientes.
- **Agendas de entrenamiento** (`/agendas`): CRUD completo contra la coleccion `agendas` de Firestore (lectura, creacion, edicion de estado y eliminacion).
- **Traslados** (`/traslados`): solicitudes de cambio de sede. Los clientes solo consultan sus propias solicitudes (usando `where('usuario', '==', correo)`, porque las reglas de Firestore no filtran resultados); el admin ve y aprueba/rechaza todas.
- Estado de carga (`cargando`) y manejo de errores (`try/catch`) en todas las operaciones asincronas contra Firestore.

## Seguridad en Firestore

Las reglas de seguridad de Firestore estan configuradas para bloquear cualquier lectura o escritura de usuarios no autenticados, esta debera ser similar a: 
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /{document=**} {
allow read, write: if request.auth != null;
}
}
}

Estas reglas se configuran directamente en Firebase Console > Firestore Database > Reglas, no en el codigo del proyecto.

## Solucion de problemas

Si `npm install` falla con un mensaje sobre Node.js, ocupa el node.js en formato de zip que viene en el proyecto

Copia y pega esto en cmd (no PowerShell — Win, escribe cmd, Enter):
cd "ruta\a\tu\proyecto"
rmdir /s /q node_modules
set PATH=ruta\a\node-v24.18.0-win-x64;%PATH%
node -v
npm -v
npm install
npm run dev
Solo edita las dos líneas con ruta\a\... antes de pegar:

cd "ruta\a\tu\proyecto" → la carpeta donde está package.json (arrástrala a la ventana de cmd para que te ponga la ruta sola, en vez de escribirla).
set PATH=ruta\a\node-v24.18.0-win-x64;%PATH% → la carpeta donde quedó npm.cmd después de descomprimir el zip (mismo truco: arrástrala al cmd).

Eso funciona igual en un PC con admin o sin admin, porque no depende de tener Node instalado en el sistema — el set PATH hace que esa ventana use el Node portable, exista o no uno instalado. En un PC que sí tenga Node instalado, este mismo bloque también funciona (el portable simplemente toma prioridad en esa ventana)

Si la app muestra errores de Firebase al iniciar sesion o cargar datos, verifica en Firebase Console que:

- Authentication tenga habilitado el metodo "Correo electronico/Contraseña".
- Firestore Database este creado (no solo el proyecto).
- Las reglas de seguridad esten publicadas.
- El `.env` tenga el `PROJECT_ID` correcto para este proyecto.

### PowerShell bloquea la ejecución de scripts por no permisos de administrador.

Ejecutar:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

Cerrar y volver a abrir PowerShell.

Luego continuar con:

```powershell
npm install
```

o

```powershell
npm run dev
```

### Integrantes

-DIEGO NICOLAS COLMAN REYES
-BASTIÁN ALFONSO GHIANI FERNÁNDEZ