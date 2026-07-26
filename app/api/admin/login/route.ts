import { NextResponse } from "next/server";
import { verifyAdminPassword, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
