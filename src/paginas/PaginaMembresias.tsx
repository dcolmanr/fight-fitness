import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { usarAutenticacion } from '../contextos/ContextoAutenticacion';

const PaginaMembresias = () => {
  const { sesion, usuarioActual, esAdmin } = usarAutenticacion();
  
  // Estados para el flujo del cliente
  const [planElegido, setPlanElegido] = useState<string | null>(null);
  const [meses, setMeses] = useState<number>(3);
  const [metodoPago, setMetodoPago] = useState<string>('Webpay');
  const [estadoActual, setEstadoActual] = useState<string>('Sin membresía');
  const [mensaje, setMensaje] = useState<string>('');

  // Precios base por mes
  const precios: Record<string, number> = {
    'Básica': 20000,
    'Pro': 30000,
    'Plan Full': 45000
  };

  // Cargar el estado real de la membresía del cliente desde Firestore
  useEffect(() => {
    const cargarEstadoMembresia = async () => {
      if (!esAdmin && usuarioActual) {
        try {
          const docRef = doc(db, 'usuarios', usuarioActual.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const datos = docSnap.data();
            if (datos.estadoMembresia) {
              setEstadoActual(datos.estadoMembresia);
            }
          }
        } catch (error) {
          console.error("Error al cargar estado:", error);
        }
      }
    };
    cargarEstadoMembresia();
  }, [esAdmin, usuarioActual]);

  const calcularPrecio = () => {
    if (!planElegido) return 0;
    return precios[planElegido] * meses;
  };

  const confirmarCompra = async () => {
    if (!planElegido || !usuarioActual) return;
    
    try {
      const usuarioRef = doc(db, 'usuarios', usuarioActual.uid);
      await updateDoc(usuarioRef, {
        membresia: planElegido,
        duracionMeses: meses,
        metodoPago: metodoPago,
        precioTotal: calcularPrecio(),
        estadoMembresia: 'Pendiente' // Queda pendiente hasta que el admin lo apruebe
      });
      setMensaje('¡Solicitud enviada con éxito! Esperando aprobación del administrador.');
      setPlanElegido(null); // Ocultar el formulario
      setEstadoActual('Pendiente'); // Actualizar la vista localmente
    } catch (error) {
      console.error("Error al confirmar:", error);
      setMensaje('Error al procesar la solicitud.');
    }
  };

  const cancelarCompra = () => {
    setPlanElegido(null);
    setMensaje('');
  };

  // ==========================================
  // VISTA DEL ADMINISTRADOR
  // ==========================================
  if (esAdmin) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Panel de Administración de Membresías</h2>
        <p>Busca, filtra y aprueba a los clientes aquí.</p>
        
        {/* Aquí puedes pegar el código de la tabla de tu PanelAdmin que te di antes */}
        <div style={{ padding: '20px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
          <p><em>(Espacio reservado para la tabla de gestión de clientes, filtros y aprobaciones)</em></p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA DEL CLIENTE
  // ==========================================
  return (
    <div style={{ padding: '20px' }}>
      <h2>Mis Membresías</h2>
      
      {/* Banner de Estado Actual */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        backgroundColor: estadoActual === 'Aprobada' ? '#d4edda' : 
                         estadoActual === 'Suspendida' ? '#f8d7da' : '#fff3cd',
        border: '1px solid #ccc'
      }}>
        <strong>Estado de tu membresía: </strong> 
        <span style={{ textTransform: 'uppercase' }}>{estadoActual}</span>
      </div>

      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <h3>Elige un nuevo plan</h3>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        {Object.keys(precios).map((plan) => (
          <div 
            key={plan} 
            onClick={() => { setPlanElegido(plan); setMensaje(''); }}
            style={{ 
              border: planElegido === plan ? '3px solid #007bff' : '1px solid #ccc',
              padding: '20px', 
              cursor: 'pointer', 
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
              backgroundColor: planElegido === plan ? '#e9f5ff' : '#fff'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>{plan}</h4>
            <p style={{ margin: '0' }}>${precios[plan].toLocaleString('es-CL')} / mes</p>
          </div>
        ))}
      </div>

      {/* BLOQUE DE CONFIRMACIÓN (Solo aparece si selecciona un plan) */}
      {planElegido && (
        <div style={{ border: '2px solid #333', padding: '20px', borderRadius: '8px', maxWidth: '500px', backgroundColor: '#fdfdfd' }}>
          <h3>Confirmar Adquisición: {planElegido}</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label><strong>Cliente:</strong></label>
            <input type="text" value={sesion?.nombreCompleto || ''} readOnly disabled style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Sede de Entrenamiento:</strong></label>
            {/* Si guardas el ID de la sede en vez del nombre, aquí mostrará el ID. Puedes ajustar esto luego */}
            <input type="text" value={`Sede ID: ${sesion?.sedeId || 'No asignada'}`} readOnly disabled style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Duración del Plan:</strong></label>
            <select 
              value={meses} 
              onChange={(e) => setMeses(Number(e.target.value))} 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value={3}>3 Meses</option>
              <option value={6}>6 Meses</option>
              <option value={12}>12 Meses (1 Año)</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Método de Pago:</strong></label>
            <select 
              value={metodoPago} 
              onChange={(e) => setMetodoPago(e.target.value)} 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="Webpay">Webpay (Tarjetas)</option>
              <option value="Débito">Tarjeta de Débito</option>
              <option value="Crédito">Tarjeta de Crédito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
            </select>
          </div>

          <div style={{ margin: '20px 0', fontSize: '1.2rem' }}>
            <strong>Precio Total a Pagar: </strong> 
            <span style={{ color: '#007bff' }}>${calcularPrecio().toLocaleString('es-CL')}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={confirmarCompra} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Confirmar
            </button>
            <button onClick={cancelarCompra} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Rechazar (Cancelar)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaMembresias;