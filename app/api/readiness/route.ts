import { hasFreshCurrentPublishedContent } from "@/lib/content-freshness";
import { hasCompletePublishedControlledManualCoverage } from "@/lib/controlled-manual-readiness";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { sql } from "@/lib/db";
import { inspectReleaseConfiguration } from "@/lib/release-readiness";
import { hasUsableAircraftTrainingContent } from "@/lib/v1-aircraft-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectReleaseConfiguration(process.env);
  let database = false;
  let progressPersistence = false;
  let controlledManualPersistence = false;
  let controlledManualCoverage = false;
  let currentContentFreshness = false;
  let releaseReadyAircraft = false;
  let aiDraftAuditPersistence = false;
  let identityReplayProtection = false;
  let publishedAircraft = false;
  let modularAircraftContent = false;

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

        // Operational learner readiness is deliberately independent from the
        // optional controlled-PDF release layer. Freshness can therefore be
        // evaluated even when no Blob credential or controlled PDF exists yet.
        for (const item of aircraft) {
          try {
            const bundle = await getAircraftContentBundle(repository, item.id);
            if (!bundle || !hasUsableAircraftTrainingContent(bundle.capabilities)) continue;
            modularAircraftContent = true;

            let freshContent = false;
            try {
              freshContent = await hasFreshCurrentPublishedContent(item.id);
            } catch {
              freshContent = false;
            }
            if (freshContent) currentContentFreshness = true;

            if (configuration.controlledManualStorageReady && controlledManualPersistence) {
              let controlledCoverage = false;
              try {
                controlledCoverage = await hasCompletePublishedControlledManualCoverage(item.id);
              } catch {
                controlledCoverage = false;
              }
              if (controlledCoverage) controlledManualCoverage = true;
              if (controlledCoverage && freshContent) releaseReadyAircraft = true;
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
    && currentContentFreshness
    && aiDraftAuditPersistence
    && identityReplayProtection
    && publishedAircraft
    && modularAircraftContent;

  const controlledDocumentRelease = configuration.controlledManualStorageReady
    && controlledManualPersistence
    && controlledManualCoverage
    && releaseReadyAircraft;

  return Response.json({
    status: ready ? "ready" : "not-ready",
    profiles: {
      operational: ready,
      controlledDocumentRelease,
    },
    checks: {
      configuration: configuration.ready,
      database,
      progressPersistence,
      currentContentFreshness,
      aiDraftAuditPersistence,
      identityReplayProtection,
      publishedAircraft,
      modularAircraftContent,
      controlledManualPersistence,
      controlledManualCredential: configuration.controlledManualStorageReady,
      controlledManualCoverage,
      releaseReadyAircraft,
    },
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
