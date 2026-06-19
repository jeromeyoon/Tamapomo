import { NextRequest } from "next/server";

import { getStore, jsonError, readJson, responseWithSession } from "@/lib/api-session";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    const store = getStore();
    const account = await store.signup(email, password);
    const session = await store.createSession(account.user.id);
    const profile = await store.getProfile(account.user.id);

    return responseWithSession({ user: account.user, profile }, 201, session.token, session.expiresAt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    const status = message === "Email already exists" ? 409 : 400;
    return jsonError(message, status);
  }
}
