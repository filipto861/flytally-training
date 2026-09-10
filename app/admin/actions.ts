"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAiAssistedDraft } from "@/lib/ai-draft-workflow";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { addAircraftVariant,approveContentVersion,bootstrapStaticContent,createAircraft,createDraftVersion,createSourceReference,ensureContentSchema,publishAircraft,publishContentVersion,registerManualRevision,resolveStaleFlag } from "@/lib/content-admin-repository";
import { parseContentVersionOrigin,trainingContentDomains,type TrainingContentDomain } from "@/lib/content-admin-types";
import { assertContentVersionValidForApprovalOrPublication,assertSourceReferencesBelongToAircraft } from "@/lib/content-governance";
import { reviseContentVersion } from "@/lib/content-review-repository";
import { attachClaimedManualAsset,claimManualAsset,ensureManualAssetSchema,releaseManualAssetClaim } from "@/lib/manual-assets";
import { ensureTrainingProgressSchema } from "@/lib/progress-schema";

const text=(form:FormData,key:string)=>String(form.get(key)??"").trim();
const refs=(form:FormData)=>text(form,"sourceReferenceIds").split(",").map(v=>v.trim()).filter(Boolean);
const payload=(form:FormData)=>{try{return JSON.parse(text(form,"payload"));}catch{throw new Error("Draft payload is not valid JSON.");}};
const domain=(form:FormData):TrainingContentDomain=>{const value=text(form,"domain");if(!(trainingContentDomains as readonly string[]).includes(value))throw new Error("Unsupported content domain.");return value as TrainingContentDomain;};

export async function createAircraftAction(form:FormData){const session=await requireTrainingAdmin();await createAircraft({id:text(form,"id"),manufacturer:text(form,"manufacturer"),model:text(form,"model"),displayName:text(form,"displayName")},session.subject);revalidatePath("/admin");redirect(`/admin/aircraft/${encodeURIComponent(text(form,"id"))}`);}
export async function addVariantAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await addAircraftVariant(aircraftId,text(form,"variant"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function publishAircraftAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await publishAircraft(aircraftId);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function registerRevisionAction(form:FormData){
  const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const revisionId=text(form,"revisionId");const assetId=text(form,"assetId");let claimed:Awaited<ReturnType<typeof claimManualAsset>>|undefined;
  try{
    if(assetId)claimed=await claimManualAsset(aircraftId,assetId,session.subject);
    await registerManualRevision({aircraftId,manualId:text(form,"manualId"),revisionId,title:text(form,"title"),publisher:text(form,"publisher"),sourceKind:text(form,"sourceKind"),revision:text(form,"revision"),issueDate:text(form,"issueDate"),authorityNote:text(form,"authorityNote"),sourceUri:claimed?.blobUrl??text(form,"sourceUri"),checksumSha256:claimed?.checksumSha256??text(form,"checksum")},session.subject);
    if(claimed)await attachClaimedManualAsset(claimed.id,revisionId,session.subject);
  }catch(error){if(claimed)await releaseManualAssetClaim(claimed.id,session.subject).catch(()=>undefined);throw error;}
  revalidatePath(`/admin/aircraft/${aircraftId}`);
}
export async function createReferenceAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await createSourceReference({revisionId:text(form,"revisionId"),chapter:text(form,"chapter"),section:text(form,"section"),pageLabel:text(form,"pageLabel"),note:text(form,"note")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const sourceReferenceIds=refs(form);await assertSourceReferencesBelongToAircraft(aircraftId,sourceReferenceIds);const origin=parseContentVersionOrigin(text(form,"origin"));await createDraftVersion({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",payload:payload(form),origin,sourceReferenceIds},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createAiDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await createAiAssistedDraft({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",sourceReferenceIds:refs(form),sourceText:text(form,"sourceText"),goal:text(form,"goal")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function reviseVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await reviseContentVersion({versionId:text(form,"versionId"),payload:payload(form),sourceReferenceIds:refs(form)},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function approveVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await assertContentVersionValidForApprovalOrPublication(versionId);await approveContentVersion(versionId,session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function publishVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await assertContentVersionValidForApprovalOrPublication(versionId);await publishContentVersion(versionId,session.subject);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function resolveStaleAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await resolveStaleFlag(Number(text(form,"staleId")),session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function initializeTrainingDatabaseAction(){await requireTrainingAdmin();await ensureContentSchema();await Promise.all([ensureTrainingProgressSchema(),ensureManualAssetSchema()]);revalidatePath("/admin");}
export async function bootstrapStaticAction(){const session=await requireTrainingAdmin();await ensureTrainingProgressSchema();await bootstrapStaticContent(session.subject);revalidatePath("/");revalidatePath("/admin");}
