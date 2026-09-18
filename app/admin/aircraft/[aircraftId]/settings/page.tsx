import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAircraftPackageReadiness } from "@/lib/aircraft-package-readiness";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { trainingContentDomains } from "@/lib/content-admin-types";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { createDraftAction,publishAircraftAction,publishNativeModuleUpgradeAction,saveCommonEquipmentAction,saveVariantProfileAction,updateAircraftProfileAction } from "../../../actions";
import styles from "../studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");
const Hidden=({aircraftId}:{aircraftId:string})=><input type="hidden" name="aircraftId" value={aircraftId}/>;

export default async function AircraftSettingsPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const packageReadiness=await getAircraftPackageReadiness(aircraftId);
  const studio=deriveContentStudio(aircraft);
  const nativeUpgradeDomains=listStaticNativeUpgradeDomains(aircraftId);
  const variantProfiles=aircraft.variantProfiles??[];
  const commonEquipment=aircraft.equipmentTags??[];
  const configurationEditable=aircraft.status==="draft";

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="settings">
    <section className={styles.pageHeader}><p className="eyebrow">Settings</p><h2>Aircraft setup</h2><p>Aircraft identity and configuration are data. New aircraft and draft configurations do not require source-code changes.</p></section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Profile</p><h2>Aircraft identity</h2></div></div>
      <form action={updateAircraftProfileAction} className={styles.settingsCard}>
        <Hidden aircraftId={aircraftId}/>
        <div className={styles.formGrid}>
          <label>Display name<input name="displayName" defaultValue={aircraft.displayName} required/></label>
          <label>Manufacturer<input name="manufacturer" defaultValue={aircraft.manufacturer} required/></label>
          <label>Model<input name="model" defaultValue={aircraft.model} required/></label>
        </div>
        <button type="submit">Save profile</button>
      </form>
    </section>

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Catalogue</p><h2>Aircraft status</h2></div></div><div className={styles.settingsCard}><div><strong>{aircraft.status==="published"?"Published in the aircraft catalogue":packageReadiness.ready?"Package ready for catalogue release":"Package not ready for catalogue release"}</strong><p>{aircraft.status==="published"?"Learners can discover this aircraft according to the normal catalogue rules.":packageReadiness.ready?"Every source, contract, applicability, provenance and freshness gate currently passes.":"Resolve the package blockers before exposing the aircraft to learners."}</p>{aircraft.status!=="published"&&!packageReadiness.ready?<ul>{packageReadiness.blockers.map(blocker=><li key={blocker.id}>{blocker.detail}</li>)}</ul>:null}</div>{aircraft.status!=="published"&&packageReadiness.ready?<form action={publishAircraftAction}><Hidden aircraftId={aircraftId}/><button type="submit">Publish aircraft entry</button></form>:null}</div><p><Link className={styles.textLink} href={`/admin/aircraft/${aircraftId}/onboarding`}>Open package readiness →</Link></p></section>

    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}><div><p className="eyebrow">Configuration</p><h2>Variants &amp; equipment</h2></div></div>
      <p>Variants are optional. Equipment tags are exact configuration identifiers used by content applicability; FlyTally never infers equipment from an aircraft or variant name.</p>
      <div className={styles.settingsCard}>
        <div><strong>Common equipment</strong><p>{commonEquipment.length?`${commonEquipment.length} tag${commonEquipment.length===1?"":"s"} apply to every configuration`:"No equipment tags apply globally. Add only equipment that is genuinely installed across the aircraft configuration."}</p>{commonEquipment.length?<p>{commonEquipment.map(tag=><code key={tag}>{tag} </code>)}</p>:null}</div>
        {configurationEditable?<form action={saveCommonEquipmentAction} className={styles.editorForm}>
          <Hidden aircraftId={aircraftId}/>
          <label className={styles.full}>Common equipment tags<textarea name="equipmentTags" defaultValue={commonEquipment.join(", ")} placeholder="engine-model, propeller-model, avionics-package"/></label>
          <button type="submit">Save common equipment</button>
        </form>:null}
      </div>
      {variantProfiles.length?variantProfiles.map(profile=><div className={styles.settingsCard} key={profile.key}>
        <div><strong>{profile.displayName}</strong><p><code>{profile.key}</code>{profile.equipmentTags.length?` · ${profile.equipmentTags.length} equipment tag${profile.equipmentTags.length===1?"":"s"}`:" · no equipment tags"}</p>{profile.note?<p>{profile.note}</p>:null}</div>
        {configurationEditable?<form action={saveVariantProfileAction} className={styles.editorForm}>
          <Hidden aircraftId={aircraftId}/><input type="hidden" name="variantKey" value={profile.key}/>
          <div className={styles.formGrid}>
            <label>Display name<input name="variantDisplayName" defaultValue={profile.displayName} required/></label>
            <label className={styles.full}>Variant-only equipment tags<textarea name="equipmentTags" defaultValue={profile.equipmentTags.join(", ")} placeholder="equipment installed only in this variant"/></label>
            <label className={styles.full}>Configuration note<textarea name="variantNote" defaultValue={profile.note??""}/></label>
          </div><button type="submit">Save configuration</button>
        </form>:null}
      </div>):<div className={styles.settingsCard}><div><strong>Common configuration</strong><p>No variants are required when all published content applies to the aircraft generally.</p></div></div>}
      {configurationEditable?<div className={styles.settingsCard}><div><strong>Add configuration variant</strong><p>Create a stable variant key and explicitly list installed equipment used by applicability rules.</p></div><form action={saveVariantProfileAction} className={styles.editorForm}>
        <Hidden aircraftId={aircraftId}/>
        <div className={styles.formGrid}>
          <label>Variant key<input name="variantKey" placeholder="sn-001" required/></label>
          <label>Display name<input name="variantDisplayName" placeholder="S/N 001 · Registration" required/></label>
          <label className={styles.full}>Variant-only equipment tags<textarea name="equipmentTags" placeholder="equipment installed only in this variant"/></label>
          <label className={styles.full}>Configuration note<textarea name="variantNote" placeholder="Optional source-backed configuration context"/></label>
        </div><button type="submit">Add variant</button>
      </form></div>:<div className={styles.settingsCard}><div><strong>Configuration locked for this release</strong><p>Published aircraft keep their variant/equipment profile stable so applicability cannot change outside the governed release boundary. Configure variants before catalogue publication.</p></div></div>}
    </section>

    <section className={styles.sectionBlock}><details className={styles.dangerZone}><summary>Advanced tools</summary><p>Migration and contract-level tools. These are intentionally hidden from normal authoring.</p>
      {nativeUpgradeDomains.length?<details className={styles.quietDetails}><summary>Publish reviewed in-repository module upgrade</summary><p>Publishing creates a new immutable version through the governed lifecycle and never overwrites the existing version in place.</p><form action={publishNativeModuleUpgradeAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Module<select name="domain" required>{nativeUpgradeDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label></div><label><input name="confirmReviewedNativeUpgrade" type="checkbox" value="yes" required/> I confirm this reviewed native module should become the next immutable release.</label><p><button type="submit">Approve and publish upgrade</button></p></form></details>:null}
      <details className={styles.quietDetails}><summary>Create raw JSON draft</summary><p>Use only when the structured editor cannot represent a required payload.</p><form action={createDraftAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Content type<select name="domain">{trainingContentDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label><label>Internal key<input name="contentKey" defaultValue="bundle"/></label><label>Origin<select name="origin"><option value="human">human</option><option value="import">import</option></select></label></div>{studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong></span></label>)}</div>:null}<textarea className={styles.codearea} name="payload" required/><p><button type="submit">Create raw draft</button></p></form></details>
    </details></section>
  </AdminAircraftWorkspace>;
}
