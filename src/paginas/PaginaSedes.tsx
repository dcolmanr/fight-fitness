import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import { actualizarSede, crearSede, eliminarSede as eliminarSedeDoc, obtenerSedes, obtenerUsuarios } from '../datos/almacenamiento';
import { EstadoSede, Sede } from '../tipos/modelos';

interface FormularioSede {
  nombre: string;
  direccion: string;
  comuna: string;
  telefono: string;
  estado: EstadoSede;
}

const formularioInicial: FormularioSede = {
  nombre: '',
  direccion: '',
  comuna: '',
  telefono: '',
  estado: 'Activa',
};

export function PaginaSedes() {
  const { esAdmin } = usarAutenticacion();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState<FormularioSede>(formularioInicial);
  const [sedeEditandoId, setSedeEditandoId] = useState<number | null>(null);
  const [errorFormulario, setErrorFormulario] = useState('');

  async function cargarSedes(): Promise<void> {
    setCargando(true);
    const todas = await obtenerSedes();
    setSedes(todas);
    setCargando(false);
  }

  useEffect(() => {
    cargarSedes();
  }, []);

  const sedesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return sedes.filter((sede) =>
      [sede.nombre, sede.direccion, sede.comuna, sede.estado].some((valor) =>
        valor.toLowerCase().includes(texto),
      ),
    );
  }, [busqueda, sedes]);

  function cambiarCampo(campo: keyof FormularioSede, valor: string): void {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarFormulario(): void {
    setFormulario(formularioInicial);
    setSedeEditandoId(null);
    setErrorFormulario('');
  }

  async function guardarSede(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErrorFormulario('');

    if (!esAdmin) {
      setErrorFormulario('Solo el administrador puede gestionar sedes.');
      return;
    }

    if (!formulario.nombre.trim() || !formulario.direccion.trim() || !formulario.comuna.trim()) {
      setErrorFormulario('Nombre, direccion y comuna son obligatorios.');
      return;
    }

    const soloNumeros = formulario.telefono.replace(/[^0-9]/g, '');
    if (soloNumeros.length < 5) {
      setErrorFormulario('El número telefónico debe contener al menos 5 dígitos.');
      return;
    }

    try {
      if (sedeEditandoId) {
        await actualizarSede(sedeEditandoId, formulario);
      } else {
        await crearSede(formulario);
      }
      await cargarSedes();
      limpiarFormulario();
    } catch (error) {
      setErrorFormulario('No se pudo guardar la sede en Firestore. Intenta nuevamente.');
    }
  }

  function editarSede(sede: Sede): void {
    setSedeEditandoId(sede.id);
    setFormulario({
      nombre: sede.nombre,
      direccion: sede.direccion,
      comuna: sede.comuna,
      telefono: sede.telefono,
      estado: sede.estado,
    });
  }

  async function eliminarSede(id: number): Promise<void> {
    if (!esAdmin) return;

    try {
      const usuarios = await obtenerUsuarios();
      const estaEnUso = usuarios.some((usuario) => usuario.sedeId === id);

      if (estaEnUso) {
        alert('No se puede eliminar una sede con clientes inscritos. Cambiala a Inactiva.');
        return;
      }
    } catch {
      alert('No se pudo verificar si la sede tiene clientes inscritos. Intenta nuevamente.');
      return;
    }

    if (!confirm('Seguro que deseas eliminar esta sede?')) return;

    try {
      await eliminarSedeDoc(id);
      await cargarSedes();
    } catch (error) {
      alert('No se pudo eliminar la sede en Firestore. Intenta nuevamente.');
    }
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Gestion de Sedes</h1>
          <p>Encuentre su sucursal, busque la ubicación más cercana y revise los horarios disponibles para entrenar.</p>
        </div>
      </div>

      <div className="grid-dos">
        <form className="panel formulario" onSubmit={guardarSede}>
          <h2>{sedeEditandoId ? 'Editar sede' : 'Registrar sede'}</h2>
          <label>
            Nombre
            <input value={formulario.nombre} onChange={(evento) => cambiarCampo('nombre', evento.target.value)} />
          </label>
          <label>
            Direccion
            <input value={formulario.direccion} onChange={(evento) => cambiarCampo('direccion', evento.target.value)} />
          </label>
          <label>
            Comuna
            <input value={formulario.comuna} onChange={(evento) => cambiarCampo('comuna', evento.target.value)} />
          </label>
          <label>
            Telefono
            <input value={formulario.telefono} onChange={(evento) => cambiarCampo('telefono', evento.target.value)} />
          </label>
          <label>
            Estado
            <select
              value={formulario.estado}
              onChange={(evento) => cambiarCampo('estado', evento.target.value as EstadoSede)}
            >
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </label>

          {errorFormulario && <p className="mensaje-error">{errorFormulario}</p>}
          <div className="fila-botones">
            <button type="submit">{sedeEditandoId ? 'Actualizar sede' : 'Crear sede'}</button>
            <button type="button" className="boton-secundario" onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </form>

        <div className="panel">
          <h2>Listado de sedes</h2>
          <label className="busqueda">
            Buscar
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Filtrar por nombre, comuna o estado"
            />
          </label>

          <div className="tabla-responsive">
            {cargando ? (
              <p>Cargando sedes...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sede</th>
                    <th>Comuna</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sedesFiltradas.map((sede) => (
                    <tr key={sede.id}>
                      <td>
                        <strong>{sede.nombre}</strong>
                        <span>{sede.direccion}</span>
                      </td>
                      <td>{sede.comuna}</td>
                      <td><span className={`estado ${sede.estado.toLowerCase()}`}>{sede.estado}</span></td>
                      <td className="acciones-tabla">
                        <Link to={`/sedes/${sede.id}`}>Detalle</Link>
                        {esAdmin && <button type="button" onClick={() => editarSede(sede)}>Editar</button>}
                        {esAdmin && <button type="button" onClick={() => eliminarSede(sede.id)}>Eliminar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}