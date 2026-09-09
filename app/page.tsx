import Link from "next/link";

import { trainingAircraft } from "@/lib/aircraft-catalog";

export default function HomePage() {
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
          <p>Learjet 35/36 is the reference aircraft used to build and validate the complete FlyTally Training v1.0 experience.</p>
        </div>

        <div className="aircraft-grid aircraft-grid-single">
          {trainingAircraft.map((aircraft) => {
            const manual = aircraft.manuals[0];
            return (
              <Link className="aircraft-card aircraft-card-featured" href={`/aircraft/${aircraft.id}`} key={aircraft.id}>
                <div>
                  <div className="card-kicker-row">
                    <span className="source-pill">Reference aircraft</span>
                    <span className="availability-dot">First Flight available</span>
                  </div>
                  <h3>{aircraft.displayName}</h3>
                  <p className="aircraft-subtitle">Variants {aircraft.variants.join(" · ")}</p>
                  <div className="aircraft-card-meta">
                    <span>Cold & Dark → Shutdown</span>
                    <span>{manual?.publisher} · Rev {manual?.revision}</span>
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
