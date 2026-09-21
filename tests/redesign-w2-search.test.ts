import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import type { TrainingAircraft } from "../lib/aircraft-catalog.ts";
import type { TrainingContentDomain } from "../lib/content-admin-types.ts";
import type { TrainingContentRepository } from "../lib/content-repository.ts";
import {
  isValidAircraftSearchId,
  searchAircraft,
} from "../lib/search/aircraft-search.ts";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  type RecentSearchStorage,
} from "../lib/search/recent-searches.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const aircraft = (id: string): TrainingAircraft => ({
  id,
  manufacturer: "Test",
  model: id,
  variants: ["Standard"],
  displayName: id,
  manuals: [],
});

function checklist(title: string, phaseTitles: readonly string[]) {
  return {
    aircraftId: title,
    title,
    phases: phaseTitles.map((phaseTitle, index) => ({
      id: `phase-${index}`,
      title: phaseTitle,
      sequence: index + 1,
      items: [{ id: `item-${index}`, challenge: phaseTitle, response: "CHECK" }],
    })),
  };
}

function repositoryFor(contents: Readonly<Record<string, ReturnType<typeof checklist>>>): TrainingContentRepository {
  const aircraftById = new Map(Object.keys(contents).map((id) => [id, aircraft(id)] as const));
  return {
    async listAircraft() { return [...aircraftById.values()]; },
    async getAircraft(aircraftId) { return aircraftById.get(aircraftId); },
    async getLearningContent() { return undefined; },
    async getNormalFlight() { return undefined; },
    async getCockpitOrientation() { return undefined; },
    async getAbnormalTraining() { return undefined; },
    async getReferenceKnowledge() { return undefined; },
    async listPublishedModuleDomains(aircraftId) {
      return aircraftById.has(aircraftId) ? (["checklists"] as const) : [];
    },
    async getPublishedModule<T>(aircraftId: string, domain: TrainingContentDomain) {
      return (domain === "checklists" ? contents[aircraftId] : undefined) as T | undefined;
    },
  };
}

class MemoryStorage implements RecentSearchStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("W2 search ranks exact title match before prefix and broader matches", async () => {
  const repository = repositoryFor({
    alpha: checklist("Alpha Checklist", ["Generator", "Generator Start", "Before Generator"]),
  });

  const results = await searchAircraft(repository, "alpha", "Generator");
  assert.equal(results[0]?.title, "Generator");
  assert.equal(results[1]?.title, "Generator Start");
});

test("W2 search is aircraft-scoped and never leaks another aircraft result", async () => {
  const repository = repositoryFor({
    alpha: checklist("Alpha Checklist", ["Alpha Procedure"]),
    bravo: checklist("Bravo Checklist", ["Bravo Procedure"]),
  });

  const results = await searchAircraft(repository, "alpha", "Bravo");
  assert.deepEqual(results, []);
});

test("W2 search ignores queries shorter than two characters", async () => {
  const repository = repositoryFor({ alpha: checklist("Alpha Checklist", ["Generator"]) });
  assert.deepEqual(await searchAircraft(repository, "alpha", "G"), []);
  assert.deepEqual(await searchAircraft(repository, "alpha", " "), []);
});

test("W2 recent searches round-trip through local storage contract", () => {
  const storage = new MemoryStorage();
  addRecentSearch("alpha", "generator", storage);
  addRecentSearch("alpha", "performance", storage);
  assert.deepEqual(readRecentSearches("alpha", storage), ["performance", "generator"]);
  clearRecentSearches("alpha", storage);
  assert.deepEqual(readRecentSearches("alpha", storage), []);
});

test("W2 recent searches retain at most five newest unique queries", () => {
  const storage = new MemoryStorage();
  for (const query of ["one", "two", "three", "four", "five", "six"]) {
    addRecentSearch("alpha", query, storage);
  }
  assert.deepEqual(readRecentSearches("alpha", storage), ["six", "five", "four", "three", "two"]);
  addRecentSearch("alpha", "FOUR", storage);
  assert.deepEqual(readRecentSearches("alpha", storage), ["FOUR", "six", "five", "three", "two"]);
});

test("W2 search overlay uses frozen workspace tokens and replaces the W0 placeholder trigger", () => {
  const css = read("components/ft-search/ft-search.module.css");
  const topBar = read("components/ft-shell/FtTopBar.tsx");

  assert.match(css, /var\(--ft-bg-panel\)/);
  assert.match(css, /var\(--ft-text-primary\)/);
  assert.match(css, /var\(--ft-space-4\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.match(topBar, /FtSearchOverlay/);
  assert.doesNotMatch(topBar, /Search aircraft workspace"[\s\S]*disabled/);
});

test("W2 search route validates aircraft id and uses the aircraft-scoped service", () => {
  const route = read("app/api/aircraft/[aircraftId]/search/route.ts");

  assert.equal(isValidAircraftSearchId("learjet-35a"), true);
  assert.equal(isValidAircraftSearchId("../bad"), false);
  assert.equal(isValidAircraftSearchId(""), false);
  assert.match(route, /isNewShellEnabled\(\)/);
  assert.match(route, /isValidAircraftSearchId\(aircraftId\)/);
  assert.match(route, /searchAircraft\(/);
  assert.match(route, /cache-control": "private, no-store"/);
});
