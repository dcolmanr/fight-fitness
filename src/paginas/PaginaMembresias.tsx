import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  actualizarMembresia,
  eliminarMembresia,
  guardarMembresia,
  nombreSedeEnLista,
  nombreUsuarioEnLista,
  obtenerMembresiaUsuario,
  obtenerMembresias,
  obtenerSedes,
  obtenerUsuarios,
  planesMembresia,
} from '../datos/almacenamiento';
import { EstadoMembresia, Membresia, Sede, TipoPlanMembresia, Usuario } from '../tipos/modelos';

const duracionesDisponibles = [3, 6, 12];

function formatearPrecio(valor: number): string {
  return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function calcularFechaTermino(meses: number): string {
  const inicio = new Date();
  const termino = new Date(inicio);
  termino.setMonth(termino.getMonth() + meses);
  return termino.toLocaleDateString('es-CL');
}

function hoyFormateado(): string {
  return new Date().toLocaleDateString('es-CL');
}

const PaginaMembresias = () => {
  const { sesion, usuarioActual, esAdmin } = usarAutenticacion();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Cliente
  const [membresiaActual, setMembresiaActual] = useState<Membresia | null>(null);
  const [planElegido, setPlanElegido] = useState<TipoPlanMembresia | null>(null);
  const [meses, setMeses] = useState<number>(3);
  const [metodoPago, setMetodoPago] = useState<string>('Webpay');
  const [errorCarga, setErrorCarga] = useState('');

  // Admin
  const [membresias, setMembresias] = useState<Membresia[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const [todasSedes, todosUsuarios] = await Promise.all([obtenerSedes(), obtenerUsuarios()]);
        if (!activo) return;
        setSedes(todasSedes);
        setUsuarios(todosUsuarios);

        if (esAdmin) {
          const todasMembresias = await obtenerMembresias();
          if (activo) setMembresias(todasMembresias);
        } else if (sesion) {
          const propia = await obtenerMembresiaUsuario(sesion.usuario);
          if (activo) setMembresiaActual(propia);
        }
      } catch (error) {
        console.error('Error cargando membresias:', error);
        if (activo) {
          setErrorCarga(
            error instanceof Error ? error.message : 'No se pudieron cargar los datos desde Firestore.',
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [esAdmin, sesion, usuarioActual]);

  const membresiasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return membresias.filter((membresia) =>
      [
        nombreUsuarioEnLista(usuarios, membresia.usuario),
        membresia.plan,
        membresia.estado,
        membresia.metodoPago,
      ].some((valor) => valor.toLowerCase().includes(texto)),
    );
  }, [busqueda, membresias, usuarios]);

  function calcularPrecio(): number {
    if (!planElegido) return 0;
    const plan = planesMembresia.find((item) => item.tipo === planElegido);
    return (plan?.precioMensual ?? 0) * meses;
  }

  async function confirmarCompra(): Promise<void> {
    if (!planElegido || !sesion) return;
    const plan = planesMembresia.find((item) => item.tipo === planElegido);
    if (!plan) return;

    try {
      const nueva = await guardarMembresia(sesion.usuario, {
        plan: planElegido,
        precioMensual: plan.precioMensual,
        fechaInicio: hoyFormateado(),
        fechaTermino: calcularFechaTermino(meses),
        estado: 'Pendiente',
        metodoPago,
        observacion: '',
      });
      setMembresiaActual(nueva);
      setMensaje('¡Solicitud enviada con éxito! Esperando aprobación del administrador.');
      setPlanElegido(null);
    } catch (error) {
      setMensaje('No se pudo guardar la solicitud en Firestore. Intenta nuevamente.');
    }
  }

  function cancelarCompra(): void {
    setPlanElegido(null);
    setMensaje('');
  }

  async function cambiarEstado(membresia: Membresia, estado: EstadoMembresia): Promise<void> {
    try {
      await actualizarMembresia(membresia.usuario, { estado });
      setMembresias((actual) =>
        actual.map((item) => (item.usuario === membresia.usuario ? { ...item, estado } : item)),
      );
    } catch (error) {
      alert('No se pudo actualizar el estado en Firestore. Intenta nuevamente.');
    }
  }

  async function eliminarMembresiaAdmin(membresia: Membresia): Promise<void> {
    const mensajeConfirmacion =
      membresia.estado === 'Pendiente'
        ? 'Seguro que deseas rechazar esta solicitud de membresia? Se eliminara.'
        : 'Seguro que deseas eliminar esta membresia? Se borrara de Firestore.';

    if (!confirm(mensajeConfirmacion)) return;

    try {
      await eliminarMembresia(membresia.usuario);
      setMembresias((actual) => actual.filter((item) => item.usuario !== membresia.usuario));
    } catch (error) {
      alert('No se pudo eliminar la membresia en Firestore. Intenta nuevamente.');
    }
  }

  if (cargando) {
    return (
      <section className="pagina">
        <div className="panel">
          <h1>Cargando membresias...</h1>
        </div>
      </section>
    );
  }

  if (errorCarga) {
    return (
      <section className="pagina">
        <div className="panel">
          <h1>No se pudieron cargar las membresias</h1>
          <p className="mensaje-error">{errorCarga}</p>
          <p>Revisa la consola del navegador (F12) para más detalle, y confirma que las reglas de Firestore permiten leer la coleccion "membresias" para usuarios autenticados.</p>
        </div>
      </section>
    );
  }

  // ==========================================
  // VISTA DEL ADMINISTRADOR
  // ==========================================
  if (esAdmin) {
    return (
      <section className="pagina">
        <div className="encabezado-pagina">
          <div>
            <h1>Gestion de Membresias</h1>
            <p>Revise, apruebe o suspenda las membresias solicitadas por los clientes.</p>
          </div>
        </div>

        <div className="grid-planes">
          {planesMembresia.map((plan) => (
            <article key={plan.tipo} className="plan-card">
              <h2>Plan {plan.tipo}</h2>
              <strong>{formatearPrecio(plan.precioMensual)}</strong>
              <p>{plan.clasesSemanales}</p>
              <p>
                {plan.disciplinasIncluidas === 6 ? 'Acceso total' : `${plan.disciplinasIncluidas} disciplina(s)`}
              </p>
              <span>{plan.preparacionFisica ? 'Incluye preparacion fisica' : 'Sin preparacion fisica'}</span>
            </article>
          ))}
        </div>

        <div className="panel">
          <h2>Membresias de clientes</h2>
          <label className="busqueda">
            Buscar
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Filtrar por cliente, plan, estado o pago"
            />
          </label>

          <div className="tabla-responsive">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {membresiasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay membresias registradas.</td>
                  </tr>
                )}
                {membresiasFiltradas.map((membresia) => (
                  <tr key={membresia.id}>
                    <td>
                      <strong>{nombreUsuarioEnLista(usuarios, membresia.usuario)}</strong>
                      <span>{membresia.usuario}</span>
                    </td>
                    <td>{membresia.plan}</td>
                    <td>{membresia.fechaInicio} al {membresia.fechaTermino}</td>
                    <td><span className={`estado ${membresia.estado.toLowerCase()}`}>{membresia.estado}</span></td>
                    <td>{membresia.metodoPago}</td>
                    <td className="acciones-tabla">
                      <Link to={`/membresias/${membresia.id}`}>Detalle</Link>
                      {membresia.estado === 'Pendiente' && (
                        <>
                          <button type="button" onClick={() => cambiarEstado(membresia, 'Activa')}>Aprobar</button>
                          <button type="button" onClick={() => eliminarMembresiaAdmin(membresia)}>Rechazar</button>
                        </>
                      )}
                      {membresia.estado === 'Activa' && (
                        <button type="button" onClick={() => cambiarEstado(membresia, 'Suspendida')}>Suspender</button>
                      )}
                      {membresia.estado === 'Suspendida' && (
                        <button type="button" onClick={() => cambiarEstado(membresia, 'Activa')}>Reactivar</button>
                      )}
                      {membresia.estado !== 'Pendiente' && (
                        <button type="button" onClick={() => eliminarMembresiaAdmin(membresia)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // VISTA DEL CLIENTE
  // ==========================================
  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Mis Membresias</h1>
          <p>Elija su plan, revise su estado y confirme el pago de su membresia.</p>
        </div>
      </div>

      <div
        className="banner-estado"
        style={{
          backgroundColor:
            membresiaActual?.estado === 'Activa'
              ? '#e6f4ea'
              : membresiaActual?.estado === 'Suspendida'
              ? '#fce8e6'
              : '#fff6e0',
        }}
      >
        <strong>Estado de tu membresía: </strong>
        <span>{membresiaActual?.estado ?? 'Sin membresía'}</span>
        {membresiaActual && (
          <p>
            Plan {membresiaActual.plan} · Vigencia {membresiaActual.fechaInicio} al {membresiaActual.fechaTermino}
          </p>
        )}
      </div>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}

      <h2>Elige un nuevo plan</h2>
      <div className="grid-planes">
        {planesMembresia.map((plan) => (
          <button
            key={plan.tipo}
            type="button"
            className={`plan-card seleccionable ${planElegido === plan.tipo ? 'seleccionada' : ''}`}
            onClick={() => {
              setPlanElegido(plan.tipo);
              setMensaje('');
            }}
          >
            <h2>Plan {plan.tipo}</h2>
            <strong>{formatearPrecio(plan.precioMensual)} / mes</strong>
            <p>{plan.clasesSemanales}</p>
            <p>
              {plan.disciplinasIncluidas === 6 ? 'Acceso total' : `${plan.disciplinasIncluidas} disciplina(s)`}
            </p>
            <span>{plan.preparacionFisica ? 'Incluye preparacion fisica' : 'Sin preparacion fisica'}</span>
          </button>
        ))}
      </div>

      {planElegido && (
        <div className="panel formulario formulario-centrado">
          <h2>Confirmar adquisicion: {planElegido}</h2>

          <label>
            Cliente
            <input type="text" value={sesion?.nombreCompleto || ''} readOnly disabled />
          </label>

          <label>
            Sede de entrenamiento
            <input type="text" value={nombreSedeEnLista(sedes, sesion?.sedeId ?? null)} readOnly disabled />
          </label>

          <label>Duracion del plan</label>
          <div className="opciones-duracion">
            {duracionesDisponibles.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={meses === opcion ? 'seleccionada' : ''}
                onClick={() => setMeses(opcion)}
              >
                {opcion} {opcion === 1 ? 'mes' : 'meses'}
              </button>
            ))}
          </div>

          <label>
            Metodo de pago
            <select value={metodoPago} onChange={(evento) => setMetodoPago(evento.target.value)}>
              <option value="Webpay">Webpay (Tarjetas)</option>
              <option value="Débito">Tarjeta de Débito</option>
              <option value="Crédito">Tarjeta de Crédito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
            </select>
          </label>

          <p className="precio-total">
            <strong>Precio total a pagar: {formatearPrecio(calcularPrecio())}</strong>
          </p>

          <div className="fila-botones">
            <button type="button" onClick={confirmarCompra}>Confirmar</button>
            <button type="button" className="boton-secundario" onClick={cancelarCompra}>Rechazar (Cancelar)</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PaginaMembresias;
