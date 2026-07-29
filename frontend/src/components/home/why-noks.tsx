import { Icon } from "@/components/shared/icon";
import { RevealGroup, RevealItem, TiltCard } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { brand } from "@/lib/site";
import type { ValueProp } from "@/types";

export const WhyNoks = ({ items }: { items: ValueProp[] }) => {
  if (!items.length) return null;

  return (
    <Section tone="navy" id="why">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-light opacity-50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 left-1/3 size-[32rem] rounded-full
                   bg-[var(--brand-primary)]/22 blur-[130px]"
        aria-hidden
      />

      <div className="relative container-noks">
        <SectionHeading
          inverted
          eyebrow={`Why ${brand.name}`}
          title="Six reasons East African plants keep reordering"
          description="Supply reliability is a system, not a promise. Here is what ours is built on."
        />

        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          staggerChildren={0.07}
        >
          {items.map((item) => (
            <RevealItem key={item.id}>
              <TiltCard className="h-full">
                <div
                  className="glass-dark group flex h-full flex-col rounded-2xl p-7
                             transition-colors duration-300 hover:bg-white/10"
                >
                  <span
                    className="grid size-12 place-items-center rounded-xl
                               bg-[var(--brand-primary)] text-white
                               shadow-[0_10px_28px_-10px_rgba(12,72,230,0.8)]
                               transition-transform duration-300 group-hover:scale-105"
                  >
                    <Icon name={item.icon} className="size-5.5" />
                  </span>

                  <h3 className="mt-5 font-display text-[17px] font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-white/62">
                    {item.description}
                  </p>
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
};
