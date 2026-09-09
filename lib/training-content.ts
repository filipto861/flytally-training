export type TrainingContentApprovalState = "DRAFT" | "APPROVED" | "STALE";

export type ManualSourceReference = {
  manualId: string;
  revisionId: string;
  section?: string;
  page?: number;
};

export type TrainingContentPublicationEvidence = {
  approvalState: TrainingContentApprovalState;
  sources: readonly ManualSourceReference[];
};

export function canPublishTrainingContent(
  evidence: TrainingContentPublicationEvidence,
): boolean {
  return evidence.approvalState === "APPROVED" && evidence.sources.length > 0;
}
