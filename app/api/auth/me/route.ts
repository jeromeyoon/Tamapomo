import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  return NextResponse.json({ user });
}
