import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateProducts } from "../scripts/validate-data.mjs";

const image = {
  src: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "Black leather bag on ivory", width: 1200, height: 1500, role: "hero"
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

describe("validateProducts", () => {
  it("accepts a complete product with a remote Pexels image", () => {
    expect(validateProducts([product])).toEqual([]);
  });

  it("reports duplicate identity, bad relationships, colors, and non-Pexels images", () => {
    const bad = structuredClone(product);
    bad.variants[0].color.hex = "black";
    bad.relatedSlugs = [bad.slug, "missing"];
    bad.images[0].src = "https://example.com/missing.webp";
    const errors = validateProducts([bad, structuredClone(bad)]);
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate id: bag-01", "duplicate slug: vesper-tote", "duplicate sku: AS-BAG-001",
      "vesper-tote: invalid color black", "vesper-tote: related product cannot reference itself",
      "vesper-tote: unknown related slug missing", "vesper-tote: invalid Pexels image URL https://example.com/missing.webp"
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
    malformed.images = [null, { ...image, src: "/images/../../package.json" }];
    malformed.relatedSlugs = "vesper-tote";

    expect(validateProducts([null, malformed])).toEqual(expect.arrayContaining([
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
      "vesper-tote: invalid Pexels image URL /images/../../package.json",
      "vesper-tote: relatedSlugs must be an array of strings"
    ]));
  });

  it("rejects non-Pexels image URLs and invalid optional typed fields", () => {
    const malformed = structuredClone(product);
    malformed.weightGrams = "heavy";
    malformed.variants = [{ ...malformed.variants[0], color: 0 }];
    malformed.images = [
      { ...image, src: "http://images.pexels.com/photos/1/image.jpeg" },
      { ...image, src: "/images/..\\..\\package.json", role: "detail" },
      { ...image, src: "https://example.com/image.jpeg", role: "lifestyle" }
    ];

    expect(validateProducts([malformed])).toEqual(expect.arrayContaining([
      "vesper-tote: invalid color 0",
      "vesper-tote: weightGrams must be a finite number",
      "vesper-tote: invalid Pexels image URL http://images.pexels.com/photos/1/image.jpeg",
      "vesper-tote: invalid Pexels image URL /images/..\\..\\package.json",
      "vesper-tote: invalid Pexels image URL https://example.com/image.jpeg"
    ]));
  });

  it("contains five products in every category", () => {
    const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
    expect(products).toHaveLength(20);
    for (const category of ["bags", "jewelry", "watches", "fragrance"]) {
      expect(products.filter((product) => product.category === category)).toHaveLength(5);
    }
  });
});
