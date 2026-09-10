import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");

test("static seed publication uses the governed transactional lifecycle", () => {
  assert.match(bootstrap, /createGovernedDraftVersion/);
  assert.match(bootstrap, /approveGovernedContentVersion/);
  assert.match(bootstrap, /publishGovernedContentVersion/);
  assert.doesNotMatch(bootstrap, /\bcreateDraftVersion\b/);
  assert.doesNotMatch(bootstrap, /\bapproveContentVersion\b/);
  assert.doesNotMatch(bootstrap, /\bpublishContentVersion\b/);

  const draft = bootstrap.indexOf("await createGovernedDraftVersion");
  const approval = bootstrap.indexOf("await approveGovernedContentVersion");
  const publication = bootstrap.indexOf("await publishGovernedContentVersion");
  assert.ok(draft >= 0 && approval > draft && publication > approval, "seed must draft, then approve, then publish");
});

test("new seed aircraft remains hidden until every canonical domain is published", () => {
  assert.match(bootstrap, /VALUES\(\$\{aircraft\.id\},\$\{aircraft\.manufacturer\},\$\{aircraft\.model\},\$\{aircraft\.displayName\},'draft'\)/);
  const completionCheck = bootstrap.indexOf("COUNT(DISTINCT i.domain)::int AS published_domains");
  const publishAircraft = bootstrap.indexOf("SET status='published',updated_at=NOW()", completionCheck);
  assert.ok(completionCheck >= 0 && publishAircraft > completionCheck, "catalogue publication must follow the complete-domain check");
  assert.match(bootstrap, /trainingContentDomains\.length/);
  assert.match(bootstrap, /aircraft remains hidden from the learner catalogue/);
});

test("admin bootstrap action cannot fall back to the legacy multi-step lifecycle", () => {
  assert.match(actions, /bootstrapStaticContentGoverned/);
  assert.doesNotMatch(actions, /\bbootstrapStaticContent\b/);
  assert.match(actions, /confirmApprovedSeed/);
});

test("bootstrap validates manual and revision ownership before sourcing content", () => {
  assert.match(bootstrap, /Bootstrap manual .* belongs to another aircraft/);
  assert.match(bootstrap, /Bootstrap revision .* belongs to another manual/);
  assert.match(bootstrap, /WHERE manual_id=\$\{manualId\}/);
  assert.match(bootstrap, /WHERE revision_id=\$\{revision\.id\}/);
});
