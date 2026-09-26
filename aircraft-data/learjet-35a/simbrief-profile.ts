import type { SimBriefAircraftProfile } from "../../lib/simbrief/types.ts";

/**
 * ICAO Doc 8643 and SimBrief both use LJ35 for Learjet 35/36 family aircraft.
 * Keep this compatibility aircraft-owned; the generic SimBrief runtime must
 * not infer compatibility from a display name or aircraft id.
 */
export const learjet35aSimBriefProfile = {
  aircraftId: "learjet-35a",
  acceptedIcaoCodes: ["LJ35"],
} as const satisfies SimBriefAircraftProfile;
