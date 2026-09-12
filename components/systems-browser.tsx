"use client";

import { useEffect, useMemo, useState } from "react";

import { LearningCompletionButton } from "@/components/learning-completion-button";
import { filterSystems } from "@/lib/systems-runtime";
import type { AircraftSystemLesson } from "@/lib/universal-aircraft-content";
import styles from "./systems-browser.module.css";

export type RuntimeSystemLesson = AircraftSystemLesson & {
  readonly minutes?: number;
  readonly sourceLabel?: string;
};

type SectionDefinition = {
  readonly key: keyof Pick<AircraftSystemLesson, "components" | "controls" | "indications" | "normalOperation" | "limitations" | "abnormalCues" | "remember">;
  readonly title: string;
  readonly emphasis?: "normal" | "caution" | "memory";
};

const sections: readonly SectionDefinition[] = [
  { key: "components", title: "Components" },
  { key: "controls", title: "Pilot controls" },
  { key: "indications", title: "Indications" },
  { key: "normalOperation", title: "Normal operation" },
  { key: "limitations", title: "Limitations", emphasis: "caution" },
  { key: "abnormalCues", title: "Abnormal cues", emphasis: "caution" },
  { key: "remember", title: "Remember", emphasis: "memory" },
];

export function SystemsBrowser({
  aircraftId,
  systems,
}: Readonly<{
  aircraftId: string;
  systems: readonly RuntimeSystemLesson[];
}>) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(systems[0]?.id ?? "");
  const visible = useMemo(() => filterSystems(systems, { query }) as readonly RuntimeSystemLesson[], [systems, query]);
  const selected = systems.find((system) => system.id === selectedId) ?? visible[0];
  const visibleSelectedIndex = selected ? visible.findIndex((system) => system.id === selected.id) : -1;
  const previous = visibleSelectedIndex > 0 ? visible[visibleSelectedIndex - 1] : undefined;
  const next = visibleSelectedIndex >= 0 && visibleSelectedIndex < visible.length - 1 ? visible[visibleSelectedIndex + 1] : undefined;
  const selectedVisibleId = selected && visible.some((system) => system.id === selected.id) ? selected.id : visible[0]?.id ?? "";

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && systems.some((system) => system.id === hash)) setSelectedId(hash);
  }, [systems]);

  useEffect(() => {
    if (visible.length && !visible.some((system) => system.id === selectedId)) setSelectedId(visible[0].id);
  }, [selectedId, visible]);

  function selectSystem(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`);
  }

  return (
    <section className={styles.browser} aria-label="Systems learning workspace">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span>Search systems</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search control, indication, limitation…" />
        </label>
        <div className={styles.toolbarSummary}>
          <strong>{visible.length}</strong><span>{visible.length === 1 ? "system" : "systems"}</span>
          {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
        </div>
      </div>

      <label className={styles.mobilePicker}>
        <span>System</span>
        <select disabled={!visible.length} value={selectedVisibleId} onChange={(event) => selectSystem(event.target.value)}>
          {!visible.length ? <option value="">No matches</option> : visible.map((system) => <option key={system.id} value={system.id}>{system.title}</option>)}
        </select>
      </label>

      <div className={styles.layout}>
        <nav className={styles.index} aria-label="Available aircraft systems">
          <div className={styles.indexHeader}><strong>Systems</strong><small>Choose one topic.</small></div>
          <div className={styles.indexList}>
            {visible.map((system) => (
              <button aria-current={selected?.id === system.id ? "page" : undefined} className={selected?.id === system.id ? styles.active : undefined} key={system.id} onClick={() => selectSystem(system.id)} type="button">
                <strong>{system.title}</strong><span>{system.summary}</span>{system.minutes ? <small>{system.minutes} min</small> : null}
              </button>
            ))}
            {!visible.length ? <p className={styles.empty}>No system matches the current search.</p> : null}
          </div>
        </nav>

        {selected && visible.some((system) => system.id === selected.id) ? (
          <article className={styles.detail} id={selected.id}>
            <header className={styles.detailHeader}>
              <div><p className="eyebrow">System</p><h2>{selected.title}</h2><p>{selected.summary}</p></div>
              {selected.minutes ? <span className={styles.duration}>{selected.minutes} min</span> : null}
            </header>

            {selected.mentalModel ? <section className={styles.mentalModel}><span>Mental model</span><p>{selected.mentalModel}</p></section> : null}

            <div className={styles.sectionGrid}>
              {sections.map((definition) => {
                const items = selected[definition.key];
                if (!items?.length) return null;
                return <section className={`${styles.systemSection} ${definition.emphasis ? styles[definition.emphasis] : ""}`} key={definition.key}>
                  <h3>{definition.title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>;
              })}
            </div>

            {selected.sourceLabel ? <p className={styles.source}><small>Source · {selected.sourceLabel}</small></p> : null}
            <LearningCompletionButton aircraftId={aircraftId} kind="systems" contentId={selected.id} label={`Mark ${selected.title} complete`} />

            <footer className={styles.navigation}>
              {previous ? <button type="button" onClick={() => selectSystem(previous.id)}>← {previous.title}</button> : <span />}
              <span>{visibleSelectedIndex + 1} of {visible.length}</span>
              {next ? <button type="button" onClick={() => selectSystem(next.id)}>{next.title} →</button> : <span />}
            </footer>
          </article>
        ) : <div className={styles.noSelection}>Choose a system.</div>}
      </div>
    </section>
  );
}
