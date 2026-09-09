import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

test("learner-facing UI resolves aircraft data through the repository boundary", () => {
  const files = [
    ...sourceFiles(path.join(process.cwd(), "app")),
    ...sourceFiles(path.join(process.cwd(), "components")),
  ];

  const forbidden = [
    "learjet-35-36",
    "getTrainingAircraft(",
    "getAircraftLearningContent(",
    "getSimulatorFlightFlow(",
    "getAircraftAbnormalTraining(",
    "getCockpitLocationForChecklistItem(",
    "static-content-repository",
  ];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const token of forbidden) {
      assert.equal(
        source.includes(token),
        false,
        `${path.relative(process.cwd(), file)} bypasses the aircraft content repository with ${token}`,
      );
    }

    const importsLegacyOrientationGetter = /import\s*\{[^}]*\bgetCockpitOrientation\b[^}]*\}\s*from\s*["']@\/lib\/cockpit-orientation["']/s.test(source);
    assert.equal(
      importsLegacyOrientationGetter,
      false,
      `${path.relative(process.cwd(), file)} imports the legacy cockpit-orientation getter directly`,
    );
  }
});
