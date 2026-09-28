import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import {
  resolveWorkspaceAircraftScopeRequest,
  workspaceAircraftScopeIdentity,
  workspaceVariantRequestKey,
} from "../lib/workspace-aircraft-scope.ts";

function aircraft(): Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
> {
  return {
    id: "scope-spike-aircraft",
    variants: ["variant-a"],
    variantProfiles: [
      {
        key: "variant-a",
        displayName: "Variant A",
        equipmentTags: [],
        configuration: {
          serialNumber: "SCOPE-001",
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
    equipmentTags: [],
  };
}

test("R1.1b request identity distinguishes no, single and repeated variant selectors", () => {
  assert.equal(workspaceVariantRequestKey(undefined), "none");
  assert.notEqual(
    workspaceVariantRequestKey("variant-a"),
    workspaceVariantRequestKey(["variant-a", "variant-a"]),
  );
});

test("R1.1b repeated variant selectors fail closed rather than selecting one candidate", () => {
  const resolution = resolveWorkspaceAircraftScopeRequest(
    aircraft(),
    ["variant-a", "variant-a"],
  );

  assert.equal(resolution.scope.status, "unknown-variant");
  assert.match(resolution.requestKey, /^multiple:/);
});

test("R1.1b serializable scope identity carries the effective configuration snapshot", () => {
  const resolution = resolveWorkspaceAircraftScopeRequest(
    aircraft(),
    "variant-a",
  );
  assert.equal(resolution.scope.status, "selected");

  const identity = workspaceAircraftScopeIdentity(
    resolution.scope,
    resolution.requestKey,
  );

  assert.equal(identity.status, "selected");
  assert.equal(identity.variantKey, "variant-a");
  assert.match(
    identity.effectiveConfigurationSnapshotId ?? "",
    /^effective:v1:/,
  );
});

const read = (path: string) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("R1.1b parallel slot is the only server reader of query scope for the shell spike", () => {
  const slot = read(
    "app/aircraft/[aircraftId]/@workspaceScope/[[...scopePath]]/page.tsx",
  );
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(slot, /searchParams/);
  assert.match(slot, /resolveWorkspaceAircraftScopeRequest/);
  assert.match(slot, /workspaceAircraftScopeIdentity/);
  assert.doesNotMatch(slot, /headers\(|window\.location/);

  assert.match(layout, /workspaceScope: ReactNode/);
  assert.match(layout, /workspaceScopeSlot=\{workspaceScope\}/);
});

test("R1.1b shell bridge gates server registration against the live route selector", () => {
  const bridge = read("components/ft-shell/FtWorkspaceScopeBridge.tsx");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(bridge, /useSearchParams/);
  assert.match(bridge, /registeredScope\.requestKey === routeRequestKey/);
  assert.match(bridge, /effectiveScope: synchronized \? registeredScope : null/);
  assert.match(bridge, /FtWorkspaceScopeRegistration/);
  assert.match(bridge, /FtWorkspaceScopeEcho/);

  assert.match(shell, /<FtWorkspaceScopeBridge>/);
  assert.match(shell, /\{workspaceScopeSlot\}/);
  assert.match(shell, /<FtWorkspaceScopeEcho \/>/);
});

test("R1.1b spike does not replace the legacy selector or wire Fast Path filtering yet", () => {
  const applicability = read("lib/aircraft-applicability.ts");
  const shell = read("components/ft-shell/FtShell.tsx");

  assert.match(
    applicability,
    /export function resolveSelectedVariant\(/,
  );
  assert.match(shell, /resolveSelectedVariant\(undefined, aircraft\.variants\)/);
  assert.match(shell, /configurationForAircraftVariant/);
});
