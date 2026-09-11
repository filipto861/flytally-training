import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft,getOpenStaleFlags } from "@/lib/content-admin-repository";
import styles from "./studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");

export default async function AdminAircraftOverview({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const [aircraft,stale]=await Promise.all([getAdminAircraft(aircraftId),getOpenStaleFlags(aircraftId)]);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);

  const next=studio.sourceFamilies.length===0
    ?{title:"Add the first source",text:"Create a source record before authoring technical content.",href:`/admin/aircraft/${aircraftId}/sources`,action:"Open Sources"}
    :studio.references.length===0
      ?{title:"Add an exact reference",text:"Connect a chapter, section or page to your registered source.",href:`/admin/aircraft/${aircraftId}/sources`,action:"Create reference"}
      :studio.modules.length===0
        ?{title:"Create the first training module",text:"Start with a system, checklist, procedure or another structured content type.",href:`/admin/aircraft/${aircraftId}/content`,action:"Open Content"}
        :studio.pendingModuleCount>0
          ?{title:"Review pending work",text:`${studio.pendingModuleCount} content item${studio.pendingModuleCount===1?" is":"s are"} waiting in the review workflow.`,href:`/admin/aircraft/${aircraftId}/review`,action:"Open Review"}
          :stale.length>0
            ?{title:"Review source changes",text:`${stale.length} live item${stale.length===1?" needs":"s need"} a freshness decision.`,href:`/admin/aircraft/${aircraftId}/review`,action:"Open Review"}
            :{title:"Workspace is clear",text:"There is no pending review. Continue editing content or add another source when needed.",href:`/admin/aircraft/${aircraftId}/content`,action:"Open Content"};

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="overview">
    <section className={styles.pageHeader}><p className="eyebrow">Overview</p><h2>What needs attention?</h2><p>A concise view of content health and the next useful action.</p></section>

    <section className={styles.metricGrid} aria-label="Workspace status">
      <Link className={styles.metricCard} href={`/admin/aircraft/${aircraftId}/content`}><strong>{studio.liveModuleCount}</strong><span>Live content</span></Link>
      <Link className={styles.metricCard} href={`/admin/aircraft/${aircraftId}/review`}><strong>{studio.pendingModuleCount}</strong><span>Pending review</span></Link>
      <Link className={styles.metricCard} href={`/admin/aircraft/${aircraftId}/review`}><strong>{stale.length}</strong><span>Needs review</span></Link>
      <Link className={styles.metricCard} href={`/admin/aircraft/${aircraftId}/sources`}><strong>{studio.sourceFamilies.length}</strong><span>Sources</span></Link>
    </section>

    <section className={styles.focusCard}>
      <div><p className="eyebrow">Continue working</p><h3>{next.title}</h3><p>{next.text}</p></div>
      <Link className={styles.primaryButton} href={next.href}>{next.action} →</Link>
    </section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Content</p><h2>Current modules</h2></div><Link className={styles.textLink} href={`/admin/aircraft/${aircraftId}/content`}>View all →</Link></div>
      {studio.modules.length?<div className={styles.cleanList}>{studio.modules.slice(0,6).map(module=>{
        const state=module.pending?module.pending.state:module.live?"live":module.latest.state;
        const href=module.pending?`/admin/aircraft/${aircraftId}/content/${module.pending.id}`:module.live?`/admin/aircraft/${aircraftId}/content/${module.live.id}`:`/admin/aircraft/${aircraftId}/content/${module.latest.id}`;
        return <Link className={styles.cleanRow} href={href} key={module.key}><div><strong>{domainLabel(module.domain)}</strong>{module.contentKey!=="bundle"?<span>{module.contentKey}</span>:null}</div><span className={`${styles.statusPill} ${state==="live"?styles.statusLive:state==="approved"?styles.statusApproved:styles.statusDraft}`}>{state==="live"?"Live":state==="approved"?"Approved":"Draft"}</span></Link>;
      })}</div>:<div className={styles.emptyState}><strong>No content yet</strong><p>Create the first source-backed module from the Content page.</p></div>}
    </section>
  </AdminAircraftWorkspace>;
}
