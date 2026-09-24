import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveDeclaredDistanceProviderPayload,
} from "../lib/aviation/declared-distance-provider.ts";

test("DD.3 provider adapter preserves identity and provenance", () => {
  const resolved = resolveDeclaredDistanceProviderPayload(
    { airportIcao: "lkpr", runwayIdent: "24" },
    {
      providerId: "provider-a",
      revision: "2026-09",
      airportIcao: "LKPR",
      runwayIdent: "24",
      distancesFt: {
        tora: 12189,
        asda: 12450,
        toda: 13100,
        lda: 11800,
      },
    },
  );

  assert.equal(resolved.status, "ready");
  if (resolved.status !== "ready") return;

  assert.deepEqual(resolved.distances.tora, {
    valueFt: 12189,
    provenance: {
      kind: "provider",
      providerId: "provider-a",
      revision: "2026-09",
    },
  });
  assert.deepEqual(resolved.distances.asda, {
    valueFt: 12450,
    provenance: {
      kind: "provider",
      providerId: "provider-a",
      revision: "2026-09",
    },
  });
  assert.equal(resolved.distances.toda?.valueFt, 13100);
  assert.equal(resolved.distances.lda?.valueFt, 11800);
});

test("DD.3 provider payload for another airport or runway fails closed", () => {
  assert.deepEqual(
    resolveDeclaredDistanceProviderPayload(
      { airportIcao: "LKPR", runwayIdent: "24" },
      {
        providerId: "provider-a",
        airportIcao: "LOWW",
        runwayIdent: "24",
        distancesFt: { tora: 11000, asda: 11500 },
      },
    ),
    {
      status: "mismatch",
      reason: "airport-or-runway-identity",
    },
  );

  assert.deepEqual(
    resolveDeclaredDistanceProviderPayload(
      { airportIcao: "LKPR", runwayIdent: "24" },
      {
        providerId: "provider-a",
        airportIcao: "LKPR",
        runwayIdent: "06",
        distancesFt: { tora: 12000, asda: 12500 },
      },
    ),
    {
      status: "mismatch",
      reason: "airport-or-runway-identity",
    },
  );
});

test("DD.3 provider no-data remains unavailable without inventing runway values", () => {
  assert.deepEqual(
    resolveDeclaredDistanceProviderPayload(
      { airportIcao: "LKPR", runwayIdent: "24" },
      null,
    ),
    {
      status: "unavailable",
      reason: "no-data",
    },
  );
});

test("DD.3 partial provider data remains partial and does not synthesize ASDA", () => {
  const resolved = resolveDeclaredDistanceProviderPayload(
    { airportIcao: "LKPR", runwayIdent: "24" },
    {
      providerId: "provider-a",
      airportIcao: "LKPR",
      runwayIdent: "24",
      distancesFt: {
        tora: 12189,
        toda: 13000,
      },
    },
  );

  assert.equal(resolved.status, "ready");
  if (resolved.status !== "ready") return;

  assert.equal(resolved.distances.tora?.valueFt, 12189);
  assert.equal(resolved.distances.asda, undefined);
  assert.equal(resolved.distances.toda?.valueFt, 13000);
});

test("DD.3 invalid provider provenance fails closed", () => {
  const emptyProvider = resolveDeclaredDistanceProviderPayload(
    { airportIcao: "LKPR", runwayIdent: "24" },
    {
      providerId: "",
      airportIcao: "LKPR",
      runwayIdent: "24",
      distancesFt: { tora: 12000, asda: 12500 },
    },
  );
  assert.equal(emptyProvider.status, "invalid");

  const emptyRevision = resolveDeclaredDistanceProviderPayload(
    { airportIcao: "LKPR", runwayIdent: "24" },
    {
      providerId: "provider-a",
      revision: "",
      airportIcao: "LKPR",
      runwayIdent: "24",
      distancesFt: { tora: 12000, asda: 12500 },
    },
  );
  assert.equal(emptyRevision.status, "invalid");
});

test("DD.3 invalid provider distances fail closed through the shared contract", () => {
  const resolved = resolveDeclaredDistanceProviderPayload(
    { airportIcao: "LKPR", runwayIdent: "24" },
    {
      providerId: "provider-a",
      airportIcao: "LKPR",
      runwayIdent: "24",
      distancesFt: {
        tora: 0,
        asda: Number.NaN,
      },
    },
  );

  assert.equal(resolved.status, "invalid");
  if (resolved.status !== "invalid") return;

  assert.equal(resolved.errors.length, 2);
  assert.match(resolved.errors[0], /TORA/);
  assert.match(resolved.errors[1], /ASDA/);
});
