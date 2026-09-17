"use strict";

const { app, BrowserWindow, Menu, nativeTheme, session } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_ID = "com.starsprout.riftrun";
const GAME_FILE = path.join(__dirname, "..", "public", "play", "index.html");
const ICON_FILE = path.join(__dirname, "assets", "icon.png");
const GAME_URL = pathToFileURL(GAME_FILE).href;

app.setAppUserModelId(APP_ID);
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let mainWindow = null;

function isGameUrl(url) {
  return url === GAME_URL || url.startsWith(`${GAME_URL}#`) || url.startsWith(`${GAME_URL}?`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "星芽跃界",
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#071c27",
    icon: ICON_FILE,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
      devTools: !app.isPackaged,
      backgroundThrottling: true,
    },
  });

  const { webContents } = mainWindow;

  webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  webContents.on("will-navigate", (event, url) => {
    if (!isGameUrl(url)) event.preventDefault();
  });
  webContents.on("will-redirect", (event, url) => {
    if (!isGameUrl(url)) event.preventDefault();
  });
  webContents.on("will-attach-webview", (event) => event.preventDefault());
  webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadFile(GAME_FILE).catch((error) => {
    console.error("无法载入离线游戏：", error);
    app.quit();
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    nativeTheme.themeSource = "dark";
    Menu.setApplicationMenu(null);

    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    session.defaultSession.on("will-download", (event) => event.preventDefault());

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
