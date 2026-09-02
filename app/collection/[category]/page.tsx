import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/commerce";
import { allProducts, filterProducts } from "@/lib/catalog";
import type { ProductCategory } from "@/lib/products";
import { site } from "@/lib/site";

const categories = ["bags", "jewelry", "watches", "fragrance"] as const;

const stories: Record<ProductCategory, { eyebrow: string; title: string; copy: string }> = {
  bags: {
    eyebrow: "Carried forms",
    title: "Bags",
    copy: "Imagined in composed volumes, these pieces balance full-grain leather, measured hardware, and interiors made for daily order.",
  },
  jewelry: {
    eyebrow: "Quiet gestures",
    title: "Jewelry",
    copy: "Sculptural lines and softly reflective finishes frame a fictional study in adornment without excess.",
  },
  watches: {
    eyebrow: "Measured time",
    title: "Watches",
    copy: "Restrained dials, balanced cases, and tactile bracelets define an imagined approach to timekeeping.",
  },
  fragrance: {
    eyebrow: "Scented studies",
    title: "Fragrance",
    copy: "These fictional compositions move through mineral, floral, and wooded notes with a deliberately quiet presence.",
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const category = (await params).category;
  return categories.includes(category as ProductCategory)
    ? { title: stories[category as ProductCategory].title, description: stories[category as ProductCategory].copy }
    : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const category = (await params).category;
  if (!categories.includes(category as ProductCategory)) notFound();

  const selectedCategory = category as ProductCategory;
  const story = stories[selectedCategory];
  const products = filterProducts({ category: selectedCategory }, allProducts);

  return (
    <section className="category-page">
      <header className="category-story">
        <p className="eyebrow">{story.eyebrow}</p>
        <h1>{story.title}</h1>
        <p>{story.copy}</p>
        <Link className="button button-quiet" href="/collection">View the full collection</Link>
      </header>
      <ProductGrid products={products} />
      <p className="page-demo-notice">{site.demoNotice}</p>
    </section>
  );
}
