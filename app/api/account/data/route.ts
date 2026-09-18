import { NextResponse } from "next/server";

import { isTrustedMutationRequest } from "@/lib/request-security";
import { getTrainingSession } from "@/lib/training-session";
import { deleteTrainingProgress } from "@/lib/training-privacy";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "untrusted_origin" }, { status: 403, headers: { "cache-control": "private, no-store" } });
  const session = await getTrainingSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "cache-control": "private, no-store" } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: { "cache-control": "private, no-store" } }); }
  const record = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string,unknown> : {};
  if (record.confirm !== "DELETE TRAINING DATA") return NextResponse.json({ error: "confirmation_required" }, { status: 400, headers: { "cache-control": "private, no-store" } });
  const result = await deleteTrainingProgress(session.subject);
  return NextResponse.json({ deleted: true, resetAt: result.resetAt }, { headers: { "cache-control": "private, no-store" } });
}
