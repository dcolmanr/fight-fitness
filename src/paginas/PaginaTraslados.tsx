import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  buscarNombreSede,
  guardarTraslados,
  guardarUsuarios,
  obtenerSedes,
  obtenerTraslados,
  obtenerUsuarios,
} from '../datos/almacenamiento';
import { EstadoSolicitud, Sede, SolicitudTraslado } from '../tipos/modelos';

export function PaginaTraslados() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [traslados, setTraslados] = useState<SolicitudTraslado[]>([]);
  const [sedeDestinoId, setSedeDestinoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSedes(obtenerSedes());
    setTraslados(obtenerTraslados());
  }, []);

  const sedesDestino = useMemo(
    () => sedes.filter((sede) => sede.estado === 'Activa' && sede.id !== sesion?.sedeId),
    [sedes, sesion?.sedeId],
  );

  const trasladosVisibles = esAdmin
    ? traslados
    : traslados.filter((solicitud) => solicitud.usuario === sesion?.usuario);

  function refrescarTraslados(nuevosTraslados: SolicitudTraslado[]): void {
    guardarTraslados(nuevosTraslados);
    setTraslados(nuevosTraslados);
  }

  function enviarSolicitud(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setError('');

    if (!sesion) return;

    if (!sedeDestinoId || motivo.trim().length < 8) {
      setError('Selecciona una sede y escribe un motivo de al menos 8 caracteres.');
      return;
    }

    const yaTienePendiente = traslados.some(
      (solicitud) => solicitud.usuario === sesion.usuario && solicitud.estado === 'Pendiente',
    );

    if (yaTienePendiente) {
      setError('Ya tienes una solicitud pendiente.');
      return;
    }

    const nuevaSolicitud: SolicitudTraslado = {
      id: Date.now(),
      usuario: sesion.usuario,
      sedeOrigenId: sesion.sedeId,
      sedeDestinoId: Number(sedeDestinoId),
      motivo: motivo.trim(),
      estado: 'Pendiente',
      fecha: new Date().toISOString(),
    };

    refrescarTraslados([...traslados, nuevaSolicitud]);
    setSedeDestinoId('');
    setMotivo('');
  }

  function resolverSolicitud(id: number, estado: EstadoSolicitud): void {
    const solicitud = traslados.find((item) => item.id === id);
    if (!solicitud || estado === 'Pendiente') return;

    const nuevasSolicitudes = traslados.map((item) =>
      item.id === id ? { ...item, estado } : item,
    );

    if (estado === 'Aprobado') {
      const usuarios = obtenerUsuarios();
      const actualizados = usuarios.map((usuario) =>
        usuario.usuario === solicitud.usuario ? { ...usuario, sedeId: solicitud.sedeDestinoId } : usuario,
      );
      guardarUsuarios(actualizados);
    }

    refrescarTraslados(nuevasSolicitudes);
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Solicitudes de traslado</h1>
          <p>Elija la sede que más le acomode para entrenar y envíenos su solicitud de cambio.</p>
        </div>
      </div>

      {!esAdmin && (
        <form className="panel formulario formulario-horizontal" onSubmit={enviarSolicitud}>
          <h2>Nueva solicitud</h2>
          <p>Sede actual: <strong>{buscarNombreSede(sesion?.sedeId ?? null)}</strong></p>

          <label>
            Sede destino
            <select value={sedeDestinoId} onChange={(evento) => setSedeDestinoId(evento.target.value)}>
              <option value="">Selecciona una sede</option>
              {sedesDestino.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre} - {sede.comuna}
                </option>
              ))}
            </select>
          </label>

          <label>
            Motivo
            <textarea value={motivo} onChange={(evento) => setMotivo(evento.target.value)} />
          </label>

          {error && <p className="mensaje-error">{error}</p>}
          <button type="submit">Enviar solicitud</button>
        </form>
      )}

      <div className="panel">
        <h2>{esAdmin ? 'Solicitudes recibidas' : 'Mis solicitudes'}</h2>
        <div className="tabla-responsive">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Motivo</th>
                <th>Estado</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {trasladosVisibles.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>{solicitud.usuario}</td>
                  <td>{buscarNombreSede(solicitud.sedeOrigenId)}</td>
                  <td>{buscarNombreSede(solicitud.sedeDestinoId)}</td>
                  <td>{solicitud.motivo}</td>
                  <td><span className={`estado ${solicitud.estado.toLowerCase()}`}>{solicitud.estado}</span></td>
                  {esAdmin && (
                    <td className="acciones-tabla">
                      {solicitud.estado === 'Pendiente' ? (
                        <>
                          <button type="button" onClick={() => resolverSolicitud(solicitud.id, 'Aprobado')}>
                            Aceptar
                          </button>
                          <button type="button" onClick={() => resolverSolicitud(solicitud.id, 'Rechazado')}>
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span>Resuelto</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {trasladosVisibles.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5}>No hay solicitudes registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
