import type { AddressInfo } from "node:net"

import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { startup as electronStartup } from "vite-plugin-electron"
import { externalizeDeps } from "vite-plugin-externalize-deps"
import glsl from "vite-plugin-glsl"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    base: "/sketches/",
    plugins: [
      externalizeDeps({ devDeps: true }),
      dts({ rollupTypes: true }),
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
    build: {
      lib: {
        entry: resolve(__dirname, "lib.ts"),
        formats: ["es"],
        fileName: "sketches",
      },
    },
  }
})
