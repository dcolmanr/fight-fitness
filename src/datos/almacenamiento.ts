import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Membresia, PlanMembresia, Sede, SesionUsuario, SolicitudTraslado, Usuario } from '../tipos/modelos';

const COLECCION_SEDES = 'sedes';
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

export async function prepararDatosIniciales(): Promise<void> {
  const snapshotSedes = await getDocs(collection(db, COLECCION_SEDES));
  if (snapshotSedes.empty) {
    await Promise.all(
      sedesIniciales.map((sede) => setDoc(doc(db, COLECCION_SEDES, String(sede.id)), sede)),
    );
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

export async function obtenerSedes(): Promise<Sede[]> {
  const snapshot = await getDocs(collection(db, COLECCION_SEDES));
  return snapshot.docs.map((documento) => documento.data() as Sede);
}

export async function crearSede(datos: Omit<Sede, 'id'>): Promise<Sede> {
  const nuevaSede: Sede = { id: Date.now(), ...datos };
  await setDoc(doc(db, COLECCION_SEDES, String(nuevaSede.id)), nuevaSede);
  return nuevaSede;
}

export async function actualizarSede(id: number, datos: Partial<Omit<Sede, 'id'>>): Promise<void> {
  await updateDoc(doc(db, COLECCION_SEDES, String(id)), datos);
}

export async function eliminarSede(id: number): Promise<void> {
  await deleteDoc(doc(db, COLECCION_SEDES, String(id)));
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

export function nombreSedeEnLista(sedes: Sede[], sedeId: number | null): string {
  if (sedeId === null) return 'Sin sede asignada';
  const sede = sedes.find((item) => item.id === sedeId);
  return sede ? sede.nombre : 'Sede no encontrada';
}

export function buscarNombreUsuario(usuario: string): string {
  const encontrado = obtenerUsuarios().find((item) => item.usuario === usuario);
  return encontrado?.nombreCompleto || usuario;
}