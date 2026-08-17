/**
 * Server-only admin session storage. The DRF token lives in an httpOnly
 * cookie so it is never readable from client-side JS — every admin mutation
 * runs through a Server Action / Server Component that reads it here and
 * attaches it to the request itself (see lib/admin/api.ts).
 */
import "server-only";

import { cookies } from "next/headers";

const COOKIE_NAME = "noks_admin_token";

export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function setAdminToken(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminToken() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
