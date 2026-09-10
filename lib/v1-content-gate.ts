import type { AircraftContentBundle } from "./content-repository.ts";

export type V1ContentGateCheck = {
  readonly id:
    | "controlled-manual"
    | "quick-start"
    | "essential-systems"
    | "first-flight"
    | "cockpit-orientation"
    | "abnormal-emergency"
    | "quick-reference"
    | "knowledge"
    | "focused-duration";
  readonly ok: boolean;
  readonly detail: string;
};

export type V1ContentGateReport = {
  readonly aircraftId: string;
  readonly ready: boolean;
  readonly focusedMinutes: number;
  readonly checks: readonly V1ContentGateCheck[];
};

type SourceReference = { readonly chapter: number; readonly section: string; readonly manualPage: string };

function sourceOk(source: SourceReference | undefined): boolean {
  return Boolean(source && source.chapter > 0 && source.section.trim() && source.manualPage.trim());
}

function sourcesOk(sources: readonly SourceReference[] | undefined): boolean {
  return Boolean(sources?.length && sources.every(sourceOk));
}

function uniqueIds(records: readonly { readonly id: string }[]): boolean {
  return records.length > 0 && new Set(records.map(record => record.id)).size === records.length;
}

export function evaluateV1AircraftContent(bundle: AircraftContentBundle): V1ContentGateReport {
  const learning = bundle.learningContent;
  const flight = bundle.normalFlight;
  const orientation = bundle.cockpitOrientation;
  const abnormal = bundle.abnormalTraining;
  const reference = bundle.referenceKnowledge;

  const quickStartMinutes = learning?.quickStart.reduce((sum, item) => sum + item.minutes, 0) ?? 0;
  const systemsMinutes = learning?.systems.reduce((sum, item) => sum + item.minutes, 0) ?? 0;
  const focusedMinutes = quickStartMinutes + systemsMinutes + (flight?.estimatedMinutes ?? 0);

  const manualsOk = bundle.aircraft.manuals.length > 0 && bundle.aircraft.manuals.every(manual =>
    manual.id.trim().length > 0 &&
    manual.revision.trim().length > 0 &&
    manual.publisher.trim().length > 0 &&
    manual.authorityNote.trim().length > 0,
  );

  const quickStartOk = Boolean(
    learning &&
    learning.quickStart.length >= 5 &&
    uniqueIds(learning.quickStart) &&
    learning.quickStart.every(item => item.minutes > 0 && item.summary.trim() && item.remember.length > 0 && sourcesOk(item.source)),
  );

  const systemsOk = Boolean(
    learning &&
    learning.systems.length > 0 &&
    uniqueIds(learning.systems) &&
    learning.systems.every(item =>
      item.minutes > 0 &&
      item.mentalModel.trim() &&
      item.pilotControls.length > 0 &&
      item.pilotMonitors.length > 0 &&
      item.normalPicture.length > 0 &&
      item.remember.length > 0 &&
      sourcesOk(item.source),
    ),
  );

  const flightOk = Boolean(
    flight &&
    flight.phases.length >= 2 &&
    flight.phases[0]?.id === "cold-dark" &&
    flight.phases.at(-1)?.id === "shutdown" &&
    uniqueIds(flight.phases) &&
    flight.phases.every(phase => phase.items.length > 0 && uniqueIds(phase.items) && phase.items.every(item => item.action.trim() && sourceOk(item.source))),
  );

  const regionIds = new Set(orientation?.regions.map(region => region.id) ?? []);
  const orientationOk = Boolean(
    orientation &&
    orientation.regions.length > 0 &&
    orientation.controls.length > 0 &&
    uniqueIds(orientation.regions) &&
    uniqueIds(orientation.controls) &&
    orientation.controls.every(control => regionIds.has(control.regionId) && sourceOk(control.source)),
  );

  const expectedStages = ["recognition", "control", "immediate", "continue"];
  const abnormalOk = Boolean(
    abnormal &&
    abnormal.scenarios.length >= 5 &&
    uniqueIds(abnormal.scenarios) &&
    abnormal.scenarios.every(scenario =>
      scenario.objectives.length > 0 &&
      scenario.debrief.length > 0 &&
      scenario.stages.length === expectedStages.length &&
      scenario.stages.every((stage, index) => stage.id === expectedStages[index] && stage.expectedResponse.length > 0 && stage.why.trim() && sourcesOk(stage.source)),
    ),
  );

  const quickReferenceOk = Boolean(
    reference &&
    reference.groups.length > 0 &&
    uniqueIds(reference.groups) &&
    reference.groups.every(group => group.items.length > 0 && uniqueIds(group.items) && group.items.every(item => item.label.trim() && item.value.trim() && sourcesOk(item.source))),
  );

  const knowledgeOk = Boolean(
    reference &&
    reference.questions.length >= 10 &&
    uniqueIds(reference.questions) &&
    reference.questions.every(question =>
      question.choices.length >= 3 &&
      question.correctIndex >= 0 &&
      question.correctIndex < question.choices.length &&
      question.explanation.trim() &&
      sourcesOk(question.source),
    ),
  );

  const durationOk = focusedMinutes > 0 && focusedMinutes <= 240;
  const checks: V1ContentGateCheck[] = [
    { id: "controlled-manual", ok: manualsOk, detail: `${bundle.aircraft.manuals.length} controlled manual revision(s)` },
    { id: "quick-start", ok: quickStartOk, detail: `${learning?.quickStart.length ?? 0} source-backed topic(s)` },
    { id: "essential-systems", ok: systemsOk, detail: `${learning?.systems.length ?? 0} source-backed system lesson(s)` },
    { id: "first-flight", ok: flightOk, detail: `${flight?.phases.length ?? 0} Cold & Dark → Shutdown phase(s)` },
    { id: "cockpit-orientation", ok: orientationOk, detail: `${orientation?.controls.length ?? 0} source-backed control mapping(s)` },
    { id: "abnormal-emergency", ok: abnormalOk, detail: `${abnormal?.scenarios.length ?? 0} governed scenario(s)` },
    { id: "quick-reference", ok: quickReferenceOk, detail: `${reference?.groups.length ?? 0} reference group(s)` },
    { id: "knowledge", ok: knowledgeOk, detail: `${reference?.questions.length ?? 0} source-backed question(s)` },
    { id: "focused-duration", ok: durationOk, detail: `${focusedMinutes} min Quick Start + systems + First Flight` },
  ];

  return {
    aircraftId: bundle.aircraft.id,
    ready: checks.every(check => check.ok),
    focusedMinutes,
    checks,
  };
}
