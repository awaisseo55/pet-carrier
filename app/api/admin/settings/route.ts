import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveSettings } from "@/lib/settings";
import { adminErrorResponse } from "@/lib/api-error";
import type { SiteSettings } from "@/lib/types";

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings: SiteSettings = await request.json();

  try {
    await saveSettings(settings);
  } catch (error) {
    return adminErrorResponse(error, "Could not save settings.");
  }

  return NextResponse.json({ ok: true });
}
