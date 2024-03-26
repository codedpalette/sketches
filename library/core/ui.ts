import { CanvasCapture } from "canvas-capture"
import { clamp } from "library/utils"
import { Spector } from "spectorjs"
import Stats from "stats.js"

import { SketchLike } from "./sketch"
import { SizeParams, UI } from "./types"

const minWidth = 100
const minHeight = 100

/**
 * Initializes UI element for capturing canvas to file, profiling WebGL commands and resizing canvas
 * @param sketch {@link Sketch} instance to resize
 * @param defaultParams default {@link SizeParams} to fallback to
 * @returns object holding references to ui elements
 */
export function initUI(sketch: SketchLike<HTMLCanvasElement>, defaultParams: Required<SizeParams>): UI {
  const canvas = sketch.canvas
  initCanvasCapture(canvas)
  initSpector(canvas)
  initResizeUI(sketch, defaultParams)

  const stats = new Stats()
  document.body.appendChild(stats.dom)
  return { stats, capture: CanvasCapture }
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
 * @param sketch {@link Sketch} instance to resize
 * @param defaultParams default {@link SizeParams} to fallback to
 */
function initResizeUI(sketch: SketchLike<HTMLCanvasElement>, defaultParams: Required<SizeParams>) {
  const resizeForm = document.createElement("form")
  const getParam = (paramKey: string) => parseInt((<HTMLInputElement>document.getElementById(paramKey)).value) || 0

  const inputHandler = () => {
    const newOptions = {
      width: clamp(getParam("width"), minWidth, defaultParams.width),
      height: clamp(getParam("height"), minHeight, defaultParams.height),
      resolution: Math.max(getParam("resolution"), defaultParams.resolution),
    }
    sketch.resize(newOptions)
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
