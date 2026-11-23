import React, { useState, useEffect } from 'react'

export default function Lecturas() {
  const [usuarios, setUsuarios] = useState([]); 
  const [usuarioId, setUsuarioId] = useState(''); 
  const [periodo, setPeriodo] = useState('2026-11'); 
  const [lecturaAnterior, setLecturaAnterior] = useState(0); 
  const [lecturaActual, setLecturaActual] = useState(''); 
  const [mensaje, setMensaje] = useState(''); 
  const [error, setError] = useState(false); 
  const [pendientes, setPendientes] = useState([]); 
  const zona = localStorage.getItem('zona') || '';

  useEffect(() => { 
    const guardadas = JSON.parse(localStorage.getItem('lecturas_pendientes') || '[]'); 
    setPendientes(guardadas); 
    
    fetch(`http://localhost:8000/api/usuarios`)
      .then(r => r.json())
      .then(d => { 
        const filtrados = (zona === 'TODAS' || zona === '') 
          ? d 
          : d.filter(u => u.barrio === zona);
        setUsuarios(filtrados); 
      })
      .catch(() => console.log('Sin internet')); 
  }, [zona]);

  useEffect(() => { 
    if (usuarioId) { 
      const usuarioSeleccionado = usuarios.find(u => u.id === parseInt(usuarioId));
      if (usuarioSeleccionado) {
        fetch(`http://localhost:8000/api/buscar-usuario?q=${usuarioSeleccionado.numero_conexion}`)
          .then(r => { 
            if(r.ok) return r.json(); 
            throw new Error(); 
          })
          .then(d => { 
            setLecturaAnterior(d.lectura_anterior || 0); 
            setMensaje(''); 
            setError(false); 
          })
          .catch(() => { 
            setLecturaAnterior(0); 
            setMensaje(''); 
            setError(false); 
          }); 
      }
    } 
  }, [usuarioId, usuarios]);

  const guardarLectura = async (e) => { 
    e.preventDefault(); 
    setMensaje(''); 
    setError(false); 
    const nuevaLectura = { 
      usuario_id: parseInt(usuarioId), 
      lectura_anterior: lecturaAnterior,
      lectura_actual: parseFloat(lecturaActual), 
      periodo 
    }; 
    
    try { 
      const res = await fetch(`http://localhost:8000/api/lecturas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaLectura) }); 
      if (res.ok) { 
        const data = await res.json(); 
        setMensaje(`✅ Guardado. Consumo: ${data.consumo_m3} m³`); 
        setLecturaAnterior(data.lectura_actual); 
        setLecturaActual(''); 
      } else { 
        const errData = await res.json();
        setError(true);
        setMensaje(`❌ ${errData.detail || 'Error al guardar la lectura'}`);
      } 
    } catch (err) { 
      const nuevasPendientes = [...pendientes, nuevaLectura]; 
      localStorage.setItem('lecturas_pendientes', JSON.stringify(nuevasPendientes)); 
      setPendientes(nuevasPendientes); 
      setMensaje('📱 Guardado en el celular. Sincronizar luego.'); 
      setLecturaActual(''); 
    } 
  }

  const sincronizar = async () => { 
    if (pendientes.length === 0) return alert("No hay datos para sincronizar"); 
    let exitosos = 0; 
    const fallidos = []; 
    for (let l of pendientes) { 
      try { 
        const res = await fetch(`http://localhost:8000/api/lecturas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(l) }); 
        if (res.ok) exitosos++; 
        else fallidos.push(l); 
      } catch { 
        fallidos.push(l); 
      } 
    } 
    localStorage.setItem('lecturas_pendientes', JSON.stringify(fallidos)); 
    setPendientes(fallidos); 
    alert(`✅ Sincronizadas: ${exitosos}. Pendientes: ${fallidos.length}`); 
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Lectura Móvil {zona !== 'TODAS' && zona !== '' && `(${zona})`}</h1>
      
      {pendientes.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg mb-6 text-center shadow-sm">
          <p className="font-bold">Tienes {pendientes.length} lecturas sin sincronizar.</p>
          <button onClick={sincronizar} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mt-2 w-full">
            🔄 Sincronizar Ahora
          </button>
        </div>
      )}
      
      <form onSubmit={guardarLectura} className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-4 border border-gray-200">
        <div>
          <label className="text-sm font-medium block mb-1">Usuario</label>
          <select required value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className="border p-3 rounded w-full text-lg">
            <option value="">Seleccione...</option>
            {usuarios.filter(u => u.estado === 'ACTIVO').map(u => (
              <option key={u.id} value={u.id}>{u.nombre} (Med: {u.numero_conexion})</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1">Período</label>
          <input required type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="border p-3 rounded w-full text-lg"/>
        </div>
        
        {usuarioId && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg flex justify-between mt-2 border border-blue-100">
              <span className="text-blue-800 font-medium">Lectura Anterior:</span>
              <span className="text-2xl font-bold text-blue-900">{lecturaAnterior} m³</span>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Nueva Lectura</label>
              <input required type="number" step="0.01" value={lecturaActual} onChange={e => setLecturaActual(e.target.value)} className="border-2 border-blue-500 p-4 rounded w-full text-2xl font-bold text-center"/>
            </div>
            
            <button type="submit" className="bg-blue-600 text-white p-4 rounded-lg font-bold text-xl shadow-md hover:bg-blue-700 transition">
              Guardar
            </button>
            
            {mensaje && (
              <div className={`p-4 rounded font-bold text-center mt-2 ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {mensaje}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  )
}
