"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  workspaceVariantRequestKey,
  type WorkspaceAircraftScopeIdentity,
} from "@/lib/workspace-aircraft-scope";

type FtWorkspaceScopeContextValue = {
  readonly registeredScope: WorkspaceAircraftScopeIdentity | null;
  readonly routeRequestKey: string;
  readonly synchronized: boolean;
  readonly effectiveScope: WorkspaceAircraftScopeIdentity | null;
  readonly registerScope: (scope: WorkspaceAircraftScopeIdentity) => void;
};

const FtWorkspaceScopeContext =
  createContext<FtWorkspaceScopeContextValue | null>(null);

function requestKeyFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
): string {
  const values = searchParams.getAll("variant");
  if (!values.length) return workspaceVariantRequestKey(undefined);
  if (values.length === 1) return workspaceVariantRequestKey(values[0]);
  return workspaceVariantRequestKey(values);
}

/**
 * Query-aware client bridge for one server-resolved workspace-scope slot.
 *
 * The bridge does not resolve aircraft applicability. It only verifies that
 * the server projection registered for Fast Path belongs to the currently
 * visible URL selector before exposing it as synchronized.
 */
export function FtWorkspaceScopeBridge({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const searchParams = useSearchParams();
  const routeRequestKey = requestKeyFromSearchParams(searchParams);
  const [registeredScope, setRegisteredScope] =
    useState<WorkspaceAircraftScopeIdentity | null>(null);

  const registerScope = useCallback(
    (scope: WorkspaceAircraftScopeIdentity) => {
      setRegisteredScope(scope);
    },
    [],
  );

  const synchronized =
    registeredScope !== null
    && registeredScope.requestKey === routeRequestKey;

  const value = useMemo<FtWorkspaceScopeContextValue>(
    () => ({
      registeredScope,
      routeRequestKey,
      synchronized,
      effectiveScope: synchronized ? registeredScope : null,
      registerScope,
    }),
    [
      registeredScope,
      registerScope,
      routeRequestKey,
      synchronized,
    ],
  );

  return (
    <FtWorkspaceScopeContext.Provider value={value}>
      {children}
    </FtWorkspaceScopeContext.Provider>
  );
}

export function FtWorkspaceScopeRegistration({
  scope,
}: Readonly<{
  scope: WorkspaceAircraftScopeIdentity;
}>) {
  const context = useContext(FtWorkspaceScopeContext);
  if (!context) {
    throw new Error(
      "FtWorkspaceScopeRegistration must be used within FtWorkspaceScopeBridge",
    );
  }

  const { registerScope } = context;

  useLayoutEffect(() => {
    registerScope(scope);
  }, [registerScope, scope]);

  return (
    <span
      hidden
      data-ft-workspace-scope-registration="true"
      data-workspace-scope-request-key={scope.requestKey}
      data-workspace-scope-status={scope.status}
    />
  );
}

export function FtWorkspaceScopeEcho() {
  const context = useContext(FtWorkspaceScopeContext);
  if (!context) {
    throw new Error(
      "FtWorkspaceScopeEcho must be used within FtWorkspaceScopeBridge",
    );
  }

  const scope = context.effectiveScope;

  return (
    <span
      hidden
      data-ft-workspace-scope-echo="true"
      data-workspace-scope-synchronized={
        context.synchronized ? "true" : "false"
      }
      data-workspace-scope-status={scope?.status ?? "pending"}
      data-workspace-scope-request-key={context.routeRequestKey}
      data-workspace-scope-variant={scope?.variantKey ?? ""}
      data-workspace-scope-snapshot={
        scope?.effectiveConfigurationSnapshotId ?? ""
      }
    />
  );
}

export function useFtWorkspaceScope() {
  const context = useContext(FtWorkspaceScopeContext);
  if (!context) {
    throw new Error(
      "useFtWorkspaceScope must be used within FtWorkspaceScopeBridge",
    );
  }
  return context;
}
