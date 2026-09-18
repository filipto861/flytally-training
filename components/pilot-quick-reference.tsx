import type {
  AircraftLimitationsContent,
  AircraftPerformanceContent,
  PerformanceScalar,
  TrainingSourceReference,
} from "@/lib/universal-aircraft-content";
import styles from "./pilot-quick-reference.module.css";

type ManualLabelMap = Readonly<Record<string, string>>;

const scalar = (value: PerformanceScalar | undefined, unit?: string) =>
  value === undefined ? "—" : `${String(value)}${unit ? ` ${unit}` : ""}`;

function sourceText(source: TrainingSourceReference, manuals: ManualLabelMap): string {
  const sourceName = manuals[source.manualId] ?? source.manualId;
  return [sourceName, source.chapter ? `Ch ${source.chapter}` : undefined, source.section, `p. ${source.pageLabel}`]
    .filter(Boolean)
    .join(" · ");
}

export function PilotQuickReference({
  performance,
  limitations,
  manualLabels,
}: Readonly<{
  performance: AircraftPerformanceContent;
  limitations: AircraftLimitationsContent;
  manualLabels: ManualLabelMap;
}>) {
  return (
    <div className={styles.workspace}>
      <section className={styles.section} aria-labelledby="quick-limits-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">LIMITS</p>
            <h2 id="quick-limits-title">Operating limits & cockpit boundaries</h2>
          </div>
          <span>{limitations.groups.reduce((sum, group) => sum + group.items.length, 0)} published items</span>
        </div>
        <div className={styles.limitGroups}>
          {limitations.groups.map((group) => (
            <article className={styles.limitGroup} key={group.id}>
              <h3>{group.title}</h3>
              <div className={styles.limitRows}>
                {group.items.map((item) => (
                  <div className={styles.limitRow} key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      {item.condition ? <small>{item.condition}</small> : null}
                      {item.notices?.map((notice, index) => (
                        <span className={styles[`notice_${notice.kind}`]} key={`${item.id}-${notice.kind}-${index}`}>{notice.kind.toUpperCase()} · {notice.text}</span>
                      ))}
                    </div>
                    <b>{String(item.value)}{item.unit ? ` ${item.unit}` : ""}</b>
                    {item.sources?.length ? <details className={styles.sourceDetails}><summary>Source</summary><small className={styles.source}>{item.sources.map((source) => sourceText(source, manualLabels)).join(" · ")}</small></details> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="quick-performance-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">PERFORMANCE</p>
            <h2 id="quick-performance-title">All published cockpit performance tables</h2>
          </div>
          <span>{performance.datasets.length} datasets</span>
        </div>
        <p className={styles.boundary}>This view deliberately shows the stored source rows rather than deriving missing values. Use the dedicated Performance workspace for filtered exact-row lookup.</p>
        <div className={styles.datasets}>
          {performance.datasets.map((dataset, index) => (
            <details className={styles.dataset} key={dataset.id} open={index === 0}>
              <summary>
                <span><small>{dataset.kind === "lookup-table" ? "LOOKUP" : "REFERENCE"}</small><strong>{dataset.title}</strong></span>
                <span>{dataset.rows.length} rows</span>
              </summary>
              {dataset.description ? <p>{dataset.description}</p> : null}
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      {dataset.axes.map((axis) => <th key={axis.key}>{axis.label}{axis.unit ? ` (${axis.unit})` : ""}</th>)}
                      {dataset.outputs.map((output) => <th key={output.key}>{output.label}{output.unit ? ` (${output.unit})` : ""}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {dataset.axes.map((axis) => <td key={axis.key}>{scalar(row.inputs[axis.key], axis.unit)}</td>)}
                        {dataset.outputs.map((output) => <td key={output.key}>{scalar(row.outputs[output.key], output.unit)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataset.notes?.length ? <ul>{dataset.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
              {dataset.sources?.length ? <details className={styles.datasetSource}><summary>Source</summary><p className={styles.source}>{dataset.sources.map((source) => sourceText(source, manualLabels)).join(" · ")}</p></details> : null}
            </details>
          ))}
        </div>
      </section>

      {(limitations.disclaimer || performance.disclaimer) ? (
        <section className={styles.trainingBoundary}>
          <strong>Training boundary</strong>
          <p>{performance.disclaimer ?? limitations.disclaimer}</p>
        </section>
      ) : null}
    </div>
  );
}
