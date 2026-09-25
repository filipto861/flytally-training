import type {
  AircraftApplicability,
  TrainingNotice,
  TrainingSourceReference,
  UniversalModuleMetadata,
} from "./universal-aircraft-content.ts";

export type QrhProcedureClass = "emergency" | "abnormal";

export type AircraftAbnormalEmergencyLegacyStage = {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly expectedResponse: readonly string[];
  readonly explanation: string;
  readonly notices?: readonly TrainingNotice[];
  readonly applicability?: AircraftApplicability;
  readonly sources: readonly TrainingSourceReference[];
};

export type AircraftAbnormalEmergencyLegacyScenario = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly phase: string;
  readonly difficulty: "core" | "advanced";
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly stages: readonly AircraftAbnormalEmergencyLegacyStage[];
  readonly debrief: readonly string[];
  readonly notices?: readonly TrainingNotice[];
  readonly boundaryNote?: string;
  readonly applicability?: AircraftApplicability;
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftQrhActionStep = {
  readonly id: string;
  readonly kind: "action";
  readonly text: string;
  /**
   * Optional source-visible item marker such as a checklist number or bullet.
   * Presentation must not invent numbering for v2 source-faithful content.
   */
  readonly label?: string;
  readonly memoryItem?: boolean;
  readonly notices?: readonly TrainingNotice[];
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftQrhInformationStep = {
  readonly id: string;
  readonly kind: "information";
  /** Source informational text that is not itself a crew action. */
  readonly text: string;
  readonly label?: string;
  readonly memoryItem?: boolean;
  readonly notices?: readonly TrainingNotice[];
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftQrhConditionBranch = {
  readonly id: string;
  /** Exact source condition/branch wording. */
  readonly label: string;
  /** Source boxed/memory presentation for this specific branch heading. */
  readonly memoryItem?: boolean;
  readonly steps: readonly AircraftQrhStep[];
};

export type AircraftQrhConditionStep = {
  readonly id: string;
  readonly kind: "condition";
  readonly branches: readonly AircraftQrhConditionBranch[];
  readonly notices?: readonly TrainingNotice[];
  readonly sources?: readonly TrainingSourceReference[];
};

export type AircraftQrhStep =
  | AircraftQrhActionStep
  | AircraftQrhInformationStep
  | AircraftQrhConditionStep;

export type AircraftQrhEffectivity =
  | {
      readonly kind: "all-aircraft";
      readonly sourceText: string;
    }
  | {
      readonly kind: "mapped";
      readonly sourceText: string;
      readonly mappingNote?: string;
    };

export type AircraftQrhEnvelopePoint = {
  readonly x: number;
  readonly y: number;
};

export type AircraftQrhEnvelopeAxis = {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly ticks: readonly number[];
};

export type AircraftQrhEnvelopeRegion = {
  readonly id: string;
  readonly label: string;
  readonly fill: "shaded" | "hatched" | "none";
  /**
   * Source-digitized vertices in source axis units. These points are for
   * faithful visual reconstruction only and must never be treated as a
   * computational lookup/interpolation surface.
   */
  readonly points: readonly AircraftQrhEnvelopePoint[];
  readonly labelAt?: AircraftQrhEnvelopePoint;
};

export type AircraftQrhEnvelopeGuide = {
  readonly id: string;
  readonly style: "boundary" | "guide";
  readonly points: readonly AircraftQrhEnvelopePoint[];
};

export type AircraftQrhEnvelopeAnnotation = {
  readonly id: string;
  readonly text: string;
  readonly at: AircraftQrhEnvelopePoint;
};

export type AircraftQrhEnvelopeFigure = {
  readonly id: string;
  readonly kind: "operating-envelope";
  readonly title: string;
  readonly geometryPolicy: "source-digitized-visual-reference";
  readonly xAxis: AircraftQrhEnvelopeAxis;
  readonly yAxis: AircraftQrhEnvelopeAxis;
  readonly regions: readonly AircraftQrhEnvelopeRegion[];
  readonly guides?: readonly AircraftQrhEnvelopeGuide[];
  readonly annotations?: readonly AircraftQrhEnvelopeAnnotation[];
  readonly notes?: readonly string[];
  readonly sources: readonly TrainingSourceReference[];
};

export type AircraftQrhTrainingStageOverlay = {
  readonly stageId: string;
  readonly prompt: string;
  readonly explanation: string;
};

export type AircraftQrhTrainingOverlay = {
  readonly difficulty: "core" | "advanced";
  readonly minutes: number;
  readonly summary: string;
  readonly setup: string;
  readonly objectives: readonly string[];
  readonly debrief: readonly string[];
  readonly stages: readonly AircraftQrhTrainingStageOverlay[];
};

export type AircraftQrhStage = {
  readonly id: string;
  readonly label: string;
  readonly memoryItem?: boolean;
  readonly steps: readonly AircraftQrhStep[];
  readonly notices?: readonly TrainingNotice[];
  readonly applicability?: AircraftApplicability;
  readonly effectivity?: AircraftQrhEffectivity;
  readonly sources: readonly TrainingSourceReference[];
};

export type AircraftQrhScenario = {
  readonly id: string;
  readonly title: string;
  readonly procedureClass: QrhProcedureClass;
  readonly category: string;
  readonly phase?: string;
  readonly stages: readonly AircraftQrhStage[];
  readonly notices?: readonly TrainingNotice[];
  readonly boundaryNote?: string;
  readonly figureIds?: readonly string[];
  readonly applicability?: AircraftApplicability;
  readonly effectivity: AircraftQrhEffectivity;
  readonly sources?: readonly TrainingSourceReference[];
  /**
   * Optional training-only overlay. Operational QRH publication does not
   * require invented setup/debrief prose.
   */
  readonly training?: AircraftQrhTrainingOverlay;
};

export type AircraftQrhSectionIntroduction = {
  readonly procedureClass: QrhProcedureClass;
  readonly paragraphs: readonly string[];
  readonly notices?: readonly TrainingNotice[];
  readonly sources: readonly TrainingSourceReference[];
};

export type AircraftAbnormalEmergencyLegacyContent = UniversalModuleMetadata & {
  readonly schemaVersion?: undefined;
  readonly aircraftId: string;
  readonly title: string;
  readonly scenarios: readonly AircraftAbnormalEmergencyLegacyScenario[];
};

export type AircraftAbnormalEmergencyV2Content = UniversalModuleMetadata & {
  readonly schemaVersion: 2;
  readonly aircraftId: string;
  readonly title: string;
  readonly sectionIntroductions?: readonly AircraftQrhSectionIntroduction[];
  readonly figures?: readonly AircraftQrhEnvelopeFigure[];
  readonly scenarios: readonly AircraftQrhScenario[];
};

export type AircraftAbnormalEmergencyContent =
  | AircraftAbnormalEmergencyLegacyContent
  | AircraftAbnormalEmergencyV2Content;

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const objects = (value: unknown): value is RecordValue[] => Array.isArray(value) && value.every(object);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(text);
const positiveNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const finiteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const optionalBoolean = (value: unknown): boolean => value === undefined || typeof value === "boolean";

function sources(value: unknown): boolean {
  return objects(value) && value.length > 0 && value.every((item) =>
    text(item.manualId) &&
    text(item.pageLabel) &&
    (item.chapter === undefined || text(item.chapter)) &&
    (item.section === undefined || text(item.section)) &&
    (item.note === undefined || text(item.note))
  );
}

function optionalSources(value: unknown): boolean {
  return value === undefined || sources(value);
}

function notices(value: unknown): boolean {
  if (value === undefined) return true;
  return objects(value) && value.every((item) =>
    (item.kind === "note" || item.kind === "caution" || item.kind === "warning") && text(item.text)
  );
}

function applicabilityHasSelector(value: unknown, depth = 0): boolean {
  if (!object(value) || depth > 8) return false;
  const keys = [
    "variants",
    "equipmentAllOf",
    "equipmentAnyOf",
    "equipmentNoneOf",
    "baseVariants",
    "capabilityTagsAllOf",
    "capabilityTagsAnyOf",
    "capabilityTagsNoneOf",
    "modificationsAllOf",
    "modificationsAnyOf",
    "modificationsNoneOf",
    "configurationEquipmentAllOf",
    "configurationEquipmentAnyOf",
    "configurationEquipmentNoneOf",
    "serialNumbers",
    "serialNumberRanges",
  ];
  if (keys.some((key) => Array.isArray(value[key]) && (value[key] as unknown[]).length > 0)) {
    return true;
  }
  const anyOf = value.anyOf;
  return Array.isArray(anyOf) && anyOf.some((branch) =>
    applicabilityHasSelector(branch, depth + 1),
  );
}

function qrhEffectivity(value: unknown, applicability: unknown): boolean {
  if (!object(value) || !text(value.sourceText)) return false;
  if (value.kind === "all-aircraft") return true;
  if (value.kind !== "mapped") return false;
  if (value.mappingNote !== undefined && !text(value.mappingNote)) return false;
  return applicabilityHasSelector(applicability);
}

function envelopePoint(
  value: unknown,
  xAxis: RecordValue,
  yAxis: RecordValue,
): boolean {
  if (!object(value) || !finiteNumber(value.x) || !finiteNumber(value.y)) return false;
  if (
    !finiteNumber(xAxis.min) ||
    !finiteNumber(xAxis.max) ||
    !finiteNumber(yAxis.min) ||
    !finiteNumber(yAxis.max)
  ) return false;
  return (
    value.x >= xAxis.min &&
    value.x <= xAxis.max &&
    value.y >= yAxis.min &&
    value.y <= yAxis.max
  );
}

function envelopeAxis(value: unknown): value is RecordValue {
  return (
    object(value) &&
    text(value.key) &&
    text(value.label) &&
    text(value.unit) &&
    finiteNumber(value.min) &&
    finiteNumber(value.max) &&
    value.max > value.min &&
    Array.isArray(value.ticks) &&
    value.ticks.length > 0 &&
    value.ticks.every((tick) =>
      finiteNumber(tick) && tick >= (value.min as number) && tick <= (value.max as number)
    )
  );
}

function validateQrhFigures(value: unknown, errors: string[]): Set<string> {
  const ids = new Set<string>();
  if (value === undefined) return ids;
  if (!objects(value) || value.length === 0) {
    errors.push("figures must contain at least one QRH source figure when supplied");
    return ids;
  }

  value.forEach((figure, index) => {
    const path = `figures[${index}]`;
    if (
      !text(figure.id) ||
      figure.kind !== "operating-envelope" ||
      !text(figure.title) ||
      figure.geometryPolicy !== "source-digitized-visual-reference" ||
      !envelopeAxis(figure.xAxis) ||
      !envelopeAxis(figure.yAxis) ||
      !sources(figure.sources)
    ) {
      errors.push(`${path} does not match the QRH operating-envelope contract`);
      return;
    }
    if (ids.has(figure.id as string)) {
      errors.push("figures must use unique ids");
      return;
    }
    ids.add(figure.id as string);

    const xAxis = figure.xAxis as RecordValue;
    const yAxis = figure.yAxis as RecordValue;

    if (!objects(figure.regions) || figure.regions.length === 0) {
      errors.push(`${path}.regions must contain at least one source region`);
    } else {
      const regionIds = new Set<string>();
      figure.regions.forEach((region, regionIndex) => {
        const regionPath = `${path}.regions[${regionIndex}]`;
        if (
          !text(region.id) ||
          !text(region.label) ||
          (region.fill !== "shaded" && region.fill !== "hatched" && region.fill !== "none") ||
          !objects(region.points) ||
          region.points.length < 3 ||
          !region.points.every((point) => envelopePoint(point, xAxis, yAxis)) ||
          (region.labelAt !== undefined && !envelopePoint(region.labelAt, xAxis, yAxis))
        ) {
          errors.push(`${regionPath} does not match the QRH envelope-region contract`);
          return;
        }
        if (regionIds.has(region.id as string)) {
          errors.push(`${path}.regions must use unique ids`);
        }
        regionIds.add(region.id as string);
      });
    }

    if (figure.guides !== undefined) {
      if (!objects(figure.guides)) {
        errors.push(`${path}.guides must be an array when supplied`);
      } else {
        figure.guides.forEach((guide, guideIndex) => {
          if (
            !text(guide.id) ||
            (guide.style !== "boundary" && guide.style !== "guide") ||
            !objects(guide.points) ||
            guide.points.length < 2 ||
            !guide.points.every((point) => envelopePoint(point, xAxis, yAxis))
          ) {
            errors.push(`${path}.guides[${guideIndex}] does not match the QRH envelope-guide contract`);
          }
        });
      }
    }

    if (figure.annotations !== undefined) {
      if (!objects(figure.annotations)) {
        errors.push(`${path}.annotations must be an array when supplied`);
      } else {
        figure.annotations.forEach((annotation, annotationIndex) => {
          if (
            !text(annotation.id) ||
            !text(annotation.text) ||
            !envelopePoint(annotation.at, xAxis, yAxis)
          ) {
            errors.push(`${path}.annotations[${annotationIndex}] does not match the QRH envelope-annotation contract`);
          }
        });
      }
    }

    if (
      figure.notes !== undefined &&
      (!Array.isArray(figure.notes) || !figure.notes.every(text))
    ) {
      errors.push(`${path}.notes must contain only non-empty source text`);
    }
  });

  return ids;
}

function validateQrhSteps(
  value: unknown,
  path: string,
  errors: string[],
  depth = 0,
): void {
  if (!objects(value) || value.length === 0) {
    errors.push(`${path} must contain at least one source step`);
    return;
  }
  if (depth > 8) {
    errors.push(`${path} exceeds maximum nested condition depth`);
    return;
  }

  value.forEach((step, index) => {
    const stepPath = `${path}[${index}]`;
    if (!text(step.id) || !notices(step.notices) || !optionalSources(step.sources)) {
      errors.push(`${stepPath} does not match the QRH step contract`);
      return;
    }

    if (step.kind === "action") {
      if (
        !text(step.text) ||
        (step.label !== undefined && !text(step.label)) ||
        !optionalBoolean(step.memoryItem)
      ) {
        errors.push(`${stepPath} does not match the QRH action contract`);
      }
      return;
    }

    if (step.kind === "information") {
      if (
        !text(step.text) ||
        (step.label !== undefined && !text(step.label)) ||
        !optionalBoolean(step.memoryItem)
      ) {
        errors.push(`${stepPath} does not match the QRH information contract`);
      }
      return;
    }

    if (step.kind === "condition") {
      if (!objects(step.branches) || step.branches.length === 0) {
        errors.push(`${stepPath}.branches must contain at least one source branch`);
        return;
      }
      step.branches.forEach((branch, branchIndex) => {
        const branchPath = `${stepPath}.branches[${branchIndex}]`;
        if (!text(branch.id) || !text(branch.label) || !optionalBoolean(branch.memoryItem)) {
          errors.push(`${branchPath} does not match the QRH branch contract`);
          return;
        }
        validateQrhSteps(branch.steps, `${branchPath}.steps`, errors, depth + 1);
      });
      return;
    }

    errors.push(`${stepPath}.kind must be action, information or condition`);
  });
}

function validateTrainingOverlay(
  value: unknown,
  stageIds: readonly string[],
  path: string,
  errors: string[],
): void {
  if (!object(value)) {
    errors.push(`${path} does not match the QRH training overlay contract`);
    return;
  }

  if (
    (value.difficulty !== "core" && value.difficulty !== "advanced") ||
    !positiveNumber(value.minutes) ||
    !text(value.summary) ||
    !text(value.setup) ||
    !strings(value.objectives) ||
    !strings(value.debrief) ||
    !objects(value.stages) ||
    value.stages.length === 0
  ) {
    errors.push(`${path} does not match the QRH training overlay contract`);
    return;
  }

  const seen = new Set<string>();
  for (const stage of value.stages) {
    if (!text(stage.stageId) || !text(stage.prompt) || !text(stage.explanation)) {
      errors.push(`${path}.stages contains invalid training guidance`);
      continue;
    }
    if (!stageIds.includes(stage.stageId) || seen.has(stage.stageId)) {
      errors.push(`${path}.stages must reference each source stage at most once`);
    }
    seen.add(stage.stageId);
  }

  if (stageIds.some((id) => !seen.has(id))) {
    errors.push(`${path}.stages must cover every source stage`);
  }
}

function validateLegacyScenario(scenario: RecordValue, scenarioIndex: number, errors: string[]): void {
  if (
    !text(scenario.id) ||
    !text(scenario.title) ||
    !text(scenario.category) ||
    !text(scenario.phase) ||
    (scenario.difficulty !== "core" && scenario.difficulty !== "advanced") ||
    !positiveNumber(scenario.minutes) ||
    !text(scenario.summary) ||
    !text(scenario.setup) ||
    !strings(scenario.objectives) ||
    !strings(scenario.debrief) ||
    !notices(scenario.notices) ||
    (scenario.boundaryNote !== undefined && !text(scenario.boundaryNote)) ||
    !optionalSources(scenario.sources)
  ) {
    errors.push(`scenarios[${scenarioIndex}] does not match the universal abnormal scenario contract`);
    return;
  }

  if (!objects(scenario.stages) || scenario.stages.length === 0) {
    errors.push(`scenarios[${scenarioIndex}].stages must contain at least one stage`);
    return;
  }

  scenario.stages.forEach((stage, stageIndex) => {
    if (
      !text(stage.id) ||
      !text(stage.label) ||
      !text(stage.prompt) ||
      !strings(stage.expectedResponse) ||
      !text(stage.explanation) ||
      !notices(stage.notices) ||
      !sources(stage.sources)
    ) {
      errors.push(`scenarios[${scenarioIndex}].stages[${stageIndex}] does not match the universal abnormal stage contract`);
    }
  });
}

function validateV2Scenario(
  scenario: RecordValue,
  scenarioIndex: number,
  errors: string[],
  figureIds: ReadonlySet<string>,
): void {
  const path = `scenarios[${scenarioIndex}]`;
  if (
    !text(scenario.id) ||
    !text(scenario.title) ||
    (scenario.procedureClass !== "emergency" && scenario.procedureClass !== "abnormal") ||
    !text(scenario.category) ||
    (scenario.phase !== undefined && !text(scenario.phase)) ||
    !notices(scenario.notices) ||
    (scenario.boundaryNote !== undefined && !text(scenario.boundaryNote)) ||
    !optionalSources(scenario.sources) ||
    !qrhEffectivity(scenario.effectivity, scenario.applicability)
  ) {
    errors.push(`${path} does not match the QRH v2 scenario contract`);
    return;
  }

  if (scenario.figureIds !== undefined) {
    if (
      !Array.isArray(scenario.figureIds) ||
      scenario.figureIds.length === 0 ||
      !scenario.figureIds.every(text) ||
      new Set(scenario.figureIds).size !== scenario.figureIds.length ||
      scenario.figureIds.some((id) => !figureIds.has(id as string))
    ) {
      errors.push(`${path}.figureIds must reference unique declared QRH figures`);
    }
  }

  if (!objects(scenario.stages) || scenario.stages.length === 0) {
    errors.push(`${path}.stages must contain at least one source stage`);
    return;
  }

  const stageIds: string[] = [];
  scenario.stages.forEach((stage, stageIndex) => {
    const stagePath = `${path}.stages[${stageIndex}]`;
    if (
      !text(stage.id) ||
      !text(stage.label) ||
      !optionalBoolean(stage.memoryItem) ||
      !notices(stage.notices) ||
      !sources(stage.sources) ||
      (stage.effectivity !== undefined && !qrhEffectivity(stage.effectivity, stage.applicability))
    ) {
      errors.push(`${stagePath} does not match the QRH v2 stage contract`);
      return;
    }
    stageIds.push(stage.id);
    validateQrhSteps(stage.steps, `${stagePath}.steps`, errors);
  });

  if (new Set(stageIds).size !== stageIds.length) {
    errors.push(`${path}.stages must use unique ids`);
  }

  if (scenario.training !== undefined) {
    validateTrainingOverlay(scenario.training, stageIds, `${path}.training`, errors);
  }
}

function validateSectionIntroductions(value: unknown, errors: string[]): void {
  if (value === undefined) return;
  if (!objects(value)) {
    errors.push("sectionIntroductions must be an array when supplied");
    return;
  }
  value.forEach((section, index) => {
    if (
      (section.procedureClass !== "emergency" && section.procedureClass !== "abnormal") ||
      !strings(section.paragraphs) ||
      !notices(section.notices) ||
      !sources(section.sources)
    ) {
      errors.push(`sectionIntroductions[${index}] does not match the QRH section-introduction contract`);
    }
  });
}

export function validateUniversalAbnormalEmergencyPayload(payload: unknown): string[] {
  const errors: string[] = [];
  if (!object(payload)) return ["abnormal payload must be an object"];
  if (!text(payload.aircraftId)) errors.push("abnormal aircraftId is required");
  if (!text(payload.title)) errors.push("abnormal title is required");
  if (payload.sourceNote !== undefined && !text(payload.sourceNote)) errors.push("abnormal sourceNote must be non-empty text when supplied");
  if (payload.disclaimer !== undefined && !text(payload.disclaimer)) errors.push("abnormal disclaimer must be non-empty text when supplied");

  if (!objects(payload.scenarios) || payload.scenarios.length === 0) {
    errors.push("abnormal scenarios are required");
    return errors;
  }

  if (payload.schemaVersion === 2) {
    validateSectionIntroductions(payload.sectionIntroductions, errors);
    const figureIds = validateQrhFigures(payload.figures, errors);
    payload.scenarios.forEach((scenario, index) => validateV2Scenario(scenario, index, errors, figureIds));
    return errors;
  }

  if (payload.schemaVersion !== undefined) {
    errors.push("abnormal schemaVersion must be 2 when supplied");
    return errors;
  }

  payload.scenarios.forEach((scenario, index) => validateLegacyScenario(scenario, index, errors));
  return errors;
}

export function isUniversalAbnormalEmergencyContent(value: unknown): value is AircraftAbnormalEmergencyContent {
  return validateUniversalAbnormalEmergencyPayload(value).length === 0;
}

export function isQrhV2AbnormalEmergencyContent(
  value: AircraftAbnormalEmergencyContent,
): value is AircraftAbnormalEmergencyV2Content {
  return value.schemaVersion === 2;
}
