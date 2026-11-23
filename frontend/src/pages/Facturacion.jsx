import React, { useState, useEffect } from 'react';
import { Printer, Search, Ban } from 'lucide-react';
import Paginacion from '../components/Paginacion';

export default function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [cfg, setCfg] = useState({
    nombre_junta: 'JUNTA DE SANEAMIENTO',
    subtitulo: '"25 DE DICIEMBRE"',
    direccion: 'RUTA N° 3 GRAL ELIZARDO AQUINO - TEL. 0451 230067',
    ciudad: '25 DE DICIEMBRE - DPTO. SAN PEDRO - PARAGUAY',
    ruc: '80053205-8',
    timbrado: '18877580',
    vigencia_inicio: '26/05/2026',
    vigencia_fin: '31/05/2027',
    tarifa_minima: 13350,
    m3_minimo: 10,
    porc_iva: 10,
    porc_erssan: 2,
  });
  const [periodo, setPeriodo] = useState('2026-11');
  const [filtroPeriodo, setFiltroPeriodo] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [msg, setMsg] = useState('');
  const [modalCierre, setModalCierre] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(25);

  const cargar = () => {
    fetch('http://localhost:8000/api/facturas')
      .then((r) => r.json())
      .then((d) => setFacturas(Array.isArray(d) ? d : []));
    fetch('http://localhost:8000/api/configuracion')
      .then((r) => r.json())
      .then((c) => {
        if (c && c.timbrado) setCfg(c);
      });
  };

  useEffect(() => {
    cargar();
  }, []);

  const ejecutarCierre = async () => {
    const res = await fetch(`http://localhost:8000/api/facturacion/cierre-mes/${periodo}`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✅ ${data.mensaje}`);
      setPaginaActual(1);
      cargar();
    } else {
      setMsg(`❌ ${data.detail}`);
    }
    setModalCierre(false);
  };

  const anularFactura = async (f) => {
    if (
      !window.confirm(
        `¿Seguro que desea ANULAR la factura ${f.numero} de ${f.usuario}? Esto liberará la lectura del período ${f.periodo} para poder corregirla y refacturar.`
      )
    )
      return;
    const res = await fetch(`http://localhost:8000/api/facturas/${f.id}/anular`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✅ ${data.mensaje}`);
      cargar();
    } else {
      setMsg(`❌ ${data.detail}`);
    }
  };

  const generarHtmlBoleta = (f) => {
    const subtotal = (f.monto_agua || 0) + (f.atrasos || 0);
    const tarifaMin = Number(cfg.tarifa_minima) || 13350;
    const importeMinimo = Math.min(f.monto_agua || 0, tarifaMin);
    const importeExcedente = Math.max(0, (f.monto_agua || 0) - tarifaMin);

    const ultimos3 = (f.historial || []).slice(0, 3);
    while (ultimos3.length < 3) {
      ultimos3.push({ periodo: '-', consumo: '-', total: null, estado: '' });
    }

    return `
      <div class="boleta-page">
        <div class="factura-container">
          <div class="header">
            <div class="header-left">
              <h1>${cfg.nombre_junta}</h1>
              <p>${cfg.subtitulo}</p>
              <p>${cfg.direccion}</p>
              <p>${cfg.ciudad}</p>
            </div>
            <div class="header-right">
              <p><b>TIMBRADO N°:</b> ${cfg.timbrado}</p>
              <p><b>FECHA INICIO VIGENCIA:</b> ${cfg.vigencia_inicio}</p>
              <p><b>FECHA FIN VIGENCIA:</b> ${cfg.vigencia_fin}</p>
              <p><b>RUC:</b> ${cfg.ruc}</p>
              <h2>${f.numero}</h2>
            </div>
          </div>

          <div class="info-cliente">
            <div>
              <p>CODIGORUC: <span>${f.ci}</span></p>
              <p>NOMBRE: <span>${f.usuario}</span></p>
              <p>DIRECCION: <span>${f.direccion || 'S/D'}</span></p>
              <p>BARRIO: <span>${f.barrio || 'S/D'}</span></p>
              <p>N° DE MEDIDOR: <span>${f.medidor}</span></p>
            </div>
            <div style="text-align: right;">
              <p>N° DE FACTURA: <span>${f.numero}</span></p>
              <p>FECHA DE EMISION: <span>${new Date().toLocaleDateString('es-PY')}</span></p>
              <p>VENCIMIENTO: <span>${f.vence}</span></p>
            </div>
          </div>

          <div class="cuerpo">
            <div class="col-izq">
              <div>
                <div class="medidor-titulo">ESTADO DEL MEDIDOR</div>
                <table class="medidor-tabla">
                  <thead><tr><th>ANTERIOR</th><th>ACTUAL</th><th>DIF.</th></tr></thead>
                  <tbody>
                    <tr>
                      <td>${f.lectura_anterior} <br><small>${f.fecha_anterior}</small></td>
                      <td>${f.lectura_actual} <br><small>${f.fecha_actual}</small></td>
                      <td>${f.consumo} M3 <br><small>${f.dias} DIAS</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="aviso-box">
                ${(f.atrasos || 0) > 0 ? 'ULTIMO AVISO!!!!' : ''}
              </div>

              <div>
                <div class="consumos-titulo">CONSUMOS ANTERIORES (ÚLTIMOS 3)</div>
                <table class="consumos-tabla">
                  <thead><tr><th>MES</th><th>M3</th><th>IMPORTE</th><th>SITUACION</th></tr></thead>
                  <tbody>
                    ${ultimos3
                      .map(
                        (h) => `
                      <tr>
                        <td>${h.periodo}</td>
                        <td>${h.consumo}</td>
                        <td>${h.total !== null ? Number(h.total).toLocaleString('es-PY') : '-'}</td>
                        <td>${h.estado ? (h.estado === 'PAGADA' ? 'CANCELADO' : 'PENDIENTE') : '-'}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="col-der">
              <div class="detalle-titulo">CONSUMO EN M3</div>
              <table class="medidor-tabla" style="border-bottom: 1px solid #1e3a8a;">
                <thead><tr><th>CONCEPTO</th><th>MINIMO</th><th>EXCEDENTE</th><th>TOTAL</th></tr></thead>
                <tbody>
                  <tr>
                    <td><b>M3</b></td>
                    <td>${cfg.m3_minimo}</td>
                    <td>${f.excedente || 0}</td>
                    <td>${f.consumo}</td>
                  </tr>
                  <tr>
                    <td><b>IMPORTES</b></td>
                    <td>${importeMinimo.toLocaleString('es-PY')}</td>
                    <td>${importeExcedente.toLocaleString('es-PY')}</td>
                    <td>${(f.monto_agua || 0).toLocaleString('es-PY')}</td>
                  </tr>
                </tbody>
              </table>

              <div class="detalle-titulo">DETALLE DE LA FACTURACION</div>
              <table class="detalle-tabla">
                <tr><td>Importe del Mes:</td><td class="monto">₲ ${(f.monto_agua || 0).toLocaleString('es-PY')}</td></tr>
                <tr><td>Medidor:</td><td class="monto">0</td></tr>
                <tr><td>Conexión:</td><td class="monto">0</td></tr>
                <tr><td>Facturas Atrasadas:</td><td class="monto">₲ ${(f.atrasos || 0).toLocaleString('es-PY')}</td></tr>
                <tr><td><b>Sub-Total:</b></td><td class="monto"><b>₲ ${subtotal.toLocaleString('es-PY')}</b></td></tr>
                <tr><td>Iva (${cfg.porc_iva}%):</td><td class="monto">₲ ${(f.iva || 0).toLocaleString('es-PY')}</td></tr>
                <tr><td>Erssan (${cfg.porc_erssan}%):</td><td class="monto">₲ ${(f.ersan || 0).toLocaleString('es-PY')}</td></tr>
                <tr><td>Importe de Redondeo:</td><td class="monto">₲ ${(f.redondeo || 0).toFixed(0)}</td></tr>
                <tr class="total-row"><td>TOTAL A PAGAR:</td><td class="monto">₲ ${(f.total || 0).toLocaleString('es-PY')}</td></tr>
              </table>
            </div>
          </div>
        </div>

        <div class="linea-corte"><span>✂ CORTE AQUÍ ✂</span></div>

        <div class="talon-junta">
          <div>
            <p><b>TALÓN DE COMPROBANTE - JUNTA</b></p>
            <p>Factura N°: ${f.numero} | Fecha: ${new Date().toLocaleDateString('es-PY')}</p>
            <p>Usuario: ${f.usuario} | CI: ${f.ci}</p>
          </div>
          <div style="text-align: right;">
            <p><b>TOTAL:</b> ₲ ${(f.total || 0).toLocaleString('es-PY')}</p>
            <p>Firma Cajero: _________________</p>
          </div>
        </div>
      </div>
    `;
  };

  const abrirVentanaImpresion = (titulo, listaBoletas) => {
    if (!listaBoletas || listaBoletas.length === 0) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html><head><title>${titulo}</title>
      <style>
        @page { size: auto; margin: 5mm; }
        body { font-family: 'Arial', sans-serif; padding: 0; margin: 0; color: #000; font-size: 11px; }
        .boleta-page { page-break-after: always; }
        .boleta-page:last-child { page-break-after: auto; }
        .factura-container { border: 2px solid #1e3a8a; width: 100%; max-width: 800px; margin: 0 auto; }
        
        .header { display: flex; border-bottom: 2px solid #1e3a8a; }
        .header-left { width: 60%; padding: 10px; }
        .header-left h1 { color: #1e3a8a; margin: 0; font-size: 18px; text-transform: uppercase; font-weight: bold; }
        .header-left p { margin: 2px 0; font-size: 10px; font-weight: bold; }
        .header-right { width: 40%; text-align: right; padding: 10px; border-left: 2px solid #1e3a8a; }
        .header-right p { margin: 2px 0; font-size: 10px; font-weight: bold; }
        .header-right h2 { margin: 5px 0 0 0; font-size: 22px; font-weight: bold; }

        .info-cliente { display: flex; padding: 10px; border-bottom: 2px solid #1e3a8a; }
        .info-cliente div { width: 50%; }
        .info-cliente p { margin: 3px 0; font-size: 11px; font-weight: bold; }
        .info-cliente span { font-weight: normal; }

        .cuerpo { display: flex; }
        .col-izq { width: 45%; border-right: 2px solid #1e3a8a; display: flex; flex-direction: column; justify-content: space-between; }
        .medidor-titulo { text-align: center; font-weight: bold; border-bottom: 1px solid #1e3a8a; padding: 5px; background: #f0f4f8; }
        .medidor-tabla { width: 100%; border-collapse: collapse; text-align: center; }
        .medidor-tabla th, .medidor-tabla td { border: 1px solid #1e3a8a; padding: 5px; }
        .medidor-tabla th { background-color: #f0f4f8; }

        .aviso-box { text-align: center; font-weight: bold; font-size: 15px; padding: 22px 5px; letter-spacing: 0.5px; }
        
        .consumos-titulo { text-align: center; font-weight: bold; border-top: 1px solid #1e3a8a; border-bottom: 1px solid #1e3a8a; padding: 5px; background: #f0f4f8; }
        .consumos-tabla { width: 100%; border-collapse: collapse; text-align: center; }
        .consumos-tabla th, .consumos-tabla td { padding: 4px; border: 1px solid #1e3a8a; }
        .consumos-tabla th { background-color: #f0f4f8; font-size: 10px; }

        .col-der { width: 55%; padding: 0; }
        .detalle-titulo { text-align: center; font-weight: bold; padding: 5px; text-transform: uppercase; border-bottom: 1px solid #1e3a8a; background: #f0f4f8; }
        .detalle-tabla { width: 100%; border-collapse: collapse; }
        .detalle-tabla td { padding: 5px 10px; }
        .detalle-tabla .monto { text-align: right; }
        .total-row { border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; font-size: 16px; font-weight: bold; }
        .total-row td { padding: 10px; }

        .linea-corte { border-top: 2px dashed #000; margin: 20px 0; position: relative; }
        .linea-corte span { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 10px; font-size: 12px; }
        
        .talon-junta { border: 2px solid #1e3a8a; padding: 10px; display: flex; justify-content: space-between; align-items: center; }
        
        @media print { 
          body { padding: 0; } 
          .factura-container { border: 2px solid #1e3a8a; } 
        }
      </style></head>
      <body>
        ${listaBoletas.map(generarHtmlBoleta).join('')}
      </body></html>
    `);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };
    iframe.contentWindow.print();
  };

  const imprimirFactura = (f) => {
    abrirVentanaImpresion(`Factura ${f.numero}`, [f]);
  };

  const periodosDisponibles = [...new Set(facturas.map((f) => f.periodo))].sort().reverse();

  const facturasFiltradas = facturas.filter((f) => {
    const coincidePeriodo = filtroPeriodo === 'TODOS' || f.periodo === filtroPeriodo;
    const coincideEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado;
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      (f.usuario || '').toLowerCase().includes(q) ||
      (f.medidor || '').toLowerCase().includes(q) ||
      (f.numero || '').toLowerCase().includes(q) ||
      (f.ci || '').toLowerCase().includes(q);
    return coincidePeriodo && coincideEstado && coincideTexto;
  });

  const facturasParaLote = facturasFiltradas.filter((f) => f.estado !== 'ANULADA');

  const imprimirLote = () => {
    if (facturasParaLote.length === 0) return;
    abrirVentanaImpresion('Facturas en Lote', facturasParaLote);
  };

  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indiceInicio, indiceInicio + itemsPorPagina);

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Facturación Masiva</h1>
        <div className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border p-1 rounded"
          />
          <button
            onClick={() => setModalCierre(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium"
          >
            Cerrar Mes
          </button>
        </div>
      </div>

      {msg && <div className="bg-blue-100 text-blue-800 p-3 mb-4 rounded font-medium">{msg}</div>}

      <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar socio, medidor o factura..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="border pl-9 pr-3 py-1.5 rounded w-full text-sm"
            />
          </div>

          <select
            value={filtroPeriodo}
            onChange={(e) => {
              setFiltroPeriodo(e.target.value);
              setPaginaActual(1);
            }}
            className="border p-1.5 rounded text-sm bg-white"
          >
            <option value="TODOS">Todos los períodos</option>
            {periodosDisponibles.map((p) => (
              <option key={p} value={p}>
                Período: {p}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPaginaActual(1);
            }}
            className="border p-1.5 rounded text-sm bg-white"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGADA">Pagadas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
        </div>

        <button
          onClick={imprimirLote}
          disabled={facturasParaLote.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={16} /> Imprimir Lote ({facturasParaLote.length})
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Factura</th>
              <th className="p-3">Período</th>
              <th className="p-3">Medidor</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Consumo</th>
              <th className="p-3">Total</th>
              <th className="p-3">Saldo</th>
              <th className="p-3">Vencimiento</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturasPaginadas.map((f) => (
              <tr key={f.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{f.numero}</td>
                <td className="p-3 font-semibold text-gray-700">{f.periodo}</td>
                <td className="p-3 text-gray-600">{f.medidor}</td>
                <td className="p-3">{f.usuario}</td>
                <td className="p-3">{f.consumo} m³</td>
                <td className="p-3 font-bold">₲ {f.total.toLocaleString('es-PY')}</td>
                <td className="p-3 font-bold text-red-600">₲ {f.saldo.toLocaleString('es-PY')}</td>
                <td className="p-3 text-gray-600">{f.vence || '-'}</td>
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
                <td className="p-3 flex items-center gap-3">
                  {f.estado !== 'ANULADA' && (
                    <button
                      onClick={() => imprimirFactura(f)}
                      className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium"
                    >
                      <Printer size={16} /> Imprimir
                    </button>
                  )}
                  {f.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => anularFactura(f)}
                      className="flex items-center gap-1 text-red-600 hover:underline text-xs font-medium"
                    >
                      <Ban size={15} /> Anular
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {facturasPaginadas.length === 0 && (
              <tr>
                <td colSpan="10" className="p-6 text-center text-gray-500">
                  No se encontraron facturas con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Paginacion
          totalItems={facturasFiltradas.length}
          itemsPorPagina={itemsPorPagina}
          paginaActual={paginaActual}
          onCambiarPagina={setPaginaActual}
          onCambiarItemsPorPagina={(cant) => {
            setItemsPorPagina(cant);
            setPaginaActual(1);
          }}
        />
      </div>

      {modalCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Cierre de Mes</h2>
            <p className="text-gray-600 mb-6 text-center">
              ¿Generar facturas para el período <b>{periodo}</b>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalCierre(false)}
                className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarCierre}
                className="px-5 py-2 text-white font-bold rounded-lg bg-red-600"
              >
                Generar Facturas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
