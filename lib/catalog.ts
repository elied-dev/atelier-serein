import type { Product, ProductCategory, ProductImage } from "@/lib/products";

const normalizeText = (value: string | undefined) => value?.trim().toLocaleLowerCase() ?? "";

const searchableText = (product: Product) => [
  product.name,
  product.category,
  product.collection,
  product.tagline,
  ...product.materials,
  ...product.styleTags,
];

const ignoredSearchWords = new Set([
  "about", "find", "have", "looking", "need", "offer", "please", "policies", "policy",
  "show", "store", "that", "this", "want", "what", "with", "your", "you",
]);

export function matchesSearchQuery(query: string, values: Array<string | undefined>) {
  const terms = normalizeText(query).match(/[\p{L}\p{N}]+/gu)
    ?.filter((term) => term.length > 2 && !ignoredSearchWords.has(term)) ?? [];
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  return terms.length > 0 && terms.every((term) => haystack.includes(term));
}

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

const categoryValues = new Set(["bags", "jewelry", "watches", "fragrance"]);
const sortValues = new Set(["featured", "price-asc", "price-desc", "name"]);

export function catalogQueryFromParams(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const one = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const category = one("category");
  const sort = one("sort");
  const positiveInteger = (key: string) => {
    const raw = one(key);
    if (!raw?.match(/^\d+$/)) return undefined;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : undefined;
  };
  const min = positiveInteger("min");
  const max = positiveInteger("max");

  return {
    ...(one("q")?.trim() ? { q: one("q")!.trim() } : {}),
    ...(category && categoryValues.has(category) ? { category: category as ProductCategory } : {}),
    ...(one("material") ? { material: one("material") } : {}),
    ...(one("color") ? { color: one("color") } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(sort && sortValues.has(sort) ? { sort: sort as CatalogQuery["sort"] } : {}),
  };
}

export function findProduct(slug: string, source: Product[]) {
  const needle = normalizeText(slug);
  if (!needle) return undefined;
  return source.find((product) => normalizeText(product.slug) === needle);
}

export function filterProducts(query: CatalogQuery, source: Product[]) {
  const needle = normalizeText(query.q);
  const material = normalizeText(query.material);
  const color = normalizeText(query.color);
  const category = normalizeText(query.category);

  return source
    .filter((product) =>
      (!needle || matchesSearchQuery(needle, searchableText(product)))
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

export function compareProducts(slugs: string[], source: Product[]) {
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

export function relatedProducts(product: Product, source: Product[]) {
  return product.relatedSlugs
    .map((slug) => findProduct(slug, source))
    .filter((item): item is Product => Boolean(item));
}

export function productPageModel(slug: string, source: Product[]) {
  const product = findProduct(slug, source);
  return product ? { product, related: relatedProducts(product, source) } : undefined;
}

export function imageCredits(source: Product[]): ImageCredit[] {
  return source.flatMap((product) => product.images.map((image) => ({ ...image, productName: product.name })));
}
