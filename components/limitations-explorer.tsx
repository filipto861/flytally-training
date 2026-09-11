"use client";

import { useMemo, useState } from "react";

import { countLimitationItems, filterLimitationGroups } from "@/lib/limitations-runtime";
import type { LimitationGroup, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./limitations-explorer.module.css";

const ALL_GROUPS = "all";
const ALL_NOTICES = "all";

const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

export function LimitationsExplorer({ groups }: Readonly<{ groups: readonly LimitationGroup[] }>) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState(ALL_GROUPS);
  const [notice, setNotice] = useState<typeof ALL_NOTICES | "warning" | "caution">(ALL_NOTICES);
  const filtered = useMemo(() => filterLimitationGroups(groups, {
    query,
    groupId: groupId === ALL_GROUPS ? undefined : groupId,
    notice: notice === ALL_NOTICES ? undefined : notice,
  }), [groups, query, groupId, notice]);
  const visibleCount = countLimitationItems(filtered);
  const totalCount = countLimitationItems(groups);
  const activeFilters = Boolean(query || groupId !== ALL_GROUPS || notice !== ALL_NOTICES);

  function clearFilters() {
    setQuery("");
    setGroupId(ALL_GROUPS);
    setNotice(ALL_NOTICES);
  }

  return (
    <section className={styles.explorer} aria-label="Limitations quick reference">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span>Find a limitation</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search speed, weight, condition, warning…" />
        </label>
        <label>
          <span>Category</span>
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value={ALL_GROUPS}>All categories</option>
            {groups.map((group) => <option value={group.id} key={group.id}>{group.title}</option>)}
          </select>
        </label>
        <label>
          <span>Notice</span>
          <select value={notice} onChange={(event) => setNotice(event.target.value as typeof notice)}>
            <option value={ALL_NOTICES}>All</option>
            <option value="warning">Warnings</option>
            <option value="caution">Cautions</option>
          </select>
        </label>
      </div>

      <div className={styles.summary}>
        <div><strong>{visibleCount}</strong><span> of {totalCount} published limitations</span></div>
        {activeFilters ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}
      </div>

      {filtered.length ? filtered.map((group) => (
        <section className={styles.group} key={group.id}>
          <header>
            <div><p className="eyebrow">Limitation group</p><h2>{group.title}</h2></div>
            <span>{group.items.length} {group.items.length === 1 ? "item" : "items"}</span>
          </header>
          <div className={styles.grid}>
            {group.items.map((item) => {
              const itemSources = formatSources(item.sources);
              return (
                <article className={styles.item} id={item.id} key={item.id}>
                  <div className={styles.valueLine}>
                    <strong>{item.label}</strong>
                    <span className={styles.value}>{item.value}{item.unit ? <small> {item.unit}</small> : null}</span>
                  </div>
                  {item.condition ? <p className={styles.condition}><span>Applies when</span>{item.condition}</p> : null}
                  {item.notices?.map((entry, index) => (
                    <p className={styles[entry.kind]} key={`${item.id}-${entry.kind}-${index}`}>
                      <span>{entry.kind.toUpperCase()}</span>{entry.text}
                    </p>
                  ))}
                  {itemSources ? <small className={styles.source}>Source · {itemSources}</small> : null}
                </article>
              );
            })}
          </div>
          {formatSources(group.sources) ? <p className={styles.groupSource}><small>Group source · {formatSources(group.sources)}</small></p> : null}
        </section>
      )) : <div className={styles.empty}>No published limitation matches the current filters.</div>}
    </section>
  );
}
