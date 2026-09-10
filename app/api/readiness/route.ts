import { getTrainingContentRepository } from "@/lib/content-store";
import { sql } from "@/lib/db";
import { inspectReleaseConfiguration } from "@/lib/release-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectReleaseConfiguration(process.env);
  let database = false;
  let progressPersistence = false;
  let controlledManualPersistence = false;
  let identityReplayProtection = false;
  let publishedAircraft = false;

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
        await sql`SELECT 1 FROM training_identity_assertions LIMIT 0`;
        identityReplayProtection = true;
      } catch {
        identityReplayProtection = false;
      }

      try {
        const aircraft = await getTrainingContentRepository().listAircraft();
        publishedAircraft = aircraft.length > 0;
      } catch {
        publishedAircraft = false;
      }
    } catch {
      database = false;
    }
  }

  const ready = configuration.ready && database && progressPersistence && controlledManualPersistence && identityReplayProtection && publishedAircraft;
  return Response.json({
    status: ready ? "ready" : "not-ready",
    checks: {
      configuration: configuration.ready,
      database,
      progressPersistence,
      controlledManualPersistence,
      identityReplayProtection,
      publishedAircraft,
    },
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
