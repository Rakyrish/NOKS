import { describe, expect, it } from "vitest";

import {
  noindexMetadata,
  normalizeDescription,
  notFoundMetadata,
  pageMetadata,
  categoryTitle,
  industryTitle,
  productTitle,
  withBrand,
} from "@/lib/metadata";

const SITE = "https://chemicals.noksindustrial.com";
const BRAND = "NOKS Chemical Division";

describe("the brand appears exactly once in a title", () => {
  it("appends the full brand when it fits", () => {
    expect(withBrand("Acids Suppliers in Kenya")).toBe(`Acids Suppliers in Kenya | ${BRAND}`);
  });

  it("falls back to the short brand when the full one would overflow the SERP", () => {
    // "| NOKS Chemical Division" is 25 characters; on a long title it pushed
    // the page's own words past Google's cut-off.
    expect(withBrand("Calcium Propionate Food Grade CAS 4075-81-4")).toBe(
      "Calcium Propionate Food Grade CAS 4075-81-4 | NOKS",
    );
  });

  it("does not double-append when the CMS title already carries it", () => {
    // The live defect: 56 CMS rows ended their meta_title with the brand, and
    // the root layout's `%s | NOKS Chemical Division` template appended it
    // again, serving
    // "Disinfectants Suppliers Kenya | NOKS Chemical Division | NOKS Chemical Division".
    const title = withBrand(`Disinfectants Suppliers Kenya | ${BRAND}`);
    expect(title).toBe(`Disinfectants Suppliers Kenya | ${BRAND}`);
    expect(title.match(new RegExp(BRAND, "g"))?.length).toBe(1);
  });

  it("treats the short brand as already branded", () => {
    // "Food Grade Chemicals Supplier in Kenya | NOKS" was served as
    // "... | NOKS | NOKS Chemical Division".
    expect(withBrand("Food Grade Chemicals Supplier in Kenya | NOKS")).toBe(
      "Food Grade Chemicals Supplier in Kenya | NOKS",
    );
  });

  it("never produces a repeated suffix, whatever the input", () => {
    for (const input of [
      "Water Treatment Chemicals in Kenya | NOKS Chemical Division",
      "Safe Storage and Handling of Industrial Acids",
      "Soda Ash Dense | NOKS",
      "Methyl Ethyl Ketone — Supplier in Kenya",
    ]) {
      expect(withBrand(input)).not.toContain(`${BRAND} | ${BRAND}`);
    }
  });

  it("falls back to the brand alone for an empty title", () => {
    expect(withBrand("   ")).toBe(BRAND);
    expect(withBrand(" | ")).toBe(BRAND);
  });
});

describe("every page gets a self-referencing canonical", () => {
  it("uses the requested path, not the homepage", () => {
    const meta = pageMetadata({ title: "Caustic Soda Flakes", path: "/products/caustic-soda-flakes" });
    expect(meta.alternates?.canonical).toBe("/products/caustic-soda-flakes");
  });

  it("drops a query string from the canonical", () => {
    const meta = pageMetadata({
      title: "Catalog",
      path: "/products",
      searchParams: { category: "acids" },
    });
    expect(meta.alternates?.canonical).toBe("/products");
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });

  it("honours a same-origin CMS canonical override", () => {
    const meta = pageMetadata({
      title: "Phosphoric Acid 85%",
      path: "/products/phosphoric-acid-85",
      canonicalOverride: `${SITE}/products/phosphoric-acid`,
    });
    expect(meta.alternates?.canonical).toBe("/products/phosphoric-acid");
  });

  it("ignores a cross-origin canonical override", () => {
    // A stale or mistyped canonical_url must never hand ranking signals to
    // another site.
    const meta = pageMetadata({
      title: "Acetone",
      path: "/products/acetone",
      canonicalOverride: "https://someone-elses-site.example/acetone",
    });
    expect(meta.alternates?.canonical).toBe("/products/acetone");
  });

  it("ignores an unparseable canonical override", () => {
    const meta = pageMetadata({
      title: "Acetone",
      path: "/products/acetone",
      canonicalOverride: "not a url",
    });
    expect(meta.alternates?.canonical).toBe("/products/acetone");
  });
});

describe("a missing page is noindex and canonicalises nowhere", () => {
  const meta = notFoundMetadata("/products/xanthan-gum-food-grade", "Product");

  it("is noindex, follow", () => {
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });

  it("does not canonicalise to the homepage", () => {
    // This is the exact live defect: a soft-404 inheriting the root layout's
    // `alternates: { canonical: "/" }`.
    expect(meta.alternates?.canonical).toBeNull();
  });

  it("still carries the brand exactly once", () => {
    const title = (meta.title as { absolute: string }).absolute;
    expect(title.match(new RegExp(BRAND, "g"))?.length).toBe(1);
  });

  it("publishes no social card for a page that does not exist", () => {
    expect(meta.openGraph).toBeNull();
    expect(meta.twitter).toBeNull();
  });
});

describe("Open Graph and Twitter are filled from the same values", () => {
  const meta = pageMetadata({
    title: "Calcium Propionate",
    description: "Food-grade preservative, CAS 4075-81-4.",
    path: "/products/calcium-propionate",
    image:
      "https://res.cloudinary.com/pwnff5q7/image/upload/v1/media/products/2026/08/calcium-propionate-0_hpspfl",
  });

  it("uses the canonical URL as the OG url", () => {
    expect(meta.openGraph?.url).toBe(`${SITE}/products/calcium-propionate`);
  });

  it("passes the Cloudinary image through without re-prefixing the origin", () => {
    const og = (meta.openGraph?.images as { url: string }[])[0].url;
    expect(og).not.toContain(`${SITE}/https://`);
    expect(og).toContain("res.cloudinary.com");
    expect((meta.twitter as { images: string[] }).images[0]).toBe(og);
  });

  it("falls back to the generated card when a page has no image", () => {
    const bare = pageMetadata({ title: "Contact", path: "/contact" });
    const og = (bare.openGraph?.images as { url: string }[])[0].url;
    expect(og).toBe(`${SITE}/opengraph-image`);
  });

  it("shares one title and description across head, OG and Twitter", () => {
    expect(meta.openGraph?.title).toBe((meta.title as { absolute: string }).absolute);
    expect(meta.twitter?.title).toBe((meta.title as { absolute: string }).absolute);
    expect(meta.openGraph?.description).toBe(meta.description);
  });
});

describe("descriptions are usable in a SERP snippet", () => {
  it("collapses whitespace", () => {
    expect(normalizeDescription("  a\n\n  b  ")).toBe("a b");
  });

  it("returns undefined for an empty value so a fallback can apply", () => {
    expect(normalizeDescription("   ")).toBeUndefined();
    expect(normalizeDescription(null)).toBeUndefined();
  });

  it("truncates on a word boundary", () => {
    const long = "Sodium ".repeat(60);
    const out = normalizeDescription(long)!;
    expect(out.length).toBeLessThanOrEqual(166);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe("noindexMetadata", () => {
  it("is pageMetadata with the directive forced on", () => {
    const meta = noindexMetadata({ title: "Compare", path: "/compare" });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("/compare");
  });
});

describe("titles match what Kenyan buyers search", () => {
  it("replaces a spec-line CMS title with product + market + price intent", () => {
    // Live CMS value with no location, served as the whole <title>.
    expect(productTitle("Caustic Soda Flakes", "Caustic Soda Flakes NaOH 1310-73-2 Industrial Grade")).toBe(
      "Caustic Soda Flakes Supplier in Kenya — Get Price",
    );
  });

  it("keeps a CMS title an editor already aimed at a market", () => {
    expect(productTitle("Sodium Hypochlorite", "Sodium Hypochlorite 12% Supplier in Nairobi")).toBe(
      "Sodium Hypochlorite 12% Supplier in Nairobi",
    );
  });

  it("does not honour a bare place name without 'in' as market-aimed", () => {
    // The seeded template "Acids Suppliers Kenya" is not how anyone searches.
    expect(categoryTitle("Acids", "Acids Suppliers Kenya | NOKS Chemical Division")).toBe(
      "Acids Suppliers in Kenya",
    );
  });

  it("sheds the price phrase, then 'Supplier', as product names get longer", () => {
    expect(productTitle("Acetone", null, "")).toBe("Acetone Supplier in Kenya — Get Price");
    expect(productTitle("Sodium Hydrosulfite, Technical Grade, 85%")).toBe(
      "Sodium Hydrosulfite, Technical Grade, 85% in Kenya",
    );
  });

  it("keeps industry and category titles from competing for one query", () => {
    expect(categoryTitle("Water Treatment Chemicals")).toBe("Water Treatment Chemicals Suppliers in Kenya");
    expect(industryTitle("Water Treatment")).toBe("Chemicals for Water Treatment in Kenya");
  });

  it("stays within the display limit once branded, for typical names", () => {
    for (const title of [
      productTitle("Caustic Soda Flakes"),
      productTitle("Calcium Hypochlorite 70%"),
      categoryTitle("Pharmaceutical & Cosmetic Chemicals"),
      industryTitle("Food Processing"),
    ]) {
      expect(withBrand(title).length).toBeLessThanOrEqual(60);
    }
  });
});

describe("authored market titles are re-branded to fit", () => {
  it("drops an editor-typed long brand so the short one can be used", () => {
    const title = withBrand(
      productTitle("Soda Ash Dense", `Soda Ash Dense (Sodium Carbonate) Supplier in Kenya | ${BRAND}`),
    );
    expect(title).toBe("Soda Ash Dense (Sodium Carbonate) Supplier in Kenya | NOKS");
  });
});
