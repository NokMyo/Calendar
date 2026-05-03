import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { getCalendarApi } from "./services/calendarApi";
import type { CalendarEvent, CalendarSettings, CreateEventInput } from "./types/calendar";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const calendarApi = getCalendarApi();

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function App() {
  const [now, setNow] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({});
  const [view, setView] = useState<"calendar" | "settings">("calendar");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedDateKey = toDateKey(selectedDate);
  const currentMonthKey = toMonthKey(currentMonth);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  async function refreshMonthEvents() {
    try {
      const events = await calendarApi.events.getByMonth(currentMonthKey);
      setMonthEvents(Array.isArray(events) ? events : []);
      setLoadError(null);
    } catch (error) {
      console.error(error);
      setMonthEvents([]);
      setLoadError("월간 일정을 불러오지 못했습니다.");
    }
  }

  async function refreshSelectedEvents() {
    try {
      const events = await calendarApi.events.getByDate(selectedDateKey);
      setSelectedEvents(Array.isArray(events) ? events : []);
      setLoadError(null);
    } catch (error) {
      console.error(error);
      setSelectedEvents([]);
      setLoadError("선택한 날짜의 일정을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refreshMonthEvents();
  }, [currentMonthKey]);

  useEffect(() => {
    void refreshSelectedEvents();
  }, [selectedDateKey]);

  useEffect(() => {
    calendarApi.settings
      .getAll()
      .then((nextSettings) => setSettings(nextSettings ?? {}))
      .catch((error) => {
        console.error(error);
        setSettings({});
        setLoadError("설정을 불러오지 못했습니다.");
      });
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventCountByDate = useMemo(() => {
    return monthEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.date] = (acc[event.date] ?? 0) + 1;
      return acc;
    }, {});
  }, [monthEvents]);

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    const input: CreateEventInput = {
      date: selectedDateKey,
      time: time.trim() || null,
      title: title.trim(),
      memo: memo.trim() || null,
      color: "blue"
    };

    setIsSaving(true);

    try {
      await calendarApi.events.create(input);
      setTitle("");
      setTime("");
      setMemo("");
      await Promise.all([refreshMonthEvents(), refreshSelectedEvents()]);
    } catch (error) {
      console.error(error);
      setLoadError("일정을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEvent(id: number) {
    try {
      await calendarApi.events.delete(id);
      await Promise.all([refreshMonthEvents(), refreshSelectedEvents()]);
    } catch (error) {
      console.error(error);
      setLoadError("일정을 삭제하지 못했습니다.");
    }
  }

  async function handleSettingChange(key: string, value: string) {
    try {
      await calendarApi.settings.set(key, value);
      setSettings((previous) => ({ ...previous, [key]: value }));
    } catch (error) {
      console.error(error);
      setLoadError("설정을 저장하지 못했습니다.");
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <span className="eyebrow">Seoldam Calendar Classic</span>
          <h1>{format(currentMonth, "yyyy년 M월", { locale: ko })}</h1>
        </div>

        <nav className="top-nav" aria-label="메인 메뉴">
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>캘린더</button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>설정</button>
        </nav>

        <div className="clock-block">
          <strong>{format(now, "HH:mm")}</strong>
          <span>{format(now, "M월 d일 EEEE", { locale: ko })}</span>
        </div>
      </header>

      {loadError && <div className="error-toast">{loadError}</div>}

      {view === "calendar" ? (
        <main className="calendar-layout">
          <section className="calendar-card">
            <div className="calendar-toolbar">
              <button onClick={() => setCurrentMonth((date) => subMonths(date, 1))}>이전</button>
              <button className="today-button" onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setCurrentMonth(startOfMonth(today));
              }}>오늘</button>
              <button onClick={() => setCurrentMonth((date) => addMonths(date, 1))}>다음</button>
            </div>

            <div className="weekday-grid">
              {weekdays.map((weekday) => (
                <div key={weekday}>{weekday}</div>
              ))}
            </div>

            <div className="month-grid">
              {calendarDays.map((date) => {
                const dateKey = toDateKey(date);
                const count = eventCountByDate[dateKey] ?? 0;

                return (
                  <button
                    key={dateKey}
                    className={[
                      "day-cell",
                      !isSameMonth(date, currentMonth) ? "muted" : "",
                      isToday(date) ? "today" : "",
                      isSameDay(date, selectedDate) ? "selected" : ""
                    ].filter(Boolean).join(" ")}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className="day-number">{format(date, "d")}</span>
                    {count > 0 && <span className="event-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="side-panel">
            <section className="weather-card">
              <div>
                <span className="eyebrow">날씨</span>
                <h2>{settings.weather_location ?? "Seoul"}</h2>
              </div>
              <strong>22°</strong>
              <p>맑음 · 날씨 API 연결 예정</p>
            </section>

            <section className="event-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">선택한 날짜</span>
                  <h2>{format(selectedDate, "M월 d일 EEEE", { locale: ko })}</h2>
                </div>
              </div>

              <form className="event-form" onSubmit={handleCreateEvent}>
                <input type="time" value={time} onChange={(event) => setTime(event.target.value)} aria-label="일정 시간" />
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="일정 제목" aria-label="일정 제목" />
                <input type="text" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모 선택 입력" aria-label="일정 메모" />
                <button type="submit" disabled={isSaving || !title.trim()}>{isSaving ? "저장 중" : "+ 일정 추가"}</button>
              </form>

              <div className="event-list">
                {selectedEvents.length === 0 ? (
                  <div className="empty-state">등록된 일정이 없습니다.</div>
                ) : (
                  selectedEvents.map((event) => (
                    <article className="event-item" key={event.id}>
                      <div>
                        <time>{event.time ?? "종일"}</time>
                        <h3>{event.title}</h3>
                        {event.memo && <p>{event.memo}</p>}
                      </div>
                      <button onClick={() => void handleDeleteEvent(event.id)} aria-label={`${event.title} 삭제`}>삭제</button>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </main>
      ) : (
        <main className="settings-layout">
          <section className="settings-card">
            <span className="eyebrow">Settings</span>
            <h2>일반</h2>
            <label>
              캘린더 시작 요일
              <select value={settings.calendar_start_day ?? "sunday"} onChange={(event) => void handleSettingChange("calendar_start_day", event.target.value)}>
                <option value="sunday">일요일</option>
                <option value="monday">월요일</option>
              </select>
            </label>
          </section>

          <section className="settings-card">
            <span className="eyebrow">Display</span>
            <h2>화면</h2>
            <label>
              테마
              <select value={settings.theme ?? "light"} onChange={(event) => void handleSettingChange("theme", event.target.value)}>
                <option value="light">라이트</option>
                <option value="dark">다크</option>
              </select>
            </label>
          </section>

          <section className="settings-card">
            <span className="eyebrow">Weather</span>
            <h2>날씨</h2>
            <label>
              위치
              <input value={settings.weather_location ?? "Seoul"} onChange={(event) => void handleSettingChange("weather_location", event.target.value)} />
            </label>
          </section>

          <section className="settings-card danger-zone">
            <span className="eyebrow">System</span>
            <h2>종료</h2>
            <button onClick={() => void calendarApi.app.reload()}>새로고침</button>
            <button onClick={() => void calendarApi.app.quit()}>프로그램 종료</button>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
