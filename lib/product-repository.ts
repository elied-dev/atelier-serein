import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { productFromRecord } from "@/lib/product-record";

export const listProducts = cache(async () => {
  const rows = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  if (!rows.length) throw new Error("Product catalog is empty; run npm run db:seed");
  return rows.map(productFromRecord);
});

export const getProductBySlug = cache(async (slug: string) => {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? productFromRecord(row) : undefined;
});
