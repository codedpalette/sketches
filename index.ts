import { init } from "library/core/renderer"
import { SketchRunner } from "library/core/runner"
import { initUI } from "library/core/ui"
import constructor from "sketches/2024/dithersort"

const defaultSizeParams = { resolution: 1, width: 1080, height: 1080 }
const renderer = await init<HTMLCanvasElement>()
document.body.appendChild(renderer.canvas)
const sketch = constructor(renderer, defaultSizeParams)
const ui = initUI(sketch, defaultSizeParams)
const runner = new SketchRunner(sketch, { ui })
runner.start()
