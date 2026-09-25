import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { learjet35aQrhPackage } from "../aircraft-data/learjet-35a/qrh/package.ts";
import {
  filterAbnormalEmergencyForConfiguration,
  type AircraftConfiguration,
} from "../lib/aircraft-applicability.ts";
import { toOperationalEmergency } from "../lib/operational-flight-data.ts";

const read = (path: string) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("QRH.4 package-level filtering remains fail-closed for unknown installation facts", () => {
  const configuration: AircraftConfiguration = {
    variant: "fc530-standard",
    equipment: new Set<string>(),
  };
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhPackage,
    configuration,
  );
  const ids = new Set(filtered.scenarios.map((scenario) => scenario.id));

  assert.ok(ids.has("door-light"));
  assert.ok(ids.has("starter-assist-airstart-fuel-computer-on"));
  assert.ok(
    filtered.scenarios.some((scenario) => scenario.procedureClass === "abnormal"),
  );

  assert.equal(ids.has("battery-overheat-lights-nicad-only"), false);
  assert.equal(
    ids.has("tr4000-inadvertent-thrust-reverser-deployment-during-flight"),
    false,
  );
  assert.equal(
    ids.has("aeronca-inadvertent-thrust-reverser-deployment-during-flight"),
    false,
  );
});

test("QRH.4 operational projection retains source graphical references without computation", () => {
  const filtered = filterAbnormalEmergencyForConfiguration(
    learjet35aQrhPackage,
    {
      variant: "fc530-standard",
      equipment: new Set<string>(),
    },
  );
  const operational = toOperationalEmergency(filtered);
  const airstart = operational.scenarios.find(
    (scenario) => scenario.id === "starter-assist-airstart-fuel-computer-on",
  );

  assert.ok(airstart);
  assert.deepEqual(
    airstart.figures?.map((figure) => [
      figure.id,
      figure.geometryPolicy,
      figure.sources.map((source) => source.pageLabel),
    ]),
    [
      [
        "airstart-envelope",
        "source-digitized-visual-reference",
        ["E-13"],
      ],
    ],
  );
});

test("QRH.4 presentation explicitly distinguishes Emergency and Abnormal procedures", () => {
  const component = read("components/operational-emergency.tsx");
  const css = read("components/operational-emergency.module.css");

  assert.match(component, /data-procedure-class=\{scenario\.procedureClass\}/);
  assert.match(component, /styles\.emergencyProcedure/);
  assert.match(component, /styles\.abnormalProcedure/);
  assert.match(component, /scenario\.procedureClass\.toUpperCase\(\)/);

  assert.match(css, /\.emergencyProcedure \.classification\{color:var\(--danger-text/);
  assert.match(css, /\.abnormalProcedure\{border-color:var\(--warning-border/);
  assert.match(css, /\.abnormalProcedure \.classification\{color:var\(--warning-text/);
});

test("QRH.4 memory-item emphasis is both visible and machine-identifiable", () => {
  const component = read("components/operational-emergency.tsx");
  const css = read("components/operational-emergency.module.css");

  assert.match(component, /data-memory-item=\{step\.memoryItem \? "true" : undefined\}/);
  assert.match(component, /data-memory-stage=\{stage\.memoryItem \? "true" : undefined\}/);
  assert.match(component, />MEMORY<\/span>/);
  assert.match(css, /\.memoryAction\{background:linear-gradient/);
  assert.match(css, /\.memoryBadge\{/);
  assert.match(css, /\.stage\.immediate\{/);
});

test("QRH.4 mobile collapse observes the actual Fast Path scroll container", () => {
  const panel = read("components/ft-fast-path/FtFastPathPanel.tsx");
  const component = read("components/operational-emergency.tsx");

  assert.match(panel, /data-fast-path-scroll-container="true"/);
  assert.match(
    component,
    /closest<HTMLElement>\(\s*'\[data-fast-path-scroll-container="true"\]'\s*\)/,
  );
  assert.match(component, /fastPathScroller\.scrollTop > originY \+ 170/);
  assert.match(component, /fastPathScroller\.scrollTo\(/);
  assert.match(component, /aria-label="Expand QRH quick access"/);
});

test("QRH.4 source disclosure remains operational-only", () => {
  const component = read("components/operational-emergency.tsx");

  assert.match(component, /Source &amp; authority/);
  assert.match(component, /Current approved aircraft documents remain authoritative/);
  assert.doesNotMatch(
    component,
    /scenario\.setup|scenario\.objectives|scenario\.debrief|stage\.prompt|stage\.explanation/,
  );
});
