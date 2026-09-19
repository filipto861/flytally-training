import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { PendingActionButton } from "@/components/pending-action-button";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft,getOpenStaleFlags } from "@/lib/content-admin-repository";
import { resolveStaleAction } from "../../../actions";
import styles from "../studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");

export default async function AircraftReviewPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const [aircraft,stale]=await Promise.all([getAdminAircraft(aircraftId),getOpenStaleFlags(aircraftId)]);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);
  const pending=studio.modules.filter(module=>module.pending);

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="review">
    <section className={styles.pageHeader}><p className="eyebrow">Review</p><h2>Work queue</h2><p>Only items that need a decision appear here.</p></section>

    <section className={styles.metricGrid} aria-label="Review status"><div className={styles.metricCardStatic}><strong>{pending.length}</strong><span>Pending content</span></div><div className={styles.metricCardStatic}><strong>{stale.length}</strong><span>Source-change reviews</span></div></section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Content review</p><h2>Drafts & approvals</h2></div></div>
      {pending.length?<div className={styles.contentTable}>{pending.map(module=>{
        const version=module.pending!;
        return <Link className={styles.contentRow} key={module.key} href={`/admin/aircraft/${aircraftId}/content/${version.id}`}><div className={styles.contentIdentity}><strong>{domainLabel(module.domain)}</strong><span>{module.contentKey==="bundle"?"Main module":module.contentKey}</span></div><div className={styles.contentRelease}>{module.live?<span>Live v{module.live.versionNo}</span>:<span>First release</span>}<span>Working v{version.versionNo}</span></div><span className={`${styles.statusPill} ${version.state==="approved"?styles.statusApproved:styles.statusDraft}`}>{version.state==="approved"?"Approved":"Draft"}</span><span className={styles.rowArrow}>›</span></Link>;
      })}</div>:<div className={styles.emptyState}><strong>Nothing waiting for content review</strong><p>New drafts and approved-but-unpublished versions will appear here.</p></div>}
    </section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Freshness</p><h2>Source changes</h2></div></div>
      {stale.length?<div className={styles.cleanList}>{stale.map(flag=><details className={styles.reviewItem} key={String(flag.stale_id)}><summary><div><strong>{domainLabel(flag.domain)}</strong><span>{flag.content_key==="bundle"?"Main module":flag.content_key}</span></div><span className={`${styles.statusPill} ${styles.statusNeedsReview}`}>Needs review</span></summary><p>{flag.reason}</p><form action={resolveStaleAction}><input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="staleId" value={String(flag.stale_id)}/><div className={styles.inlineActions}><input name="note" placeholder="Resolution note" required/><PendingActionButton pendingLabel="Resolving…">Resolve</PendingActionButton></div></form></details>)}</div>:<div className={styles.emptyState}><strong>No source-change reviews</strong><p>Published content is not currently flagged by a newer source revision.</p></div>}
    </section>
  </AdminAircraftWorkspace>;
}
