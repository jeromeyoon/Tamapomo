import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export type SafeUser = {
  id: string;
  email: string;
  points: number;
  createdAt: string;
};

export type CharacterRecord = {
  id: string;
  userId: string;
  name: string;
  charType: "pyro";
  createdAt: string;
};

export type FocusSessionRecord = {
  id: string;
  userId: string;
  duration: number;
  completedAt: string;
  startedAt?: string;
  pauseCount?: number;
  visibilityInterruptions?: number;
  focusScore?: number;
};

export type FriendshipRecord = {
  userId: string;
  friendId: string;
  createdAt: string;
};

export type FriendSummary = SafeUser;

export type RankingPeriod = "today" | "week";

export type FocusRankingEntry = {
  userId: string;
  email: string;
  minutes: number;
  count: number;
  rank: number;
  isCurrentUser: boolean;
};

export type FocusRankingResult = {
  period: RankingPeriod;
  summary: string;
  rankings: FocusRankingEntry[];
};

export type DemoFriendsSeedResult = {
  friends: FriendSummary[];
};

export type Profile = {
  user: SafeUser;
  character: CharacterRecord;
  sessions: Array<Omit<FocusSessionRecord, "userId">>;
  stats: {
    todayMinutes: number;
    todayCount: number;
    weekMinutes: number;
    weekCount: number;
  };
};

type UserRecord = SafeUser & {
  passwordHash: string;
};

type AuthSessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type Database = {
  users: UserRecord[];
  characters: CharacterRecord[];
  focusSessions: FocusSessionRecord[];
  authSessions: AuthSessionRecord[];
  friendships: FriendshipRecord[];
};

const DEFAULT_DB_PATH = join(process.cwd(), ".data", "pomochi-db.json");
const INITIAL_POINTS = 20;
const VALID_DURATIONS = new Set([15, 25, 50]);
const DEMO_FRIEND_SEEDS: ReadonlyArray<{
  email: string;
  todaySessions: ReadonlyArray<{ duration: number; hour: number; minute: number }>;
}> = [
  {
    email: "minji.demo@pomochi.local",
    todaySessions: [
      { duration: 25, hour: 8, minute: 10 },
      { duration: 25, hour: 9, minute: 20 },
      { duration: 25, hour: 10, minute: 30 }
    ]
  },
  {
    email: "junseo.demo@pomochi.local",
    todaySessions: [{ duration: 50, hour: 9, minute: 0 }]
  },
  {
    email: "harin.demo@pomochi.local",
    todaySessions: [{ duration: 15, hour: 11, minute: 15 }]
  },
  {
    email: "doyun.demo@pomochi.local",
    todaySessions: []
  }
];

function emptyDb(): Database {
  return {
    users: [],
    characters: [],
    focusSessions: [],
    authSessions: [],
    friendships: []
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    points: user.points,
    createdAt: user.createdAt
  };
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const candidate = hashPassword(password, salt).split(":")[1];
  const storedBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");

  return storedBuffer.length === candidateBuffer.length && timingSafeEqual(storedBuffer, candidateBuffer);
}

function localDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localWeekStart(date: Date) {
  const start = localDayStart(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function isInRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time < end.getTime();
}

function dateAtLocalTime(anchor: Date, hour: number, minute: number) {
  const date = new Date(anchor);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function readDb(dbPath: string): Promise<Database> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
      authSessions: Array.isArray(parsed.authSessions) ? parsed.authSessions : [],
      friendships: Array.isArray(parsed.friendships) ? parsed.friendships : []
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return emptyDb();
    }
    throw error;
  }
}

async function writeDb(dbPath: string, db: Database) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export function createPomochiStore(dbPath = process.env.POMOCHI_DB_FILE || DEFAULT_DB_PATH) {
  let writeQueue = Promise.resolve();

  async function mutate<T>(callback: (db: Database) => T | Promise<T>) {
    const run = writeQueue.then(async () => {
      const db = await readDb(dbPath);
      const result = await callback(db);
      await writeDb(dbPath, db);
      return result;
    });

    writeQueue = run.then(
      () => undefined,
      () => undefined
    );

    return run;
  }

  return {
    async signup(email: string, password: string) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail.includes("@")) {
        throw new Error("Invalid email");
      }
      if (password.length < 6) {
        throw new Error("Password too short");
      }

      return mutate(async (db) => {
        if (db.users.some((user) => user.email === normalizedEmail)) {
          throw new Error("Email already exists");
        }

        const now = new Date().toISOString();
        const user: UserRecord = {
          id: randomUUID(),
          email: normalizedEmail,
          passwordHash: hashPassword(password),
          points: INITIAL_POINTS,
          createdAt: now
        };
        const character: CharacterRecord = {
          id: randomUUID(),
          userId: user.id,
          name: "불꽃이",
          charType: "pyro",
          createdAt: now
        };

        db.users.push(user);
        db.characters.push(character);

        return { user: toSafeUser(user), character };
      });
    },

    async login(email: string, password: string) {
      const normalizedEmail = normalizeEmail(email);
      const db = await readDb(dbPath);
      const user = db.users.find((candidate) => candidate.email === normalizedEmail);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new Error("Invalid credentials");
      }

      return toSafeUser(user);
    },

    async createSession(userId: string) {
      return mutate((db) => {
        const user = db.users.find((candidate) => candidate.id === userId);
        if (!user) {
          throw new Error("User not found");
        }

        const createdAt = new Date();
        const expiresAt = new Date(createdAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        const session: AuthSessionRecord = {
          token: randomBytes(32).toString("hex"),
          userId,
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt.toISOString()
        };

        db.authSessions.push(session);
        return session;
      });
    },

    async getUserBySessionToken(token: string | undefined) {
      if (!token) {
        return null;
      }

      const db = await readDb(dbPath);
      const session = db.authSessions.find((candidate) => candidate.token === token);
      if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
        return null;
      }

      const user = db.users.find((candidate) => candidate.id === session.userId);
      return user ? toSafeUser(user) : null;
    },

    async deleteSession(token: string | undefined) {
      if (!token) {
        return;
      }

      await mutate((db) => {
        db.authSessions = db.authSessions.filter((session) => session.token !== token);
      });
    },

    async recordCompletedFocus(
      userId: string,
      duration: number,
      completedAt = new Date(),
      metadata: {
        startedAt?: Date;
        pauseCount?: number;
        visibilityInterruptions?: number;
        focusScore?: number;
      } = {}
    ) {
      if (!VALID_DURATIONS.has(duration)) {
        throw new Error("Invalid duration");
      }

      return mutate((db) => {
        const user = db.users.find((candidate) => candidate.id === userId);
        if (!user) {
          throw new Error("User not found");
        }

        const session: FocusSessionRecord = {
          id: randomUUID(),
          userId,
          duration,
          completedAt: completedAt.toISOString(),
          startedAt: metadata.startedAt?.toISOString(),
          pauseCount: metadata.pauseCount,
          visibilityInterruptions: metadata.visibilityInterruptions,
          focusScore: metadata.focusScore
        };

        db.focusSessions.push(session);
        user.points += 5;
        return {
          id: session.id,
          duration: session.duration,
          completedAt: session.completedAt,
          startedAt: session.startedAt,
          pauseCount: session.pauseCount,
          visibilityInterruptions: session.visibilityInterruptions,
          focusScore: session.focusScore
        };
      });
    },

    async addFriendByEmail(userId: string, friendEmail: string): Promise<FriendSummary> {
      const normalizedEmail = normalizeEmail(friendEmail);

      return mutate((db) => {
        const user = db.users.find((candidate) => candidate.id === userId);
        const friend = db.users.find((candidate) => candidate.email === normalizedEmail);

        if (!user) {
          throw new Error("User not found");
        }
        if (!friend) {
          throw new Error("Friend not found");
        }
        if (friend.id === userId) {
          throw new Error("Cannot add yourself");
        }

        const now = new Date().toISOString();
        const ensureFriendship = (from: string, to: string) => {
          if (!db.friendships.some((entry) => entry.userId === from && entry.friendId === to)) {
            db.friendships.push({ userId: from, friendId: to, createdAt: now });
          }
        };

        ensureFriendship(userId, friend.id);
        ensureFriendship(friend.id, userId);
        return toSafeUser(friend);
      });
    },

    async getFriends(userId: string): Promise<FriendSummary[]> {
      const db = await readDb(dbPath);
      const friendIds = new Set(
        db.friendships
          .filter((entry) => entry.userId === userId)
          .map((entry) => entry.friendId)
      );

      return db.users
        .filter((user) => friendIds.has(user.id))
        .map(toSafeUser)
        .sort((first, second) => first.email.localeCompare(second.email));
    },

    async getFocusRankings(userId: string, period: RankingPeriod, now = new Date()): Promise<FocusRankingResult> {
      const db = await readDb(dbPath);
      const user = db.users.find((candidate) => candidate.id === userId);
      if (!user) {
        throw new Error("User not found");
      }

      const friends = db.friendships
        .filter((entry) => entry.userId === userId)
        .map((entry) => entry.friendId);
      const participantIds = Array.from(new Set([userId, ...friends]));
      const start = period === "today" ? localDayStart(now) : localWeekStart(now);
      const end = new Date(start);
      end.setDate(end.getDate() + (period === "today" ? 1 : 7));

      const rankings = participantIds
        .map((participantId) => {
          const participant = db.users.find((candidate) => candidate.id === participantId);
          const sessions = db.focusSessions.filter(
            (session) =>
              session.userId === participantId &&
              isInRange(new Date(session.completedAt), start, end)
          );

          return {
            userId: participantId,
            email: participant?.email ?? "unknown",
            minutes: sessions.reduce((sum, session) => sum + session.duration, 0),
            count: sessions.length,
            rank: 0,
            isCurrentUser: participantId === userId
          };
        })
        .sort((first, second) => second.minutes - first.minutes || first.email.localeCompare(second.email))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      const me = rankings.find((entry) => entry.isCurrentUser);
      const leader = rankings[0];
      const periodLabel = period === "today" ? "오늘" : "이번 주";
      let summary = `${periodLabel} 아직 친구와의 집중 기록이 없어요.`;

      if (me && leader && leader.userId === userId) {
        const next = rankings.find((entry) => !entry.isCurrentUser);
        summary = next
          ? `${periodLabel} ${next.email}님보다 ${me.minutes - next.minutes}분 앞서 있어요.`
          : `${periodLabel} 첫 기록을 남겨 친구를 초대해 보세요.`;
      } else if (me && leader) {
        summary = `${leader.email}님이 ${periodLabel} ${leader.minutes - me.minutes}분 앞서 있어요.`;
      }

      return { period, summary, rankings };
    },

    async seedDemoFriends(userId: string, now = new Date()): Promise<DemoFriendsSeedResult> {
      return mutate((db) => {
        const user = db.users.find((candidate) => candidate.id === userId);
        if (!user) {
          throw new Error("User not found");
        }

        const createdAt = now.toISOString();
        const demoUsers = DEMO_FRIEND_SEEDS.map((seed) => {
          let demoUser = db.users.find((candidate) => candidate.email === seed.email);
          if (!demoUser) {
            demoUser = {
              id: randomUUID(),
              email: seed.email,
              passwordHash: hashPassword(randomUUID()),
              points: INITIAL_POINTS,
              createdAt
            };
            db.users.push(demoUser);
          }

          if (!db.characters.some((character) => character.userId === demoUser.id)) {
            db.characters.push({
              id: randomUUID(),
              userId: demoUser.id,
              name: "불꽃이",
              charType: "pyro",
              createdAt
            });
          }

          return { seed, user: demoUser };
        });

        const demoUserIds = new Set(demoUsers.map((entry) => entry.user.id));
        db.focusSessions = db.focusSessions.filter((session) => !demoUserIds.has(session.userId));

        const ensureFriendship = (from: string, to: string) => {
          if (!db.friendships.some((entry) => entry.userId === from && entry.friendId === to)) {
            db.friendships.push({ userId: from, friendId: to, createdAt });
          }
        };

        for (const demo of demoUsers) {
          ensureFriendship(userId, demo.user.id);
          ensureFriendship(demo.user.id, userId);

          for (const session of demo.seed.todaySessions) {
            const completedAt = dateAtLocalTime(now, session.hour, session.minute);
            const startedAt = new Date(completedAt.getTime() - session.duration * 60_000);
            db.focusSessions.push({
              id: randomUUID(),
              userId: demo.user.id,
              duration: session.duration,
              startedAt: startedAt.toISOString(),
              completedAt: completedAt.toISOString(),
              pauseCount: 0,
              visibilityInterruptions: 0,
              focusScore: 95
            });
          }
        }

        return {
          friends: demoUsers.map((entry) => toSafeUser(entry.user))
        };
      });
    },

    async getProfile(userId: string, now = new Date()): Promise<Profile> {
      return mutate((db) => {
        const user = db.users.find((candidate) => candidate.id === userId);
        if (!user) {
          throw new Error("User not found");
        }

        let character = db.characters.find((candidate) => candidate.userId === userId);
        if (!character) {
          character = {
            id: randomUUID(),
            userId,
            name: "불꽃이",
            charType: "pyro" as const,
            createdAt: new Date().toISOString()
          };
          db.characters.push(character);
        }

        const sessions = db.focusSessions
          .filter((session) => session.userId === userId)
          .sort((first, second) => new Date(second.completedAt).getTime() - new Date(first.completedAt).getTime());

        const todayStart = localDayStart(now);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const weekStart = localWeekStart(now);
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        const todaySessions = sessions.filter((session) =>
          isInRange(new Date(session.completedAt), todayStart, tomorrowStart)
        );
        const weekSessions = sessions.filter((session) =>
          isInRange(new Date(session.completedAt), weekStart, nextWeekStart)
        );

        return {
          user: toSafeUser(user),
          character,
          sessions: sessions.map(({ userId: _userId, ...session }) => session),
          stats: {
            todayMinutes: todaySessions.reduce((sum, session) => sum + session.duration, 0),
            todayCount: todaySessions.length,
            weekMinutes: weekSessions.reduce((sum, session) => sum + session.duration, 0),
            weekCount: weekSessions.length
          }
        };
      });
    }
  };
}

export const pomochiStore = createPomochiStore();
