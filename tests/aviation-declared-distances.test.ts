import assert from "node:assert/strict";
import test from "node:test";

import {
  manualDeclaredDistanceFt,
  providerDeclaredDistanceFt,
  resolveTakeoffDeclaredDistanceConstraint,
  validateRunwayDeclaredDistances,
} from "../lib/aviation/declared-distances.ts";

test("DD.1 manual and provider declared-distance values preserve provenance", () => {
  assert.deepEqual(manualDeclaredDistanceFt(12000), {
    valueFt: 12000,
    provenance: { kind: "manual" },
  });

  assert.deepEqual(providerDeclaredDistanceFt(11800, "provider-a", "2026-09"), {
    valueFt: 11800,
    provenance: {
      kind: "provider",
      providerId: "provider-a",
      revision: "2026-09",
    },
  });
});

test("DD.1 takeoff constraint requires both TORA and ASDA", () => {
  assert.deepEqual(resolveTakeoffDeclaredDistanceConstraint({}), {
    status: "missing",
    missing: ["TORA", "ASDA"],
  });

  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      tora: manualDeclaredDistanceFt(12000),
    }),
    {
      status: "missing",
      missing: ["ASDA"],
    },
  );

  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      asda: manualDeclaredDistanceFt(12500),
    }),
    {
      status: "missing",
      missing: ["TORA"],
    },
  );
});

test("DD.1 Learjet takeoff usable distance is min(TORA, ASDA)", () => {
  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      tora: manualDeclaredDistanceFt(12000),
      asda: manualDeclaredDistanceFt(12500),
    }),
    {
      status: "ready",
      toraFt: 12000,
      asdaFt: 12500,
      usableTakeoffFieldLengthFt: 12000,
      limitingDistance: "TORA",
    },
  );

  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      tora: manualDeclaredDistanceFt(13000),
      asda: manualDeclaredDistanceFt(12400),
    }),
    {
      status: "ready",
      toraFt: 13000,
      asdaFt: 12400,
      usableTakeoffFieldLengthFt: 12400,
      limitingDistance: "ASDA",
    },
  );

  assert.equal(
    resolveTakeoffDeclaredDistanceConstraint({
      tora: manualDeclaredDistanceFt(12189),
      asda: manualDeclaredDistanceFt(12189),
    }).status,
    "ready",
  );
  const tied = resolveTakeoffDeclaredDistanceConstraint({
    tora: manualDeclaredDistanceFt(12189),
    asda: manualDeclaredDistanceFt(12189),
  });
  assert.equal(tied.status === "ready" ? tied.limitingDistance : null, "BOTH");
});

test("DD.1 TODA and LDA never substitute for missing takeoff declared distances", () => {
  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      toda: manualDeclaredDistanceFt(14000),
      lda: manualDeclaredDistanceFt(11000),
    }),
    {
      status: "missing",
      missing: ["TORA", "ASDA"],
    },
  );

  assert.deepEqual(
    resolveTakeoffDeclaredDistanceConstraint({
      tora: manualDeclaredDistanceFt(12000),
      toda: manualDeclaredDistanceFt(14000),
    }),
    {
      status: "missing",
      missing: ["ASDA"],
    },
  );
});

test("DD.1 physical runway surface length cannot silently become TORA or ASDA", () => {
  const unsafeLegacyShape = {
    surfaceLengthFt: 12189,
  } as unknown as Parameters<typeof resolveTakeoffDeclaredDistanceConstraint>[0];

  assert.deepEqual(resolveTakeoffDeclaredDistanceConstraint(unsafeLegacyShape), {
    status: "missing",
    missing: ["TORA", "ASDA"],
  });
});

test("DD.1 invalid declared distances fail closed", () => {
  const invalid = resolveTakeoffDeclaredDistanceConstraint({
    tora: manualDeclaredDistanceFt(0),
    asda: manualDeclaredDistanceFt(Number.NaN),
  });

  assert.equal(invalid.status, "invalid");
  if (invalid.status !== "invalid") return;
  assert.equal(invalid.errors.length, 2);
  assert.match(invalid.errors[0], /TORA/);
  assert.match(invalid.errors[1], /ASDA/);
});

test("DD.1 provider provenance must be explicit and non-empty", () => {
  assert.deepEqual(
    validateRunwayDeclaredDistances({
      tora: providerDeclaredDistanceFt(12000, ""),
      asda: providerDeclaredDistanceFt(12500, "provider-a", ""),
    }),
    [
      "TORA provider provenance requires a providerId.",
      "ASDA provider revision must be non-empty when supplied.",
    ],
  );
});
