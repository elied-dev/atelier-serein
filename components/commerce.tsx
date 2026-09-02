"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { toast } from "sonner";
import { useBag } from "@/components/bag-provider";
import { bagSubtotal } from "@/lib/bag";
import { findProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const hero = product.images[0];

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card-image" aria-label={`View ${product.name}`}>
        <Image
          src={hero.src}
          alt={hero.alt}
          width={hero.width}
          height={hero.height}
          sizes="(max-width: 520px) 100vw, (max-width: 820px) 50vw, 25vw"
        />
      </Link>
      <p className="product-category">{product.category}</p>
      <div className="product-meta">
        <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
        <p>{formatMoney(product.price.amountMinor, product.price.currency)}</p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="product-grid">
      {products.map((product) => <li key={product.slug}><ProductCard product={product} /></li>)}
    </ul>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = product.images[selectedImageIndex] ?? product.images[0];

  return (
    <div className="product-gallery">
      <div className="gallery-hero">
        <Image
          src={selectedImage.src}
          alt={selectedImage.alt}
          width={selectedImage.width}
          height={selectedImage.height}
          sizes="(max-width: 900px) 100vw, 58vw"
          priority
        />
      </div>
      <div className="gallery-selectors" aria-label={`${product.name} images`}>
        {product.images.map((image, index) => (
          <button
            type="button"
            className="gallery-selector"
            aria-label={image.alt}
            aria-pressed={selectedImageIndex === index}
            onClick={() => setSelectedImageIndex(index)}
            key={`${image.src}-${index}`}
          >
            <Image src={image.src} alt="" width={96} height={120} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function VariantPicker({
  product,
  value,
  onChange,
}: {
  product: Product;
  value?: string;
  onChange: (variantId: string) => void;
}) {
  const name = useId();

  return (
    <fieldset className="variant-picker">
      <legend>Choose a variant</legend>
      <div className="variant-options">
        {product.variants.map((variant) => (
          <label className="variant-option" key={variant.id}>
            <input
              type="radio"
              name={name}
              value={variant.id}
              checked={value === variant.id}
              disabled={variant.availability === "preview"}
              onChange={() => onChange(variant.id)}
            />
            {variant.color && <span className="color-swatch" style={{ backgroundColor: variant.color.hex }} aria-hidden="true" />}
            <span>{variant.name}{variant.availability === "preview" ? " (Preview)" : ""}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AddToBag({ product }: { product: Product }) {
  const initialVariant = product.variants.find((variant) => variant.availability === "available");
  const [variantId, setVariantId] = useState(initialVariant?.id);
  const { add } = useBag();
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const canAdd = Boolean(selectedVariant && selectedVariant.availability !== "preview");

  function handleAdd() {
    if (!selectedVariant || selectedVariant.availability === "preview") return;
    add({ productSlug: product.slug, variantId: selectedVariant.id, quantity: 1 });
    toast(`Added ${product.name} to bag`);
  }

  return (
    <div className="add-to-bag">
      <VariantPicker product={product} value={variantId} onChange={setVariantId} />
      <button type="button" className="button button-primary add-button" disabled={!canAdd} onClick={handleAdd}>
        Add to bag
      </button>
    </div>
  );
}

export function BagEditor() {
  const { lines, remove, setQuantity } = useBag();

  if (lines.length === 0) {
    return (
      <div className="bag-empty">
        <p>Your bag is empty.</p>
        <Link className="button button-primary" href="/collection">Explore the collection</Link>
      </div>
    );
  }

  return (
    <div className="bag-editor">
      <ul className="bag-lines">
        {lines.map((line) => {
          const product = findProduct(line.productSlug);
          const variant = product?.variants.find((item) => item.id === line.variantId);
          if (!product || !variant) return null;

          return (
            <li className="bag-line" key={`${line.productSlug}-${line.variantId}`}>
              <Link href={`/product/${product.slug}`} className="bag-line-image">
                <Image
                  src={product.images[0].src}
                  alt={product.images[0].alt}
                  width={product.images[0].width}
                  height={product.images[0].height}
                  sizes="140px"
                />
              </Link>
              <div className="bag-line-copy">
                <p className="product-category">{product.category}</p>
                <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
                <p>{variant.name}</p>
                <p>{formatMoney(product.price.amountMinor, product.price.currency)}</p>
              </div>
              <div className="bag-line-actions">
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) => {
                      const quantity = event.currentTarget.valueAsNumber;
                      if (Number.isInteger(quantity) && quantity > 0) {
                        setQuantity(line.productSlug, line.variantId, quantity);
                      }
                    }}
                  />
                </label>
                <button type="button" className="text-button" onClick={() => remove(line.productSlug, line.variantId)}>
                  Remove {product.name}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="bag-summary">
        <p><span>Subtotal</span><strong>{formatMoney(bagSubtotal(lines), "EUR")}</strong></p>
        <p>Taxes and delivery are not calculated in this demonstration.</p>
        <Link className="button button-primary" href="/checkout">Continue to checkout</Link>
      </div>
    </div>
  );
}
