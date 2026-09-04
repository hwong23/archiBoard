import React, { useState, useMemo } from 'react';
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { ArchiMateModel, ArchiMateLayer } from '../types';
import { calculateImpact } from '../utils/architectureAnalysis';
import { LAYER_CONFIG } from './LayerFilterBar';

interface ImpactAnalysisViewProps {
  model: ArchiMateModel;
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
}

export const ImpactAnalysisView: React.FC<ImpactAnalysisViewProps> = ({
  model,
  selectedElementId,
  onSelectElement,
}) => {
  const [depth, setDepth] = useState<number>(3);
  const [searchFilter, setSearchFilter] = useState('');

  // Default to first hub or first element if none selected
  const activeId = useMemo(() => {
    if (selectedElementId && model.elements.has(selectedElementId)) {
      return selectedElementId;
    }
    // Pick high connected hub
    const hub = [...model.elementsList].sort((a, b) => b.totalDegree - a.totalDegree)[0];
    return hub?.id || model.elementsList[0]?.id || '';
  }, [selectedElementId, model.elementsList, model.elements]);

  const impactResult = useMemo(() => {
    if (!activeId) return null;
    return calculateImpact(model, activeId, depth);
  }, [model, activeId, depth]);

  const filteredElementsForSelect = useMemo(() => {
    if (!searchFilter) return model.elementsList.slice(0, 30);
    return model.elementsList
      .filter((e) => e.name.toLowerCase().includes(searchFilter.toLowerCase()))
      .slice(0, 30);
  }, [model.elementsList, searchFilter]);

  if (!impactResult) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        No se ha seleccionado ningún elemento para el análisis de impacto.
      </div>
    );
  }

  const { rootElement, upstream, downstream, affectedLayers, totalAffected, riskRating } =
    impactResult;

  const riskColors = {
    Crítico: 'bg-rose-100 text-rose-800 border-rose-300',
    Alto: 'bg-amber-100 text-amber-800 border-amber-300',
    Medio: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Bajo: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  }[riskRating];

  return (
    <div id="impact-analysis-view" className="space-y-6">
      {/* Top Header Card with Selector and Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Zap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span>Simulador de Radio de Impacto (Blast Radius)</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Análisis de Impacto y Dependencias Transitivas
            </h2>
          </div>

          {/* Depth Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Profundidad de propagación:</span>
            <div className="inline-flex border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    depth === d ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {d} nivel{d > 1 ? 'es' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Element search & selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar componentes para evaluar..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-750 focus:border-cyan-500 dark:focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="md:col-span-7 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
            {filteredElementsForSelect.slice(0, 8).map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => onSelectElement(el.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  activeId === el.id
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {el.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Element Summary & Impact Assessment */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: LAYER_CONFIG[rootElement.layer].dotColor }}
              />
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Elemento Raíz Evaluado ({rootElement.type})
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{rootElement.name}</h3>
            {rootElement.documentation && (
              <p className="text-xs text-slate-300 mt-1 max-w-3xl line-clamp-2">
                {rootElement.documentation}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-center">
              <div className="text-2xl font-black text-cyan-300">{totalAffected}</div>
              <div className="text-[10px] text-slate-400 uppercase">Impacto Total</div>
            </div>
            <div className={`px-3 py-2 rounded-lg border font-bold text-xs uppercase ${riskColors}`}>
              Nivel de Riesgo: {riskRating}
            </div>
          </div>
        </div>

        {/* Affected Layers breakdown */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Capas Afectadas ({affectedLayers.size}):</span>
          {(Array.from(affectedLayers) as ArchiMateLayer[]).map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/20"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LAYER_CONFIG[l].dotColor }}
              />
              {LAYER_CONFIG[l].name}
            </span>
          ))}
        </div>
      </div>

      {/* Two Column Detailed Impact: Upstream vs Downstream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upstream Impact (Who depends on this element) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Impacto Aguas Arriba (Upstream)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sistemas, procesos y capacidades que se verían afectados si este componente falla
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-transparent dark:border-rose-800 rounded-full">
              {upstream.length} elementos
            </span>
          </div>

          {upstream.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No hay componentes consumidores aguas arriba identificados en este nivel de profundidad.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {upstream.map((item, idx) => (
                <div
                  key={`${item.element.id}-${idx}`}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: LAYER_CONFIG[item.element.layer].dotColor }}
                      />
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.element.name}</span>
                      <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                        Nivel {item.depth}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span>{item.element.type}</span>
                      <span>•</span>
                      <span className="italic text-slate-600 dark:text-slate-300 font-mono">
                        via {item.viaRelationship.type}
                        {item.viaRelationship.name ? ` (${item.viaRelationship.name})` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectElement(item.element.id)}
                    className="shrink-0 px-2 py-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded-md transition-colors"
                  >
                    Examinar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Downstream Dependencies (What does this element need/use) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dependencias Aguas Abajo (Downstream)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Servicios, datos, o funciones de las que este elemento depende directamente
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-transparent dark:border-cyan-800 rounded-full">
              {downstream.length} elementos
            </span>
          </div>

          {downstream.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No hay dependencias salientes hacia otros componentes registradas.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {downstream.map((item, idx) => (
                <div
                  key={`${item.element.id}-${idx}`}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: LAYER_CONFIG[item.element.layer].dotColor }}
                      />
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.element.name}</span>
                      <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                        Nivel {item.depth}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span>{item.element.type}</span>
                      <span>•</span>
                      <span className="italic text-slate-600 dark:text-slate-300 font-mono">
                        via {item.viaRelationship.type}
                        {item.viaRelationship.name ? ` (${item.viaRelationship.name})` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectElement(item.element.id)}
                    className="shrink-0 px-2 py-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded-md transition-colors"
                  >
                    Examinar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
