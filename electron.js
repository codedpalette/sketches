// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app, BrowserWindow } = require("electron")

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({ width: 1080, height: 1080 })
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
})
app.on("window-all-closed", app.quit)
