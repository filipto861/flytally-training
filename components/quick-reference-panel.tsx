"use client";

import { useMemo, useState } from "react";

import type { AircraftReferenceKnowledge } from "@/lib/reference-knowledge";
import styles from "./m6-training.module.css";

export function QuickReferencePanel({ content }: Readonly<{ content: AircraftReferenceKnowledge }>) {
  const [flyMode, setFlyMode] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");

  const groups = useMemo(() => {
    const ordered = [...content.groups].sort((a, b) => a.flyPriority - b.flyPriority);
    return groupFilter === "all" ? ordered : ordered.filter((group) => group.id === groupFilter);
  }, [content.groups, groupFilter]);

  return (
    <section className={flyMode ? styles.flyMode : undefined} aria-label="Quick reference">
      <div className={styles.toolbar}>
        <div>
          <strong>{flyMode ? "FLY mode" : "Quick Reference"}</strong>
          <div className={styles.toolbarGroup}>
            <button aria-pressed={flyMode} type="button" onClick={() => setFlyMode((value) => !value)}>
              {flyMode ? "Exit FLY mode" : "Enter FLY mode"}
            </button>
          </div>
        </div>
        <label>
          <span className="eyebrow">Show</span>
          <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
            <option value="all">All reference groups</option>
            {content.groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
          </select>
        </label>
      </div>

      <p className={styles.boundary}>{content.referenceNote}</p>

      <div className={styles.referenceGrid}>
        {groups.map((group) => (
          <section className={styles.referenceGroup} key={group.id}>
            <h2>{group.title}</h2>
            <div className={styles.referenceList}>
              {group.items.map((item) => (
                <article className={styles.referenceItem} key={item.id}>
                  <div className={styles.referenceTop}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                  {item.note ? <p>{item.note}</p> : null}
                  <small className={styles.source}>
                    Source · {item.source.map((source) => `Ch ${source.chapter} · ${source.section} · p. ${source.manualPage}`).join(" · ")}
                  </small>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
