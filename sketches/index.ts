import { isProd, run, SketchFactory } from "core/sketch"

type SketchModule = {
  name: string
  relativePath: string
}

const modules: SketchModule[] = [
  { name: "colonize", relativePath: "./2022/colonize" },
  { name: "pillars", relativePath: "./2022/pillars" },
  { name: "radiance", relativePath: "./2022/radiance" },
  { name: "squares", relativePath: "./2022/squares" },
  { name: "stars", relativePath: "./2022/stars" },
  { name: "trees", relativePath: "./2022/trees" },
  { name: "waves", relativePath: "./2022/waves" },
  { name: "whirlwind", relativePath: "./2022/whirlwind" },
  { name: "fireworks", relativePath: "./2023/fireworks" },
  { name: "kiss", relativePath: "./2023/kiss" },
  { name: "shade", relativePath: "./2023/shade" },
]

const baseGithubUrl = "https://github.com/monkeyroar/sketches/blob/master/sketches/"

function resolveGithubUrl(module: SketchModule) {
  return new URL(`${module.relativePath}.ts`, baseGithubUrl).href
}

async function runSingle(module: SketchModule, canvas?: HTMLCanvasElement) {
  const { sketch } = (await import(module.relativePath)) as { sketch: SketchFactory }
  run(sketch, canvas)
}

function runAll() {
  const canvas = document.createElement("canvas")
  document.body.appendChild(canvas)

  // Shuffle modules array
  modules.sort(() => Math.random() - 0.5)

  // Create sketch selector
  const select = document.createElement("select")
  for (const [i, module] of modules.entries()) {
    const option = document.createElement("option")
    option.value = i.toString()
    option.text = module.name
    select.appendChild(option)
  }
  select.onchange = () => {
    // const canvas = document.getElementsByTagName("canvas")
    // for (let index = canvas.length - 1; index >= 0; index--) {
    //   canvas[index].parentNode?.removeChild(canvas[index])
    // }
    // void runSingle(modules[+select.value])
    const currentModule = modules[+select.value]
    console.log(resolveGithubUrl(currentModule))
    void runSingle(currentModule, canvas)
  }
  document.body.appendChild(select)
  // TODO: Add title and link to github

  void runSingle(modules[0], canvas)
}

if (isProd()) {
  runAll()
} else {
  const currentSketch = modules[0] // Change this when developing new sketches
  void runSingle(currentSketch)
}
