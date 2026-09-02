-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('bags', 'jewelry', 'watches', 'fragrance');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR');

-- CreateEnum
CREATE TYPE "ProductBadge" AS ENUM ('new', 'exclusive', 'limited');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "collection" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "variants" JSONB NOT NULL,
    "materials" TEXT[],
    "craftsmanship" TEXT[],
    "dimensions" JSONB NOT NULL,
    "weightGrams" INTEGER,
    "origin" TEXT NOT NULL,
    "care" TEXT[],
    "styleTags" TEXT[],
    "occasions" TEXT[],
    "features" TEXT[],
    "badges" "ProductBadge"[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "images" JSONB NOT NULL,
    "relatedSlugs" TEXT[],

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
