import React, { useRef } from 'react';
import {
  BarChart3,
  Network,
  Zap,
  ShieldAlert,
  FolderTree,
  BookOpen,
  Upload,
  FileText,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { ArchiMateModel } from '../types';

export type ActiveTab = 'dashboard' | 'dependencies' | 'impact' | 'risks' | 'explorer' | 'doc';

interface HeaderProps {
  model: ArchiMateModel;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onFileUpload: (xmlString: string, filename: string) => void;
  onResetModel: () => void;
  onOpenReport: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  model,
  activeTab,
  onTabChange,
  onFileUpload,
  onResetModel,
  onOpenReport,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        onFileUpload(text, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const navTabs = [
    { id: 'dashboard', label: 'Tablero Ejecutivo', icon: BarChart3 },
    { id: 'dependencies', label: 'Relaciones y Dependencias', icon: Network },
    { id: 'impact', label: 'Análisis de Impacto', icon: Zap },
    { id: 'risks', label: 'Gobierno y Riesgos', icon: ShieldAlert },
    { id: 'explorer', label: 'Explorador de Elementos', icon: FolderTree },
    { id: 'doc', label: 'Análisis Documento Base', icon: BookOpen },
  ] as const;

  return (
    <header id="main-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-cyan-950/80 border border-transparent dark:border-cyan-800/60 text-cyan-400 flex items-center justify-center font-bold text-lg shadow-sm">
            AE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Tablero ArchiMate®
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                {model.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
              {model.documentation || 'Modelo de Arquitectura Empresarial (Open Group ArchiMate Exchange XML)'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.archimate,.xmi"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-2xs"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro (reduce fatiga visual)'}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-700">Modo Oscuro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-2xs"
            title="Cargar cualquier modelo ArchiMate en formato XML Open Group"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Alimentar Modelo XML</span>
          </button>

          <button
            type="button"
            onClick={onResetModel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Restaurar el modelo base original PERSN"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Modelo PERSN</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-cyan-700 hover:bg-slate-800 dark:hover:bg-cyan-600 text-white text-xs font-medium transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300 dark:text-cyan-100" />
            <span>Informe Ejecutivo</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800">
        <nav className="flex space-x-1 py-1" aria-label="Tabs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

