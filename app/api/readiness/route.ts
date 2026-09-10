import { hasFreshCurrentPublishedContent } from "@/lib/content-freshness";
import { hasCompletePublishedControlledManualCoverage } from "@/lib/controlled-manual-readiness";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { sql } from "@/lib/db";
import { inspectReleaseConfiguration } from "@/lib/release-readiness";
import { hasCompleteV1AircraftCapabilities } from "@/lib/v1-aircraft-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectReleaseConfiguration(process.env);
  let database = false;
  let progressPersistence = false;
  let controlledManualPersistence = false;
  let controlledManualStorage = false;
  let currentContentFreshness = false;
  let releaseReadyAircraft = false;
  let aiDraftAuditPersistence = false;
  let identityReplayProtection = false;
  let publishedAircraft = false;
  let completeV1Aircraft = false;

  if (configuration.ready) {
    try {
      await sql`SELECT 1`;
      database = true;

      try {
        await Promise.all([
          sql`SELECT 1 FROM training_progress_events LIMIT 0`,
          sql`SELECT 1 FROM training_aircraft_state LIMIT 0`,
        ]);
        progressPersistence = true;
      } catch {
        progressPersistence = false;
      }

      try {
        await sql`SELECT 1 FROM training_manual_assets LIMIT 0`;
        controlledManualPersistence = true;
      } catch {
        controlledManualPersistence = false;
      }

      try {
        await sql`SELECT 1 FROM training_ai_draft_runs LIMIT 0`;
        aiDraftAuditPersistence = true;
      } catch {
        aiDraftAuditPersistence = false;
      }

      try {
        await sql`SELECT 1 FROM training_identity_assertions LIMIT 0`;
        identityReplayProtection = true;
      } catch {
        identityReplayProtection = false;
      }

      try {
        const repository = getTrainingContentRepository();
        const aircraft = await repository.listAircraft();
        publishedAircraft = aircraft.length > 0;

        // One and the same aircraft must satisfy functional completeness,
        // complete live controlled-source coverage and current-content review.
        // Separate aircraft may not combine partial readiness checks into a
        // false-positive release result.
        for (const item of aircraft) {
          try {
            const bundle = await getAircraftContentBundle(repository, item.id);
            if (!bundle || !hasCompleteV1AircraftCapabilities(bundle.capabilities)) continue;
            completeV1Aircraft = true;

            const [controlledCoverage, freshContent] = await Promise.all([
              hasCompletePublishedControlledManualCoverage(item.id),
              hasFreshCurrentPublishedContent(item.id),
            ]);
            if (controlledCoverage) controlledManualStorage = true;
            if (freshContent) currentContentFreshness = true;
            if (controlledCoverage && freshContent) {
              releaseReadyAircraft = true;
              break;
            }
          } catch {
            // Keep the specific readiness checks false while preserving the fact
            // that the published-aircraft catalog itself was readable.
          }
        }
      } catch {
        publishedAircraft = false;
      }
    } catch {
      database = false;
    }
  }

  const ready = configuration.ready
    && database
    && progressPersistence
    && controlledManualPersistence
    && controlledManualStorage
    && currentContentFreshness
    && releaseReadyAircraft
    && aiDraftAuditPersistence
    && identityReplayProtection
    && publishedAircraft
    && completeV1Aircraft;

  return Response.json({
    status: ready ? "ready" : "not-ready",
    checks: {
      configuration: configuration.ready,
      database,
      progressPersistence,
      controlledManualPersistence,
      controlledManualStorage,
      currentContentFreshness,
      releaseReadyAircraft,
      aiDraftAuditPersistence,
      identityReplayProtection,
      publishedAircraft,
      completeV1Aircraft,
    },
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
