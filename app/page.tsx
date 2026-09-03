import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/commerce";
import { DynamicYieldContextScript } from "@/components/dynamic-yield-context";
import { listProducts } from "@/lib/product-repository";
import { site } from "@/lib/site";

const departments = [
  ["Travel", "Pack up and go"],
  ["Electronics", "Smart picks for every day"],
  ["Home", "Make your space yours"],
  ["Clothing", "Looks for every mood"],
  ["Outdoor", "Good days start outside"],
  ["Beauty", "Your routine, your way"],
  ["Kids", "Big fun for little vibes"],
  ["Office", "Make work work for you"],
] as const;

export default async function HomePage() {
  const products = await listProducts();
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const heroImage = products[0].images[0];

  return (
    <>
      <DynamicYieldContextScript type="HOMEPAGE" />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Welcome to Vibemart</p>
          <h1>Something for Every Vibe</h1>
          <p className="lede">From everyday essentials to the things that make your day, find a little bit of everything—and picks that feel made for you.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/collection">Shop all</Link>
            <Link className="button button-quiet" href="#departments">Browse departments</Link>
          </div>
        </div>
        <div className="hero-art">
          <Image
            className="hero-image"
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="(max-width: 820px) 100vw, 48vw"
          />
          <span className="hero-caption">Find your thing</span>
          <span className="hero-sticker" aria-hidden="true">good finds<br />this way ↓</span>
        </div>
      </section>

      <section className="section departments" id="departments">
        <div className="section-heading">
          <div><p className="eyebrow">Shop your way</p><h2>A little bit of everything</h2></div>
          <p>Eight departments. Endless ways to make it yours.</p>
        </div>
        <div className="category-grid">
          {departments.map(([department, description], index) => (
            <Link className="category-card" href="/collection" key={department} aria-label={`Browse ${department}`}>
              <span>0{index + 1}</span>
              <strong>{department}</strong>
              <small>{description}</small>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="personalized" id="personalized">
        <div>
          <p className="eyebrow">Made personal</p>
          <h2>One store.<br />Your kind of picks.</h2>
        </div>
        <div className="personalized-copy">
          <p>Vibemart serves everyone. Our shopping agent uses personalized merchant intelligence to understand what matters to you—then recommends a different mix for every shopper.</p>
          <div className="vibe-tags" aria-label="Example shopper vibes">
            <span>Weekend explorer</span>
            <span>Tech enthusiast</span>
            <span>Busy parent</span>
            <span>Homebody</span>
          </div>
        </div>
      </section>

      <section className="section" id="featured">
        <div className="section-heading">
          <div><p className="eyebrow">Trending now</p><h2>Good finds, right this way</h2></div>
        </div>
        <ProductGrid products={featured} />
        <div className="featured-link"><Link className="button button-quiet" href="/collection">See everything</Link></div>
      </section>

      <section className="manifesto">
        <p className="eyebrow">Vibemart · Est. for everyone</p>
        <blockquote>“Your store should<br />feel like your store.”</blockquote>
        <p>{site.demoNotice}</p>
      </section>
    </>
  );
}
