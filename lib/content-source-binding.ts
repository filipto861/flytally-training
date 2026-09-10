type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Collect source manual identities already embedded in a universal content
 * payload. This intentionally knows nothing about aircraft types or domains;
 * any present/future module can carry the same `sources[].manualId` contract.
 */
export function collectEmbeddedManualIds(payload: unknown): readonly string[] {
  const manualIds = new Set<string>();

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;

    if (typeof value.manualId === "string" && value.manualId.trim()) {
      manualIds.add(value.manualId.trim());
    }
    Object.values(value).forEach(visit);
  }

  visit(payload);
  return [...manualIds];
}

/**
 * Native M9 modules bind only to the source revisions they actually cite.
 * Legacy bundles without embedded source identity retain the historical
 * aircraft-wide fallback until they are migrated.
 *
 * A native payload that names an unregistered source fails closed rather than
 * silently publishing with incomplete provenance.
 */
export function selectContentSourceReferenceIds(
  payload: unknown,
  referenceByManualId: ReadonlyMap<string, string>,
  legacyFallback: readonly string[],
): readonly string[] {
  const embeddedManualIds = collectEmbeddedManualIds(payload);
  if (embeddedManualIds.length === 0) return [...legacyFallback];

  return embeddedManualIds.map((manualId) => {
    const referenceId = referenceByManualId.get(manualId);
    if (!referenceId) throw new Error(`Content cites unregistered source manual ${manualId}.`);
    return referenceId;
  });
}
