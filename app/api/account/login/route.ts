import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerLogin } from "@/lib/customers";
import { signValue } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const customer = await verifyCustomerLogin(email || "", password || "");
  if (!customer) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("pc_session", signValue(customer.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
