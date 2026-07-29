"use client";

import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { FAQ } from "@/types";

export const FaqSection = ({
  faqs,
  eyebrow = "Questions",
  title = "Everything buyers ask us first",
  description = "Delivery, minimum orders, certification and sourcing — answered in plain terms.",
  tone = "muted",
}: {
  faqs: Pick<FAQ, "id" | "question" | "answer">[];
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "white" | "muted";
}) => {
  if (!faqs.length) return null;

  return (
    <Section tone={tone} id="faq">
      <div className="container-noks">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        <Reveal className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl">
          <div
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border
                       border-line bg-white p-6 text-center sm:flex-row sm:text-left"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-[var(--brand-primary)]">
                <MessageCircleQuestion className="size-5" />
              </span>
              <div>
                <p className="font-display text-[15px] font-bold text-navy-900">
                  Still have a question?
                </p>
                <p className="mt-0.5 text-[13.5px] text-slate-500">
                  Our technical team replies within one business day.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/contact">Talk to an expert</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};
