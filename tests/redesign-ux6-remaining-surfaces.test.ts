import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UX6.7 redesigns the aircraft Library as an application surface",()=>{
  const page=read("app/page.tsx");
  const css=read("app/library.module.css");

  assert.match(page,/data-ux6-library="true"/);
  assert.match(page,/Your aircraft/);
  assert.match(page,/Open workspace/);
  assert.match(page,/PwaInstallCard/);

  assert.match(css,/--library-accent:\s*#2F6BFF/);
  assert.match(css,/--library-accent:\s*#5B8CFF/);
  assert.match(css,/body\):has\(\.libraryPage\)/);
  assert.match(css,/\.aircraftRow/);
});

test("UX6.7 keeps Aircraft launch state-driven and visually prioritized",()=>{
  const css=read("components/ft-launch/ft-launch.module.css");
  const continueTraining=read("components/ft-launch/FtContinueTraining.tsx");
  const flight=read("components/ft-launch/FtFlightSection.tsx");

  assert.match(css,/\.continueSection\s*\{[\s\S]*grid-template-columns/);
  assert.match(css,/var\(--ft-accent\)/);
  assert.match(continueTraining,/latestTraining/);
  assert.match(continueTraining,/Continue Training/);
  assert.match(flight,/lifecycle === "ACTIVE"/);
});

test("UX6.7 Reference full view is a section-indexed reading workspace",()=>{
  const presentation=read("components/ft-reference/FtReferencePresentation.tsx");
  const css=read("components/ft-reference/ft-reference.module.css");

  assert.match(presentation,/referenceIndex/);
  assert.match(presentation,/Reference sections/);
  assert.match(presentation,/groupSources/);
  assert.match(css,/\.fullLayout\s*\{[\s\S]*grid-template-columns/);
  assert.match(css,/\.referenceIndex\s*\{[\s\S]*position:\s*sticky/);
});

test("UX6.7 Systems missing content fails closed inside the new shell",()=>{
  const route=read("app/aircraft/[aircraftId]/systems/page.tsx");
  const unavailable=read("components/ft-systems/FtSystemsUnavailable.tsx");

  assert.match(route,/if \(isNewShellEnabled\(\)\)/);
  assert.match(route,/if \(!configuredUniversal\)/);
  assert.match(route,/<FtSystemsUnavailable/);
  assert.match(unavailable,/No published Systems package/);
  assert.match(unavailable,/Nothing is inferred or substituted/);
  assert.match(unavailable,/data-content-state="unavailable"/);
});

test("UX6.7 Training keeps learning hierarchy without changing scenario runtime",()=>{
  const page=read("components/ft-training/FtTrainingPage.tsx");
  const css=read("components/ft-training/ft-training.module.css");

  assert.match(page,/START HERE/);
  assert.match(page,/STUDY/);
  assert.match(page,/APPLY/);
  assert.match(page,/ScenarioTrainer/);
  assert.match(css,/\.section:first-of-type/);
  assert.match(css,/var\(--ft-accent\)/);
});

test("UX6.7 workspace surface CSS stays on approved semantic tokens",()=>{
  for(const path of [
    "components/ft-launch/ft-launch.module.css",
    "components/ft-reference/ft-reference.module.css",
    "components/ft-systems/ft-systems.module.css",
    "components/ft-training/ft-training.module.css",
  ]){
    const css=read(path);
    assert.doesNotMatch(css,/--ft-accent-primary|--ft-focus-color|--ft-radius-control/);
    assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  }
});
