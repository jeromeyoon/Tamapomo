import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, getStore, jsonError } from "@/lib/api-session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const friends = await getStore().getFriends(user.id);
  return NextResponse.json({ friends });
}
