"use client";

import { motion } from "framer-motion";
import { ArrowRight, FlaskConical, Headset, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { brand, contact } from "@/lib/site";

import { LabIllustration } from "./lab-illustration";
import { MolecularBackground } from "./molecular-background";

const EASE = [0.22, 1, 0.36, 1] as const;

const TRUST = [
  { Icon: ShieldCheck, label: "Certified & COA-backed" },
  { Icon: Truck, label: "Nationwide delivery" },
  { Icon: Headset, label: "Technical support" },
] as const;

export const Hero = () => (
  <section className="relative isolate overflow-hidden bg-white pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
    <MolecularBackground />

    <div className="container-noks relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2.5 rounded-full border border-brand-100
                     bg-brand-50/80 py-1.5 pr-4 pl-1.5 backdrop-blur-sm"
        >
          <span className="grid size-6 place-items-center rounded-full bg-[var(--brand-primary)]">
            <FlaskConical className="size-3.5 text-white" />
          </span>
          <span className="text-[12.5px] font-semibold text-brand-800">
            {brand.name} {brand.division}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="mt-6 font-display text-[clamp(2.35rem,5.4vw,4.15rem)] leading-[1.05]
                     font-extrabold text-navy-900"
        >
          Engineering Better{" "}
          <span className="text-gradient-brand">Chemical Solutions</span> for Africa.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          className="mt-6 max-w-xl text-[16px] leading-relaxed text-slate-600 sm:text-[17.5px]"
        >
          Reliable Industrial Chemicals, Laboratory Reagents, Water Treatment Solutions,
          Food Ingredients and Specialty Chemicals — supplied across Kenya and East Africa
          with certified quality and technical expertise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="/products">
              Browse Products
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/quote">Request Quote</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href={contact.whatsappUrl || "/contact"} target="_blank" rel="noopener noreferrer">
              Talk to an Expert
            </a>
          </Button>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.42 }}
          className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3"
        >
          {TRUST.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13.5px] text-slate-500">
              <Icon className="size-4 text-[var(--brand-emerald)]" />
              {label}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        className="relative"
      >
        <LabIllustration />
      </motion.div>
    </div>
  </section>
);
