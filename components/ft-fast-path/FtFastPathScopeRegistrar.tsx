"use client";

import { useLayoutEffect } from "react";

import type { FastPathWorkspaceProjection } from "@/lib/fast-path/workspace-projection";

import { useFtFastPath } from "./FtFastPathProvider";

export function FtFastPathScopeRegistrar({
  projection,
}: Readonly<{
  projection: FastPathWorkspaceProjection;
}>) {
  const {
    registerWorkspaceProjection,
    clearWorkspaceProjection,
  } = useFtFastPath();

  useLayoutEffect(() => {
    registerWorkspaceProjection(projection);
    return () => {
      clearWorkspaceProjection(projection);
    };
  }, [
    clearWorkspaceProjection,
    projection,
    registerWorkspaceProjection,
  ]);

  return null;
}
