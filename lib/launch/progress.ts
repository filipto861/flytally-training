import type { PersistedTrainingProgressEvent, TrainingActivityKind } from "../progress-events.ts";
import type { TrainingProgressRepository } from "../progress-repository.ts";

export type LaunchTrainingDestination = {
  readonly route: string;
  readonly label: string;
};

const destinations: Readonly<Record<TrainingActivityKind, LaunchTrainingDestination>> = {
  "quick-start": { route: "quick-start", label: "Quick Start" },
  systems: { route: "systems", label: "Systems" },
  avionics: { route: "avionics", label: "Avionics" },
  orientation: { route: "orientation", label: "Cockpit orientation" },
  "normal-flight": { route: "checklists", label: "Checklist training" },
  "checklist-phase": { route: "checklists", label: "Checklist training" },
  procedure: { route: "procedures", label: "Procedures" },
  flow: { route: "flows", label: "Flows" },
  scenario: { route: "abnormal", label: "Abnormal practice" },
  knowledge: { route: "knowledge", label: "Knowledge" },
};

export async function loadLatestLaunchTrainingEvent(
  repository: TrainingProgressRepository,
  accountSubject: string,
  aircraftId: string,
): Promise<PersistedTrainingProgressEvent | undefined> {
  const events = await repository.listEvents(accountSubject, aircraftId);
  return events[0];
}

export function launchTrainingDestination(
  event: PersistedTrainingProgressEvent,
): LaunchTrainingDestination {
  if (event.kind === "quick-start" && event.completed) {
    return { route: "checklists", label: "Checklist training" };
  }
  return destinations[event.kind];
}
