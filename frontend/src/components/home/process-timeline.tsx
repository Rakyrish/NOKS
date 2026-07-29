"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import * as React from "react";

import { Icon } from "@/components/shared/icon";
import { Section, SectionHeading } from "@/components/shared/section";
import type { ProcessStep } from "@/types";

export const ProcessTimeline = ({ steps }: { steps: ProcessStep[] }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.55"],
  });
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  if (!steps.length) return null;

  return (
    <Section tone="muted" id="process">
      <div className="container-noks">
        <SectionHeading
          eyebrow="How we work"
          title="From first enquiry to ongoing support"
          description="A predictable six-step process, with clear turnaround times at every stage."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          {/* Track */}
          <div
            className="absolute top-0 bottom-0 left-[27px] w-px bg-line md:left-1/2 md:-translate-x-px"
            aria-hidden
          />
          {/* Progress fill, driven by scroll */}
          <motion.div
            className="absolute top-0 left-[27px] w-px origin-top bg-gradient-to-b
                       from-[var(--brand-primary)] to-[var(--brand-emerald)]
                       md:left-1/2 md:-translate-x-px"
            style={{ height: reduced ? "100%" : height }}
            aria-hidden
          />

          <ol className="space-y-9">
            {steps.map((step, index) => {
              const flip = index % 2 === 1;
              return (
                <li key={step.id} className="relative">
                  <div
                    className={`flex flex-col gap-4 md:flex-row md:items-center ${
                      flip ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Node */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2">
                      <motion.span
                        initial={reduced ? undefined : { scale: 0, opacity: 0 }}
                        whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="grid size-14 place-items-center rounded-full border-4
                                   border-surface-muted bg-white text-[var(--brand-primary)]
                                   shadow-[var(--shadow-soft)]"
                      >
                        <Icon name={step.icon} className="size-5" />
                      </motion.span>
                    </div>

                    {/* Card */}
                    <motion.div
                      initial={reduced ? undefined : { opacity: 0, x: flip ? 26 : -26 }}
                      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className={`ml-20 flex-1 rounded-2xl border border-line bg-white p-6
                                  shadow-[var(--shadow-soft)] md:ml-0 md:max-w-[calc(50%-3rem)]
                                  ${flip ? "md:mr-auto" : "md:ml-auto"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--brand-primary)] uppercase">
                          Step {String(index + 1).padStart(2, "0")}
                        </span>
                        {step.duration && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {step.duration}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 font-display text-[17px] font-bold text-navy-900">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
                        {step.description}
                      </p>
                    </motion.div>

                    <div className="hidden flex-1 md:block" aria-hidden />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
};
