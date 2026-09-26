"use client";

import { useMemo, useState } from "react";

import type {
  AircraftPerformanceContent,
  PerformanceAxis,
  PerformanceDataset,
  PerformanceRow,
  PerformanceScalar,
} from "@/lib/universal-aircraft-content";

import styles from "./reference-performance-table.module.css";

function scalarKey(value: PerformanceScalar): string {
  return `${typeof value}:${String(value)}`;
}

function scalarLabel(value: PerformanceScalar): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.abs(value) < 10 ? 3 : 1,
    }).format(value);
  }
  return value;
}

function axisValueLabel(axis: PerformanceAxis, value: PerformanceScalar): string {
  return `${scalarLabel(value)}${axis.unit ? ` ${axis.unit}` : ""}`;
}

function sourceKey(source: {
  manualId: string;
  section?: string;
  pageLabel?: string;
}): string {
  return [source.manualId, source.section, source.pageLabel].filter(Boolean).join(" · ");
}

function rowMatches(
  row: PerformanceRow,
  inputs: Readonly<Record<string, PerformanceScalar>>,
): boolean {
  return Object.entries(inputs).every(([key, value]) => {
    const rowValue = row.inputs[key];
    return rowValue !== undefined
      && scalarKey(rowValue) === scalarKey(value);
  });
}

function exactRow(
  dataset: PerformanceDataset,
  inputs: Readonly<Record<string, PerformanceScalar>>,
): PerformanceRow | undefined {
  const rows = dataset.rows.filter((row) => rowMatches(row, inputs));
  return rows.length === 1 ? rows[0] : undefined;
}

function SourceCell({
  dataset,
  row,
}: Readonly<{
  dataset: PerformanceDataset;
  row?: PerformanceRow;
}>) {
  if (!row) {
    return (
      <td className={styles.unavailableCell}>
        <span>—</span>
        <small>Unavailable</small>
      </td>
    );
  }

  return (
    <td>
      <div className={styles.cellValues}>
        {dataset.outputs.map((output) => {
          const value = row.outputs[output.key];
          return (
            <span key={output.key}>
              <small>{output.label}</small>
              <strong>
                {value === undefined ? "—" : scalarLabel(value)}
                {value !== undefined && output.unit ? ` ${output.unit}` : ""}
              </strong>
            </span>
          );
        })}
      </div>
    </td>
  );
}

export function FtReferencePerformanceTable({
  content,
}: Readonly<{
  content: AircraftPerformanceContent;
}>) {
  const datasets = content.datasets;
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0];

  const sliceAxis = dataset?.axes[0];
  const rowAxis = dataset?.axes[1];
  const columnAxis = dataset?.axes[2];
  const [sliceKey, setSliceKey] = useState(
    sliceAxis?.values[0] === undefined ? "" : scalarKey(sliceAxis.values[0]),
  );

  const selectedSlice = useMemo(() => {
    if (!sliceAxis) return undefined;
    return sliceAxis.values.find((value) => scalarKey(value) === sliceKey)
      ?? sliceAxis.values[0];
  }, [sliceAxis, sliceKey]);

  if (!dataset || !sliceAxis || !rowAxis || !columnAxis || selectedSlice === undefined) {
    return null;
  }

  const notes = dataset.notes ?? [];
  const sourceLines = [...new Set((dataset.sources ?? []).map(sourceKey))];

  return (
    <section
      className={styles.workspace}
      aria-labelledby="reference-source-tables-heading"
      data-ft-reference-source-table="true"
    >
      <header className={styles.header}>
        <div>
          <p>REFERENCE PERFORMANCE</p>
          <h2 id="reference-source-tables-heading">Published source tables</h2>
          <span>
            Exact published values for study and reference. No interpolated values are inserted into the table.
          </span>
        </div>
        <span className={styles.sourceOnly}>SOURCE VALUES</span>
      </header>

      <div className={styles.controls}>
        {datasets.length > 1 ? (
          <label>
            <span>Regime</span>
            <select
              value={dataset.id}
              onChange={(event) => {
                const nextDataset = datasets.find((item) => item.id === event.target.value);
                setDatasetId(event.target.value);
                const nextSlice = nextDataset?.axes[0]?.values[0];
                setSliceKey(nextSlice === undefined ? "" : scalarKey(nextSlice));
              }}
            >
              {datasets.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span>{sliceAxis.label}</span>
          <select
            value={scalarKey(selectedSlice)}
            onChange={(event) => setSliceKey(event.target.value)}
          >
            {sliceAxis.values.map((value) => {
              const key = scalarKey(value);
              return <option key={key} value={key}>{axisValueLabel(sliceAxis, value)}</option>;
            })}
          </select>
        </label>
      </div>

      <div className={styles.tableFrame} role="region" aria-label={`${dataset.title} source table`} tabIndex={0}>
        <table>
          <caption>
            {dataset.title} · {sliceAxis.label}: {axisValueLabel(sliceAxis, selectedSlice)}
          </caption>
          <thead>
            <tr>
              <th scope="col">{rowAxis.label}{rowAxis.unit ? ` (${rowAxis.unit})` : ""}</th>
              {columnAxis.values.map((columnValue) => (
                <th scope="col" key={scalarKey(columnValue)}>
                  {axisValueLabel(columnAxis, columnValue)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowAxis.values.map((rowValue) => (
              <tr key={scalarKey(rowValue)}>
                <th scope="row">{axisValueLabel(rowAxis, rowValue)}</th>
                {columnAxis.values.map((columnValue) => (
                  <SourceCell
                    dataset={dataset}
                    key={scalarKey(columnValue)}
                    row={exactRow(dataset, {
                      [sliceAxis.key]: selectedSlice,
                      [rowAxis.key]: rowValue,
                      [columnAxis.key]: columnValue,
                    })}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.boundaryNote}>
        Blank or blocked source cells remain unavailable. This LEARN table does not extrapolate or synthesize values.
      </p>

      <details className={styles.sourceDetails}>
        <summary>Source, effectivity & boundaries</summary>
        <div>
          {dataset.description ? <p>{dataset.description}</p> : null}
          {notes.length ? (
            <ul>{notes.filter(Boolean).map((note) => <li key={note}>{note}</li>)}</ul>
          ) : null}
          {sourceLines.length ? (
            <p className={styles.sources}>
              {sourceLines.map((source) => <span key={source}>{source}</span>)}
            </p>
          ) : null}
          {content.disclaimer ? <p>{content.disclaimer}</p> : null}
        </div>
      </details>
    </section>
  );
}
