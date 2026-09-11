import "server-only";

import {
  bootstrapStaticContentGoverned,
  listStaticNativeUpgradeDomains,
  publishStaticNativeModuleUpgrade,
} from "./governed-static-bootstrap";
import type { TrainingContentDomain } from "./content-admin-types";

export type StaticAircraftReleaseResult = {
  readonly published: readonly { domain: TrainingContentDomain; versionId: string }[];
  readonly unchanged: readonly TrainingContentDomain[];
};

/**
 * Publish one explicitly reviewed static aircraft release through the existing
 * governed lifecycle. Missing modules are first imported by the governed
 * bootstrap; already-published modules are upgraded only when their reviewed
 * payload actually changed. Every approval remains attributable to the
 * authenticated administrator subject supplied by the server action.
 */
export async function publishReviewedStaticAircraftRelease(
  aircraftId: string,
  subject: string,
): Promise<StaticAircraftReleaseResult> {
  const domains = listStaticNativeUpgradeDomains(aircraftId);
  if (!domains.length) throw new Error(`No reviewed native release is registered for ${aircraftId}.`);

  await bootstrapStaticContentGoverned(subject);

  const published: Array<{ domain: TrainingContentDomain; versionId: string }> = [];
  const unchanged: TrainingContentDomain[] = [];

  for (const domain of domains) {
    try {
      const versionId = await publishStaticNativeModuleUpgrade(aircraftId, domain, subject);
      published.push({ domain, versionId });
    } catch (error) {
      if (error instanceof Error && error.message.includes("already matches the reviewed native seed")) {
        unchanged.push(domain);
        continue;
      }
      throw error;
    }
  }

  return { published, unchanged };
}
