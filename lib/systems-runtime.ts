import type { AircraftSystemLesson } from "./universal-aircraft-content.ts";

export type SystemFilters = {
  readonly query?: string;
};

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

export function systemSearchText(system: AircraftSystemLesson): string {
  return [
    system.id,
    system.title,
    system.summary,
    system.mentalModel,
    ...(system.components ?? []),
    ...(system.controls ?? []),
    ...(system.indications ?? []),
    ...(system.normalOperation ?? []),
    ...(system.limitations ?? []),
    ...(system.abnormalCues ?? []),
    ...(system.remember ?? []),
  ].filter((value): value is string => Boolean(value)).join("\n").toLocaleLowerCase();
}

export function filterSystems(
  systems: readonly AircraftSystemLesson[],
  filters: SystemFilters,
): readonly AircraftSystemLesson[] {
  const query = normalized(filters.query ?? "");
  if (!query) return systems;
  return systems.filter((system) => systemSearchText(system).includes(query));
}
