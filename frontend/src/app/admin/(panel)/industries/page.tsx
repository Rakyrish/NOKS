import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

export const metadata: Metadata = { title: "Industries" };

export default async function AdminIndustriesPage() {
  const industries = await adminApi.industries.list();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Industries</h1>
        <Button asChild>
          <Link href="/admin/industries/new">New industry</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {industries.map((i) => (
              <tr key={i.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-semibold text-ink">{i.name}</td>
                <td className="px-4 py-3 text-muted-fg">{i.product_count}</td>
                <td className="px-4 py-3">
                  <Badge variant={i.is_published ? "emerald" : "neutral"} size="sm">
                    {i.is_published ? "Published" : "Hidden"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/industries/${i.id}/edit`} className="font-semibold text-[var(--brand-primary)]">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
