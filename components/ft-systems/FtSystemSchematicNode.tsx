"use client";

import type { CSSProperties } from "react";

import type { AircraftSystemSchematicNode } from "@/lib/universal-aircraft-content";

import styles from "./ft-systems.module.css";

export type FtSystemSchematicNodeProps = {
  readonly node: AircraftSystemSchematicNode;
  readonly selected: boolean;
  readonly connected: boolean;
  readonly onSelect: (nodeId: string) => void;
};

export function FtSystemSchematicNode({
  node,
  selected,
  connected,
  onSelect,
}: FtSystemSchematicNodeProps) {
  const style = {
    "--node-x": node.x,
    "--node-y": node.y,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={styles.schematicNode}
      style={style}
      aria-pressed={selected}
      data-connected={connected ? "true" : "false"}
      onClick={() => onSelect(node.id)}
    >
      {node.label}
    </button>
  );
}
