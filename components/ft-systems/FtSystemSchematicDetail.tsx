"use client";

import type {
  AircraftSystemSchematic,
  TrainingSourceReference,
} from "@/lib/universal-aircraft-content";

import styles from "./ft-systems.module.css";

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function sourceLabel(source: TrainingSourceReference): string {
  return [
    source.manualId,
    source.chapter ? "Ch " + source.chapter : undefined,
    source.section,
    "p. " + source.pageLabel,
  ].filter(Boolean).join(" · ");
}

export type FtSystemSchematicDetailProps = {
  readonly schematic: AircraftSystemSchematic;
  readonly selectedNodeId: string | null;
  readonly onClearSelection: () => void;
};

export function FtSystemSchematicDetail({
  schematic,
  selectedNodeId,
  onClearSelection,
}: FtSystemSchematicDetailProps) {
  const selectedNode = schematic.nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className={styles.schematicDetail} aria-live="polite">
        <p className={styles.eyebrow}>SCHEMATIC DETAIL</p>
        <h3>Select a component</h3>
        <p>Select a component to see its source-backed details and connections.</p>
      </aside>
    );
  }

  const connections = schematic.edges.flatMap((edge) => {
    if (edge.from !== selectedNode.id && edge.to !== selectedNode.id) return [];
    const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
    const otherNode = schematic.nodes.find((node) => node.id === otherId);
    if (!otherNode) return [];
    return [{ edge, otherNode }];
  });
  const sources = selectedNode.sources ?? schematic.sources;

  return (
    <aside className={styles.schematicDetail} aria-live="polite">
      <div className={styles.schematicDetailHeader}>
        <div>
          <p className={styles.eyebrow}>SELECTED {selectedNode.role.toUpperCase()}</p>
          <h3>{selectedNode.label}</h3>
        </div>
        <button
          className={styles.clearSelection}
          type="button"
          onClick={onClearSelection}
        >
          Clear
        </button>
      </div>

      {selectedNode.summary ? (
        <p>{selectedNode.summary}</p>
      ) : (
        <p>No additional source-backed summary is published for this component.</p>
      )}

      <section className={styles.connectionSection}>
        <h4>Connected to</h4>
        {connections.length ? (
          <ul>
            {connections.map(({ edge, otherNode }) => (
              <li key={edge.id}>
                <strong>{otherNode.label}</strong>
                {edge.label ? <span> ({edge.label})</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No published direct connections.</p>
        )}
      </section>

      <section className={styles.schematicSourceSection}>
        <h4>Source</h4>
        <ul>
          {sources.map((source, index) => (
            <li key={source.manualId + ":" + source.pageLabel + ":" + index}>
              {sourceLabel(source)}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
