import Link from "next/link";

import styles from "./ux6-preview.module.css";

const navItems = [
  ["AIRCRAFT", "aircraft"],
  ["PROCEDURES", "procedures"],
  ["PERFORMANCE", "performance"],
  ["TRAINING", "training"],
  ["FLIGHT", "flight"],
] as const;

const procedureItems = [
  ["Preflight Inspection", "complete"],
  ["Before Start", "active"],
  ["Engine Start", "idle"],
  ["Before Taxi", "idle"],
  ["Before Takeoff", "idle"],
  ["After Takeoff", "idle"],
] as const;

const steps = [
  ["Battery switches", "ON"],
  ["Beacon", "ON"],
  ["Parking brake", "SET"],
  ["Fuel quantity", "CHECK"],
  ["Avionics", "OFF"],
  ["Circuit breakers", "CHECK"],
] as const;

function Icon({ name }: Readonly<{ name: string }>) {
  const path =
    name === "aircraft"
      ? "M4 12h16M12 4v16M7 9l5-5 5 5M8 15l4 5 4-5"
      : name === "procedures"
        ? "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
        : name === "performance"
          ? "M4 18V6M4 18h16M8 15l3-4 3 2 4-6"
          : name === "training"
            ? "M4 7l8-4 8 4-8 4-8-4Zm3 3v5c3 2 7 2 10 0v-5"
            : "M5 17V7l7-4 7 4v10M8 17v-5h8v5";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default async function Ux6PreviewPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ theme?: string }>;
}>) {
  const { theme } = await searchParams;
  const selectedTheme = theme === "dark" ? "dark" : "light";

  return (
    <main
      className={styles.previewRoot}
      data-ux6-preview="true"
      data-theme={selectedTheme}
    >
      <aside className={styles.rail} aria-label="Prototype navigation">
        <div className={styles.mark} aria-hidden="true">FT</div>
        <nav>
          {navItems.map(([label, icon]) => (
            <button
              className={label === "PROCEDURES" ? styles.railItemActive : styles.railItem}
              type="button"
              key={label}
              aria-label={label}
              aria-current={label === "PROCEDURES" ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{label.slice(0, 4)}</span>
            </button>
          ))}
        </nav>
        <button className={styles.railItem} type="button" aria-label="Settings">
          <span className={styles.settingsGlyph} aria-hidden="true">•••</span>
          <span>MORE</span>
        </button>
      </aside>

      <section className={styles.app}>
        <header className={styles.contextBar}>
          <div className={styles.aircraft}>
            <span className={styles.aircraftKicker}>AIRCRAFT</span>
            <strong>Learjet 35A</strong>
            <span className={styles.profile}>Standard profile</span>
          </div>

          <div className={styles.contextActions}>
            <button className={styles.search} type="button">
              <span aria-hidden="true">⌕</span>
              <span>Search</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className={styles.flightState}>
              <span className={styles.statusDot} aria-hidden="true" />
              No active flight
            </span>
            <nav className={styles.themeSwitch} aria-label="Prototype theme">
              <Link
                className={selectedTheme === "light" ? styles.themeActive : styles.themeLink}
                href="/ux6-preview?theme=light"
              >
                Light
              </Link>
              <Link
                className={selectedTheme === "dark" ? styles.themeActive : styles.themeLink}
                href="/ux6-preview?theme=dark"
              >
                Dark
              </Link>
            </nav>
            <nav className={styles.previewSwitcher} aria-label="UX6 reference screens">
              <Link className={styles.previewScreenActive} href={`/ux6-preview?theme=${selectedTheme}`}>Procedures</Link>
              <Link className={styles.previewScreenLink} href={`/ux6-preview/performance?theme=${selectedTheme}`}>Performance</Link>
              <Link className={styles.previewScreenLink} href={`/ux6-preview/flight?theme=${selectedTheme}`}>Flight</Link>
              <Link className={styles.previewScreenLink} href={`/ux6-preview/library?theme=${selectedTheme}`}>Library</Link>
              <Link className={styles.previewScreenLink} href={`/ux6-preview/systems?theme=${selectedTheme}`}>Systems</Link>
            </nav>
          </div>
        </header>

        <div className={styles.mobileHeader}>
          <button type="button" className={styles.iconButton} aria-label="Open navigation">☰</button>
          <div>
            <strong>Learjet 35A</strong>
            <span>Before Start</span>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Search">⌕</button>
        </div>

        <section className={styles.workspace} aria-label="UX6 procedure specimen">
          <aside className={styles.procedureNav}>
            <div className={styles.paneHeading}>
              <div>
                <span className={styles.eyebrow}>PROCEDURES</span>
                <h1>Normal procedures</h1>
              </div>
              <span className={styles.count}>6</span>
            </div>

            <label className={styles.filter}>
              <span className={styles.srOnly}>Filter procedures</span>
              <span aria-hidden="true">⌕</span>
              <input placeholder="Find a procedure" />
            </label>

            <div className={styles.phaseTitle}>PREFLIGHT & START</div>
            <div className={styles.procedureList}>
              {procedureItems.map(([name, state]) => (
                <button
                  key={name}
                  type="button"
                  className={state === "active" ? styles.procedureActive : styles.procedureRow}
                >
                  <span className={styles.procedureState} data-state={state} />
                  <span>{name}</span>
                  {state === "complete" ? <span className={styles.done}>✓</span> : null}
                </button>
              ))}
            </div>
          </aside>

          <article className={styles.procedure}>
            <header className={styles.procedureHeader}>
              <div>
                <span className={styles.eyebrow}>NORMAL · PREFLIGHT & START</span>
                <h2>Before Start</h2>
                <p>Complete the source-defined items before engine start.</p>
              </div>
              <div className={styles.headerActions}>
                <span className={styles.progress}>0 / 6</span>
                <button className={styles.quietButton} type="button">More</button>
              </div>
            </header>

            <div className={styles.checklist}>
              {steps.map(([action, response], index) => (
                <label className={styles.step} key={action}>
                  <input type="checkbox" />
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.stepAction}>{action}</span>
                  <strong className={styles.response}>{response}</strong>
                </label>
              ))}
            </div>

            <footer className={styles.procedureFooter}>
              <button className={styles.secondaryButton} type="button">← Previous</button>
              <button className={styles.primaryButton} type="button">Next procedure →</button>
            </footer>
          </article>

          <aside className={styles.inspector}>
            <section>
              <span className={styles.eyebrow}>CONTEXT</span>
              <h2>Procedure details</h2>
            </section>

            <dl className={styles.details}>
              <div>
                <dt>Applicability</dt>
                <dd>Learjet 35A · Standard</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Governed training package</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>Saved for this session</dd>
              </div>
            </dl>

            <section className={styles.note}>
              <strong>Training note</strong>
              <p>Source notes remain available without interrupting the checklist scan path.</p>
            </section>

            <button className={styles.textButton} type="button">Open source & authority →</button>
          </aside>
        </section>

        <nav className={styles.quickDock} aria-label="Operational fast path specimen">
          {["CHECKLIST", "QRH", "PERF", "REF"].map((label, index) => (
            <button
              type="button"
              key={label}
              className={index === 0 ? styles.quickActive : styles.quickAction}
            >
              <span className={styles.quickIcon} aria-hidden="true">
                {index === 0 ? "✓" : index === 1 ? "!" : index === 2 ? "↗" : "≡"}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
