import { ArrowUpRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { formatDate, mediaUrl } from "@/lib/utils";
import type { PostSummary } from "@/types";

export const PostCard = ({ post }: { post: PostSummary }) => {
  const cover = mediaUrl(post.cover_image);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line
                 bg-white transition-all duration-300 hover:-translate-y-1
                 hover:border-brand-200 hover:shadow-[var(--shadow-lift)]"
    >
      <Link
        href={`/knowledge/${post.slug}`}
        className="relative aspect-16/10 overflow-hidden bg-surface-muted"
      >
        {cover ? (
          <Image
            src={cover}
            alt={post.cover_alt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center bg-gradient-to-br
                       from-brand-50 via-white to-emerald-50/50"
          >
            <span className="px-6 text-center font-display text-[15px] font-bold text-brand-300">
              {post.category_name}
            </span>
          </div>
        )}

        <Badge size="sm" className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm">
          {post.category_name}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
          <Link
            href={`/knowledge/${post.slug}`}
            className="transition-colors hover:text-[var(--brand-primary)]"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-slate-500">
          {post.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[12px] text-slate-400">
          <span className="flex items-center gap-3">
            {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {post.reading_minutes} min
            </span>
          </span>
          <ArrowUpRight
            className="size-4 transition-all duration-300 group-hover:translate-x-0.5
                       group-hover:-translate-y-0.5 group-hover:text-[var(--brand-primary)]"
          />
        </div>
      </div>
    </article>
  );
};
