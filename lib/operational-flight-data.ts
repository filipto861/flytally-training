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

export type OperationalEmergencyActionStep = {
  readonly id: string;
  readonly kind: "action";
  readonly text: string;
  readonly label?: string;
  readonly memoryItem?: boolean;
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly sources: readonly OperationalEmergencySource[];
};

export type OperationalEmergencyConditionBranch = {
  readonly id: string;
  readonly label: string;
  readonly steps: readonly OperationalEmergencyStep[];
};

export type OperationalEmergencyConditionStep = {
  readonly id: string;
  readonly kind: "condition";
  readonly branches: readonly OperationalEmergencyConditionBranch[];
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly sources: readonly OperationalEmergencySource[];
};

export type OperationalEmergencyStep =
  | OperationalEmergencyActionStep
  | OperationalEmergencyConditionStep;

export type OperationalEmergencyStage = {
  readonly id: string;
  readonly label: string;
  readonly memoryItem?: boolean;
  readonly steps: readonly OperationalEmergencyStep[];
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly sources: readonly OperationalEmergencySource[];
};

export type OperationalEmergencyScenario = {
  readonly id: string;
  readonly title: string;
  readonly procedureClass: "emergency" | "abnormal";
  readonly category: string;
  readonly phase?: string;
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly configurationNote?: string;
  readonly boundaryNote?: string;
  readonly stages: readonly OperationalEmergencyStage[];
};

export type OperationalEmergencySectionIntroduction = {
  readonly procedureClass: "emergency" | "abnormal";
  readonly paragraphs: readonly string[];
  readonly notices?: readonly OperationalEmergencyNotice[];
  readonly sources: readonly OperationalEmergencySource[];
};

export type OperationalEmergencyContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly sectionIntroductions: readonly OperationalEmergencySectionIntroduction[];
  readonly scenarios: readonly OperationalEmergencyScenario[];
};

function emergencyNotices(notices: readonly TrainingNotice[] | undefined): readonly OperationalEmergencyNotice[] | undefined {
  const operational = notices?.map((notice) => ({ kind: notice.kind, text: notice.text }));
  return operational?.length ? operational : undefined;
}

function emergencySource(source: {
  readonly manualId: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
}): OperationalEmergencySource {
  return {
    manualId: source.manualId,
    chapter: source.chapter,
    section: source.section,
    pageLabel: source.pageLabel,
  };
}

function mapV2Steps(
  steps: readonly import("./universal-abnormal-emergency.ts").AircraftQrhStep[],
  inheritedSources: readonly OperationalEmergencySource[],
): readonly OperationalEmergencyStep[] {
  return steps.map((step) => {
    const sources = step.sources?.map(emergencySource) ?? inheritedSources;
    if (step.kind === "action") {
      return {
        id: step.id,
        kind: "action" as const,
        text: step.text,
        label: step.label,
        memoryItem: step.memoryItem,
        notices: emergencyNotices(step.notices),
        sources,
      };
    }
    return {
      id: step.id,
      kind: "condition" as const,
      notices: emergencyNotices(step.notices),
      sources,
      branches: step.branches.map((branch) => ({
        id: branch.id,
        label: branch.label,
        steps: mapV2Steps(branch.steps, sources),
      })),
    };
  });
}

export function toOperationalEmergency(content: AircraftAbnormalEmergencyContent): OperationalEmergencyContent {
  if (content.schemaVersion === 2) {
    return {
      aircraftId: content.aircraftId,
      title: content.title,
      sectionIntroductions: (content.sectionIntroductions ?? []).map((section) => ({
        procedureClass: section.procedureClass,
        paragraphs: [...section.paragraphs],
        notices: emergencyNotices(section.notices),
        sources: section.sources.map(emergencySource),
      })),
      scenarios: content.scenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        procedureClass: scenario.procedureClass,
        category: scenario.category,
        phase: scenario.phase,
        notices: emergencyNotices(scenario.notices),
        configurationNote: scenario.applicability?.note,
        boundaryNote: scenario.boundaryNote,
        stages: scenario.stages.map((stage) => {
          const sources = stage.sources.map(emergencySource);
          return {
            id: stage.id,
            label: stage.label,
            memoryItem: stage.memoryItem,
            notices: emergencyNotices(stage.notices),
            sources,
            steps: mapV2Steps(stage.steps, sources),
          };
        }),
      })),
    };
  }

  return {
    aircraftId: content.aircraftId,
    title: content.title,
    sectionIntroductions: [],
    scenarios: content.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      procedureClass: "emergency",
      category: scenario.category,
      phase: scenario.phase,
      notices: emergencyNotices(scenario.notices),
      configurationNote: scenario.applicability?.note,
      boundaryNote: scenario.boundaryNote,
      stages: scenario.stages.map((stage) => {
        const sources = stage.sources.map(emergencySource);
        return {
          id: stage.id,
          label: stage.label,
          memoryItem: false,
          notices: emergencyNotices(stage.notices),
          sources,
          steps: stage.expectedResponse.map((action, index) => ({
            id: `${stage.id}-legacy-action-${index + 1}`,
            kind: "action" as const,
            label: String(index + 1),
            text: action,
            sources,
          })),
        };
      }),
    })),
  };
}
