import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { adminApi } from "@/lib/admin/api";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-muted-fg">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-fg">{hint}</p>}
    </Card>
  );
}

const QUOTE_STATUS_VARIANT: Record<string, "neutral" | "brand" | "emerald" | "amber" | "rose"> = {
  new: "brand",
  reviewing: "amber",
  quoted: "brand",
  won: "emerald",
  lost: "rose",
};

export default async function AdminDashboardPage() {
  const metrics = await adminApi.dashboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-muted-fg">Live catalog, quotation and lead metrics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Products"
          value={metrics.products_total}
          hint={`${metrics.products_published} published · ${metrics.products_unpublished} draft`}
        />
        <StatCard label="Featured" value={metrics.products_featured} />
        <StatCard label="Missing SEO copy" value={metrics.products_missing_seo} />
        <StatCard
          label="Quotations (30d)"
          value={metrics.quotes_30d}
          hint={`${metrics.quotes_new} new · ${metrics.quotes_won} won`}
        />
        <StatCard label="Open inquiries" value={metrics.inquiries_open} hint={`${metrics.inquiries_total} total`} />
        <StatCard label="Published articles" value={metrics.posts_published} hint={`${metrics.posts_draft} draft`} />
        <StatCard label="AI conversations" value={metrics.conversations} hint={`${metrics.qualified_leads} qualified`} />
        <StatCard label="Total quotations" value={metrics.quotes_total} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Recent quotations</h2>
            <Link href="/admin/quotes" className="text-sm font-semibold text-[var(--brand-primary)]">
              View all
            </Link>
          </div>
          {metrics.recent_quotes.length === 0 ? (
            <p className="text-sm text-muted-fg">No quotation requests yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {metrics.recent_quotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{q.full_name || q.company}</p>
                    <p className="text-xs text-muted-fg">{q.reference}</p>
                  </div>
                  <Badge variant={QUOTE_STATUS_VARIANT[q.status] ?? "neutral"} size="sm">
                    {q.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Most requested products</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-[var(--brand-primary)]">
              Manage products
            </Link>
          </div>
          {metrics.top_products.length === 0 ? (
            <p className="text-sm text-muted-fg">No product activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {metrics.top_products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted-fg">
                    {p.quote_count} quotes · {p.view_count} views
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
