import { describe, expect, it } from "vitest";

import {
  articleSchema,
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  productSchema,
} from "@/lib/schema";
import type { PostDetail, ProductDetail } from "@/types";

const SITE = "https://chemicals.noksindustrial.com";
const CLOUDINARY =
  "https://res.cloudinary.com/pwnff5q7/image/upload/v1/media/products/2026/08/calcium-propionate-0_hpspfl";

/** A quote-only product, which is what all 182 listings actually are. */
const product = (over: Partial<ProductDetail> = {}) =>
  ({
    id: 1,
    name: "Calcium Propionate",
    slug: "calcium-propionate",
    sku: "NOKS-CALCIUMPR-0001",
    short_description: "Food-grade mould inhibitor.",
    description: "Calcium Propionate (CAS 4075-81-4) is a food-grade preservative.",
    category_name: "Preservatives",
    category_slug: "preservatives",
    manufacturer_name: "",
    grade_display: "Food grade",
    cas_number: "4075-81-4",
    chemical_formula: "C6H10CaO4",
    purity: "≥97%",
    hs_code: "",
    currency: "KES",
    availability: "in_stock",
    price_on_request: true,
    indicative_price: null,
    image: CLOUDINARY,
    images: [{ id: 1, image: CLOUDINARY, alt_text: "Calcium Propionate", order: 0 }],
    specifications: { Appearance: "White powder" },
    ...over,
  }) as unknown as ProductDetail;

describe("Product schema publishes only what the page shows", () => {
  it("emits the Cloudinary image absolute, never re-prefixed", () => {
    const schema = productSchema(product()) as { image?: string[] };
    expect(schema.image).toEqual([CLOUDINARY]);
    expect(JSON.stringify(schema)).not.toContain(`${SITE}/https://`);
  });

  it("omits image entirely when the product has no photograph", () => {
    // A generic local placeholder in Product.image tells Google "this is a
    // photo of the product", which it is not.
    const schema = productSchema(product({ image: null, images: [] })) as { image?: string[] };
    expect(schema.image).toBeUndefined();
    expect(JSON.stringify(schema)).not.toContain("placeholder");
  });

  it("never invents an offer for a quote-only product", () => {
    const schema = productSchema(product()) as Record<string, unknown>;
    expect(schema.offers).toBeUndefined();
    // …and therefore never publishes the unbacked in_stock default as
    // schema.org/InStock.
    expect(JSON.stringify(schema)).not.toContain("schema.org/InStock");
  });

  it("emits a real offer when there is a real price", () => {
    const schema = productSchema(
      product({ price_on_request: false, indicative_price: "4500.00" as never }),
    ) as { offers?: Record<string, unknown> };
    expect(schema.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "KES",
      price: "4500.00",
      url: `${SITE}/products/calcium-propionate`,
    });
  });

  it("never asserts NOKS as the brand of goods it distributes", () => {
    const schema = productSchema(product()) as { brand?: unknown };
    expect(schema.brand).toBeUndefined();
  });

  it("uses a recorded manufacturer as the brand when there is one", () => {
    const schema = productSchema(product({ manufacturer_name: "Solvay" })) as {
      brand?: { name: string };
    };
    expect(schema.brand?.name).toBe("Solvay");
  });

  it("fabricates no reviews or ratings", () => {
    const json = JSON.stringify(productSchema(product()));
    expect(json).not.toContain("aggregateRating");
    expect(json).not.toContain("reviewCount");
    expect(json).not.toContain('"Review"');
  });

  it("mirrors CAS, formula, purity and grade as visible properties", () => {
    const schema = productSchema(product()) as {
      additionalProperty: { name: string; value: string }[];
    };
    const map = Object.fromEntries(schema.additionalProperty.map((p) => [p.name, p.value]));
    expect(map["CAS number"]).toBe("4075-81-4");
    expect(map["Chemical formula"]).toBe("C6H10CaO4");
    expect(map.Purity).toBe("≥97%");
    expect(map.Grade).toBe("Food grade");
    expect(map.Appearance).toBe("White powder");
  });

  it("self-identifies with the canonical product URL", () => {
    const schema = productSchema(product()) as { url: string; "@id": string };
    expect(schema.url).toBe(`${SITE}/products/calcium-propionate`);
    expect(schema["@id"]).toContain("/products/calcium-propionate/");
  });
});

describe("BreadcrumbList", () => {
  const crumbs = breadcrumbSchema([
    { name: "Products", url: "/products" },
    { name: "Preservatives", url: "/categories/preservatives" },
    { name: "Calcium Propionate", url: "/products/calcium-propionate" },
  ]) as { itemListElement: { position: number; item: string }[] };

  it("numbers positions sequentially from 1", () => {
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
  });

  it("uses absolute URLs", () => {
    for (const item of crumbs.itemListElement) {
      expect(item.item.startsWith(`${SITE}/`)).toBe(true);
    }
  });

  it("ends on the current page's canonical URL", () => {
    expect(crumbs.itemListElement.at(-1)?.item).toBe(`${SITE}/products/calcium-propionate`);
  });

  it("strips a query string so a blocked parameter URL cannot become a crumb", () => {
    // The live defect: every article published
    // `/knowledge?category=<slug>` as an intermediate item, pointing at a URL
    // the indexing policy marks noindex.
    const dirty = breadcrumbSchema([
      { name: "Knowledge", url: "/knowledge?category=water-treatment" },
    ]) as { itemListElement: { item: string }[] };
    expect(dirty.itemListElement[0].item).toBe(`${SITE}/knowledge`);
    expect(dirty.itemListElement[0].item).not.toContain("?");
  });
});

describe("Article schema", () => {
  const post = (over: Partial<PostDetail> = {}) =>
    ({
      id: 1,
      title: "Food Grade vs Industrial Grade Chemicals",
      slug: "food-grade-vs-industrial-grade-chemicals-what-actually-differs",
      excerpt: "What actually differs.",
      body: "one two three",
      cover_image: null,
      category_name: "Food Ingredients",
      published_at: "2026-07-17T13:29:02Z",
      updated_at: "2026-07-29T13:29:02Z",
      tag_list: [],
      author: {
        id: 1,
        name: "NOKS Technical Team",
        slug: "noks-technical-team",
        role: "Applications & Technical Services",
        bio: "",
        photo: null,
        linkedin: "",
      },
      ...over,
    }) as unknown as PostDetail;

  it("names the human author, linked to a profile page", () => {
    const schema = articleSchema(post()) as { author: Record<string, string> };
    expect(schema.author["@type"]).toBe("Person");
    expect(schema.author.name).toBe("NOKS Technical Team");
    expect(schema.author.url).toBe(`${SITE}/knowledge/authors/noks-technical-team`);
  });

  it("falls back to the organisation only when there is no author", () => {
    const schema = articleSchema(post({ author: null as never })) as {
      author: Record<string, string>;
    };
    expect(schema.author["@type"]).toBe("Organization");
  });

  it("omits image rather than emitting a malformed one", () => {
    const schema = articleSchema(post()) as { image?: string[] };
    expect(schema.image).toBeUndefined();
  });

  it("never re-prefixes an absolute cover image", () => {
    const schema = articleSchema(post({ cover_image: CLOUDINARY })) as { image?: string[] };
    expect(schema.image).toEqual([CLOUDINARY]);
  });
});

describe("Organization and LocalBusiness", () => {
  it("publishes a parseable E.164 phone number or none at all", () => {
    for (const schema of [organizationSchema(), localBusinessSchema()] as Record<
      string,
      unknown
    >[]) {
      const phone = schema.telephone as string | undefined;
      if (phone !== undefined) expect(phone).toMatch(/^\+\d{8,15}$/);
    }
  });

  it("omits sameAs until the profiles are confirmed as ours", () => {
    // x.com/noks returned 404 when probed and the rest are generic handles.
    expect((organizationSchema() as Record<string, unknown>).sameAs).toBeUndefined();
    expect((localBusinessSchema() as Record<string, unknown>).sameAs).toBeUndefined();
  });

  it("invents no price band", () => {
    expect((localBusinessSchema() as Record<string, unknown>).priceRange).toBeUndefined();
  });
});


describe("quotation-price integrity", () => {
  it("never emits a zero or invalid placeholder offer", () => {
    for (const price of ["0", "0.00", "-1", "NaN"]) {
      const schema = productSchema(product({ price_on_request: false, indicative_price: price })) as { offers?: unknown };
      expect(schema.offers).toBeUndefined();
    }
  });
});
