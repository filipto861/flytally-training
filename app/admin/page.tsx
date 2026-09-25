import Link from "next/link";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { PendingActionButton } from "@/components/pending-action-button";
import { listAdminAircraft } from "@/lib/content-admin-repository";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { bootstrapStaticAction,createAircraftAction,initializeTrainingDatabaseAction } from "./actions";
import {
  publishLearjetChecklistReleaseAction,
  publishLearjetQrhReleaseAction,
  publishReviewedStaticAircraftReleaseAction,
} from "./release-actions";
import styles from "./admin.module.css";

export const dynamic="force-dynamic";

export default async function AdminPage(){
  await requireTrainingAdmin();
  const aircraft=await listAdminAircraft();
  const releaseCandidates=aircraft.filter(item=>listStaticNativeUpgradeDomains(item.id).length>0);

  return <main className="shell aircraft-detail">
    <section className={styles.header}><p className="eyebrow">Training administration</p><h1>Aircraft</h1><p className="lede">Choose an aircraft and continue where work is needed. Technical governance stays out of the way until you need it.</p></section>

    <section className={styles.aircraftGrid}>
      {aircraft.map(item=><Link className={styles.aircraftCard} key={item.id} href={`/admin/aircraft/${item.id}`}><div className={styles.cardTop}><h2>{item.displayName}</h2><span className={styles.status}>{item.status}</span></div><div className={styles.cardMeta}><span>{item.contentItemCount} content item{item.contentItemCount===1?"":"s"}</span><span>{item.manualRevisionCount} source revision{item.manualRevisionCount===1?"":"s"}</span>{item.staleCount?<span className={styles.attention}>{item.staleCount} needs review</span>:<span>No review alerts</span>}</div><strong>Open workspace →</strong></Link>)}
    </section>

    <section className={styles.section}><p className="eyebrow">New aircraft</p><h2>Add aircraft</h2><form action={createAircraftAction} className={styles.newForm}><label>Aircraft ID<input name="id" placeholder="da40-ng" required/></label><label>Display name<input name="displayName" placeholder="DA40 NG" required/></label><label>Manufacturer<input name="manufacturer" placeholder="Diamond Aircraft" required/></label><label>Model<input name="model" placeholder="DA40 NG" required/></label><div className={styles.full}><PendingActionButton pendingLabel="Creating…">Create aircraft</PendingActionButton></div></form></section>

    <details className={styles.tools}><summary>Platform tools</summary>
      <section className={styles.toolBlock}><h3>Initialize Training database</h3><p>Create Training-owned runtime tables from the explicit administrator path. Normal learner requests do not perform schema changes.</p><form action={initializeTrainingDatabaseAction}><PendingActionButton pendingLabel="Initializing…">Initialize database</PendingActionButton></form></section>
      {releaseCandidates.length?<section className={styles.toolBlock}><h3>Publish reviewed repository content</h3><p>Migration path for reviewed in-repository content. Normal aircraft authoring happens inside each aircraft workspace.</p><form action={publishReviewedStaticAircraftReleaseAction}><p><label>Aircraft <select name="aircraftId" required>{releaseCandidates.map(item=><option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label></p><p><label><input type="checkbox" name="confirmReviewedAircraftRelease" value="yes" required/> I confirm the current source-backed repository content was reviewed.</label></p><PendingActionButton pendingLabel="Publishing…">Approve and publish</PendingActionButton></form></section>:null}
      <section className={styles.toolBlock}><h3>Publish reviewed Learjet checklist</h3><p>One-shot governed release of the reviewed CL-102B Change 2 Normal Procedures package. Runs inside the authenticated production Training runtime and uses the existing source registration, validation, approval and publication gates.</p><form action={publishLearjetChecklistReleaseAction}><p><label><input type="checkbox" name="confirmLearjetChecklistRelease" value="yes" required/> I confirm that I reviewed the Learjet 35A/36A CL-102B checklist package and authorize publication under my administrator identity.</label></p><PendingActionButton pendingLabel="Publishing checklist…">Publish Learjet checklist</PendingActionButton></form></section>
      <section className={styles.toolBlock}><h3>Publish reviewed Learjet QRH</h3><p>Governed release of the complete reviewed CL-102B Change 2 Emergency + Abnormal package, including configuration/effectivity filtering and the two source-digitized graphical envelopes. The release also registers the reviewed QRH applicability vocabulary as non-runtime governance metadata; it does not claim that any modification or equipment is installed.</p><form action={publishLearjetQrhReleaseAction}><p><label><input type="checkbox" name="confirmLearjetQrhRelease" value="yes" required/> I confirm that I reviewed the complete Learjet 35A/36A CL-102B Emergency + Abnormal QRH package, authorize its governed applicability vocabulary registration, and authorize publication under my administrator identity.</label></p><PendingActionButton pendingLabel="Publishing QRH…">Publish Learjet QRH</PendingActionButton></form></section>
            <section className={styles.toolBlock}><h3>Import, approve and publish current training seed</h3><p>Controlled migration only. This action records approval and publication under my administrator identity; it is not a passive import and is not the normal content-authoring path. The migration alone does not satisfy controlled-manual production readiness or replace the source-provenance release gate.</p><form action={bootstrapStaticAction}><p><label><input type="checkbox" name="confirmApprovedSeed" value="yes" required/> I confirm that I have reviewed the current source-backed training seed and authorize this migration to record approval and publication under my administrator identity.</label></p><PendingActionButton pendingLabel="Publishing…">Import, approve and publish training seed</PendingActionButton></form></section>
    </details>
  </main>;
}
