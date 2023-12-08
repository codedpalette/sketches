import { isProd, run, SketchFactory } from "core/sketch"

type SketchModule = {
  name: string
  dir: string
}

const modules: SketchModule[] = [
  { name: "shards", dir: "2022" },
  { name: "colonize", dir: "2022" },
  { name: "pillars", dir: "2022" },
  { name: "radiance", dir: "2022" },
  { name: "squares", dir: "2022" },
  { name: "stars", dir: "2022" },
  { name: "trees", dir: "2022" },
  { name: "waves", dir: "2022" },
  { name: "whirlwind", dir: "2022" },
  { name: "fireworks", dir: "2023" },
  { name: "kiss", dir: "2023" },
  { name: "shade", dir: "2023" },
]

const baseGithubUrl = "https://github.com/monkeyroar/sketches/blob/master/sketches/"

function resolveGithubUrl(module: SketchModule) {
  return new URL(`./${module.dir}/${module.name}.ts`, baseGithubUrl).href
}

async function importModule(module: SketchModule) {
  const { sketch } = (await import(`./${module.dir}/${module.name}.ts`)) as { sketch: SketchFactory }
  return sketch
}

async function runAll() {
  const container = document.createElement("div")
  container.id = "canvas-container"
  const canvas = document.createElement("canvas")
  container.appendChild(canvas)

  // Shuffle modules array
  modules.sort(() => Math.random() - 0.5)
  let currentModule = modules[0]

  // Create sketch selector
  const select = document.createElement("select")
  for (const [i, module] of modules.entries()) {
    const option = document.createElement("option")
    option.value = i.toString()
    option.text = module.name
    select.appendChild(option)
  }
  select.onchange = async () => {
    loop.stop()
    currentModule = modules[+select.value]
    link.href = resolveGithubUrl(currentModule)
    const sketch = await importModule(currentModule)
    loop = run(sketch, canvas)
  }
  document.body.appendChild(select)

  const p = document.createElement("p")
  p.textContent = "Click on canvas to regenerate ⸱ "
  container.appendChild(p)

  const link = document.createElement("a")
  link.href = resolveGithubUrl(currentModule)
  link.textContent = "Link to sources"
  p.appendChild(link)

  const sketch = await importModule(currentModule)
  let loop = run(sketch, canvas)
}

if (isProd()) {
  void runAll()
} else {
  const { sketch } = await import("./2022/shards")
  run(sketch)
}
