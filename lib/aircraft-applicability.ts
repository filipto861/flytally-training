import type { TrainingAircraft, TrainingAircraftVariantProfile } from "./aircraft-catalog.ts";
import {
  commonAircraftEquipmentProfileKey,
  mergeAircraftEquipmentTags,
  type AircraftConfigurationEquipmentState,
  type AircraftConfigurationModificationState,
} from "./aircraft-configuration-profile.ts";
import { resolveEffectiveAircraftConfigurationForProfile } from "./effective-aircraft-configuration.ts";
import type { AircraftAbnormalEmergencyContent } from "./universal-abnormal-emergency.ts";
import type {
  AircraftApplicability,
  AircraftAvionicsContent,
  AircraftChecklistContent,
  AircraftFlowsContent,
  AircraftKnowledgeContent,
  AircraftLimitationsContent,
  AircraftPerformanceContent,
  AircraftProcedureDefinitionContent,
  AircraftSystemsContent,
} from "./universal-aircraft-content.ts";

export type AircraftConfiguration = {
  readonly variant?: string;
  readonly baseVariant?: string;
  readonly equipment: ReadonlySet<string>;

  /**
   * Undefined means the capability inventory is not declared.
   * An empty set means it is explicitly declared as empty.
   */
  readonly capabilityTags?: ReadonlySet<string>;

  readonly modifications?: ReadonlyMap<
    string,
    AircraftConfigurationModificationState
  >;

  readonly configurationEquipment?: ReadonlyMap<
    string,
    AircraftConfigurationEquipmentState
  >;
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
  aircraft: Pick<TrainingAircraft, "id" | "variants" | "variantProfiles" | "equipmentTags">,
  variant: string | undefined,
): AircraftConfiguration {
  const profile = resolveVariantProfile(aircraft, variant);

  if (!profile) {
    return {
      variant: undefined,
      equipment: new Set(
        mergeAircraftEquipmentTags(
          aircraft.equipmentTags,
          undefined,
        ),
      ),
    };
  }

  const effective = resolveEffectiveAircraftConfigurationForProfile(
    aircraft,
    profile,
  );

  return {
    variant: effective.variantKey,
    baseVariant: effective.baseVariantKey,
    equipment: new Set(effective.equipmentTags),

    ...(profile.configuration?.capabilityTags !== undefined
      ? {
          capabilityTags: new Set(effective.capabilityTags),
        }
      : {}),

    ...(profile.configuration?.modifications !== undefined
      ? {
          modifications: new Map(
            effective.modifications.map(
              (item) => [item.key, item.state] as const,
            ),
          ),
        }
      : {}),

    ...(profile.configuration?.equipment !== undefined
      ? {
          configurationEquipment: new Map(
            effective.configurationEquipment.map(
              (item) => [item.key, item.state] as const,
            ),
          ),
        }
      : {}),
  };
}

export function effectiveConfigurationSnapshotIdForAircraftVariant(
  aircraft: Pick<TrainingAircraft, "id" | "variants" | "variantProfiles" | "equipmentTags">,
  variant: string | undefined,
): string {
  const profile = resolveVariantProfile(aircraft, variant);

  if (profile) {
    return resolveEffectiveAircraftConfigurationForProfile(
      aircraft,
      profile,
    ).snapshotId;
  }

  if (variant !== undefined) {
    throw new Error(
      `Cannot resolve effective configuration snapshot for unknown variant "${variant}".`,
    );
  }

  const commonProfile: TrainingAircraftVariantProfile = {
    key: commonAircraftEquipmentProfileKey,
    displayName: "Common",
    equipmentTags: aircraft.equipmentTags ?? [],
  };

  return resolveEffectiveAircraftConfigurationForProfile(
    aircraft,
    commonProfile,
  ).snapshotId;
}

function matchesSetApplicability(
  values: ReadonlySet<string> | undefined,
  allOf: readonly string[] | undefined,
  anyOf: readonly string[] | undefined,
  noneOf: readonly string[] | undefined,
): boolean {
  const hasRule =
    Boolean(allOf?.length) ||
    Boolean(anyOf?.length) ||
    Boolean(noneOf?.length);

  if (!hasRule) return true;

  // No declared inventory means unknown, not empty.
  if (!values) return false;

  if (allOf?.some((key) => !values.has(key))) {
    return false;
  }

  if (
    anyOf?.length &&
    !anyOf.some((key) => values.has(key))
  ) {
    return false;
  }

  if (noneOf?.some((key) => values.has(key))) {
    return false;
  }

  return true;
}

function matchesStateApplicability<
  State extends "installed" | "not-installed" | "unknown",
>(
  states: ReadonlyMap<string, State> | undefined,
  allOf: readonly string[] | undefined,
  anyOf: readonly string[] | undefined,
  noneOf: readonly string[] | undefined,
): boolean {
  const hasRule =
    Boolean(allOf?.length) ||
    Boolean(anyOf?.length) ||
    Boolean(noneOf?.length);

  if (!hasRule) return true;

  if (!states) return false;

  if (
    allOf?.some(
      (key) => states.get(key) !== "installed",
    )
  ) {
    return false;
  }

  if (
    anyOf?.length &&
    !anyOf.some(
      (key) => states.get(key) === "installed",
    )
  ) {
    return false;
  }

  /*
   * "None of" requires explicit known absence.
   * Unknown or missing state fails closed.
   */
  if (
    noneOf?.some(
      (key) => states.get(key) !== "not-installed",
    )
  ) {
    return false;
  }

  return true;
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

  if (applicability.baseVariants?.length) {
    if (
      !configuration.baseVariant ||
      !applicability.baseVariants.includes(configuration.baseVariant)
    ) {
      return false;
    }
  }

  if (
    !matchesSetApplicability(
      configuration.capabilityTags,
      applicability.capabilityTagsAllOf,
      applicability.capabilityTagsAnyOf,
      applicability.capabilityTagsNoneOf,
    )
  ) {
    return false;
  }

  if (
    !matchesStateApplicability(
      configuration.modifications,
      applicability.modificationsAllOf,
      applicability.modificationsAnyOf,
      applicability.modificationsNoneOf,
    )
  ) {
    return false;
  }

  if (
    !matchesStateApplicability(
      configuration.configurationEquipment,
      applicability.configurationEquipmentAllOf,
      applicability.configurationEquipmentAnyOf,
      applicability.configurationEquipmentNoneOf,
    )
  ) {
    return false;
  }

  return true;
}

export function configurationForVariant(variant: string | undefined, equipment: readonly string[] = []): AircraftConfiguration {
  return { variant, baseVariant: variant, equipment: new Set(equipment) };
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
  content: AircraftProcedureDefinitionContent,
  configuration: AircraftConfiguration,
): AircraftProcedureDefinitionContent {
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
    systems: content.systems
      .filter((system) => matchesAircraftApplicability(system.applicability, configuration))
      .map((system) => {
        if (!system.schematic) return system;

        const nodes = system.schematic.nodes.filter((node) =>
          matchesAircraftApplicability(node.applicability, configuration),
        );
        const survivingNodeIds = new Set(nodes.map((node) => node.id));
        const edges = system.schematic.edges.filter((edge) =>
          matchesAircraftApplicability(edge.applicability, configuration)
          && survivingNodeIds.has(edge.from)
          && survivingNodeIds.has(edge.to),
        );

        return {
          ...system,
          schematic: {
            ...system.schematic,
            nodes,
            edges,
          },
        };
      }),
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
  if (content.schemaVersion === 2) {
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
