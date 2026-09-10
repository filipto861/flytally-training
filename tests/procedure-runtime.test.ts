import assert from "node:assert/strict";
import test from "node:test";

import { filterProcedures, listProcedurePhases, procedureSearchText } from "../lib/procedure-runtime.ts";
import type { AircraftProcedure } from "../lib/universal-aircraft-content.ts";

const procedures: readonly AircraftProcedure[] = [
  {
    id: "before-start",
    title: "Before start",
    phase: "Before start",
    summary: "Prepare aircraft electrical power.",
    steps: [{ id: "battery", action: "Select battery ON.", verification: "Bus voltage normal." }],
  },
  {
    id: "landing",
    title: "Normal landing",
    phase: "Landing",
    summary: "Configure for landing.",
    steps: [{ id: "gear", action: "Select landing gear DOWN.", expectedResult: "Gear indicates down and locked." }],
  },
  {
    id: "go-around",
    title: "Go-around",
    phase: "Landing",
    steps: [{ id: "power", action: "Set go-around power.", rationale: "Establish positive energy state." }],
  },
];

test("procedure phase list is derived from aircraft content", () => {
  assert.deepEqual(listProcedurePhases(procedures), ["Before start", "Landing"]);
});

test("procedure search covers title, summary, action and indications", () => {
  assert.match(procedureSearchText(procedures[1]), /down and locked/);
  assert.deepEqual(filterProcedures(procedures, { query: "bus voltage" }).map((item) => item.id), ["before-start"]);
  assert.deepEqual(filterProcedures(procedures, { query: "positive energy" }).map((item) => item.id), ["go-around"]);
});

test("procedure filtering combines search and phase without aircraft assumptions", () => {
  assert.deepEqual(filterProcedures(procedures, { phase: "Landing" }).map((item) => item.id), ["landing", "go-around"]);
  assert.deepEqual(filterProcedures(procedures, { phase: "Landing", query: "gear" }).map((item) => item.id), ["landing"]);
  assert.deepEqual(filterProcedures(procedures, { phase: "Before start", query: "gear" }), []);
});
