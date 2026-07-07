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
import { AgendaEntrenamiento, BloqueHorario, DiaSemana, EstadoSolicitud } from '../tipos/modelos';

const coleccionAgendas = collection(db, 'agendas');

const diasSemana: DiaSemana[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

const bloquesHorario: { valor: BloqueHorario; etiqueta: string }[] = [
  { valor: 'Mañana', etiqueta: 'Mañana (08:00 - 12:00)' },
  { valor: 'Tarde', etiqueta: 'Tarde (14:00 - 18:00)' },
  { valor: 'Noche', etiqueta: 'Noche (18:00 - 22:00)' },
];

function etiquetaBloque(bloque: BloqueHorario): string {
  return bloquesHorario.find((item) => item.valor === bloque)?.etiqueta ?? bloque;
}

const formularioVacio = {
  dias: [] as DiaSemana[],
  bloque: '' as BloqueHorario | '',
  observacion: '',
};

export function PaginaAgendas() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [agendas, setAgendas] = useState<AgendaEntrenamiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);

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

  function alternarDia(dia: DiaSemana): void {
    setFormulario((actual) => ({
      ...actual,
      dias: actual.dias.includes(dia) ? actual.dias.filter((item) => item !== dia) : [...actual.dias, dia],
    }));
  }

  function limpiarFormulario(): void {
    setFormulario(formularioVacio);
    setEditandoId(null);
    setError('');
  }

  async function enviarSolicitud(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError('');

    if (!sesion) return;

    if (formulario.dias.length === 0) {
      setError('Selecciona al menos un dia de entrenamiento.');
      return;
    }

    if (!formulario.bloque) {
      setError('Selecciona un bloque horario.');
      return;
    }

    setEnviando(true);
    try {
      const datos = {
        dias: formulario.dias,
        bloque: formulario.bloque,
        observacion: formulario.observacion.trim(),
      };

      if (editandoId) {
        await updateDoc(doc(db, 'agendas', editandoId), datos);
      } else {
        await addDoc(coleccionAgendas, {
          usuario: sesion.usuario,
          ...datos,
          estado: 'Pendiente' as EstadoSolicitud,
          creadoEn: serverTimestamp(),
        });
      }

      limpiarFormulario();
      await cargarAgendas();
    } catch {
      setError('No se pudo guardar la solicitud en Firestore. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicion(agenda: AgendaEntrenamiento): void {
    setEditandoId(agenda.id);
    setFormulario({ dias: agenda.dias, bloque: agenda.bloque, observacion: agenda.observacion ?? '' });
    setError('');
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

  async function eliminarAgenda(id: string): Promise<void> {
    if (!confirm('Seguro que deseas eliminar esta agenda?')) return;

    setError('');
    setCargando(true);
    try {
      await deleteDoc(doc(db, 'agendas', id));
      if (editandoId === id) limpiarFormulario();
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
        <form className="panel formulario" onSubmit={enviarSolicitud}>
          <h2>{editandoId ? 'Editar solicitud de horario' : 'Nueva solicitud de horario'}</h2>

          <label>Dias de entrenamiento</label>
          <div className="opciones-toggle">
            {diasSemana.map((dia) => (
              <button
                key={dia}
                type="button"
                className={formulario.dias.includes(dia) ? 'seleccionada' : ''}
                onClick={() => alternarDia(dia)}
                disabled={enviando}
              >
                {dia}
              </button>
            ))}
          </div>

          <label>Bloque horario</label>
          <div className="opciones-toggle">
            {bloquesHorario.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                className={formulario.bloque === opcion.valor ? 'seleccionada' : ''}
                onClick={() => setFormulario((actual) => ({ ...actual, bloque: opcion.valor }))}
                disabled={enviando}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>

          <label>
            Comentario adicional (opcional)
            <textarea
              value={formulario.observacion}
              onChange={(evento) => setFormulario((actual) => ({ ...actual, observacion: evento.target.value }))}
              placeholder="¿Algun comentario adicional? (lesion, preferencia de grupo, etc.)"
              disabled={enviando}
            />
          </label>

          <div className="fila-botones">
            <button type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : editandoId ? 'Guardar cambios' : 'Enviar solicitud'}
            </button>
            {editandoId && (
              <button type="button" className="boton-secundario" onClick={limpiarFormulario} disabled={enviando}>
                Cancelar
              </button>
            )}
          </div>
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
                      <strong>{agenda.dias.join(', ')}</strong>
                      <span>
                        {etiquetaBloque(agenda.bloque)}
                        {agenda.observacion ? ` · ${agenda.observacion}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`estado ${agenda.estado.toLowerCase()}`}>{agenda.estado}</span>
                    </td>
                    <td className="acciones-tabla">
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
                      {!esAdmin && (
                        <button type="button" onClick={() => iniciarEdicion(agenda)} disabled={cargando}>
                          Editar
                        </button>
                      )}
                      <button type="button" onClick={() => eliminarAgenda(agenda.id)} disabled={cargando}>
                        Eliminar
                      </button>
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
