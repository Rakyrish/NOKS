import { Linkedin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { ApiError, api } from "@/lib/api";
import { imageSrc } from "@/lib/images";
import { notFoundMetadata, pageMetadata } from "@/lib/metadata";
import { absoluteUrl, brand, siteUrl } from "@/lib/site";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

/**
 * Author profile.
 *
 * Article JSON-LD names a `Person` as `author` and points `url` here, so this
 * page is what makes that claim checkable rather than decorative — an author
 * byline with nothing behind it is the shape Google's helpful-content guidance
 * singles out. It also gives the knowledge centre somewhere to hang
 * credentials once real ones exist.
 */
async function loadAuthor(slug: string) {
  try {
    return await api.author(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const author = await loadAuthor(slug);
  if (!author) return notFoundMetadata(`/knowledge/authors/${slug}`, "Author");

  return pageMetadata({
    title: `${author.name}${author.role ? ` — ${author.role}` : ""}`,
    description:
      author.bio ||
      `Articles by ${author.name} in the ${brand.fullName} knowledge centre.`,
    path: `/knowledge/authors/${author.slug}`,
    image: author.photo,
    imageAlt: author.name,
  });
}

export default async function AuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = await loadAuthor(slug);
  if (!author) notFound();

  const posts = await api.posts({ page: 1 });
  const written = posts.results.filter((post) => post.author_name === author.name);
  const photo = imageSrc(author.photo);

  return (
    <>
      <JsonLd
        id={`author-${author.slug}`}
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": `${siteUrl}/knowledge/authors/${author.slug}/#person`,
          name: author.name,
          url: absoluteUrl(`/knowledge/authors/${author.slug}`),
          ...(author.role ? { jobTitle: author.role } : {}),
          ...(author.bio ? { description: author.bio } : {}),
          ...(photo ? { image: absoluteUrl(photo) } : {}),
          // Only a profile the author has actually supplied. No invented
          // affiliations, awards or qualifications.
          ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
          worksFor: { "@id": `${siteUrl}/#organization` },
        }}
      />

      <PageHero
        eyebrow="Author"
        title={author.name}
        description={author.role}
        crumbs={[
          { name: "Knowledge", url: "/knowledge" },
          { name: author.name, url: `/knowledge/authors/${author.slug}` },
        ]}
      />

      <Section>
        <div className="container-noks max-w-3xl">
          {author.bio && (
            <p className="text-[16px] leading-relaxed text-slate-600">{author.bio}</p>
          )}
          {author.linkedin && (
            <a
              href={author.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold
                         text-[var(--brand-primary)] hover:underline"
            >
              <Linkedin className="size-4" />
              LinkedIn profile
            </a>
          )}
        </div>
      </Section>

      {written.length > 0 && (
        <Section tone="muted" size="sm">
          <div className="container-noks">
            <SectionHeading
              align="left"
              eyebrow="Published"
              title={`Articles by ${author.name}`}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {written.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section size="sm">
        <div className="container-noks">
          <Link
            href="/knowledge"
            className="text-[14px] font-semibold text-[var(--brand-primary)] hover:underline"
          >
            ← All knowledge centre articles
          </Link>
        </div>
      </Section>
    </>
  );
}
