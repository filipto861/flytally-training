import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft,getOpenStaleFlags } from "@/lib/content-admin-repository";
import { trainingContentDomains } from "@/lib/content-admin-types";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { listManualAssets } from "@/lib/manual-assets";
import { sourceAuthorityLabel,sourceAuthorityRoles } from "@/lib/source-authority";
import { ManualAssetUploader } from "@/components/manual-asset-uploader";
import { addVariantAction,createAiDraftAction,createDraftAction,createReferenceAction,publishAircraftAction,publishNativeModuleUpgradeAction,registerRevisionAction,resolveStaleAction } from "../../actions";
import styles from "./studio.module.css";

export const dynamic="force-dynamic";
const Hidden=({aircraftId}:{aircraftId:string})=><input type="hidden" name="aircraftId" value={aircraftId}/>;
const mb=(bytes:number)=>(bytes/1024/1024).toFixed(1);
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");

export default async function AdminAircraftPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const [aircraft,stale,assets]=await Promise.all([getAdminAircraft(aircraftId),getOpenStaleFlags(aircraftId),listManualAssets(aircraftId)]);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);
  const readyAssets=assets.filter(asset=>asset.status==="ready");
  const nativeUpgradeDomains=listStaticNativeUpgradeDomains(aircraftId);

  return <main className="shell aircraft-detail">
    <Link className="back-link" href="/admin">← Content administration</Link>
    <section className="workspace-section-hero">
      <p className="eyebrow">M29 Content Studio · {aircraft.status}</p>
      <h1>{aircraft.displayName}</h1>
      <p className="lede">Manage sources, source references, governed drafts, review and release without exposing internal identifiers in the normal workflow.</p>
      <div className={styles.inlineActions}>
        <Link href={`/admin/aircraft/${aircraftId}/onboarding`}>Open onboarding →</Link>
        {aircraft.status!=="published"?<form action={publishAircraftAction}><Hidden aircraftId={aircraftId}/><button type="submit">Publish aircraft catalogue entry</button></form>:null}
      </div>
      <nav className={styles.studioNav} aria-label="Content Studio sections">
        <a href="#sources">Sources</a><a href="#references">References</a><a href="#authoring">Authoring</a><a href="#modules">Modules</a><a href="#review">Review</a><a href="#advanced">Advanced</a>
      </nav>
      <div className={styles.metrics}>
        <div className={styles.metric}><strong>{studio.sourceFamilies.length}</strong><span>source families</span></div>
        <div className={styles.metric}><strong>{studio.references.length}</strong><span>source references</span></div>
        <div className={styles.metric}><strong>{studio.liveModuleCount}</strong><span>live module items</span></div>
        <div className={styles.metric}><strong>{studio.pendingModuleCount}</strong><span>pending module items</span></div>
        <div className={styles.metric}><strong>{stale.length}</strong><span>stale reviews</span></div>
      </div>
    </section>

    <section className={`reference-library ${styles.anchor}`} id="sources">
      <div className={styles.sectionHeader}><div><p className="eyebrow">1 · Sources</p><h2>Controlled source library</h2></div><p>Upload manuals once, register immutable revisions and keep source authority explicit. Internal manual/revision IDs are generated or selected behind human-readable labels.</p></div>
      <p className={styles.subtle}>Controlled PDF finalization streams the stored private object through the Training server to verify the PDF signature and recompute SHA-256 and byte count before the source can become ready.</p>
      <ManualAssetUploader aircraftId={aircraftId}/>
      {assets.length?<div className={styles.compactList}>{assets.map(asset=><div className={styles.compactItem} key={asset.id}><div><strong>{asset.originalName}</strong><span>{asset.status} · {mb(asset.sizeBytes)} MB · SHA-256 {asset.checksumSha256.slice(0,12)}…</span></div>{["ready","claimed","attached"].includes(asset.status)?<Link href={`/api/admin/manual-assets/${asset.id}/download`} target="_blank">Open source →</Link>:null}</div>)}</div>:<p className={styles.empty}>No controlled PDF uploaded yet.</p>}

      <details className={styles.advanced} open={studio.sourceFamilies.length===0}>
        <summary>Register a new source family</summary>
        <form action={registerRevisionAction}>
          <Hidden aircraftId={aircraftId}/>
          <div className={styles.formGrid}>
            <label>Source title<input name="title" placeholder="Aircraft Flight Manual" required/></label>
            <label>Publisher<input name="publisher" placeholder="Manufacturer / training provider" required/></label>
            <label>Source type<input name="sourceKind" placeholder="AFM / QRH / TRAINING_MANUAL" required/></label>
            <label>Revision<input name="revision" placeholder="Rev 7" required/></label>
            <label>Issue date<input name="issueDate" placeholder="2026-09-01" required/></label>
            <label>Authority<select name="authorityRole" defaultValue="UNCLASSIFIED" required>{sourceAuthorityRoles.map(role=><option key={role} value={role}>{sourceAuthorityLabel(role)}</option>)}</select></label>
            <label className={styles.full}>Controlled PDF<select name="assetId" defaultValue=""><option value="">No uploaded asset / external source</option>{readyAssets.map(asset=><option key={asset.id} value={asset.id}>{asset.originalName} · {mb(asset.sizeBytes)} MB</option>)}</select></label>
            <label className={styles.full}>Authority note<input name="authorityNote" placeholder="Precedence / applicability note"/></label>
          </div>
          <details><summary>External-source fields</summary><div className={styles.formGrid}><label>Source URI<input name="sourceUri"/></label><label>SHA-256<input name="checksum"/></label></div></details>
          <p><button type="submit">Register source revision</button></p>
        </form>
      </details>

      {studio.sourceFamilies.length?<details className={styles.advanced}><summary>Add a revision to an existing source family</summary><form action={registerRevisionAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}>
        <label>Source family<select name="manualId" required>{studio.sourceFamilies.map(family=><option value={family.manualId} key={family.manualId}>{family.title} · {family.publisher}</option>)}</select></label>
        <label>Revision<input name="revision" placeholder="Rev 8" required/></label>
        <label>Issue date<input name="issueDate" placeholder="2026-10-01" required/></label>
        <label>Authority<select name="authorityRole" defaultValue="UNCLASSIFIED" required>{sourceAuthorityRoles.map(role=><option key={role} value={role}>{sourceAuthorityLabel(role)}</option>)}</select></label>
        <label className={styles.full}>Controlled PDF<select name="assetId" defaultValue=""><option value="">No uploaded asset / external source</option>{readyAssets.map(asset=><option key={asset.id} value={asset.id}>{asset.originalName} · {mb(asset.sizeBytes)} MB</option>)}</select></label>
        <label className={styles.full}>Authority note<input name="authorityNote" placeholder="What changed / applicability note"/></label>
      </div><details><summary>External-source fields</summary><div className={styles.formGrid}><label>Source URI<input name="sourceUri"/></label><label>SHA-256<input name="checksum"/></label></div></details><p><button type="submit">Register new revision</button></p></form></details>:null}

      {studio.sourceFamilies.length?<div className={styles.compactList}>{studio.sourceFamilies.map(family=><div className={styles.compactItem} key={family.manualId}><div><strong>{family.title}</strong><span>{family.publisher} · {family.sourceKind} · {family.revisions.length} revision{family.revisions.length===1?"":"s"}</span></div><span>{family.revisions.map(revision=>`${revision.revision} · ${revision.issueDate} · ${sourceAuthorityLabel(revision.authorityRole)}`).join(" | ")}</span></div>)}</div>:null}
    </section>

    <section className={`reference-library ${styles.anchor}`} id="references">
      <div className={styles.sectionHeader}><div><p className="eyebrow">2 · References</p><h2>Exact source locations</h2></div><p>Create reusable chapter/section/page references. Authors select these by readable labels; UUIDs remain internal.</p></div>
      {aircraft.manuals.length?<form action={createReferenceAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}>
        <label className={styles.full}>Source revision<select name="revisionId" required>{aircraft.manuals.map(manual=><option key={manual.revisionId} value={manual.revisionId}>{manual.title} · rev {manual.revision} · {manual.issueDate}</option>)}</select></label>
        <label>Chapter<input name="chapter" placeholder="2"/></label><label>Section<input name="section" placeholder="Electrical Power"/></label><label>Page<input name="pageLabel" placeholder="2-14" required/></label><label>Note<input name="note" placeholder="Optional context"/></label>
      </div><button type="submit">Add source reference</button></form>:<p className={styles.empty}>Register a source revision before creating references.</p>}
      {studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><div className={styles.sourceChoice} key={reference.id}><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></div>)}</div>:null}
    </section>

    <section className={`reference-library ${styles.anchor}`} id="authoring">
      <div className={styles.sectionHeader}><div><p className="eyebrow">3 · Authoring</p><h2>Create a governed draft</h2></div><p>Select source references by name, state the drafting goal and provide only the controlled source excerpt relevant to the task. AI output remains a draft and cannot self-approve or publish.</p></div>
      {studio.references.length?<form action={createAiDraftAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Module<select name="domain">{trainingContentDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label><label>Content key<input name="contentKey" defaultValue="bundle"/></label><label className={styles.full}>Drafting goal<input name="goal" placeholder="Build the electrical system lesson from the selected source material" required/></label></div>
        <div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></label>)}</div>
        <label className={styles.field}>Controlled source excerpt<textarea className={styles.textarea} name="sourceText" placeholder="Paste only the relevant controlled source excerpt." required/></label>
        <p><button type="submit">Generate governed draft</button></p>
      </form>:<p className={styles.empty}>Create at least one exact source reference before authoring content.</p>}
    </section>

    <section className={`reference-library ${styles.anchor}`} id="modules">
      <div className={styles.sectionHeader}><div><p className="eyebrow">4 · Modules</p><h2>Release state</h2></div><p>One card represents one governed content item. A live version can remain released while a newer draft is under review.</p></div>
      {studio.modules.length?<div className={styles.moduleGrid}>{studio.modules.map(module=><article className={styles.moduleCard} key={module.key}><div className={styles.moduleTop}><strong>{domainLabel(module.domain)} · {module.contentKey}</strong><span className={styles.badge}>{module.pending?module.pending.state:module.live?"live":module.latest.state}</span></div><div className={styles.moduleMeta}>{module.live?<span>Live: v{module.live.versionNo}</span>:<span>Not released</span>}{module.pending?<span>Pending: v{module.pending.versionNo} · {module.pending.state}</span>:null}<span>{module.historyCount} immutable version{module.historyCount===1?"":"s"}</span></div><div className={styles.moduleActions}>{module.pending?<Link href={`/admin/aircraft/${aircraftId}/content/${module.pending.id}`}>Review pending →</Link>:module.live?<Link href={`/admin/aircraft/${aircraftId}/content/${module.live.id}`}>Open live version →</Link>:<Link href={`/admin/aircraft/${aircraftId}/content/${module.latest.id}`}>Open version →</Link>}</div></article>)}</div>:<p className={styles.empty}>No governed modules yet. Create the first draft above; sparse aircraft do not need empty placeholder modules.</p>}
    </section>

    <section className={`reference-library ${styles.anchor}`} id="review">
      <div className={styles.sectionHeader}><div><p className="eyebrow">5 · Review</p><h2>Revision freshness</h2></div><p>New manual revisions do not silently rewrite learner content. Affected published versions remain visible until their stale review is resolved through a controlled replacement or explicit review decision.</p></div>
      {stale.length?<ol className="chapter-list">{stale.map(flag=><li key={String(flag.stale_id)}><span className="chapter-number">!</span><div><strong>{domainLabel(flag.domain)}/{flag.content_key}</strong><span>{flag.reason}</span><form action={resolveStaleAction}><Hidden aircraftId={aircraftId}/><input type="hidden" name="staleId" value={String(flag.stale_id)}/><div className={styles.inlineActions}><input name="note" placeholder="Resolution / replacement note" required/><button type="submit">Resolve review</button></div></form></div></li>)}</ol>:<p className={styles.empty}>No unresolved stale-content reviews.</p>}
    </section>

    <section className={`reference-library ${styles.anchor}`} id="advanced">
      <p className="eyebrow">Advanced</p><h2>Migration and raw payload tools</h2><p className={styles.subtle}>These tools remain available for controlled migrations and contract-level troubleshooting, but they are no longer the normal authoring path.</p>
      {nativeUpgradeDomains.length?<details className={styles.advanced}><summary>Publish reviewed in-repository native module upgrade</summary><p>Publishing creates a new immutable version through the normal governed lifecycle; it never overwrites the existing version in place.</p><form action={publishNativeModuleUpgradeAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Module<select name="domain" required>{nativeUpgradeDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label></div><p><label><input name="confirmReviewedNativeUpgrade" type="checkbox" value="yes" required/> I confirm this reviewed native module should become the next immutable release.</label></p><button type="submit">Approve and publish native upgrade</button></form></details>:null}
      <details className={styles.advanced}><summary>Create raw governed JSON draft</summary><p>Use only when the structured authoring path cannot represent the required payload yet.</p><form action={createDraftAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Module<select name="domain">{trainingContentDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label><label>Content key<input name="contentKey" defaultValue="bundle"/></label><label>Origin<select name="origin"><option value="human">human</option><option value="import">import</option></select></label></div>{studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong></span></label>)}</div>:null}<textarea className={styles.codearea} name="payload" placeholder='{"aircraftId":"..."}' required/><p><button type="submit">Create raw draft</button></p></form></details>
      <details className={styles.advanced}><summary>Aircraft variants</summary><p>Variants are optional. Add one only when real source applicability differs by variant or equipment configuration.</p><form action={addVariantAction}><Hidden aircraftId={aircraftId}/><div className={styles.inlineActions}><input name="variant" placeholder="Variant" required/><button type="submit">Add variant</button></div></form><p className={styles.subtle}>{aircraft.variants.length?aircraft.variants.join(" · "):"No variants configured."}</p></details>
    </section>
  </main>;
}
