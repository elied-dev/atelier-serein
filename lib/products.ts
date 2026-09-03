export type ProductCategory =
  | "bags" | "jewelry" | "watches" | "fragrance"
  | "travel" | "electronics" | "home" | "clothing"
  | "outdoor" | "beauty" | "kids" | "office";
export type Currency = "EUR" | "USD";
export type DimensionUnit = "cm" | "in";
export type ProductBadge =
  | "new" | "exclusive" | "limited"
  | "best-seller" | "best-value" | "business-travel-pick"
  | "category-pick" | "extra-capacity" | "family-favorite"
  | "premium-choice" | "premium-pick" | "vibemart-exclusive";
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
  price: { amountMinor: number; currency: Currency };
  variants: ProductVariant[];
  materials: string[];
  craftsmanship: string[];
  dimensions: { width?: number; height?: number; depth?: number; unit: DimensionUnit };
  weightGrams?: number;
  origin: string;
  care: string[];
  styleTags: string[];
  occasions: string[];
  features: string[];
  badges: ProductBadge[];
  featured: boolean;
  images: ProductImage[];
  relatedSlugs: string[];
};
