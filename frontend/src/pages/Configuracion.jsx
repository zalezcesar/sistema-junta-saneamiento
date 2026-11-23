import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000';

const SECCIONES = [
  {
    titulo: 'Datos de la Junta',
    campos: [
      ['nombre_junta', 'Nombre de la Junta', 'text', true],
      ['subtitulo', 'Subtítulo (ej: "25 DE DICIEMBRE")', 'text'],
      ['direccion', 'Dirección', 'text'],
      ['ciudad', 'Ciudad / Departamento / País', 'text'],
      ['telefono', 'Teléfono', 'text'],
      ['ruc', 'RUC', 'text', true],
    ],
  },
  {
    titulo: 'Timbrado y numeración',
    campos: [
      ['timbrado', 'N° de Timbrado', 'text', true],
      ['vigencia_inicio', 'Inicio de vigencia', 'date', true],
      ['vigencia_fin', 'Fin de vigencia', 'date', true],
      ['establecimiento', 'Establecimiento', 'text', true],
      ['punto_expedicion', 'Punto de expedición', 'text', true],
    ],
  },
  {
    titulo: 'Tarifas e impuestos',
    campos: [
      ['tarifa_minima', 'Tarifa mínima (₲)', 'number', true],
      ['m3_minimo', 'm³ incluidos en el mínimo', 'number', true],
      ['precio_excedente', 'Precio por m³ excedente (₲)', 'number', true],
      ['porc_iva', 'IVA (%)', 'number', true],
      ['porc_erssan', 'Erssan (%)', 'number', true],
      ['dias_vencimiento', 'Días hasta el vencimiento', 'number', true],
    ],
  },
];

const ANCHO_COMPLETO = ['nombre_junta', 'ciudad', 'direccion'];

export default function Configuracion() {
  const [cfg, setCfg] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/configuracion`)
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => {
        setError(true);
        setMsg('❌ No se pudo cargar la configuración');
      });
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setMsg('');
    setError(false);
    try {
      const res = await fetch(`${API}/api/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (res.ok) {
        setCfg(data);
        setMsg('✅ Configuración guardada');
      } else {
        setError(true);
        setMsg(`❌ ${typeof data.detail === 'string' ? data.detail : 'Revise los datos ingresados'}`);
      }
    } catch {
      setError(true);
      setMsg('❌ Error de conexión');
    }
  };

  if (!cfg) return <div className="p-8">{msg || 'Cargando...'}</div>;

  const hoy = new Date().toISOString().slice(0, 10);
  const vencido = cfg.vigencia_fin && cfg.vigencia_fin < hoy;
  const noVigente = cfg.vigencia_inicio && cfg.vigencia_inicio > hoy;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuración de la Junta</h1>

      {vencido && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-bold">
          ⚠️ El timbrado está vencido. Cargue el nuevo antes de generar facturas.
        </div>
      )}
      {noVigente && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 font-bold">
          ⚠️ El timbrado todavía no está vigente.
        </div>
      )}
      {msg && (
        <div className={`p-3 rounded mb-4 font-medium ${error ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={guardar} className="flex flex-col gap-6">
        {SECCIONES.map((sec) => (
          <div key={sec.titulo} className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4">{sec.titulo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.campos.map(([k, label, type, req]) => (
                <div key={k} className={ANCHO_COMPLETO.includes(k) ? 'md:col-span-2' : ''}>
                  <label className="text-xs text-gray-500 font-medium">{label}</label>
                  <input
                    required={!!req}
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    min={type === 'number' ? '0' : undefined}
                    value={cfg[k] ?? ''}
                    onChange={(e) =>
                      setCfg({
                        ...cfg,
                        [k]: type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value,
                      })
                    }
                    className="border p-2 rounded w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
          Última factura emitida con el timbrado actual:{' '}
          <b>
            {cfg.establecimiento || '001'}-{cfg.punto_expedicion || '001'}-{String(cfg.ultimo_numero || 0).padStart(7, '0')}
          </b>
          . Las facturas ya emitidas no se recalculan si cambia una tarifa.
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
          Guardar configuración
        </button>
      </form>
    </div>
  );
}