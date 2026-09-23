import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../components/product-shell.tsx", import.meta.url), "utf8");
const home = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

const learnerFacingProductCopy = [layout, shell, home].join("\n");

test("primary product copy is aircraft-training first rather than simulator-mode first", () => {
  assert.doesNotMatch(learnerFacingProductCopy, /simulator-first|simulator familiarization|start cold\s*&\s*dark/i);
  assert.match(layout, /Source-backed aircraft training/);
  assert.match(shell, /current approved aircraft, operator and regulatory documents remain authoritative/i);
  assert.match(home, /Select an aircraft to open its training workspace/);
  assert.match(home, /aria-label="Training aircraft"/);
});

test("aircraft library no longer depends on the legacy normal-flight bundle for availability copy", () => {
  assert.match(home, /repository\.listAircraft\(\)/);
  assert.doesNotMatch(home, /getNormalFlight/);
  assert.doesNotMatch(home, /First Flight available|Content in progress/);
  assert.match(home, /className=\{styles\.available\}>Available/);
});
