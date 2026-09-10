import { NextResponse } from "next/server";
import { getTrainingSession } from "@/lib/training-session";

export async function GET() {
  const session = await getTrainingSession();
  return NextResponse.json(session ? { authenticated: true, role: session.role, exp: session.exp } : { authenticated: false }, { headers: { "cache-control": "private, no-store" } });
}
