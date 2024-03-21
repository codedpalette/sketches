import { SketchRenderer } from "library/core/renderer"
import { SketchRunner } from "library/core/runner"
import { Sketch } from "library/core/sketch"
import { initUI } from "library/core/ui"
import factory from "sketches/2023/shade"

const defaultSizeParams = { resolution: 1, width: 1250, height: 1250 }
const renderer = await SketchRenderer.init()
renderer.renderer.resize(defaultSizeParams.width, defaultSizeParams.height)
const sketch = new Sketch(factory, renderer, defaultSizeParams)
const ui = initUI(sketch, defaultSizeParams)
const runner = new SketchRunner(sketch, {}, ui)
document.body.appendChild(renderer.canvas)
runner.start()
