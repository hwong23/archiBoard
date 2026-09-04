import React, { useState, useEffect, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { LayerFilterBar, ARCHIMATE_FILTER_LAYERS } from './components/LayerFilterBar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DependencyGraph } from './components/DependencyGraph';
import { ImpactAnalysisView } from './components/ImpactAnalysisView';
import { GovernanceRiskView } from './components/GovernanceRiskView';
import { ModelExplorerView } from './components/ModelExplorerView';
import { DocExplanationView } from './components/DocExplanationView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { loadInitialModel } from './data/sampleModel';
import { parseArchiMateXml } from './utils/archimateParser';
import { calculateMetrics, extractGovernanceRisks } from './utils/architectureAnalysis';
import { ArchiMateLayer, ArchiMateModel } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [model, setModel] = useState<ArchiMateModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedElementIdForImpact, setSelectedElementIdForImpact] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected layers filter (standard ArchiMate layers, without Other/Agrupaciones)
  const [selectedLayers, setSelectedLayers] = useState<Set<ArchiMateLayer>>(
    new Set<ArchiMateLayer>(ARCHIMATE_FILTER_LAYERS)
  );

  // Theme state: light or dark with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archimate_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('archimate_theme', theme);
    } catch {
      // ignore storage quota errors
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const initial = await loadInitialModel();
        setModel(initial);
      } catch (err: any) {
        showToast('error', 'Error al cargar el modelo base: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Compute full and filtered metrics
  const fullMetrics = useMemo(() => {
    if (!model) return null;
    return calculateMetrics(model);
  }, [model]);

  const filteredMetrics = useMemo(() => {
    if (!model) return null;
    return calculateMetrics(model, selectedLayers);
  }, [model, selectedLayers]);

  const risks = useMemo(() => {
    if (!model) return [];
    return extractGovernanceRisks(model);
  }, [model]);

  // Handle Layer Toggle
  const handleToggleLayer = (layer: ArchiMateLayer) => {
    setSelectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        if (next.size > 1) {
          next.delete(layer);
        }
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const handleSelectAllLayers = () => {
    setSelectedLayers(new Set<ArchiMateLayer>(ARCHIMATE_FILTER_LAYERS));
  };

  const handleIsolateLayer = (layer: ArchiMateLayer) => {
    setSelectedLayers(new Set<ArchiMateLayer>([layer]));
  };

  const handleNavigateToExplorer = (layer?: ArchiMateLayer) => {
    if (layer) {
      setSelectedLayers(new Set<ArchiMateLayer>([layer]));
    }
    setActiveTab('explorer');
  };

  // Handle Custom XML Upload
  const handleFileUpload = (xmlString: string, filename: string) => {
    try {
      setIsLoading(true);
      const newModel = parseArchiMateXml(xmlString);
      setModel(newModel);
      showToast(
        'success',
        `Modelo "${newModel.name}" cargado exitosamente (${newModel.elementsList.length} elementos)`
      );
      handleSelectAllLayers();
    } catch (err: any) {
      showToast('error', `Error al analizar archivo "${filename}": ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetModel = async () => {
    setIsLoading(true);
    try {
      const initial = await loadInitialModel();
      setModel(initial);
      handleSelectAllLayers();
      showToast('success', 'Modelo base PERSN restaurado correctamente.');
    } catch (err: any) {
      showToast('error', 'Error al restaurar el modelo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectElementForImpact = (elementId: string) => {
    setSelectedElementIdForImpact(elementId);
    setActiveTab('impact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterToSingleLayer = (layer: ArchiMateLayer) => {
    setSelectedLayers(new Set<ArchiMateLayer>([layer]));
    setActiveTab('explorer');
  };

  if (isLoading || !model || !fullMetrics || !filteredMetrics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-cyan-500 border-t-cyan-500 dark:border-t-slate-800 rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cargando Modelo ArchiMate...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Analizando metamodelo, dependencias y riesgos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-100 dark:selection:bg-cyan-900 selection:text-cyan-900 dark:selection:text-cyan-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        model={model}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFileUpload={handleFileUpload}
        onResetModel={handleResetModel}
        onOpenReport={() => setIsReportModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Filter and Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-5">
        {/* Layer Filter Bar */}
        {activeTab !== 'doc' && (
          <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
            <LayerFilterBar
              selectedLayers={selectedLayers}
              onToggleLayer={handleToggleLayer}
              onSelectAll={handleSelectAllLayers}
              layerCounts={fullMetrics.layerCounts}
            />
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <OverviewDashboard
            model={model}
            metrics={filteredMetrics}
            fullMetrics={fullMetrics}
            selectedLayers={selectedLayers}
            risks={risks}
            onSelectElementForImpact={handleSelectElementForImpact}
            onToggleLayer={handleToggleLayer}
            onSelectAllLayers={handleSelectAllLayers}
            onIsolateLayer={handleIsolateLayer}
            onNavigateToExplorer={handleNavigateToExplorer}
          />
        )}

        {activeTab === 'dependencies' && (
          <DependencyGraph
            model={model}
            selectedLayers={selectedLayers}
            onSelectElementForImpact={handleSelectElementForImpact}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactAnalysisView
            model={model}
            selectedElementId={selectedElementIdForImpact}
            onSelectElement={setSelectedElementIdForImpact}
          />
        )}

        {activeTab === 'risks' && (
          <GovernanceRiskView
            model={model}
            risks={risks}
            selectedLayers={selectedLayers}
            onSelectElementForImpact={handleSelectElementForImpact}
          />
        )}

        {activeTab === 'explorer' && (
          <ModelExplorerView
            model={model}
            selectedLayers={selectedLayers}
            onSelectElementForImpact={handleSelectElementForImpact}
          />
        )}

        {activeTab === 'doc' && <DocExplanationView />}
      </main>

      {/* Executive Report Exporter Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        model={model}
        metrics={fullMetrics}
        risks={risks}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Plataforma de Arquitectura Empresarial ArchiMate® • Open Group Exchange Format 3.0 / 3.1 / 3.2
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {model.name} — {fullMetrics.totalElements} elem | {fullMetrics.totalRelationships} rel
          </span>
        </div>
      </footer>
    </div>
  );
}
