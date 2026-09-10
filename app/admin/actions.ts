"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { addAircraftVariant,approveContentVersion,bootstrapStaticContent,createAircraft,createDraftVersion,createSourceReference,publishAircraft,publishContentVersion,registerManualRevision,resolveStaleFlag } from "@/lib/content-admin-repository";
import type { ContentVersionOrigin } from "@/lib/content-admin-types";

const text=(form:FormData,key:string)=>String(form.get(key)??"").trim();

export async function createAircraftAction(form:FormData){const session=await requireTrainingAdmin();await createAircraft({id:text(form,"id"),manufacturer:text(form,"manufacturer"),model:text(form,"model"),displayName:text(form,"displayName")},session.subject);revalidatePath("/admin");redirect(`/admin/aircraft/${encodeURIComponent(text(form,"id"))}`);}
export async function addVariantAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await addAircraftVariant(aircraftId,text(form,"variant"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function publishAircraftAction(form:FormData){await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await publishAircraft(aircraftId);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function registerRevisionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await registerManualRevision({aircraftId,manualId:text(form,"manualId"),revisionId:text(form,"revisionId"),title:text(form,"title"),publisher:text(form,"publisher"),sourceKind:text(form,"sourceKind"),revision:text(form,"revision"),issueDate:text(form,"issueDate"),authorityNote:text(form,"authorityNote"),sourceUri:text(form,"sourceUri"),checksumSha256:text(form,"checksum")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createReferenceAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await createSourceReference({revisionId:text(form,"revisionId"),chapter:text(form,"chapter"),section:text(form,"section"),pageLabel:text(form,"pageLabel"),note:text(form,"note")},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function createDraftAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");let payload:unknown;try{payload=JSON.parse(text(form,"payload"));}catch{throw new Error("Draft payload is not valid JSON.");}const refs=text(form,"sourceReferenceIds").split(",").map(v=>v.trim()).filter(Boolean);const origin=text(form,"origin") as ContentVersionOrigin;await createDraftVersion({aircraftId,domain:text(form,"domain"),contentKey:text(form,"contentKey")||"bundle",payload,origin,sourceReferenceIds:refs},session.subject);revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function approveVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await approveContentVersion(text(form,"versionId"),session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function publishVersionAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await publishContentVersion(text(form,"versionId"),session.subject);revalidatePath("/");revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function resolveStaleAction(form:FormData){const session=await requireTrainingAdmin();const aircraftId=text(form,"aircraftId");await resolveStaleFlag(Number(text(form,"staleId")),session.subject,text(form,"note"));revalidatePath(`/admin/aircraft/${aircraftId}`);}
export async function bootstrapStaticAction(){const session=await requireTrainingAdmin();await bootstrapStaticContent(session.subject);revalidatePath("/");revalidatePath("/admin");}
