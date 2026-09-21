import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read=(path:string)=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("v2.8 Training exposes authenticated self-service data export and deletion",()=>{
  const page=read("app/account/page.tsx"),controls=read("components/training-data-controls.tsx"),exportRoute=read("app/api/account/export/route.ts"),dataRoute=read("app/api/account/data/route.ts"),accountActions=read("components/account-actions.tsx");
  assert.match(page,/Download Training data/);
  assert.match(page,/Open main FlyTally account settings/);
  assert.match(controls,/DELETE TRAINING DATA/);
  assert.match(exportRoute,/getTrainingSession/);
  assert.match(exportRoute,/private, no-store/);
  assert.match(dataRoute,/isTrustedMutationRequest/);
  assert.match(dataRoute,/DELETE TRAINING DATA/);
  assert.match(dataRoute,/deleteTrainingProgress/);
  assert.match(accountActions,/href="\/account"/);
});

test("v2.8 privacy reset prevents stale offline progress resurrection",()=>{
  const privacy=read("lib/training-privacy.ts"),repository=read("lib/progress-repository.ts");
  assert.match(privacy,/__privacy_reset__/);
  assert.match(privacy,/DELETE FROM training_progress_events/);
  assert.match(privacy,/DELETE FROM training_aircraft_state/);
  assert.match(privacy,/DELETE FROM training_active_flights/);
  assert.match(privacy,/activeFlights/);
  assert.match(repository,/eligible AS/);
  assert.match(repository,/occurred_at::timestamptz > COALESCE/);
  assert.match(repository,/PRIVACY_RESET_AIRCRAFT_ID/);
  assert.match(repository,/FROM eligible x/);
});

test("v2.8 deletion serializes with concurrent progress sync on the same account",()=>{
  const privacy=read("lib/training-privacy.ts"),repository=read("lib/progress-repository.ts"),activeFlight=read("lib/active-flight/store.ts");
  const lock=/pg_advisory_xact_lock\(hashtextextended\(\$\{accountSubject\},\s*0\)\)/;
  assert.match(privacy,lock);
  assert.match(repository,lock);
  assert.match(activeFlight,lock);
  assert.match(repository,/account_guard AS MATERIALIZED/);
  assert.match(repository,/CROSS JOIN account_guard/);
});

test("v2.8 current-device privacy clear removes Training browser persistence",()=>{
  const component=read("components/training-data-controls.tsx");
  assert.match(component,/localStorage\.clear/);
  assert.match(component,/sessionStorage\.clear/);
  assert.match(component,/startsWith\("flytally-"\)/);
  assert.match(component,/getRegistrations/);
  assert.match(component,/registration\.unregister/);
});
