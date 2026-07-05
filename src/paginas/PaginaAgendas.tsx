import { FormEvent, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import { AgendaEntrenamiento, EstadoSolicitud } from '../tipos/modelos';

const coleccionAgendas = collection(db, 'agendas');

export function PaginaAgendas() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [agendas, setAgendas] = useState<AgendaEntrenamiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [horario, setHorario] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');

  useEffect(() => {
    cargarAgendas();
  }, []);

  async function cargarAgendas(): Promise<void> {
    setCargando(true);
    setError('');

    try {
      const consulta = query(coleccionAgendas, orderBy('creadoEn', 'desc'));
      const resultado = await getDocs(consulta);
      const datos: AgendaEntrenamiento[] = resultado.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<AgendaEntrenamiento, 'id'>),
      }));
      setAgendas(datos);
    } catch {
      setError('No se pudieron cargar las agendas desde Firestore. Revisa tu conexion e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  const agendasVisibles = esAdmin
    ? agendas
    : agendas.filter((agenda) => agenda.usuario === sesion?.usuario);

  async function enviarSolicitud(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError('');

    if (!sesion) return;

    if (horario.trim().length < 4) {
      setError('Escribe un horario valido (minimo 4 caracteres).');
      return;
    }

    setEnviando(true);
    try {
      await addDoc(coleccionAgendas, {
        usuario: sesion.usuario,
        horario: horario.trim(),
        estado: 'Pendiente' as EstadoSolicitud,
        creadoEn: serverTimestamp(),
      });
      setHorario('');
      await cargarAgendas();
    } catch {
      setError('No se pudo crear la solicitud en Firestore. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(id: string, estado: EstadoSolicitud): Promise<void> {
    setError('');
    setCargando(true);
    try {
      await updateDoc(doc(db, 'agendas', id), { estado });
      await cargarAgendas();
    } catch {
      setError('No se pudo actualizar el estado en Firestore. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }

  function iniciarEdicion(agenda: AgendaEntrenamiento): void {
    setEditandoId(agenda.id);
    setValorEdicion(agenda.horario);
  }

  function cancelarEdicion(): void {
    setEditandoId(null);
    setValorEdicion('');
  }

  async function guardarEdicion(id: string): Promise<void> {
    if (valorEdicion.trim().length < 4) {
      setError('El horario editado debe tener al menos 4 caracteres.');
      return;
    }

    setError('');
    setCargando(true);
    try {
      await updateDoc(doc(db, 'agendas', id), { horario: valorEdicion.trim() });
      cancelarEdicion();
      await cargarAgendas();
    } catch {
      setError('No se pudo editar la agenda en Firestore. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }

  async function eliminarAgenda(id: string): Promise<void> {
    if (!confirm('Seguro que deseas eliminar esta agenda?')) return;

    setError('');
    setCargando(true);
    try {
      await deleteDoc(doc(db, 'agendas', id));
      await cargarAgendas();
    } catch {
      setError('No se pudo eliminar la agenda en Firestore. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Agendas de entrenamiento</h1>
          <p>Reserve sus clases en los horarios disponibles y organice su semana de entrenamiento de la forma más cómoda.</p>
        </div>
      </div>

      {!esAdmin && (
        <form className="panel formulario formulario-horizontal" onSubmit={enviarSolicitud}>
          <h2>Nueva solicitud de horario</h2>

          <label>
            Horario ideal de entrenamiento
            <input
              type="text"
              value={horario}
              onChange={(evento) => setHorario(evento.target.value)}
              placeholder="Ej: Lunes, miercoles y viernes 18:00 a 20:00"
              disabled={enviando}
            />
          </label>

          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      )}

      {error && <p className="mensaje-error">{error}</p>}

      <div className="panel">
        <h2>{esAdmin ? 'Solicitudes recibidas' : 'Mis solicitudes'}</h2>

        {cargando && agendas.length === 0 ? (
          <p>Cargando agendas...</p>
        ) : (
          <div className="tabla-responsive">
            <table>
              <thead>
                <tr>
                  {esAdmin && <th>Usuario</th>}
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agendasVisibles.map((agenda) => (
                  <tr key={agenda.id}>
                    {esAdmin && <td>{agenda.usuario}</td>}
                    <td>
                      {editandoId === agenda.id ? (
                        <input
                          type="text"
                          value={valorEdicion}
                          onChange={(evento) => setValorEdicion(evento.target.value)}
                          disabled={cargando}
                        />
                      ) : (
                        agenda.horario
                      )}
                    </td>
                    <td>
                      <span className={`estado ${agenda.estado.toLowerCase()}`}>{agenda.estado}</span>
                    </td>
                    <td className="acciones-tabla">
                      {editandoId === agenda.id ? (
                        <>
                          <button type="button" onClick={() => guardarEdicion(agenda.id)} disabled={cargando}>
                            Guardar
                          </button>
                          <button type="button" onClick={cancelarEdicion} disabled={cargando}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {esAdmin && agenda.estado === 'Pendiente' && (
                            <>
                              <button type="button" onClick={() => cambiarEstado(agenda.id, 'Aprobado')} disabled={cargando}>
                                Aceptar
                              </button>
                              <button type="button" onClick={() => cambiarEstado(agenda.id, 'Rechazado')} disabled={cargando}>
                                Rechazar
                              </button>
                            </>
                          )}
                          <button type="button" onClick={() => iniciarEdicion(agenda)} disabled={cargando}>
                            Editar
                          </button>
                          <button type="button" onClick={() => eliminarAgenda(agenda.id)} disabled={cargando}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {agendasVisibles.length === 0 && (
                  <tr>
                    <td colSpan={esAdmin ? 4 : 3}>No hay solicitudes de agenda registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}