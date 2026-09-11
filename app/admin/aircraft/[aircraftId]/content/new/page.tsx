import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredContentBuilder } from "@/components/structured-content-builder";
import { requireTrainingAdmin } from "@/lib/admin-auth";
import { deriveContentStudio } from "@/lib/admin-content-studio";
import {
  createStructuredStarterPayload,
  isStructuredAuthoringDomain,
  structuredAuthoringDomainLabel,
  structuredAuthoringDomains,
} from "@/lib/content-authoring-templates";
import { getAdminAircraft } from "@/lib/content-admin-repository";
import { createStructuredDraftAction } from "../../../../actions";
import styles from "../../studio.module.css";

export const dynamic = "force-dynamic";

export default async function NewStructuredModulePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ domain?: string }>;
}>) {
  await requireTrainingAdmin();
  const { aircraftId } = await params;
  const query = await searchParams;
  const aircraft = await getAdminAircraft(aircraftId);
  if (!aircraft) notFound();

  const requestedDomain = query.domain ?? "checklists";
  if (!isStructuredAuthoringDomain(requestedDomain)) notFound();

  const studio = deriveContentStudio(aircraft);
  const payload = createStructuredStarterPayload(aircraftId, requestedDomain);
  const manualOptions = [...new Map(aircraft.manuals.map(manual => [
    manual.manualId,
    { id: manual.manualId, label: `${manual.title} · ${manual.publisher}` },
  ])).values()];

  return <main className="shell aircraft-detail">
    <Link className="back-link" href={`/admin/aircraft/${encodeURIComponent(aircraftId)}#authoring`}>← Content Studio</Link>

    <section className="workspace-section-hero">
      <p className="eyebrow">M33 · New module composer</p>
      <h1>New {structuredAuthoringDomainLabel(requestedDomain)} module</h1>
      <p className="lede">Start from a structural template only. FlyTally does not pre-fill aircraft facts, procedures, limits or performance values. Saving creates a human draft; review, approval and publication remain separate governance steps.</p>
      <nav className={styles.studioNav} aria-label="Choose content domain">
        {structuredAuthoringDomains.map(domain => <Link key={domain} href={`/admin/aircraft/${encodeURIComponent(aircraftId)}/content/new?domain=${encodeURIComponent(domain)}`}>{structuredAuthoringDomainLabel(domain)}</Link>)}
      </nav>
    </section>

    <section className="reference-library">
      <div className={styles.sectionHeader}><div><p className="eyebrow">Provenance</p><h2>Link exact source references</h2></div><p>At least one governed source reference is required to save a technical draft. These links are the immutable review boundary for the new version.</p></div>
      {studio.references.length ? <form action={createStructuredDraftAction}>
        <input type="hidden" name="aircraftId" value={aircraftId}/>
        <input type="hidden" name="domain" value={requestedDomain}/>
        <div className={styles.formGrid}>
          <label>Content key<input name="contentKey" defaultValue="bundle" required/></label>
        </div>
        <div className={styles.sourceChoices}>{studio.references.map(reference => <label className={styles.sourceChoice} key={reference.id}><input type="checkbox" name="sourceReferenceId" value={reference.id}/><span><strong>{reference.label}</strong>{reference.note ? <small>{reference.note}</small> : null}</span></label>)}</div>
        <StructuredContentBuilder domain={requestedDomain} aircraftId={aircraftId} initialPayload={payload} manualOptions={manualOptions}/>
        <p><button type="submit">Create governed human draft</button></p>
      </form> : <div className={styles.empty}><p><strong>No exact source references are available yet.</strong></p><p>Create at least one source revision and chapter/section/page reference in Content Studio before authoring technical content.</p><Link href={`/admin/aircraft/${encodeURIComponent(aircraftId)}#references`}>Go to source references →</Link></div>}
    </section>
  </main>;
}
