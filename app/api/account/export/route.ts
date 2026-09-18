import { getTrainingSession } from "@/lib/training-session";
import { exportTrainingData } from "@/lib/training-privacy";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getTrainingSession();
  if (!session) return new Response("Unauthorized", { status: 401, headers: { "cache-control": "private, no-store" } });
  const data = await exportTrainingData(session.subject);
  const exportedAt = new Date().toISOString();
  const payload = { format: "flytally-training-export", version: 1, exportedAt, accountSubject: session.subject, ...data };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=flytally-training-${exportedAt.slice(0,10)}.json`,
      "cache-control": "private, no-store",
    },
  });
}
