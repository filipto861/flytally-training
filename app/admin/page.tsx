import Link from "next/link";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { listAdminAircraft } from "@/lib/content-admin-repository";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { bootstrapStaticAction,createAircraftAction,initializeTrainingDatabaseAction } from "./actions";
import { publishReviewedStaticAircraftReleaseAction } from "./release-actions";

export const dynamic="force-dynamic";

export default async function AdminPage(){
  await requireTrainingAdmin();
  const aircraft=await listAdminAircraft();
  const releaseCandidates=aircraft.filter(item=>listStaticNativeUpgradeDomains(item.id).length>0);
  return <main className="shell aircraft-detail">
    <section className="workspace-section-hero"><p className="eyebrow">Content administration</p><h1>Aircraft content is governed data.</h1><p className="lede">Create aircraft, register immutable source revisions, draft against explicit references, approve, publish and review stale content.</p></section>
    <section className="workspace-section-grid">
      {aircraft.map(item=><Link className="workspace-card" href={`/admin/aircraft/${item.id}`} key={item.id}><div className="workspace-card-topline"><span>{item.displayName}</span><small>{item.status}</small></div><p>{item.variants.join(" · ")||"No variants"}</p><strong>{item.manualRevisionCount} revisions · {item.contentItemCount} content items · {item.staleCount} stale →</strong></Link>)}
    </section>
    {releaseCandidates.length?<section className="reference-library"><div className="section-heading"><div><p className="eyebrow">Reviewed aircraft release</p><h2>Approve and publish the current reviewed native course</h2></div></div><p>This is the release action for a reviewed in-repository aircraft course. Missing native modules are imported first; existing native modules receive a new immutable version only when the reviewed payload changed. Every approval and publication is recorded under your authenticated administrator identity.</p><form action={publishReviewedStaticAircraftReleaseAction}><p><label>Aircraft <select name="aircraftId" required>{releaseCandidates.map(item=><option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label></p><p><label><input type="checkbox" name="confirmReviewedAircraftRelease" value="yes" required /> I confirm that I have reviewed the current source-backed native aircraft course and authorize its changed and missing modules to be approved and published.</label></p><button type="submit">Approve and publish reviewed aircraft release</button></form></section>:null}
    <section className="reference-library"><div className="section-heading"><div><p className="eyebrow">Database bootstrap</p><h2>Initialize Training-owned runtime tables</h2></div></div><p>Creates the governed content, progress and controlled-manual tables from an explicit administrator path. Normal learner requests remain SELECT/DML-only and never perform schema DDL.</p><form action={initializeTrainingDatabaseAction}><button type="submit">Initialize Training database</button></form></section>
    <section className="reference-library"><div className="section-heading"><div><p className="eyebrow">New aircraft</p><h2>Create aircraft type</h2></div></div><form action={createAircraftAction}><p><input name="id" placeholder="aircraft-id" required /> <input name="manufacturer" placeholder="Manufacturer" required /> <input name="model" placeholder="Model" required /> <input name="displayName" placeholder="Display name" required /> <button type="submit">Create aircraft</button></p></form></section>
    <section className="reference-library"><div className="section-heading"><div><p className="eyebrow">Controlled migration</p><h2>Import, approve and publish current training seed</h2></div></div><p>This is not a draft-only import. It migrates the current source-backed aircraft modules, records your administrator identity as the explicit migration approval and publishes bundles that are not already published. Review the source-backed training seed before using this transition action.</p><form action={bootstrapStaticAction}><p><label><input type="checkbox" name="confirmApprovedSeed" value="yes" required /> I confirm that I have reviewed the current source-backed training seed and authorize this migration to record approval and publication under my administrator identity.</label></p><button type="submit">Import, approve and publish training seed</button></form><p><small>This migration alone does not satisfy controlled-manual production readiness. Published content must ultimately reference an attached controlled manual revision whose private source remains available.</small></p></section>
  </main>;
}
