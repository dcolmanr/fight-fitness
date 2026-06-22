import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  borrarSesion,
  guardarSesion,
  guardarUsuarios,
  obtenerSedes,
  obtenerSesionGuardada,
  obtenerUsuarios,
  prepararDatosIniciales,
} from '../datos/almacenamiento';
import { ErroresLogin, SesionUsuario, Usuario } from '../tipos/modelos';

interface DatosRegistro {
  usuario: string;
  pass: string;
  nombreCompleto: string;
  sedeId: number;
}

interface ContextoAutenticacionValor {
  sesion: SesionUsuario | null;
  iniciarSesion: (usuario: string, pass: string) => boolean;
  registrarCliente: (datos: DatosRegistro) => { ok: boolean; errores: ErroresLogin };
  cerrarSesion: () => void;
  esAdmin: boolean;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionValor | undefined>(undefined);

interface PropsProveedor {
  children: ReactNode;
}

export function ProveedorAutenticacion({ children }: PropsProveedor) {
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);

  useEffect(() => {
    prepararDatosIniciales();
    setSesion(obtenerSesionGuardada());
  }, []);

  function iniciarSesion(usuario: string, pass: string): boolean {
    const usuarios = obtenerUsuarios();
    const encontrado = usuarios.find((item) => item.usuario === usuario && item.pass === pass);

    if (!encontrado) return false;

    const nuevaSesion: SesionUsuario = {
      usuario: encontrado.usuario,
      rol: encontrado.rol,
      sedeId: encontrado.sedeId,
      nombreCompleto: encontrado.nombreCompleto || encontrado.usuario,
    };

    guardarSesion(nuevaSesion);
    setSesion(nuevaSesion);
    return true;
  }

  function registrarCliente(datos: DatosRegistro): { ok: boolean; errores: ErroresLogin } {
    const errores: ErroresLogin = {};
    const usuarios = obtenerUsuarios();
    const sedesActivas = obtenerSedes().filter((sede) => sede.estado === 'Activa');

    if (datos.nombreCompleto.trim().length < 3) errores.nombreCompleto = 'Ingresa nombre completo.';
    if (datos.usuario.trim().length < 3) errores.usuario = 'El usuario debe tener al menos 3 caracteres.';
    if (datos.pass.trim().length < 6) errores.pass = 'La contrasena debe tener al menos 6 caracteres.';
    if (!sedesActivas.some((sede) => sede.id === datos.sedeId)) errores.sedeId = 'Selecciona una sede activa.';
    if (usuarios.some((item) => item.usuario.toLowerCase() === datos.usuario.toLowerCase())) {
      errores.usuario = 'Ese usuario ya existe.';
    }

    if (Object.keys(errores).length > 0) {
      return { ok: false, errores };
    }

    const nuevoUsuario: Usuario = {
      usuario: datos.usuario.trim(),
      pass: datos.pass.trim(),
      rol: 'cliente',
      sedeId: datos.sedeId,
      nombreCompleto: datos.nombreCompleto.trim(),
    };

    guardarUsuarios([...usuarios, nuevoUsuario]);
    return { ok: true, errores: {} };
  }

  function cerrarSesion(): void {
    borrarSesion();
    setSesion(null);
  }

  const valor = useMemo<ContextoAutenticacionValor>(
    () => ({
      sesion,
      iniciarSesion,
      registrarCliente,
      cerrarSesion,
      esAdmin: sesion?.rol === 'admin',
    }),
    [sesion],
  );

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

export function usarAutenticacion(): ContextoAutenticacionValor {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}
