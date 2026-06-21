import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, getStore, jsonError } from "@/lib/api-session";
import type { RankingPeriod } from "@/lib/pomochi-store";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const periodParam = request.nextUrl.searchParams.get("period");
  const period: RankingPeriod = periodParam === "week" ? "week" : "today";
  const nowParam = request.nextUrl.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : new Date();

  if (Number.isNaN(now.getTime())) {
    return jsonError("Invalid date", 400);
  }

  const result = await getStore().getFocusRankings(user.id, period, now);
  return NextResponse.json(result);
}
