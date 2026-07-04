import { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "../firebase/config";

interface AuthContextType {
  usuarioActual: User | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cargandoAuth: boolean;
  errorAuth: string | null;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [usuarioActual, setUsuarioActual] = useState<User | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuarioActual(usuarioFirebase);
      setCargandoAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (correo: string, contrasena: string) => {
    setErrorAuth(null);
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      setErrorAuth("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      throw error; 
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, login, cerrarSesion, cargandoAuth, errorAuth }}>
      {cargandoAuth ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>
          <h2>Cargando sesión...</h2>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
