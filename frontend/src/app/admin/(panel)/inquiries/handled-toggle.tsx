"use client";

import { useTransition } from "react";

import { toggleHandled } from "./actions";

export function HandledToggle({ id, isHandled }: { id: number; isHandled: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleHandled(id, !isHandled))}
      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
        isHandled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      } disabled:opacity-50`}
    >
      {isHandled ? "Handled" : "Mark handled"}
    </button>
  );
}
