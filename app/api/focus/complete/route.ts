import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, getStore, jsonError, readJson } from "@/lib/api-session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJson(request);
  const duration = Number(body?.duration);
  const completedAt = typeof body?.completedAt === "string" ? new Date(body.completedAt) : new Date();

  if (!Number.isFinite(duration) || Number.isNaN(completedAt.getTime())) {
    return jsonError("Invalid focus session", 400);
  }

  try {
    const store = getStore();
    const session = await store.recordCompletedFocus(user.id, duration, completedAt);
    const profile = await store.getProfile(user.id, completedAt);
    return NextResponse.json({ session, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record focus session";
    return jsonError(message, 400);
  }
}
