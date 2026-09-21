export type FtShellDestination = {
  readonly key: "aircraft" | "procedures" | "performance" | "training" | "flight";
  readonly label: "AIRCRAFT" | "PROCEDURES" | "PERFORMANCE" | "TRAINING" | "FLIGHT";
  readonly href: string;
};

export function ftShellDestinations(aircraftId: string): readonly FtShellDestination[] {
  const base = `/aircraft/${aircraftId}`;
  return [
    { key: "aircraft", label: "AIRCRAFT", href: base },
    { key: "procedures", label: "PROCEDURES", href: `${base}/procedures` },
    { key: "performance", label: "PERFORMANCE", href: `${base}/performance` },
    { key: "training", label: "TRAINING", href: `${base}/training` },
    { key: "flight", label: "FLIGHT", href: `${base}/fly` },
  ];
}

export function ftFastPathDestinations(aircraftId: string) {
  const base = `/aircraft/${aircraftId}`;
  return [
    { key: "checklist", label: "CHECKLIST", href: `${base}/fly` },
    { key: "qrh", label: "QRH", href: `${base}/abnormal` },
    { key: "perf", label: "PERF", href: `${base}/performance` },
    { key: "ref", label: "REF", href: `${base}/reference` },
  ] as const;
}

export function isFtShellDestinationActive(pathname: string, destination: FtShellDestination): boolean {
  if (destination.key === "aircraft") {
    return !["/procedures", "/performance", "/training", "/fly"].some((suffix) =>
      pathname.includes(suffix),
    );
  }
  return pathname === destination.href || pathname.startsWith(`${destination.href}/`);
}
