import type { MetadataRoute } from "next";

import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/site";

// Generated per request, never prerendered. Two reasons:
//  1. Correctness — a sitemap baked at build time freezes the catalog as it was
//     the moment the image was built, so every product and article added
//     afterwards stays invisible to crawlers until the next deploy.
//  2. Buildability — unlike the page loaders, the calls below are not wrapped in
//     the api `safe()` fallback, so during `next build` (where the backend
//     container does not exist yet) they hang until Next's 60s static-generation
//     timeout and fail the build outright.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Dynamic XML sitemap covering every indexable URL. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/industries"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/knowledge"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/quote"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];

  // A crawler hitting /sitemap.xml while the backend is briefly unreachable
  // should still get the static routes, not a 500 — same "degrade, don't fail"
  // principle the rest of the app applies through api.ts's `safe()`. This route
  // can't reuse `safe()` directly (it needs to distinguish a truly empty catalog
  // from a fetch failure while paging), so the same try/catch shape is inlined.
  try {
    // Pull the full catalog; the API caps page_size, so walk the pages.
    const products: MetadataRoute.Sitemap = [];
    for (let page = 1; page <= 20; page += 1) {
      const response = await api.products({ page, page_size: 96 });
      products.push(
        ...response.results.map((product) => ({
          url: absoluteUrl(`/products/${product.slug}`),
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
      );
      if (!response.has_next) break;
    }

    const [industries, posts, blogCategories] = await Promise.all([
      api.industries(),
      api.posts({ page: 1 }),
      api.blogCategories(),
    ]);

    return [
      ...staticRoutes,
      ...products,
      ...industries.map((industry) => ({
        url: absoluteUrl(`/industries/${industry.slug}`),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })),
      ...posts.results.map((post) => ({
        url: absoluteUrl(`/knowledge/${post.slug}`),
        lastModified: post.published_at ? new Date(post.published_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...blogCategories.map((category) => ({
        url: absoluteUrl(`/knowledge?category=${category.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sitemap] backend unreachable, serving static routes only:", (error as Error).message);
    }
    return staticRoutes;
  }
}
