"use client";

import { useEffect, useMemo, useState } from "react";

import { getPerformanceSelectionState, performanceScalarKey } from "@/lib/performance-runtime";
import type { PerformanceAxis, PerformanceDataset, PerformanceScalar, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./performance-explorer.module.css";

const formatValue = (value: PerformanceScalar | undefined, unit?: string): string => value === undefined ? "—" : `${String(value)}${unit ? ` ${unit}` : ""}`;
const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

function selectedAxisLabel(axis: PerformanceAxis, selectedKey: string | undefined): string | undefined {
  if (!selectedKey) return undefined;
  const value = axis.values.find((candidate) => performanceScalarKey(candidate) === selectedKey);
  return value === undefined ? undefined : formatValue(value, axis.unit);
}

function DatasetWorkspace({
  dataset,
  filters,
  onSetAxis,
  onReset,
}: Readonly<{
  dataset: PerformanceDataset;
  filters: Readonly<Record<string, string>>;
  onSetAxis: (axisKey: string, value: string) => void;
  onReset: () => void;
}>) {
  const selection = useMemo(() => getPerformanceSelectionState(dataset, filters), [dataset, filters]);
  const hasFilters = selection.selectedAxisCount > 0;
  const sourceLabel = formatSources(dataset.sources);

  const statusCopy = selection.status === "empty"
    ? dataset.axes.length
      ? `Select all ${dataset.axes.length} source inputs to obtain an exact published row.`
      : "This reference dataset has no selectable input axes."
    : selection.status === "partial"
      ? `${selection.missingAxisKeys.length} input${selection.missingAxisKeys.length === 1 ? "" : "s"} remaining · ${selection.matchingRows.length} source row${selection.matchingRows.length === 1 ? "" : "s"} currently match.`
      : selection.status === "exact"
        ? "Exact published source row found."
        : selection.status === "no-match"
          ? "No exact source row exists for this combination. No interpolation has been performed."
          : "More than one source row matches this complete input set, so FlyTally will not choose a result automatically.";

  return (
    <article className={styles.dataset} id={dataset.id}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">{dataset.kind === "lookup-table" ? "Lookup table" : "Reference table"}</p>
          <h2>{dataset.title}</h2>
          {dataset.description ? <p className={styles.description}>{dataset.description}</p> : null}
        </div>
        <div className={styles.datasetBadges}>
          <span>{dataset.rows.length} source rows</span>
          <span>Interpolation · {dataset.interpolation === "none" ? "none" : "source-defined linear"}</span>
        </div>
      </div>

      <section className={styles.lookupPanel} aria-label={`${dataset.title} exact lookup`}>
        <div className={styles.controls}>
          {dataset.axes.map((axis) => (
            <label key={axis.key}>
              <span>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</span>
              <select value={filters[axis.key] ?? ""} onChange={(event) => onSetAxis(axis.key, event.target.value)}>
                <option value="">Select…</option>
                {axis.values.map((value) => <option key={performanceScalarKey(value)} value={performanceScalarKey(value)}>{String(value)}</option>)}
              </select>
            </label>
          ))}
          {hasFilters ? <button type="button" onClick={onReset}>Reset inputs</button> : null}
        </div>

        {hasFilters ? (
          <div className={styles.selectedInputs} aria-label="Selected performance inputs">
            {dataset.axes.map((axis) => (
              <span key={axis.key}><small>{axis.label}</small><strong>{selectedAxisLabel(axis, filters[axis.key]) ?? "—"}</strong></span>
            ))}
          </div>
        ) : null}

        <div className={`${styles.lookupStatus} ${styles[`status_${selection.status}`]}`}>
          <strong>{selection.status === "exact" ? "Exact result" : "Source-row lookup"}</strong>
          <span>{statusCopy}</span>
        </div>

        {selection.exactRow ? (
          <div className={styles.result}>
            <p className="eyebrow">Published result</p>
            <div className={styles.resultGrid}>
              {dataset.outputs.map((output) => (
                <div key={output.key}><span>{output.label}</span><strong>{formatValue(selection.exactRow?.outputs[output.key], output.unit)}</strong></div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.referenceSection}>
        <div className={styles.tableHeading}>
          <div><strong>Source table</strong><span>{selection.matchingRows.length} of {dataset.rows.length} rows shown</span></div>
          {hasFilters ? <button type="button" onClick={onReset}>Show all rows</button> : null}
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                {dataset.axes.map((axis) => <th key={axis.key}>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</th>)}
                {dataset.outputs.map((output) => <th key={output.key}>{output.label}{output.unit ? ` (${output.unit})` : ""}</th>)}
              </tr>
            </thead>
            <tbody>
              {selection.matchingRows.map((row, index) => (
                <tr className={row === selection.exactRow ? styles.exactRow : undefined} key={index}>
                  {dataset.axes.map((axis) => <td key={axis.key}>{formatValue(row.inputs[axis.key], axis.unit)}</td>)}
                  {dataset.outputs.map((output) => <td key={output.key}>{formatValue(row.outputs[output.key], output.unit)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {!selection.matchingRows.length ? <p className={styles.empty}>No stored source row matches the selected values.</p> : null}
        </div>
      </section>

      {dataset.notes?.length ? <ul className={styles.notes}>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
      {dataset.interpolation !== "none" ? <p className={styles.interpolationBoundary}>The source marks linear interpolation as applicable, but this explorer currently returns stored source rows only; it does not synthesize an interpolated value.</p> : null}
      {sourceLabel ? <p className={styles.source}><small>Source · {sourceLabel}</small></p> : null}
    </article>
  );
}

export function PerformanceExplorer({ datasets }: Readonly<{ datasets: readonly PerformanceDataset[] }>) {
  const [selectedId, setSelectedId] = useState(datasets[0]?.id ?? "");
  const [filtersByDataset, setFiltersByDataset] = useState<Record<string, Record<string, string>>>({});
  const selected = datasets.find((dataset) => dataset.id === selectedId) ?? datasets[0];

  useEffect(() => {
    const selectFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && datasets.some((dataset) => dataset.id === hash)) setSelectedId(hash);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [datasets]);

  function selectDataset(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`);
  }

  function setAxis(datasetId: string, axisKey: string, value: string) {
    setFiltersByDataset((current) => ({
      ...current,
      [datasetId]: { ...(current[datasetId] ?? {}), [axisKey]: value },
    }));
  }

  function reset(datasetId: string) {
    setFiltersByDataset((current) => ({ ...current, [datasetId]: {} }));
  }

  if (!selected) return null;

  return (
    <section className={styles.explorer} aria-label="Performance workspace">
      <nav className={styles.datasetIndex} aria-label="Performance datasets">
        {datasets.map((dataset) => (
          <button aria-current={dataset.id === selected.id ? "page" : undefined} className={dataset.id === selected.id ? styles.datasetActive : undefined} key={dataset.id} onClick={() => selectDataset(dataset.id)} type="button">
            <span>{dataset.kind === "lookup-table" ? "Lookup" : "Reference"}</span>
            <strong>{dataset.title}</strong>
            <small>{dataset.rows.length} rows · {dataset.axes.length} inputs</small>
          </button>
        ))}
      </nav>
      <DatasetWorkspace
        dataset={selected}
        filters={filtersByDataset[selected.id] ?? {}}
        onSetAxis={(axisKey, value) => setAxis(selected.id, axisKey, value)}
        onReset={() => reset(selected.id)}
      />
    </section>
  );
}
