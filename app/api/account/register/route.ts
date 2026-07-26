import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCustomer, getCustomerByEmail } from "@/lib/customers";
import { signValue } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Please provide your name, a valid email and a password of at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await getCustomerByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account already exists with that email." }, { status: 409 });
  }

  const customer = await createCustomer(name, email, password);

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
