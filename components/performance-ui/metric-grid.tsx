import type { ReactNode } from "react";

import styles from "./metric-grid.module.css";

export interface MetricGridProps {
  readonly children: ReactNode;
  readonly columns?: 2 | 3;
}

export function MetricGrid({ children, columns = 3 }: MetricGridProps) {
  return (
    <div className={styles.grid} data-columns={columns}>
      {children}
    </div>
  );
}
