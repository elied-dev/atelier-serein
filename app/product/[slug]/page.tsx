import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBag, ProductGallery, ProductGrid } from "@/components/commerce";
import { allProducts, findProduct, productPageModel } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return allProducts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = findProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const model = productPageModel((await params).slug);
  if (!model) notFound();

  const { product, related } = model;
  const dimensions = [
    product.dimensions.width,
    product.dimensions.height,
    product.dimensions.depth,
  ].filter((value): value is number => value !== undefined).join(" × ");

  return (
    <article className="product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/collection">Collection</Link></li>
          <li><Link href={`/collection/${product.category}`}>{product.category}</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="product-layout">
        <ProductGallery product={product} />
        <div className="purchase-panel">
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-tagline">{product.tagline}</p>
          <p className="product-price">{formatMoney(product.price.amountMinor, product.price.currency)}</p>
          <AddToBag product={product} />
          {related[0] && (
            <Link
              className="button button-quiet product-compare-link"
              href={{ pathname: "/compare", query: { products: `${product.slug},${related[0].slug}` } }}
            >
              Compare with {related[0].name}
            </Link>
          )}
          <p className="demo-note">{site.demoNotice}</p>
        </div>
      </div>

      <div className="product-narrative readable">
        <section aria-labelledby="description-heading">
          <p className="eyebrow">The piece</p>
          <h2 id="description-heading">Description</h2>
          <p>{product.description}</p>
          <p>{product.story}</p>
        </section>
      </div>

      <div className="product-details">
        <section>
          <h2>Materials</h2>
          <ul>{product.materials.map((material) => <li key={material}>{material}</li>)}</ul>
        </section>
        <section>
          <h2>Craftsmanship</h2>
          <ul>{product.craftsmanship.map((detail) => <li key={detail}>{detail}</li>)}</ul>
        </section>
        <section>
          <h2>Dimensions</h2>
          <p>{dimensions} {product.dimensions.unit}</p>
          {product.weightGrams && <p>{product.weightGrams} g</p>}
        </section>
        <section>
          <h2>Origin</h2>
          <p>{product.origin}</p>
        </section>
        <section>
          <h2>Care</h2>
          <ul>{product.care.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul>
        </section>
      </div>

      <section className="related-products" aria-labelledby="related-heading">
        <div className="section-heading">
          <p className="eyebrow">Consider next</p>
          <h2 id="related-heading">Related pieces</h2>
        </div>
        <ProductGrid products={related} />
      </section>

      <p className="page-demo-notice">{site.demoNotice}</p>
    </article>
  );
}
