import "dotenv/config";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import productsJson from "../data/products.json";
import { PrismaClient } from "../generated/prisma/client";
import { productFromRecord, productToRecord } from "../lib/product-record";
import type { Product } from "../lib/products";
import { validateProducts } from "../scripts/validate-data.mjs";

export async function seedProducts(fixture: unknown, prisma: PrismaClient) {
  const errors = validateProducts(fixture);
  if (errors.length) throw new Error(`Invalid product seed fixture:\n${errors.join("\n")}`);

  const products = fixture as Product[];
  await prisma.$transaction(products.map((product, sortOrder) => {
    const data = productToRecord(product, sortOrder);
    return prisma.product.upsert({ where: { id: product.id }, create: data, update: data });
  }), { timeout: 30_000 });

  const stored = await prisma.product.findMany({
    where: { id: { in: products.map(({ id }) => id) } },
    orderBy: { sortOrder: "asc" },
  });

  if (stored.length !== products.length) {
    throw new Error(`Expected ${products.length} seeded products, found ${stored.length}`);
  }
  if (!isDeepStrictEqual(stored.map(productFromRecord), products)) {
    throw new Error("Seeded products do not match data/products.json");
  }

  return stored.length;
}

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const count = await seedProducts(productsJson, prisma);
    console.log(`Seeded and verified ${count} products`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
