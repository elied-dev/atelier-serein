import Link from "next/link";
import { site } from "@/lib/site";

export default function HomePage() {
  return <section><p>Atelier Serein</p><h1>{site.positioning}</h1><Link href="/collection">Shop the collection</Link></section>;
}
