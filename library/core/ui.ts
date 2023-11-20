import { CanvasCapture } from "canvas-capture"
import { SketchParams } from "core/sketch"
import { Renderer } from "pixi.js"
import { Spector } from "spectorjs"
import Stats from "stats.js"
import { clamp } from "utils"

const minWidth = 800
const minHeight = 800

/**
 * Initializes UI element for capturing canvas to file, profiling WebGL commands and resizing canvas
 * @param defaultParams default {@link SketchParams} to fallback to
 * @param renderer Pixi.js WebGL renderer
 * @param resizeSketch Sketch resize callback
 * @returns {Stats} {@link https://github.com/mrdoob/stats.js Stats.js} object
 */
export function initUI(defaultParams: SketchParams, renderer: Renderer, resizeSketch: () => void): Stats {
  const canvas = renderer.view as HTMLCanvasElement
  initCanvasCapture(canvas)
  initSpector(canvas)
  initResizeUI(defaultParams, renderer, resizeSketch)

  const stats = new Stats()
  document.body.appendChild(stats.dom)
  return stats
}

/**
 * Initialize canvas recording. See {@link https://github.com/amandaghassaei/canvas-capture} for more details
 * @param canvas Canvas element displaying sketch contents
 */
function initCanvasCapture(canvas: HTMLCanvasElement) {
  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${Math.round(progress * 100)}%...`),
  })
}

/**
 * Initialize WebGL profiling. See {@link https://github.com/BabylonJS/Spector.js} for more details
 * @param canvas Canvas element displaying sketch contents
 */
function initSpector(canvas: HTMLCanvasElement) {
  const spector = new Spector()
  addEventListener("keydown", (e) => e.key == "r" && spector.captureNextFrame(canvas))
  spector.onCapture.add((capture) => {
    const resultView = spector.getResultUI()
    resultView.display()
    resultView.addCapture(capture)
  })
}

/**
 * Initialize UI for canvas resize
 * @param defaultParams default {@link SketchParams} to fallback to
 * @param renderer Pixi.js WebGL renderer
 * @param resizeSketch Sketch resize callback
 */
function initResizeUI(defaultParams: SketchParams, renderer: Renderer, resizeSketch: () => void) {
  const resizeForm = document.createElement("form")
  const getParam = (paramKey: string) => parseInt((<HTMLInputElement>document.getElementById(paramKey)).value) || 0

  const inputHandler = () => {
    const newParams = {
      width: clamp(getParam("width"), minWidth, defaultParams.width),
      height: clamp(getParam("height"), minHeight, defaultParams.height),
      resolution: Math.max(getParam("resolution"), 1),
    }
    renderer.resolution = newParams.resolution
    renderer.resize(newParams.width, newParams.height)

    // Some browsers have limits for WebGL drawbuffer dimensions. If we set renderer resolution too high,
    // it may cause actual drawbuffer dimensions to be higher than these limits. In order to check for this
    // we compare requested renderer dimensions to actual drawbuffer dimensions, and if they're higher,
    // reset resolution to 1. See for example https://github.com/mrdoob/three.js/issues/5917 for more details.
    const drawBufferWidth = renderer.gl.drawingBufferWidth
    const drawBufferHeight = renderer.gl.drawingBufferHeight
    if (renderer.width > drawBufferWidth || renderer.height > drawBufferHeight) {
      renderer.resolution = 1
      renderer.resize(newParams.width, newParams.height)
    }
    resizeSketch()
  }

  for (const [key, value] of Object.entries(defaultParams)) {
    const labelElement = document.createElement("label")
    labelElement.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}:`

    const inputElement = document.createElement("input")
    inputElement.id = key
    inputElement.type = "text"
    inputElement.value = `${value}`
    setInputFilter(inputElement, (val) => /^\d*$/.test(val))
    inputElement.addEventListener("input", inputHandler)

    resizeForm.appendChild(labelElement)
    resizeForm.appendChild(inputElement)
    resizeForm.appendChild(document.createElement("br"))
  }
  document.body.appendChild(resizeForm)
}

/**
 * Set custom predicate as an input field filter.
 * Taken from {@link https://stackoverflow.com/a/469362 this StackOverflow answer}
 * @param textBox input element to filter
 * @param inputFilter predicate to validate input
 */
function setInputFilter(textBox: Element, inputFilter: (value: string) => boolean): void {
  const events = ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop", "focusout"]
  events.forEach((event) => {
    textBox.addEventListener(
      event,
      function (
        this: (HTMLInputElement | HTMLTextAreaElement) & {
          oldValue: string
          oldSelectionStart: number | null
          oldSelectionEnd: number | null
        }
      ) {
        if (inputFilter(this.value)) {
          this.oldValue = this.value
          this.oldSelectionStart = this.selectionStart
          this.oldSelectionEnd = this.selectionEnd
        } else if (Object.prototype.hasOwnProperty.call(this, "oldValue")) {
          this.value = this.oldValue

          if (this.oldSelectionStart !== null && this.oldSelectionEnd !== null) {
            this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd)
          }
        } else {
          this.value = ""
        }
      }
    )
  })
}
