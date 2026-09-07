"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileCheck, Phone, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { contact } from "@/lib/site";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6000;

const SLIDES = [
  {
    id: "water-treatment",
    title: "Water Treatment Chemicals",
    eyebrow: "Potable & Effluent Treatment",
    desc: "Coagulants, flocculants, aluminum sulphate, chlorine gas & tablets, and pH regulators supplied across East Africa.",
    categoryUrl: "/products?category=water-treatment-chemicals",
    image: "/images/hero/water-treatment.jpg",
    tag: "Water & Wastewater",
  },
  {
    id: "food-grade",
    title: "Food-Grade & Additives",
    eyebrow: "FSSC 22000 & Halal Certified",
    desc: "Citric acid anhydrous, sodium benzoate, potassium sorbate, and specialty food processing chemicals.",
    categoryUrl: "/products?category=food-grade-chemicals",
    image: "/images/hero/food-grade.jpg",
    tag: "Food & Beverage",
  },
  {
    id: "cosmetics-detergents",
    title: "Cosmetic & Detergent Raw Materials",
    eyebrow: "Personal Care & Household Chemistry",
    desc: "SLES 70%, LABSA 96%, Caustic Soda Flakes, CDEA, fragrance fixatives, and bulk surfactants.",
    categoryUrl: "/products?category=industrial-chemicals",
    image: "/images/hero/detergents.jpg",
    tag: "Detergent & Personal Care",
  },
  {
    id: "agriculture",
    title: "Agriculture & Animal Feed Inputs",
    eyebrow: "Crop Nutrition & Animal Health",
    desc: "Fertiliser blending salts, soil conditioners, trace minerals, and feed-grade premix additives.",
    categoryUrl: "/products?category=industrial-chemicals",
    image: "/images/hero/agriculture.jpg",
    tag: "Agriculture & Feed",
  },
  {
    id: "effluent",
    title: "Industrial Wastewater Coagulants",
    eyebrow: "Heavy Metal & COD Reduction",
    desc: "Polyacrylamide flocculants, polyaluminium chloride (PAC), ferric chloride, and antifoams.",
    categoryUrl: "/products?category=water-treatment-chemicals",
    image: "/images/hero/effluent.jpg",
    tag: "Effluent Treatment",
  },
  {
    id: "lab-reagents",
    title: "Laboratory Reagents & Solvents",
    eyebrow: "High-Purity Analytical Grade",
    desc: "HPLC-grade solvents, standard volumetric solutions, analytical reagents, and quality control consumables.",
    categoryUrl: "/products?category=laboratory-reagents",
    image: "/images/hero/laboratory.jpg",
    tag: "Laboratory & QA",
  },
];

const ASSURANCES = [
  { icon: FileCheck, label: "COA & MSDS with every batch" },
  { icon: Truck, label: "Same-day Nairobi dispatch" },
  { icon: ShieldCheck, label: "KEBS & ISO standard compliant" },
];

export const Hero = () => {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = SLIDES[current];

  return (
    <section
      className="relative isolate overflow-hidden bg-navy-950 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Chemical categories we supply"
    >
      {/* ── Background stage: crossfade + slow drift ─────────────── */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: reduceMotion ? 1 : 1.08,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.1, ease: "easeInOut" },
              scale: { duration: SLIDE_MS / 1000 + 1.5, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <Image
              src={activeSlide.image}
              alt=""
              fill
              priority={current === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Warm the next slide while the current one is on screen. Without this
            the carousel advances to an image that has not been fetched yet and
            flashes bare navy for a beat — only slide 0 gets `priority`. */}
        <div className="pointer-events-none absolute size-px opacity-0" aria-hidden>
          <Image
            key={`preload-${SLIDES[(current + 1) % SLIDES.length].id}`}
            src={SLIDES[(current + 1) % SLIDES.length].image}
            alt=""
            fill
            sizes="100vw"
          />
        </div>

        {/* Legibility scrims. Dense behind the headline, then released across
            the midpoint — enough to hold white text without flattening the
            photograph into a navy panel. */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/86 via-40% to-navy-950/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent via-35% to-navy-950/25" />
        <div className="bg-grid-light absolute inset-0 opacity-[0.18]" aria-hidden />
      </div>

      {/* ── Foreground ───────────────────────────────────────────── */}
      <div className="container-noks relative z-10 pt-14 pb-10 sm:pt-20 lg:pt-24 lg:pb-14">
        <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* Copy column */}
          <div className="max-w-2xl">
            <motion.div
              key={`badge-${activeSlide.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/40
                         bg-blue-600/10 px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide
                         text-blue-200 backdrop-blur-md"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-400" />
              </span>
              <span className="uppercase">{activeSlide.tag}</span>
              <span className="h-3 w-px bg-white/25" />
              <span className="font-semibold text-white/75">{activeSlide.eyebrow}</span>
            </motion.div>

            <h1
              className="mt-5 font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.06] font-extrabold
                         tracking-tight text-white"
            >
              Industrial Chemical
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-white to-blue-200 bg-clip-text text-transparent">
                Distributor in Kenya
              </span>
            </h1>

            <div className="mt-5 min-h-[5.5rem] sm:min-h-[5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${activeSlide.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-[15.5px] leading-relaxed text-silver-200 sm:text-[17px]"
                >
                  <strong className="font-bold text-blue-300">{activeSlide.title}: </strong>
                  {activeSlide.desc}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/quote" className="nav-cta gap-2 !px-6 !py-3.5 !text-sm !font-bold">
                Request a quote
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={activeSlide.categoryUrl}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5
                           px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-sm
                           transition-all hover:border-white/50 hover:bg-white/15"
              >
                <span>Browse this range</span>
                <ArrowRight className="size-4 text-blue-300" />
              </Link>
              {contact.phone && (
                <a
                  href={contact.telHref}
                  className="hidden items-center gap-2 px-2 py-3.5 text-sm font-semibold
                             text-silver-300 transition-colors hover:text-white sm:inline-flex"
                >
                  <Phone className="size-4 text-blue-300" />
                  <span>{contact.phone}</span>
                </a>
              )}
            </div>

            <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {ASSURANCES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-[12.5px] font-semibold text-silver-300"
                >
                  <Icon className="size-4 shrink-0 text-blue-400" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Slide picker — thumbnails double as navigation */}
          <div className="hidden lg:block">
            <div className="mb-3 flex items-center justify-between text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">
              <span>Our supply ranges</span>
              <span className="tabular-nums text-blue-300">
                {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {SLIDES.map((slide, idx) => {
                const isActive = idx === current;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    aria-label={`Show ${slide.title}`}
                    aria-current={isActive}
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-lg border transition-all duration-300",
                      isActive
                        ? "border-blue-500 ring-2 ring-blue-500/40"
                        : "border-white/15 opacity-60 hover:opacity-100 hover:border-white/40",
                    )}
                  >
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/30 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-2 text-left text-[10.5px] leading-tight font-bold text-white">
                      {slide.tag}
                    </span>
                    {isActive && !isPaused && (
                      <motion.span
                        key={`bar-${slide.id}`}
                        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-blue-500"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile / tablet slide dots */}
        <div className="mt-9 flex items-center gap-2 lg:hidden">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Show ${slide.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === idx ? "w-8 bg-blue-500" : "w-2.5 bg-white/30 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
