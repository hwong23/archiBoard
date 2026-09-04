import {
  ArchiMateElement,
  ArchiMateLayer,
  ArchiMateModel,
  ArchitectureMetrics,
  GovernanceRisk,
  ImpactAnalysisResult,
  ImpactNode,
} from '../types';

export function calculateMetrics(
  model: ArchiMateModel,
  selectedLayers?: Set<ArchiMateLayer>
): ArchitectureMetrics {
  const layerCounts: Record<ArchiMateLayer, number> = {
    Strategy: 0,
    Business: 0,
    Application: 0,
    Technology: 0,
    Motivation: 0,
    Implementation: 0,
    Other: 0,
  };

  const elementTypesCount: Record<string, number> = {};
  const relationshipTypesCount: Record<string, number> = {};

  // Count elements per layer in the whole model
  model.elementsList.forEach((el) => {
    layerCounts[el.layer] = (layerCounts[el.layer] || 0) + 1;
  });

  // Filter active elements based on selectedLayers
  const activeElements = selectedLayers
    ? model.elementsList.filter((el) => selectedLayers.has(el.layer))
    : model.elementsList;

  const activeElementIds = new Set(activeElements.map((el) => el.id));

  let documentedCount = 0;
  const isolatedElements: ArchiMateElement[] = [];

  activeElements.forEach((el) => {
    elementTypesCount[el.type] = (elementTypesCount[el.type] || 0) + 1;

    if (el.documentation && el.documentation.trim().length > 5) {
      documentedCount += 1;
    }
  });

  // Active relationships connecting active elements
  const activeRelationships = model.relationships.filter(
    (rel) => activeElementIds.has(rel.sourceId) && activeElementIds.has(rel.targetId)
  );

  activeRelationships.forEach((rel) => {
    relationshipTypesCount[rel.type] = (relationshipTypesCount[rel.type] || 0) + 1;
  });

  // Compute connectivity within the active layer subset
  const degreeInActive = new Map<string, { in: number; out: number; total: number }>();
  activeElements.forEach((el) => {
    degreeInActive.set(el.id, { in: 0, out: 0, total: 0 });
  });

  activeRelationships.forEach((rel) => {
    const s = degreeInActive.get(rel.sourceId);
    if (s) {
      s.out += 1;
      s.total += 1;
    }
    const t = degreeInActive.get(rel.targetId);
    if (t) {
      t.in += 1;
      t.total += 1;
    }
  });

  activeElements.forEach((el) => {
    const deg = degreeInActive.get(el.id);
    if (!deg || deg.total === 0) {
      isolatedElements.push(el);
    }
  });

  const totalElements = activeElements.length;
  const totalRelationships = activeRelationships.length;
  const maxPossibleConnections = totalElements > 1 ? totalElements * (totalElements - 1) : 1;
  const density = totalElements > 1 ? Number((totalRelationships / maxPossibleConnections).toFixed(4)) : 0;
  const averageDegree = totalElements > 0 ? Number(((totalRelationships * 2) / totalElements).toFixed(2)) : 0;

  // Find high-coupling hubs strictly among active elements
  const sortedByDegree = [...activeElements].sort((a, b) => {
    const degA = degreeInActive.get(a.id)?.total ?? a.totalDegree;
    const degB = degreeInActive.get(b.id)?.total ?? b.totalDegree;
    return degB - degA;
  });
  const highCouplingElements = sortedByDegree.filter((el) => {
    const deg = degreeInActive.get(el.id)?.total ?? el.totalDegree;
    return deg >= 2;
  }).slice(0, 10);

  const documentedRatio = totalElements > 0 ? Math.round((documentedCount / totalElements) * 100) : 0;
  
  // Modularity score based on balance and low isolated count
  const isolatedPenalty = totalElements > 0 ? (isolatedElements.length / totalElements) * 30 : 0;
  const modularityScore = Math.max(20, Math.min(95, Math.round(85 - isolatedPenalty + (averageDegree > 2 ? 10 : 0))));
  const stabilityIndex = Math.max(30, Math.min(98, Math.round(75 - (highCouplingElements.length > 5 ? 15 : 5))));

  return {
    totalElements,
    totalRelationships,
    layerCounts,
    elementTypesCount,
    relationshipTypesCount,
    density,
    averageDegree,
    isolatedElementsCount: isolatedElements.length,
    highCouplingElements,
    documentedRatio,
    modularityScore,
    stabilityIndex,
  };
}

export function extractGovernanceRisks(model: ArchiMateModel): GovernanceRisk[] {
  const risks: GovernanceRisk[] = [];

  // Look for modeled constraints/assessments with "riesgo" or "ALS" or "debilidad"
  model.elementsList.forEach((el) => {
    const lowerName = el.name.toLowerCase();
    const lowerDoc = (el.documentation || '').toLowerCase();

    if (
      lowerName.includes('riesgo') ||
      lowerName.includes('silos') ||
      lowerName.includes('debilidad') ||
      lowerName.includes('preocupacion') ||
      lowerName.includes('als0') ||
      el.type === 'Constraint' ||
      el.type === 'Assessment'
    ) {
      // Determine severity
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      let category: GovernanceRisk['category'] = 'Governance';
      let impactScore = 55;

      if (lowerName.includes('silos') || lowerName.includes('r06') || lowerName.includes('principal')) {
        severity = 'Critical';
        category = 'Architecture';
        impactScore = 95;
      } else if (lowerName.includes('r02') || lowerName.includes('r03') || lowerName.includes('orquest') || lowerName.includes('dependencia')) {
        severity = 'High';
        category = 'Integration';
        impactScore = 80;
      } else if (lowerName.includes('r04') || lowerName.includes('adaptador') || lowerName.includes('tecnico') || lowerName.includes('als05')) {
        severity = 'High';
        category = 'Technical';
        impactScore = 75;
      } else if (lowerName.includes('r01') || lowerName.includes('agilidad') || lowerName.includes('trazabilidad') || lowerName.includes('r07')) {
        severity = 'Medium';
        category = 'Governance';
        impactScore = 65;
      } else if (lowerName.includes('complejidad') || lowerName.includes('costo') || lowerName.includes('impacto')) {
        severity = 'Medium';
        category = 'Operation';
        impactScore = 60;
      }

      // Find affected elements through relationships
      const affectedIds = model.relationships
        .filter((r) => r.sourceId === el.id || r.targetId === el.id)
        .map((r) => (r.sourceId === el.id ? r.targetId : r.sourceId));

      let mitigation = 'Implementar contratos de interfaz estándar y orquestación unificada en repositorio de arquitectura.';
      if (lowerName.includes('silos')) {
        mitigation = 'Establecer mesa conjunta de arquitectura, modelo común de datos y contratos OpenAPI/SOA para evitar acoplamiento directo entre Nómina, Financiero y RR. Físicos.';
      } else if (lowerName.includes('orquest') || lowerName.includes('adaptador')) {
        mitigation = 'Desplegar bus de servicios o API Gateway distrital (BOGDATA/SOA) evitando adaptadores propietarios ad-hoc.';
      } else if (lowerName.includes('trazabilidad')) {
        mitigation = 'Gestionar requerimientos y decisiones arquitectónicas (ADR) con trazabilidad bidireccional en el repositorio FNA/ArchiMate.';
      }

      risks.push({
        id: el.id,
        code: el.name.match(/^R\d+/)?.[0] || el.name.match(/^ALS\d+/)?.[0] || 'GR-' + risks.length,
        name: el.name,
        category,
        severity,
        description: el.documentation || 'Riesgo de gobierno arquitectónico documentado en el modelo.',
        impactScore,
        mitigationStrategy: mitigation,
        affectedElementIds: affectedIds,
      });
    }
  });

  // If no explicit risks found, generate architectural governance diagnostics
  if (risks.length === 0) {
    const metrics = calculateMetrics(model);
    if (metrics.isolatedElementsCount > 0) {
      risks.push({
        id: 'auto-orphan',
        code: 'R-ORPHAN',
        name: 'Elementos Arquitectónicos Huérfanos',
        category: 'Governance',
        severity: 'Medium',
        description: `Se detectaron ${metrics.isolatedElementsCount} elementos sin relaciones ni dependencias en el modelo.`,
        impactScore: 50,
        mitigationStrategy: 'Vincular los componentes huérfanos a procesos de negocio, flujos de datos o paquetes de trabajo.',
        affectedElementIds: [],
      });
    }

    if (metrics.highCouplingElements.length > 0) {
      risks.push({
        id: 'auto-coupling',
        code: 'R-COUPLING',
        name: 'Concentración de Dependencias Punto a Punto',
        category: 'Integration',
        severity: 'High',
        description: `Componentes con alto grado de acoplamiento (${metrics.highCouplingElements.map(e => e.name).slice(0, 3).join(', ')}) representan puntos únicos de fallo.`,
        impactScore: 85,
        mitigationStrategy: 'Intermediar integraciones mediante servicios desacoplados y contratos estandarizados.',
        affectedElementIds: metrics.highCouplingElements.map(e => e.id),
      });
    }
  }

  return risks;
}

export function calculateImpact(
  model: ArchiMateModel,
  targetElementId: string,
  maxDepth: number = 3
): ImpactAnalysisResult | null {
  const root = model.elements.get(targetElementId);
  if (!root) return null;

  const upstream: ImpactNode[] = [];
  const downstream: ImpactNode[] = [];
  const affectedLayers = new Set<ArchiMateLayer>([root.layer]);

  const visitedUpstream = new Set<string>([root.id]);
  const visitedDownstream = new Set<string>([root.id]);

  // Downstream: Elements that target depends on (outgoing relationships or source -> target)
  // i.e., what breaks if the target changes or fails? Elements pointing to root (upstream) and elements root points to (downstream).
  // Upstream: elements that consume or depend on root
  function traceUpstream(currentId: string, currentDepth: number) {
    if (currentDepth > maxDepth) return;
    const incoming = model.relationships.filter((r) => r.targetId === currentId);
    incoming.forEach((rel) => {
      if (!visitedUpstream.has(rel.sourceId)) {
        visitedUpstream.add(rel.sourceId);
        const el = model.elements.get(rel.sourceId);
        if (el) {
          affectedLayers.add(el.layer);
          upstream.push({
            element: el,
            depth: currentDepth,
            direction: 'upstream',
            viaRelationship: rel,
          });
          traceUpstream(rel.sourceId, currentDepth + 1);
        }
      }
    });
  }

  // Downstream: elements that root uses or triggers
  function traceDownstream(currentId: string, currentDepth: number) {
    if (currentDepth > maxDepth) return;
    const outgoing = model.relationships.filter((r) => r.sourceId === currentId);
    outgoing.forEach((rel) => {
      if (!visitedDownstream.has(rel.targetId)) {
        visitedDownstream.add(rel.targetId);
        const el = model.elements.get(rel.targetId);
        if (el) {
          affectedLayers.add(el.layer);
          downstream.push({
            element: el,
            depth: currentDepth,
            direction: 'downstream',
            viaRelationship: rel,
          });
          traceDownstream(rel.targetId, currentDepth + 1);
        }
      }
    });
  }

  traceUpstream(root.id, 1);
  traceDownstream(root.id, 1);

  const totalAffected = upstream.length + downstream.length;
  let riskRating: 'Crítico' | 'Alto' | 'Medio' | 'Bajo' = 'Bajo';
  if (totalAffected > 15 || affectedLayers.size >= 4) {
    riskRating = 'Crítico';
  } else if (totalAffected > 8 || affectedLayers.size >= 3) {
    riskRating = 'Alto';
  } else if (totalAffected > 3) {
    riskRating = 'Medio';
  }

  return {
    rootElement: root,
    upstream,
    downstream,
    affectedLayers,
    totalAffected,
    riskRating,
  };
}
