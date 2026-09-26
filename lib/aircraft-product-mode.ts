export type AircraftProductMode = "learn" | "efb";

export type AircraftModeDestinationKey =
  | "learn-home"
  | "systems"
  | "procedures"
  | "limitations"
  | "reference"
  | "flight-brief"
  | "performance"
  | "checklist";

export type AircraftModeDestination = {
  readonly key: AircraftModeDestinationKey;
  readonly label: string;
  readonly shortLabel: string;
  readonly href: string;
};

const firstSegment = (pathname: string, aircraftId: string): string => {
  const base = `/aircraft/${aircraftId}`;
  if (!pathname.startsWith(base)) return "";
  const relative = pathname.slice(base.length).replace(/^\/+/, "");
  return relative.split("/")[0] ?? "";
};

export function getAircraftModeHomeHref(
  aircraftId: string,
  mode: AircraftProductMode,
): string {
  return `/aircraft/${aircraftId}/${mode}`;
}

export function getAircraftProductModeForPathname(
  pathname: string,
  aircraftId: string,
): AircraftProductMode | null {
  const segment = firstSegment(pathname, aircraftId);
  if (!segment) return null;

  if (
    segment === "efb"
    || segment === "flight"
    || segment === "fly"
    || segment === "performance"
    || segment === "weight-balance"
  ) {
    return "efb";
  }

  return "learn";
}

export function getAircraftModeDestinations(
  aircraftId: string,
  mode: AircraftProductMode,
): readonly AircraftModeDestination[] {
  const base = `/aircraft/${aircraftId}`;

  if (mode === "efb") {
    return [
      {
        key: "flight-brief",
        label: "Flight Brief",
        shortLabel: "BRIEF",
        href: `${base}/efb`,
      },
      {
        key: "performance",
        label: "Performance",
        shortLabel: "PERF",
        href: `${base}/performance`,
      },
      {
        key: "checklist",
        label: "Checklist",
        shortLabel: "CHK",
        href: `${base}/fly`,
      },
    ];
  }

  return [
    {
      key: "learn-home",
      label: "Learn",
      shortLabel: "LEARN",
      href: `${base}/learn`,
    },
    {
      key: "systems",
      label: "Systems",
      shortLabel: "SYS",
      href: `${base}/systems`,
    },
    {
      key: "procedures",
      label: "Procedures",
      shortLabel: "PROC",
      href: `${base}/procedures`,
    },
    {
      key: "limitations",
      label: "Limitations",
      shortLabel: "LIM",
      href: `${base}/limitations`,
    },
    {
      key: "reference",
      label: "Reference",
      shortLabel: "REF",
      href: `${base}/reference`,
    },
  ];
}

export function isAircraftModeDestinationActive(
  pathname: string,
  aircraftId: string,
  mode: AircraftProductMode,
  key: AircraftModeDestinationKey,
): boolean {
  if (getAircraftProductModeForPathname(pathname, aircraftId) !== mode) return false;
  const segment = firstSegment(pathname, aircraftId);

  if (mode === "efb") {
    if (key === "flight-brief") return segment === "efb" || segment === "flight";
    if (key === "performance") return segment === "performance" || segment === "weight-balance";
    return key === "checklist" && segment === "fly";
  }

  if (key === "learn-home") {
    return [
      "learn",
      "training",
      "quick-start",
      "orientation",
      "cold-dark",
      "progress-overview",
      "knowledge",
      "avionics",
    ].includes(segment);
  }
  if (key === "systems") return segment === "systems";
  if (key === "procedures") {
    return ["procedures", "checklists", "abnormal", "flows"].includes(segment);
  }
  if (key === "limitations") return segment === "limitations";
  return key === "reference" && ["reference", "quick-reference"].includes(segment);
}
