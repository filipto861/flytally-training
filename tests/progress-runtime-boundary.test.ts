import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository = fs.readFileSync(new URL("../lib/progress-repository.ts", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("../lib/progress-schema.ts", import.meta.url), "utf8");
const adminActions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const readiness = fs.readFileSync(new URL("../app/api/readiness/route.ts", import.meta.url), "utf8");

test("learner progress repository performs no schema DDL", () => {
  assert.doesNotMatch(repository, /CREATE\s+TABLE|CREATE\s+INDEX/i);
  assert.doesNotMatch(repository, /ensureTrainingProgressSchema|progress-schema/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS training_progress_events/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS training_aircraft_state/);
});

test("progress sync batches event ingestion instead of sequential INSERT loops", () => {
  assert.match(repository, /jsonb_to_recordset/);
  assert.doesNotMatch(repository, /for\s*\(const event of events\)[\s\S]{0,500}await sql`INSERT INTO training_progress_events/);
});

test("a multi-aircraft sync updates learning state for every aircraft in the batch", () => {
  assert.match(repository, /latestEventsByAircraft/);
  assert.match(repository, /FROM jsonb_to_recordset\(\$\{stateRows\}/);
  assert.match(repository, /ON CONFLICT\(account_subject,aircraft_id\) DO UPDATE/);
});

test("progress schema initialization is explicit admin/bootstrap work and part of readiness", () => {
  assert.match(adminActions, /initializeTrainingDatabaseAction/);
  assert.match(adminActions, /ensureTrainingProgressSchema/);
  assert.match(readiness, /progressPersistence/);
  assert.match(readiness, /training_progress_events/);
  assert.match(readiness, /training_aircraft_state/);
});
