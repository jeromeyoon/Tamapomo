import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, getStore, jsonError } from "@/lib/api-session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json().catch(() => ({}))) as { now?: string };
  const now = body.now ? new Date(body.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    return jsonError("Invalid date", 400);
  }

  const result = await getStore().seedDemoFriends(user.id, now);
  return NextResponse.json(result);
}
