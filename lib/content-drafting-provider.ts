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
  learning:"Target AircraftLearningContent when contentKey is bundle: aircraftId, quickStartTitle, quickStartDescription, quickStart topics, and essential system lessons. Technical statements and remember items must carry source objects with chapter, section and manualPage.",
  "normal-flight":"Target SimulatorFlightFlow when contentKey is bundle: aircraftId, title, estimatedMinutes, sourceNote and ordered phases with checklist items. Every checklist item must carry a source object.",
  orientation:"Target CockpitOrientation when contentKey is bundle: aircraftId, title, sourceNote, generic cockpit regions and controls. Do not invent exact switch coordinates; every control mapping must have a source object.",
  abnormal:"Target AircraftAbnormalTraining when contentKey is bundle: aircraftId, sourceNote, disclaimer and scenarios. Every scenario uses exactly recognition, control, immediate and continue stages, each with source references. Never invent memory items not supported by the source.",
  "reference-knowledge":"Target AircraftReferenceKnowledge when contentKey is bundle: aircraftId, referenceNote, Quick Reference groups/items and knowledge questions. Do not turn variable performance data into false universal fixed values. Every technical item/question must carry sources.",
};

export function getDomainDraftingGuidance(domain:TrainingContentDomain):string{return guidance[domain];}
