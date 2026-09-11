import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { SourceFingerprintInput } from "@/components/source-fingerprint-input";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { sourceAuthorityLabel,sourceAuthorityRoles } from "@/lib/source-authority";
import { createReferenceAction,registerRevisionAction } from "../../../actions";
import styles from "../studio.module.css";

export const dynamic="force-dynamic";
const Hidden=({aircraftId}:{aircraftId:string})=><input type="hidden" name="aircraftId" value={aircraftId}/>;

export default async function AircraftSourcesPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="sources">
    <section className={styles.pageHeader}><p className="eyebrow">Sources</p><h2>Source records & references</h2><p>Keep only the identity, revision and exact locations needed to support training content. Source documents are not hosted by FlyTally.</p></section>

    <section className={styles.actionGrid}>
      <details className={styles.actionCard} open={studio.sourceFamilies.length===0}><summary><strong>Add source</strong><span>Register a manual, checklist, QRH or other source record.</span></summary><form action={registerRevisionAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Title<input name="title" placeholder="Aircraft Flight Manual" required/></label><label>Publisher<input name="publisher" placeholder="Manufacturer" required/></label><label>Type<input name="sourceKind" placeholder="AFM / QRH / CHECKLIST" required/></label><label>Revision<input name="revision" placeholder="Rev 7" required/></label><label>Issue date<input name="issueDate" placeholder="2026-09-01" required/></label><label>Authority<select name="authorityRole" defaultValue="UNCLASSIFIED" required>{sourceAuthorityRoles.map(role=><option key={role} value={role}>{sourceAuthorityLabel(role)}</option>)}</select></label><label className={styles.full}>Authority note<input name="authorityNote" placeholder="Optional applicability or precedence note"/></label></div><SourceFingerprintInput/><details className={styles.quietDetails}><summary>External citation metadata</summary><div className={styles.formGrid}><label>Source URI<input name="sourceUri"/></label><label>Known SHA-256<input name="externalChecksum"/></label></div></details><p><button type="submit">Add source</button></p></form></details>

      {studio.sourceFamilies.length?<details className={styles.actionCard}><summary><strong>Add revision</strong><span>Record a newer revision of an existing source.</span></summary><form action={registerRevisionAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label className={styles.full}>Source<select name="manualId" required>{studio.sourceFamilies.map(family=><option value={family.manualId} key={family.manualId}>{family.title} · {family.publisher}</option>)}</select></label><label>Revision<input name="revision" required/></label><label>Issue date<input name="issueDate" required/></label><label>Authority<select name="authorityRole" defaultValue="UNCLASSIFIED" required>{sourceAuthorityRoles.map(role=><option key={role} value={role}>{sourceAuthorityLabel(role)}</option>)}</select></label><label className={styles.full}>Authority note<input name="authorityNote"/></label></div><SourceFingerprintInput/><p><button type="submit">Add revision</button></p></form></details>:null}

      {aircraft.manuals.length?<details className={styles.actionCard}><summary><strong>Add reference</strong><span>Point to the chapter, section or page used by content.</span></summary><form action={createReferenceAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label className={styles.full}>Source revision<select name="revisionId" required>{aircraft.manuals.map(manual=><option key={manual.revisionId} value={manual.revisionId}>{manual.title} · {manual.revision} · {manual.issueDate}</option>)}</select></label><label>Chapter<input name="chapter"/></label><label>Section<input name="section"/></label><label>Page<input name="pageLabel" required/></label><label>Note<input name="note"/></label></div><p><button type="submit">Add reference</button></p></form></details>:null}
    </section>

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Registered sources</p><h2>{studio.sourceFamilies.length} source{studio.sourceFamilies.length===1?"":"s"}</h2></div></div>{studio.sourceFamilies.length?<div className={styles.cleanList}>{studio.sourceFamilies.map(family=><article className={styles.sourceRow} key={family.manualId}><div><strong>{family.title}</strong><span>{family.publisher} · {family.sourceKind}</span></div><div className={styles.revisionStack}>{family.revisions.map(revision=><span key={revision.revisionId}>{revision.revision} · {revision.issueDate} · {sourceAuthorityLabel(revision.authorityRole)}{revision.checksumSha256?" · fingerprinted":""}</span>)}</div></article>)}</div>:<div className={styles.emptyState}><strong>No sources yet</strong><p>Add the first source record above.</p></div>}</section>

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">References</p><h2>{studio.references.length} exact location{studio.references.length===1?"":"s"}</h2></div></div>{studio.references.length?<div className={styles.cleanList}>{studio.references.map(reference=><div className={styles.referenceRow} key={reference.id}><strong>{reference.label}</strong>{reference.note?<span>{reference.note}</span>:null}</div>)}</div>:<div className={styles.emptyState}><strong>No references yet</strong><p>Add an exact chapter, section or page location when you are ready to author content.</p></div>}</section>
  </AdminAircraftWorkspace>;
}
