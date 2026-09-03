import productsJson from "@/data/products.json";
import { describe, expect, it } from "vitest";
import {
  catalogQueryFromParams,
  compareProducts,
  filterProducts,
  findProduct,
  imageCredits,
  productPageModel,
  relatedProducts,
} from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Product, ProductCategory, ProductImage } from "@/lib/products";

const products = productsJson as Product[];

function createImage(src: string, alt: string, role: ProductImage["role"] = "hero"): ProductImage {
  return {
    src,
    alt,
    width: 1200,
    height: 1500,
    role,
    sourcePage: "https://example.com/source",
    creator: "Example Creator",
    licenseName: "Example License",
    licenseUrl: "https://example.com/license",
    attributionRequired: false,
    attributionText: "Example Creator",
    reviewedAt: "2026-04-11",
    modifications: "Cropped and color graded",
  };
}

function createProduct({
  id,
  slug,
  sku,
  name,
  category,
  price,
  materials = ["Leather"],
  colors = [{ name: "Black", hex: "#171412" }],
  featured = false,
  relatedSlugs = [],
  styleTags = ["structured"],
  tagline = "A composed silhouette for everyday rituals.",
}: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  materials?: string[];
  colors?: Array<{ name: string; hex: string }>;
  featured?: boolean;
  relatedSlugs?: string[];
  styleTags?: string[];
  tagline?: string;
}): Product {
  return {
    id,
    slug,
    sku,
    name,
    category,
    collection: "Nocturne",
    tagline,
    description: `${name} description`,
    story: `${name} story`,
    price: { amountMinor: price, currency: "EUR" },
    variants: colors.map((color, index) => ({
      id: `${slug}-${index + 1}`,
      name: color.name,
      color,
      availability: "available",
    })),
    materials,
    craftsmanship: ["Edge painted"],
    dimensions: { width: 30, height: 20, depth: 10, unit: "cm" },
    weightGrams: 800,
    origin: "Fictional atelier, France",
    care: ["Wipe with a dry cloth"],
    styleTags,
    occasions: ["daily"],
    features: ["Interior pocket"],
    badges: featured ? ["exclusive"] : ["new"],
    featured,
    images: [
      createImage(`/images/products/${slug}-hero.webp`, `${name} hero`),
      createImage(`/images/products/${slug}-detail.webp`, `${name} detail`, "detail"),
    ],
    relatedSlugs,
  };
}

const fixtures: Product[] = [
  createProduct({
    id: "bag-01",
    slug: "vesper-tote",
    sku: "AS-BAG-001",
    name: "Vesper Tote",
    category: "bags",
    price: 285000,
    materials: ["Leather", "Suede"],
    colors: [{ name: "Oxblood", hex: "#651c2a" }],
    featured: true,
    relatedSlugs: ["serein-mini", "aureate-hoops"],
    styleTags: ["structured", "vesper"],
    tagline: "A composed carry for evening departures.",
  }),
  createProduct({
    id: "bag-02",
    slug: "serein-mini",
    sku: "AS-BAG-002",
    name: "Serein Mini",
    category: "bags",
    price: 195000,
    materials: ["Leather"],
    colors: [{ name: "Oxblood", hex: "#651c2a" }],
    relatedSlugs: ["vesper-tote"],
    styleTags: ["compact", "vesper"],
    tagline: "A compact companion for evening rituals.",
  }),
  createProduct({
    id: "jewel-01",
    slug: "aureate-hoops",
    sku: "AS-JEW-001",
    name: "Aureate Hoops",
    category: "jewelry",
    price: 98000,
    materials: ["Gold Vermeil"],
    colors: [{ name: "Champagne", hex: "#c8aa72" }],
    featured: true,
    relatedSlugs: ["vesper-tote"],
    styleTags: ["sculptural"],
    tagline: "Quiet arcs for candlelit rooms.",
  }),
  createProduct({
    id: "watch-01",
    slug: "luma-watch",
    sku: "AS-WAT-001",
    name: "Luma Watch",
    category: "watches",
    price: 430000,
    materials: ["Steel"],
    colors: [{ name: "Stone", hex: "#82786d" }],
    styleTags: ["minimal"],
    tagline: "A measured cadence in brushed steel.",
  }),
];

describe("catalog", () => {
  it("looks up fixture slugs from an explicit catalog", () => {
    expect(products).toHaveLength(95);
    expect(findProduct("vesper-tote", products)?.sku).toBe("AS-BAG-001");
    expect(findProduct("  VESPER-TOTE  ", fixtures)?.sku).toBe("AS-BAG-001");
    expect(findProduct("not-a-product", fixtures)).toBeUndefined();
  });

  it("filters local text, category, material, color, and price without mutating the source", () => {
    const original = fixtures.map((product) => product.slug);

    expect(
      filterProducts(
        {
          q: "  VESPER  ",
          category: "bags",
          material: "leather",
          color: "oxblood",
          max: 300000,
          sort: "price-desc",
        },
        fixtures,
      ).map((product) => product.slug),
    ).toEqual(["vesper-tote", "serein-mini"]);

    expect(filterProducts({ q: "find me a leather bag" }, fixtures).map((product) => product.slug)).toEqual([
      "vesper-tote",
      "serein-mini",
    ]);

    expect(filterProducts({ min: 200000, sort: "price-asc" }, fixtures).map((product) => product.slug)).toEqual([
      "vesper-tote",
      "luma-watch",
    ]);

    expect(filterProducts({ sort: "name" }, fixtures).map((product) => product.slug)).toEqual([
      "aureate-hoops",
      "luma-watch",
      "serein-mini",
      "vesper-tote",
    ]);

    expect(fixtures.map((product) => product.slug)).toEqual(original);
  });

  it("normalizes supported URL filters and ignores invalid values", () => {
    expect(
      catalogQueryFromParams({
        q: "vesper",
        category: "bags",
        color: "Oxblood",
        min: "10000",
        max: "300000",
        sort: "price-desc",
      }),
    ).toEqual({
      q: "vesper",
      category: "bags",
      color: "Oxblood",
      min: 10000,
      max: 300000,
      sort: "price-desc",
    });
    expect(catalogQueryFromParams({ category: "shoes", min: "free", sort: "random" })).toEqual({});
  });

  it("normalizes comparison to two or three unique products", () => {
    expect(compareProducts([" VESPER-TOTE ", "serein-mini", "vesper-tote"], fixtures).map((product) => product.slug)).toEqual([
      "vesper-tote",
      "serein-mini",
    ]);
    expect(compareProducts(["vesper-tote"], fixtures)).toEqual([]);
    expect(
      compareProducts(["vesper-tote", "missing", "luma-watch", "aureate-hoops", "serein-mini"], fixtures).map(
        (product) => product.slug,
      ),
    ).toEqual(["vesper-tote", "luma-watch", "aureate-hoops"]);
  });

  it("resolves related products and returns one credit per image", () => {
    const product = findProduct("vesper-tote", fixtures)!;

    expect(relatedProducts(product, fixtures).map((item) => item.slug)).toEqual(product.relatedSlugs);
    expect(imageCredits(products)).toHaveLength(products.flatMap((item) => item.images).length);
    expect(imageCredits(fixtures)).toHaveLength(fixtures.flatMap((item) => item.images).length);
    expect(imageCredits(fixtures)[0]).toMatchObject({
      productName: "Vesper Tote",
      src: "/images/products/vesper-tote-hero.webp",
    });
  });

  it("builds a complete product page model", () => {
    const model = productPageModel("vesper-tote", products);
    expect(model?.product.slug).toBe("vesper-tote");
    expect(model?.related).toHaveLength(2);
    expect(productPageModel("missing", products)).toBeUndefined();
  });

  it("formats minor units with native Intl", () => {
    expect(formatMoney(285000, "EUR")).toBe(
      new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(2850),
    );
    expect(formatMoney(37900, "USD")).toBe(
      new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(379),
    );
  });
});
