import { ReferenceChrome } from "../_components/ReferenceChrome";
import styles from "../ux6-preview.module.css";

export default async function FlightPreview({
  searchParams,
}: Readonly<{ searchParams: Promise<{ theme?: string }> }>) {
  const { theme } = await searchParams;
  const selectedTheme = theme === "dark" ? "dark" : "light";

  return (
    <ReferenceChrome active="FLIGHT" pageLabel="Flight" theme={selectedTheme}>
      <section className={styles.referenceWorkspace}>
        <header className={styles.flightHero}>
          <div>
            <span className={styles.eyebrow}>ACTIVE FLIGHT</span>
            <div className={styles.flightRoute}><strong>LKPR</strong><span>24</span><b>→</b><strong>LOWW</strong><span>29</span></div>
            <p>Aircraft configuration and performance context remain attached to this flight.</p>
          </div>
          <div className={styles.flightHeroActions}>
            <span className={styles.activeBadge}>ACTIVE</span>
            <button className={styles.secondaryButton} type="button">Flight actions</button>
          </div>
        </header>

        <div className={styles.flightGrid}>
          <section className={styles.surfaceSection}>
            <div className={styles.panelHeading}><div><span className={styles.eyebrow}>CONTEXT</span><h2>Flight</h2></div></div>
            <dl className={styles.kvList}>
              <div><dt>Departure</dt><dd>LKPR · RWY 24</dd></div>
              <div><dt>Destination</dt><dd>LOWW · RWY 29</dd></div>
              <div><dt>Aircraft</dt><dd>Learjet 35A · Standard</dd></div>
              <div><dt>Weather</dt><dd>Current input set</dd></div>
            </dl>
          </section>
          <section className={styles.surfaceSection}>
            <div className={styles.panelHeading}><div><span className={styles.eyebrow}>READINESS</span><h2>Dependencies</h2></div></div>
            <div className={styles.dependencyList}>
              <div className={styles.dependencyRow}><span className={styles.goodDot}/><div><strong>Performance</strong><span>Current for this flight</span></div><b>Ready</b></div>
              <div className={styles.dependencyRow}><span className={styles.neutralDot}/><div><strong>Checklist</strong><span>Before Start · 0 / 6</span></div><b>Open</b></div>
              <div className={styles.dependencyRow}><span className={styles.neutralDot}/><div><strong>Reference</strong><span>Published package available</span></div><b>Open</b></div>
            </div>
          </section>
        </div>

        <section className={styles.briefSection}>
          <div className={styles.panelHeading}><div><span className={styles.eyebrow}>FLIGHT BRIEF</span><h2>What matters now</h2></div></div>
          <div className={styles.briefStrip}>
            <div><span>Takeoff N1</span><strong>94.2 %</strong></div>
            <div><span>V1 / VR / V2</span><strong>121 / 126 / 135 kt</strong></div>
            <div><span>Takeoff distance</span><strong>4,820 ft</strong></div>
          </div>
        </section>
      </section>
    </ReferenceChrome>
  );
}
