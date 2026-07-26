import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { signValue, verifySignedValue } from "./auth";

const ADMIN_COOKIE = "pc_admin";

// TODO: set a strong ADMIN_PASSWORD in .env.local. This single-password MVP
// approach should be upgraded to proper user accounts before real traffic.
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "changeme";
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signValue("admin"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySignedValue(cookieStore.get(ADMIN_COOKIE)?.value) === "admin";
}

export async function requireAdmin(): Promise<void> {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");
}
