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

export type CalendarSettings = Record<string, string>;

export type CalendarApi = {
  events: {
    getByDate: (date: string) => Promise<CalendarEvent[]>;
    getByMonth: (month: string) => Promise<CalendarEvent[]>;
    create: (input: CreateEventInput) => Promise<CalendarEvent>;
    update: (input: UpdateEventInput) => Promise<CalendarEvent>;
    delete: (id: number) => Promise<boolean>;
  };
  settings: {
    getAll: () => Promise<CalendarSettings>;
    set: (key: string, value: string) => Promise<{ key: string; value: string }>;
  };
  app: {
    quit: () => Promise<void>;
    reload: () => Promise<void>;
  };
};
