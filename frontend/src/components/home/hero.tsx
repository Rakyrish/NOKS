"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, FileCheck, Phone, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "water-treatment",
    title: "Water Treatment Chemicals",
    eyebrow: "Potable & Effluent Treatment",
    desc: "Coagulants, flocculants, aluminum sulphate, chlorine gas & tablets, and pH regulators supplied across East Africa.",
    categoryUrl: "/products?category=water-treatment-chemicals",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/Aquaculture_karivex_hh9tpf",
    tag: "Water & Wastewater",
  },
  {
    id: "food-grade",
    title: "Food-Grade & Additives",
    eyebrow: "FSSC 22000 & Halal Certified",
    desc: "Citric acid anhydrous, sodium benzoate, potassium sorbate, and specialty food processing chemicals.",
    categoryUrl: "/products?category=food-grade-chemicals",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/food_karivex_uurvo1",
    tag: "Food & Beverage",
  },
  {
    id: "cosmetics-detergents",
    title: "Cosmetic & Detergent Raw Materials",
    eyebrow: "Personal Care & Household Chemistry",
    desc: "SLES 70%, LABSA 96%, Caustic Soda Flakes, CDEA, fragrance fixatives, and bulk surfactants.",
    categoryUrl: "/products?category=industrial-chemicals",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/Raw-materials_karivex-edited_rbblpj",
    tag: "Detergent & Personal Care",
  },
  {
    id: "agriculture",
    title: "Agriculture & Animal Feed Inputs",
    eyebrow: "Crop Nutrition & Animal Health",
    desc: "Fertiliser blending salts, soil conditioners, trace minerals, and feed-grade premix additives.",
    categoryUrl: "/products?category=industrial-chemicals",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/Materials-Feed-Additives-edited_n0nmra",
    tag: "Agriculture & Feed",
  },
  {
    id: "effluent",
    title: "Industrial Wastewater Coagulants",
    eyebrow: "Heavy Metal & COD Reduction",
    desc: "Polyacrylamide flocculants, polyaluminium chloride (PAC), ferric chloride, and antifoams.",
    categoryUrl: "/products?category=water-treatment-chemicals",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/Chemicals-for-industrial-wastewater-treatment_karivex_jaw5v1",
    tag: "Effluent Treatment",
  },
  {
    id: "lab-reagents",
    title: "Laboratory Reagents & Solvents",
    eyebrow: "High-Purity Analytical Grade",
    desc: "HPLC-grade solvents, standard volumetric solutions, analytical reagents, and quality control consumables.",
    categoryUrl: "/products?category=laboratory-reagents",
    image: "https://res.cloudinary.com/dboska3dn/image/upload/v1/media/categories/Laboratory-Reagents_karivex_cppbxi",
    tag: "Laboratory & QA",
  },
];

export const Hero = () => {
  const [current, setCurrent] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-play carousel every 5.5 seconds unless user hovers
  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const activeSlide = SLIDES[current];

  return (
    <section
      className="relative bg-navy-950 text-white overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product categories showcase"
    >
      {/* ── Carousel Stage ───────────────────────────────────── */}
      <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px]">
        {/* Background Images with Crossfade */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 size-full"
          >
            <Image
              src={activeSlide.image}
              alt={activeSlide.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/80 to-navy-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content Container */}
        <div className="container-noks relative z-10 flex h-full flex-col justify-center py-12">
          <div className="max-w-2xl">
            {/* Active Category Badge */}
            <motion.div
              key={`badge-${activeSlide.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/40
                         bg-navy-950/85 px-3.5 py-1 text-xs font-bold text-blue-300 backdrop-blur-md"
            >
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{activeSlide.tag}</span>
              <span className="text-white/40">|</span>
              <span className="text-white/80">{activeSlide.eyebrow}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              key={`h1-${activeSlide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-4 font-heading text-3xl font-extrabold leading-[1.12] text-white sm:text-4xl lg:text-5xl"
            >
              Industrial Chemical Distributor in Nairobi, Kenya
            </motion.h1>

            {/* Sub-description highlighting the category */}
            <motion.p
              key={`p-${activeSlide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="mt-4 text-base leading-relaxed text-silver-200 sm:text-lg"
            >
              <strong className="text-blue-300 font-semibold">{activeSlide.title}: </strong>
              {activeSlide.desc} Bulk supply and procurement across East Africa. Manufacturer COA & MSDS with every order.
            </motion.p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/quote"
                className="nav-cta !px-6 !py-3 !text-sm !font-bold"
              >
                Request a quote
              </Link>
              <Link
                href={activeSlide.categoryUrl}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10
                           px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm
                           transition-colors hover:bg-white/20"
              >
                <span>Browse {activeSlide.title}</span>
                <ArrowRight className="size-4 text-blue-400" />
              </Link>
              {contact.phone && (
                <a
                  href={contact.telHref}
                  className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-3
                             text-sm font-semibold text-silver-200 transition-colors hover:text-white sm:inline-flex"
                >
                  <Phone className="size-4 text-blue-400" />
                  <span>{contact.phone}</span>
                </a>
              )}
            </div>

            {/* Quick Trust Highlights */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-silver-300">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-blue-400" />
                <span>COA & MSDS with Every Batch</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-blue-400" />
                <span>Same-Day Nairobi Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-400" />
                <span>KEBS & ISO Standard Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carousel Arrows ───────────────────────────────── */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex size-11 items-center justify-center
                     rounded-full bg-navy-950/60 border border-white/20 text-white backdrop-blur-md
                     transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex size-11 items-center justify-center
                     rounded-full bg-navy-950/60 border border-white/20 text-white backdrop-blur-md
                     transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <ChevronRight className="size-6" />
        </button>

        {/* ── Carousel Counter & Pills ──────────────────────── */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          <div className="flex items-baseline gap-2 rounded-full border border-white/20 bg-navy-950/70 px-4 py-1.5 backdrop-blur-md">
            <strong className="text-base font-extrabold text-blue-400">
              0{current + 1}
            </strong>
            <span className="text-xs text-silver-400">/ 0{SLIDES.length}</span>
            <span className="hidden text-xs font-semibold text-silver-200 sm:inline-block border-l border-white/20 pl-2">
              {activeSlide.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  current === idx ? "w-7 bg-blue-600" : "w-2 bg-white/30 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
