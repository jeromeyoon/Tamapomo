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
  const startedAt = typeof body?.startedAt === "string" ? new Date(body.startedAt) : undefined;
  const pauseCount = Number(body?.pauseCount ?? 0);
  const visibilityInterruptions = Number(body?.visibilityInterruptions ?? 0);
  const focusScore = Number(body?.focusScore ?? 100);

  if (
    !Number.isFinite(duration) ||
    Number.isNaN(completedAt.getTime()) ||
    (startedAt && Number.isNaN(startedAt.getTime()))
  ) {
    return jsonError("Invalid focus session", 400);
  }

  try {
    const store = getStore();
    const session = await store.recordCompletedFocus(user.id, duration, completedAt, {
      startedAt,
      pauseCount: Number.isFinite(pauseCount) ? pauseCount : 0,
      visibilityInterruptions: Number.isFinite(visibilityInterruptions) ? visibilityInterruptions : 0,
      focusScore: Number.isFinite(focusScore) ? focusScore : 100
    });
    const profile = await store.getProfile(user.id, completedAt);
    return NextResponse.json({ session, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record focus session";
    return jsonError(message, 400);
  }
}
