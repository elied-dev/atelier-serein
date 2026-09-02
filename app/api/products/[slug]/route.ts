import { getProductBySlug } from "@/lib/product-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  return product
    ? Response.json(product)
    : Response.json({ error: "Product not found" }, { status: 404 });
}
