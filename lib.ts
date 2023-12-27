import { SketchFactory } from "library/core/types"

export { Sketch } from "library/core/sketch"
export * from "library/core/types"
export type SketchModule = {
  name: string
  year: number
  sketch?: SketchFactory
}

// Only finished artworks here
const modules = [
  { name: "colonize", year: 2022 },
  { name: "curves", year: 2022 },
  { name: "pillars", year: 2022 },
  { name: "radiance", year: 2022 },
  { name: "shards", year: 2022 },
  { name: "squares", year: 2022 },
  { name: "stars", year: 2022 },
  { name: "trees", year: 2022 },
  { name: "waves", year: 2022 },
  { name: "whirlwind", year: 2022 },
  { name: "fireworks", year: 2023 },
  { name: "kiss", year: 2023 },
  { name: "shade", year: 2023 },
]

async function loadModule(module: SketchModule): Promise<Required<SketchModule>> {
  const { default: sketch } = (await import(`./sketches/${module.year}/${module.name}.ts`)) as {
    default: SketchFactory
  }
  return { ...module, sketch }
}

export const sketches = Promise.all(modules.map((module) => loadModule(module)))
