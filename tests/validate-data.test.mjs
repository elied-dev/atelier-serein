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
    bad.images[0].src = "/images/products/missing.webp";
    const errors = validateProducts([bad, structuredClone(bad)], rootWithImage());
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate id: bag-01", "duplicate slug: vesper-tote", "duplicate sku: AS-BAG-001",
      "vesper-tote: invalid color black", "vesper-tote: related product cannot reference itself",
      "vesper-tote: unknown related slug missing", "vesper-tote: missing image file /images/products/missing.webp"
    ]));
  });

  it("reports structural contract errors instead of throwing", () => {
    const malformed = structuredClone(product);
    malformed.variants = [null];
    malformed.materials = "Leather";
    malformed.craftsmanship = "Edge painted";
    malformed.dimensions = { width: 34, unit: "mm" };
    malformed.care = [42];
    malformed.styleTags = "structured";
    malformed.occasions = "daily";
    malformed.features = {};
    malformed.badges = ["sale"];
    malformed.featured = "yes";
    malformed.images = [null, { ...image, src: "/images/../../package.json", attributionRequired: "no" }];
    malformed.relatedSlugs = "vesper-tote";

    expect(validateProducts([null, malformed], rootWithImage())).toEqual(expect.arrayContaining([
      "product 1: product must be an object",
      "vesper-tote: variant 1 must be an object",
      "vesper-tote: materials must be an array of strings",
      "vesper-tote: craftsmanship must be an array of strings",
      "vesper-tote: dimensions must use cm with positive numeric values",
      "vesper-tote: care must be an array of strings",
      "vesper-tote: styleTags must be an array of strings",
      "vesper-tote: occasions must be an array of strings",
      "vesper-tote: features must be an array of strings",
      "vesper-tote: badges must use only new, exclusive, or limited",
      "vesper-tote: featured must be a boolean",
      "vesper-tote: image 1 must be an object",
      "vesper-tote: invalid image path /images/../../package.json",
      "vesper-tote: image attributionRequired must be a boolean",
      "vesper-tote: relatedSlugs must be an array of strings"
    ]));
  });
});
