import { NextResponse } from "next/server";

import { getBundledSimBriefProfile } from "@/lib/bundled-simbrief-content";
import { getTrainingContentRepository } from "@/lib/content-store";
import { isNewShellEnabled } from "@/lib/feature-flags";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  parseSimBriefIdentity,
  simBriefAircraftCompatible,
} from "@/lib/simbrief/ofp";
import { fetchLatestSimBriefOfp } from "@/lib/simbrief/provider";
import { getTrainingSession } from "@/lib/training-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

function response(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { error, ...(extra ?? {}) },
    { status, headers: noStore },
  );
}

function cleanAircraftId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id
    && id.length <= 128
    && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id)
    ? id
    : null;
}

export async function POST(request: Request) {
  if (!isNewShellEnabled()) return response("feature_disabled", 404);
  if (!isTrustedMutationRequest(request)) return response("untrusted_origin", 403);
  if (!(await getTrainingSession())) return response("unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response("invalid_json", 400);
  }

  const row =
    body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  const aircraftId = cleanAircraftId(row?.aircraftId);
  const identity = parseSimBriefIdentity(row?.identity);
  if (!aircraftId || !identity) return response("invalid_request", 400);

  const [aircraft, profile] = await Promise.all([
    getTrainingContentRepository().getAircraft(aircraftId),
    Promise.resolve(getBundledSimBriefProfile(aircraftId)),
  ]);
  if (!aircraft) return response("invalid_aircraft", 400);
  if (!profile) return response("simbrief_not_configured", 400);

  const provider = await fetchLatestSimBriefOfp(identity);
  if (provider.status === "not-found") {
    return response("simbrief_no_flight", 404);
  }
  if (provider.status === "timeout") {
    return response("simbrief_timeout", 504);
  }
  if (provider.status === "unavailable") {
    return response("simbrief_unavailable", 502);
  }
  if (provider.status === "invalid-response") {
    return response("simbrief_invalid_response", 502);
  }

  const ofp = provider.ofp;
  if (!simBriefAircraftCompatible(profile, ofp.aircraftIcaoCode)) {
    return response("aircraft_mismatch", 409, {
      actualIcaoCode: ofp.aircraftIcaoCode,
      acceptedIcaoCodes: profile.acceptedIcaoCodes,
    });
  }

  return NextResponse.json(
    {
      ofp,
      aircraft: {
        id: aircraft.id,
        displayName: aircraft.displayName,
      },
    },
    { headers: noStore },
  );
}
