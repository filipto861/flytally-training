export const universalTrainingContentDomains = [
  "checklists",
  "procedures",
  "performance",
  "limitations",
  "systems",
  "flows",
  "avionics",
  "knowledge",
] as const;

export type UniversalTrainingContentDomain = typeof universalTrainingContentDomains[number];

export function isUniversalTrainingContentDomain(value: string): value is UniversalTrainingContentDomain {
  return (universalTrainingContentDomains as readonly string[]).includes(value);
}

export type AircraftApplicability = {
  readonly variants?: readonly string[];
  readonly equipmentAllOf?: readonly string[];
  readonly equipmentAnyOf?: readonly string[];
  readonly equipmentNoneOf?: readonly string[];
  readonly note?: string;
};

export type TrainingNotice = {
  readonly kind: "note" | "caution" | "warning";
  readonly text: string;
};

export type AircraftChecklistItem = {
  readonly id: string;
  readonly challenge: string;
  readonly response?: string;
  readonly procedureId?: string;
  readonly explanation?: string;
  readonly verification?: string;
  readonly condition?: string;
  readonly notices?: readonly TrainingNotice[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly sequence: number;
  readonly items: readonly AircraftChecklistItem[];
};

export type AircraftChecklistContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly phases: readonly AircraftChecklistPhase[];
};

export type AircraftProcedureStep = {
  readonly id: string;
  readonly action: string;
  readonly expectedResult?: string;
  readonly verification?: string;
  readonly rationale?: string;
  readonly notices?: readonly TrainingNotice[];
};

export type AircraftProcedure = {
  readonly id: string;
  readonly title: string;
  readonly phase?: string;
  readonly summary?: string;
  readonly prerequisites?: readonly string[];
  readonly steps: readonly AircraftProcedureStep[];
  readonly completionCriteria?: readonly string[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftProcedureContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly procedures: readonly AircraftProcedure[];
};

export type PerformanceScalar = string | number | boolean;

export type PerformanceAxis = {
  readonly key: string;
  readonly label: string;
  readonly unit?: string;
  readonly values: readonly PerformanceScalar[];
};

export type PerformanceOutput = {
  readonly key: string;
  readonly label: string;
  readonly unit?: string;
};

export type PerformanceRow = {
  readonly inputs: Readonly<Record<string, PerformanceScalar>>;
  readonly outputs: Readonly<Record<string, PerformanceScalar>>;
};

export type PerformanceDataset = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly kind: "lookup-table" | "reference-table";
  readonly axes: readonly PerformanceAxis[];
  readonly outputs: readonly PerformanceOutput[];
  readonly rows: readonly PerformanceRow[];
  readonly interpolation: "none" | "linear-explicit";
  readonly notes?: readonly string[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftPerformanceContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly datasets: readonly PerformanceDataset[];
};

export type LimitationItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly condition?: string;
  readonly notices?: readonly TrainingNotice[];
  readonly applicability?: AircraftApplicability;
};

export type LimitationGroup = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly LimitationItem[];
};

export type AircraftLimitationsContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly groups: readonly LimitationGroup[];
};

export type AircraftSystemLesson = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly mentalModel?: string;
  readonly components?: readonly string[];
  readonly controls?: readonly string[];
  readonly indications?: readonly string[];
  readonly normalOperation?: readonly string[];
  readonly limitations?: readonly string[];
  readonly abnormalCues?: readonly string[];
  readonly remember?: readonly string[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftSystemsContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly systems: readonly AircraftSystemLesson[];
};

export type AircraftFlow = {
  readonly id: string;
  readonly title: string;
  readonly phase?: string;
  readonly steps: readonly {
    readonly id: string;
    readonly action: string;
    readonly verification?: string;
  }[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftFlowsContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly flows: readonly AircraftFlow[];
};

export type AircraftAvionicsTopic = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly configuration?: string;
  readonly procedures?: readonly string[];
  readonly remember?: readonly string[];
  readonly applicability?: AircraftApplicability;
};

export type AircraftAvionicsContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly topics: readonly AircraftAvionicsTopic[];
};

export type AircraftKnowledgeQuestion = {
  readonly id: string;
  readonly area: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly applicability?: AircraftApplicability;
};

export type AircraftKnowledgeContent = {
  readonly aircraftId: string;
  readonly title: string;
  readonly questions: readonly AircraftKnowledgeQuestion[];
};

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const finiteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const objects = (value: unknown): value is RecordValue[] => Array.isArray(value) && value.every(object);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const scalar = (value: unknown): value is PerformanceScalar => typeof value === "string" || typeof value === "boolean" || finiteNumber(value);

function idTitle(value: RecordValue): boolean {
  return text(value.id) && text(value.title);
}

function validateNotices(value: unknown): boolean {
  if (value === undefined) return true;
  return objects(value) && value.every(item => (item.kind === "note" || item.kind === "caution" || item.kind === "warning") && text(item.text));
}

function validateChecklists(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("checklists title is required");
  if (!objects(payload.phases) || payload.phases.length === 0) {
    errors.push("checklists phases are required");
    return;
  }
  payload.phases.forEach((phase, phaseIndex) => {
    if (!idTitle(phase) || !finiteNumber(phase.sequence) || !objects(phase.items) || phase.items.length === 0) {
      errors.push(`phases[${phaseIndex}] does not match the checklist phase contract`);
      return;
    }
    phase.items.forEach((item, itemIndex) => {
      if (!text(item.id) || !text(item.challenge) || (item.response !== undefined && !text(item.response)) || !validateNotices(item.notices)) {
        errors.push(`phases[${phaseIndex}].items[${itemIndex}] does not match the checklist item contract`);
      }
    });
  });
}

function validateProcedures(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("procedures title is required");
  if (!objects(payload.procedures) || payload.procedures.length === 0) {
    errors.push("procedures are required");
    return;
  }
  payload.procedures.forEach((procedure, procedureIndex) => {
    if (!idTitle(procedure) || !objects(procedure.steps) || procedure.steps.length === 0) {
      errors.push(`procedures[${procedureIndex}] does not match the procedure contract`);
      return;
    }
    procedure.steps.forEach((step, stepIndex) => {
      if (!text(step.id) || !text(step.action) || !validateNotices(step.notices)) {
        errors.push(`procedures[${procedureIndex}].steps[${stepIndex}] does not match the procedure step contract`);
      }
    });
  });
}

function validatePerformance(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("performance title is required");
  if (!objects(payload.datasets) || payload.datasets.length === 0) {
    errors.push("performance datasets are required");
    return;
  }
  payload.datasets.forEach((dataset, datasetIndex) => {
    if (!idTitle(dataset) || (dataset.kind !== "lookup-table" && dataset.kind !== "reference-table") || (dataset.interpolation !== "none" && dataset.interpolation !== "linear-explicit") || !objects(dataset.axes) || dataset.axes.length === 0 || !objects(dataset.outputs) || dataset.outputs.length === 0 || !objects(dataset.rows) || dataset.rows.length === 0) {
      errors.push(`datasets[${datasetIndex}] does not match the performance dataset contract`);
      return;
    }
    const axisKeys = dataset.axes.map(axis => text(axis.key) ? axis.key : "");
    const outputKeys = dataset.outputs.map(output => text(output.key) ? output.key : "");
    dataset.axes.forEach((axis, axisIndex) => {
      if (!text(axis.key) || !text(axis.label) || !Array.isArray(axis.values) || axis.values.length === 0 || !axis.values.every(scalar)) {
        errors.push(`datasets[${datasetIndex}].axes[${axisIndex}] does not match the performance axis contract`);
      }
    });
    dataset.outputs.forEach((output, outputIndex) => {
      if (!text(output.key) || !text(output.label)) errors.push(`datasets[${datasetIndex}].outputs[${outputIndex}] does not match the performance output contract`);
    });
    dataset.rows.forEach((row, rowIndex) => {
      const inputs = object(row.inputs) ? row.inputs : undefined;
      const outputs = object(row.outputs) ? row.outputs : undefined;
      if (!inputs || !outputs || axisKeys.some(key => !key || !scalar(inputs[key])) || outputKeys.some(key => !key || !scalar(outputs[key]))) {
        errors.push(`datasets[${datasetIndex}].rows[${rowIndex}] does not cover every axis and output`);
      }
    });
  });
}

function validateLimitations(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("limitations title is required");
  if (!objects(payload.groups) || payload.groups.length === 0) {
    errors.push("limitations groups are required");
    return;
  }
  payload.groups.forEach((group, groupIndex) => {
    if (!idTitle(group) || !objects(group.items) || group.items.length === 0) {
      errors.push(`groups[${groupIndex}] does not match the limitation group contract`);
      return;
    }
    group.items.forEach((item, itemIndex) => {
      if (!text(item.id) || !text(item.label) || !(text(item.value) || finiteNumber(item.value)) || !validateNotices(item.notices)) {
        errors.push(`groups[${groupIndex}].items[${itemIndex}] does not match the limitation item contract`);
      }
    });
  });
}

function validateSystems(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("systems title is required");
  if (!objects(payload.systems) || payload.systems.length === 0) {
    errors.push("systems lessons are required");
    return;
  }
  payload.systems.forEach((system, index) => {
    if (!idTitle(system) || !text(system.summary)) errors.push(`systems[${index}] does not match the system lesson contract`);
    for (const key of ["components", "controls", "indications", "normalOperation", "limitations", "abnormalCues", "remember"] as const) {
      if (system[key] !== undefined && !strings(system[key])) errors.push(`systems[${index}].${key} must be an array of text`);
    }
  });
}

function validateFlows(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("flows title is required");
  if (!objects(payload.flows) || payload.flows.length === 0) {
    errors.push("flows are required");
    return;
  }
  payload.flows.forEach((flow, flowIndex) => {
    if (!idTitle(flow) || !objects(flow.steps) || flow.steps.length === 0) {
      errors.push(`flows[${flowIndex}] does not match the flow contract`);
      return;
    }
    flow.steps.forEach((step, stepIndex) => {
      if (!text(step.id) || !text(step.action)) errors.push(`flows[${flowIndex}].steps[${stepIndex}] does not match the flow step contract`);
    });
  });
}

function validateAvionics(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("avionics title is required");
  if (!objects(payload.topics) || payload.topics.length === 0) {
    errors.push("avionics topics are required");
    return;
  }
  payload.topics.forEach((topic, index) => {
    if (!idTitle(topic) || !text(topic.summary)) errors.push(`topics[${index}] does not match the avionics topic contract`);
  });
}

function validateKnowledge(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("knowledge title is required");
  if (!objects(payload.questions) || payload.questions.length === 0) {
    errors.push("knowledge questions are required");
    return;
  }
  payload.questions.forEach((question, index) => {
    const choices = question.choices;
    if (!text(question.id) || !text(question.area) || !text(question.prompt) || !strings(choices) || choices.length < 2 || !Number.isInteger(question.correctIndex) || Number(question.correctIndex) < 0 || Number(question.correctIndex) >= choices.length || !text(question.explanation)) {
      errors.push(`questions[${index}] does not match the knowledge question contract`);
    }
  });
}

export function validateUniversalTrainingContentPayload(domain: UniversalTrainingContentDomain, payload: unknown): string[] {
  if (!object(payload)) return ["Published content payload must be a JSON object"];
  const errors: string[] = [];
  if (domain === "checklists") validateChecklists(payload, errors);
  else if (domain === "procedures") validateProcedures(payload, errors);
  else if (domain === "performance") validatePerformance(payload, errors);
  else if (domain === "limitations") validateLimitations(payload, errors);
  else if (domain === "systems") validateSystems(payload, errors);
  else if (domain === "flows") validateFlows(payload, errors);
  else if (domain === "avionics") validateAvionics(payload, errors);
  else if (domain === "knowledge") validateKnowledge(payload, errors);
  return errors;
}
