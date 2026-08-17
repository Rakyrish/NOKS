import { FlaskConical } from "lucide-react";
import Link from "next/link";

import { adminApi } from "@/lib/admin/api";
import { brand } from "@/lib/site";

import { AdminNav } from "./admin-nav";
import { LogoutButton } from "./logout-button";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await adminApi.me();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 bg-navy-950 lg:flex lg:flex-col">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-6">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600">
            <FlaskConical className="size-5 text-white" />
          </span>
          <span>
            <span className="block font-display text-sm font-bold text-white">
              {brand.fullName}
            </span>
            <span className="block text-xs text-white/50">Control Panel</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-line bg-white">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <Link href="/admin" className="font-display text-sm font-bold text-ink lg:hidden">
              {brand.name} Admin
            </Link>
            <p className="hidden text-sm text-muted-fg lg:block">
              Signed in as <span className="font-semibold text-ink">{user.username}</span>
              {user.is_superuser && (
                <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  Superuser
                </span>
              )}
            </p>
            <LogoutButton />
          </div>
          <AdminNav variant="topbar" />
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
