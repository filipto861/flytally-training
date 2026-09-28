import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  toFastPathWorkspaceScopeIdentity,
  workspaceVariantRequestKey,
} from "../lib/fast-path/workspace-projection.ts";
import { resolveWorkspaceAircraftScope } from "../lib/workspace-aircraft-scope.ts";
import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function aircraft(): Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
> {
  return {
    id: "generic-aircraft",
    variants: ["variant-a"],
    variantProfiles: [
      {
        key: "variant-a",
        displayName: "Variant A",
        equipmentTags: ["equip-a"],
        configuration: {
          serialNumber: "SN-001",
        },
      },
    ],
  };
}

test("R1.1c.1 request echo key distinguishes absent, selected and ambiguous variant queries", () => {
  assert.equal(workspaceVariantRequestKey(undefined), "variant:none");
  assert.equal(
    workspaceVariantRequestKey("variant a"),
    "variant:one:variant%20a",
  );
  assert.equal(
    workspaceVariantRequestKey(["variant-a", "variant-b"]),
    "variant:ambiguous:variant-a,variant-b",
  );
});

test("R1.1c.1 projection identity carries the effective snapshot without duplicating configuration", () => {
  const scope = resolveWorkspaceAircraftScope(aircraft(), "variant-a");
  assert.equal(scope.status, "selected");
  if (scope.status !== "selected") return;

  const identity = toFastPathWorkspaceScopeIdentity(scope);
  assert.equal(identity.status, "selected");
  if (identity.status !== "selected") return;
  assert.equal(identity.variantKey, "variant-a");
  assert.match(identity.effectiveConfigurationSnapshotId, /^effective:v1:/);
  assert.equal("configuration" in identity, false);
});

test("R1.1c.1 server projection derives all operational domains from one selected scope", () => {
  const source = read("lib/fast-path/workspace-projection-server.ts");

  assert.match(source, /resolveWorkspaceAircraftScopeFromSearchParam/);
  assert.match(source, /scope\.configuration/);
  assert.match(source, /filterChecklistForConfiguration/);
  assert.match(source, /resolveFastPathQrh/);
  assert.match(source, /filterPerformanceForConfiguration/);
  assert.match(source, /filterLimitationsForConfiguration/);
  assert.match(source, /toReferencePresentation/);
  assert.doesNotMatch(
    source,
    /learjet|fc-?530|browser-ci-aircraft|aircraftId\s*===|switch\s*\(\s*aircraftId/i,
  );
});

test("R1.1c.1 client registration is query-echo gated and happens before paint", () => {
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");
  const registrar = read("components/ft-fast-path/FtFastPathProjectionRegistrar.tsx");

  assert.match(provider, /useSearchParams/);
  assert.match(provider, /searchParams\.getAll\("variant"\)/);
  assert.match(provider, /workspaceVariantRequestKey/);
  assert.match(provider, /registeredWorkspaceProjection\.requestKey === currentWorkspaceRequestKey/);
  assert.match(registrar, /useLayoutEffect/);
  assert.match(registrar, /registerWorkspaceProjection\(projection\)/);
  assert.match(registrar, /unregisterWorkspaceProjection\(projection\)/);
});

test("R1.1c.1 workspace slot serializes the server projection into the existing provider boundary", () => {
  const slot = read("components/ft-shell/FtWorkspaceScopeSlot.tsx");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(slot, /getFastPathWorkspaceProjection/);
  assert.match(slot, /FtFastPathProjectionRegistrar/);
  assert.match(shell, /\{workspaceScope\}/);
  assert.match(
    shell,
    /<FtFastPathProvider[\s\S]*\{workspaceScope\}[\s\S]*<section/,
  );
});
