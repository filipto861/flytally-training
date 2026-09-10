import { getTrainingSession } from "@/lib/training-session";
import { finalizeManualAsset } from "@/lib/manual-assets";
import { privateCapabilityJson } from "@/lib/private-capability-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getTrainingSession();
  if (!session) return privateCapabilityJson({ error: "Authentication required." }, 401);
  if (session.role !== "admin") return privateCapabilityJson({ error: "Administrator access is required." }, 403);
  try {
    const body = await request.json() as {assetId?:unknown};
    const asset = await finalizeManualAsset(String(body.assetId ?? ""), session.subject);
    return privateCapabilityJson({ assetId: asset.id, status: asset.status });
  } catch (error) {
    return privateCapabilityJson({ error: error instanceof Error ? error.message : "Unable to verify manual asset." }, 400);
  }
}
