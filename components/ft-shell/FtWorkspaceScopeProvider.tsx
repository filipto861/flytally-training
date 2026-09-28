"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import type { TrainingAircraft } from "@/lib/aircraft-catalog";
import {
  resolveWorkspaceAircraftScope,
  type WorkspaceAircraftScope,
} from "@/lib/workspace-aircraft-scope";

type WorkspaceScopeAircraft = Pick<
  TrainingAircraft,
  "id" | "variants" | "variantProfiles" | "equipmentTags"
>;

type FtWorkspaceScopeContextValue = {
  readonly requestedVariant?: string;
  readonly scope?: WorkspaceAircraftScope;
};

const FtWorkspaceScopeContext =
  createContext<FtWorkspaceScopeContextValue | null>(null);

/**
 * Query-aware new-shell scope boundary.
 *
 * Layout Server Components cannot safely own search-param state because
 * layouts are reused across client navigation. This client boundary reads the
 * current URL and applies the shared, pure workspace resolver without
 * persisting a second selector or performing aviation content filtering.
 *
 * R1.1c will make the Fast Path consume this scope. Until then this provider is
 * intentionally transport-only so the spike cannot alter operational content.
 */
export function FtWorkspaceScopeProvider({
  aircraft,
  children,
}: Readonly<{
  aircraft?: WorkspaceScopeAircraft;
  children: ReactNode;
}>) {
  const searchParams = useSearchParams();
  const requestedVariant =
    searchParams.get("variant") ?? undefined;

  const scope = useMemo(
    () =>
      aircraft
        ? resolveWorkspaceAircraftScope(
            aircraft,
            requestedVariant,
          )
        : undefined,
    [aircraft, requestedVariant],
  );

  const value = useMemo<FtWorkspaceScopeContextValue>(
    () => ({
      ...(requestedVariant !== undefined
        ? { requestedVariant }
        : {}),
      ...(scope ? { scope } : {}),
    }),
    [requestedVariant, scope],
  );

  return (
    <FtWorkspaceScopeContext.Provider value={value}>
      {children}
    </FtWorkspaceScopeContext.Provider>
  );
}

export function useOptionalFtWorkspaceScope():
  FtWorkspaceScopeContextValue | null {
  return useContext(FtWorkspaceScopeContext);
}

export function useFtWorkspaceScope(): FtWorkspaceScopeContextValue {
  const value = useOptionalFtWorkspaceScope();
  if (!value) {
    throw new Error(
      "useFtWorkspaceScope must be used within FtWorkspaceScopeProvider",
    );
  }
  return value;
}
