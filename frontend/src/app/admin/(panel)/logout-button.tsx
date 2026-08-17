"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { logoutAction } from "../actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px]
                 font-medium text-muted-fg transition-colors hover:border-rose-200 hover:bg-rose-50
                 hover:text-rose-600 disabled:opacity-50"
    >
      <LogOut className="size-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
