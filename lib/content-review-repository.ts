import "server-only";

import { createDraftVersion } from "./content-admin-repository";
import { assertSourceReferencesBelongToAircraft,getContentVersionForReview } from "./content-governance";

export async function reviseContentVersion(input:{versionId:string;payload:unknown;sourceReferenceIds?:readonly string[]},subject:string):Promise<string>{
  const current=await getContentVersionForReview(input.versionId);
  if(!current)throw new Error("Content version not found.");
  const refs=input.sourceReferenceIds?.length?input.sourceReferenceIds:current.sourceReferenceIds;
  await assertSourceReferencesBelongToAircraft(current.aircraftId,refs);
  return createDraftVersion({aircraftId:current.aircraftId,domain:current.domain,contentKey:current.contentKey,payload:input.payload,origin:"human",sourceReferenceIds:refs},subject);
}
