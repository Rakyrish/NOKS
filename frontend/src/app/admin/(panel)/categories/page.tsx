import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await adminApi.categories.list();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">New category</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                <td className="px-4 py-3 text-muted-fg">
                  {categories.find((p) => p.id === c.parent)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-fg">{c.product_count}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.is_published ? "emerald" : "neutral"} size="sm">
                    {c.is_published ? "Published" : "Hidden"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/categories/${c.id}/edit`} className="font-semibold text-[var(--brand-primary)]">
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
