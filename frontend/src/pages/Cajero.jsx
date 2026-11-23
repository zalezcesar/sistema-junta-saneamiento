import React, { useState, useEffect } from 'react';
import { Search, CheckSquare, Square, Users, Wallet } from 'lucide-react';

export default function Cajero() {
  const [query, setQuery] = useState('');
  const [clienteData, setClienteData] = useState(null);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [msg, setMsg] = useState('');
  const [modalCobro, setModalCobro] = useState(false);
  const [resumenHoy, setResumenHoy] = useState({ atendidos: 0, total_cobrado: 0, cobros: [] });

  const cargarResumenHoy = () => {
    fetch('http://localhost:8000/api/cajero/resumen-hoy')
      .then((r) => r.json())
      .then((d) => setResumenHoy(d))
      .catch(() => {});
  };

  useEffect(() => {
    cargarResumenHoy();
  }, []);

  const buscar = async (e) => {
    if (e) e.preventDefault();
    setMsg('');
    setClienteData(null);
    setSeleccionadas([]);
    if (!query.trim()) return;

    try {
      const res = await fetch(`http://localhost:8000/api/cajero/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setMsg('✅ El usuario no tiene deudas pendientes.');
      } else {
        const cliente = data[0];
        setClienteData(cliente);
        setSeleccionadas(cliente.facturas.map((f) => f.id));
      }
    } catch {
      setMsg('❌ Error de conexión con el servidor.');
    }
  };

  const toggleFactura = (index) => {
    if (!clienteData) return;
    const facturas = clienteData.facturas;
    const idActual = facturas[index].id;
    const yaEstabaMarcada = seleccionadas.includes(idActual);

    if (yaEstabaMarcada) {
      setSeleccionadas(facturas.slice(0, index).map((f) => f.id));
    } else {
      setSeleccionadas(facturas.slice(0, index + 1).map((f) => f.id));
    }
  };

  const marcarTodo = () => {
    if (!clienteData) return;
    setSeleccionadas(clienteData.facturas.map((f) => f.id));
  };

  const desmarcarTodo = () => {
    setSeleccionadas([]);
  };

  const totalSeleccionado = clienteData
    ? clienteData.facturas
        .filter((f) => seleccionadas.includes(f.id))
        .reduce((acc, f) => acc + f.monto, 0)
    : 0;

  const ejecutarCobro = async () => {
    if (seleccionadas.length === 0) return;

    try {
      const res = await fetch('http://localhost:8000/api/facturas/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factura_ids: seleccionadas }),
      });

      if (res.ok) {
        setMsg(`✅ Cobro registrado por ₲ ${totalSeleccionado.toLocaleString('es-PY')}.`);
        setClienteData(null);
        setSeleccionadas([]);
        setQuery('');
        cargarResumenHoy();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al registrar el cobro');
      }
    } catch {
      alert('Error de conexión con el servidor');
    }
    setModalCobro(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Punto de Venta (Cajero)</h1>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
            <Users className="text-blue-600" size={18} />
            <div>
              <span className="text-[11px] text-gray-500 block leading-tight">Atendidos hoy</span>
              <span className="font-bold text-gray-800 text-sm">{resumenHoy.atendidos} personas</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
            <Wallet className="text-green-600" size={18} />
            <div>
              <span className="text-[11px] text-gray-500 block leading-tight">Cobrado hoy</span>
              <span className="font-bold text-green-700 text-sm">
                ₲ {Number(resumenHoy.total_cobrado || 0).toLocaleString('es-PY')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={buscar} className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Nº de Medidor o Cédula..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-2 border-blue-500 p-4 rounded-lg text-lg font-medium outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md"
        >
          <Search size={20} /> Buscar
        </button>
      </form>

      {msg && (
        <div className="p-4 mb-6 rounded-lg bg-blue-100 text-blue-800 font-medium text-center">
          {msg}
        </div>
      )}

      {clienteData && (
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600 mb-8">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800">{clienteData.usuario}</h2>
              <p className="text-sm text-gray-500">
                CI: <b>{clienteData.ci}</b> | Medidor: <b>{clienteData.medidor}</b>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Dirección: <b>{clienteData.direccion || 'S/D'}</b> — Barrio: <b>{clienteData.barrio || 'S/D'}</b>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={marcarTodo}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded font-semibold hover:bg-blue-100"
              >
                Marcar todo ({clienteData.facturas.length})
              </button>
              {seleccionadas.length > 0 && (
                <button
                  type="button"
                  onClick={desmarcarTodo}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded font-semibold hover:bg-gray-200"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Seleccione las facturas a cobrar (en orden cronológico desde la más antigua):
          </p>

          <div className="space-y-2 mb-6">
            {clienteData.facturas.map((f, index) => {
              const marcada = seleccionadas.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleFactura(index)}
                  className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition ${
                    marcada
                      ? 'bg-green-50 border-green-500 text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {marcada ? (
                      <CheckSquare className="text-green-600" size={22} />
                    ) : (
                      <Square className="text-gray-400" size={22} />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        Período: {f.periodo}{' '}
                        <span className="font-normal text-xs text-gray-500">({f.numero})</span>
                      </p>
                      <p className="text-xs text-gray-500">Vencimiento: {f.vence}</p>
                    </div>
                  </div>
                  <div className="font-bold text-base">
                    ₲ {f.monto.toLocaleString('es-PY')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <span className="text-xs text-gray-500 block">
                Total a Cobrar ({seleccionadas.length} de {clienteData.facturas.length} facturas)
              </span>
              <span className="text-2xl font-bold text-red-600">
                ₲ {totalSeleccionado.toLocaleString('es-PY')}
              </span>
            </div>

            <button
              onClick={() => setModalCobro(true)}
              disabled={seleccionadas.length === 0}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cobrar Seleccionadas
            </button>
          </div>
        </div>
      )}

      {resumenHoy.cobros && resumenHoy.cobros.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mt-6">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Cobros realizados hoy</h3>
            <span className="text-xs text-gray-500">{resumenHoy.atendidos} operaciones</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b text-gray-600">
              <tr>
                <th className="p-2.5">Hora</th>
                <th className="p-2.5">Detalle</th>
                <th className="p-2.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {resumenHoy.cobros.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2.5 text-gray-500">{c.hora}</td>
                  <td className="p-2.5 font-medium text-gray-800">{c.concepto}</td>
                  <td className="p-2.5 text-right font-bold text-green-700">
                    ₲ {Number(c.monto).toLocaleString('es-PY')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCobro && clienteData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-4 border-green-600">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Confirmar Cobro</h2>
            <div className="text-left space-y-2 text-sm text-gray-700">
              <p>
                Usuario: <b>{clienteData.usuario}</b>
              </p>
              <p>
                Facturas seleccionadas: <b>{seleccionadas.length}</b>
              </p>
              <div className="p-3 bg-gray-100 rounded-lg text-center mt-3">
                <span className="text-xs text-gray-500 block">Monto Total a Recibir</span>
                <span className="text-2xl font-bold text-green-700">
                  ₲ {totalSeleccionado.toLocaleString('es-PY')}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalCobro(false)}
                className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarCobro}
                className="px-5 py-2 text-white font-bold rounded-lg bg-green-600 hover:bg-green-700"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
