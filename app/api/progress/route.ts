import { NextResponse } from "next/server";

import { getTrainingProgressRepository } from "@/lib/progress-repository";
import { isServerAcceptableProgressEvent } from "@/lib/progress-events";
import { getTrainingSession } from "@/lib/training-session";

function cleanAircraftId(value: string | null): string | null {
  const id = value?.trim();
  return id && id.length <= 128 ? id : null;
}

export async function GET(request: Request) {
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const aircraftId = cleanAircraftId(new URL(request.url).searchParams.get("aircraftId"));
  if (!aircraftId) return NextResponse.json({ error: "invalid_aircraft" }, { status: 400 });
  const repository = getTrainingProgressRepository();
  const [events, state] = await Promise.all([
    repository.listEvents(session.subject, aircraftId),
    repository.getAircraftState(session.subject, aircraftId),
  ]);
  return NextResponse.json({ events, state }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const events = body && typeof body === "object" && !Array.isArray(body) ? (body as {events?:unknown}).events : undefined;
  const nowMs = Date.now();
  if (!Array.isArray(events) || events.length < 1 || events.length > 250 || !events.every(event => isServerAcceptableProgressEvent(event, nowMs))) {
    return NextResponse.json({ error: "invalid_events" }, { status: 400 });
  }
  await getTrainingProgressRepository().appendEvents(session.subject, events);
  return NextResponse.json({ accepted: events.length });
}
