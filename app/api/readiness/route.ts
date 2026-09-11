import { hasFreshCurrentPublishedContent } from "@/lib/content-freshness";
import { getAircraftContentBundle } from "@/lib/content-repository";
import { getTrainingContentRepository } from "@/lib/content-store";
import { sql } from "@/lib/db";
import { inspectReleaseConfiguration } from "@/lib/release-readiness";
import { hasCompletePublishedSourceProvenance } from "@/lib/source-provenance-readiness";
import { hasUsableAircraftTrainingContent } from "@/lib/v1-aircraft-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectReleaseConfiguration(process.env);
  let database = false;
  let progressPersistence = false;
  let sourceProvenanceCoverage = false;
  let currentContentFreshness = false;
  let sourceGovernedRelease = false;
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

            let provenance = false;
            try {
              provenance = await hasCompletePublishedSourceProvenance(item.id);
            } catch {
              provenance = false;
            }
            if (provenance) sourceProvenanceCoverage = true;
            if (provenance && freshContent) sourceGovernedRelease = true;
          } catch {
            // Preserve granular readiness results if one aircraft cannot hydrate.
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

  return Response.json({
    status: ready ? "ready" : "not-ready",
    profiles: {
      operational: ready,
      sourceGovernedRelease: ready && sourceGovernedRelease,
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
      sourceProvenanceCoverage,
      sourceGovernedRelease,
    },
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
