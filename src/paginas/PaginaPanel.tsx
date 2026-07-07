import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  nombreSedeEnLista,
  obtenerMembresias,
  obtenerMembresiaUsuario,
  obtenerSedes,
  obtenerTraslados,
  obtenerTrasladosPropios,
  obtenerUsuarios,
} from '../datos/almacenamiento';
import { Sede, SolicitudTraslado, Usuario } from '../tipos/modelos';

export function PaginaPanel() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [activas, setActivas] = useState(0);
  const [traslados, setTraslados] = useState<SolicitudTraslado[]>([]);
  const pendientes = traslados.filter((solicitud) => solicitud.estado === 'Pendiente').length;

  useEffect(() => {
    let activo = true;

    (async () => {
      if (!sesion) return;

      // Las reglas de Firestore solo dejan al admin listar TODA la coleccion
      // de membresias; un cliente solo puede leer la suya (get por id). Por
      // eso la consulta se arma distinto segun el rol, en vez de traer todo
      // y filtrar despues en el navegador.
      const [todasSedes, todosUsuarios, totalActivas, todosTraslados] = await Promise.all([
        obtenerSedes(),
        obtenerUsuarios(),
        esAdmin
          ? obtenerMembresias().then((lista) => lista.filter((m) => m.estado === 'Activa').length)
          : obtenerMembresiaUsuario(sesion.usuario).then((propia) => (propia?.estado === 'Activa' ? 1 : 0)),
        esAdmin ? obtenerTraslados() : obtenerTrasladosPropios(sesion.usuario),
      ]);
      if (activo) {
        setSedes(todasSedes);
        setUsuarios(todosUsuarios);
        setActivas(totalActivas);
        setTraslados(todosTraslados);
      }
    })();

    return () => {
      activo = false;
    };
  }, [esAdmin, sesion]);

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