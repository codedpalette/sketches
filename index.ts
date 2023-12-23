import { defaultSizeOptions, Sketch } from "library/core/sketch"
import { initUI } from "library/core/ui"
import shade from "sketches/2023/shade"

const sketch = new Sketch(shade)
const ui = initUI(defaultSizeOptions, sketch)
sketch.run(ui)
