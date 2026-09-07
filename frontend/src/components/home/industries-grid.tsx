"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Icon } from "@/components/shared/icon";
import type { Industry } from "@/types";

const DEFAULT_INDUSTRIES: Industry[] = [
  {
    id: 1,
    name: "Water Treatment",
    slug: "water-treatment",
    icon: "droplets",
    tagline: "Municipal & industrial water and effluent treatment",
    description: "Coagulants, flocculants, chlorine, and pH regulators for potable drinking water and trade wastewater.",
    key_applications: ["Coagulation & flocculation", "Disinfection", "pH correction", "Scale & corrosion control"],
    order: 1,
  },
  {
    id: 2,
    name: "Food & Beverage",
    slug: "food-processing",
    icon: "utensils",
    tagline: "Food grade ingredients and processing aids",
    description: "Acidulants, preservatives, sweeteners, and food-safe sanitation chemicals meeting strict compliance.",
    key_applications: ["Preservation", "Acidity regulation", "Fortification", "CIP sanitation"],
    order: 2,
  },
  {
    id: 3,
    name: "Cosmetics & Detergents",
    slug: "manufacturing",
    icon: "factory",
    tagline: "Surfactants and personal care raw materials",
    description: "SLES 70%, LABSA 96%, caustic soda, foam boosters, and fragrance binders for high-yield formulation.",
    key_applications: ["Surfactant bases", "Viscosity builders", "Emulsifiers", "pH adjusters"],
    order: 3,
  },
  {
    id: 4,
    name: "Agriculture & Livestock",
    slug: "agriculture",
    icon: "sprout",
    tagline: "Crop nutrition, soil conditioners and feed inputs",
    description: "Custom fertiliser blending salts, trace elements, soil buffers, and feed premix additives.",
    key_applications: ["Fertiliser blending", "Soil conditioning", "Feed minerals", "Irrigation sanitizing"],
    order: 4,
  },
  {
    id: 5,
    name: "Paints, Inks & Coatings",
    slug: "paint-coatings",
    icon: "paint-roller",
    tagline: "Pigments, resins, solvents and performance additives",
    description: "Titanium dioxide, solvents, binders, and defoamers for decorative and protective architectural coatings.",
    key_applications: ["Pigment dispersion", "Solvent blending", "Resin binders", "Anti-corrosion"],
    order: 5,
  },
  {
    id: 6,
    name: "Construction Chemistry",
    slug: "construction",
    icon: "hard-hat",
    tagline: "Admixtures, waterproofing, and surface treatments",
    description: "Concrete plasticizers, accelerators, curing agents, and integral waterproofing additives.",
    key_applications: ["Concrete admixtures", "Waterproofing", "Surface etching", "Grouting"],
    order: 6,
  },
  {
    id: 7,
    name: "Mining & Metallurgy",
    slug: "mining",
    icon: "mountain",
    tagline: "Extraction reagents, collectors and flocculants",
    description: "Cyanide alternatives, frothers, activators, and mineral processing chemicals for extraction plants.",
    key_applications: ["Flotation reagents", "Leaching aids", "Dust suppression", "Tailings clarification"],
    order: 7,
  },
  {
    id: 8,
    name: "Laboratories & Research",
    slug: "laboratories",
    icon: "flask-conical",
    tagline: "High purity analytical reagents and standard solutions",
    description: "AR grade acids, HPLC solvents, volumetric standards, and certified quality control consumables.",
    key_applications: ["Sample preparation", "Titration standards", "Buffer preparation", "Analytical testing"],
    order: 8,
  },
];

export const IndustriesGrid = ({ industries = [] }: { industries?: Industry[] }) => {
  const items = industries.length > 0 ? industries : DEFAULT_INDUSTRIES;

  const tones = [
    { bg: "bg-navy-950 text-white", badge: "bg-blue-600 text-white", border: "border-t-navy-950" },
    { bg: "bg-gradient-to-br from-blue-700 to-blue-500 text-white", badge: "bg-navy-950 text-white", border: "border-t-blue-600" },
    { bg: "bg-gradient-to-br from-[#0d6d6a] to-teal-500 text-white", badge: "bg-white text-[#0d6d6a]", border: "border-t-teal-500" },
    { bg: "bg-gradient-to-br from-navy-800 to-steel-700 text-white", badge: "bg-blue-400 text-navy-950", border: "border-t-navy-800" },
  ];

  return (
    <section className="py-14 lg:py-20 bg-white border-b border-rule">
      <div className="container-noks">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Sector Expertise
            </span>
            <h2 className="mt-1 font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-navy-900">
              Industries Supplied Across East Africa
            </h2>
            <p className="mt-2 text-sm text-steel-700 max-w-2xl">
              From continuous municipal water plants to batch pharmaceutical formulation, we stock and deliver certified raw materials tailored to exact application demands.
            </p>
          </div>
          <Link
            href="/industries"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
          >
            <span>View all 12 industries</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Multi-Tone Industry Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((industry, index) => {
            const tone = tones[index % tones.length];
            return (
              <div
                key={industry.id || industry.slug}
                className={`product-card ${tone.border} flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  {/* Card Header Media Band */}
                  <div className={`p-5 ${tone.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-white/20 text-white">
                        <Icon name={industry.icon} className="size-5" />
                      </span>
                      <h3 className="font-heading text-base font-bold text-white leading-tight">
                        {industry.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <p className="text-xs leading-relaxed text-steel-700 line-clamp-3">
                      {industry.tagline || industry.description}
                    </p>

                    {/* Key Applications Pills */}
                    {industry.key_applications && industry.key_applications.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <p className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">
                          Key Solutions:
                        </p>
                        <ul className="text-[11.5px] text-steel-700 space-y-1 pl-3 list-disc">
                          {industry.key_applications.slice(0, 3).map((app) => (
                            <li key={app}>{app}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Link Footer */}
                <div className="p-5 pt-0 border-t border-rule/60 mt-3">
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="inline-flex items-center justify-between w-full pt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>Browse chemicals for this sector</span>
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
