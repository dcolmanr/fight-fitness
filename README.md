# Fight Fitness - Sistema de Gestion de Gimnasio

Aplicacion web desarrollada con React, TypeScript y Vite para administrar clientes, sedes, membresias, agendas de entrenamiento y solicitudes de traslado de un gimnasio. Usa Firebase Authentication para el login y Firestore como base de datos.

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

- Inicio y cierre de sesion con Firebase Authentication (email y contraseña).
- Rutas protegidas segun el estado de la sesion de Firebase Auth.
- Gestion de sedes.
- Gestion de membresias.
- Agendas de entrenamiento: CRUD completo conectado a Firestore (lectura, creacion, edicion y eliminacion en tiempo real).
- Solicitudes de traslado.
- Estado de carga y manejo de errores en todas las operaciones contra Firestore.
- Validaciones basicas de formularios.

## Seguridad en Firestore

Las reglas de seguridad de Firestore estan configuradas para bloquear cualquier lectura o escritura de usuarios no autenticados:
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

Si `npm install` falla con un mensaje sobre Node.js, instala una version LTS actual desde:

<https://nodejs.org/>

Despues vuelve a ejecutar:
npm install
npm run dev

Si PowerShell bloquea la ejecucion de scripts en Windows, abre PowerShell como administrador y ejecuta:
Set-ExecutionPolicy RemoteSigned

Confirma con `S` o `Y` y vuelve a intentar los comandos de npm.

Si la app muestra errores de Firebase al iniciar sesion o cargar datos, verifica en Firebase Console que:

- Authentication tenga habilitado el metodo "Correo electronico/Contraseña".
- Firestore Database este creado (no solo el proyecto).
- Las reglas de seguridad esten publicadas.
- El `.env` tenga el `PROJECT_ID` correcto para este proyecto.
