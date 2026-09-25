"use client";

import { parseNormalizedSimBriefOfp } from "./ofp";
import type { SimBriefIdentity, SimBriefLatestOfp } from "./types";

export class SimBriefClientError extends Error {
  readonly code: string;
  readonly actualIcaoCode?: string;
  readonly acceptedIcaoCodes?: readonly string[];

  constructor(
    code: string,
    detail?: {
      readonly actualIcaoCode?: string;
      readonly acceptedIcaoCodes?: readonly string[];
    },
  ) {
    super(code);
    this.name = "SimBriefClientError";
    this.code = code;
    this.actualIcaoCode = detail?.actualIcaoCode;
    this.acceptedIcaoCodes = detail?.acceptedIcaoCodes;
  }
}

export async function importLatestSimBriefOfp(
  aircraftId: string,
  identity: SimBriefIdentity,
): Promise<SimBriefLatestOfp> {
  const response = await fetch("/api/simbrief/latest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ aircraftId, identity }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SimBriefClientError("invalid_response");
  }

  const row =
    body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;

  if (!response.ok) {
    throw new SimBriefClientError(
      typeof row?.error === "string" ? row.error : "import_failed",
      {
        actualIcaoCode:
          typeof row?.actualIcaoCode === "string"
            ? row.actualIcaoCode
            : undefined,
        acceptedIcaoCodes: Array.isArray(row?.acceptedIcaoCodes)
          ? row.acceptedIcaoCodes.filter(
              (value): value is string => typeof value === "string",
            )
          : undefined,
      },
    );
  }

  const ofp = parseNormalizedSimBriefOfp(row?.ofp);
  if (!ofp) throw new SimBriefClientError("invalid_response");
  return ofp;
}
