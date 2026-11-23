import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Paginacion from '../components/Paginacion';

export default function FichaUsuario() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    setPagina(1);
    fetch(`http://localhost:8000/api/usuarios/${id}/ficha`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar la ficha');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-600 font-bold">❌ {error}</div>;
  if (!data) return <div className="p-8">Cargando ficha...</div>;

  const { usuario, lecturas, facturas } = data;

  const deudaTotal = facturas
    .filter((f) => f.estado === 'PENDIENTE')
    .reduce((acc, f) => acc + (f.saldo || 0), 0);

  const ultimaLectura = lecturas && lecturas.length > 0 ? lecturas[0] : null;

  const indiceInicio = (pagina - 1) * porPagina;
  const facturasPaginadas = facturas.slice(indiceInicio, indiceInicio + porPagina);

  const enviarWhatsapp = () => {
    const tel = (usuario.telefono || '').replace(/\D/g, '');
    if (!tel) {
      alert('El usuario no tiene número de teléfono registrado.');
      return;
    }
    const numero = tel.startsWith('595') ? tel : `595${tel.replace(/^0/, '')}`;
    const texto = encodeURIComponent(
      `Hola ${usuario.nombre}, le recordamos que tiene un saldo pendiente de ₲ ${deudaTotal.toLocaleString('es-PY')} en la Junta de Saneamiento 25 de Diciembre.`
    );
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        to="/usuarios"
        className="text-blue-600 font-medium mb-4 inline-flex items-center gap-2 hover:underline"
      >
        <ArrowLeft size={16} /> Volver a Usuarios
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{usuario.nombre}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-600 text-sm mt-4">
            <p><strong>CI:</strong> {usuario.ci}</p>
            <p><strong>Medidor:</strong> {usuario.numero_conexion}</p>
            <p><strong>Barrio:</strong> {usuario.barrio || 'S/D'}</p>
            <p><strong>Teléfono:</strong> {usuario.telefono || '-'}</p>
            <p><strong>Dirección:</strong> {usuario.direccion || 'S/D'}</p>
            <p>
              <strong>Estado:</strong>{' '}
              <span className={usuario.estado === 'ACTIVO' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {usuario.estado}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
            <p className="text-sm text-red-800 mb-1">Deuda Total</p>
            <p className="text-3xl font-bold text-red-600">₲ {deudaTotal.toLocaleString('es-PY')}</p>
          </div>
          <button
            onClick={enviarWhatsapp}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle size={20} /> WhatsApp
          </button>
        </div>
      </div>

      {ultimaLectura && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span className="text-blue-800 font-medium">
            Última Lectura ({ultimaLectura.periodo}):
          </span>
          <span className="text-xl font-bold text-blue-900">
            {ultimaLectura.lectura_actual} m³ (Anterior: {ultimaLectura.lectura_anterior} m³ — Consumo: {ultimaLectura.consumo_m3} m³)
          </span>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200 mt-6">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-700">Historial de Facturas</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Factura</th>
              <th className="p-3">Período</th>
              <th className="p-3">Consumo</th>
              <th className="p-3">Total</th>
              <th className="p-3">Saldo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Vence</th>
            </tr>
          </thead>
          <tbody>
            {facturasPaginadas.map((f) => (
              <tr key={f.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{f.numero}</td>
                <td className="p-3">{f.periodo}</td>
                <td className="p-3">{f.consumo} m³</td>
                <td className="p-3 font-bold">₲ {f.total.toLocaleString('es-PY')}</td>
                <td className="p-3 font-bold text-red-600">₲ {f.saldo.toLocaleString('es-PY')}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      f.estado === 'PAGADA'
                        ? 'bg-green-100 text-green-800'
                        : f.estado === 'ANULADA'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {f.estado}
                  </span>
                </td>
                <td className="p-3">{f.vence || '-'}</td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Este usuario todavía no tiene facturas generadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {facturas.length > 0 && (
          <Paginacion
            totalItems={facturas.length}
            itemsPorPagina={porPagina}
            paginaActual={pagina}
            onCambiarPagina={setPagina}
            onCambiarPorPagina={(n) => {
              setPorPagina(n);
              setPagina(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
