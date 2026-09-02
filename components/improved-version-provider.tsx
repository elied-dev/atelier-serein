"use client";

import { createContext, useContext, type ReactNode } from "react";

const ImprovedVersionContext = createContext(false);

export function ImprovedVersionProvider({
  children,
  enabled,
}: Readonly<{ children: ReactNode; enabled: boolean }>) {
  return <ImprovedVersionContext value={enabled}>{children}</ImprovedVersionContext>;
}

export function useImprovedVersion() {
  return useContext(ImprovedVersionContext);
}
