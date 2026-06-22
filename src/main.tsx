import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion';
import './estilos.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorAutenticacion>
        <App />
      </ProveedorAutenticacion>
    </BrowserRouter>
  </React.StrictMode>,
);
