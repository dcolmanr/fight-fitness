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
import { crearUsuario, obtenerPerfilUsuario, obtenerSedes, prepararDatosIniciales } from '../datos/almacenamiento';
import { ErroresLogin, SesionUsuario } from '../tipos/modelos';

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
    let activo = true;

    const unsubscribe = onAuthStateChanged(auth, async (usuarioFirebase) => {
      if (!activo) return;

      setUsuarioActual(usuarioFirebase);

      if (usuarioFirebase) {
        const perfil = await cargarOSemillarPerfil(usuarioFirebase);
        if (activo) setSesion(perfil);
      } else {
        setSesion(null);
      }

      if (activo) setCargandoAuth(false);

      try {
        // Solo tiene efecto real si el usuario logeado es el admin (las reglas de
        // Firestore bloquean la escritura para cualquier otro caso). Si falla por
        // permisos (visitante sin sesion, cliente logeado, etc.) se ignora.
        await prepararDatosIniciales();
      } catch {
        // Sin permisos para sembrar las sedes iniciales; no es un error fatal.
      }
    });

    return () => {
      activo = false;
      unsubscribe();
    };
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
    const sedesActivas = (await obtenerSedes()).filter((sede) => sede.estado === 'Activa');

    if (datos.nombreCompleto.trim().length < 3) errores.nombreCompleto = 'Ingresa nombre completo.';
    if (!datos.usuario.includes('@')) errores.usuario = 'Ingresa un correo electronico valido.';
    if (datos.pass.trim().length < 6) errores.pass = 'La contraseña debe tener al menos 6 caracteres.';
    if (!sedesActivas.some((sede) => sede.id === datos.sedeId)) errores.sedeId = 'Selecciona una sede activa.';

    if (Object.keys(errores).length > 0) {
      return { ok: false, errores };
    }

    const correo = datos.usuario.trim();
    const sedeSeleccionada = sedesActivas.find((sede) => sede.id === datos.sedeId);

    try {
      const credencial = await createUserWithEmailAndPassword(auth, correo, datos.pass.trim());
      await updateProfile(credencial.user, { displayName: datos.nombreCompleto.trim() });

      const perfilNuevo: SesionUsuario = {
        usuario: correo,
        rol: 'cliente',
        sedeId: datos.sedeId,
        sedeNombre: sedeSeleccionada?.nombre ?? null,
        nombreCompleto: datos.nombreCompleto.trim(),
      };

      try {
        await crearUsuario(perfilNuevo);
      } catch {
        // La cuenta de Auth ya se creo pero no se pudo guardar el perfil en
        // Firestore (reglas, sin conexion, etc.). Avisamos para que el
        // administrador pueda revisarlo, en vez de dejar una sesion a medias.
        return {
          ok: false,
          errores: { general: 'Tu cuenta se creo, pero no se pudo guardar tu perfil. Contacta al administrador.' },
        };
      }

      setSesion(perfilNuevo);
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

// Busca el perfil (rol, sedeId, nombre) del usuario logeado en Firestore.
// Si no existe todavia -lo cual solo deberia pasar la primera vez que entra
// el admin, ya que los clientes siempre se crean en el registro- lo siembra
// automaticamente, igual que se hace con las sedes iniciales.
async function cargarOSemillarPerfil(usuarioFirebase: User): Promise<SesionUsuario> {
  const correo = usuarioFirebase.email ?? '';

  try {
    const perfil = await obtenerPerfilUsuario(correo);
    if (perfil) return perfil;
  } catch {
    // No se pudo leer (sin conexion, reglas, etc.); seguimos con el fallback.
  }

  const perfilNuevo: SesionUsuario = {
    usuario: correo,
    rol: esCorreoAdmin(correo) ? 'admin' : 'cliente',
    sedeId: null,
    sedeNombre: null,
    nombreCompleto: usuarioFirebase.displayName || correo,
  };

  try {
    await crearUsuario(perfilNuevo);
  } catch {
    // Sin permiso para crear su propio documento; se mantiene la sesion en
    // memoria con el rol por defecto, aunque no quede persistida.
  }

  return perfilNuevo;
}

function esCorreoAdmin(correo: string): boolean {
  const correoAdmin = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL;
  if (correoAdmin) return correo.toLowerCase() === correoAdmin.toLowerCase();
  return correo.toLowerCase().startsWith('admin');
}

function traducirErrorFirebase(error: unknown): string {
  const codigo = error instanceof FirebaseError ? error.code : '';

  if (codigo === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.';
  if (codigo === 'auth/user-not-found') return 'No existe una cuenta con ese correo.';
  if (codigo === 'auth/wrong-password') return 'La contraseña no es correcta.';
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya esta registrado.';
  if (codigo === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
  if (codigo === 'auth/invalid-email') return 'Ingresa un correo electronico valido.';

  return 'No se pudo completar la operacion con Firebase.';
}