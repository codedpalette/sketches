import { CanvasCapture } from "canvas-capture"
import { Application, Container, Renderer } from "pixi.js"
import { MersenneTwister19937 } from "random-js"
import { Spector } from "spectorjs"
import Stats from "stats.js"
import { Random } from "utils/random"

export interface SketchParams {
  width: number
  height: number
  resolution: number
}

export interface SketchEnv {
  renderer: Renderer
  random: Random
  params: SketchParams
}

export type SketchFactory = (env: SketchEnv) => Container

export function run(sketchFactory: SketchFactory) {
  const params = defaultParams
  const canvas = document.createElement("canvas")
  resizeCanvas(params, canvas)
  document.body.appendChild(canvas)

  const app = initApplication(params, canvas)
  const renderer = app.renderer as Renderer
  const stats = process.env.NODE_ENV !== "production" ? initUI(params, canvas, app) : undefined
  const random = new Random(MersenneTwister19937.autoSeed()) // TODO: Replay random values
  app.stage.setTransform(params.width / 2, params.height / 2, 1, -1) //TODO: Local coordinates in [-1, 1]
  app.stage.addChild(sketchFactory({ renderer, random, params }))

  const resetClock = renderLoop(renderer, app.stage, stats)
  canvas.onclick = () => {
    const children = app.stage.removeChildren()
    children.forEach((obj) => obj.destroy(true))
    app.stage.addChild(sketchFactory({ renderer, random, params }))
    resetClock()
  }
}

function renderLoop(renderer: Renderer, container: Container, stats?: Stats) {
  let [startTime, prevTime, frameRecordCounter] = [0, 0, 0]
  const loop = (timestamp: number) => {
    stats?.begin()

    !startTime && (startTime = timestamp)
    const _totalSeconds = (timestamp - startTime) / 1000
    const _deltaSeconds = (timestamp - (prevTime || startTime)) / 1000
    prevTime = timestamp

    renderer.render(container)
    CanvasCapture.checkHotkeys()
    if (CanvasCapture.isRecording()) {
      CanvasCapture.recordFrame()
      frameRecordCounter++
      if (frameRecordCounter % recordingFPS == 0) console.log(`Recorded ${frameRecordCounter / recordingFPS} seconds`)
    } else if (frameRecordCounter != 0) frameRecordCounter == 0

    stats?.end()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  const resetClock = () => (startTime = prevTime = 0)
  return resetClock
}

function resizeCanvas(params: SketchParams, canvas: HTMLCanvasElement) {
  canvas.width = params.width * params.resolution
  canvas.height = params.height * params.resolution
  canvas.style.width = `${params.width}px`
  canvas.style.height = `${params.height}px`
}

function initUI(params: SketchParams, canvas: HTMLCanvasElement, app: Application) {
  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${Math.round(progress * 100)}%...`),
  })

  const spector = new Spector()
  addEventListener("keydown", (e) => e.key == "r" && spector.captureNextFrame(canvas))
  spector.onCapture.add((capture) => {
    const resultView = spector.getResultUI()
    resultView.display()
    resultView.addCapture(capture)
  })

  const resizeForm = document.createElement("form")
  resizeForm.style.textAlign = "right"
  const inputHandler = () => {
    const newParams = {
      width: parseInt((<HTMLInputElement>document.getElementById("width")).value),
      height: parseInt((<HTMLInputElement>document.getElementById("height")).value),
      resolution: parseInt((<HTMLInputElement>document.getElementById("resolution")).value) || 1,
    }
    app.renderer.resize(newParams.width, newParams.height)
    app.renderer.resolution = newParams.resolution
    app.stage.position = { x: newParams.width / 2, y: newParams.height / 2 }
    // TODO: Resize sketch
    resizeCanvas(newParams, canvas)
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

  const stats = new Stats()
  document.body.appendChild(stats.dom)
  return stats
}

function initApplication(params: SketchParams, canvas: HTMLCanvasElement): Application {
  return new Application({ ...params, antialias: true, view: canvas })
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

const recordingFPS = 60
const defaultParams = { resolution: 1, width: 1262, height: 1262 }
