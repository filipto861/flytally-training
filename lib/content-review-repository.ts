import "server-only";

import { assertSourceReferencesBelongToAircraft,getContentVersionForReview } from "./content-governance";
import { createGovernedDraftVersion } from "./content-governed-lifecycle";

export async function reviseContentVersion(input:{versionId:string;payload:unknown;sourceReferenceIds?:readonly string[]},subject:string):Promise<string>{
  const current=await getContentVersionForReview(input.versionId);
  if(!current)throw new Error("Content version not found.");
  const refs=input.sourceReferenceIds?.length?input.sourceReferenceIds:current.sourceReferenceIds;
  await assertSourceReferencesBelongToAircraft(current.aircraftId,refs);
  return createGovernedDraftVersion({aircraftId:current.aircraftId,domain:current.domain,contentKey:current.contentKey,payload:input.payload,origin:"human",sourceReferenceIds:refs},subject);
}
