import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { StructuredContentBuilder } from "@/components/structured-content-builder";
import { getAiDraftRunForVersion } from "@/lib/ai-draft-workflow";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { getContentVersionForReview } from "@/lib/content-governance";
import { listFingerprintSourceReferencesForAircraft } from "@/lib/content-review-repository";
import { approveVersionAction,publishVersionAction,reSourceVersionAction,reviseVersionAction } from "../../../../actions";
import styles from "../../studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");

export default async function ContentReviewPage({params}:Readonly<{params:Promise<{aircraftId:string;versionId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId,versionId}=await params;
  const [version,aiRun,aircraft,fingerprintSources]=await Promise.all([getContentVersionForReview(versionId),getAiDraftRunForVersion(versionId),getAdminAircraft(aircraftId),listFingerprintSourceReferencesForAircraft(aircraftId)]);
  if(!version||version.aircraftId!==aircraftId||!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);
  const selectedSources=studio.references.filter(reference=>version.sourceReferenceIds.includes(reference.id));
  const manualOptions=[...new Map(aircraft.manuals.map(manual=>[manual.manualId,{id:manual.manualId,label:`${manual.title} · ${manual.publisher}`}])).values()];
  const variantProfiles=aircraft.variantProfiles??[];
  const variantOptions=variantProfiles.map(profile=>({id:profile.key,label:profile.displayName}));
  const equipmentOptions=[...new Set([...(aircraft.equipmentTags??[]),...variantProfiles.flatMap(profile=>profile.equipmentTags)])].sort();
  const active=version.state==="draft"||version.state==="approved"?"review":"content";
  const stateLabel=version.state==="published"?"Live":version.state==="stale"?"Needs review":version.state.charAt(0).toUpperCase()+version.state.slice(1);

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active={active}>
    <section className={styles.pageHeader}><p className="eyebrow">{domainLabel(version.domain)}{version.contentKey!=="bundle"?` · ${version.contentKey}`:""}</p><div className={styles.titleRow}><h2>{stateLabel}</h2><span className={`${styles.statusPill} ${version.state==="published"?styles.statusLive:version.state==="approved"?styles.statusApproved:version.state==="stale"?styles.statusNeedsReview:styles.statusDraft}`}>v{version.versionNo}</span></div><p>{version.state==="published"?"This is the version learners currently use.":version.state==="approved"?"Reviewed and ready to publish.":"Edit and review this version before it can go live."}</p></section>

    <section className={styles.decisionCard}>
      <div>{version.validationErrors.length?<><strong>{version.validationErrors.length} issue{version.validationErrors.length===1?"":"s"} to fix</strong><p>This version cannot move forward until the content contract is valid.</p></>:<><strong>Validation passed</strong><p>{selectedSources.length} linked source reference{selectedSources.length===1?"":"s"}.</p></>}</div>
      {version.state==="draft"?<form action={approveVersionAction} className={styles.inlineActions}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><input name="note" placeholder="Review note" required/><button type="submit" disabled={version.validationErrors.length>0}>Approve</button></form>:null}
      {version.state==="approved"?<form action={publishVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><button type="submit" disabled={version.validationErrors.length>0}>Publish</button></form>:null}
      {version.state==="published"?<Link className={styles.textLink} href={`/admin/aircraft/${aircraftId}/content`}>Back to content →</Link>:null}
    </section>

    {version.validationErrors.length?<section className={styles.validationPanel}><strong>Fix before approval</strong><ul>{version.validationErrors.map(error=><li key={error}>{error}</li>)}</ul></section>:null}

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Editor</p><h2>Create the next draft</h2></div><p>The version above stays unchanged. Saving creates a new draft.</p></div><form action={reviseVersionAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="versionId" value={version.id}/><details className={styles.quietDetails}><summary>Linked sources ({version.sourceReferenceIds.length})</summary>{studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id} defaultChecked={version.sourceReferenceIds.includes(reference.id)}/><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></label>)}</div>:<p className={styles.empty}>No source references are registered.</p>}</details><StructuredContentBuilder domain={version.domain} aircraftId={aircraftId} initialPayload={version.payload} manualOptions={manualOptions} variantOptions={variantOptions} equipmentOptions={equipmentOptions}/><div className={styles.stickySave}><span>Current v{version.versionNo} remains immutable.</span><button type="submit">Save as new draft</button></div></form></section>

    <section className={styles.sectionBlock}><details className={styles.quietDetails}><summary>Evidence & audit details</summary><h3>Source references</h3>{selectedSources.length?<div className={styles.cleanList}>{selectedSources.map(reference=><div className={styles.referenceRow} key={reference.id}><strong>{reference.label}</strong>{reference.note?<span>{reference.note}</span>:null}</div>)}</div>:<p>No readable source reference is linked.</p>}{aiRun?<><h3>AI drafting audit</h3><p>{aiRun.provider} · {aiRun.model} · {aiRun.createdAt}</p>{aiRun.warnings.length?<ul>{aiRun.warnings.map(warning=><li key={warning}>{warning}</li>)}</ul>:<p>No provider warnings.</p>}</>:null}</details></section>

    <section className={styles.sectionBlock}><details className={styles.dangerZone}><summary>Advanced provenance tools</summary><h3>Re-source this payload without rewriting it</h3><p>Create a new immutable draft with the exact same payload and a different fingerprint-backed source set. No source PDF is stored or served by FlyTally; approval and publication are still separate administrator actions.</p>{fingerprintSources.length?<form action={reSourceVersionAction}><input type="hidden" name="versionId" value={version.id}/><div className={styles.sourceChoices}>{fingerprintSources.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="fingerprintSourceReferenceId" value={reference.id} defaultChecked={version.sourceReferenceIds.includes(reference.id)}/><span><strong>{reference.manualTitle} · {reference.revision}</strong><small>{reference.chapter||"Source"}{reference.section?` · ${reference.section}`:""} · p. {reference.pageLabel}</small></span></label>)}</div><p><button type="submit">Create fingerprint-backed human draft</button></p></form>:<p>No fingerprint-backed reference is available.</p>}</details></section>
  </AdminAircraftWorkspace>;
}
