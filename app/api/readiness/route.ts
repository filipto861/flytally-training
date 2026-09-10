import { getTrainingContentRepository } from "@/lib/content-store";
import { sql } from "@/lib/db";
import { inspectReleaseConfiguration } from "@/lib/release-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectReleaseConfiguration(process.env);
  let database = false;
  let publishedAircraft = false;

  if (configuration.ready) {
    try {
      await sql`SELECT 1`;
      database = true;
      const aircraft = await getTrainingContentRepository().listAircraft();
      publishedAircraft = aircraft.length > 0;
    } catch {
      database = false;
    }
  }

  const ready = configuration.ready && database && publishedAircraft;
  return Response.json({
    status: ready ? "ready" : "not-ready",
    checks: {
      configuration: configuration.ready,
      database,
      publishedAircraft,
    },
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
