import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import { guardarSedes, obtenerSedes, obtenerUsuarios } from '../datos/almacenamiento';
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
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState<FormularioSede>(formularioInicial);
  const [sedeEditandoId, setSedeEditandoId] = useState<number | null>(null);
  const [errorFormulario, setErrorFormulario] = useState('');

  useEffect(() => {
    setSedes(obtenerSedes());
  }, []);

  const sedesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return sedes.filter((sede) =>
      [sede.nombre, sede.direccion, sede.comuna, sede.estado].some((valor) =>
        valor.toLowerCase().includes(texto),
      ),
    );
  }, [busqueda, sedes]);

  function refrescarSedes(nuevasSedes: Sede[]): void {
    guardarSedes(nuevasSedes);
    setSedes(nuevasSedes);
  }

  function cambiarCampo(campo: keyof FormularioSede, valor: string): void {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarFormulario(): void {
    setFormulario(formularioInicial);
    setSedeEditandoId(null);
    setErrorFormulario('');
  }

  function guardarSede(evento: FormEvent<HTMLFormElement>): void {
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

    if (sedeEditandoId) {
      const actualizadas = sedes.map((sede) =>
        sede.id === sedeEditandoId ? { ...sede, ...formulario } : sede,
      );
      refrescarSedes(actualizadas);
    } else {
      const nuevaSede: Sede = {
        id: Date.now(),
        ...formulario,
      };
      refrescarSedes([...sedes, nuevaSede]);
    }

    limpiarFormulario();
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

  function eliminarSede(id: number): void {
    if (!esAdmin) return;

    const usuarios = obtenerUsuarios();
    const estaEnUso = usuarios.some((usuario) => usuario.sedeId === id);

    if (estaEnUso) {
      alert('No se puede eliminar una sede con clientes inscritos. Cambiala a Inactiva.');
      return;
    }

    if (!confirm('Seguro que deseas eliminar esta sede?')) return;
    refrescarSedes(sedes.filter((sede) => sede.id !== id));
  }

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>CRUD de Gestion de Sedes</h1>
          <p>Continuacion del proyecto Fight & Fitness: administracion territorial de clientes.</p>
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
          </div>
        </div>
      </div>
    </section>
  );
}
