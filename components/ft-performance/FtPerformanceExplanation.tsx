import styles from "./ft-performance.module.css";

export function FtPerformanceExplanation({
  sourceTitles,
  disclaimer,
}: Readonly<{
  sourceTitles: readonly string[];
  disclaimer?: string;
}>) {
  return (
    <details className={styles.explanation}>
      <summary className={styles.explanationSummary}>Calculation context &amp; sources</summary>
      <div className={styles.explanationBody}>
        <p>
          The takeoff strip follows the existing Round 3.7 sequence: N1, V1, VR,
          V2 and Takeoff Distance. Values come from the encoded source-backed
          performance runtime; this presentation does not add extrapolation or
          substitute missing source data.
        </p>
        <p>
          N1 is the takeoff fan-speed target. V1 is the takeoff decision speed,
          VR is rotation speed and V2 is takeoff safety speed. Takeoff and
          landing presentations remain separate; VREF is not part of the
          takeoff strip.
        </p>
        {sourceTitles.length ? (
          <ul className={styles.sourceList}>
            {sourceTitles.map((title) => <li key={title}>{title}</li>)}
          </ul>
        ) : null}
        <p>
          {disclaimer
            ?? "Training aid only. Verify performance using the applicable approved aircraft/operator documentation."}
        </p>
      </div>
    </details>
  );
}
