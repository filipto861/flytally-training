import { getTrainingSession } from "@/lib/training-session";
import { finalizeManualAsset } from "@/lib/manual-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getTrainingSession();
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const body = await request.json() as {assetId?:unknown};
    const asset = await finalizeManualAsset(String(body.assetId ?? ""), session.subject);
    return Response.json({ assetId: asset.id, status: asset.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to verify manual asset." }, { status: 400 });
  }
}
