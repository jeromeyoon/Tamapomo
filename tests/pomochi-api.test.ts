import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonRequest(url: string, body: unknown, cookie?: string) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });
}

function getRequest(url: string, cookie?: string) {
  return new NextRequest(url, {
    method: "GET",
    headers: cookie ? { cookie } : undefined
  });
}

function cookieHeader(response: Response) {
  const value = response.headers.get("set-cookie");
  if (!value) {
    throw new Error("Missing set-cookie header");
  }
  return value.split(";")[0];
}

describe("PomoChi MVP-1 API", () => {
  let dir: string;

  beforeEach(() => {
    vi.resetModules();
    dir = mkdtempSync(join(tmpdir(), "pomochi-api-"));
    process.env.POMOCHI_DB_FILE = join(dir, "db.json");
  });

  afterEach(() => {
    delete process.env.POMOCHI_DB_FILE;
    rmSync(dir, { recursive: true, force: true });
  });

  it("signs up, returns a session cookie, and exposes the profile", async () => {
    const { POST: signup } = await import("@/app/api/auth/signup/route");
    const { GET: profile } = await import("@/app/api/profile/route");

    const signupResponse = await signup(jsonRequest("http://test/api/auth/signup", {
      email: "me@example.com",
      password: "secret123"
    }));
    const cookie = cookieHeader(signupResponse);

    expect(signupResponse.status).toBe(201);
    expect(cookie).toContain("pomochi_session=");

    const profileResponse = await profile(getRequest("http://test/api/profile", cookie));
    const body = await profileResponse.json();

    expect(profileResponse.status).toBe(200);
    expect(body.profile.user.email).toBe("me@example.com");
    expect(body.profile.character).toMatchObject({ name: "불꽃이", charType: "pyro" });
    expect(body.profile.user.points).toBe(20);
  });

  it("logs in an existing user and stores completed focus sessions on the server", async () => {
    const { POST: signup } = await import("@/app/api/auth/signup/route");
    const { POST: login } = await import("@/app/api/auth/login/route");
    const { POST: completeFocus } = await import("@/app/api/focus/complete/route");

    await signup(jsonRequest("http://test/api/auth/signup", {
      email: "me@example.com",
      password: "secret123"
    }));

    const loginResponse = await login(jsonRequest("http://test/api/auth/login", {
      email: "me@example.com",
      password: "secret123"
    }));
    const cookie = cookieHeader(loginResponse);

    const completeResponse = await completeFocus(jsonRequest("http://test/api/focus/complete", {
      duration: 25,
      completedAt: "2026-06-19T09:00:00+09:00"
    }, cookie));
    const body = await completeResponse.json();

    expect(completeResponse.status).toBe(200);
    expect(body.profile.user.points).toBe(25);
    expect(body.profile.stats.todayMinutes).toBe(25);
    expect(body.profile.stats.todayCount).toBe(1);
    expect(body.profile.sessions[0]).toMatchObject({ duration: 25 });
  });

  it("rejects profile and focus writes without a session", async () => {
    const { GET: profile } = await import("@/app/api/profile/route");
    const { POST: completeFocus } = await import("@/app/api/focus/complete/route");

    const profileResponse = await profile(getRequest("http://test/api/profile"));
    const completeResponse = await completeFocus(jsonRequest("http://test/api/focus/complete", {
      duration: 25
    }));

    expect(profileResponse.status).toBe(401);
    expect(completeResponse.status).toBe(401);
  });

  it("adds a friend and returns focus rankings", async () => {
    const { POST: signup } = await import("@/app/api/auth/signup/route");
    const { POST: inviteFriend } = await import("@/app/api/friends/invite/route");
    const { GET: rankings } = await import("@/app/api/friends/focus-rankings/route");
    const { POST: completeFocus } = await import("@/app/api/focus/complete/route");

    const meResponse = await signup(jsonRequest("http://test/api/auth/signup", {
      email: "me@example.com",
      password: "secret123"
    }));
    const meCookie = cookieHeader(meResponse);

    const friendResponse = await signup(jsonRequest("http://test/api/auth/signup", {
      email: "friend@example.com",
      password: "secret123"
    }));
    const friendCookie = cookieHeader(friendResponse);

    const inviteResponse = await inviteFriend(jsonRequest("http://test/api/friends/invite", {
      email: "friend@example.com"
    }, meCookie));

    await completeFocus(jsonRequest("http://test/api/focus/complete", {
      duration: 25,
      completedAt: "2026-06-19T09:00:00+09:00"
    }, meCookie));
    await completeFocus(jsonRequest("http://test/api/focus/complete", {
      duration: 50,
      completedAt: "2026-06-19T10:00:00+09:00"
    }, friendCookie));

    const rankingResponse = await rankings(getRequest(
      "http://test/api/friends/focus-rankings?period=today&now=2026-06-19T12:00:00%2B09:00",
      meCookie
    ));
    const body = await rankingResponse.json();

    expect(inviteResponse.status).toBe(200);
    expect(rankingResponse.status).toBe(200);
    expect(body.rankings.map((entry: { email: string; minutes: number }) => [entry.email, entry.minutes])).toEqual([
      ["friend@example.com", 50],
      ["me@example.com", 25]
    ]);
    expect(body.summary).toBe("friend@example.com님이 오늘 25분 앞서 있어요.");
  });

  it("seeds demo friends for the signed-in user", async () => {
    const { POST: signup } = await import("@/app/api/auth/signup/route");
    const { POST: seedDemoFriends } = await import("@/app/api/friends/demo-seed/route");
    const { GET: friends } = await import("@/app/api/friends/route");
    const { GET: rankings } = await import("@/app/api/friends/focus-rankings/route");
    const { POST: completeFocus } = await import("@/app/api/focus/complete/route");

    const meResponse = await signup(jsonRequest("http://test/api/auth/signup", {
      email: "me@example.com",
      password: "secret123"
    }));
    const meCookie = cookieHeader(meResponse);

    await completeFocus(jsonRequest("http://test/api/focus/complete", {
      duration: 25,
      completedAt: "2026-06-19T09:00:00+09:00"
    }, meCookie));

    const seedResponse = await seedDemoFriends(jsonRequest("http://test/api/friends/demo-seed", {
      now: "2026-06-19T12:00:00+09:00"
    }, meCookie));
    const seedBody = await seedResponse.json();

    const friendsResponse = await friends(getRequest("http://test/api/friends", meCookie));
    const friendsBody = await friendsResponse.json();
    const rankingResponse = await rankings(getRequest(
      "http://test/api/friends/focus-rankings?period=today&now=2026-06-19T12:00:00%2B09:00",
      meCookie
    ));
    const rankingBody = await rankingResponse.json();

    expect(seedResponse.status).toBe(200);
    expect(seedBody.friends).toHaveLength(4);
    expect(friendsBody.friends.map((friend: { email: string }) => friend.email)).toContain(
      "minji.demo@pomochi.local"
    );
    expect(rankingBody.rankings.map((entry: { email: string; minutes: number }) => [entry.email, entry.minutes])).toEqual([
      ["minji.demo@pomochi.local", 75],
      ["junseo.demo@pomochi.local", 50],
      ["me@example.com", 25],
      ["harin.demo@pomochi.local", 15],
      ["doyun.demo@pomochi.local", 0]
    ]);
  });
});
