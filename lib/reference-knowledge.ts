export type ReferenceSource = {
  readonly chapter: number;
  readonly section: string;
  readonly manualPage: string;
};

export type QuickReferenceItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  readonly source: readonly ReferenceSource[];
};

export type QuickReferenceGroup = {
  readonly id: string;
  readonly title: string;
  readonly flyPriority: number;
  readonly items: readonly QuickReferenceItem[];
};

export type KnowledgeQuestion = {
  readonly id: string;
  readonly area: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly source: readonly ReferenceSource[];
};

export type AircraftReferenceKnowledge = {
  readonly aircraftId: string;
  readonly referenceNote: string;
  readonly groups: readonly QuickReferenceGroup[];
  readonly questions: readonly KnowledgeQuestion[];
};
