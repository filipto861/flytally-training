export const sourceAuthorityRoles = [
  "CONTROLLING",
  "OPERATING_REFERENCE",
  "TRAINING_REFERENCE",
  "SIMULATOR_IMPLEMENTATION",
  "SIMULATOR_WORKFLOW",
  "UNCLASSIFIED",
] as const;

export type SourceAuthorityRole = typeof sourceAuthorityRoles[number];

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
