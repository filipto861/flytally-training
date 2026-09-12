type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Collect every explicit applicability.variant key carried by a governed
 * payload. The traversal is deliberately domain-agnostic so new module types
 * inherit the same release boundary automatically.
 */
export function collectEmbeddedVariantKeys(payload: unknown): readonly string[] {
  const variantKeys = new Set<string>();

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;

    const applicability = value.applicability;
    if (isRecord(applicability) && Array.isArray(applicability.variants)) {
      applicability.variants.forEach((variant) => {
        if (typeof variant === "string" && variant.trim()) variantKeys.add(variant.trim());
      });
    }

    Object.values(value).forEach(visit);
  }

  visit(payload);
  return [...variantKeys];
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
