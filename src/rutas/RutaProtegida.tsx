import { Navigate, Outlet } from 'react-router-dom';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';
import { LayoutPrincipal } from '../componentes/LayoutPrincipal';

export function RutaProtegida() {
  const { sesion } = usarAutenticacion();

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutPrincipal>
      <Outlet />
    </LayoutPrincipal>
  );
}
