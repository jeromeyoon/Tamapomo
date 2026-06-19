import { NextRequest, NextResponse } from "next/server";

import { createPomochiStore } from "@/lib/pomochi-store";

export const SESSION_COOKIE = "pomochi_session";

export function getStore() {
  return createPomochiStore();
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function responseWithSession(body: unknown, status: number, token: string, expiresAt: string) {
  const response = NextResponse.json(body, { status });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt)
  });
  return response;
}

export async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return getStore().getUserBySessionToken(token);
}

export async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
