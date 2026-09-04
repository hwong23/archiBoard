import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { ArchiMateModel, ArchitectureMetrics, GovernanceRisk, ArchiMateLayer } from '../types';
import { LAYER_CONFIG } from './LayerFilterBar';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ArchiMateModel;
  metrics: ArchitectureMetrics;
  risks: GovernanceRisk[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  model,
  metrics,
  risks,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'preview' | 'markdown' | 'csv' | 'json'>('preview');

  if (!isOpen) return null;

  const generateMarkdownReport = (): string => {
    return `# INFORME EJECUTIVO DE ARQUITECTURA EMPRESARIAL
**Modelo:** ${model.name}  
**Fecha:** ${new Date().toLocaleDateString()}  
**Objetivo:** Evaluación de arquitectura, dependencias y riesgos de gobierno en modelo ArchiMate.

---

## 1. RESUMEN EJECUTIVO Y ESTADÍSTICAS
- **Total de Elementos:** ${metrics.totalElements}
- **Total de Dependencias / Relaciones:** ${metrics.totalRelationships}
- **Densidad del Grafo:** ${metrics.density}
- **Acoplamiento Promedio:** ${metrics.averageDegree} relaciones / elemento
- **Índice de Modularidad:** ${metrics.modularityScore} / 100
- **Completitud de Documentación:** ${metrics.documentedRatio}%

### Distribución por Capas ArchiMate:
${Object.entries(metrics.layerCounts)
  .map(([layer, count]) => `- **${layer}:** ${count} elementos`)
  .join('\n')}

---

## 2. EVALUACIÓN DE COMPONENTES CRÍTICOS (HUBS DE INTEGRACIÓN)
Los siguientes componentes presentan la mayor concentración de dependencias entrantes y salientes (puntos de centralidad):
${metrics.highCouplingElements
  .slice(0, 5)
  .map((e, idx) => `${idx + 1}. **${e.name}** (${e.type}) — ${e.totalDegree} dependencias (${e.inDegree} in / ${e.outDegree} out)`)
  .join('\n')}

---

## 3. MATRIZ DE RIESGOS DE GOBIERNO ARQUITECTÓNICO
${risks
  .map(
    (r) =>
      `### [${r.severity}] ${r.code}: ${r.name}
- **Categoría:** ${r.category}
- **Impacto:** ${r.impactScore}/100
- **Descripción:** ${r.description}
- **Estrategia de Mitigación:** ${r.mitigationStrategy}
`
  )
  .join('\n')}

---

## 4. RECOMENDACIONES ESTRATÉGICAS (TOGAF / MinTIC MAE 3.0)
1. **Desacoplamiento e Intermediación:** Desplegar pasarela de integración / API Gateway entre los módulos financiero, nómina y almacén para evitar interfaces punto a punto directas.
2. **Centralización en Repositorio de Arquitectura:** Unificar catálogo de interfaces y decisiones de arquitectura (ADR) como única fuente de verdad.
3. **Control del Ciclo de Vida:** Establecer mesas de arquitectura previas a la salida a producción para validar contratos y pruebas de integración.
`;
  };

  const generateCsvReport = (): string => {
    const escapeCsv = (val: string | number): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows: (string | number)[][] = [
      ['INFORME DE MÉTRICAS Y CONTEO POR CAPA - ARQUITECTURA EMPRESARIAL ARCHIMATE'],
      ['Modelo', model.name],
      ['Fecha de Exportación', `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`],
      ['ID del Modelo', model.id || 'N/A'],
      [],
      ['1. MÉTRICAS CALCULADAS DE ARQUITECTURA'],
      ['Métrica', 'Valor', 'Unidad / Referencia'],
      ['Total de Elementos', metrics.totalElements, 'Elementos'],
      ['Total de Dependencias / Relaciones', metrics.totalRelationships, 'Relaciones'],
      ['Densidad del Grafo', metrics.density, 'Relaciones / Relaciones Máximas Posibles'],
      ['Acoplamiento Promedio (Grado Promedio)', metrics.averageDegree, 'Conexiones promedio por elemento'],
      ['Índice de Modularidad', `${metrics.modularityScore}%`, 'Escala de 0 a 100%'],
      ['Cobertura de Documentación', `${metrics.documentedRatio}%`, 'Porcentaje de elementos documentados'],
      ['Elementos Aislados (Sin Dependencias)', metrics.isolatedElementsCount ?? 0, 'Elementos'],
      ['Componentes de Mayor Acoplamiento (Hubs)', metrics.highCouplingElements?.length ?? 0, 'Nodos centrales'],
      [],
      ['2. CONTEO DE ELEMENTOS POR CAPA ARCHIMATE'],
      ['Código de Capa', 'Nombre de la Capa', 'Cantidad de Elementos', 'Porcentaje del Total (%)'],
    ];

    const totalElements = metrics.totalElements > 0 ? metrics.totalElements : 1;
    const layerEntries = Object.entries(metrics.layerCounts) as [ArchiMateLayer, number][];

    layerEntries.forEach(([layerKey, count]) => {
      const config = LAYER_CONFIG[layerKey];
      const layerName = config ? config.name : layerKey;
      const countNum = Number(count) || 0;
      const pct = Math.round((countNum / totalElements) * 100);
      rows.push([layerKey, layerName, countNum, `${pct}%`]);
    });

    // Tipologías de elementos
    rows.push([]);
    rows.push(['3. DISTRIBUCIÓN POR TIPOLOGÍA DE ELEMENTO ARCHIMATE']);
    rows.push(['Tipo de Elemento', 'Cantidad', 'Porcentaje del Total (%)']);
    (Object.entries(metrics.elementTypesCount) as [string, number][])
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .forEach(([type, count]) => {
        const countNum = Number(count) || 0;
        const pct = Math.round((countNum / totalElements) * 100);
        rows.push([type, countNum, `${pct}%`]);
      });

    // Puntos de mayor acoplamiento
    if (metrics.highCouplingElements && metrics.highCouplingElements.length > 0) {
      rows.push([]);
      rows.push(['4. COMPONENTES CON MAYOR ACOPLAMIENTO (TOP HUBS)']);
      rows.push(['Nombre', 'Tipo', 'Capa', 'Dependencias Totales', 'Entrantes (In)', 'Salientes (Out)']);
      metrics.highCouplingElements.forEach((el) => {
        rows.push([el.name, el.type, el.layer, el.totalDegree, el.inDegree, el.outDegree]);
      });
    }

    return '\uFEFF' + rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(generateCsvReport());
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe-ejecutivo-${model.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvReport();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeModelName = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'modelo';
    link.download = `metricas-capas-${safeModelName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = {
      modelName: model.name,
      exportDate: new Date().toISOString(),
      metrics,
      risks,
      elements: model.elementsList,
      relationships: model.relationships,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archimate-data-${model.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="executive-report-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Informe Ejecutivo de Arquitectura</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hallazgos, estadísticas y evaluación de gobernanza</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct CSV Export Button in Header */}
            <button
              type="button"
              id="header-export-csv-btn"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors shadow-2xs"
              title="Descargar métricas calculadas y conteos por capa en formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              id="print-report-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              id="close-modal-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar */}
        <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 font-medium">
            <button
              type="button"
              id="format-tab-preview"
              onClick={() => setActiveFormat('preview')}
              className={`px-3 py-1 rounded transition-colors ${
                activeFormat === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Vista Documental
            </button>
            <button
              type="button"
              id="format-tab-csv"
              onClick={() => setActiveFormat('csv')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeFormat === 'csv' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Métricas CSV (.csv)</span>
            </button>
            <button
              type="button"
              id="format-tab-markdown"
              onClick={() => setActiveFormat('markdown')}
              className={`px-3 py-1 rounded transition-colors ${
                activeFormat === 'markdown' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              type="button"
              id="format-tab-json"
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1 rounded transition-colors ${
                activeFormat === 'json' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Datos JSON (.json)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeFormat === 'csv' && (
              <>
                <button
                  type="button"
                  id="copy-csv-btn"
                  onClick={handleCopyCsv}
                  className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded font-medium transition-colors"
                >
                  {copiedCsv ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCsv ? 'Copiado' : 'Copiar CSV'}</span>
                </button>
                <button
                  type="button"
                  id="download-csv-action-btn"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1 text-emerald-900 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-950/70 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded font-semibold transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-800 dark:text-emerald-300" />
                  <span>Descargar .csv</span>
                </button>
              </>
            )}

            {activeFormat === 'markdown' && (
              <>
                <button
                  type="button"
                  id="copy-markdown-btn"
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded font-medium transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  id="download-markdown-btn"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1 text-cyan-800 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 px-2.5 py-1 rounded font-medium transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar .md</span>
                </button>
              </>
            )}

            {activeFormat === 'json' && (
              <button
                type="button"
                id="download-json-btn"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1 text-cyan-800 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 px-2.5 py-1 rounded font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Descargar .json</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-200">
          {activeFormat === 'preview' ? (
            <div id="printable-report" className="space-y-6">
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Informe Ejecutivo de Arquitectura Empresarial
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Modelo: <strong className="text-slate-800 dark:text-slate-200">{model.name}</strong> • Fecha:{' '}
                      {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block">
                      Marco de Evaluación
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      TOGAF® 10 / MAE 3.0 MinTIC
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Executive KPI grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. Métricas Principales del Modelo
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.totalElements}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Elementos Totales</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.totalRelationships}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Dependencias / Relaciones</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.averageDegree}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Acoplamiento Promedio</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.modularityScore}%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Índice de Modularidad</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Critical Risks */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Hallazgos y Riesgos de Gobierno Arquitectónico
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Riesgo</th>
                        <th className="py-2 px-3">Severidad</th>
                        <th className="py-2 px-3">Mitigación Recomendada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {risks.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.code}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{r.name}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                r.severity === 'Critical'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-transparent dark:border-rose-800'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800'
                              }`}
                            >
                              {r.severity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{r.mitigationStrategy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Strategic Architectural Hubs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3. Puntos Críticos de Acoplamiento y Dependencia (Hubs)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metrics.highCouplingElements.slice(0, 4).map((el) => (
                    <div key={el.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">{el.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        Tipo: {el.type} • {el.totalDegree} dependencias ({el.inDegree} in / {el.outDegree} out)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeFormat === 'csv' ? (
            <div className="space-y-5">
              {/* Informative Header with Download Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                <div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Exportación de Métricas y Capas en Formato CSV</span>
                  </h4>
                  <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                    Incluye métricas cuantitativas, desglose de conteo por capa ArchiMate, tipologías y hubs de acoplamiento.
                    Compatible con Excel, LibreOffice Calc y herramientas de Business Intelligence.
                  </p>
                </div>
                <button
                  type="button"
                  id="body-download-csv-btn"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo CSV</span>
                </button>
              </div>

              {/* Visual preview of data being exported */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metric Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Métricas Calculadas
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-400">Total de Elementos:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.totalElements}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-400">Total de Relaciones:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.totalRelationships}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-400">Densidad del Grafo:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.density}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-400">Acoplamiento Promedio:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.averageDegree} rel/elem</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-400">Índice de Modularidad:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.modularityScore}%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600 dark:text-slate-400">Cobertura Documentación:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{metrics.documentedRatio}%</strong>
                    </div>
                  </div>
                </div>

                {/* Layer Counts Table */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Conteo de Elementos por Capa
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    {(Object.entries(metrics.layerCounts) as [ArchiMateLayer, number][]).map(([layerKey, count]) => {
                      const config = LAYER_CONFIG[layerKey];
                      const totalElements = metrics.totalElements > 0 ? metrics.totalElements : 1;
                      const countNum = Number(count) || 0;
                      const pct = Math.round((countNum / totalElements) * 100);
                      return (
                        <div key={layerKey} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: config?.dotColor || '#94A3B8' }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{config?.name || layerKey}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{count} elem.</span>
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Raw CSV Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Contenido del archivo CSV:</span>
                  <button
                    type="button"
                    onClick={handleCopyCsv}
                    className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-semibold"
                  >
                    {copiedCsv ? '¡Copiado al portapapeles!' : 'Copiar texto plano CSV'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-300 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre leading-relaxed border border-slate-800 max-h-56">
                  {generateCsvReport()}
                </pre>
              </div>
            </div>
          ) : activeFormat === 'markdown' ? (
            <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {generateMarkdownReport()}
            </pre>
          ) : (
            <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(
                {
                  modelName: model.name,
                  metrics,
                  risks,
                  elementsCount: model.elementsList.length,
                  relationshipsCount: model.relationships.length,
                },
                null,
                2
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
