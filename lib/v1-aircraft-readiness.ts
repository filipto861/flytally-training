import type { AircraftContentCapabilities } from "./content-repository.ts";

export const v1RequiredAircraftCapabilities = [
  "quickStart",
  "systems",
  "normalFlight",
  "cockpitOrientation",
  "abnormalEmergency",
  "quickReference",
  "knowledge",
  "manual",
] as const satisfies readonly (keyof AircraftContentCapabilities)[];

export function hasCompleteV1AircraftCapabilities(capabilities: AircraftContentCapabilities): boolean {
  return v1RequiredAircraftCapabilities.every((key) => capabilities[key]);
}
