import { describe, expect, it } from "vitest";

import {
  IMAGE_PLACEHOLDER,
  absoluteImageUrl,
  imageSrc,
  imageSrcOrPlaceholder,
  isPublishableImage,
  schemaImages,
} from "@/lib/images";

const SITE = "https://chemicals.noksindustrial.com";
const CLOUDINARY =
  "https://res.cloudinary.com/pwnff5q7/image/upload/v1/media/products/2026/08/calcium-propionate-0_hpspfl";

describe("absolute URLs are preserved, never re-prefixed", () => {
  it("returns a Cloudinary URL untouched", () => {
    expect(absoluteImageUrl(CLOUDINARY)).toBe(CLOUDINARY);
    expect(imageSrc(CLOUDINARY)).toBe(CLOUDINARY);
  });

  it("never produces the /https:// defect", () => {
    // The exact regression: absoluteUrl(product.image) used to emit
    // https://chemicals.noksindustrial.com/https://res.cloudinary.com/...
    for (const helper of [absoluteImageUrl, imageSrc]) {
      const out = helper(CLOUDINARY) ?? "";
      expect(out).not.toContain(`${SITE}/https://`);
      expect(out.match(/https:\/\//g)?.length).toBe(1);
    }
  });

  it("collapses a same-origin absolute URL back to a path for next/image", () => {
    expect(imageSrc(`${SITE}/media/products/x.jpg`)).toBe("/media/products/x.jpg");
    // …but structured data still gets the fully-qualified form.
    expect(absoluteImageUrl(`${SITE}/media/products/x.jpg`)).toBe(
      `${SITE}/media/products/x.jpg`,
    );
  });

  it("reads a protocol-relative URL as https", () => {
    expect(absoluteImageUrl("//res.cloudinary.com/demo/a.jpg")).toBe(
      "https://res.cloudinary.com/demo/a.jpg",
    );
  });
});

describe("local paths resolve against the site origin", () => {
  it("resolves a rooted path", () => {
    expect(absoluteImageUrl("/images/hero/agriculture.jpg")).toBe(
      `${SITE}/images/hero/agriculture.jpg`,
    );
    expect(imageSrc("/images/hero/agriculture.jpg")).toBe("/images/hero/agriculture.jpg");
  });

  it("adds the missing leading slash", () => {
    expect(imageSrc("media/products/x.jpg")).toBe("/media/products/x.jpg");
    expect(absoluteImageUrl("media/products/x.jpg")).toBe(`${SITE}/media/products/x.jpg`);
  });
});

describe("unsafe and malformed values are rejected", () => {
  const rejected = [
    null,
    undefined,
    "",
    "   ",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "mailto:info@noksindustrial.com",
    "file:///etc/passwd",
    "http://",
    "https://",
    // Host not in NEXT_PUBLIC_IMAGE_DOMAINS — next/image would throw on it.
    "https://evil.example.com/tracker.png",
    "https://images.unsplash.com/photo-123",
  ];

  it.each(rejected)("rejects %j", (value) => {
    expect(imageSrc(value as string)).toBeNull();
    expect(absoluteImageUrl(value as string)).toBeNull();
    expect(isPublishableImage(value as string)).toBe(false);
  });

  it("falls back to the local illustration for display", () => {
    expect(imageSrcOrPlaceholder(null)).toBe(IMAGE_PLACEHOLDER);
    expect(imageSrcOrPlaceholder("javascript:alert(1)")).toBe(IMAGE_PLACEHOLDER);
    expect(imageSrcOrPlaceholder(CLOUDINARY)).toBe(CLOUDINARY);
  });
});

describe("encoding for next/image", () => {
  it("percent-encodes characters that next/image rejects raw", () => {
    expect(imageSrc("/media/products/soda ash dense.jpg")).toBe(
      "/media/products/soda%20ash%20dense.jpg",
    );
    expect(absoluteImageUrl("https://res.cloudinary.com/demo/a b.jpg")).toBe(
      "https://res.cloudinary.com/demo/a%20b.jpg",
    );
  });

  it("leaves an already-encoded URL alone rather than double-encoding", () => {
    const encoded = "https://res.cloudinary.com/demo/a%20b.jpg";
    expect(absoluteImageUrl(encoded)).toBe(encoded);
  });

  it("keeps Cloudinary transformation query strings intact", () => {
    const withQuery = `${CLOUDINARY}?_a=BAMAH+Zu0`;
    expect(absoluteImageUrl(withQuery)).toContain("?_a=");
  });
});

describe("schemaImages", () => {
  it("omits the key entirely when nothing is publishable", () => {
    // A product with no photograph must not claim the placeholder is one.
    expect(schemaImages(null, undefined, "")).toBeUndefined();
    expect(schemaImages(IMAGE_PLACEHOLDER)).toEqual([`${SITE}${IMAGE_PLACEHOLDER}`]);
  });

  it("deduplicates and drops unusable entries, preserving order", () => {
    expect(
      schemaImages(CLOUDINARY, "javascript:alert(1)", CLOUDINARY, "/images/pages/products.jpg"),
    ).toEqual([CLOUDINARY, `${SITE}/images/pages/products.jpg`]);
  });

  it("returns only absolute URLs", () => {
    for (const url of schemaImages(CLOUDINARY, "/images/pages/products.jpg") ?? []) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toContain(`${SITE}/https:`);
    }
  });
});
