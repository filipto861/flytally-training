import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { trainingAircraft } from "../lib/aircraft-catalog.ts";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";

const root = path.resolve(import.meta.dirname, "..");
const libRoot = path.join(root, "lib");

function filesIn(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(absolute) : [absolute];
  });
}

test("built-in aircraft catalog and static content seed are intentionally empty", () => {
  assert.equal(trainingAircraft.length, 0);
  assert.equal(staticTrainingContentSeed.aircraft.length, 0);
  assert.equal(staticTrainingContentSeed.nativeModules?.length ?? 0, 0);
  assert.equal(staticTrainingContentSeed.learningContent.length, 0);
  assert.equal(staticTrainingContentSeed.normalFlights.length, 0);
  assert.equal(staticTrainingContentSeed.cockpitOrientations.length, 0);
  assert.equal(staticTrainingContentSeed.abnormalTrainings.length, 0);
  assert.equal(staticTrainingContentSeed.referenceKnowledge.length, 0);
});

test("active library contains no retired Learjet seed or source identifiers", () => {
  const files = filesIn(libRoot).filter((file) => /\.(ts|tsx)$/.test(file));
  const activeSource = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(activeSource, /learjet-35-36|fsi-learjet|cae-simuflite-learjet|jaydee-learjet|flysimware-learjet/i);
});

test("empty catalog remains an operationally valid rebuild state", () => {
  const readiness = fs.readFileSync(path.join(root, "app/api/readiness/route.ts"), "utf8");
  assert.match(readiness, /infrastructureReady/);
  assert.match(readiness, /publishedAircraft \? catalogReady : true/);
});
