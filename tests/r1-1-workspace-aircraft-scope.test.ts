import assert from "node:assert/strict";
import test from "node:test";

import type {
  TrainingAircraft,
  TrainingAircraftVariantProfile,
} from "../lib/aircraft-catalog.ts";
import {
  resolveWorkspaceAircraftScope,
  resolveWorkspaceAircraftScopeFromSearchParam,
} from "../lib/workspace-aircraft-scope.ts";

function aircraft(args: {
  readonly variants: readonly string[];
  readonly variantProfiles?: readonly TrainingAircraftVariantProfile[];
  readonly equipmentTags?: readonly string[];
}): Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
> {
  return {
    id: "generic-aircraft",
    variants: args.variants,
    ...(args.variantProfiles
      ? { variantProfiles: args.variantProfiles }
      : {}),
    ...(args.equipmentTags
      ? { equipmentTags: args.equipmentTags }
      : {}),
  };
}

test("R1.1 explicit valid variant resolves one effective workspace scope", () => {
  const target = aircraft({
    variants: ["variant-a", "variant-b"],
    variantProfiles: [
      {
        key: "variant-a",
        displayName: "Variant A",
        equipmentTags: ["equip-a"],
        configuration: {
          serialNumber: "SN-A",
          modifications: [
            { key: "mod-a", state: "installed" },
          ],
        },
      },
      {
        key: "variant-b",
        displayName: "Variant B",
        equipmentTags: ["equip-b"],
      },
    ],
  });

  const result = resolveWorkspaceAircraftScope(target, "variant-a");

  assert.equal(result.status, "selected");
  if (result.status !== "selected") return;
  assert.equal(result.selectionSource, "explicit");
  assert.equal(result.variantKey, "variant-a");
  assert.equal(result.configuration.variant, "variant-a");
  assert.equal(result.configuration.serialNumber, "SN-A");
  assert.match(
    result.effectiveConfigurationSnapshotId,
    /^effective:v1:/,
  );
});

test("R1.1 explicit unknown variant never falls back on a single-variant aircraft", () => {
  const result = resolveWorkspaceAircraftScope(
    aircraft({ variants: ["only-variant"] }),
    "unknown",
  );

  assert.deepEqual(result, {
    status: "unknown-variant",
    aircraftId: "generic-aircraft",
    requestedVariant: "unknown",
    selectionSource: "explicit",
  });
});

test("R1.1 explicit unknown variant never falls back to common on a multi-variant aircraft", () => {
  const result = resolveWorkspaceAircraftScope(
    aircraft({ variants: ["variant-a", "variant-b"] }),
    "unknown",
  );

  assert.equal(result.status, "unknown-variant");
});

test("R1.1 no request auto-selects only when exactly one selectable variant exists", () => {
  const result = resolveWorkspaceAircraftScope(
    aircraft({ variants: ["only-variant"] }),
    undefined,
  );

  assert.equal(result.status, "selected");
  if (result.status !== "selected") return;
  assert.equal(result.selectionSource, "sole-variant-default");
  assert.equal(result.variantKey, "only-variant");
});

test("R1.1 multi-variant aircraft with no request remains explicitly unselected", () => {
  const result = resolveWorkspaceAircraftScope(
    aircraft({ variants: ["variant-a", "variant-b"] }),
    undefined,
  );

  assert.deepEqual(result, {
    status: "unselected",
    aircraftId: "generic-aircraft",
    selectionSource: "none",
  });
});

test("R1.1 aircraft with no variant dimension resolves its common configuration", () => {
  const result = resolveWorkspaceAircraftScope(
    aircraft({
      variants: [],
      equipmentTags: ["common-equipment"],
    }),
    undefined,
  );

  assert.equal(result.status, "selected");
  if (result.status !== "selected") return;
  assert.equal(result.selectionSource, "common-aircraft");
  assert.equal(result.variantKey, null);
  assert.equal(result.configuration.variant, undefined);
  assert.deepEqual([...result.configuration.equipment], [
    "common-equipment",
  ]);
});

test("R1.1 effective snapshot changes under the same variant key when technical configuration changes", () => {
  const first = resolveWorkspaceAircraftScope(
    aircraft({
      variants: ["configured"],
      variantProfiles: [
        {
          key: "configured",
          displayName: "Configured",
          equipmentTags: [],
          configuration: {
            serialNumber: "SN-001",
            equipment: [
              {
                key: "pitot-static",
                state: "installed",
                model: "Model A",
              },
            ],
          },
        },
      ],
    }),
    "configured",
  );

  const second = resolveWorkspaceAircraftScope(
    aircraft({
      variants: ["configured"],
      variantProfiles: [
        {
          key: "configured",
          displayName: "Configured",
          equipmentTags: [],
          configuration: {
            serialNumber: "SN-002",
            equipment: [
              {
                key: "pitot-static",
                state: "installed",
                model: "Model A",
              },
            ],
          },
        },
      ],
    }),
    "configured",
  );

  assert.equal(first.status, "selected");
  assert.equal(second.status, "selected");
  if (first.status !== "selected" || second.status !== "selected") return;
  assert.notEqual(
    first.effectiveConfigurationSnapshotId,
    second.effectiveConfigurationSnapshotId,
  );
});

test("R1.1 effective snapshot is stable when technical configuration is unchanged", () => {
  const target = aircraft({
    variants: ["configured"],
    variantProfiles: [
      {
        key: "configured",
        displayName: "Configured",
        equipmentTags: ["equip-a"],
        configuration: {
          serialNumber: "SN-001",
          capabilityTags: ["cap-a"],
          modifications: [
            {
              key: "mod-a",
              state: "installed",
              approvalRef: "APPROVAL-A",
            },
          ],
        },
      },
    ],
  });

  const first = resolveWorkspaceAircraftScope(target, "configured");
  const second = resolveWorkspaceAircraftScope(target, "configured");

  assert.equal(first.status, "selected");
  assert.equal(second.status, "selected");
  if (first.status !== "selected" || second.status !== "selected") return;
  assert.equal(
    first.effectiveConfigurationSnapshotId,
    second.effectiveConfigurationSnapshotId,
  );
});

test("R1.1 configuration derivation failure becomes configuration-invalid instead of fallback", () => {
  const brokenProfile = {
    key: "configured",
    displayName: "Configured",
    equipmentTags: [],
    get configuration() {
      throw new Error("fixture configuration failure");
    },
  } as unknown as TrainingAircraftVariantProfile;

  const result = resolveWorkspaceAircraftScope(
    aircraft({
      variants: ["configured"],
      variantProfiles: [brokenProfile],
    }),
    "configured",
  );

  assert.deepEqual(result, {
    status: "configuration-invalid",
    aircraftId: "generic-aircraft",
    requestedVariant: "configured",
    selectionSource: "explicit",
    variantKey: "configured",
    reason: "effective-configuration-resolution-failed",
  });
});


test("R1.1b duplicate variant query fails closed as ambiguous configuration", () => {
  const result = resolveWorkspaceAircraftScopeFromSearchParam(
    aircraft({ variants: ["variant-a", "variant-b"] }),
    ["variant-a", "variant-b"],
  );

  assert.deepEqual(result, {
    status: "configuration-invalid",
    aircraftId: "generic-aircraft",
    selectionSource: "explicit",
    variantKey: null,
    reason: "ambiguous-variant-request",
  });
});
