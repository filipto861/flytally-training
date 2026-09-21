export const RECENT_SEARCH_LIMIT = 5;

export type RecentSearchStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function storageKey(aircraftId: string): string {
  return `ft-recent-searches-${aircraftId}`;
}

function defaultStorage(): RecentSearchStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function readRecentSearches(
  aircraftId: string,
  storage: RecentSearchStorage | undefined = defaultStorage(),
): readonly string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(storageKey(aircraftId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, RECENT_SEARCH_LIMIT);
  } catch {
    return [];
  }
}

export function addRecentSearch(
  aircraftId: string,
  query: string,
  storage: RecentSearchStorage | undefined = defaultStorage(),
): readonly string[] {
  const normalized = query.trim();
  if (!storage || normalized.length < 2) return readRecentSearches(aircraftId, storage);

  const previous = readRecentSearches(aircraftId, storage);
  const next = [
    normalized,
    ...previous.filter((item) => item.toLocaleLowerCase("en-US") !== normalized.toLocaleLowerCase("en-US")),
  ].slice(0, RECENT_SEARCH_LIMIT);

  try {
    storage.setItem(storageKey(aircraftId), JSON.stringify(next));
  } catch {
    return previous;
  }
  return next;
}

export function clearRecentSearches(
  aircraftId: string,
  storage: RecentSearchStorage | undefined = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(storageKey(aircraftId));
  } catch {
    // Local search history is best-effort only.
  }
}
