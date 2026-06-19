"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Flame,
  Home,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  UserRoundPlus
} from "lucide-react";

type TabId = "home" | "friends" | "character" | "store";
type TimerState = "idle" | "running" | "paused" | "finished";

type FocusSession = {
  id: string;
  duration: number;
  completedAt: string;
};

type ServerUser = {
  id: string;
  email: string;
  points: number;
  createdAt: string;
};

type ServerProfile = {
  user: ServerUser;
  character: {
    id: string;
    userId: string;
    name: string;
    charType: string;
    createdAt: string;
  };
  sessions: FocusSession[];
  stats: {
    todayMinutes: number;
    todayCount: number;
    weekMinutes: number;
    weekCount: number;
  };
};

type StoredState = {
  points: number;
  sessions: FocusSession[];
};

const STORAGE_KEY = "pomochi:mvp0";
const DEFAULT_POINTS = 20;
const DURATIONS = [15, 25, 50];

const tabs: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "friends", label: "친구", icon: UserRoundPlus },
  { id: "character", label: "캐릭터", icon: Star },
  { id: "store", label: "스토어", icon: ShoppingBag }
];

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadStoredState(): StoredState {
  if (typeof window === "undefined") {
    return { points: DEFAULT_POINTS, sessions: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { points: DEFAULT_POINTS, sessions: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      points: Number.isFinite(parsed.points) ? Number(parsed.points) : DEFAULT_POINTS,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch {
    return { points: DEFAULT_POINTS, sessions: [] };
  }
}

function saveStoredState(state: StoredState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PomoChiApp() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [duration, setDuration] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reaction, setReaction] = useState("아직 오늘의 집중을 기다리고 있어요.");
  const [currentUser, setCurrentUser] = useState<ServerUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("로그인하면 기록이 서버에 저장됩니다.");
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    const stored = loadStoredState();
    setPoints(stored.points);
    setSessions(stored.sessions);
    setLoaded(true);

    void loadExistingSession();
  }, []);

  useEffect(() => {
    if (loaded && !currentUser) {
      saveStoredState({ points, sessions });
    }
  }, [currentUser, loaded, points, sessions]);

  useEffect(() => {
    if (timerState !== "running") {
      return;
    }

    const tick = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [timerState]);

  useEffect(() => {
    if (timerState === "running" && remainingSeconds === 0) {
      setTimerState("finished");
      setReaction("타이머 완료. 이제 보상을 받을 수 있어요.");
    }
  }, [remainingSeconds, timerState]);

  const todaySessions = useMemo(() => {
    const today = getLocalDateKey();
    return sessions.filter((session) => getLocalDateKey(new Date(session.completedAt)) === today);
  }, [sessions]);

  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.duration, 0);
  const timerText = formatSeconds(remainingSeconds);
  const isTimerLocked = timerState === "running" || timerState === "paused";
  const canClaimReward = timerState === "finished" && !rewardClaimed;
  const isServerMode = Boolean(currentUser);

  const applyServerProfile = (profile: ServerProfile) => {
    setCurrentUser(profile.user);
    setPoints(profile.user.points);
    setSessions(profile.sessions);
    setAuthMessage("서버 저장");
  };

  const loadExistingSession = async () => {
    try {
      const meResponse = await fetch("/api/auth/me");
      if (!meResponse.ok) {
        return;
      }

      const meBody = (await meResponse.json()) as { user: ServerUser | null };
      if (!meBody.user) {
        return;
      }

      const profileResponse = await fetch("/api/profile");
      if (!profileResponse.ok) {
        return;
      }

      const profileBody = (await profileResponse.json()) as { profile: ServerProfile };
      applyServerProfile(profileBody.profile);
    } catch {
      setAuthMessage("오프라인 기록 모드");
    }
  };

  const submitAuth = async (mode: "signup" | "login") => {
    setAuthBusy(true);
    setAuthMessage(mode === "signup" ? "가입 중..." : "로그인 중...");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = (await response.json()) as { profile?: ServerProfile; error?: string };

      if (!response.ok || !body.profile) {
        throw new Error(body.error || "계정 처리 실패");
      }

      applyServerProfile(body.profile);
      setPassword("");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "계정 처리 실패");
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setCurrentUser(null);
      const stored = loadStoredState();
      setPoints(stored.points);
      setSessions(stored.sessions);
      setAuthMessage("로그인하면 기록이 서버에 저장됩니다.");
      setAuthBusy(false);
    }
  };

  const selectDuration = (nextDuration: number) => {
    if (isTimerLocked) {
      return;
    }

    setDuration(nextDuration);
    setRemainingSeconds(nextDuration * 60);
    setTimerState("idle");
    setRewardClaimed(false);
  };

  const startFocus = () => {
    if (timerState === "finished") {
      return;
    }

    setTimerState("running");
    setRewardClaimed(false);
    setReaction("집중 중이에요. 불꽃이가 조용히 기다리고 있어요.");
  };

  const pauseFocus = () => {
    setTimerState("paused");
    setReaction("잠깐 멈췄어요. 다시 시작하면 이어서 진행됩니다.");
  };

  const resetTimer = () => {
    setRemainingSeconds(duration * 60);
    setTimerState("idle");
    setRewardClaimed(false);
    setReaction("타이머를 다시 준비했어요.");
  };

  const claimReward = async () => {
    if (!canClaimReward) {
      return;
    }

    const completedAt = new Date().toISOString();

    if (isServerMode) {
      try {
        const response = await fetch("/api/focus/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ duration, completedAt })
        });
        const body = (await response.json()) as { profile?: ServerProfile; error?: string };

        if (!response.ok || !body.profile) {
          throw new Error(body.error || "서버 저장 실패");
        }

        applyServerProfile(body.profile);
        setReaction("집중했더니 불꽃이가 반짝 뛰었어요.");
        setRewardClaimed(true);
        setTimerState("idle");
        setRemainingSeconds(duration * 60);
        return;
      } catch (error) {
        setReaction(error instanceof Error ? error.message : "서버 저장 실패");
        return;
      }
    }

    const nextSession: FocusSession = {
      id: crypto.randomUUID(),
      duration,
      completedAt
    };

    setSessions((current) => [nextSession, ...current]);
    setPoints((current) => current + 5);
    setReaction("집중했더니 불꽃이가 반짝 뛰었어요.");
    setRewardClaimed(true);
    setTimerState("idle");
    setRemainingSeconds(duration * 60);
  };

  const timerStatusLabel =
    timerState === "running"
      ? "집중 중"
      : timerState === "paused"
        ? "일시정지"
        : timerState === "finished"
          ? "완료"
          : `${duration}분 세션`;

  return (
    <main className="flex min-h-screen w-full items-start justify-center px-4 py-6 text-[var(--ink)] sm:items-center sm:py-10">
      <div className="egg-device w-full max-w-[27rem] px-5 pb-6 pt-8 sm:px-7 sm:pt-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--accent)]">
            MVP-0.5 Timer Proof
          </p>
          <h1 className="text-3xl font-black tracking-tight">뽀모치</h1>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs font-extrabold">
            <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              오늘 {todayMinutes}분
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              {todaySessions.length}회 완료
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[var(--sun)] px-3 py-1.5 text-[var(--ink)] shadow-sm">
              <Star aria-hidden="true" size={13} strokeWidth={2.6} />
              {points} pt
            </span>
          </div>

          <div className="mt-2 w-full rounded-2xl bg-white/65 p-2 text-xs font-extrabold shadow-sm">
            {currentUser ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>{currentUser.email}</span>
                <span className="rounded-full bg-[var(--mint)] px-2 py-1 text-[var(--ink)]">
                  {authMessage}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  disabled={authBusy}
                  className="rounded-full bg-white px-3 py-1 text-[var(--muted)] transition active:scale-95 disabled:opacity-60"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <form
                className="grid grid-cols-2 gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitAuth("signup");
                }}
              >
                <label className="sr-only" htmlFor="pomochi-email">
                  이메일
                </label>
                <input
                  id="pomochi-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email"
                  className="min-w-0 rounded-full border border-white bg-white/85 px-3 py-2 text-[12px] font-bold outline-none"
                />
                <label className="sr-only" htmlFor="pomochi-password">
                  비밀번호
                </label>
                <input
                  id="pomochi-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password"
                  className="min-w-0 rounded-full border border-white bg-white/85 px-3 py-2 text-[12px] font-bold outline-none"
                />
                <button
                  type="submit"
                  disabled={authBusy}
                  className="rounded-full bg-[var(--mint)] px-3 py-2 text-[var(--ink)] transition active:scale-95 disabled:opacity-60"
                >
                  가입
                </button>
                <button
                  type="button"
                  onClick={() => submitAuth("login")}
                  disabled={authBusy}
                  className="rounded-full bg-white px-3 py-2 text-[var(--muted)] transition active:scale-95 disabled:opacity-60"
                >
                  로그인
                </button>
                <span className="col-span-2 text-[11px] text-[var(--muted)]">{authMessage}</span>
              </form>
            )}
          </div>
        </header>

        {activeTab === "home" ? (
          <>
            <section className="egg-screen relative mt-5 flex flex-col items-center gap-4 px-5 py-6">
              <div className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[var(--muted)]">
                불꽃이
              </div>

              <div className="character-wrap" aria-label="기본 캐릭터 불꽃이">
                <div className="character-flame">
                  <Flame aria-hidden="true" size={64} strokeWidth={1.9} />
                </div>
              </div>

              <p className="max-w-[18rem] rounded-2xl bg-white/90 px-4 py-2.5 text-center text-sm font-bold leading-relaxed text-[var(--ink)] shadow-sm">
                {reaction}
              </p>
            </section>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {DURATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectDuration(option)}
                  aria-pressed={duration === option}
                  disabled={isTimerLocked}
                  className={`h-12 rounded-2xl border-2 text-sm font-black transition active:scale-95 ${
                    duration === option
                      ? "border-white bg-[var(--mint)] text-[var(--ink)] shadow-[0_8px_18px_rgba(111,201,173,0.45)]"
                      : "border-white bg-white/70 text-[var(--muted)] hover:bg-white"
                  } disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100`}
                >
                  {option}분
                </button>
              ))}
            </div>

            <div className="mx-auto my-6 flex aspect-square w-44 items-center justify-center rounded-full border-[10px] border-[var(--mint)] bg-white/80 shadow-[inset_0_4px_14px_rgba(111,201,173,0.25)]">
              <div className="text-center">
                <div className="text-5xl font-black tracking-tight">{timerText}</div>
                <div className="mt-1 text-xs font-extrabold text-[var(--muted)]">
                  {timerStatusLabel}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              {timerState === "running" ? (
                <button
                  type="button"
                  onClick={pauseFocus}
                  className="flex h-14 items-center justify-center gap-2 rounded-full border-4 border-white bg-[var(--peach)] text-base font-black text-[var(--ink)] shadow-[0_12px_24px_rgba(255,154,118,0.4)] transition active:scale-95"
                >
                  <Pause aria-hidden="true" size={20} strokeWidth={2.6} />
                  일시정지
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startFocus}
                  disabled={timerState === "finished"}
                  className="flex h-14 items-center justify-center gap-2 rounded-full border-4 border-white bg-[var(--mint)] text-base font-black text-[var(--ink)] shadow-[0_12px_24px_rgba(111,201,173,0.45)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                >
                  <Play aria-hidden="true" size={20} strokeWidth={2.6} />
                  {timerState === "paused" ? "다시 시작" : "집중 시작"}
                </button>
              )}

              <button
                type="button"
                onClick={resetTimer}
                aria-label="타이머 초기화"
                className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white/80 text-[var(--ink)] shadow-sm transition active:scale-95"
              >
                <RotateCcw aria-hidden="true" size={20} strokeWidth={2.6} />
              </button>
            </div>

            <button
              type="button"
              onClick={claimReward}
              disabled={!canClaimReward}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full border-4 border-white bg-[var(--accent)] text-base font-black text-[var(--ink)] shadow-[0_12px_24px_rgba(255,154,118,0.45)] transition active:scale-95 disabled:cursor-not-allowed disabled:border-white disabled:bg-white/70 disabled:text-[var(--muted)] disabled:shadow-none disabled:active:scale-100"
            >
              <Sparkles aria-hidden="true" size={20} strokeWidth={2.6} />
              보상 받기
            </button>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 p-3 text-center">
                <dt className="text-xs font-extrabold text-[var(--muted)]">오늘 합계</dt>
                <dd className="mt-1 text-xl font-black">{todayMinutes}분</dd>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center">
                <dt className="text-xs font-extrabold text-[var(--muted)]">보상</dt>
                <dd className="mt-1 text-xl font-black">+5 pt</dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="egg-screen mt-5 px-5 py-8">
            {activeTab === "friends" && (
              <PlaceholderPanel
                icon={Trophy}
                title="친구"
                text="친구 경쟁은 MVP-2에서 열립니다."
                detail="MVP0에서는 솔로 집중 기록이 먼저 안정적으로 남는지 확인합니다."
              />
            )}

            {activeTab === "character" && (
              <PlaceholderPanel
                icon={BarChart3}
                title="캐릭터"
                text="현재는 기본 캐릭터 1종만 사용합니다."
                detail="진화, 돌봄, 계보는 기록 루프가 검증된 뒤 단계적으로 추가합니다."
              />
            )}

            {activeTab === "store" && (
              <PlaceholderPanel
                icon={ShoppingBag}
                title="스토어"
                text="스토어는 첫 베타 전까지 제외합니다."
                detail="포인트는 지금은 누적만 하며, 사용처는 핵심 루프 이후 설계합니다."
              />
            )}
          </div>
        )}

        <nav aria-label="주요 화면" className="mt-6 grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[11px] font-extrabold transition active:scale-95 ${
                  active
                    ? "border-white bg-[var(--accent)] text-[var(--ink)] shadow-[0_8px_18px_rgba(255,154,118,0.4)]"
                    : "border-white bg-white/70 text-[var(--muted)] hover:bg-white"
                }`}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={2.4} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}

function PlaceholderPanel({
  icon: Icon,
  title,
  text,
  detail
}: {
  icon: typeof Home;
  title: string;
  text: string;
  detail: string;
}) {
  return (
    <section className="flex min-h-[360px] items-center justify-center">
      <div className="max-w-xs text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--peach)] text-[var(--ink)] shadow-sm">
          <Icon aria-hidden="true" size={28} strokeWidth={2.4} />
        </div>
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-3 text-base font-extrabold">{text}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{detail}</p>
      </div>
    </section>
  );
}
