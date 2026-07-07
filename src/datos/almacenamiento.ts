import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Membresia, PlanMembresia, Sede, SolicitudTraslado, Usuario } from '../tipos/modelos';

const COLECCION_SEDES = 'sedes';
const COLECCION_USUARIOS = 'usuarios';
const COLECCION_MEMBRESIAS = 'membresias';
const COLECCION_TRASLADOS = 'solicitudesTraslado';

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

export async function prepararDatosIniciales(): Promise<void> {
  const snapshotSedes = await getDocs(collection(db, COLECCION_SEDES));
  if (snapshotSedes.empty) {
    await Promise.all(
      sedesIniciales.map((sede) => setDoc(doc(db, COLECCION_SEDES, String(sede.id)), sede)),
    );
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

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const snapshot = await getDocs(collection(db, COLECCION_USUARIOS));
  return snapshot.docs.map((documento) => documento.data() as Usuario);
}

// El id del documento es el correo (igual que sedes usa un id numerico).
// Asi cualquier componente que ya identificaba al usuario por su correo
// (traslados, membresias) puede seguir haciendolo sin cambios.
export async function obtenerPerfilUsuario(correo: string): Promise<Usuario | null> {
  const snapshot = await getDoc(doc(db, COLECCION_USUARIOS, correo));
  return snapshot.exists() ? (snapshot.data() as Usuario) : null;
}

export async function crearUsuario(datos: Usuario): Promise<void> {
  await setDoc(doc(db, COLECCION_USUARIOS, datos.usuario), datos);
}

export async function actualizarUsuario(correo: string, datos: Partial<Omit<Usuario, 'usuario'>>): Promise<void> {
  await updateDoc(doc(db, COLECCION_USUARIOS, correo), datos);
}

// A diferencia de usuarios/membresias, un cliente puede tener VARIAS
// solicitudes de traslado a lo largo del tiempo (historial), asi que el id
// del documento es autogenerado, no el correo.
export async function obtenerTraslados(): Promise<SolicitudTraslado[]> {
  const snapshot = await getDocs(collection(db, COLECCION_TRASLADOS));
  return snapshot.docs.map((documento) => documento.data() as SolicitudTraslado);
}

// Solo trae las solicitudes del propio cliente. Se usa una consulta con
// "where" (en vez de traer toda la coleccion y filtrar en el navegador)
// porque las reglas de Firestore no filtran resultados: si un cliente
// pidiera la coleccion completa sin este "where", Firestore rechazaria toda
// la consulta (no le devuelve "lo que sí puede ver", la bloquea entera).
export async function obtenerTrasladosPropios(correo: string): Promise<SolicitudTraslado[]> {
  const consulta = query(collection(db, COLECCION_TRASLADOS), where('usuario', '==', correo));
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map((documento) => documento.data() as SolicitudTraslado);
}

export async function crearTraslado(datos: Omit<SolicitudTraslado, 'id'>): Promise<SolicitudTraslado> {
  const nuevaSolicitud: SolicitudTraslado = { id: Date.now(), ...datos };
  await setDoc(doc(db, COLECCION_TRASLADOS, String(nuevaSolicitud.id)), nuevaSolicitud);
  return nuevaSolicitud;
}

export async function actualizarTraslado(id: number, datos: Partial<Omit<SolicitudTraslado, 'id'>>): Promise<void> {
  await updateDoc(doc(db, COLECCION_TRASLADOS, String(id)), datos);
}

// El id del documento es el correo del cliente (una membresia "vigente" por
// cliente, igual que su perfil en 'usuarios'). Al cambiar de plan se
// sobreescribe con setDoc; el historial de vigencias anteriores no se guarda.
export async function obtenerMembresias(): Promise<Membresia[]> {
  const snapshot = await getDocs(collection(db, COLECCION_MEMBRESIAS));
  return snapshot.docs.map((documento) => documento.data() as Membresia);
}

export async function obtenerMembresiaUsuario(correo: string): Promise<Membresia | null> {
  const snapshot = await getDoc(doc(db, COLECCION_MEMBRESIAS, correo));
  return snapshot.exists() ? (snapshot.data() as Membresia) : null;
}

export async function guardarMembresia(
  correo: string,
  datos: Omit<Membresia, 'id' | 'usuario'>,
): Promise<Membresia> {
  const existente = await obtenerMembresiaUsuario(correo);
  const membresia: Membresia = { id: existente?.id ?? Date.now(), usuario: correo, ...datos };
  await setDoc(doc(db, COLECCION_MEMBRESIAS, correo), membresia);
  return membresia;
}

export async function actualizarMembresia(
  correo: string,
  datos: Partial<Omit<Membresia, 'id' | 'usuario'>>,
): Promise<void> {
  await updateDoc(doc(db, COLECCION_MEMBRESIAS, correo), datos);
}

export async function eliminarMembresia(correo: string): Promise<void> {
  await deleteDoc(doc(db, COLECCION_MEMBRESIAS, correo));
}

export function nombreSedeEnLista(sedes: Sede[], sedeId: number | null): string {
  if (sedeId === null) return 'Sin sede asignada';
  const sede = sedes.find((item) => item.id === sedeId);
  return sede ? sede.nombre : 'Sede no encontrada';
}

export function nombreUsuarioEnLista(usuarios: Usuario[], correo: string): string {
  const encontrado = usuarios.find((item) => item.usuario === correo);
  return encontrado?.nombreCompleto || correo;
}