"use client";

import Link from "next/link";

import type { FastPathTab } from "@/lib/fast-path/panel-state";

import { useFtFastPath } from "./FtFastPathProvider";
import styles from "./ft-fast-path.module.css";

const PLACEHOLDERS: Readonly<
  Record<
    Exclude<FastPathTab, "checklist">,
    { readonly title: string; readonly description: string; readonly route: string }
  >
> = {
  qrh: {
    title: "QRH",
    description:
      "Fast-path QRH integration is intentionally deferred. Open the full abnormal and emergency workspace.",
    route: "abnormal",
  },
  perf: {
    title: "Performance",
    description:
      "Fast-path performance integration is intentionally deferred. Open the full performance workspace.",
    route: "performance",
  },
  ref: {
    title: "Reference",
    description:
      "Fast-path reference integration is intentionally deferred. Open the full reference workspace.",
    route: "reference",
  },
};

export function FtFastPathPlaceholder({
  tab,
}: Readonly<{
  tab: Exclude<FastPathTab, "checklist">;
}>) {
  const { aircraftId, closePanel } = useFtFastPath();
  const item = PLACEHOLDERS[tab];

  return (
    <section className={styles.placeholder} aria-label={`${item.title} fast path placeholder`}>
      <p className={styles.eyebrow}>FAST PATH</p>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <Link
        className={styles.fullPageLink}
        href={`/aircraft/${aircraftId}/${item.route}`}
        onClick={closePanel}
      >
        Open full page
      </Link>
    </section>
  );
}
