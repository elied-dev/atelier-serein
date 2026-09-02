"use client";

import { BagEditor } from "@/components/commerce";

export default function BagPage() {
  return (
    <section className="bag-page">
      <p className="eyebrow">Your selection</p>
      <h1>Bag</h1>
      <BagEditor />
    </section>
  );
}
