import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/catalog/product-card";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export const FeaturedProducts = ({ products }: { products: Product[] }) => {
  if (!products.length) return null;

  return (
    <Section id="featured">
      <div className="container-noks">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Featured products"
            title="Ex-stock chemicals, ready to dispatch"
            description="Our most requested industrial, laboratory and food grade products —
                         each with full specifications and batch documentation."
            className="max-w-2xl"
          />
          <Reveal delay={0.1}>
            <Button asChild variant="outline">
              <Link href="/products">
                View full catalog
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </Section>
  );
};
