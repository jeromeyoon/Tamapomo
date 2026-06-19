import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PomoChiApp } from "@/components/pomochi-app";

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
    vi.unstubAllGlobals();
  });

  it("shows the timer-first solo focus surface", () => {
    render(React.createElement(PomoChiApp));

    expect(screen.getByRole("heading", { name: /뽀모치/i })).toBeInTheDocument();
    expect(screen.getByText("오늘 0분")).toBeInTheDocument();
    expect(screen.getByText("0회 완료")).toBeInTheDocument();
    expect(screen.getByText("20 pt")).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25분" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "집중 시작" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "보상 받기" })).toBeDisabled();
  });

  it("counts down, pauses, resumes, then records exactly one finished session", () => {
    const { unmount } = render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "15분" }));
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
    expect(screen.getByText("타이머 완료. 이제 보상을 받을 수 있어요.")).toBeInTheDocument();

    const rewardButton = screen.getByRole("button", { name: "보상 받기" });
    expect(rewardButton).toBeEnabled();
    fireEvent.click(rewardButton);

    expect(screen.getByText("오늘 15분")).toBeInTheDocument();
    expect(screen.getByText("1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25 pt")).toBeInTheDocument();
    expect(screen.getByText("집중했더니 불꽃이가 반짝 뛰었어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "보상 받기" })).toBeDisabled();

    unmount();
    render(React.createElement(PomoChiApp));

    expect(screen.getByText("오늘 15분")).toBeInTheDocument();
    expect(screen.getByText("1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25 pt")).toBeInTheDocument();
  });

  it("does not award points before the timer is finished", () => {
    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "15분" }));
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "보상 받기" })).toBeDisabled();
    expect(screen.getByText("오늘 0분")).toBeInTheDocument();
    expect(screen.getByText("20 pt")).toBeInTheDocument();
  });

  it("lets users inspect the MVP-0 app shell tabs without leaving the page", () => {
    render(React.createElement(PomoChiApp));

    fireEvent.click(screen.getByRole("button", { name: "친구" }));
    expect(screen.getByText("친구 경쟁은 MVP-2에서 열립니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "캐릭터" }));
    expect(screen.getByText("현재는 기본 캐릭터 1종만 사용합니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "스토어" }));
    expect(screen.getByText("스토어는 첫 베타 전까지 제외합니다.")).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "me@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "secret123" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "가입" }));
    });

    expect(screen.getByText("me@example.com")).toBeInTheDocument();
    expect(screen.getByText("서버 저장")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "15분" }));
    fireEvent.click(screen.getByRole("button", { name: "집중 시작" }));
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "보상 받기" }));
    });

    expect(screen.getByText("오늘 15분")).toBeInTheDocument();
    expect(screen.getByText("1회 완료")).toBeInTheDocument();
    expect(screen.getByText("25 pt")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/focus/complete",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
