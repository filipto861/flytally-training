import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("15.3c new-shell /fly is a dedicated checklist workspace", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");

  assert.match(fly, /const newShell = isNewShellEnabled\(\)/);
  assert.match(fly, /presentation=\{newShell \? "checklist" : "deck"\}/);
  assert.match(fly, /data-ft-fly-page="true"/);
  assert.match(fly, /aria-label="Checklist workspace"/);
  assert.match(fly, /if \(!newShell && noOperationalModules\) notFound\(\)/);
  assert.doesNotMatch(
    fly.slice(fly.indexOf("if (newShell)"), fly.indexOf("return (", fly.indexOf("if (newShell)") + 1)),
    /notFound\(/,
  );
});

test("15.3a preserves source-authority readiness gates for Checklist and QRH", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");

  assert.match(fly, /operationalReadiness\.checklists\.ready && checklistContent/);
  assert.match(fly, /operationalReadiness\.abnormal\.ready && isUniversalAbnormalEmergencyContent/);
  assert.match(fly, /toOperationalChecklist\(runtimeChecklist\)/);
  assert.match(fly, /toOperationalEmergency\(configuredAbnormal\)/);
});

test("15.3a legacy flag-off FLY keeps the historical strict route composition", () => {
  const fly = read("app/aircraft/[aircraftId]/fly/page.tsx");

  assert.match(fly, /<AircraftWorkspaceNav/);
  assert.match(fly, /className="shell aircraft-detail flight-shell"/);
  assert.match(fly, /if \(!newShell && noOperationalModules\) notFound\(\)/);
});

test("15.3c checklist presentation fails closed without reviving duplicate Flight Deck tools", () => {
  const deck = read("components/flight-deck.tsx");

  assert.match(deck, /presentation === "checklist"/);
  assert.match(deck, /!checklistOnly && performanceDatasets\.length/);
  assert.match(deck, /!checklistOnly && emergency\?\.scenarios\.length/);
  assert.match(deck, /Checklist unavailable/);
  assert.match(deck, /No source-authoritative operational checklist is available/);
  assert.match(deck, /Flight Deck data unavailable/);
});
