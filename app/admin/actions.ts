"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAiAssistedDraft } from "@/lib/ai-draft-workflow";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { publishGovernedAircraft } from "@/lib/aircraft-publication";
import { addAircraftVariant,createAircraft,createSourceReference,resolveStaleFlag } from "@/lib/content-admin-repository";
import { parseContentVersionOrigin,trainingContentDomains,type TrainingContentDomain } from "@/lib/content-admin-types";
import { assertContentVersionValidForApprovalOrPublication } from "@/lib/content-governance";
import { approveGovernedContentVersion,createGovernedDraftVersion,publishGovernedContentVersion } from "@/lib/content-governed-lifecycle";
import { initializeTrainingDatabase } from "@/lib/database-bootstrap";
import { bootstrapStaticContentGoverned } from "@/lib/governed-static-bootstrap";
import { registerGovernedManualRevision } from "@/lib/governed-manual-registration";
import { reSourceContentVersion,reviseContentVersion } from "@/lib/content-review-repository";

const text=(form:FormData,key:string)=>String(form.get(key)??"").trim();
const refs=(form:FormData)=>text(form,"sourceReferenceIds").split(",").map(v=>v.trim()).filter(Boolean);
const controlledRefs=(form:FormData)=>form.getAll("controlledSourceReferenceId").map(value=>String(value).trim()).filter(Boolean);
const payload=(form:FormData)=>{try{return JSON.parse(text(form,"payload"));}catch{throw new Error("Draft payload is not valid JSON.");}};
const domain=(form:FormData):TrainingContentDomain=>{const value=text(form,"domain");if(!(trainingContentDomains as readonly string[]).includes(value))throw new Error("Unsupported content domain.");return value as TrainingContentDomain;};

export async function createAircraftAction(form:FormData){const session=await requireTrainingAdmin();await createAircraft({id:text(form,"id"),manufacturer:text(form,"manufacturer"),model:text(form,"model"),displayName:text(form,"displayName")},session.subject);revalidatePath("/admin");redirect(`/admin/aircraft/${encodeURIComponent(text(form,"id"))}`);}
export async function addVariantAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await addAircraftVariant(aircraftId,text(form,"variant"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function publishAircraftAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await publishGovernedAircraft(aircraftId);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function registerRevisionAction(form:FormData){
  const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");
  await registerGovernedManualRevision({aircraftId,manualId:text(form,"manualId"),revisionId:text(form,"revisionId"),title:text(form,"title"),publisher:text(form,"publisher"),sourceKind:text(form,"sourceKind"),revision:text(form,"revision"),issueDate:text(form,"issueDate"),authorityNote:text(form,"authorityNote"),sourceUri:text(form,"sourceUri"),checksumSha256:text(form,"checksum"),assetId:text(form,"assetId")||undefined},session.subject);
  revalidatePath(`/admin/aircraft/${aircraftId}`);
}
export async function createReferenceAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await createSourceReference({revisionId:text(form,"revisionId"),chapter:text(form,"chapter"),section:text(form,"section"),pageLabel:text(form,"pageLabel"),note:text(form,"note")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const origin=parseContentVersionOrigin(text(form,"origin"));await createGovernedDraftVersion({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",payload:payload(form),origin,sourceReferenceIds:refs(form)},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createAiDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await createAiAssistedDraft({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",sourceReferenceIds:refs(form),sourceText:text(form,"sourceText"),goal:text(form,"goal")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function reviseVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await reviseContentVersion({versionId:text(form,"versionId"),payload:payload(form),sourceReferenceIds:refs(form)},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function reSourceVersionAction(form:FormData){
  const session=await requireTrainingAdmin();
  const result=await reSourceContentVersion({versionId:text(form,"versionId"),sourceReferenceIds:controlledRefs(form)},session.subject);
  revalidatePath(`/admin/aircraft/${result.aircraftId}`);
  redirect(`/admin/aircraft/${encodeURIComponent(result.aircraftId)}/content/${encodeURIComponent(result.versionId)}`);
}
export async function approveVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await assertContentVersionValidForApprovalOrPublication(versionId);await approveGovernedContentVersion(versionId,session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function publishVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await assertContentVersionValidForApprovalOrPublication(versionId);await publishGovernedContentVersion(versionId,session.subject);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function resolveStaleAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await resolveStaleFlag(Number(text(form,"staleId")),session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function initializeTrainingDatabaseAction(){await requireTrainingAdmin();await initializeTrainingDatabase();revalidatePath("/admin");}
export async function bootstrapStaticAction(form:FormData){
  const session=await requireTrainingAdmin();
  if(text(form,"confirmApprovedSeed")!=="yes")throw new Error("Explicit administrator confirmation is required before the static v1 seed can be approved and published.");
  await initializeTrainingDatabase();
  await bootstrapStaticContentGoverned(session.subject);
  revalidatePath("/");
  revalidatePath("/admin");
}
