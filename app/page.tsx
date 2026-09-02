import Link from "next/link";
import { site } from "@/lib/site";

export default function HomePage() {
  return <section><p>{site.name}</p><h1>{site.positioning}</h1><Link href="/collection" className="inline-flex min-h-11 items-center">Shop the collection</Link></section>;
}
