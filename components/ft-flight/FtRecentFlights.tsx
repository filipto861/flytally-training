import styles from "./ft-flight.module.css";

export function FtRecentFlights() {
  return (
    <section className={styles.section} aria-labelledby="ft-recent-flights">
      <p className={styles.eyebrow}>RECENT FLIGHTS</p>
      <h2 id="ft-recent-flights">Recent Flights</h2>
      <p className={styles.emptyState}>No recent flights.</p>
    </section>
  );
}
