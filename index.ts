import { init } from "library/core/renderer"
import { SketchRunner } from "library/core/runner"
import { initUI } from "library/core/ui"
import constructor from "sketches/2025/wind"

const defaultSizeParams = { resolution: 1, width: 1250, height: 1250 }
const renderer = await init<HTMLCanvasElement>()
const sketch = constructor(renderer, defaultSizeParams)
document.body.appendChild(sketch.canvas)

const ui = initUI(sketch, defaultSizeParams)
const runner = new SketchRunner(sketch, { ui })
runner.start()
