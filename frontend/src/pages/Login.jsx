import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate(); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('rol', data.rol); localStorage.setItem('zona', data.zona);
        if (data.rol === 'CAJERO') {
          navigate('/cajero');
        } else {
          navigate('/dashboard');
        }
      } else { setError('Credenciales incorrectas'); }
    } catch { setError('Error de conexión'); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">JUNTA DE SANEAMIENTO JUAN DE MENA</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 mb-4 rounded" />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 mb-4 rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">Ingresar</button>
        </form>
      </div>
    </div>
  )
}
