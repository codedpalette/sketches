import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { externalizeDeps } from "vite-plugin-externalize-deps"
import glsl from "vite-plugin-glsl"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    plugins: [dts({ rollupTypes: true }), externalizeDeps(), glsl({ root: "/library/glsl" }), tsconfigPaths()],
  }
})
