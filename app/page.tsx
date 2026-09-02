import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/commerce";
import { allProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

const categories = [
  ["Bags", "/collection/bags"],
  ["Jewelry", "/collection/jewelry"],
  ["Watches", "/collection/watches"],
  ["Fragrance", "/collection/fragrance"],
] as const;

export default function HomePage() {
  const featured = allProducts.filter((product) => product.featured).slice(0, 4);
  const craftImage = allProducts[0].images[0];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Maison de démonstration · Paris</p>
          <h1>Quiet objects,<br />made to endure.</h1>
          <p className="lede">{site.positioning} Discover a fictional collection where precise form meets tactile restraint.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/collection">Explore the collection</Link>
            <Link className="button button-quiet" href="#craft">Our approach</Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <span className="hero-object" />
          <span className="hero-caption">Atelier study · No. 01</span>
        </div>
      </section>

      <section className="intro" id="craft">
        <div className="craft-image">
          <Image
            src={craftImage.src}
            alt={craftImage.alt}
            width={craftImage.width}
            height={craftImage.height}
            sizes="(max-width: 820px) 100vw, 38vw"
          />
        </div>
        <div className="craft-copy">
          <p className="eyebrow">The Serein philosophy</p>
          <h2>Luxury without noise.</h2>
          <p>Material, proportion, and utility guide every imagined piece. Nothing is added without purpose.</p>
        </div>
      </section>

      <section className="section" id="collections">
        <div className="section-heading"><p className="eyebrow">Collections</p><h2>Objects for daily rituals</h2></div>
        <div className="category-grid">
          {categories.map(([category, href], index) => (
            <Link className="category-card" href={href} key={category}>
              <span>0{index + 1}</span><strong>{category}</strong><span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="featured">
        <div className="section-heading"><p className="eyebrow">Selected pieces</p><h2>The first edit</h2></div>
        <ProductGrid products={featured} />
        <div className="featured-link"><Link className="button button-quiet" href="/collection">View the full collection</Link></div>
      </section>

      <section className="manifesto">
        <p className="eyebrow">Atelier notes · 2026</p>
        <blockquote>“Restraint is not absence.<br />It is clarity.”</blockquote>
        <p>{site.demoNotice}</p>
      </section>
    </>
  );
}
