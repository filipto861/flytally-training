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
          A dedicated workspace for learning an aircraft, practicing procedures and proving where every technical training item came from.
        </p>
        <div className="status">Foundation · v0.0.1</div>
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

      <section className="grid" aria-label="Planned Training capabilities">
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
