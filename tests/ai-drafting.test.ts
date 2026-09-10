import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getDomainDraftingGuidance } from "../lib/content-drafting-provider.ts";

const provider=fs.readFileSync(new URL("../lib/openai-content-drafting.ts",import.meta.url),"utf8");
const workflow=fs.readFileSync(new URL("../lib/ai-draft-workflow.ts",import.meta.url),"utf8");
const lifecycle=fs.readFileSync(new URL("../lib/content-governed-lifecycle.ts",import.meta.url),"utf8");
const schema=fs.readFileSync(new URL("../lib/ai-draft-schema.ts",import.meta.url),"utf8");
const actions=fs.readFileSync(new URL("../app/admin/actions.ts",import.meta.url),"utf8");
const env=fs.readFileSync(new URL("../.env.example",import.meta.url),"utf8");

test("every publishable product domain has AI drafting guidance",()=>{
  for(const domain of ["learning","normal-flight","orientation","abnormal","reference-knowledge"] as const)assert.ok(getDomainDraftingGuidance(domain).length>40,domain);
});

test("OpenAI drafting uses Responses structured output without provider-side persistence",()=>{
  assert.match(provider,/api\.openai\.com\/v1\/responses/);
  assert.match(provider,/json_schema/);
  assert.match(provider,/store:false/);
  assert.match(env,/TRAINING_DRAFTING_MODEL=gpt-5\.6-terra/);
});

test("AI workflow can create a governed draft but has no approval or publication capability",()=>{
  assert.match(workflow,/createGovernedDraftVersion/);
  assert.doesNotMatch(workflow,/approveGovernedContentVersion|publishGovernedContentVersion|training_content_approvals|training_content_publications/);
});

test("AI draft and immutable audit record share the governed transaction",()=>{
  assert.match(workflow,/sourceTextSha256:createHash/);
  assert.match(workflow,/aiAudit:/);
  assert.match(lifecycle,/INSERT INTO training_ai_draft_runs/);
  assert.match(lifecycle,/AI-assisted drafts require immutable audit metadata/);
  assert.match(lifecycle,/v\.origin<>'ai-assisted'.*training_ai_draft_runs/s);
});

test("AI drafting performs no runtime schema DDL and schema initialization is explicit",()=>{
  assert.doesNotMatch(workflow,/CREATE TABLE|CREATE INDEX|ALTER TABLE/);
  assert.match(schema,/CREATE TABLE IF NOT EXISTS training_ai_draft_runs/);
  assert.match(schema,/CREATE UNIQUE INDEX IF NOT EXISTS idx_training_ai_draft_runs_version/);
  assert.match(actions,/ensureTrainingAiDraftSchema/);
});
