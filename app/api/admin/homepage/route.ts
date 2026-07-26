import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveHomepageSettings } from "@/lib/homepage";
import type { HomepageSettings } from "@/lib/types";

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings: HomepageSettings = await request.json();
  await saveHomepageSettings(settings);

  return NextResponse.json({ ok: true });
}
