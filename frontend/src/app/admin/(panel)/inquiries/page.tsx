import type { Metadata } from "next";

import { adminApi } from "@/lib/admin/api";

import { HandledToggle } from "./handled-toggle";

export const metadata: Metadata = { title: "Inquiries" };

export default async function AdminInquiriesPage() {
  const data = await adminApi.inquiries.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Customer inquiries</h1>
        <p className="mt-1 text-sm text-muted-fg">{data.count} total</p>
      </div>

      <div className="space-y-3">
        {data.results.map((inq) => (
          <div key={inq.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {inq.full_name} <span className="font-normal text-muted-fg">— {inq.topic}</span>
                </p>
                <p className="text-xs text-muted-fg">
                  {inq.email} {inq.phone && `· ${inq.phone}`} {inq.company && `· ${inq.company}`}
                </p>
              </div>
              <HandledToggle id={inq.id} isHandled={inq.is_handled} />
            </div>
            {inq.subject && <p className="mt-3 text-sm font-semibold text-ink">{inq.subject}</p>}
            <p className="mt-1 text-sm text-muted-fg">{inq.message}</p>
            <p className="mt-3 text-xs text-muted-fg">{new Date(inq.created_at).toLocaleString()}</p>
          </div>
        ))}
        {data.results.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted-fg">
            No inquiries yet.
          </p>
        )}
      </div>
    </div>
  );
}
