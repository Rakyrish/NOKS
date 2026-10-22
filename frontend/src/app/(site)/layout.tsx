import type { Metadata, Viewport } from "next";
import { Alice, Inter } from "next/font/google";

import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { FloatingContacts } from "@/components/layout/floating-contacts";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/shared/providers";
import { AnalyticsConsent } from "@/components/shared/analytics-consent";
import { JsonLd } from "@/components/shared/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { brand, colors, seo, siteUrl } from "@/lib/site";

import "../globals.css";

// Render with live data; explicit API revalidation still caches successful reads.
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const alice = Alice({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // No `template` here on purpose. It used to be `%s | NOKS Chemical Division`,
  // which double-appended the brand on the 56 CMS rows whose `meta_title`
  // already ended with it. Branding is applied exactly once, by
  // `withBrand()` in lib/metadata.ts, and every page below sets
  // `title.absolute`.
  title: {
    default: seo.title || brand.fullName,
    absolute: seo.title || brand.fullName,
  },
  description: seo.description,
  keywords: seo.keywords,
  applicationName: brand.fullName,
  authors: [{ name: brand.fullName, url: siteUrl }],
  creator: brand.fullName,
  publisher: brand.fullName,
  // NO `alternates` here, deliberately. `canonical: "/"` was inherited by every
  // route that did not set its own, which is how a "Product not found" page
  // came to declare the homepage as its canonical. Each route now supplies one
  // through `pageMetadata`/`notFoundMetadata`; a route that somehow forgets
  // emits no canonical at all, which is a far cheaper mistake than emitting the
  // wrong one. tests/metadata.test.ts holds that line.
  openGraph: {
    type: "website",
    locale: seo.locale,
    url: siteUrl,
    siteName: brand.fullName,
    title: seo.title,
    description: seo.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: brand.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    site: seo.twitterHandle || undefined,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: seo.googleVerification
    ? { google: seo.googleVerification }
    : undefined,
  // No `icons` here: src/app/favicon.ico, icon.png and apple-icon.png are
  // picked up by file convention. The wordmark logo used to be passed instead,
  // but it is 1300x409 and Google only shows a square favicon in results, so
  // the SERP fell back to a generic globe and /favicon.ico was a 404.
  category: "Chemical Supplier",
};

export const viewport: Viewport = {
  themeColor: colors.navy,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/** Brand tokens from the root .env, exposed to CSS at runtime. */
const brandTokens = `:root{
  --brand-primary:${colors.primary};
  --brand-primary-dark:${colors.primaryDark};
  --brand-navy:${colors.navy};
  --brand-navy-soft:${colors.navySoft};
  --brand-emerald:${colors.emerald};
  --brand-emerald-light:${colors.emeraldLight};
  --brand-accent:${colors.accent};
  --brand-muted:${colors.muted};
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${inter.variable} ${alice.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandTokens }} />
      </head>
      <body>
        <JsonLd id="organization" data={organizationSchema()} />
        <JsonLd id="website" data={websiteSchema()} />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                     focus:rounded-full focus:bg-[var(--brand-primary)] focus:px-5 focus:py-3
                     focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <Providers>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <FloatingContacts />
          <AssistantWidget />
          {process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" && <AnalyticsConsent />}
        </Providers>
      </body>
    </html>
  );
}
