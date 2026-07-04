import { FirebaseError } from 'firebase/app';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase/config';
import { obtenerSedes, prepararDatosIniciales } from '../datos/almacenamiento';
import { ErroresLogin, RolUsuario, SesionUsuario } from '../tipos/modelos';

interface DatosRegistro {
  usuario: string;
  pass: string;
  nombreCompleto: string;
  sedeId: number;
}

interface ContextoAutenticacionValor {
  sesion: SesionUsuario | null;
  usuarioActual: User | null;
  cargandoAuth: boolean;
  errorAuth: string | null;
  iniciarSesion: (usuario: string, pass: string) => Promise<boolean>;
  registrarCliente: (datos: DatosRegistro) => Promise<{ ok: boolean; errores: ErroresLogin }>;
  cerrarSesion: () => Promise<void>;
  esAdmin: boolean;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionValor | undefined>(undefined);

interface PropsProveedor {
  children: ReactNode;
}

export function ProveedorAutenticacion({ children }: PropsProveedor) {
  const [usuarioActual, setUsuarioActual] = useState<User | null>(null);
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  useEffect(() => {
    prepararDatosIniciales();

    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuarioActual(usuarioFirebase);
      setSesion(usuarioFirebase ? crearSesionDesdeFirebase(usuarioFirebase) : null);
      setCargandoAuth(false);
    });

    return unsubscribe;
  }, []);

  async function iniciarSesion(usuario: string, pass: string): Promise<boolean> {
    setErrorAuth(null);

    try {
      await signInWithEmailAndPassword(auth, usuario, pass);
      return true;
    } catch (error) {
      const mensaje = traducirErrorFirebase(error);
      setErrorAuth(mensaje);
      return false;
    }
  }

  async function registrarCliente(datos: DatosRegistro): Promise<{ ok: boolean; errores: ErroresLogin }> {
    const errores: ErroresLogin = {};
    const sedesActivas = obtenerSedes().filter((sede) => sede.estado === 'Activa');

    if (datos.nombreCompleto.trim().length < 3) errores.nombreCompleto = 'Ingresa nombre completo.';
    if (!datos.usuario.includes('@')) errores.usuario = 'Ingresa un correo electronico valido.';
    if (datos.pass.trim().length < 6) errores.pass = 'La contrasena debe tener al menos 6 caracteres.';
    if (!sedesActivas.some((sede) => sede.id === datos.sedeId)) errores.sedeId = 'Selecciona una sede activa.';

    if (Object.keys(errores).length > 0) {
      return { ok: false, errores };
    }

    try {
      const credencial = await createUserWithEmailAndPassword(auth, datos.usuario.trim(), datos.pass.trim());
      await updateProfile(credencial.user, { displayName: datos.nombreCompleto.trim() });
      setSesion(crearSesionDesdeFirebase(credencial.user, datos.sedeId));
      return { ok: true, errores: {} };
    } catch (error) {
      return { ok: false, errores: { general: traducirErrorFirebase(error) } };
    }
  }

  async function cerrarSesion(): Promise<void> {
    await signOut(auth);
    setSesion(null);
    setUsuarioActual(null);
  }

  const valor = useMemo<ContextoAutenticacionValor>(
    () => ({
      sesion,
      usuarioActual,
      cargandoAuth,
      errorAuth,
      iniciarSesion,
      registrarCliente,
      cerrarSesion,
      esAdmin: sesion?.rol === 'admin',
    }),
    [cargandoAuth, errorAuth, sesion, usuarioActual],
  );

  if (cargandoAuth) {
    return (
      <div className="login-pagina">
        <section className="panel">
          <h1>Cargando sesion...</h1>
        </section>
      </div>
    );
  }

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

export function usarAutenticacion(): ContextoAutenticacionValor {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}

function crearSesionDesdeFirebase(usuario: User, sedeId: number | null = null): SesionUsuario {
  const correo = usuario.email ?? '';
  const rol: RolUsuario = esCorreoAdmin(correo) ? 'admin' : 'cliente';

  return {
    usuario: correo,
    rol,
    sedeId,
    nombreCompleto: usuario.displayName || correo,
  };
}

function esCorreoAdmin(correo: string): boolean {
  const correoAdmin = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL;
  if (correoAdmin) return correo.toLowerCase() === correoAdmin.toLowerCase();
  return correo.toLowerCase().startsWith('admin');
}

function traducirErrorFirebase(error: unknown): string {
  const codigo = error instanceof FirebaseError ? error.code : '';

  if (codigo === 'auth/invalid-credential') return 'Correo o contrasena incorrectos.';
  if (codigo === 'auth/user-not-found') return 'No existe una cuenta con ese correo.';
  if (codigo === 'auth/wrong-password') return 'La contrasena no es correcta.';
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya esta registrado.';
  if (codigo === 'auth/weak-password') return 'La contrasena debe tener al menos 6 caracteres.';
  if (codigo === 'auth/invalid-email') return 'Ingresa un correo electronico valido.';

  return 'No se pudo completar la operacion con Firebase.';
}
