import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../ux6-preview.module.css";

const navItems = [
  ["AIRCRAFT", "AC"],
  ["PROCEDURES", "PR"],
  ["PERFORMANCE", "PF"],
  ["TRAINING", "TR"],
  ["FLIGHT", "FL"],
] as const;

const reviewItems = [
  ["Procedures", "/ux6-preview"],
  ["Performance", "/ux6-preview/performance"],
  ["Flight", "/ux6-preview/flight"],
  ["Library", "/ux6-preview/library"],
  ["Systems", "/ux6-preview/systems"],
] as const;

export function ReferenceChrome({
  active,
  pageLabel,
  theme,
  children,
}: Readonly<{
  active: "AIRCRAFT" | "PROCEDURES" | "PERFORMANCE" | "TRAINING" | "FLIGHT";
  pageLabel: string;
  theme: "light" | "dark";
  children: ReactNode;
}>) {
  const themed = (href: string) => `${href}?theme=${theme}`;

  return (
    <main className={styles.previewRoot} data-ux6-preview="true" data-theme={theme}>
      <aside className={styles.rail} aria-label="Prototype navigation">
        <div className={styles.mark} aria-hidden="true">FT</div>
        <nav>
          {navItems.map(([label, glyph]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-current={label === active ? "page" : undefined}
              className={label === active ? styles.railItemActive : styles.railItem}
            >
              <span className={styles.navGlyph} aria-hidden="true">{glyph}</span>
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
            <nav className={styles.previewSwitcher} aria-label="UX6 reference screens">
              {reviewItems.map(([label, href]) => (
                <Link
                  key={label}
                  className={label.toUpperCase() === active ? styles.previewScreenActive : styles.previewScreenLink}
                  href={themed(href)}
                >
                  {label}
                </Link>
              ))}
            </nav>
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
              <Link className={theme === "light" ? styles.themeActive : styles.themeLink} href="?theme=light">Light</Link>
              <Link className={theme === "dark" ? styles.themeActive : styles.themeLink} href="?theme=dark">Dark</Link>
            </nav>
          </div>
        </header>

        <div className={styles.mobileHeader}>
          <button type="button" className={styles.iconButton} aria-label="Open navigation">☰</button>
          <div><strong>Learjet 35A</strong><span>{pageLabel}</span></div>
          <button type="button" className={styles.iconButton} aria-label="Search">⌕</button>
        </div>

        {children}

        <nav className={styles.quickDock} aria-label="Operational fast path specimen">
          {["CHECKLIST", "QRH", "PERF", "REF"].map((label) => (
            <button
              type="button"
              key={label}
              className={label === (active === "PERFORMANCE" ? "PERF" : "") ? styles.quickActive : styles.quickAction}
            >
              <span className={styles.quickIcon} aria-hidden="true">
                {label === "CHECKLIST" ? "✓" : label === "QRH" ? "!" : label === "PERF" ? "↗" : "≡"}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
