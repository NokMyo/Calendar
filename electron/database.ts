import Database from "better-sqlite3";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export type CalendarEvent = {
  id: number;
  date: string;
  time: string | null;
  title: string;
  memo: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

export type CreateEventInput = {
  date: string;
  time?: string | null;
  title: string;
  memo?: string | null;
  color?: string | null;
};

export type UpdateEventInput = Partial<CreateEventInput> & {
  id: number;
};

let db: Database.Database | null = null;

function getDatabasePath() {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "calendar.db");
}

function getDatabase() {
  if (!db) {
    db = new Database(getDatabasePath());
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

export function initDatabase() {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT,
      title TEXT NOT NULL,
      memo TEXT,
      color TEXT NOT NULL DEFAULT 'blue',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_events_date_time
    ON events(date, time);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insertDefaultSetting = database.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );

  insertDefaultSetting.run("calendar_start_day", "sunday");
  insertDefaultSetting.run("weather_location", "Seoul");
  insertDefaultSetting.run("theme", "light");
}

export function getEventsByDate(date: string): CalendarEvent[] {
  return getDatabase()
    .prepare("SELECT * FROM events WHERE date = ? ORDER BY time IS NULL, time ASC, id ASC")
    .all(date) as CalendarEvent[];
}

export function getEventsByMonth(month: string): CalendarEvent[] {
  return getDatabase()
    .prepare("SELECT * FROM events WHERE date LIKE ? ORDER BY date ASC, time IS NULL, time ASC, id ASC")
    .all(`${month}-%`) as CalendarEvent[];
}

export function createEvent(input: CreateEventInput) {
  const result = getDatabase()
    .prepare(`
      INSERT INTO events (date, time, title, memo, color)
      VALUES (@date, @time, @title, @memo, @color)
    `)
    .run({
      date: input.date,
      time: input.time?.trim() || null,
      title: input.title.trim(),
      memo: input.memo?.trim() || null,
      color: input.color || "blue"
    });

  return getEventById(Number(result.lastInsertRowid));
}

export function updateEvent(input: UpdateEventInput) {
  const current = getEventById(input.id);

  if (!current) {
    throw new Error("Event not found");
  }

  getDatabase()
    .prepare(`
      UPDATE events
      SET date = @date,
          time = @time,
          title = @title,
          memo = @memo,
          color = @color,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    .run({
      id: input.id,
      date: input.date ?? current.date,
      time: input.time === undefined ? current.time : input.time?.trim() || null,
      title: input.title?.trim() || current.title,
      memo: input.memo === undefined ? current.memo : input.memo?.trim() || null,
      color: input.color || current.color
    });

  return getEventById(input.id);
}

export function deleteEvent(id: number) {
  return getDatabase().prepare("DELETE FROM events WHERE id = ?").run(id).changes > 0;
}

export function getEventById(id: number): CalendarEvent | null {
  const event = getDatabase().prepare("SELECT * FROM events WHERE id = ?").get(id) as
    | CalendarEvent
    | undefined;

  return event ?? null;
}

export function getSetting(key: string) {
  const row = getDatabase().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;

  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDatabase()
    .prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value);

  return { key, value };
}

export function getAllSettings() {
  const rows = getDatabase().prepare("SELECT key, value FROM settings ORDER BY key ASC").all() as Array<{
    key: string;
    value: string;
  }>;

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
