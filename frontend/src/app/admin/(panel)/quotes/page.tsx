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
              <th className="px-4 py-3">Email delivery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.results.map((q) => (
              <tr key={q.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-mono text-xs text-muted-fg">{q.reference}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{q.full_name}</p>
                  <p className="text-xs text-muted-fg">
                    {q.company} {q.phone && `· ${q.phone}`}
                  </p>
                  <p className="text-xs text-muted-fg">
                    <a href={`mailto:${q.email}`} className="underline">{q.email}</a>
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-fg">
                  {q.items.map((item, idx) => (
                    <div key={idx}>
                      {item.product_url ? <a href={item.product_url} className="underline">{item.product_name}</a> : item.product_name} — {item.quantity} {item.unit}
                      {item.product_grade && <p className="text-xs">Grade: {item.product_grade}</p>}
                      {item.packaging && <p className="text-xs">Packaging: {item.packaging}</p>}
                      {item.notes && <p className="text-xs whitespace-pre-wrap">{item.notes}</p>}
                    </div>
                  ))}
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">Delivery and request details</summary>
                    <p>Delivery: {q.delivery_location || "Not provided"}</p>
                    <p>Required by: {q.required_by || "Not provided"}</p>
                    <p className="whitespace-pre-wrap">{q.message}</p>
                  </details>
                </td>
                <td className="px-4 py-3 text-muted-fg">{q.source}</td>
                <td className="px-4 py-3 text-muted-fg">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StatusSelect id={q.id} status={q.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-fg">
                  {q.delivery_status?.state === "delivered" ? "Sent to mail service" : q.delivery_status?.state === "pending" ? "Pending delivery" : "Historical: untracked"}
                  {q.delivery_status?.error && <p>{q.delivery_status.error}</p>}
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-fg">
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
