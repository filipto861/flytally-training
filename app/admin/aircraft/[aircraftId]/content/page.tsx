import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { structuredAuthoringDomainLabel,structuredAuthoringDomains } from "@/lib/content-authoring-templates";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { createAiDraftAction } from "../../../actions";
import styles from "../studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");
const Hidden=({aircraftId}:{aircraftId:string})=><input type="hidden" name="aircraftId" value={aircraftId}/>;

export default async function AircraftContentPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="content">
    <section className={styles.pageHeader}><p className="eyebrow">Content</p><h2>Training modules</h2><p>Create, edit and open the content learners actually see.</p></section>

    <section className={styles.newContentBar}>
      <div><strong>New content</strong><span>Choose what you want to create. FlyTally starts with structure only.</span></div>
      {studio.references.length?<form action={`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/new`} method="get" className={styles.inlineActions}><select name="domain" aria-label="Content type" defaultValue="systems">{structuredAuthoringDomains.map(domain=><option key={domain} value={domain}>{structuredAuthoringDomainLabel(domain)}</option>)}</select><button type="submit">Create</button></form>:<Link className={styles.primaryButton} href={`/admin/aircraft/${aircraftId}/sources`}>Add a source first →</Link>}
    </section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Library</p><h2>{studio.modules.length} module{studio.modules.length===1?"":"s"}</h2></div></div>
      {studio.modules.length?<div className={styles.contentTable}>{studio.modules.map(module=>{
        const activeVersion=module.pending??module.live??module.latest;
        const state=module.pending?.state??(module.live?"live":module.latest.state);
        return <Link className={styles.contentRow} key={module.key} href={`/admin/aircraft/${aircraftId}/content/${activeVersion.id}`}>
          <div className={styles.contentIdentity}><strong>{domainLabel(module.domain)}</strong><span>{module.contentKey==="bundle"?"Main module":module.contentKey}</span></div>
          <div className={styles.contentRelease}>{module.live?<span>Live v{module.live.versionNo}</span>:<span>Not live</span>}{module.pending?<span>Working v{module.pending.versionNo}</span>:null}</div>
          <span className={`${styles.statusPill} ${state==="live"?styles.statusLive:state==="approved"?styles.statusApproved:styles.statusDraft}`}>{state==="live"?"Live":state==="approved"?"Approved":"Draft"}</span>
          <span className={styles.rowArrow}>›</span>
        </Link>;
      })}</div>:<div className={styles.emptyState}><strong>No modules yet</strong><p>Use New content above to create the first source-backed module.</p></div>}
    </section>

    {studio.references.length?<section className={styles.sectionBlock}><details className={styles.quietDetails}><summary>AI-assisted draft</summary><p>Optional: draft from a pasted source excerpt. The result still enters the normal review workflow.</p><form action={createAiDraftAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Content type<select name="domain">{structuredAuthoringDomains.map(domain=><option key={domain} value={domain}>{structuredAuthoringDomainLabel(domain)}</option>)}</select></label><label>Internal key<input name="contentKey" defaultValue="bundle"/></label><label className={styles.full}>Drafting goal<input name="goal" placeholder="Build the electrical system lesson" required/></label></div><div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong></span></label>)}</div><label className={styles.field}>Relevant excerpt<textarea className={styles.textarea} name="sourceText" required/></label><p><button type="submit">Generate draft</button></p></form></details></section>:null}
  </AdminAircraftWorkspace>;
}
