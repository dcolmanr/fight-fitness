export type RolUsuario = 'admin' | 'cliente';
export type EstadoSede = 'Activa' | 'Inactiva';
export type EstadoSolicitud = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type TipoPlanMembresia = 'Basico' | 'Pro' | 'Full';
export type EstadoMembresia = 'Activa' | 'Pendiente' | 'Suspendida' | 'Vencida';

export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  telefono: string;
  estado: EstadoSede;
}

export interface Usuario {
  usuario: string; // correo; tambien es el id del documento en Firestore
  rol: RolUsuario;
  sedeId: number | null;
  // Copia del nombre de la sede al momento de asignarla. Es solo cosmetico,
  // para que se entienda de un vistazo en la consola de Firestore sin tener
  // que cruzar con la coleccion de sedes. La app NUNCA debe usar este campo
  // para logica ni para mostrarlo en pantalla: siempre usa
  // nombreSedeEnLista(sedes, sedeId), que sale de la sede real y actual.
  // Si el admin renombra una sede, esta copia queda desactualizada en los
  // usuarios ya asignados (no hay sincronizacion automatica retroactiva).
  sedeNombre: string | null;
  nombreCompleto: string;
}

export interface SesionUsuario {
  usuario: string;
  rol: RolUsuario;
  sedeId: number | null;
  sedeNombre: string | null;
  nombreCompleto: string;
}

export interface SolicitudTraslado {
  id: number;
  usuario: string;
  sedeOrigenId: number | null;
  sedeDestinoId: number;
  motivo: string;
  estado: EstadoSolicitud;
  fecha: string;
}

export interface PlanMembresia {
  tipo: TipoPlanMembresia;
  precioMensual: number;
  disciplinasIncluidas: number;
  clasesSemanales: string;
  preparacionFisica: boolean;
}

export interface Membresia {
  id: number;
  usuario: string;
  plan: TipoPlanMembresia;
  precioMensual: number;
  fechaInicio: string;
  fechaTermino: string;
  estado: EstadoMembresia;
  metodoPago: string;
  observacion: string;
}
export type DiaSemana = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';
export type BloqueHorario = 'Mañana' | 'Tarde' | 'Noche';

export interface AgendaEntrenamiento {
  id: string;
  usuario: string;
  dias: DiaSemana[];
  bloque: BloqueHorario;
  observacion: string;
  estado: EstadoSolicitud;
  creadoEn?: unknown;
}

export interface ErroresLogin {
  usuario?: string;
  pass?: string;
  sedeId?: string;
  nombreCompleto?: string;
  general?: string;
}