import type { AddressInfo } from "node:net"

import { defineConfig } from "vite"
import { startup as electronStartup } from "vite-plugin-electron"
import glsl from "vite-plugin-glsl"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    base: "/sketches/",
    plugins: [
      glsl({ root: "library/glsl" }),
      nodePolyfills(),
      tsconfigPaths(),
      // Simple plugin to start electron process
      // Based on https://github.com/electron-vite/vite-plugin-electron but without restarts on hot reload
      {
        name: "start-electron",
        apply: "serve",
        configureServer(server) {
          server.httpServer?.once("listening", () => {
            const addressInfo = server.httpServer?.address() as AddressInfo
            process.env.VITE_DEV_SERVER_URL = `http://localhost:${addressInfo.port}`
            void electronStartup()
          })
        },
      },
    ],
    server: {
      headers: {
        // Needed for mp4 export
        // Also, you have to enable SharedArrayBuffers
        // https://subscription.packtpub.com/book/web-development/9781788628174/5/ch05lvl1sec48/enabling-sharedarraybuffers-in-chrome
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  }
})
