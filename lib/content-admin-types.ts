export const trainingContentDomains = [
  "learning",
  "normal-flight",
  "orientation",
  "abnormal",
  "reference-knowledge",
] as const;

export type TrainingContentDomain = typeof trainingContentDomains[number];
export type ContentVersionOrigin = "human" | "ai-assisted" | "import" | "bootstrap-migration";
export type ContentVersionState = "draft" | "approved" | "published" | "stale" | "archived";

export type AdminAircraftSummary = {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly displayName: string;
  readonly status: "draft" | "published";
  readonly variants: readonly string[];
  readonly manualRevisionCount: number;
  readonly contentItemCount: number;
  readonly staleCount: number;
};

export type AdminManualRevision = {
  readonly manualId: string;
  readonly revisionId: string;
  readonly title: string;
  readonly publisher: string;
  readonly revision: string;
  readonly issueDate: string;
  readonly sourceKind: string;
  readonly sourceUri?: string;
  readonly checksumSha256?: string;
};

export type AdminSourceReference = {
  readonly id: string;
  readonly revisionId: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
  readonly note?: string;
};

export type AdminContentVersion = {
  readonly id: string;
  readonly domain: TrainingContentDomain;
  readonly contentKey: string;
  readonly versionNo: number;
  readonly state: ContentVersionState;
  readonly origin: ContentVersionOrigin;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly approvedBy?: string;
  readonly publishedAt?: string;
};

export type AdminAircraftDetail = AdminAircraftSummary & {
  readonly manuals: readonly AdminManualRevision[];
  readonly sourceReferences: readonly AdminSourceReference[];
  readonly contentVersions: readonly AdminContentVersion[];
};
