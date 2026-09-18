import type { RuntimeChecklist } from "./checklist-runtime.ts";
import type {
  PerformanceAxis,
  PerformanceDataset,
  PerformanceOutput,
  PerformanceRow,
  TrainingNotice,
} from "./universal-aircraft-content.ts";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency.ts";

export type OperationalChecklistNotice = {
  readonly kind: "warning" | "caution";
  readonly text: string;
};

export type OperationalChecklistItem = {
  readonly id: string;
  readonly challenge: string;
  readonly response?: string;
  readonly notices?: readonly OperationalChecklistNotice[];
};

export type OperationalChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly OperationalChecklistItem[];
};

export type OperationalChecklist = {
  readonly aircraftId: string;
  readonly title: string;
  readonly phases: readonly OperationalChecklistPhase[];
};

function checklistNotices(notices: readonly TrainingNotice[] | undefined): readonly OperationalChecklistNotice[] | undefined {
  const operational = notices
    ?.filter((notice): notice is TrainingNotice & { kind: "warning" | "caution" } => notice.kind === "warning" || notice.kind === "caution")
    .map((notice) => ({ kind: notice.kind, text: notice.text }));
  return operational?.length ? operational : undefined;
}

export function toOperationalChecklist(checklist: RuntimeChecklist): OperationalChecklist {
  return {
    aircraftId: checklist.aircraftId,
    title: checklist.title,
    phases: checklist.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      items: phase.items.map((item) => ({
        id: item.id,
        challenge: item.challenge,
        response: item.response,
        notices: checklistNotices(item.notices),
      })),
    })),
  };
}

export type OperationalPerformanceDataset = {
  readonly id: string;
  readonly title: string;
  readonly kind: PerformanceDataset["kind"];
  readonly phase?: PerformanceDataset["phase"];
  readonly calculator?: PerformanceDataset["calculator"];
  readonly axes: readonly PerformanceAxis[];
  readonly outputs: readonly PerformanceOutput[];
  readonly rows: readonly PerformanceRow[];
  readonly interpolation: PerformanceDataset["interpolation"];
};

export function toOperationalPerformanceDatasets(
  datasets: readonly PerformanceDataset[],
): readonly OperationalPerformanceDataset[] {
  return datasets.map((dataset) => ({
    id: dataset.id,
    title: dataset.title,
    kind: dataset.kind,
    phase: dataset.phase,
    calculator: dataset.calculator,
    interpolation: dataset.interpolation,
    axes: dataset.axes.map((axis) => ({
      key: axis.key,
      label: axis.label,
      unit: axis.unit,
      values: [...axis.values],
    })),
    outputs: dataset.outputs.map((output) => ({
      key: output.key,
      label: output.label,
      unit: output.unit,
    })),
    rows: dataset.rows.map((row) => ({
      inputs: { ...row.inputs },
      outputs: { ...row.outputs },
    })),
  }));
}

export type OperationalEmergencyNotice = {
  readonly kind: TrainingNotice["kind"];
  readonly text: string;
};

export type OperationalEmergencySource = {
  readonly manualId: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
};

export type OperationalEmergencyStage = {
  readonly id: string;
  readonly label: string;
  readonly expectedResponse: readonly string[];
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly sources: readonly OperationalEmergencySource[];
};

export type OperationalEmergencyScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly phase: string;
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly configurationNote?: string;
  readonly boundaryNote?: string;
  readonly stages: readonly OperationalEmergencyStage[];
};

export type OperationalEmergencyContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly scenarios: readonly OperationalEmergencyScenario[];
};

function emergencyNotices(notices: readonly TrainingNotice[] | undefined): readonly OperationalEmergencyNotice[] | undefined {
  const operational = notices?.map((notice) => ({ kind: notice.kind, text: notice.text }));
  return operational?.length ? operational : undefined;
}

export function toOperationalEmergency(content: AircraftAbnormalEmergencyContent): OperationalEmergencyContent {
  return {
    aircraftId: content.aircraftId,
    title: content.title,
    scenarios: content.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      category: scenario.category,
      phase: scenario.phase,
      notices: emergencyNotices(scenario.notices),
      configurationNote: scenario.applicability?.note,
      boundaryNote: scenario.boundaryNote,
      stages: scenario.stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        expectedResponse: [...stage.expectedResponse],
        notices: emergencyNotices(stage.notices),
        sources: stage.sources.map((source) => ({
          manualId: source.manualId,
          chapter: source.chapter,
          section: source.section,
          pageLabel: source.pageLabel,
        })),
      })),
    })),
  };
}
