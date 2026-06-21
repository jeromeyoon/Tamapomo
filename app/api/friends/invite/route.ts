import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, getStore, jsonError, readJson } from "@/lib/api-session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email : "";

  try {
    const friend = await getStore().addFriendByEmail(user.id, email);
    return NextResponse.json({ friend });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add friend";
    return jsonError(message, 400);
  }
}
