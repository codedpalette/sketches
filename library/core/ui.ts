import { CanvasCapture } from "canvas-capture"
import { SketchParams } from "core/sketch"
import { Renderer } from "pixi.js"
import { Spector } from "spectorjs"
import Stats from "stats.js"
import { MathUtils } from "threejs-math"

const minWidth = 800
const minHeight = 800

export function initUI(params: SketchParams, renderer: Renderer, resizeSketch: () => void) {
  const canvas = renderer.view as HTMLCanvasElement
  initCanvasCapture(canvas)
  initSpector(canvas)
  initResizeUI(params, renderer, resizeSketch)

  const stats = new Stats()
  document.body.appendChild(stats.dom)
  return stats
}

function initCanvasCapture(canvas: HTMLCanvasElement) {
  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${Math.round(progress * 100)}%...`),
  })
}

function initSpector(canvas: HTMLCanvasElement) {
  const spector = new Spector()
  addEventListener("keydown", (e) => e.key == "r" && spector.captureNextFrame(canvas))
  spector.onCapture.add((capture) => {
    const resultView = spector.getResultUI()
    resultView.display()
    resultView.addCapture(capture)
  })
}

function initResizeUI(params: SketchParams, renderer: Renderer, resizeSketch: () => void) {
  const resizeForm = document.createElement("form")
  const getParam = (paramKey: string) => parseInt((<HTMLInputElement>document.getElementById(paramKey)).value) || 0

  const inputHandler = () => {
    const newParams = {
      width: MathUtils.clamp(getParam("width"), minWidth, params.width),
      height: MathUtils.clamp(getParam("height"), minHeight, params.height),
      resolution: Math.max(getParam("resolution"), 1),
    }
    renderer.resolution = newParams.resolution
    renderer.resize(newParams.width, newParams.height)

    const drawBufferWidth = renderer.gl.drawingBufferWidth
    const drawBufferHeight = renderer.gl.drawingBufferHeight
    if (renderer.width > drawBufferWidth || renderer.height > drawBufferHeight) {
      renderer.resolution = 1
      renderer.resize(newParams.width, newParams.height)
    }
    resizeSketch()
  }

  for (const [key, value] of Object.entries(params)) {
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

// https://stackoverflow.com/a/469362
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
