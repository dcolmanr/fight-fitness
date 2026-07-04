import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contextos/AuthContext";

export const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const { login, errorAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(correo, contrasena);
      navigate("/"); // Cambia "/" por la ruta de tus agendas si es necesario
    } catch (error) {
      // El error ya se maneja visualmente gracias a errorAuth del Contexto
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo Electrónico:</label>
          <input 
            type="email" 
            value={correo} 
            onChange={(e) => setCorreo(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={contrasena} 
            onChange={(e) => setContrasena(e.target.value)} 
            required 
          />
        </div>
        
        {/* Aquí mostramos el error de Firebase si se equivocan de clave */}
        {errorAuth && <p style={{ color: "red", fontWeight: "bold" }}>{errorAuth}</p>}
        
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
};