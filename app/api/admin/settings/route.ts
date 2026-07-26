import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings: SiteSettings = await request.json();
  await saveSettings(settings);

  return NextResponse.json({ ok: true });
}
