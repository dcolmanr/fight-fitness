const version = process.versions.node;
const major = Number(version.split('.')[0]);

const isSupported = major === 18 || major === 20 || major >= 22;

if (!isSupported) {
  console.error('');
  console.error('Fight Fitness necesita Node.js 18, 20 o 22+ para instalar y ejecutar Vite.');
  console.error(`Version detectada: ${version}`);
  console.error('Instala una version LTS actual de Node.js y vuelve a ejecutar: npm install');
  console.error('');
  process.exit(1);
}
