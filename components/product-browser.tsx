"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/commerce";
import { useProducts } from "@/components/product-provider";
import { catalogQueryFromParams, compareProducts, filterProducts } from "@/lib/catalog";
import type { CatalogQuery } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/products";
import { site } from "@/lib/site";

const categories = ["bags", "jewelry", "watches", "fragrance"] as const;

export function ProductBrowser({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = catalogQueryFromParams(Object.fromEntries(searchParams.entries()));
  const results = filterProducts(query, products);
  const materials = [...new Set(products.flatMap((product) => product.materials))].sort();
  const colors = [...new Set(products.flatMap((product) => product.variants.flatMap((variant) => variant.color?.name ?? [])))].sort();

  function updateParam(key: keyof CatalogQuery, value: string) {
    const params = new URLSearchParams(
      Object.entries(query).map(([name, current]) => [name, String(current)]),
    );
    if (value) params.set(key, value);
    else params.delete(key);
    const next = params.toString();
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <>
      <form className="catalog-filters" onSubmit={(event) => event.preventDefault()}>
        <label className="search-field">
          <span>Search products</span>
          <input
            type="search"
            name="q"
            value={query.q ?? ""}
            onChange={(event) => updateParam("q", event.currentTarget.value)}
            placeholder="Name, collection, or material"
          />
        </label>
        <label>
          <span>Category</span>
          <select value={query.category ?? ""} onChange={(event) => updateParam("category", event.currentTarget.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option value={category} key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          <span>Material</span>
          <select value={query.material ?? ""} onChange={(event) => updateParam("material", event.currentTarget.value)}>
            <option value="">All materials</option>
            {materials.map((material) => <option value={material} key={material}>{material}</option>)}
          </select>
        </label>
        <label>
          <span>Color</span>
          <select value={query.color ?? ""} onChange={(event) => updateParam("color", event.currentTarget.value)}>
            <option value="">All colors</option>
            {colors.map((color) => <option value={color} key={color}>{color}</option>)}
          </select>
        </label>
        <label>
          <span>Minimum price (EUR cents)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={query.min ?? ""}
            onChange={(event) => updateParam("min", event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Maximum price (EUR cents)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={query.max ?? ""}
            onChange={(event) => updateParam("max", event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Sort</span>
          <select value={query.sort ?? ""} onChange={(event) => updateParam("sort", event.currentTarget.value)}>
            <option value="">Default order</option>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <Link className="button button-quiet clear-filters" href="/collection">Clear all</Link>
      </form>

      <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "piece" : "pieces"}</p>
      {results.length > 0 ? (
        <>
          <h2 className="sr-only">Products</h2>
          <ProductGrid products={results} />
        </>
      ) : (
        <div className="no-results">
          <h2>No pieces found</h2>
          <p>Try a broader search or clear the selected filters.</p>
          <Link className="button button-quiet" href="/collection">Clear all filters</Link>
        </div>
      )}
    </>
  );
}

function dimensions(product: Product) {
  const values = [product.dimensions.width, product.dimensions.height, product.dimensions.depth]
    .filter((value): value is number => value !== undefined);
  return `${values.join(" × ")} ${product.dimensions.unit}`;
}

export function CompareView() {
  const selected = useSearchParams().get("products")?.split(",") ?? [];
  const products = compareProducts(selected, useProducts());

  if (products.length < 2) {
    return (
      <section className="compare-page compare-empty">
        <p className="eyebrow">Side by side</p>
        <h1>Compare pieces</h1>
        <p>Choose at least two valid products to compare. Product pages provide a ready-made comparison link.</p>
        <Link className="button button-primary" href="/collection">Browse the collection</Link>
        <p className="page-demo-notice">{site.demoNotice}</p>
      </section>
    );
  }

  const rows = [
    ["Name", (product: Product) => <Link href={`/product/${product.slug}`}>{product.name}</Link>],
    ["Price", (product: Product) => formatMoney(product.price.amountMinor, product.price.currency)],
    ["Category", (product: Product) => product.category],
    ["Materials", (product: Product) => product.materials.join(", ")],
    ["Dimensions", dimensions],
    ["Origin", (product: Product) => product.origin],
    ["Features", (product: Product) => product.features.join(", ")],
    ["Variants", (product: Product) => product.variants.map((variant) => variant.name).join(", ")],
  ] as const;

  return (
    <section className="compare-page">
      <p className="eyebrow">Side by side</p>
      <h1>Compare pieces</h1>
      <p className="compare-intro">Up to three fictional pieces, considered by material, proportion, and detail.</p>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Detail</th>
              {products.map((product) => <th scope="col" key={product.slug}>{product.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Hero</th>
              {products.map((product) => (
                <td key={product.slug}>
                  <Image
                    src={product.images[0].src}
                    alt={product.images[0].alt}
                    width={product.images[0].width}
                    height={product.images[0].height}
                    sizes="(max-width: 700px) 70vw, 28vw"
                  />
                </td>
              ))}
            </tr>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {products.map((product) => <td key={product.slug}>{value(product)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link className="button button-quiet compare-back" href="/collection">Back to the collection</Link>
      <p className="page-demo-notice">{site.demoNotice}</p>
    </section>
  );
}
