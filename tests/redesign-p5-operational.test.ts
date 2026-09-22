import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { configurationForVariant } from "../lib/aircraft-applicability.ts";
import { fastPathTabForShortcut, fastPathTabs } from "../lib/fast-path/panel-state.ts";
import { resolveFastPathQrh } from "../lib/fast-path/qrh-adapter.ts";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P5.1 freezes the W3 fast-path tabs and shortcut order", () => {
  assert.deepEqual([...fastPathTabs], ["checklist", "qrh", "perf", "ref"]);
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit1" }), "checklist");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit2" }), "qrh");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit3" }), "perf");
  assert.equal(fastPathTabForShortcut({ ctrlKey: true, shiftKey: true, code: "Digit4" }), "ref");
});

test("P5.1 records M50/M54 as the QRH source of truth", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");

  assert.match(fly, /isUniversalAbnormalEmergencyContent/);
  assert.match(fly, /filterAbnormalEmergencyForConfiguration/);
  assert.match(fly, /toOperationalEmergency/);
  assert.doesNotMatch(fly, /normalizeLegacyAbnormalTraining|normalizeUniversalAbnormalEmergency/);
});

test("P5.1 keeps operational QRH free of training-only fields", () => {
  const mapper = read("lib/operational-flight-data.ts");
  const emergency = read("components/operational-emergency.tsx");

  assert.match(mapper, /expectedResponse: \[\.\.\.stage\.expectedResponse\]/);
  assert.match(mapper, /sources: stage\.sources\.map/);
  assert.match(emergency, /stage\.expectedResponse\.map/);
  assert.match(emergency, /Source &amp; authority/);

  for (const pattern of [
    /scenario\.setup/,
    /scenario\.objectives/,
    /scenario\.debrief/,
    /stage\.prompt/,
    /stage\.explanation/,
    /scenario\.minutes/,
    /scenario\.difficulty/,
  ]) {
    assert.doesNotMatch(emergency, pattern);
  }
});

test("P5.1 preserves the canonical shared checklist-session key", () => {
  const session = read("lib/checklist-session.ts");
  const adapter = read("lib/fast-path/checklist-adapter.ts");

  assert.match(session, /flytally-training-checklist-session:/);
  assert.match(adapter, /checklistSessionStorageKey/);
  assert.doesNotMatch(adapter, /flytally:flight-checklist:v1:/);
});

test("P5.1 explicitly isolates the legacy operational checklist storage for P5.5", () => {
  const operationalChecklist = read("components/operational-checklist.tsx");

  assert.match(operationalChecklist, /flytally:flight-checklist:v1:/);
  assert.match(operationalChecklist, /window\.localStorage/);
  assert.match(operationalChecklist, /type StoredFlightChecklist/);
  assert.doesNotMatch(operationalChecklist, /checklistSessionStorageKey/);
});

test("P5.1 keeps REF owned by P7 and outside P5", () => {
  const roadmap = read("REDESIGN.md");
  const inventory = read("P5_OPERATIONAL_FAST_PATH.md");

  assert.match(roadmap, /P7 — Reference \/ REF fast-path closure/);
  assert.match(roadmap, /REF is no longer part of P5/);
  assert.match(inventory, /REF.*Not P5.*owned by P7/i);
});

test("P5 reusable operational paths remain aircraft-agnostic", () => {
  const source = [
    read("components/ft-fast-path/FtFastPathPanel.tsx"),
    read("components/ft-fast-path/FtFastPathChecklist.tsx"),
    read("components/operational-emergency.tsx"),
    read("lib/fast-path/checklist-adapter.ts"),
    read("lib/operational-flight-data.ts"),
  ].join("\n");

  assert.doesNotMatch(source, /learjet|35a|tfe731|bristell|cessna|boeing|rotax/i);
  assert.doesNotMatch(source, /aircraft\.model\s*===/i);
});


const qrhPayload = {
  aircraftId: "generic-aircraft",
  title: "Generic Emergency",
  scenarios: [
    {
      id: "applicable",
      title: "Applicable Emergency",
      category: "Generic",
      phase: "In flight",
      difficulty: "core",
      minutes: 1,
      summary: "Training summary that must not enter operational output.",
      setup: "Training setup that must not enter operational output.",
      objectives: ["Recognize the condition."],
      debrief: ["Review the response."],
      applicability: { equipmentAllOf: ["eq-a"] },
      stages: [
        {
          id: "memory",
          label: "Immediate action",
          prompt: "Training prompt.",
          expectedResponse: ["Action A"],
          explanation: "Training explanation.",
          sources: [{ manualId: "generic-source", pageLabel: "1" }],
        },
        {
          id: "filtered-stage",
          label: "Filtered stage",
          prompt: "Training prompt.",
          expectedResponse: ["Action B"],
          explanation: "Training explanation.",
          applicability: { equipmentAllOf: ["eq-b"] },
          sources: [{ manualId: "generic-source", pageLabel: "2" }],
        },
      ],
    },
    {
      id: "filtered-scenario",
      title: "Filtered Emergency",
      category: "Generic",
      phase: "In flight",
      difficulty: "core",
      minutes: 1,
      summary: "Filtered summary.",
      setup: "Filtered setup.",
      objectives: ["Filtered objective."],
      debrief: ["Filtered debrief."],
      applicability: { equipmentAllOf: ["eq-b"] },
      stages: [
        {
          id: "filtered-only-stage",
          label: "Filtered action",
          prompt: "Filtered prompt.",
          expectedResponse: ["Filtered action"],
          explanation: "Filtered explanation.",
          sources: [{ manualId: "generic-source", pageLabel: "3" }],
        },
      ],
    },
  ],
};

test("P5.2 QRH adapter fails closed for readiness and invalid payloads", () => {
  const configuration = configurationForVariant(undefined, ["eq-a"]);

  assert.equal(resolveFastPathQrh(qrhPayload, configuration, false), undefined);
  assert.equal(resolveFastPathQrh({ aircraftId: "generic-aircraft" }, configuration, true), undefined);
});

test("P5.2 QRH adapter applies existing configuration filtering before projection", () => {
  const qrh = resolveFastPathQrh(
    qrhPayload,
    configurationForVariant(undefined, ["eq-a"]),
    true,
  );

  assert.ok(qrh);
  assert.deepEqual(qrh.scenarios.map((scenario) => scenario.id), ["applicable"]);
  assert.deepEqual(qrh.scenarios[0]?.stages.map((stage) => stage.id), ["memory"]);
});

test("P5.2 QRH adapter reuses the operational DTO and strips training interaction", () => {
  const qrh = resolveFastPathQrh(
    qrhPayload,
    configurationForVariant(undefined, ["eq-a"]),
    true,
  );

  assert.ok(qrh);
  const serialized = JSON.stringify(qrh);
  assert.match(serialized, /Action A/);
  assert.match(serialized, /generic-source/);
  assert.doesNotMatch(serialized, /Training summary|Training setup|Recognize the condition|Review the response|Training prompt|Training explanation/);
});
