"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getPerformanceSelectionState,
  isLinearPerformanceAxis,
  performanceScalarFromKey,
  performanceScalarKey,
} from "@/lib/performance-runtime";
import type { PerformanceAxis, PerformanceDataset, PerformancePhase as PerformancePhaseKey, PerformanceScalar, TrainingSourceReference } from "@/lib/universal-aircraft-content";
import styles from "./performance-explorer.module.css";

const formatValue = (value: PerformanceScalar | undefined, unit?: string): string => value === undefined ? "—" : `${String(value)}${unit ? ` ${unit}` : ""}`;
const formatSources = (sources: readonly TrainingSourceReference[] | undefined): string | undefined =>
  sources?.map((item) => [item.chapter ? `Ch ${item.chapter}` : undefined, item.section, `p. ${item.pageLabel}`].filter(Boolean).join(" · ")).join(" · ");

type PerformancePhase = "All" | "Takeoff" | "Climb" | "Cruise" | "Descent" | "Holding" | "Landing" | "Reference";
const phaseOrder: readonly PerformancePhase[] = ["All", "Takeoff", "Climb", "Cruise", "Descent", "Holding", "Landing", "Reference"];
const declaredPhaseLabels: Readonly<Record<PerformancePhaseKey, Exclude<PerformancePhase, "All">>> = {
  takeoff: "Takeoff",
  climb: "Climb",
  cruise: "Cruise",
  descent: "Descent",
  holding: "Holding",
  landing: "Landing",
  reference: "Reference",
};

function inferPerformancePhase(dataset: PerformanceDataset): Exclude<PerformancePhase, "All"> {
  const declared = dataset.phase ?? dataset.calculator?.operation;
  if (declared) return declaredPhaseLabels[declared];
  const value = `${dataset.id} ${dataset.title}`.toLowerCase();
  if (value.includes("takeoff") || value.includes("take-off")) return "Takeoff";
  if (value.includes("holding") || value.includes("hold ")) return "Holding";
  if (value.includes("descent") || value.includes("top-of-descent") || value.includes("tod")) return "Descent";
  if (value.includes("landing") || value.includes("vref") || value.includes("approach speed")) return "Landing";
  if (value.includes("cruise") || value.includes("fuel per 100")) return "Cruise";
  if (value.includes("climb") || value.includes("continuous thrust")) return "Climb";
  return "Reference";
}

function selectedAxisLabel(dataset: PerformanceDataset, axis: PerformanceAxis, selectedKey: string | undefined): string | undefined {
  if (!selectedKey) return undefined;
  const exactValue = axis.values.find((candidate) => performanceScalarKey(candidate) === selectedKey);
  if (exactValue !== undefined) return formatValue(exactValue, axis.unit);
  const selectedValue = performanceScalarFromKey(selectedKey);
  if (selectedValue === undefined || !isLinearPerformanceAxis(dataset, axis)) return undefined;
  return formatValue(selectedValue, axis.unit);
}

function numericAxisBounds(axis: PerformanceAxis): { readonly min: number; readonly max: number } | undefined {
  const values = axis.values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return undefined;
  return { min: Math.min(...values), max: Math.max(...values) };
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
  const referenceRows = selection.status === "interpolated" ? selection.supportingRows : selection.matchingRows;

  const statusCopy = selection.status === "empty"
    ? dataset.axes.length
      ? `Select or enter all ${dataset.axes.length} source inputs to obtain a source-backed result.`
      : "This reference dataset has no selectable input axes."
    : selection.status === "partial"
      ? `${selection.missingAxisKeys.length} input${selection.missingAxisKeys.length === 1 ? "" : "s"} remaining · ${selection.matchingRows.length} row${selection.matchingRows.length === 1 ? "" : "s"} currently match.`
      : selection.status === "exact"
        ? "Exact stored result found. Check the source/method note below for whether the row is direct source data or derived from an explicit source formula."
        : selection.status === "interpolated"
          ? `Source-defined linear interpolation completed from ${selection.supportingRows.length} stored supporting row${selection.supportingRows.length === 1 ? "" : "s"}. No extrapolation was used.`
          : selection.status === "no-match"
            ? "No source-backed result exists for this combination. FlyTally does not extrapolate beyond the encoded source range or invent missing grid points."
            : "More than one row matches this complete input set, so FlyTally will not choose a result automatically.";

  return (
    <article className={styles.dataset} id={dataset.id}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">{inferPerformancePhase(dataset)} · {dataset.kind === "lookup-table" ? "Lookup" : "Reference"}</p>
          <h2>{dataset.title}</h2>
          {dataset.description ? <p className={styles.description}>{dataset.description}</p> : null}
        </div>
        <div className={styles.datasetBadges}>
          <span>{dataset.rows.length} stored rows</span>
          <span>{dataset.interpolation === "none" ? "Exact rows only" : "Source-defined linear interpolation"}</span>
        </div>
      </div>

      <section className={styles.lookupPanel} aria-label={`${dataset.title} source-backed lookup`}>
        <div className={styles.controls}>
          {dataset.axes.map((axis) => {
            if (isLinearPerformanceAxis(dataset, axis)) {
              const bounds = numericAxisBounds(axis);
              const selected = performanceScalarFromKey(filters[axis.key]);
              return (
                <label key={axis.key}>
                  <span>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</span>
                  <input
                    aria-label={`${axis.label} numeric input`}
                    max={bounds?.max}
                    min={bounds?.min}
                    onChange={(event) => {
                      const raw = event.target.value;
                      onSetAxis(axis.key, raw === "" ? "" : performanceScalarKey(Number(raw)));
                    }}
                    placeholder={bounds ? `${bounds.min}–${bounds.max}` : "Enter value"}
                    step="any"
                    type="number"
                    value={typeof selected === "number" ? String(selected) : ""}
                  />
                </label>
              );
            }

            return (
              <label key={axis.key}>
                <span>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</span>
                <select value={filters[axis.key] ?? ""} onChange={(event) => onSetAxis(axis.key, event.target.value)}>
                  <option value="">Select…</option>
                  {axis.values.map((value) => <option key={performanceScalarKey(value)} value={performanceScalarKey(value)}>{String(value)}</option>)}
                </select>
              </label>
            );
          })}
          {hasFilters ? <button type="button" onClick={onReset}>Reset inputs</button> : null}
        </div>

        {hasFilters ? (
          <div className={styles.selectedInputs} aria-label="Selected performance inputs">
            {dataset.axes.map((axis) => (
              <span key={axis.key}><small>{axis.label}</small><strong>{selectedAxisLabel(dataset, axis, filters[axis.key]) ?? "—"}</strong></span>
            ))}
          </div>
        ) : null}

        <div className={`${styles.lookupStatus} ${styles[`status_${selection.status}`]}`}>
          <strong>{selection.status === "exact" ? "Stored result" : selection.status === "interpolated" ? "Interpolated result" : "Source-backed lookup"}</strong>
          <span>{statusCopy}</span>
        </div>

        {selection.resultRow ? (
          <div className={styles.result}>
            <p className="eyebrow">{selection.resultKind === "interpolated" ? "Source-interpolated pilot result" : "Pilot result"}</p>
            <div className={styles.resultGrid}>
              {dataset.outputs.map((output) => (
                <div key={output.key}><span>{output.label}</span><strong>{formatValue(selection.resultRow?.outputs[output.key], output.unit)}</strong></div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.referenceSection}>
        <div className={styles.tableHeading}>
          <div>
            <strong>{selection.status === "interpolated" ? "Supporting reference rows" : "Reference data"}</strong>
            <span>{referenceRows.length} of {dataset.rows.length} rows shown</span>
          </div>
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
              {referenceRows.map((row, index) => (
                <tr className={row === selection.exactRow ? styles.exactRow : undefined} key={index}>
                  {dataset.axes.map((axis) => <td key={axis.key}>{formatValue(row.inputs[axis.key], axis.unit)}</td>)}
                  {dataset.outputs.map((output) => <td key={output.key}>{formatValue(row.outputs[output.key], output.unit)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {!referenceRows.length ? <p className={styles.empty}>No stored source-backed row matches the selected values.</p> : null}
        </div>
      </section>

      {dataset.notes?.length ? <ul className={styles.notes}>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
      {dataset.interpolation !== "none" ? <p className={styles.interpolationBoundary}>Linear interpolation is enabled only between encoded numeric source breakpoints for this dataset. Non-numeric axes remain exact selections, incomplete source grids are refused, and extrapolation outside the encoded range is never performed.</p> : null}
      {sourceLabel ? <p className={styles.source}><small>Source · {sourceLabel}</small></p> : null}
    </article>
  );
}

export function PerformanceExplorer({ datasets }: Readonly<{ datasets: readonly PerformanceDataset[] }>) {
  const [selectedId, setSelectedId] = useState(datasets[0]?.id ?? "");
  const [phase, setPhase] = useState<PerformancePhase>("All");
  const [query, setQuery] = useState("");
  const [filtersByDataset, setFiltersByDataset] = useState<Record<string, Record<string, string>>>({});

  const visibleDatasets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return datasets.filter((dataset) => {
      if (phase !== "All" && inferPerformancePhase(dataset) !== phase) return false;
      if (!needle) return true;
      return `${dataset.title} ${dataset.description ?? ""} ${dataset.id}`.toLowerCase().includes(needle);
    });
  }, [datasets, phase, query]);

  const selected = visibleDatasets.find((dataset) => dataset.id === selectedId) ?? visibleDatasets[0] ?? datasets.find((dataset) => dataset.id === selectedId) ?? datasets[0];

  useEffect(() => {
    const selectFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const matched = datasets.find((dataset) => dataset.id === hash);
      if (matched) {
        setSelectedId(hash);
        setPhase(inferPerformancePhase(matched));
      }
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [datasets]);

  function selectDataset(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`);
  }

  function selectPhase(nextPhase: PerformancePhase) {
    setPhase(nextPhase);
    const first = datasets.find((dataset) => nextPhase === "All" || inferPerformancePhase(dataset) === nextPhase);
    if (first) setSelectedId(first.id);
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
      <div className={styles.toolBar}>
        <div className={styles.phaseTabs} aria-label="Flight phase">
          {phaseOrder.map((item) => (
            <button aria-pressed={phase === item} className={phase === item ? styles.phaseActive : undefined} key={item} onClick={() => selectPhase(item)} type="button">{item}</button>
          ))}
        </div>
        <label className={styles.searchBox}>
          <span>Find performance data</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="VREF, holding, takeoff, N1…" type="search" value={query} />
        </label>
      </div>

      <div className={styles.workspaceMeta}>
        <strong>{phase === "All" ? "All flight phases" : phase}</strong>
        <span>{visibleDatasets.length} tool{visibleDatasets.length === 1 ? "" : "s"}</span>
      </div>

      {visibleDatasets.length ? (
        <nav className={styles.datasetIndex} aria-label="Performance datasets">
          {visibleDatasets.map((dataset) => (
            <button aria-current={dataset.id === selected.id ? "page" : undefined} className={dataset.id === selected.id ? styles.datasetActive : undefined} key={dataset.id} onClick={() => selectDataset(dataset.id)} type="button">
              <span>{inferPerformancePhase(dataset)}</span>
              <strong>{dataset.title}</strong>
              <small>{dataset.rows.length} rows · {dataset.axes.length} input{dataset.axes.length === 1 ? "" : "s"}</small>
            </button>
          ))}
        </nav>
      ) : <p className={styles.noTools}>No performance tool matches this phase/search.</p>}

      {visibleDatasets.length ? (
        <DatasetWorkspace
          dataset={selected}
          filters={filtersByDataset[selected.id] ?? {}}
          onSetAxis={(axisKey, value) => setAxis(selected.id, axisKey, value)}
          onReset={() => reset(selected.id)}
        />
      ) : null}
    </section>
  );
}
