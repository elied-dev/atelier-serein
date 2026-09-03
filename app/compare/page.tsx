import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/product-browser";

export const metadata: Metadata = {
  title: "Compare pieces",
  description: "Compare fictional Vibemart finds side by side.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="browser-loading">Loading comparison…</p>}>
      <CompareView />
    </Suspense>
  );
}
