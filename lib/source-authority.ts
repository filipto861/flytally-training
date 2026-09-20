export const sourceAuthorityRoles = [
  "CONTROLLING",
  "OPERATING_REFERENCE",
  "TRAINING_REFERENCE",
  "SIMULATOR_IMPLEMENTATION",
  "SIMULATOR_WORKFLOW",
  "UNCLASSIFIED",
] as const;

export type SourceAuthorityRole = typeof sourceAuthorityRoles[number];

export const operationalSourceAuthorityRoles = ["CONTROLLING", "OPERATING_REFERENCE"] as const;
export const operationalSafetyDomains = [
  "checklists",
  "procedures",
  "performance",
  "weight-balance",
  "limitations",
  "abnormal",
] as const;

export type OperationalSourceAuthorityRole = typeof operationalSourceAuthorityRoles[number];

export const contentSourcePolicies = ["faa-approved", "available-sources"] as const;
export type ContentSourcePolicy = typeof contentSourcePolicies[number];

export function resolveContentSourcePolicy(value: unknown): ContentSourcePolicy {
  return value === "available-sources" ? "available-sources" : "faa-approved";
}

export function sourcePolicyAllowsAuthority(
  policy: ContentSourcePolicy,
  role: string,
): boolean {
  if (policy === "available-sources") {
    return isOperationalSourceAuthority(role)
      || role === "TRAINING_REFERENCE"
      || role === "SIMULATOR_WORKFLOW";
  }
  return isOperationalSourceAuthority(role);
}

export function isOperationalSourceAuthority(role: string): role is OperationalSourceAuthorityRole {
  return (operationalSourceAuthorityRoles as readonly string[]).includes(role);
}

export function requiresOperationalSourceAuthority(domain: string): boolean {
  return (operationalSafetyDomains as readonly string[]).includes(domain);
}

export function parseSourceAuthorityRole(value: string): SourceAuthorityRole {
  if (!(sourceAuthorityRoles as readonly string[]).includes(value)) throw new Error("Unsupported source authority role.");
  return value as SourceAuthorityRole;
}

export function sourceAuthorityLabel(role: SourceAuthorityRole): string {
  if (role === "CONTROLLING") return "Controlling aircraft source";
  if (role === "OPERATING_REFERENCE") return "Operating reference";
  if (role === "TRAINING_REFERENCE") return "Training reference";
  if (role === "SIMULATOR_IMPLEMENTATION") return "Simulator implementation";
  if (role === "SIMULATOR_WORKFLOW") return "Simulator workflow guide";
  return "Unclassified source";
}

export function isSimulatorOnlyAuthority(role: SourceAuthorityRole): boolean {
  return role === "SIMULATOR_IMPLEMENTATION" || role === "SIMULATOR_WORKFLOW";
}
