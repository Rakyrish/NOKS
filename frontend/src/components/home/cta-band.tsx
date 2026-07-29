import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site";

export const CtaBand = ({
  title = "Need Industrial Chemicals?",
  description = "Send us your specification, volume and delivery location. You'll have a written quotation with lead times within one business day.",
}: {
  title?: string;
  description?: string;
}) => (
  <section className="relative overflow-hidden py-20 sm:py-24">
    <div
      className="absolute inset-0 bg-[linear-gradient(115deg,var(--color-navy-900)_0%,var(--brand-primary-dark)_58%,var(--brand-primary)_100%)]"
      aria-hidden
    />
    <div className="bg-grid-light absolute inset-0 opacity-50" aria-hidden />
    <div
      className="pointer-events-none absolute -top-32 right-1/4 size-[30rem] rounded-full
                 bg-[var(--brand-emerald)]/22 blur-[120px]"
      aria-hidden
    />

    <Reveal className="relative container-noks text-center">
      <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.1] font-extrabold text-white">
        {title}
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/70 sm:text-[17px]">
        {description}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="bg-white text-navy-900 hover:bg-brand-50">
          <Link href="/quote">
            Request Quote
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <Button asChild size="lg" variant="glass">
          <Link href="/contact">
            <Phone className="size-4" />
            Contact Sales
          </Link>
        </Button>

        {contact.whatsappUrl && (
          <Button asChild size="lg" variant="glass">
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        )}
      </div>

      <p className="mt-8 text-[13px] text-white/45">
        {[contact.phone, contact.email].filter(Boolean).join("  ·  ")}
      </p>
    </Reveal>
  </section>
);
