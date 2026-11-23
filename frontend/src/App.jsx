import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cajero from './pages/Cajero'
import Usuarios from './pages/Usuarios'
import FichaUsuario from './pages/FichaUsuario'
import Facturacion from './pages/Facturacion'
import Caja from './pages/Caja'
import Morosos from './pages/Morosos'
import Reclamos from './pages/Reclamos'
import CargaRapida from './pages/CargaRapida'
import Empleados from './pages/Empleados'
import Configuracion from './pages/Configuracion'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/cajero" element={<Layout><Cajero /></Layout>} />
        <Route path="/usuarios" element={<Layout><Usuarios /></Layout>} />
        <Route path="/ficha/:id" element={<Layout><FichaUsuario /></Layout>} />
        <Route path="/facturacion" element={<Layout><Facturacion /></Layout>} />
        <Route path="/morosos" element={<Layout><Morosos /></Layout>} />
        <Route path="/caja" element={<Layout><Caja /></Layout>} />
        <Route path="/reclamos" element={<Layout><Reclamos /></Layout>} />
        <Route path="/carga-rapida" element={<Layout><CargaRapida /></Layout>} />
        <Route path="/usuarios-sistema" element={<Layout><Empleados /></Layout>} />
        <Route path="/configuracion" element={<Layout><Configuracion /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
