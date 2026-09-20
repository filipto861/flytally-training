export const commonAircraftEquipmentProfileKey = "__common__";

export function mergeAircraftEquipmentTags(
  common: readonly string[] | undefined,
  variant: readonly string[] | undefined,
): readonly string[] {
  return [...new Set([...(common ?? []), ...(variant ?? [])])];
}

export type AircraftConfigurationModificationState =
  | "installed"
  | "not-installed"
  | "unknown";

export type AircraftConfigurationModification = {
  readonly key: string;
  readonly state: AircraftConfigurationModificationState;
  readonly approvalRef?: string;
  readonly note?: string;
};

export type AircraftConfigurationEquipmentState =
  | "installed"
  | "not-installed"
  | "unknown";

export type AircraftConfigurationEquipment = {
  readonly key: string;
  readonly state: AircraftConfigurationEquipmentState;
  readonly model?: string;
  readonly note?: string;
};

export type AircraftConfigurationMetadata = {
  readonly baseVariant?: string;
  readonly capabilityTags?: readonly string[];
  readonly modifications?: readonly AircraftConfigurationModification[];
  readonly equipment?: readonly AircraftConfigurationEquipment[];
};
