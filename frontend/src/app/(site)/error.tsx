"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[noks] page error:", error);
  }, [error]);

  return (
    <section className="grid min-h-[70vh] place-items-center bg-surface-muted px-6 py-20">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-navy-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          We hit an unexpected error loading this page. Please try again — if it persists,
          our team is a phone call away.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
