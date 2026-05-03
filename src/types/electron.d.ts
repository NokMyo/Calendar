import type { CalendarApi } from "./calendar";

declare global {
  interface Window {
    calendarApi: CalendarApi;
  }
}

export {};
