import { NextResponse } from "next/server";

/** Turns a thrown error from an admin route handler into a JSON response with the real message, instead of Next's generic 500 body, so the admin UI can show what actually failed (e.g. Blob misconfiguration) rather than a blanket "Could not save changes". */
export function adminErrorResponse(error: unknown, fallback = "Something went wrong."): NextResponse {
  console.error(error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
