import assert from "node:assert/strict";
import test from "node:test";

import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import { aircraftWorkspaceSections } from "../lib/aircraft-workspace-navigation.ts";
import { getAircraftContentBundle, type TrainingContentRepository } from "../lib/content-repository.ts";
import type { TrainingContentDomain } from "../lib/content-admin-types.ts";

const aircraft: TrainingAircraft = {
  id: "acceptance-light-sep",
  manufacturer: "Acceptance",
  model: "Light SEP",
  displayName: "Acceptance Light SEP",
  variants: ["A"],
  variantProfiles: [{ key: "A", displayName: "A", equipmentTags: ["fixed-gear"] }],
  manuals: [{
    id: "acceptance-light-sep-r1",
    title: "Acceptance Light SEP Manual",
    publisher: "FlyTally Acceptance",
    revision: "1",
    issueDate: "2026-09",
    sourceKind: "POH",
    authorityRole: "TRAINING_REFERENCE",
    authorityNote: "Synthetic acceptance fixture.",
    sourceReferences: { identityPage: 1, authorityNoticePage: 1, revisionPage: 1, contentsPage: 1 },
    chapters: [],
  }],
};

const sparseDomains = ["checklists", "performance", "procedures"] as const satisfies readonly TrainingContentDomain[];

const repository: TrainingContentRepository = {
  async listAircraft() { return [aircraft]; },
  async getAircraft(id) { return id === aircraft.id ? aircraft : undefined; },
  async getLearningContent() { return undefined; },
  async getNormalFlight() { return undefined; },
  async getCockpitOrientation() { return undefined; },
  async getAbnormalTraining() { return undefined; },
  async getReferenceKnowledge() { return undefined; },
  async listPublishedModuleDomains(id) { return id === aircraft.id ? sparseDomains : []; },
  async getPublishedModule() { return undefined; },
};

test("a sparse aircraft exposes only its published first-class modules", async () => {
  const bundle = await getAircraftContentBundle(repository, aircraft.id);
  assert.ok(bundle);
  assert.deepEqual(bundle.publishedModuleDomains, sparseDomains);
  assert.deepEqual(bundle.capabilities, {
    checklists: true,
    procedures: true,
    performance: true,
    limitations: false,
    systems: false,
    abnormalEmergency: false,
    flows: false,
    avionics: false,
    knowledge: false,
    manual: true,
    quickStart: false,
    normalFlight: false,
    cockpitOrientation: false,
    quickReference: false,
  });
});

test("workspace navigation omits every unpublished aircraft module", () => {
  const sections = aircraftWorkspaceSections(aircraft.id, sparseDomains);
  assert.deepEqual(sections.map((section) => section.key), ["overview", "checklists", "procedures", "performance", "progress"]);
  assert.ok(sections.every((section) => section.href.startsWith(`/aircraft/${aircraft.id}`)));
});

test("legacy publication names do not become universal modules by inference", () => {
  const sections = aircraftWorkspaceSections(aircraft.id, ["normal-flight", "learning", "reference-knowledge"]);
  assert.deepEqual(sections.map((section) => section.key), ["overview", "checklists", "systems", "knowledge", "progress"]);
  assert.ok(!sections.some((section) => section.key === "performance" || section.key === "limitations" || section.key === "abnormal"));
});
