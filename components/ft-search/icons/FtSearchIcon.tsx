import type { AircraftSearchResultType } from "@/lib/search/aircraft-search";

export type FtSearchIconName = AircraftSearchResultType | "search";

export function FtSearchIcon({
  name,
}: Readonly<{
  name: FtSearchIconName;
}>) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "search") {
    return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
  }
  if (name === "procedure") {
    return <svg {...common}><path d="M8 6h11M8 12h11M8 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  }
  if (name === "limitation") {
    return <svg {...common}><path d="M12 3 3 20h18L12 3Z" /><path d="M12 9v4M12 17h.01" /></svg>;
  }
  if (name === "memoryItem") {
    return <svg {...common}><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.24V15a3 3 0 0 0 3 3h1" /><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5.24V15a3 3 0 0 1-3 3h-1M12 4v16" /></svg>;
  }
  if (name === "system") {
    return <svg {...common}><circle cx="12" cy="5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="M12 7v4M12 11 6 16M12 11l6 5" /></svg>;
  }
  if (name === "component") {
    return <svg {...common}><rect x="5" y="5" width="14" height="14" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /></svg>;
  }
  if (name === "performance") {
    return <svg {...common}><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 12 4-3M7 18h10" /></svg>;
  }
  if (name === "scenario") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></svg>;
  }
  return <svg {...common}><path d="M6 3h9l3 3v15H6V3Z" /><path d="M15 3v4h4M9 12h6M9 16h6" /></svg>;
}
