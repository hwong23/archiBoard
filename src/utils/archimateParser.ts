import { ArchiMateElement, ArchiMateLayer, ArchiMateModel, ArchiMateProperty, ArchiMateRelationship, ArchiMateView } from '../types';

export function getLayerFromType(type: string): ArchiMateLayer {
  const t = (type || '').toLowerCase();
  if (t.includes('capability') || t.includes('resource') || t.includes('courseofaction') || t.includes('valuestream')) {
    return 'Strategy';
  }
  if (t.startsWith('business') || t.includes('contract') || t.includes('representation')) {
    return 'Business';
  }
  if (t.startsWith('application') || t.includes('dataobject')) {
    return 'Application';
  }
  if (t.includes('technology') || t.includes('node') || t.includes('device') || t.includes('systemsoftware') || t.includes('artifact') || t.includes('communicationnetwork') || t.includes('path') || t.includes('facility') || t.includes('equipment')) {
    return 'Technology';
  }
  if (t.includes('stakeholder') || t.includes('driver') || t.includes('assessment') || t.includes('goal') || t.includes('outcome') || t.includes('principle') || t.includes('requirement') || t.includes('constraint') || t.includes('meaning') || t.includes('value')) {
    return 'Motivation';
  }
  if (t.includes('workpackage') || t.includes('deliverable') || t.includes('implementationevent') || t.includes('plateau') || t.includes('gap')) {
    return 'Implementation';
  }
  return 'Other';
}

export function parseArchiMateXml(xmlString: string): ArchiMateModel {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Error al analizar el XML: ' + parserError.textContent?.slice(0, 100));
  }

  const modelNode = xmlDoc.querySelector('model') || xmlDoc.documentElement;
  const modelId = modelNode.getAttribute('identifier') || 'model-root';

  // Get name
  let modelName = 'Modelo ArchiMate';
  const nameNode = modelNode.querySelector(':scope > name');
  if (nameNode && nameNode.textContent) {
    modelName = nameNode.textContent.trim();
  }

  // Get documentation
  let modelDoc = '';
  const docNode = modelNode.querySelector(':scope > documentation');
  if (docNode && docNode.textContent) {
    modelDoc = docNode.textContent.trim();
  }

  // Property definitions
  const propertyDefinitions = new Map<string, string>();
  const propDefNodes = xmlDoc.querySelectorAll('propertyDefinition');
  propDefNodes.forEach((p) => {
    const id = p.getAttribute('identifier');
    const name = p.querySelector('name')?.textContent || id || '';
    if (id) {
      propertyDefinitions.set(id, name.trim());
    }
  });

  // Elements
  const elementsMap = new Map<string, ArchiMateElement>();
  const elementNodes = xmlDoc.querySelectorAll('element');
  
  elementNodes.forEach((node) => {
    const id = node.getAttribute('identifier');
    if (!id) return;
    
    const rawType = node.getAttribute('xsi:type') || node.getAttribute('type') || 'Unknown';
    const cleanType = rawType.replace(/^archimate:/, '').replace(/^xsi:/, '');
    const name = node.querySelector('name')?.textContent?.trim() || id;
    const doc = node.querySelector('documentation')?.textContent?.trim() || '';

    const properties: ArchiMateProperty[] = [];
    const propNodes = node.querySelectorAll(':scope > properties > property, :scope > property');
    propNodes.forEach((pn) => {
      const ref = pn.getAttribute('propertyDefinitionRef') || '';
      const val = pn.querySelector('value')?.textContent?.trim() || pn.getAttribute('value') || '';
      const propName = propertyDefinitions.get(ref) || ref || 'Propiedad';
      if (val || propName) {
        properties.push({ key: ref, name: propName, value: val });
      }
    });

    const layer = getLayerFromType(cleanType);

    elementsMap.set(id, {
      id,
      name,
      type: cleanType,
      layer,
      documentation: doc,
      properties,
      inDegree: 0,
      outDegree: 0,
      totalDegree: 0,
    });
  });

  // Relationships
  const relationships: ArchiMateRelationship[] = [];
  const relNodes = xmlDoc.querySelectorAll('relationship');
  
  relNodes.forEach((node) => {
    const id = node.getAttribute('identifier') || `rel-${Math.random().toString(36).substr(2, 9)}`;
    const sourceId = node.getAttribute('source') || '';
    const targetId = node.getAttribute('target') || '';
    const rawType = node.getAttribute('xsi:type') || node.getAttribute('type') || 'Association';
    const cleanType = rawType.replace(/^archimate:/, '').replace(/^xsi:/, '');
    const name = node.querySelector('name')?.textContent?.trim() || node.getAttribute('name') || '';
    const doc = node.querySelector('documentation')?.textContent?.trim() || '';
    const accessType = node.getAttribute('accessType') || undefined;

    const sourceElem = elementsMap.get(sourceId);
    const targetElem = elementsMap.get(targetId);

    if (sourceElem) {
      sourceElem.outDegree += 1;
      sourceElem.totalDegree += 1;
    }
    if (targetElem) {
      targetElem.inDegree += 1;
      targetElem.totalDegree += 1;
    }

    relationships.push({
      id,
      sourceId,
      targetId,
      sourceName: sourceElem?.name || sourceId,
      targetName: targetElem?.name || targetId,
      type: cleanType,
      name,
      accessType,
      documentation: doc,
    });
  });

  // Views / Diagrams
  const views: ArchiMateView[] = [];
  const viewNodes = xmlDoc.querySelectorAll('view');
  viewNodes.forEach((vn) => {
    const id = vn.getAttribute('identifier') || '';
    const name = vn.querySelector('name')?.textContent?.trim() || 'Vista sin título';
    const doc = vn.querySelector('documentation')?.textContent?.trim() || '';
    const viewpoint = vn.getAttribute('viewpoint') || undefined;
    const nodeCount = vn.querySelectorAll('node').length;
    const connectionCount = vn.querySelectorAll('connection').length;

    views.push({
      id,
      name,
      documentation: doc,
      viewpoint,
      nodeCount,
      connectionCount,
    });
  });

  const elementsList = Array.from(elementsMap.values());

  return {
    id: modelId,
    name: modelName,
    documentation: modelDoc,
    elements: elementsMap,
    elementsList,
    relationships,
    views,
    propertyDefinitions,
    sourceXml: xmlString,
  };
}
