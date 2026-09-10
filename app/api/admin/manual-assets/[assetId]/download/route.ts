import { getTrainingSession } from "@/lib/training-session";
import { issueManualAssetDownload } from "@/lib/manual-assets";
import { privateCapabilityRedirect, privateCapabilityText } from "@/lib/private-capability-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{assetId:string}> }) {
  const session = await getTrainingSession();
  if (!session) return privateCapabilityText("Authentication required.", 401);
  if (session.role !== "admin") return privateCapabilityText("Administrator access is required.", 403);
  try {
    const { assetId } = await context.params;
    const url = await issueManualAssetDownload(assetId);
    return privateCapabilityRedirect(url);
  } catch (error) {
    return privateCapabilityText(error instanceof Error ? error.message : "Manual asset unavailable.", 404);
  }
}
