import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bootstrap = fs.readFileSync(new URL("../lib/governed-static-bootstrap.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
const aircraftPublication = fs.readFileSync(new URL("../lib/aircraft-publication.ts", import.meta.url), "utf8");

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

test("new seed aircraft remains hidden until the shared catalogue policy accepts it", () => {
  assert.match(bootstrap, /VALUES\(\$\{aircraft\.id\},\$\{aircraft\.manufacturer\},\$\{aircraft\.model\},\$\{aircraft\.displayName\},'draft'\)/);
  assert.match(bootstrap, /import \{ publishGovernedAircraft \} from "\.\/aircraft-publication"/);
  assert.match(bootstrap, /await publishGovernedAircraft\(aircraft\.id\)/);
  assert.doesNotMatch(bootstrap, /SET status='published'/);
  assert.doesNotMatch(bootstrap, /COUNT\(DISTINCT i\.domain\)::int AS published_domains/);
  assert.match(aircraftPublication, /e\.has_manual/);
  assert.match(aircraftPublication, /e\.has_training_content/);
  assert.match(aircraftPublication, /i\.domain<>'orientation'/);
  assert.doesNotMatch(aircraftPublication, /trainingContentDomains\.length/);
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
