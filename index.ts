import { init } from "library/core/renderer"
import { SketchRunner } from "library/core/runner"
import { initUI } from "library/core/ui"
import constructor from "sketches/2024/rectangles"

const defaultSizeParams = { resolution: 1, width: 1250, height: 1250 }
const renderer = await init<HTMLCanvasElement>()
document.body.appendChild(renderer.canvas)
const sketch = constructor(renderer, defaultSizeParams)
const ui = initUI(sketch, defaultSizeParams)
const runner = new SketchRunner(sketch, { ui })
runner.start()
