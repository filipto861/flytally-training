export type AircraftProductMode = "learn" | "efb";

export type AircraftContentIaKey =
  | "training"
  | "systems"
  | "procedures"
  | "limitations"
  | "reference"
  | "flight"
  | "performance"
  | "checklist"
  | "qrh";

export type AircraftContentIaSubDestination = {
  readonly key: string;
  readonly label: string;
  readonly href: (aircraftId: string) => string;
};

export type AircraftContentIaDestination = {
  readonly key: AircraftContentIaKey;
  readonly label: string;
  readonly shortLabel: string;
  readonly href: (aircraftId: string) => string;
  readonly subs: readonly AircraftContentIaSubDestination[];
};

const aircraftHref = (aircraftId: string, segment?: string): string =>
  segment ? `/aircraft/${aircraftId}/${segment}` : `/aircraft/${aircraftId}`;

const LEARN_IA: readonly AircraftContentIaDestination[] = [
  {
    key: "training",
    label: "LEARN",
    shortLabel: "LEARN",
    href: (aircraftId) => aircraftHref(aircraftId, "training"),
    subs: [
      { key: "quick-start", label: "Quick Start", href: (aircraftId) => aircraftHref(aircraftId, "quick-start") },
      { key: "orientation", label: "Orientation", href: (aircraftId) => aircraftHref(aircraftId, "orientation") },
      { key: "cold-dark", label: "Cold & Dark", href: (aircraftId) => aircraftHref(aircraftId, "cold-dark") },
      { key: "progress-overview", label: "Progress", href: (aircraftId) => aircraftHref(aircraftId, "progress-overview") },
    ],
  },
  {
    key: "systems",
    label: "SYSTEMS",
    shortLabel: "SYS",
    href: (aircraftId) => aircraftHref(aircraftId, "systems"),
    subs: [
      { key: "knowledge", label: "Knowledge", href: (aircraftId) => aircraftHref(aircraftId, "knowledge") },
      { key: "avionics", label: "Avionics", href: (aircraftId) => aircraftHref(aircraftId, "avionics") },
      { key: "flows", label: "Flows", href: (aircraftId) => aircraftHref(aircraftId, "flows") },
    ],
  },
  {
    key: "procedures",
    label: "PROCEDURES",
    shortLabel: "PROC",
    href: (aircraftId) => aircraftHref(aircraftId, "procedures"),
    subs: [
      { key: "checklists", label: "Checklist training", href: (aircraftId) => aircraftHref(aircraftId, "checklists") },
    ],
  },
  {
    key: "limitations",
    label: "LIMITATIONS",
    shortLabel: "LIMIT",
    href: (aircraftId) => aircraftHref(aircraftId, "limitations"),
    subs: [],
  },
  {
    key: "reference",
    label: "REFERENCE",
    shortLabel: "REF",
    href: (aircraftId) => aircraftHref(aircraftId, "reference"),
    subs: [
      { key: "quick-reference", label: "Quick Reference", href: (aircraftId) => aircraftHref(aircraftId, "quick-reference") },
    ],
  },
] as const;

const EFB_IA: readonly AircraftContentIaDestination[] = [
  {
    key: "flight",
    label: "FLIGHT BRIEF",
    shortLabel: "BRIEF",
    href: (aircraftId) => aircraftHref(aircraftId, "flight"),
    subs: [],
  },
  {
    key: "performance",
    label: "PERFORMANCE",
    shortLabel: "PERF",
    href: (aircraftId) => aircraftHref(aircraftId, "performance"),
    subs: [
      { key: "weight-balance", label: "Weight & Balance", href: (aircraftId) => aircraftHref(aircraftId, "weight-balance") },
    ],
  },
  {
    key: "checklist",
    label: "CHECKLIST",
    shortLabel: "CHK",
    href: (aircraftId) => aircraftHref(aircraftId, "fly"),
    subs: [],
  },
  {
    key: "qrh",
    label: "QRH",
    shortLabel: "QRH",
    href: (aircraftId) => aircraftHref(aircraftId, "abnormal"),
    subs: [],
  },
] as const;

const EFB_SEGMENTS = new Set([
  "efb",
  "flight",
  "performance",
  "fly",
  "abnormal",
  "weight-balance",
]);

export function aircraftModeHref(
  aircraftId: string,
  mode: AircraftProductMode,
): string {
  return aircraftHref(aircraftId, mode);
}

export function getAircraftProductModeForPathname(
  pathname: string,
  aircraftId: string,
): AircraftProductMode | null {
  const base = aircraftHref(aircraftId);
  if (pathname === base || pathname === `${base}/`) return null;

  const relative = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1)
    : "";
  const firstSegment = relative.split("/")[0];

  if (firstSegment === "learn") return "learn";
  if (EFB_SEGMENTS.has(firstSegment)) return "efb";
  return "learn";
}

export type ResolvedAircraftContentIaDestination = {
  readonly key: AircraftContentIaKey;
  readonly label: string;
  readonly shortLabel: string;
  readonly href: string;
  readonly subs: readonly {
    readonly key: string;
    readonly label: string;
    readonly href: string;
  }[];
};

export function getAircraftContentIa(
  aircraftId: string,
  mode: AircraftProductMode = "learn",
): readonly ResolvedAircraftContentIaDestination[] {
  const source = mode === "efb" ? EFB_IA : LEARN_IA;
  return source.map((destination) => ({
    key: destination.key,
    label: destination.label,
    shortLabel: destination.shortLabel,
    href: destination.href(aircraftId),
    subs: destination.subs.map((sub) => ({
      key: sub.key,
      label: sub.label,
      href: sub.href(aircraftId),
    })),
  }));
}

export function getAircraftContentSectionForPathname(
  pathname: string,
  aircraftId: string,
): AircraftContentIaKey | null {
  const mode = getAircraftProductModeForPathname(pathname, aircraftId);
  if (!mode) return null;

  const base = aircraftHref(aircraftId);
  const relative = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1)
    : "";
  const firstSegment = relative.split("/")[0];

  if (firstSegment === "learn") return "training";
  if (firstSegment === "efb") return "flight";

  for (const destination of getAircraftContentIa(aircraftId, mode)) {
    const topSegment = destination.href.slice(base.length + 1).split("/")[0];
    if (topSegment && firstSegment === topSegment) return destination.key;
    if (destination.subs.some((sub) => sub.key === firstSegment)) return destination.key;
  }

  return mode === "efb" ? "flight" : "training";
}

export function isAircraftContentDestinationActive(
  pathname: string,
  aircraftId: string,
  key: AircraftContentIaKey,
): boolean {
  return getAircraftContentSectionForPathname(pathname, aircraftId) === key;
}
