export const FLYTALLY_ENTITLEMENT_VERSION = 1 as const;

export type FlyTallyEntitlementSource =
  | "private-beta"
  | "admin"
  | "billing"
  | "organization"
  | "manual"
  | "legacy-beta";

export type FlyTallyEntitlementGrant = Readonly<{
  key: string;
  source: FlyTallyEntitlementSource;
  validUntil: number | null;
}>;

const SOURCES = new Set<FlyTallyEntitlementSource>([
  "private-beta",
  "admin",
  "billing",
  "organization",
  "manual",
  "legacy-beta",
]);

const KEY_PATTERN = /^[a-z0-9][a-z0-9.-]{2,79}$/;

export function parseEntitlementGrants(value: unknown): readonly FlyTallyEntitlementGrant[] | null {
  if (!Array.isArray(value) || value.length > 64) return null;

  const seen = new Set<string>();
  const grants: FlyTallyEntitlementGrant[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const candidate = item as Partial<FlyTallyEntitlementGrant>;
    if (typeof candidate.key !== "string" || !KEY_PATTERN.test(candidate.key)) return null;
    if (typeof candidate.source !== "string" || !SOURCES.has(candidate.source as FlyTallyEntitlementSource)) return null;
    if (candidate.validUntil !== null && (!Number.isInteger(candidate.validUntil) || Number(candidate.validUntil) <= 0)) return null;
    if (seen.has(candidate.key)) return null;
    seen.add(candidate.key);
    grants.push({
      key: candidate.key,
      source: candidate.source as FlyTallyEntitlementSource,
      validUntil: candidate.validUntil === null ? null : Number(candidate.validUntil),
    });
  }

  return grants;
}

export function legacyBetaEntitlements(): readonly FlyTallyEntitlementGrant[] {
  return [{ key: "training.access", source: "legacy-beta", validUntil: null }];
}

export function hasActiveEntitlement(
  grants: readonly FlyTallyEntitlementGrant[],
  key: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return grants.some((grant) => grant.key === key && (grant.validUntil === null || grant.validUntil > nowSeconds));
}
