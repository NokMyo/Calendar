import { contextBridge, ipcRenderer } from "electron";

type CreateEventInput = {
  date: string;
  time?: string | null;
  title: string;
  memo?: string | null;
  color?: string | null;
};

type UpdateEventInput = Partial<CreateEventInput> & {
  id: number;
};

contextBridge.exposeInMainWorld("calendarApi", {
  events: {
    getByDate: (date: string) => ipcRenderer.invoke("events:getByDate", date),
    getByMonth: (month: string) => ipcRenderer.invoke("events:getByMonth", month),
    create: (input: CreateEventInput) => ipcRenderer.invoke("events:create", input),
    update: (input: UpdateEventInput) => ipcRenderer.invoke("events:update", input),
    delete: (id: number) => ipcRenderer.invoke("events:delete", id)
  },
  settings: {
    getAll: () => ipcRenderer.invoke("settings:getAll"),
    set: (key: string, value: string) => ipcRenderer.invoke("settings:set", key, value)
  },
  app: {
    quit: () => ipcRenderer.invoke("app:quit"),
    reload: () => ipcRenderer.invoke("app:reload")
  }
});
