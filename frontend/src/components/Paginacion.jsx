import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Paginacion({
  totalItems,
  itemsPorPagina,
  paginaActual,
  onCambiarPagina,
  onCambiarItemsPorPagina,
}) {
  if (totalItems === 0) return null;

  const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
  const inicio = (paginaActual - 1) * itemsPorPagina + 1;
  const fin = Math.min(paginaActual * itemsPorPagina, totalItems);

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-3">
        <span>
          Mostrando <b>{inicio}</b>–<b>{fin}</b> de <b>{totalItems}</b> registros
        </span>
        {onCambiarItemsPorPagina && (
          <select
            value={itemsPorPagina}
            onChange={(e) => onCambiarItemsPorPagina(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-xs font-medium"
          >
            <option value={15}>15 por página</option>
            <option value={20}>20 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        <span className="px-2 font-semibold text-gray-700">
          Página {paginaActual} de {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
        >
          Siguiente <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
