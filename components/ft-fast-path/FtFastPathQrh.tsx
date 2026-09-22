"use client";

import { OperationalEmergency } from "@/components/operational-emergency";
import type { OperationalEmergencyContent } from "@/lib/operational-flight-data";

export function FtFastPathQrh({
  emergency,
}: Readonly<{
  emergency?: OperationalEmergencyContent;
}>) {
  if (!emergency?.scenarios.length) {
    return (
      <section aria-label="QRH unavailable">
        <strong>QRH unavailable</strong>
        <p>No current source-authoritative abnormal/emergency module is available for this aircraft configuration.</p>
      </section>
    );
  }

  return <OperationalEmergency emergency={emergency} />;
}
