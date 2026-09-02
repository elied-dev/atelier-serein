import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, posix, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const categories = new Set(["bags", "jewelry", "watches", "fragrance"]);
const roles = new Set(["hero", "detail", "lifestyle"]);
const availability = new Set(["available", "limited", "preview"]);
const badges = new Set(["new", "exclusive", "limited"]);
const color = /^#[0-9a-f]{6}$/i;
const text = (value) => typeof value === "string" && value.trim().length > 0;
const record = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const textArray = (value) => Array.isArray(value) && value.every(text);
const finiteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const positiveNumber = (value) => finiteNumber(value) && value > 0;
const describe = (value) => String(value);

function validDimensions(value) {
  return record(value)
    && value.unit === "cm"
    && ["width", "height", "depth"].every((key) => value[key] === undefined || positiveNumber(value[key]));
}

function localImageFile(src, rootDir) {
  if (!text(src) || !src.startsWith("/images/") || /^https?:/i.test(src) || src.includes("\\")) return;
  const relativePath = posix.normalize(src.slice("/images/".length));
  if (!relativePath || relativePath === "." || relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("/") || /^[A-Za-z]:\//.test(relativePath)) return;
  const imagesRoot = resolve(rootDir, "public", "images");
  const filePath = resolve(imagesRoot, relativePath);
  const fromImagesRoot = relative(imagesRoot, filePath);
  if (!fromImagesRoot || fromImagesRoot === ".." || fromImagesRoot.startsWith(`..${sep}`) || isAbsolute(fromImagesRoot)) return;
  return filePath;
}

export function validateProducts(products, rootDir = process.cwd()) {
  const errors = [];
  if (!Array.isArray(products)) return ["catalog must be an array"];
  const seen = { id: new Set(), slug: new Set(), sku: new Set() };

  for (const [productIndex, product] of products.entries()) {
    if (!record(product)) {
      errors.push(`product ${productIndex + 1}: product must be an object`);
      continue;
    }

    for (const key of ["id", "slug", "sku"]) {
      if (!text(product[key])) errors.push(`product missing ${key}`);
      else if (seen[key].has(product[key])) errors.push(`duplicate ${key}: ${product[key]}`);
      else seen[key].add(product[key]);
    }

    const label = product.slug || product.id || `product ${productIndex + 1}`;

    for (const key of ["name", "collection", "tagline", "description", "story", "origin"]) {
      if (!text(product[key])) errors.push(`${label}: missing ${key}`);
    }

    if (!categories.has(product.category)) errors.push(`${label}: invalid category ${product.category}`);

    if (!record(product.price) || !Number.isInteger(product.price.amountMinor) || product.price.amountMinor <= 0 || product.price.currency !== "EUR") {
      errors.push(`${label}: price must be a positive integer in EUR`);
    }

    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      errors.push(`${label}: variants must be a non-empty array`);
    } else {
      for (const [variantIndex, variant] of product.variants.entries()) {
        if (!record(variant)) {
          errors.push(`${label}: variant ${variantIndex + 1} must be an object`);
          continue;
        }
        if (!text(variant.id) || !text(variant.name) || !availability.has(variant.availability)) errors.push(`${label}: invalid variant`);
        if (variant.color !== undefined) {
          if (!record(variant.color) || !text(variant.color.name) || !color.test(variant.color.hex)) {
            errors.push(`${label}: invalid color ${record(variant.color) ? variant.color.hex : describe(variant.color)}`);
          }
        }
        if (variant.size !== undefined && !text(variant.size)) errors.push(`${label}: invalid variant`);
      }
    }

    for (const key of ["materials", "craftsmanship", "care", "styleTags", "occasions", "features"]) {
      if (!textArray(product[key])) errors.push(`${label}: ${key} must be an array of strings`);
    }

    if (!validDimensions(product.dimensions)) errors.push(`${label}: dimensions must use cm with positive numeric values`);
    if (product.weightGrams !== undefined && !finiteNumber(product.weightGrams)) errors.push(`${label}: weightGrams must be a finite number`);
    if (!Array.isArray(product.badges) || product.badges.some((badge) => !badges.has(badge))) errors.push(`${label}: badges must use only new, exclusive, or limited`);
    if (typeof product.featured !== "boolean") errors.push(`${label}: featured must be a boolean`);

    if (!Array.isArray(product.images)) {
      errors.push(`${label}: images must be an array`);
    } else {
      if (!product.images.some((item) => record(item) && item.role === "hero")) errors.push(`${label}: missing hero image`);
      for (const [imageIndex, image] of product.images.entries()) {
        if (!record(image)) {
          errors.push(`${label}: image ${imageIndex + 1} must be an object`);
          continue;
        }

        const filePath = localImageFile(image.src, rootDir);
        if (!filePath) errors.push(`${label}: invalid image path ${image.src}`);
        else if (!existsSync(filePath)) errors.push(`${label}: missing image file ${image.src}`);

        if (!text(image.alt) || !Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) {
          errors.push(`${label}: invalid image dimensions or alt text`);
        }
        for (const key of ["sourcePage", "creator", "licenseName", "licenseUrl", "attributionText", "reviewedAt", "modifications"]) {
          if (!text(image[key])) errors.push(`${label}: image missing ${key}`);
        }
        if (image.creatorUrl !== undefined && !text(image.creatorUrl)) errors.push(`${label}: image creatorUrl must be a non-empty string`);
        if (typeof image.attributionRequired !== "boolean") errors.push(`${label}: image attributionRequired must be a boolean`);
        if (!roles.has(image.role)) errors.push(`${label}: invalid image role ${image.role}`);
      }
    }

    if (!Array.isArray(product.relatedSlugs) || product.relatedSlugs.some((slug) => !text(slug))) {
      errors.push(`${label}: relatedSlugs must be an array of strings`);
    }
  }

  for (const product of products) {
    if (!record(product) || !Array.isArray(product.relatedSlugs) || product.relatedSlugs.some((slug) => !text(slug))) continue;
    for (const slug of product.relatedSlugs) {
      if (slug === product.slug) errors.push(`${product.slug}: related product cannot reference itself`);
      else if (!seen.slug.has(slug)) errors.push(`${product.slug}: unknown related slug ${slug}`);
    }
  }

  return errors;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
    const errors = validateProducts(products);
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log(`Validated ${products.length} products`);
    }
  } catch (error) {
    console.error(`invalid catalog JSON: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
