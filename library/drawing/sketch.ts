import { CanvasCapture } from "canvas-capture"
import { Container, Renderer } from "pixi.js"
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

export function run(sketchFactory: SketchFactory, paramsOverrides?: Partial<SketchParams>) {
  const stats = process.env.NODE_ENV !== "production" ? new Stats() : undefined
  const spector = process.env.NODE_ENV !== "production" ? new Spector() : undefined
  stats && document.body.appendChild(stats.dom)

  const params = { ...defaultParams, ...paramsOverrides }
  const canvas = initCanvas(params)
  const renderer = initRenderer(canvas, params)
  const random = new Random(MersenneTwister19937.autoSeed())
  const stage = new Container().setTransform(params.width / 2, params.height / 2, 1, -1) //TODO: Local coordinates in [-1, 1]
  stage.addChild(sketchFactory({ renderer, random, params }))

  const resetClock = renderLoop(renderer, stage, stats)
  canvas.onclick = () => {
    const children = stage.removeChildren()
    children.forEach((obj) => obj.destroy(true))
    stage.addChild(sketchFactory({ renderer, random, params }))
    resetClock()
  }

  if (spector) {
    addEventListener("keydown", (e) => e.key == "r" && spector.captureNextFrame(canvas))
    spector?.onCapture.add((capture) => {
      const resultView = spector?.getResultUI()
      resultView.display()
      resultView.addCapture(capture)
    })
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

function initCanvas(params: SketchParams): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = params.width * params.resolution
  canvas.height = params.height * params.resolution
  canvas.style.width = `${params.width}px`
  canvas.style.height = `${params.height}px`
  document.body.appendChild(canvas)

  CanvasCapture.init(canvas, { showRecDot: true })
  CanvasCapture.bindKeyToPNGSnapshot("p")
  CanvasCapture.bindKeyToVideoRecord("v", {
    onExportProgress: (progress) => console.log(`Processing recording, ${Math.round(progress * 100)}%...`),
  })
  return canvas
}

function initRenderer(canvas: HTMLCanvasElement, params: SketchParams): Renderer {
  return new Renderer({
    ...params,
    antialias: true,
    preserveDrawingBuffer: true,
    background: "white",
    view: canvas,
  })
}

const recordingFPS = 60
const defaultParams = { resolution: 1, width: 1292, height: 1292 }
