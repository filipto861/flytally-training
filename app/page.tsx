import Link from "next/link";

import { PwaInstallCard } from "@/components/pwa-install-card";
import { getTrainingContentRepository } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repository = getTrainingContentRepository();
  const aircraft = await repository.listAircraft();

  return (
    <main className="shell home-shell pilot-library">
      <section className="pilot-library-header">
        <p className="eyebrow">FlyTally Training</p>
        <h1>Your aircraft</h1>
        <p>Select an aircraft to open its training workspace.</p>
      </section>

      <section className="pilot-aircraft-list" aria-label="Training aircraft">
        {aircraft.length ? aircraft.map((item) => <Link className="pilot-aircraft-row" href={`/aircraft/${item.id}`} key={item.id}>
          <div className="pilot-aircraft-row-main">
            <h2>{item.displayName}</h2>
            {item.variants.length ? <p>{item.variants.join(" · ")}</p> : <p>Published training package</p>}
          </div>
          <span className="pilot-aircraft-row-status">Available</span>
          <span className="pilot-aircraft-row-action">Open workspace →</span>
        </Link>) : <div className="pilot-library-empty" role="status"><strong>No training aircraft available</strong><span>Published aircraft will appear here when their governed training package is available.</span></div>}
      </section>

      <PwaInstallCard />
    </main>
  );
}
