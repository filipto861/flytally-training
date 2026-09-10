import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { getContentVersionForReview } from "@/lib/content-governance";
import { approveVersionAction,publishVersionAction,reviseVersionAction } from "../../../../actions";

export const dynamic="force-dynamic";

export default async function ContentReviewPage({params}:Readonly<{params:Promise<{aircraftId:string;versionId:string}>}>){
  await requireTrainingAdmin();const {aircraftId,versionId}=await params;const version=await getContentVersionForReview(versionId);if(!version||version.aircraftId!==aircraftId)notFound();
  return <main className="shell aircraft-detail"><Link className="back-link" href={`/admin/aircraft/${aircraftId}`}>← {aircraftId} content</Link>
    <section className="workspace-section-hero"><p className="eyebrow">{version.domain}/{version.contentKey} · v{version.versionNo}</p><h1>Review immutable content version</h1><p className="lede">State {version.state} · origin {version.origin}. Editing creates a new draft version; this record is never overwritten.</p></section>
    <section className="reference-library"><h2>Publication contract</h2>{version.validationErrors.length?<><p>This version cannot be approved or published yet:</p><ul>{version.validationErrors.map(error=><li key={error}>{error}</li>)}</ul></>:<p>Payload matches the {version.domain} product contract for aircraft {aircraftId}.</p>}<p><strong>Source references:</strong> {version.sourceReferenceIds.join(", ")}</p></section>
    <section className="reference-library"><h2>Review / edit as new version</h2><form action={reviseVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><p><input name="sourceReferenceIds" defaultValue={version.sourceReferenceIds.join(", ")} style={{width:"100%"}} required/></p><textarea name="payload" defaultValue={JSON.stringify(version.payload,null,2)} rows={30} style={{width:"100%",fontFamily:"monospace"}} required/><p><button type="submit">Save as new human draft</button></p></form></section>
    {version.state==="draft"?<section className="reference-library"><h2>Human approval</h2><p>Approval is blocked unless the payload passes the publication contract and all source references belong to this aircraft.</p><form action={approveVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><input name="note" placeholder="Review note" required/> <button type="submit" disabled={version.validationErrors.length>0}>Approve validated draft</button></form></section>:null}
    {version.state==="approved"?<section className="reference-library"><h2>Publication</h2><p>Publishing changes only the publication pointer for this generic content item; previous versions remain immutable.</p><form action={publishVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><button type="submit" disabled={version.validationErrors.length>0}>Publish approved version</button></form></section>:null}
  </main>;
}
