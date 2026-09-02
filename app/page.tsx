import { site } from "@/lib/site";

const categories = ["Bags", "Jewelry", "Watches", "Fragrance"];
const featured = [
  ["Vesper Tote", "Bags", "€2,850", "oxblood"],
  ["Halo Cuff", "Jewelry", "€950", "champagne"],
  ["Meridian No. 1", "Watches", "€4,100", "ink"],
  ["Bois Calme", "Fragrance", "€185", "stone"],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Maison de démonstration · Paris</p>
          <h1>Quiet objects,<br />made to endure.</h1>
          <p className="lede">{site.positioning} Discover a fictional collection where precise form meets tactile restraint.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#featured">Explore the collection</a>
            <a className="button button-quiet" href="#craft">Our approach</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <span className="hero-object" />
          <span className="hero-caption">Atelier study · No. 01</span>
        </div>
      </section>

      <section className="intro" id="craft">
        <p className="eyebrow">The Serein philosophy</p>
        <h2>Luxury without noise.</h2>
        <p>Material, proportion, and utility guide every imagined piece. Nothing is added without purpose.</p>
      </section>

      <section className="section" id="collections">
        <div className="section-heading"><p className="eyebrow">Collections</p><h2>Objects for daily rituals</h2></div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <a className="category-card" href="#featured" key={category}>
              <span>0{index + 1}</span><strong>{category}</strong><span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section" id="featured">
        <div className="section-heading"><p className="eyebrow">Selected pieces</p><h2>The first edit</h2></div>
        <div className="product-grid">
          {featured.map(([name, category, price, tone], index) => (
            <article className="product-card" key={name}>
              <div className={`product-art product-art-${tone}`} aria-hidden="true"><span>AS · 0{index + 1}</span></div>
              <p className="product-category">{category}</p>
              <div className="product-meta"><h3>{name}</h3><p>{price}</p></div>
            </article>
          ))}
        </div>
        <p className="preview-note">Interactive catalog, product details, bag, and checkout are being added to this preview.</p>
      </section>

      <section className="manifesto">
        <p className="eyebrow">Atelier notes · 2026</p>
        <blockquote>“Restraint is not absence.<br />It is clarity.”</blockquote>
        <p>{site.demoNotice}</p>
      </section>
    </>
  );
}
