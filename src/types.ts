export type ArchiMateLayer = 
  | 'Strategy'
  | 'Business'
  | 'Application'
  | 'Technology'
  | 'Motivation'
  | 'Implementation'
  | 'Other';

export interface ArchiMateProperty {
  key: string;
  name: string;
  value: string;
}

export interface ArchiMateElement {
  id: string;
  name: string;
  type: string;
  layer: ArchiMateLayer;
  documentation: string;
  properties: ArchiMateProperty[];
  inDegree: number;
  outDegree: number;
  totalDegree: number;
}

export interface ArchiMateRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName?: string;
  targetName?: string;
  type: string;
  name?: string;
  accessType?: string;
  documentation?: string;
}

export interface ArchiMateView {
  id: string;
  name: string;
  documentation?: string;
  viewpoint?: string;
  nodeCount: number;
  connectionCount: number;
}

export interface ArchiMateModel {
  id: string;
  name: string;
  documentation: string;
  elements: Map<string, ArchiMateElement>;
  elementsList: ArchiMateElement[];
  relationships: ArchiMateRelationship[];
  views: ArchiMateView[];
  propertyDefinitions: Map<string, string>;
  sourceXml?: string;
}

export interface GovernanceRisk {
  id: string;
  code: string;
  name: string;
  category: 'Governance' | 'Architecture' | 'Integration' | 'Technical' | 'Operation';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  impactScore: number; // 1-100
  mitigationStrategy: string;
  affectedElementIds: string[];
  associatedGoal?: string;
}

export interface ArchitectureMetrics {
  totalElements: number;
  totalRelationships: number;
  layerCounts: Record<ArchiMateLayer, number>;
  elementTypesCount: Record<string, number>;
  relationshipTypesCount: Record<string, number>;
  density: number; // relationships / possible connections
  averageDegree: number;
  isolatedElementsCount: number;
  highCouplingElements: ArchiMateElement[];
  documentedRatio: number;
  modularityScore: number; // 0 - 100
  stabilityIndex: number;  // 0 - 100
}

export interface ImpactNode {
  element: ArchiMateElement;
  depth: number;
  direction: 'upstream' | 'downstream';
  viaRelationship: ArchiMateRelationship;
}

export interface ImpactAnalysisResult {
  rootElement: ArchiMateElement;
  upstream: ImpactNode[];
  downstream: ImpactNode[];
  affectedLayers: Set<ArchiMateLayer>;
  totalAffected: number;
  riskRating: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
}

export type GraphLayoutAlgorithm = 'layered' | 'force' | 'radial' | 'clustered';
