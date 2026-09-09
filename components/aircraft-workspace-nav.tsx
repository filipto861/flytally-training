import Link from "next/link";

import {
  aircraftWorkspaceHref,
  aircraftWorkspaceSections,
  type AircraftWorkspaceSection,
} from "@/lib/product-navigation";

export function AircraftWorkspaceNav({
  aircraftId,
  active,
}: Readonly<{ aircraftId: string; active: AircraftWorkspaceSection }>) {
  return (
    <nav className="workspace-nav" aria-label="Aircraft training navigation">
      {aircraftWorkspaceSections.map((section) => (
        <Link
          aria-current={section.key === active ? "page" : undefined}
          className={section.key === active ? "active" : undefined}
          href={aircraftWorkspaceHref(aircraftId, section.key)}
          key={section.key}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
