import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

import { deleteIndustry, updateIndustry } from "../../actions";
import { IndustryForm } from "../../industry-form";

export const metadata: Metadata = { title: "Edit industry" };

export default async function EditIndustryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const industryId = Number(id);
  const industries = await adminApi.industries.list();
  const industry = industries.find((i) => i.id === industryId);
  if (!industry) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Edit {industry.name}</h1>
        <form action={deleteIndustry.bind(null, industryId)}>
          <Button type="submit" variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">
            Delete
          </Button>
        </form>
      </div>
      <IndustryForm industry={industry} action={updateIndustry.bind(null, industryId)} />
    </div>
  );
}
