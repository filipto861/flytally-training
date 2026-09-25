import { learjet35aSimBriefProfile } from "../aircraft-data/learjet-35a/simbrief-profile.ts";

import {
  browserTrainingAircraftId,
  browserTrainingFixtureEnabled,
} from "./browser-training-fixture.ts";
import type { SimBriefAircraftProfile } from "./simbrief/types.ts";

const profiles: readonly SimBriefAircraftProfile[] = [
  learjet35aSimBriefProfile,
];

const byAircraftId = new Map(
  profiles.map((profile) => [profile.aircraftId, profile] as const),
);

const browserProfile: SimBriefAircraftProfile = {
  aircraftId: browserTrainingAircraftId,
  acceptedIcaoCodes: ["TEST"],
};

export function getBundledSimBriefProfile(
  aircraftId: string,
): SimBriefAircraftProfile | undefined {
  if (
    aircraftId === browserTrainingAircraftId
    && browserTrainingFixtureEnabled()
  ) {
    return browserProfile;
  }
  return byAircraftId.get(aircraftId);
}
