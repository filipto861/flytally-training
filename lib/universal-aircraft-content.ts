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

/**
 * Human-readable provenance carried inside the governed payload. Database
 * version/source links remain the release-control boundary; these references
 * preserve the exact chapter/page context for learner UI and review.
 */
export type TrainingSourceReference = {
  readonly manualId: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
  readonly note?: string;
};

export type UniversalModuleMetadata = {
  readonly sourceNote?: string;
  readonly disclaimer?: string;
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftChecklistPhase = {
  readonly id: string;
  readonly title: string;
  readonly sequence: number;
  readonly items: readonly AircraftChecklistItem[];
  readonly applicability?: AircraftApplicability;
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftChecklistContent = UniversalModuleMetadata & {
  readonly aircraftId: string;
  readonly title: string;
  readonly estimatedMinutes?: number;
  readonly phases: readonly AircraftChecklistPhase[];
};

export type AircraftProcedureStep = {
  readonly id: string;
  readonly action: string;
  readonly expectedResult?: string;
  readonly verification?: string;
  readonly rationale?: string;
  readonly notices?: readonly TrainingNotice[];
  readonly sources?: readonly TrainingSourceReference[];
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftProcedureContent = UniversalModuleMetadata & {
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

export const performancePhases = [
  "takeoff",
  "climb",
  "cruise",
  "descent",
  "holding",
  "landing",
  "reference",
] as const;

export type PerformancePhase = typeof performancePhases[number];

export type PerformanceExternalInput = {
  readonly key: string;
  readonly label: string;
  readonly unit?: string;
  readonly optional?: boolean;
};

export type PerformanceCalculatorConstraint = {
  readonly when?: {
    readonly axisKey?: string;
    readonly values?: readonly PerformanceScalar[];
    readonly selectorValues?: readonly string[];
  };
  readonly input: PerformanceExternalInput;
  readonly operator: "lte" | "gte";
  readonly value: number;
  readonly message?: string;
};

export type PerformanceRunwayDistanceGridCalculator = {
  readonly kind: "runway-distance-grid";
  readonly operation: "takeoff" | "landing";
  readonly bindings: {
    readonly altitudeAxis: string;
    readonly isaDeviationAxis: string;
    readonly surfaceAxis: string;
    readonly sourceTemperatureOutput: string;
    readonly groundRunOutput: string;
    readonly obstacleDistanceOutput: string;
  };
  readonly oatInput: PerformanceExternalInput;
  readonly runwayAvailableInput: PerformanceExternalInput;
  readonly obstacleHeight?: {
    readonly value: number;
    readonly unit: string;
  };
};

export type PerformanceDistanceFactorOption = {
  readonly value: string;
  readonly label: string;
  readonly factorOutputKey?: string;
  readonly fixedFactor?: number;
};

export type PerformanceDistanceFactorSelector =
  | {
      readonly kind: "output-options";
      readonly label: string;
      readonly lookupAxis?: string;
      readonly baseline: PerformanceDistanceFactorOption;
      readonly options: readonly PerformanceDistanceFactorOption[];
    }
  | {
      readonly kind: "axis";
      readonly label: string;
      readonly axisKey: string;
      readonly lookupAxis?: string;
      readonly factorOutput: string;
      readonly baseline: PerformanceDistanceFactorOption;
    };

export type PerformanceDistanceFactorCalculator = {
  readonly kind: "distance-factor";
  readonly operation: "takeoff" | "landing";
  readonly baselineDistanceInput: PerformanceExternalInput;
  readonly runwayAvailableInput: PerformanceExternalInput;
  readonly selector: PerformanceDistanceFactorSelector;
  readonly constraints?: readonly PerformanceCalculatorConstraint[];
};

export type PerformanceMetricLookupCalculator = {
  readonly kind: "metric-lookup";
  readonly operation: PerformancePhase;
  readonly axisKey: string;
  readonly outputKeys: readonly string[];
};

export type PerformanceCalculatorContract =
  | PerformanceRunwayDistanceGridCalculator
  | PerformanceDistanceFactorCalculator
  | PerformanceMetricLookupCalculator;

export type PerformanceDataset = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly kind: "lookup-table" | "reference-table";
  /** Explicit flight-phase classification. Older governed payloads may omit it during migration. */
  readonly phase?: PerformancePhase;
  /**
   * Declarative calculator semantics. Dataset axis/output keys remain aircraft-owned data vocabulary;
   * generic runtime code consumes these bindings instead of inferring meaning from key names.
   */
  readonly calculator?: PerformanceCalculatorContract;
  readonly axes: readonly PerformanceAxis[];
  readonly outputs: readonly PerformanceOutput[];
  readonly rows: readonly PerformanceRow[];
  readonly interpolation: "none" | "linear-explicit";
  readonly notes?: readonly string[];
  readonly applicability?: AircraftApplicability;
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftPerformanceContent = UniversalModuleMetadata & {
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type LimitationGroup = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly LimitationItem[];
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftLimitationsContent = UniversalModuleMetadata & {
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftSystemsContent = UniversalModuleMetadata & {
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
    readonly sources?: readonly TrainingSourceReference[];
  }[];
  readonly applicability?: AircraftApplicability;
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftFlowsContent = UniversalModuleMetadata & {
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftAvionicsContent = UniversalModuleMetadata & {
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
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftKnowledgeContent = UniversalModuleMetadata & {
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

function validateSources(value: unknown): boolean {
  if (value === undefined) return true;
  return objects(value) && value.length > 0 && value.every(item => text(item.manualId) && text(item.pageLabel) && (item.chapter === undefined || text(item.chapter)) && (item.section === undefined || text(item.section)) && (item.note === undefined || text(item.note)));
}

function validateMetadata(payload: RecordValue, errors: string[]): void {
  if (payload.sourceNote !== undefined && !text(payload.sourceNote)) errors.push("sourceNote must be non-empty text when supplied");
  if (payload.disclaimer !== undefined && !text(payload.disclaimer)) errors.push("disclaimer must be non-empty text when supplied");
}

function validateChecklists(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("checklists title is required");
  if (payload.estimatedMinutes !== undefined && !finiteNumber(payload.estimatedMinutes)) errors.push("checklists estimatedMinutes must be a number when supplied");
  if (!objects(payload.phases) || payload.phases.length === 0) {
    errors.push("checklists phases are required");
    return;
  }
  payload.phases.forEach((phase, phaseIndex) => {
    if (!idTitle(phase) || !finiteNumber(phase.sequence) || !objects(phase.items) || phase.items.length === 0 || !validateSources(phase.sources)) {
      errors.push(`phases[${phaseIndex}] does not match the checklist phase contract`);
      return;
    }
    phase.items.forEach((item, itemIndex) => {
      if (!text(item.id) || !text(item.challenge) || (item.response !== undefined && !text(item.response)) || !validateNotices(item.notices) || !validateSources(item.sources)) {
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
    if (!idTitle(procedure) || !objects(procedure.steps) || procedure.steps.length === 0 || !validateSources(procedure.sources)) {
      errors.push(`procedures[${procedureIndex}] does not match the procedure contract`);
      return;
    }
    procedure.steps.forEach((step, stepIndex) => {
      if (!text(step.id) || !text(step.action) || !validateNotices(step.notices) || !validateSources(step.sources)) {
        errors.push(`procedures[${procedureIndex}].steps[${stepIndex}] does not match the procedure step contract`);
      }
    });
  });
}

function validPerformancePhase(value: unknown): value is PerformancePhase {
  return typeof value === "string" && (performancePhases as readonly string[]).includes(value);
}

function validatePerformanceExternalInput(value: unknown, path: string, errors: string[]): void {
  if (!object(value) || !text(value.key) || !text(value.label) || (value.unit !== undefined && !text(value.unit)) || (value.optional !== undefined && typeof value.optional !== "boolean")) {
    errors.push(`${path} does not match the external performance input contract`);
  }
}

function validatePerformanceCalculator(
  dataset: RecordValue,
  datasetIndex: number,
  axisKeys: readonly string[],
  outputKeys: readonly string[],
  errors: string[],
): void {
  const calculator = dataset.calculator;
  if (calculator === undefined) return;
  const path = `datasets[${datasetIndex}].calculator`;
  if (!object(calculator) || !text(calculator.kind) || !validPerformancePhase(calculator.operation)) {
    errors.push(`${path} does not match the calculator contract`);
    return;
  }
  if (dataset.phase !== undefined && dataset.phase !== calculator.operation) {
    errors.push(`datasets[${datasetIndex}].phase must match calculator.operation`);
  }

  const axisExists = (key: unknown): key is string => text(key) && axisKeys.includes(key);
  const outputExists = (key: unknown): key is string => text(key) && outputKeys.includes(key);

  if (calculator.kind === "runway-distance-grid") {
    if (calculator.operation !== "takeoff" && calculator.operation !== "landing") {
      errors.push(`${path}.operation must be takeoff or landing for a runway-distance-grid`);
    }
    const bindings = calculator.bindings;
    if (!object(bindings)
      || !axisExists(bindings.altitudeAxis)
      || !axisExists(bindings.isaDeviationAxis)
      || !axisExists(bindings.surfaceAxis)
      || !outputExists(bindings.sourceTemperatureOutput)
      || !outputExists(bindings.groundRunOutput)
      || !outputExists(bindings.obstacleDistanceOutput)) {
      errors.push(`${path}.bindings must reference existing dataset axes and outputs`);
    }
    validatePerformanceExternalInput(calculator.oatInput, `${path}.oatInput`, errors);
    validatePerformanceExternalInput(calculator.runwayAvailableInput, `${path}.runwayAvailableInput`, errors);
    if (object(bindings)) {
      const deviationAxis = dataset.axes.find((candidate) => candidate.key === bindings.isaDeviationAxis);
      const sourceTemperature = dataset.outputs.find((candidate) => candidate.key === bindings.sourceTemperatureOutput);
      const groundRun = dataset.outputs.find((candidate) => candidate.key === bindings.groundRunOutput);
      const obstacleDistance = dataset.outputs.find((candidate) => candidate.key === bindings.obstacleDistanceOutput);
      const temperatureUnits = [
        deviationAxis?.unit,
        sourceTemperature?.unit,
        object(calculator.oatInput) ? calculator.oatInput.unit : undefined,
      ].filter((value): value is string => typeof value === "string");
      if (new Set(temperatureUnits).size > 1) errors.push(`${path} temperature/deviation units must agree`);
      const distanceUnits = [
        groundRun?.unit,
        obstacleDistance?.unit,
        object(calculator.runwayAvailableInput) ? calculator.runwayAvailableInput.unit : undefined,
      ].filter((value): value is string => typeof value === "string");
      if (new Set(distanceUnits).size > 1) errors.push(`${path} runway-distance units must agree`);
    }
    if (calculator.obstacleHeight !== undefined
      && (!object(calculator.obstacleHeight) || !finiteNumber(calculator.obstacleHeight.value) || Number(calculator.obstacleHeight.value) <= 0 || !text(calculator.obstacleHeight.unit))) {
      errors.push(`${path}.obstacleHeight must contain a positive value and unit`);
    }
    return;
  }

  if (calculator.kind === "distance-factor") {
    if (calculator.operation !== "takeoff" && calculator.operation !== "landing") {
      errors.push(`${path}.operation must be takeoff or landing for a distance-factor calculator`);
    }
    validatePerformanceExternalInput(calculator.baselineDistanceInput, `${path}.baselineDistanceInput`, errors);
    validatePerformanceExternalInput(calculator.runwayAvailableInput, `${path}.runwayAvailableInput`, errors);
    if (object(calculator.baselineDistanceInput) && object(calculator.runwayAvailableInput)
      && calculator.baselineDistanceInput.unit !== undefined && calculator.runwayAvailableInput.unit !== undefined
      && calculator.baselineDistanceInput.unit !== calculator.runwayAvailableInput.unit) {
      errors.push(`${path} baseline and runway-available distance units must agree`);
    }
    const selector = calculator.selector;
    if (!object(selector) || !text(selector.kind) || !text(selector.label) || !object(selector.baseline)
      || !text(selector.baseline.value) || !text(selector.baseline.label) || !finiteNumber(selector.baseline.fixedFactor)) {
      errors.push(`${path}.selector does not match the distance-factor selector contract`);
    } else if (selector.kind === "output-options") {
      if (selector.lookupAxis !== undefined && !axisExists(selector.lookupAxis)) errors.push(`${path}.selector.lookupAxis must reference an existing axis`);
      if (!objects(selector.options) || selector.options.length === 0) {
        errors.push(`${path}.selector.options must contain factor options`);
      } else {
        const hasOutputBackedOption = selector.options.some((option) => text(option.factorOutputKey));
        if (hasOutputBackedOption && !axisExists(selector.lookupAxis)) errors.push(`${path}.selector.lookupAxis is required for output-backed factor options`);
        if (selector.lookupAxis && axisKeys.some((key) => key !== selector.lookupAxis)) errors.push(`${path}.selector must bind every dataset axis used by the factor lookup`);
        selector.options.forEach((option, optionIndex) => {
          const hasOutput = outputExists(option.factorOutputKey);
          const hasFixed = finiteNumber(option.fixedFactor);
          if (!text(option.value) || !text(option.label) || hasOutput === hasFixed) {
            errors.push(`${path}.selector.options[${optionIndex}] must declare exactly one valid factor output or fixed factor`);
          }
        });
      }
    } else if (selector.kind === "axis") {
      if (!axisExists(selector.axisKey) || !outputExists(selector.factorOutput)) {
        errors.push(`${path}.selector axis/factor bindings must reference existing dataset fields`);
      }
      if (selector.lookupAxis !== undefined && !axisExists(selector.lookupAxis)) errors.push(`${path}.selector.lookupAxis must reference an existing axis`);
      const boundAxes = new Set([selector.axisKey, selector.lookupAxis].filter((value): value is string => typeof value === "string"));
      if (axisKeys.some((key) => !boundAxes.has(key))) errors.push(`${path}.selector must bind every dataset axis used by the factor lookup`);
    } else {
      errors.push(`${path}.selector.kind is unsupported`);
    }

    if (calculator.constraints !== undefined) {
      if (!objects(calculator.constraints)) {
        errors.push(`${path}.constraints must be an array`);
      } else {
        calculator.constraints.forEach((constraint, constraintIndex) => {
          const constraintPath = `${path}.constraints[${constraintIndex}]`;
          validatePerformanceExternalInput(constraint.input, `${constraintPath}.input`, errors);
          if ((constraint.operator !== "lte" && constraint.operator !== "gte") || !finiteNumber(constraint.value)) {
            errors.push(`${constraintPath} must contain a finite lte/gte rule`);
          }
          if (constraint.message !== undefined && !text(constraint.message)) errors.push(`${constraintPath}.message must be non-empty text`);
          if (constraint.when !== undefined) {
            if (!object(constraint.when)) errors.push(`${constraintPath}.when must be an object`);
            else {
              if (constraint.when.axisKey !== undefined && !axisExists(constraint.when.axisKey)) errors.push(`${constraintPath}.when.axisKey must reference an existing axis`);
              if (constraint.when.values !== undefined && (!Array.isArray(constraint.when.values) || constraint.when.values.length === 0 || !constraint.when.values.every(scalar))) errors.push(`${constraintPath}.when.values must contain scalar values`);
              if (constraint.when.selectorValues !== undefined && (!strings(constraint.when.selectorValues) || constraint.when.selectorValues.length === 0)) errors.push(`${constraintPath}.when.selectorValues must contain text values`);
            }
          }
        });
      }
    }
    return;
  }

  if (calculator.kind === "metric-lookup") {
    if (!axisExists(calculator.axisKey) || axisKeys.length !== 1 || !strings(calculator.outputKeys) || calculator.outputKeys.length === 0 || calculator.outputKeys.some((key) => !outputKeys.includes(key))) {
      errors.push(`${path} metric lookup must bind the dataset's single axis and one or more existing outputs`);
    }
    return;
  }

  errors.push(`${path}.kind is unsupported`);
}

function validatePerformance(payload: RecordValue, errors: string[]): void {
  if (!text(payload.title)) errors.push("performance title is required");
  if (!objects(payload.datasets) || payload.datasets.length === 0) {
    errors.push("performance datasets are required");
    return;
  }
  payload.datasets.forEach((dataset, datasetIndex) => {
    if (!idTitle(dataset) || (dataset.kind !== "lookup-table" && dataset.kind !== "reference-table") || (dataset.interpolation !== "none" && dataset.interpolation !== "linear-explicit") || !objects(dataset.axes) || dataset.axes.length === 0 || !objects(dataset.outputs) || dataset.outputs.length === 0 || !objects(dataset.rows) || dataset.rows.length === 0 || !validateSources(dataset.sources)) {
      errors.push(`datasets[${datasetIndex}] does not match the performance dataset contract`);
      return;
    }
    if (dataset.phase !== undefined && !validPerformancePhase(dataset.phase)) errors.push(`datasets[${datasetIndex}].phase is unsupported`);
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
    validatePerformanceCalculator(dataset, datasetIndex, axisKeys, outputKeys, errors);
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
    if (!idTitle(group) || !objects(group.items) || group.items.length === 0 || !validateSources(group.sources)) {
      errors.push(`groups[${groupIndex}] does not match the limitation group contract`);
      return;
    }
    group.items.forEach((item, itemIndex) => {
      if (!text(item.id) || !text(item.label) || !(text(item.value) || finiteNumber(item.value)) || !validateNotices(item.notices) || !validateSources(item.sources)) {
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
    if (!idTitle(system) || !text(system.summary) || !validateSources(system.sources)) errors.push(`systems[${index}] does not match the system lesson contract`);
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
    if (!idTitle(flow) || !objects(flow.steps) || flow.steps.length === 0 || !validateSources(flow.sources)) {
      errors.push(`flows[${flowIndex}] does not match the flow contract`);
      return;
    }
    flow.steps.forEach((step, stepIndex) => {
      if (!text(step.id) || !text(step.action) || !validateSources(step.sources)) errors.push(`flows[${flowIndex}].steps[${stepIndex}] does not match the flow step contract`);
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
    if (!idTitle(topic) || !text(topic.summary) || !validateSources(topic.sources)) errors.push(`topics[${index}] does not match the avionics topic contract`);
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
    if (!text(question.id) || !text(question.area) || !text(question.prompt) || !strings(choices) || choices.length < 2 || !Number.isInteger(question.correctIndex) || Number(question.correctIndex) < 0 || Number(question.correctIndex) >= choices.length || !text(question.explanation) || !validateSources(question.sources)) {
      errors.push(`questions[${index}] does not match the knowledge question contract`);
    }
  });
}

export function validateUniversalTrainingContentPayload(domain: UniversalTrainingContentDomain, payload: unknown): string[] {
  if (!object(payload)) return ["Published content payload must be a JSON object"];
  const errors: string[] = [];
  validateMetadata(payload, errors);
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
