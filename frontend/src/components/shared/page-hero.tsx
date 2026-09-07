import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; url: string };

export const PageHero = ({
  eyebrow,
  title,
  description,
  crumbs = [],
  children,
  className,
  image,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  className?: string;
  /** Background photograph. Sits under a heavy navy scrim, so it reads as
   *  texture behind the copy rather than an image in its own right. */
  image?: string;
}) => (
  <section className={cn("relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 border-b-2 border-[#0c48e6] pt-10 pb-14 sm:pb-16", className)}>
    {image && (
      <>
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-900/70"
          aria-hidden
        />
      </>
    )}
    <div className="bg-grid-light absolute inset-0 opacity-25" aria-hidden />
    <div
      className="pointer-events-none absolute -top-28 -right-20 size-[30rem] rounded-full
                 bg-blue-500/15 blur-[110px]"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute -bottom-40 left-1/4 size-[24rem] rounded-full
                 bg-teal-500/10 blur-[110px]"
      aria-hidden
    />

    {crumbs.length > 0 && (
      <JsonLd
        id={`breadcrumb-${crumbs[crumbs.length - 1]?.url.replace(/\W/g, "-")}`}
        data={breadcrumbSchema([{ name: "Home", url: "/" }, ...crumbs])}
      />
    )}

    <div className="relative container-noks">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-white/45">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
            </li>
            {crumbs.map((crumb, index) => (
              <li key={crumb.url} className="flex items-center gap-1">
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                {index === crumbs.length - 1 ? (
                  <span className="text-white/80" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.url} className="transition-colors hover:text-white">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {eyebrow && (
        <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-brand-200 uppercase">
          {eyebrow}
        </p>
      )}

      <h1 className="max-w-4xl font-display text-[clamp(1.9rem,4.4vw,3.15rem)] leading-[1.1] font-extrabold text-white">
        {title}
      </h1>

      {description && (
        <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-[16.5px]">
          {description}
        </div>
      )}

      {children}
    </div>
  </section>
);
