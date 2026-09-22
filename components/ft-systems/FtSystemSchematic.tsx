"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import type { AircraftSystemSchematic } from "@/lib/universal-aircraft-content";

import { FtSystemSchematicDetail } from "./FtSystemSchematicDetail";
import { FtSystemSchematicNode } from "./FtSystemSchematicNode";
import styles from "./ft-systems.module.css";

export type FtSystemSchematicProps = {
  readonly schematic: AircraftSystemSchematic;
};

export function FtSystemSchematic({
  schematic,
}: FtSystemSchematicProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (
      selectedNodeId
      && !schematic.nodes.some((node) => node.id === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
  }, [schematic.nodes, selectedNodeId]);

  const nodeById = useMemo(
    () => new Map(schematic.nodes.map((node) => [node.id, node] as const)),
    [schematic.nodes],
  );

  const connectedNodeIds = useMemo(() => {
    const connected = new Set<string>();
    if (!selectedNodeId) return connected;

    schematic.edges.forEach((edge) => {
      if (edge.from === selectedNodeId) connected.add(edge.to);
      if (edge.to === selectedNodeId) connected.add(edge.from);
    });
    return connected;
  }, [schematic.edges, selectedNodeId]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && selectedNodeId) {
      setSelectedNodeId(null);
    }
  }

  return (
    <section
      className={styles.schematicSection}
      aria-label={schematic.title ?? "System schematic"}
      onKeyDown={handleKeyDown}
    >
      <header className={styles.schematicHeader}>
        <div>
          <p className={styles.eyebrow}>LOGICAL SCHEMATIC</p>
          <h3>{schematic.title ?? "System schematic"}</h3>
        </div>
        <span>Not to scale</span>
      </header>

      {schematic.description ? (
        <p className={styles.schematicDescription}>{schematic.description}</p>
      ) : null}

      <div className={styles.schematicWorkspace}>
        <div className={styles.schematicContainer}>
          <svg
            aria-hidden="true"
            className={styles.schematicSvg}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {schematic.edges.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const active = selectedNodeId === edge.from || selectedNodeId === edge.to;
              return (
                <line
                  key={edge.id}
                  className={styles.schematicEdge}
                  data-active={active ? "true" : "false"}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                />
              );
            })}
          </svg>

          <div className={styles.schematicNodes}>
            {schematic.nodes.map((node) => (
              <FtSystemSchematicNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                connected={connectedNodeIds.has(node.id)}
                onSelect={setSelectedNodeId}
              />
            ))}
          </div>

          <div className={styles.edgeLabels}>
            {schematic.edges.map((edge) => {
              if (!edge.label) return null;
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const style = {
                "--edge-x": (from.x + to.x) / 2,
                "--edge-y": (from.y + to.y) / 2,
              } as CSSProperties;
              const active = selectedNodeId === edge.from || selectedNodeId === edge.to;
              return (
                <span
                  key={edge.id}
                  className={styles.edgeLabel}
                  data-active={active ? "true" : "false"}
                  style={style}
                >
                  {edge.label}
                </span>
              );
            })}
          </div>
        </div>

        <FtSystemSchematicDetail
          schematic={schematic}
          selectedNodeId={selectedNodeId}
          onClearSelection={() => setSelectedNodeId(null)}
        />
      </div>
    </section>
  );
}
