import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveHomepageSettings } from "@/lib/homepage";
import { adminErrorResponse } from "@/lib/api-error";
import type { HomepageSettings } from "@/lib/types";

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings: HomepageSettings = await request.json();

  try {
    await saveHomepageSettings(settings);
  } catch (error) {
    return adminErrorResponse(error, "Could not save homepage settings.");
  }

  return NextResponse.json({ ok: true });
}
