import type { CalendarApi, CalendarEvent, CalendarSettings, CreateEventInput, UpdateEventInput } from "../types/calendar";

const fallbackStorageKey = "seoldam-calendar-classic:fallback-events";
const fallbackSettingsKey = "seoldam-calendar-classic:fallback-settings";

function readFallbackEvents(): CalendarEvent[] {
  try {
    return JSON.parse(window.localStorage.getItem(fallbackStorageKey) ?? "[]") as CalendarEvent[];
  } catch {
    return [];
  }
}

function writeFallbackEvents(events: CalendarEvent[]) {
  window.localStorage.setItem(fallbackStorageKey, JSON.stringify(events));
}

function readFallbackSettings(): CalendarSettings {
  try {
    return JSON.parse(window.localStorage.getItem(fallbackSettingsKey) ?? "{}") as CalendarSettings;
  } catch {
    return {};
  }
}

function writeFallbackSettings(settings: CalendarSettings) {
  window.localStorage.setItem(fallbackSettingsKey, JSON.stringify(settings));
}

function createFallbackCalendarApi(): CalendarApi {
  return {
    events: {
      async getByDate(date: string) {
        return readFallbackEvents()
          .filter((event) => event.date === date)
          .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
      },
      async getByMonth(month: string) {
        return readFallbackEvents()
          .filter((event) => event.date.startsWith(`${month}-`))
          .sort((a, b) => `${a.date} ${a.time ?? "99:99"}`.localeCompare(`${b.date} ${b.time ?? "99:99"}`));
      },
      async create(input: CreateEventInput) {
        const events = readFallbackEvents();
        const now = new Date().toISOString();
        const event: CalendarEvent = {
          id: Date.now(),
          date: input.date,
          time: input.time?.trim() || null,
          title: input.title.trim(),
          memo: input.memo?.trim() || null,
          color: input.color || "blue",
          created_at: now,
          updated_at: now
        };

        writeFallbackEvents([...events, event]);
        return event;
      },
      async update(input: UpdateEventInput) {
        const events = readFallbackEvents();
        const index = events.findIndex((event) => event.id === input.id);

        if (index < 0) {
          throw new Error("Event not found");
        }

        const current = events[index];
        const updated: CalendarEvent = {
          ...current,
          date: input.date ?? current.date,
          time: input.time === undefined ? current.time : input.time?.trim() || null,
          title: input.title?.trim() || current.title,
          memo: input.memo === undefined ? current.memo : input.memo?.trim() || null,
          color: input.color || current.color,
          updated_at: new Date().toISOString()
        };

        events[index] = updated;
        writeFallbackEvents(events);
        return updated;
      },
      async delete(id: number) {
        const events = readFallbackEvents();
        const nextEvents = events.filter((event) => event.id !== id);
        writeFallbackEvents(nextEvents);
        return nextEvents.length !== events.length;
      }
    },
    settings: {
      async getAll() {
        return {
          calendar_start_day: "sunday",
          weather_location: "Seoul",
          theme: "light",
          ...readFallbackSettings()
        };
      },
      async set(key: string, value: string) {
        const settings = readFallbackSettings();
        settings[key] = value;
        writeFallbackSettings(settings);
        return { key, value };
      }
    },
    app: {
      async quit() {
        window.close();
      },
      async reload() {
        window.location.reload();
      }
    }
  };
}

export function getCalendarApi(): CalendarApi {
  if (window.calendarApi) {
    return window.calendarApi;
  }

  console.warn("window.calendarApi is not available. Using browser fallback API.");
  return createFallbackCalendarApi();
}
