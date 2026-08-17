import type { Metadata } from "next";

import { adminApi } from "@/lib/admin/api";

import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Quotations" };

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;
  const data = await adminApi.quotes.list({ status: status || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Quotation requests</h1>
        <p className="mt-1 text-sm text-muted-fg">{data.count} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.results.map((q) => (
              <tr key={q.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-mono text-xs text-muted-fg">{q.reference}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{q.full_name}</p>
                  <p className="text-xs text-muted-fg">
                    {q.company || q.email} {q.phone && `· ${q.phone}`}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-fg">
                  {q.items.map((item, idx) => (
                    <div key={idx}>
                      {item.product_name} — {item.quantity} {item.unit}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 text-muted-fg">{q.source}</td>
                <td className="px-4 py-3 text-muted-fg">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StatusSelect id={q.id} status={q.status} />
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-fg">
                  No quotation requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
