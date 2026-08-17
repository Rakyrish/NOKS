import { Clock, User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/post-card";
import { ProductCard } from "@/components/catalog/product-card";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { formatDate, mediaUrl } from "@/lib/utils";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  try {
    return await api.post(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Article not found" };

  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt;

  return {
    title,
    description,
    keywords: post.tag_list,
    alternates: { canonical: post.seo?.canonical || `/knowledge/${post.slug}` },
    robots: post.seo?.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(`/knowledge/${post.slug}`),
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.cover_image ? [{ url: post.cover_image, alt: post.cover_alt }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const crumbs = [
    { name: "Knowledge", url: "/knowledge" },
    { name: post.category_name, url: `/knowledge?category=${post.category_slug}` },
    { name: post.title, url: `/knowledge/${post.slug}` },
  ];

  const cover = mediaUrl(post.cover_image);

  return (
    <>
      <JsonLd id={`article-${post.slug}`} data={articleSchema(post)} />
      <JsonLd
        id={`article-crumbs-${post.slug}`}
        data={breadcrumbSchema([{ name: "Home", url: "/" }, ...crumbs])}
      />
      {post.faqs.length > 0 && (
        <JsonLd id={`article-faq-${post.slug}`} data={faqSchema(post.faqs)} />
      )}

      <PageHero eyebrow={post.category_name} title={post.title} crumbs={crumbs}>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/55">
          {post.author_name && (
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {post.author_name}
            </span>
          )}
          {post.published_at && (
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {post.reading_minutes} min read
          </span>
        </div>
      </PageHero>

      <div className="bg-white py-12 sm:py-16">
        <div className="container-noks grid gap-12 lg:grid-cols-[1fr_320px] lg:items-start">
          <article className="min-w-0">
            {cover && (
              <div className="relative mb-10 aspect-16/9 overflow-hidden rounded-2xl bg-surface-muted">
                <Image
                  src={cover}
                  alt={post.cover_alt || post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              </div>
            )}

            <p className="mb-8 border-l-3 border-[var(--brand-primary)] pl-5 font-display text-[18px] leading-relaxed font-medium text-navy-900">
              {post.excerpt}
            </p>

            <div className="prose-noks">
              <Markdown body={post.body} />
            </div>

            {/* Tags */}
            {post.tag_list?.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-8">
                <span className="text-[12px] font-semibold text-slate-400">Topics:</span>
                {post.tag_list.map((tag) => (
                  <Link
                    key={tag}
                    href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-surface-muted px-3 py-1.5 text-[12.5px] font-medium
                               text-slate-600 transition-colors hover:bg-brand-50
                               hover:text-[var(--brand-primary)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Article FAQ — also emitted as FAQPage schema */}
            {post.faqs.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold text-navy-900">
                  Frequently asked questions
                </h2>
                <Accordion type="single" collapsible className="mt-6 flex flex-col gap-3">
                  {post.faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {post.author && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                  Written by
                </p>
                <p className="mt-3 font-display text-[15px] font-bold text-navy-900">
                  {post.author.name}
                </p>
                {post.author.role && (
                  <p className="text-[13px] text-[var(--brand-primary)]">{post.author.role}</p>
                )}
                {post.author.bio && (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">
                    {post.author.bio}
                  </p>
                )}
              </div>
            )}

            {post.suggested_products.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                  Products in this article
                </p>
                <ul className="mt-4 space-y-2">
                  {post.suggested_products.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        className="block rounded-xl border border-line px-4 py-3 transition-colors
                                   hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="block text-[13.5px] font-semibold text-navy-900">
                          {product.name}
                        </span>
                        <span className="block text-[12px] text-slate-500">
                          {product.category_name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-navy-900 p-6 text-white">
              <p className="font-display text-[15px] font-bold">Need a quotation?</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                Send us your specification and volume — written quote within one business day.
              </p>
              <Link
                href="/quote"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full
                           bg-white px-5 text-[13px] font-semibold text-navy-900
                           transition-colors hover:bg-brand-50"
              >
                Request Quote
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Related */}
      {post.related.length > 0 && (
        <Section tone="muted" size="sm">
          <div className="container-noks">
            <SectionHeading align="left" eyebrow="Keep reading" title="Related articles" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {post.related.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </Section>
      )}

      {post.suggested_products.length > 0 && (
        <Section size="sm">
          <div className="container-noks">
            <SectionHeading align="left" eyebrow="Related products" title="Products mentioned" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {post.suggested_products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <CtaBand />
    </>
  );
}

/**
 * Minimal, dependency-free Markdown renderer for the article body.
 * Supports the subset our editors use: ## / ### headings, **bold**,
 * bullet lists and paragraphs.
 */
const Markdown = ({ body }: { body: string }) => {
  const blocks = body.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return <h3 key={index}>{inline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={index}>{inline(trimmed.slice(3))}</h2>;
        }
        if (/^[-*]\s/m.test(trimmed) && trimmed.split("\n").every((l) => /^[-*]\s/.test(l.trim()))) {
          return (
            <ul key={index}>
              {trimmed.split("\n").map((line, i) => (
                <li key={i}>{inline(line.trim().replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{inline(trimmed)}</p>;
      })}
    </>
  );
};

/** Renders **bold** spans without dangerouslySetInnerHTML. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
