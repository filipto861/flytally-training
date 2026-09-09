import Link from "next/link";
import { notFound } from "next/navigation";

import { getTrainingAircraft } from "@/lib/aircraft-catalog";

export default async function AircraftPage({
  params,
}: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  const aircraft = getTrainingAircraft(aircraftId);

  if (!aircraft) notFound();

  const manual = aircraft.manuals[0];
  if (!manual) notFound();

  return (
    <main className="shell aircraft-detail">
      <Link className="back-link" href="/">← Aircraft library</Link>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">Aircraft type</p>
          <h1>{aircraft.displayName}</h1>
          <p className="lede">Variants covered by this training source: {aircraft.variants.join(", ")}.</p>
        </div>
        <div className="manual-summary">
          <span className="source-pill">Training source · not AFM</span>
          <h2>{manual.title}</h2>
          <dl>
            <div><dt>Publisher</dt><dd>{manual.publisher}</dd></div>
            <div><dt>Revision</dt><dd>{manual.revision}</dd></div>
            <div><dt>Issue</dt><dd>January 2020</dd></div>
          </dl>
          <p>{manual.authorityNote}</p>
        </div>
      </section>

      <section className="aircraft-section" aria-labelledby="start-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="start-title">Fly it from cold & dark</h2>
          </div>
          <p>The default simulator path is a complete normal sector. System theory stays available as supporting context, not a prerequisite.</p>
        </div>
        <div className="aircraft-grid">
          <Link className="aircraft-card" href={`/aircraft/${aircraft.id}/cold-dark`}>
            <div>
              <span className="source-pill">Simulator quick path</span>
              <h3>Cold & Dark → Shutdown</h3>
              <p>Power up, start, taxi, takeoff, climb, approach, landing and shutdown in one guided flow.</p>
            </div>
            <span className="card-action">Start training →</span>
          </Link>
        </div>
      </section>

      <section className="provenance-strip" aria-label="Manual provenance">
        <div><span>Identity</span><strong>PDF page {manual.sourceReferences.identityPage}</strong></div>
        <div><span>Authority notice</span><strong>PDF page {manual.sourceReferences.authorityNoticePage}</strong></div>
        <div><span>Revision record</span><strong>PDF page {manual.sourceReferences.revisionPage}</strong></div>
        <div><span>Curriculum source</span><strong>PDF page {manual.sourceReferences.contentsPage}</strong></div>
      </section>

      <section className="curriculum" aria-labelledby="curriculum-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Manual reference</p>
            <h2 id="curriculum-title">21 chapters when you need the detail</h2>
          </div>
          <p>The full manual structure remains available for deeper study, but it no longer defines the primary learning path.</p>
        </div>

        <ol className="chapter-list">
          {manual.chapters.map((chapter) => (
            <li className={chapter.status === "READY_TO_DRAFT" ? "chapter-ready" : undefined} key={chapter.number}>
              <span className="chapter-number">{String(chapter.number).padStart(2, "0")}</span>
              <div>
                <strong>{chapter.title}</strong>
                <span>Reference module</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
