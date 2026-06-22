import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './rutas/RutaProtegida';
import { PaginaLogin } from './paginas/PaginaLogin';
import { PaginaPanel } from './paginas/PaginaPanel';
import { PaginaSedes } from './paginas/PaginaSedes';
import { PaginaDetalleSede } from './paginas/PaginaDetalleSede';
import { PaginaTraslados } from './paginas/PaginaTraslados';
import { PaginaMembresias } from './paginas/PaginaMembresias';
import { PaginaDetalleMembresia } from './paginas/PaginaDetalleMembresia';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<PaginaPanel />} />
        <Route path="/sedes" element={<PaginaSedes />} />
        <Route path="/sedes/:id" element={<PaginaDetalleSede />} />
        <Route path="/traslados" element={<PaginaTraslados />} />
        <Route path="/membresias" element={<PaginaMembresias />} />
        <Route path="/membresias/:id" element={<PaginaDetalleMembresia />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
