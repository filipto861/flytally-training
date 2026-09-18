import type { TrainingAircraft, TrainingAircraftVariantProfile } from "./aircraft-catalog.ts";
import { mergeAircraftEquipmentTags } from "./aircraft-configuration-profile.ts";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency.ts";
import type {
  AircraftApplicability,
  AircraftAvionicsContent,
  AircraftChecklistContent,
  AircraftFlowsContent,
  AircraftKnowledgeContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
  AircraftProcedureContent,
  AircraftSystemsContent,
} from "./universal-aircraft-content.ts";

export type AircraftConfiguration = {
  readonly variant?: string;
  readonly equipment: ReadonlySet<string>;
};

export function resolveSelectedVariant(requestedVariant: string | undefined, variants: readonly string[]): string | undefined {
  if (requestedVariant && variants.includes(requestedVariant)) return requestedVariant;
  return variants.length === 1 ? variants[0] : undefined;
}

export function resolveVariantProfile(
  aircraft: Pick<TrainingAircraft, "variants" | "variantProfiles" | "equipmentTags">,
  variant: string | undefined,
): TrainingAircraftVariantProfile | undefined {
  if (!variant) return undefined;
  const explicit = aircraft.variantProfiles?.find((profile) => profile.key === variant);
  if (explicit) return explicit;
  // Falling back to an unregistered legacy variant is intentionally limited to
  // an empty equipment set. Never infer optional equipment from the variant key.
  if (aircraft.variants.includes(variant)) return { key: variant, displayName: variant, equipmentTags: [] };
  return undefined;
}

export function configurationForAircraftVariant(
  aircraft: Pick<TrainingAircraft, "variants" | "variantProfiles" | "equipmentTags">,
  variant: string | undefined,
): AircraftConfiguration {
  const profile = resolveVariantProfile(aircraft, variant);
  return {
    variant: profile?.key,
    equipment: new Set(mergeAircraftEquipmentTags(aircraft.equipmentTags, profile?.equipmentTags)),
  };
}

export function matchesAircraftApplicability(
  applicability: AircraftApplicability | undefined,
  configuration: AircraftConfiguration,
): boolean {
  if (!applicability) return true;

  if (applicability.variants?.length) {
    if (!configuration.variant || !applicability.variants.includes(configuration.variant)) return false;
  }

  const equipment = configuration.equipment;
  if (applicability.equipmentAllOf?.some((tag) => !equipment.has(tag))) return false;
  if (applicability.equipmentAnyOf?.length && !applicability.equipmentAnyOf.some((tag) => equipment.has(tag))) return false;
  if (applicability.equipmentNoneOf?.some((tag) => equipment.has(tag))) return false;

  return true;
}

export function configurationForVariant(variant: string | undefined, equipment: readonly string[] = []): AircraftConfiguration {
  return { variant, equipment: new Set(equipment) };
}

export function filterChecklistForConfiguration(
  content: AircraftChecklistContent,
  configuration: AircraftConfiguration,
): AircraftChecklistContent {
  return {
    ...content,
    phases: content.phases
      .filter((phase) => matchesAircraftApplicability(phase.applicability, configuration))
      .map((phase) => ({
        ...phase,
        items: phase.items.filter((item) => matchesAircraftApplicability(item.applicability, configuration)),
      }))
      .filter((phase) => phase.items.length > 0),
  };
}

export function filterProceduresForConfiguration(
  content: AircraftProcedureContent,
  configuration: AircraftConfiguration,
): AircraftProcedureContent {
  return {
    ...content,
    procedures: content.procedures.filter((procedure) => matchesAircraftApplicability(procedure.applicability, configuration)),
  };
}

export function filterPerformanceForConfiguration(
  content: AircraftPerformanceContent,
  configuration: AircraftConfiguration,
): AircraftPerformanceContent {
  return {
    ...content,
    datasets: content.datasets.filter((dataset) => matchesAircraftApplicability(dataset.applicability, configuration)),
  };
}

export function filterLimitationsForConfiguration(
  content: AircraftLimitationsContent,
  configuration: AircraftConfiguration,
): AircraftLimitationsContent {
  return {
    ...content,
    groups: content.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => matchesAircraftApplicability(item.applicability, configuration)),
      }))
      .filter((group) => group.items.length > 0),
  };
}

export function filterSystemsForConfiguration(
  content: AircraftSystemsContent,
  configuration: AircraftConfiguration,
): AircraftSystemsContent {
  return {
    ...content,
    systems: content.systems.filter((system) => matchesAircraftApplicability(system.applicability, configuration)),
  };
}

export function filterFlowsForConfiguration(
  content: AircraftFlowsContent,
  configuration: AircraftConfiguration,
): AircraftFlowsContent {
  return {
    ...content,
    flows: content.flows.filter((flow) => matchesAircraftApplicability(flow.applicability, configuration)),
  };
}

export function filterAvionicsForConfiguration(
  content: AircraftAvionicsContent,
  configuration: AircraftConfiguration,
): AircraftAvionicsContent {
  return {
    ...content,
    topics: content.topics.filter((topic) => matchesAircraftApplicability(topic.applicability, configuration)),
  };
}

export function filterKnowledgeForConfiguration(
  content: AircraftKnowledgeContent,
  configuration: AircraftConfiguration,
): AircraftKnowledgeContent {
  return {
    ...content,
    questions: content.questions.filter((question) => matchesAircraftApplicability(question.applicability, configuration)),
  };
}

export function filterAbnormalEmergencyForConfiguration(
  content: AircraftAbnormalEmergencyContent,
  configuration: AircraftConfiguration,
): AircraftAbnormalEmergencyContent {
  return {
    ...content,
    scenarios: content.scenarios
      .filter((scenario) => matchesAircraftApplicability(scenario.applicability, configuration))
      .map((scenario) => ({
        ...scenario,
        stages: scenario.stages.filter((stage) => matchesAircraftApplicability(stage.applicability, configuration)),
      }))
      .filter((scenario) => scenario.stages.length > 0),
  };
}

export function withVariantQuery(href: string, variant: string | undefined): string {
  if (!variant) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}variant=${encodeURIComponent(variant)}`;
}
