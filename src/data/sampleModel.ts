import { parseArchiMateXml } from '../utils/archimateParser';
import { ArchiMateModel } from '../types';

export async function loadInitialModel(): Promise<ArchiMateModel> {
  try {
    const res = await fetch('/modeloarchimate.xml');
    if (res.ok) {
      const xmlText = await res.text();
      return parseArchiMateXml(xmlText);
    }
  } catch (e) {
    console.warn('Could not fetch /modeloarchimate.xml, using embedded template', e);
  }

  // Minimal fallback model if network fetch is blocked
  const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://www.opengroup.org/xsd/archimate/3.0/" identifier="id-fallback">
  <name>PERSN - ERP Personería</name>
  <documentation>Proyecto instauración ERP Personería. Documentación de Arquitectura.</documentation>
  <elements>
    <element identifier="id-c47" xsi:type="Capability"><name>Línea ERP Financiero</name></element>
    <element identifier="id-7bb" xsi:type="Capability"><name>Línea ERP Nómina</name></element>
    <element identifier="id-e7e" xsi:type="Capability"><name>Línea ERP Recursos Físicos</name></element>
    <element identifier="id-bog" xsi:type="ApplicationComponent"><name>BOGDATA</name></element>
    <element identifier="id-hum" xsi:type="ApplicationComponent"><name>sys: Nómina Humano</name></element>
    <element identifier="id-fin" xsi:type="ApplicationComponent"><name>sys: Financiero PCT</name></element>
  </elements>
  <relationships>
    <relationship identifier="r1" source="id-bog" target="id-fin" xsi:type="Flow"><name>Integración</name></relationship>
    <relationship identifier="r2" source="id-hum" target="id-7bb" xsi:type="Realization" />
  </relationships>
</model>`;

  return parseArchiMateXml(fallbackXml);
}
