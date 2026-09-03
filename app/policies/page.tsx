import type { Metadata } from "next";
import { site, storePolicies } from "@/lib/site";

export const metadata: Metadata = {
  title: "Policies and FAQs",
  description: "Policies for the fictional Vibemart demonstration storefront.",
};

export default function PoliciesPage() {
  return (
    <section className="information-page">
      <p className="eyebrow">Store information</p>
      <h1>Policies and FAQs</h1>
      <div className="information-list">
        {storePolicies.map(({ title, content }) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{content}</p>
          </section>
        ))}
      </div>
      <p className="page-demo-notice">{site.demoNotice}</p>
    </section>
  );
}
