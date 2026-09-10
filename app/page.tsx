import Link from "next/link";

import { getTrainingContentRepository } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.listAircraft();
  const aircraftEntries = await Promise.all(
    aircraft.map(async (item) => ({
      aircraft: item,
      normalFlight: await repository.getNormalFlight(item.id),
    })),
  );

  return (
    <main className="shell home-shell">
      <section className="hero hero-compact">
        <p className="eyebrow">Aircraft training</p>
        <h1>Choose an aircraft. Learn it by flying.</h1>
        <p className="lede">
          Start cold & dark, learn only what matters, fly a complete sector and keep the full manual available when you want the detail.
        </p>
      </section>

      <section className="aircraft-section" aria-labelledby="aircraft-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aircraft library</p>
            <h2 id="aircraft-title">Your training aircraft</h2>
          </div>
          <p>Aircraft with controlled training content appear here. The product experience is shared; the aircraft-specific material comes from the content repository.</p>
        </div>

        <div className={`aircraft-grid ${aircraftEntries.length === 1 ? "aircraft-grid-single" : ""}`}>
          {aircraftEntries.map(({ aircraft: item, normalFlight }) => {
            const manual = item.manuals[0];
            return (
              <Link
                className={`aircraft-card ${aircraftEntries.length === 1 ? "aircraft-card-featured" : ""}`}
                href={`/aircraft/${item.id}`}
                key={item.id}
              >
                <div>
                  <div className="card-kicker-row">
                    <span className="source-pill">Training aircraft</span>
                    <span className="availability-dot">{normalFlight ? "First Flight available" : "Content in progress"}</span>
                  </div>
                  <h3>{item.displayName}</h3>
                  <p className="aircraft-subtitle">Variants {item.variants.join(" · ")}</p>
                  <div className="aircraft-card-meta">
                    {normalFlight ? <span>{normalFlight.title}</span> : null}
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
