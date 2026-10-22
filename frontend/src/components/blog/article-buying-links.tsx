import Link from "next/link";

import { BUYING_GUIDES } from "@/lib/buying-guides";

export function ArticleBuyingLinks({ slug }: { slug: string }) {
  const guide = BUYING_GUIDES[slug];
  if (!guide) return null;
  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface-muted p-6" aria-labelledby="article-buying">
      <h2 id="article-buying" className="font-display text-lg font-bold text-navy-900">{guide.heading}</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{guide.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-semibold text-brand-600">
        {guide.categories.map((category) => (
          <li key={category.slug}><Link className="underline" href={`/categories/${category.slug}`}>{category.name}</Link></li>
        ))}
      </ul>
    </section>
  );
}

export function ArticleReferences({ slug }: { slug: string }) {
  const references = BUYING_GUIDES[slug]?.references;
  if (!references?.length) return null;
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="font-display text-lg font-bold text-navy-900">References</h2>
      <ul className="mt-3 space-y-2 text-[14px]">
        {references.map((reference) => (
          <li key={reference.url}><a className="text-brand-600 underline" href={reference.url} target="_blank" rel="noopener noreferrer">{reference.name}</a></li>
        ))}
      </ul>
    </section>
  );
}
