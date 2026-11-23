import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, Receipt, AlertTriangle, Wallet, LogOut, Settings } from 'lucide-react'

export default function Layout({ children }) {
  const rol = localStorage.getItem('rol') || 'ADMIN';
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-xl font-bold tracking-wider text-blue-400 border-b border-gray-800 flex items-center gap-2">
          <BookOpen size={24}/> AGUASYS
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {rol === 'ADMIN' && (
            <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
              <LayoutDashboard size={20}/> Dashboard
            </Link>
          )}

          {(rol === 'ADMIN' || rol === 'CAJERO') && (
            <Link to="/cajero" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
              <Wallet size={20}/> Cajero (POS)
            </Link>
          )}

          {rol === 'ADMIN' && (
            <Link to="/usuarios" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
              <Users size={20}/> Usuarios
            </Link>
          )}

          {rol === 'ADMIN' && (
            <>
              <Link to="/facturacion" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
                <Receipt size={20}/> Facturación
              </Link>
              {/* OPCIÓN 2: CARGA RÁPIDA (Para la oficina) */}
              <Link to="/carga-rapida" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-green-400 hover:text-green-300">
                <BookOpen size={20}/> Carga Rápida
              </Link>
              <Link to="/caja" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
                <Wallet size={20}/> Tesorería
              </Link>
              <Link to="/reclamos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-orange-400 hover:text-orange-300">
                <AlertTriangle size={20}/> Reclamos
              </Link>
              <Link to="/morosos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-red-400 hover:text-red-300">
                <AlertTriangle size={20}/> Morosos
              </Link>
              <Link to="/usuarios-sistema" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-purple-400 hover:text-purple-300">
                <Users size={20}/> Empleados
              </Link>
              <Link to="/configuracion" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
                <Settings size={20}/> Configuración
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to="/" onClick={() => { localStorage.removeItem('rol'); localStorage.removeItem('zona'); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 text-gray-300 hover:text-white">
            <LogOut size={20}/> Cerrar Sesión
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
