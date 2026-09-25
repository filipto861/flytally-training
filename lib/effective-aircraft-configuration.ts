import type {
  TrainingAircraft,
  TrainingAircraftVariantProfile,
} from "./aircraft-catalog.ts";

import {
  mergeAircraftEquipmentTags,
  type AircraftConfigurationEquipment,
  type AircraftConfigurationMetadata,
  type AircraftConfigurationModification,
} from "./aircraft-configuration-profile.ts";

export type DataHealthSeverity =
  | "info"
  | "warning"
  | "blocking";

export type DataHealthCode =
  | "UNKNOWN_MODIFICATION_STATE"
  | "UNKNOWN_EQUIPMENT_STATE";

export type DataHealthIssue = {
  readonly severity: DataHealthSeverity;
  readonly code: DataHealthCode;
  readonly message: string;
};

export type EffectiveAircraftConfiguration = {
  readonly snapshotId: string;

  readonly aircraftId: string;
  readonly variantKey: string;
  readonly serialNumber?: string;
  readonly baseVariantKey: string;

  /**
   * Current applicability-compatible equipment-tag union.
   * Ordering follows existing mergeAircraftEquipmentTags semantics.
   */
  readonly equipmentTags: readonly string[];

  /**
   * Explicit technical configuration capabilities.
   * This is NOT AircraftContentCapabilities.
   */
  readonly capabilityTags: readonly string[];

  readonly modifications:
    readonly AircraftConfigurationModification[];

  readonly configurationEquipment:
    readonly AircraftConfigurationEquipment[];

  readonly dataHealth:
    readonly DataHealthIssue[];
};

export type ResolveEffectiveAircraftConfigurationInput = {
  readonly aircraft: Pick<
    TrainingAircraft,
    "id" | "equipmentTags"
  >;

  /**
   * Caller resolves this using the existing variant-selection boundary.
   */
  readonly variantProfile:
    TrainingAircraftVariantProfile;

  /**
   * Kept separate in the first M1 commit.
   * PostgreSQL/profile persistence is wired in a later commit.
   */
  readonly configuration?:
    AircraftConfigurationMetadata;
};

export function resolveEffectiveAircraftConfiguration(
  input: ResolveEffectiveAircraftConfigurationInput,
): EffectiveAircraftConfiguration {
  const {
    aircraft,
    variantProfile,
    configuration,
  } = input;

  const serialNumber = configuration?.serialNumber;

  const equipmentTags = [
    ...mergeAircraftEquipmentTags(
      aircraft.equipmentTags,
      variantProfile.equipmentTags,
    ),
  ];

  const capabilityTags = uniquePreservingOrder(
    configuration?.capabilityTags ?? [],
  );

  const modifications =
    (configuration?.modifications ?? []).map(
      (item) => ({ ...item }),
    );

  const configurationEquipment =
    (configuration?.equipment ?? []).map(
      (item) => ({ ...item }),
    );

  const baseVariantKey =
    configuration?.baseVariant ??
    variantProfile.key;

  const dataHealth = buildDataHealth({
    modifications,
    configurationEquipment,
  });

  const snapshotId = buildSnapshotId({
    aircraftId: aircraft.id,
    variantKey: variantProfile.key,
    serialNumber,
    baseVariantKey,
    equipmentTags,
    capabilityTags,
    modifications,
    configurationEquipment,
  });

  return {
    snapshotId,
    aircraftId: aircraft.id,
    variantKey: variantProfile.key,
    ...(serialNumber ? { serialNumber } : {}),
    baseVariantKey,
    equipmentTags,
    capabilityTags,
    modifications,
    configurationEquipment,
    dataHealth,
  };
}

function uniquePreservingOrder(
  values: readonly string[],
): readonly string[] {
  return [...new Set(values)];
}

function buildDataHealth(args: {
  readonly modifications:
    readonly AircraftConfigurationModification[];

  readonly configurationEquipment:
    readonly AircraftConfigurationEquipment[];
}): readonly DataHealthIssue[] {
  const issues: DataHealthIssue[] = [];

  const unknownMods = args.modifications.filter(
    (item) => item.state === "unknown",
  );

  if (unknownMods.length) {
    issues.push({
      severity: "warning",
      code: "UNKNOWN_MODIFICATION_STATE",
      message:
        "Modification state is unknown for: " +
        unknownMods.map((item) => item.key).join(", "),
    });
  }

  const unknownEquipment =
    args.configurationEquipment.filter(
      (item) => item.state === "unknown",
    );

  if (unknownEquipment.length) {
    issues.push({
      severity: "warning",
      code: "UNKNOWN_EQUIPMENT_STATE",
      message:
        "Equipment state is unknown for: " +
        unknownEquipment
          .map((item) => item.key)
          .join(", "),
    });
  }

  return issues;
}

function buildSnapshotId(args: {
  readonly aircraftId: string;
  readonly variantKey: string;
  readonly serialNumber?: string;
  readonly baseVariantKey: string;
  readonly equipmentTags: readonly string[];
  readonly capabilityTags: readonly string[];
  readonly modifications:
    readonly AircraftConfigurationModification[];
  readonly configurationEquipment:
    readonly AircraftConfigurationEquipment[];
}): string {
  const canonical = {
    aircraftId: args.aircraftId,
    variantKey: args.variantKey,
    serialNumber: args.serialNumber ?? null,
    baseVariantKey: args.baseVariantKey,

    equipmentTags:
      [...args.equipmentTags].sort(),

    capabilityTags:
      [...args.capabilityTags].sort(),

    modifications:
      [...args.modifications]
        .map((item) => ({
          key: item.key,
          state: item.state,
          approvalRef: item.approvalRef ?? null,
          note: item.note ?? null,
        }))
        .sort((left, right) =>
          left.key.localeCompare(right.key) ||
          left.state.localeCompare(right.state) ||
          String(left.approvalRef)
            .localeCompare(String(right.approvalRef)) ||
          String(left.note)
            .localeCompare(String(right.note)),
        ),

    equipment:
      [...args.configurationEquipment]
        .map((item) => ({
          key: item.key,
          state: item.state,
          model: item.model ?? null,
          note: item.note ?? null,
        }))
        .sort((left, right) =>
          left.key.localeCompare(right.key) ||
          left.state.localeCompare(right.state) ||
          String(left.model)
            .localeCompare(String(right.model)) ||
          String(left.note)
            .localeCompare(String(right.note)),
        ),
  };

  return `effective:v1:${encodeURIComponent(
    JSON.stringify(canonical),
  )}`;
}

export function resolveEffectiveAircraftConfigurationForProfile(
  aircraft: Pick<TrainingAircraft, "id" | "equipmentTags">,
  variantProfile: TrainingAircraftVariantProfile,
): EffectiveAircraftConfiguration {
  return resolveEffectiveAircraftConfiguration({
    aircraft,
    variantProfile,
    configuration: variantProfile.configuration,
  });
}
