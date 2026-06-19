import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createPomochiStore } from "@/lib/pomochi-store";

describe("PomoChi MVP-1 server store", () => {
  let dir: string;
  let dbFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pomochi-store-"));
    dbFile = join(dir, "db.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("signs up a user with a default character and starting points", async () => {
    const store = createPomochiStore(dbFile);

    const account = await store.signup("Study@Example.com", "secret123");
    const profile = await store.getProfile(account.user.id, new Date("2026-06-19T12:00:00+09:00"));

    expect(account.user.email).toBe("study@example.com");
    expect(profile.user.points).toBe(20);
    expect(profile.character).toMatchObject({ name: "불꽃이", charType: "pyro" });
    expect(profile.stats).toMatchObject({
      todayMinutes: 0,
      todayCount: 0,
      weekMinutes: 0,
      weekCount: 0
    });
  });

  it("logs in with the saved password and rejects a wrong password", async () => {
    const store = createPomochiStore(dbFile);
    await store.signup("me@example.com", "secret123");

    await expect(store.login("me@example.com", "bad-password")).rejects.toThrow("Invalid credentials");
    await expect(store.login("me@example.com", "secret123")).resolves.toMatchObject({
      email: "me@example.com"
    });
  });

  it("persists completed focus sessions and aggregates today and week stats", async () => {
    const store = createPomochiStore(dbFile);
    const { user } = await store.signup("me@example.com", "secret123");

    await store.recordCompletedFocus(user.id, 15, new Date("2026-06-19T09:00:00+09:00"));
    await store.recordCompletedFocus(user.id, 25, new Date("2026-06-19T10:00:00+09:00"));
    await store.recordCompletedFocus(user.id, 50, new Date("2026-06-18T10:00:00+09:00"));

    const profile = await store.getProfile(user.id, new Date("2026-06-19T12:00:00+09:00"));

    expect(profile.user.points).toBe(35);
    expect(profile.stats.todayMinutes).toBe(40);
    expect(profile.stats.todayCount).toBe(2);
    expect(profile.stats.weekMinutes).toBe(90);
    expect(profile.stats.weekCount).toBe(3);
    expect(profile.sessions.map((session) => session.duration)).toEqual([25, 15, 50]);
  });

  it("keeps users isolated from each other's sessions and points", async () => {
    const store = createPomochiStore(dbFile);
    const first = await store.signup("first@example.com", "secret123");
    const second = await store.signup("second@example.com", "secret123");

    await store.recordCompletedFocus(first.user.id, 50, new Date("2026-06-19T09:00:00+09:00"));

    const firstProfile = await store.getProfile(first.user.id, new Date("2026-06-19T12:00:00+09:00"));
    const secondProfile = await store.getProfile(second.user.id, new Date("2026-06-19T12:00:00+09:00"));

    expect(firstProfile.user.points).toBe(25);
    expect(firstProfile.stats.todayMinutes).toBe(50);
    expect(secondProfile.user.points).toBe(20);
    expect(secondProfile.stats.todayMinutes).toBe(0);
  });
});
