import type { AircraftSystemLesson } from "@/lib/universal-aircraft-content";

import { FtSystemSchematic } from "./FtSystemSchematic";
import styles from "./ft-systems.module.css";

type SectionKey =
  | "components"
  | "controls"
  | "indications"
  | "normalOperation"
  | "limitations"
  | "abnormalCues"
  | "remember";

const sections: readonly { key: SectionKey; title: string }[] = [
  { key: "components", title: "Components" },
  { key: "controls", title: "Pilot controls" },
  { key: "indications", title: "Indications" },
  { key: "normalOperation", title: "Normal operation" },
  { key: "limitations", title: "Limitations" },
  { key: "abnormalCues", title: "Abnormal cues" },
  { key: "remember", title: "Remember" },
];

function sourceLabel(source: NonNullable<AircraftSystemLesson["sources"]>[number]): string {
  return [
    source.manualId,
    source.chapter ? "Ch " + source.chapter : undefined,
    source.section,
    "p. " + source.pageLabel,
  ].filter(Boolean).join(" · ");
}

export type FtSystemDetailProps = {
  readonly system: AircraftSystemLesson;
};

export function FtSystemDetail({ system }: FtSystemDetailProps) {
  return (
    <article className={styles.detail}>
      <header className={styles.detailHeader}>
        <p className={styles.eyebrow}>SELECTED SYSTEM</p>
        <h2>{system.title}</h2>
        <p>{system.summary}</p>
      </header>

      {system.mentalModel ? (
        <section className={styles.mentalModel}>
          <h3>Mental model</h3>
          <p>{system.mentalModel}</p>
        </section>
      ) : null}

      {system.schematic ? (
        <FtSystemSchematic schematic={system.schematic} />
      ) : null}

      <div className={styles.sectionGrid}>
        {sections.map((section) => {
          const items = system[section.key];
          if (!items?.length) return null;
          return (
            <section key={section.key} className={styles.systemSection}>
              <h3>{section.title}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {system.sources?.length ? (
        <section className={styles.sourceSection} aria-label="System sources">
          <h3>Source</h3>
          <ul>
            {system.sources.map((source, index) => (
              <li key={source.manualId + ":" + source.pageLabel + ":" + index}>
                {sourceLabel(source)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
