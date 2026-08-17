import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import { Providers } from "@/components/shared/providers";
import { brand, colors } from "@/lib/site";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

// A separate root layout from app/(site)/layout.tsx — the control panel is an
// internal tool, not a marketing page: no Header/Footer/JSON-LD/assistant
// widget, and never indexed regardless of what robots.ts says.
export const metadata: Metadata = {
  title: { default: `Control Panel — ${brand.fullName}`, template: `%s — Admin` },
  robots: { index: false, follow: false },
};

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

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandTokens }} />
      </head>
      <body className="bg-surface-muted text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
