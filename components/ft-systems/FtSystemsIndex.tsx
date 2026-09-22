"use client";

import type { AircraftSystemLesson } from "@/lib/universal-aircraft-content";

import styles from "./ft-systems.module.css";

export type FtSystemsIndexProps = {
  readonly systems: readonly AircraftSystemLesson[];
  readonly selectedSystemId: string | null;
  readonly onSelect: (systemId: string) => void;
};

export function FtSystemsIndex({
  systems,
  selectedSystemId,
  onSelect,
}: FtSystemsIndexProps) {
  return (
    <>
      <nav className={styles.indexPanel} aria-label="Available aircraft systems">
        <div className={styles.indexHeader}>
          <strong>Systems</strong>
          <span>{systems.length} published</span>
        </div>
        <div className={styles.indexList}>
          {systems.map((system) => {
            const selected = selectedSystemId === system.id;
            return (
              <button
                key={system.id}
                type="button"
                className={styles.indexButton}
                aria-current={selected ? "page" : undefined}
                onClick={() => onSelect(system.id)}
              >
                <strong>{system.title}</strong>
                <span>{system.summary}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <label className={styles.mobilePicker}>
        <span>System</span>
        <select
          value={selectedSystemId ?? ""}
          onChange={(event) => onSelect(event.target.value)}
        >
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.title}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
