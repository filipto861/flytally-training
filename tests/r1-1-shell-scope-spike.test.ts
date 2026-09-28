import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), "utf8");

test("R1.1b query-aware scope lives in a client provider below the reusable layout", () => {
  const provider = read(
    "components/ft-shell/FtWorkspaceScopeProvider.tsx",
  );
  const shell = read("components/ft-shell/FtShell.tsx");
  const layout = read("app/aircraft/[aircraftId]/layout.tsx");

  assert.match(provider, /^"use client";/);
  assert.match(provider, /useSearchParams/);
  assert.match(provider, /searchParams\.get\("variant"\)/);
  assert.match(provider, /resolveWorkspaceAircraftScope/);

  assert.match(shell, /FtWorkspaceScopeProvider/);
  assert.match(
    shell,
    /<FtWorkspaceScopeProvider aircraft=\{aircraft\}>[\s\S]*<FtFastPathProvider/,
  );

  assert.doesNotMatch(layout, /searchParams/);
  assert.doesNotMatch(provider, /headers\(|cookies\(|window\.location/);
});

test("R1.1b scope transport does not create a second persisted selector", () => {
  const provider = read(
    "components/ft-shell/FtWorkspaceScopeProvider.tsx",
  );

  assert.doesNotMatch(
    provider,
    /localStorage|sessionStorage|document\.cookie|router\.push|router\.replace/,
  );
  assert.doesNotMatch(provider, /useState|useReducer/);
});

test("R1.1b remains aircraft-agnostic and transport-only", () => {
  const provider = read(
    "components/ft-shell/FtWorkspaceScopeProvider.tsx",
  );

  assert.doesNotMatch(
    provider,
    /learjet|bristell|cessna|boeing|rotax|fc-530/i,
  );
  assert.doesNotMatch(
    provider,
    /filterChecklistForConfiguration|filterPerformanceForConfiguration|filterAbnormalEmergencyForConfiguration|filterLimitationsForConfiguration/,
  );
});

test("R1.1b leaves legacy variant resolution untouched", () => {
  const applicability = read("lib/aircraft-applicability.ts");

  assert.match(
    applicability,
    /export function resolveSelectedVariant\(requestedVariant: string \| undefined, variants: readonly string\[\]\): string \| undefined \{\s*if \(requestedVariant && variants\.includes\(requestedVariant\)\) return requestedVariant;\s*return variants\.length === 1 \? variants\[0\] : undefined;\s*\}/,
  );
});
