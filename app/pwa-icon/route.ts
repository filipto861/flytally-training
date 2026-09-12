const FLYTALLY_ICON = "https://fly-tally.com/logbook_icon.png";

export const revalidate = 86_400;

export async function GET() {
  const upstream = await fetch(FLYTALLY_ICON, { next: { revalidate } });
  if (!upstream.ok) {
    return new Response(null, { status: 502 });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
    },
  });
}
