import { getTrainingSession } from "@/lib/training-session";
import { issueManualAssetUpload } from "@/lib/manual-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getTrainingSession();
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const body = await request.json() as {aircraftId?:unknown;originalName?:unknown;sizeBytes?:unknown;checksumSha256?:unknown};
    const result = await issueManualAssetUpload({
      aircraftId: String(body.aircraftId ?? ""),
      originalName: String(body.originalName ?? ""),
      sizeBytes: Number(body.sizeBytes),
      checksumSha256: String(body.checksumSha256 ?? ""),
    }, session.subject);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to authorize manual upload." }, { status: 400 });
  }
}
