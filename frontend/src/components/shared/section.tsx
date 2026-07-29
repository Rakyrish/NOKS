import * as React from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "./motion";

export const Section = ({
  children,
  className,
  id,
  tone = "white",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "white" | "muted" | "navy" | "gradient";
  size?: "sm" | "md" | "lg";
}) => {
  const tones = {
    white: "bg-white",
    muted: "bg-surface-muted",
    navy: "bg-navy-900 text-white",
    gradient:
      "bg-[linear-gradient(160deg,var(--color-navy-900),var(--brand-primary-dark)_60%,var(--brand-primary))] text-white",
  } as const;

  const sizes = {
    sm: "py-14 sm:py-16",
    md: "py-20 sm:py-24 lg:py-28",
    lg: "py-24 sm:py-32 lg:py-36",
  } as const;

  return (
    <section id={id} className={cn("relative", tones[tone], sizes[size], className)}>
      {children}
    </section>
  );
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
  inverted = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  inverted?: boolean;
  className?: string;
}) => (
  <Reveal
    className={cn(
      "max-w-3xl",
      align === "center" && "mx-auto text-center",
      className,
    )}
  >
    {eyebrow && (
      <div
        className={cn(
          "mb-4 flex items-center gap-2.5 text-[11px] font-bold tracking-[0.16em] uppercase",
          align === "center" && "justify-center",
          inverted ? "text-brand-200" : "text-[var(--brand-primary)]",
        )}
      >
        <span
          className={cn(
            "h-px w-7",
            inverted ? "bg-brand-300/60" : "bg-[var(--brand-primary)]/40",
          )}
          aria-hidden
        />
        {eyebrow}
        {align === "center" && (
          <span
            className={cn(
              "h-px w-7",
              inverted ? "bg-brand-300/60" : "bg-[var(--brand-primary)]/40",
            )}
            aria-hidden
          />
        )}
      </div>
    )}

    <h2
      className={cn(
        "font-display text-[clamp(1.85rem,4vw,3rem)] leading-[1.12] font-bold",
        inverted ? "text-white" : "text-navy-900",
      )}
    >
      {title}
    </h2>

    {description && (
      <p
        className={cn(
          "mt-5 text-[15px] leading-relaxed sm:text-[17px]",
          inverted ? "text-white/70" : "text-slate-600",
        )}
      >
        {description}
      </p>
    )}
  </Reveal>
);
