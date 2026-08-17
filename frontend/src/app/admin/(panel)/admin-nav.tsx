"use client";

import {
  Boxes,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  ListTree,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: FlaskConical },
  { href: "/admin/categories", label: "Categories", icon: ListTree },
  { href: "/admin/industries", label: "Industries", icon: Boxes },
  { href: "/admin/quotes", label: "Quotations", icon: Sparkles },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
];

export function AdminNav({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "topbar") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {LINKS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
              isActive(href, exact)
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-muted-fg hover:text-ink",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 p-4">
      {LINKS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
            isActive(href, exact)
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
