import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet3536AbnormalTraining } from "../lib/abnormal-scenarios.ts";
import { validateContentPayload } from "../lib/content-contracts.ts";
import { learjet3536ExpandedAbnormal } from "../lib/learjet-native-abnormal-expanded.ts";
import { learjet3536NativeAbnormal } from "../lib/learjet-native-abnormal.ts";
import { StaticTrainingContentRepository } from "../lib/static-content-repository.ts";
import { isUniversalAbnormalEmergencyContent, type AircraftAbnormalEmergencyContent } from "../lib/universal-abnormal-emergency.ts";

const aircraftId = "learjet-35-36";
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

function legacySourceShape() {
  return learjet3536AbnormalTraining.scenarios.map((scenario) => ({
    id: scenario.id,
    category: scenario.category,
    phase: scenario.phase,
    difficulty: scenario.difficulty,
    minutes: scenario.minutes,
    stages: scenario.stages.map((stage) => ({
      id: stage.id,
      sources: stage.source.map((source) => ({
        chapter: String(source.chapter),
        section: source.section,
        pageLabel: source.manualPage,
      })),
    })),
  }));
}

function nativeSourceShape() {
  return learjet3536NativeAbnormal.scenarios.map((scenario) => ({
    id: scenario.id,
    category: scenario.category,
    phase: scenario.phase,
    difficulty: scenario.difficulty,
    minutes: scenario.minutes,
    stages: scenario.stages.map((stage) => ({
      id: stage.id,
      sources: stage.sources.map((source) => ({
        chapter: source.chapter,
        section: source.section,
        pageLabel: source.pageLabel,
      })),
    })),
  }));
}

test("Learjet abnormal content is a valid native M16 payload with complete source identity", () => {
  assert.equal(isUniversalAbnormalEmergencyContent(learjet3536NativeAbnormal), true);
  assert.deepEqual(validateContentPayload("abnormal", learjet3536NativeAbnormal, aircraftId), []);
  for (const scenario of learjet3536NativeAbnormal.scenarios) {
    for (const stage of scenario.stages) {
      assert.ok(stage.sources.length > 0, `${scenario.id}/${stage.id} must have source provenance`);
      assert.ok(stage.sources.every((source) => source.manualId === "fsi-learjet-35-36-ptm-r1-1"));
    }
  }
});

test("native migration preserves reviewed scenario identity, sequence, duration and source locations", () => {
  assert.deepEqual(nativeSourceShape(), legacySourceShape());
  assert.deepEqual(
    learjet3536NativeAbnormal.scenarios.map((scenario) => scenario.objectives.length),
    learjet3536AbnormalTraining.scenarios.map((scenario) => scenario.objectives.length),
  );
  assert.deepEqual(
    learjet3536NativeAbnormal.scenarios.map((scenario) => scenario.debrief.length),
    learjet3536AbnormalTraining.scenarios.map((scenario) => scenario.debrief.length),
  );
});

test("native learner payload uses real-standard training language without silently changing authority", () => {
  const serialized = JSON.stringify(learjet3536NativeAbnormal);
  assert.doesNotMatch(serialized, /simulator/i);
  assert.match(learjet3536NativeAbnormal.disclaimer ?? "", /AFM/);
  assert.match(learjet3536NativeAbnormal.disclaimer ?? "", /operator SOPs/);
  assert.match(learjet3536NativeAbnormal.sourceNote ?? "", /FlightSafety/);
  assert.ok(learjet3536NativeAbnormal.scenarios.some((scenario) => scenario.boundaryNote));
});

test("configuration prose is retained as a note without inventing variant or equipment tags", () => {
  const sourceWithVariantNotes = learjet3536AbnormalTraining.scenarios.filter((scenario) => scenario.variantNote);
  for (const legacy of sourceWithVariantNotes) {
    const native = learjet3536NativeAbnormal.scenarios.find((scenario) => scenario.id === legacy.id);
    assert.ok(native?.applicability?.note);
    assert.equal(native?.applicability?.variants, undefined);
    assert.equal(native?.applicability?.equipmentAllOf, undefined);
    assert.equal(native?.applicability?.equipmentAnyOf, undefined);
    assert.equal(native?.applicability?.equipmentNoneOf, undefined);
  }
});

test("static repository serves the expanded abnormal module before the legacy compatibility payload", async () => {
  const repository = new StaticTrainingContentRepository();
  const published = await repository.getPublishedModule<AircraftAbnormalEmergencyContent>(aircraftId, "abnormal");
  assert.equal(published?.title, learjet3536ExpandedAbnormal.title);
  assert.equal(isUniversalAbnormalEmergencyContent(published), true);
});

test("existing database replacement is an explicit governed immutable upgrade, never deploy-time overwrite", () => {
  assert.match(bootstrap, /publishStaticNativeModuleUpgrade/);
  assert.match(bootstrap, /createGovernedDraftVersion/);
  assert.match(bootstrap, /approveGovernedContentVersion/);
  assert.match(bootstrap, /publishGovernedContentVersion/);
  assert.match(bootstrap, /nativeSeedModules/);
  assert.doesNotMatch(bootstrap, /UPDATE training_content_versions SET payload/i);
});
