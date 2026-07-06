import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  guardarMembresias,
  nombreSedeEnLista,
  nombreUsuarioEnLista,
  obtenerMembresias,
  obtenerSedes,
  obtenerUsuarios,
  planesMembresia,
} from '../datos/almacenamiento';
import { EstadoMembresia, Membresia, Sede, TipoPlanMembresia, Usuario } from '../tipos/modelos';

interface FormularioMembresia {
  usuario: string;
  plan: TipoPlanMembresia;
  fechaInicio: string;
  fechaTermino: string;
  estado: EstadoMembresia;
  metodoPago: string;
  observacion: string;
}

const hoy = new Date().toISOString().slice(0, 10);

function fechaMasMeses(meses: number): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toISOString().slice(0, 10);
}

const formularioInicial: FormularioMembresia = {
  usuario: '',
  plan: 'Basico',
  fechaInicio: hoy,
  fechaTermino: fechaMasMeses(1),
  estado: 'Activa',
  metodoPago: 'Pendiente',
  observacion: '',
};

function precioPlan(plan: TipoPlanMembresia): number {
  return planesMembresia.find((item) => item.tipo === plan)?.precioMensual ?? 0;
}

function formatearPrecio(valor: number): string {
  return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

export function PaginaMembresias() {
  const { sesion, esAdmin } = usarAutenticacion();
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState<FormularioMembresia>(formularioInicial);
  const [membresiaEditandoId, setMembresiaEditandoId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    setMembresias(obtenerMembresias());

    (async () => {
      const [todasSedes, todosUsuarios] = await Promise.all([obtenerSedes(), obtenerUsuarios()]);
      if (activo) {
        setSedes(todasSedes);
        setUsuarios(todosUsuarios.filter((usuario) => usuario.rol === 'cliente'));
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  const membresiasVisibles = useMemo(() => {
    const base = esAdmin
      ? membresias
      : membresias.filter((membresia) => membresia.usuario === sesion?.usuario);

    const texto = busqueda.toLowerCase();
    return base.filter((membresia) =>
      [
        membresia.usuario,
        nombreUsuarioEnLista(usuarios, membresia.usuario),
        membresia.plan,
        membresia.estado,
        membresia.metodoPago,
      ].some((valor) => valor.toLowerCase().includes(texto)),
    );
  }, [busqueda, esAdmin, membresias, sesion?.usuario, usuarios]);

  function refrescarMembresias(nuevasMembresias: Membresia[]): void {
    guardarMembresias(nuevasMembresias);
    setMembresias(nuevasMembresias);
  }

  function cambiarCampo(campo: keyof FormularioMembresia, valor: string): void {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarFormulario(): void {
    setFormulario(formularioInicial);
    setMembresiaEditandoId(null);
    setError('');
  }

  function guardarMembresia(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setError('');

    if (!esAdmin) {
      setError('Solo el administrador puede asignar o modificar membresias.');
      return;
    }

    if (!formulario.usuario || !formulario.fechaInicio || !formulario.fechaTermino) {
      setError('Cliente, fecha de inicio y fecha de termino son obligatorios.');
      return;
    }

    if (new Date(formulario.fechaTermino) <= new Date(formulario.fechaInicio)) {
      setError('La fecha de termino debe ser posterior a la fecha de inicio.');
      return;
    }

    const membresia: Membresia = {
      id: membresiaEditandoId ?? Date.now(),
      usuario: formulario.usuario,
      plan: formulario.plan,
      precioMensual: precioPlan(formulario.plan),
      fechaInicio: formulario.fechaInicio,
      fechaTermino: formulario.fechaTermino,
      estado: formulario.estado,
      metodoPago: formulario.metodoPago.trim() || 'Pendiente',
      observacion: formulario.observacion.trim(),
    };

    if (membresiaEditandoId) {
      refrescarMembresias(membresias.map((item) => (item.id === membresiaEditandoId ? membresia : item)));
    } else {
      refrescarMembresias([...membresias, membresia]);
    }

    limpiarFormulario();
  }

  function editarMembresia(membresia: Membresia): void {
    setMembresiaEditandoId(membresia.id);
    setFormulario({
      usuario: membresia.usuario,
      plan: membresia.plan,
      fechaInicio: membresia.fechaInicio,
      fechaTermino: membresia.fechaTermino,
      estado: membresia.estado,
      metodoPago: membresia.metodoPago,
      observacion: membresia.observacion,
    });
  }

  function eliminarMembresia(id: number): void {
    if (!esAdmin) return;
    if (!confirm('Seguro que deseas eliminar esta membresia?')) return;
    refrescarMembresias(membresias.filter((membresia) => membresia.id !== id));
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>CRUD de Gestion de Membresias</h1>
          <p>Revise los detalles de su plan actual, elija cómo prefiere pagar y asegure su continuidad en Fight & Fitness</p>
        </div>
      </div>

      <div className="grid-planes">
        {planesMembresia.map((plan) => (
          <article key={plan.tipo} className="plan-card">
            <h2>Plan {plan.tipo}</h2>
            <strong>{formatearPrecio(plan.precioMensual)}</strong>
            <p>{plan.clasesSemanales}</p>
            <p>{plan.disciplinasIncluidas === 6 ? 'Acceso total' : `${plan.disciplinasIncluidas} disciplina(s)`}</p>
            <span>{plan.preparacionFisica ? 'Incluye preparacion fisica' : 'Sin preparacion fisica'}</span>
          </article>
        ))}
      </div>

      <div className="grid-dos">
        {esAdmin && (
          <form className="panel formulario" onSubmit={guardarMembresia}>
            <h2>{membresiaEditandoId ? 'Editar membresia' : 'Asignar membresia'}</h2>

            <label>
              Cliente
              <select value={formulario.usuario} onChange={(evento) => cambiarCampo('usuario', evento.target.value)}>
                <option value="">Selecciona un cliente</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.usuario} value={usuario.usuario}>
                    {usuario.nombreCompleto} - {nombreSedeEnLista(sedes, usuario.sedeId)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Plan
              <select
                value={formulario.plan}
                onChange={(evento) => cambiarCampo('plan', evento.target.value as TipoPlanMembresia)}
              >
                {planesMembresia.map((plan) => (
                  <option key={plan.tipo} value={plan.tipo}>
                    {plan.tipo} - {formatearPrecio(plan.precioMensual)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Fecha inicio
              <input
                type="date"
                value={formulario.fechaInicio}
                onChange={(evento) => cambiarCampo('fechaInicio', evento.target.value)}
              />
            </label>

            <label>
              Fecha termino
              <input
                type="date"
                value={formulario.fechaTermino}
                onChange={(evento) => cambiarCampo('fechaTermino', evento.target.value)}
              />
            </label>

            <label>
              Estado
              <select
                value={formulario.estado}
                onChange={(evento) => cambiarCampo('estado', evento.target.value as EstadoMembresia)}
              >
                <option value="Activa">Activa</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Suspendida">Suspendida</option>
                <option value="Vencida">Vencida</option>
              </select>
            </label>

            <label>
              Metodo de pago
              <input
                value={formulario.metodoPago}
                onChange={(evento) => cambiarCampo('metodoPago', evento.target.value)}
                placeholder="Transferencia, efectivo, tarjeta..."
              />
            </label>

            <label>
              Observacion
              <textarea
                value={formulario.observacion}
                onChange={(evento) => cambiarCampo('observacion', evento.target.value)}
              />
            </label>

            {error && <p className="mensaje-error">{error}</p>}
            <div className="fila-botones">
              <button type="submit">{membresiaEditandoId ? 'Actualizar' : 'Asignar'}</button>
              <button type="button" className="boton-secundario" onClick={limpiarFormulario}>Limpiar</button>
            </div>
          </form>
        )}

        <div className="panel">
          <h2>{esAdmin ? 'Membresias registradas' : 'Mi membresia'}</h2>
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
                {membresiasVisibles.map((membresia) => (
                  <tr key={membresia.id}>
                    <td>
                      <strong>{nombreUsuarioEnLista(usuarios, membresia.usuario)}</strong>
                      <span>{membresia.usuario}</span>
                    </td>
                    <td>
                      Plan {membresia.plan}
                      <span>{formatearPrecio(membresia.precioMensual)} mensual</span>
                    </td>
                    <td>
                      {membresia.fechaInicio}
                      <span>hasta {membresia.fechaTermino}</span>
                    </td>
                    <td><span className={`estado ${membresia.estado.toLowerCase()}`}>{membresia.estado}</span></td>
                    <td>{membresia.metodoPago}</td>
                    <td className="acciones-tabla">
                      <Link to={`/membresias/${membresia.id}`}>Detalle</Link>
                      {esAdmin && <button type="button" onClick={() => editarMembresia(membresia)}>Editar</button>}
                      {esAdmin && <button type="button" onClick={() => eliminarMembresia(membresia.id)}>Eliminar</button>}
                    </td>
                  </tr>
                ))}
                {membresiasVisibles.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay membresias registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
