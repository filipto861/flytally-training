import { getTrainingSession } from "@/lib/training-session";
import { issueManualAssetUpload } from "@/lib/manual-assets";
import { privateCapabilityJson } from "@/lib/private-capability-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getTrainingSession();
  if (!session) return privateCapabilityJson({ error: "Authentication required." }, 401);
  if (session.role !== "admin") return privateCapabilityJson({ error: "Administrator access is required." }, 403);
  try {
    const body = await request.json() as {aircraftId?:unknown;originalName?:unknown;sizeBytes?:unknown;checksumSha256?:unknown};
    const result = await issueManualAssetUpload({
      aircraftId: String(body.aircraftId ?? ""),
      originalName: String(body.originalName ?? ""),
      sizeBytes: Number(body.sizeBytes),
      checksumSha256: String(body.checksumSha256 ?? ""),
    }, session.subject);
    return privateCapabilityJson(result);
  } catch (error) {
    return privateCapabilityJson({ error: error instanceof Error ? error.message : "Unable to authorize manual upload." }, 400);
  }
}
