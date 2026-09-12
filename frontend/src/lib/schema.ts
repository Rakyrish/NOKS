/**
 * Schema.org / JSON-LD builders.
 * Every value traces back to the root .env or the CMS — nothing invented here.
 */

import { absoluteImageUrl, schemaImages } from "./images";
import { absoluteUrl, brand, contact, seo, siteUrl, social } from "./site";
import type { FAQ, Industry, PostDetail, ProductDetail } from "@/types";

const socialProfiles = () =>
  [social.linkedin, social.facebook, social.twitter, social.instagram].filter(Boolean);

/**
 * Countries and Kenyan counties NOKS delivers to.
 *
 * Spelled out rather than left as "East Africa" so the service area is
 * machine-readable — search engines match local intent ("chemical supplier
 * Eldoret") against this, and a regional abstraction gives them nothing.
 */
const SERVED_COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Ethiopia",
  "Rwanda", "Burundi", "South Sudan", "DR Congo",
];

const SERVED_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu",
  "Machakos", "Kajiado", "Nyeri", "Meru", "Kericho", "Kakamega", "Bungoma",
  "Trans Nzoia", "Kilifi", "Murang'a", "Embu", "Laikipia", "Kirinyaga",
  "Narok", "Nyandarua", "Busia",
];

export const areaServed = () => [
  ...SERVED_COUNTRIES.map((name) => ({ "@type": "Country", name })),
  ...SERVED_COUNTIES.map((name) => ({
    "@type": "AdministrativeArea",
    name: `${name} County`,
    containedInPlace: { "@type": "Country", name: "Kenya" },
  })),
];

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: brand.fullName,
  legalName: brand.fullName,
  url: siteUrl,
  logo: { "@type": "ImageObject", url: absoluteImageUrl(brand.logo) ?? undefined },
  image: absoluteImageUrl(brand.logo) ?? undefined,
  description: brand.mission || seo.description,
  slogan: brand.tagline,
  email: contact.email || undefined,
  telephone: contact.phone || undefined,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.street || undefined,
    addressLocality: contact.city || undefined,
    postalCode: contact.postal || undefined,
    addressCountry: contact.country || undefined,
  },
  ...(contact.lat && contact.lng
    ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: contact.lat,
          longitude: contact.lng,
        },
      }
    : {}),
  areaServed: areaServed(),
  sameAs: socialProfiles(),
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: contact.phone,
      contactType: "sales",
      email: contact.email,
      areaServed: ["KE", "UG", "TZ", "ET", "RW", "BI", "SS", "CD"],
      availableLanguage: ["en", "sw"],
    },
    {
      "@type": "ContactPoint",
      telephone: contact.phoneAlt || contact.phone,
      contactType: "technical support",
      email: contact.emailSupport || contact.email,
    },
  ],
});

export const localBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#localbusiness`,
  name: brand.fullName,
  image: absoluteImageUrl(brand.logo) ?? undefined,
  url: siteUrl,
  telephone: contact.phone,
  email: contact.email,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.street,
    addressLocality: contact.city,
    postalCode: contact.postal,
    addressCountry: contact.country,
  },
  areaServed: areaServed(),
  ...(contact.hours ? { openingHours: contact.hours } : {}),
  ...(contact.lat && contact.lng
    ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: contact.lat,
          longitude: contact.lng,
        },
      }
    : {}),
  sameAs: socialProfiles(),
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: brand.fullName,
  description: seo.description,
  publisher: { "@id": `${siteUrl}/#organization` },
  inLanguage: "en-KE",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/products?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.url),
  })),
});

export const productSchema = (product: ProductDetail) => {
  /**
   * Mirrors, field for field, the "Technical specifications" table rendered on
   * the product page (see app/(site)/products/[slug]/page.tsx). Structured data
   * that asserts a property the visitor cannot see is a Google guideline
   * violation, so the two lists are built from the same source fields and must
   * be changed together.
   */
  const property = (name: string, value: string | null | undefined) =>
    value ? [{ "@type": "PropertyValue", name, value: String(value) }] : [];

  const additionalProperty = [
    ...Object.entries(product.specifications ?? {}).map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value: String(value),
    })),
    ...property("Purity", product.purity),
    ...property("CAS number", product.cas_number),
    ...property("Chemical formula", product.chemical_formula),
    ...property("Grade", product.grade_display),
    ...property("HS code", product.hs_code),
    ...property("Manufacturer", product.manufacturer_name),
  ];

  // A real, transactable price is required for Offer eligibility in Google's
  // rich results — advertising "0" for price-on-request products is
  // inaccurate structured data (a guideline violation, not just unhelpful),
  // so those products omit `offers` entirely rather than fabricate a price.
  const hasRealPrice = !product.price_on_request && !!product.indicative_price;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}/products/${product.slug}/#product`,
    name: product.name,
    sku: product.sku,
    // The long description is the substantive one; short_description is a
    // one-liner written for cards.
    description: product.description || product.short_description,
    category: product.category_name,
    url: absoluteUrl(`/products/${product.slug}`),
    // Every gallery image, absolute and validated. `schemaImages` returns
    // undefined when nothing is publishable, so a product with no photograph
    // omits `image` rather than passing off the local placeholder as one.
    ...(() => {
      const image = schemaImages(
        product.image,
        ...(product.images ?? []).map((entry) => entry.image),
      );
      return image ? { image } : {};
    })(),
    // Brand is asserted ONLY from a recorded manufacturer, which the page also
    // shows in the specification table. NOKS distributes third-party chemicals;
    // naming ourselves as `brand` on goods we did not manufacture was an
    // unverifiable claim, and Google treats Product.brand as the maker. A
    // product with no manufacturer on file omits the property.
    ...(product.manufacturer_name
      ? { brand: { "@type": "Brand", name: product.manufacturer_name } }
      : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
    ...(hasRealPrice
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(`/products/${product.slug}`),
            priceCurrency: product.currency,
            price: product.indicative_price,
            availability:
              product.availability === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : product.availability === "made_to_order"
                  ? "https://schema.org/PreOrder"
                  : "https://schema.org/InStock",
            seller: { "@id": `${siteUrl}/#organization` },
            areaServed: areaServed(),
          },
        }
      : {}),
  };
};

export const faqSchema = (faqs: Pick<FAQ, "question" | "answer">[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
});

export const articleSchema = (post: PostDetail) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${siteUrl}/knowledge/${post.slug}/#article`,
  headline: post.title,
  description: post.excerpt,
  url: absoluteUrl(`/knowledge/${post.slug}`),
  ...(() => {
    const image = schemaImages(post.cover_image);
    return image ? { image } : {};
  })(),
  datePublished: post.published_at,
  dateModified: post.updated_at || post.published_at,
  articleSection: post.category_name,
  keywords: post.tag_list?.join(", "),
  wordCount: post.body ? post.body.split(/\s+/).length : undefined,
  author: {
    "@type": "Organization",
    name: post.author?.name || brand.fullName,
    url: siteUrl,
  },
  publisher: { "@id": `${siteUrl}/#organization` },
  mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/knowledge/${post.slug}`) },
  inLanguage: "en-KE",
});

export const serviceSchema = (industry: Industry) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: `Chemical supply for ${industry.name}`,
  description: industry.description || industry.tagline,
  provider: { "@id": `${siteUrl}/#organization` },
  areaServed: areaServed(),
  url: absoluteUrl(`/industries/${industry.slug}`),
  ...(industry.applications?.length
    ? {
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${industry.name} applications`,
          itemListElement: industry.applications.map((application) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: application },
          })),
        },
      }
    : {}),
});

export const itemListSchema = (
  items: { name: string; url: string }[],
  listName: string,
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: listName,
  numberOfItems: items.length,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: absoluteUrl(item.url),
  })),
});
