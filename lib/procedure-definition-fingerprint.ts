import { createHash } from "node:crypto";

import type { AircraftGraphProcedure } from "./universal-aircraft-content.ts";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort((left, right) => left.localeCompare(right))
        .filter((key) => record[key] !== undefined)
        .map((key) => [key, canonicalize(record[key])]),
    );
  }

  return value;
}

export function fingerprintGraphProcedure(
  procedure: AircraftGraphProcedure,
): string {
  const canonical = JSON.stringify(canonicalize(procedure));
  const digest = createHash("sha256")
    .update(canonical, "utf8")
    .digest("hex");
  return `procedure:v1:${digest}`;
}
