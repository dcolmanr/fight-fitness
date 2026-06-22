import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  buscarNombreSede,
  obtenerMembresias,
  obtenerSedes,
  obtenerTraslados,
  obtenerUsuarios,
} from '../datos/almacenamiento';

export function PaginaPanel() {
  const { sesion, esAdmin } = usarAutenticacion();
  const sedes = obtenerSedes();
  const usuarios = obtenerUsuarios();
  const traslados = obtenerTraslados();
  const membresias = obtenerMembresias();
  const pendientes = traslados.filter((solicitud) => solicitud.estado === 'Pendiente').length;
  const activas = membresias.filter((membresia) => membresia.estado === 'Activa').length;

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Panel de modulo 2</h1>
          <p>Autenticacion, sedes y traslado de clientes para Fight & Fitness Center.</p>
        </div>
        <a className="boton-secundario" href="/crud_agendas.html">Ir al CRUD de agendas</a>
      </div>

      <div className="tarjetas-resumen">
        <article>
          <strong>{sedes.length}</strong>
          <span>Sedes registradas</span>
        </article>
        <article>
          <strong>{usuarios.filter((usuario) => usuario.rol === 'cliente').length}</strong>
          <span>Clientes inscritos</span>
        </article>
        <article>
          <strong>{pendientes}</strong>
          <span>Traslados pendientes</span>
        </article>
        <article>
          <strong>{activas}</strong>
          <span>Membresias activas</span>
        </article>
      </div>

      <div className="panel">
        <h2>Sesion actual</h2>
        <p><strong>Usuario:</strong> {sesion?.nombreCompleto}</p>
        <p><strong>Rol:</strong> {esAdmin ? 'Administrador' : 'Cliente'}</p>
        <p><strong>Sede:</strong> {buscarNombreSede(sesion?.sedeId ?? null)}</p>
      </div>

      <div className="grid-dos">
        <Link className="accion-grande" to="/sedes">
          Gestionar sedes
          <span>CRUD completo con busqueda, edicion y eliminacion.</span>
        </Link>
        <Link className="accion-grande" to="/traslados">
          Solicitudes de traslado
          <span>Clientes solicitan cambio y admin lo aprueba o rechaza.</span>
        </Link>
        <Link className="accion-grande" to="/membresias">
          Gestionar membresias
          <span>Activa cuentas, modifica planes y revisa nivel de acceso.</span>
        </Link>
      </div>
    </section>
  );
}
