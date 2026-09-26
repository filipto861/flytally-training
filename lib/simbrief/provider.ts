import {
  parseSimBriefLatestOfp,
  simBriefLatestOfpUrl,
} from "./ofp.ts";
import type { SimBriefIdentity, SimBriefLatestOfp } from "./types.ts";

export type SimBriefProviderResult =
  | { readonly status: "ready"; readonly ofp: SimBriefLatestOfp }
  | { readonly status: "not-found" }
  | { readonly status: "timeout" }
  | { readonly status: "unavailable" }
  | { readonly status: "invalid-response" };

export type SimBriefFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export async function fetchLatestSimBriefOfp(
  identity: SimBriefIdentity,
  fetchImpl: SimBriefFetch = fetch,
): Promise<SimBriefProviderResult> {
  let response: Response;
  try {
    response = await fetchImpl(simBriefLatestOfpUrl(identity), {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "FlyTally-Training/SimBrief-Import",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError")
      ? { status: "timeout" }
      : { status: "unavailable" };
  }

  if (response.status === 400) return { status: "not-found" };
  if (!response.ok) return { status: "unavailable" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: "invalid-response" };
  }

  const ofp = parseSimBriefLatestOfp(body);
  return ofp
    ? { status: "ready", ofp }
    : { status: "invalid-response" };
}
