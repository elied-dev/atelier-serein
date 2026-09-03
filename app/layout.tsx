import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { BagProvider } from "@/components/bag-provider";
import { ImprovedVersionProvider } from "@/components/improved-version-provider";
import { ProductProvider } from "@/components/product-provider";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/sonner";
import { WebMcpTools } from "@/components/webmcp-tools";
import { listProducts } from "@/lib/product-repository";
import { isImprovedVersion, site } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.positioning,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  await connection();
  const sectionId = process.env.SECTION_ID;
  if (!sectionId) throw new Error("SECTION_ID is not configured");
  const products = await listProducts();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="//cdn.dynamicyield.com" />
        <link rel="preconnect" href="//st.dynamicyield.com" />
        <link rel="preconnect" href="//rcom.dynamicyield.com" />
        <script
          defer
          type="text/javascript"
          src={`//cdn.dynamicyield.com/api/${sectionId}/api_dynamic.js`}
        />
        <script
          defer
          type="text/javascript"
          src={`//cdn.dynamicyield.com/api/${sectionId}/api_static.js`}
        />
      </head>
      <body>
        <ImprovedVersionProvider enabled={isImprovedVersion(process.env.WEBMCP_IMPROVED)}>
          <ProductProvider products={products}>
            <BagProvider>
              <WebMcpTools />
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
              <Toaster />
            </BagProvider>
          </ProductProvider>
        </ImprovedVersionProvider>
      </body>
    </html>
  );
}
