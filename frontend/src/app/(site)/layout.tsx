import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { Providers } from "@/components/shared/providers";
import { JsonLd } from "@/components/shared/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { brand, colors, seo, siteUrl } from "@/lib/site";

import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seo.title || `${brand.fullName}`,
    template: `%s | ${brand.name} ${brand.division}`,
  },
  description: seo.description,
  keywords: seo.keywords,
  applicationName: brand.fullName,
  authors: [{ name: brand.fullName, url: siteUrl }],
  creator: brand.fullName,
  publisher: brand.fullName,
  alternates: { canonical: "/" },
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
  icons: { icon: brand.logo, apple: brand.logo },
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
    <html lang="en-KE" className={`${inter.variable} ${sora.variable}`}>
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
          <WhatsAppButton />
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
