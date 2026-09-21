"use client";

import Link from "next/link";

import { FtSearchIcon, type FtSearchIconName } from "./icons/FtSearchIcon";
import styles from "./ft-search.module.css";

type SearchLink = {
  readonly label: string;
  readonly href: string;
  readonly icon: FtSearchIconName;
};

export function FtSearchEmptyState({
  aircraftId,
  recent,
  onRecentQuery,
  onClearRecent,
  onNavigate,
  currentFlight,
}: Readonly<{
  aircraftId: string;
  recent: readonly string[];
  onRecentQuery: (query: string) => void;
  onClearRecent: () => void;
  onNavigate: () => void;
  currentFlight?: SearchLink;
}>) {
  const base = `/aircraft/${aircraftId}`;
  const quickAccess: readonly SearchLink[] = [
    { label: "Before Takeoff Checklist", href: `${base}/checklists`, icon: "procedure" },
    { label: "Engine Failure QRH", href: `${base}/abnormal`, icon: "scenario" },
    { label: "Memory Items", href: `${base}/procedures`, icon: "memoryItem" },
    { label: "Limitations", href: `${base}/limitations`, icon: "limitation" },
  ];
  const browse: readonly SearchLink[] = [
    { label: "Procedures", href: `${base}/procedures`, icon: "procedure" },
    { label: "Limitations", href: `${base}/limitations`, icon: "limitation" },
    { label: "Memory Items", href: `${base}/procedures`, icon: "memoryItem" },
    { label: "Performance", href: `${base}/performance`, icon: "performance" },
    { label: "Systems", href: `${base}/systems`, icon: "system" },
    { label: "Scenarios", href: `${base}/abnormal`, icon: "scenario" },
  ];

  return (
    <div className={styles.emptyState} aria-label="Search suggestions">
      <section className={styles.emptySection} aria-labelledby="ft-search-recent">
        <div className={styles.sectionHeadingRow}>
          <h2 id="ft-search-recent">RECENT</h2>
          {recent.length ? (
            <button type="button" className={styles.clearRecent} onClick={onClearRecent}>
              Clear recent
            </button>
          ) : null}
        </div>
        {recent.length ? (
          <div className={styles.recentList}>
            {recent.map((query) => (
              <button
                key={query}
                type="button"
                className={styles.recentButton}
                onClick={() => onRecentQuery(query)}
              >
                <FtSearchIcon name="search" />
                <span>{query}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No recent searches.</p>
        )}
      </section>

      {currentFlight ? (
        <section className={styles.emptySection} aria-labelledby="ft-search-current-flight">
          <h2 id="ft-search-current-flight">CURRENT FLIGHT</h2>
          <Link href={currentFlight.href} className={styles.emptyLink} onClick={onNavigate}>
            <FtSearchIcon name={currentFlight.icon} />
            <span>{currentFlight.label}</span>
          </Link>
        </section>
      ) : null}

      <section className={styles.emptySection} aria-labelledby="ft-search-quick-access">
        <h2 id="ft-search-quick-access">QUICK ACCESS</h2>
        <div className={styles.emptyLinks}>
          {quickAccess.map((item) => (
            <Link key={item.label} href={item.href} className={styles.emptyLink} onClick={onNavigate}>
              <FtSearchIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.emptySection} aria-labelledby="ft-search-browse">
        <h2 id="ft-search-browse">BROWSE BY TYPE</h2>
        <div className={styles.emptyLinks}>
          {browse.map((item) => (
            <Link key={item.label} href={item.href} className={styles.emptyLink} onClick={onNavigate}>
              <FtSearchIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
