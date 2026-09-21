import { NextResponse } from "next/server";

import { isNewShellEnabled } from "@/lib/feature-flags";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { ActiveFlightNotFoundError, archiveActiveFlight } from "@/lib/active-flight/store";
import { getTrainingSession } from "@/lib/training-session";

const noStore = { "cache-control": "private, no-store" };

export async function POST(request: Request) {
  if (!isNewShellEnabled()) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404, headers: noStore });
  }
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: "untrusted_origin" }, { status: 403, headers: noStore });
  }
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noStore });
  }
  const row = body && typeof body === "object" && !Array.isArray(body)
    ? body as { aircraftId?: unknown; id?: unknown }
    : null;
  const aircraftId = typeof row?.aircraftId === "string" ? row.aircraftId.trim() : "";
  const id = typeof row?.id === "string" ? row.id.trim() : "";
  if (
    !aircraftId
    || !id
    || aircraftId.length > 128
    || id.length > 128
    || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(aircraftId)
  ) {
    return NextResponse.json({ error: "invalid_flight" }, { status: 400, headers: noStore });
  }

  try {
    const flight = await archiveActiveFlight(session.subject, aircraftId, id);
    return NextResponse.json({ flight }, { headers: noStore });
  } catch (error) {
    if (error instanceof ActiveFlightNotFoundError) {
      return NextResponse.json({ error: "previous_flight_not_found" }, { status: 404, headers: noStore });
    }
    throw error;
  }
}
