import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import {
  buscarNombreUsuario,
  nombreSedeEnLista,
  obtenerMembresias,
  obtenerSedes,
  obtenerUsuarios,
  planesMembresia,
} from '../datos/almacenamiento';
import { Sede } from '../tipos/modelos';

function formatearPrecio(valor: number): string {
  return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

export function PaginaDetalleMembresia() {
  const { id } = useParams<{ id: string }>();
  const { sesion, esAdmin } = usarAutenticacion();
  const membresia = obtenerMembresias().find((item) => item.id === Number(id));
  const [sedes, setSedes] = useState<Sede[]>([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      const todas = await obtenerSedes();
      if (activo) setSedes(todas);
    })();

    return () => {
      activo = false;
    };
  }, []);

  if (!membresia) {
    return (
      <section className="pagina">
        <div className="panel">
          <h1>Membresia no encontrada</h1>
          <Link to="/membresias">Volver a membresias</Link>
        </div>
      </section>
    );
  }

  if (!esAdmin && membresia.usuario !== sesion?.usuario) {
    return <Navigate to="/membresias" replace />;
  }

  const usuario = obtenerUsuarios().find((item) => item.usuario === membresia.usuario);
  const plan = planesMembresia.find((item) => item.tipo === membresia.plan);

  return (
    <section className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Detalle de membresia</h1>
          <p>Ruta dinamica cargada con useParams para revisar un registro especifico.</p>
        </div>
        <Link className="boton-secundario" to="/membresias">Volver</Link>
      </div>

      <div className="grid-dos">
        <article className="panel ficha-detalle">
          <h2>Cliente</h2>
          <p><strong>Nombre:</strong> {buscarNombreUsuario(membresia.usuario)}</p>
          <p><strong>Usuario:</strong> {membresia.usuario}</p>
          <p><strong>Sede:</strong> {nombreSedeEnLista(sedes, usuario?.sedeId ?? null)}</p>
        </article>

        <article className="panel ficha-detalle">
          <h2>Suscripcion</h2>
          <p><strong>Plan:</strong> {membresia.plan}</p>
          <p><strong>Precio mensual:</strong> {formatearPrecio(membresia.precioMensual)}</p>
          <p><strong>Vigencia:</strong> {membresia.fechaInicio} al {membresia.fechaTermino}</p>
          <p><strong>Estado:</strong> {membresia.estado}</p>
          <p><strong>Metodo de pago:</strong> {membresia.metodoPago}</p>
        </article>
      </div>

      <article className="panel ficha-detalle">
        <h2>Nivel de acceso</h2>
        <p><strong>Clases:</strong> {plan?.clasesSemanales}</p>
        <p><strong>Disciplinas:</strong> {plan?.disciplinasIncluidas === 6 ? 'Acceso total' : plan?.disciplinasIncluidas}</p>
        <p><strong>Preparacion fisica:</strong> {plan?.preparacionFisica ? 'Incluida' : 'No incluida'}</p>
        <p><strong>Observacion:</strong> {membresia.observacion || 'Sin observaciones'}</p>
      </article>
    </section>
  );
}
