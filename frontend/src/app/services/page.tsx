import type { Metadata } from "next";

import { CtaBand } from "@/components/home/cta-band";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { ServicesGrid } from "@/components/home/services-grid";
import { PageHero } from "@/components/shared/page-hero";
import { api } from "@/lib/api";
import { brand } from "@/lib/site";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Our Services — Chemical Supply, Sourcing & Technical Support",
  description: `${brand.fullName} offers chemical supply, technical consultation, import & export, custom packaging, chemical sourcing, bulk distribution, laboratory support and turnkey industrial solutions across Kenya and East Africa.`,
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const data = await api.homepage();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Chemistry, plus everything around it"
        description="Sourcing, application engineering, packaging and logistics — the services that
                     turn a product list into a working supply chain."
        crumbs={[{ name: "Services", url: "/services" }]}
      />

      <ServicesGrid services={data.services} />
      <ProcessTimeline steps={data.process} />

      <CtaBand
        title="Let's scope your requirement"
        description="Whether it's a single laboratory reagent or a full water treatment programme, we'll put the right specialist on it."
      />
    </>
  );
}
