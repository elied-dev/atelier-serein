import type { Prisma, Product as ProductRecord } from "@/generated/prisma/client";
import type { Product, ProductImage, ProductVariant } from "@/lib/products";

export function productToRecord(product: Product, sortOrder: number): Prisma.ProductCreateInput {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    sortOrder,
    name: product.name,
    category: product.category,
    collection: product.collection,
    tagline: product.tagline,
    description: product.description,
    story: product.story,
    amountMinor: product.price.amountMinor,
    currency: product.price.currency,
    variants: product.variants as unknown as Prisma.InputJsonValue,
    materials: product.materials,
    craftsmanship: product.craftsmanship,
    dimensions: product.dimensions as unknown as Prisma.InputJsonValue,
    weightGrams: product.weightGrams,
    origin: product.origin,
    care: product.care,
    styleTags: product.styleTags,
    occasions: product.occasions,
    features: product.features,
    badges: product.badges,
    featured: product.featured,
    images: product.images as unknown as Prisma.InputJsonValue,
    relatedSlugs: product.relatedSlugs,
  };
}

export function productFromRecord(record: ProductRecord): Product {
  return {
    id: record.id,
    slug: record.slug,
    sku: record.sku,
    name: record.name,
    category: record.category,
    collection: record.collection,
    tagline: record.tagline,
    description: record.description,
    story: record.story,
    price: { amountMinor: record.amountMinor, currency: record.currency },
    variants: record.variants as unknown as ProductVariant[],
    materials: record.materials,
    craftsmanship: record.craftsmanship,
    dimensions: record.dimensions as unknown as Product["dimensions"],
    ...(record.weightGrams === null ? {} : { weightGrams: record.weightGrams }),
    origin: record.origin,
    care: record.care,
    styleTags: record.styleTags,
    occasions: record.occasions,
    features: record.features,
    badges: record.badges,
    featured: record.featured,
    images: record.images as unknown as ProductImage[],
    relatedSlugs: record.relatedSlugs,
  };
}
