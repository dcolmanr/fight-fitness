import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  nombreSedeEnLista,
  obtenerMembresias,
  obtenerSedes,
  obtenerTraslados,
  obtenerUsuarios,
} from '../datos/almacenamiento';
import { Sede, Usuario } from '../tipos/modelos';

export function PaginaPanel() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const traslados = obtenerTraslados();
  const membresias = obtenerMembresias();
  const pendientes = traslados.filter((solicitud) => solicitud.estado === 'Pendiente').length;
  const activas = membresias.filter((membresia) => membresia.estado === 'Activa').length;

  useEffect(() => {
    let activo = true;

    (async () => {
      const [todasSedes, todosUsuarios] = await Promise.all([obtenerSedes(), obtenerUsuarios()]);
      if (activo) {
        setSedes(todasSedes);
        setUsuarios(todosUsuarios);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Autenticacion, sedes y traslado de clientes para Fight & Fitness Center.</h1>
        </div>
        <Link className="boton-secundario" to="/agendas">Ir a agendas</Link>
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
        <p><strong>Sede:</strong> {nombreSedeEnLista(sedes, sesion?.sedeId ?? null)}</p>
      </div>

      <div className="grid-dos">
        <Link className="accion-grande" to="/sedes">
          Gestionar sedes
          <span>Vea las sucursales, busque sedes específicas y actualice su información.</span>
        </Link>
        <Link className="accion-grande" to="/traslados">
          Solicitudes de traslado
          <span>Solicite su cambio de sucursal y revise el estado de su aprobación.</span>
        </Link>
        <Link className="accion-grande" to="/membresias">
          Gestionar membresias
          <span>Consulte su cuenta activa, cambie su plan actual y revise sus accesos.</span>
        </Link>
        <Link className="accion-grande" to="/agendas">
          Agendas de entrenamiento
          <span>Visualice y administre sus horarios de entrenamiento en tiempo real.</span>
        </Link>
      </div>
    </section>
  );
}