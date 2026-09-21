"use client";

import type { AircraftSearchResult, AircraftSearchResultType } from "@/lib/search/aircraft-search";

import { FtSearchIcon } from "./icons/FtSearchIcon";
import styles from "./ft-search.module.css";

const TYPE_LABELS: Readonly<Record<AircraftSearchResultType, string>> = {
  procedure: "Procedure",
  memoryItem: "Memory Item",
  limitation: "Limitation",
  system: "System",
  component: "Component",
  performance: "Performance",
  scenario: "Scenario",
  source: "Source",
};

export function FtSearchResults({
  results,
  selectedIndex,
  onSelect,
}: Readonly<{
  results: readonly AircraftSearchResult[];
  selectedIndex: number;
  onSelect: (result: AircraftSearchResult) => void;
}>) {
  if (!results.length) {
    return (
      <div className={styles.noResults} role="status">
        No matching aircraft content.
      </div>
    );
  }

  return (
    <div id="ft-search-results" className={styles.results} role="listbox" aria-label="Search results">
      {results.map((result, index) => {
        const selected = index === selectedIndex;
        const optionId = `ft-search-result-${index}`;
        const rowClassName = selected
          ? `${styles.resultRow} ${styles.resultRowSelected}`
          : styles.resultRow;
        return (
          <button
            key={`${result.type}:${result.id}`}
            id={optionId}
            type="button"
            role="option"
            aria-selected={selected}
            className={rowClassName}
            onClick={() => onSelect(result)}
          >
            <span className={styles.resultIcon}><FtSearchIcon name={result.type} /></span>
            <span className={styles.resultText}>
              <span className={styles.resultTitle}>{result.title}</span>
              <span className={styles.resultMeta}>
                {TYPE_LABELS[result.type]} · {result.context}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
