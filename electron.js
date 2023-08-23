// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app, BrowserWindow } = require("electron")

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"
app.whenReady().then(() =>
  new BrowserWindow({
    width: 1080,
    height: 1080,
    webPreferences: { enableBlinkFeatures: "PreciseMemoryInfo" },
  }).loadURL(process.env.VITE_DEV_SERVER_URL)
)
app.on("window-all-closed", app.quit)
