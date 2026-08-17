import type { Metadata } from "next";

import { brand } from "@/lib/site";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: `Admin sign in — ${brand.fullName}`, robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="font-display text-lg font-bold text-white">{brand.fullName}</p>
          <p className="mt-1 text-sm text-white/50">Control Panel</p>
        </div>
        <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />
      </div>
    </div>
  );
}
