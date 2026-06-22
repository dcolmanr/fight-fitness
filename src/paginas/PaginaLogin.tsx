import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import { obtenerSedes, prepararDatosIniciales } from '../datos/almacenamiento';
import { ErroresLogin, Sede } from '../tipos/modelos';

export function PaginaLogin() {
  const { iniciarSesion, registrarCliente, sesion } = usarAutenticacion();
  const navigate = useNavigate();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [passLogin, setPassLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuarioRegistro, setUsuarioRegistro] = useState('');
  const [passRegistro, setPassRegistro] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [erroresRegistro, setErroresRegistro] = useState<ErroresLogin>({});
  const [mensajeRegistro, setMensajeRegistro] = useState('');

  useEffect(() => {
    prepararDatosIniciales();
    setSedes(obtenerSedes().filter((sede) => sede.estado === 'Activa'));
  }, []);

  useEffect(() => {
    if (sesion) navigate('/');
  }, [navigate, sesion]);

  function enviarLogin(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setErrorLogin('');

    if (!usuarioLogin.trim() || !passLogin.trim()) {
      setErrorLogin('Ingresa usuario y contrasena.');
      return;
    }

    const ok = iniciarSesion(usuarioLogin.trim(), passLogin.trim());
    if (!ok) {
      setErrorLogin('Credenciales incorrectas.');
    }
  }

  function enviarRegistro(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setErroresRegistro({});
    setMensajeRegistro('');

    const resultado = registrarCliente({
      nombreCompleto,
      usuario: usuarioRegistro,
      pass: passRegistro,
      sedeId: Number(sedeId),
    });

    if (!resultado.ok) {
      setErroresRegistro(resultado.errores);
      return;
    }

    setMensajeRegistro('Cuenta creada. Ahora puedes iniciar sesion.');
    setNombreCompleto('');
    setUsuarioRegistro('');
    setPassRegistro('');
    setSedeId('');
  }

  return (
    <main className="login-pagina">
      <section className="login-hero">
        <h1>Fight & Fitness Center</h1>
        <p>Intranet para registro de clientes, seleccion de sede y solicitudes de traslado.</p>
      </section>

      <section className="login-grid">
        <form className="panel formulario" onSubmit={enviarLogin}>
          <h2>Iniciar sesion</h2>
          <p className="texto-ayuda">Admin de prueba: ADMIN / ADMIN123</p>

          <label>
            Usuario
            <input value={usuarioLogin} onChange={(evento) => setUsuarioLogin(evento.target.value)} />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={passLogin}
              onChange={(evento) => setPassLogin(evento.target.value)}
            />
          </label>

          {errorLogin && <p className="mensaje-error">{errorLogin}</p>}
          <button type="submit">Entrar</button>
        </form>

        <form className="panel formulario" onSubmit={enviarRegistro}>
          <h2>Registro de cliente</h2>
          <p className="texto-ayuda">El cliente elige una sede inicial, tal como pide el modulo 2.</p>

          <label>
            Nombre completo
            <input value={nombreCompleto} onChange={(evento) => setNombreCompleto(evento.target.value)} />
            {erroresRegistro.nombreCompleto && <span>{erroresRegistro.nombreCompleto}</span>}
          </label>

          <label>
            Usuario
            <input value={usuarioRegistro} onChange={(evento) => setUsuarioRegistro(evento.target.value)} />
            {erroresRegistro.usuario && <span>{erroresRegistro.usuario}</span>}
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={passRegistro}
              onChange={(evento) => setPassRegistro(evento.target.value)}
            />
            {erroresRegistro.pass && <span>{erroresRegistro.pass}</span>}
          </label>

          <label>
            Sede inicial
            <select value={sedeId} onChange={(evento) => setSedeId(evento.target.value)}>
              <option value="">Selecciona una sede</option>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre} - {sede.comuna}
                </option>
              ))}
            </select>
            {erroresRegistro.sedeId && <span>{erroresRegistro.sedeId}</span>}
          </label>

          {mensajeRegistro && <p className="mensaje-exito">{mensajeRegistro}</p>}
          <button type="submit">Crear cuenta</button>
        </form>
      </section>
    </main>
  );
}
