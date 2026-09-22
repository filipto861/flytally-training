import { ReferenceChrome } from "../_components/ReferenceChrome";
import styles from "../ux6-preview.module.css";

export default async function SystemsPreview({
  searchParams,
}: Readonly<{ searchParams: Promise<{ theme?: string }> }>) {
  const { theme } = await searchParams;
  const selectedTheme = theme === "dark" ? "dark" : "light";

  return (
    <ReferenceChrome active="AIRCRAFT" pageLabel="Systems" theme={selectedTheme}>
      <section className={styles.referenceWorkspace}>
        <header className={styles.referencePageHeader}>
          <div><span className={styles.eyebrow}>AIRCRAFT · SYSTEMS</span><h1>Systems</h1><p>Fail-closed content remains inside the aircraft workspace.</p></div>
        </header>
        <section className={styles.systemsEmpty}>
          <div className={styles.emptyIcon} aria-hidden="true">◇</div>
          <span className={styles.eyebrow}>CONTENT UNAVAILABLE</span>
          <h2>No published Systems package</h2>
          <p>There is no governed, configuration-applicable Systems content available for this aircraft profile. Nothing is inferred or substituted.</p>
          <div><button className={styles.primaryButton} type="button">Open aircraft</button><button className={styles.secondaryButton} type="button">Open reference</button></div>
          <small>Availability is determined by published content governance.</small>
        </section>
      </section>
    </ReferenceChrome>
  );
}
