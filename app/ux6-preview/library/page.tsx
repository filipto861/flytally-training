import Link from "next/link";
import styles from "../ux6-preview.module.css";

export default async function LibraryPreview({
  searchParams,
}: Readonly<{ searchParams: Promise<{ theme?: string }> }>) {
  const { theme } = await searchParams;
  const selectedTheme = theme === "dark" ? "dark" : "light";
  return (
    <main className={styles.libraryPreview} data-theme={selectedTheme}>
      <header className={styles.libraryTopbar}>
        <div className={styles.libraryBrand}><span>FT</span><div><small>TRAINING</small><strong>FlyTally</strong></div></div>
        <nav className={styles.previewSwitcher} aria-label="UX6 reference screens">
          <Link className={styles.previewScreenLink} href={`/ux6-preview?theme=${selectedTheme}`}>Procedures</Link>
          <Link className={styles.previewScreenLink} href={`/ux6-preview/performance?theme=${selectedTheme}`}>Performance</Link>
          <Link className={styles.previewScreenLink} href={`/ux6-preview/flight?theme=${selectedTheme}`}>Flight</Link>
          <Link className={styles.previewScreenActive} href={`/ux6-preview/library?theme=${selectedTheme}`}>Library</Link>
          <Link className={styles.previewScreenLink} href={`/ux6-preview/systems?theme=${selectedTheme}`}>Systems</Link>
        </nav>
        <nav className={styles.themeSwitch} aria-label="Prototype theme">
          <Link className={selectedTheme === "light" ? styles.themeActive : styles.themeLink} href="?theme=light">Light</Link>
          <Link className={selectedTheme === "dark" ? styles.themeActive : styles.themeLink} href="?theme=dark">Dark</Link>
        </nav>
      </header>

      <section className={styles.libraryContent}>
        <header className={styles.libraryHeader}>
          <div><span className={styles.eyebrow}>AIRCRAFT LIBRARY</span><h1>Your aircraft</h1><p>Choose an aircraft to resume its training workspace.</p></div>
          <label className={styles.librarySearch}><span>⌕</span><input aria-label="Search aircraft" placeholder="Search aircraft" /></label>
        </header>
        <div className={styles.aircraftList}>
          <article className={styles.aircraftCard}>
            <div className={styles.aircraftAvatar}>L35</div>
            <div className={styles.aircraftCardCopy}><span className={styles.availableBadge}>AVAILABLE</span><h2>Learjet 35A</h2><p>Standard profile · Published training package</p></div>
            <div className={styles.aircraftMeta}><span>Last opened</span><strong>Today</strong></div>
            <button className={styles.aircraftOpen} type="button">Open workspace →</button>
          </article>
        </div>
        <section className={styles.libraryHint}><strong>One product, one visual language.</strong><span>The Library now shares the same typography, surfaces and interaction hierarchy as the aircraft workspace.</span></section>
      </section>
    </main>
  );
}
