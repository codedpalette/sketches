import { CanvasCapture } from "canvas-capture"
import { ResizeOptions, Sketch } from "library/core/sketch"
import { clamp } from "library/utils"
import { Spector } from "spectorjs"
import Stats from "stats.js"

const minWidth = 800
const minHeight = 800

export type UI = {
  stats: Stats
  capture: typeof CanvasCapture
}

/**
 * Initializes UI element for capturing canvas to file, profiling WebGL commands and resizing canvas
 * @param defaultOptions default {@link ResizeOptions} to fallback to
 * @param sketch {@link Sketch} instance to resize
 * @returns {UI}
 */
export function initUI(defaultOptions: ResizeOptions, sketch: Sketch): UI {
  const canvas = sketch.canvas
  initCanvasCapture(canvas)
  initSpector(canvas)
  initResizeUI(defaultOptions, sketch)

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
 * @param defaultOptions default {@link ResizeOptions} to fallback to
 * @param sketch {@link Sketch} instance to resize
 */
function initResizeUI(defaultOptions: ResizeOptions, sketch: Sketch) {
  const resizeForm = document.createElement("form")
  const getParam = (paramKey: string) => parseInt((<HTMLInputElement>document.getElementById(paramKey)).value) || 0

  const inputHandler = () => {
    const newOptions = {
      width: clamp(getParam("width"), minWidth, defaultOptions.width),
      height: clamp(getParam("height"), minHeight, defaultOptions.height),
      resolution: Math.max(getParam("resolution"), 1),
    }
    sketch.resize(newOptions)
  }

  for (const [key, value] of Object.entries(defaultOptions)) {
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
