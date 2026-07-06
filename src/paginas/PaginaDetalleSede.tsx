import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerSedes, obtenerUsuarios } from '../datos/almacenamiento';
import { Sede, Usuario } from '../tipos/modelos';

export function PaginaDetalleSede() {
  const { id } = useParams<{ id: string }>();
  const sedeId = Number(id);
  const [sede, setSede] = useState<Sede | null | undefined>(undefined);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      const [todasSedes, todosUsuarios] = await Promise.all([obtenerSedes(), obtenerUsuarios()]);
      if (activo) {
        setSede(todasSedes.find((item) => item.id === sedeId) ?? null);
        setUsuarios(todosUsuarios.filter((usuario) => usuario.sedeId === sedeId));
      }
    })();

    return () => {
      activo = false;
    };
  }, [sedeId]);

  if (sede === undefined) {
    return (
      <section className="pagina">
        <div className="panel">
          <h1>Cargando sede...</h1>
        </div>
      </section>
    );
  }

  if (!sede) {
    return (
      <section className="pagina">
        <div className="panel">
          <h1>Sede no encontrada</h1>
          <Link to="/sedes">Volver a sedes</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>{sede.nombre}</h1>
          <p>Detalle cargado con ruta dinamica y useParams.</p>
        </div>
        <Link className="boton-secundario" to="/sedes">Volver</Link>
      </div>

      <div className="grid-dos">
        <article className="panel ficha-detalle">
          <h2>Datos de la sede</h2>
          <p><strong>Direccion:</strong> {sede.direccion}</p>
          <p><strong>Comuna:</strong> {sede.comuna}</p>
          <p><strong>Telefono:</strong> {sede.telefono || 'No registrado'}</p>
          <p><strong>Estado:</strong> {sede.estado}</p>
        </article>

        <article className="panel">
          <h2>Clientes inscritos</h2>
          {usuarios.length === 0 ? (
            <p>No hay clientes inscritos en esta sede.</p>
          ) : (
            <ul className="lista-simple">
              {usuarios.map((usuario) => (
                <li key={usuario.usuario}>
                  <strong>{usuario.nombreCompleto}</strong>
                  <span>{usuario.usuario}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
