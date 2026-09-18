"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAiAssistedDraft } from "@/lib/ai-draft-workflow";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { publishGovernedAircraft } from "@/lib/aircraft-publication";
import { isModernStructuredDomain } from "@/lib/content-authoring-templates";
import { addAircraftVariant,createAircraft,createSourceReference,getAdminAircraft,resolveStaleFlag,setAircraftCommonEquipment,updateAircraftProfile,upsertAircraftVariant } from "@/lib/content-admin-repository";
import { parseContentVersionOrigin,trainingContentDomains,type TrainingContentDomain } from "@/lib/content-admin-types";
import { approveGovernedContentVersion,createGovernedDraftVersion,publishGovernedContentVersion } from "@/lib/content-governed-lifecycle";
import { initializeTrainingDatabase } from "@/lib/database-bootstrap";
import { bootstrapStaticContentGoverned,publishStaticNativeModuleUpgrade } from "@/lib/governed-static-bootstrap";
import { registerGovernedManualRevision } from "@/lib/governed-manual-registration";
import { reSourceContentVersion,reviseContentVersion } from "@/lib/content-review-repository";
import { parseSourceAuthorityRole } from "@/lib/source-authority";
import { parseSourceRecordEvidence } from "@/lib/source-record-input";

const text=(form:FormData,key:string)=>String(form.get(key)??"").trim();
const selected=(form:FormData,key:string)=>form.getAll(key).map(value=>String(value).trim()).filter(Boolean);
const refs=(form:FormData)=>[...new Set([...selected(form,"sourceReferenceId"),...text(form,"sourceReferenceIds").split(",").map(v=>v.trim()).filter(Boolean)])];
const fingerprintRefs=(form:FormData)=>selected(form,"fingerprintSourceReferenceId");
const equipmentTags=(form:FormData)=>[...new Set(text(form,"equipmentTags").split(/[\n,]/).map(value=>value.trim()).filter(Boolean))];
const payload=(form:FormData)=>{try{return JSON.parse(text(form,"payload"));}catch{throw new Error("Draft payload is not valid JSON.");}};
const domain=(form:FormData):TrainingContentDomain=>{const value=text(form,"domain");if(!(trainingContentDomains as readonly string[]).includes(value))throw new Error("Unsupported content domain.");return value as TrainingContentDomain;};
const refreshAircraftAdmin=(aircraftId:string)=>{
  for(const path of ["", "/content", "/sources", "/review", "/settings", "/onboarding"])revalidatePath(`/admin/aircraft/${aircraftId}${path}`);
  revalidatePath("/admin");
};
const refreshAircraftRuntime=(aircraftId:string)=>{
  revalidatePath("/");
  revalidatePath(`/aircraft/${aircraftId}`,"layout");
};

export async function createAircraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"id");await createAircraft({id:aircraftId,manufacturer:text(form,"manufacturer"),model:text(form,"model"),displayName:text(form,"displayName")},session.subject);revalidatePath("/admin");redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/onboarding`);}
export async function updateAircraftProfileAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await updateAircraftProfile(aircraftId,{manufacturer:text(form,"manufacturer"),model:text(form,"model"),displayName:text(form,"displayName")});refreshAircraftAdmin(aircraftId);refreshAircraftRuntime(aircraftId);}
export async function addVariantAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await addAircraftVariant(aircraftId,text(form,"variant"));refreshAircraftAdmin(aircraftId);refreshAircraftRuntime(aircraftId);}
export async function saveCommonEquipmentAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await setAircraftCommonEquipment(aircraftId,equipmentTags(form));refreshAircraftAdmin(aircraftId);refreshAircraftRuntime(aircraftId);}
export async function saveVariantProfileAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await upsertAircraftVariant(aircraftId,{key:text(form,"variantKey"),displayName:text(form,"variantDisplayName"),equipmentTags:equipmentTags(form),note:text(form,"variantNote")||undefined});refreshAircraftAdmin(aircraftId);refreshAircraftRuntime(aircraftId);}
export async function publishAircraftAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await publishGovernedAircraft(aircraftId);refreshAircraftRuntime(aircraftId);refreshAircraftAdmin(aircraftId);}
export async function registerRevisionAction(form:FormData){
  const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const requestedManualId=text(form,"manualId");
  let manualId=requestedManualId||randomUUID();let title=text(form,"title");let publisher=text(form,"publisher");let sourceKind=text(form,"sourceKind");
  if(requestedManualId){
    const aircraft=await getAdminAircraft(aircraftId);const existing=aircraft?.manuals.find(manual=>manual.manualId===requestedManualId);
    if(!existing)throw new Error("Selected source family does not belong to this aircraft.");
    manualId=existing.manualId;title=existing.title;publisher=existing.publisher;sourceKind=existing.sourceKind;
  }
  const evidence=parseSourceRecordEvidence({sourceOriginalName:text(form,"sourceOriginalName"),sourceSizeBytes:text(form,"sourceSizeBytes"),localChecksum:text(form,"localChecksum"),sourceUri:text(form,"sourceUri"),externalChecksum:text(form,"externalChecksum")});
  await registerGovernedManualRevision({aircraftId,manualId,revisionId:randomUUID(),title,publisher,sourceKind,revision:text(form,"revision"),issueDate:text(form,"issueDate"),authorityRole:parseSourceAuthorityRole(text(form,"authorityRole")),authorityNote:text(form,"authorityNote"),sourceUri:evidence.sourceUri,checksumSha256:evidence.checksumSha256,sourceMetadata:evidence.sourceMetadata},session.subject);
  refreshAircraftAdmin(aircraftId);
}
export async function createReferenceAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await createSourceReference({revisionId:text(form,"revisionId"),chapter:text(form,"chapter"),section:text(form,"section"),pageLabel:text(form,"pageLabel"),note:text(form,"note")},session.subject);refreshAircraftAdmin(aircraftId);}
export async function createDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const origin=parseContentVersionOrigin(text(form,"origin"));await createGovernedDraftVersion({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",payload:payload(form),origin,sourceReferenceIds:refs(form)},session.subject);refreshAircraftAdmin(aircraftId);}
export async function createStructuredDraftAction(form:FormData){
  const session=await requireTrainingAdmin();
  const aircraftId=text(form,"aircraftId");
  const selectedDomain=domain(form);
  if(!isModernStructuredDomain(selectedDomain))throw new Error("Structured new-module authoring is available only for modern universal content domains.");
  const versionId=await createGovernedDraftVersion({aircraftId,domain:selectedDomain,contentKey:text(form,"contentKey")||"bundle",payload:payload(form),origin:"human",sourceReferenceIds:refs(form)},session.subject);
  refreshAircraftAdmin(aircraftId);
  redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);
}
export async function createAiDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await createAiAssistedDraft({aircraftId,domain:domain(form),contentKey:text(form,"contentKey")||"bundle",sourceReferenceIds:refs(form),sourceText:text(form,"sourceText"),goal:text(form,"goal")},session.subject);refreshAircraftAdmin(aircraftId);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function reviseVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=await reviseContentVersion({versionId:text(form,"versionId"),payload:payload(form),sourceReferenceIds:refs(form)},session.subject);refreshAircraftAdmin(aircraftId);redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);}
export async function reSourceVersionAction(form:FormData){
  const session=await requireTrainingAdmin();
  const result=await reSourceContentVersion({versionId:text(form,"versionId"),sourceReferenceIds:fingerprintRefs(form)},session.subject);
  refreshAircraftAdmin(result.aircraftId);
  redirect(`/admin/aircraft/${encodeURIComponent(result.aircraftId)}/content/${encodeURIComponent(result.versionId)}`);
}
export async function approveVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await approveGovernedContentVersion(versionId,session.subject,text(form,"note"));refreshAircraftAdmin(aircraftId);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function publishVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");const versionId=text(form,"versionId");await publishGovernedContentVersion(versionId,session.subject);refreshAircraftRuntime(aircraftId);refreshAircraftAdmin(aircraftId);revalidatePath(`/admin/aircraft/${aircraftId}/content/${versionId}`);}
export async function resolveStaleAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await resolveStaleFlag(Number(text(form,"staleId")),session.subject,text(form,"note"));refreshAircraftAdmin(aircraftId);}
export async function initializeTrainingDatabaseAction(){await requireTrainingAdmin();await initializeTrainingDatabase();revalidatePath("/admin");}
export async function bootstrapStaticAction(form:FormData){
  const session=await requireTrainingAdmin();
  if(text(form,"confirmApprovedSeed")!=="yes")throw new Error("Explicit administrator confirmation is required before the current source-backed training seed can be approved and published.");
  await initializeTrainingDatabase();
  await bootstrapStaticContentGoverned(session.subject);
  revalidatePath("/");
  revalidatePath("/admin");
}
export async function publishNativeModuleUpgradeAction(form:FormData){
  const session=await requireTrainingAdmin();
  if(text(form,"confirmReviewedNativeUpgrade")!=="yes")throw new Error("Explicit administrator confirmation is required before a reviewed native module upgrade can be approved and published.");
  const aircraftId=text(form,"aircraftId");
  const selectedDomain=domain(form);
  const versionId=await publishStaticNativeModuleUpgrade(aircraftId,selectedDomain,session.subject);
  refreshAircraftRuntime(aircraftId);
  revalidatePath(`/aircraft/${aircraftId}/${selectedDomain}`);
  refreshAircraftAdmin(aircraftId);
  redirect(`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/${encodeURIComponent(versionId)}`);
}
