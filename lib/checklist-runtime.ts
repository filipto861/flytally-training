import { splitChecklistChallenge } from "./checklist-training.ts";
import type { SimulatorFlightFlow } from "./simulator-checklists.ts";
import type { AircraftChecklistContent, TrainingSourceReference } from "./universal-aircraft-content.ts";

export type RuntimeChecklistItem = {
  readonly id: string;
  readonly challenge: string;
  readonly response?: string;
  readonly explanation?: string;
  readonly verification?: string;
  readonly procedureId?: string;
  readonly sourceLabel?: string;
};

export type RuntimeChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly RuntimeChecklistItem[];
};

export type RuntimeChecklist = {
  readonly aircraftId: string;
  readonly title: string;
  readonly estimatedMinutes?: number;
  readonly phases: readonly RuntimeChecklistPhase[];
};

export function formatChecklistAction(item: RuntimeChecklistItem): string {
  return item.response ? `${item.challenge} — ${item.response}` : item.challenge;
}

function formatSource(source: TrainingSourceReference): string {
  const location = [source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`].filter(Boolean).join(" · ");
  return location;
}

export function normalizeUniversalChecklist(content: AircraftChecklistContent): RuntimeChecklist {
  return {
    aircraftId: content.aircraftId,
    title: content.title,
    estimatedMinutes: content.estimatedMinutes,
    phases: [...content.phases]
      .sort((a, b) => a.sequence - b.sequence)
      .map((phase) => ({
        id: phase.id,
        title: phase.title,
        items: phase.items.map((item) => ({
          id: item.id,
          challenge: item.challenge,
          response: item.response,
          explanation: item.explanation,
          verification: item.verification,
          procedureId: item.procedureId,
          sourceLabel: item.sources?.map(formatSource).join(" · "),
        })),
      })),
  };
}

export function normalizeLegacyFlightFlow(flow: SimulatorFlightFlow): RuntimeChecklist {
  return {
    aircraftId: flow.aircraftId,
    title: flow.title,
    estimatedMinutes: flow.estimatedMinutes,
    phases: flow.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      items: phase.items.map((item) => {
        const challenge = splitChecklistChallenge(item.action);
        return {
          id: item.id,
          challenge: challenge.challenge,
          response: challenge.response ?? undefined,
          explanation: item.why,
          sourceLabel: `Ch ${item.source.chapter} · ${item.source.section} · p. ${item.source.manualPage}`,
        };
      }),
    })),
  };
}
