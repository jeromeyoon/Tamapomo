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
};

const DEFAULT_DB_PATH = join(process.cwd(), ".data", "pomochi-db.json");
const INITIAL_POINTS = 20;
const VALID_DURATIONS = new Set([15, 25, 50]);

function emptyDb(): Database {
  return {
    users: [],
    characters: [],
    focusSessions: [],
    authSessions: []
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

async function readDb(dbPath: string): Promise<Database> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
      authSessions: Array.isArray(parsed.authSessions) ? parsed.authSessions : []
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

    async recordCompletedFocus(userId: string, duration: number, completedAt = new Date()) {
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
          completedAt: completedAt.toISOString()
        };

        db.focusSessions.push(session);
        user.points += 5;
        return {
          id: session.id,
          duration: session.duration,
          completedAt: session.completedAt
        };
      });
    },

    async getProfile(userId: string, now = new Date()): Promise<Profile> {
      const db = await readDb(dbPath);
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
          charType: "pyro",
          createdAt: new Date().toISOString()
        };
        db.characters.push(character);
        await writeDb(dbPath, db);
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
    }
  };
}

export const pomochiStore = createPomochiStore();
