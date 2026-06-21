import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PomoChiApp } from "@/components/pomochi-app";

function selectFocusDuration(label = "15분") {
  fireEvent.click(screen.getByRole("button", { name: /집중 시간 변경/ }));
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("PomoChi MVP-0.5", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/auth/me")) {
          return Response.json({ user: null });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T09:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the timer-first solo focus surface", () => {
    render(React.createElement(PomoChiApp));

    expect(screen.getByRole("heading", { name: /뽀모치/i })).toBeInTheDocument();
    expect(screen.getByText("오늘 0분 · 0회 완료")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "집중 시간 변경, 현재 25분" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "집중 시작" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /보상 받기/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("이메일")).not.toBeInTheDocument();
    expect(screen.queryByText("오늘 합계")).not.toBeInTheDocument();
    expect(screen.queryByText("완료 세션")).not.toBeInTheDocument();
    expect(screen.queryByText("밥")).not.toBeInTheDocument();
    expect(screen.queryByText("기운")).not.toBeInTheDocument();
    expect(screen.queryByText("건강")).not.toBeInTheDocument();
    expect(screen.queryByText("청결")).not.toBeInTheDocument();
    expect(screen.queryByText("애정")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "씻기 4" })).not.toBeInTheDocument();
  });

  it("uses an iOS-inspired focused dashboard shell", () => {
    render(React.createElement(PomoChiApp));

    const dashboard = screen.getByRole("main", { name: "Pomochi focus dashboard" });
    expect(dashboard).toHaveClass("ios-app-shell");
    expect(dashboard.querySelector(".ios-device-shell")).not.toBeNull();
    expect(dashboard.querySelector(".ios-bottom-nav")).not.toBeNull();
  });

  it("marks the visible character with its current growth stage for styling", () => {
    localStorage.setItem(
      "pomochi:mvp0",
      JSON.stringify({
        points: 20,
        sessions: [{ id: "session-adult", duration: 4, completedAt: "2026-06-19T00:00:00.000Z" }]
      })
    );
    localStorage.setItem(
      "pomochi:care",
      JSON.stringify({ hunger: 5, energy: 5, health: 5, hatched: true, grade: "good" })
    );

    render(React.createElement(PomoChiApp));

    const character = screen.getByLabelText("콩냥이");
    expect(character).toHaveAttribute("data-stage", "adult");
    expect(character).toHaveAttribute("data-grade", "good");
    expect(screen.getByText("만개")).toBeInTheDocument();
    expect(character.querySelector(".bean-cat-creature")).toBeInTheDocument();
  });

  it("moves care actions out of the first screen and shows recommended care after reward", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    localStorage.setItem(
      "pomochi:care",
      JSON.stringify({
        hunger: 3,
        energy: 3,
        health: 3,
        cleanliness: 3,
        affection: 1,
        hatched: false,
        grade: null
      })
    );

    render(React.createElement(PomoChiApp));

    expect(screen.queryByRole("button", { name: "씻기 4" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "쓰다듬기 3" })).not.toBeInTheDocument();

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });
    fireEvent.click(screen.getByRole("button", { name: /보상 받기/ }));

    expect(screen.getByText("추천 돌보기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "약 주기 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "쓰다듬기 3" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "쓰다듬기 3" }));
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("콩냥이가 손길을 느끼고 좋아해요.")).toBeInTheDocument();
    const character = screen.getByLabelText(/정체불명의 알|콩냥이/);
    expect(character).toHaveAttribute("data-care", "pet");
    expect(character.querySelectorAll(".care-effect span")).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByLabelText(/정체불명의 알|콩냥이/)).not.toHaveAttribute("data-care");
  });

  it("randomly lowers one care state when the focus timer finishes", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.42).mockReturnValueOnce(0.05);
    localStorage.setItem(
      "pomochi:care",
      JSON.stringify({
        hunger: 3,
        energy: 3,
        health: 3,
        cleanliness: 3,
        affection: 3,
        hatched: true,
        grade: "normal"
      })
    );

    render(React.createElement(PomoChiApp));

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(screen.getByText("집중이 끝나자 콩냥이가 조금 더러워졌어요. 씻겨 주세요.")).toBeInTheDocument();
    expect(screen.getByLabelText("콩냥이")).toHaveAttribute("data-condition", "dirty");
  });

  it("counts down, pauses, resumes, then records exactly one finished session", () => {
    const { unmount } = render(React.createElement(PomoChiApp));

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("14:59")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("14:59")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시작" }));

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000 + 59 * 1000);
    });

    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText(/집중이 끝나자|타이머 완료/)).toBeInTheDocument();

    const rewardButton = screen.getByRole("button", { name: /보상 받기/ });
    expect(rewardButton).toBeEnabled();
    fireEvent.click(rewardButton);

    expect(screen.getByText("오늘 15분 · 1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText(/기분 \+1/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /보상 받기/ })).not.toBeInTheDocument();

    unmount();
    render(React.createElement(PomoChiApp));

    expect(screen.getByText("오늘 15분 · 1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("lowers mood and hunger when a focus session is interrupted often", () => {
    localStorage.setItem(
      "pomochi:care",
      JSON.stringify({
        hunger: 3,
        energy: 3,
        health: 3,
        cleanliness: 3,
        affection: 3,
        hatched: true,
        grade: "normal"
      })
    );

    render(React.createElement(PomoChiApp));

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    fireEvent.click(screen.getByRole("button", { name: "다시 시작" }));
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    fireEvent.click(screen.getByRole("button", { name: "다시 시작" }));

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(screen.getByText("집중이 자주 끊겨서 콩냥이의 기분이 내려가고 배고파졌어요.")).toBeInTheDocument();
  });

  it("does not award points before the timer is finished", () => {
    render(React.createElement(PomoChiApp));

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /보상 받기/ })).not.toBeInTheDocument();
    expect(screen.getByText("오늘 0분 · 0회 완료")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("keeps the first app shell focused on pomodoro tabs without cosmetics", () => {
    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "친구" }));
    expect(screen.getByText("로그인하면 친구 집중 경쟁을 볼 수 있어요.")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "캐릭터" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "스토어" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "꾸미기" })).not.toBeInTheDocument();
  });

  it("lets logged-out users preview rankings with virtual friends", async () => {
    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "친구" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "가상 친구 넣기" }));
    });

    expect(screen.getByText("테스트용 가상 친구 4명을 넣었어요.")).toBeInTheDocument();
    expect(screen.getByText("오늘의 집중 경쟁")).toBeInTheDocument();
    expect(screen.getByLabelText("minji 캐릭터")).toBeInTheDocument();
    expect(screen.getAllByText("minji").length).toBeGreaterThan(0);
    expect(screen.queryByText(/minji\.demo@pomochi\.local/)).not.toBeInTheDocument();
    expect(screen.getByText("75분")).toBeInTheDocument();
  });

  it("shows today's focus as continuous 24-hour intervals", () => {
    localStorage.setItem(
      "pomochi:mvp0",
      JSON.stringify({
        points: 20,
        sessions: [
          {
            id: "session-morning",
            duration: 25,
            startedAt: "2026-06-19T08:35:00+09:00",
            completedAt: "2026-06-19T09:00:00+09:00",
            focusScore: 92,
            pauseCount: 0,
            visibilityInterruptions: 0
          },
          {
            id: "session-night",
            duration: 50,
            startedAt: "2026-06-19T21:05:00+09:00",
            completedAt: "2026-06-19T21:55:00+09:00",
            focusScore: 85,
            pauseCount: 1,
            visibilityInterruptions: 0
          },
          {
            id: "session-yesterday",
            duration: 15,
            startedAt: "2026-06-18T10:10:00+09:00",
            completedAt: "2026-06-18T10:25:00+09:00",
            focusScore: 68,
            pauseCount: 2,
            visibilityInterruptions: 0
          }
        ]
      })
    );

    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "기록" }));

    expect(screen.getByRole("heading", { name: "오늘 24시간 집중 타임라인" })).toBeInTheDocument();
    expect(screen.getByLabelText("오늘 집중 세션 타임라인")).toBeInTheDocument();
    expect(screen.getByLabelText("08:35부터 09:00까지 25분 집중")).toBeInTheDocument();
    expect(screen.getAllByText("08:35-09:00").length).toBeGreaterThan(0);
    expect(screen.getByText("25분")).toBeInTheDocument();
    expect(screen.getByLabelText("21:05부터 21:55까지 50분 집중")).toBeInTheDocument();
    expect(screen.getAllByText("21:05-21:55").length).toBeGreaterThan(0);
    expect(screen.getByText("50분")).toBeInTheDocument();
    expect(screen.getByText("집중 구간").parentElement).toHaveTextContent("2개");
    expect(screen.getByText("가장 긴 집중 21:05-21:55")).toBeInTheDocument();
    expect(screen.queryByLabelText("오늘 시간대별 집중 분포")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "날짜별 집중 로그" })).not.toBeInTheDocument();
  });

  it("lets logged-in users add a friend and inspect focus rankings", async () => {
    let invited = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/me")) {
        return Response.json({ user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" } });
      }
      if (url.endsWith("/api/profile")) {
        return Response.json({
          profile: {
            user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
            character: { id: "char-1", userId: "user-1", name: "불꽃이", charType: "pyro", createdAt: "2026-06-19T00:00:00.000Z" },
            sessions: [],
            stats: { todayMinutes: 0, todayCount: 0, weekMinutes: 0, weekCount: 0 }
          }
        });
      }
      if (url.endsWith("/api/friends/invite")) {
        invited = true;
        return Response.json({ friend: { id: "user-2", email: "friend@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" } });
      }
      if (url.endsWith("/api/friends")) {
        return Response.json({ friends: invited ? [{ id: "user-2", email: "friend@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" }] : [] });
      }
      if (url.includes("/api/friends/focus-rankings")) {
        return Response.json({
          period: url.includes("period=week") ? "week" : "today",
          summary: "friend@example.com님이 오늘 25분 앞서 있어요.",
          rankings: [
            { userId: "user-2", email: "friend@example.com", minutes: 50, count: 1, rank: 1, isCurrentUser: false },
            { userId: "user-1", email: "me@example.com", minutes: 25, count: 1, rank: 2, isCurrentUser: true }
          ]
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(PomoChiApp));

    await act(async () => {});
    expect(screen.getByRole("button", { name: "프로필 열기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "친구" }));

    fireEvent.change(screen.getByLabelText("친구 이메일"), { target: { value: "friend@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "친구 추가" }));
    });

    expect(screen.getByText("오늘의 집중 경쟁")).toBeInTheDocument();
    expect(screen.getByText("friend님이 오늘 25분 앞서 있어요.")).toBeInTheDocument();
    expect(screen.getByLabelText("friend 캐릭터")).toBeInTheDocument();
    expect(screen.queryByText("friend@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("50분")).toBeInTheDocument();
  });

  it("lets logged-in users seed demo friends for checking rankings", async () => {
    let seeded = false;
    const demoFriends = [
      { id: "demo-1", email: "minji.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
      { id: "demo-2", email: "junseo.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
      { id: "demo-3", email: "harin.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
      { id: "demo-4", email: "doyun.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" }
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/me")) {
        return Response.json({ user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" } });
      }
      if (url.endsWith("/api/profile")) {
        return Response.json({
          profile: {
            user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
            character: { id: "char-1", userId: "user-1", name: "불꽃이", charType: "pyro", createdAt: "2026-06-19T00:00:00.000Z" },
            sessions: [],
            stats: { todayMinutes: 0, todayCount: 0, weekMinutes: 0, weekCount: 0 }
          }
        });
      }
      if (url.endsWith("/api/friends/demo-seed")) {
        seeded = true;
        return Response.json({ friends: demoFriends });
      }
      if (url.endsWith("/api/friends")) {
        return Response.json({ friends: seeded ? demoFriends : [] });
      }
      if (url.includes("/api/friends/focus-rankings")) {
        return Response.json({
          period: url.includes("period=week") ? "week" : "today",
          summary: seeded ? "minji.demo@pomochi.local님이 오늘 75분 앞서 있어요." : "오늘 첫 기록을 남겨 친구를 초대해 보세요.",
          rankings: seeded
            ? [
                { userId: "demo-1", email: "minji.demo@pomochi.local", minutes: 75, count: 3, rank: 1, isCurrentUser: false },
                { userId: "demo-2", email: "junseo.demo@pomochi.local", minutes: 50, count: 1, rank: 2, isCurrentUser: false },
                { userId: "user-1", email: "me@example.com", minutes: 0, count: 0, rank: 3, isCurrentUser: true },
                { userId: "demo-3", email: "harin.demo@pomochi.local", minutes: 15, count: 1, rank: 4, isCurrentUser: false },
                { userId: "demo-4", email: "doyun.demo@pomochi.local", minutes: 0, count: 0, rank: 5, isCurrentUser: false }
              ]
            : [{ userId: "user-1", email: "me@example.com", minutes: 0, count: 0, rank: 1, isCurrentUser: true }]
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(PomoChiApp));

    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "친구" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "가상 친구 넣기" }));
    });

    expect(screen.getByText("테스트용 가상 친구 4명을 넣었어요.")).toBeInTheDocument();
    expect(screen.getByLabelText("minji 캐릭터")).toBeInTheDocument();
    expect(screen.getAllByText("minji").length).toBeGreaterThan(0);
    expect(screen.queryByText(/minji\.demo@pomochi\.local/)).not.toBeInTheDocument();
    expect(screen.getByText("75분")).toBeInTheDocument();
  });

  it("signs up and stores finished sessions through the MVP-1 server profile", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/auth/me")) {
        return Response.json({ user: null });
      }
      if (url.endsWith("/api/auth/signup")) {
        return Response.json({
          user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
          profile: {
            user: { id: "user-1", email: "me@example.com", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
            character: { id: "char-1", userId: "user-1", name: "불꽃이", charType: "pyro", createdAt: "2026-06-19T00:00:00.000Z" },
            sessions: [],
            stats: { todayMinutes: 0, todayCount: 0, weekMinutes: 0, weekCount: 0 }
          }
        });
      }
      if (url.endsWith("/api/focus/complete")) {
        const requestBody = JSON.parse(String(init?.body));
        return Response.json({
          session: { id: "session-1", duration: requestBody.duration, completedAt: requestBody.completedAt },
          profile: {
            user: { id: "user-1", email: "me@example.com", points: 25, createdAt: "2026-06-19T00:00:00.000Z" },
            character: { id: "char-1", userId: "user-1", name: "불꽃이", charType: "pyro", createdAt: "2026-06-19T00:00:00.000Z" },
            sessions: [{ id: "session-1", duration: 15, completedAt: requestBody.completedAt }],
            stats: { todayMinutes: 15, todayCount: 1, weekMinutes: 15, weekCount: 1 }
          }
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "계정 열기" }));
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "me@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "secret123" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "가입" }));
    });

    expect(screen.getByText("me@example.com")).toBeInTheDocument();
    expect(screen.getByText("서버 저장")).toBeInTheDocument();

    selectFocusDuration();
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /보상 받기/ }));
    });

    expect(screen.getByText("오늘 15분 · 1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/focus/complete",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
