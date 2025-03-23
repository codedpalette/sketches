import type { AddressInfo } from "node:net"

import { defineConfig } from "vite"
import { startup as electronStartup } from "vite-plugin-electron"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    plugins: [
      tsconfigPaths(), // Resolve path aliases from tsconfig.json
      // Simple plugin to start electron process
      // Based on https://github.com/electron-vite/vite-plugin-electron but without restarts on hot reload
      {
        name: "start-electron",
        apply: "serve",
        configureServer(server) {
          server.httpServer?.once("listening", () => {
            const addressInfo = server.httpServer?.address() as AddressInfo
            process.env["VITE_DEV_SERVER_URL"] = `http://localhost:${addressInfo.port}`
            void electronStartup(["./electron.js"])
          })
        },
      },
    ],
  }
})
