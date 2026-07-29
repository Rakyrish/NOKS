"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import * as React from "react";

import { Section, SectionHeading } from "@/components/shared/section";
import type { ClientLogo, Testimonial } from "@/types";

export const Testimonials = ({
  testimonials,
  clients,
}: {
  testimonials: Testimonial[];
  clients: ClientLogo[];
}) => {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  const go = React.useCallback(
    (next: number) => {
      if (!testimonials.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(((next % testimonials.length) + testimonials.length) % testimonials.length);
    },
    [index, testimonials.length],
  );

  // Auto-advance, paused while the visitor interacts.
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (paused || testimonials.length < 2) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [paused, testimonials.length]);

  if (!testimonials.length) return null;
  const active = testimonials[index];

  return (
    <Section id="testimonials">
      <div className="container-noks">
        <SectionHeading
          eyebrow="Client results"
          title="Trusted across water, food, mining and laboratories"
          description="Real outcomes from plants and laboratories that rely on our chemistry every week."
        />

        <div
          className="relative mx-auto mt-14 max-w-4xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[19rem] sm:min-h-[16rem]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.figure
                key={active.id}
                custom={direction}
                initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[1.5rem] border border-line
                           bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10"
              >
                <Quote
                  className="absolute top-6 right-7 size-16 text-brand-50"
                  aria-hidden
                />

                <div className="relative flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star
                      key={star}
                      className={`size-4 ${
                        star < active.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                      aria-hidden
                    />
                  ))}
                  <span className="sr-only">{active.rating} out of 5 stars</span>
                </div>

                <blockquote className="relative mt-5 font-display text-[17px] leading-relaxed font-medium text-navy-900 sm:text-[19px]">
                  “{active.quote}”
                </blockquote>

                <figcaption className="relative mt-7 flex items-center gap-3.5 border-t border-line pt-6">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full
                               bg-brand-50 font-display text-sm font-bold text-[var(--brand-primary)]"
                    aria-hidden
                  >
                    {active.author
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold text-navy-900">
                      {active.author}
                    </span>
                    <span className="block truncate text-[13px] text-slate-500">
                      {[active.role, active.company].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  {active.source === "google" && (
                    <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11.5px] font-medium text-slate-500 sm:flex">
                      <GoogleGlyph />
                      Google Review
                    </span>
                  )}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous testimonial"
              className="grid size-10 place-items-center rounded-full border border-line
                         bg-white text-slate-500 transition-all hover:border-brand-300
                         hover:bg-brand-50 hover:text-[var(--brand-primary)]"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((item, dot) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(dot)}
                  aria-label={`Go to testimonial ${dot + 1}`}
                  aria-current={dot === index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dot === index
                      ? "w-7 bg-[var(--brand-primary)]"
                      : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next testimonial"
              className="grid size-10 place-items-center rounded-full border border-line
                         bg-white text-slate-500 transition-all hover:border-brand-300
                         hover:bg-brand-50 hover:text-[var(--brand-primary)]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Client marquee */}
        {clients.length > 0 && (
          <div className="mt-16 border-t border-line pt-10">
            <p className="text-center text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              Supplying industry leaders across East Africa
            </p>

            <div
              className="group relative mt-7 overflow-hidden
                         [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
            >
              <div className="flex w-max motion-safe:animate-[marquee_42s_linear_infinite] group-hover:[animation-play-state:paused]">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                    {clients.map((client) => (
                      <li
                        key={`${copy}-${client.id}`}
                        className="mx-6 font-display text-[15px] font-bold whitespace-nowrap
                                   text-slate-300 transition-colors hover:text-slate-500"
                      >
                        {client.name}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 01-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.86z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.2 7.2 0 010-4.58V6.62H1.29a12 12 0 000 10.76l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 001.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);
