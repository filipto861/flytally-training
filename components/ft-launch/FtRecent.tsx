import Link from "next/link";

import styles from "./ft-launch.module.css";

export type FtRecentItem = {
  readonly id: string;
  readonly title: string;
  readonly context: string;
  readonly href: string;
};

export function FtRecent({
  items,
}: Readonly<{
  items: readonly FtRecentItem[];
}>) {
  return (
    <section className={styles.secondarySection} aria-labelledby="ft-recent-section">
      <p className={styles.eyebrow}>RECENT</p>
      <h2 id="ft-recent-section">Recent</h2>
      {items.length ? (
        <ul className={styles.recentList}>
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link href={item.href} className={styles.recentLink}>
                <strong>{item.title}</strong>
                <span>{item.context}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyState}>Nothing recent.</p>
      )}
    </section>
  );
}
