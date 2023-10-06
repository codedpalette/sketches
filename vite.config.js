import { defineConfig } from "vite"
import { startup as electronStartup } from "vite-plugin-electron"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(async () => {
  const glsl = (await import("vite-plugin-glsl")).default // https://github.com/UstymUkhman/vite-plugin-glsl/issues/16
  return {
    plugins: [
      glsl(),
      nodePolyfills(),
      tsconfigPaths(),
      // https://github.com/electron-vite/vite-plugin-electron/blob/main/src/index.ts
      {
        name: "start-electron",
        apply: "serve",
        configureServer(server) {
          server.httpServer.once("listening", () => {
            process.env.VITE_DEV_SERVER_URL = `http://localhost:${server.httpServer.address().port}`
            electronStartup()
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
