import type { MetadataRoute } from "next";

import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/site";

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
}
