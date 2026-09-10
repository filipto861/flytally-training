import "server-only";

import { createHash } from "node:crypto";
import type { TrainingContentDomain } from "./content-admin-types";
import type { DraftingSourceReference } from "./content-drafting-provider";
import { assertSourceReferencesBelongToAircraft } from "./content-governance";
import { createGovernedDraftVersion } from "./content-governed-lifecycle";
import { sql } from "./db";
import { getContentDraftingProvider } from "./openai-content-drafting";

async function sourceContext(aircraftId:string,referenceIds:readonly string[]):Promise<DraftingSourceReference[]>{
  await assertSourceReferencesBelongToAircraft(aircraftId,referenceIds);
  const rows=await sql`SELECT sr.reference_id,sr.chapter,sr.section,sr.page_label,sr.note FROM training_source_references sr JOIN training_manual_revisions r ON r.revision_id=sr.revision_id JOIN training_manuals m ON m.manual_id=r.manual_id WHERE m.aircraft_id=${aircraftId}` as Array<{reference_id:string;chapter:string|null;section:string|null;page_label:string;note:string|null}>;
  const wanted=new Set(referenceIds);
  return rows.filter(row=>wanted.has(row.reference_id)).map(row=>({id:row.reference_id,chapter:row.chapter??undefined,section:row.section??undefined,pageLabel:row.page_label,note:row.note??undefined}));
}

export type AiDraftRunSummary={provider:string;model:string;responseId?:string;warnings:readonly string[];createdAt:string};
export async function getAiDraftRunForVersion(versionId:string):Promise<AiDraftRunSummary|undefined>{
  const rows=await sql`SELECT provider,model,provider_response_id,warnings,created_at FROM training_ai_draft_runs WHERE version_id=${versionId} ORDER BY created_at DESC LIMIT 1` as Array<{provider:string;model:string;provider_response_id:string|null;warnings:unknown;created_at:string|Date}>;
  const row=rows[0];if(!row)return undefined;const warnings=Array.isArray(row.warnings)?row.warnings.filter((item):item is string=>typeof item==="string"):[];
  return {provider:row.provider,model:row.model,responseId:row.provider_response_id??undefined,warnings,createdAt:new Date(row.created_at).toISOString()};
}

export async function createAiAssistedDraft(input:{aircraftId:string;domain:TrainingContentDomain;contentKey:string;sourceReferenceIds:readonly string[];sourceText:string;goal:string},subject:string):Promise<string>{
  const sourceText=input.sourceText.trim();if(sourceText.length<20)throw new Error("Provide a meaningful source excerpt for AI drafting.");if(sourceText.length>120000)throw new Error("Source excerpt is too large; split it into smaller governed drafting passes.");
  const goal=input.goal.trim();if(!goal||goal.length>2000)throw new Error("Provide a concise drafting goal (maximum 2000 characters).");
  const references=await sourceContext(input.aircraftId,input.sourceReferenceIds);
  const result=await getContentDraftingProvider().createDraft({aircraftId:input.aircraftId,domain:input.domain,contentKey:input.contentKey,goal,sourceText,sourceReferences:references});
  const allowed=new Set(references.map(reference=>reference.id));
  const unsupportedCoverage=result.sourceCoverage.filter(id=>!allowed.has(id));if(unsupportedCoverage.length)throw new Error(`AI draft cited source references outside the selected set: ${unsupportedCoverage.join(", ")}`);
  const draft={...result.draft};
  if(draft.aircraftId===undefined)draft.aircraftId=input.aircraftId;
  if(draft.aircraftId!==input.aircraftId)throw new Error("AI draft returned a mismatched aircraftId.");
  const warnings=[...result.warnings,...references.filter(reference=>!result.sourceCoverage.includes(reference.id)).map(reference=>`Selected source ${reference.id} was not reported in AI source coverage.`)];
  return createGovernedDraftVersion({
    aircraftId:input.aircraftId,
    domain:input.domain,
    contentKey:input.contentKey||"bundle",
    payload:draft,
    origin:"ai-assisted",
    sourceReferenceIds:input.sourceReferenceIds,
    aiAudit:{
      provider:result.provider,
      model:result.model,
      responseId:result.responseId,
      sourceTextSha256:createHash("sha256").update(sourceText,"utf8").digest("hex"),
      sourceTextChars:sourceText.length,
      warnings,
    },
  },subject);
}
