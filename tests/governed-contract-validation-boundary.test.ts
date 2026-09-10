import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lifecycle = fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts", import.meta.url), "utf8");
const governance = fs.readFileSync(new URL("../lib/content-governance.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");

function between(source:string,start:string,end:string):string {
  const from=source.indexOf(start);
  const to=source.indexOf(end,from+start.length);
  assert.ok(from>=0 && to>from,`Unable to resolve ${start} boundary.`);
  return source.slice(from,to);
}

test("governed approval owns payload and source-aircraft contract validation", () => {
  const approval = between(lifecycle,"export async function approveGovernedContentVersion","export async function publishGovernedContentVersion");
  const validation = approval.indexOf("assertContentVersionValidForApprovalOrPublication(versionId)");
  const transaction = approval.indexOf("sql.transaction");
  assert.ok(validation>=0 && transaction>validation);
  assert.match(governance,/assertValidContentPayload\(version\.domain,version\.payload,version\.aircraftId\)/);
  assert.match(governance,/assertSourceReferencesBelongToAircraft\(version\.aircraftId,version\.sourceReferenceIds\)/);
});

test("governed publication revalidates the contract instead of trusting an earlier approval", () => {
  const publication = lifecycle.slice(lifecycle.indexOf("export async function publishGovernedContentVersion"));
  const validation = publication.indexOf("assertContentVersionValidForApprovalOrPublication(versionId)");
  const transaction = publication.indexOf("sql.transaction");
  assert.ok(validation>=0 && transaction>validation);
});

test("callers cannot opt out by forgetting an outer validation decorator", () => {
  assert.doesNotMatch(actions,/assertContentVersionValidForApprovalOrPublication/);
  assert.match(actions,/approveGovernedContentVersion/);
  assert.match(actions,/publishGovernedContentVersion/);
  assert.match(bootstrap,/approveGovernedContentVersion/);
  assert.match(bootstrap,/publishGovernedContentVersion/);
  assert.match(lifecycle,/import \{ assertContentVersionValidForApprovalOrPublication \} from "\.\/content-governance"/);
});
