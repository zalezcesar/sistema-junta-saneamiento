import React, { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

export default function CargaRapida() {
  const [busqueda, setBusqueda] = useState(''); 
  const [lectura, setLectura] = useState(''); 
  const [periodo, setPeriodo] = useState('2026-11'); 
  const [mensaje, setMensaje] = useState(''); 
  const [error, setError] = useState(false); 
  
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [lecturasMes, setLecturasMes] = useState([]);

  const inputBusqueda = useRef(null);

  const cargarLecturasPeriodo = () => {
    fetch(`http://localhost:8000/api/lecturas?periodo=${periodo}`)
      .then((r) => r.json())
      .then((d) => setLecturasMes(Array.isArray(d) ? d : []))
      .catch(() => setLecturasMes([]));
  };

  useEffect(() => {
    cargarLecturasPeriodo();
  }, [periodo]);

  useEffect(() => {
    const buscarUsuario = async () => {
      if (busqueda.length < 2) { setUsuarioInfo(null); return; }
      setBuscando(true);
      try {
        const res = await fetch(`http://localhost:8000/api/buscar-usuario?q=${busqueda}`);
        if (res.ok) {
          const data = await res.json();
          setUsuarioInfo(data);
        } else {
          setUsuarioInfo(null);
        }
      } catch { setUsuarioInfo(null); }
      setBuscando(false);
    };
    const timer = setTimeout(buscarUsuario, 400); 
    return () => clearTimeout(timer);
  }, [busqueda]);

  const guardar = async (e) => { 
    e.preventDefault(); setMensaje(''); setError(false); 
    if (!usuarioInfo) { setError(true); setMensaje('❌ Primero debe identificar a un usuario válido.'); return; }
    try { 
      const res = await fetch(`http://localhost:8000/api/lecturas/rapida`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero_conexion: busqueda, lectura_actual: parseFloat(lectura), periodo }) }); 
      const data = await res.json(); 
      if (res.ok) { 
        setMensaje(`✅ ${data.usuario} - Consumo: ${data.consumo} m³`); 
        setBusqueda(''); setLectura(''); setUsuarioInfo(null); cargarLecturasPeriodo(); inputBusqueda.current.focus(); 
      } else { setError(true); setMensaje(`❌ ${data.detail}`); } 
    } catch { setError(true); setMensaje('❌ Error de conexión'); } 
  }

  const editarLectura = async (l) => {
    const nuevoValor = window.prompt(
      `Corregir lectura actual de ${l.usuario} (Medidor ${l.medidor})\nLectura anterior: ${l.lectura_anterior} m³`,
      l.lectura_actual
    );
    if (nuevoValor === null || nuevoValor.trim() === '') return;

    const num = parseFloat(nuevoValor);
    if (isNaN(num)) {
      alert('Ingrese un número válido');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/lecturas/${l.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectura_actual: num }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(false);
        setMensaje(`✅ Lectura de ${l.usuario} corregida. Nuevo consumo: ${data.consumo} m³`);
        cargarLecturasPeriodo();
      } else {
        setError(true);
        setMensaje(`❌ ${data.detail}`);
      }
    } catch {
      setError(true);
      setMensaje('❌ Error de conexión');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Carga Rápida de Planillas</h1></div>
      <form onSubmit={guardar} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium block mb-1">Período</label><input required type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="border p-3 rounded w-full text-lg"/></div>
          <div>
            <label className="text-sm font-medium block mb-1">N° de Medidor o Cédula</label>
            <input ref={inputBusqueda} required type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="border-2 border-blue-500 p-3 rounded w-full text-lg font-bold" placeholder="Ej: 1001 o 6157926" autoFocus/>
            {buscando && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
            {!buscando && busqueda.length >= 2 && !usuarioInfo && <p className="text-xs text-red-500 mt-1">❌ Usuario no encontrado</p>}
          </div>
        </div>
        {usuarioInfo && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-2">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">✓ Verifique que sea el usuario correcto:</p>
            <p className="text-2xl font-bold text-gray-800">{usuarioInfo.nombre}</p>
            <div className="flex justify-between mt-2 text-sm text-gray-600"><span>CI: <b>{usuarioInfo.ci}</b></span><span>Medidor: <b>{usuarioInfo.medidor}</b></span><span>Lectura Anterior: <b>{usuarioInfo.lectura_anterior} m³</b></span></div>
            {usuarioInfo.estado === 'CORTADO' && <p className="text-red-600 font-bold mt-2 text-sm">⚠️ ATENCIÓN: Este usuario está CORTADO.</p>}
          </div>
        )}
        <div>
          <label className="text-sm font-medium block mb-1">Lectura Actual (m³)</label>
          <input required type="number" step="0.01" value={lectura} onChange={e => setLectura(e.target.value)} className="border-2 border-green-500 p-3 rounded w-full text-xl font-bold" placeholder="Ej: 150" disabled={!usuarioInfo} />
        </div>
        <button type="submit" disabled={!usuarioInfo || !lectura} className={`p-4 rounded-lg font-bold text-lg shadow-md transition ${(!usuarioInfo || !lectura) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>Guardar y Siguiente</button>
        {mensaje && <div className={`p-4 rounded font-bold text-center mt-2 ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{mensaje}</div>}
      </form>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Lecturas registradas en {periodo}</h2>
          <span className="text-xs text-gray-500">{lecturasMes.length} registros</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Medidor</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Anterior</th>
              <th className="p-3">Actual</th>
              <th className="p-3">Consumo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {lecturasMes.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{l.medidor}</td>
                <td className="p-3">{l.usuario}</td>
                <td className="p-3">{l.lectura_anterior} m³</td>
                <td className="p-3 font-bold">{l.lectura_actual} m³</td>
                <td className="p-3 font-bold text-blue-700">{l.consumo_m3} m³</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      l.facturada === 'SI'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {l.facturada === 'SI' ? 'FACTURADA' : 'SIN FACTURAR'}
                  </span>
                </td>
                <td className="p-3">
                  {l.facturada === 'NO' ? (
                    <button
                      onClick={() => editarLectura(l)}
                      className="text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 size={13} /> Corregir
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Anule factura para editar</span>
                  )}
                </td>
              </tr>
            ))}
            {lecturasMes.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No hay lecturas cargadas en este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
