import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Input, Select } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q = "", status = "", page = "1" } = await searchParams;
  const data = await adminApi.products.list({
    q: q || undefined,
    status: status || undefined,
    page: Number(page) || 1,
    page_size: 24,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted-fg">{data.count} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/products">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, CAS, formula…"
          className="max-w-sm"
        />
        <Select name="status" defaultValue={status} className="max-w-48">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">CAS</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.results.map((p) => (
              <tr key={p.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted-fg">{p.sku}</p>
                </td>
                <td className="px-4 py-3 text-muted-fg">{p.category_name}</td>
                <td className="px-4 py-3 text-muted-fg">{p.cas_number || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.is_published ? "emerald" : "neutral"} size="sm">
                    {p.is_published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {p.is_featured && <Badge variant="brand" size="sm">Featured</Badge>}
                    {p.ai_generated && <Badge variant="outline" size="sm">AI draft</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-semibold text-[var(--brand-primary)]"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-fg">
                  No products match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.num_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.num_pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/products?${new URLSearchParams({ q, status, page: String(n) })}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                n === data.page ? "bg-brand-600 text-white" : "text-muted-fg hover:bg-surface-muted"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
