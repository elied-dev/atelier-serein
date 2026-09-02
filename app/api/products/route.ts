import { listProducts } from "@/lib/product-repository";

export async function GET() {
  return Response.json(await listProducts());
}
