import Link from "next/link";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { listAdminAircraft } from "@/lib/content-admin-repository";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { bootstrapStaticAction,createAircraftAction,initializeTrainingDatabaseAction } from "./actions";
import { publishReviewedStaticAircraftReleaseAction } from "./release-actions";
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

    <section className={styles.section}><p className="eyebrow">New aircraft</p><h2>Add aircraft</h2><form action={createAircraftAction} className={styles.newForm}><label>Aircraft ID<input name="id" placeholder="da40-ng" required/></label><label>Display name<input name="displayName" placeholder="DA40 NG" required/></label><label>Manufacturer<input name="manufacturer" placeholder="Diamond Aircraft" required/></label><label>Model<input name="model" placeholder="DA40 NG" required/></label><div className={styles.full}><button type="submit">Create aircraft</button></div></form></section>

    <details className={styles.tools}><summary>Platform tools</summary>
      <section className={styles.toolBlock}><h3>Initialize Training database</h3><p>Create Training-owned runtime tables from the explicit administrator path. Normal learner requests do not perform schema changes.</p><form action={initializeTrainingDatabaseAction}><button type="submit">Initialize database</button></form></section>
      {releaseCandidates.length?<section className={styles.toolBlock}><h3>Publish reviewed repository content</h3><p>Migration path for reviewed in-repository content. Normal aircraft authoring happens inside each aircraft workspace.</p><form action={publishReviewedStaticAircraftReleaseAction}><p><label>Aircraft <select name="aircraftId" required>{releaseCandidates.map(item=><option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label></p><p><label><input type="checkbox" name="confirmReviewedAircraftRelease" value="yes" required/> I confirm the current source-backed repository content was reviewed.</label></p><button type="submit">Approve and publish</button></form></section>:null}
      <section className={styles.toolBlock}><h3>Import legacy training seed</h3><p>Controlled migration only. This is not the normal content-authoring path.</p><form action={bootstrapStaticAction}><p><label><input type="checkbox" name="confirmApprovedSeed" value="yes" required/> I confirm the current source-backed seed was reviewed.</label></p><button type="submit">Import and publish seed</button></form></section>
    </details>
  </main>;
}
