"use client";

import { useTransition } from "react";

import { Select } from "@/components/ui";

import { updateQuoteStatus } from "./actions";

const STATUSES = ["new", "reviewing", "quoted", "won", "lost"];

export function StatusSelect({ id, status }: { id: number; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("status", e.target.value);
        startTransition(() => updateQuoteStatus(id, formData));
      }}
      className="h-9 w-36 text-[13px]"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
