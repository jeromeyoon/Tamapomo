import { NextRequest } from "next/server";

import { getStore, jsonError, readJson, responseWithSession } from "@/lib/api-session";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    const store = getStore();
    const user = await store.login(email, password);
    const session = await store.createSession(user.id);
    const profile = await store.getProfile(user.id);

    return responseWithSession({ user, profile }, 200, session.token, session.expiresAt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return jsonError(message, 401);
  }
}
