import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Grid,
  GitGraph,
  ArrowRight,
  Sparkles,
  Layers,
  Share2,
  CircleDot,
  LayoutGrid,
  SlidersHorizontal,
  Info,
  Download,
  FileImage,
  FileText,
  ChevronDown,
  ChevronUp,
  Minus,
  Eye,
  EyeOff,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ArchiMateLayer, ArchiMateModel, ArchiMateElement, GraphLayoutAlgorithm } from '../types';
import { LAYER_CONFIG } from './LayerFilterBar';

interface DependencyGraphProps {
  model: ArchiMateModel;
  selectedLayers: Set<ArchiMateLayer>;
  onSelectElementForImpact: (elementId: string) => void;
}

export interface GraphLayoutOption {
  id: GraphLayoutAlgorithm;
  label: string;
  shortLabel: string;
  tag: string;
  description: string;
  bestFor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const GRAPH_LAYOUT_OPTIONS: GraphLayoutOption[] = [
  {
    id: 'layered',
    label: 'Jerárquico por Capas',
    shortLabel: 'Capas TOGAF',
    tag: 'Estándar',
    description: 'Alinea los componentes en bandas horizontales según las capas ArchiMate (Estrategia, Negocio, Aplicación, Tecnología) con distribución multi-fila.',
    bestFor: 'Trazabilidad vertical formal y modelos con flujo de dependencia superior a inferior.',
    icon: Layers,
  },
  {
    id: 'force',
    label: 'Fuerza y Atracción',
    shortLabel: 'Fuerza Orgánica',
    tag: 'Orgánico',
    description: 'Simulación física de atracción y repulsión que agrupa automáticamente subsistemas acoplados y separa islas aisladas.',
    bestFor: 'Modelos densos: revela clusters naturales y dependencias transversales ocultas.',
    icon: Share2,
  },
  {
    id: 'radial',
    label: 'Radial Concéntrico (Hubs)',
    shortLabel: 'Radial Hubs',
    tag: 'Centralidad',
    description: 'Organiza los nodos en órbitas concéntricas según su acoplamiento: componentes críticos en el centro y hojas en la periferia.',
    bestFor: 'Auditoría de riesgos: identifica de un vistazo cuellos de botella y componentes de alta centralidad.',
    icon: CircleDot,
  },
  {
    id: 'clustered',
    label: 'Celdas por Dominio (Bento)',
    shortLabel: 'Celdas Dominio',
    tag: 'Modular',
    description: 'Divide el lienzo en cuadrantes delimitados para cada capa activa con distribución local ordenada.',
    bestFor: 'Modelos muy grandes: reduce la congestión visual aislando cada capa en su propio marco.',
    icon: LayoutGrid,
  },
];

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  model,
  selectedLayers,
  onSelectElementForImpact,
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<ArchiMateElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Overlay state: 'expanded' | 'minimized' | 'hidden'
  const [overlayMode, setOverlayMode] = useState<'expanded' | 'minimized' | 'hidden'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archimate_layout_overlay_mode');
      if (saved === 'expanded' || saved === 'minimized' || saved === 'hidden') {
        return saved as 'expanded' | 'minimized' | 'hidden';
      }
    }
    return 'minimized'; // Default to minimized so it does not block the diagram
  });

  const handleOverlayModeChange = (mode: 'expanded' | 'minimized' | 'hidden') => {
    setOverlayMode(mode);
    try {
      localStorage.setItem('archimate_layout_overlay_mode', mode);
    } catch {
      // ignore
    }
  };

  // Export states
  const [isExporting, setIsExporting] = useState<'png' | 'jpg' | 'pdf' | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Layout algorithm state with persistence
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<GraphLayoutAlgorithm>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archimate_graph_layout');
      if (saved === 'layered' || saved === 'force' || saved === 'radial' || saved === 'clustered') {
        return saved as GraphLayoutAlgorithm;
      }
    }
    return 'layered';
  });

  const handleLayoutChange = (algo: GraphLayoutAlgorithm) => {
    setLayoutAlgorithm(algo);
    try {
      localStorage.setItem('archimate_graph_layout', algo);
    } catch {
      // ignore
    }
  };

  const currentLayoutOption = useMemo(() => {
    return (
      GRAPH_LAYOUT_OPTIONS.find((opt) => opt.id === layoutAlgorithm) || GRAPH_LAYOUT_OPTIONS[0]
    );
  }, [layoutAlgorithm]);

  // Export SVG renderer helper
  const renderSvgToCanvas = (scale = 2): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const svgEl = svgRef.current;
      if (!svgEl) {
        reject(new Error('Elemento SVG no encontrado en el DOM'));
        return;
      }

      try {
        const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
        clonedSvg.style.transform = 'none';
        clonedSvg.style.transformOrigin = 'initial';
        clonedSvg.setAttribute('width', `${1150 * scale}`);
        clonedSvg.setAttribute('height', `${780 * scale}`);

        if (!clonedSvg.getAttribute('xmlns')) {
          clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          canvas.width = 1150 * scale;
          canvas.height = 780 * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo inicializar contexto 2D para renderizado'));
            return;
          }

          // Dark canvas background matching the graph palette (#020617)
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw graph SVG image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Error al decodificar la imagen vectorial SVG'));
        };

        img.src = url;
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    setShowExportMenu(false);
    setIsExporting(format);
    try {
      const canvas = await renderSvgToCanvas(2);
      const safeName = (model.name || 'grafo-dependencias').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        // Dark background for PDF presentation
        pdf.setFillColor(2, 6, 23);
        pdf.rect(0, 0, 297, 210, 'F');

        // Header and metadata
        pdf.setTextColor(248, 250, 252);
        pdf.setFontSize(13);
        pdf.text(model.name || 'Arquitectura Empresarial ArchiMate', 14, 13);

        pdf.setFontSize(8.5);
        pdf.setTextColor(148, 163, 184);
        const dateStr = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        pdf.text(
          `Red de Dependencias • Diseño: ${currentLayoutOption.label} • Elementos: ${filteredElements.length} • Dependencias: ${filteredRelationships.length} • ${dateStr}`,
          14,
          19
        );

        // Aspect ratio: 1150 / 780 = 1.474
        const maxW = 269;
        const maxH = 182;
        const ratio = 1150 / 780;
        let w = maxW;
        let h = w / ratio;
        if (h > maxH) {
          h = maxH;
          w = h * ratio;
        }
        const x = 14 + (maxW - w) / 2;
        const y = 22 + (maxH - h) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, w, h);
        pdf.save(`${safeName}-${layoutAlgorithm}.pdf`);
      } else {
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.95);
        const link = document.createElement('a');
        link.download = `${safeName}-${layoutAlgorithm}.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setExportSuccess(`Diagrama exportado correctamente en formato .${format.toUpperCase()}`);
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err: any) {
      console.error(`Error exportando a ${format}:`, err);
      alert(`Error al exportar gráfico: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsExporting(null);
    }
  };

  // Filter elements by active layers
  const filteredElements = useMemo(() => {
    return model.elementsList.filter((el) => {
      const matchesLayer = selectedLayers.has(el.layer);
      const matchesSearch =
        !searchQuery || el.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLayer && matchesSearch;
    });
  }, [model.elementsList, selectedLayers, searchQuery]);

  const filteredElementIds = useMemo(() => {
    return new Set(filteredElements.map((e) => e.id));
  }, [filteredElements]);

  // Filter relationships connecting the filtered elements
  const filteredRelationships = useMemo(() => {
    return model.relationships.filter(
      (rel) => filteredElementIds.has(rel.sourceId) && filteredElementIds.has(rel.targetId)
    );
  }, [model.relationships, filteredElementIds]);

  // Connected elements to selected node for high contrast highlighting in large graphs
  const connectedElementIds = useMemo(() => {
    if (!selectedNode) return null;
    const ids = new Set<string>();
    ids.add(selectedNode.id);
    filteredRelationships.forEach((rel) => {
      if (rel.sourceId === selectedNode.id) ids.add(rel.targetId);
      if (rel.targetId === selectedNode.id) ids.add(rel.sourceId);
    });
    return ids;
  }, [selectedNode, filteredRelationships]);

  // Compute 2D node positions according to the selected layout algorithm
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (filteredElements.length === 0) return positions;

    const minX = 75;
    const maxX = 1075;
    const minY = 65;
    const maxY = 715;
    const cx = 575;
    const cy = 390;

    const layerOrder: ArchiMateLayer[] = [
      'Strategy',
      'Motivation',
      'Business',
      'Application',
      'Technology',
      'Implementation',
    ];

    // --- 1. LAYERED (Jerárquico por Capas TOGAF) ---
    if (layoutAlgorithm === 'layered') {
      const activeLayersInOrder = layerOrder.filter((l) => selectedLayers.has(l));
      const totalLayers = Math.max(1, activeLayersInOrder.length);
      const bandHeight = (maxY - minY) / totalLayers;

      activeLayersInOrder.forEach((layer, layerIdx) => {
        const layerElements = filteredElements.filter((e) => e.layer === layer);
        const count = layerElements.length;
        if (count === 0) return;

        const yBandStart = minY + layerIdx * bandHeight;

        // Dynamic multi-row wrapping if there are many elements in this layer
        const maxPerRow = count > 8 ? Math.ceil(count / 2) : count > 5 ? 5 : count;
        const subRows = Math.ceil(count / maxPerRow);
        const subRowHeight = bandHeight / (subRows + 1);

        layerElements.forEach((el, idx) => {
          const row = Math.floor(idx / maxPerRow);
          const col = idx % maxPerRow;
          const itemsInThisRow = Math.min(maxPerRow, count - row * maxPerRow);
          const xSpacing = (maxX - minX) / (itemsInThisRow + 1);
          const x = minX + (col + 1) * xSpacing;
          const y = yBandStart + (row + 1) * subRowHeight;
          positions.set(el.id, { x, y });
        });
      });

      return positions;
    }

    // --- 2. RADIAL (Concéntrico por Centralidad / Hubs) ---
    if (layoutAlgorithm === 'radial') {
      const sorted = [...filteredElements].sort((a, b) => b.totalDegree - a.totalDegree);
      const tier0: ArchiMateElement[] = [];
      const tier1: ArchiMateElement[] = [];
      const tier2: ArchiMateElement[] = [];

      sorted.forEach((el, index) => {
        if (el.totalDegree >= 4 || index < Math.max(1, Math.floor(sorted.length * 0.15))) {
          tier0.push(el);
        } else if (el.totalDegree >= 2 || index < Math.floor(sorted.length * 0.55)) {
          tier1.push(el);
        } else {
          tier2.push(el);
        }
      });

      const tiers = [
        { elements: tier0, radius: 125 },
        { elements: tier1, radius: 235 },
        { elements: tier2, radius: 340 },
      ];

      tiers.forEach(({ elements, radius }, tierIdx) => {
        const count = elements.length;
        if (count === 0) return;

        const angleOffset = tierIdx * (Math.PI / 6);
        const angleStep = (2 * Math.PI) / count;

        elements.forEach((el, i) => {
          const r = count > 10 ? radius + ((i % 2 === 0 ? -1 : 1) * 20) : radius;
          const theta = angleOffset + i * angleStep;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          positions.set(el.id, { x, y });
        });
      });

      return positions;
    }

    // --- 3. CLUSTERED (Celdas por Dominio / Bento) ---
    if (layoutAlgorithm === 'clustered') {
      const activeLayers = layerOrder.filter((l) => selectedLayers.has(l));
      const totalClusters = Math.max(1, activeLayers.length);
      const cols = totalClusters <= 2 ? totalClusters : totalClusters <= 4 ? 2 : 3;
      const rows = Math.ceil(totalClusters / cols);

      const cellWidth = (maxX - minX) / cols;
      const cellHeight = (maxY - minY) / rows;

      activeLayers.forEach((layer, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const cellLeft = minX + col * cellWidth;
        const cellTop = minY + row * cellHeight;
        const cellCx = cellLeft + cellWidth / 2;
        const cellCy = cellTop + cellHeight / 2 + 10;

        const layerElements = filteredElements.filter((e) => e.layer === layer);
        const count = layerElements.length;
        if (count === 0) return;

        if (count === 1) {
          positions.set(layerElements[0].id, { x: cellCx, y: cellCy });
        } else if (count <= 6) {
          const r = Math.min(cellWidth, cellHeight) * 0.32;
          const angleStep = (2 * Math.PI) / count;
          layerElements.forEach((el, i) => {
            const theta = i * angleStep - Math.PI / 2;
            const x = cellCx + r * Math.cos(theta);
            const y = cellCy + r * Math.sin(theta);
            positions.set(el.id, { x, y });
          });
        } else {
          const innerCols = Math.ceil(Math.sqrt(count * 1.3));
          const innerRows = Math.ceil(count / innerCols);
          const yStep = (cellHeight * 0.68) / (innerRows + 1);

          layerElements.forEach((el, i) => {
            const ic = i % innerCols;
            const ir = Math.floor(i / innerCols);
            const itemsInThisRow = Math.min(innerCols, count - ir * innerCols);
            const dynamicXStep = (cellWidth * 0.8) / (itemsInThisRow + 1);
            const x = cellLeft + cellWidth * 0.1 + (ic + 1) * dynamicXStep;
            const y = cellTop + cellHeight * 0.2 + (ir + 1) * yStep;
            positions.set(el.id, { x, y });
          });
        }
      });

      return positions;
    }

    // --- 4. FORCE-DIRECTED (Fuerza y Atracción Orgánica) ---
    const count = filteredElements.length;
    const posArray = filteredElements.map((el, idx) => {
      const angle = (2 * Math.PI * idx) / count;
      const layerIdx = Math.max(0, layerOrder.indexOf(el.layer));
      const initR = 190 + layerIdx * 20;
      return {
        id: el.id,
        x: cx + initR * Math.cos(angle) + ((idx % 3) - 1) * 15,
        y: cy + initR * Math.sin(angle) + ((idx % 2 === 0 ? 1 : -1) * 15),
        vx: 0,
        vy: 0,
      };
    });

    const posMap = new Map<string, (typeof posArray)[0]>();
    posArray.forEach((p) => posMap.set(p.id, p));

    const edges = filteredRelationships
      .map((rel) => ({
        source: posMap.get(rel.sourceId),
        target: posMap.get(rel.targetId),
      }))
      .filter(
        (e): e is { source: (typeof posArray)[0]; target: (typeof posArray)[0] } =>
          !!e.source && !!e.target
      );

    const k = Math.sqrt((800 * 520) / Math.max(count, 1)) * 0.85;
    const iterations = 85;
    let temp = 75;
    const cooling = 0.94;

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all pairs
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const p1 = posArray[i];
          const p2 = posArray[j];
          let dx = p1.x - p2.x;
          let dy = p1.y - p2.y;
          if (dx === 0 && dy === 0) {
            dx = (i % 2 === 0 ? 1 : -1) * 0.1;
            dy = (j % 2 === 0 ? 1 : -1) * 0.1;
          }
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 420) {
            const safeDist = Math.max(dist, 25);
            const force = (k * k) / safeDist;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            p1.vx += fx;
            p1.vy += fy;
            p2.vx -= fx;
            p2.vy -= fy;
          }
        }
      }

      // Attraction along relationships
      for (const edge of edges) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const force = (dist * dist) / k;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          edge.source.vx += fx;
          edge.source.vy += fy;
          edge.target.vx -= fx;
          edge.target.vy -= fy;
        }
      }

      // Center gravity
      for (const p of posArray) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        p.vx += dx * 0.045;
        p.vy += dy * 0.045;
      }

      // Step with temperature damping
      for (const p of posArray) {
        const vDist = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (vDist > 0) {
          const step = Math.min(vDist, temp);
          p.x += (p.vx / vDist) * step;
          p.y += (p.vy / vDist) * step;
        }
        p.x = Math.max(minX + 25, Math.min(maxX - 25, p.x));
        p.y = Math.max(minY + 25, Math.min(maxY - 25, p.y));
        p.vx = 0;
        p.vy = 0;
      }

      temp *= cooling;
    }

    posArray.forEach((p) => {
      positions.set(p.id, { x: p.x, y: p.y });
    });

    return positions;
  }, [filteredElements, selectedLayers, layoutAlgorithm, filteredRelationships]);

  // Background guide metadata for SVG
  const backgroundGuides = useMemo(() => {
    const layerOrder: ArchiMateLayer[] = [
      'Strategy',
      'Motivation',
      'Business',
      'Application',
      'Technology',
      'Implementation',
    ];
    const activeLayers = layerOrder.filter((l) => selectedLayers.has(l));

    if (layoutAlgorithm === 'layered') {
      const minY = 65;
      const maxY = 715;
      const bandHeight = (maxY - minY) / Math.max(1, activeLayers.length);
      return {
        type: 'layered' as const,
        bands: activeLayers.map((layer, idx) => ({
          layer,
          name: LAYER_CONFIG[layer].name,
          color: LAYER_CONFIG[layer].dotColor,
          yStart: minY + idx * bandHeight,
          height: bandHeight,
        })),
      };
    }

    if (layoutAlgorithm === 'clustered') {
      const minX = 75;
      const maxX = 1075;
      const minY = 65;
      const maxY = 715;
      const total = Math.max(1, activeLayers.length);
      const cols = total <= 2 ? total : total <= 4 ? 2 : 3;
      const rows = Math.ceil(total / cols);
      const cellWidth = (maxX - minX) / cols;
      const cellHeight = (maxY - minY) / rows;

      return {
        type: 'clustered' as const,
        cells: activeLayers.map((layer, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          return {
            layer,
            name: LAYER_CONFIG[layer].name,
            color: LAYER_CONFIG[layer].dotColor,
            left: minX + col * cellWidth,
            top: minY + row * cellHeight,
            width: cellWidth,
            height: cellHeight,
          };
        }),
      };
    }

    if (layoutAlgorithm === 'radial') {
      return {
        type: 'radial' as const,
        cx: 575,
        cy: 390,
        rings: [
          { r: 125, label: 'NÚCLEO / HUBS (Grado ≥ 4)', color: '#38bdf8' },
          { r: 235, label: 'ACOPLAMIENTO INTERMEDIO (Grado 2 - 3)', color: '#818cf8' },
          { r: 340, label: 'PERIFERIA / HOJAS (Grado 0 - 1)', color: '#94a3b8' },
        ],
      };
    }

    return {
      type: 'force' as const,
      cx: 575,
      cy: 390,
    };
  }, [selectedLayers, layoutAlgorithm]);

  // Group top components for Interoperability Matrix
  const matrixComponents = useMemo(() => {
    return filteredElements.filter((e) => e.layer === 'Application' || e.totalDegree >= 2).slice(0, 15);
  }, [filteredElements]);

  return (
    <div id="dependency-graph-container" className="space-y-4">
      {/* Export notification toast */}
      {exportSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{exportSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle: Graph vs Matrix */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 shadow-2xs">
            <button
              type="button"
              id="view-mode-graph-btn"
              onClick={() => setViewMode('graph')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'graph'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitGraph className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Red de Dependencias</span>
            </button>
            <button
              type="button"
              id="view-mode-matrix-btn"
              onClick={() => setViewMode('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Matriz de Interoperabilidad</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            ({filteredElements.length} elementos, {filteredRelationships.length} dependencias)
          </span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              id="graph-search-input"
              placeholder="Buscar en el grafo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-750 focus:border-cyan-500 dark:focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Zoom controls (for graph view) */}
          {viewMode === 'graph' && (
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                id="zoom-out-btn"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-600 dark:text-slate-300 font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                id="zoom-in-btn"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="zoom-reset-btn"
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 ml-0.5 transition-colors"
                title="Restablecer vista (100%)"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Export Dropdown Menu (JPG, PNG, PDF) */}
          {viewMode === 'graph' && (
            <div className="relative">
              <button
                type="button"
                id="export-graph-menu-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                title="Exportar diagrama a imagen JPG, PNG o documento PDF"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting ? `Exportando ${isExporting.toUpperCase()}...` : 'Exportar'}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-40 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Formatos de Exportación
                    </div>

                    <button
                      type="button"
                      id="export-png-btn"
                      onClick={() => handleExport('png')}
                      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <FileImage className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>Imagen PNG</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                            .png
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Alta resolución 2x nítida con fondo oscuro sólido.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="export-jpg-btn"
                      onClick={() => handleExport('jpg')}
                      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <FileImage className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>Imagen JPG</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold">
                            .jpg
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Formato estándar comprimido para documentación y web.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="export-pdf-btn"
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>Documento PDF</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold">
                            .pdf
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Formato A4 apaisado ejecutivo con membrete y metadatos.
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Controls Bar: Layout Algorithm Selector & Overlay Visibility Toggle */}
      {viewMode === 'graph' && (
        <div
          id="graph-layout-selector-bar"
          className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs transition-colors"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Diseño de Nodos:</span>
            </span>

            {/* Layout algorithm button pills */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 shadow-2xs flex-wrap">
              {GRAPH_LAYOUT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = layoutAlgorithm === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`layout-algo-btn-${opt.id}`}
                    onClick={() => handleLayoutChange(opt.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-600 dark:bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                    title={opt.description}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Layout Description */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-bold text-[10px] shrink-0">
                {currentLayoutOption.tag}
              </span>
              <span className="line-clamp-1">
                <strong className="text-slate-700 dark:text-slate-300">{currentLayoutOption.label}:</strong>{' '}
                {currentLayoutOption.bestFor}
              </span>
            </div>

            {/* Overlay toggle button to minimize/hide canvas overlay so it does not block the diagram */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                id="toggle-overlay-btn"
                onClick={() =>
                  handleOverlayModeChange(
                    overlayMode === 'expanded' ? 'minimized' : overlayMode === 'minimized' ? 'hidden' : 'expanded'
                  )
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                title="Alternar panel flotante en el lienzo: Minimizado / Expandido / Oculto"
              >
                {overlayMode === 'hidden' ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Panel: Oculto</span>
                  </>
                ) : overlayMode === 'minimized' ? (
                  <>
                    <Minus className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Panel: Minimizado</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Panel: Expandido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'graph' ? (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-inner relative overflow-hidden min-h-[600px]">
          {/* Layout & Navigation Floating Overlay: Minimized, Expanded or Hidden */}
          {overlayMode === 'minimized' && (
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 hover:bg-slate-900/95 backdrop-blur-md border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 text-xs flex items-center gap-2 shadow-lg transition-all animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => handleOverlayModeChange('expanded')}
                className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"
                title="Hacer clic para expandir selector de layout"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px]">
                  Diseño: <strong className="text-cyan-300 font-semibold">{currentLayoutOption.shortLabel}</strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hover:text-white ml-0.5" />
              </button>
              <div className="h-3 w-px bg-slate-800" />
              <button
                type="button"
                onClick={() => handleOverlayModeChange('hidden')}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
                title="Ocultar completamente del lienzo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {overlayMode === 'expanded' && (
            <div className="absolute top-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl text-slate-300 text-[11px] space-y-2.5 shadow-2xl max-w-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Navegación & Layout</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {currentLayoutOption.shortLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOverlayModeChange('minimized')}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Minimizar panel flotante"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOverlayModeChange('hidden')}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Ocultar del lienzo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-400 leading-tight">
                {currentLayoutOption.description}
              </p>

              {/* Quick Layout Switcher Pills inside overlay */}
              <div className="pt-1 border-t border-slate-800/70">
                <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Cambiar algoritmo:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {GRAPH_LAYOUT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = layoutAlgorithm === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleLayoutChange(opt.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-left truncate cursor-pointer ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredElements.length >= 10 && (
                <div className="text-[9.5px] text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/50 p-1.5 rounded flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0 text-cyan-400" />
                  <span>Para modelos grandes, prueba <strong>Radial Hubs</strong> o <strong>Celdas Dominio</strong>.</span>
                </div>
              )}
            </div>
          )}

          {overlayMode === 'hidden' && (
            <button
              type="button"
              onClick={() => handleOverlayModeChange('expanded')}
              className="absolute top-4 left-4 z-10 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-800/90 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-cyan-300 text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer group"
              title="Mostrar panel flotante de diseño"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
              <span className="text-[10.5px]">Diseño: {currentLayoutOption.shortLabel}</span>
            </button>
          )}

          {/* Selected Node Details Floating Overlay */}
          {selectedNode && (
            <div className="absolute top-4 right-4 z-10 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 p-4 rounded-xl text-white text-xs space-y-2.5 shadow-2xl max-w-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 text-sm truncate">{selectedNode.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div>
                  <span className="text-slate-500">Tipo:</span> {selectedNode.type}
                </div>
                <div>
                  <span className="text-slate-500">Capa:</span> {LAYER_CONFIG[selectedNode.layer].name}
                </div>
                <div>
                  <span className="text-slate-500">Conexiones:</span> {selectedNode.inDegree} entrantes,{' '}
                  {selectedNode.outDegree} salientes (Total: {selectedNode.totalDegree})
                </div>
                {selectedNode.documentation && (
                  <p className="text-slate-400 italic text-[10px] line-clamp-3 bg-slate-900 p-2 rounded border border-slate-800">
                    "{selectedNode.documentation}"
                  </p>
                )}
              </div>
              <button
                type="button"
                id="calculate-blast-radius-btn"
                onClick={() => onSelectElementForImpact(selectedNode.id)}
                className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Calcular Radio de Impacto</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* SVG Graph Canvas */}
          <div className="w-full h-[620px] overflow-auto flex items-center justify-center">
            <svg
              ref={svgRef}
              id="dependency-graph-svg"
              viewBox="0 0 1150 780"
              className="w-full h-full min-w-[900px] transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'svg') {
                  setSelectedNode(null);
                }
              }}
            >
              <defs>
                <marker
                  id="arrow-head"
                  markerWidth="8"
                  markerHeight="8"
                  refX="14"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#64748b" />
                </marker>
                <marker
                  id="arrow-head-active"
                  markerWidth="8"
                  markerHeight="8"
                  refX="14"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Layout Background Guides */}
              {backgroundGuides.type === 'layered' && (
                <g className="pointer-events-none select-none">
                  {backgroundGuides.bands.map((band) => (
                    <g key={band.layer}>
                      <line
                        x1={70}
                        y1={band.yStart}
                        x2={1080}
                        y2={band.yStart}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                      <rect
                        x={75}
                        y={band.yStart + 4}
                        width={130}
                        height={16}
                        rx="4"
                        fill="#0f172a"
                        opacity="0.8"
                      />
                      <text
                        x={82}
                        y={band.yStart + 16}
                        fill={band.color}
                        fontSize="9.5"
                        fontWeight="bold"
                        letterSpacing="0.5"
                      >
                        {band.name.toUpperCase()}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {backgroundGuides.type === 'radial' && (
                <g className="pointer-events-none select-none">
                  {backgroundGuides.rings.map((ring) => (
                    <g key={ring.r}>
                      <circle
                        cx={backgroundGuides.cx}
                        cy={backgroundGuides.cy}
                        r={ring.r}
                        fill="none"
                        stroke={ring.color}
                        strokeDasharray="5 5"
                        strokeWidth="1.2"
                        opacity="0.25"
                      />
                      <text
                        x={backgroundGuides.cx}
                        y={backgroundGuides.cy - ring.r - 5}
                        textAnchor="middle"
                        fill={ring.color}
                        fontSize="9"
                        fontWeight="bold"
                        opacity="0.75"
                      >
                        {ring.label}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {backgroundGuides.type === 'clustered' && (
                <g className="pointer-events-none select-none">
                  {backgroundGuides.cells.map((cell) => (
                    <g key={cell.layer}>
                      <rect
                        x={cell.left + 8}
                        y={cell.top + 8}
                        width={cell.width - 16}
                        height={cell.height - 16}
                        rx="12"
                        fill="none"
                        stroke={cell.color}
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                        opacity="0.28"
                      />
                      <rect
                        x={cell.left + 14}
                        y={cell.top + 12}
                        width={130}
                        height={16}
                        rx="4"
                        fill="#0f172a"
                        opacity="0.8"
                      />
                      <text
                        x={cell.left + 20}
                        y={cell.top + 24}
                        fill={cell.color}
                        fontSize="9.5"
                        fontWeight="bold"
                        letterSpacing="0.5"
                      >
                        {cell.name.toUpperCase()}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {backgroundGuides.type === 'force' && (
                <g className="pointer-events-none select-none opacity-20">
                  <line
                    x1={backgroundGuides.cx}
                    y1={backgroundGuides.cy - 50}
                    x2={backgroundGuides.cx}
                    y2={backgroundGuides.cy + 50}
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <line
                    x1={backgroundGuides.cx - 50}
                    y1={backgroundGuides.cy}
                    x2={backgroundGuides.cx + 50}
                    y2={backgroundGuides.cy}
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <circle
                    cx={backgroundGuides.cx}
                    cy={backgroundGuides.cy}
                    r={260}
                    fill="none"
                    stroke="#38bdf8"
                    strokeDasharray="6 6"
                    strokeWidth="1"
                  />
                </g>
              )}

              {/* Draw Edges */}
              {filteredRelationships.map((rel) => {
                const sourcePos = nodePositions.get(rel.sourceId);
                const targetPos = nodePositions.get(rel.targetId);
                if (!sourcePos || !targetPos) return null;

                const isConnectedToSelected =
                  selectedNode &&
                  (rel.sourceId === selectedNode.id || rel.targetId === selectedNode.id);

                const isDimmed = selectedNode && !isConnectedToSelected;

                return (
                  <g key={rel.id} className="group">
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isConnectedToSelected ? '#38bdf8' : isDimmed ? '#1e293b' : '#334155'}
                      strokeWidth={isConnectedToSelected ? 2.5 : 1.2}
                      strokeDasharray={rel.type === 'Flow' ? '4 3' : undefined}
                      markerEnd={isConnectedToSelected ? 'url(#arrow-head-active)' : 'url(#arrow-head)'}
                      opacity={isDimmed ? 0.3 : 1}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {filteredElements.map((el) => {
                const pos = nodePositions.get(el.id);
                if (!pos) return null;

                const config = LAYER_CONFIG[el.layer];
                const isSelected = selectedNode?.id === el.id;
                const isConnected = connectedElementIds ? connectedElementIds.has(el.id) : true;
                const nodeRadius = Math.max(14, Math.min(26, 12 + el.totalDegree * 1.5));

                return (
                  <g
                    key={el.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(el)}
                    className="cursor-pointer group"
                    opacity={isConnected ? 1 : 0.25}
                  >
                    <title>{`${el.name} (${el.type}) - Capa: ${config.name} - Conexiones: ${el.totalDegree}`}</title>

                    {/* Node Circle */}
                    <circle
                      r={nodeRadius}
                      fill={config.dotColor}
                      stroke={isSelected ? '#38bdf8' : '#0f172a'}
                      strokeWidth={isSelected ? 3.5 : 1.5}
                      className="transition-transform group-hover:scale-115"
                    />

                    {/* Degree counter inside node */}
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#0f172a"
                      className="select-none pointer-events-none"
                    >
                      {el.totalDegree}
                    </text>

                    {/* Node Label */}
                    <text
                      textAnchor="middle"
                      dy={nodeRadius + 14}
                      fontSize="9.5"
                      fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                      className="select-none pointer-events-none font-medium truncate"
                    >
                      {el.name.length > 22 ? el.name.slice(0, 20) + '...' : el.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Matrix Mode: Interoperability Matrix */
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 overflow-x-auto transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Matriz de Interacción e Interoperabilidad de Sistemas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cruzamiento de flujos de datos, dependencias de asignación y servicios entre componentes clave.
            </p>
          </div>
          <div className="min-w-[700px]">
            <table className="w-full text-[11px] border-collapse border border-slate-200 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="border border-slate-200 dark:border-slate-700 p-2 text-left text-slate-700 dark:text-slate-300 w-44">
                    Origen \ Destino
                  </th>
                  {matrixComponents.map((c) => (
                    <th
                      key={c.id}
                      className="border border-slate-200 dark:border-slate-700 p-1.5 text-slate-700 dark:text-slate-300 font-semibold text-center max-w-[100px] truncate"
                      title={c.name}
                    >
                      {c.name.slice(0, 12)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixComponents.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                    <td className="border border-slate-200 dark:border-slate-700 p-2 font-medium text-slate-800 dark:text-slate-200 truncate" title={source.name}>
                      {source.name}
                    </td>
                    {matrixComponents.map((target) => {
                      const isSelf = source.id === target.id;
                      const rel = model.relationships.find(
                        (r) => r.sourceId === source.id && r.targetId === target.id
                      );
                      return (
                        <td
                          key={target.id}
                          className={`border border-slate-200 dark:border-slate-700 p-1 text-center font-bold ${
                            isSelf
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600'
                              : rel
                              ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                          title={rel ? `${rel.type}: ${rel.name || 'dependencia'}` : undefined}
                        >
                          {isSelf ? '—' : rel ? '●' : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
