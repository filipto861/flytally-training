"use client";

import { useMemo, useState } from "react";

import { filterPerformanceRows, getExactPerformanceRow, performanceScalarKey } from "@/lib/performance-runtime";
import type { PerformanceDataset, PerformanceScalar, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./performance-explorer.module.css";

const formatValue = (value: PerformanceScalar, unit?: string): string => `${String(value)}${unit ? ` ${unit}` : ""}`;
const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

function DatasetExplorer({ dataset }: Readonly<{ dataset: PerformanceDataset }>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const visibleRows = useMemo(() => filterPerformanceRows(dataset, filters), [dataset, filters]);
  const exactRow = useMemo(() => getExactPerformanceRow(dataset, filters), [dataset, filters]);

  function setAxis(axisKey: string, value: string) {
    setFilters((current) => ({ ...current, [axisKey]: value }));
  }

  function reset() { setFilters({}); }

  return (
    <section className={styles.dataset}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">{dataset.kind === "lookup-table" ? "Lookup table" : "Reference table"}</p>
          <h2>{dataset.title}</h2>
        </div>
        <span className={styles.interpolation}>Interpolation · {dataset.interpolation === "none" ? "none" : "explicit linear"}</span>
      </div>

      {dataset.description ? <p className={styles.description}>{dataset.description}</p> : null}

      <div className={styles.controls} aria-label={`${dataset.title} filters`}>
        {dataset.axes.map((axis) => (
          <label key={axis.key}>
            <span>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</span>
            <select value={filters[axis.key] ?? ""} onChange={(event) => setAxis(axis.key, event.target.value)}>
              <option value="">All</option>
              {axis.values.map((value) => <option key={performanceScalarKey(value)} value={performanceScalarKey(value)}>{String(value)}</option>)}
            </select>
          </label>
        ))}
        {Object.values(filters).some(Boolean) ? <button type="button" onClick={reset}>Reset</button> : null}
      </div>

      {exactRow ? (
        <div className={styles.result}>
          <p className="eyebrow">Selected result</p>
          <div className={styles.resultGrid}>
            {dataset.outputs.map((output) => (
              <div key={output.key}><span>{output.label}</span><strong>{formatValue(exactRow.outputs[output.key], output.unit)}</strong></div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              {dataset.axes.map((axis) => <th key={axis.key}>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</th>)}
              {dataset.outputs.map((output) => <th key={output.key}>{output.label}{output.unit ? ` (${output.unit})` : ""}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index}>
                {dataset.axes.map((axis) => <td key={axis.key}>{String(row.inputs[axis.key])}</td>)}
                {dataset.outputs.map((output) => <td key={output.key}>{formatValue(row.outputs[output.key], output.unit)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRows.length ? <p className={styles.empty}>No source row matches the selected values.</p> : null}
      </div>

      {dataset.notes?.length ? <ul className={styles.notes}>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
      {formatSources(dataset.sources) ? <p className={styles.source}><small>Source · {formatSources(dataset.sources)}</small></p> : null}
    </section>
  );
}

export function PerformanceExplorer({ datasets }: Readonly<{ datasets: readonly PerformanceDataset[] }>) {
  return <div className={styles.explorer}>{datasets.map((dataset) => <DatasetExplorer dataset={dataset} key={dataset.id} />)}</div>;
}
