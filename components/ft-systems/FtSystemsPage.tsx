"use client";

import { useState } from "react";

import type { AircraftSystemsContent } from "@/lib/universal-aircraft-content";

import { FtSystemDetail } from "./FtSystemDetail";
import { FtSystemsIndex } from "./FtSystemsIndex";
import styles from "./ft-systems.module.css";

export type FtSystemsPageProps = {
  readonly content: AircraftSystemsContent;
  readonly initialSystemId?: string;
};

export function FtSystemsPage({
  content,
  initialSystemId,
}: FtSystemsPageProps) {
  const initialSelection = initialSystemId
    && content.systems.some((system) => system.id === initialSystemId)
    ? initialSystemId
    : content.systems[0]?.id ?? null;

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
    initialSelection,
  );

  if (!content.systems.length) {
    return (
      <main
        className={styles.page}
        aria-label="Systems workspace"
        data-ft-systems-page="true"
      >
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>SYSTEMS</p>
          <h1>Systems</h1>
        </header>
        <div className={styles.emptyState}>
          <p>No systems content is published for this configuration.</p>
        </div>
      </main>
    );
  }

  const selectedSystem = content.systems.find(
    (system) => system.id === selectedSystemId,
  ) ?? content.systems[0];

  return (
    <main
      className={styles.page}
      aria-label="Systems workspace"
      data-ft-systems-page="true"
    >
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>SYSTEMS</p>
        <h1>Systems</h1>
        <p className={styles.lede}>
          Build the functional picture, then inspect source-backed relationships.
        </p>
      </header>

      <div className={styles.layout}>
        <FtSystemsIndex
          systems={content.systems}
          selectedSystemId={selectedSystem.id}
          onSelect={setSelectedSystemId}
        />
        <FtSystemDetail system={selectedSystem} />
      </div>
    </main>
  );
}
