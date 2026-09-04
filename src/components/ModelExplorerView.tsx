import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  SlidersHorizontal,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ArchiMateElement, ArchiMateLayer, ArchiMateModel } from '../types';
import { LAYER_CONFIG } from './LayerFilterBar';

interface ModelExplorerViewProps {
  model: ArchiMateModel;
  selectedLayers: Set<ArchiMateLayer>;
  onSelectElementForImpact: (elementId: string) => void;
}

export const ModelExplorerView: React.FC<ModelExplorerViewProps> = ({
  model,
  selectedLayers,
  onSelectElementForImpact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [inspectedElement, setInspectedElement] = useState<ArchiMateElement | null>(null);

  // Available element types
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    model.elementsList.forEach((e) => types.add(e.type));
    return ['All', ...Array.from(types).sort()];
  }, [model.elementsList]);

  // Filtered elements
  const filteredElements = useMemo(() => {
    return model.elementsList.filter((el) => {
      const matchLayer = selectedLayers.has(el.layer);
      const matchType = selectedType === 'All' || el.type === selectedType;
      const matchSearch =
        !searchTerm ||
        el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (el.documentation && el.documentation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        el.properties.some((p) => p.value.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchLayer && matchType && matchSearch;
    });
  }, [model.elementsList, selectedLayers, selectedType, searchTerm]);

  // Related connections for inspected element
  const inspectedRelationships = useMemo(() => {
    if (!inspectedElement) return { incoming: [], outgoing: [] };
    const incoming = model.relationships.filter((r) => r.targetId === inspectedElement.id);
    const outgoing = model.relationships.filter((r) => r.sourceId === inspectedElement.id);
    return { incoming, outgoing };
  }, [model.relationships, inspectedElement]);

  return (
    <div id="model-explorer-view" className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documentación o propiedades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Tipo ArchiMate:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 font-medium"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'Todos los tipos' : t}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {filteredElements.length} elementos
          </span>
        </div>
      </div>

      {/* Main Grid: Table & Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Elements Table */}
        <div
          className={`${
            inspectedElement ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden`}
        >
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Elemento</th>
                  <th className="py-2.5 px-3">Capa</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-center">Conexiones</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredElements.map((el) => {
                  const config = LAYER_CONFIG[el.layer];
                  const isInspected = inspectedElement?.id === el.id;

                  return (
                    <tr
                      key={el.id}
                      onClick={() => setInspectedElement(el)}
                      className={`cursor-pointer transition-colors ${
                        isInspected ? 'bg-cyan-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 line-clamp-1">{el.name}</div>
                        {el.properties.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex gap-1">
                            {el.properties.map((p, idx) => (
                              <span key={idx} className="bg-slate-100 px-1 py-0.2 rounded">
                                {p.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text} border ${config.border}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: config.dotColor }}
                          />
                          {config.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {el.type}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {el.totalDegree}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElementForImpact(el.id);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded transition-colors"
                        >
                          <span>Impacto</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Inspector Panel */}
        {inspectedElement && (
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 sticky top-24">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ficha Técnica ArchiMate
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {inspectedElement.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedElement(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Capa:</span>
                <span className="font-semibold text-slate-800">
                  {LAYER_CONFIG[inspectedElement.layer].name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tipo Metamodelo:</span>
                <span className="font-semibold text-slate-800">{inspectedElement.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ID Elemento:</span>
                <span className="font-mono text-[10px] text-slate-600 truncate block">
                  {inspectedElement.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Grado Conectividad:</span>
                <span className="font-semibold text-slate-800">
                  {inspectedElement.inDegree} in / {inspectedElement.outDegree} out
                </span>
              </div>
            </div>

            {/* Documentation text */}
            {inspectedElement.documentation && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Documentación / Especificaciones:</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line text-[11px]">
                  {inspectedElement.documentation}
                </div>
              </div>
            )}

            {/* Properties */}
            {inspectedElement.properties.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">Propiedades y Metadatos:</span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {inspectedElement.properties.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100 text-[11px]"
                    >
                      <span className="text-slate-500 font-medium">{p.name || p.key}:</span>
                      <span className="font-semibold text-slate-800">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships summary */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">Relaciones Directas:</span>
              <div className="text-[11px] text-slate-600 space-y-1 max-h-36 overflow-y-auto">
                {inspectedRelationships.outgoing.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-cyan-800">
                    <span className="text-slate-400">→</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">{r.type}</span>
                    <span className="truncate">{r.targetName}</span>
                  </div>
                ))}
                {inspectedRelationships.incoming.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-indigo-800">
                    <span className="text-slate-400">←</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">{r.type}</span>
                    <span className="truncate">{r.sourceName}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectElementForImpact(inspectedElement.id)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ejecutar Análisis de Impacto</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
