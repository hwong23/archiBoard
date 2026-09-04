import React from 'react';
import { ArchiMateLayer } from '../types';

interface LayerFilterBarProps {
  selectedLayers: Set<ArchiMateLayer>;
  onToggleLayer: (layer: ArchiMateLayer) => void;
  onSelectAll: () => void;
  layerCounts: Record<ArchiMateLayer, number>;
}

export const ARCHIMATE_FILTER_LAYERS: ArchiMateLayer[] = [
  'Strategy',
  'Business',
  'Application',
  'Technology',
  'Motivation',
  'Implementation',
];

export const LAYER_CONFIG: Record<
  ArchiMateLayer,
  { name: string; bg: string; border: string; text: string; dotColor: string }
> = {
  Strategy: {
    name: 'Estrategia',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-300',
    dotColor: '#F5DEAA',
  },
  Business: {
    name: 'Negocio',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-300',
    dotColor: '#FEFB96',
  },
  Application: {
    name: 'Aplicación / Datos',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-300 dark:border-cyan-700',
    text: 'text-cyan-800 dark:text-cyan-300',
    dotColor: '#B5FFFF',
  },
  Technology: {
    name: 'Tecnología / Física',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-300',
    dotColor: '#C9E7B7',
  },
  Motivation: {
    name: 'Motivación / Riesgos',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-300 dark:border-indigo-700',
    text: 'text-indigo-800 dark:text-indigo-300',
    dotColor: '#CCCCFF',
  },
  Implementation: {
    name: 'Implementación / Migración',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-800 dark:text-rose-300',
    dotColor: '#FFE0E0',
  },
  Other: {
    name: 'Otros',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dotColor: '#E2E8F0',
  },
};

export const LayerFilterBar: React.FC<LayerFilterBarProps> = ({
  selectedLayers,
  onToggleLayer,
  onSelectAll,
  layerCounts,
}) => {
  const allLayers: ArchiMateLayer[] = ARCHIMATE_FILTER_LAYERS;

  const areAllSelected = allLayers.every((l) => selectedLayers.has(l));

  return (
    <div id="layer-filter-bar" className="flex flex-wrap items-center gap-2 py-2 text-xs">
      <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mr-1">
        Filtrar Capas:
      </span>
      <button
        type="button"
        onClick={onSelectAll}
        className={`px-2.5 py-1 rounded-md border font-medium transition-all ${
          areAllSelected
            ? 'bg-slate-800 dark:bg-cyan-700 text-white border-slate-800 dark:border-cyan-600 shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        Todas
      </button>

      {allLayers.map((layer) => {
        const isSelected = selectedLayers.has(layer);
        const config = LAYER_CONFIG[layer];
        const count = layerCounts[layer] || 0;

        return (
          <button
            key={layer}
            type="button"
            onClick={() => onToggleLayer(layer)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              isSelected
                ? `${config.bg} ${config.border} ${config.text} font-semibold shadow-xs`
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-90'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20"
              style={{ backgroundColor: config.dotColor }}
            />
            <span>{config.name}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/5 dark:bg-white/10 font-mono">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
