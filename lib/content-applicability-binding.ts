type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectEmbeddedApplicabilityValues(
  payload: unknown,
  keys: readonly string[],
): readonly string[] {
  const values = new Set<string>();

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;

    const applicability = value.applicability;
    if (isRecord(applicability)) {
      for (const key of keys) {
        const candidates = applicability[key];
        if (!Array.isArray(candidates)) continue;
        candidates.forEach((candidate) => {
          if (typeof candidate === "string" && candidate.trim()) {
            values.add(candidate.trim());
          }
        });
      }
    }

    Object.values(value).forEach(visit);
  }

  visit(payload);
  return [...values];
}

const variantKeys = ["variants"] as const;
const equipmentKeys = ["equipmentAllOf", "equipmentAnyOf", "equipmentNoneOf"] as const;
const baseVariantKeys = ["baseVariants"] as const;
const capabilityKeys = [
  "capabilityTagsAllOf",
  "capabilityTagsAnyOf",
  "capabilityTagsNoneOf",
] as const;
const modificationKeys = [
  "modificationsAllOf",
  "modificationsAnyOf",
  "modificationsNoneOf",
] as const;
const configurationEquipmentKeys = [
  "configurationEquipmentAllOf",
  "configurationEquipmentAnyOf",
  "configurationEquipmentNoneOf",
] as const;

/**
 * Collect every explicit applicability.variant key carried by a governed
 * payload. The traversal is deliberately domain-agnostic so new module types
 * inherit the same release boundary automatically.
 */
export function collectEmbeddedVariantKeys(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, variantKeys);
}

/**
 * Collect explicit equipment identifiers from applicability blocks only. Plain
 * content fields with similar names are deliberately ignored so the release
 * contract remains tied to runtime applicability semantics.
 */
export function collectEmbeddedEquipmentTags(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, equipmentKeys);
}

export function collectEmbeddedBaseVariantKeys(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, baseVariantKeys);
}

export function collectEmbeddedCapabilityTags(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, capabilityKeys);
}

export function collectEmbeddedModificationKeys(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, modificationKeys);
}

export function collectEmbeddedConfigurationEquipmentKeys(payload: unknown): readonly string[] {
  return collectEmbeddedApplicabilityValues(payload, configurationEquipmentKeys);
}

function assertApplicabilityValuesRegistered(
  referenced: readonly string[],
  registeredValues: readonly string[],
  label: string,
  aircraftId?: string,
): void {
  if (!referenced.length) return;

  const registered = new Set(
    registeredValues.map((value) => value.trim()).filter(Boolean),
  );
  const invalid = referenced.filter((value) => !registered.has(value));
  if (!invalid.length) return;

  const aircraft = aircraftId ? ` for aircraft ${aircraftId}` : "";
  throw new Error(
    `Content applicability references unregistered ${label}${aircraft}: ${invalid.join(", ")}.`,
  );
}

/**
 * A syntactically valid applicability object is not sufficient for release:
 * every referenced variant must actually exist in the aircraft catalogue.
 * Payloads without variant-scoped applicability remain valid for sparse or
 * single-configuration aircraft.
 */
export function assertApplicabilityVariantsRegistered(
  payload: unknown,
  registeredVariantKeys: readonly string[],
  aircraftId?: string,
): void {
  const referenced = collectEmbeddedVariantKeys(payload);
  if (!referenced.length) return;

  const registered = new Set(registeredVariantKeys.map((value) => value.trim()).filter(Boolean));
  const invalid = referenced.filter((variant) => !registered.has(variant));
  if (!invalid.length) return;

  const aircraft = aircraftId ? ` for aircraft ${aircraftId}` : "";
  throw new Error(`Content applicability references unregistered variant(s)${aircraft}: ${invalid.join(", ")}.`);
}

/**
 * Equipment applicability is governed by the explicit equipment inventory on
 * aircraft variant profiles. Unknown tags fail closed so a typo cannot silently
 * hide published content from every matching configuration.
 */
export function assertApplicabilityEquipmentRegistered(
  payload: unknown,
  registeredEquipmentTags: readonly string[],
  aircraftId?: string,
): void {
  const referenced = collectEmbeddedEquipmentTags(payload);
  if (!referenced.length) return;

  const registered = new Set(registeredEquipmentTags.map((value) => value.trim()).filter(Boolean));
  const invalid = referenced.filter((tag) => !registered.has(tag));
  if (!invalid.length) return;

  const aircraft = aircraftId ? ` for aircraft ${aircraftId}` : "";
  throw new Error(`Content applicability references unregistered equipment tag(s)${aircraft}: ${invalid.join(", ")}.`);
}

export function assertApplicabilityBaseVariantsRegistered(
  payload: unknown,
  registeredBaseVariantKeys: readonly string[],
  aircraftId?: string,
): void {
  assertApplicabilityValuesRegistered(
    collectEmbeddedBaseVariantKeys(payload),
    registeredBaseVariantKeys,
    "base variant(s)",
    aircraftId,
  );
}

export function assertApplicabilityCapabilitiesRegistered(
  payload: unknown,
  registeredCapabilityTags: readonly string[],
  aircraftId?: string,
): void {
  assertApplicabilityValuesRegistered(
    collectEmbeddedCapabilityTags(payload),
    registeredCapabilityTags,
    "capability tag(s)",
    aircraftId,
  );
}

export function assertApplicabilityModificationsRegistered(
  payload: unknown,
  registeredModificationKeys: readonly string[],
  aircraftId?: string,
): void {
  assertApplicabilityValuesRegistered(
    collectEmbeddedModificationKeys(payload),
    registeredModificationKeys,
    "modification(s)",
    aircraftId,
  );
}

export function assertApplicabilityConfigurationEquipmentRegistered(
  payload: unknown,
  registeredEquipmentKeys: readonly string[],
  aircraftId?: string,
): void {
  assertApplicabilityValuesRegistered(
    collectEmbeddedConfigurationEquipmentKeys(payload),
    registeredEquipmentKeys,
    "configuration equipment identifier(s)",
    aircraftId,
  );
}
