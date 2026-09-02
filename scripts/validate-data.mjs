import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const categories = new Set(["bags", "jewelry", "watches", "fragrance"]);
const roles = new Set(["hero", "detail", "lifestyle"]);
const availability = new Set(["available", "limited", "preview"]);
const color = /^#[0-9a-f]{6}$/i;
const text = (value) => typeof value === "string" && value.trim().length > 0;

export function validateProducts(products, rootDir = process.cwd()) {
  const errors = [];
  if (!Array.isArray(products)) return ["catalog must be an array"];
  const seen = { id: new Set(), slug: new Set(), sku: new Set() };

  for (const product of products) {
    for (const key of ["id", "slug", "sku"]) {
      if (!text(product[key])) errors.push(`product missing ${key}`);
      else if (seen[key].has(product[key])) errors.push(`duplicate ${key}: ${product[key]}`);
      else seen[key].add(product[key]);
    }
    const label = product.slug || product.id || "unknown product";
    for (const key of ["name", "collection", "tagline", "description", "story", "origin"]) {
      if (!text(product[key])) errors.push(`${label}: missing ${key}`);
    }
    if (!categories.has(product.category)) errors.push(`${label}: invalid category ${product.category}`);
    if (!Number.isInteger(product.price?.amountMinor) || product.price.amountMinor <= 0 || product.price.currency !== "EUR") {
      errors.push(`${label}: price must be a positive integer in EUR`);
    }
    if (!Array.isArray(product.variants) || product.variants.length === 0) errors.push(`${label}: missing variants`);
    for (const variant of product.variants || []) {
      if (!text(variant.id) || !text(variant.name) || !availability.has(variant.availability)) errors.push(`${label}: invalid variant`);
      if (variant.color && !color.test(variant.color.hex)) errors.push(`${label}: invalid color ${variant.color.hex}`);
    }
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.some((item) => item.role === "hero")) errors.push(`${label}: missing hero image`);
    for (const image of images) {
      if (!text(image.src) || !image.src.startsWith("/images/") || /^https?:/i.test(image.src)) errors.push(`${label}: image must use a local /images path`);
      if (!existsSync(resolve(rootDir, "public", String(image.src || "").replace(/^\//, "")))) errors.push(`${label}: missing image file ${image.src}`);
      if (!text(image.alt) || !Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) errors.push(`${label}: invalid image dimensions or alt text`);
      for (const key of ["sourcePage", "creator", "licenseName", "licenseUrl", "attributionText", "reviewedAt", "modifications"]) {
        if (!text(image[key])) errors.push(`${label}: image missing ${key}`);
      }
      if (!roles.has(image.role)) errors.push(`${label}: invalid image role ${image.role}`);
    }
  }

  for (const product of products) {
    for (const slug of product.relatedSlugs || []) {
      if (slug === product.slug) errors.push(`${product.slug}: related product cannot reference itself`);
      else if (!seen.slug.has(slug)) errors.push(`${product.slug}: unknown related slug ${slug}`);
    }
  }
  return errors;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
  const errors = validateProducts(products);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${products.length} products`);
  }
}
