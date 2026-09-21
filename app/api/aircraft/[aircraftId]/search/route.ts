import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import {
  isValidAircraftSearchId,
  searchAircraft,
} from "@/lib/search/aircraft-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "cache-control": "private, no-store",
};

function parseLimit(value: string | null): number {
  if (!value) return 20;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(50, parsed));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ aircraftId: string }> },
): Promise<Response> {
  if (!isNewShellEnabled()) {
    return Response.json(
      { error: "feature_disabled" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const { aircraftId } = await params;
  if (!isValidAircraftSearchId(aircraftId)) {
    return Response.json(
      { error: "invalid_aircraft" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return Response.json(
      { results: [] },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const repository = getTrainingContentRepository();
  const aircraft = await repository.getAircraft(aircraftId);
  if (!aircraft) {
    return Response.json(
      { error: "aircraft_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const results = await searchAircraft(
    repository,
    aircraftId,
    query,
    parseLimit(url.searchParams.get("limit")),
  );

  return Response.json({ results }, { headers: NO_STORE_HEADERS });
}
