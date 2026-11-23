import React, { useState, useEffect } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]); 
  const [form, setForm] = useState({ username: '', password: '', rol: 'CAJERO', zona_asignada: 'CENTRO' });
  const [msg, setMsg] = useState({ texto: '', tipo: '' }); 
  
  // Estado para el modal de eliminación
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);

  const cargar = () => fetch(`http://localhost:8000/api/usuarios-sistema`).then(r => r.json()).then(d => setEmpleados(d)); 
  
  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => { 
    e.preventDefault(); 
    setMsg({ texto: '', tipo: '' }); 

    const res = await fetch(`http://localhost:8000/api/usuarios-sistema`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    }); 

    if(res.ok) { 
      setMsg({ texto: '✅ Empleado creado exitosamente', tipo: 'exito' });
      setForm({ username: '', password: '', rol: 'CAJERO', zona_asignada: 'CENTRO' }); 
      cargar(); 
    } else { 
      setMsg({ texto: '❌ Error: El usuario ya existe', tipo: 'error' });
    } 
  }

  const confirmarEliminacion = async () => {
    if (!empleadoAEliminar) return;
    if (empleadoAEliminar.username === 'admin') {
      setMsg({ texto: '⚠️ No se puede eliminar al administrador principal', tipo: 'error' });
      setEmpleadoAEliminar(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/usuarios-sistema/${empleadoAEliminar.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ texto: '✅ Empleado eliminado correctamente', tipo: 'exito' });
        cargar();
      } else {
        const err = await res.json();
        setMsg({ texto: `❌ ${err.detail || "Error al eliminar"}`, tipo: 'error' });
      }
    } catch {
      setMsg({ texto: '❌ Error de conexión', tipo: 'error' });
    }
    setEmpleadoAEliminar(null);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gestión de Empleados</h1>
      
      {msg.texto && (
        <div className={`p-3 mb-4 rounded-lg font-bold text-center border-2 ${
          msg.tipo === 'exito' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
        }`}>
          {msg.texto}
        </div>
      )}

      <form onSubmit={guardar} className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-end border border-gray-200">
        <div><label className="text-xs text-gray-500">Usuario</label><input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="border p-2 rounded w-full"/></div>
        <div><label className="text-xs text-gray-500">Contraseña</label><input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 rounded w-full"/></div>
        <div><label className="text-xs text-gray-500">Rol</label><select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="border p-2 rounded"><option value="CAJERO">Cajero</option><option value="ADMIN">Admin</option></select></div>
        <div><label className="text-xs text-gray-500">Zona</label><select value={form.zona_asignada} onChange={e => setForm({...form, zona_asignada: e.target.value})} className="border p-2 rounded"><option value="CENTRO">Centro</option><option value="SAN_ISIDRO">San Isidro</option><option value="VILLA_NUEVA">Villa Nueva</option><option value="TODAS">Todas</option></select></div>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-bold">Crear</button>
      </form>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Zona</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{e.username}</td>
                <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{e.rol}</span></td>
                <td className="p-3">{e.zona_asignada}</td>
                <td className="p-3">
                  <button 
                    onClick={() => setEmpleadoAEliminar(e)} // Abre el modal
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                    title="Eliminar usuario"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE ELIMINACIÓN LINDO */}
      {empleadoAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-red-600">
            <div className="flex justify-center mb-4 text-red-500">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Eliminar Empleado</h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              ¿Estás seguro que deseas eliminar al usuario <b>{empleadoAEliminar.username}</b>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEmpleadoAEliminar(null)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="px-4 py-2 text-white font-bold rounded-lg bg-red-600 hover:bg-red-700"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
