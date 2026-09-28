"use client";

import { useLayoutEffect } from "react";

import {
  useFtFastPath,
} from "@/components/ft-fast-path/FtFastPathProvider";
import type { FastPathWorkspaceProjection } from "@/lib/fast-path/workspace-projection";

export function FtFastPathProjectionRegistrar({
  projection,
}: Readonly<{
  projection: FastPathWorkspaceProjection;
}>) {
  const {
    registerWorkspaceProjection,
    unregisterWorkspaceProjection,
    workspaceProjection,
    workspaceProjectionReady,
  } = useFtFastPath();

  useLayoutEffect(() => {
    registerWorkspaceProjection(projection);
    return () => unregisterWorkspaceProjection(projection);
  }, [
    projection,
    registerWorkspaceProjection,
    unregisterWorkspaceProjection,
  ]);

  const registered =
    workspaceProjectionReady
    && workspaceProjection?.requestKey === projection.requestKey
    && workspaceProjection.scope.status === projection.scope.status;

  return (
    <span
      hidden
      data-ft-fast-path-projection-registrar="true"
      data-projection-echo={registered ? "ready" : "pending"}
      data-projection-request-key={projection.requestKey}
      data-projection-scope-status={projection.scope.status}
      {...(projection.scope.status === "selected"
        ? {
            "data-projection-variant-key":
              projection.scope.variantKey ?? "common",
            "data-projection-effective-configuration-snapshot-id":
              projection.scope.effectiveConfigurationSnapshotId,
          }
        : {})}
    />
  );
}
