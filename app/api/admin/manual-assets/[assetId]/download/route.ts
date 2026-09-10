import { getTrainingSession } from "@/lib/training-session";
import { issueManualAssetDownload } from "@/lib/manual-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{assetId:string}> }) {
  const session = await getTrainingSession();
  if (!session) return new Response("Authentication required.", { status: 401 });
  if (session.role !== "admin") return new Response("Administrator access is required.", { status: 403 });
  try {
    const { assetId } = await context.params;
    const url = await issueManualAssetDownload(assetId);
    return Response.redirect(url, 307);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Manual asset unavailable.", { status: 404 });
  }
}
