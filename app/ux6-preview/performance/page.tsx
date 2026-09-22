import { ReferenceChrome } from "../_components/ReferenceChrome";
import styles from "../ux6-preview.module.css";

export default async function PerformancePreview({
  searchParams,
}: Readonly<{ searchParams: Promise<{ theme?: string }> }>) {
  const { theme } = await searchParams;
  const selectedTheme = theme === "dark" ? "dark" : "light";

  return (
    <ReferenceChrome active="PERFORMANCE" pageLabel="Performance" theme={selectedTheme}>
      <section className={styles.referenceWorkspace}>
        <header className={styles.referencePageHeader}>
          <div>
            <span className={styles.eyebrow}>PERFORMANCE · TAKEOFF</span>
            <h1>Takeoff performance</h1>
            <p>Inputs stay compact. Calculated results become the visual priority.</p>
          </div>
          <span className={styles.contextChip}>Learjet 35A · Standard</span>
        </header>

        <div className={styles.performanceGrid}>
          <section className={styles.inputPane}>
            <div className={styles.panelHeading}>
              <div><span className={styles.eyebrow}>INPUTS</span><h2>Departure conditions</h2></div>
              <span className={styles.panelHint}>Required</span>
            </div>
            <div className={styles.fieldGrid}>
              {[
                ["Airport / runway", "LKPR · RWY 24"],
                ["OAT", "18 °C"],
                ["Pressure altitude", "1,250 ft"],
                ["Takeoff weight", "16,200 lb"],
                ["Flaps", "20°"],
                ["Anti-ice", "OFF"],
              ].map(([label,value]) => (
                <label className={styles.field} key={label}><span>{label}</span><div>{value}</div></label>
              ))}
            </div>
            <button className={styles.primaryButton} type="button">Calculate takeoff</button>
          </section>

          <section className={styles.resultPane}>
            <div className={styles.panelHeading}>
              <div><span className={styles.eyebrow}>RESULT</span><h2>Takeoff</h2></div>
              <span className={styles.validBadge}>CURRENT INPUTS</span>
            </div>
            <div className={styles.resultGrid}>
              <div><span>N1</span><strong>94.2 <small>%</small></strong></div>
              <div><span>V1</span><strong>121 <small>kt</small></strong></div>
              <div><span>VR</span><strong>126 <small>kt</small></strong></div>
              <div><span>V2</span><strong>135 <small>kt</small></strong></div>
            </div>
            <div className={styles.distanceGrid}>
              <div><span>Takeoff distance</span><strong>4,820 <small>ft</small></strong></div>
              <div><span>Accelerate-stop</span><strong>4,540 <small>ft</small></strong></div>
            </div>
            <div className={styles.resultContext}>
              <span>Active Flight</span><strong>Not linked</strong><button type="button">Use in flight →</button>
            </div>
          </section>
        </div>

        <details className={styles.sourceDisclosure}>
          <summary>Sources, assumptions & calculation context</summary>
          <p>Published source context stays available without competing with the primary result.</p>
        </details>
      </section>
    </ReferenceChrome>
  );
}
