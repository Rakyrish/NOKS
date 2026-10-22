import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/post-card";
import { CtaBand } from "@/components/home/cta-band";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { PageHero } from "@/components/shared/page-hero";
import { ApiError, api } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { parsePage } from "@/lib/pagination";
import { brand } from "@/lib/site";
import { cn } from "@/lib/utils";

export const revalidate = 600;

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = parsePage(params.page) ?? 1;
  // Unfiltered pagination is self-canonical; category filters remain noindex.
  return pageMetadata({
    title: page > 1 ? `Chemical Guides — Page ${page}` : "Chemical Guides & Technical Articles — Knowledge Centre",
    description: `Technical guidance from ${brand.fullName}: water treatment practice, food grade compliance, laboratory science, chemical safety and buying guides for East African industry.`,
    path: "/knowledge",
    searchParams: params,
    image: "/images/pages/knowledge.jpg",
  });
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = parsePage(params.page);
  if (page === null) notFound();

  const [posts, categories] = await Promise.all([
    api.posts({ page, category__slug: category, tag, search }),
    api.blogCategories(),
  ]).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  const featured = page === 1 && !category && !tag && !search ? posts.results[0] : undefined;
  const rest = featured ? posts.results.slice(1) : posts.results;

  return (
    <>
      <PageHero
        eyebrow="Knowledge centre"
        title="Chemical expertise, written for practitioners"
        description="Practical guides on chemical selection, documentation,
                     safe handling and purchasing."
        crumbs={[{ name: "Knowledge", url: "/knowledge" }]}
        image="/images/pages/knowledge.jpg"
      />

      <div className="bg-surface-muted py-12 sm:py-16">
        <div className="container-noks">
          {/* Category filter */}
          {categories.length > 0 && (
            <nav aria-label="Article categories" className="flex flex-wrap gap-2">
              <Link
                href="/knowledge"
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                  !category && !tag && !search
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                    : "border-line bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50",
                )}
              >
                All articles
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.id}
                  href={`/knowledge?category=${item.slug}`}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                    category === item.slug
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                      : "border-line bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50",
                  )}
                >
                  {item.name}
                  {item.post_count !== undefined && (
                    <span className="ml-1.5 opacity-60">{item.post_count}</span>
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Featured */}
          {featured && (
            <article className="mt-10 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="grid lg:grid-cols-2">
                <div
                  className="flex min-h-56 items-center justify-center bg-gradient-to-br
                             from-navy-900 via-brand-800 to-[var(--brand-primary)] p-10"
                >
                  <p className="text-center font-display text-xl font-bold text-white/85">
                    {featured.category_name}
                  </p>
                </div>
                <div className="p-8 sm:p-10">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[11.5px] font-bold tracking-wide text-brand-700 uppercase">
                    Featured
                  </span>
                  <h2 className="mt-4 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] leading-tight font-bold text-navy-900">
                    <Link
                      href={`/knowledge/${featured.slug}`}
                      className="transition-colors hover:text-[var(--brand-primary)]"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    {featured.excerpt}
                  </p>
                  <p className="mt-5 text-[12.5px] text-slate-400">
                    {featured.author_name} · {featured.reading_minutes} min read
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* Grid */}
          {rest.length > 0 ? (
            <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <RevealItem key={post.id} className="h-full">
                  <PostCard post={post} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            !featured && (
              <p className="mt-16 text-center text-slate-500">
                No articles match this selection.
              </p>
            )
          )}

          {/* Pagination */}
          {posts.num_pages > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: posts.num_pages }, (_, index) => index + 1).map((number) => (
                <Link
                  key={number}
                  href={{
                    pathname: "/knowledge",
                    query: { ...(category ? { category } : {}), ...(tag ? { tag } : {}), ...(search ? { search } : {}), ...(number > 1 ? { page: number } : {}) },
                  }}
                  aria-current={number === posts.page ? "page" : undefined}
                  className={cn(
                    "grid size-10 place-items-center rounded-full text-[13px] font-semibold transition-colors",
                    number === posts.page
                      ? "bg-[var(--brand-primary)] text-white"
                      : "border border-line bg-white text-navy-900 hover:border-brand-300 hover:bg-brand-50",
                  )}
                >
                  {number}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      <CtaBand
        title="Need advice on a specific application?"
        description="Tell us the product, grade and intended application so we can discuss specifications, packaging and documentation availability."
      />
    </>
  );
}
