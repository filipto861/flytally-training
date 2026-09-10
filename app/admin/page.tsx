import Link from "next/link";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { listAdminAircraft } from "@/lib/content-admin-repository";
import { bootstrapStaticAction,createAircraftAction } from "./actions";

export const dynamic="force-dynamic";

export default async function AdminPage(){
  await requireTrainingAdmin();
  const aircraft=await listAdminAircraft();
  return <main className="shell aircraft-detail">
    <section className="workspace-section-hero"><p className="eyebrow">Content administration</p><h1>Aircraft content is governed data.</h1><p className="lede">Create aircraft, register immutable source revisions, draft against explicit references, approve, publish and review stale content.</p></section>
    <section className="workspace-section-grid">
      {aircraft.map(item=><Link className="workspace-card" href={`/admin/aircraft/${item.id}`} key={item.id}><div className="workspace-card-topline"><span>{item.displayName}</span><small>{item.status}</small></div><p>{item.variants.join(" · ")||"No variants"}</p><strong>{item.manualRevisionCount} revisions · {item.contentItemCount} content items · {item.staleCount} stale →</strong></Link>)}
    </section>
    <section className="reference-library"><div className="section-heading"><div><p className="eyebrow">New aircraft</p><h2>Create aircraft type</h2></div></div><form action={createAircraftAction}><p><input name="id" placeholder="aircraft-id" required /> <input name="manufacturer" placeholder="Manufacturer" required /> <input name="model" placeholder="Model" required /> <input name="displayName" placeholder="Display name" required /> <button type="submit">Create aircraft</button></p></form></section>
    <section className="reference-library"><div className="section-heading"><div><p className="eyebrow">Transition tool</p><h2>Import current static content</h2></div></div><p>Copies the current source-backed bootstrap seed into the same governed PostgreSQL model used for future aircraft. Re-running it is idempotent for already published bundles.</p><form action={bootstrapStaticAction}><button type="submit">Bootstrap static seed into PostgreSQL</button></form></section>
  </main>;
}
