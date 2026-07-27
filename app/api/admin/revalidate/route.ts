import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateEverything } from "@/lib/revalidate";

/**
 * Safety net for the admin dashboard's "Publish All Changes" button: every
 * save already revalidates the specific pages it affects (see
 * lib/revalidate.ts), this just forces the whole site fresh in case one was
 * missed or the admin isn't sure.
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    revalidateEverything();
  } catch (error) {
    return adminErrorResponse(error, "Could not refresh the site.");
  }

  return NextResponse.json({ ok: true });
}
