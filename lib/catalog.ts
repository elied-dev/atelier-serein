import products from "@/data/products.json";
import type { Product, ProductCategory, ProductImage } from "@/lib/products";

export const allProducts = products as Product[];

const normalizeText = (value: string | undefined) => value?.trim().toLocaleLowerCase() ?? "";
const bySlug = new Map(allProducts.map((product) => [normalizeText(product.slug), product]));

const searchableText = (product: Product) => [
  product.name,
  product.category,
  product.collection,
  product.tagline,
  ...product.materials,
  ...product.styleTags,
];

export type CatalogQuery = {
  q?: string;
  category?: ProductCategory;
  material?: string;
  color?: string;
  min?: number;
  max?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "name";
};

export type ImageCredit = ProductImage & { productName: string };

export function findProduct(slug: string, source: Product[] = allProducts) {
  const needle = normalizeText(slug);
  if (!needle) return undefined;
  if (source === allProducts) return bySlug.get(needle);
  return source.find((product) => normalizeText(product.slug) === needle);
}

export function filterProducts(query: CatalogQuery, source: Product[] = allProducts) {
  const needle = normalizeText(query.q);
  const material = normalizeText(query.material);
  const color = normalizeText(query.color);
  const category = normalizeText(query.category);

  return source
    .filter((product) =>
      (!needle || searchableText(product).some((value) => normalizeText(value).includes(needle)))
      && (!category || normalizeText(product.category) === category)
      && (!material || product.materials.some((value) => normalizeText(value) === material))
      && (!color || product.variants.some((variant) => normalizeText(variant.color?.name) === color))
      && (query.min === undefined || product.price.amountMinor >= query.min)
      && (query.max === undefined || product.price.amountMinor <= query.max),
    )
    .sort((a, b) => {
      if (query.sort === "price-asc") return a.price.amountMinor - b.price.amountMinor;
      if (query.sort === "price-desc") return b.price.amountMinor - a.price.amountMinor;
      if (query.sort === "name") return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
      return Number(b.featured) - Number(a.featured);
    });
}

export function compareProducts(slugs: string[], source: Product[] = allProducts) {
  const unique: Product[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const product = findProduct(slug, source);
    if (!product) continue;

    const normalizedSlug = normalizeText(product.slug);
    if (seen.has(normalizedSlug)) continue;

    seen.add(normalizedSlug);
    unique.push(product);

    if (unique.length === 3) break;
  }

  return unique.length >= 2 ? unique : [];
}

export function relatedProducts(product: Product, source: Product[] = allProducts) {
  return product.relatedSlugs
    .map((slug) => findProduct(slug, source))
    .filter((item): item is Product => Boolean(item));
}

export function productPageModel(slug: string) {
  const product = findProduct(slug);
  return product ? { product, related: relatedProducts(product) } : undefined;
}

export function imageCredits(source: Product[] = allProducts): ImageCredit[] {
  return source.flatMap((product) => product.images.map((image) => ({ ...image, productName: product.name })));
}
