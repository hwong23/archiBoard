import React from 'react';
import { BookOpen, FileCode2, CheckCircle2, Layers, Cpu, ShieldCheck } from 'lucide-react';

export const DocExplanationView: React.FC = () => {
  return (
    <div id="doc-explanation-view" className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
          <span>Documentación y Análisis Técnico</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Análisis del Estándar XMI Base y Modelo de Arquitectura Empresarial PERSN
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Explicación detallada del formato de intercambio Open Group ArchiMate Exchange File Format
          (presentado en <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">modelobase xmi-2.md</code>) y su
          instanciación en el modelo empresarial adjunto (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">modeloarchimate.xml</code>).
        </p>
      </div>

      {/* Part 1: modelobase xmi-2.md */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode2 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            1. Análisis del Documento Base: Formato de Intercambio ArchiMate (XMI/XML)
          </h3>
        </div>

        <div className="prose prose-slate text-xs leading-relaxed space-y-3">
          <p>
            El documento <strong className="text-slate-850">modelobase xmi-2.md</strong> define la estructura oficial estandarizada por{' '}
            <strong>The Open Group</strong> para el intercambio interoperable de modelos ArchiMate (versiones 3.0, 3.1 y 3.2).
            A diferencia de formatos propietarios de herramientas CASE (como Archi, Enterprise Architect o Mega), este esquema XML garantiza la portabilidad semántica de:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">Estructura del Metamodelo XML</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li><code className="text-cyan-700 font-bold">&lt;model&gt;</code>: Raíz con identificador UUID y namespaces Open Group.</li>
                <li><code className="text-cyan-700 font-bold">&lt;elements&gt;</code>: Colección de elementos tipificados mediante <code className="text-slate-800">xsi:type</code>.</li>
                <li><code className="text-cyan-700 font-bold">&lt;relationships&gt;</code>: Conexiones dirigidas con <code className="text-slate-800">source</code>, <code className="text-slate-800">target</code> y tipo.</li>
                <li><code className="text-cyan-700 font-bold">&lt;organizations&gt;</code>: Agrupamiento jerárquico por carpetas y capas.</li>
                <li><code className="text-cyan-700 font-bold">&lt;views&gt;</code>: Vistas y diagramas con coordenadas 2D y nodos visuales.</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">Capas Semánticas ArchiMate 3.x</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li><strong>Estrategia:</strong> Capability, Resource, CourseOfAction.</li>
                <li><strong>Negocio:</strong> BusinessActor, BusinessProcess, BusinessObject, Contract.</li>
                <li><strong>Aplicación:</strong> ApplicationComponent, ApplicationFunction, DataObject.</li>
                <li><strong>Tecnología:</strong> Node, Device, SystemSoftware, Artifact.</li>
                <li><strong>Motivación:</strong> Stakeholder, Goal, Assessment, Requirement, Constraint.</li>
                <li><strong>Implementación:</strong> WorkPackage, Deliverable, Plateau, Gap.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: modeloarchimate.xml */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-cyan-600" />
          <h3 className="text-base font-bold text-slate-900">
            2. Comprensión del Modelo de Arquitectura Empresarial: PERSN
          </h3>
        </div>

        <div className="text-xs text-slate-700 leading-relaxed space-y-3">
          <p>
            El archivo <strong className="text-slate-900">modeloarchimate.xml</strong> modela la instauración del sistema ERP de la{' '}
            <strong>Personería de Bogotá D.C.</strong> en articulación con la <strong>Secretaría General (SG) de la Alcaldía Mayor</strong>,
            elaborado en el marco de la <strong>Agencia Nacional Digital</strong> y los lineamientos del <strong>Marco de Referencia de Arquitectura Empresarial (MRAE V3.0 MinTIC Colombia)</strong> y <strong>TOGAF 9.2/10</strong>.
          </p>

          <h4 className="font-bold text-slate-900 text-xs pt-1">
            Los Tres Subproyectos en Desarrollo Paralelo (Ingeniería Concurrente):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
              <span className="font-bold text-amber-900 block mb-1">1. ERP Financiero</span>
              <p className="text-slate-600 text-[11px]">
                Gestión presupuestal, PAC, obligaciones, causación, contabilidad general y articulación obligatoria
                con <strong>BOGDATA</strong> (sistema financiero distrital) e integración con la DIAN.
              </p>
            </div>

            <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded-lg">
              <span className="font-bold text-cyan-900 block mb-1">2. ERP Nómina</span>
              <p className="text-slate-600 text-[11px]">
                Operación basada en <strong>HUMANO® Core Nómina</strong> (On-Premise) y <strong>Trámites en Línea (Cloud SaaS)</strong>:
                administración de planta, hojas de vida, liquidación periódica, ausentismos y recobro de incapacidades.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-900 block mb-1">3. ERP Recursos Físicos</span>
              <p className="text-slate-600 text-[11px]">
                Almacén, órdenes de suministro, inventario de elementos devolutivos y de consumo, traslados de activos,
                bajas y conciliación contable directa.
              </p>
            </div>
          </div>

          <h4 className="font-bold text-slate-900 text-xs pt-2">
            Diagnóstico de Riesgos de Gobierno Arquitectónico en el Modelo:
          </h4>
          <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Riesgo Crítico Principal: Silos de Desarrollo</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-normal">
              El modelo documenta explícitamente que operar las líneas de Nómina, Financiero y Recursos Físicos de forma aislada
              conduciría a <em>inconsistencias en datos maestros institucionales, proliferación de interfaces punto a punto y desfases en salida a producción</em>.
            </p>
            <p className="text-[11px] text-slate-700">
              Para mitigar este riesgo, el modelo prescribe:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li><strong>Repositorio Central de Arquitectura (FNA/Mega/ArchiMate):</strong> Única fuente de verdad para requerimientos e interfaces.</li>
              <li><strong>Bitácora de Decisiones de Arquitectura (ADR):</strong> Registro trazable del consenso técnico.</li>
              <li><strong>Catálogo de Interfaces y Matriz de Interoperabilidad:</strong> Contratos formales de integración desacoplados de los fabricantes.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Part 3: Ingestion of Other Models */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            3. Ingesta Dinámica de Otros Modelos ArchiMate
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Esta plataforma cuenta con un motor de parsing XML nativo que permite alimentar{' '}
          <strong>cualquier archivo ArchiMate en formato Open Group XML/XMI</strong> (.xml, .archimate). Al cargar un archivo
          mediante el botón <em>"Alimentar Modelo XML"</em>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 mb-1">Cálculo Instantáneo de Métricas</strong>
            Recalcula densidad del grafo, grado de conectividad, distribución por capa y completitud de documentación.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 mb-1">Mapeo de Dependencias e Impacto</strong>
            Reconstruye el árbol de adyacencia de relaciones para calcular el radio de impacto transitivo aguas arriba y aguas abajo.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 mb-1">Auditoría de Gobernanza</strong>
            Identifica cuellos de botella estructurales, componentes aislados (huérfanos) y riesgos modelados.
          </div>
        </div>
      </div>
    </div>
  );
};
