const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const target = process.argv[2] || path.join(process.cwd(), "artifacts", "menu.png");
const query = process.argv[3] || "";

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    frame: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  const errors = [];
  win.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) errors.push(message);
  });
  win.webContents.on("did-fail-load", (_event, code, description) => {
    errors.push(`${code}: ${description}`);
  });

  const gameFile = path.join(process.cwd(), "public", "play", "index.html");
  await win.loadFile(gameFile, query ? { query: Object.fromEntries(new URLSearchParams(query)) } : undefined);
  if (query.includes("boss=1")) {
    await win.webContents.executeJavaScript("window.__STARSPROUT_TEST__?.enterBossArena()", true);
  }
  const previewX = new URLSearchParams(query).get("x");
  if (previewX) {
    await win.webContents.executeJavaScript(`window.__STARSPROUT_TEST__?.teleport(${Number(previewX)}, 420)`, true);
  }
  await new Promise((resolve) => setTimeout(resolve, query.includes("capture=1") ? 800 : 450));
  const image = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, image.toPNG());
  process.stdout.write(JSON.stringify({ target, size: image.getSize(), errors }));
  app.quit();
});
