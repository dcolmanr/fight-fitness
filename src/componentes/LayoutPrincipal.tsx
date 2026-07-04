import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';

interface PropsLayoutPrincipal {
  children: ReactNode;
}

export function LayoutPrincipal({ children }: PropsLayoutPrincipal) {
  const { sesion, cerrarSesion, esAdmin } = usarAutenticacion();
  const navigate = useNavigate();

  async function salir(): Promise<void> {
    await cerrarSesion();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="barra-superior">
        <div>
          <strong>Fight & Fitness Center</strong>
          <span>Intranet de sedes</span>
        </div>
        <nav className="menu-principal" aria-label="Navegacion principal">
          <NavLink to="/">Panel</NavLink>
          <NavLink to="/sedes">Sedes</NavLink>
          <NavLink to="/traslados">Traslados</NavLink>
          <NavLink to="/membresias">Membresias</NavLink>
          <a href="/crud_agendas.html">Agendas HTML</a>
        </nav>
        <div className="sesion-resumen">
          <span>{sesion?.nombreCompleto}</span>
          <small>{esAdmin ? 'Administrador' : 'Cliente'}</small>
          <button type="button" onClick={salir}>Cerrar sesion</button>
        </div>
      </header>
      <main className="contenido">{children}</main>
    </div>
  );
}
