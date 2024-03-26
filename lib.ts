import { SketchConstructor, SketchLike } from "library/core/sketch"
import { SketchType } from "library/core/types"

export { SketchRenderer } from "library/core/renderer"
export { SketchRunner } from "library/core/runner"
export type { ISketch as Sketch } from "library/core/sketch"
export * from "library/core/types"

/** Sketch module definition */
export type SketchModule = {
  /** Artwork title */
  name: string
  /** Artwork year (specifies folder to load sketch from) */
  year: number
}

type SketchModuleImpl<T extends SketchType> = {
  default: SketchConstructor<T>
}

// Only finished artworks here
export const sketches = [
  { name: "fireworks", year: 2023 },
  { name: "kiss", year: 2023 },
  { name: "shade", year: 2023 },
  { name: "whirlwind", year: 2022 },
  { name: "waves", year: 2022 },
  { name: "trees", year: 2022 },
  { name: "stars", year: 2022 },
  { name: "squares", year: 2022 },
  { name: "shards", year: 2022 },
  { name: "radiance", year: 2022 },
  { name: "pillars", year: 2022 },
  { name: "curves", year: 2022 },
  { name: "colonize", year: 2022 },
]

/**
 * Dynamically load sketch module
 * @param module {@link SketchModule} definition
 * @returns promise with loaded sketch factory function
 */
export async function loadModule<T extends SketchType>(module: SketchModule): Promise<SketchConstructor<T>> {
  const { default: sketch } = (await import(`./sketches/${module.year}/${module.name}.ts`)) as SketchModuleImpl<T>
  return sketch
}

/**
 * "Screensaver" sketch for website's main page background. Exported separately to not include it in the gallery.
 * @param canvas canvas to render on
 * @returns promise with loaded sketch factory function
 */
export async function screensaver(canvas: HTMLCanvasElement): Promise<SketchLike<HTMLCanvasElement>> {
  const screensaverModule = await import("./sketches/2024/screensaver")
  return screensaverModule.default(canvas)
}
