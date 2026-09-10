import type { TrainingContentDomain } from "./content-admin-types.ts";

export type DraftingSourceReference={
  readonly id:string;
  readonly chapter?:string;
  readonly section?:string;
  readonly pageLabel:string;
  readonly note?:string;
};

export type ContentDraftingRequest={
  readonly aircraftId:string;
  readonly domain:TrainingContentDomain;
  readonly contentKey:string;
  readonly goal:string;
  readonly sourceText:string;
  readonly sourceReferences:readonly DraftingSourceReference[];
};

export type ContentDraftingResult={
  readonly draft:Record<string,unknown>;
  readonly warnings:readonly string[];
  readonly sourceCoverage:readonly string[];
  readonly provider:string;
  readonly model:string;
  readonly responseId?:string;
};

export interface ContentDraftingProvider{
  createDraft(request:ContentDraftingRequest):Promise<ContentDraftingResult>;
}

const guidance:Record<TrainingContentDomain,string>={
  checklists:"Target AircraftChecklistContent: aircraftId, title and ordered phases. Keep checklist items operationally concise with challenge/response; add explanation, verification and procedureId only when supported by the source. Do not invent procedures, settings or values.",
  procedures:"Target AircraftProcedureContent: aircraftId, title and procedures with ordered steps. Preserve prerequisites, actions, expected results, verification, rationale and warning/caution/note material only when supported by the source.",
  performance:"Target AircraftPerformanceContent: aircraftId, title and structured datasets with explicit axes, outputs and rows. Preserve source table values exactly. Default interpolation to none; never infer or interpolate values unless the source explicitly permits it.",
  limitations:"Target AircraftLimitationsContent: aircraftId, title and limitation groups/items. Preserve units, conditions, configuration applicability and warning/caution/note text. Do not convert guidance into a limitation unless the source states it as one.",
  systems:"Target AircraftSystemsContent: aircraftId, title and system lessons. Explain components, controls, indications, normal operation, limitations and abnormal cues without inventing installed equipment or flattening configuration differences.",
  flows:"Target AircraftFlowsContent: aircraftId, title and ordered flows. A flow is a memory/sequence aid; do not silently turn a checklist into a flow or add actions not present in the source.",
  avionics:"Target AircraftAvionicsContent: aircraftId, title and configuration-specific avionics topics. Preserve equipment applicability and procedures exactly as supported by the selected source.",
  knowledge:"Target AircraftKnowledgeContent: aircraftId, title and source-grounded questions. Explanations must stay within the supplied source material and must not introduce unsupported technical claims.",
  learning:"Legacy migration domain. Target AircraftLearningContent when contentKey is bundle: aircraftId, quickStartTitle, quickStartDescription, quickStart topics, and essential system lessons. Technical statements and remember items must carry source objects with chapter, section and manualPage.",
  "normal-flight":"Legacy migration domain. Target SimulatorFlightFlow when contentKey is bundle: aircraftId, title, estimatedMinutes, sourceNote and ordered phases with checklist items. Every checklist item must carry a source object.",
  orientation:"Legacy migration domain. Target CockpitOrientation when contentKey is bundle: aircraftId, title, sourceNote, generic cockpit regions and controls. Do not invent exact switch coordinates; every control mapping must have a source object.",
  abnormal:"Target AircraftAbnormalEmergencyContent: aircraftId, title and source-backed scenarios. Scenario stages are data-defined and may differ by aircraft or procedure; do not force a fixed four-stage sequence. Every stage requires explicit source references. Preserve configuration applicability, cautions and warnings, and never invent memory items, immediate actions or equipment-specific steps that are not supported by the supplied source.",
  "reference-knowledge":"Legacy migration domain. Target AircraftReferenceKnowledge when contentKey is bundle: aircraftId, referenceNote, Quick Reference groups/items and knowledge questions. Do not turn variable performance data into false universal fixed values. Every technical item/question must carry sources.",
};

export function getDomainDraftingGuidance(domain:TrainingContentDomain):string{return guidance[domain];}
