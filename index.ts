import { defaultSizeOptions, Sketch } from "library/core/sketch"
import { initUI } from "library/core/ui"
import factory from "sketches/2023/fireworks"

const sketch = new Sketch(factory)
const ui = initUI(defaultSizeOptions, sketch)
sketch.run(ui)
