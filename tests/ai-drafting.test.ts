import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getDomainDraftingGuidance } from "../lib/content-drafting-provider.ts";

const provider=fs.readFileSync(new URL("../lib/openai-content-drafting.ts",import.meta.url),"utf8");
const workflow=fs.readFileSync(new URL("../lib/ai-draft-workflow.ts",import.meta.url),"utf8");
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

test("AI workflow can create a draft but has no approval or publication capability",()=>{
  assert.match(workflow,/createDraftVersion/);
  assert.doesNotMatch(workflow,/approveContentVersion|publishContentVersion|training_content_approvals|training_content_publications/);
});

test("AI workflow binds selected references to the aircraft and audits the run",()=>{
  assert.match(workflow,/assertSourceReferencesBelongToAircraft/);
  assert.match(workflow,/training_ai_draft_runs/);
  assert.match(workflow,/source_text_sha256/);
});
