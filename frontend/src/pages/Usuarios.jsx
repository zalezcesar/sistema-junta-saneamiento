import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Edit2, X, Search } from 'lucide-react';
import Paginacion from '../components/Paginacion';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    ci: '',
    numero_conexion: '',
    direccion: '',
    barrio: 'CENTRO',
    telefono: '',
  });
  const [editandoId, setEditandoId] = useState(null);
  const [zonaImpresion, setZonaImpresion] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(20);

  const cargar = () =>
    fetch('http://localhost:8000/api/usuarios')
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : []));

  useEffect(() => {
    cargar();
  }, []);

  const limpiarFormulario = () => {
    setForm({
      nombre: '',
      ci: '',
      numero_conexion: '',
      direccion: '',
      barrio: 'CENTRO',
      telefono: '',
    });
    setEditandoId(null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const url = editandoId
        ? `http://localhost:8000/api/usuarios/${editandoId}`
        : 'http://localhost:8000/api/usuarios';
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        limpiarFormulario();
        cargar();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al guardar usuario');
      }
    } catch {
      alert('Error de conexión con el servidor');
    }
  };

  const iniciarEdicion = (u) => {
    setEditandoId(u.id);
    setForm({
      nombre: u.nombre || '',
      ci: u.ci || '',
      numero_conexion: u.numero_conexion || '',
      direccion: u.direccion || '',
      barrio: u.barrio || u.zona || 'CENTRO',
      telefono: u.telefono || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ejecutarCambioEstado = async (id) => {
    await fetch(`http://localhost:8000/api/usuarios/${id}/estado`, { method: 'PUT' });
    cargar();
  };

  const imprimirPlanilla = async () => {
    const res = await fetch(`http://localhost:8000/api/usuarios/planilla/${zonaImpresion}`);
    const data = await res.json();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html><head><title>Planilla</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f0f0f0; }
        .consumo-col { width: 100px; }
      </style></head>
      <body>
        <h2>JUNTA DE SANEAMIENTO - PLANILLA DE LECTURA</h2>
        <p><b>Barrio / Zona:</b> ${zonaImpresion} | <b>Fecha:</b> ${new Date().toLocaleDateString('es-PY')}</p>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Medidor</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>CI</th>
              <th>Lect. Anterior</th>
              <th class="consumo-col">Lect. Actual</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (u, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${u.medidor}</td>
                <td>${u.nombre}</td>
                <td>${u.direccion || 'S/D'}</td>
                <td>${u.ci}</td>
                <td>${u.lectura_anterior}</td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body></html>
    `);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };
    iframe.contentWindow.print();
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.ci || '').toLowerCase().includes(q) ||
      (u.numero_conexion || '').toLowerCase().includes(q) ||
      (u.barrio || '').toLowerCase().includes(q)
    );
  });

  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Catastro de Usuarios</h1>
        <div className="flex gap-2 items-center">
          <select
            value={zonaImpresion}
            onChange={(e) => setZonaImpresion(e.target.value)}
            className="border p-2 rounded bg-white"
          >
            <option value="TODAS">Todos los Barrios</option>
            <option value="CENTRO">Centro</option>
            <option value="SAN_ISIDRO">San Isidro</option>
            <option value="VILLA_NUEVA">Villa Nueva</option>
          </select>
          <button
            onClick={imprimirPlanilla}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold flex items-center gap-2 shadow-md"
          >
            <Printer size={18} /> Imprimir Planilla
          </button>
        </div>
      </div>

      <form
        onSubmit={guardar}
        className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-end border border-gray-200"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 font-semibold">Nombre Completo *</label>
          <input
            required
            placeholder="Ej: Juan Pérez"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 font-semibold">CI / RUC *</label>
          <input
            required
            placeholder="Ej: 4521890"
            value={form.ci}
            onChange={(e) => setForm({ ...form, ci: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="w-32">
          <label className="text-xs text-gray-500 font-semibold">N° Medidor *</label>
          <input
            required
            placeholder="Ej: 12345"
            value={form.numero_conexion}
            onChange={(e) => setForm({ ...form, numero_conexion: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 font-semibold">Dirección *</label>
          <input
            required
            placeholder="Ej: Ruta 3 Km 110 / Calle Principal"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-gray-500 font-semibold">Barrio / Zona *</label>
          <input
            required
            list="barrios-lista"
            placeholder="Ej: Centro"
            value={form.barrio}
            onChange={(e) => setForm({ ...form, barrio: e.target.value.toUpperCase() })}
            className="border p-2 rounded w-full"
          />
          <datalist id="barrios-lista">
            <option value="CENTRO" />
            <option value="SAN_ISIDRO" />
            <option value="VILLA_NUEVA" />
          </datalist>
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 font-semibold">Teléfono</label>
          <input
            placeholder="0981..."
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`${
              editandoId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded font-bold`}
          >
            {editandoId ? 'Actualizar' : 'Agregar'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 font-medium flex items-center gap-1"
            >
              <X size={16} /> Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar socio por nombre, CI, medidor o barrio..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            className="border pl-9 pr-3 py-2 rounded w-full text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">CI / RUC</th>
              <th className="p-3">Medidor</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Barrio</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link to={`/ficha/${u.id}`} className="text-blue-600 font-bold hover:underline">
                    {u.nombre}
                  </Link>
                </td>
                <td className="p-3">{u.ci}</td>
                <td className="p-3 font-medium">{u.numero_conexion}</td>
                <td className="p-3 text-gray-600">{u.direccion || 'S/D'}</td>
                <td className="p-3 font-medium">{u.barrio || u.zona || 'S/D'}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      u.estado === 'ACTIVO'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.estado}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => iniciarEdicion(u)}
                    className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold flex items-center gap-1"
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => ejecutarCambioEstado(u.id)}
                    className={`text-xs px-2 py-1 rounded text-white font-medium ${
                      u.estado === 'ACTIVO'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {u.estado === 'ACTIVO' ? 'Cortar' : 'Reconectar'}
                  </button>
                </td>
              </tr>
            ))}
            {usuariosPaginados.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Paginacion
          totalItems={usuariosFiltrados.length}
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
