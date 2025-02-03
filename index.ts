import { Box } from "@flatten-js/core"
import { Random } from "library/core/random"
import { initRenderer } from "library/core/v2/renderer"
import { Runner } from "library/core/v2/runner"
import { PixiSketch, SketchContext } from "library/core/v2/sketch"
import { drawBackground } from "library/drawing/helpers"
import { Container, Graphics, WebGLRenderer } from "pixi.js"

function sketch({ random, bbox }: SketchContext) {
  const container = new Container()
  container.addChild(drawBackground("white", bbox))
  container
    .addChild(new Graphics())
    .rect(-bbox.width / 4, -bbox.height / 4, bbox.width / 2, bbox.height / 2)
    .fill({ color: random.color() })
  return { container }
}

const sizeParams = { width: 1250, height: 1250 }
const pixiSketch = new PixiSketch(sketch, sizeParams)
const canvas = document.createElement("canvas")
const renderer = await initRenderer(canvas)
const runner = new Runner(renderer)
document.body.appendChild(canvas)
runner.start(pixiSketch)
