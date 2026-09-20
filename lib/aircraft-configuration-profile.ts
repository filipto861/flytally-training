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

const configurationIdPattern =
  /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

const configurationStates = [
  "installed",
  "not-installed",
  "unknown",
] as const;

function configurationObject(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function assertKnownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
) {
  const unknown = Object.keys(value).filter(
    (key) => !allowed.includes(key),
  );
  if (unknown.length) {
    throw new Error(
      `Unsupported ${label} field: ${unknown.join(", ")}.`,
    );
  }
}

function configurationId(
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}.`);
  }
  const cleaned = value.trim();
  if (!configurationIdPattern.test(cleaned)) {
    throw new Error(`Invalid ${label}.`);
  }
  return cleaned;
}

function optionalConfigurationText(
  value: unknown,
  label: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}.`);
  }
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  if (cleaned.length > maxLength) {
    throw new Error(`Invalid ${label}.`);
  }
  return cleaned;
}

function configurationState(
  value: unknown,
  label: string,
): AircraftConfigurationModificationState {
  if (
    typeof value !== "string" ||
    !(configurationStates as readonly string[]).includes(value)
  ) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as AircraftConfigurationModificationState;
}

function configurationIds(
  value: unknown,
  label: string,
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  if (value.length > 128) {
    throw new Error(`Invalid ${label}.`);
  }
  return [
    ...new Set(
      value.map((item) =>
        configurationId(item, `${label} item`),
      ),
    ),
  ];
}

function configurationModifications(
  value: unknown,
): readonly AircraftConfigurationModification[] {
  if (!Array.isArray(value) || value.length > 128) {
    throw new Error("Invalid configuration modifications.");
  }

  const seen = new Set<string>();

  return value.map((candidate, index) => {
    const item = configurationObject(
      candidate,
      `configuration modification ${index + 1}`,
    );

    assertKnownFields(
      item,
      ["key", "state", "approvalRef", "note"],
      "configuration modification",
    );

    const key = configurationId(
      item.key,
      "configuration modification key",
    );

    if (seen.has(key)) {
      throw new Error(
        `Duplicate configuration modification key: ${key}.`,
      );
    }
    seen.add(key);

    const approvalRef = optionalConfigurationText(
      item.approvalRef,
      "configuration modification approval reference",
      200,
    );

    const note = optionalConfigurationText(
      item.note,
      "configuration modification note",
      2000,
    );

    return {
      key,
      state: configurationState(
        item.state,
        "configuration modification state",
      ),
      ...(approvalRef ? { approvalRef } : {}),
      ...(note ? { note } : {}),
    };
  });
}

function configurationEquipment(
  value: unknown,
): readonly AircraftConfigurationEquipment[] {
  if (!Array.isArray(value) || value.length > 128) {
    throw new Error("Invalid configuration equipment.");
  }

  const seen = new Set<string>();

  return value.map((candidate, index) => {
    const item = configurationObject(
      candidate,
      `configuration equipment ${index + 1}`,
    );

    assertKnownFields(
      item,
      ["key", "state", "model", "note"],
      "configuration equipment",
    );

    const key = configurationId(
      item.key,
      "configuration equipment key",
    );

    if (seen.has(key)) {
      throw new Error(
        `Duplicate configuration equipment key: ${key}.`,
      );
    }
    seen.add(key);

    const model = optionalConfigurationText(
      item.model,
      "configuration equipment model",
      200,
    );

    const note = optionalConfigurationText(
      item.note,
      "configuration equipment note",
      2000,
    );

    return {
      key,
      state: configurationState(
        item.state,
        "configuration equipment state",
      ),
      ...(model ? { model } : {}),
      ...(note ? { note } : {}),
    };
  });
}

export function parseAircraftConfigurationMetadata(
  value: unknown,
): AircraftConfigurationMetadata | undefined {
  if (value === undefined || value === null) return undefined;

  const metadata = configurationObject(
    value,
    "aircraft configuration metadata",
  );

  assertKnownFields(
    metadata,
    [
      "baseVariant",
      "capabilityTags",
      "modifications",
      "equipment",
    ],
    "aircraft configuration metadata",
  );

  const baseVariant =
    metadata.baseVariant === undefined
      ? undefined
      : configurationId(
          metadata.baseVariant,
          "base variant",
        );

  const capabilityTags =
    metadata.capabilityTags === undefined
      ? undefined
      : configurationIds(
          metadata.capabilityTags,
          "configuration capability tags",
        );

  const modifications =
    metadata.modifications === undefined
      ? undefined
      : configurationModifications(
          metadata.modifications,
        );

  const equipment =
    metadata.equipment === undefined
      ? undefined
      : configurationEquipment(
          metadata.equipment,
        );

  return {
    ...(baseVariant ? { baseVariant } : {}),
    ...(capabilityTags !== undefined
      ? { capabilityTags }
      : {}),
    ...(modifications !== undefined
      ? { modifications }
      : {}),
    ...(equipment !== undefined
      ? { equipment }
      : {}),
  };
}
