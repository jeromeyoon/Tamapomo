"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  HandHeart,
  Home,
  Moon,
  Pause,
  Pill,
  Play,
  RotateCcw,
  ShowerHead,
  Sparkles,
  Sprout,
  Star,
  Trophy,
  UserRoundPlus,
  Utensils
} from "lucide-react";

import { getGrowthConfig } from "@/lib/growth-config";

type TabId = "home" | "history" | "friends";
type TimerState = "idle" | "running" | "paused" | "finished";
type FocusQuality = "excellent" | "good" | "distracted";

type FocusSession = {
  id: string;
  duration: number;
  completedAt: string;
  startedAt?: string;
  pauseCount?: number;
  visibilityInterruptions?: number;
  focusScore?: number;
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

type FriendSummary = ServerUser;

type FocusRankingEntry = {
  userId: string;
  email: string;
  minutes: number;
  count: number;
  rank: number;
  isCurrentUser: boolean;
};

type FocusRankingResult = {
  period: "today" | "week";
  summary: string;
  rankings: FocusRankingEntry[];
};

const DEMO_FRIENDS: FriendSummary[] = [
  { id: "demo-1", email: "minji.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
  { id: "demo-2", email: "junseo.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
  { id: "demo-3", email: "harin.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" },
  { id: "demo-4", email: "doyun.demo@pomochi.local", points: 20, createdAt: "2026-06-19T00:00:00.000Z" }
];

function createDemoFocusRankings(): { today: FocusRankingResult; week: FocusRankingResult } {
  const today: FocusRankingResult = {
    period: "today",
    summary: "minji님이 오늘 75분 앞서 있어요.",
    rankings: [
      { userId: "demo-1", email: "minji.demo@pomochi.local", minutes: 75, count: 3, rank: 1, isCurrentUser: false },
      { userId: "demo-2", email: "junseo.demo@pomochi.local", minutes: 50, count: 1, rank: 2, isCurrentUser: false },
      { userId: "demo-3", email: "harin.demo@pomochi.local", minutes: 15, count: 1, rank: 3, isCurrentUser: false },
      { userId: "demo-4", email: "doyun.demo@pomochi.local", minutes: 0, count: 0, rank: 4, isCurrentUser: false }
    ]
  };

  return {
    today,
    week: {
      period: "week",
      summary: today.summary,
      rankings: today.rankings
    }
  };
}

function getFriendNickname(email: string) {
  const localPart = email.split("@")[0]?.trim() || "friend";
  const withoutDemoSuffix = localPart.replace(/\.demo$/i, "");
  const nickname = withoutDemoSuffix.split(/[._-]+/).filter(Boolean)[0] ?? withoutDemoSuffix;
  return nickname || "friend";
}

function getRankingNickname(entry: Pick<FocusRankingEntry, "email" | "isCurrentUser">) {
  return entry.isCurrentUser ? "나" : getFriendNickname(entry.email);
}

function replaceEmailsWithNicknames(text: string) {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => getFriendNickname(email));
}

type StoredState = {
  points: number;
  sessions: FocusSession[];
};

const STORAGE_KEY = "pomochi:mvp0";
const CARE_STORAGE_KEY = "pomochi:care";
const DEFAULT_POINTS = 20;
const DURATIONS = [15, 25, 50];

// 돌봄 게이지 (포인트로 구매해서 채움)
const MAX_HEARTS = 5;
const DEFAULT_CARE = 3;
// 게이지 자연 감소 (⚠️ 테스트용 30초. 배포 시 상향, 예: 30분)
const CARE_DECAY_INTERVAL_MS = 30_000;

type Feeling = "sick" | "tired" | "dirty" | "bored" | "happy";

const GROWTH_CONFIG = getGrowthConfig();
const HATCH_FOCUS_MINUTES = GROWTH_CONFIG.hatchMinutes;

type CharGrade = "good" | "normal" | null;

// 성장 단계 (누적 집중 분 기준) — 콩냥이: 씨앗 → 만개
type LifeStage = "egg" | "baby" | "child" | "teen" | "adult" | "elder";

const STAGE_THRESHOLDS: ReadonlyArray<{ stage: LifeStage; atMinutes: number }> =
  GROWTH_CONFIG.thresholds;

const STAGE_LABELS: Record<LifeStage, string> = {
  egg: "알",
  baby: "씨앗",
  child: "새싹",
  teen: "꽃봉오리",
  adult: "만개",
  elder: "만개"
};

function getLifeStage(hatched: boolean, minutes: number): LifeStage {
  if (!hatched) {
    return "egg";
  }
  let stage: LifeStage = "baby";
  for (const threshold of STAGE_THRESHOLDS) {
    if (minutes >= threshold.atMinutes) {
      stage = threshold.stage;
    }
  }
  return stage;
}

type CareKind = "feed" | "sleep" | "medicine" | "wash" | "pet" | "play";
type ConditionKind = "dirty" | "sick" | "bored";
type CareDropTarget = "health" | "cleanliness" | "affection";

// 돌봄 아이템: 포인트 비용 + 회복량
const CARE_ITEMS: Record<CareKind, { label: string; cost: number; gain: number; reaction: string }> = {
  feed: { label: "밥 주기", cost: 5, gain: 2, reaction: "냠냠, 배가 불러요!" },
  sleep: { label: "재우기", cost: 5, gain: 2, reaction: "쿨쿨, 기운을 차렸어요." },
  medicine: { label: "약 주기", cost: 10, gain: 3, reaction: "약을 먹고 건강해졌어요." },
  wash: { label: "씻기", cost: 4, gain: 2, reaction: "반짝반짝 깨끗해졌어요!" },
  pet: { label: "쓰다듬기", cost: 3, gain: 1, reaction: "콩냥이가 손길을 느끼고 좋아해요." },
  play: { label: "놀아주기", cost: 6, gain: 2, reaction: "함께 놀았더니 더 가까워졌어요!" }
};

const TIMER_CONDITION_EVENTS: ReadonlyArray<{
  kind: ConditionKind;
  target: CareDropTarget;
  reaction: string;
}> = [
  {
    kind: "dirty",
    target: "cleanliness",
    reaction: "집중이 끝나자 콩냥이가 조금 더러워졌어요. 씻겨 주세요."
  },
  {
    kind: "sick",
    target: "health",
    reaction: "집중이 끝나자 콩냥이가 살짝 아파 보여요. 약을 챙겨 주세요."
  },
  {
    kind: "bored",
    target: "affection",
    reaction: "집중이 끝나자 콩냥이가 조금 지루해해요. 놀아 주세요."
  }
];

const CARE_EFFECT_DURATION_MS = 900;
const CONDITION_EFFECT_DURATION_MS = 1300;

type CareState = {
  hunger: number;
  energy: number;
  health: number;
  cleanliness: number;
  affection: number;
  hatched: boolean;
  grade: CharGrade;
};

function clampHeart(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(MAX_HEARTS, Math.max(0, Math.round(value)));
}

function loadCareState(): CareState {
  const fallback: CareState = {
    hunger: DEFAULT_CARE,
    energy: DEFAULT_CARE,
    health: DEFAULT_CARE,
    cleanliness: DEFAULT_CARE,
    affection: DEFAULT_CARE,
    hatched: false,
    grade: null
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(CARE_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CareState>;
    const grade: CharGrade =
      parsed.grade === "good" || parsed.grade === "normal" ? parsed.grade : null;
    return {
      hunger: clampHeart(parsed.hunger ?? DEFAULT_CARE),
      energy: clampHeart(parsed.energy ?? DEFAULT_CARE),
      health: clampHeart(parsed.health ?? DEFAULT_CARE),
      cleanliness: clampHeart(parsed.cleanliness ?? DEFAULT_CARE),
      affection: clampHeart(parsed.affection ?? DEFAULT_CARE),
      hatched: Boolean(parsed.hatched),
      grade
    };
  } catch {
    return fallback;
  }
}

// 표시 전용 원형 타이머 링 (로직과 무관, 남은 시간으로 채움 비율만 계산)
const RING_RADIUS = 100;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// 알 무늬용 중립 팔레트 — 캐릭터 정체(색)를 드러내지 않는 무채/탁한 톤만 사용
const EGG_PATTERN_COLORS = ["#d9c4a8", "#c8b79e", "#bcae97", "#c3b4c0", "#b9c3cf", "#e0cda3"];
const EGG_SPOT_COUNT = 9;

// 시드 기반 PRNG (mulberry32) — 같은 시드면 항상 같은 무늬
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "history", label: "기록", icon: CalendarDays },
  { id: "friends", label: "친구", icon: UserRoundPlus }
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
// 일별 집중 강도 → 색 진하기 (코랄 알파)
const CALENDAR_LEVEL_ALPHA = [0, 0.22, 0.45, 0.7, 1];

function getFocusLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  return 4;
}

function getCalendarCellColor(level: number): string {
  if (level <= 0) return "var(--soft)";
  return `rgba(255, 140, 102, ${CALENDAR_LEVEL_ALPHA[level]})`;
}

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

function clampFocusScore(score: number) {
  if (!Number.isFinite(score)) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateFocusScore(pauseCount: number, visibilityInterruptions: number) {
  return clampFocusScore(100 - pauseCount * 15 - visibilityInterruptions * 25);
}

function getFocusQuality(score: number): FocusQuality {
  if (score >= 95) return "excellent";
  if (score >= 70) return "good";
  return "distracted";
}

function focusQualityLabel(score: number) {
  const quality = getFocusQuality(score);
  if (quality === "excellent") return "아주 좋음";
  if (quality === "good") return "좋음";
  return "흔들림";
}

function getSessionStartDate(session: FocusSession) {
  if (session.startedAt) {
    const startedAt = new Date(session.startedAt);
    if (!Number.isNaN(startedAt.getTime())) {
      return startedAt;
    }
  }

  return new Date(new Date(session.completedAt).getTime() - session.duration * 60_000);
}

function formatLocalTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function historyActionCopy(todayMinutes: number) {
  if (todayMinutes <= 0) {
    return "오늘 첫 15분부터 가볍게 시작해요.";
  }
  if (todayMinutes < 50) {
    return `오늘 ${50 - todayMinutes}분만 더 하면 50분이에요.`;
  }
  return "오늘 흐름이 좋아요. 짧게 한 번 더 이어가도 충분해요.";
}

function getCareIcon(kind: CareKind) {
  if (kind === "feed") return Utensils;
  if (kind === "sleep") return Moon;
  if (kind === "medicine") return Pill;
  if (kind === "wash") return ShowerHead;
  if (kind === "pet") return HandHeart;
  return Gamepad2;
}

function getRecommendedCareKinds({
  hunger,
  energy,
  health,
  cleanliness,
  affection,
  lastConditionKind
}: Pick<CareState, "hunger" | "energy" | "health" | "cleanliness" | "affection"> & {
  lastConditionKind: ConditionKind | null;
}) {
  const priority: CareKind[] = [];
  if (lastConditionKind === "sick") priority.push("medicine");
  if (lastConditionKind === "dirty") priority.push("wash");
  if (lastConditionKind === "bored") priority.push("play");
  if (health <= 2) priority.push("medicine");
  if (energy <= 2) priority.push("sleep");
  if (cleanliness <= 2) priority.push("wash");
  if (hunger <= 2) priority.push("feed");
  if (affection <= 2) priority.push("pet");

  return Array.from(new Set<CareKind>([...priority, "pet", "feed", "play"])).slice(0, 2);
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
  const [customMinutes, setCustomMinutes] = useState("");
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showDurationPanel, setShowDurationPanel] = useState(false);
  // 알 무늬 시드 (0 = SSR 기본, 마운트 후 클라이언트에서 랜덤화하여 hydration 불일치 방지)
  const [eggSeed, setEggSeed] = useState(0);
  // 기록 달력에서 보고 있는 달 (0 = 이번 달, -1 = 지난 달 …)
  const [calendarOffset, setCalendarOffset] = useState(0);
  // 기록 보기 모드 (달력 / 막대 그래프)
  const [historyMode, setHistoryMode] = useState<"calendar" | "chart">("calendar");
  // 돌봄 게이지 (배고픔/기운/건강/청결/애정) + 부화 여부
  const [hunger, setHunger] = useState(DEFAULT_CARE);
  const [energy, setEnergy] = useState(DEFAULT_CARE);
  const [health, setHealth] = useState(DEFAULT_CARE);
  const [cleanliness, setCleanliness] = useState(DEFAULT_CARE);
  const [affection, setAffection] = useState(DEFAULT_CARE);
  const [hatched, setHatched] = useState(false);
  const [isHatching, setIsHatching] = useState(false);
  const [careLoaded, setCareLoaded] = useState(false);
  const [charGrade, setCharGrade] = useState<CharGrade>(null);
  const [lastCareKind, setLastCareKind] = useState<CareKind | null>(null);
  const [lastConditionKind, setLastConditionKind] = useState<ConditionKind | null>(null);
  const careEffectTimerRef = useRef<number | null>(null);
  const conditionEffectTimerRef = useRef<number | null>(null);
  // 부화 전까지 끊김(일시정지/이탈) 없이 집중했는지 — true면 우수 개체
  const [cleanRun, setCleanRun] = useState(true);
  const [focusStartedAt, setFocusStartedAt] = useState<string | null>(null);
  const [pauseCount, setPauseCount] = useState(0);
  const [visibilityInterruptions, setVisibilityInterruptions] = useState(0);
  const [lastFocusScore, setLastFocusScore] = useState(100);
  // 시간대(낮/밤) — 실제 시각 기준
  const [isNight, setIsNight] = useState(false);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendMessage, setFriendMessage] = useState("");
  const [friendBusy, setFriendBusy] = useState(false);
  const [demoSeedBusy, setDemoSeedBusy] = useState(false);
  const [todayRanking, setTodayRanking] = useState<FocusRankingResult | null>(null);
  const [weekRanking, setWeekRanking] = useState<FocusRankingResult | null>(null);
  const decayTickRef = useRef(0);

  useEffect(() => {
    const stored = loadStoredState();
    setPoints(stored.points);
    setSessions(stored.sessions);
    setLoaded(true);

    void loadExistingSession();
  }, []);

  useEffect(() => {
    // 마운트 시 알 무늬 시드 1회 결정 (새로고침 전까지 유지)
    setEggSeed(Math.floor(Math.random() * 1_000_000) + 1);
  }, []);

  useEffect(() => {
    // 돌봄 게이지 로드 (배고픔/기운/건강/청결/애정/부화/등급)
    const care = loadCareState();
    setHunger(care.hunger);
    setEnergy(care.energy);
    setHealth(care.health);
    setCleanliness(care.cleanliness);
    setAffection(care.affection);
    setHatched(care.hatched);
    setCharGrade(care.grade);
    setCareLoaded(true);
  }, []);

  useEffect(() => {
    // 낮/밤 판정 (19시~6시 = 밤), 1분마다 갱신
    const updateClock = () => {
      const hour = new Date().getHours();
      setIsNight(hour < 6 || hour >= 19);
    };
    updateClock();
    const id = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // 게이지 자연 감소 — 부화 후에만. 청결이 가장 빨리 닳아 더러움→피로→아픔 순서로 드러남
    if (!careLoaded || !hatched) {
      return;
    }
    const id = window.setInterval(() => {
      decayTickRef.current += 1;
      const tick = decayTickRef.current;
      setCleanliness((value) => clampHeart(value - 1));
      setHunger((value) => clampHeart(value - 1));
      setAffection((value) => clampHeart(value - 1));
      if (tick % 2 === 0) {
        setEnergy((value) => clampHeart(value - 1));
      }
      if (tick % 3 === 0) {
        setHealth((value) => clampHeart(value - 1));
      }
    }, CARE_DECAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [careLoaded, hatched]);

  useEffect(() => {
    return () => {
      if (careEffectTimerRef.current !== null) {
        window.clearTimeout(careEffectTimerRef.current);
      }
      if (conditionEffectTimerRef.current !== null) {
        window.clearTimeout(conditionEffectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // 돌봄 게이지 저장 (로드 완료 후에만)
    if (!careLoaded) {
      return;
    }
    window.localStorage.setItem(
      CARE_STORAGE_KEY,
      JSON.stringify({ hunger, energy, health, cleanliness, affection, hatched, grade: charGrade })
    );
  }, [careLoaded, hunger, energy, health, cleanliness, affection, hatched, charGrade]);

  useEffect(() => {
    // 일시정지하면 끊김 발생 → 보통 개체 확정 (부화 전까지)
    if (!hatched && timerState === "paused") {
      setCleanRun(false);
    }
  }, [hatched, timerState]);

  useEffect(() => {
    // 집중 중 앱 이탈(화면 전환/가림) 감지 → 끊김 발생
    if (timerState !== "running") {
      return;
    }
    const handleHidden = () => {
      if (document.visibilityState === "hidden") {
        setVisibilityInterruptions((current) => current + 1);
        if (!hatched) {
          setCleanRun(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleHidden);
    return () => document.removeEventListener("visibilitychange", handleHidden);
  }, [hatched, timerState]);

  useEffect(() => {
    if (loaded && !currentUser) {
      saveStoredState({ points, sessions });
    }
  }, [currentUser, loaded, points, sessions]);

  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setTodayRanking(null);
      setWeekRanking(null);
      return;
    }

    void loadFriendCompetition();
  }, [currentUser]);

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
      const focusScore = calculateFocusScore(pauseCount, visibilityInterruptions);
      setLastFocusScore(focusScore);

      if (pauseCount + visibilityInterruptions >= 2) {
        setHunger((current) => clampHeart(current - 1));
        setAffection((current) => clampHeart(current - 1));
        setReaction("집중이 자주 끊겨서 콩냥이의 기분이 내려가고 배고파졌어요.");
        showConditionEffect("bored");
        return;
      }

      setAffection((current) => clampHeart(current + 1));
      applyRandomTimerCondition();
    }
  }, [pauseCount, remainingSeconds, timerState, visibilityInterruptions, showConditionEffect, applyRandomTimerCondition]);

  const todaySessions = useMemo(() => {
    const today = getLocalDateKey();
    return sessions.filter((session) => getLocalDateKey(new Date(session.completedAt)) === today);
  }, [sessions]);

  // 일별 집중 분 집계 (달력 히트맵용)
  const minutesByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      const key = getLocalDateKey(new Date(session.completedAt));
      map.set(key, (map.get(key) ?? 0) + session.duration);
    }
    return map;
  }, [sessions]);

  // 누적 집중 분 (부화 진행도)
  const totalFocusMinutes = useMemo(
    () => sessions.reduce((sum, session) => sum + session.duration, 0),
    [sessions]
  );

  useEffect(() => {
    // 누적 집중 25분 도달 시 자동 부화 — 끊김 없으면 우수 개체
    if (!careLoaded || hatched || isHatching) {
      return;
    }
    if (totalFocusMinutes < HATCH_FOCUS_MINUTES) {
      return;
    }

    const grade: CharGrade = cleanRun ? "good" : "normal";
    setIsHatching(true);
    if (!reaction.includes("+5pt")) {
      setReaction("알이 흔들려요...!");
    }
    window.setTimeout(() => {
      setHatched(true);
      setIsHatching(false);
      setCharGrade(grade);
      if (grade === "good") {
        setHunger(MAX_HEARTS);
        setEnergy(MAX_HEARTS);
        setHealth(MAX_HEARTS);
        setReaction("끊김 없는 집중! 우수 개체 콩냥이가 태어났어요! ✨");
      } else {
        setReaction("콩냥이가 알에서 태어났어요! 🎉");
      }
    }, 900);
  }, [careLoaded, hatched, isHatching, totalFocusMinutes, cleanRun, reaction]);

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
      setShowAuthPanel(false);
      setAuthBusy(false);
    }
  };

  const loadFriendCompetition = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const [friendsResponse, todayResponse, weekResponse] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/focus-rankings?period=today"),
        fetch("/api/friends/focus-rankings?period=week")
      ]);

      if (friendsResponse.ok) {
        const body = (await friendsResponse.json()) as { friends: FriendSummary[] };
        setFriends(body.friends);
      }
      if (todayResponse.ok) {
        setTodayRanking((await todayResponse.json()) as FocusRankingResult);
      }
      if (weekResponse.ok) {
        setWeekRanking((await weekResponse.json()) as FocusRankingResult);
      }
    } catch {
      setFriendMessage("친구 경쟁 정보를 불러오지 못했어요.");
    }
  };

  const inviteFriend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!friendEmail.trim()) {
      return;
    }

    setFriendBusy(true);
    setFriendMessage("친구를 추가하는 중...");
    try {
      const response = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: friendEmail })
      });
      const body = (await response.json()) as { friend?: FriendSummary; error?: string };
      if (!response.ok || !body.friend) {
        throw new Error(body.error || "친구 추가 실패");
      }

      setFriendEmail("");
      setFriendMessage(`${getFriendNickname(body.friend.email)}님을 친구로 추가했어요.`);
      await loadFriendCompetition();
    } catch (error) {
      setFriendMessage(error instanceof Error ? error.message : "친구 추가 실패");
    } finally {
      setFriendBusy(false);
    }
  };

  const seedDemoFriends = async () => {
    if (!currentUser) {
      const demoRankings = createDemoFocusRankings();
      setFriends(DEMO_FRIENDS);
      setTodayRanking(demoRankings.today);
      setWeekRanking(demoRankings.week);
      setFriendMessage(`테스트용 가상 친구 ${DEMO_FRIENDS.length}명을 넣었어요.`);
      return;
    }

    setDemoSeedBusy(true);
    setFriendMessage("테스트용 가상 친구를 넣는 중...");
    try {
      const response = await fetch("/api/friends/demo-seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const body = (await response.json()) as { friends?: FriendSummary[]; error?: string };
      if (!response.ok || !body.friends) {
        throw new Error(body.error || "가상 친구 생성 실패");
      }

      setFriendMessage(`테스트용 가상 친구 ${body.friends.length}명을 넣었어요.`);
      await loadFriendCompetition();
    } catch (error) {
      setFriendMessage(error instanceof Error ? error.message : "가상 친구 생성 실패");
    } finally {
      setDemoSeedBusy(false);
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
    setShowDurationPanel(false);
  };

  const startFocus = () => {
    if (timerState === "finished") {
      return;
    }

    if (timerState === "idle") {
      setFocusStartedAt(new Date().toISOString());
      setPauseCount(0);
      setVisibilityInterruptions(0);
      setLastFocusScore(100);
    }
    setTimerState("running");
    setRewardClaimed(false);
    setReaction("집중 중이에요. 콩냥이가 조용히 기다리고 있어요.");
  };

  const pauseFocus = () => {
    setTimerState("paused");
    setPauseCount((current) => current + 1);
    if (!hatched) {
      setCleanRun(false);
    }
    setReaction("잠깐 멈췄어요. 다시 시작하면 이어서 진행됩니다.");
  };

  const resetTimer = () => {
    setRemainingSeconds(duration * 60);
    setTimerState("idle");
    setRewardClaimed(false);
    setFocusStartedAt(null);
    setPauseCount(0);
    setVisibilityInterruptions(0);
    setLastFocusScore(100);
    setReaction("타이머를 다시 준비했어요.");
  };

  const claimReward = async () => {
    if (!canClaimReward) {
      return;
    }

    const completedAt = new Date().toISOString();
    const startedAt =
      focusStartedAt ??
      new Date(new Date(completedAt).getTime() - duration * 60_000).toISOString();
    const focusScore = calculateFocusScore(pauseCount, visibilityInterruptions);
    const rewardReaction =
      focusScore >= 70
        ? `집중 성공! +5pt, 콩냥이 기분 +1 · 품질 ${focusQualityLabel(focusScore)}`
        : `완료했어요. +5pt, 다음엔 한 번 덜 멈춰봐요 · 품질 ${focusQualityLabel(focusScore)}`;

    if (isServerMode) {
      try {
        const response = await fetch("/api/focus/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            duration,
            completedAt,
            startedAt,
            pauseCount,
            visibilityInterruptions,
            focusScore
          })
        });
        const body = (await response.json()) as { profile?: ServerProfile; error?: string };

        if (!response.ok || !body.profile) {
          throw new Error(body.error || "서버 저장 실패");
        }

        applyServerProfile(body.profile);
        setReaction(rewardReaction);
        setRewardClaimed(true);
        setTimerState("idle");
        setRemainingSeconds(duration * 60);
        setFocusStartedAt(null);
        setPauseCount(0);
        setVisibilityInterruptions(0);
        return;
      } catch (error) {
        setReaction(error instanceof Error ? error.message : "서버 저장 실패");
        return;
      }
    }

    const nextSession: FocusSession = {
      id: crypto.randomUUID(),
      duration,
      completedAt,
      startedAt,
      pauseCount,
      visibilityInterruptions,
      focusScore
    };

    setSessions((current) => [nextSession, ...current]);
    setPoints((current) => current + 5);
    setReaction(rewardReaction);
    setRewardClaimed(true);
    setTimerState("idle");
    setRemainingSeconds(duration * 60);
    setFocusStartedAt(null);
    setPauseCount(0);
    setVisibilityInterruptions(0);
  };

  const careValue = (kind: CareKind) => {
    if (kind === "feed") return hunger;
    if (kind === "sleep") return energy;
    if (kind === "medicine") return health;
    if (kind === "wash") return cleanliness;
    return affection;
  };

  const applyCareGain = (kind: CareKind, gain: number) => {
    const applyGain = (current: number) => clampHeart(current + gain);

    if (kind === "feed") {
      setHunger(applyGain);
    } else if (kind === "sleep") {
      setEnergy(applyGain);
    } else if (kind === "medicine") {
      setHealth(applyGain);
    } else if (kind === "wash") {
      setCleanliness(applyGain);
    } else {
      setAffection(applyGain);
    }
  };

  const applyCareDrop = useCallback((target: CareDropTarget) => {
    const drop = (current: number) => clampHeart(current - 1);

    if (target === "health") {
      setHealth(drop);
    } else if (target === "cleanliness") {
      setCleanliness(drop);
    } else {
      setAffection(drop);
    }
  }, []);

  const showCareEffect = useCallback((kind: CareKind) => {
    setLastCareKind(kind);
    if (careEffectTimerRef.current !== null) {
      window.clearTimeout(careEffectTimerRef.current);
    }
    careEffectTimerRef.current = window.setTimeout(() => {
      setLastCareKind(null);
      careEffectTimerRef.current = null;
    }, CARE_EFFECT_DURATION_MS);
  }, []);

  const showConditionEffect = useCallback((kind: ConditionKind) => {
    setLastConditionKind(kind);
    if (conditionEffectTimerRef.current !== null) {
      window.clearTimeout(conditionEffectTimerRef.current);
    }
    conditionEffectTimerRef.current = window.setTimeout(() => {
      setLastConditionKind(null);
      conditionEffectTimerRef.current = null;
    }, CONDITION_EFFECT_DURATION_MS);
  }, []);

  const applyRandomTimerCondition = useCallback(() => {
    const event =
      TIMER_CONDITION_EVENTS[Math.floor(Math.random() * TIMER_CONDITION_EVENTS.length)] ??
      TIMER_CONDITION_EVENTS[0];

    applyCareDrop(event.target);
    setReaction(event.reaction);
    showConditionEffect(event.kind);
  }, [showConditionEffect]);

  const buyCare = (kind: CareKind) => {
    const item = CARE_ITEMS[kind];

    if (careValue(kind) >= MAX_HEARTS) {
      return;
    }
    if (points < item.cost) {
      setReaction("포인트가 부족해요. 집중해서 포인트를 모아요!");
      return;
    }

    setPoints((current) => current - item.cost);
    applyCareGain(kind, item.gain);
    setReaction(item.reaction);
    showCareEffect(kind);
  };

  const focusProgressMinutes = Math.min(totalFocusMinutes, HATCH_FOCUS_MINUTES);
  const focusProgressLabel = Number.isInteger(focusProgressMinutes)
    ? `${focusProgressMinutes}`
    : focusProgressMinutes.toFixed(1);

  const lifeStage = getLifeStage(hatched, totalFocusMinutes);
  const lifeStageLabel = STAGE_LABELS[lifeStage];

  // 게이지 → 컨디션(몸짓·표정). 우선순위: 아픔 > 피로 > 더러움
  const feeling: Feeling = !hatched
    ? "happy"
    : health <= 1
      ? "sick"
      : energy <= 1
        ? "tired"
        : cleanliness <= 1
          ? "dirty"
          : affection <= 1
            ? "bored"
            : "happy";
  const poopCount = !hatched ? 0 : cleanliness <= 0 ? 2 : cleanliness <= 1 ? 1 : 0;
  const pose =
    feeling === "sick" ? "sick" : feeling === "tired" ? "tired" : feeling === "bored" ? "bored" : isNight ? "doze" : "none";

  const timerStatusLabel =
    timerState === "running"
      ? "집중 중"
      : timerState === "paused"
        ? "일시정지"
        : timerState === "finished"
          ? "완료"
          : `${duration}분 세션`;

  const totalSeconds = duration * 60;
  const progress =
    totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;
  const ringDashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const missionTargetCount = 2;
  const missionProgressCount = Math.min(todaySessions.length, missionTargetCount);
  const recommendedCareKinds = getRecommendedCareKinds({
    hunger,
    energy,
    health,
    cleanliness,
    affection,
    lastConditionKind
  });

  return (
    <main
      aria-label="Pomochi focus dashboard"
      className="ios-app-shell flex min-h-screen w-full items-start justify-center px-4 py-5 text-[var(--ink)] sm:items-center sm:py-8"
    >
      <div className="ios-device-shell app-card w-full max-w-[29rem] px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
        <header className="ios-top-bar flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-black tracking-tight">뽀모치</h1>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)]">
              focus together
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-black text-white">
              <Star aria-hidden="true" size={12} strokeWidth={2.8} fill="currentColor" />
              {points}
            </span>
            <button
              type="button"
              onClick={() => setShowAuthPanel((value) => !value)}
              aria-expanded={showAuthPanel}
              aria-label={currentUser ? "프로필 열기" : "계정 열기"}
              className="ios-profile-button flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)] active:scale-90"
            >
              <UserRoundPlus aria-hidden="true" size={17} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {showAuthPanel && (
          <div className="ios-auth-strip mt-3 rounded-2xl bg-[var(--soft)] px-3 py-2.5 text-xs font-bold">
            {currentUser ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="truncate text-[var(--ink)]">{currentUser.email}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--mint)] px-2 py-0.5 text-[11px] text-[var(--ink)]">
                    {authMessage}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={authBusy}
                    className="rounded-full px-2 py-0.5 text-[var(--muted)] underline-offset-2 transition hover:underline active:scale-95 disabled:opacity-60"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="flex flex-wrap items-center gap-1.5"
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
                  className="min-w-0 flex-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] outline-none ring-1 ring-transparent transition focus:ring-[var(--accent)]"
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
                  className="min-w-0 flex-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] outline-none ring-1 ring-transparent transition focus:ring-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={authBusy}
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-white transition active:scale-95 disabled:opacity-60"
                >
                  가입
                </button>
                <button
                  type="button"
                  onClick={() => submitAuth("login")}
                  disabled={authBusy}
                  className="rounded-full bg-white px-3 py-1.5 text-[var(--muted)] transition active:scale-95 disabled:opacity-60"
                >
                  로그인
                </button>
                <span className="w-full text-[11px] text-[var(--muted)]">{authMessage}</span>
              </form>
            )}
          </div>
        )}

        {activeTab === "home" ? (
          <>
            <section
              className="ios-focus-card character-stage relative mt-4 flex flex-col items-center gap-4 px-5 pb-5 pt-4"
              data-clock={isNight ? "night" : "day"}
            >
              {isNight && (
                <div className="scene-moon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="11" fill="#ffe9a0" />
                    <circle cx="10" cy="11" r="2.2" fill="#f6d77e" />
                    <circle cx="17" cy="16" r="1.6" fill="#f6d77e" />
                    <circle cx="12" cy="18" r="1.2" fill="#f6d77e" />
                  </svg>
                </div>
              )}

              <div className="ios-mission-strip flex w-full items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 shadow-sm">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                    오늘의 미션
                  </div>
                  <div className="truncate text-sm font-black">25분 집중 2번</div>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-black text-[var(--ink)]">
                  {missionProgressCount}/{missionTargetCount}
                </span>
              </div>

              <div className="ios-timer-orbit relative mx-auto h-64 w-64">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 224 224" aria-hidden="true">
                  <circle
                    cx="112"
                    cy="112"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--track)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringDashOffset}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <div
                    className="character-wrap"
                    data-mood={timerState}
                    data-stage={lifeStage}
                    data-grade={charGrade ?? "normal"}
                    data-care={lastCareKind ?? undefined}
                    data-condition={lastConditionKind ?? undefined}
                    data-feeling={hatched && feeling !== "happy" ? feeling : undefined}
                    data-pose={hatched && pose !== "none" ? pose : undefined}
                    aria-label={hatched ? "콩냥이" : "정체불명의 알 — 25분 집중하면 부화해요"}
                  >
                    <div className="egg-creature">
                      {hatched ? (
                        <div key={lifeStage} className="creature-pop">
                          <BeanCatCreature stage={lifeStage} />
                        </div>
                      ) : (
                        <div className={isHatching ? "is-hatching" : ""}>
                          <RandomEgg seed={eggSeed} />
                        </div>
                      )}
                      {timerState === "idle" && !isHatching && (
                        <div className="zzz" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                      {hatched && (
                        <ExpressionMarks feeling={feeling} isNight={isNight} />
                      )}
                      {hatched && <CharacterStatusLayer feeling={feeling} />}
                      {hatched && poopCount > 0 && <PoopLayer count={poopCount} />}
                    </div>
                    {lastCareKind && (
                      <div className="care-effect" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                    {lastConditionKind && (
                      <div className="condition-effect" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </div>

                  <div className="ios-timer-text text-center">
                    <div className="text-[2.4rem] font-black leading-none tabular-nums tracking-tight">
                      {timerText}
                    </div>
                    <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)]">
                      {timerStatusLabel}
                    </div>
                  </div>
                </div>
              </div>

              <span className="ios-pet-pill flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[var(--ink)] shadow-sm">
                {hatched ? (
                  <>
                    <Sprout aria-hidden="true" size={12} strokeWidth={2.6} />
                    콩냥이
                    <span className="rounded-full bg-[var(--soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                      {lifeStageLabel}
                    </span>
                    {charGrade === "good" && (
                      <span className="flex items-center gap-0.5 rounded-full bg-[var(--sun)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
                        <Sparkles aria-hidden="true" size={9} strokeWidth={2.8} />
                        우수
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Sprout aria-hidden="true" size={12} strokeWidth={2.6} />
                    알
                  </>
                )}
              </span>

              {!hatched && (
                <span className="text-[11px] font-extrabold text-[var(--muted)]">
                  부화까지 {focusProgressLabel}/{HATCH_FOCUS_MINUTES}분 ·{" "}
                  {cleanRun ? (
                    <span className="text-[var(--accent)]">끊김 없음 ✓ 우수 예정</span>
                  ) : (
                    <span>끊김 발생 · 보통 개체</span>
                  )}
                </span>
              )}

              <p className="max-w-[18rem] text-center text-sm font-bold leading-relaxed text-[var(--muted)]">
                {reaction}
              </p>

              <div className="ios-home-meta grid w-full grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setShowDurationPanel((value) => !value)}
                  disabled={isTimerLocked}
                  aria-expanded={showDurationPanel}
                  aria-label={`집중 시간 변경, 현재 ${duration}분`}
                  className="ios-meta-button rounded-2xl bg-white/70 px-3 py-2 text-left shadow-sm transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                >
                  <span className="block text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                    시간
                  </span>
                  <span className="mt-0.5 block text-base font-black">{duration}분</span>
                </button>
              </div>

              <p className="text-xs font-extrabold text-[var(--muted)]">
                오늘 {todayMinutes}분 · {todaySessions.length}회 완료
              </p>
            </section>

            {rewardClaimed && (
              <section className="ios-care-suggestions mt-4 rounded-2xl bg-white/70 p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black">추천 돌보기</h2>
                    <p className="mt-0.5 text-xs font-bold text-[var(--muted)]">
                      보상 포인트로 지금 필요한 것만 챙겨요.
                    </p>
                  </div>
                  <span className="ios-care-signal" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recommendedCareKinds.map((kind) => {
                    const item = CARE_ITEMS[kind];
                    const Icon = getCareIcon(kind);
                    const isFull = careValue(kind) >= MAX_HEARTS;
                    const tooPoor = points < item.cost;

                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => buyCare(kind)}
                        disabled={isFull || tooPoor}
                        className="ios-care-button flex flex-col items-center gap-1 rounded-2xl bg-[var(--soft)] px-2 py-3 text-[11px] font-extrabold text-[var(--ink)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
                      >
                        <Icon aria-hidden="true" size={18} strokeWidth={2.4} className="text-[var(--accent)]" />
                        {item.label}
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted)]">
                          <Star aria-hidden="true" size={9} fill="currentColor" strokeWidth={0} />
                          {isFull ? "가득" : item.cost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {showDurationPanel && !isTimerLocked && (
              <div className="ios-duration-panel mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectDuration(option)}
                      aria-pressed={duration === option}
                      disabled={isTimerLocked}
                      className={`ios-segment-button h-11 rounded-xl text-sm font-black transition active:scale-95 ${
                        duration === option
                          ? "bg-[var(--ink)] text-white shadow-sm"
                          : "bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--ink)]"
                      } disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100`}
                    >
                      {option}분
                    </button>
                  ))}
                </div>

                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = parseFloat(customMinutes);
                    if (Number.isFinite(value) && value > 0) {
                      selectDuration(value);
                    }
                  }}
                >
                  <label className="sr-only" htmlFor="pomochi-custom-minutes">
                    집중 시간 직접 설정 (분)
                  </label>
                  <input
                    id="pomochi-custom-minutes"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={0.1}
                    value={customMinutes}
                    onChange={(event) => setCustomMinutes(event.target.value)}
                    disabled={isTimerLocked}
                    placeholder="직접 입력 (분, 예: 0.1 = 6초)"
                    className="h-11 min-w-0 flex-1 rounded-xl bg-[var(--soft)] px-3 text-sm font-bold text-[var(--ink)] outline-none ring-1 ring-transparent transition focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isTimerLocked}
                    className="h-11 shrink-0 rounded-xl bg-[var(--accent)] px-4 text-sm font-black text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                  >
                    설정
                  </button>
                </form>
              </div>
            )}

            <div className="ios-control-dock flex items-center justify-center gap-3">
              {timerState !== "idle" && (
                <button
                  type="button"
                  onClick={resetTimer}
                  aria-label="타이머 초기화"
                  className="ios-secondary-control flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft)] text-[var(--muted)] transition hover:text-[var(--ink)] active:scale-90"
                >
                  <RotateCcw aria-hidden="true" size={20} strokeWidth={2.4} />
                </button>
              )}

              {timerState === "running" ? (
                <button
                  type="button"
                  onClick={pauseFocus}
                  aria-label="일시정지"
                  className="ios-primary-control flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-black text-white shadow-[0_12px_26px_rgba(255,140,102,0.4)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  <Pause aria-hidden="true" size={22} fill="currentColor" strokeWidth={0} />
                  일시정지
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startFocus}
                  disabled={timerState === "finished"}
                  aria-label={timerState === "paused" ? "다시 시작" : "집중 시작"}
                  className="ios-primary-control flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-black text-white shadow-[0_12px_26px_rgba(255,140,102,0.4)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  <Play aria-hidden="true" size={22} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                  {timerState === "paused" ? "다시 시작" : "집중 시작"}
                </button>
              )}
            </div>

            {canClaimReward && (
              <button
                type="button"
                onClick={claimReward}
                className="ios-reward-button mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] text-base font-black text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
              >
                <Sparkles aria-hidden="true" size={20} strokeWidth={2.6} />
                보상 받기 +5pt
              </button>
            )}

          </>
        ) : activeTab === "history" ? (
          <div className="mt-4">
            <FocusHistory
              minutesByDay={minutesByDay}
              sessions={sessions}
              todayMinutes={todayMinutes}
              monthOffset={calendarOffset}
              onChangeMonth={(delta) => setCalendarOffset((value) => value + delta)}
              mode={historyMode}
              onChangeMode={setHistoryMode}
            />
          </div>
        ) : (
          <div className="ios-focus-card character-stage mt-4 px-5 py-8">
            <FriendsPanel
              currentUser={currentUser}
              friends={friends}
              friendEmail={friendEmail}
              friendMessage={friendMessage}
              friendBusy={friendBusy}
              demoSeedBusy={demoSeedBusy}
              todayRanking={todayRanking}
              weekRanking={weekRanking}
              onFriendEmailChange={setFriendEmail}
              onInviteFriend={inviteFriend}
              onSeedDemoFriends={seedDemoFriends}
              onReload={loadFriendCompetition}
            />
          </div>
        )}

        <nav aria-label="주요 화면" className="ios-bottom-nav mt-6 grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={`ios-nav-button flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-extrabold transition active:scale-95 ${
                  active
                    ? "bg-[var(--soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
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
    <section className="flex min-h-[320px] items-center justify-center">
      <div className="max-w-xs text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm">
          <Icon aria-hidden="true" size={28} strokeWidth={2.2} />
        </div>
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-3 text-base font-extrabold">{text}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{detail}</p>
      </div>
    </section>
  );
}

function FriendsPanel({
  currentUser,
  friends,
  friendEmail,
  friendMessage,
  friendBusy,
  demoSeedBusy,
  todayRanking,
  weekRanking,
  onFriendEmailChange,
  onInviteFriend,
  onSeedDemoFriends,
  onReload
}: {
  currentUser: ServerUser | null;
  friends: FriendSummary[];
  friendEmail: string;
  friendMessage: string;
  friendBusy: boolean;
  demoSeedBusy: boolean;
  todayRanking: FocusRankingResult | null;
  weekRanking: FocusRankingResult | null;
  onFriendEmailChange: (email: string) => void;
  onInviteFriend: (event: React.FormEvent<HTMLFormElement>) => void;
  onSeedDemoFriends: () => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const weekLeader = weekRanking?.rankings[0];

  if (!currentUser) {
    return (
      <section className="space-y-5">
        <section className="flex min-h-[300px] items-center justify-center">
          <div className="max-w-xs text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm">
              <UserRoundPlus aria-hidden="true" size={28} strokeWidth={2.2} />
            </div>
            <h2 className="mt-5 text-2xl font-black">친구</h2>
            <p className="mt-3 text-base font-extrabold">로그인하면 친구 집중 경쟁을 볼 수 있어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              오늘 누가 더 집중했는지 확인하고 한 번 더 시작할 이유를 만듭니다.
            </p>
            <button
              type="button"
              onClick={() => void onSeedDemoFriends()}
              disabled={demoSeedBusy}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--ink)] text-sm font-black text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              가상 친구 넣기
            </button>
            {friendMessage && (
              <p className="mt-3 text-xs font-bold text-[var(--muted)]" role="status">
                {friendMessage}
              </p>
            )}
          </div>
        </section>

        {(friends.length > 0 || todayRanking) && (
          <RankingCard
            title="오늘의 집중 경쟁"
            emptyText="가상 친구를 넣으면 오늘 순위가 보여요."
            ranking={todayRanking}
          />
        )}

        {(friends.length > 0 || weekRanking) && (
          <section className="rounded-2xl bg-[var(--soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black">이번 주 흐름</h3>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  {weekRanking ? `이번 주 요약: ${replaceEmailsWithNicknames(weekRanking.summary)}` : "이번 주 친구 경쟁 기록을 기다리는 중이에요."}
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ink)] shadow-sm">
                {weekLeader ? `${getRankingNickname(weekLeader)} ${weekLeader.minutes}분` : "0분"}
              </div>
            </div>
          </section>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">친구 경쟁</h2>
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">
            가까운 친구와 오늘 집중 시간을 비교해요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onReload()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)] active:scale-90"
          aria-label="친구 경쟁 새로고침"
        >
          <RotateCcw aria-hidden="true" size={17} strokeWidth={2.5} />
        </button>
      </header>

      <form onSubmit={onInviteFriend} className="space-y-2 rounded-2xl bg-white/70 p-3 shadow-sm">
        <label htmlFor="friend-email" className="text-xs font-black text-[var(--muted)]">
          친구 이메일
        </label>
        <div className="flex gap-2">
          <input
            id="friend-email"
            type="email"
            value={friendEmail}
            onChange={(event) => onFriendEmailChange(event.target.value)}
            placeholder="friend@example.com"
            className="min-w-0 flex-1 rounded-xl border border-[rgba(61,58,68,0.12)] bg-white px-3 py-2 text-sm font-bold outline-none transition focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={friendBusy || !friendEmail.trim()}
            className="shrink-0 rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-black text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            친구 추가
          </button>
        </div>
        <button
          type="button"
          onClick={() => void onSeedDemoFriends()}
          disabled={demoSeedBusy}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--soft)] text-sm font-black text-[var(--ink)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          가상 친구 넣기
        </button>
        {friendMessage && (
          <p className="text-xs font-bold text-[var(--muted)]" role="status">
            {friendMessage}
          </p>
        )}
      </form>

      <RankingCard
        title="오늘의 집중 경쟁"
        emptyText={friends.length > 0 ? "오늘은 아직 집중 기록이 없어요." : "친구를 추가하면 오늘 순위가 보여요."}
        ranking={todayRanking}
      />

      <section className="rounded-2xl bg-[var(--soft)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black">이번 주 흐름</h3>
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">
              {weekRanking ? `이번 주 요약: ${replaceEmailsWithNicknames(weekRanking.summary)}` : "이번 주 친구 경쟁 기록을 기다리는 중이에요."}
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ink)] shadow-sm">
            {weekLeader ? `${getRankingNickname(weekLeader)} ${weekLeader.minutes}분` : "0분"}
          </div>
        </div>
      </section>
    </section>
  );
}

function RankingCard({
  title,
  emptyText,
  ranking
}: {
  title: string;
  emptyText: string;
  ranking: FocusRankingResult | null;
}) {
  const summaryText = ranking ? replaceEmailsWithNicknames(ranking.summary) : emptyText;

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Trophy aria-hidden="true" size={18} strokeWidth={2.5} className="text-[var(--accent)]" />
        <h3 className="text-base font-black">{title}</h3>
      </div>
      <p className="mt-2 text-sm font-extrabold text-[var(--ink)]">
        {summaryText}
      </p>

      <div className="mt-3 space-y-2">
        {ranking?.rankings.length ? (
          ranking.rankings.map((entry) => {
            const nickname = getRankingNickname(entry);

            return (
              <div
                key={entry.userId}
                className={`friend-ranking-row flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
                  entry.isCurrentUser ? "bg-[var(--mint)]" : "bg-[var(--soft)]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="friend-rank-number shrink-0">{entry.rank}</span>
                  <div className="friend-avatar-stack">
                    <FriendCharacterAvatar nickname={nickname} />
                    <span className="friend-nickname">{nickname}</span>
                  </div>
                  <div className="min-w-0 text-[11px] font-bold text-[var(--muted)]">
                    {entry.count}회 완료{entry.isCurrentUser ? " · 나" : ""}
                  </div>
                </div>
                <div className="shrink-0 text-lg font-black">{entry.minutes}분</div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl bg-[var(--soft)] px-3 py-3 text-sm font-bold text-[var(--muted)]">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

function FriendCharacterAvatar({ nickname }: { nickname: string }) {
  const initial = nickname.slice(0, 1).toUpperCase();

  return (
    <span className="friend-character" role="img" aria-label={`${nickname} 캐릭터`}>
      <span className="friend-character-ear friend-character-ear-left" aria-hidden="true" />
      <span className="friend-character-ear friend-character-ear-right" aria-hidden="true" />
      <span className="friend-character-face" aria-hidden="true">
        {initial}
      </span>
    </span>
  );
}

function ExpressionMarks({ feeling, isNight }: { feeling: Feeling; isNight: boolean }) {
  const marks: React.ReactNode[] = [];

  if (feeling === "sick") {
    marks.push(
      <span key="sweat" className="mark-sweat" style={{ top: 38, left: 88 }} />,
      <span key="cough" className="mark-cough-puff" style={{ top: 48, left: 94 }} />
    );
  } else if (feeling === "dirty") {
    marks.push(
      <span key="smudge-1" className="mark-smudge" style={{ top: 66, left: 38, height: 8, width: 14 }} />,
      <span key="smudge-2" className="mark-smudge" style={{ top: 84, left: 92, height: 7, width: 12 }} />,
      <span key="fly" className="mark-fly" style={{ top: 32, left: 88 }} />
    );
  } else if (feeling === "bored") {
    marks.push(
      <span key="bored-1" className="mark-bored-dot" style={{ top: 46, left: 32 }} />,
      <span key="bored-2" className="mark-bored-dot" style={{ top: 40, left: 46 }} />,
      <span key="bored-3" className="mark-bored-dot" style={{ top: 48, left: 60 }} />
    );
  } else if (feeling === "tired" || isNight) {
    marks.push(
      <span key="sleep-bubble" className="mark-sleep-bubble" style={{ top: 30, left: 92 }} />
    );
  }

  if (marks.length === 0) {
    return null;
  }

  return (
    <div className="expression-marks" aria-hidden="true">
      {marks}
    </div>
  );
}

function CharacterStatusLayer({ feeling }: { feeling: Feeling }) {
  if (feeling === "happy") {
    return null;
  }

  return (
    <div className={`character-status-layer character-status-layer-${feeling}`} aria-hidden="true">
      {feeling === "sick" && (
        <>
          <span className="status-mask">
            <span />
          </span>
          <span className="status-cough status-cough-one" />
          <span className="status-cough status-cough-two" />
        </>
      )}
      {feeling === "tired" && (
        <>
          <span className="status-heavy-lid status-heavy-lid-left" />
          <span className="status-heavy-lid status-heavy-lid-right" />
          <span className="status-sleep-bubble status-sleep-bubble-one" />
          <span className="status-sleep-bubble status-sleep-bubble-two" />
        </>
      )}
      {feeling === "dirty" && (
        <>
          <span className="status-dirt status-dirt-one" />
          <span className="status-dirt status-dirt-two" />
          <span className="status-dirt status-dirt-three" />
        </>
      )}
      {feeling === "bored" && (
        <>
          <span className="status-bored-line status-bored-line-one" />
          <span className="status-bored-line status-bored-line-two" />
          <span className="status-bored-line status-bored-line-three" />
        </>
      )}
    </div>
  );
}

function PoopLayer({ count }: { count: number }) {
  return (
    <div className="poop-layer" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={{
            left: `${42 + index * 22}px`,
            height: 12,
            width: 16,
            borderRadius: "999px 999px 8px 8px",
            background: "#8f6d4d",
            boxShadow: "inset 0 3px 0 rgba(255, 255, 255, 0.22), 0 2px 0 rgba(61, 58, 68, 0.12)"
          }}
        />
      ))}
    </div>
  );
}

type BeanCatLevel = "seed" | "sprout" | "bud" | "bloom";

function getBeanCatLevel(stage: LifeStage): BeanCatLevel {
  if (stage === "baby") return "seed";
  if (stage === "child") return "sprout";
  if (stage === "teen") return "bud";
  return "bloom";
}

// 콩냥이 4단계 메인 캐릭터: 씨앗 → 새싹 → 꽃봉오리 → 만개
function BeanCatCreature({ stage }: { stage: LifeStage }) {
  const level = getBeanCatLevel(stage);
  const showCatEars = level !== "sprout";
  const showHeldStem = level === "bloom";
  const common = {
    viewBox: "0 0 120 150",
    width: 112,
    height: 140,
    role: "img" as const,
    "aria-hidden": true,
    className: `bean-cat-creature bean-cat-creature--${level}`
  };

  return (
    <svg {...common}>
      <g className="bean-cat-shadow">
        <ellipse cx="60" cy="140" rx="36" ry="7" fill="#3d3a44" opacity="0.15" />
      </g>

      {level === "bloom" && (
        <g className="bean-cat-aura">
          <circle cx="60" cy="76" r="53" fill="#f7b7ca" opacity="0.16" />
          <circle cx="31" cy="56" r="4" fill="#ffe4a8" opacity="0.58" />
          <circle cx="90" cy="68" r="3.6" fill="#ffffff" opacity="0.7" />
          <circle cx="84" cy="113" r="3" fill="#ffe4a8" opacity="0.58" />
        </g>
      )}

      <g className="bean-cat-body">
        {showCatEars && (
          <>
            <path
              d="M34 63 C30 48 40 43 49 56 C45 62 40 65 34 63Z"
              fill="#bfe8d3"
              stroke="#7fc8a6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M86 63 C90 48 80 43 71 56 C75 62 80 65 86 63Z"
              fill="#bfe8d3"
              stroke="#7fc8a6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M38 59 C37 53 41 51 45 56 C43 59 41 60 38 59Z" fill="#f5c4cd" opacity="0.7" />
            <path d="M82 59 C83 53 79 51 75 56 C77 59 79 60 82 59Z" fill="#f5c4cd" opacity="0.7" />
          </>
        )}
        <path
          d="M60 49 C83 49 98 68 97 93 C96 118 80 136 59 136 C37 136 23 119 24 94 C25 68 38 49 60 49Z"
          fill="#bfe8d3"
          stroke="#7fc8a6"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M91 99 C107 96 108 116 94 116"
          fill="none"
          stroke="#9fdcc4"
          strokeLinecap="round"
          strokeWidth="8"
        />
        <ellipse cx="60" cy="110" rx="23" ry="20" fill="#fff5dd" opacity="0.82" />
        {!showHeldStem && (
          <>
            <ellipse cx="38" cy="108" rx="7" ry="10" fill="#a9dcc7" transform="rotate(-20 38 108)" />
            <ellipse cx="82" cy="108" rx="7" ry="10" fill="#a9dcc7" transform="rotate(20 82 108)" />
          </>
        )}
        {level === "bud" && (
          <ellipse cx="37" cy="101" rx="6.5" ry="10" fill="#a9dcc7" transform="rotate(-42 37 101)" />
        )}
        {showHeldStem && (
          <>
            <path d="M60 42 C61 58 60 76 60 94" stroke="#75b772" strokeWidth="3.2" strokeLinecap="round" />
            <ellipse cx="53" cy="93" rx="7" ry="6" fill="#a9dcc7" transform="rotate(18 53 93)" />
            <ellipse cx="67" cy="93" rx="7" ry="6" fill="#a9dcc7" transform="rotate(-18 67 93)" />
          </>
        )}
        <ellipse cx="49" cy="134" rx="9" ry="5" fill="#99d6bd" />
        <ellipse cx="71" cy="134" rx="9" ry="5" fill="#99d6bd" />
      </g>

      <g className="bean-cat-accessory">
        {level === "seed" && (
          <path
            d="M56 43 C50 35 55 27 64 31 C70 35 67 47 59 48 C58 46 57 45 56 43Z"
            fill="#a9784b"
            stroke="#7d5b3b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {level === "sprout" && (
          <>
            <path
              d="M60 55 C51 41 39 42 39 54 C40 65 53 65 60 55Z"
              fill="#75c985"
              stroke="#5aa76e"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M60 55 C69 41 82 42 81 54 C80 65 67 65 60 55Z"
              fill="#8edc98"
              stroke="#5aa76e"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M60 58 L60 47" stroke="#5aa76e" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {level === "bud" && (
          <>
            <path d="M60 51 C61 43 60 36 60 31" stroke="#70b66f" strokeWidth="3" strokeLinecap="round" />
            <path d="M59 42 C52 38 47 42 48 48 C53 49 57 47 59 42Z" fill="#7fc985" />
            <ellipse cx="60" cy="26" rx="8" ry="10" fill="#f5a4c3" stroke="#d7839f" strokeWidth="2" />
            <ellipse cx="60" cy="24" rx="4.2" ry="6.5" fill="#ffd3df" opacity="0.72" />
          </>
        )}
        {level === "bloom" && (
          <>
            <circle cx="60" cy="30" r="6.8" fill="#ffe7a8" stroke="#e6bd60" strokeWidth="1.6" />
            <ellipse cx="60" cy="18" rx="7" ry="10" fill="#f5a4c3" />
            <ellipse cx="60" cy="42" rx="7" ry="10" fill="#f5a4c3" />
            <ellipse cx="48" cy="30" rx="7" ry="10" fill="#f7b1ca" transform="rotate(-90 48 30)" />
            <ellipse cx="72" cy="30" rx="7" ry="10" fill="#f7b1ca" transform="rotate(90 72 30)" />
            <ellipse cx="51.5" cy="21.5" rx="6" ry="8.5" fill="#ffd0dc" transform="rotate(-42 51.5 21.5)" />
            <ellipse cx="68.5" cy="21.5" rx="6" ry="8.5" fill="#ffd0dc" transform="rotate(42 68.5 21.5)" />
          </>
        )}
      </g>

      <g className="bean-cat-face">
        <circle cx="44" cy="96" r="6" fill="#f5a4b8" opacity="0.74" />
        <circle cx="76" cy="96" r="6" fill="#f5a4b8" opacity="0.74" />

        {level === "seed" && (
          <>
            <path d="M45 85 Q50 88 55 85" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M65 85 Q70 88 75 85" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <ellipse cx="60" cy="101" rx="4.5" ry="6" fill="#ffffff" stroke="#3f372f" strokeWidth="2" />
          </>
        )}

        {level === "sprout" && (
          <>
            <ellipse cx="49" cy="83" rx="4.4" ry="5.8" fill="#3f372f" />
            <ellipse cx="71" cy="83" rx="4.4" ry="5.8" fill="#3f372f" />
            <circle cx="50.5" cy="80.7" r="1.7" fill="#ffffff" />
            <circle cx="72.5" cy="80.7" r="1.7" fill="#ffffff" />
            <path d="M56 96 Q60 100 64 96" stroke="#3f372f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        )}

        {level === "bud" && (
          <>
            <path d="M45 84 Q50 78 55 84" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M65 84 Q70 78 75 84" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M55 98 Q60 103 65 98" stroke="#3f372f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        )}

        {level === "bloom" && (
          <>
            <path d="M45 84 Q50 88 55 84" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M65 84 Q70 88 75 84" stroke="#3f372f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M55 99 Q60 102 65 99" stroke="#3f372f" strokeWidth="2.3" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}

// 푸름이 성장 단계 3등신 캐릭터 (새싹 → 거목)
function SproutCreature({ stage }: { stage: LifeStage }) {
  const common = {
    viewBox: "0 0 120 150",
    width: 112,
    height: 140,
    role: "img" as const,
    "aria-hidden": true,
    className: `sprout-creature sprout-creature--${stage}`
  };

  if (stage === "baby") {
    return (
      <svg {...common}>
        <ellipse className="sprout-ground" cx="60" cy="141" rx="32" ry="5" fill="#3d3a44" />
        <path className="sprout-leaf sprout-leaf-left" d="M60 56 C50 40 36 40 38 54 C40 64 54 64 60 56Z" fill="#6fbf5a" />
        <path className="sprout-leaf sprout-leaf-right" d="M60 56 C70 38 86 40 82 54 C79 64 66 64 60 56Z" fill="#83cf68" />
        <rect className="sprout-stem" x="57" y="50" width="6" height="18" rx="3" fill="#7bbf5a" />
        <ellipse className="sprout-body" cx="60" cy="98" rx="42" ry="40" fill="#ffe07a" />
        <ellipse className="sprout-belly" cx="60" cy="106" rx="40" ry="32" fill="#ffd84d" opacity="0.5" />
        <circle className="sprout-cheek" cx="40" cy="104" r="7" fill="#ff9ec2" opacity="0.8" />
        <circle className="sprout-cheek" cx="80" cy="104" r="7" fill="#ff9ec2" opacity="0.8" />
        <ellipse className="sprout-eye" cx="50" cy="96" rx="4.5" ry="6" fill="#3d3a44" />
        <ellipse className="sprout-eye" cx="70" cy="96" rx="4.5" ry="6" fill="#3d3a44" />
        <circle cx="51.6" cy="93.5" r="1.6" fill="#fff" />
        <circle cx="71.6" cy="93.5" r="1.6" fill="#fff" />
        <path className="sprout-mouth" d="M55 110 Q60 115 65 110" stroke="#3d3a44" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (stage === "child") {
    return (
      <svg {...common}>
        <ellipse className="sprout-ground" cx="60" cy="141" rx="36" ry="5" fill="#3d3a44" />
        <path className="sprout-canopy" d="M60 32 C44 32 33 46 33 60 C33 76 46 86 60 86 C74 86 87 76 87 60 C87 46 76 32 60 32Z" fill="#6fbf5a" />
        <path className="sprout-leaf sprout-leaf-left" d="M60 36 C54 24 42 24 44 35 C46 43 56 43 60 36Z" fill="#83cf68" />
        <path className="sprout-leaf sprout-leaf-right" d="M60 36 C66 24 78 24 76 35 C74 43 64 43 60 36Z" fill="#5aa84d" />
        <rect className="sprout-trunk" x="50" y="82" width="20" height="40" rx="10" fill="#7bbf5a" />
        <ellipse className="sprout-belly" cx="60" cy="102" rx="9" ry="13" fill="#cdeeaa" />
        <path className="sprout-arm sprout-arm-left" d="M50 94 q-12 2 -14 12" stroke="#7bbf5a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="sprout-arm sprout-arm-right" d="M70 94 q12 2 14 12" stroke="#7bbf5a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse className="sprout-foot" cx="53" cy="126" rx="8" ry="6" fill="#5aa84d" />
        <ellipse className="sprout-foot" cx="67" cy="126" rx="8" ry="6" fill="#5aa84d" />
        <ellipse className="sprout-eye" cx="52" cy="60" rx="4" ry="5.5" fill="#3d3a44" />
        <ellipse className="sprout-eye" cx="68" cy="60" rx="4" ry="5.5" fill="#3d3a44" />
        <circle cx="53" cy="58" r="1.4" fill="#fff" />
        <circle cx="69" cy="58" r="1.4" fill="#fff" />
        <circle className="sprout-cheek" cx="44" cy="68" r="5" fill="#ff9ec2" opacity="0.75" />
        <circle className="sprout-cheek" cx="76" cy="68" r="5" fill="#ff9ec2" opacity="0.75" />
        <path className="sprout-mouth" d="M56 69 Q60 73 64 69" stroke="#3d3a44" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (stage === "teen") {
    return (
      <svg {...common}>
        <ellipse className="sprout-ground" cx="60" cy="145" rx="38" ry="5" fill="#3d3a44" />
        <ellipse className="sprout-bloom" cx="60" cy="22" rx="8" ry="11" fill="#ff9ec2" />
        <ellipse className="sprout-bloom-core" cx="60" cy="20" rx="4.5" ry="7" fill="#ffc2d8" />
        <rect className="sprout-stem" x="57.5" y="28" width="5" height="14" rx="2.5" fill="#5aa84d" />
        <path className="sprout-canopy" d="M60 38 C45 38 35 51 35 64 C35 79 47 88 60 88 C73 88 85 79 85 64 C85 51 75 38 60 38Z" fill="#6fbf5a" />
        <path className="sprout-leaf sprout-leaf-left" d="M35 62 C24 58 20 68 30 72 C36 74 38 66 35 62Z" fill="#5aa84d" />
        <path className="sprout-leaf sprout-leaf-right" d="M85 62 C96 58 100 68 90 72 C84 74 82 66 85 62Z" fill="#5aa84d" />
        <rect className="sprout-trunk" x="50" y="84" width="20" height="44" rx="10" fill="#7bbf5a" />
        <ellipse className="sprout-belly" cx="60" cy="106" rx="9" ry="15" fill="#cdeeaa" />
        <path className="sprout-arm sprout-arm-left" d="M50 96 q-13 3 -15 15" stroke="#7bbf5a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="sprout-arm sprout-arm-right" d="M70 96 q13 3 15 15" stroke="#7bbf5a" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect className="sprout-leg" x="52" y="126" width="6" height="12" rx="3" fill="#5aa84d" />
        <rect className="sprout-leg" x="62" y="126" width="6" height="12" rx="3" fill="#5aa84d" />
        <ellipse className="sprout-foot" cx="53" cy="139" rx="8" ry="5" fill="#4f9e46" />
        <ellipse className="sprout-foot" cx="67" cy="139" rx="8" ry="5" fill="#4f9e46" />
        <ellipse className="sprout-eye" cx="52" cy="64" rx="4" ry="5.5" fill="#3d3a44" />
        <ellipse className="sprout-eye" cx="68" cy="64" rx="4" ry="5.5" fill="#3d3a44" />
        <circle cx="53" cy="62" r="1.4" fill="#fff" />
        <circle cx="69" cy="62" r="1.4" fill="#fff" />
        <circle className="sprout-cheek" cx="45" cy="72" r="5" fill="#ff9ec2" opacity="0.7" />
        <circle className="sprout-cheek" cx="75" cy="72" r="5" fill="#ff9ec2" opacity="0.7" />
        <path className="sprout-mouth" d="M55 73 Q60 78 65 73" stroke="#3d3a44" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (stage === "adult") {
    return (
      <svg {...common}>
        <ellipse className="sprout-ground" cx="60" cy="145" rx="44" ry="5" fill="#3d3a44" />
        <ellipse className="sprout-canopy sprout-canopy-main" cx="60" cy="46" rx="44" ry="34" fill="#6fbf5a" />
        <ellipse className="sprout-canopy sprout-canopy-left" cx="38" cy="52" rx="20" ry="16" fill="#5aa84d" />
        <ellipse className="sprout-canopy sprout-canopy-right" cx="82" cy="52" rx="20" ry="16" fill="#83cf68" />
        <circle className="sprout-blossom" cx="40" cy="38" r="4" fill="#ff9ec2" />
        <circle className="sprout-blossom" cx="74" cy="34" r="4" fill="#ffc2d8" />
        <circle className="sprout-blossom" cx="58" cy="26" r="4" fill="#ff9ec2" />
        <circle className="sprout-blossom" cx="88" cy="48" r="3.5" fill="#ffc2d8" />
        <circle className="sprout-blossom" cx="30" cy="56" r="3.5" fill="#ff9ec2" />
        <path className="sprout-trunk" d="M48 78 L72 78 L68 138 L52 138 Z" fill="#c39a6b" />
        <path className="sprout-trunk-line" d="M58 80 L62 80 L61 138 L59 138 Z" fill="#a87f50" opacity="0.5" />
        <path className="sprout-arm sprout-arm-left" d="M48 92 q-14 -2 -18 -12" stroke="#b98a5e" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="sprout-arm sprout-arm-right" d="M72 92 q14 -2 18 -12" stroke="#b98a5e" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="sprout-root sprout-root-left" d="M52 138 q-10 0 -16 6" stroke="#a87f50" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="sprout-root sprout-root-right" d="M68 138 q10 0 16 6" stroke="#a87f50" strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse className="sprout-eye" cx="55" cy="100" rx="3.5" ry="5" fill="#3d3a44" />
        <ellipse className="sprout-eye" cx="65" cy="100" rx="3.5" ry="5" fill="#3d3a44" />
        <circle cx="56" cy="98" r="1.2" fill="#fff" />
        <circle cx="66" cy="98" r="1.2" fill="#fff" />
        <circle className="sprout-cheek" cx="48" cy="107" r="4" fill="#ff9ec2" opacity="0.6" />
        <circle className="sprout-cheek" cx="72" cy="107" r="4" fill="#ff9ec2" opacity="0.6" />
        <path className="sprout-mouth" d="M56 108 Q60 112 64 108" stroke="#3d3a44" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // elder
  return (
    <svg {...common}>
      <ellipse className="sprout-ground" cx="60" cy="145" rx="48" ry="5" fill="#3d3a44" />
      <ellipse className="sprout-canopy sprout-canopy-main" cx="60" cy="44" rx="50" ry="36" fill="#4f9e46" />
      <ellipse className="sprout-canopy sprout-canopy-left" cx="34" cy="50" rx="22" ry="18" fill="#5aa84d" />
      <ellipse className="sprout-canopy sprout-canopy-right" cx="86" cy="50" rx="22" ry="18" fill="#3f8a3a" />
      <circle className="sprout-moss" cx="48" cy="34" r="6" fill="#8fcf6a" opacity="0.7" />
      <circle className="sprout-moss" cx="76" cy="40" r="5" fill="#8fcf6a" opacity="0.7" />
      <path className="sprout-leaf sprout-leaf-left" d="M22 76 q4 -5 8 0 q-4 5 -8 0Z" fill="#83cf68" />
      <path className="sprout-leaf sprout-leaf-right" d="M96 84 q4 -5 8 0 q-4 5 -8 0Z" fill="#6fbf5a" />
      <path className="sprout-trunk" d="M44 78 L76 78 L72 140 L48 140 Z" fill="#b98a5e" />
      <path className="sprout-trunk-line" d="M50 82 q-6 28 0 56" stroke="#a87f50" strokeWidth="3" fill="none" />
      <ellipse className="sprout-moss" cx="50" cy="120" rx="8" ry="5" fill="#8fbf6a" opacity="0.7" />
      <ellipse className="sprout-moss" cx="70" cy="108" rx="6" ry="4" fill="#8fbf6a" opacity="0.7" />
      <path className="sprout-root sprout-root-left" d="M52 116 q-2 14 2 20" stroke="#6fbf5a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path className="sprout-root sprout-root-right" d="M68 116 q2 14 -2 20" stroke="#6fbf5a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path className="sprout-arm sprout-arm-left" d="M44 90 q-16 -4 -20 -16" stroke="#a87f50" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path className="sprout-arm sprout-arm-right" d="M76 90 q16 -4 20 -16" stroke="#a87f50" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path className="sprout-eye sprout-eye-closed" d="M50 100 q5 4 10 0" stroke="#3d3a44" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path className="sprout-eye sprout-eye-closed" d="M60 100 q5 4 10 0" stroke="#3d3a44" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle className="sprout-cheek" cx="48" cy="107" r="3.5" fill="#ff9ec2" opacity="0.5" />
      <circle className="sprout-cheek" cx="72" cy="107" r="3.5" fill="#ff9ec2" opacity="0.5" />
      <path className="sprout-mouth" d="M55 110 Q60 113 65 110" stroke="#3d3a44" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type HistoryMode = "calendar" | "chart";
type DayDatum = { day: number; key: string; minutes: number };
type TimelineInterval = {
  id: string;
  startLabel: string;
  endLabel: string;
  rangeLabel: string;
  durationMinutes: number;
  startPercent: number;
  widthPercent: number;
  lane: number;
  focusScore: number;
};

const CHART_MAX_BAR_HEIGHT = 150;
const DAY_MINUTES = 24 * 60;
const TIMELINE_TICKS = [0, 6, 12, 18, 24];

function getSessionEndDate(session: FocusSession) {
  const completedAt = new Date(session.completedAt);
  if (!Number.isNaN(completedAt.getTime())) {
    return completedAt;
  }

  return new Date(getSessionStartDate(session).getTime() + session.duration * 60_000);
}

function buildDayTimelineIntervals(sessions: FocusSession[], dayStart: Date): TimelineInterval[] {
  const dayEnd = new Date(dayStart.getTime() + DAY_MINUTES * 60_000);
  const laneEnds: number[] = [];

  return sessions
    .map((session) => {
      const rawStart = getSessionStartDate(session);
      const rawEnd = getSessionEndDate(session);
      const clippedStart = new Date(Math.max(rawStart.getTime(), dayStart.getTime()));
      const clippedEnd = new Date(Math.min(rawEnd.getTime(), dayEnd.getTime()));
      const durationMinutes = Math.max(0, Math.round((clippedEnd.getTime() - clippedStart.getTime()) / 60_000));

      if (durationMinutes <= 0) {
        return null;
      }

      const startMinutes = Math.max(
        0,
        Math.min(DAY_MINUTES, Math.round((clippedStart.getTime() - dayStart.getTime()) / 60_000))
      );
      const widthMinutes = Math.max(1, Math.round((clippedEnd.getTime() - clippedStart.getTime()) / 60_000));
      let lane = laneEnds.findIndex((endMinute) => startMinutes >= endMinute);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = startMinutes + widthMinutes + 4;

      const startLabel = formatLocalTime(clippedStart);
      const endLabel = formatLocalTime(clippedEnd);

      return {
        id: session.id,
        startLabel,
        endLabel,
        rangeLabel: `${startLabel}-${endLabel}`,
        durationMinutes,
        startPercent: (startMinutes / DAY_MINUTES) * 100,
        widthPercent: Math.max(0.8, (widthMinutes / DAY_MINUTES) * 100),
        lane,
        focusScore: session.focusScore ?? calculateFocusScore(session.pauseCount ?? 0, session.visibilityInterruptions ?? 0)
      };
    })
    .filter((interval): interval is TimelineInterval => interval !== null)
    .sort((a, b) => a.startPercent - b.startPercent);
}

function FocusHistory({
  minutesByDay,
  sessions,
  todayMinutes,
  monthOffset,
  onChangeMonth,
  mode,
  onChangeMode
}: {
  minutesByDay: Map<string, number>;
  sessions: FocusSession[];
  todayMinutes: number;
  monthOffset: number;
  onChangeMonth: (delta: number) => void;
  mode: HistoryMode;
  onChangeMode: (mode: HistoryMode) => void;
}) {
  const now = new Date();
  const viewed = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = viewed.getDay();
  const todayKey = getLocalDateKey(now);

  const days: DayDatum[] = [];
  let monthTotal = 0;
  let activeDays = 0;
  let maxMinutes = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = getLocalDateKey(new Date(year, month, day));
    const minutes = minutesByDay.get(key) ?? 0;
    monthTotal += minutes;
    if (minutes > 0) {
      activeDays += 1;
    }
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
    }
    days.push({ day, key, minutes });
  }

  const safeMax = Math.max(maxMinutes, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timelineIntervals = buildDayTimelineIntervals(sessions, todayStart);
  const timelineLaneCount = Math.max(1, ...timelineIntervals.map((interval) => interval.lane + 1));
  const timelineHeight = 38 + (timelineLaneCount - 1) * 18;
  const longestInterval = timelineIntervals.reduce<TimelineInterval | null>((best, interval) => {
    if (!best || interval.durationMinutes > best.durationMinutes) {
      return interval;
    }
    return best;
  }, null);

  return (
    <section className="ios-focus-card character-stage px-4 py-5">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-[var(--soft)] p-1 text-[11px] font-extrabold">
          <button
            type="button"
            onClick={() => onChangeMode("calendar")}
            aria-pressed={mode === "calendar"}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition active:scale-95 ${
              mode === "calendar" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
            }`}
          >
            <CalendarDays aria-hidden="true" size={14} strokeWidth={2.6} />
            달력
          </button>
          <button
            type="button"
            onClick={() => onChangeMode("chart")}
            aria-pressed={mode === "chart"}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition active:scale-95 ${
              mode === "chart" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
            }`}
          >
            <BarChart3 aria-hidden="true" size={14} strokeWidth={2.6} />
            그래프
          </button>
        </div>
      </div>

      <header className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          aria-label="이전 달"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)] active:scale-90"
        >
          <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.6} />
        </button>

        <div className="text-center">
          <div className="text-lg font-black">
            {year}년 {month + 1}월
          </div>
          <div className="text-[11px] font-bold text-[var(--muted)]">
            집중 {monthTotal}분 · {activeDays}일
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          disabled={monthOffset >= 0}
          aria-label="다음 달"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <ChevronRight aria-hidden="true" size={18} strokeWidth={2.6} />
        </button>
      </header>

      {mode === "calendar" ? (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-[var(--muted)]">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, blank) => (
              <div key={`blank-${blank}`} aria-hidden="true" />
            ))}
            {days.map((cell) => {
              const level = getFocusLevel(cell.minutes);
              const isToday = cell.key === todayKey;

              return (
                <div
                  key={cell.key}
                  title={`${cell.minutes}분 집중`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-extrabold ${
                    isToday ? "ring-2 ring-[var(--ink)]" : ""
                  }`}
                  style={{
                    backgroundColor: getCalendarCellColor(level),
                    color: level >= 3 ? "#ffffff" : "var(--ink)"
                  }}
                >
                  <span>{cell.day}</span>
                  {cell.minutes > 0 && (
                    <span className="text-[8px] font-bold leading-none opacity-80">
                      {cell.minutes}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <div className="flex h-40 items-end gap-[3px]" style={{ height: CHART_MAX_BAR_HEIGHT + 10 }}>
            {days.map((cell) => {
              const level = getFocusLevel(cell.minutes);
              const barHeight =
                cell.minutes <= 0
                  ? 3
                  : Math.max(6, Math.round((cell.minutes / safeMax) * CHART_MAX_BAR_HEIGHT));

              return (
                <div
                  key={cell.key}
                  title={`${cell.day}일 · ${cell.minutes}분`}
                  className="flex flex-1 flex-col justify-end"
                >
                  <div
                    className="w-full rounded-t-sm transition-[height] duration-300"
                    style={{
                      height: barHeight,
                      backgroundColor: cell.minutes > 0 ? getCalendarCellColor(level) : "var(--soft)",
                      outline: cell.key === todayKey ? "2px solid var(--ink)" : "none",
                      outlineOffset: "1px"
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex gap-[3px]">
            {days.map((cell) => (
              <div
                key={cell.key}
                className="flex-1 text-center text-[8px] font-bold text-[var(--muted)]"
              >
                {cell.day === 1 || cell.day % 5 === 0 ? cell.day : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] font-bold text-[var(--muted)]">
        <span>적음</span>
        {CALENDAR_LEVEL_ALPHA.map((_, level) => (
          <span
            key={level}
            className="h-3 w-3 rounded"
            style={{ backgroundColor: getCalendarCellColor(level) }}
          />
        ))}
        <span>많음</span>
      </div>

      <section className="ios-timeline-card mt-5 rounded-2xl bg-white/70 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black">오늘 24시간 집중 타임라인</h2>
            <p className="mt-1 text-sm font-extrabold text-[var(--accent)]">
              {historyActionCopy(todayMinutes)}
            </p>
          </div>
          <div className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-black text-[var(--ink)]">
            {todayMinutes}분
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--soft)] px-3 py-2">
            <div className="text-[10px] font-black text-[var(--muted)]">오늘 합계</div>
            <div className="mt-0.5 text-lg font-black">{todayMinutes}분</div>
          </div>
          <div className="rounded-xl bg-[var(--soft)] px-3 py-2">
            <div className="text-[10px] font-black text-[var(--muted)]">집중 구간</div>
            <div className="mt-0.5 text-lg font-black">{timelineIntervals.length}개</div>
          </div>
          <div className="rounded-xl bg-[var(--soft)] px-3 py-2">
            <div className="text-[10px] font-black text-[var(--muted)]">가장 긴 구간</div>
            <div className="mt-0.5 text-lg font-black">
              {longestInterval ? longestInterval.rangeLabel : "-"}
            </div>
          </div>
        </div>

        <div className="ios-day-timeline mt-4" role="list" aria-label="오늘 집중 세션 타임라인">
          <div className="ios-day-track" style={{ height: timelineHeight }}>
            {TIMELINE_TICKS.map((tick) => (
              <span
                key={tick}
                className="ios-time-guide"
                style={{ left: `${(tick / 24) * 100}%` }}
                aria-hidden="true"
              />
            ))}
            <span className="ios-day-track-line" aria-hidden="true" />
            {timelineIntervals.length > 0 ? (
              timelineIntervals.map((interval) => {
                const quality = getFocusQuality(interval.focusScore);

                return (
                  <span
                    key={interval.id}
                    role="listitem"
                    aria-label={`${interval.startLabel}부터 ${interval.endLabel}까지 ${interval.durationMinutes}분 집중`}
                    title={`${interval.rangeLabel} · ${interval.durationMinutes}분`}
                    className={`ios-focus-interval ios-focus-interval-${quality}`}
                    style={{
                      left: `${interval.startPercent}%`,
                      top: 11 + interval.lane * 18,
                      width: `${interval.widthPercent}%`
                    }}
                  />
                );
              })
            ) : (
              <span className="ios-timeline-empty">오늘의 첫 집중을 기다리는 중</span>
            )}
          </div>

          <div className="ios-timeline-axis" aria-hidden="true">
            {TIMELINE_TICKS.map((tick) => (
              <span key={tick}>{String(tick).padStart(2, "0")}</span>
            ))}
          </div>
        </div>

        {timelineIntervals.length > 0 && (
          <ol className="ios-session-list mt-3 space-y-2">
            {timelineIntervals.map((interval) => (
              <li key={interval.id} className="ios-session-row">
                <span className="ios-session-dot" aria-hidden="true" />
                <span className="min-w-0 flex-1 font-black">{interval.rangeLabel}</span>
                <span className="shrink-0 text-[var(--muted)]">{interval.durationMinutes}분</span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-3 rounded-xl bg-[var(--soft)] px-3 py-2 text-sm font-extrabold text-[var(--ink)]">
          {longestInterval
            ? `가장 긴 집중 ${longestInterval.rangeLabel}`
            : "오늘은 아직 집중한 구간이 없어요."}
        </p>
      </section>
    </section>
  );
}

const EGG_PATH =
  "M60 6 C84 6 104 42 104 84 C104 122 84 146 60 146 C36 146 16 122 16 84 C16 42 36 6 60 6 Z";

// 정체불명의 알 — 알 모양은 고정, 무늬(점)만 시드로 랜덤 생성
function RandomEgg({ seed }: { seed: number }) {
  const random = createSeededRandom(seed || 1);
  const clipId = `egg-clip-${seed}`;
  const baseId = `egg-base-${seed}`;

  const spots = Array.from({ length: EGG_SPOT_COUNT }, (_, index) => ({
    key: index,
    cx: 26 + random() * 68,
    cy: 30 + random() * 92,
    r: 5 + random() * 8,
    color: EGG_PATTERN_COLORS[Math.floor(random() * EGG_PATTERN_COLORS.length)],
    opacity: 0.55 + random() * 0.32
  }));

  return (
    <svg className="mystery-egg" viewBox="0 0 120 150" width="96" height="120" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={baseId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff9ee" />
          <stop offset="54%" stopColor="#f3e5c8" />
          <stop offset="100%" stopColor="#dbc496" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={EGG_PATH} />
        </clipPath>
      </defs>

      <path className="egg-shell" d={EGG_PATH} fill={`url(#${baseId})`} stroke="#ffffff" strokeWidth="3" />

      <g clipPath={`url(#${clipId})`}>
        <path
          className="egg-vein"
          d="M34 108 C46 96 45 78 58 68 C70 58 71 43 84 30"
          stroke="#c8b79e"
          strokeWidth="3"
          fill="none"
          opacity="0.32"
          strokeLinecap="round"
        />
        {spots.map((spot) => (
          <circle
            key={spot.key}
            className="egg-spot"
            cx={spot.cx}
            cy={spot.cy}
            r={spot.r}
            fill={spot.color}
            opacity={spot.opacity}
          />
        ))}
      </g>

      <ellipse className="egg-highlight" cx="43" cy="42" rx="13" ry="20" fill="rgba(255,255,255,0.58)" />
      <ellipse className="egg-core-glow" cx="70" cy="92" rx="13" ry="11" fill="rgba(131,207,104,0.24)" />
    </svg>
  );
}
