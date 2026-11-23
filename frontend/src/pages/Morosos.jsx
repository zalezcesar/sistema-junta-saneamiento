import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';

export default function Morosos() {
  const [morosos, setMorosos] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/reportes/morosos`)
      .then((r) => r.json())
      .then((d) => setMorosos(Array.isArray(d) ? d : []));
  }, []);

  const totalDeuda = morosos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const imprimirLista = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html><head><title>Reporte de Morosos</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
        h2 { text-align: center; margin-bottom: 5px; }
        p.sub { text-align: center; font-size: 12px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 12px; }
        th { background-color: #f3f4f6; }
        .monto { text-align: right; font-weight: bold; }
        .resumen { margin-top: 15px; text-align: right; font-size: 14px; font-weight: bold; }
      </style></head>
      <body>
        <h2>JUNTA DE SANEAMIENTO - HOJA DE MOROSOS Y CORTE</h2>
        <p class="sub">Fecha de emisión: ${new Date().toLocaleDateString('es-PY')} | Total en mora: ${morosos.length} factura(s)</p>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Usuario</th>
              <th>Medidor</th>
              <th>Factura</th>
              <th>Días Mora</th>
              <th style="text-align: right;">Monto</th>
              <th style="width: 120px;">Observación</th>
            </tr>
          </thead>
          <tbody>
            ${morosos
              .map(
                (m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${m.usuario}</td>
                <td>${m.medidor}</td>
                <td>${m.factura}</td>
                <td>${m.dias_mora} días</td>
                <td class="monto">₲ ${Number(m.monto).toLocaleString('es-PY')}</td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="resumen">TOTAL ADEUDADO EN MORA: ₲ ${totalDeuda.toLocaleString('es-PY')}</div>
      </body></html>
    `);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };
    iframe.contentWindow.print();
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Reporte de Morosos</h1>
          <p className="text-sm text-gray-500">
            {morosos.length} factura(s) vencida(s) — Total adeudado:{' '}
            <b className="text-red-700">₲ {totalDeuda.toLocaleString('es-PY')}</b>
          </p>
        </div>

        {morosos.length > 0 && (
          <button
            onClick={imprimirLista}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 shadow"
          >
            <Printer size={18} /> Imprimir Lista
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-50 border-b border-red-200">
            <tr>
              <th className="p-3 text-red-800">Usuario</th>
              <th className="p-3 text-red-800">Medidor</th>
              <th className="p-3 text-red-800">Factura</th>
              <th className="p-3 text-red-800">Monto</th>
              <th className="p-3 text-red-800">Días Mora</th>
            </tr>
          </thead>
          <tbody>
            {morosos.map((m, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{m.usuario}</td>
                <td className="p-3">{m.medidor}</td>
                <td className="p-3">{m.factura}</td>
                <td className="p-3 text-red-600 font-bold">
                  ₲ {Number(m.monto).toLocaleString('es-PY')}
                </td>
                <td className="p-3 font-bold bg-red-100 text-red-800">
                  {m.dias_mora} días
                </td>
              </tr>
            ))}
            {morosos.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  🎉 No hay morosos vencidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
