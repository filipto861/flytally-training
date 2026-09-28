import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("R1.1c Fast Path aviation projection is owned by the query-aware server slot", () => {
  const shell = read("components/ft-shell/FtShell.tsx");
  const slot = read("components/ft-shell/FtWorkspaceScopeSlot.tsx");
  const provider = read("components/ft-fast-path/FtFastPathProvider.tsx");

  assert.doesNotMatch(
    shell,
    /resolveSelectedVariant|configurationForAircraftVariant|filterChecklistForConfiguration|filterPerformanceForConfiguration|resolveFastPathQrh/,
  );
  assert.match(slot, /resolveWorkspaceAircraftScopeFromSearchParam/);
  assert.match(slot, /filterChecklistForConfiguration/);
  assert.match(slot, /filterPerformanceForConfiguration/);
  assert.match(slot, /resolveFastPathQrh/);
  assert.match(slot, /FtFastPathScopeRegistrar/);

  assert.match(provider, /useSearchParams/);
  assert.match(provider, /fastPathProjectionMatchesVariantQuery/);
  assert.match(provider, /workspaceProjection/);
});

test("R1.1c REF has no domain-local URL or variant resolver", () => {
  const reference = read("components/ft-fast-path/FtFastPathReference.tsx");

  assert.doesNotMatch(reference, /window\.location\.search|URLSearchParams/);
  assert.doesNotMatch(
    reference,
    /resolveSelectedVariant|configurationForAircraftVariant|filterLimitationsForConfiguration|filterPerformanceForConfiguration/,
  );
  assert.match(reference, /reference\?: ReferencePresentation/);
  assert.match(reference, /selectedVariant\?: string/);
});

test("R1.1c new-shell operational pages use the fail-closed workspace resolver", () => {
  for (const file of [
    "app/aircraft/[aircraftId]/fly/page.tsx",
    "app/aircraft/[aircraftId]/performance/page.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /resolveWorkspaceAircraftScopeFromSearchParam/);
    assert.match(source, /FtConfigurationState/);
    assert.match(source, /workspaceScope\.status !== "selected"/);
  }
});

test("R1.1c LEARN Reference keeps common-only unselected behavior explicit", () => {
  const source = read("app/aircraft/[aircraftId]/reference/page.tsx");

  assert.match(source, /resolveWorkspaceAircraftScopeFromSearchParam/);
  assert.match(source, /workspaceScope\?\.status === "unselected"/);
  assert.match(source, /FtConfigurationNotice/);
  assert.match(source, /configurationForAircraftVariant\(aircraft, undefined\)/);
});
