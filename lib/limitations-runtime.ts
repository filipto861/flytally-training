import type { LimitationGroup, LimitationItem } from "./universal-aircraft-content.ts";

export type LimitationFilters = {
  readonly query?: string;
  readonly groupId?: string;
  readonly notice?: "warning" | "caution";
};

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

export function limitationSearchText(item: LimitationItem, groupTitle?: string): string {
  return [
    groupTitle,
    item.id,
    item.label,
    String(item.value),
    item.unit,
    item.condition,
    ...(item.notices ?? []).flatMap((notice) => [notice.kind, notice.text]),
  ].filter((value): value is string => Boolean(value)).join("\n").toLocaleLowerCase();
}

export function filterLimitationGroups(
  groups: readonly LimitationGroup[],
  filters: LimitationFilters,
): readonly LimitationGroup[] {
  const query = normalized(filters.query ?? "");
  return groups
    .filter((group) => !filters.groupId || group.id === filters.groupId)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (filters.notice && !item.notices?.some((notice) => notice.kind === filters.notice)) return false;
        if (query && !limitationSearchText(item, group.title).includes(query)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function countLimitationItems(groups: readonly LimitationGroup[]): number {
  return groups.reduce((count, group) => count + group.items.length, 0);
}
