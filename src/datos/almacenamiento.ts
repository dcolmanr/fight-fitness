import { Membresia, PlanMembresia, Sede, SesionUsuario, SolicitudTraslado, Usuario } from '../tipos/modelos';

const CLAVE_SEDES = 'sedes';
const CLAVE_USUARIOS = 'usuarios';
const CLAVE_SESION = 'sesionFightFitness';
const CLAVE_TRASLADOS = 'solicitudesTraslado';
const CLAVE_MEMBRESIAS = 'membresias';

const sedesIniciales: Sede[] = [
  {
    id: 1,
    nombre: 'Sede Copiapo Centro',
    direccion: 'Suri - Pje. Suri 1515',
    comuna: 'Copiapo',
    telefono: '+56 9 9851 3619',
    estado: 'Activa',
  },
  {
    id: 2,
    nombre: 'Sede Artes Marciales',
    direccion: 'Av. Los Deportistas 240',
    comuna: 'Copiapo',
    telefono: '+56 9 4455 1200',
    estado: 'Activa',
  },
  {
    id: 3,
    nombre: 'Sede Preparacion Fisica',
    direccion: 'Los Carrera 890',
    comuna: 'Tierra Amarilla',
    telefono: '+56 9 7722 4400',
    estado: 'Activa',
  },
];

const usuariosIniciales: Usuario[] = [
  {
    usuario: 'ADMIN',
    pass: 'ADMIN123',
    rol: 'admin',
    sedeId: null,
    nombreCompleto: 'Administrador Fight & Fitness',
  },
];

export const planesMembresia: PlanMembresia[] = [
  {
    tipo: 'Basico',
    precioMensual: 25000,
    disciplinasIncluidas: 1,
    clasesSemanales: '2 clases por semana',
    preparacionFisica: false,
  },
  {
    tipo: 'Pro',
    precioMensual: 35000,
    disciplinasIncluidas: 2,
    clasesSemanales: '3 clases por semana',
    preparacionFisica: true,
  },
  {
    tipo: 'Full',
    precioMensual: 45000,
    disciplinasIncluidas: 6,
    clasesSemanales: 'Clases ilimitadas',
    preparacionFisica: true,
  },
];

function leerJson<T>(clave: string, respaldo: T): T {
  const valor = localStorage.getItem(clave);
  if (!valor) return respaldo;

  try {
    return JSON.parse(valor) as T;
  } catch {
    return respaldo;
  }
}

function escribirJson<T>(clave: string, valor: T): void {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function prepararDatosIniciales(): void {
  if (!localStorage.getItem(CLAVE_SEDES)) {
    escribirJson(CLAVE_SEDES, sedesIniciales);
  }

  if (!localStorage.getItem(CLAVE_USUARIOS)) {
    escribirJson(CLAVE_USUARIOS, usuariosIniciales);
  }

  if (!localStorage.getItem(CLAVE_TRASLADOS)) {
    escribirJson(CLAVE_TRASLADOS, []);
  }

  if (!localStorage.getItem(CLAVE_MEMBRESIAS)) {
    escribirJson(CLAVE_MEMBRESIAS, []);
  }
}

export function obtenerSedes(): Sede[] {
  return leerJson<Sede[]>(CLAVE_SEDES, []);
}

export function guardarSedes(sedes: Sede[]): void {
  escribirJson(CLAVE_SEDES, sedes);
}

export function obtenerUsuarios(): Usuario[] {
  return leerJson<Usuario[]>(CLAVE_USUARIOS, []);
}

export function guardarUsuarios(usuarios: Usuario[]): void {
  escribirJson(CLAVE_USUARIOS, usuarios);
}

export function obtenerTraslados(): SolicitudTraslado[] {
  return leerJson<SolicitudTraslado[]>(CLAVE_TRASLADOS, []);
}

export function guardarTraslados(traslados: SolicitudTraslado[]): void {
  escribirJson(CLAVE_TRASLADOS, traslados);
}

export function obtenerMembresias(): Membresia[] {
  return leerJson<Membresia[]>(CLAVE_MEMBRESIAS, []);
}

export function guardarMembresias(membresias: Membresia[]): void {
  escribirJson(CLAVE_MEMBRESIAS, membresias);
}

export function obtenerSesionGuardada(): SesionUsuario | null {
  return leerJson<SesionUsuario | null>(CLAVE_SESION, null);
}

export function guardarSesion(sesion: SesionUsuario): void {
  escribirJson(CLAVE_SESION, sesion);
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_SESION);
}

export function buscarNombreSede(sedeId: number | null): string {
  if (sedeId === null) return 'Sin sede asignada';
  const sede = obtenerSedes().find((item) => item.id === sedeId);
  return sede ? sede.nombre : 'Sede no encontrada';
}

export function buscarNombreUsuario(usuario: string): string {
  const encontrado = obtenerUsuarios().find((item) => item.usuario === usuario);
  return encontrado?.nombreCompleto || usuario;
}
