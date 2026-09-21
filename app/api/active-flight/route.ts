import { NextResponse } from "next/server";

import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  ActiveFlightConflictError,
  ActiveFlightNotFoundError,
  createActiveFlight,
  deleteActiveFlight,
  getActiveFlight,
  updateActiveFlight,
} from "@/lib/active-flight/store";
import { parseActiveFlightInput, parseActiveFlightPatch } from "@/lib/active-flight/validation";
import { getTrainingSession } from "@/lib/training-session";

const noStore = { "cache-control": "private, no-store" };

function featureDisabled() {
  return NextResponse.json({ error: "feature_disabled" }, { status: 404, headers: noStore });
}

function cleanAircraftId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id && id.length <= 128 && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id) ? id : null;
}

function cleanFlightId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id && id.length <= 128 ? id : null;
}

async function validAircraft(aircraftId: string): Promise<boolean> {
  return Boolean(await getTrainingContentRepository().getAircraft(aircraftId));
}

export async function GET(request: Request) {
  if (!isNewShellEnabled()) return featureDisabled();
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const aircraftId = cleanAircraftId(new URL(request.url).searchParams.get("aircraftId"));
  if (!aircraftId || !(await validAircraft(aircraftId))) {
    return NextResponse.json({ error: "invalid_aircraft" }, { status: 400, headers: noStore });
  }
  const flight = await getActiveFlight(session.subject, aircraftId);
  return NextResponse.json({ flight }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!isNewShellEnabled()) return featureDisabled();
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: "untrusted_origin" }, { status: 403, headers: noStore });
  }
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noStore });
  }
  const input = parseActiveFlightInput(body);
  if (!input || !(await validAircraft(input.aircraftId))) {
    return NextResponse.json({ error: "invalid_flight" }, { status: 400, headers: noStore });
  }

  try {
    const flight = await createActiveFlight(session.subject, input);
    return NextResponse.json({ flight }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof ActiveFlightConflictError) {
      return NextResponse.json({ error: "active_flight_exists" }, { status: 409, headers: noStore });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  if (!isNewShellEnabled()) return featureDisabled();
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
    ? body as { aircraftId?: unknown; patch?: unknown }
    : null;
  const aircraftId = cleanAircraftId(row?.aircraftId);
  const patch = parseActiveFlightPatch(row?.patch);
  if (!aircraftId || !patch || !(await validAircraft(aircraftId))) {
    return NextResponse.json({ error: "invalid_flight" }, { status: 400, headers: noStore });
  }

  try {
    const flight = await updateActiveFlight(session.subject, aircraftId, patch);
    return NextResponse.json({ flight }, { headers: noStore });
  } catch (error) {
    if (error instanceof ActiveFlightNotFoundError) {
      return NextResponse.json({ error: "active_flight_not_found" }, { status: 404, headers: noStore });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  if (!isNewShellEnabled()) return featureDisabled();
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
  const aircraftId = cleanAircraftId(row?.aircraftId);
  const id = cleanFlightId(row?.id);
  if (!aircraftId || !id) {
    return NextResponse.json({ error: "invalid_flight" }, { status: 400, headers: noStore });
  }
  const deleted = await deleteActiveFlight(session.subject, aircraftId, id);
  return NextResponse.json({ deleted }, { status: deleted ? 200 : 404, headers: noStore });
}
