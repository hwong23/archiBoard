import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { GovernanceRisk, ArchiMateModel, ArchiMateLayer } from '../types';

interface GovernanceRiskViewProps {
  model: ArchiMateModel;
  risks: GovernanceRisk[];
  selectedLayers?: Set<ArchiMateLayer>;
  onSelectElementForImpact: (elementId: string) => void;
}

export const GovernanceRiskView: React.FC<GovernanceRiskViewProps> = ({
  model,
  risks,
  selectedLayers,
  onSelectElementForImpact,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [filterByActiveLayers, setFilterByActiveLayers] = useState<boolean>(false);

  const filteredRisks = risks.filter((r) => {
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSev = selectedSeverity === 'All' || r.severity === selectedSeverity;
    
    if (!matchesCat || !matchesSev) return false;

    if (filterByActiveLayers && selectedLayers && selectedLayers.size < 6) {
      if (!r.affectedElementIds || r.affectedElementIds.length === 0) return true;
      return r.affectedElementIds.some((elId) => {
        const el = model.elements.get(elId);
        return el && selectedLayers.has(el.layer);
      });
    }

    return true;
  });

  const categories = ['All', 'Architecture', 'Governance', 'Integration', 'Technical', 'Operation'];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div id="governance-risk-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Matriz de Riesgos de Gobierno y Arquitectura</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Evaluación de Riesgos Estructurales y Mitigación TOGAF / MinTIC
            </h2>
            <p className="text-xs text-slate-500">
              Identificación y monitoreo de riesgos de silos de desarrollo, acoplamiento punto a punto,
              gobernanza SOA y trazabilidad técnica.
            </p>
          </div>

          {/* Filter bars */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">Severidad:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium"
              >
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'Todas' : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'Todas' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRisks.map((risk) => {
          const isCritical = risk.severity === 'Critical';
          const isHigh = risk.severity === 'High';

          const borderStyle = isCritical
            ? 'border-rose-300 bg-rose-50/20'
            : isHigh
            ? 'border-amber-300 bg-amber-50/20'
            : 'border-slate-200 bg-white';

          const badgeStyle = isCritical
            ? 'bg-rose-100 text-rose-800 border-rose-200'
            : isHigh
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div
              key={risk.id}
              className={`p-5 rounded-xl border ${borderStyle} shadow-2xs space-y-3 transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {risk.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white text-slate-600">
                      {risk.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{risk.name}</h3>
                </div>

                <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase shrink-0 ${badgeStyle}`}>
                  {risk.severity}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-100">
                {risk.description}
              </p>

              {/* Impact bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                  <span>Nivel de Criticidad & Impacto</span>
                  <span className="font-bold text-slate-800 font-mono">{risk.impactScore}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCritical ? 'bg-rose-600' : isHigh ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${risk.impactScore}%` }}
                  />
                </div>
              </div>

              {/* Mitigation Strategy */}
              <div className="text-xs bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                  <CheckCircle className="w-3 h-3" />
                  <span>Estrategia de Mitigación de Gobierno</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">{risk.mitigationStrategy}</p>
              </div>

              {/* Affected Elements button links */}
              {risk.affectedElementIds && risk.affectedElementIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Componentes Directamente Asociados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.affectedElementIds.slice(0, 4).map((elId) => {
                      const el = model.elements.get(elId);
                      if (!el) return null;
                      return (
                        <button
                          key={elId}
                          type="button"
                          onClick={() => onSelectElementForImpact(elId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-[10px] text-slate-700 font-medium transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{el.name}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
