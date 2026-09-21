import styles from "./ft-flight.module.css";

const performanceMetrics = ["N1", "V1", "VR", "V2"] as const;

export function FtFlightBrief() {
  return (
    <section className={styles.brief} aria-labelledby="ft-flight-brief">
      <div className={styles.briefHeader}>
        <p className={styles.eyebrow}>FLIGHT BRIEF</p>
        <h2 id="ft-flight-brief">Flight Brief</h2>
      </div>

      <section className={styles.briefSection} aria-labelledby="ft-brief-performance">
        <h3 id="ft-brief-performance">Performance</h3>
        <div className={styles.performanceGrid}>
          {performanceMetrics.map((metric) => (
            <div key={metric} className={styles.performanceItem}>
              <span className={styles.performanceLabel}>{metric}</span>
              <strong aria-hidden="true">—</strong>
              <span className={styles.performanceEmpty}>No active flight</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-considerations">
        <h3 id="ft-brief-considerations">Flight Considerations</h3>
        <p className={styles.emptyState}>No active flight.</p>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-recommendations">
        <h3 id="ft-brief-recommendations">Training Recommendations</h3>
        <p className={styles.emptyState}>No active flight.</p>
      </section>

      <section className={styles.briefSection} aria-labelledby="ft-brief-procedures">
        <h3 id="ft-brief-procedures">Relevant Procedures</h3>
        <p className={styles.emptyState}>No active flight.</p>
      </section>
    </section>
  );
}
