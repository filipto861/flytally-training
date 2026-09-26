import type { SimBriefIdentity } from "./types.ts";
import { parseSimBriefIdentity } from "./ofp.ts";

export const SIMBRIEF_IDENTITY_STORAGE_KEY =
  "flytally-training:simbrief-identity:v1";

export interface SimBriefPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readSimBriefIdentity(
  storage: SimBriefPreferenceStorage,
): SimBriefIdentity | null {
  const raw = storage.getItem(SIMBRIEF_IDENTITY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = parseSimBriefIdentity(JSON.parse(raw));
    if (!parsed) storage.removeItem(SIMBRIEF_IDENTITY_STORAGE_KEY);
    return parsed;
  } catch {
    storage.removeItem(SIMBRIEF_IDENTITY_STORAGE_KEY);
    return null;
  }
}

export function writeSimBriefIdentity(
  storage: SimBriefPreferenceStorage,
  identity: SimBriefIdentity,
): void {
  storage.setItem(SIMBRIEF_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
}

export function clearSimBriefIdentity(
  storage: SimBriefPreferenceStorage,
): void {
  storage.removeItem(SIMBRIEF_IDENTITY_STORAGE_KEY);
}
