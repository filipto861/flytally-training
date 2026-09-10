import Link from "next/link";

import { getTrainingContentRepository } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.listAircraft();

  return (
    <main className="shell home-shell">
      <section className="hero hero-compact">
        <p className="eyebrow">Aircraft training</p>
        <h1>Choose an aircraft. Train the published material.</h1>
        <p className="lede">
          Work with source-backed checklists, procedures, performance, limitations, systems and other modules published for the selected aircraft.
        </p>
      </section>

      <section className="aircraft-section" aria-labelledby="aircraft-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aircraft library</p>
            <h2 id="aircraft-title">Your training aircraft</h2>
          </div>
          <p>Aircraft with governed training content appear here. The product experience is shared; aircraft-specific material comes from the content repository.</p>
        </div>

        <div className={`aircraft-grid ${aircraft.length === 1 ? "aircraft-grid-single" : ""}`}>
          {aircraft.map((item) => {
            const manual = item.manuals[0];
            return (
              <Link
                className={`aircraft-card ${aircraft.length === 1 ? "aircraft-card-featured" : ""}`}
                href={`/aircraft/${item.id}`}
                key={item.id}
              >
                <div>
                  <div className="card-kicker-row">
                    <span className="source-pill">Training aircraft</span>
                    <span className="availability-dot">Published training available</span>
                  </div>
                  <h3>{item.displayName}</h3>
                  {item.variants.length ? <p className="aircraft-subtitle">Variants {item.variants.join(" · ")}</p> : null}
                  <div className="aircraft-card-meta">
                    <span>Module-driven aircraft training</span>
                    {manual ? <span>{manual.publisher} · Rev {manual.revision}</span> : <span>Source registration in progress</span>}
                  </div>
                </div>
                <span className="card-action">Open training workspace →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
