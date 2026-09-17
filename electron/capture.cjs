const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const target = process.argv[2] || path.join(process.cwd(), "artifacts", "menu.png");
const query = (process.argv[3] || "").replaceAll(",", "&");
const queryParams = new URLSearchParams(query);
const captureWidth = Math.max(360, Number(queryParams.get("width")) || 1280);
const captureHeight = Math.max(320, Number(queryParams.get("height")) || 720);
const captureProfile = fs.mkdtempSync(path.join(os.tmpdir(), "starsprout-capture-"));
app.setPath("userData", captureProfile);

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: captureWidth,
    height: captureHeight,
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
  const capture = async (params, output) => {
    await win.loadFile(gameFile, { query: Object.fromEntries(params) });
    if (params.get("boss") === "1") {
      await win.webContents.executeJavaScript("window.__STARSPROUT_TEST__?.enterBossArena()", true);
    }
    const previewX = params.get("x");
    const previewY = params.get("y");
    if (previewX) {
      await win.webContents.executeJavaScript(`window.__STARSPROUT_TEST__?.teleport(${Number(previewX)}, ${Number(previewY) || 420})`, true);
    }
    await new Promise((resolve) => setTimeout(resolve, params.get("capture") === "1" ? 800 : 450));
    const image = await win.webContents.capturePage();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, image.toPNG());
    return { target: output, size: image.getSize() };
  };

  if (queryParams.get("all") === "1") {
    const previewX = [800, 1600, 2200, 0, 1800, 1800, 2000, 0, 1900, 2100, 2500, 0, 1900, 1900, 2700, 0];
    const results = [];
    for (let level = 1; level <= 16; level += 1) {
      const params = new URLSearchParams({ level: String(level), autostart: "1", capture: "1" });
      if ([4, 8, 12, 16].includes(level)) params.set("boss", "1");
      else params.set("x", String(previewX[level - 1]));
      results.push(await capture(params, path.join(target, `stage-${String(level).padStart(2, "0")}.png`)));
    }
    process.stdout.write(JSON.stringify({ results, errors }));
  } else {
    const result = await capture(queryParams, target);
    process.stdout.write(JSON.stringify({ ...result, errors }));
  }
  app.quit();
}).catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  app.exit(1);
});
