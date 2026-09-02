"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import {
  BAG_KEY,
  BAG_VERSION,
  bagReducer,
  parseStoredBag,
  type BagLine,
} from "@/lib/bag";

type BagContextValue = {
  lines: BagLine[];
  count: number;
  add: (line: BagLine) => void;
  setQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  remove: (productSlug: string, variantId: string) => void;
  clear: () => void;
};

const BagContext = createContext<BagContextValue | undefined>(undefined);

export function BagProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lines, dispatch] = useReducer(bagReducer, []);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedLines = parseStoredBag(localStorage.getItem(BAG_KEY));
    dispatch({ type: "clear" });
    storedLines.forEach((line) => dispatch({ type: "add", line }));
    // Storage hydration intentionally completes after the stored lines are dispatched.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BAG_KEY, JSON.stringify({ version: BAG_VERSION, lines }));
  }, [hydrated, lines]);

  const value: BagContextValue = {
    lines,
    count: lines.reduce((total, line) => total + line.quantity, 0),
    add: (line) => dispatch({ type: "add", line }),
    setQuantity: (productSlug, variantId, quantity) =>
      dispatch({ type: "quantity", productSlug, variantId, quantity }),
    remove: (productSlug, variantId) => dispatch({ type: "remove", productSlug, variantId }),
    clear: () => dispatch({ type: "clear" }),
  };

  return <BagContext value={value}>{children}</BagContext>;
}

export function useBag() {
  const value = useContext(BagContext);
  if (!value) throw new Error("useBag must be used inside BagProvider");
  return value;
}
