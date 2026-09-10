export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "flytally-training" }, {
    headers: { "cache-control": "no-store" },
  });
}
