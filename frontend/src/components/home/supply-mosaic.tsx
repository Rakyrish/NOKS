import { ArrowRight, Boxes, FlaskConical, Truck, Warehouse } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

type Tile = {
  title: string;
  caption: string;
  image: string;
  icon: React.ElementType;
  href: string;
  stat?: { value: string; label: string };
  className: string;
  priority?: boolean;
};

const TILES: Tile[] = [
  {
    title: "Bulk drums & IBCs",
    caption:
      "200 L drums, 1,000 L IBCs, 25 kg bags — packed to your line's handling spec and sealed with batch traceability.",
    image: "/images/sections/drums-blue.jpg",
    icon: Boxes,
    href: "/products",
    stat: { value: "1,200+", label: "chemicals stocked" },
    className: "sm:col-span-2 sm:row-span-2",
  },
  {
    title: "Tanker & fleet delivery",
    caption: "Bulk road tankers across the EAC corridor.",
    image: "/images/sections/tanker.jpg",
    icon: Truck,
    href: "/services",
    className: "",
  },
  {
    title: "In-house QC",
    caption: "Batch verification before every release.",
    image: "/images/sections/qc-powder.jpg",
    icon: FlaskConical,
    href: "/services",
    className: "",
  },
  {
    title: "Nairobi warehouse",
    caption:
      "Industrial Area stock holding, repacking and same-day dispatch across the city.",
    image: "/images/sections/warehouse-drums.jpg",
    icon: Warehouse,
    href: "/about",
    className: "sm:col-span-3",
  },
];

export const SupplyMosaic = () => (
  <section className="relative border-b border-rule bg-white py-16 lg:py-24">
    <div className="container-noks">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)] lg:gap-14">
        {/* ── Editorial column ─────────────────────────────────── */}
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.16em] text-blue-600 uppercase">
            <span className="h-px w-7 bg-blue-600/40" aria-hidden />
            What we actually do
          </div>

          <h2 className="mt-4 font-display text-[clamp(1.85rem,3.4vw,2.9rem)] leading-[1.1] font-bold text-navy-900">
            A chemical supply chain you can plan production around
          </h2>

          <p className="mt-5 text-[15.5px] leading-relaxed text-steel-700">
            NOKS holds real stock in Nairobi — not a catalogue of promises. We import,
            warehouse, repack and deliver industrial, food-grade and laboratory chemicals
            with the documentation your auditors ask for, on the schedule your plant runs on.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-rule pt-8">
            {[
              { value: "12", label: "Industries supplied" },
              { value: "24 hr", label: "Typical quote turnaround" },
              { value: "4", label: "EAC countries served" },
              { value: "100%", label: "Orders with COA & MSDS" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="font-display text-3xl font-extrabold text-blue-600">
                  {item.value}
                </dt>
                <dd className="mt-1 text-[12.5px] leading-snug font-semibold text-steel-700">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/products"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3.5
                       text-sm font-bold text-white transition-all hover:bg-blue-600"
          >
            <span>Explore the full catalogue</span>
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        {/* ── Mosaic ───────────────────────────────────────────── */}
        <RevealGroup className="grid auto-rows-[168px] grid-cols-1 gap-3.5 sm:auto-rows-[190px] sm:grid-cols-3 lg:auto-rows-[205px]">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <RevealItem key={tile.title} className={cn("group", tile.className)}>
                <Link
                  href={tile.href}
                  className="media-tile block size-full border border-rule/70 shadow-card
                             hover:-translate-y-1 hover:shadow-lift"
                >
                  <Image
                    src={tile.image}
                    alt={tile.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    className="media-tile-img object-cover group-hover:scale-[1.07]"
                  />
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/5"
                    aria-hidden
                  />

                  {tile.stat && (
                    <span className="absolute top-4 left-4 rounded-lg border border-white/20 bg-navy-950/70 px-3 py-2 backdrop-blur-md">
                      <span className="block font-display text-xl leading-none font-extrabold text-white">
                        {tile.stat.value}
                      </span>
                      <span className="mt-1 block text-[10.5px] font-semibold tracking-wide text-blue-200 uppercase">
                        {tile.stat.label}
                      </span>
                    </span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 shrink-0 text-blue-300" />
                      <span className="font-heading text-[15px] leading-tight font-bold text-white">
                        {tile.title}
                      </span>
                    </span>
                    <span
                      className="mt-1.5 block max-w-sm text-[12.5px] leading-snug text-silver-300
                                 opacity-0 transition-opacity duration-300 group-hover:opacity-100
                                 max-sm:opacity-100"
                    >
                      {tile.caption}
                    </span>
                  </span>

                  <span
                    className="absolute right-4 bottom-4 flex size-8 items-center justify-center rounded-full
                               bg-blue-600 text-white opacity-0 transition-all duration-300
                               group-hover:opacity-100 sm:right-5 sm:bottom-5"
                    aria-hidden
                  >
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </div>
  </section>
);
