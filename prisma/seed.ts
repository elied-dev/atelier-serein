import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import productsJson from "../data/products.json";
import { PrismaClient } from "../generated/prisma/client";
import { productFromRecord, productToRecord } from "../lib/product-record";
import type { Product } from "../lib/products";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const products = productsJson as Product[];

async function main() {
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

  console.log(`Seeded and verified ${stored.length} products`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
