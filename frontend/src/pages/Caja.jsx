import React, { useState, useEffect } from 'react';
import Paginacion from '../components/Paginacion';

export default function Caja() {
  const [caja, setCaja] = useState({ movimientos: [], saldo_actual: 0 });
  const [form, setForm] = useState({ tipo: 'INGRESO', concepto: '', monto: '' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(20);

  const cargar = () =>
    fetch(`http://localhost:8000/api/caja`)
      .then((r) => r.json())
      .then((d) => setCaja(d));

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:8000/api/caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: parseFloat(form.monto) }),
    });
    setForm({ tipo: 'INGRESO', concepto: '', monto: '' });
    setPaginaActual(1);
    cargar();
  };

  const movimientos = caja.movimientos || [];
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const movimientosPaginados = movimientos.slice(indiceInicio, indiceInicio + itemsPorPagina);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tesorería y Caja</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-teal-500 border border-gray-200">
          <h3 className="text-gray-500 font-medium">Saldo Total en Caja</h3>
          <p className="text-4xl font-bold text-teal-700">
            ₲ {(caja.saldo_actual || 0).toLocaleString('es-PY')}
          </p>
          <p className="text-xs text-gray-400 mt-2">Suma de todos los ingresos menos egresos</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow col-span-2 border border-gray-200">
          <form onSubmit={guardar} className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="border p-2 rounded"
              >
                <option>INGRESO</option>
                <option>EGRESO</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium">Concepto</label>
              <input
                required
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                className="border p-2 rounded w-full"
                placeholder="Ej: Compra de cloro, Pago de luz..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Monto (₲)</label>
              <input
                required
                type="number"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="border p-2 rounded w-full"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded font-medium hover:bg-gray-900"
            >
              Registrar
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Concepto</th>
              <th className="p-3">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movimientosPaginados.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{new Date(m.fecha).toLocaleString('es-PY')}</td>
                <td className="p-3">
                  <span
                    className={`font-medium ${
                      m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td className="p-3">{m.concepto}</td>
                <td className="p-3 font-bold">₲ {m.monto.toLocaleString('es-PY')}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  No hay movimientos registrados en caja.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Paginacion
          totalItems={movimientos.length}
          itemsPorPagina={itemsPorPagina}
          paginaActual={paginaActual}
          onCambiarPagina={setPaginaActual}
          onCambiarItemsPorPagina={(cant) => {
            setItemsPorPagina(cant);
            setPaginaActual(1);
          }}
        />
      </div>
    </div>
  );
}
