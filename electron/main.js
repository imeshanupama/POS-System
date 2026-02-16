const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let backendProcess;

function startBackend() {
  const isPackaged = app.isPackaged;
  const backendRoot = isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.resolve(__dirname, "../backend");

  const backendPath = path.join(backendRoot, "dist/backend/src/index.js");
  const dbPath = path.join(backendRoot, "pos.db");

  console.log("Starting backend from:", backendPath);
  console.log("Using database:", dbPath);
  console.log("Backend Root:", backendRoot);

  backendProcess = spawn("node", [backendPath], {
    cwd: backendRoot,
    stdio: "inherit",
    env: { ...process.env, DB_PATH: dbPath, PORT: "3000" }
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the built frontend
  const frontendPath = app.isPackaged
    ? path.join(__dirname, "frontend_dist/index.html")
    : path.join(__dirname, "../frontend/dist/index.html");

  win.loadFile(frontendPath);

  // win.webContents.openDevTools(); // Optional: View console logs
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopBackend();
    app.quit();
  }
});

app.on("will-quit", () => {
  stopBackend();
});
