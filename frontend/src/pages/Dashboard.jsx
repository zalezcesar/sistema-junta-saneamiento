import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Receipt,
  AlertTriangle,
  LayoutDashboard,
  Wallet,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ClipboardList,
} from 'lucide-react';

export default function Dashboard() {
  const [datos, setDatos] = useState({
    usuarios_activos: 0,
    recaudacion: 0,
    facturas_pendientes: 0,
    deuda_total: 0,
    saldo_caja: 0,
    reclamos_pendientes: 0,
    periodo_actual: '',
    consumo_mes: 0,
    promedio_consumo: 0,
    grafico: [],
    mensual: [],
    ultimos_movimientos: [],
  });

  useEffect(() => {
    fetch(`http://localhost:8000/api/dashboard`)
      .then((r) => r.json())
      .then((d) => setDatos((prev) => ({ ...prev, ...d })));
  }, []);

  const COLORS = ['#10B981', '#EF4444'];
  const totalFacturas = (datos.grafico || []).reduce((acc, item) => acc + (item.value || 0), 0);
  const pagadasCount = datos.grafico?.[0]?.value || 0;
  const porcentajeCobro = totalFacturas > 0 ? Math.round((pagadasCount / totalFacturas) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Gerencial</h1>
          <p className="text-sm text-gray-500">Resumen general operativo y financiero de la Junta</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/cajero"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <CreditCard size={18} /> Ir a Cajero (POS)
          </Link>
          <Link
            to="/carga-rapida"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <ClipboardList size={18} /> Carga Rápida
          </Link>
        </div>
      </div>

      {/* Tarjetas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Users size={20} />
            <h3 className="text-sm font-semibold">Usuarios</h3>
          </div>
          <p className="text-2xl font-bold">{datos.usuarios_activos}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-yellow-600">
            <Receipt size={20} />
            <h3 className="text-sm font-semibold">Pendientes</h3>
          </div>
          <p className="text-2xl font-bold">{datos.facturas_pendientes}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="text-sm font-semibold">Deuda</h3>
          </div>
          <p className="text-2xl font-bold">₲ {Number(datos.deuda_total || 0).toLocaleString('es-PY')}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <LayoutDashboard size={20} />
            <h3 className="text-sm font-semibold">Recaudado</h3>
          </div>
          <p className="text-2xl font-bold">₲ {Number(datos.recaudacion || 0).toLocaleString('es-PY')}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-teal-600">
            <Wallet size={20} />
            <h3 className="text-sm font-semibold">Caja</h3>
          </div>
          <p className="text-2xl font-bold">₲ {Number(datos.saldo_caja || 0).toLocaleString('es-PY')}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-cyan-600">
            <Droplets size={20} />
            <h3 className="text-sm font-semibold">
              Consumo {datos.periodo_actual ? `(${datos.periodo_actual})` : ''}
            </h3>
          </div>
          <p className="text-2xl font-bold">{Number(datos.consumo_mes || 0).toLocaleString('es-PY')} m³</p>
          <p className="text-xs text-gray-500 mt-1">Prom: {datos.promedio_consumo || 0} m³/socio</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-orange-600">
            <Receipt size={20} />
            <h3 className="text-sm font-semibold">Reclamos</h3>
          </div>
          <p className="text-2xl font-bold">{datos.reclamos_pendientes}</p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700">Estado de Facturación</h3>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
              Efectividad de cobro: {porcentajeCobro}%
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos.grafico}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(datos.grafico || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Facturado vs. Recaudado por Período</h3>
          {datos.mensual && datos.mensual.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.mensual} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₲${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `₲ ${Number(value).toLocaleString('es-PY')}`} />
                  <Legend />
                  <Bar dataKey="Facturado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recaudado" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Aún no hay suficientes períodos facturados para comparar.
            </div>
          )}
        </div>
      </div>

      {/* Últimos movimientos de caja */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-700">Últimos Movimientos de Caja</h3>
          <Link to="/caja" className="text-sm text-blue-600 hover:underline font-medium">
            Ver todos →
          </Link>
        </div>
        {datos.ultimos_movimientos && datos.ultimos_movimientos.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {datos.ultimos_movimientos.map((m) => (
              <div key={m.id} className="py-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  {m.tipo === 'INGRESO' ? (
                    <span className="p-1.5 rounded-full bg-green-100 text-green-700">
                      <ArrowUpRight size={16} />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-full bg-red-100 text-red-700">
                      <ArrowDownRight size={16} />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{m.concepto}</p>
                    <p className="text-xs text-gray-400">{m.fecha}</p>
                  </div>
                </div>
                <span className={`font-bold ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'INGRESO' ? '+' : '-'} ₲ {Number(m.monto).toLocaleString('es-PY')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No hay movimientos registrados en caja todavía.</p>
        )}
      </div>
    </div>
  );
}
