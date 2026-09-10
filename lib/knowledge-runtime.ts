import type { AircraftReferenceKnowledge } from "./reference-knowledge.ts";
import type { AircraftKnowledgeContent, TrainingSourceReference } from "./universal-aircraft-content.ts";

export type RuntimeKnowledgeQuestion = {
  readonly id: string;
  readonly area: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly sourceLabels: readonly string[];
};

export type RuntimeKnowledgeContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly sourceNote?: string;
  readonly disclaimer?: string;
  readonly questions: readonly RuntimeKnowledgeQuestion[];
};

function universalSourceLabel(source: TrainingSourceReference): string {
  const context = [source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`].filter(Boolean).join(" · ");
  return `${source.manualId} · ${context}`;
}

export function normalizeUniversalKnowledge(content: AircraftKnowledgeContent): RuntimeKnowledgeContent {
  return {
    aircraftId: content.aircraftId,
    title: content.title,
    sourceNote: content.sourceNote,
    disclaimer: content.disclaimer,
    questions: content.questions.map((question) => ({
      id: question.id,
      area: question.area,
      prompt: question.prompt,
      choices: question.choices,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      sourceLabels: question.sources?.map(universalSourceLabel) ?? [],
    })),
  };
}

export function normalizeLegacyKnowledge(content: AircraftReferenceKnowledge): RuntimeKnowledgeContent {
  return {
    aircraftId: content.aircraftId,
    title: "Knowledge training",
    sourceNote: content.referenceNote,
    questions: content.questions.map((question) => ({
      id: question.id,
      area: question.area,
      prompt: question.prompt,
      choices: question.choices,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      sourceLabels: question.source.map((source) => `Ch ${source.chapter} · ${source.section} · p. ${source.manualPage}`),
    })),
  };
}
