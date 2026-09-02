import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateProducts } from "../scripts/validate-data.mjs";

const image = {
  src: "/images/products/item.webp", alt: "Black leather bag on ivory",
  width: 1200, height: 1500, role: "hero", sourcePage: "https://example.com/item",
  creator: "Example Creator", licenseName: "Example License",
  licenseUrl: "https://example.com/license", attributionRequired: false,
  attributionText: "Example Creator", reviewedAt: "2026-04-11", modifications: "Cropped and color graded"
};

const product = {
  id: "bag-01", slug: "vesper-tote", sku: "AS-BAG-001", name: "Vesper Tote",
  category: "bags", collection: "Nocturne", tagline: "A composed daily carry.",
  description: "A structured fictional tote.", story: "Designed for the Atelier Serein demonstration.",
  price: { amountMinor: 285000, currency: "EUR" },
  variants: [{ id: "black", name: "Black", color: { name: "Black", hex: "#171412" }, availability: "available" }],
  materials: ["Leather"], craftsmanship: ["Edge painted"], dimensions: { width: 34, height: 26, depth: 13, unit: "cm" },
  origin: "Fictional atelier, France", care: ["Wipe with a dry cloth"], styleTags: ["structured"],
  occasions: ["daily"], features: ["Interior pocket"], badges: ["new"], featured: true,
  images: [image], relatedSlugs: []
};

function rootWithImage() {
  const root = mkdtempSync(join(tmpdir(), "atelier-"));
  mkdirSync(join(root, "public/images/products"), { recursive: true });
  writeFileSync(join(root, "public/images/products/item.webp"), "image");
  return root;
}

describe("validateProducts", () => {
  it("accepts a complete local-image record", () => {
    expect(validateProducts([product], rootWithImage())).toEqual([]);
  });

  it("reports duplicate identity, bad relationships, colors, and missing files", () => {
    const bad = structuredClone(product);
    bad.variants[0].color.hex = "black";
    bad.relatedSlugs = [bad.slug, "missing"];
    const errors = validateProducts([bad, structuredClone(bad)], rootWithImage());
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate id: bag-01", "duplicate slug: vesper-tote", "duplicate sku: AS-BAG-001",
      "vesper-tote: invalid color black", "vesper-tote: related product cannot reference itself",
      "vesper-tote: unknown related slug missing"
    ]));
  });
});
