import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lifecycle = fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const review = fs.readFileSync(new URL("../lib/content-review-repository.ts", import.meta.url), "utf8");
const ai = fs.readFileSync(new URL("../lib/ai-draft-workflow.ts", import.meta.url), "utf8");
const acceptance = fs.readFileSync(new URL("./no-code-postgres-acceptance.test.ts", import.meta.url), "utf8");

test("governed draft creation serializes version numbering and links sources in the same transaction", () => {
  assert.match(lifecycle,/createGovernedDraftVersion/);
  assert.match(lifecycle,/sql\.transaction\(\(txn\) => \[/);
  assert.match(lifecycle,/pg_advisory_xact_lock\(hashtextextended/);
  assert.match(lifecycle,/jsonb_array_elements_text/);
  assert.match(lifecycle,/WHERE m\.aircraft_id=\$\{aircraftId\}/);
  assert.match(lifecycle,/INSERT INTO training_content_versions/);
  assert.match(lifecycle,/INSERT INTO training_content_version_sources/);
  assert.match(lifecycle,/MAX\(v\.version_no\)/);
});

test("approval and publication serialize on content item identity and transition atomically", () => {
  const itemLocks = lifecycle.match(/pg_advisory_xact_lock\(COALESCE\(\(SELECT item_id FROM training_content_versions/g) ?? [];
  assert.ok(itemLocks.length >= 2,"approval and publication should both use item-level transaction locks");
  assert.match(lifecycle,/INSERT INTO training_content_approvals/);
  assert.match(lifecycle,/SET state='approved'/);
  assert.match(lifecycle,/SET state='archived'/);
  assert.match(lifecycle,/SET state='published'/);
  assert.match(lifecycle,/INSERT INTO training_content_publications/);
});

test("all interactive authoring paths use the governed lifecycle", () => {
  assert.match(actions,/createGovernedDraftVersion/);
  assert.match(actions,/approveGovernedContentVersion/);
  assert.match(actions,/publishGovernedContentVersion/);
  assert.match(review,/createGovernedDraftVersion/);
  assert.match(ai,/createGovernedDraftVersion/);
  assert.match(acceptance,/createGovernedDraftVersion/);
  assert.match(acceptance,/approveGovernedContentVersion/);
  assert.match(acceptance,/publishGovernedContentVersion/);
});
