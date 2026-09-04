import React, { useMemo } from 'react';
import {
  Boxes,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileCheck,
  Sparkles,
  ArrowUpRight,
  Filter,
  RotateCcw,
  Check,
  ExternalLink,
} from 'lucide-react';
import { ArchitectureMetrics, GovernanceRisk, ArchiMateModel, ArchiMateLayer } from '../types';
import { LAYER_CONFIG, ARCHIMATE_FILTER_LAYERS } from './LayerFilterBar';

interface OverviewDashboardProps {
  model: ArchiMateModel;
  metrics: ArchitectureMetrics;
  fullMetrics: ArchitectureMetrics;
  selectedLayers: Set<ArchiMateLayer>;
  risks: GovernanceRisk[];
  onSelectElementForImpact: (elementId: string) => void;
  onToggleLayer: (layer: ArchiMateLayer) => void;
  onSelectAllLayers: () => void;
  onIsolateLayer: (layer: ArchiMateLayer) => void;
  onNavigateToExplorer?: (layer?: ArchiMateLayer) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  model,
  metrics,
  fullMetrics,
  selectedLayers,
  risks,
  onSelectElementForImpact,
  onToggleLayer,
  onSelectAllLayers,
  onIsolateLayer,
  onNavigateToExplorer,
}) => {
  const allLayers = ARCHIMATE_FILTER_LAYERS;
  const totalLayersWithElements = allLayers.filter((l) => fullMetrics.layerCounts[l] > 0).length;
  const isFiltered = selectedLayers.size < allLayers.length;

  // Filter risks relevant to selected layers
  const relevantRisks = useMemo(() => {
    if (!isFiltered) return risks;
    return risks.filter((r) => {
      if (!r.affectedElementIds || r.affectedElementIds.length === 0) return true;
      return r.affectedElementIds.some((elId) => {
        const el = model.elements.get(elId);
        return el && selectedLayers.has(el.layer);
      });
    });
  }, [risks, model.elements, selectedLayers, isFiltered]);

  const criticalRisks = relevantRisks.filter((r) => r.severity === 'Critical');
  const highRisks = relevantRisks.filter((r) => r.severity === 'High');

  return (
    <div id="overview-dashboard" className="space-y-6">
      {/* Active Filter Alert Banner (if filtered) */}
      {isFiltered && (
        <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/90 dark:border-cyan-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/60 rounded-lg text-cyan-700 dark:text-cyan-300">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-cyan-950 dark:text-cyan-100 flex items-center gap-2">
                <span>Filtro de Capas Activo en Tablero Ejecutivo:</span>
                <span className="bg-cyan-200/70 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-200 font-mono text-[11px] px-2 py-0.5 rounded-full font-semibold">
                  {selectedLayers.size} de {totalLayersWithElements} capas
                </span>
              </div>
              <p className="text-cyan-800 dark:text-cyan-300 text-[11px] mt-0.5">
                Mostrando <strong className="font-semibold text-cyan-950 dark:text-cyan-100">{metrics.totalElements}</strong> de {fullMetrics.totalElements} elementos y{' '}
                <strong className="font-semibold text-cyan-950 dark:text-cyan-100">{metrics.totalRelationships}</strong> de {fullMetrics.totalRelationships} relaciones del modelo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={onSelectAllLayers}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 text-cyan-900 dark:text-cyan-200 font-semibold border border-cyan-300 dark:border-slate-700 rounded-lg text-xs transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-cyan-700 dark:text-cyan-400" />
              <span>Restablecer todas las capas</span>
            </button>
          </div>
        </div>
      )}

      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isFiltered
                  ? `Diagnóstico Filtrado (${selectedLayers.size} capas activas)`
                  : 'Diagnóstico Global de Arquitectura Empresarial'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Evaluación: {model.name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isFiltered ? (
                <>
                  Mostrando subconjunto de{' '}
                  <strong className="text-cyan-300 font-semibold">{metrics.totalElements} elementos</strong> y{' '}
                  <strong className="text-cyan-300 font-semibold">{metrics.totalRelationships} dependencias</strong>{' '}
                  para las capas seleccionadas (de un total de {fullMetrics.totalElements} elementos en el modelo PERSN).
                </>
              ) : (
                <>
                  El modelo integra{' '}
                  <strong className="text-white font-semibold">{metrics.totalElements} elementos</strong> y{' '}
                  <strong className="text-white font-semibold">{metrics.totalRelationships} relaciones</strong>{' '}
                  distribuidos en el metamodelo ArchiMate. Se identificaron{' '}
                  <span className="text-rose-300 font-semibold">{criticalRisks.length} riesgos críticos</span> y{' '}
                  <span className="text-amber-300 font-semibold">{highRisks.length} de severidad alta</span> asociados a
                  gobernanza, silos de desarrollo e integración.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-cyan-300">{metrics.totalElements}</div>
              <div className="text-[11px] text-slate-300 font-medium uppercase">
                Elementos {isFiltered && <span className="text-[10px] text-slate-400">({metrics.totalElements}/{fullMetrics.totalElements})</span>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-indigo-300">{metrics.totalRelationships}</div>
              <div className="text-[11px] text-slate-300 font-medium uppercase">
                Relaciones {isFiltered && <span className="text-[10px] text-slate-400">({metrics.totalRelationships}/{fullMetrics.totalRelationships})</span>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-amber-300">{metrics.density}</div>
              <div className="text-[11px] text-slate-300 font-medium uppercase">Densidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-300">{metrics.modularityScore}/100</div>
              <div className="text-[11px] text-slate-300 font-medium uppercase">Modularidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capas Activas Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Capas Activas</span>
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{selectedLayers.size}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">de {allLayers.length} capas</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isFiltered ? 'Filtro selectivo aplicado' : 'Cobertura completa'}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={onSelectAllLayers}
                className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-semibold text-[11px]"
              >
                Activar todas
              </button>
            )}
          </div>
        </div>

        {/* Acoplamiento Promedio Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acoplamiento Promedio</span>
            <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.averageDegree}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">conexiones / elemento</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {metrics.averageDegree > 2 ? 'Estructura altamente interconectada' : 'Acoplamiento moderado o bajo'}
          </p>
        </div>

        {/* Documentación Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documentación</span>
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.documentedRatio}%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">completitud</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Elementos activos con notas técnicas y especificaciones.
          </p>
        </div>

        {/* Riesgos Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Riesgos Identificados</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700 dark:text-rose-400">{relevantRisks.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isFiltered ? `en capas seleccionadas` : 'en gobierno y SOA'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {criticalRisks.length > 0
              ? `${criticalRisks.length} requieren atención prioritaria inmediata.`
              : 'Riesgos bajo control en este alcance.'}
          </p>
        </div>
      </div>

      {/* Two Column Section: Layer Distribution & Top Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Distribution Bar Visualizer with In-Dashboard Filtering */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Distribución por Capas ArchiMate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cualquier capa para activarla/desactivarla en el tablero
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2.5">
            {allLayers.map((layer) => {
              const count = fullMetrics.layerCounts[layer] || 0;
              const pct = fullMetrics.totalElements > 0 ? Math.round((count / fullMetrics.totalElements) * 100) : 0;
              const config = LAYER_CONFIG[layer];
              const isActive = selectedLayers.has(layer);

              return (
                <div
                  key={layer}
                  className={`p-2.5 rounded-lg transition-all border ${
                    isActive
                      ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-600'
                      : 'bg-slate-100/50 dark:bg-slate-850/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    {/* Layer toggle button */}
                    <button
                      type="button"
                      onClick={() => onToggleLayer(layer)}
                      className="flex items-center gap-2 text-left group"
                      title={isActive ? 'Desactivar esta capa' : 'Activar esta capa'}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold ${
                          isActive
                            ? 'bg-cyan-600 border-cyan-700 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent group-hover:text-slate-400'
                        }`}
                      >
                        ✓
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: config.dotColor }}
                      />
                      <span className={`font-semibold ${isActive ? 'text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300' : 'text-slate-500 dark:text-slate-400 line-through'}`}>
                        {config.name}
                      </span>
                    </button>

                    {/* Quick actions & stats */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] font-mono">
                        {count} elem.
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-8 text-right font-mono">{pct}%</span>

                      {/* Isolate layer button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIsolateLayer(layer);
                        }}
                        title="Ver solo esta capa en el tablero"
                        className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-800 dark:hover:text-cyan-300 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Solo esta
                      </button>

                      {onNavigateToExplorer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToExplorer(layer);
                          }}
                          title="Abrir en explorador de elementos"
                          className="text-slate-400 dark:text-slate-500 hover:text-cyan-700 dark:hover:text-cyan-400 p-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-750 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? '' : 'grayscale opacity-30'
                      }`}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: config.dotColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High Coupling Hubs / SPOF in Selected Layers */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nodos de Mayor Centralidad (Hubs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFiltered
                  ? `Componentes clave pertenecientes a las ${selectedLayers.size} capas seleccionadas`
                  : 'Componentes con mayor grado de dependencias e impacto potencial'}
              </p>
            </div>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
            {metrics.highCouplingElements.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-slate-400 dark:text-slate-500 text-xs">
                <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>No se encontraron nodos centrales en las capas seleccionadas.</p>
                <button
                  type="button"
                  onClick={onSelectAllLayers}
                  className="text-cyan-700 dark:text-cyan-400 font-semibold hover:underline"
                >
                  Restablecer todas las capas
                </button>
              </div>
            ) : (
              metrics.highCouplingElements.slice(0, 6).map((el) => {
                const config = LAYER_CONFIG[el.layer];
                return (
                  <div
                    key={el.id}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: config.dotColor }}
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={el.name}>
                          {el.name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${config.bg} ${config.text} ${config.border}`}
                        >
                          {config.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px] text-slate-700 dark:text-slate-300">{el.type}</span>
                        <span>{el.inDegree} entrantes</span>
                        <span>•</span>
                        <span>{el.outDegree} salientes</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectElementForImpact(el.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-transparent dark:border-cyan-800 px-2.5 py-1 rounded-md transition-colors shrink-0"
                    >
                      <span>Analizar Impacto</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Risks Highlight Strip */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-5 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Riesgos Críticos de Gobierno y Arquitectura Detectados
            </h3>
          </div>
          {isFiltered && (
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              Filtrados para las capas activas ({relevantRisks.length} de {risks.length})
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relevantRisks.slice(0, 3).map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{r.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    r.severity === 'Critical'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-transparent dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800'
                  }`}
                >
                  {r.severity}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{r.description}</p>
              <div className="text-[11px] text-cyan-800 dark:text-cyan-400 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                Mitigación: <span className="text-slate-600 dark:text-slate-400 font-normal line-clamp-1">{r.mitigationStrategy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
