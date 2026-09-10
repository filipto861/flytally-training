export const privateCapabilityHeaders = {
  "cache-control": "no-store, max-age=0",
  pragma: "no-cache",
  expires: "0",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
} as const;

/**
 * Responses that contain or redirect to short-lived private capability URLs
 * must never be reused by an intermediary/browser cache or leaked as a
 * referrer to the capability target.
 */
export function privateCapabilityJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: privateCapabilityHeaders });
}

export function privateCapabilityRedirect(location: string, status = 307): Response {
  return new Response(null, {
    status,
    headers: {
      ...privateCapabilityHeaders,
      location,
    },
  });
}

export function privateCapabilityText(body: string, status: number): Response {
  return new Response(body, { status, headers: privateCapabilityHeaders });
}
