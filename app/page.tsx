import Link from "next/link";

import { trainingAircraft } from "@/lib/aircraft-catalog";

const capabilities = [
  ["Manuals", "Revision-controlled source documents with explicit provenance."],
  ["Lessons", "Aircraft-specific learning modules built from approved material."],
  ["Procedures", "Interactive normal, abnormal and emergency procedure training."],
  ["Checklists", "Learn, practice, flow and challenge-response training modes."],
  ["Knowledge", "Source-linked questions, quizzes and review of weak areas."],
  ["Progress", "Per-aircraft learning progress without mixing it with logbook evidence."],
] as const;

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">FlyTally ecosystem</p>
        <h1>Training built from the aircraft manual.</h1>
        <p className="lede">
          Learn an aircraft by system, procedure and source — with every technical training item traceable to a controlled manual revision.
        </p>
        <div className="status">Manual-driven training · v0.1</div>
      </section>

      <section className="aircraft-section" aria-labelledby="aircraft-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aircraft library</p>
            <h2 id="aircraft-title">Choose an aircraft</h2>
          </div>
          <p>The first real training type is now connected to a controlled source record.</p>
        </div>

        <div className="aircraft-grid">
          {trainingAircraft.map((aircraft) => (
            <Link className="aircraft-card" href={`/aircraft/${aircraft.id}`} key={aircraft.id}>
              <div>
                <span className="source-pill">{aircraft.manuals.length} controlled manual</span>
                <h3>{aircraft.displayName}</h3>
                <p>{aircraft.manuals[0]?.publisher} · Revision {aircraft.manuals[0]?.revision}</p>
              </div>
              <span className="card-action">Open aircraft →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="principle" aria-labelledby="source-of-truth">
        <div>
          <p className="eyebrow">Core rule</p>
          <h2 id="source-of-truth">AI can draft. The manual remains the authority.</h2>
        </div>
        <p>
          Publishable technical content requires both an explicit human approval and a reference to a specific manual revision.
        </p>
      </section>

      <section className="grid" aria-label="Training capabilities">
        {capabilities.map(([title, description]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
