import type { Metadata } from "next";

import { createIndustry } from "../actions";
import { IndustryForm } from "../industry-form";

export const metadata: Metadata = { title: "New industry" };

export default function NewIndustryPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">New industry</h1>
      <IndustryForm action={createIndustry} />
    </div>
  );
}
