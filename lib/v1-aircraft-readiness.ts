import type { AircraftContentCapabilities } from "./content-repository.ts";

/**
 * M9 removes the old assumption that every aircraft must implement one fixed
 * product curriculum. An aircraft can be useful with any combination of
 * published training modules; absent systems or equipment simply have no
 * module. Controlled-source coverage is verified separately by release
 * readiness and is not a learner capability.
 */
export const v1RequiredAircraftCapabilities = [] as const;

export const releaseEligibleTrainingCapabilities = [
  "checklists",
  "procedures",
  "performance",
  "weightBalance",
  "limitations",
  "systems",
  "abnormalEmergency",
  "flows",
  "avionics",
  "knowledge",
] as const satisfies readonly (keyof AircraftContentCapabilities)[];

export function hasUsableAircraftTrainingContent(capabilities: AircraftContentCapabilities): boolean {
  return releaseEligibleTrainingCapabilities.some((key) => capabilities[key]);
}

/** @deprecated Use hasUsableAircraftTrainingContent. Kept during the M9 migration. */
export function hasCompleteV1AircraftCapabilities(capabilities: AircraftContentCapabilities): boolean {
  return hasUsableAircraftTrainingContent(capabilities);
}
