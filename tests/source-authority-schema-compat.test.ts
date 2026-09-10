import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository = fs.readFileSync(new URL("../lib/postgres-content-repository.ts", import.meta.url), "utf8");
const adminRepository = fs.readFileSync(new URL("../lib/content-admin-repository.ts", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("../lib/source-authority-schema.ts", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../lib/database-bootstrap.ts", import.meta.url), "utf8");

test("learner and admin reads tolerate a pre-M9 database until explicit bootstrap runs", () => {
  assert.match(repository, /to_jsonb\(r\)->>'authority_role'/);
  assert.doesNotMatch(repository, /m\.source_kind,r\.authority_role,r\.authority_note/);
  assert.match(adminRepository, /to_jsonb\(r\)->>'authority_role'/);
  assert.doesNotMatch(adminRepository, /m\.source_kind,r\.authority_role,r\.source_uri/);
});

test("explicit bootstrap upgrades and verifies the closed source-authority schema", () => {
  assert.match(schema, /ADD COLUMN IF NOT EXISTS authority_role/);
  assert.match(schema, /ADD CONSTRAINT training_manual_revisions_authority_role_check/);
  for (const role of ["CONTROLLING", "OPERATING_REFERENCE", "TRAINING_REFERENCE", "SIMULATOR_IMPLEMENTATION", "SIMULATOR_WORKFLOW", "UNCLASSIFIED"]) {
    assert.match(schema, new RegExp(role));
  }
  assert.match(schema, /has_column/);
  assert.match(schema, /has_constraint/);
  assert.match(bootstrap, /await ensureSourceAuthoritySchema\(\)/);
});
