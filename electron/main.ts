import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEvent,
  deleteEvent,
  getAllSettings,
  getEventsByDate,
  getEventsByMonth,
  initDatabase,
  setSetting,
  updateEvent
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const launchMode = process.env.SEOLDAM_LAUNCH_MODE ?? "windowed";
const isKiosk = launchMode === "kiosk";

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: "#f5f0e8",
    title: "Seoldam Calendar Classic",
    fullscreen: isKiosk,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return window;
}

function registerIpcHandlers() {
  ipcMain.handle("events:getByDate", (_event, date: string) => getEventsByDate(date));
  ipcMain.handle("events:getByMonth", (_event, month: string) => getEventsByMonth(month));
  ipcMain.handle("events:create", (_event, input) => createEvent(input));
  ipcMain.handle("events:update", (_event, input) => updateEvent(input));
  ipcMain.handle("events:delete", (_event, id: number) => deleteEvent(id));

  ipcMain.handle("settings:getAll", () => getAllSettings());
  ipcMain.handle("settings:set", (_event, key: string, value: string) => setSetting(key, value));

  ipcMain.handle("app:quit", () => app.quit());
  ipcMain.handle("app:reload", () => BrowserWindow.getFocusedWindow()?.reload());
}

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
