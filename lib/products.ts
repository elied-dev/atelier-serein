export type ProductCategory = "bags" | "jewelry" | "watches" | "fragrance";
export type Availability = "available" | "limited" | "preview";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  role: "hero" | "detail" | "lifestyle";
  sourcePage?: string;
  creator?: string;
  creatorUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  reviewedAt?: string;
  modifications?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  color?: { name: string; hex: string };
  size?: string;
  availability: Availability;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  collection: string;
  tagline: string;
  description: string;
  story: string;
  price: { amountMinor: number; currency: "EUR" };
  variants: ProductVariant[];
  materials: string[];
  craftsmanship: string[];
  dimensions: { width?: number; height?: number; depth?: number; unit: "cm" };
  weightGrams?: number;
  origin: string;
  care: string[];
  styleTags: string[];
  occasions: string[];
  features: string[];
  badges: Array<"new" | "exclusive" | "limited">;
  featured: boolean;
  images: ProductImage[];
  relatedSlugs: string[];
};
