import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { StructuredContentBuilder } from "@/components/structured-content-builder";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { createStructuredStarterPayload,isStructuredAuthoringDomain,structuredAuthoringDomainLabel,structuredAuthoringDomains } from "@/lib/content-authoring-templates";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { createStructuredDraftAction } from "../../../../actions";
import styles from "../../studio.module.css";

export const dynamic="force-dynamic";

export default async function NewStructuredModulePage({params,searchParams}:Readonly<{params:Promise<{aircraftId:string}>;searchParams:Promise<{domain?:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const query=await searchParams;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const requestedDomain=query.domain??"systems";
  if(!isStructuredAuthoringDomain(requestedDomain))notFound();
  const studio=deriveContentStudio(aircraft);
  const payload=createStructuredStarterPayload(aircraftId,requestedDomain);
  const manualOptions=[...new Map(aircraft.manuals.map(manual=>[manual.manualId,{id:manual.manualId,label:`${manual.title} · ${manual.publisher}`}])).values()];
  const variantProfiles=aircraft.variantProfiles??[];
  const equipmentTags=[...new Set([...(aircraft.equipmentTags??[]),...variantProfiles.flatMap(profile=>profile.equipmentTags)])].sort();
  const variantOptions=variantProfiles.map(profile=>({id:profile.key,label:profile.displayName}));

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="content">
    <section className={styles.pageHeader}><p className="eyebrow">New content</p><h2>{structuredAuthoringDomainLabel(requestedDomain)}</h2><p>Start with an empty structure and add only source-backed aircraft information.</p></section>

    <section className={styles.newContentBar}><div><strong>Content type</strong><span>Switching type resets this unsaved form.</span></div><form action={`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/new`} method="get" className={styles.inlineActions}><select name="domain" defaultValue={requestedDomain}>{structuredAuthoringDomains.map(domain=><option key={domain} value={domain}>{structuredAuthoringDomainLabel(domain)}</option>)}</select><button type="submit">Switch</button></form></section>

    {studio.references.length?<form action={createStructuredDraftAction} className={styles.editorForm}>
      <input type="hidden" name="aircraftId" value={aircraftId}/><input type="hidden" name="domain" value={requestedDomain}/>
      <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Configuration scope</p><h3>Where does this content apply?</h3></div><Link className={styles.textLink} href={`/admin/aircraft/${aircraftId}/settings`}>Configure aircraft →</Link></div>
        {variantProfiles.length?<div className={styles.compactList}>{variantProfiles.map(profile=><div className={styles.compactItem} key={profile.key}><div><strong>{profile.displayName}</strong><span>Variant <code>{profile.key}</code></span></div><span>{profile.equipmentTags.length?profile.equipmentTags.map(tag=><code key={tag}>{tag} </code>):"No equipment tags"}</span></div>)}</div>:<div className={styles.empty}><strong>Common configuration</strong><p>No variant scope is required unless the source material genuinely differs by configuration.</p></div>}
        {equipmentTags.length?<p className={styles.subtle}>Registered equipment tags: {equipmentTags.map((tag,index)=><span key={tag}><code>{tag}</code>{index<equipmentTags.length-1?" · ":""}</span>)}</p>:null}
        <p className={styles.subtle}>Applicability fields in the editor are optional. Empty variant/equipment lists mean common content. Unknown identifiers are blocked at approval and publication.</p>
      </section>
      <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Sources</p><h3>What supports this content?</h3></div></div><div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong>{reference.note?<small>{reference.note}</small>:null}</span></label>)}</div></section>
      <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Editor</p><h3>Build the module</h3></div></div><StructuredContentBuilder domain={requestedDomain} aircraftId={aircraftId} initialPayload={payload} manualOptions={manualOptions} variantOptions={variantOptions} equipmentOptions={equipmentTags}/><details className={styles.quietDetails}><summary>Advanced identity</summary><label className={styles.field}>Internal content key<input name="contentKey" defaultValue="bundle" required/></label></details><div className={styles.stickySave}><span>Saving creates a draft. Nothing goes live automatically.</span><button type="submit">Create draft</button></div></section>
    </form>:<section className={styles.emptyState}><strong>Add a source reference first</strong><p>Technical content must be linked to at least one exact source location before it can be saved.</p><Link className={styles.primaryButton} href={`/admin/aircraft/${aircraftId}/sources`}>Open Sources →</Link></section>}
  </AdminAircraftWorkspace>;
}
