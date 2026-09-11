import Link from "next/link";
import { notFound } from "next/navigation";
import { getAiDraftRunForVersion } from "@/lib/ai-draft-workflow";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { getContentVersionForReview } from "@/lib/content-governance";
import { listFingerprintSourceReferencesForAircraft } from "@/lib/content-review-repository";
import { approveVersionAction,publishVersionAction,reSourceVersionAction,reviseVersionAction } from "../../../../actions";
import styles from "../../studio.module.css";

export const dynamic="force-dynamic";

export default async function ContentReviewPage({params}:Readonly<{params:Promise<{aircraftId:string;versionId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId,versionId}=await params;
  const [version,aiRun,aircraft,fingerprintSources]=await Promise.all([getContentVersionForReview(versionId),getAiDraftRunForVersion(versionId),getAdminAircraft(aircraftId),listFingerprintSourceReferencesForAircraft(aircraftId)]);
  if(!version||version.aircraftId!==aircraftId||!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);
  const selectedSources=studio.references.filter(reference=>version.sourceReferenceIds.includes(reference.id));

  return <main className="shell aircraft-detail">
    <Link className="back-link" href={`/admin/aircraft/${aircraftId}`}>← Content Studio</Link>
    <section className="workspace-section-hero"><p className="eyebrow">{version.domain}/{version.contentKey} · v{version.versionNo} · {version.state}</p><h1>Review content version</h1><p className="lede">This version is immutable. Any edit creates a new human draft; approval and publication remain explicit separate actions.</p>
      <div className={styles.metrics}><div className={styles.metric}><strong>{selectedSources.length}</strong><span>linked source references</span></div><div className={styles.metric}><strong>{version.validationErrors.length}</strong><span>contract issues</span></div><div className={styles.metric}><strong>{version.origin}</strong><span>version origin</span></div></div>
    </section>

    <section className="reference-library"><div className={styles.sectionHeader}><div><p className="eyebrow">Release gate</p><h2>Validation and decision</h2></div><p>Only a valid, source-linked version can move through approval and publication.</p></div>{version.validationErrors.length?<><p className={styles.warning}>This version cannot be approved or published yet.</p><ul>{version.validationErrors.map(error=><li key={error}>{error}</li>)}</ul></>:<p>Payload matches the <strong>{version.domain}</strong> product contract for {aircraft.displayName}.</p>}
      {version.state==="draft"?<form action={approveVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><div className={styles.inlineActions}><input name="note" placeholder="Human review note" required/><button type="submit" disabled={version.validationErrors.length>0}>Approve validated draft</button></div></form>:null}
      {version.state==="approved"?<form action={publishVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><button type="submit" disabled={version.validationErrors.length>0}>Publish approved version</button></form>:null}
      {version.state==="published"?<p><strong>This version is live.</strong> A future edit will create a separate draft while this release remains available.</p>:null}
    </section>

    <section className="reference-library"><div className={styles.sectionHeader}><div><p className="eyebrow">Provenance</p><h2>Linked source references</h2></div><p>Review sources by human-readable manual/revision/page context rather than internal reference identifiers.</p></div>{selectedSources.length?<div className={styles.sourceChoices}>{selectedSources.map(reference=><div className={styles.sourceChoice} key={reference.id}><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></div>)}</div>:<p className={styles.empty}>No readable source reference is linked to this version.</p>}</section>

    {aiRun?<section className="reference-library"><p className="eyebrow">AI drafting audit</p><h2>{aiRun.provider} · {aiRun.model}</h2><p>Generated {aiRun.createdAt}{aiRun.responseId?` · provider response recorded`:""}. The controlled source excerpt itself is not duplicated into the audit record; only its SHA-256 hash and size are retained server-side.</p>{aiRun.warnings.length?<ul>{aiRun.warnings.map(warning=><li key={warning}>{warning}</li>)}</ul>:<p>No provider warnings were recorded.</p>}</section>:null}

    <section className="reference-library"><div className={styles.sectionHeader}><div><p className="eyebrow">Edit</p><h2>Create a new human draft</h2></div><p>Change provenance or payload without mutating this record. The new draft must be reviewed again before publication.</p></div><form action={reviseVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/>{studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id} defaultChecked={version.sourceReferenceIds.includes(reference.id)}/><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></label>)}</div>:<p className={styles.empty}>No source references are registered for this aircraft.</p>}<details className={styles.advanced}><summary>Edit raw payload JSON</summary><p className={styles.subtle}>The contract-level JSON editor remains an advanced escape hatch. Structured module editors will replace this in later Content Platform milestones.</p><textarea className={styles.codearea} name="payload" defaultValue={JSON.stringify(version.payload,null,2)} required/></details><p><button type="submit">Save as new human draft</button></p></form></section>

    <section className="reference-library"><details><summary>Re-source this payload without rewriting it</summary><p>Create a new immutable human draft with the same payload but provenance restricted to fingerprint-backed source records. No source PDF is stored or served by FlyTally. The current version remains unchanged; approval and publication are still separate administrator actions.</p>{fingerprintSources.length?<form action={reSourceVersionAction}><input type="hidden" name="versionId" value={version.id}/><div className={styles.sourceChoices}>{fingerprintSources.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="fingerprintSourceReferenceId" value={reference.id} defaultChecked={version.sourceReferenceIds.includes(reference.id)}/><span><strong>{reference.manualTitle} · rev {reference.revision}</strong><small>{reference.chapter||"Source"}{reference.section?` · ${reference.section}`:""} · p. {reference.pageLabel} · SHA-256 {reference.checksumSha256.slice(0,12)}…</small></span></label>)}</div><p><button type="submit">Create fingerprint-backed human draft</button></p></form>:<p className={styles.empty}>No fingerprint-backed source reference is available yet.</p>}</details></section>
  </main>;
}
