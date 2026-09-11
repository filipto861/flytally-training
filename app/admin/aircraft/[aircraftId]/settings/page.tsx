import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAircraftWorkspace } from "@/components/admin-aircraft-workspace";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { trainingContentDomains } from "@/lib/content-admin-types";
import { listStaticNativeUpgradeDomains } from "@/lib/governed-static-bootstrap";
import { addVariantAction,createDraftAction,publishAircraftAction,publishNativeModuleUpgradeAction } from "../../../actions";
import styles from "../studio.module.css";

export const dynamic="force-dynamic";
const domainLabel=(value:string)=>value.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");
const Hidden=({aircraftId}:{aircraftId:string})=><input type="hidden" name="aircraftId" value={aircraftId}/>;

export default async function AircraftSettingsPage({params}:Readonly<{params:Promise<{aircraftId:string}>}>){
  await requireTrainingAdmin();
  const {aircraftId}=await params;
  const aircraft=await getAdminAircraft(aircraftId);
  if(!aircraft)notFound();
  const studio=deriveContentStudio(aircraft);
  const nativeUpgradeDomains=listStaticNativeUpgradeDomains(aircraftId);

  return <AdminAircraftWorkspace aircraftId={aircraftId} displayName={aircraft.displayName} status={aircraft.status} active="settings">
    <section className={styles.pageHeader}><p className="eyebrow">Settings</p><h2>Aircraft setup</h2><p>Configuration and rarely used administrative tools live here, away from day-to-day content work.</p></section>

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Catalogue</p><h2>Aircraft status</h2></div></div><div className={styles.settingsCard}><div><strong>{aircraft.status==="published"?"Published in the aircraft catalogue":"Not yet published"}</strong><p>{aircraft.status==="published"?"Learners can discover this aircraft according to the normal catalogue rules.":"Publish the aircraft entry when its basic setup is ready. Content versions remain governed separately."}</p></div>{aircraft.status!=="published"?<form action={publishAircraftAction}><Hidden aircraftId={aircraftId}/><button type="submit">Publish aircraft entry</button></form>:null}</div><p><Link className={styles.textLink} href={`/admin/aircraft/${aircraftId}/onboarding`}>Open onboarding checklist →</Link></p></section>

    <section className={styles.sectionBlock}><div className={styles.sectionHeader}><div><p className="eyebrow">Configuration</p><h2>Variants</h2></div></div><div className={styles.settingsCard}><div><strong>{aircraft.variants.length?aircraft.variants.join(" · "):"Common configuration"}</strong><p>Variants are optional. Add one only when source applicability or training content genuinely differs.</p></div><form action={addVariantAction} className={styles.inlineActions}><Hidden aircraftId={aircraftId}/><input name="variant" placeholder="Variant name" required/><button type="submit">Add</button></form></div></section>

    <section className={styles.sectionBlock}><details className={styles.dangerZone}><summary>Advanced tools</summary><p>Migration and contract-level tools. These are intentionally hidden from normal authoring.</p>
      {nativeUpgradeDomains.length?<details className={styles.quietDetails}><summary>Publish reviewed in-repository module upgrade</summary><form action={publishNativeModuleUpgradeAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Module<select name="domain" required>{nativeUpgradeDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label></div><label><input name="confirmReviewedNativeUpgrade" type="checkbox" value="yes" required/> I confirm this reviewed native module should become the next immutable release.</label><p><button type="submit">Approve and publish upgrade</button></p></form></details>:null}
      <details className={styles.quietDetails}><summary>Create raw JSON draft</summary><p>Use only when the structured editor cannot represent a required payload.</p><form action={createDraftAction}><Hidden aircraftId={aircraftId}/><div className={styles.formGrid}><label>Content type<select name="domain">{trainingContentDomains.map(domain=><option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select></label><label>Internal key<input name="contentKey" defaultValue="bundle"/></label><label>Origin<select name="origin"><option value="human">human</option><option value="import">import</option></select></label></div>{studio.references.length?<div className={styles.sourceChoices}>{studio.references.map(reference=><label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong></span></label>)}</div>:null}<textarea className={styles.codearea} name="payload" required/><p><button type="submit">Create raw draft</button></p></form></details>
    </details></section>
  </AdminAircraftWorkspace>;
}
