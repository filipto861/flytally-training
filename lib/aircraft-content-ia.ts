export type AircraftContentIaKey =
  | "aircraft"
  | "procedures"
  | "performance"
  | "training"
  | "flight";

export type AircraftContentIaLabel =
  | "AIRCRAFT"
  | "PROCEDURES"
  | "PERFORMANCE"
  | "TRAINING"
  | "FLIGHT";

export type AircraftContentIaSubDestination = {
  readonly key: string;
  readonly label: string;
  readonly href: (aircraftId: string) => string;
};

export type AircraftContentIaDestination = {
  readonly key: AircraftContentIaKey;
  readonly label: AircraftContentIaLabel;
  readonly href: (aircraftId: string) => string;
  readonly subs: readonly AircraftContentIaSubDestination[];
};

const aircraftHref = (aircraftId: string, segment?: string): string =>
  segment ? `/aircraft/${aircraftId}/${segment}` : `/aircraft/${aircraftId}`;

export const CONTENT_IA: readonly AircraftContentIaDestination[] = [
  {
    key: "aircraft",
    label: "AIRCRAFT",
    href: (aircraftId) => aircraftHref(aircraftId),
    subs: [
      { key: "systems", label: "Systems", href: (aircraftId) => aircraftHref(aircraftId, "systems") },
      { key: "knowledge", label: "Knowledge", href: (aircraftId) => aircraftHref(aircraftId, "knowledge") },
      { key: "avionics", label: "Avionics", href: (aircraftId) => aircraftHref(aircraftId, "avionics") },
      { key: "limitations", label: "Limitations", href: (aircraftId) => aircraftHref(aircraftId, "limitations") },
      { key: "flows", label: "Flows", href: (aircraftId) => aircraftHref(aircraftId, "flows") },
    ],
  },
  {
    key: "procedures",
    label: "PROCEDURES",
    href: (aircraftId) => aircraftHref(aircraftId, "procedures"),
    subs: [
      { key: "abnormal", label: "Abnormal & Emergency", href: (aircraftId) => aircraftHref(aircraftId, "abnormal") },
      { key: "checklists", label: "Checklists", href: (aircraftId) => aircraftHref(aircraftId, "checklists") },
    ],
  },
  {
    key: "performance",
    label: "PERFORMANCE",
    href: (aircraftId) => aircraftHref(aircraftId, "performance"),
    subs: [
      { key: "weight-balance", label: "Weight & Balance", href: (aircraftId) => aircraftHref(aircraftId, "weight-balance") },
    ],
  },
  {
    key: "training",
    label: "TRAINING",
    href: (aircraftId) => aircraftHref(aircraftId, "training"),
    subs: [
      { key: "quick-start", label: "Quick Start", href: (aircraftId) => aircraftHref(aircraftId, "quick-start") },
      { key: "orientation", label: "Orientation", href: (aircraftId) => aircraftHref(aircraftId, "orientation") },
      { key: "cold-dark", label: "Cold & Dark", href: (aircraftId) => aircraftHref(aircraftId, "cold-dark") },
      { key: "progress-overview", label: "Progress", href: (aircraftId) => aircraftHref(aircraftId, "progress-overview") },
    ],
  },
  {
    key: "flight",
    label: "FLIGHT",
    href: (aircraftId) => aircraftHref(aircraftId, "fly"),
    subs: [
      { key: "quick-reference", label: "Quick Reference", href: (aircraftId) => aircraftHref(aircraftId, "quick-reference") },
      { key: "reference", label: "Reference", href: (aircraftId) => aircraftHref(aircraftId, "reference") },
    ],
  },
] as const;

export type ResolvedAircraftContentIaDestination = {
  readonly key: AircraftContentIaKey;
  readonly label: AircraftContentIaLabel;
  readonly href: string;
  readonly subs: readonly {
    readonly key: string;
    readonly label: string;
    readonly href: string;
  }[];
};

export function getAircraftContentIa(
  aircraftId: string,
): readonly ResolvedAircraftContentIaDestination[] {
  return CONTENT_IA.map((destination) => ({
    key: destination.key,
    label: destination.label,
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
): AircraftContentIaKey {
  const base = `/aircraft/${aircraftId}`;
  if (pathname === base || pathname === `${base}/`) return "aircraft";

  const relative = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1)
    : "";
  const firstSegment = relative.split("/")[0];

  for (const destination of getAircraftContentIa(aircraftId)) {
    const topSegment = destination.href.slice(base.length + 1).split("/")[0];
    if (topSegment && firstSegment === topSegment) return destination.key;
    if (destination.subs.some((sub) => sub.key === firstSegment)) return destination.key;
  }

  return "aircraft";
}

export function isAircraftContentDestinationActive(
  pathname: string,
  aircraftId: string,
  key: AircraftContentIaKey,
): boolean {
  return getAircraftContentSectionForPathname(pathname, aircraftId) === key;
}
