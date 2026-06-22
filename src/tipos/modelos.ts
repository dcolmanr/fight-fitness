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
  usuario: string;
  pass: string;
  rol: RolUsuario;
  sedeId: number | null;
  nombreCompleto: string;
}

export interface SesionUsuario {
  usuario: string;
  rol: RolUsuario;
  sedeId: number | null;
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

export interface ErroresLogin {
  usuario?: string;
  pass?: string;
  sedeId?: string;
  nombreCompleto?: string;
  general?: string;
}
